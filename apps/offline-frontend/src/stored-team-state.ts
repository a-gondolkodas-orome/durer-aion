import { LOCAL_STORAGE_TEAMSTATE, TeamModelDto, parseTeamModelDto } from "common-frontend";

// The one place the stored team state is parsed (#367): every read goes through
// this validation instead of trusting JSON.parse's `any`. Anything that does
// not match TeamModelDto — missing, corrupt, or hand-edited — reads as null,
// the same as no stored state at all. What is stored is a JSON round trip of
// a TeamModelDto, i.e. exactly the wire shape parseTeamModelDto validates —
// Date fields flattened to ISO strings, revived on the way back.
export function readStoredTeamState(): TeamModelDto | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
  if (stored === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return null;
  }
  return parseTeamModelDto(parsed);
}
