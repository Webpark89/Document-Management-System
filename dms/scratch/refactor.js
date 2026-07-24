const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../client/src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === '.next') return;
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function replaceImports() {
  walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let newContent = content
        .replace(/from\s+['"]@\/types\/?(.*)['"]/g, 'from \'@models/$1\'')
        .replace(/from\s+['"]@\/components\/layout\/?(.*)['"]/g, 'from \'@views/layouts/$1\'')
        .replace(/from\s+['"]@\/components\/?(.*)['"]/g, 'from \'@views/components/$1\'')
        .replace(/from\s+['"]@\/services\/?(.*)['"]/g, 'from \'@controllers/services/$1\'')
        // For features, we will move the entire features folder to views/features for now to prevent breaking nested logic
        .replace(/from\s+['"]@\/features\/?(.*)['"]/g, 'from \'@views/features/$1\'');
      
      // Clean up trailing slashes in imports like '@models/' -> '@models'
      newContent = newContent.replace(/from '@models\/'/g, "from '@models'");
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated imports in ${filePath}`);
      }
    }
  });
}

replaceImports();
