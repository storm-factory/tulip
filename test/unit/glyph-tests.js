const test = require('tape');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

function findSrcFields(jsonObj, srcList = []) {
    if (!jsonObj || typeof jsonObj !== 'object') return srcList;

    for (const key in jsonObj) {
        if (key === 'src' && typeof jsonObj[key] === 'string') {
            srcList.push(jsonObj[key].replace("assets", "src"));
        } else if (typeof jsonObj[key] === 'object') {
            findSrcFields(jsonObj[key], srcList);
        }
    }

    return srcList;
}

async function checkImagesAndOrphans(hsonFilePath, rootDir, searchDirs, ignore) {
    srcList = [];
    try {
        // Read the JSON file
        const rawData = fss.readFileSync(hsonFilePath, 'utf8');
        const jsonObj = JSON.parse(rawData);
        const srcFields = findSrcFields(jsonObj);
        // Find all src fields
        for (const key in jsonObj) {
            if (key === 'src' && typeof jsonObj[key] === 'string') {
                srcList.push(jsonObj[key]);
            } else if (typeof jsonObj[key] === 'object') {
                findSrcFields(jsonObj[key], srcList);
            }
        }
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error.message);
        return { imageResults: [], orphanResults: [] };
    }
    const imgSrcs = new Set();
    const results = [];

    // Check existence of referenced images
    for (const src of srcList) {
        // Normalize src path to use forward slashes for consistency
        const normalizedSrc = src.replace(/\\/g, '/');
        imgSrcs.add(normalizedSrc);

        // Resolve path relative to rootDir
        const filePath = path.join(rootDir, src);

        try {
            await fs.access(filePath);
            results.push({ src: normalizedSrc, exists: true });
        } catch (error) {
            results.push({ src: normalizedSrc, exists: false, error: error.message });
        }
    }

    // Recursively find all image files in searchDirs
    const orphanResults = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

    async function findImageFiles(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await findImageFiles(fullPath); // Recurse into subdirectories
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (imageExtensions.includes(ext)) {
                        // Convert to relative path from rootDir, normalize to forward slashes
                        const relativePath = './' + fullPath.replace(path.join(process.cwd(), rootDir), '').replace(/^[\\\/]+/, '').replace(/\\/g, '/');
                        if (!imgSrcs.has(relativePath) && !ignore.includes(relativePath)) {
                            orphanResults.push({ file: relativePath, isOrphan: true });
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`Error accessing directory ${dir}: ${error.message}`);
        }
    }

    // Search for orphaned files in each specified directory
    for (const dir of searchDirs) {
        await findImageFiles(path.join(rootDir, dir));
    }

    return { imageResults: results, orphanResults };
}

test('Image src and orphaned files validation for glyphs ID', async (t) => {
    const jsonFilePath = './src/modules/glyphs.json'; // Path to the JSON file
    const rootDir = '.'; // Root directory is current directory
    const searchDirs = ['./src/svg/glyphs']; // Directories to search for orphaned filessrcList
    const ignore = ['./src/svg/glyphs/missing-glyph.svg', './src/svg/glyphs/leave-red.svg',
        './src/svg/glyphs/less-visible-red.svg', './src/svg/glyphs/narrow-red.svg'
    ];
    try {
        const { imageResults, orphanResults } = await checkImagesAndOrphans(jsonFilePath, rootDir, searchDirs, ignore);

        // Test assertions for referenced images
        t.ok(imageResults.length > 0, 'Should find at least one image under the glyphs');

        let allImagesExist = true;
        imageResults.forEach(result => {
            if (!result.src) {
                t.fail(`Found an image with no src attribute`);
                allImagesExist = false;
            } else {
                t.ok(result.exists, `Image ${result.src} should exist in ${rootDir}`);
                if (!result.exists) {
                    allImagesExist = false;
                    console.log(`Error for ${result.src}: ${result.error}`);
                }
            }
        });
        t.ok(allImagesExist, 'All images under the glyphs ID should exist in the root directory');

        // Test assertions for orphaned files
        if (orphanResults.length > 0) {
            orphanResults.forEach(orphan => {
                t.fail(`Orphaned file found: ${orphan.file} is not referenced in glyphs.json`);
            });
        } else {
            t.pass('No orphaned image files found in the specified directories');
        }

    } catch (error) {
        t.fail(`Test failed with error: ${error.message}`);
    }

    t.end();
});