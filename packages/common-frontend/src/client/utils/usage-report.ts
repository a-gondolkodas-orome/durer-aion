// What the shared screens tell an app's usage tracking. Nothing by default:
// an app that tracks sets a reporter before rendering (the competition's
// tracking.ts), so the screens need not know which tracker, or whether any.
export type UsageEvent = 'connection-lost' | 'crash';

let reporter: (event: UsageEvent, data?: Record<string, string>) => void = () => undefined;

export function setUsageReporter(report: typeof reporter) {
  reporter = report;
}

export function reportUsage(event: UsageEvent, data?: Record<string, string>) {
  reporter(event, data);
}
