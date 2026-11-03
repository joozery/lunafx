// Pure sender-name check for bank slips (no I/O) so it can be unit-tested.
//
// Slips show the sender as "<title> <first name> <start of surname>", e.g. "นางสาว ลลิตา ต."
// or "SAIJAI CHUEAW": the surname is cut to a few letters. So the first name has to match
// exactly and the surname only has to start with what the slip shows.

export type SlipNameResult = "match" | "mismatch" | "unknown";

const THAI = /[฀-๿]/;
const TITLES = [
  // longest first so "นางสาว" isn't read as "นาง" + "สาว..."
  "นางสาว", "น.ส.", "นส.", "ด.ช.", "ด.ญ.", "นาง", "นาย", "ดร.", "คุณ",
  "MISS", "MRS.", "MRS", "MR.", "MR", "MS.", "MS", "DR.", "DR",
];

function stripTitle(s: string): string {
  const up = s.toUpperCase();
  for (const t of TITLES) {
    if (up.startsWith(t)) {
      const rest = s.slice(t.length);
      // Latin titles must be a whole word ("MRSOMCHAI" isn't "MR" + "SOMCHAI"; Thai titles are written joined)
      if (!THAI.test(t) && rest && !/^[\s.]/.test(rest)) continue;
      return rest.trim();
    }
  }
  return s.trim();
}

const clean = (s: string) => s.toUpperCase().replace(/[.\-_,()]/g, " ").replace(/\s+/g, " ").trim();

/** Compare the sender name on a slip with the customer's registered name. */
export function slipNameCheck(slipName: unknown, firstName: unknown, lastName: unknown): SlipNameResult {
  const slip = clean(stripTitle(String(slipName ?? "").trim()));
  const first = clean(stripTitle(String(firstName ?? "")));
  const last = clean(String(lastName ?? ""));
  if (!slip || !first) return "unknown";

  // Thai on one side and Latin on the other can't be compared letter by letter
  if (THAI.test(slip) !== THAI.test(first)) return "unknown";

  const [slipFirst, ...slipRest] = slip.split(" ");
  const userTokens = `${first} ${last}`.trim().split(" ");
  const [userFirst, ...userRest] = userTokens;
  if (slipFirst !== userFirst) return "mismatch";

  const slipSurname = slipRest.join("");
  const userSurname = userRest.join("");
  if (!slipSurname || !userSurname) return "match"; // nothing more to compare
  return userSurname.startsWith(slipSurname) ? "match" : "mismatch";
}
