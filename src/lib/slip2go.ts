import "server-only";

const ENDPOINT = "https://connect.slip2go.com/api/verify-slip/qr-image/info";

// Map our bank codes → Slip2Go accountType codes (BOT standard)
const BANK_TO_SLIP2GO: Record<string, string> = {
  BBL:      "01002",
  KBANK:    "01004",
  KTB:      "01006",
  TTB:      "01011",
  SCB:      "01014",
  CIMB:     "01022",
  UOB:      "01024",
  BAY:      "01025",
  GSB:      "01030",
  BAAC:     "01034",
  KKP:      "01069",
  TISCO:    "01067",
  LHB:      "01073",
  PROMPTPAY:"02001",
};

export interface Slip2GoReceiver {
  accountType: string;
  accountNameTH?: string;
  accountNameEN?: string;
  accountNumber?: string;
}

export interface Slip2GoConditions {
  checkDuplicate?: boolean;
  checkReceiver?: Slip2GoReceiver[];
  checkAmount?: { type: "eq" | "lte" | "gte"; amount: string };
}

export interface Slip2GoData {
  referenceId: string;
  decode: string;
  transRef: string;
  dateTime: string;
  amount: number;
  ref1: string | null;
  ref2: string | null;
  ref3: string | null;
  receiver?: {
    account?: {
      name?: string;
      bank?: { account?: string | null };
      proxy?: { type?: string | null; account?: string | null } | null;
    };
    bank?: { id?: string; name?: string | null };
  };
  sender?: {
    account?: {
      name?: string;
      bank?: { account?: string };
    };
    bank?: { id?: string; name?: string | null };
  };
}

export type Slip2GoStatus =
  | "verified"        // 200000 / 200200 — slip OK, conditions met
  | "duplicate"       // 200501 — already used
  | "fake"            // 200500 — damaged / fraudulent
  | "amount_mismatch" // 200402 — amount doesn't match
  | "receiver_mismatch" // 200401 — wrong receiver
  | "not_found"       // 200404 — not in banking system
  | "bank_error"      // 200502 / 500500 — bank system error
  | "api_error"       // 400xxx — bad request
  | "auth_error"      // 401xxx — key expired / no credit
  | "unavailable";    // network error / no API key configured

export interface Slip2GoResult {
  status: Slip2GoStatus;
  code?: string;
  message?: string;
  data?: Slip2GoData;
}

function formatAmount(thb: number): string {
  // Slip2Go: no trailing zeros, no commas
  const s = thb.toString();
  if (s.includes(".")) {
    return s.replace(/\.?0+$/, "") || s;
  }
  return s;
}

export function getBankAccountType(bankCode: string): string | undefined {
  return BANK_TO_SLIP2GO[bankCode.toUpperCase()];
}

export async function verifySlipImage(
  imageBuffer: Buffer,
  mimeType: string,
  fileName: string,
  conditions: Slip2GoConditions
): Promise<Slip2GoResult> {
  const secret = process.env.SLIP2GO_SECRET;

  if (!secret) {
    console.warn("[slip2go] SLIP2GO_SECRET not configured — skipping verification");
    return { status: "unavailable", message: "Slip2Go not configured" };
  }

  try {
    const form = new FormData();

    // Append slip image
    const ab = imageBuffer.buffer instanceof SharedArrayBuffer
      ? new Uint8Array(imageBuffer).buffer
      : imageBuffer.buffer;
    const blob = new Blob([ab.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength)], { type: mimeType });
    form.append("file", blob, fileName);

    // Append payload JSON if any conditions are set
    const hasConditions =
      conditions.checkDuplicate !== undefined ||
      (conditions.checkReceiver?.length ?? 0) > 0 ||
      conditions.checkAmount !== undefined;

    if (hasConditions) {
      form.append("payload", JSON.stringify(conditions));
    }

    const authHeader = secret.startsWith("Bearer ") ? secret : `Bearer ${secret}`;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: form,
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    // Catch HTTP-level errors (404 = wrong endpoint URL, 5xx = server down, 401 = unauthorized)
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[slip2go] HTTP ${res.status} — error. URL: ${ENDPOINT}\n${text.slice(0, 200)}`);
      return { status: res.status === 401 ? "auth_error" : "unavailable", code: String(res.status), message: `HTTP ${res.status}` };
    }

    const rawJson = await res.json();
    // code can be string ("200000") or number (HTTP error code) — always normalise to string
    const code = rawJson.code !== undefined ? String(rawJson.code) : "";
    const message = String(rawJson.message ?? "");

    console.log(`[slip2go] code=${code} message=${message}`);

    if (code === "200000" || code === "200200") return { status: "verified",          code, message, data: rawJson.data };
    if (code === "200501")                       return { status: "duplicate",         code, message, data: rawJson.data };
    if (code === "200500")                       return { status: "fake",              code, message };
    if (code === "200402")                       return { status: "amount_mismatch",   code, message, data: rawJson.data };
    if (code === "200401")                       return { status: "receiver_mismatch", code, message, data: rawJson.data };
    if (code === "200404")                       return { status: "not_found",         code, message };
    if (code === "200502" || code === "500500")  return { status: "bank_error",        code, message };
    if (code.startsWith("401"))                  return { status: "auth_error",        code, message };
    if (code.startsWith("400"))                  return { status: "api_error",         code, message };

    return { status: "unavailable", code, message };
  } catch (err) {
    console.error("[slip2go] request failed:", err);
    return { status: "unavailable", message: "Slip2Go unreachable" };
  }
}
