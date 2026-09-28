import fs from 'fs';
import path from 'path';

const dist = './dist';
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git' && item !== 'dist' && item !== 'Adder-Circuit-Virtual-Lab-main') {
        copyDir(s, d);
      }
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const filesToCopy = [
  'index.html',
  'login.html',
  'circuit.html',
  'practice.html',
  'logo.png',
  'submission.md',
  'README.md'
];

for (const file of filesToCopy) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(dist, file));
  }
}

copyDir('css', path.join(dist, 'css'));
copyDir('js', path.join(dist, 'js'));
copyDir('assets', path.join(dist, 'assets'));

console.log('Build completed successfully: All HTML, CSS, JS and assets copied to dist/.');
