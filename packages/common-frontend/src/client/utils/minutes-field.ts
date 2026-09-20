import * as Yup from 'yup';

/**
 * The most an add-minutes form may ask for, in either direction.
 *
 * The rule is the server's — `MINUTES_LIMIT` in the backend's `add_minutes.ts`
 * says why there is a bound at all — and both add-minutes routes answer a
 * number past it with a 400, which the page has no line for and reports as an
 * unexpected error. Saying the same number here is what turns that into a
 * message under the field, while the organiser is still typing.
 */
export const MINUTES_LIMIT = 24 * 60;

/**
 * The minutes field both add-minutes forms validate: one running match's, and
 * every running match's.
 *
 * Shared because the two forms ask the same thing of the same two routes, and
 * a bound only one of them knew would leave the other's typo arriving as
 * "Váratlan hiba történt".
 */
export const minutesField = () => Yup.number()
  .integer('Egész számot kell írni')
  .min(-MINUTES_LIMIT, `Legfeljebb ${MINUTES_LIMIT} percet lehet elvenni`)
  .max(MINUTES_LIMIT, `Legfeljebb ${MINUTES_LIMIT} percet lehet adni`)
  .typeError('Számot kell írni')
  .required('Nincs megadva érték');
