import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * EventDatePicker — a real calendar for choosing the event date.
 *
 * WHY REPLACE <input type="date">
 * -----------------------------------
 * The native widget is not a date picker, it is a thin skin over the operating
 * system's. It looks nothing like the rest of this site, it cannot be styled to
 * match the brand, it renders differently on every phone, and — the part that
 * actually matters — it cannot show anything about a given date. It cannot tell
 * a client that the date they just tapped has all four StudioStations committed
 * and the one they wanted is free.
 *
 * WHAT THIS SHOWS INSTEAD
 * -----------------------
 * Live availability from the booking service, inline on the calendar. Four kits,
 * each bookable once per night, so a date is genuinely either open, the last
 * one, or gone. Finding that out here rather than after filling in a form is the
 * whole point.
 *
 * IT DEGRADES, IT DOES NOT BREAK
 * ------------------------------
 * Availability comes from a different origin (book.partyfavorphoto.com) and that
 * origin may be unreachable, rate limited, or not yet deployed. In every one of
 * those cases the calendar still works as a calendar: the marks disappear and a
 * line of text says so. A date picker that refuses to open when an API is down
 * is worse than the input it replaced.
 *
 * MOBILE FIRST
 * ------------
 * Single column, 44px minimum tap targets, and month paging rather than a
 * cramped multi-month grid. Most people booking a party booth are on a phone,
 * often following a link from an email.
 */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

type Availability = {
  date: string;
  available: number;
  capacity: number;
  state: 'open' | 'limited' | 'full';
};

export type DatePickerProps = {
  value: string | null;              // YYYY-MM-DD
  onChange: (iso: string | null) => void;
  className?: string;
  /** Where to ask about availability. Omit to render a plain calendar. */
  availabilityUrl?: string;
  disabled?: boolean;
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const EventDatePicker: React.FC<DatePickerProps> = ({
  value, onChange, className, availabilityUrl, disabled,
}) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState<Date>(() => {
    if (!value) return new Date(today.getFullYear(), today.getMonth(), 1);
    const d = new Date(value + 'T00:00:00');
    return Number.isNaN(d.getTime())
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [avail, setAvail] = useState<Record<string, Availability>>({});
  const [loading, setLoading] = useState(false);
  const [availError, setAvailError] = useState(false);
  const requested = useRef<Set<string>>(new Set());

  const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;

  // Fetch the month on demand and cache it. Months are paged, not preloaded —
  // pulling a year of availability for someone who books one night is a waste
  // of both the client's bandwidth and ours.
  useEffect(() => {
    if (!availabilityUrl || requested.current.has(monthKey)) return;
    requested.current.add(monthKey);

    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const from = iso(first);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const url = `${availabilityUrl.replace(/\/$/, '')}/availability?from=${from}&days=${days}`;

    const ac = new AbortController();
    setLoading(true);
    fetch(url, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error('availability unavailable');
        return r.json();
      })
      .then((j) => {
        const map: Record<string, Availability> = {};
        for (const d of (j?.days ?? [])) map[d.date] = d;
        setAvail((prev) => ({ ...prev, ...map }));
        setAvailError(false);
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        // One note to the user, not a broken widget. The calendar still picks
        // dates; we have simply lost the "is a kit free" marks.
        setAvailError(true);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [monthKey, cursor, availabilityUrl]);

  const shift = useCallback((delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);

  const grid = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const nDays = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= nDays; d++) cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const atStart = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const pretty = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US',
      { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className={cn('w-full', className)}>
      {/* Month header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atStart}
          aria-label="Previous month"
          className="p-2 -ml-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted
                     disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed
                     min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-base sm:text-lg">{monthLabel}</span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="p-2 -mr-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted
                     min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i}
               className="text-center text-[11px] sm:text-xs font-medium text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid — 44px cells so a thumb can hit them */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
        {grid.map((date, i) => {
          if (!date) return <div key={`e${i}`} aria-hidden className="h-11 sm:h-12" />;

          const d = new Date(date + 'T00:00:00');
          const isPast = d < today;
          const info = avail[date];
          const full = info ? info.available <= 0 : false;
          const limited = info ? info.state === 'limited' && info.available > 0 : false;
          const selected = date === value;
          const blocked = disabled || isPast || full;

          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              disabled={blocked}
              aria-selected={selected}
              aria-label={d.toLocaleDateString('en-US',
                { weekday: 'long', month: 'long', day: 'numeric' })}
              onClick={() => { if (!blocked) onChange(date); }}
              className={cn(
                'h-11 sm:h-12 rounded-lg text-sm sm:text-[15px] flex flex-col items-center justify-center',
                'transition-colors relative border',
                blocked
                  ? 'text-muted-foreground/35 cursor-not-allowed border-transparent line-through'
                  : 'hover:bg-primary/10 border-transparent',
                full && 'bg-destructive/10 border-destructive/25 text-destructive/50',
                limited && !full && 'border-primary/30 bg-primary/5',
                selected && 'bg-primary text-primary-foreground border-primary hover:bg-primary font-semibold',
                isPast && 'bg-transparent',
              )}
            >
              <span>{d.getDate()}</span>
              {/* Availability dot: a mark, not a number. The number belongs in
                  the funnel where the booking is made, not here where it is a
                  hint. */}
              {!isPast && !full && info && !selected && (
                <span className={cn('w-1 h-1 rounded-full mt-0.5',
                  limited ? 'bg-primary' : 'bg-primary/40')} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend — only once we actually know something */}
      {availabilityUrl && !availError && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] sm:text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/40" /> Kits available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" /> Last kit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive/50" /> Fully booked
          </span>
        </div>
      )}

      {/* Honest about a degraded fetch rather than silently plain */}
      {availabilityUrl && availError && (
        <p className="mt-3 text-[11px] sm:text-xs text-muted-foreground">
          Live availability is temporarily unavailable — you can still pick any date and
          we will confirm your StudioStation when you book.
        </p>
      )}

      {/* Selection readout: a calendar showing a highlighted square is not
          confirmation that it registered. */}
      {pretty && (
        <p className="mt-3 text-sm font-medium text-primary">
          {pretty}
          {!avail[value!] && <span className="font-normal text-muted-foreground"> — availability not yet confirmed</span>}
          {avail[value!] && avail[value!]!.available > 0 && (
            <span className="font-normal text-muted-foreground">
              {' '}— {avail[value!]!.available} of {avail[value!]!.capacity} kits free
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default EventDatePicker;
