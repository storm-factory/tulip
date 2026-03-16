// recentFiles.js
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const MAX_RECENT = 10;
const STORE_PATH = path.join(app.getPath('userData'), 'recentFiles.json');

function loadRecents() {
    try {
        if (fs.existsSync(STORE_PATH)) {
            return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
        }
    } catch (err) {
        console.error('Error reading recent files:', err);
    }
    return [];
}

function saveToFile(recents) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(recents), 'utf-8');
    } catch (err) {
        console.error('Error saving recent files:', err);
    }
}

function saveRecent(filePath) {
    const recents = loadRecents();
    const filtered = recents.filter(f => f !== filePath);
    filtered.unshift(filePath);
    saveToFile(filtered.slice(0, MAX_RECENT));
}

function getRecents() {
    return loadRecents();
}

function clearRecents() {
    saveToFile([]);
}

module.exports = { saveRecent, getRecents, clearRecents };