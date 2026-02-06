# Love Notes

A small static web app that displays random love notes, lets users filter by vibe, and download a styled shareable card image.

## Features

- Random love note generator
- Category filters: `All`, `Romantic`, `Cute`, `Funny`, `Deep`, `Self-love`
- Download current note as a PNG card
- Subtle animated heart background
- Embedded Spotify player
- Add and fetch notes from a Laravel API (`/api/notes`)

## Project Structure

- `index.html` - App markup
- `style.css` - App styling
- `script.js` - UI behavior, note data, animation, and card export logic
- `LARAVEL_API_SETUP.md` - Exact Laravel files/routes for DB-backed notes API
- `music/` - Local media assets (if used)
- `sirnaet-logo.png` - Footer logo

## Run Locally

This is a plain HTML/CSS/JS project. You can run it directly:

1. Open `index.html` in your browser.

Or use a local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To use database-backed notes, follow `LARAVEL_API_SETUP.md`.

## Notes

- The downloaded card image filename is generated as `love-note-<timestamp>.png`.
- No build step or dependency installation is required.
