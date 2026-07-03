import { availableRelayTests, Category } from "./SelectRound"

interface TestItem {
  year: number,
  finalround: boolean,
  category: Category
}

const allTests: TestItem[] = [];
  availableRelayTests.forEach((testsForAYear, yearidx) => {
    if (testsForAYear.local) {
      allTests.push(...testsForAYear.local.map(test => ({ year: yearidx, finalround: false, category: test })));
    }
    if (testsForAYear.final) {
      allTests.push(...testsForAYear.final.map(test => ({ year: yearidx, finalround: true, category: test })));
    }
});

export const teamData: {
  teamname: string,
  category: string,
  join_code: string
}[] = allTests.map(test => {
  const teamname = `${test.year + 1}_${test.finalround ? 'D' : 'H'}_${test.category}`
  return {
    teamname: teamname,
    category: test.category.toString(),
    join_code: teamname
  }
})