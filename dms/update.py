import re

with open('client/src/app/(main)/documents/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { FolderIconRenderer } from '@views/components/folders/FolderIconRenderer';",
    "import { FolderIconRenderer } from '@views/components/folders/FolderIconRenderer';\nimport { adminService } from '@/controllers/services/admin.service';"
)

# 2. Update states
state_old = '''  // Filters State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  
  // Unified View Scope: ALL | MY_DEPT | MY_DOCS | CUSTOM_DEPTS
  type ViewScopeOption = "ALL" | "MY_DEPT" | "MY_DOCS" | "CUSTOM_DEPTS";
  const [viewScope, setViewScope] = useState<ViewScopeOption>("ALL");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isDeptPopoverOpen, setIsDeptPopoverOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");'''

state_new = '''  const uniqueDepartments = Array.from(new Set(documents.map((d: any) => d.department || (d as any).creator?.department?.name || "ไม่ระบุ"))).filter(Boolean);

  // Filters State
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>(["All"]);
  const [deptFilter, setDeptFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Personnel Filter State
  const [allSystemUsers, setAllSystemUsers] = useState<{ id: string; name: string }[]>([]);
  const [isPersonnelPopoverOpen, setIsPersonnelPopoverOpen] = useState(false);
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const personnelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminService.getUsersList().then((res: any) => {
      const users = (res || []).filter((u: any) => u.is_active).map((u: any) => ({
        id: u.id,
        name: \\ \\,
      }));
      setAllSystemUsers(users);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (personnelRef.current && !personnelRef.current.contains(event.target as Node)) {
        setIsPersonnelPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);'''
content = content.replace(state_old, state_new)

# 3. Update filteredDocs
old_filter = '''    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.id.toLowerCase().includes(search.toLowerCase()) ||
      (doc.sender && doc.sender.toLowerCase().includes(search.toLowerCase())) ||
      (doc.department && doc.department.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === "All" || doc.type === typeFilter;
    const matchesStatus = doc.status === "Approved";
    
    // Scope Visibility Filter Logic (Unified)
    let matchesScope = true;
    const docDept = doc.department || (doc as any).creator?.department?.name || "ทั่วไป";

    if (viewScope === "MY_DOCS") {
      const isMyId = (doc as any).creator_id && user?.id && (doc as any).creator_id === user.id;
      const isMyName = doc.sender && user && (
        (user.full_name && doc.sender.toLowerCase().includes(user.full_name.toLowerCase())) ||
        (user.username && doc.sender.toLowerCase().includes(user.username.toLowerCase()))
      );
      matchesScope = Boolean(isMyId || isMyName);
    } else if (viewScope === "MY_DEPT") {
      const userDept = user?.department || (user as any)?.department_name || "";
      if (userDept) {
        matchesScope = docDept.toLowerCase().includes(userDept.toLowerCase()) ||
                      userDept.toLowerCase().includes(docDept.toLowerCase());
      }
    } else if (viewScope === "CUSTOM_DEPTS") {
      if (selectedDepartments.length > 0) {
        matchesScope = selectedDepartments.some((dept) =>
          docDept.toLowerCase().includes(dept.toLowerCase()) ||
          dept.toLowerCase().includes(docDept.toLowerCase())
        );
      }
    }

    // Date Range Filter
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const docDate = new Date(doc.submittedDate || (doc as any).created_at || "").getTime();
      if (dateFrom && !isNaN(docDate)) {
        matchesDate = matchesDate && docDate >= new Date(dateFrom).getTime();
      }
      if (dateTo && !isNaN(docDate)) {
        matchesDate = matchesDate && docDate <= new Date(dateTo).getTime() + 86400000;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesScope && matchesDate;'''

new_filter = '''    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      if (!(
        doc.name.toLowerCase().includes(query) ||
        doc.id.toLowerCase().includes(query) ||
        (doc.sender && doc.sender.toLowerCase().includes(query)) ||
        (doc.department && doc.department.toLowerCase().includes(query))
      )) {
        return false;
      }
    }
    
    // Type Filter
    const matchesType = typeFilters.includes("All") || typeFilters.includes(doc.type);
    if (!matchesType) return false;
    
    // Department Filter
    const docDept = doc.department || (doc as any).creator?.department?.name || "ทั่วไป";
    if (deptFilter && docDept !== deptFilter) return false;

    // Personnel Filters
    if (selectedCreators.length > 0) {
      if (!doc.sender || !selectedCreators.includes(doc.sender)) return false;
    }
    if (selectedApprovers.length > 0) {
      if (!doc.approvers || !doc.approvers.some(a => selectedApprovers.includes(a))) return false;
    }

    // Date Range Filter
    if (dateFrom || dateTo) {
      const docDateRaw = (doc as any).created_at || (doc as any).submittedDate;
      if (!docDateRaw) return false;
      const docDate = new Date(docDateRaw);
      docDate.setHours(0, 0, 0, 0);

      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (docDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(0, 0, 0, 0);
        if (docDate > to) return false;
      }
    }

    return true;'''
content = content.replace(old_filter, new_filter)

with open('client/src/app/(main)/documents/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
