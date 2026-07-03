export function isValidBookingTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export function formatDisplayTime(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return value;
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}
