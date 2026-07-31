const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../../../../../../snab creations/Carmel/Academic Management System/src/app/dashboard');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.module.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      const cardRegex = /\.card\s*\{[^}]+\}/g;
      content = content.replace(cardRegex, (match) => {
        if (match.includes('#ffffff') || match.includes('rgba(255, 255, 255')) {
          modified = true;
          return `.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
}`;
        }
        return match;
      });

      const replacements = [
        { from: /background-color:\s*#ffffff;/g, to: 'background-color: var(--bg-surface);' },
        { from: /color:\s*#111827;/g, to: 'color: var(--text-primary);' },
        { from: /color:\s*#374151;/g, to: 'color: var(--text-secondary);' },
        { from: /color:\s*#6b7280;/g, to: 'color: var(--text-muted);' },
        { from: /border:\s*1px solid #e5e7eb;/g, to: 'border: 1px solid var(--border-color);' },
        { from: /border:\s*1px solid #d1d5db;/g, to: 'border: 1px solid var(--border-dark);' },
        { from: /background-color:\s*#f9fafb;/g, to: 'background-color: var(--bg-canvas);' },
        { from: /background:\s*rgba\(255, 255, 255, 0\.02\);/g, to: 'background: var(--bg-canvas);' }
      ];

      for (const r of replacements) {
        if (content.match(r.from)) {
          content = content.replace(r.from, r.to);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

try {
  processDir('d:\\snab creations\\Carmel\\Academic Management System\\src\\app\\dashboard');
  console.log('Done');
} catch (e) {
  console.error(e);
}
