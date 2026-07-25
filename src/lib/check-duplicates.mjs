import fs from 'fs';

const files = [
    'src/lib/i18n-fallbacks.ts',
    'src/lib/i18n-fallbacks-ar.ts',
    'src/lib/i18n-fallbacks-bn.ts',
    'src/lib/i18n-fallbacks-hi.ts'
];

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const seen = new Set();
    const duplicates = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/^([a-zA-Z0-9_]+)\s*:/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) {
                duplicates.push({ key, line: i + 1 });
            } else {
                seen.add(key);
            }
        }
    }

    if (duplicates.length > 0) {
        console.log(`Duplicate keys in ${file}:`, duplicates);
    } else {
        console.log(`No duplicate keys in ${file}`);
    }
}
