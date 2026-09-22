
export const formatChineseDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatDateRange = (start: string, end: string): string => {
  if (!start) return '';
  const s = formatChineseDate(start);
  const e = end ? formatChineseDate(end) : '';
  
  if (!e || s === e) return s;
  return `${s} → ${e}`;
};

export const getDaysArray = (start: Date, days: number): Date[] => {
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(d);
  }
  return result;
};

export const diffInDays = (d1: Date, d2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((d1.getTime() - d2.getTime()) / oneDay);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Parses "YYYY-MM-DD" strictly as local time (00:00:00) to avoid timezone offsets
export const parseAsLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  return new Date(y, m - 1, d);
};
