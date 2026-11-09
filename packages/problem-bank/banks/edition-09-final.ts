import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 9's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'e25esz2zpi--09-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'gpjrjv2s70--akos-osztalyaba-ketszer', points: 3 },
        { problemId: '202vt659jj--erdei-allatok-szavazast', points: 3 },
        { problemId: 'p40aqoujtv--szallodaban-szoba-fekvohellyel', points: 3 },
        { problemId: 'irk560zea0--durer-konyvet-oldalszamokban', points: 3 },
        { problemId: 'pgy8zv1ulh--gondoltam-ketjegyu-szamra', points: 4 },
        { problemId: '5bithowzmx--gomboc-artur-csokoladekat', points: 4 },
        { problemId: 'hf24i0njai--osztalyba-tanulo-jar', points: 4 },
        { problemId: '4ri26iyy2q--kovetkezo-szorzasban-szamjegy', points: 4 },
        { problemId: '60l0i5rvck--feljutni-bal-also', points: 5 },
        { problemId: 'qbhkvelzmh--haromjegyu-szam-amiben', points: 5 },
        { problemId: '7b58g71dr3--tablara-felirtunk-nehany', points: 5 },
        { problemId: 'cxgeht1zs5--negyzetet-papirbol-vagtuk', points: 5 },
        { problemId: 'vkhw5gjjax--haromjegyu-szam-otszorose', points: 6 },
        { problemId: 'zo61powg1r--fekete-resz-terulete', points: 6 },
        { problemId: 'pm6l0ltk1s--nagykockat-raktunk-ossze', points: 6 },
        { problemId: 'buwpn88u3y--hercegnot-elrabolnak-rabloi', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'final', category: 'A' },
  },
  '1dto5izqmt--09-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '41xvj4u4sj--szallodaban-szoba-fekvohellyel', points: 3 },
        { problemId: 'fbpoddopvs--legkisebb-szam-mal', points: 3 },
        { problemId: 'y0k1liawm0--durer-versenyen-regisztraciokor', points: 3 },
        { problemId: '4ri26iyy2q--kovetkezo-szorzasban-szamjegy', points: 3 },
        { problemId: 'qr0pfghdyp--bandi-bacsi-pincejeben', points: 4 },
        { problemId: '85zff3n0w0--feljutni-bal-also', points: 4 },
        { problemId: 'jq1p9bz37u--kocka-kiskockakbol-all', points: 4 },
        { problemId: '7b58g71dr3--tablara-felirtunk-nehany', points: 4 },
        { problemId: 'rcwy398uhh--fal-menten-pontban', points: 5 },
        { problemId: '9ljotwfq3j--utolso-szamjegye', points: 5 },
        { problemId: 'ypyh7tm7i4--vegzodik-tizes-szamrendszerbeli', points: 5 },
        { problemId: 'irz03uxch4--koordinata-rendszerben-durer', points: 5 },
        { problemId: 'fi54ep8tcm--osszeszoroztunk-egymast-azonos', points: 6 },
        { problemId: 'bdmobw4sm3--idos-holgy-mindegyike', points: 6 },
        { problemId: 'wpadvullr3--nehany-szam-osszege', points: 6 },
        { problemId: 'kc640dpd3u--kovetkezo-osszeadasban-kulonbozo', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'final', category: 'B' },
  },
  '5hh97hg21t--09-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '7knwmkucdk--macska-liter-tejet', points: 3 },
        { problemId: '36whhgy8hx--feljutni-bal-also', points: 3 },
        { problemId: 'n0lnnst97s--kor-keruletere-felirjuk', points: 3 },
        { problemId: 'q361l08n5j--fal-menten-pontban', points: 3 },
        { problemId: 's2ux1q2aep--papir-rovidebb-oldala', points: 4 },
        { problemId: 'v52p8e6mkx--jeloljuk-huszart-elhelyezni', points: 4 },
        { problemId: 'nxtlnm9ud5--oldalu-konvex-sokszog', points: 4 },
        { problemId: '4i4eonlhic--budapest-miskolc-kozotti', points: 4 },
        { problemId: 'wtkcavy62h--osszeg-letezik-felekeppen', points: 5 },
        { problemId: 'hy4q9rdtln--reszre-osztja-sikot', points: 5 },
        { problemId: '14fm5dr6vo--szamokat-tartalmazo-halmaz', points: 5 },
        { problemId: 'awi2sej6mw--legnagyobb-haromjegyu-szam', points: 5 },
        { problemId: '94jkfo07i6--kockat-tukroztunk-valamilyen', points: 6 },
        { problemId: 'g40ck9xz8d--negyzet-alapu-gulanak', points: 6 },
        { problemId: '8gd664rpk8--albert-berta-jatekot', points: 6 },
        { problemId: '18jm4ehh5l--egeszekbol-allo-szampar', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'final', category: 'C' },
  },
  '5z7b62112w--09-final-c-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'd3e4rwd2w8--papir-rovidebb-oldala', points: 3 },
        { problemId: 'v52p8e6mkx--jeloljuk-huszart-elhelyezni', points: 3 },
        { problemId: 'cqn30yh88c--oldalu-konvex-sokszog', points: 3 },
        { problemId: '4i4eonlhic--budapest-miskolc-kozotti', points: 3 },
        { problemId: 'wtkcavy62h--osszeg-letezik-felekeppen', points: 4 },
        { problemId: 'hy4q9rdtln--reszre-osztja-sikot', points: 4 },
        { problemId: '14fm5dr6vo--szamokat-tartalmazo-halmaz', points: 4 },
        { problemId: 'awi2sej6mw--legnagyobb-haromjegyu-szam', points: 4 },
        { problemId: '0s9hicjut1--kockat-tukroztunk-valamilyen', points: 5 },
        { problemId: 'vjdv3nq38h--negyzet-alapu-gulanak', points: 5 },
        { problemId: 'nznhg3hh6e--albert-berta-jatekot', points: 5 },
        { problemId: '18jm4ehh5l--egeszekbol-allo-szampar', points: 5 },
        { problemId: 'io9ccdo457--maracana-stadion-egyik', points: 6 },
        { problemId: '0j2l45pbne--idei-olimpiara-abszurdisztan', points: 6 },
        { problemId: '7ih28ob27m--trapezban-oldalak-parhuzamosak', points: 6 },
        { problemId: 'lit6f0wnxb--betuk-kulonbozo-szamjegyeket', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'final', category: 'C+' },
  },
  '827evd78ec--09-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '7knwmkucdk--macska-liter-tejet', points: 3 },
        { problemId: 'tt3ro6aqov--halmazhoz-hozzaadtunk-otodik', points: 3 },
        { problemId: 'd2yu6bpzhy--fal-menten-pontban', points: 3 },
        { problemId: 'v3kzg4t37o--fuggvenyrol-valos-szam', points: 3 },
        { problemId: 'oz2czgpnl7--papir-rovidebb-oldala', points: 4 },
        { problemId: 'v52p8e6mkx--jeloljuk-huszart-elhelyezni', points: 4 },
        { problemId: 'velh71p1k1--lathato-kockat-vizszintes', points: 4 },
        { problemId: 'xux1jyd0v7--budapest-miskolc-kozotti', points: 4 },
        { problemId: 'orddcddj9u--albrecht-olimpian-elment', points: 5 },
        { problemId: 'awi2sej6mw--legnagyobb-haromjegyu-szam', points: 5 },
        { problemId: '2n9c7mlgqc--hatarozzuk-legnagyobb-termeszetes', points: 5 },
        { problemId: '14fm5dr6vo--szamokat-tartalmazo-halmaz', points: 5 },
        { problemId: 'c7v9s62453--kockat-tukroztunk-valamilyen', points: 6 },
        { problemId: 'g40ck9xz8d--negyzet-alapu-gulanak', points: 6 },
        { problemId: 'w98t77vhib--albert-berta-jatekot', points: 6 },
        { problemId: 'io9ccdo457--maracana-stadion-egyik', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'final', category: 'D' },
  },
  '62sdl5yetn--09-final-d-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'dm4naqhmhu--papir-rovidebb-oldala', points: 3 },
        { problemId: 'v52p8e6mkx--jeloljuk-huszart-elhelyezni', points: 3 },
        { problemId: 'j56n4a80eq--lathato-kockat-vizszintes', points: 3 },
        { problemId: 'yv3ans5s3s--budapest-miskolc-kozotti', points: 3 },
        { problemId: 'eu1tdp9hkk--albrecht-olimpian-elment', points: 4 },
        { problemId: 'awi2sej6mw--legnagyobb-haromjegyu-szam', points: 4 },
        { problemId: 'xa9ure32ja--hatarozzuk-legnagyobb-termeszetes', points: 4 },
        { problemId: '14fm5dr6vo--szamokat-tartalmazo-halmaz', points: 4 },
        { problemId: 'c7v9s62453--kockat-tukroztunk-valamilyen', points: 5 },
        { problemId: 'g40ck9xz8d--negyzet-alapu-gulanak', points: 5 },
        { problemId: 'w98t77vhib--albert-berta-jatekot', points: 5 },
        { problemId: 'io9ccdo457--maracana-stadion-egyik', points: 5 },
        { problemId: '0j2l45pbne--idei-olimpiara-abszurdisztan', points: 6 },
        { problemId: '7ih28ob27m--trapezban-oldalak-parhuzamosak', points: 6 },
        { problemId: 'rq6bectr8d--betuk-kulonbozo-szamjegyeket', points: 6 },
        { problemId: 'x15sdxgb5g--hatarozzuk-legkisebb-keruletu', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'final', category: 'D+' },
  },
};

