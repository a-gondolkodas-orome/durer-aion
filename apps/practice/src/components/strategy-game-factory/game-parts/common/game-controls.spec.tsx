// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/react';
import { ModeSelector, DifficultySelector } from './game-controls';
import type { Variant } from '../../types';

// The sidebar and the game-end dialog render these selectors into the same
// document at the same time. Radios sharing a `name` are one native group with
// one checked member between them, so two instances have to get separate
// groups — otherwise interacting with one silently unchecks the other, and the
// radios are what assistive technology reads the selection from. (The visible
// highlight comes from the label's own class, so this is invisible on screen.)

const variants: Variant[] = [
  { originalIndex: 0, label: { hu: 'Könnyű', en: 'Easy' }, disabled: false, hasBotStrategy: true },
  { originalIndex: 1, label: { hu: 'Nehéz', en: 'Hard' }, disabled: false, hasBotStrategy: true }
];

describe('ModeSelector', () => {
  it('keeps two instances in separate radio groups', () => {
    const { getAllByTestId } = render(
      <>
        <ModeSelector isHumanVsHumanGame={false} onSwitchMode={() => {}} disabled={false} />
        <ModeSelector isHumanVsHumanGame={false} onSwitchMode={() => {}} disabled={false} />
      </>
    );

    const [firstComputer, secondComputer] = getAllByTestId('mode-vsComputer') as HTMLInputElement[];

    expect(firstComputer!.name).not.toBe(secondComputer!.name);
    expect(firstComputer!.name).toBeTruthy();
  });

  // The failure this prevents: the browser moves "checked" within a shared
  // group, so picking a mode in the dialog left the sidebar's radio — and, as
  // it happened, both of the dialog's own — reporting nothing selected.
  it('does not uncheck another instance when one is picked', () => {
    const { getAllByTestId } = render(
      <>
        <ModeSelector isHumanVsHumanGame={false} onSwitchMode={() => {}} disabled={false} />
        <ModeSelector isHumanVsHumanGame onSwitchMode={() => {}} disabled={false} />
      </>
    );

    const [firstComputer] = getAllByTestId('mode-vsComputer') as HTMLInputElement[];
    const [, secondHuman] = getAllByTestId('mode-vsHuman') as HTMLInputElement[];

    expect(firstComputer!.checked).toBe(true);
    expect(secondHuman!.checked).toBe(true);

    fireEvent.click(secondHuman!);

    expect(firstComputer!.checked).toBe(true);
  });
});

describe('DifficultySelector', () => {
  it('keeps two instances in separate radio groups', () => {
    const { container } = render(
      <>
        <DifficultySelector variants={variants} selectedIndex={0} onSelect={() => {}} disabled={false} />
        <DifficultySelector variants={variants} selectedIndex={0} onSelect={() => {}} disabled={false} />
      </>
    );

    const names = [...container.querySelectorAll('input[type="radio"]')]
      .map(el => (el as HTMLInputElement).name);

    expect(new Set(names).size).toBe(2); // two groups of two, not one group of four
  });

  it('marks a variant whose bot is not always optimal', () => {
    const withMarker: Variant[] = [
      variants[0]!,
      { ...variants[1]!, notAlwaysOptimal: true }
    ];
    const { getAllByTitle } = render(
      <DifficultySelector variants={withMarker} selectedIndex={0} onSelect={() => {}} disabled={false} />
    );

    expect(getAllByTitle(/nem minden esetben|not always find/i)).toHaveLength(1);
  });
});
