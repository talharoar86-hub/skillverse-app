/**
 * Format a date to Facebook-style short time strings.
 * Examples: "2s", "5m", "3h", "4d", "2w", "Jan 15"
 */
export function formatTimeShort(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 5) return `${diffWeek}w`;

  // Older than 5 weeks: show abbreviated month + day
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();

  if (year === currentYear) return `${month} ${day}`;
  return `${month} ${day}, ${year}`;
}
