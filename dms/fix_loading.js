const fs = require('fs');
const file = 'client/src/views/components/forms/ApprovalWorkflowSection.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add isLoading state
content = content.replace(
  'const [users, setUsers] = useState<any[]>([]);',
  'const [users, setUsers] = useState<any[]>([]);\n  const [isLoading, setIsLoading] = useState(true);'
);

// Update useEffect to toggle isLoading
content = content.replace(
  '.catch(() => {});',
  '.catch(() => {}).finally(() => setIsLoading(false));'
);

// Update the dropdown option
content = content.replace(
  '{users.length === 0 ? (',
  '{isLoading ? ('
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed loading state!');
