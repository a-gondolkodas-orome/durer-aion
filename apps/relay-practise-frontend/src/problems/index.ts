import type { Problem } from "strategy";

// One module per relay test under ./sets, named after the join code
// (`<year>_<H|D>_<category>`) with '+' replaced by 'p', so the problems of
// test "9_D_C+" live in "./sets/9_D_Cp.ts". Modules are only fetched when the
// matching test is actually started.
const problemSets = import.meta.glob<{ default: Problem[] }>('./sets/*.ts');

const moduleKey = (code: string) => `./sets/${code.replace(/\+/g, 'p')}.ts`;

export const hasProblemSet = (code: string): boolean => moduleKey(code) in problemSets;

export const loadProblemSet = async (code: string): Promise<Problem[]> => {
  const load = problemSets[moduleKey(code)];
  if (!load) {
    throw new Error(`No problem set found for test ${code}`);
  }
  return (await load()).default;
};
