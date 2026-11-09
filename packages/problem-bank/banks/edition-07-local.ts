import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 7's local round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  's6hbysgvtf--07-local-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'l9vqvh53fl--vonattal-utazunk-miskolcra', points: 3 },
        { problemId: 'bd9fpe86j1--kertemben-csodaszep-viragok', points: 3 },
        { problemId: 'ktzm0cgi27--kovetkezo-osszeadasban-azonos', points: 3 },
        { problemId: 'cdvhkqr6b2--egytol-szazig-leirtuk', points: 3 },
        { problemId: 'u1h14z7vlh--aladar-bence-cili', points: 4 },
        { problemId: 'xrhh4fmi82--durer-verseny-egyik', points: 4 },
        { problemId: 'epb3e778rn--novembereben-hetfobol-csutortokbol', points: 4 },
        { problemId: 'h1gd2nli4z--lapra-leirtuk-novekvo', points: 4 },
        { problemId: 'ktii07atvw--kiszinezni-mellekelt-feher', points: 4 },
        { problemId: '3f776bjnu3--negyzet-terulete-egyseg', points: 5 },
        { problemId: 'm9fbpzb4z9--darab-szamjegyet-tartalmaz', points: 5 },
        { problemId: '7scow2xvcf--futot-letenni-kepen', points: 5 },
        { problemId: '1epbykhjai--legkevesebb-lepesben-juthatunk', points: 6 },
        { problemId: '3ctscqwcuu--reszre-vagni-bal', points: 6 },
        { problemId: 'w4vdatprpl--kovetkezo-szorzasban-azonos', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 7, round: 'local', category: 'A' },
  },
  '9f0243kxkm--07-local-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'awepzbsf5k--egytol-szazig-leirtuk', points: 3 },
        { problemId: 'n9guthlihl--primszam-osszege-szorzatuk', points: 3 },
        { problemId: '3fwgtxvzxn--sarkanyidomarnak-darab-hetfeju', points: 3 },
        { problemId: 'epb3e778rn--novembereben-hetfobol-csutortokbol', points: 3 },
        { problemId: 'prccp3pd1e--negyzet-terulete-egyseg', points: 4 },
        { problemId: 'skrktog27s--legnagyobb-szam-kisebb', points: 4 },
        { problemId: 'iwapq124q6--kiszinezni-mellekelt-feher', points: 4 },
        { problemId: 'dven16sdml--kor-letezik-erinti', points: 4 },
        { problemId: 'ykma988om3--futot-letenni-kepen', points: 5 },
        { problemId: '7bldc34qi4--fokos-haromszog-legnagyobb', points: 5 },
        { problemId: 'vib6e5eovu--kenyai-etiop-hosszutavfuto', points: 5 },
        { problemId: '25k5fxgabn--penzermenk-asztalon-irassal', points: 5 },
        { problemId: '5cessf73xg--legkisebb-szam-amelyre', points: 5 },
        { problemId: 'a7bxnhs8st--kovetkezo-szorzasban-azonos', points: 6 },
        { problemId: 'ekoheejf6d--reszre-osztjak-sikot', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 7, round: 'local', category: 'B' },
  },
};

