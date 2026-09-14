const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/views/components/shared/Sidebar.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { useSidebar } from '@views/components/providers/SidebarProvider';",
  "import { useSidebar } from '@views/components/providers/SidebarProvider';\nimport useSWR from 'swr';\nimport { getApprovals } from '@views/features/workflow/api';"
);

const logic = 
  const { data: approvals } = useSWR("approvals-sidebar", getApprovals, { refreshInterval: 15000 });
  const [lastViewed, setLastViewed] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLastViewed(parseInt(localStorage.getItem("lastViewedApprovals") || "0", 10));
    }
  }, []);

  useEffect(() => {
    if (pathname === "/approvals") {
      const now = Date.now();
      localStorage.setItem("lastViewedApprovals", now.toString());
      setLastViewed(now);
    }
  }, [pathname]);

  const unseenCount = useMemo(() => {
    if (!approvals) return 0;
    return approvals.filter(a => a.status === "Pending" && (a.rawSubmittedDate || 0) > lastViewed).length;
  }, [approvals, lastViewed]);
;

c = c.replace('const source = searchParams?.get("source");', 'const source = searchParams?.get("source");\n' + logic);

fs.writeFileSync(path, c);
console.log('done');
