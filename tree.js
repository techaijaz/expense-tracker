import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const IGNORE = ['node_modules', '.git', 'dist', '.vite'];

function tree(dir, prefix = '') {
  const files = readdirSync(dir);
  files.forEach((file, i) => {
    if (IGNORE.includes(file)) return;
    const isLast = i === files.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    console.log(prefix + connector + file);
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      tree(fullPath, prefix + (isLast ? '    ' : '│   '));
    }
  });
}

tree('.');
