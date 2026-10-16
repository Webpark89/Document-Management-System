import json
import re
from pathlib import Path
from pypdf import PdfReader

d = Path(r"D:/Document Management/tmp/report")
pdf = PdfReader(str(d / "report-preview.pdf"))
mapping = {
    "chapter1": 1, "1.1": 1, "1.2": 1, "1.3": 1, "1.4": 1, "1.5": 2, "1.6": 2,
    "chapter2": 3, "2.1": 3, "2.2": 3, "2.3": 3, "2.4": 3, "2.5": 3,
    "chapter3": 4, "3.1": 4, "3.2": 4, "3.3": 5, "3.4": 7, "3.5": 9, "3.6": 10, "3.7": 11,
    "chapter4": 12, "4.1": 12, "4.2": 13, "4.3": 13,
    "chapter5": 14, "5.1": 14, "5.2": 14, "5.3": 14, "5.4": 14,
    "references": 15, "appendixA": 16, "appendixB": 18, "biography": 20,
}
mapping.update({f"table{i}": page for i, page in enumerate([1, 2, 8, 10, 10, 11, 13], 1)})
mapping.update({f"figure{i}": page for i, page in enumerate([4, 5, 5, 6, 7, 8, 9, 9, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13], 1)})
mapping.update({f"appfigure{i}": 17 for i in range(1, 4)})
for physical, page in enumerate(pdf.pages, 1):
    if physical < 11:
        continue
    text = page.extract_text() or ""
    printed = physical - 10
    for number in re.findall(r"ตารางที่\s*(\d+)", text):
        mapping.setdefault(f"table{number}", printed)
    for number in re.findall(r"ภาพที่\s*(\d+)", text):
        mapping.setdefault(f"figure{number}", printed)
    for number in re.findall(r"ภาพภาคผนวกที่\s*ก\s*(\d+)", text):
        mapping.setdefault(f"appfigure{number}", printed)

(d / "page_map.json").write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8")
print("mapped", len(mapping), "items")
print("unmapped tables", sorted(set(range(1, 8)) - {int(k[5:]) for k in mapping if re.fullmatch(r"table\d+", k)}))
print("unmapped figures", sorted(set(range(1, 19)) - {int(k[6:]) for k in mapping if re.fullmatch(r"figure\d+", k)}))
