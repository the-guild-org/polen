import { DateOnly } from '#lib/date-only/$'

export const renderDate = (dateOnly: DateOnly.DateOnly) => {
  const date = DateOnly.toDate(dateOnly)
  const year = date.getUTCFullYear()
  return `${year} ${
    date.toLocaleString('default', {
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }`
}
