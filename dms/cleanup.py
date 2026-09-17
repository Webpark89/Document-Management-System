import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Revert ref
content = re.sub(r'  const rejectReasons = useRef<Record<string, number>>\(\{\}\);\n', '', content)
content = re.sub(r'import React, \{ useState, useMemo, useRef \} from "react";', 'import React, { useState, useMemo } from "react";', content)

# Revert useMemo start
memo_clean = r'  const filteredLogs = useMemo\(\(\) => \{\n    const data = \[\.\.\.realLogs\]\.filter\(log => \{'
content = re.sub(r'  const filteredLogs = useMemo\(\(\) => \{\n    rejectReasons\.current = \{\};\n    const data = \[\.\.\.realLogs\]\.filter\(log => \{', memo_clean, content)

# Revert rejects
content = re.sub(r'\{ rejectReasons\.current\["Search"\] = \(rejectReasons\.current\["Search"\] \|\| 0\) \+ 1; return false; \}', 'return false;', content)
content = re.sub(r'\{ rejectReasons\.current\["DateFrom"\] = \(rejectReasons\.current\["DateFrom"\] \|\| 0\) \+ 1; return false; \}', 'return false;', content)
content = re.sub(r'\{ rejectReasons\.current\["DateTo"\] = \(rejectReasons\.current\["DateTo"\] \|\| 0\) \+ 1; return false; \}', 'return false;', content)
content = re.sub(r'\{ rejectReasons\.current\["Module"\] = \(rejectReasons\.current\["Module"\] \|\| 0\) \+ 1; return false; \}', 'return false;', content)
content = re.sub(r'\{ rejectReasons\.current\["Action"\] = \(rejectReasons\.current\["Action"\] \|\| 0\) \+ 1; return false; \}', 'return false;', content)

# Revert debug UI
content = re.sub(r'Debug: realLogs=\{realLogs\.length\}, filteredLogs=\{filteredLogs\.length\} \| Rejects: \{JSON\.stringify\(rejectReasons\.current\)\}', 'Debug: realLogs={realLogs.length}, filteredLogs={filteredLogs.length}', content)

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Cleaned up debug")
