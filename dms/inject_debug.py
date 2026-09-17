import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

debug_inject = r"""
      let rejectReason = "";
      // 1. Search
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        if (!log.userName.toLowerCase().includes(lowerTerm) && !log.userId.toLowerCase().includes(lowerTerm)) {
          rejectReason = "Search";
          return false;
        }
      }
      // 2. Date Range
      const logDate = log.timestamp.substring(0, 10);
      if (dateFrom && logDate < dateFrom) { rejectReason = "DateFrom"; return false; }
      if (dateTo && logDate > dateTo) { rejectReason = "DateTo"; return false; }
      
      // 3. Module
      if (selectedModule !== "All" && log.module !== selectedModule) { rejectReason = "Module"; return false; }

      // 4. Action
      if (selectedActions.size > 0 && !selectedActions.has(log.action)) { rejectReason = "Action"; return false; }
"""

content = re.sub(
    r'\s*// 1\. Search.*?(?=\s*return true;)',
    debug_inject,
    content,
    flags=re.DOTALL
)

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Injected debug")
