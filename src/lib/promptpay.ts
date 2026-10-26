// PromptPay QR payload (EMVCo merchant-presented, Thai QR standard)

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

// CRC-16/CCITT-FALSE
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Accepts a mobile number (10 digits), national/tax ID (13 digits) or e-wallet ID (15 digits). */
export function isValidPromptPayId(id: string): boolean {
  const digits = id.replace(/[^0-9]/g, "");
  // Thai mobiles start with 06/08/09 — this also rejects 10-digit bank account numbers,
  // which would otherwise be encoded as a non-existent phone number
  if (digits.length === 10) return /^0[689]/.test(digits);
  return digits.length === 13 || digits.length === 15;
}

export function buildPromptPayPayload(id: string, amount?: number): string {
  const digits = id.replace(/[^0-9]/g, "");

  let target: string;
  if (digits.length === 10) {
    // mobile: 0812345678 → 0066812345678
    target = tlv("01", "0066" + digits.slice(1));
  } else if (digits.length === 13) {
    target = tlv("02", digits);
  } else if (digits.length === 15) {
    target = tlv("03", digits);
  } else {
    throw new Error("Invalid PromptPay ID");
  }

  const hasAmount = amount !== undefined && amount > 0;
  const body =
    tlv("00", "01") +
    tlv("01", hasAmount ? "12" : "11") + // 12 = one-time (dynamic), 11 = reusable (static)
    tlv("29", tlv("00", "A000000677010111") + target) +
    tlv("53", "764") + // THB
    (hasAmount ? tlv("54", amount!.toFixed(2)) : "") +
    tlv("58", "TH") +
    "6304";

  return body + crc16(body);
}
