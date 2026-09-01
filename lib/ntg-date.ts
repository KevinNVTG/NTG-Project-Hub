export const NTG_TIME_ZONE = 'America/Los_Angeles'

/** Calendar date in Nevada/Pacific time, formatted YYYY-MM-DD for HTML date inputs and Postgres date columns. */
export function ntgToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NTG_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

/** Add calendar days to an NTG date without converting the date through UTC. */
export function addDaysToNtgDate(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

/** Format an instant such as created_at using Nevada/Pacific local time. */
export function formatNtgDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: NTG_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
