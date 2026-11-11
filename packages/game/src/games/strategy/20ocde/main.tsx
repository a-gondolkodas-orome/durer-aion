// The rules of the game alone: the wrapper adds what every game's rules end
// with, the choice of role and the two wins in a row.
const description = <p className="text-justify">Adott egy 5×5-ös tábla. A játékosok felváltva lépnek, az első játékos O jeleket, a második pedig X jeleket helyez le a tábla még üres mezőire. Az első játékos minden lépésekor egy O-t helyezhet le, a második viszont minden lépésében két X-et tehet a táblára. A második játékos nyer, ha sikerül egy csak X-ekből álló sort vagy oszlopot létrehoznia. Az első játékos pedig akkor nyer, ha a tábla megtelik X és O jelekkel úgy, hogy a második játékos nem nyert.</p>;

export const descriptionC = <p className="text-justify">Adott egy 5×5-ös tábla. A játékosok felváltva lépnek, az első játékos X jeleket, a második pedig O jeleket helyez le a tábla még üres mezőire. Az első játékos minden lépésekor két X-et helyezhet le, a második viszont minden lépésében csak egy O-t tehet a táblára. Az első játékos nyer, ha sikerül egy csak X-ekből álló sort vagy oszlopot létrehoznia. A második játékos pedig akkor nyer, ha a tábla megtelik X és O jelekkel úgy, hogy az első játékos nem nyert.</p>;
export const descriptionD = description;
export const descriptionE = description;
