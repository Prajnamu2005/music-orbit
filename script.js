let tracks = [];
let currentTrackIndex = -1;
let isPlaying = false;

const audio = document.getElementById('audioPlayer');
const slider = document.getElementById('slider');
const nowPlaying = document.getElementById('nowPlaying');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const npAlbumArt = document.getElementById('npAlbumArt');
const npTitle = document.getElementById('npTitle');
const npArtist = document.getElementById('npArtist');
const closeNp = document.getElementById('closeNp');
const searchToggle = document.getElementById('searchToggle');
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchClose = document.getElementById('searchClose');

async function fetchSongs(endpoint = '/api/charts', params = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    const data = await resp.json();
    return data.data || [];
}

function buildCarousel(songList) {
    tracks = songList;
    slider.innerHTML = '';
    slider.style.setProperty('--quantity', tracks.length);

    tracks.forEach((track, i) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.style.setProperty('--position', i + 1);
        item.dataset.index = i;

        const img = document.createElement('img');
        img.src = track.album.cover_big;
        img.alt = `${track.title} - ${track.artist.name}`;
        img.loading = 'lazy';

        const label = document.createElement('div');
        label.className = 'item-label';
        label.innerHTML = `<span class="item-title">${track.title}</span><span class="item-artist">${track.artist.name}</span>`;

        item.appendChild(img);
        item.appendChild(label);
        item.addEventListener('click', () => playSong(i));
        slider.appendChild(item);
    });
}

function playSong(index) {
    if (index < 0 || index >= tracks.length) return;

    const track = tracks[index];
    currentTrackIndex = index;

    audio.src = track.preview;
    audio.play().then(() => {
        isPlaying = true;
        updatePlayButton();
        showNowPlaying(track);
    }).catch(() => {});
}

function togglePlay() {
    if (currentTrackIndex === -1) {
        if (tracks.length > 0) playSong(0);
        return;
    }
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play().catch(() => {});
        isPlaying = true;
    }
    updatePlayButton();
}

function updatePlayButton() {
    playBtn.innerHTML = isPlaying
        ? '<svg viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>';
}

function showNowPlaying(track) {
    npAlbumArt.src = track.album.cover_medium || track.album.cover_big;
    npTitle.textContent = track.title;
    npArtist.textContent = track.artist.name;
    nowPlaying.classList.add('active');
}

function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalDurationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
    isPlaying = false;
    updatePlayButton();
    if (currentTrackIndex < tracks.length - 1) {
        playSong(currentTrackIndex + 1);
    }
});

playBtn.addEventListener('click', togglePlay);

progressBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
});

closeNp.addEventListener('click', () => {
    nowPlaying.classList.remove('active');
    audio.pause();
    audio.src = '';
    isPlaying = false;
    updatePlayButton();
    currentTrackIndex = -1;
});

searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
});

searchClose.addEventListener('click', () => {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
});

searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
    }
});

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (!q) {
        loadCharts();
        return;
    }
    searchTimeout = setTimeout(async () => {
        try {
            const results = await fetchSongs('/api/search', { q, limit: 10 });
            buildCarousel(results);
        } catch (err) {
            console.error('Search failed:', err);
        }
    }, 500);
});

async function loadCharts() {
    try {
        slider.classList.add('loading');
        const songs = await fetchSongs('/api/charts', { limit: 10 });
        buildCarousel(songs);
    } catch (err) {
        console.error('Failed to load charts:', err);
        slider.innerHTML = '<div class="loading-text">Failed to load charts. Make sure the server is running.</div>';
    } finally {
        slider.classList.remove('loading');
    }
}

loadCharts();
