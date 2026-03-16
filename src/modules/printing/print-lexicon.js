const fs = require('fs');
const path = require('path');

function renderLexicon(data) {
    const container = document.getElementById('lexicon-content');
    const groups = {};

    const processLevel = (node) => {
        const groupName = node['lexicon-group'];
        
        if (groupName) {
            if (!groups[groupName]) groups[groupName] = [];
            
            // Function to filter and format items based on your "lexicon" condition
            const filterItems = (items) => {
                return items
                    .filter(item => (item.lexicon && item.lexicon.show === true) || item.lexicon === undefined)
                    .map(item => ({
                        src: item.src,
                        // Use lexicon.text if available, otherwise fallback to item.text
                        displayName: item?.lexicon?.text || item.text 
                    }));
            };

            if (node.items && Array.isArray(node.items)) {
                groups[groupName].push(...filterItems(node.items));
            }
            
            if (node.tabs && Array.isArray(node.tabs)) {
                node.tabs.forEach(tab => {
                    groups[groupName].push(...filterItems(tab.items));
                });
            }
        } else {
            if (node.tabs && Array.isArray(node.tabs)) {
                node.tabs.forEach(tab => processLevel(tab));
            }
        }
    };

    data.forEach(category => processLevel(category));

    container.innerHTML = '';
    for (const [groupTitle, items] of Object.entries(groups)) {
        // Only render the section if there are actually items to show
        if (items.length === 0) continue;

        const section = document.createElement('div');
        section.className = 'lexicon-group-section';

        section.innerHTML = `
            <div class="table-header">${groupTitle}</div>
            <div class="grid-table">
                ${items.map(item => `
                    <div class="grid-cell">
                        <img src="${item.src}" alt="">
                        <span>${item.displayName}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(section);
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const jsonPath = path.join(__dirname, 'src/modules/glyphs.json');
    try {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        renderLexicon(JSON.parse(rawData));
    } catch (err) {
        console.error("Error loading JSON:", err);
    }
});