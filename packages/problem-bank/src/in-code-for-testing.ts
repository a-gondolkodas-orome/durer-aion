/// What `held` holds as `id`, for a suite that names a competition or a
/// problem held in code: one the code no longer holds fails the suite here,
/// not as an undefined further on.
export function inCode<T>(held: ReadonlyMap<string, T>, id: string): T {
  const found = held.get(id);
  if (found === undefined) throw new Error(`The code holds no ${id}`);
  return found;
}
