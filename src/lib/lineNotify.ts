import "server-only";

/**
 * Push a text message to the admin LINE group/user through the LINE Messaging API
 * (LINE Notify was discontinued in 2025). Needs, in .env.local:
 *   LINE_CHANNEL_ACCESS_TOKEN — long-lived token of the LINE Official Account's Messaging API channel
 *   LINE_NOTIFY_TO            — userId / groupId to send to (comma-separated for several)
 * Never throws: a failed notification must not break signup or deposits.
 */
export async function notifyAdmins(text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const targets = (process.env.LINE_NOTIFY_TO ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  if (!token || targets.length === 0) return;

  await Promise.all(targets.map(async (to) => {
    try {
      const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, messages: [{ type: "text", text: text.slice(0, 5000) }] }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) console.warn(`[line] push to ${to.slice(0, 6)}… failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    } catch (e) {
      console.warn("[line] push failed:", e instanceof Error ? e.message : e);
    }
  }));
}

export const thaiTime = () => new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" });
