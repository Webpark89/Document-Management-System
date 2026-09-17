import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add a ref for reject reasons
ref_inject = r'  const [selectedModule, setSelectedModule] = useState<ModuleType | "All">("All");\n  const rejectReasons = useRef<Record<string, number>>({});'

content = re.sub(r'  const \[selectedModule, setSelectedModule\] = useState<ModuleType \| "All">.*?;', ref_inject, content)

# Clear it in useMemo
memo_start = r'  const filteredLogs = useMemo\(\(\) => \{\n    rejectReasons.current = \{\};\n    const data = \[\.\.\.realLogs\]\.filter\(log => \{'
content = re.sub(r'  const filteredLogs = useMemo\(\(\) => \{\n    const data = \[\.\.\.realLogs\]\.filter\(log => \{', memo_start, content)

# Record reasons
def replace_reason(match):
    reason = match.group(1)
    return f'{{ rejectReasons.current["{reason}"] = (rejectReasons.current["{reason}"] || 0) + 1; return false; }}'

content = re.sub(r'\{ rejectReason = "(.*?)"; return false; \}', replace_reason, content)

# Show it
debug_pattern = r'Debug: realLogs=\{realLogs\.length\}, filteredLogs=\{filteredLogs\.length\}, sMod=\{selectedModule\}, sAct=\{selectedActions\.size\}'
new_debug = r'Debug: realLogs={realLogs.length}, filteredLogs={filteredLogs.length} | Rejects: {JSON.stringify(rejectReasons.current)}'
content = re.sub(debug_pattern, new_debug, content)

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated reject tracking")
