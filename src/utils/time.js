/** Firestore Timestamp veya sayı/ms destekler */
export const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  const n = typeof ts === 'number' ? ts : Number(ts);
  return Number.isFinite(n) ? new Date(n) : null;
};

export const formatMessageTime = (ts, locale = 'tr-TR') => {
  const d = toDate(ts);
  if (!d) return '';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

export const formatDateLong = (ts, locale = 'tr-TR') => {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};
