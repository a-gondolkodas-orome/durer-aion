import { describe, it, expect } from 'vitest';
import { Sequelize } from 'sequelize';
import { OTHER_IMPORT_MAX_LENGTH, OTHER_MAX_LENGTH, TeamModel, appendOtherNote, teamAttributes } from './model';

// A postgres Sequelize that is never connected, as db.test.ts uses: `validate()`
// runs the attribute validators in process and touches no database, which is
// what makes the real column rules testable here at all (#131 is the rest).
const sequelize = new Sequelize('db', 'user', 'password', { dialect: 'postgres', logging: false });
TeamModel.init(teamAttributes, { sequelize, tableName: 'Teams' });

const team = (other: string) => TeamModel.build({
  teamId: '8eae8669-125c-42e5-8b49-89afbac31679',
  joinCode: '000-0000-000',
  teamName: 'Alpha',
  category: 'C',
  credentials: '4f1d3d3c-6d2a-4f5b-9c8d-0e1f2a3b4c5d',
  email: 'team@example.com',
  pageState: 'HOME',
  relayMatch: { state: 'NOT STARTED' },
  strategyMatch: { state: 'NOT STARTED' },
  other,
});

describe('the other field', () => {
  // The regression: the validator asked for 700 where the column holds 1024, so
  // a team imported at the import's own limit could not take a single audit
  // note — and the reset that appended it was refused for good.
  it('accepts everything the column holds', async () => {
    await expect(team('x'.repeat(OTHER_MAX_LENGTH)).validate()).resolves.toBeDefined();
  });

  it('refuses more than the column holds', async () => {
    await expect(team('x'.repeat(OTHER_MAX_LENGTH + 1)).validate()).rejects.toThrow(/Other field/);
  });

  // The gap is the audit trail's room. A team at the import's limit must still
  // have somewhere for the admin routes to write.
  it('leaves the import room to grow into', () => {
    expect(OTHER_IMPORT_MAX_LENGTH).toBeLessThan(OTHER_MAX_LENGTH);
  });

  it('takes an audit note on top of notes imported at the import limit', async () => {
    const imported = 'x'.repeat(OTHER_IMPORT_MAX_LENGTH);

    const appended = appendOtherNote(imported, 'prevstratid:0EKBiMgbJ5A');

    expect(appended).toBe(`${imported} prevstratid:0EKBiMgbJ5A`);
    await expect(team(appended).validate()).resolves.toBeDefined();
  });
});

describe('appendOtherNote', () => {
  it('separates the note from the notes already there', () => {
    expect(appendOtherNote('Radnóti, Budapest', 'te[0EKBiMgbJ5A]:10'))
      .toBe('Radnóti, Budapest te[0EKBiMgbJ5A]:10');
  });

  it('does not lead with a separator when there are no notes', () => {
    expect(appendOtherNote('', 'te[0EKBiMgbJ5A]:10')).toBe('te[0EKBiMgbJ5A]:10');
  });

  // A team imported from a row with no `Other` column has null here, and `+=`
  // on that wrote the string "null" into the field.
  it('treats a missing field as empty rather than writing "null"', () => {
    expect(appendOtherNote(null, 'prevrelayid:0EKBiMgbJ5A')).toBe('prevrelayid:0EKBiMgbJ5A');
    expect(appendOtherNote(undefined, 'prevrelayid:0EKBiMgbJ5A')).toBe('prevrelayid:0EKBiMgbJ5A');
  });

  // The note is a convenience; the reset that writes it is not. A field with no
  // room left costs the note, never the admin action that came with it.
  it('leaves the notes as they were when the note will not fit', () => {
    const full = 'x'.repeat(OTHER_MAX_LENGTH);

    expect(appendOtherNote(full, 'te[0EKBiMgbJ5A]:10')).toBe(full);
  });

  it('fills the field exactly to the limit rather than stopping short', async () => {
    const note = 'te[0EKBiMgbJ5A]:10';
    const room = 'x'.repeat(OTHER_MAX_LENGTH - note.length - 1);

    const appended = appendOtherNote(room, note);

    expect(appended).toHaveLength(OTHER_MAX_LENGTH);
    await expect(team(appended).validate()).resolves.toBeDefined();
  });
});
