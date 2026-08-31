import { availableRelayTests, Category, relayTestCode, RoundType } from "./SelectRound"

interface TestItem {
  year: number,
  roundtype: RoundType,
  category: Category
}

const allTests: TestItem[] = [];
  availableRelayTests.forEach((testsForAYear, yearidx) => {
    if (testsForAYear.local) {
      allTests.push(...testsForAYear.local.map(test => ({ year: yearidx, roundtype: 'local' as const, category: test })));
    }
    if (testsForAYear.final) {
      allTests.push(...testsForAYear.final.map(test => ({ year: yearidx, roundtype: 'final' as const, category: test })));
    }
    if (testsForAYear.online) {
      allTests.push(...testsForAYear.online.map(test => ({ year: yearidx, roundtype: 'online' as const, category: test })));
    }
});

export const teamData: {
  teamname: string,
  category: string,
  join_code: string
}[] = allTests.map(test => {
  const teamname = relayTestCode(test.year, test.roundtype, test.category)
  return {
    teamname: teamname,
    category: test.category.toString(),
    join_code: teamname
  }
})