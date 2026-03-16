// Fetch latest release and dynamically build download cards
document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'https://gitlab.com/api/v4/projects/drid%2Ftulip/releases/permalink/latest';

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    })
    .then(release => {
      const version = release.tag_name.replace(/^v/, '');
      const releaseDate = new Date(release.released_at || release.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // Update header
      document.getElementById('release-version').textContent = `Tulip v${version}`;
      document.getElementById('release-date').textContent = releaseDate;

      // Group assets by OS
      const groups = {
        linux: [],
        macos: [],
        windows: [],
        other: []   // fallback for anything unmatched
      };

      release.assets.links.forEach(link => {
        const nameLower = link.name.toLowerCase();
        let os = 'other';

        if (nameLower.includes('appimage') ||
          nameLower.includes('deb') || nameLower.includes('rpm') || nameLower.includes('snap')) {
          os = 'linux';
        } else if ((nameLower.includes('mac') && nameLower.includes('dmg')) || (nameLower.includes('zip') && nameLower.includes('mac'))) {
          os = 'macos';
        } else if (nameLower.includes('windows') || nameLower.includes('exe') || nameLower.includes('msi')) {
          os = 'windows';
        }

        groups[os].push({
          name: link.name,
          url: link.direct_asset_url || link.url,
          type: link.link_type || 'package'
        });
      });

      // Build HTML for each card
      const buildCard = (os, icon, title, items) => {
        if (items.length === 0) return '';

        let mainItem = null;
        let mainUrl = '#';

        // Choose preferred main download per OS
        if (os === 'linux') {
          mainItem = items.find(i => (i.name.toLowerCase().includes('appimage') && !i.name.toLowerCase().includes('arm'))) ||
            items.find(i => i.name.toLowerCase().includes('snap')) ||
            items[0];  // fallback to first
        } else if (os === 'windows') {
          mainItem = items.find(i => (i.name.toLowerCase().includes('windows') && !i.name.toLowerCase().includes('bit'))) ||
            items.find(i => i.name.toLowerCase().includes('msi') && !i.name.toLowerCase().includes('32')) ||
            items[0];
        } else if (os === 'macos') {
          mainItem = items[0];  // usually only one anyway
        }

        if (mainItem) {
          mainUrl = mainItem.url;
        }

        // Filter out the main item from the list
        const listItems = items.filter(item => item !== mainItem);

        let listHtml = '';
        if (listItems.length > 0) {
          let items = listItems.map(item =>
            `<li><a href="${item.url}" target="_blank" rel="noopener"  data-umami-event="download-${item.name.split('/').pop()}">${item.name}</a></li>`
          ).join('');
          listHtml = `<p>Also:</p><ul>${items}</ul>`;
        } else {
          listHtml = '';
        }

        return `
          <div class="card">
            <i class="${icon}"></i>
            <a href="${mainUrl}" class="md-button md-button--primary" data-umami-event="download-${mainItem.name.split('/').pop()}">
            <i class="fas fa-download"></i> Download for ${title}
            </a>
            ${listHtml}
          </div>
        `;
      };

      // Icons (using Material shortcodes – will render if emoji extension is enabled)
      const linuxIcon = 'fa-brands fa-linux';
      const appleIcon = 'fa-brands fa-apple';
      const windowsIcon = 'fa-brands fa-microsoft';

      // Insert cards into grid
      const grid = document.getElementById('downloads-grid');
      if (grid) {
        grid.innerHTML = `
          ${buildCard('linux', linuxIcon, 'Linux', groups.linux)}
          ${buildCard('macos', appleIcon, 'macOS', groups.macos)}
          ${buildCard('windows', windowsIcon, 'Windows', groups.windows)}
        `;
      }

      // Optional: fallback message if no assets
      if (groups.linux.length + groups.macos.length + groups.windows.length === 0) {
        grid.innerHTML = '<p>No release assets found.</p>';
      }
    })
    .catch(err => {
      console.error('Failed to load latest release:', err);
      const grid = document.getElementById('downloads-grid');
      if (grid) grid.innerHTML = '<p>Could not load downloads. Please visit <a href="https://gitlab.com/drid/tulip/-/releases">GitLab Releases</a>.</p>';
    });
});