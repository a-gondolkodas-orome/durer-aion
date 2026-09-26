// The login code team_import.ts generates: ten digits, grouped 3-4-3.
const GROUPS = [3, 4, 3];

/**
 * What the login field shows for whatever was typed or pasted into it: the
 * digits only, cut at ten, with a dash before each group that has begun. No
 * trailing dash, so a backspace always removes a digit.
 */
export function formatJoinCode(input: string): string {
  let digits = input.replace(/\D/g, "");
  const groups: string[] = [];
  for (const size of GROUPS) {
    if (!digits) break;
    groups.push(digits.slice(0, size));
    digits = digits.slice(size);
  }
  return groups.join("-");
}
