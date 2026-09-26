const hungarianTime = new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit" });

/// Accepts a string too: a match status fetched as JSON carries its `startAt`
/// and `endAt` as ISO strings despite the `Date` in its type. An unparseable
/// value throws a RangeError rather than rendering a time.
export const formatTime = (time: Date | string): string => hungarianTime.format(new Date(time));
