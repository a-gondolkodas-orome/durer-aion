import { useId, useState, type ReactNode } from 'react';
import { useTranslation, type I18nNode } from '../../../language';

// Persist each section's open/closed state for the tab session, so it survives
// navigating to a game page and back (which unmounts the overview). sessionStorage
// access is guarded so a disabled/unavailable store just falls back to defaults.
const storageKeyPrefix = 'durer:overview-section:';

const readStoredOpen = (key: string): boolean | undefined => {
  try {
    const stored = sessionStorage.getItem(storageKeyPrefix + key);
    return stored === null ? undefined : stored === 'true';
  } catch {
    return undefined;
  }
};

const writeStoredOpen = (key: string, value: boolean): void => {
  try {
    sessionStorage.setItem(storageKeyPrefix + key, String(value));
  } catch { /* storage unavailable — remembering is best-effort */ }
};

// A manually controlled collapsible section (rather than Headless UI's
// Disclosure, whose `defaultOpen` is not reactive) so callers can force a
// collapsed section open — e.g. when the category filter has matching results.
export const CollapsibleSection = ({
  title, trailing, defaultOpen, forceOpen = false, storageKey, dataTestid, children
}: {
  title: I18nNode
  trailing?: ReactNode
  defaultOpen: boolean
  forceOpen?: boolean
  storageKey?: string // stable id under which the open state is remembered
  dataTestid?: string
  children: ReactNode
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => {
    const stored = storageKey === undefined ? undefined : readStoredOpen(storageKey);
    return stored ?? defaultOpen;
  });
  const panelId = useId();

  const isOpen = open || forceOpen;

  const toggleOpen = () => setOpen(prev => {
    const next = !prev;
    if (storageKey !== undefined) writeStoredOpen(storageKey, next);
    return next;
  });

  return (
    <section className="mb-2" data-testid={dataTestid}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-center gap-2 my-4 hocus:text-blue-600 dark:hocus:text-blue-400"
      >
        <span
          aria-hidden="true"
          className="inline-block transition-transform"
          style={{ transform: isOpen ? 'rotate(90deg)' : undefined }}
        >▸</span>
        <h2>{t(title)}</h2>
        {trailing}
      </button>
      {isOpen && <div id={panelId}>{children}</div>}
    </section>
  );
};