export const problems: ProblemBank = {
  'gpjrjv2s70--akos-osztalyaba-ketszer': {
    answer: 22,
    content: {
      hu: {
        problemText: "<p>Ákos osztályába kétszer annyi lány jár, mint fiú. Ákosnál 5 fiú magasabb, 5 fiú alacsonyabb, és nincs olyan fiú, aki ugyanolyan magas, mint Ákos. Hány lány jár Ákos osztályába?</p>",
        help1: "Hány fiú van az osztályban?",
        help2: "Ne felejtsd el, hogy Ákos is fiú!",
      },
    },
  },
  '202vt659jj--erdei-allatok-szavazast': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Az erdei állatok szavazást tartottak arról, hogy ki az erdő legokosabb állata. Csak a rókára, vagy a bagolyra lehetett szavazni, és minden állat egy szavazatot adott le. A szavazatok összeszámlálása után kiderült, hogy a bagoly 12-vel több szavazatot kapott, mint a róka. Legkevesebb hány állatnak kellett volna a másik állatra szavazni, hogy a róka több szavazatot kapjon, mint a bagoly?</p>",
        help1: "Próbáld ki kisebb számra, például ha a bagoly csak 4 szavazattal kapott volna többet, mint a róka.",
        help2: "Egy szavazatváltoztatás mennyivel csökkenti a különbséget?",
      },
    },
  },
  'p40aqoujtv--szallodaban-szoba-fekvohellyel': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Egy szállodában 17 szoba van összesen 42 fekvőhellyel. A szobák két- vagy háromágyasak. Hány háromágyas szoba van ebben a szállodában?</p>",
        help1: "Hány férőhely lenne, ha minden szoba kétágyas lenne?",
        help2: "Hány szobába kell még egy ágyat bevinni, hogy már mindenkinek jusson hely?",
      },
    },
  },
  'irk560zea0--durer-konyvet-oldalszamokban': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Dürer könyvet ír, ahol az oldalszámokban a 9-esek helyére csillagot rajzol. Az oldalak számozását az 1-gyel kezdi és egyesével halad. Legalább hány oldalas a könyve, ha pontosan 20 csillagot rajzolt?</p>",
        help1: "Hány csillagot rajzol 10-ig? És 20-ig?",
        help2: "Hány csillagot rajzol 100-ig? Mi az a szám, ahol eléri a 20-at?",
      },
    },
  },
  'pgy8zv1ulh--gondoltam-ketjegyu-szamra': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Gondoltam egy kétjegyű számra. Ha ennek a számjegyeit megcserélem, az így kapott szám négy és félszer akkora, mint az eredeti szám. Melyik számra gondoltam?</p>",
        help1: "Legfeljebb mekkora lehet a szám?",
        help2: "A szám négy és félszerese kétjegyű. Legfeljebb mekkora lehet a szám?",
      },
    },
  },
  '5bithowzmx--gomboc-artur-csokoladekat': {
    answer: 900,
    content: {
      hu: {
        problemText: "<p>Gombóc Artúr csokoládékat vásárol. Első nap vett egy tábla mogyorósat és két tábla karamellásat, amiért 400 Ft-ot fizetett. Másnap szintén 400 Ft-ért vett két tábla mogyorósat és egy tábla epreset. Harmadnap a két tábla epres és egy tábla karamellás 550 Ft-jába került. Mennyi pénzt vigyen magával legközelebb, ha mindhárom tábla csokiból kettőt szeretne venni?</p>",
        help1: "Miket vásárolt összesen az első három napon?",
        help2: "A tervezett vásárlás hogyan számolható ki az eddigi vásárlások összárából?",
      },
    },
  },
  'hf24i0njai--osztalyba-tanulo-jar': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Egy osztályba 26 tanuló jár, akik közül mindenki szereti a csokis és a lekváros palacsinták közül legalább az egyiket. 6 gyerek szereti mindkét fajtát. Akik a csokisat szeretik, de a lekvárosat nem, azok száma 9-szer annyi, mint azoké, akik a lekvárosat szeretik, de a csokisat nem. Hányan szeretik a csokis palacsintát?</p>",
        help1: "Rajzold fel a feladatot halmazábrával?",
        help2: "Azoknak, akik pontosan az egyik fajtát szeretik, mekkora része szereti a csokisat?",
      },
    },
  },
  '4ri26iyy2q--kovetkezo-szorzasban-szamjegy': {
    answer: 2795,
    content: {
      hu: {
        problemText: "<p>A következő szorzásban 4 számjegy olvashatatlan, helyüket jelöli: \\(13\\cdot ☐2☐ = 2☐☐1\\). A megoldás a hiányzó négy számjegy ebben a sorrendben.</p>",
        help1: "Mi lehet a szorzótényező első számjegye, ha a szorzat 2-vel kezdődik?",
        help2: "Mi lehet a szorzótényező utolsó számjegye, ha a 3-szorosa 1-re végződik?",
      },
    },
  },
  '60l0i5rvck--feljutni-bal-also': {
    answer: 128,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet feljutni az alábbi ábra bal alsó mezőjéből a jobb felsőbe, ha közben csak jobbra vagy felfelé lehet lépni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_A_9.png",
        help1: "Melyik mezőkön haladunk át biztosan?",
        help2: "Minden ilyen csomópont között 2 útvonal között választhatunk. Ezek a választások különböző csomópontok között szabadon variálhatók.",
      },
    },
  },
  'qbhkvelzmh--haromjegyu-szam-amiben': {
    answer: 450,
    content: {
      hu: {
        problemText: "<p>Hány olyan háromjegyű szám van, amiben a páros számjegyek száma páratlan?</p>",
        help1: "Hány olyan van, ahol egy számjegy páros, és hány olyan, ahol három?",
        help2: "Ne felejtsd el, hogy egy szám nem kezdődhet 0-val!",
      },
    },
  },
  '7b58g71dr3--tablara-felirtunk-nehany': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Egy táblára felírtunk néhány pozitív egész számot, amelyek összege 20. A legkisebb három szám összege 5, míg a legnagyobb háromé 7. Hány szám van a táblán?</p>",
        help1: "Mi lehet a három legkisebb szám?",
        help2: "Ha már ismered a három legkisebb számot, mi lehet a három legnagyobb? Mi lehet középen?",
      },
    },
  },
  'cxgeht1zs5--negyzetet-papirbol-vagtuk': {
    answer: 50,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) négyzetet papírból vágtuk ki, amelynek területe 100 egység. Jelölje \\(E\\) az \\(AB\\) oldal felezőpontját. Az \\(EC\\) egyenes mentén behajtjuk a papírlapot, így keletkezik egy kétrétegű és egy egyrétű rész. Mekkora az egyrétegű rész területe?</p>",
        help1: "Mekkora a felhajtott háromszög területe?",
        help2: "Mekkora területet takar le a maradékból?",
      },
    },
  },
  'vkhw5gjjax--haromjegyu-szam-otszorose': {
    answer: 175,
    content: {
      hu: {
        problemText: "<p>Melyik az a háromjegyű szám, amely ötszöröse számjegyei szorzatának?</p>",
        help1: "Mi lehet az utolsó számjegy?",
        help2: "Milyen típusú számjegyekről tudjuk, hogy nem szerepelhet? Ezután kezdd végigpróbálni a számokat!",
      },
    },
  },
  'zo61powg1r--fekete-resz-terulete': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Ha a fekete rész területe 192 cm<sup>2</sup> és az ívek negyedkörívek, akkor hány cm a kis négyzetek oldalhossza?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_A_14.png",
        help1: "Próbáld szétdarabolni és összeilleszteni az ábrát, hogy jobban számolható legyen.",
        help2: "Lehet olyan átdarabolást csinálni, hogy már ne legyenek körívek.",
      },
    },
  },
  'pm6l0ltk1s--nagykockat-raktunk-ossze': {
    answer: 100,
    content: {
      hu: {
        problemText: "<p>Egy \\(10\\times10\\times10\\)-es nagykockát raktunk össze 1000 db üvegkockából. Hány üvegkockát kell kicserélni fakockára, hogy a kockát bármelyik oldala felől nézve \\(10\\times10\\)-es négyzetet lássunk fakockákból?</p>",
        help1: "Nézd meg kisebb méretű kockákra!",
        help2: "Ha szép megoldást keresel, nézd meg azokat a kockákat, amiknek a koordinátáinak összege osztható 10-zel!",
      },
    },
  },
  'buwpn88u3y--hercegnot-elrabolnak-rabloi': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Egy hercegnőt elrabolnak és a rablói megüzenik a királynak, hogy legalább 1, de legfeljebb 30 arany lesz a váltságdíj. A király összesen 30 aranyat oszt szét zsákokba, és így bármennyi is lesz a váltságdíj, pontosan ki tudja majd fizetni azt a rablóknak úgy, hogy a zsákok közül néhányat átad nekik. Legalább hány zsákra lesz ehhez szüksége?</p>",
        help1: "Próbálkozz kisebb számokra!",
        help2: "Indulj el alulról! Mekkora a legkisebb zsák? Mekkora legyen a következő? És a következő, amit nem tudunk kifizetni? Észrevettél szabályosságot?",
      },
    },
  },
  '41xvj4u4sj--szallodaban-szoba-fekvohellyel': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy szállodában 19 szoba van összesen 44 fekvőhellyel. A szobák két- vagy háromágyasak. Hány háromágyas szoba van ebben a szállodában?</p>",
        help1: "Hány férőhely lenne, ha minden szoba kétágyas lenne?",
        help2: "Hány szobába kell bevinni még egy ágyat, hogy már mindenkinek jusson hely?",
      },
    },
  },
  'fbpoddopvs--legkisebb-szam-mal': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb pozitív egész szám, amely 2-vel, 3-mal, 5-tel és 67-tel osztva is 1-et ad maradékul?</p>",
        help1: "Ez egy trükkös feladat.",
        help2: "A válasz nagyon kicsi.",
      },
    },
  },
  'y0k1liawm0--durer-versenyen-regisztraciokor': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>A Dürer Versenyen a regisztrációkor a csapatok egy-egy képviselője áll egyes sorban, én is köztük vagyok. Kettővel többen állnak előttem, mint mögöttem és háromszor annyian vagyunk az egész sorban, mint a mögöttem lévők. Összesen hányan várunk a regisztrációnál?</p>",
        help1: "Próbálgasd ki, hogy hányan állhatnak mögötted, hogy stimmeljen.",
        help2: "1-től kezdve kezdd végigpróbálni a számokat, hogy hányan állhatnak mögötted.",
      },
    },
  },
  'qr0pfghdyp--bandi-bacsi-pincejeben': {
    answer: 17,
    content: {
      hu: {
        problemText: "<p>Bandi bácsi pincéjében két azonos tömegű üres hordó áll. Ha az egyiket teletöltenénk, a másikat pontosan félig, akkor a teli hordó tömege 101 kg, a másiké 59 kg lenne. Mennyi az üres hordó tömege?</p>",
        help1: "Mi a különbség a két hordó között?",
        help2: "Mennyi fél hordónyi bor tömege?",
      },
    },
  },
  '85zff3n0w0--feljutni-bal-also': {
    answer: 128,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet feljutni az alábbi ábra bal alsó mezőjéből a jobb felsőbe, ha közben csak jobbra vagy felfelé lehet lépni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_B_6.png",
        help1: "Melyik mezőkön haladunk át biztosan?",
        help2: "Minden ilyen csomópont között 2 útvonal között választhatunk. Ezek a választások különböző csomópontok között szabadon variálhatók",
      },
    },
  },
  'jq1p9bz37u--kocka-kiskockakbol-all': {
    answer: 3375,
    content: {
      hu: {
        problemText: "<p>Egy \\(16\\times16\\times16\\)-os kocka kiskockákból áll. A kockákat a lapokkal párhuzamos síkok segítségével szétválasztottuk (45 síkot használtunk) egymástól. Hány olyan pont van, amely 3 síknak is pontja?</p>",
        help1: "Mik ezek a metszéspontok? Ha nem látod, nézd meg kisebb kockákra, például a Rubik-kockára.",
        help2: "Milyen alakzatot alkotnak a metszéspontok? Mekkora az alakzat mérete?",
      },
    },
  },
  'rcwy398uhh--fal-menten-pontban': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Az \\(RS\\) fal mentén, az \\(S\\) pontban álló focista elrúg egy labdát, ami a \\(P\\) pontban találja el a másik falat, ahonnan elpattan a \\(T\\) pont felé úgy, hogy az ábrán jelölt két \\(x\\) szög megegyezik, ráadásul az \\(RS\\) egyenes merőleges a \\(TP\\) egyenesre. Hány fokos az \\(x\\) szög, ha a focista 26&deg-os szögben rúgta el a labdát az \\(RS\\) falhoz képest?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_B_9.png",
        help1: "Rajzoljuk be a TP és RS egyenesek metszéspontját. Mit veszünk észre?",
        help2: "Kapunk egy derékszögű háromszöget, aminek hegyesszögeit ismerjük (26 illetve 2x)",
      },
    },
  },
  '9ljotwfq3j--utolso-szamjegye': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Mi \\(17^71 + 71^17\\) utolsó számjegye?</p>",
        help1: "Kezdd el felírni, hogy a 17 hatványainak mi az utolsó számjegye.",
        help2: "Nézd meg, hogy mekkora ciklusban jönnek az utolsó számjegyek a 17 hatványaiban. És a 71 hatványai milyen számjegyre végződnek?",
      },
    },
  },
  'ypyh7tm7i4--vegzodik-tizes-szamrendszerbeli': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Hány 0-ra végződik a 100! tízes számrendszerbeli alakja?</p>",
        help1: "Az 5-nek és a 2-nek mekkora hatványával osztható? Melyik a szűk keresztmetszet?",
        help2: "A faktoriális hány tagja osztható 5-tel? Hány van, ami ezután még egyszer osztható 5-tel?",
      },
    },
  },
  'irz03uxch4--koordinata-rendszerben-durer': {
    answer: 1081,
    content: {
      hu: {
        problemText: "<p>Egy koordináta-rendszerben Dürer az origóból indul, és rajzol egy 1 egység hosszúságú szakaszt jobbra, majd megáll az \\((1, 0)\\) pontban. Ezután felfelé húz egy 2 egység hosszúságú szakaszt, és megáll az \\((1, 2)\\) pontban. Dürer felváltva húzza a szakaszokat jobbra illetve felfelé, és minden szakasz az előtte lévőnél 1 egységgel hosszabb. Ezzel a töröttvonallal Dürer eljutott az \\((529, 506)\\)-os pontba. Melyik pont következik ezután?<br><i>A válasz a keresett pont koordinátáinak összege.</i>)</p>",
        help1: "Két lépés során mennyivel kerül Dürer jobban fel mint jobbra?",
        help2: "Ha máshogy nem jön ki, írd fel egyszerűen a lépéseket.",
      },
    },
  },
  'fi54ep8tcm--osszeszoroztunk-egymast-azonos': {
    answer: 720,
    content: {
      hu: {
        problemText: "<p>Összeszoroztunk három, egymást azonos különbséggel követő nemnegatív egész számot, amelyek közül csak az egyik kétjegyű, a másik kettő egyjegyű. Mennyi a lehetséges legnagyobb, illetve a legkisebb – a feltételeknek megfelelően előállított – szorzat különbsége?</p>",
        help1: "A 0 nemnegatív.",
        help2: "A legnagyobb szorzatnál gondold meg, hogy mi legyen a nagyobbik egyjegyű szám, aztán nézd meg, hogy ekkor melyik hármasra maximális a szorzat.",
      },
    },
  },
  'bdmobw4sm3--idos-holgy-mindegyike': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>10 idős hölgy mindegyike tud egy pletykát. Ha két hölgy beszél egymással telefonon, akkor az összes rendelkezésükre álló pletykát megosztják egymással. Legkevesebb hány telefonbeszélgetéssel oldható meg, hogy mindenki ismerjen minden pletykát?</p>",
        help1: "Keress egy egyszerű módszert, amivel az összes pletyka begyűjthető és kiosztható. De vigyázat, ez csak egy felső korlát, lehet, hogy ennél van jobb módszer is.",
        help2: "Keress az előző segítségben ajánlottnál egy kicsivel jobb módszert.",
      },
    },
  },
  'wpadvullr3--nehany-szam-osszege': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Néhány pozitív egész szám összege 10. Legfeljebb mennyi lehet a szorzatuk?</p>",
        help1: "Mikor érdemes egy számot két számra szétvágni?",
        help2: "Érdemes lehet-e 4-nél nagyobb számot hagyni az összegben?",
      },
    },
  },
  'kc640dpd3u--kovetkezo-osszeadasban-kulonbozo': {
    answer: 541,
    content: {
      hu: {
        problemText: "<p>A következő összeadásban különböző betűk különböző számjegyeket, az azonos betűk pedig azonos számjegyeket jelentene:. </p><p> <center>\\overline{THREE}+\\overline{FOUR}=\\overline{SEVEN}</center></p><p>Mennyi \\(\\overline{ONE}\\) értéke?</p>",
        help1: "Eláruljuk, hogy E=1.",
        help2: "Eláruljuk, hogy N=4.",
      },
    },
  },
  '7knwmkucdk--macska-liter-tejet': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Ha három macska három liter tejet három perc alatt iszik meg, akkor kilenc macska kilenc liter tejet hány perc alatt iszik meg?</p>",
        help1: "Az első esetet úgy is el lehet képzelni, hogy 3 macska kapott 1-1 liter tejet, amivel 3 perc alatt végeztek",
        help2: "Egy cicának tehát 3 perc kell egy liter elpusztításához. Mi a helyzet tehát 9 cica 9 liter tej esetében?",
      },
    },
  },
  '36whhgy8hx--feljutni-bal-also': {
    answer: 128,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet feljutni az alábbi ábra bal alsó mezőjéből a jobb felsőbe, ha közben csak jobbra vagy felfelé lehet lépni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_C_2.png",
        help1: "Melyik mezőkön haladunk át biztosan?",
        help2: "Minden ilyen csomópont között 2 útvonal között választhatunk. Ezek a választások különböző csomópontok között szabadon variálhatók",
      },
    },
  },
  'n0lnnst97s--kor-keruletere-felirjuk': {
    answer: 198,
    content: {
      hu: {
        problemText: "<p>Egy kör kerületére felírjuk egytől százig a számokat valamilyen sorrendben, majd összeadjuk a szomszédos tagok különbségeinek abszolútértékeit. Mi a legkisebb szám, amit kaphatunk?</p>",
        help1: "Mi történik, ha csak sorbaírjuk a számokat? Mit történik, ha ezen az egyszerű álláson változtatunk?",
        help2: "Ha van olyan szomszédos számhármas, hogy a középső a legnagyobb/legkisebb. Ezt a hármast növekvő sorrendbe rendezve csökkenthetünk az összegen.",
      },
    },
  },
  'q361l08n5j--fal-menten-pontban': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Az \\(RS\\) fal mentén, az \\(S\\) pontban álló focista elrúg egy labdát, ami a \\(P\\) pontban találja el a másik falat, ahonnan elpattan a \\(T\\) pont felé úgy, hogy az ábrán jelölt két \\(x\\) szög megegyezik, ráadásul az \\(RS\\) egyenes merőleges a \\(TP\\) egyenesre. Hány fokos az \\(x\\) szög, ha a focista 26&deg-os szögben rúgta el a labdát az \\(RS\\) falhoz képest?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_C_4.png",
        help1: "Rajzoljuk be a TP és RS egyenesek metszéspontját. Mit veszünk észre?",
        help2: "Kapunk egy derékszögű háromszöget, aminek hegyesszögeit ismerjük (26 illetve 2x)",
      },
    },
  },
  's2ux1q2aep--papir-rovidebb-oldala': {
    answer: 840,
    content: {
      hu: {
        problemText: "<p>Egy A/4-es papír rövidebb oldala 210 mm, oldalainak aránya pedig \\(\\sqrt2\\). Az ábrán látható módon behajtjuk a papír két sarkát. Hány mm a kapott négyszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_C_5.png",
        help1: "Számoljuk ki, hogy az eredeti kerületből mennyit vesztettünk és mennyit nyertünk az átlós részekkel!",
        help2: "Egy hosszúoldal 2-szeresét vesztettük el, és a gyök2-szeresét nyertük vissza. Ennyivel kell az eredeti kerületet korrigálni.",
      },
    },
  },
  'v52p8e6mkx--jeloljuk-huszart-elhelyezni': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Jelöljük \\(H\\)-val azt, hogy legfeljebb hány huszárt lehet úgy elhelyezni egy sakktáblán, hogy egyik huszár se üsse a másikat. Hasonlóan, jelöljük \\(K\\)-val azt, hogy legfeljebb hány királyt lehet úgy elhelyezni, hogy egyik király se üsse a másikat. Mennyi \\(H-K\\)?</p>",
        help1: "Hány huszárt tehetünk fel így egy 2×4-es sakktáblarészbe? Ezzel a felső becsléshez található jó konstrukció!",
        help2: "Hány király fér egy 2×2-es táblarészbe? Ez a felső becslés elérhető?",
      },
    },
  },
  'nxtlnm9ud5--oldalu-konvex-sokszog': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány oldalú lehet egy olyan konvex sokszög, amelynek nincs két szomszédos tompaszöge?</p>",
        help1: "Ha egy konvex sokszögnek sok a kicsi szöge, az azt jelenti, hogy ha körbe akarjuk sétálni, akkor azokon a sarkokon sokat fordulunk. Mennyit fordulunk a sokszög egy teljes megkerülésénél?",
        help2: "4 vagy több nemtompa szöge nem lehet. Ha három van, hány szöge lehet legfeljebb? Erre van is jó konstrukció?",
      },
    },
  },
  '4i4eonlhic--budapest-miskolc-kozotti': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>A Budapest és Miskolc közötti vasútvonalon két szakaszon is sebességkorlátozást vezettek be, így az utat 80 km/h átlagsebességgel teszi meg a Dürer Verseny díjait szállító tehervonat. Ha a kettő közül bármelyik szakaszon feloldanák a korlátozást, az átlagsebesség 96 km/h lenne. Hány km/h lenne az átlagsebesség, ha egyszerre mindkét szakaszon feloldanák a korlátozást?</p>",
        help1: "Sebesség helyett az út időtartamával számoljunk. A sebességkorlátozás azt jelenti, hogy az út ideje azokon a szakaszokon megnő valamennyivel. Mennyivel?",
        help2: "Ha <em>x</em> a távolság, akkor mindkét sebességkorlátozás <em>(x/80-x/96)</em>-tal növeli az út idejét. Mindkét korlátozás feloldásával az út ideje <em>x/80-2&sdot;(x/80-x/96)</em>. Ebből számoljuk ki a sebességet.",
      },
    },
  },
  'wtkcavy62h--osszeg-letezik-felekeppen': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Hány olyan összeg létezik, amit pontosan 8-féleképpen lehet kifizetni jelenleg forgalomban lévő magyar pénzérmékkel (5, 10, 20, 50, 100, 200 Ft)?</p>",
        help1: "A 40-et már nagyon sokféleképpen ki lehet fizetni, 50-nél nagyobb összeg nem lehet jó.",
        help2: "A 35-öt nagyon kevés módon lehet kifizetni, minden kisebb összeget is legfeljebb ennyi módon lehet kifizetni (hisz például minden fizetési különböző módot kiegészíthetünk ötösökkel).",
      },
    },
  },
  'hy4q9rdtln--reszre-osztja-sikot': {
    answer: 26,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány részre osztja a síkot 3 konvex négyszög?</p>",
        help1: "Két konvex négyszög legfeljebb 8 pontban metszi egymást. Minden két szomszédos metszéspont közötti szakasz egyértelműen felel meg egy újonnan létrejött területrésznek.",
        help2: "Ezt a gondolatmenetet megismételjük a 3. hozzáadott négyszöghöz is, 16 új metszéspontot kapunk.",
      },
    },
  },
  '14fm5dr6vo--szamokat-tartalmazo-halmaz': {
    answer: 129,
    content: {
      hu: {
        problemText: "<p>Egy egész számokat tartalmazó halmaz <i>lyukacsos</i>, ha bármely három szomszédos egész szám közül legfeljebb egyet tartalmaz. Hány lyukacsos részhalmaza van az {1, 2, 3, \\(\\dots\\), 12} halmaznak?</p>",
        help1: "Könnyen látható, hogy legfeljebb 4 számot választhatunk. Válasszuk szét az eseteket asszerint, hogy hány számot választunk ki.",
        help2: "Ha <em>k</em> darab számot választottunk, akkor az első <em>k-1</em> után a következő két számot nem választhattuk. Tehát <em>k-1</em> hármasblokk (tehát a kiválasztott szám és az utána lévő két üres mező, amik garantálják, hogy ne válasszunk rossz halmazt) és egy egyesblokk közé szeretnénk beszúrni a megmaradt üres mezőket (pontosan így kapunk jó halmazokat).",
      },
    },
  },
  'awi2sej6mw--legnagyobb-haromjegyu-szam': {
    answer: 864,
    content: {
      hu: {
        problemText: "<p>Melyik a legnagyobb háromjegyű szám, amelyre igaz a következő: osztja azt a számot, amit úgy kapunk, hogy minden prímtényezőjét megnöveljük eggyel, majd ezeket a számokat összeszorozzuk?<br><i>Például a 12 ilyen tulajdonságú kétjegyű szám, mivel \\(12=2\\cdot2\\cdot3\\) és \\((2+1)(2+1)(3+1)=36\\)</i></p>",
        help1: "Mi lehet a legnagyobb prímtényezője a háromjegyű számnak?",
        help2: "A szám prímtényezős felbontásában csak 2-es és 3-as szerepelhet. Ezeket az eseteket kézzel nézzük végig.",
      },
    },
  },
  '94jkfo07i6--kockat-tukroztunk-valamilyen': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Egy kockát tükröztünk valamilyen sorrendben minden lapjára pontosan egyszer. A hat tükrözés végrehajtása után hányféle helyre kerülhet a kocka?</p>",
        help1: "A nem párhuzamos síkokra való tükrözés felcserélhető, csak az számít, hogy a párhuzamos párokat milyen sorrendben végezzük el.",
        help2: "Mindhárom irányt tekintve kétféle lehet így a végeredmény, amit az határoz meg hogy melyikre tükröztünk először a párhuzamos lapok közül.",
      },
    },
  },
  'g40ck9xz8d--negyzet-alapu-gulanak': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Egy négyzet alapú gúlának minden éle 1 cm hosszú. Két szemközti háromszög lapjára egy-egy 1 cm élhosszúságú szabályos tetraédert ragasztunk úgy, hogy az összeragasztott lapok teljesen fedjék egymást. Hány lapja van az így kapott testnek?</p>",
        help1: "A piramis tükörképe az alapjára egy szabályos oktaéder. Egy szabályos oktaéder úgy is előáll, mint a kocka két csúcstetraéderének közös metszete.",
        help2: "Az előző meggondolásából az következik, hogy a piramis megmaradt háromszöglap-síkjaira illeszkednek a tetraéderek megfelelő lapjai. tehát van két nagy lap, és még néhány kicsi.",
      },
    },
  },
  '8gd664rpk8--albert-berta-jatekot': {
    answer: 91,
    content: {
      hu: {
        problemText: "<p>Albert és Berta az alábbi játékot játsszák. Albert egy 9, 5 m sugarú kör közepén áll. Egy lépésben kiválaszt egy irányt, Berta pedig eldöntheti, hogy abba az irányba vagy az ellenkezőbe menjen-e Albert 1 métert. Albert legkevesebb hány lépésben tudja biztosan elérni vagy átlépni a körvonalat?</p>",
        help1: "Berta mindig a kör közelébe vinne minket. Hogyan oldjuk meg, hogy a legjobban távolítson el a kör közepe felől?",
        help2: "A hely, ahol vagyunk illeszkedik egy sugárra. Erre állítsunk merőlegest, ez lesz a legjobb döntése Albertnek. Ekkor szép képletet kapunk az <em>n.</em> lépés utáni távolságunkra.",
      },
    },
  },
  '18jm4ehh5l--egeszekbol-allo-szampar': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Hány olyan pozitív egészekből álló \\((a, b)\\) számpár van, amire \\(a\\) és \\(b\\) relatív prím és az \\(\\frac{a}b + \\frac{14b}{9a}\\) kifejezés értéke egész?</p>",
        help1: "Hozzunk közös nevezőre. Keressünk érdekes oszthatóságokat.",
        help2: "Kihozható, hogy a osztja 14-et, innem csak néhány esetet kell átvizsgálni.",
      },
    },
  },
  'd3e4rwd2w8--papir-rovidebb-oldala': {
    answer: 840,
    content: {
      hu: {
        problemText: "<p>5 Egy A/4-es papír rövidebb oldala 210 mm, oldalainak aránya pedig \\(\\sqrt2\\). Az ábrán látható módon behajtjuk a papír két sarkát. Hány mm a kapott négyszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_Cp_1.png",
        help1: "Számoljuk ki, hogy az eredeti kerületből mennyit vesztettünk és mennyit nyertünk az átlós részekkel!",
        help2: "Egy hosszúoldal 2-szeresét vesztettük el, és a gyök2-szeresét nyertük vissza. Ennyivel kell az eredeti kerületet korrigálni.",
      },
    },
  },
  'cqn30yh88c--oldalu-konvex-sokszog': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány oldalú lehet egy olyan konvex sokszög, amelynek nincs két szomszédos tompaszöge?</p>",
        help1: "Ha egy konvex sokszögnek sok a kicsi szöge, az azt jelenti, hogy ha körbe akarjuk sétálni, akkor azokon a sarkokon sokat fordulunk. Mennyit fordulunk a sokszög egy teljes megkerülésénél?",
        help2: "4 vagy több nemtompa szöge nem lehet. Ha három van,hány szöge lehet legfeljebb? Erre van is jó konstrukció?",
      },
    },
  },
  '0s9hicjut1--kockat-tukroztunk-valamilyen': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Egy kockát tükröztünk valamilyen sorrendben minden lapjára pontosan egyszer. A hat tükrözés végrehajtása után hányféle helyre kerülhet a dobókocka?</p>",
        help1: "A nem párhuzamos síkokra való tükrözés felcserélhető, csak az számít, hogy a párhuzamos párokat milyen sorrendben végezzük el.",
        help2: "Mindhárom irányban 2-féle sorrend lehetséges, amik ellentétes eltolásokat szolgáltatnak.",
      },
    },
  },
  'vjdv3nq38h--negyzet-alapu-gulanak': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Egy négyzet alapú gúlának minden éle 1 cm hosszú. Két szemközti háromszög lapjára egy-egy 1 cm élhosszúságú szabályos tetraédert ragasztunk úgy, hogy az összeragasztott lapok teljesen fedjék egymást. Hány lapja van az így kapott testnek?</p>",
        help1: "A piramis tükörképe az alapjára egy szabályos oktaéder. Egy szabályos oktaéder úgy is előáll, mint a kocka két csúcstetraéderének közös metszete.",
        help2: "Az előző meggondolásából az következik, hogy a piramis megmaradt háromszöglap-síkjaira illeszkednek a tetraéderek megfelelő lapjai. Tehát van két nagy lap, és még néhány kicsi.",
      },
    },
  },
  'nznhg3hh6e--albert-berta-jatekot': {
    answer: 91,
    content: {
      hu: {
        problemText: "<p>Albert és Berta az alábbi játékot játsszák. Albert egy 9, 5 m sugarú kör közepén áll. Egy lépésben kiválaszt egy irányt, Berta pedig eldöntheti, hogy abba az irányba vagy az ellenkezőbe menjen-e Albert 1 métert. Albert legkevesebb hány lépésben tudja biztosan elérni vagy átlépni a körvonalat?</p>",
        help1: "Berta mindig a kör közelébe vinne minket. Hogyan oldhatjuk meg, hogy a választása ne számítson?",
        help2: "A pont, ahol vagyunk, illeszkedik (az első lépés után pontosan 1) sugárra. Így egy szép formula adódik az <em>n.</em> lépés utáni távolságra",
      },
    },
  },
  'io9ccdo457--maracana-stadion-egyik': {
    answer: 50,
    content: {
      hu: {
        problemText: "<p>A Maracanã Stadion egyik szektorában a székek táblázatszerűen 81 sorban és 99 oszlopban vannak elrendezve. Az ide szóló jegyek kódjának utolsó 4 számjegyét a jegyre is ráírták. A bal felső sarokba szóló jegyre 0000-t írtak. Minden további jegy kódjára igaz, hogy az a legkisebb nemnegatív szám van ráírva, amelyik a sorában tőle balra és az oszlopában felette lévő székekhez tartozó jegyek egyikén se szerepel. Milyen szám szerepel a jobb alsó sarokba szóló jegyen?</p>",
        help1: "Készítsük el a táblázat egy részét! Vizsgáljuk meg a 2×2-es, 4×4-es résztáblázatok rendszerét! Mit veszünk észre?",
        help2: "Ha mindkét koordinátának ugyanannál a kettőhatványnál épp nagyobbak (esetünkben például 64, hisz ennél mindkettő számunk nagyobb, de a 128-nal mindkettő nemnagyobb), akkor mindkettőből levonhatjuk azt a  kettőhatványt, és egy ugyanolyan értékű mezőre jutunk. Ha van egy, a két koordinátát elválasztó kettő hatvány, akkor az ilyenek közül a legnagyobbat leírjuk, levonjuk a nagyobb koordinátából, így a mezőnk értéke a most kapott mező értéke és a leírt kettő hatvány összege lesz.",
      },
    },
  },
  '0j2l45pbne--idei-olimpiara-abszurdisztan': {
    answer: 324,
    content: {
      hu: {
        problemText: "<p>Az idei olimpiára Abszurdisztán végtelen sok sportolóval érkezik. Egy riporter végigkérdezi őket, hogy mi a kedvenc nemnegatív egész számuk, erre sorban az alábbiakat válaszolják: \\(a_1\\), \\(a_2\\), \\(\\ldots\\). A riporter észreveszi, hogy \\(a_{n+2}=|a_{n+1}-a_n|\\) teljesül minden \\(n\\geq1\\) esetén. Így úgy érezte, hogy nem kell sok mindent feljegyeznie. A papírjára csak annyit írt fel, hogy \\(a_1=999\\), \\(a_2<999\\) és \\(a_{2016}=1\\). Ezek alapján hányféle különböző értéket vehet fel \\(a_2\\)?</p>",
        help1: "Vizsgáljuk, hogy a paritása a sorozatnak hogyan alakul. Vizsgáljuk, hogy a második tag milyen hármas maradékot adhat.",
        help2: "A nem kizárt értékek a második tagra párosak és 3-mal nem oszthatók. Vajon az összes ilyen jó?",
      },
    },
  },
  '7ih28ob27m--trapezban-oldalak-parhuzamosak': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) trapézban az \\(AB\\) és \\(CD\\) oldalak párhuzamosak egymással, valamint \\(AB = 11\\), \\(BC = 5\\), \\(CD = 19\\) és \\(DA = 7\\). Az \\(A\\)-ból és a \\(D\\)-ből induló belső szögfelezők a \\(P\\) pontban, a \\(B\\)-ből és a \\(C\\)-ből induló belső szögfelezők a \\(Q\\) pontban metszik egymást. Hányszorosa lesz 3-nak az \\(ABQCDP\\) hatszög területe?</p>",
        help1: "Határozzuk meg a trapéz magasságát. Keressünk olyan háromszögeket, amik egybevágóak a kivágottakkal.",
        help2: "Az egyik háromszög félszabályos, a másik a D-ből induló szögfelezőre való tükrözéssel kap olyan magasságot, amit ki tudunk számolni.",
      },
    },
  },
  'lit6f0wnxb--betuk-kulonbozo-szamjegyeket': {
    answer: 543,
    content: {
      hu: {
        problemText: "<p>Az \\(A\\), \\(B\\), \\(C\\), \\(D\\), \\(E\\), \\(F\\), \\(G\\), \\(H\\), \\(I\\) betűk mind különböző számjegyeket jelölnek 1-től 9-ig. Tudjuk, hogy teljesül az \\(\\overline{ABC}+\\overline{DEF}=\\overline{GHI}\\) egyenlőség, továbbá a \\(\\overline{DBA}+\\overline{GHI}=\\overline{CFE}\\) egyenlőség. Mennyi \\(\\overline{HAB}\\) értéke?<br><i>Az összeadások tizes számrendszerben értendőek.</i></p>",
        help1: "Írjuk fel a két egyenletet (100A+10B+C+...=...) alakban, majd a másodikba (GHI)-ba helyettesítsük be az elsőt. Kapunk egy feltételt a A,B,D ismeretlenekre.",
        help2: "A,B,D összege 9-cel osztható. Könnyű meggondolni, hogy 18 nem lehet. Marad 3 eset. Könnyen meggondolható, hogy C,E,F illetve G,H,I összegek is oszthatók kilenccel.",
      },
    },
  },
  'tt3ro6aqov--halmazhoz-hozzaadtunk-otodik': {
    answer: 26,
    content: {
      hu: {
        problemText: "<p>A {3, 6, 9, 10} halmazhoz hozzáadtunk egy ötödik \\(n\\) számot úgy, hogy az ne egyezzen meg egyik korábbival sem, valamint az öt szám átlaga legyen egyenlő az öt szám mediánjával. Mennyi az \\(n\\) lehetséges értékeinek összege?</p>",
        help1: "Mely számok lehetnek a mediánok?",
        help2: "Vizsgáld meg a három esetet: ha a medián a 6, a 9 vagy a keresett szám.",
      },
    },
  },
  'd2yu6bpzhy--fal-menten-pontban': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Az \\(RS\\) fal mentén, az \\(S\\) pontban álló focista elrúg egy labdát, ami a \\(P\\) pontban találja el a másik falat, ahonnan elpattan a \\(T\\) pont felé úgy, hogy az ábrán jelölt két \\(x\\) szög megegyezik, ráadásul az \\(RS\\) egyenes merőleges a \\(TP\\) egyenesre. Hány fokos az \\(x\\) szög, ha a focista 26&deg-os szögben rúgta el a labdát az \\(RS\\) falhoz képest?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_D_3.png",
        help1: "Rajzoljuk be a TP és RS egyenesek metszéspontját. Mit veszünk észre?",
        help2: "Kapunk egy derékszögű háromszöget, aminek hegyesszögeit ismerjük (26 illetve 2x)",
      },
    },
  },
  'v3kzg4t37o--fuggvenyrol-valos-szam': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Egy \\(f\\) függvényről azt tudjuk, hogy minden \\(x\\neq0\\) valós szám esetén</p><p><center>\\(2f=\\left(\\frac1x\\right)+3f(x)=9x\\)</center></p><p>Határozzuk meg \\(f(3)\\) értékét.</p>",
        help1: "Nem akarjuk a konkrét <em>f</em> függvényt megkapni, csak <em>f(3)</em> értékét. Helyettesíts be ügyesen.",
        help2: "<em>x=1/3</em> és <em>x=3</em> behelyettesítéseket alkalmazd!",
      },
    },
  },
  'oz2czgpnl7--papir-rovidebb-oldala': {
    answer: 840,
    content: {
      hu: {
        problemText: "<p>Egy A/4-es papír rövidebb oldala 210 mm, oldalainak aránya pedig \\(\\sqrt2\\). Az ábrán látható módon behajtjuk a papír két sarkát. Hány mm a kapott négyszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_D_5.png",
        help1: "Számoljuk ki, hogy az eredeti kerületből mennyit vesztettünk és mennyit nyertünk az átlós részekkel!",
        help2: "Egy hosszúoldal 2-szeresét vesztettük el, és a gyök2-szeresét nyertük vissza. Ennyivel kell az eredeti kerületet korrigálni.",
      },
    },
  },
  'velh71p1k1--lathato-kockat-vizszintes': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható két kockát egy vízszintes asztalon helyeztük el. A két kocka élhosszának összege 8 cm, a kockák térfogatösszege pedig 272 cm<sup>3</sup> . Hány cm<sup>2</sup> a fekete téglalap területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_D_7.png",
        help1: "Milyen egyenletet tudunk felírni a kocka éleire?",
        help2: "Nem akarjuk konkrétan kiszámolni a kocka éleit csak a két él szorzatát. Ezt honnan kapjuk meg?",
      },
    },
  },
  'xux1jyd0v7--budapest-miskolc-kozotti': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>A Budapest és Miskolc közötti vasútvonalon két szakaszon is sebességkorlátozást vezettek be, így az utat 80 km/h átlagsebességgel teszi meg a Dürer Verseny díjait szállító tehervonat. Ha a kettő közül bármelyik szakaszon feloldanák a korlátozást, az átlagsebesség 96 km/h lenne. Hány km/h lenne az átlagsebesség, ha egyszerre mindkét szakaszon feloldanák a korlátozást? </p>",
        help1: "Sebesség helyett az út időtartamával számoljunk. A sebességkorlátozás azt jelenti, hogy az út ideje azokon a szakaszokon megnő valamennyivel. Mennyivel?",
        help2: "Ha <em>x</em> a távolság, akkor mindkét sebességkorlátozás <em>(x/80-x/96)</em>-tal növeli az út idejét. Mindkét korlátozás feloldásával az út ideje <em>x/80-2&sdot;(x/80-x/96)</em>. Ebből számoljuk ki a sebességet.",
      },
    },
  },
  'orddcddj9u--albrecht-olimpian-elment': {
    answer: 210,
    content: {
      hu: {
        problemText: "<p>Albrecht az Olimpián elment a Velodromba megnézni egy kerékpáros versenyszámot. A körbe-körbebicikliző 10 versenyzőről az alábbi probléma jutott az eszébe. Felveszünk egy körvonalon 10 pontot, majd mindet összekötjük mindegyik másikkal. Legfeljebb hány metszéspontja van a keletkező húroknak a kör belsejében?</p>",
        help1: "Tetszőlegesen elhelyezhetjük a pontokat, a válasz nem változik.",
        help2: "Bármely metszéspontot 4 külső pont határoz meg  körön.",
      },
    },
  },
  '2n9c7mlgqc--hatarozzuk-legnagyobb-termeszetes': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Határozzuk meg a legnagyobb \\(n\\) természetes számot, amely rendelkezik a következő tulajdonsággal: <i>Ha az \\(x_1\\), \\(x_2\\), \\(\\ldots\\), \\(x_n\\) számokra teljesül az \\(x_1+x_2+\\ldots+x_n=0\\) összefüggés, akkor az \\(x_1^n+x_2^n+\\ldots+x_n^n=n\\cdot x_1\\cdot x_2\\cdot\\dots\\cdot x_n\\) összefüggés is teljesül.</i></p>",
        help1: "Konstrukcióval igazoljuk, hogy <em>n</em> nem lehet páros, és <em>k</em>-nál nagyobb páratlan. (Találjuk ki <em>k</em> értékét!)",
        help2: "Konstrukcióval igazoljuk,hogy n nem lehet páros, és 3-nál nagyobb páratlan.",
      },
    },
  },
  'c7v9s62453--kockat-tukroztunk-valamilyen': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Egy kockát tükröztünk valamilyen sorrendben minden lapjára pontosan egyszer. A hat tükrözés végrehajtása után hányféle helyre kerülhet a dobókocka?</p>",
        help1: "A nem párhuzamos síkokra való tükrözés felcserélhető, csak az számít, hogy a párhuzamos párokat milyen sorrendben végezzük el.",
        help2: "Mindhárom irányt tekintve kétféle lehet így a végeredmény, amit az határoz meg hogy melyikre tükröztünk először a párhuzamos lapok közül.",
      },
    },
  },
  'w98t77vhib--albert-berta-jatekot': {
    answer: 91,
    content: {
      hu: {
        problemText: "<p>Albert és Berta az alábbi játékot játsszák. Albert egy 9, 5 méter sugarú kör közepén áll. Egy lépésben kiválaszt egy irányt, Berta pedig eldöntheti, hogy abba az irányba, vagy az ellenkezőbe menjen Albert 1 métert. Albert legkevesebb hány lépésben tud biztosan kijutni?</p>",
        help1: "Berta mindig a kör közelébe vinne minket. Hogyan oldjuk meg, hogy a legjobban távolítson el a kör közepe felől?",
        help2: "A hely, ahol vagyunk illeszkedik egy sugárra. Erre állítsunk merőlegest, ez lesz a legjobb döntése Albertnek. Ekkor szép képletet kapunk az <em>n.</em> lépés utáni távolságunkra.",
      },
    },
  },
  'dm4naqhmhu--papir-rovidebb-oldala': {
    answer: 840,
    content: {
      hu: {
        problemText: "<p>5 Egy A/4-es papír rövidebb oldala 210 mm, oldalainak aránya pedig \\(\\sqrt2\\). Az ábrán látható módon behajtjuk a papír két sarkát. Hány mm a kapott négyszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_Dp_1.png",
        help1: "Számoljátok ki, hogy az eredeti kerületből mennyit vesztettünk és mennyit nyertünk az átlós részekkel!",
        help2: "Egy hosszúoldal 2-szeresét vesztettük el, és a gyök2-szeresét nyertük vissza. Ennyivel kell az eredeti kerületet korrigálni.",
      },
    },
  },
  'j56n4a80eq--lathato-kockat-vizszintes': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható két kockát egy vízszintes asztalon helyeztük el. A két kocka élhosszának összege 8 cm, a kockák térfogatösszege pedig 272 cm<sup>3</sup> . Hány cm<sup>2</sup> a fekete téglalap területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_D_Dp_3.png",
        help1: "Milyen egyenletet tudunk felírni a kocka éleire?",
        help2: "Nem akarjuk konkrétan kiszámolni a kocka éleit csak a két él szorzatát. Ezt honnan kapjuk meg?",
      },
    },
  },
  'yv3ans5s3s--budapest-miskolc-kozotti': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>A Budapest és Miskolc közötti vasútvonalon két szakaszon is sebességkorlátozást vezettek be, így az utat 80 km/h átlagsebességgel teszi meg a Dürer Verseny díjait szállító tehervonat. Ha a kettő közül bármelyik szakaszon feloldanák a korlátozást, az átlagsebesség 96 km/h lenne. Hány km/h lenne az átlagsebesség, ha egyszerre mindkét szakaszon feloldanák a korlátozást? </p>",
        help1: "Sebesség helyett az út időtartamával számoljunk.A sebességkorlátozás azt jelenti, hogy az út ideje azokon a szakaszokon megnő valamennyivel. Mennyivel?",
        help2: "Ha <em>x</em> a távolság, akkor mindkét sebességkorlátozás <em>(x/80-x/96)</em>-tal növeli az út idejét. Mindkét korlátozás feloldásával az út ideje <em>x/80-2&sdot;(x/80-x/96)</em>. Ebből számoljuk ki a sebességet.",
      },
    },
  },
  'eu1tdp9hkk--albrecht-olimpian-elment': {
    answer: 210,
    content: {
      hu: {
        problemText: "<p>Albrecht az Olimpián elment a Velodromba megnézni egy kerékpáros versenyszámot. A körbe-körbebicikliző 10 versenyzőről az alábbi probléma jutott az eszébe. Felveszünk egy körvonalon 10 pontot, majd mindet összekötjük mindegyik másikkal. Legfeljebb hány metszéspontja van a keletkező húroknak a kör belsejében?</p>",
        help1: "Tetszőlegesen elhelyezhetjük a pontokat, a válasz nem változik.",
        help2: "Bármely metszéspontot 4 külső pont határoz meg a körön.",
      },
    },
  },
  'xa9ure32ja--hatarozzuk-legnagyobb-termeszetes': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Határozzuk meg a legnagyobb \\(n\\) természetes számot, amely rendelkezik a következő tulajdonsággal: <i>Ha az \\(x_1\\), \\(x_2\\), \\(\\ldots\\), \\(x_n\\) számokra teljesül az \\(x_1+x_2+\\ldots+x_n=0\\) összefüggés, akkor az \\(x_1^n+x_2^n+\\ldots+x_n^n=n\\cdot x_1\\cdot x_2\\cdot\\dots\\cdot x_n\\) összefüggés is teljesül.</i></p>",
        help1: "Konstrukcióval igazoljuk,hogy <em>n</em> nem lehet páros, és <em>k</em>-nál nagyobb páratlan. (Találjuk ki <em>k</em> értékét!)",
        help2: "Konstrukcióval igazoljuk, hogy <em>n</em> nem lehet páros, és 3-nál nagyobb páratlan.",
      },
    },
  },
  'rq6bectr8d--betuk-kulonbozo-szamjegyeket': {
    answer: 543,
    content: {
      hu: {
        problemText: "<p>Az \\(A\\), \\(B\\), \\(C\\), \\(D\\), \\(E\\), \\(F\\), \\(G\\), \\(H\\), \\(I\\) betűk mind különböző számjegyeket jelölnek 1-től 9-ig. Tudjuk, hogy teljesül az \\(\\overline{ABC}+\\overline{DEF}=\\overline{GHI}\\) egyenlőség, továbbá a \\(\\overline{DBA}+\\overline{GHI}=\\overline{CFE}\\) egyenlőség. Mennyi \\(\\overline{HAB}\\) értéke?<br><i>Az összeadások tizes számrendszerben értendőek.</i></p>",
        help1: "Írjuk fel a két egyenletet (100A+10B+C+...=...) alakban, majd a másodikba (GHI)-ba helyettesítsük be az elsőt. Kapunk egy feltételt az A,B,D ismeretlenekre.",
        help2: "A,B,D összege 9-cel osztható. Könnyű meggondolni, hogy 18 nem lehet. Marad 3 eset. Könnyen meggondolható, hogy C+E+F illetve G+H+I összegek is oszthatók kilenccel.",
      },
    },
  },
  'x15sdxgb5g--hatarozzuk-legkisebb-keruletu': {
    answer: 2475,
    content: {
      hu: {
        problemText: "<p>Határozzuk meg a legkisebb kerületű olyan egész oldalú háromszög kerületét, amelynek az egyik szöge ötször akkora, mint egy másik.</p>",
        help1: "Hogyan írható fel a háromszög oldalainak aránya? Milyen fontos feltétel teljesül a kisebb szög koszinuszára, és mely intervallumba esik az értéke?",
        help2: "Fejezzétek ki az oldalak arányát a kisebb szög koszinuszának polinomjaiként (az addíciós tételek segíthetnek)! Mennyi lehet a kapott oldalhosszok legnagyobb közös osztója? Válasszátok kis nevezőjűnek a kis szög koszinuszát!",
      },
    },
  },
};
