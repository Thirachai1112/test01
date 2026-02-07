const fs = require('fs');
const path = require('path');

const uploads = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploads)) {
  console.error('Uploads folder not found:', uploads);
  process.exit(1);
}

const ts = new Date().toISOString().replace(/[:.TZ-]/g, '').slice(0,14);
const backupDir = path.join(uploads, `legacy_thumb_backup_${ts}`);
fs.mkdirSync(backupDir, { recursive: true });

const files = fs.readdirSync(uploads).filter(f => f.startsWith('thumb-') && !f.endsWith('.thumb.jpg'));
if (files.length === 0) {
  console.log('No legacy thumb files found.');
  process.exit(0);
}

fs.writeFileSync(path.join(backupDir, 'moved_files.txt'), files.join('\n'), 'utf8');

for (const f of files) {
  const src = path.join(uploads, f);
  const dest = path.join(backupDir, f);
  fs.renameSync(src, dest);
}

console.log(`Moved ${files.length} files to ${backupDir}`);
