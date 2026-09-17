import re

with open("client/src/app/(main)/admin/reports/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add useAuth import
import_insert = "import { useAuth } from '@views/components/providers/AuthProvider';\n"
content = re.sub(r'(import PageHeader from)', import_insert + r'\1', content)

# Add useAuth to ReportsPage component
component_start = r'(export default function ReportsPage\(\) \{\n)'
hook_insert = r'\1  const { user } = useAuth();\n  const hasPerm = (itemKey: string, action: string = \'view\') =>\n    user?.role === "Administrator" || !!user?.permissions?.includes(`reports.${itemKey}:${action}`);\n\n  if (!hasPerm("access")) {\n    return (\n      <div className="flex flex-col items-center justify-center p-12 text-slate-400 mt-12">\n        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />\n        <p className="text-lg font-bold text-slate-600">ไม่มีสิทธิ์เข้าถึง (Access Denied)</p>\n        <p className="text-sm">คุณไม่มีสิทธิ์เข้าถึงรายงานในระบบ</p>\n      </div>\n    );\n  }\n\n'

content = re.sub(component_start, hook_insert, content)

# Guard export button (search for "Export CSV")
export_btn_pattern = r'(<button[^>]*>\s*<Download className="w-3\.5 h-3\.5" \/>\s*Export CSV\s*<\/button>)'
export_btn_replacement = r'{hasPerm("export_reports") && (\1)}'
content = re.sub(export_btn_pattern, export_btn_replacement, content)

# Guard department filter
dept_filter_pattern = r'(<select\s+value=\{deptFilter\}[^>]*>.*?<\/select>)'
dept_filter_replacement = r'{hasPerm("view_all_dept") ? (\1) : (<select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 shadow-sm cursor-not-allowed opacity-70" disabled><option value="">เฉพาะแผนกของคุณ</option></select>)}'
content = re.sub(dept_filter_pattern, dept_filter_replacement, content, flags=re.DOTALL)

with open("client/src/app/(main)/admin/reports/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated reports page")
