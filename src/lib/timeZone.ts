/**
 * Timezone utility functions for time calculations
 */

/**
 * Get hours and minutes in a specific timezone
 * Returns { hours, minutes, date } for the current time in the given timezone
 * This properly handles DST (Daylight Saving Time) by using Intl.DateTimeFormat
 */
export const getTimeInTimeZone = (timeZone: string): { hours: number; minutes: number; date: Date } => {
  const now = new Date();
  
  // Use Intl.DateTimeFormat to get the time in the target timezone
  // This automatically handles DST correctly
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  
  const year = parseInt(parts.find(p => p.type === "year")?.value || "0");
  const month = parseInt(parts.find(p => p.type === "month")?.value || "0") - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === "day")?.value || "0");
  const hours = parseInt(parts.find(p => p.type === "hour")?.value || "0");
  const minutes = parseInt(parts.find(p => p.type === "minute")?.value || "0");

  // Create a date object representing the current date in the target timezone
  // This is used for day comparisons (isSameDay)
  const date = new Date(year, month, day);

  return { hours, minutes, date };
};

/**
 * Get a Date object representing "now" in the target timezone
 * This creates a Date object that represents the current date/time in the target timezone
 * Note: JavaScript Date objects are always in local time, so we create a date
 * that, when displayed, shows the correct timezone-aware values
 */
export const getDateInTimeZone = (timeZone: string): Date => {
  const { hours, minutes, date } = getTimeInTimeZone(timeZone);
  
  // Create a new date with the timezone-aware date and time
  // We use the date from the timezone and set the hours/minutes
  const tzDate = new Date(date);
  tzDate.setHours(hours, minutes, 0, 0);
  
  return tzDate;
};

