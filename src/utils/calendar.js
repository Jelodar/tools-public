/**
 * Calendar Utilities
 * Leveraging native Intl API for Persian (Jalali) display.
 */

/**
 * Formats a JS Date into a Persian string with Latin numbers for consistency.
 * @param {Date} date 
 * @param {string} dateStyle - 'full', 'long', 'medium', 'short'
 * @returns {string}
 */
export function formatPersian(date, dateStyle = 'full') {
  return new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    dateStyle,
    calendar: 'persian'
  }).format(date);
}

/**
 * Gets specific parts of the Persian calendar for a date.
 * @param {Date} date 
 * @returns {Object} { year, month, day }
 */
export function getPersianParts(date) {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date);
  
  const find = (type) => parseInt(parts.find(p => p.type === type).value);
  return {
    year: find('year'),
    month: find('month'),
    day: find('day')
  };
}

/**
 * Rough conversion from Jalali to Gregorian via iterative search (as Intl doesn't parse).
 */
export function jalaliToGregorian(jy, jm, jd) {
  // Start search around expected Gregorian year
  let date = new Date(Date.UTC(jy + 621, 2, 21)); 
  date.setUTCDate(date.getUTCDate() - 30); // Buffer
  
  for (let i = 0; i < 90; i++) {
    const check = getPersianParts(date);
    if (check.year === jy && check.month === jm && check.day === jd) {
      return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return [jy + 621, 3, 21]; // Fallback
}

export function isGregorianLeap(gy) {
  return (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
}

export function isJalaliLeap(jy) {
  const d1 = new Date(Date.UTC(jy + 621, 2, 21));
  const d2 = new Date(Date.UTC(jy + 622, 2, 21));
  const diff = (d2 - d1) / 86400000;
  return diff === 366;
}
