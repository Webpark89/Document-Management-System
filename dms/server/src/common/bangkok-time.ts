import { BadRequestException } from '@nestjs/common';
export function bangkokDateKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}
export function bangkokDayStart(key: string) {
  const date = new Date(`${key}T00:00:00+07:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(key) ||
    Number.isNaN(date.getTime()) ||
    bangkokDateKey(date) !== key
  )
    throw new BadRequestException('วันที่ไม่ถูกต้อง');
  return date;
}
export function bangkokMonthRange(now = new Date()) {
  const month = bangkokDateKey(now).slice(0, 7);
  const start = bangkokDayStart(`${month}-01`);
  const [year, number] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, number, 1) - 7 * 3600000);
  return { start, end };
}
