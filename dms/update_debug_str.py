import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

debug_str_pattern = r'Debug: realLogs=\{realLogs\.length\}, filteredLogs=\{filteredLogs\.length\}'
new_debug_str = r'Debug: realLogs={realLogs.length}, filteredLogs={filteredLogs.length}, sMod={selectedModule}, sAct={selectedActions.size}'

content = re.sub(debug_str_pattern, new_debug_str, content)

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated debug string")
