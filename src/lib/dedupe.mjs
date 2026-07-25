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
    const cleanLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.trim().match(/^([a-zA-Z0-9_]+)\s*:/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) {
                // Skip duplicate key
                continue;
            }
            seen.add(key);
        }
        cleanLines.push(line);
    }

    fs.writeFileSync(file, cleanLines.join('\n'), 'utf8');
    console.log(`Deduplicated ${file}: total unique keys = ${seen.size}`);
}
