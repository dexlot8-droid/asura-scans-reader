
(function() {
  'use strict';

  // Avoid double injection
  if (window.__asuraReaderInjected) return;
  window.__asuraReaderInjected = true;

  // Extract series slug from URL
  function getSlug() {
    const match = window.location.pathname.match(/\/comics\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  }

  // Inject floating action button
  function injectButton() {
    if (document.getElementById('asura-reader-btn')) return;
    const slug = getSlug();
    if (!slug) return;

    const btn = document.createElement('button');
    btn.id = 'asura-reader-btn';
    btn.innerHTML = '📖 Read in Dex Manhwa';
    btn.addEventListener('click', () => {
      // Open the chapter list overlay
      openChapterList(slug);
    });
    document.body.appendChild(btn);
  }

  // Create chapter list overlay
  function openChapterList(slug) {
    removeOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'asura-reader-overlay';
    overlay.innerHTML = '<div class="ar-overlay-content"><div class="ar-header"><h2>Select Chapter</h2><button id="ar-close">&times;</button></div><div class="ar-loading">Loading chapters...</div><div class="ar-chapter-list"></div></div>';
    document.body.appendChild(overlay);

    document.getElementById('ar-close').addEventListener('click', removeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) removeOverlay(); });

    // Fetch chapters
    fetch(`https://api.asurascans.com/api/series/${slug}/chapters`)
      .then(r => r.json())
      .then(data => {
        const chapters = data.data || [];
        const list = overlay.querySelector('.ar-chapter-list');
        overlay.querySelector('.ar-loading').remove();
        list.innerHTML = chapters.map(ch => `
          <div class="ar-chapter" data-ch="${ch.number}">
            <span class="ar-ch-num">Chapter ${ch.number}</span>
            <span class="ar-ch-title">${ch.title || ''}</span>
          </div>
        `).reverse().join('');

        list.querySelectorAll('.ar-chapter').forEach(el => {
          el.addEventListener('click', () => {
            const chNum = el.dataset.ch;
            removeOverlay();
            openReader(slug, chNum);
          });
        });
      })
      .catch(err => {
        overlay.querySelector('.ar-loading').textContent = 'Error loading chapters: ' + err.message;
      });
  }

  // Create full-screen reader overlay
  function openReader(slug, chapterNum) {
    removeOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'asura-reader-overlay';
    overlay.innerHTML = `
      <div class="ar-reader">
        <div class="ar-reader-header">
          <button id="ar-reader-back">&larr; Chapters</button>
          <span class="ar-reader-title">${slug} - Ch ${chapterNum}</span>
          <button id="ar-reader-close">&times;</button>
        </div>
        <div class="ar-reader-body"><div class="ar-loading">Loading pages...</div></div>
        <div class="ar-reader-footer">
          <button id="ar-prev">&larr; Prev</button>
          <span id="ar-page-num">Page 1</span>
          <button id="ar-next">Next &rarr;</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('ar-reader-close').addEventListener('click', removeOverlay);
    document.getElementById('ar-reader-back').addEventListener('click', () => { removeOverlay(); openChapterList(slug); });

    let images = [];
    let currentPage = 0;

    fetch(`https://api.asurascans.com/api/series/${slug}/chapters/${chapterNum}`)
      .then(r => r.json())
      .then(data => {
        const pages = (data.data || {}).chapter?.pages || [];
        images = pages.map(p => p.url);
        renderPages();
      })
      .catch(err => {
        overlay.querySelector('.ar-reader-body').innerHTML = '<div class="ar-loading">Error: ' + err.message + '</div>';
      });

    function renderPages() {
      const body = overlay.querySelector('.ar-reader-body');
      body.innerHTML = images.map((url, i) =>
        `<img class="ar-page${i === 0 ? ' active' : ''}" src="${url}" data-index="${i}" style="display:${i === 0 ? 'block' : 'none'}">`
      ).join('');
      updateNav();
    }

    function updateNav() {
      document.getElementById('ar-page-num').textContent = `Page ${currentPage + 1} / ${images.length}`;
      document.getElementById('ar-prev').disabled = currentPage === 0;
      document.getElementById('ar-next').disabled = currentPage === images.length - 1;
    }

    document.getElementById('ar-prev').addEventListener('click', () => { if (currentPage > 0) { currentPage--; showPage(); } });
    document.getElementById('ar-next').addEventListener('click', () => { if (currentPage < images.length - 1) { currentPage++; showPage(); } });

    function showPage() {
      overlay.querySelectorAll('.ar-page').forEach((img, i) => {
        img.style.display = i === currentPage ? 'block' : 'none';
      });
      updateNav();
    }

    // Keyboard navigation
    document.onkeydown = (e) => {
      if (e.key === 'ArrowLeft' && currentPage > 0) { currentPage--; showPage(); }
      if (e.key === 'ArrowRight' && currentPage < images.length - 1) { currentPage++; showPage(); }
    };
  }

  function removeOverlay() {
    const existing = document.getElementById('asura-reader-overlay');
    if (existing) existing.remove();
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }

  // Handle SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(injectButton, 500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
