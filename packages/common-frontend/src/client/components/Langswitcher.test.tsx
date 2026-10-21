// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import i18next from '../../common/i18n';
import { LanguageDropdown } from './Langswitcher';

afterEach(async () => {
  cleanup();
  await i18next.changeLanguage('hu');
});

const pick = (label: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(within(screen.getByRole('listbox')).getByText(label));
};

test('reports a pick that changes the language', () => {
  const onChoose = vi.fn();
  render(<LanguageDropdown onChoose={onChoose} />);

  pick('English');

  expect(onChoose).toHaveBeenCalledWith('en');
  expect(i18next.language).toBe('en');
});

// A regression: after `?lang=hu` overrode a stored English, picking Magyar
// changed nothing, so the select fired no change and the pick was never stored.
test('reports a pick of the language already showing', () => {
  const onChoose = vi.fn();
  render(<LanguageDropdown onChoose={onChoose} />);

  pick('Magyar');

  expect(onChoose).toHaveBeenCalledWith('hu');
});

test('reports nothing for a switch made in code', async () => {
  const onChoose = vi.fn();
  render(<LanguageDropdown onChoose={onChoose} />);

  await act(() => i18next.changeLanguage('en'));

  expect(onChoose).not.toHaveBeenCalled();
});
