// ============================================================
// Thai Date Formatting Utility
// Converts ISO date strings, timestamps, or Date objects into unified D/M/YYYY (BE) format
// Example: "2026-08-18T02:00:00.000Z" -> "18/8/2569"
// ============================================================

const THAI_MONTHS: Record<string, number> = {
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
  "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
  "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
};

export function formatThaiDate(dateInput?: string | Date | number | null, includeTime: boolean = false): string {
  if (!dateInput) return "-";

  // If input is a string
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return "-";

    // If already in D/M/YYYY format (e.g. "14/8/2569" or "28/8/2569")
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
    if (slashMatch) {
      const d = parseInt(slashMatch[1], 10);
      const m = parseInt(slashMatch[2], 10);
      let y = parseInt(slashMatch[3], 10);
      const rest = slashMatch[4] || "";
      if (y > 3000) y -= 543; // Fix double BE addition
      return `${d}/${m}/${y}${rest}`;
    }

    // Check if it contains Thai month names like "8 ธ.ค. 2569" or "8 ธ.ค. 3112"
    for (const [mName, mNum] of Object.entries(THAI_MONTHS)) {
      if (trimmed.includes(mName)) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          let year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(year)) {
            if (year > 3000) year -= 543; // Fix double BE addition
            if (year < 2500) year += 543;
            let res = `${day}/${mNum}/${year}`;
            if (includeTime && parts.length >= 4) {
              res += ` ${parts.slice(3).join(" ")}`;
            }
            return res;
          }
        }
      }
    }
  }

  let date: Date;
  if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    const parsed = Date.parse(String(dateInput));
    if (!isNaN(parsed)) {
      date = new Date(parsed);
    } else {
      return String(dateInput);
    }
  }

  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  let yearBE = date.getFullYear();

  // Convert AD year (e.g. 2026) to BE (+543 = 2569)
  if (yearBE < 2500) {
    yearBE += 543;
  } else if (yearBE > 3000) {
    yearBE -= 543;
  }

  let result = `${day}/${month}/${yearBE}`;

  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    result += ` ${hours}:${minutes} น.`;
  }

  return result;
}
