const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the grid layout container
content = content.replace(
  '<div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">',
  '<div className="max-w-4xl mx-auto space-y-8">'
);

// 2. Remove the wrapping left div since we are a single column now
content = content.replace('<div className="space-y-8">', '');
// Wait, we need to be careful with closing tags. Instead of string replace, let's just use precise replacements.

// Add Email and Joined Date to the DL list
const originalDl = `<dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employee ID</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.employeeId}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Department</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{displayDepartment}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Position</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.position}</dd>
                      </div>
                    </dl>`;

const newDl = `<dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

content = content.replace(originalDl, newDl);

// 3. Find and remove the sidebar Contact section entirely
const contactStart = content.indexOf('<!-- Sidebar -->'); // Wait, is there a comment? Let's check string.
const sidebarStartStr = `<div className="space-y-6">`;
const contactSectionStr = `<section className={CARD_CLASS}>
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h3 className="text-base font-semibold text-slate-900">Contact</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 break-all">{profileMeta.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Joined Date</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.joinedAt}</dd>
                    </div>
                  </div>
                </section>`;

// Let's just use exact regex or lines
fs.writeFileSync('temp_refactor.txt', content);
