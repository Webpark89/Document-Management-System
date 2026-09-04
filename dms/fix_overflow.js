const fs = require('fs');
let file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Container for Avatar + Name
content = content.replace(
  '<div className="flex items-center gap-5">',
  '<div className="flex items-center gap-5 min-w-0 flex-1">'
);

// Container for Name Text
content = content.replace(
  '<Avatar className="size-24 rounded-full ring-1 ring-slate-200 shadow-sm">',
  '<Avatar className="size-24 rounded-full ring-1 ring-slate-200 shadow-sm shrink-0">'
);

content = content.replace(
  '<div>\n                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">',
  '<div className="min-w-0">\n                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 truncate" title={displayName}>'
);

content = content.replace(
  '<p className="text-base font-medium text-slate-500">@{user?.username ?? "—"}</p>',
  '<p className="text-base font-medium text-slate-500 truncate max-w-full" title={`@${user?.username}`}>@{user?.username ?? "—"}</p>'
);

// Main Card Header Container
content = content.replace(
  '<div className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">',
  '<div className="p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 w-full">'
);

// Department & Position dd
content = content.replace(
  '<dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.employeeId}</dd>',
  '<dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.employeeId}</dd>'
);
content = content.replace(
  '<dd className="mt-1 text-sm font-medium text-slate-900">{displayDepartment}</dd>',
  '<dd className="mt-1 text-sm font-medium text-slate-900 break-words">{displayDepartment}</dd>'
);
content = content.replace(
  '<dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.position}</dd>',
  '<dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.position}</dd>'
);

// Email dd is already break-words, let's make it break-all
content = content.replace(
  '<dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.email}</dd>',
  '<dd className="mt-1 text-sm font-medium text-slate-900 break-all">{profileMeta.email}</dd>'
);

// Sidebar email display for Reset link
content = content.replace(
  '<p className="text-sm font-semibold text-slate-800">{displayEmail}</p>',
  '<p className="text-sm font-semibold text-slate-800 break-all">{displayEmail}</p>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed overflow issues');
