const fs = require('fs');
const file = 'd:/Document Management/dms/client/src/views/layouts/Sidebar.tsx';
let c = fs.readFileSync(file, 'utf8');

// Add User to lucide-react imports if not present
if (!c.includes('User,')) {
  c = c.replace('Users,', 'Users,\n  User,');
}

// Replace getInitials block in render with User icon
c = c.replace(
  /<div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">\s*\{getInitials\(user\?\.full_name\)\}\s*<\/div>/,
  `<div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 shadow-xs">
              <User className="size-4" />
            </div>`
);

fs.writeFileSync(file, c, 'utf8');
