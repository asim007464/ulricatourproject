"use client";

import { useMemo, useState } from "react";
import {
  formatIsoDateForDisplay,
  normalizeToIsoDate,
  parseBlockedDates,
} from "@/lib/product-availability";

type ProductAvailabilityFieldProps = {
  initialDates?: unknown;
};

export default function ProductAvailabilityField({
  initialDates,
}: ProductAvailabilityFieldProps) {
  const [dates, setDates] = useState<string[]>(() =>
    parseBlockedDates(initialDates)
  );
  const [pickerValue, setPickerValue] = useState("");
  const [hint, setHint] = useState("");

  const serialized = useMemo(() => JSON.stringify(dates), [dates]);

  function addDate() {
    setHint("");
    const iso = normalizeToIsoDate(pickerValue);
    if (!iso) {
      setHint("Choose a valid date.");
      return;
    }
    if (dates.includes(iso)) {
      setHint("That date is already blocked.");
      return;
    }
    setDates((current) => [...current, iso].sort());
    setPickerValue("");
  }

  function removeDate(iso: string) {
    setDates((current) => current.filter((entry) => entry !== iso));
    setHint("");
  }

  return (
    <fieldset className="admin-availability-field">
      <legend>Unavailable dates</legend>
      <p className="admin-muted">
        Block specific days on the booking calendar. Other customers can still
        book the same date unless you add it here — multiple bookings per day
        are allowed.
      </p>

      <div className="admin-availability-add">
        <input
          type="date"
          value={pickerValue}
          onChange={(event) => setPickerValue(event.target.value)}
          aria-label="Date to block"
        />
        <button
          type="button"
          className="admin-btn admin-btn-small"
          onClick={addDate}
        >
          Block Date
        </button>
      </div>

      {hint ? <p className="admin-error admin-availability-hint">{hint}</p> : null}

      {dates.length ? (
        <ul className="admin-availability-list">
          {dates.map((iso) => (
            <li key={iso} className="admin-availability-chip">
              <span className="admin-availability-chip__date">
                {formatIsoDateForDisplay(iso)}
              </span>
              <button
                type="button"
                className="admin-availability-remove"
                onClick={() => removeDate(iso)}
                aria-label={`Remove ${formatIsoDateForDisplay(iso)}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-muted admin-availability-empty">
          No blocked dates. All future dates stay open for booking.
        </p>
      )}

      <input type="hidden" name="blocked_dates" value={serialized} />
    </fieldset>
  );
}
