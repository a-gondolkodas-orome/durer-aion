// Shared by the admin page's chunk and the entry chunk's router (Main.tsx), so
// it imports nothing.

/// The query parameter naming the competition a problem's editor was opened
/// from, which it goes back to. The problem is shared, so its path is its own.
export const FROM_COMPETITION_PARAM = 'verseny';
