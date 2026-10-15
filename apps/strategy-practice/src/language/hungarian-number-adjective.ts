// The adjective a Hungarian number forms with -s: "6 × 6-os tábla", "8-as",
// "10-es". The linking vowel follows the vowel harmony of the number's last
// spoken word, which is its last non-zero place: "hat" (6) takes -os, "húsz"
// (20) takes -as, "száz" (100) -as, "ezer" (1000) -es.
const ONES = ['', 'es', 'es', 'as', 'es', 'ös', 'os', 'es', 'as', 'es'];
const TENS = ['', 'es', 'as', 'as', 'es', 'es', 'as', 'es', 'as', 'es'];

const linkingSuffix = (n: number): string => {
  if (n === 0) return 'ás';
  if (n % 10 !== 0) return ONES[n % 10];
  if (n % 100 !== 0) return TENS[(n % 100) / 10];
  if (n % 1000 !== 0) return 'as';
  if (n % 1_000_000 !== 0) return 'es';
  return 'os';
};

export const hungarianNumberAdjective = (n: number): string => `${n}-${linkingSuffix(Math.abs(n))}`;
