import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add formatIP and formatID before getting to the table
helpers = r'''
  // 3. Styling Helpers
  const formatIP = (ip: string) => ip.replace(/^::ffff:/, '');
  const formatID = (id: string) => {
    if (!id || id === "-") return "-";
    if (id.length > 8 && id.includes("-")) return id.split("-")[0];
    return id.substring(0, 8);
  };
'''
content = re.sub(r'\s*// 3\. Styling Helpers', helpers, content)

# User column
user_old = r'<div className="text-\[10px\] text-slate-500 font-medium">ID: \{log\.userId\}</div>'
user_new = r'<div className="text-[10px] text-slate-500 font-medium" title={log.userId}>ID: #{formatID(log.userId)}</div>'
content = re.sub(user_old, user_new, content)

# Target column
target_old = r'<span className="text-\[10px\] text-slate-400 font-mono">\{log\.targetId\}</span>'
target_new = r'<span className="text-[10px] text-slate-400 font-mono" title={log.targetId}>#{formatID(log.targetId)}</span>'
content = re.sub(target_old, target_new, content)

# IP column
ip_old = r'<td className="py-3 px-4 text-xs text-slate-500 font-mono">\s*\{log\.ipAddress\}\s*</td>'
ip_new = r'<td className="py-3 px-4 text-xs text-slate-500 font-mono">\n                              {formatIP(log.ipAddress)}\n                            </td>'
content = re.sub(ip_old, ip_new, content)


with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated UI formatting")
