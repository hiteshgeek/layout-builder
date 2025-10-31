# Layout Builder

A dynamic drag-and-drop layout builder for web UIs, supporting row/column creation, reordering, and server-side layout persistence.

## Features

- Drag-and-drop to reorder rows and columns
- Add or remove rows and columns
- Visual feedback for allowed/not-allowed drop zones
- Save and load layouts to/from the server (PHP backend, JSON files)
- Auto-save after first save or after loading a layout
- Dropdown to select, load, or create new layouts
- Modern, responsive UI with stylistic plus buttons in columns

## Usage

1. **Clone or download this repository.**
2. Place the project in your web server's root (e.g., `/var/www/html/layout_builder`).
3. Ensure PHP is enabled and the `layouts/` directory is writable by the web server.
4. Open `index.html` in your browser.
5. Use the UI to build layouts, save, load, and create new layouts as needed.

## File Structure

- `index.html` — Main HTML file
- `script.js` — All UI logic and AJAX for layout persistence
- `style.css` — Styles for layout builder and controls
- `save_layout.php`, `load_layout.php`, `list_layouts.php` — PHP endpoints for layout persistence
- `layouts/` — Directory where layout JSON files are stored

## Requirements

- PHP 7+ (for backend endpoints)
- Modern browser (for drag-and-drop and ES6+ JavaScript)

## Customization

- Edit `style.css` for UI tweaks
- Adjust `script.js` for logic or feature changes
- Backend can be adapted to other languages if needed

## License

MIT
