# Asura Scans Reader

Chrome extension for browsing and reading manhwa directly from Asura Scans. Source scraper extension (like Mihon) — reads from the source site, not from any third-party platform.

## Features

- Browse popular series from Asura Scans
- Search for series
- View chapter lists
- Read chapters in a clean full-screen reader overlay
- Keyboard navigation (arrow keys)
- Reading progress saved to chrome.storage
- Content script injects "Read" button on Asura Scans pages

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `asura-reader` folder
5. Pin the extension to your toolbar

## Usage

- Click the extension icon to browse/search series
- Visit any Asura Scans comic page and click the floating "Read" button
- Use arrow keys to navigate pages in the reader

## API

Uses the official Asura Scans API:
- `GET /api/series` — series list
- `GET /api/series/{slug}` — series detail
- `GET /api/series/{slug}/chapters` — chapter list
- `GET /api/series/{slug}/chapters/{number}` — chapter with image URLs

## Permissions

- `storage` — save reading progress
- `activeTab` — content script injection
- `host_permissions` — access to Asura Scans API and CDN
