import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 12's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  '1jmnx7vnl8--12-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '9v2p18men4--tizenket-tojas-tucat', points: 3 },
        { problemId: 'ywiu0rz7qp--kepen-urallomas-tervrajza', points: 3 },
        { problemId: 'a0o9vmpi7o--lany-fiu-vett', points: 3 },
        { problemId: 'ejuvsj8qga--albrecht-felirta-kedvenc', points: 3 },
        { problemId: '8al2abqfmu--szambol-toroltunk-szamjegyet', points: 4 },
        { problemId: 'ryl180dris--golero-nevu-focicsapat', points: 4 },
        { problemId: 'mcn7ngugkr--bolt-kulonleges-akciot', points: 4 },
        { problemId: 'lm8ar3wez8--albrecht-felirta-tablara', points: 4 },
        { problemId: 'duwtmaajtm--egeszitsd-hatjegyu-szamot', points: 5 },
        { problemId: 'nwsfeoti7m--negyzethalos-fuzetembe-lenti', points: 5 },
        { problemId: '6tsj3a9sz8--amerikaban-kovetkezo-tipusu', points: 5 },
        { problemId: '1adlrhg4yf--csaladban-gyermek-januar', points: 5 },
        { problemId: '9nz2rdmvbz--svajci-bicskamon-eszkoz', points: 6 },
        { problemId: 'fk1111119v--kulonbozo-magassagu-diak', points: 6 },
        { problemId: 'lbxj3xvwff--szobaban-lakik-testver', points: 6 },
        { problemId: '2dvq925pbx--albrecht-rajzolt-konvex', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'final', category: 'A' },
  },
  '890cyy3cu8--12-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'vlkn01p3tc--kepen-urallomas-tervrajza', points: 3 },
        { problemId: 'mhi3n49rx2--haromszognek-fokos-belso', points: 3 },
        { problemId: 'axq8qzgks7--albrecht-felirta-kedvenc', points: 3 },
        { problemId: 'ryl180dris--golero-nevu-focicsapat', points: 3 },
        { problemId: 'mcn7ngugkr--bolt-kulonleges-akciot', points: 4 },
        { problemId: 'rb4v2hjoxy--negyzethalos-fuzetembe-lenti', points: 4 },
        { problemId: 'k3exxq8oa1--amerikaban-kovetkezo-tipusu', points: 4 },
        { problemId: '1adlrhg4yf--csaladban-gyermek-januar', points: 4 },
        { problemId: 'p8g2v7m0hx--ora-szamlapjan-szamok', points: 5 },
        { problemId: 'tf4oczkn9e--hetjegyu-szamot-kiegesziteni', points: 5 },
        { problemId: 'dzko14oezg--svajci-bicskamon-eszkoz', points: 5 },
        { problemId: 'syb1vbo3ek--tegnap-negytagu-csaladban', points: 5 },
        { problemId: 'e58qk8x47h--szamok-mindegyiket-kiszineztem', points: 6 },
        { problemId: '0m1wge87xh--kulonbozo-magassagu-diak', points: 6 },
        { problemId: 'ih3a5k70ua--albrecht-rajzolt-konvex', points: 6 },
        { problemId: 'rvk2pmuq3e--szobaban-lakik-testver', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'final', category: 'B' },
  },
  'no9z8yjv29--12-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'hh4k1r8vvy--sehallselat-domotor-kaposztafoldje', points: 3 },
        { problemId: 'id1fty9l6d--nap-percig-lathato', points: 3 },
        { problemId: 'hc45knx2w2--legkisebb-tizes-szamrendszerbeli', points: 3 },
        { problemId: 'rl5nbiok22--bertold-egymas-leirta', points: 3 },
        { problemId: 'uxn0obzcha--csucsu-sokszognek-szoge', points: 4 },
        { problemId: 'm40suquu0g--szabalyos-hatszog-oldalt', points: 4 },
        { problemId: 'tjmyeeapmk--bicikliversenyen-versenynap-vegso', points: 4 },
        { problemId: '40xwkkzqd3--papiron-szaz-allitas', points: 4 },
        { problemId: 'hxmaftsf9w--mennyit-cel-osztva', points: 5 },
        { problemId: 'ikdd6o0w6n--miskolci-villamos-tiszai', points: 5 },
        { problemId: 's1tszjaxr5--termeszetes-szamot-szep', points: 5 },
        { problemId: 'xgqm8vyi2c--szamitsatok-haromszog-szoget', points: 5 },
        { problemId: '9o046l1rhk--leirtuk-egymas-sorban', points: 6 },
        { problemId: 'ajjqng92tu--paralelogramma-oldalan-kivalasztottunk', points: 6 },
        { problemId: 'umrwatboa2--sorba-rendezni-szamokat', points: 6 },
        { problemId: '8qfyioiw56--eljutni-pontbol-pontba', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'final', category: 'C' },
  },
  'mqag87rxp0--12-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'mvoe3cbvki--csucsu-sokszognek-szoge', points: 3 },
        { problemId: 'qlmborl25q--szabalyos-hatszog-oldalt', points: 3 },
        { problemId: 'tjmyeeapmk--bicikliversenyen-versenynap-vegso', points: 3 },
        { problemId: '40xwkkzqd3--papiron-szaz-allitas', points: 3 },
        { problemId: 'hxmaftsf9w--mennyit-cel-osztva', points: 4 },
        { problemId: 'nshx60l9xx--szamitsatok-haromszog-szoget', points: 4 },
        { problemId: 's1tszjaxr5--termeszetes-szamot-szep', points: 4 },
        { problemId: 'b5o9rs1owj--miskolci-villamos-tiszai', points: 4 },
        { problemId: '9o046l1rhk--leirtuk-egymas-sorban', points: 5 },
        { problemId: 'b99cnvbzgw--szamjegybol-all-legkisebb', points: 5 },
        { problemId: 'safw0wwtra--paralelogramma-oldalan-kivalasztottunk', points: 5 },
        { problemId: '9m7j21zo64--sakktablan-babu-elindul', points: 5 },
        { problemId: 'spvztyv0lz--jojo-barmely-szomszedos', points: 6 },
        { problemId: '9wwb5zszem--szamok-osszege-amelyeknek', points: 6 },
        { problemId: 'gzrm9ggg2p--tompaszogu-egyenloszaru-haromszog', points: 6 },
        { problemId: 'umrwatboa2--sorba-rendezni-szamokat', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'final', category: 'D' },
  },
  '34jauhu011--12-final-e': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '6mws48r9tf--egyenloszaru-haromszog-letezik', points: 3 },
        { problemId: 't3z38u7681--anna-leirta-osszes', points: 3 },
        { problemId: '5d64c3b6h1--lapon-darab-tol', points: 3 },
        { problemId: 'wfapu4jlao--miskolci-villamos-tiszai', points: 3 },
        { problemId: 'yxzbvwkaib--szamot-adhatunk-semelyik', points: 4 },
        { problemId: 'x6vjjuq205--szamjegybol-all-legkisebb', points: 4 },
        { problemId: 'i1pjdf9gkp--paralelogramma-oldalan-kivalasztottunk', points: 4 },
        { problemId: 'jk8423y8ya--sakktablan-babu-elindul', points: 4 },
        { problemId: 'ul32d0kll2--kockat-felosztottunk-egybevago', points: 5 },
        { problemId: 'jg9zp0hdj6--tompaszogu-egyenloszaru-haromszog', points: 5 },
        { problemId: 'je2yny747x--legkisebb-erteke-kozos', points: 5 },
        { problemId: 'vxylbzxccz--sorba-rendezni-szamokat', points: 5 },
        { problemId: 'qhqvutf5t6--szam-paratlan-tol', points: 6 },
        { problemId: 'etdkglgwfr--osztalytars-bizonyitvanyosztas-megallapitotta', points: 6 },
        { problemId: 'liprjweudd--egyenloszaru-haromszog-deg', points: 6 },
        { problemId: 'b6bdwdetj0--kiszinezni-fekete-feherre', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'final', category: 'E' },
  },
  'rvvvrr2zom--12-final-e-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '7s18pqv3mv--szamot-adhatunk-semelyik', points: 3 },
        { problemId: 'h077pasv35--szamjegybol-all-legkisebb', points: 3 },
        { problemId: 'k9d2w3icr4--haromszogben-belso-pont', points: 3 },
        { problemId: 'hzfkvwku1i--kockat-felosztottunk-egybevago', points: 3 },
        { problemId: 'm46hmvrhh7--permutacioja-halmaznak-melyre', points: 4 },
        { problemId: 'vi9irb49d3--paralelogramma-oldalan-kivalasztottunk', points: 4 },
        { problemId: 'vcyzm42fy6--legkisebb-amelyre-tol', points: 4 },
        { problemId: 'n2f51xuyrv--amelyre-ugyanarra-jegyre', points: 4 },
        { problemId: 'ntl58fsoy7--tudunk-kiszinezni-fekete', points: 5 },
        { problemId: 'po561fyb8j--legkisebb-erteke-kozos', points: 5 },
        { problemId: 'oivr8pql4x--legkisebb-amelyre-oszthato', points: 5 },
        { problemId: 'knm12ds9ef--kulonbozo-nemkonstans-polinom', points: 5 },
        { problemId: 'j10qydl707--elhelyeztunk-korben-szamozott', points: 6 },
        { problemId: 'popasexc8g--egeszek-halmaza-kisebbek', points: 6 },
        { problemId: 'zb9qry7euh--amelyhez-leteznek-nemnegativ', points: 6 },
        { problemId: 'u9e8wojbhr--haromszog-oldalai-egyseg', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'final', category: 'E+' },
  },
};

