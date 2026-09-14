const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `              {/* Sidebar */}
              <div className="space-y-6">
            </div>
          </div>
        ) : (`;

const replacement = `              {/* Sidebar */}
              {/* Removed Sidebar */}
            </div>
          </div>
        ) : (`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed syntax error!');
} else {
  console.log('Target not found');
}
