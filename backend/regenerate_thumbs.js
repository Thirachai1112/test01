const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const uploadsDir = path.join(__dirname, 'uploads');

async function regenerate() {
    if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory not found:', uploadsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(f => {
        const low = f.toLowerCase();
        // exclude any already-generated .thumb.jpg
        return !low.endsWith('.thumb.jpg') && (low.endsWith('.jpg') || low.endsWith('.jpeg') || low.endsWith('.png') || low.endsWith('.jfif'));
    });

    console.log(`Found ${imageFiles.length} image(s) to process.`);

    let success = 0;
    for (const file of imageFiles) {
        const src = path.join(uploadsDir, file);
        const base = path.parse(file).name;
        const thumbName = base + '.thumb.jpg';
        const dest = path.join(uploadsDir, thumbName);

        try {
            await Jimp.read(src).then(img => img.resize(200, Jimp.AUTO).quality(60).deflateLevel(5).background(0xFFFFFFFF).write(dest));
            console.log('Created', thumbName);
            success++;
        } catch (err) {
            console.error('Failed to create thumb for', file, err.message);
        }
    }

    console.log(`Done. ${success}/${imageFiles.length} thumbnails created.`);
}

regenerate();