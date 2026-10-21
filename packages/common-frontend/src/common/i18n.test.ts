// @vitest-environment jsdom
import { afterAll, expect, test } from 'vitest';
import i18next from './i18n';

afterAll(() => i18next.changeLanguage('hu'));

test('<html lang> follows the i18next language', async () => {
  await i18next.changeLanguage('en');
  expect(document.documentElement.lang).toBe('en');

  await i18next.changeLanguage('hu');
  expect(document.documentElement.lang).toBe('hu');
});
