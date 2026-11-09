const rules = <p className="text-justify">Adott egy 5×5-ös tábla. A játékosok felváltva lépnek, az első játékos O jeleket, a második pedig X jeleket helyez le a tábla még üres mezőire. Az első játékos minden lépésekor egy O-t helyezhet le, a második viszont minden lépésében két X-et tehet a táblára. A második játékos nyer, ha sikerül egy csak X-ekből álló sort vagy oszlopot létrehoznia. Az első játékos pedig akkor nyer, ha a tábla megtelik X és O jelekkel úgy, hogy a második játékos nem nyert. Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek bújni. Győzzétek le a gépet kétszer egymás után ebben a játékban!</p>;

const rulesC = <p className="text-justify">Adott egy 5×5-ös tábla. A játékosok felváltva lépnek, az első játékos X jeleket, a második pedig O jeleket helyez le a tábla még üres mezőire. Az első játékos minden lépésekor két X-et helyezhet le, a második viszont minden lépésében csak egy O-t tehet a táblára. Az első játékos nyer, ha sikerül egy csak X-ekből álló sort vagy oszlopot létrehoznia. A második játékos pedig akkor nyer, ha a tábla megtelik X és O jelekkel úgy, hogy az első játékos nem nyert. Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek bújni. Győzzétek le a gépet kétszer egymás után ebben a játékban!</p>;

// The role buttons name each side's mark, which the first player's depends on
// by category. The board always starts empty, so the start does not vary.
export const presentationC = { rules: rulesC, roleLabels: ['Kezdünk (2 X)', 'Másodikak leszünk (1 O)'] } as const;
export const presentationD = { rules, roleLabels: ['Kezdünk (1 O)', 'Másodikak leszünk (2 X)'] } as const;
export const presentationE = presentationD;
