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
const modeToggle = document.getElementById('modeToggle');
const mpList = document.getElementById('mpList');
const mpFeatArt = document.getElementById('mpFeatArt');
const mpFeatTitle = document.getElementById('mpFeatTitle');
const mpFeatArtist = document.getElementById('mpFeatArtist');

async function fetchSongs(endpoint, params) {
    const url = new URL(endpoint, window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('API error: ' + resp.status);
    const data = await resp.json();
    return data.data || [];
}

function buildCarousel(songList) {
    tracks = songList;
    slider.innerHTML = '';
    slider.style.setProperty('--quantity', tracks.length);

    tracks.forEach(function(track, i) {
        var item = document.createElement('div');
        item.className = 'item';
        item.style.setProperty('--position', i + 1);

        var img = document.createElement('img');
        img.src = track.album.cover_big;
        img.alt = track.title + ' - ' + track.artist.name;
        img.loading = 'lazy';

        var label = document.createElement('div');
        label.className = 'item-label';
        label.innerHTML = '<span class="item-title">' + track.title + '</span><span class="item-artist">' + track.artist.name + '</span>';

        item.appendChild(img);
        item.appendChild(label);
        item.addEventListener('click', function() { playSong(i); });
        slider.appendChild(item);
    });

    buildMostPlayed(tracks);
}

function buildMostPlayed(songList) {
    mpList.innerHTML = '';
    if (songList.length === 0) return;

    var featured = songList[0];
    mpFeatArt.src = featured.album.cover_big;
    mpFeatTitle.textContent = featured.title;
    mpFeatArtist.textContent = featured.artist.name;
    mpFeatArt.onclick = function() { playSong(0); };

    songList.forEach(function(track, i) {
        var row = document.createElement('div');
        row.className = 'mp-item';
        row.addEventListener('click', function() { playSong(i); });

        row.innerHTML =
            '<span class="mp-item-num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<img class="mp-item-art" src="' + (track.album.cover_medium || track.album.cover_big) + '" alt="">' +
            '<div class="mp-item-info">' +
                '<div class="mp-item-title">' + track.title + '</div>' +
                '<div class="mp-item-artist">' + track.artist.name + '</div>' +
            '</div>' +
            '<span class="mp-item-dur">' + formatTime(track.duration) + '</span>';
        mpList.appendChild(row);
    });
}

function playSong(index) {
    if (index < 0 || index >= tracks.length) return;
    var track = tracks[index];
    currentTrackIndex = index;
    audio.src = track.preview;
    audio.play().then(function() {
        isPlaying = true;
        updatePlayButton();
        showNowPlaying(track);
    }).catch(function() {});
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
        audio.play().catch(function() {});
        isPlaying = true;
    }
    updatePlayButton();
}

function updatePlayButton() {
    var isDark = document.body.classList.contains('dark');
    var iconColor = isDark ? '#121218' : '#ffffff';
    playBtn.innerHTML = isPlaying
        ? '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="4" height="16" rx="1" fill="' + iconColor + '"/><rect x="14" y="4" width="4" height="16" rx="1" fill="' + iconColor + '"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="6,4 20,12 6,20" fill="' + iconColor + '"/></svg>';
}

function showNowPlaying(track) {
    npAlbumArt.src = track.album.cover_medium || track.album.cover_big;
    npTitle.textContent = track.title;
    npArtist.textContent = track.artist.name;
    nowPlaying.classList.add('active');
}

function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
}

audio.addEventListener('timeupdate', function() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalDurationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', function() {
    isPlaying = false;
    updatePlayButton();
    if (currentTrackIndex < tracks.length - 1) {
        playSong(currentTrackIndex + 1);
    }
});

playBtn.addEventListener('click', togglePlay);

progressBar.addEventListener('click', function(e) {
    if (!audio.duration) return;
    var rect = progressBar.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
});

closeNp.addEventListener('click', function() {
    nowPlaying.classList.remove('active');
    audio.pause();
    audio.src = '';
    isPlaying = false;
    updatePlayButton();
    currentTrackIndex = -1;
});

searchToggle.addEventListener('click', function() {
    searchOverlay.classList.add('active');
    searchInput.focus();
});

searchClose.addEventListener('click', function() {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
});

searchOverlay.addEventListener('click', function(e) {
    if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
    }
});

var searchTimeout;
searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    var q = searchInput.value.trim();
    if (!q) {
        loadCharts();
        return;
    }
    searchTimeout = setTimeout(async function() {
        try {
            var results = await fetchSongs('/api/search', { q: q, limit: 10 });
            buildCarousel(results);
        } catch (err) {
            console.error('Search failed:', err);
        }
    }, 500);
});

async function loadCharts() {
    try {
        slider.classList.add('loading');
        var songs = await fetchSongs('/api/charts', { limit: 10 });
        buildCarousel(songs);
    } catch (err) {
        console.error('Failed to load charts:', err);
        slider.innerHTML = '<div class="loading-text">Failed to load charts. Make sure the server is running.</div>';
    } finally {
        slider.classList.remove('loading');
    }
}

// Mode toggle
var savedMode = localStorage.getItem('aura-mode');
if (savedMode === 'dark') document.body.classList.add('dark');

modeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark');
    localStorage.setItem('aura-mode', document.body.classList.contains('dark') ? 'dark' : 'light');
    updatePlayButton();
});

// Scroll reveal for most-played section
var mpSection = document.getElementById('mostPlayed');
var mpTitle = mpSection.querySelector('.section-title');
var mpGrid = mpSection.querySelector('.mp-grid');

var scrollObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            mpTitle.classList.add('visible');
            mpGrid.classList.add('visible');
        } else {
            mpTitle.classList.remove('visible');
            mpGrid.classList.remove('visible');
        }
    });
}, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });

scrollObserver.observe(mpSection);

loadCharts();
