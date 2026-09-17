import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace('import React, { useState, useMemo } from "react";', 'import React, { useState, useMemo, useRef } from "react";')
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Added useRef")
