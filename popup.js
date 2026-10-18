
(function() {
  'use strict';

  const API_BASE = 'https://api.asurascans.com';
  const CDN_BASE = 'https://cdn.asurascans.com';

  // DOM elements
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const seriesList = document.getElementById('seriesList');
  const searchResults = document.getElementById('searchResults');
  const historyList = document.getElementById('historyList');
  const seriesDetail = document.getElementById('seriesDetail');

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');

      if (btn.dataset.tab === 'popular') loadPopular();
      if (btn.dataset.tab === 'history') loadHistory();
    });
  });

  // Load popular series on start
  loadPopular();

  function loadPopular() {
    seriesList.innerHTML = '<p class="loading">Loading...</p>';
    fetch(`${API_BASE}/api/series?limit=20`)
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length === 0) {
          seriesList.innerHTML = '<p class="empty">No series found</p>';
          return;
        }
        seriesList.innerHTML = items.map(s => `
          <div class="series-item" data-slug="${s.slug}">
            <img src="${s.cover || ''}" alt="${s.title}" onerror="this.src='icons/icon48.png'">
            <div class="info">
              <h4>${s.title}</h4>
              <p>${s.chapter_count || '?'} chapters</p>
            </div>
          </div>
        `).join('');

        seriesList.querySelectorAll('.series-item').forEach(el => {
          el.addEventListener('click', () => showSeriesDetail(el.dataset.slug));
        });
      })
      .catch(err => {
        seriesList.innerHTML = '<p class="empty">Error: ' + err.message + '</p>';
      });
  }

  function loadHistory() {
    chrome.storage.local.get('readingHistory', (result) => {
      const history = result.readingHistory || {};
      const entries = Object.entries(history).sort((a, b) => b[1].lastRead - a[1].lastRead);

      if (entries.length === 0) {
        historyList.innerHTML = '<p class="empty">No reading history yet</p>';
        return;
      }

      historyList.innerHTML = entries.map(([slug, data]) => `
        <div class="series-item history-item" data-slug="${slug}">
          <div class="info">
            <h4>${data.title || slug}</h4>
            <p class="progress">Chapter ${data.chapter} - ${new Date(data.lastRead).toLocaleDateString()}</p>
          </div>
        </div>
      `).join('');

      historyList.querySelectorAll('.series-item').forEach(el => {
        el.addEventListener('click', () => showSeriesDetail(el.dataset.slug));
      });
    });
  }

  function showSeriesDetail(slug) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    seriesDetail.classList.remove('hidden');
    seriesDetail.querySelector('.ar-loading')?.remove();

    fetch(`${API_BASE}/api/series/${slug}`)
      .then(r => r.json())
      .then(data => {
        const s = data.data || {};
        document.getElementById('seriesCover').src = s.cover || '';
        document.getElementById('seriesTitle').textContent = s.title || slug;
        document.getElementById('seriesDesc').textContent = (s.description || '').substring(0, 300);

        const chList = document.getElementById('chapterList');
        chList.innerHTML = '<p class="loading">Loading chapters...</p>';

        return fetch(`${API_BASE}/api/series/${slug}/chapters`)
          .then(r => r.json())
          .then(chData => {
            const chapters = chData.data || [];
            chList.innerHTML = chapters.map(ch => `
              <div class="chapter-item" data-ch="${ch.number}">
                <span class="ch-title">${ch.title || 'Chapter ' + ch.number}</span>
                <span class="ch-num">${ch.number}</span>
              </div>
            `).reverse().join('');

            chList.querySelectorAll('.chapter-item').forEach(el => {
              el.addEventListener('click', () => {
                const chNum = el.dataset.ch;
                // Save progress
                chrome.storage.local.get('readingHistory', (result) => {
                  const history = result.readingHistory || {};
                  history[slug] = { title: s.title, chapter: chNum, lastRead: Date.now() };
                  chrome.storage.local.set({ readingHistory: history });
                });
                // Open reader in new tab
                chrome.tabs.create({ url: chrome.runtime.getURL('reader/index.html') + '?slug=' + slug + '&ch=' + chNum });
              });
            });
          });
      })
      .catch(err => {
        seriesDetail.innerHTML = '<p class="empty">Error: ' + err.message + '</p>';
      });
  }

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    seriesDetail.classList.add('hidden');
    document.querySelector('.tab-btn[data-tab="popular"]').click();
  });

  // Search
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

  function doSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="search"]').classList.add('active');
    document.getElementById('search').classList.add('active');

    searchResults.innerHTML = '<p class="loading">Searching...</p>';

    fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length === 0) {
          searchResults.innerHTML = '<p class="empty">No results found</p>';
          return;
        }
        searchResults.innerHTML = items.map(s => `
          <div class="series-item" data-slug="${s.slug}">
            <img src="${s.cover || ''}" alt="${s.title}" onerror="this.src='icons/icon48.png'">
            <div class="info">
              <h4>${s.title}</h4>
              <p>${s.chapter_count || '?'} chapters</p>
            </div>
          </div>
        `).join('');

        searchResults.querySelectorAll('.series-item').forEach(el => {
          el.addEventListener('click', () => showSeriesDetail(el.dataset.slug));
        });
      })
      .catch(err => {
        searchResults.innerHTML = '<p class="empty">Error: ' + err.message + '</p>';
      });
  }
})();
