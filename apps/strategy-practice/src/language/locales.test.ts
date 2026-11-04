// `i18n:check` compares English against Hungarian only, so it never reports what
// English has and Hungarian lacks: a file named for no namespace, or a key left
// behind after a rename. Nothing reads those, and nothing else would notice them.
const files = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', { eager: true, import: 'default' });

const keysOf = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, inner]) => keysOf(inner, prefix ? `${prefix}.${key}` : key))
    : [prefix];

// An English plural form stands for the bare key Hungarian keeps.
const pluralBase = (key: string) => key.replace(/_(zero|one|two|few|many|other)$/, '');

const namespaces = (language: string) => Object.keys(files)
  .filter(path => path.includes(`/locales/${language}/`))
  .map(path => /([^/]+)\.json$/.exec(path)![1]);

describe('English locale files', () => {
  it('belong to a namespace Hungarian has', () => {
    expect(namespaces('en').filter(ns => !namespaces('hu').includes(ns))).toEqual([]);
  });

  it.each(namespaces('en'))('%s holds no key Hungarian lacks', namespace => {
    const hu = new Set(keysOf(files[`../locales/hu/${namespace}.json`]));
    const extra = keysOf(files[`../locales/en/${namespace}.json`])
      .filter(key => !hu.has(key) && !hu.has(pluralBase(key)));
    expect(extra).toEqual([]);
  });
});
