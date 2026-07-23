# Music Orbit

A 3D rotating music carousel with real-time playback. Built as a Spotify Wrapped-style experience with album art, search, and audio previews.

## Features

- 3D rotating carousel with album art
- 30-second audio previews (via iTunes API)
- Now-playing bar with play/pause, progress tracking
- Search songs and artists
- Responsive design (desktop + mobile)

## Tech Stack

- HTML5 + CSS3 (3D transforms, animations)
- Vanilla JavaScript
- Flask (Python) — API proxy
- iTunes Search API (free, no API key)

## Setup

```bash
pip install flask requests
python app.py
```

Open `http://localhost:5000`

## Project Structure

```
├── app.py           # Flask backend (iTunes API proxy)
├── script.js        # Carousel logic + audio player
├── style.css        # Styles + now-playing bar
├── index.html       # Main page
├── requirements.txt # Python dependencies
├── bg.png           # Background texture
└── headphone.png    # Decorative overlay
```

## License

MIT
