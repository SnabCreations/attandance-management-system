const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'app', 'dashboard');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.module.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const before = content;
      
      // Inject color: var(--text-primary); into any .select or .input rule that doesn't have it
      // Simple and brute-force: just find .select { and .input { and add it inside.
      content = content.replace(/\.select\s*\{/g, '.select {\n  color: var(--text-primary);');
      content = content.replace(/\.input\s*\{/g, '.input {\n  color: var(--text-primary);');
      content = content.replace(/\.inputGroup input,\s*\.select\s*\{/g, '.inputGroup input,\n.select {\n  color: var(--text-primary);');

      if (before !== content) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated colors in', fullPath);
      }
    }
  }
}
try {
  processDir(cssPath);
  console.log('Done');
} catch (e) {
  console.error(e);
}
