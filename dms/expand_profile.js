const fs = require('fs');
let file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Expand max width from 5xl to 7xl, increase spacing
content = content.replace('max-w-5xl mx-auto space-y-6 mt-4', 'max-w-7xl mx-auto space-y-8 mt-6');
content = content.replace('grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6', 'grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8');

// 2. Increase padding in Main Profile Info
content = content.replace('p-6 sm:p-8 flex flex-col', 'p-8 sm:p-10 flex flex-col');
content = content.replace('size-20 rounded-full', 'size-24 rounded-full');
content = content.replace('text-2xl font-semibold', 'text-3xl font-bold');
content = content.replace('text-sm font-medium text-slate-500', 'text-base font-medium text-slate-500');
content = content.replace('border-t border-slate-100 bg-slate-50/50 px-6 sm:px-8 py-5', 'border-t border-slate-100 bg-slate-50/50 px-8 sm:px-10 py-8');
content = content.replace(/text-\[11px\]/g, 'text-xs');

// 3. Signature card spacing
content = content.replace('px-6 py-5 border-b border-slate-100 flex', 'px-8 py-6 border-b border-slate-100 flex');
content = content.replace('p-6 flex flex-col sm:flex-row gap-8 items-start', 'p-8 flex flex-col sm:flex-row gap-10 items-stretch');
content = content.replace('h-[160px] flex items-center', 'h-[240px] flex items-center');
content = content.replace('max-h-24 max-w-full', 'max-h-32 max-w-full');
content = content.replace('p-8 cursor-pointer', 'p-10 cursor-pointer'); // upload box
content = content.replace('bg-slate-50 px-6 py-4 border-t', 'bg-slate-50 px-8 py-5 border-t');

// 4. Sidebar spacing
content = content.replace('px-6 py-5 border-b border-slate-100', 'px-8 py-6 border-b border-slate-100');
content = content.replace('<div className="p-6 space-y-4">', '<div className="p-8 space-y-6">');
content = content.replace('<div className="p-6">', '<div className="p-8">');

// 5. Sidebar text
content = content.replace('text-sm text-slate-600 leading-relaxed mb-5', 'text-sm text-slate-600 leading-relaxed mb-8');
content = content.replace('px-4 py-2 text-sm', 'px-6 py-3 text-base');

fs.writeFileSync(file, content, 'utf8');
console.log('Profile expanded');