export const problems: ProblemBank = {
  'l9vqvh53fl--vonattal-utazunk-miskolcra': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Vonattal utazunk Miskolcra, a Dürer Verseny döntőjére. A szerelvény 13 kocsiból áll, a barátaink elölről számolva a 4. kocsiban várnak ránk. Az állomáson a vonat végéhez érkezünk. Hátulról számolva hányadik kocsiba kell felszállnunk, ha a barátainkkal együtt szeretnénk utazni?</p>",
        help1: "Ha az első kocsiba szállnánk a barátainkkal, hányadik kocsiba kéne szállnunk?",
        help2: "A kérdezett szám hárommal kisebb, mint az első segítségre a válasz.",
      },
    },
  },
  'bd9fpe86j1--kertemben-csodaszep-viragok': {
    answer: 72,
    content: {
      hu: {
        problemText: "<p>Kertemben csodaszép virágok nőnek.  Virágaim fele liliom, a többi virágnak pedig éppen a harmada rózsa.  Van még 24 szál tulipánom is.  Hány virágom van összesen, ha az eddig említett fajtákon kívül más nem nő a kertemben?</p>",
        help1: "Hanyadrésze tulipán a virágaimnak?",
        help2: "A virágaim hatoda tulipán.",
      },
    },
  },
  'ktzm0cgi27--kovetkezo-osszeadasban-azonos': {
    answer: 78,
    content: {
      hu: {
        problemText: "<p>A következő összeadásban az azonos betűk azonos, míg a különböző betűk különböző számjegyeket jelölnek:</p><p><center>D + U + R + E + R + V + E + R + S + E + N + Y</center></p><p>Mennyi az összeg lehetséges legnagyobb értéke? </p>",
        help1: "Hány darab van az egyes betűkből az összeadásban?",
        help2: "A legnagyobb esetben az E illetve R betűk értéke 9 és 8.",
      },
    },
  },
  'cdvhkqr6b2--egytol-szazig-leirtuk': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>Egytől százig leírtuk az összes pozitív egész számot. Hány 7-es számjegyet írtunk le közben? </p>",
        help1: "A tízes helyiértéken csak a hetvenes számoknál ál 7.",
        help2: "Az egyes helyiértéken tízszer szerepel hetes.",
      },
    },
  },
  'u1h14z7vlh--aladar-bence-cili': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>Aladár, Bence, Cili és Dani is gondolt egy-egy pozitív egész számra. Tudjuk, hogy Aladár és Bence számainak szorzata 10, míg Cili és Dani számainak szorzata 11. Azt is tudjuk, hogy ha Aladár és Cili számát összeadjuk, éppen 13-mal kapunk többet, mint ha Bence és Dani számát adnánk össze. Mennyi a négy gondolt szám összege? </p>",
        help1: "Ha két pozitív egész szám szorzata 11, akkor az egyik 1, a másik 11.",
        help2: "Ha két pozitív egész szám szorzata 10, akkor a lehetséges számpárok az (1,10) és a (2,5).",
      },
    },
  },
  'xrhh4fmi82--durer-verseny-egyik': {
    answer: 1992,
    content: {
      hu: {
        problemText: "<p>A Dürer Verseny egyik egyetemista szervezője, Gábor, decemberben éppen annyiadik születésnapját fogja ünnepelni, mint amennyi a születési évszámában a számjegyek összege. Melyik évben született Gábor? <br><i>A feladat 2013-ban volt feladva.</i></p>",
        help1: "Lehetséges, hogy Gábor a 2000-res években született?",
        help2: "Ha Gábor a 20. században született, a feltételek miatt legfeljebb 28 éves, mert a számjegyösszeg legfeljebb 1+9+9+9.",
      },
    },
  },
  'epb3e778rn--novembereben-hetfobol-csutortokbol': {
    answer: 27,
    content: {
      hu: {
        problemText: "<p>Egy év novemberében hétfőből, csütörtökből és szombatból is pontosan négy volt. Hányadikára esett a hónap utolsó vasárnapja?</p>",
        help1: "Hány darab van a hét azon napjából novemberben, ami másodikán van?",
        help2: "Elsején keddnek kellett lennie.",
      },
    },
  },
  'h1gd2nli4z--lapra-leirtuk-novekvo': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Egy lapra leírtuk növekvő sorrendben az összes négyjegyű pozitív egész számot, amelyben a számjegyek összege 6. Hányadik közöttük a 2013?  </p>",
        help1: "Hány darab kétezernél nagyobb szám van a felírtak között a 2013 előtt?",
        help2: "A 200-nél kisebb felírt számokat csoportosítsátok aszerint, hogy milyen számjegy áll a százas helyiértéken.",
      },
    },
  },
  'ktii07atvw--kiszinezni-mellekelt-feher': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet kiszínezni a mellékelt ábra hét fehér tartományát pirossal, zölddel és kékkel úgy, hogy szomszédos tartományok különböző színűek legyenek? A forgatással egymásba vihető színezéseket nem tekintjük különbözőnek.<br><i>A külső gyűrűt hat egybevágó részre osztottuk.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_A_9.png",
        help1: "Ha a középső színű gyűrűt már kiszíneztük, akkor a külső gyűrűn lévő hat mezőt csak a maradék kétféle színnel színezgethetjük.",
        help2: "Ha a középső gyűrűt már kiszíneztük, a külső mezőknek váltakozva a másik két színnek kell lennie.",
      },
    },
  },
  '3f776bjnu3--negyzet-terulete-egyseg': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Ha a négyzet területe 36 egység, akkor hány egység a szürkére festett terület?<br><i>Az oldalakon felezőpontokat vettünk fel.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_A_10.png",
        help1: "Számoljátok ki, hogy a fehér terület hanyadrésze a négyzet területének!",
        help2: "Az fehér háromszögek területe a négyzet területének negyedei.",
      },
    },
  },
  'm9fbpzb4z9--darab-szamjegyet-tartalmaz': {
    answer: 2009,
    content: {
      hu: {
        problemText: "<p>Hány darab 1-es számjegyet tartalmaz a</p><p><center>9 + 99 + 999 +\\\\(dots\\) + \\(\\underbrace{999\\ldots9}_{2013\\textit{db}}\\)</center></p><p>összeadás eredményeként kapott szám?</p>",
        help1: "99...9 = 100...0 - 1, ahol ugyanannyi kilences van mint nullás.",
        help2: "Az összeadás eredménye 111...1 - 2013, ahol a csupaegyes szám 2014 darab egyest tartalmaz.",
      },
    },
  },
  '7scow2xvcf--futot-letenni-kepen': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány futót lehet letenni a képen látható sakktábla-részletre úgy, hogy egyik futó se üthesse le egy lépésben a másikat? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_A_12.png",
        help1: "Hány futót tudunk lerakni legfeljebb az adott módon a fekete mezőkre?",
        help2: "És a fehérekre?",
      },
    },
  },
  '1epbykhjai--legkevesebb-lepesben-juthatunk': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>Legkevesebb hány lépésben juthatunk el 1-ről indulva a 2013-hoz, ha egy lépésben vagy hozzáadunk 1-et az aktuális számhoz, vagy megszorozzuk 3-mal?</p>",
        help1: "Gondolkozzatok visszafelé!",
        help2: "Visszafelé hárommal osztható számnál osztani érdemes 3-mal, különben pedig levonni 1-et.",
      },
    },
  },
  '3ctscqwcuu--reszre-vagni-bal': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány részre lehet vágni a bal oldali árán látható gyűrűt három egyenes vágással?<br><i>A jobb oldali ábra egy példát mutat egyenes vágásra.</i> </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_A_14.png",
        help1: "Legfeljebb hány részre lehet vágni két vágással?",
        help2: "Keressétek meg azt a vágást, amikor két vágással 5 szeletre vágjuk.",
      },
    },
  },
  'w4vdatprpl--kovetkezo-szorzasban-azonos': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>A következő szorzásban az azonos betűk azonos, míg a különböző betűk különböző számjegyeket jelölnek:</p><p><center>\\(FON\\cdot FON=PLAFON\\)</center></p><p>Mennyi a \\(PLAFON\\) számjegyeinek összege?</p>",
        help1: "Milyen számjegyeket jelölhet az N betű?",
        help2: "Ezen lehetséges N értékekhez milyen lehetséges O érték tartozik? És ezen ON-okhoz milyen F tartozik?",
      },
    },
  },
  'awepzbsf5k--egytol-szazig-leirtuk': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>Egytől százig leírtuk az összes pozitív egész számot. Hány 7-es számjegyet írtunk le közben?</p>",
        help1: "A tízes helyiértéken csak a hetvenes számoknál ál 7.",
        help2: "Az egyes helyiértéken tízszer szerepel hetes.",
      },
    },
  },
  'n9guthlihl--primszam-osszege-szorzatuk': {
    answer: 4022,
    content: {
      hu: {
        problemText: "<p>Két prímszám összege 2013. Mennyi a szorzatuk?</p>",
        help1: "Lehet mindkét prímszám páratlan?",
        help2: "Az egyetlen páros prímszám a kettő.",
      },
    },
  },
  '3fwgtxvzxn--sarkanyidomarnak-darab-hetfeju': {
    answer: 343,
    content: {
      hu: {
        problemText: "<p>Egy sárkányidomárnak hét darab hétfejű sárkánya van. A sárkányok csak csokoládét esznek, egy sárkányfej napi fejadagja pontosan hét kilogramm. Ha hét aranytallérba kerül a teljes állatállomány egyheti élelmezése, akkor hány kilogramm csokit lehet venni egy aranytallérért?</p>",
        help1: "Hány aranytallérba kerül egy napnyi élelem?",
        help2: "Az egy napnyi élelem súlya a fejek száma megszorozva 7 kilogrammal.",
      },
    },
  },
  'prccp3pd1e--negyzet-terulete-egyseg': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Ha a négyzet területe 48 egység, akkor hány egység a szürkére festett terület?<br><i>Az oldalakon felezőpontokat vettünk fel.</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_B_5.png",
        help1: "Számoljátok ki, hogy a fehér terület hanyadrésze a négyzet területének!",
        help2: "Az fehér háromszögek területe a négyzet területének negyede.",
      },
    },
  },
  'skrktog27s--legnagyobb-szam-kisebb': {
    answer: 399,
    content: {
      hu: {
        problemText: "<p>Melyik a legnagyobb egész szám, amely kisebb a számjegyei összegének hússzorosánál? </p>",
        help1: "Lehet legalább négyjegyű a kérdezett szám?",
        help2: "A háromjegyű számoknál érdemes az utolsó két számjegyet minél nagyobbnak venni.",
      },
    },
  },
  'iwapq124q6--kiszinezni-mellekelt-feher': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet kiszínezni a mellékelt ábra hét fehér tartományát pirossal, zölddel és kékkel úgy, hogy szomszédos tartományok különböző színűek legyenek?<br><i>A forgatással egymásba vihető színezéseket nem tekintjük különbözőnek. A külső gyűrű hat egybevágó részre van osztva.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_B_7.png",
        help1: "Ha a középső színű gyűrűt már kiszíneztük, akkor a külső gyűrűn lévő hat mezőt csak a maradék kétféle színnel színezgethetjük.",
        help2: "Ha a középső gyűrűt már kiszíneztük, a külső mezőknek váltakozva a másik két színnek kell lennie.",
      },
    },
  },
  'dven16sdml--kor-letezik-erinti': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Hány olyan kör létezik, amely érinti az ábrán látható három kör mindegyikét?<br><i>Két kör akkor érinti egymást, ha pontosan egy közös pontjuk van.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_B_8.png",
        help1: "Hányféle olyan kör van, ami kívülről érinti a bal oldalit, és belülről a jobb oldali kettő kört?",
        help2: "Az, hogy megmondjuk, melyik kört honnan érintse a körünk, meghatározza a körünket.",
      },
    },
  },
  'ykma988om3--futot-letenni-kepen': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány futót lehet letenni a képen látható sakktábla-részletre úgy, hogy egyik futó se üthesse le egy lépésben a másikat?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_H_B_9.png",
        help1: "Hány futót tudunk lerakni legfeljebb az adott módon a fekete mezőkre?",
        help2: "És a fehérekre?",
      },
    },
  },
  '7bldc34qi4--fokos-haromszog-legnagyobb': {
    answer: 140,
    content: {
      hu: {
        problemText: "<p>Hány fokos az \\(ABC\\) háromszög legnagyobb szöge, ha tudjuk, hogy \\(AB=BC\\) és azt is, hogy az \\(AT\\) magasságvonal fele olyan hosszú, mint az \\(AH\\) szögfelező?</p>",
        help1: "ATH háromszög félszabályos.",
        help2: "Használjátok ki, hogy AH szögfelező!",
      },
    },
  },
  'vib6e5eovu--kenyai-etiop-hosszutavfuto': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Egy kenyai és egy etióp hosszútávfutó köröz egy pályán, mindketten egyenletes sebességgel haladnak. Ellenkező irányban köröznek, így éppen 3 percenként találkoznak. Tudjuk, hogy a kenyai éppen másfélszer annyi idő alatt tesz meg egy kört, mint az etióp. Hány percenként találkoznának, ha azonos irányban köröznének?</p>",
        help1: "Ha <em>t</em> perc alatt ér körbe a lassabb futó, és feltesszük, hogy a kezdésnél épp találkoztak, hányszor találkoznak <em>2t</em> perc alatt?",
        help2: "<em>t=7.5</em> percet kapunk, ha megnézzük, hogy <em>2t</em> alatt pont ötször találkoznak, így az 15 perc.",
      },
    },
  },
  '25k5fxgabn--penzermenk-asztalon-irassal': {
    answer: 289,
    content: {
      hu: {
        problemText: "<p>Van 2013 pénzérménk egy asztalon, mindegyik írással felfele. Egy lépésben megfordíthatjuk bármelyik 7 pénzérmét. Legalább hány lépés kell, hogy mindegyik fejjel felfele legyen?</p>",
        help1: "Próbáljatok meg minél több érmét megfordítani, amíg kevesebb, mint 7 érme marad nem megfordítva!",
        help2: "2009=287&sdot;7.",
      },
    },
  },
  '5cessf73xg--legkisebb-szam-amelyre': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb pozitív egész \\(n\\) szám, amelyre \\(\\frac{n}{100}\\) előáll két kétjegyű egész szám hányadosaként?</p>",
        help1: "A kérdezett számot osztania kell a 2 és 5 közül legalább az egyiknek.",
        help2: "Keressetek minél kisebb, jó példát!",
      },
    },
  },
  'a7bxnhs8st--kovetkezo-szorzasban-azonos': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>A következő szorzásban az azonos betűk azonos, míg a különböző betűk különböző számjegyeket jelölnek:</p><p><center>\\(FON\\cdot FON=PLAFON\\) Mennyi a \\(PLAFON\\) számjegyeinek összege?</p>",
        help1: "Milyen számjegyeket jelölhet az N betű?",
        help2: "Ezen lehetséges N értékekhez milyen lehetséges O érték tartozik? És ezen ON-okhoz milyen F tartozik?",
      },
    },
  },
  'ekoheejf6d--reszre-osztjak-sikot': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Hány részre osztják a síkot egy szabályos 14-szög oldalegyenesei?</p>",
        help1: "Hány részre osztja a síkot 14 általános helyzetű egyenes?",
        help2: "Vannak párhuzamos egyenesek a szabályos 14-szög oldalegyenesei között? És egy ponton átmenő egyeneshármasok?",
      },
    },
  },
};
