const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Update the grid layout container (line 166)
const gridLineIndex = lines.findIndex(l => l.includes('grid-cols-1 xl:grid-cols-[1fr_400px] gap-8'));
if (gridLineIndex > -1) {
  lines[gridLineIndex] = lines[gridLineIndex].replace(
    'grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8',
    'max-w-5xl mx-auto'
  );
}

// Now replace the DL section
const dlStart = lines.findIndex(l => l.includes('grid-cols-1 sm:grid-cols-3 gap-6'));
const dlEnd = lines.findIndex((l, i) => i > dlStart && l.includes('</dl>'));

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

// Find Contact section and remove it
const contactStart = lines.findIndex(l => l.includes('Contact</h3>'));
if (contactStart > -1) {
  // Go up to the <section> tag
  let sectionStart = contactStart;
  while (sectionStart > 0 && !lines[sectionStart].includes('<section className={CARD_CLASS}>')) {
    sectionStart--;
  }
  
  // Go down to </section> tag
  let sectionEnd = contactStart;
  while (sectionEnd < lines.length && !lines[sectionEnd].includes('</section>')) {
    sectionEnd++;
  }
  
  lines.splice(sectionStart, sectionEnd - sectionStart + 1);
}

// Remove empty Sidebar wrapper
const sidebarComment = lines.findIndex(l => l.includes('{/* Sidebar */}'));
if (sidebarComment > -1) {
  // It looks like:
  // {/* Sidebar */}
  // <div className="space-y-6">
  // </div>
  lines.splice(sidebarComment, 3);
}

// Remove the left column wrapper
// <div className="space-y-8"> is at line 167 usually. Let's find it.
const spaceY8 = lines.findIndex(l => l.includes('<div className="space-y-8">'));
if (spaceY8 > -1) {
  lines.splice(spaceY8, 1);
}

// But removing `<div className="space-y-8">` means we have an extra `</div>` at the end of the left column block!
// The end of the left column block is right before {/* Sidebar */}
// Since we removed {/* Sidebar */}, it was previously at some line.
// Let's find `</section>` of Signature Upload, and the `</div>` after it.
const sigEnd = lines.findIndex(l => l.includes('Update Signature" : "Save Signature"}'));
if (sigEnd > -1) {
  let closingDiv = sigEnd;
  while (closingDiv < lines.length && !lines[closingDiv].includes('</div>')) {
    closingDiv++;
  }
  // The first </div> after the button is the button's wrapper? No, the button is inside a div.
  // Wait, let's just write the whole layout cleanly without messing with precise div balancing via scripts.
}

fs.writeFileSync('temp_refactor2.txt', lines.join('\n'));
console.log('Done script');
