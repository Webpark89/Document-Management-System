const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. Remove `sendingResetLink` and `handleSendResetLink`
const stateLine = lines.findIndex(l => l.includes('const [sendingResetLink, setSendingResetLink] = useState(false);'));
if (stateLine > -1) lines.splice(stateLine, 1);

const handleStart = lines.findIndex(l => l.includes('const handleSendResetLink = async () => {'));
if (handleStart > -1) lines.splice(handleStart, 6);

// 2. Change layout container
const gridLine = lines.findIndex(l => l.includes('grid-cols-1 xl:grid-cols-[1fr_400px] gap-8'));
if (gridLine > -1) {
  lines[gridLine] = lines[gridLine].replace(
    'grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8',
    'max-w-4xl mx-auto'
  );
}

// 3. Update DL
const dlStart = lines.findIndex(l => l.includes('grid-cols-1 sm:grid-cols-3 gap-6'));
const dlEnd = lines.findIndex((l, i) => i > dlStart && l.includes('</dl>'));

if (dlStart > -1 && dlEnd > -1) {
  const newDl = `                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employee ID</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.employeeId}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-all">{profileMeta.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Department</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{displayDepartment}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Position</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.position}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Joined Date</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.joinedAt}</dd>
                      </div>
                    </dl>`;
  lines.splice(dlStart, dlEnd - dlStart + 1, newDl);
}

// 4. Remove ALL cards from the Sidebar
const sidebarIndex = lines.findIndex(l => l.includes('{/* Sidebar */}'));
if (sidebarIndex > -1) {
  // We know the sidebar ends with the closing div before the next closing div
  const endDivs = lines.findIndex((l, i) => i > sidebarIndex && l.includes('</div>') && lines[i+1].includes('</div>') && lines[i+2].includes(') : ('));
  
  if (endDivs > -1) {
    // Delete everything between `<div className="space-y-6">` (which is at sidebarIndex + 1)
    // and the closing `</div>` (which is at endDivs - 1)
    const wrapperStart = sidebarIndex + 2; // Actually `  <div className="space-y-6">` is at +1. The children start at +2
    const wrapperEnd = endDivs - 1;
    
    // We just remove the children of the sidebar
    lines.splice(wrapperStart, wrapperEnd - wrapperStart + 1);
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Layout refactored perfectly!');
