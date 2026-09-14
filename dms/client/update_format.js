const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/lib/format-date.ts';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('formatThaiTime')) {
  c += \nexport function formatThaiTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "-";
  let date: Date;
  if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    // If it's a string, maybe it already has time like "18/8/2569 16:15 ¹."
    if (typeof dateInput === "string") {
      const match = dateInput.match(/(\\d{1,2}:\\d{2})/);
      if (match) return match[1] + " ¹.";
    }
    const parsed = Date.parse(String(dateInput));
    if (!isNaN(parsed)) {
      date = new Date(parsed);
    } else {
      return "-";
    }
  }

  if (isNaN(date.getTime())) return "-";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return \\:\ ¹.\;
}\n;
  fs.writeFileSync(path, c);
}
console.log('done');