export const problems: ProblemBank = {
  '9v2p18men4--tizenket-tojas-tucat': {
    answer: 144,
    content: {
      hu: {
        problemText: "<p>Tizenkét tojás egy tucat. Tizenkét tucat egy nagytucat, más néven grossz. Tizenkét grossz pedig éppen egy nagygrossz.</p><p>Ha egy étterem rendel egy nagygrossz tojást, akkor hány doboz kell ennek kiszállításához, ha egy dobozba éppen egy tucat tojás fér?</p>",
        help1: "Hány tucat fér el egy nagygrosszban?",
        help2: "Hány doboz egy tucat?",
      },
    },
  },
  'ywiu0rz7qp--kepen-urallomas-tervrajza': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>A képen egy űrállomás tervrajza látható. A körök kabinokat jelölnek, közöttük csövek jelentenek összeköttetéseket. Az űrállomáson lakó űrhajósok számára a következőszabályokat írták elő:</p><p><ul><li>Űrhajós csak kabinban lakhat (csőben nem), egy kabinban egyszerre csak egy űrhajós fér el.<li>A megfelelő oxigénellátás érdekében szomszédos (azaz csővel közvetlenül összekötött) kabinokban sem lakhat egyszerre űr-hajós.</ul></p><p>Legfeljebb hány űrhajós lakhat az űrállomáson?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_A_2.png",
        help1: "Színezzétek sakktáblaszerűen az űrállomást!",
        help2: "Az egyik színű mezőkben érdemes az űrhajósokat elszállásolni. Melyik szín jobb?",
      },
    },
  },
  'a0o9vmpi7o--lany-fiu-vett': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Négy lány és hat fiú vett részt egy körmérkőzéses ping-pong versenyen. Mindenki mindenkivel játszik egyszer, és minden meccs után a győztes kap egy csokit.</p><p>Legfeljebb hány csokit gyűjthettek a lányok összesen?</p>",
        help1: "Akkor gyűjthetnek maximális számú csokit, ha minden meccset lány nyer, amelyikben lány játszik.",
        help2: "Ha két lány egymás ellen játszik, az a lányok számára csak egy csokit jelent.",
      },
    },
  },
  'ejuvsj8qga--albrecht-felirta-kedvenc': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Albrecht felírta kedvenc számát, a 256-ot a táblára. Ezután kivonta belőle a számjegyei összegét, és az új számot írta a helyére. Ezt ismételgette, míg el nem jutott a 0-ig. Melyik volt az első kétjegyű szám, amelyik megjelent a táblán?</p>",
        help1: "Csináljátok azt, amit Albrecht! Milyen szabályosságot fedeztek fel a leírt számokban?",
        help2: "Az összeg általában 9-cel csökken, de figyeljetek, mert a 198-nál 18-cal.",
      },
    },
  },
  '8al2abqfmu--szambol-toroltunk-szamjegyet': {
    answer: 9752,
    content: {
      hu: {
        problemText: "<p>A 13967502 számból töröltünk négy számjegyet, így egy négyjegyű számot kaptunk. Mi a legnagyobb szám, amit így megkaphattunk?</p>",
        help1: "Minél nagyobb helyiértéken van egy nagyobb számjegy, annál nagyobb lesz a kapott szám.",
        help2: "Melyik számjegy legyen az ezres helyiértéken? Ha ez megvan, melyik kerüljön a százasok helyére, hogy minél nagyobb szám legyen?",
      },
    },
  },
  'ryl180dris--golero-nevu-focicsapat': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>A Gólerő nevű focicsapat nyolc meccset játszott eddig a bajnokságban, amelyeken 1, 2, 3, 4, 5, 6, 7, illetve 8 gólt lőttek. A csapat a meccsek felét megnyerte, a másik felét elvesztette. Ha vesztettek, mindig csak egy gólos különbséggel kaptak ki, ám ha nyertek, akkor mindig pont kétszer annyi gólt lőttek, mint az ellenfél. Öngól egyik meccsükön sem esett. Hány gólt kapott eddig a csapat összesen?</p>",
        help1: "Amikor nyertek, páros sok gólt lőtt a csapat.",
        help2: "A pontszámok fele páros, és pontosan a meccsek felét nyerték.",
      },
    },
  },
  'mcn7ngugkr--bolt-kulonleges-akciot': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>Egy bolt különleges akciót hirdetett: két jégkrém-pálcikát be lehet váltani egy új jégkrémre. Van húsz jégkrém-pálcikánk, de pénzünk nincsen. Legfeljebb hány jégkrémet ehetünk meg, ha a már megevett jégkrémek pálcikáit is beválthatjuk?</p>",
        help1: "A beváltások sorrendje nem befolyásolja az összesen beváltható pálcikák számát.",
        help2: "Mindig csak egy-egy párt váltsatok be, és nézzétek meg, hogyan változik a maradék pálcikáitok száma!",
      },
    },
  },
  'lm8ar3wez8--albrecht-felirta-tablara': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Albrecht felírta egy táblára piros krétával a KISKACSA, és kék krétával KUKUCSKA szavakat. Legalább hány betűt kell letörölnie, ha azt szeretné elérni, hogy a megmaradt piros betűket összeolvasva ugyanazt a (nem feltétlenül értelmes) szót kapjuk, mintha a megmaradt kék betűket olvasnánk össze? <br><i>A CS ebben a feladatban két külön betűnek számít.</i></p>",
        help1: "Ha egy betű szerepel egy szóban, de a másikban nem, akkor azt muszáj letörölni.",
        help2: "Ha az egyik betűből több van a az egyik szóban, mint a másikban, akkor abból is ki kell törölni annyit, hogy ugyanolyan hosszúak legyenek!",
      },
    },
  },
  'duwtmaajtm--egeszitsd-hatjegyu-szamot': {
    answer: 3723,
    content: {
      hu: {
        problemText: "<p>Egészítsd ki a hatjegyű 2 _ _ _ _ 7 számot úgy, hogy a kapott számban bármely három szomszédos számjegy összege 12 legyen!<br><i>A válasz a négy vonalkára írt számjegyekből összeolvasható négyjegyű szám.</i></p>",
        help1: "Az első három számjegy összege ugyanannyi, mint a 2-3-4. számjegyek összege.",
        help2: "Az előző segítség alapján megtudhatjátok a negyedik számjegyet. Ugyanígy számolható ki a harmadik számjegy, csak jobbról indulva.",
      },
    },
  },
  'nwsfeoti7m--negyzethalos-fuzetembe-lenti': {
    answer: 34,
    content: {
      hu: {
        problemText: "<p>A négyzethálós füzetembe a lenti kilencszöget rajzoltam. A rajzot ezután lefénymásoltam, de a fénymásoló egy kicsit felnagyította az ábrát (az arányok megtartása mellett), így a legrövidebb oldalai pontosan 1 cm hosszúak, míg a leghosszabb oldala pontosan 10 cm hosszú lett. Hány cm a kilencszög kerülete ezen a felnagyított ábrán?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_A_10.png",
        help1: "A leghosszabb oldal egy 2&lowast;14-es téglalap átlója, a legrövidebb pedig egy 1&lowast;1-esé.",
        help2: "A kilencszögnek vannak olyan oldalai, amelyek éppen feleakkorák, mint a leghosszabb oldal. A többi oldal átlósan helyezkedik el, emiatt ezek a legrövidebb oldal többszörösei.",
      },
    },
  },
  '6tsj3a9sz8--amerikaban-kovetkezo-tipusu': {
    answer: 45,
    content: {
      hu: {
        problemText: "<p>Amerikában a következő típusú fémpénzek vannak forgalomban: egycentes, ötcentes, tízcentes és huszonöt centes. A zsebemben 50 pénzérme van, és ezek pontosan 1 dollárt tesznek ki (egy dollár = 100 cent). Azt is tudom, hogy mindegyik fajta pénzérméből van nálam legalább egy. Hány egycentesem van?</p>",
        help1: "Induljatok ki abból az esetből, amikor 1-1 darab van minden nagyobb érméből, és az összes többi egycentes.",
        help2: "Váltsatok be néhány egycentest nagyobb érmékre, hogy csökkenjen az érmék száma a kellő számúra csökkenjen!<br><i>Ha 10 darab egycentest beváltotok egy tízcentesre, akkor pont 9-cel csökken az érmék száma.</i>",
      },
    },
  },
  '1adlrhg4yf--csaladban-gyermek-januar': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Egy családban mind a hét gyermek január elsején született, jelenlegi életkoruk rendre 1, 3, 5, 7, 9, 11, 13. Életkoraik években vett összege 49, ami épp négyzetszám. Az életkoraik összege legközelebb hány év múlva lesz újra négyzetszám?</p>",
        help1: "Mennyivel nő az életkoraik összege, ha eltelik egy év?",
        help2: "Nézzétek meg, hogy <em>49+7n</em> melyik legkisebb <em>n</em>-re lesz újra négyzetszám! (Ez a négyzetszám biztosan osztható 7-tel.)",
      },
    },
  },
  '9nz2rdmvbz--svajci-bicskamon-eszkoz': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>A svájci bicskámon öt eszköz van: egy kés, egy csavarhúzó, egy konzervnyitó, egy körömreszelő és egy csipesz, mindegyik lehet kinyitva vagy becsukva. A kést és a konzervnyitót nem lehet egyszerre kinyitni. A körömreszelő csak akkor lehet kinyitva, ha a csavarhúzó is ki van nyitva (de a csavarhúzó lehet nyitva a körömreszelő nélkül).</p><p>Hányféle állapota van a bicskának?<br><i>Két állapot akkor számít különbözőnek, ha van olyan eszköz, amelyik az egyik állapotban nyitva, a másik állapotban csukva van.</i></p>",
        help1: "Az egymástól függő eszközöknek lehetséges állásait számoljátok meg külön-külön!",
        help2: "Ha a csavarhúzó nyitva van, akkor a körömreszelő mindegy, hogyan áll. A csipesz a többitől teljesen függetlenül lehet nyitott vagy csukott.<br><i>Segíthet, ha egy táblázatban összegyűjtitek az eszközök lehetséges kombinációit.</i>",
      },
    },
  },
  'fk1111119v--kulonbozo-magassagu-diak': {
    answer: 63,
    content: {
      hu: {
        problemText: "<p>Hat különböző magasságú diák a következő játékot játssza a tornateremben. Kezdetben mindannyian guggolnak. A tornatanáruk néhány másodpercenként tapsol egyet. Minden taps után a következő történik: a legalacsonyabb guggoló gyerek feláll, majd minden nála alacsonyabb álló diák leguggol (ha van olyan). Ha mindenki áll, a játék véget ér.</p><p>Hányat kell tapsolnia a tornatanárnak a játék végig?</p>",
        help1: "Rajzoljátok le a gyerekeket tornasorban! A tanár mennyit tapsol addig, amíg a két-, három-, négy legalacsonyabb gyerek feláll?",
        help2: "Amikor a legmagasabb gyerek feláll, akkor onnantól ő már nem fog guggol le többet, a többi öt gyerek pedig kezdheti az egész játékot guggolva, elölről.",
      },
    },
  },
  'lbxj3xvwff--szobaban-lakik-testver': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Egy szobában lakik három testvér: Aladár, Boldizsár és Ciprián. Minden reggel miközben kilépnek az ajtón felvesznek egy pár papucsot. A szobájuk ajtaja előtt van egy pár kék, egy pár piros és egy pár zöld papucs. Hányféleképpen tudják azt megcsinálni, hogy mindhárman belebújnak két-két papucsba, de mindenkinek a bal és jobb lábán különböző színű papucs van?<br><i>Bal lábra csak balos, jobb lábra csak jobbos papucsot húznak fel. Különbözőnek tekintünk két esetet, ha egy papucs más ember lábára kerül.</i></p>",
        help1: "A belebújások sorrendje nem számít. Ha a bal lábukra mindannyian felvettek egy-egy papucsot, akkor hányféleképpen bújhatnak a jobb papucsokba?",
        help2: "Ha csak a bal papucsokat vennék fel, azt hányféleképpen tehetnék?<br>Az első testvér, aki jobb papucsba bújik, két szín közül választhat, mivel a bal lábán már van valamilyen színű papucs.",
      },
    },
  },
  '2dvq925pbx--albrecht-rajzolt-konvex': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Albrecht rajzolt egy konvex, de nem szabályos tízszöget, majd ennek behúzta 6 átlóját. Legfeljebb hány metszéspont keletkezhetett a tízszög belsejében?<br><i>A tízszög csúcsait nem számoljuk a metszéspontok közé. Egy sokszög akkor konvex, ha minden szöge kisebb 180&deg;-nál.</i></p>",
        help1: "3, 4, 5 egyenesnek legfeljebb hány metszéspontja lehet a síkon?",
        help2: "Ha már 5 átlót berajzoltatok úgy, hogy azoknak a lehető legtöbb metszéspontjuk legyen, akkor a hatodik legfeljebb hány új metszéspontot ad?<br><i>Az egy csúcsból induló átlók nem metszhetik egymást csúcstól különböző pontban.</i>",
      },
    },
  },
  'vlkn01p3tc--kepen-urallomas-tervrajza': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>A képen egy űrállomás tervrajza látható. A körök kabinokat jelölnek, közöttük csövek jelentenek összeköttetéseket. Az űrállomáson lakó űrhajósok számára a következőszabályokat írták elő: <ul><li>Űrhajós csak kabinban lakhat (csőben nem)<li>Egy kabinban egyszerre csak egy űrhajós fér el.<li>A megfelelő oxigénellátás érdekében szomszédos (azaz csővel közvetlenül összekötött) kabinokban nem lakhat egyszerre űrhajós.</ul></p><p>Legfeljebb hány űrhajós lakhat az űrállomáson?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_B_1.png",
        help1: "Színezzétek sakktáblaszerűen az ábrát!",
        help2: "Az egyik színű mezőkben érdemes az űrhajósokat elszállásolni. Melyik szín jobb?",
      },
    },
  },
  'mhi3n49rx2--haromszognek-fokos-belso': {
    answer: 85,
    content: {
      hu: {
        problemText: "<p>Egy háromszögnek van egy 42 fokos belső szöge és egy 137 fokos külső szöge. Mekkora a legkisebb külső szöge ugyanennek a háromszögnek?</p>",
        help1: "A háromszög belső szögeinek összege 180&deg;.",
        help2: "A legnagyobb belső szögéhez tartozik a legkisebb külső szöge.",
      },
    },
  },
  'axq8qzgks7--albrecht-felirta-kedvenc': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Albrecht felírta kedvenc számát, a 256-ot a táblára. Ezután kivonta belőle a számjegyei összegét, és az új számot írta a helyére. Ezt ismételgette, míg el nem jutott a 0-ig. Melyik volt az első kétjegyű szám, amelyik megjelent a táblán?</p>",
        help1: "Csináljátok azt, amit Albrecht! Milyen szabályosságot fedeztek fel a leírt számokban?",
        help2: "Egy szám számjegyei összegének 9-es maradéka egyenlő a szám 9-cel vett osztási maradékával. A 198-nál 18-cal fog csökkenni az összeg.",
      },
    },
  },
  'rb4v2hjoxy--negyzethalos-fuzetembe-lenti': {
    answer: 34,
    content: {
      hu: {
        problemText: "<p>A négyzethálós füzetembe a lenti kilencszöget rajzoltam. A rajzot ezután lefénymásoltam, de a fénymásoló egy kicsit felnagyította az ábrát (az arányok megtartása mellett), így a legrövidebb oldalai pontosan 1 cm hosszúak, míg a leghosszabb oldala pontosan 10 cm hosszú lett. Hány cm a kilencszög kerülete ezen a felnagyított ábrán?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_B_6.png",
        help1: "A leghosszabb oldal egy 2&lowast;14-es téglalap átlója, a legrövidebb pedig egy 1&lowast;1-esé.",
        help2: "A kilencszögnek vannak olyan oldalai, amelyek éppen feleakkorák, mint a leghosszabb oldal. A többi oldal átlósan helyezkedik el, emiatt ezek a legrövidebb oldal többszörösei.",
      },
    },
  },
  'k3exxq8oa1--amerikaban-kovetkezo-tipusu': {
    answer: 45,
    content: {
      hu: {
        problemText: "<p>Amerikában a következő típusú fémpénzek vannak forgalomban: egycentes, ötcentes, tízcentes és huszonöt centes. A zsebemben 50 pénzérme van, és ezek pontosan 1 dollárt tesznek ki (egy dollár = 100 cent). Azt is tudom, hogy mindegyik fajta pénzérméből van nálam legalább egy. Hány egycentesem van?</p>",
        help1: "Induljatok ki abból az esetből, amikor 1-1 darab van minden nagyobb érméből, és az összes többi egycentes.",
        help2: "Váltsatok be néhány egycentest nagyobb érmékre, hogy csökkenjen az érmék száma!<br><i>Ha 10 darab egycentest beváltotok egy tízcentesre, akkor mennyivel csökken az érmék száma?</i>",
      },
    },
  },
  'p8g2v7m0hx--ora-szamlapjan-szamok': {
    answer: 75,
    content: {
      hu: {
        problemText: "<p>Egy óra számlapján az  \\(1, 2, \\ldots, 12\\)  számok mellett egy-egy pötty található, ezek éppen egy szabályos 12-szöget alkotnak. Egy egyenessel összekötöttem a 7-es és a 12-es számú pöttyöket. Egy másik egyenessel összekötöttem az 5-ös és a 9-es pöttyöket.</p><p>Hány fokos hegyesszöget zár be egymással ez a két egyenes?</p>",
        help1: "Rajzoljátok be az ábrába a két megadott egyenes felezőmerőlegeseit!",
        help2: "A két eredeti egyenes ugyanakkora szöget zár be egymással, mint a felezőmerőlegeseik. A tizenkétszög középpontja illeszkedik ezekre a felezőmerőlegesekre.",
      },
    },
  },
  'tf4oczkn9e--hetjegyu-szamot-kiegesziteni': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet a hétjegyű 7 _ _ _ _ _ 7 számot úgy kiegészíteni, hogy a kapott számban bármely három szomszédos számjegy összege 13 legyen?</p>",
        help1: "A második számjegyet jelöljétek mondjuk <em>a</em>-val! Fejezzétek ki vele a többi számjegyet!",
        help2: "A szám középső számjegye egyértelműen meghatározható. A többi üres hely kitöltésére hány lehetőség van (számjegyeket kell beírni)?",
      },
    },
  },
  'dzko14oezg--svajci-bicskamon-eszkoz': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>A svájci bicskámon hat eszköz van: egy kés, egy csavarhúzó, egy konzervnyitó, egy körömreszelő, egy csipesz és egy nagyító. Mindegyik lehet kinyitva vagy becsukva. A kést és a konzervnyitót nem lehet egyszerre kinyitni. A körömreszelő csak akkor lehet kinyitva, ha a csavarhúzó is ki van nyitva (de a csavarhúzó lehet nyitva a körömreszelő nélkül).</p><p>Hányféle állapota van a bicskának?<br><i>Két állapot akkor számít különbözőnek, ha van olyan eszköz, amelyik az egyik állapotban nyitva, a másik állapotban csukva van.</i></p>",
        help1: "Az egymástól függő eszközöknek lehetséges állásait számoljátok meg külön-külön!",
        help2: "Ha a csavarhúzó nyitva van, akkor a körömreszelő mindegy, hogyan áll. A csipesz és a nagyító a többitől teljesen függetlenül lehet nyitott vagy csukott.",
      },
    },
  },
  'syb1vbo3ek--tegnap-negytagu-csaladban': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Tegnap egy négytagú családban megszületett a harmadik gyerek, így a család átlagéletkora három évvel csökkent az egy évvel azelőtti átlagéletkorhoz képest. Mennyi most a család átlagéletkora?</p>",
        help1: "Jelöljétek például <em>s</em>-sel a családtagok átlagéletkorát! Mennyi volt az új gyerek születése előtti pillanatban az összéletkor, és mennyivel változott az átlagéletkor a születés pillanatában?",
        help2: "A család létszáma eggyel nőtt, az átlagéletkor pedig összesen 4 évvel csökkent, így lett ugyanannyi az életkorok összege.",
      },
    },
  },
  'e58qk8x47h--szamok-mindegyiket-kiszineztem': {
    answer: 1521,
    content: {
      hu: {
        problemText: "<p>Az 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 számok mindegyikét kiszíneztem pirossal vagy kékkel, majd a piros számok összegét összeszoroztam a kék számok összegével. Mi a szorzat lehetséges legnagyobb értéke?</p>",
        help1: "Legyen a piros számok összege P, a kékek összege K. A <em>P&lowast;K</em> szorzat mikor a lehető legnagyobb?",
        help2: "Mennyi az összes szám összege? A szorzat akkor maximális, ha <em>P</em> és <em>K</em> különbsége a lehető legkisebb.",
      },
    },
  },
  '0m1wge87xh--kulonbozo-magassagu-diak': {
    answer: 255,
    content: {
      hu: {
        problemText: "<p>Nyolc különböző magasságú diák a következő játékot játssza a tornateremben. Kezdetben mindannyian guggolnak. A tornatanáruk néhány másodpercenként tapsol egyet. Minden taps után a következő történik: a legalacsonyabb guggoló gyerek feláll, majd minden nála alacsonyabb álló diák leguggol (ha van olyan). Ha mindenki áll, a játék véget ér.</p><p>Hányat kell tapsolnia a tornatanárnak a játék végig?</p>",
        help1: "Rajzoljátok le a gyerekeket tornasorban! A tanár mennyit tapsol addig, amíg a két-, három-, négy legalacsonyabb gyerek feláll?",
        help2: "Amikor a legmagasabb gyerek feláll, akkor onnantól ő már nem guggol le többet, a többi hét gyerek pedig kezdheti az egészet guggolva, elölről.",
      },
    },
  },
  'ih3a5k70ua--albrecht-rajzolt-konvex': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>Albrecht rajzolt egy konvex, de nem szabályos tizenkétszöget, majd ennek behúzta 7 átlóját. Legfeljebb hány metszéspont keletkezhetett a tizenkétszög belsejében?<br><i>A tizenkétszög csúcsait nem számoljuk a metszéspontok közé. Egy sokszög akkor konvex, ha minden szöge kisebb 180&deg;-nál.</i></p>",
        help1: "3, 4, 5, 6 egyenesnek legfeljebb hány metszéspontja lehet a síkon?",
        help2: "Ha már 6 átlót berajzoltatok úgy, hogy azoknak a lehető legtöbb metszéspontjuk legyen, akkor a hetedik legfeljebb hány új metszéspontot ad?<br><i>Az egy csúcsból induló átlók nem metszhetik egymást csúcstól különböző pontban.</i>",
      },
    },
  },
  'rvk2pmuq3e--szobaban-lakik-testver': {
    answer: 216,
    content: {
      hu: {
        problemText: "<p>Egy szobában lakik négy testvér: Anna, Bea, Cili és Dorka. Minden reggel, miközben kilépnek az ajtón, felvesznek egy pár papucsot. A szobájuk ajtaja előtt van egy pár kék, egy pár sárga, egy pár piros és egy pár zöld papucs. Hányféleképpen tudják azt megcsinálni, hogy mind a négyen belebújnak két-két papucsba, de mindenkinek a bal és jobb lábán különböző színű papucs van?<br><i>Bal lábra csak balos, jobb lábra csak jobbos papucsot húznak fel. Különbözőnek tekintünk két esetet, ha egy papucs más ember lábára kerül.</i></p>",
        help1: "A belebújások sorrendje nem számít. Ha a bal lábukra mindannyian felvettek egy-egy papucsot, akkor hányféleképpen bújhatnak a jobb papucsokba?",
        help2: "Ha csak a bal papucsokat vennék fel, azt hányféleképpen tehetnék?<br>Az első testvér, aki jobb papucsba bújik, háromféle szín közül választhat. A többiek ilyenkor hogyan osztozhatnak a maradék hármon? Gyűjtsétek össze az összes esetet!",
      },
    },
  },
  'hh4k1r8vvy--sehallselat-domotor-kaposztafoldje': {
    answer: 40,
    content: {
      hu: {
        problemText: "<p>Sehallselát Dömötör káposztaföldje egy négyzet alakú ágyás, amelynek oldalhossza 10 méter. A káposzták az ábra szerinti módon négyzetrácsban helyezkednek el. Minden sorban illetve oszlopban 11 káposzta van egymástól 1-1 méterre, kivéve a középső rácspontot.<br>Sehallselát egy nap rábízta a kecskéjére a káposztaföldjét a következő módon: leszúrt a négyzet közepére egy karót, és ahhoz egy 5 méteres kötéllel kikötötte a kecskét, majd elment aludni. Mire felébredt, a kecske minden káposztát megevett, amelyet elért. Hány fej káposztája maradt Sehallselát Dömötörnek?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_C_1.png",
        help1: "A Pitagorasz-tétellel számítsátok ki a pontok távolságát!",
        help2: "A felülről második sorban például csak a két-két legszélső káposzta marad meg.",
      },
    },
  },
  'id1fty9l6d--nap-percig-lathato': {
    answer: 630,
    content: {
      hu: {
        problemText: "<p>Egy nap alatt összesen hány percig látható a 24 órás digitális óra kijelzőjén legalább egy darab 2-es? (A digitális óra 00:00-tól 23:59-ig jelzi az időt.)</p>",
        help1: "Soroljátok fel azokat az órákat, amikor az órák számában láthattok 2-es számjegyet! A nap többi órájában már csak a perceket kell vizsgálnotok.",
        help2: "15:00-tól 15:59-ig hány percen át látható 2-es a tízes-, illetve az egyes helyiértéken? Ugye egy esetet sem számoltatok kétszer?",
      },
    },
  },
  'hc45knx2w2--legkisebb-tizes-szamrendszerbeli': {
    answer: 558,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb (tízes számrendszerbeli) természetes szám, amelyben a számjegyek szorzata 200?</p>",
        help1: "Mi a 200 prímtényezős felbontása?",
        help2: "Csoportosítsátok a prímtényezőket úgy, hogy minél kevesebb egyjegyű számot kelljen összeszoroznotok. Figyeljetek a sorrendjükre!",
      },
    },
  },
  'rl5nbiok22--bertold-egymas-leirta': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Bertold egymás után leírta a pozitív egész számokat 1-től 2019-ig, elválasztójel vagy szünet nélkül. Melyik számjegy áll a 2019. helyen?</p>",
        help1: "Az egy-, két- illetve háromjegyű számoknak összesen hány számjegyük van?",
        help2: "A keresett számjegy hányadik háromjegyű szám hányadik számjegye?",
      },
    },
  },
  'uxn0obzcha--csucsu-sokszognek-szoge': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Egy 12 csúcsú sokszögnek legfeljebb hány 90&deg;-os szöge lehet?<br><i>Az oldalak nem metszhetik egymást, és a belső szögnek kell 90&deg;-osnak lennie. Az ábrán látható hétszögnek például 4 darab 90&deg;-os szöge van az <em>A</em>, <em>B</em>, <em>F</em> és <em>G</em> csúcsoknál.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_C_5.png",
        help1: "Egy sokszög belső szögei kisebbek 360&deg;-nál. Mennyi egy tizenkétszög belső szögeinek összege?",
        help2: "Ha a sokszögnek lehetne akár 11 derékszöge, akkor hány fokosnak kellene lennie a tizenkettedik szögnek?",
      },
    },
  },
  'm40suquu0g--szabalyos-hatszog-oldalt': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Adott egy \\(A_{1}A_{2}A_{3}A_{4}A_{5}A_{6}\\) szabályos hatszög. Az \\(A_{i}A_{i+1}\\) oldalt meghosszabbítjuk az \\(A_{i+1}\\) csúcs felé, a végpont legyen \\(A′_{i}\\) úgy, hogy \\(A_{i+1}\\) legyen az \\(A_{i}A′_{i}\\) szakasznak az \\(A_{i}\\)-hez közelebbi harmadolópontja (\\(1\\leq i\\leq 6\\), \\(A_{7}=A_{1}\\)). Mekkora a területe az \\(A′_{1}A′_{2}A′_{3}A′_{4}A′_{5}A′_{6}\\) hatszögnek, ha az eredeti hatszög területe egységnyi?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_C_6.png",
        help1: "Osszátok 6 egybevágó kis háromszögre a kisebb szabályos hatszöget a középpontjából induló szakaszokkal! Határozzátok meg egy kis- és egy nagy háromszög területének arányát.",
        help2: "Egy nagy háromszög alapja és magassága közül az egyik duplája, a másik triplája a vele oldalszomszédos kis háromszög alapjának, illetve magasságának.",
      },
    },
  },
  'tjmyeeapmk--bicikliversenyen-versenynap-vegso': {
    answer: 91,
    content: {
      hu: {
        problemText: "<p>Egy bicikliversenyen 15 versenynap van, és a végső eredményt úgy határozzák meg, hogy minden versenyzőnek összeadják az egyes napokon elért időeredményeit. A versenyen idén 500 induló volt, és mindenki teljesített minden távot. Albrecht minden nap a hetedik helyen ért célba. Mi a lehetséges legrosszabb eredmény, amelyet elérhetett a versenyen?</p>",
        help1: "Ha Albrecht minden egyes nap megelőzött valakit, akkor jobb az összideje is az övénél. Legfeljebb hány emberre nem igaz, hogy minden nap Albrecht mögött ért be?",
        help2: "Mi történik, ha minden nap elszakad egy hattagú élboly (úgy, hogy senki sem élbolytag kétszer), akik jelentősen leelőzik aznap a többieket?",
      },
    },
  },
  '40xwkkzqd3--papiron-szaz-allitas': {
    answer: 34,
    content: {
      hu: {
        problemText: "<p>Egy papíron az alábbi száz állítás olvasható:</p><p><center><ul style=\"list-style-type:none;\"><li><b>1.</b> Legalább 1 állítás hamis ezen a papíron.<li><b>2.</b> Pontosan 2 állítás igaz ezen a papíron.<li><b>3.</b> Legalább 3 állítás hamis ezen a papíron.<li><b>4.</b> Pontosan 4 állítás igaz ezen a papíron<li>\\(\\vdots\\)<li><b>99.</b> Legalább 99 állítás hamis ezen a papíron.<li><b>100.</b> Pontosan 100 állítás igaz ezen a papíron.</ul></center></p><p>Hány igaz állítás van a papíron?</p>",
        help1: "A páros sorszámúak közül legfeljebb egy igaz. A páratlan sorszámú állítások közül tetszőleges hamis állítás sorszáma magasabb, mint egy igazé, és fordítva.",
        help2: "Van legalább 49 hamis állítás, így az első 25 páratlan igaz. Tehát az utolsó 12 páratlan (77-99) nem lehet igaz, azaz van legalább 61 hamis. Ezzel ismét eldönthetitek néhány páratlan állítás igazságtartalmát, és így folytatva, eljuthattok a megoldásig. Ellenőrizzétek az eredményt!",
      },
    },
  },
  'hxmaftsf9w--mennyit-cel-osztva': {
    answer: 1963,
    content: {
      hu: {
        problemText: "<p>Mennyit ad 2019-cel osztva maradékul az alábbi kifejezés?</p><p> \\(0-1-2+3-4+5+6+7-8+...+2019\\)<br><i>A negatív előjelű tagok pontosan a kettő hatványok.</i></p>",
        help1: "Az 1+2+...+2019 összeg maradékát tudjátok. Mit kell ebből kivonni?",
        help2: "A maradék: -2&sdot;(1+2+4+...1024) = &hellip; Adjátok össze a kettő hatványait! Ez milyen 2019-es maradéknak felel meg?",
      },
    },
  },
  'ikdd6o0w6n--miskolci-villamos-tiszai': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>A miskolci 1-es villamos a Tiszai pályaudvartól közlekedik Felső-Majláthig, míg a 2-es villamos a Tiszai pályaudvartól a Vasgyárig közlekedik. A Tiszai-pályaudvartól minden \\(10k\\) és \\(10k + 6\\) alakú percben indul egy 1-es villamos, míg minden \\(10k + 3\\) alakú percben indul egy 2-es villamos a másik végállomás fele. A villamosra váró utasok közt háromféle található, van aki csak az 1-es villamosra száll fel, van aki csak a 2-es villamosra száll fel, és van aki bármelyik villamosra felszáll. Azt tudjuk, hogy egy adott típusú utasból minden percben ugyanannyi érkezik az állomásra. Ezenkívül azt is tudjuk, hogy minden villamos ugyanannyi utassal indul el a Tiszai pályaudvarról, és mindegyik utas, akinek az megfelelő, azonnal fel is száll rá. Hány utassal szokott elindulni egy villamos a végállomásról, ha 1 perc alatt 3 olyan utas érkezik, akinek csak a 2-es villamos jó?</p>",
        help1: "Jelölje <em>x</em> azon utasok számát, akiknek csak az egyes jó, <em>y</em> azoknak az utasoknak a számát, akiknek mindkettő. Írjatok fel egyenleteket, hogy melyik villamossal hányan mennek!",
        help2: "Gondoljátok meg, hogy minden 10<em>k</em>+6. percben induló villamosra éppen 6 perce várnak azok, akiknek csak az 1-es jó, és pontosan 3 perce azok, akiknek mindkettő. Erre tehát <em>6x+3y</em> utas fog felszállni.<br>A másik kétfajta villamos utasainak számára hasonló kifejezéseket kaptok, és ezek mind egyenlők egymással.",
      },
    },
  },
  's1tszjaxr5--termeszetes-szamot-szep': {
    answer: 1001,
    content: {
      hu: {
        problemText: "<p>Egy természetes számot <i>szép</i>nek nevezünk, ha elő tudjuk állítani úgy, hogy egy \\(n\\) számból kivonjuk az \\(n\\) szám számjegyeinek összegét. (Tehát például a 27 szép, mert előáll többek között \\(34-3-4=27\\) alakban.) Hány <i>szép</i> szám van 0-tól 10000-ig?</p>",
        help1: "Egy szám számjegyeinek összege ugyanannyi maradékot ad 9-cel osztva, mint a szám, ezért a különbségük csak kilenccel osztható szám lehet.<br>A 90 vajon <i>szép</i>? 10000-ig melyik a legnagyobb <i>szép</i> szám?",
        help2: "A legtöbb ilyen szám előáll egy legfeljebb négyjegyű <em>abcd</em> számból, vagyis <em>999a+99b+9c</em> alakban, ahol <em>a, b, c</em> tetszőleges tízes számrendszerbeli számjegyek. Hány ilyen szám van?",
      },
    },
  },
  'xgqm8vyi2c--szamitsatok-haromszog-szoget': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Számítsátok ki az \\(ABC\\) háromszög \\(BAC\\) szögét, ha az harmada a \\(BOC\\) szögnek, ahol \\(O\\) a háromszögbe írható kör középpontja!</p>",
        help1: "Hogyan függ a beírt kör melletti szög mérete a háromszög csúcsában lévő szög nagyságából? Számoljátok ki a szögeket a szögfelezők segítségével!",
        help2: "BOC&ang;=180&deg;-(&beta;+&gamma;)/2 = 3&alpha;. (A háromszög belső szögeinek összege 180&deg;.)",
      },
    },
  },
  '9o046l1rhk--leirtuk-egymas-sorban': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Leírtuk egymás után egy sorban 1-től 100000-ig a természetes számokat. Milyen hosszú a leghosszabb olyan számjegysorozat a kapott szövegben, amely egynél többször fordul elő benne?</p>",
        help1: "Ha egy szám azonos számjegyekből áll, akkor ő és a környezete az eggyel kisebb nagyságrendnél is hasonlóan néz ki. Keressetek ilyen példákat!",
        help2: "Ha lehetne 12 hosszú sorozat, akkor az n és k-jegyű számoknál fordul elő. Ha n=k, akkor lenne olyan nem egyes helyiérték, ami kétszer változik egymás melletti számokban, vagy lenne nagyságrendváltás. Ha n>k, akkor egy számjegyre kijön, hogy a és a+1-nek is kéne lennie. Ezekről leellenőrizhető, hogy nem jók.",
      },
    },
  },
  'ajjqng92tu--paralelogramma-oldalan-kivalasztottunk': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Egy \\(ABCD\\) paralelogramma minden oldalán kiválasztottunk egy-egy pontot, legyenek ezek \\(P\\), \\(Q\\), \\(R\\) és \\(S\\). Ezután az ábra szerinti szakaszok behúzásával tartományokra osztottuk a négyszöget. A szürke színű részek területét ismerjük (lásd ábra). Mekkora a ?-lel jelölt rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_C_14.png",
        help1: "Használjátok fel, hogy a paralelogramma területe <em>alap&lowast;magasság</em>, míg a háromszögé <em>alap&lowast;magasság/2</em>.",
        help2: "Az azonos oldalhoz tartozó háromszögek területének összege a paralelogramma területének a fele. Ekkor két szomszédos oldalon álló háromszögek területösszegeire felírhattok egy egyenlőséget, amiből megkaphatjátok a keresett területet.",
      },
    },
  },
  'umrwatboa2--sorba-rendezni-szamokat': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet sorba rendezni az 1, 2, 3, \\(\\dots\\), 7 számokat úgy, hogy minden szám nagyobb legyen, mint a kettővel és a hárommal utána következő (amennyiben van még kettővel vagy hárommal utána szám)?</p>",
        help1: "<em>n</em> = 1, 2, 3, &hellip;-ra mi lenne a megoldás?<br>Ha a 7 nem a bal szélső helyre kerül, akkor mi a helyzet a 6-tal, hova kell kerülnie? Bontsátok esetekre a feladatot!",
        help2: "Vezessétek vissza az <em>n</em>=7 esetet kisebb esetekre! Az előző segítség alapján vagy 7-tel kezdődik a sorozat; vagy pedig 6-gyel kezdődik, de akkor őt közvetlenül a 7-nek kell követnie.",
      },
    },
  },
  '8qfyioiw56--eljutni-pontbol-pontba': {
    answer: 392,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet eljutni a \\((-4,0)\\) pontból a \\((4,0)\\) pontba úgy, hogy az út az egészek rácshálóján halad, hossza 16, és nem érint olyan \\((x, y)\\) pontpárt, amelyre \\(|x|+|y|\\leq3\\)?</p>",
        help1: "Rajzoljatok ábrát, és jelöljétek be rajta a tiltott pontokat. Ezután sorban írjátok oda mindegyik nem tiltott ponthoz, hogy a kezdőpontból hányféleképpen tudtok eljutni oda!",
        help2: "Az út során nem léphettek visszafelé. Vagy felfelé, vagy lefelé kell indulnotok.<br><i>Például a (-2, 3) pontba összesen 3+2=5 féleképpen juthattok, hiszen 3-féleképpen juthattok el a tőle balra levő, és 2-féleképpen az alatta levő rácspontról.</i>",
      },
    },
  },
  'mvoe3cbvki--csucsu-sokszognek-szoge': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Egy 12 csúcsú sokszögnek legfeljebb hány 90&deg;-os szöge lehet?<br><i>Az oldalak nem metszhetik egymást, és a belső szögnek kell 90&deg;-osnak lennie. Az ábrán látható hétszögnek például 4 darab 90&deg;-os szöge van az <em>A</em>, <em>B</em>, <em>F</em> és <em>G</em> csúcsoknál.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_D_1.png",
        help1: "Egy sokszög belső szögei kisebbek 360&deg;-nál. Mennyi egy tizenkétszög belső szögeinek összege?",
        help2: "Ha a sokszögnek lehetne akár 11 derékszöge, akkor hány fokosnak kellene lennie a tizenkettedik szögnek?",
      },
    },
  },
  'qlmborl25q--szabalyos-hatszog-oldalt': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Adott egy \\(A_{1}A_{2}A_{3}A_{4}A_{5}A_{6}\\) szabályos hatszög. Az \\(A_{i}A_{i+1}\\) oldalt meghosszabbítjuk az \\(A_{i+1}\\) csúcs felé, a végpont legyen \\(A′_{i}\\) úgy, hogy \\(A_{i+1}\\) legyen az \\(A_{i}A′_{i}\\) szakasznak az \\(A_{i}\\)-hez közelebbi harmadolópontja (\\(1\\leq i\\leq 6\\), \\(A_{7}=A_{1}\\)). Mekkora a területe az \\(A′_{1}A′_{2}A′_{3}A′_{4}A′_{5}A′_{6}\\) hatszögnek, ha az eredeti hatszög területe egységnyi?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_D_2.png",
        help1: "Osszátok 6 egybevágó kis háromszögre a kisebb szabályos hatszöget a középpontjából induló szakaszokkal! Határozzátok meg egy kis- és egy nagy háromszög területének arányát.",
        help2: "Egy nagy háromszög alapja és magassága közül az egyik duplája, a másik triplája a vele oldalszomszédos kis háromszög alapjának, illetve magasságának.",
      },
    },
  },
  'nshx60l9xx--szamitsatok-haromszog-szoget': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Számítsátok ki az \\(ABC\\) háromszög \\(BAC\\) szögét, ha az harmada a \\(BOC\\) szögnek, ahol \\(O\\) a háromszögbe írható kör középpontja!</p>",
        help1: "Idézzétek fel, hogyan függ a beírt kör melletti szög mérete a háromszög csúcsában lévő szög nagyságából (számoljatok szögeket a szögfelezők segítségével)!",
        help2: "BOC&ang;=180&deg;-(&beta;+&gamma;)/2 = 3&alpha;. (A háromszög belső szögeinek összege 180&deg;.)",
      },
    },
  },
  'b5o9rs1owj--miskolci-villamos-tiszai': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>A miskolci 1-es villamos a Tiszai pályaudvartól közlekedik Felső-Majláthig, míg a 2-es villamos a Tiszai pályaudvartól a Vasgyárig közlekedik. A Tiszai-pályaudvartól minden \\(10k\\) és \\(10k + 6\\) alakú percben indul egy 1-es villamos, míg minden \\(10k + 3\\) alakú percben indul egy 2-es villamos a másik végállomás fele. A villamosra váró utasok közt háromféle található, van aki csak az 1-es villamosra száll fel, van aki csak a 2-es villamosra száll fel, és van aki bármelyik villamosra felszáll. Azt tudjuk, hogy egy adott típusú utasból minden percben ugyanannyi érkezik az állomásra. Ezenkívül azt is tudjuk, hogy minden villamos ugyanannyi utassal indul el a Tiszai pályaudvarról, és mindegyik utas, akinek az megfelelő, azonnal fel is száll rá. Hány utassal szokott elindulni egy villamos a végállomásról, ha 1 perc alatt 3 olyan utas érkezik, akinek csak a 2-es villamos jó?</p>",
        help1: "Jelölje <em>x</em> azon utasok számát, akiknek csak az egyes jó, <em>y</em> azoknak az utasoknak a számát, akiknek mindkettő. Írjatok fel egyenleteket, hogy melyik villamossal hányan mennek!",
        help2: "Gondoljátok meg, hogy minden 10<em>k</em>+6. percben induló villamosra éppen 6 perce várnak azok, akiknek csak az 1-es jó, és pontosan 3 perce azok, akiknek mindkettő. Erre tehát <em>6x+3y</em> utas fog felszállni.",
      },
    },
  },
  'b99cnvbzgw--szamjegybol-all-legkisebb': {
    answer: 81,
    content: {
      hu: {
        problemText: "<p>Hány számjegyből áll 81-nek azon legkisebb többszöröse, amelynek minden számjegye 1-es?</p>",
        help1: "Mi lenne, ha a feladat 81 helyett 9-cel lenne feladva?",
        help2: "A csupaegyes számok közül minden kilencedik osztható 9-cel. Hogyan változik a 81-es maradékuk?",
      },
    },
  },
  'safw0wwtra--paralelogramma-oldalan-kivalasztottunk': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Egy \\(ABCD\\) paralelogramma minden oldalán kiválasztottunk egy-egy pontot, legyenek ezek \\(P\\), \\(Q\\), \\(R\\) és \\(S\\). Ezután az ábra szerinti szakaszok behúzásával tartományokra osztottuk a négyszöget. A szürke színű részek területét ismerjük (lásd ábra). Mekkora a ?-lel jelölt rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_D_11.png",
        help1: "Használjátok fel, hogy a paralelogramma területe <em>alap&lowast;magasság</em>, míg a háromszögé <em>alap&lowast;magasság/2</em>.",
        help2: "Az azonos oldalhoz tartozó háromszögek területének összege a paralelogramma területének a fele. Ekkor két szomszédos oldalon álló háromszögek területösszegeire felírhattok egy egyenlőséget, amiből megkaphatjátok a keresett területet.",
      },
    },
  },
  '9m7j21zo64--sakktablan-babu-elindul': {
    answer: 56,
    content: {
      hu: {
        problemText: "<p>Egy \\(8x8\\)-as sakktáblán egy bábu elindul valamely mezőről. Egy mezőről csak vele szomszédos mezőre léphet. Minden mezőt egyszer érint, végül visszajut a kiindulási mezőre. Legfeljebb hányszor változtat irányt útja során?</p>",
        help1: "Találjatok minél cikcakkosabb konstrukciót! Vizsgáljátok meg a görbét a sarkokban!",
        help2: "Nézzétek meg kisebb táblákon is a feladatot, például 4&times4-esen vagy 6&times;6-oson!",
      },
    },
  },
  'spvztyv0lz--jojo-barmely-szomszedos': {
    answer: 244,
    content: {
      hu: {
        problemText: "<p>Egy \\(n\\) pozitív egész pontosan akkor <i>jojó</i>, ha bármely két szomszédos számjegye között a különbség legalább 7. Határozzátok meg a hatjegyű jojó számok számát!</p>",
        help1: "Osszátok a számjegyeket kicsikre és nagyokra. Ha egy szám <i>jojó</i>, akkor benne ez a két számjegytípus váltakozik.",
        help2: "Rekurzívan számoljátok meg a <i>jojó</i> számokat, a jegyeik száma szerint növekvően! Ha például egy <em>n</em>-jegyű <i>jojó</i> szám 1-gyel kezdődik, akkor a szám vége egy tetszőleges, 8-cal vagy 9-cel kezdődő, <em>n-1</em>-jegyű <i>jojó</i> szám, amelyeknek a számát a táblázat eggyel korábbi oszlopában találjátok meg.<br><i>Az egyes 0-9, 1-8 és 2-7 számpárok tagjai lényegében ugyanúgy viselkednek.</i>",
      },
    },
  },
  '9wwb5zszem--szamok-osszege-amelyeknek': {
    answer: 7282,
    content: {
      hu: {
        problemText: "<p>2397 azon pozitív egész számok összege, amelyeknek pontosan 2 valódi osztójuk van, és ráadásul ezek kisebbek, mint 30. Mennyi azoknak a pozitív egész számoknak az összege, amelyeknek pontosan 3 valódi osztójuk van, és ráadásul ezek kisebbek, mint 30?<br><i>Valódi osztó alatt olyan pozitív egészeket értünk, amelyek osztják az adott számot, de különböznek tőle.</i></p>",
        help1: "Milyen alakú számoknak van pontosan három valódi osztója (azaz összesen négy osztója)?",
        help2: "Vagy köbszámok, vagy két különböző prím szorzataként állnak elő. Utóbbiakat célszerű csoportosítanotok, hogy gyorsabban végezzetek. (Például mit kezdhettek a 30-nál kisebb prímek összegével?). Figyelmesen számoljátok a köbszámokat is!",
      },
    },
  },
  'gzrm9ggg2p--tompaszogu-egyenloszaru-haromszog': {
    answer: 108,
    content: {
      hu: {
        problemText: "<p>Egy tompaszögű egyenlőszárú háromszög két belső szögfelezője közül a hosszabbik kétszerese a rövidebbiknek. Mekkora a háromszög legnagyobb szöge?</p>",
        help1: "Hosszabbítsátok meg a háromszög egyik szárát, és egészítsétek ki egy nagyobb háromszöggé! Vegyétek figyelembe, hogy a háromszög rövidebb szögfelezője felezi az alapot, és fele olyan hosszú, mint a hosszabb szögfelezők.<br><i>(A szögfelező-tétel bizonyítása is adhat ötletet.)</i>",
        help2: "A meghosszabbított szárt metsszétek el az alap végpontjába állított merőlegessel! Ez egy derékszögű háromszög befogója. Az eredeti háromszög rövidebb szögfelezője egy nevezetes vonal ebben a derékszögű háromszögben is. Betűzzétek meg valamelyik szöget, és fejezzétek ki vele a többit!",
      },
    },
  },
  '6mws48r9tf--egyenloszaru-haromszog-letezik': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Hány olyan nem egyenlőszárú háromszög létezik, melynek oldalai egész számok, és a két rövidebb oldalának összhossza 19 egység?</p>",
        help1: "Használjátok a háromszög-egyenlőtlenséget.",
        help2: "Bontsátok esetekre a feladatot a háromszögek legnagyobb oldalhossza szerint.",
      },
    },
  },
  't3z38u7681--anna-leirta-osszes': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Anna leírta az összes kétjegyű szám 588-szorosát. Hány esetben kapott Anna négyzetszámot?</p>",
        help1: "Keressétek meg az 588 prímtényezős felbontását.",
        help2: "Az 588 négyzetmentes hányadát csak négyzetszámmal szorozva kaphatunk megoldást.",
      },
    },
  },
  '5d64c3b6h1--lapon-darab-tol': {
    answer: 1010,
    content: {
      hu: {
        problemText: "<p>Van egy lapon 2019 darab, 1-től 2019-ig számozott állításunk. Az \\(n\\)-edik állítás így szól: \"Ezen a lapon legfeljebb \\(n\\) állítás igaz\". Hány igaz állítás szerepel a lapon?</p>",
        help1: "Ha a lapon pontosan <em>n</em> igaz állítás van, akkor az <em>n</em>edik és annál nagyobb sorszámú állítások igazak, a kisebbek pedig hamisak.",
        help2: "Fejezzétek ki <em>n</em>-nel az igaz és a hamis állítások számát!",
      },
    },
  },
  'wfapu4jlao--miskolci-villamos-tiszai': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>A miskolci 1-es villamos a Tiszai pályaudvartól közlekedik Felső-Majláthig, míg a 2-es villamos a Tiszai pályaudvartól a Vasgyárig közlekedik. A Tiszai-pályaudvartól minden \\(10k\\) és \\(10k + 6\\) alakú percben indul egy 1-es villamos, míg minden \\(10k + 3\\) alakú percben indul egy 2-es villamos a másik végállomás fele. A villamosra váró utasok közt háromféle található, van aki csak az 1-es villamosra száll fel, van aki csak a 2-es villamosra száll fel, és van aki bármelyik villamosra felszáll. Azt tudjuk, hogy egy adott típusú utasból minden percben ugyanannyi érkezik az állomásra. Ezenkívül azt is tudjuk, hogy minden villamos ugyanannyi utassal indul el a Tiszai pályaudvarról, és mindegyik utas, akinek az megfelelő, azonnal fel is száll rá. Hány utassal szokott elindulni egy villamos a végállomásról, ha 1 perc alatt 3 olyan utas érkezik, akinek csak a 2-es villamos jó?</p>",
        help1: "Jelölje <em>x</em> azon utasok számát, akiknek csak az egyes jó, <em>y</em> azoknak az utasoknak a számát, akiknek mindkettő. Írjatok fel egyenleteket, hogy melyik villamossal hányan mennek!",
        help2: "Gondoljátok meg, hogy minden 10<em>k</em>+6. percben induló villamosra éppen 6 perce várnak azok, akiknek csak az 1-es jó, és pontosan 3 perce azok, akiknek mindkettő.",
      },
    },
  },
  'yxzbvwkaib--szamot-adhatunk-semelyik': {
    answer: 1010,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány pozitív egész számot adhatunk meg úgy, hogy semelyik kettő összege és különbsége se legyen osztható 2019-cel?</p>",
        help1: "Nézzétek meg kisebb egészekre, és általánosítsátok az eredményt!",
        help2: "Minden 2019-es maradékú számból csak egy-egy választható, illetve az egymást 2019-re kiegészítő maradék-párokból is csak az egyik maradék választható ki. Mi a helyzet a 0-val?",
      },
    },
  },
  'x6vjjuq205--szamjegybol-all-legkisebb': {
    answer: 81,
    content: {
      hu: {
        problemText: "<p>Hány számjegyből áll a 81-nek az a legkisebb többszöröse, amelynek minden számjegye 1-es?</p>",
        help1: "Mi lenne, ha a feladat 81 helyett 9-cel lenne feladva?",
        help2: "A csupaegyes számok közül minden kilencedik osztható 9-cel. Hogyan változik a 81-es maradékuk?",
      },
    },
  },
  'i1pjdf9gkp--paralelogramma-oldalan-kivalasztottunk': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Egy \\(ABCD\\) paralelogramma minden oldalán kiválasztottunk egy-egy pontot, legyenek ezek \\(P\\), \\(Q\\), \\(R\\) és \\(S\\). Ezután az ábra szerinti szakaszok behúzásával tartományokra osztottuk a négyszöget. A szürke színű részek területét ismerjük (lásd ábra). Mekkora a ?-lel jelölt rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_E_7.png",
        help1: "Használjátok fel a paralelogramma és a háromszög területképletét!",
        help2: "A paralelogramma két szomszédos oldalán álló háromszögek területösszegei milyen kapcsolatban állnak egymással?",
      },
    },
  },
  'jk8423y8ya--sakktablan-babu-elindul': {
    answer: 56,
    content: {
      hu: {
        problemText: "<p>Egy \\(8 × 8\\)-as sakktáblán egy bábu elindul valamely mezőről. Egy mezőről csak vele szomszédos mezőre léphet. Minden mezőt egyszer érint, végül visszajut a kiindulási mezőre. Legfeljebb hányszor változtat irányt útja során?</p>",
        help1: "Találjatok minél cikcakkosabb konstrukciót! Vizsgáljátok meg a görbét a sarkokban!",
        help2: "Nézzétek meg kisebb táblákon is a feladatot, például 4&times4-esen vagy 6&times;6-oson!",
      },
    },
  },
  'ul32d0kll2--kockat-felosztottunk-egybevago': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy kockát felosztottunk 27 egybevágó kis kockára. Egy egyenes legfeljebb hány kis kocka belsejébe metszhet bele?</p>",
        help1: "Az egyenes egyszer belép a kockába, egyszer kilép belőle, és közben mind a hat \"vágást\" (síkot) egyszer-egyszer lépheti át.",
        help2: "Mi a keletkező metszéspontok és a metszett kis kockák száma közti összefüggés?",
      },
    },
  },
  'jg9zp0hdj6--tompaszogu-egyenloszaru-haromszog': {
    answer: 108,
    content: {
      hu: {
        problemText: "<p>Egy tompaszögű egyenlőszárú háromszög két belső szögfelezője közül a hosszabbik kétszerese a rövidebbiknek. Mekkora a háromszög legnagyobb szöge?</p>",
        help1: "Egy megfelelő szakasz berajzolása új egyenlő szárú háromszöget hoz létre az ábrán. Azután számoljatok szögeket!",
        help2: "Húzzatok párhuzamost a hosszabb belső szögfelezővel az alap felezőpontjából!",
      },
    },
  },
  'je2yny747x--legkisebb-erteke-kozos': {
    answer: 480,
    content: {
      hu: {
        problemText: "<p>Mi lehet a legkisebb értéke \\(a\\), \\(b\\), \\(c\\), \\(d\\) legkisebb közös többszörösének, ha tudjuk, hogy ez négy különböző szám, és \\(a + b + c + d = 1000\\)?</p>",
        help1: "<em>n</em> négy különböző osztójának összege 1000. Ez <em>n</em>-re alsó korlátot ad.",
        help2: "Egy szám négy legnagyobb különböző osztója a szám, valamint annak fele, harmada és negyede.",
      },
    },
  },
  'vxylbzxccz--sorba-rendezni-szamokat': {
    answer: 987,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet sorba rendezni az 1, 2, 3,  . . . , 15 számokat úgy, hogy mindegyik szám nagyobb legyen, mint a kettővel és a hárommal utána következő (amennyiben van még szám kettővel vagy hárommal utána)?</p>",
        help1: "Ha a 15 nem a bal szélső helyre kerül, akkor mi a helyzet a 14-gyel? Bontsátok esetekre a feladatot!",
        help2: "Vezessétek vissza az <em>n</em>=15 esetet kisebb esetekre, rekurzívan!",
      },
    },
  },
  'qhqvutf5t6--szam-paratlan-tol': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Legyen \\(k\\ge1\\) egy pozitív egész szám és \\(n\\geq2019\\) egy páratlan pozitív szám. A 0-tól különböző, racionális \\(x_1\\), \\(x_2\\), . . . , \\(x_n\\) számok nem mind egyenlőek, és teljesül rájuk a következő:</p><p><center>\\(x_1 + kx_2=x_2+k x_3=x_3+k x_4=\\dots=x_{n-1}+kx_n=x_n+kx_1\\)</center></p><p>Határozzátok meg \\(k\\) lehetséges legkisebb értékét!</p>",
        help1: "Keressétek meg az <em>(x<sub>i+1</sub>-x<sub>i</sub>)</em> alakú kifejezések közötti összefüggést. Az egyenletek összeszorzásával lényeges feltételt kaphattok <em>k</em>-ra.",
        help2: "Az <em>x<sub>i</sub></em>-k szorzatának meghatározása segíthet. Lényeges, hogy <em>n</em> páratlan.",
      },
    },
  },
  'etdkglgwfr--osztalytars-bizonyitvanyosztas-megallapitotta': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Hét osztálytárs a bizonyítványosztás után megállapította, hogy nincs köztük kettő, aki mind a 12 tárgyból ugyanazt az osztályzatot kapta volna. A 12 tárgyból ki lehet választani \\(n\\) olyat, hogy ha csak az ebből az \\(n\\) tárgyból kapott osztályzatokat hasonlítjuk össze, akkor sincs a hét diák közt két olyan, aki mind az \\(n\\) tárgyból ugyanazt a jegyet kapta. Melyik a legkisebb \\(n\\), amelyre ezt még biztosan megtehetjük?</p>",
        help1: "Mennyi lenne a válasz kettő, három, négy, &hellip; osztálytárs esetén?<br>Keressetek példákat arra, hogy <em>n</em> = 2, 3, &hellip; miért nem jók (vagyis olyan példákat, amelyekben semelyik két osztálytárs jegyei nem egyeznek meg teljesen, de ne lehessen úgy kiválasztani <em>n</em> tárgyat, hogy bármely kettő eredményei különbözzenek azokból.)",
        help2: "Az indukciós lépésben nagyon fontos gondolat rejlik. Ha néhány osztálytársat páronként meg tud különböztetni a T tantárgyhalmaz, és csatlakozik hozzájuk egy új osztálytárs, akkor az ő jegyei a T-beli tárgyakból legfeljebb hány másik diák jegyeivel egyezhetnek meg egytől egyig? Ez alapján hány új tárgyat kell bevenni az őket páronként megkülönböztető tárgycsoportba?",
      },
    },
  },
  'liprjweudd--egyenloszaru-haromszog-deg': {
    answer: 102,
    content: {
      hu: {
        problemText: "<p>\\(ABC\\) egyenlőszárú háromszög úgy, hogy \\(AB=AC\\) és \\(BAC\\angle=96\\)&deg. \\(D\\) az a pont, amire \\(ACD\\angle=48\\)&deg , \\(AD=BC\\) és \\(DAC\\) háromszög tompaszögű. Mennyi \\(DAC\\angle\\)?</p>",
        help1: "Bocsássatok merőlegest az <em>A</em> csúcsból a <em>CD</em> egyenesre.",
        help2: "Ez a merőleges szakasz milyen, <em>D</em> felé eső háromszöget vág le az <em>ACD</em> háromszögből?",
      },
    },
  },
  'b6bdwdetj0--kiszinezni-fekete-feherre': {
    answer: 2048,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen tudjuk kiszínezni fekete-fehérre egy \\(6×6\\)-os négyzetrács egységnégyzeteit úgy, hogy minden \\(2×2\\)-es rácsnégyzetben páratlan sok fekete egységnégyzet legyen?</p>",
        help1: "Vizsgáljátok meg 2&times;2-es és 3&times;3-as négyzetekre, majd általánosítsatok!",
        help2: "Töltsétek ki az első sort és az első oszlopot! Mit tapasztaltok?",
      },
    },
  },
  '7s18pqv3mv--szamot-adhatunk-semelyik': {
    answer: 1010,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány pozitív egész számot adhatunk meg úgy, hogy semelyik kettő összege és különbsége se legyen osztható 2019-cel?</p>",
        help1: "Nézzétek meg, hogy egy adott <em>k</em> maradékot adó szám mivel összepárosítva okoz bajt!",
        help2: "Egy <em>k</em> maradékot adó szám <em>k</em> és <em>-k</em> maradékot adó számokat zár ki. Ez alapján 1009 párba oszthatjuk a nemnulla maradékokat. Mi a helyzet a 0-val?",
      },
    },
  },
  'h077pasv35--szamjegybol-all-legkisebb': {
    answer: 81,
    content: {
      hu: {
        problemText: "<p>Hány számjegyből áll 81-nek azon legkisebb többszöröse, amelynek minden számjegye 1-es?</p>",
        help1: "Ha egy szám számjegyeinek összege osztható 9-cel, akkor maga a szám is (és fordítva).",
        help2: "111111111111111111 = 111111111 &sdot; 1000000001, és így tovább.",
      },
    },
  },
  'k9d2w3icr4--haromszogben-belso-pont': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>Egy \\(ABC\\) háromszögben adott egy \\(P\\) belső pont. Behúzzuk az \\(AP\\), \\(BP\\) és \\(CP\\) egyeneseket, ezek az oldalakat 2-2 részre osztják. Az így keletkező 6 oldalrész hossza mind különböző egész szám. Mi a háromszög minimális kerülete?</p>",
        help1: "A Ceva-tételt célszerű alkalmaznotok. Minél kisebb prímek kombinációit írjátok fel!",
        help2: "A 36, mint szorzat egy kis összegre ad konstrukciót. Ha van 5-tel vagy 7-tel osztható hosszúságú rész, akkor el lehet-e érni ennél is kisebb összeget?<br><i>Biztosan létezik háromszög a kapott összegre?</i>",
      },
    },
  },
  'hzfkvwku1i--kockat-felosztottunk-egybevago': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy kockát felosztottunk 27 egybevágó kis kockára. Egy egyenes legfeljebb hány kis kocka belsejébe metszhet bele?</p>",
        help1: "A maximum elérhető egy testátló kis elcsúsztatásával.",
        help2: "Az egyenes egyszer belép a kockába, egyszer kilép belőle, és közben mind a hat \"vágást\" (síkot) egyszer-egyszer lépheti át. Mi az összefüggés a vágásátlépések száma és az elmetszett kis kockák száma között?",
      },
    },
  },
  'm46hmvrhh7--permutacioja-halmaznak-melyre': {
    answer: 987,
    content: {
      hu: {
        problemText: "<p>Hány olyan \\(s\\) permutációja van az \\(\\{1, 2, . . . , 15\\}\\) halmaznak, melyre minden \\(1\\leq k\\leq13\\) esetén \\(s(k)<s(k + 2)\\) és minden \\(1\\leq k\\leq12\\) esetén \\(s(k)<s(k + 3)\\)?</p>",
        help1: "Semelyik szám sem ugorhat egynél többet előre vagy hátra.",
        help2: "Az előző segítség alapján a permutáció felcserél néhány szomszédos párt, a maradékot pedig helybenhagyja. Az ilyen permutációk számát néhány binomiális együttható segítségével kifejezhetitek.",
      },
    },
  },
  'vi9irb49d3--paralelogramma-oldalan-kivalasztottunk': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Egy \\(ABCD\\) paralelogramma minden oldalán kiválasztottunk egy-egy pontot, legyenek ezek \\(P\\), \\(Q\\), \\(R\\) és \\(S\\). Ezután az ábra szerinti szakaszok behúzásával tartományokra osztottuk a négyszöget. A szürke színű részek területét ismerjük (lásd ábra). Mekkora a ?-lel jelölt rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_D_Ep_6.png",
        help1: "Vizsgáljátok a <em>(CSQ, QAB)</em>, illetve az <em>(ADP, PRB)</em> háromszögpárok összterületeit és azok különbségét!",
        help2: "Az egyes háromszögpárok által fedett négy-négy szürke terület összegei egyenlők egymással.",
      },
    },
  },
  'vcyzm42fy6--legkisebb-amelyre-tol': {
    answer: 63,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb \\(n\\) pozitív egész, amelyre 1-től \\(10^n\\) -ig az összes egész szám összes nem <em>0</em> számjegyének a reciprokait összeadva egész számot kapunk?</p>",
        help1: "Mindegyik számjegy összesen ugyanannyiszor fordul elő. Számoljátok meg, hányszor!",
        help2: "Az egyes számjegyek reciprokösszegét közös nevezőre hozva, a nevező 2520. A szorzatban ennek a 2-es és 5-ös osztóit a tízesek megeszik. Mi marad?",
      },
    },
  },
  'n2f51xuyrv--amelyre-ugyanarra-jegyre': {
    answer: 9376,
    content: {
      hu: {
        problemText: "<p>Legyen \\(N\\) pozitív egész, amelyre \\(N\\) és \\(N^2\\) ugyanarra a 4 jegyre, \\(\\overline{abcd}\\)-re végződik, ahol \\(a\\neq0\\). Mennyi az \\(\\overline{abcd}\\) 4-jegyű szám?</p>",
        help1: "Vonjátok ki <em>abcd</em> négyzetéből önmagát, <em>abcd</em>-t!",
        help2: "A kapott különbség szorzattá alakítható, és osztható 10000-rel. Két eset van aszerint, hogy melyik szorzótényező az, amelyik 625-tel osztható. Az egyik esetben csak háromjegyű számot kapnátok.",
      },
    },
  },
  'ntl58fsoy7--tudunk-kiszinezni-fekete': {
    answer: 2048,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen tudunk kiszínezni fekete-fehérre egy \\(6×6\\)-os négyzetrácsot úgy, hogy minden \\(2×2\\)-es négyzetben páratlan sok fekete négyzet legyen?</p>",
        help1: "Vizsgáljátok meg 2&times;2-es és 3&times;3-as négyzetekre, majd általánosítsatok!",
        help2: "Találjatok olyan mezőhalmazt, amely mezők bármely színkombinációja meghatározza az összes többi mező színét is!",
      },
    },
  },
  'po561fyb8j--legkisebb-erteke-kozos': {
    answer: 480,
    content: {
      hu: {
        problemText: "<p>Mi lehet a legkisebb értéke \\(a\\), \\(b\\), \\(c\\), \\(d\\) legkisebb közös többszörösének, ha tudjuk, hogy ez négy különböző szám, és \\(a+b+c+d=1000\\)?</p>",
        help1: "Becsüljétek a négy számot a legkisebb közös többszöröshöz képest!",
        help2: "Ha a legkisebb közös többszörös 60, akkor lehet-e 180 a négy szám legnagyobbika?",
      },
    },
  },
  'oivr8pql4x--legkisebb-amelyre-oszthato': {
    answer: 504,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb \\(N\\) pozitív egész, amelyre</p><p><center>\\(\\sum_{k=1}^N k^{2018}\\)</center></p><p>osztható 2018-al?</p>",
        help1: "Ellenőrizzétek a paritást és az 1009-es oszthatóságot! Alkalmazzátok a kis-Fermat-tételt!",
        help2: "A <em>k</em>-hatványok <em>k</em>-val megegyező paritásúak. Az 1009-es oszthatósághoz pedig a négyzetek összegét vizsgáljátok (a kis-Fermat-tétel alapján).<br>Az összegképlet alapján megkaphatjátok a legkisebb megfelelő <em>N</em> értéket.",
      },
    },
  },
  'knm12ds9ef--kulonbozo-nemkonstans-polinom': {
    answer: 6361,
    content: {
      hu: {
        problemText: "<p>\\(P\\) és \\(Q\\) két különböző, nemkonstans polinom úgy, hogy \\(P(Q(x)) = P(x)Q(x)\\) és \\(P(1) = P(-1) = 2019\\). Mi az utolsó négy számjegye \\(Q(P(-1))\\)-nek?</p>",
        help1: "Tekintsétek a két oldal fokszámát az egyenletben. Mi derül ki belőle?",
        help2: "<em>P</em>-t egy paramétertől függően meg lehet határozni. <em>Q</em>-t írjátok fel ismeretlen együtthatókkal, majd egyeztessétek azokat az első egyenlet alapján.<br>A konstansoknál segít, ha az <em>af<sup>2</sup></em> tagot igyekeztek kiküszöbölni.",
      },
    },
  },
  'j10qydl707--elhelyeztunk-korben-szamozott': {
    answer: 2597,
    content: {
      hu: {
        problemText: "<p>Elhelyeztünk körben 12 számozott széket. Hányféleképpen lehet néhányat megjelölni úgy, hogy legyen köztük legalább 3 szomszédos megjelölt szék?</p>",
        help1: "Kör esetén ezt nehéz kiszámolni, ezért valahol \"vágjátok fel\" a kört! Bontsátok diszjunkt esetekre a lehetőségeket aszerint, hogy a vágáson átlóg-e \"megjelölt székhármas\", és ha igen, akkor milyen elrendezésben.",
        help2: "<em>n</em> darab, egy vonalban levő széknél rekurzívan írjátok fel az eseteket, például a bal szélső három szék jelölései alapján!<br><i>A kör elvágására példa: az 1. széknél vágunk. Egy eset az, amikor a 12. nincs jelölve, de az 1., a 2. és a 3. is jelölt.</i>",
      },
    },
  },
  'popasexc8g--egeszek-halmaza-kisebbek': {
    answer: 6248,
    content: {
      hu: {
        problemText: "<p>Legyen \\(\\mathcal{S}\\) azon pozitív egészek halmaza, amelyek kisebbek, mint 10000, illetve a 2-es számrendszerbeli utolsó 4 számjegye megegyezik az 5-ös számrendszerbeli utolsó 4 számjeggyel. Határozzátok meg az \\(\\mathcal{S}\\)-beli elemek összegének 10000-rel vett osztási maradékát!</p>",
        help1: "Minden ilyen négy hosszú 0-1 sorozat egyértelműen megad egy modulo 10000 számot (a kínai maradéktétel alapján). A halmazunk tehát 16 elemű.",
        help2: "Az összeg maradéka a maradékok összege. Mennyi az összeg 625-ös maradéka?",
      },
    },
  },
  'zb9qry7euh--amelyhez-leteznek-nemnegativ': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Hány olyan \\(m\\) pozitív egész van, amelyhez léteznek \\(x_0\\), \\(x_1\\), ..., \\(x_1001\\) nemnegatív egészek úgy, hogy </p><p> <center>\\(m^{x_0}=\\sum_{i=1}^{1001}m^{x_i}\\)?</center></p>",
        help1: "<em>m</em>-nek egy nagyon lényeges tulajdonságát deríthetitek ki, ha egy alkalmas modulus szerint vizsgáljátok az egyenletet.",
        help2: "A mod <em>m-1</em>-es maradékot nézzétek! Mennyi lehet ez alapján <em>m</em>? Keressetek konstrukciót a nem kizárt <em>m</em>-ek esetén!",
      },
    },
  },
  'u9e8wojbhr--haromszog-oldalai-egyseg': {
    answer: 389,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög oldalai 13, 14 és 15 egység hosszúak. Legyen \\(k\\), \\(k_A\\), \\(k_B\\), \\(k_C\\) négy darab \\(r\\) sugarú kör a háromszög belsejében úgy, hogy \\(k_A\\) érinti az \\(AB\\) és \\(AC\\) oldalt, \\(k_B\\) érinti a \\(BA\\) és \\(BC\\) oldalt, \\(k_C\\) érinti a \\(CA\\) és \\(CB\\) oldalt, és \\(k\\) kívülről érinti a \\(k_A\\), \\(k_B\\), \\(k_C\\) köröket. Legyen \\(r = \\frac{m}n\\) , ahol \\(m\\) és \\(n\\) relatív prím pozitív egészek. Mennyi \\(m + n\\)?</p>",
        help1: "Nagyítsatok a beírt kör középpontjából!",
        help2: "Mekkorák a két hasonló háromszög beírt és köréírt köreinek sugarai? A nagy háromszögnek adottak az oldalai, így a fontos mennyiségeket ki tudjátok számolni belőlük. Felírva a hasonlóságot, célba értek!",
      },
    },
  },
};
