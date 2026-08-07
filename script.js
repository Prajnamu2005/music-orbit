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
const genreFilters = document.getElementById('genreFilters');

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

    var showCount = 5;
    var allItems = [];

    songList.forEach(function(track, i) {
        var row = document.createElement('div');
        row.className = 'mp-item';
        if (i >= showCount) row.classList.add('mp-item-hidden');
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
        allItems.push(row);
    });

    if (songList.length > showCount) {
        var btn = document.createElement('button');
        btn.className = 'mp-show-more';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
        btn.addEventListener('click', function() {
            var hidden = mpList.querySelectorAll('.mp-item-hidden');
            if (hidden.length > 0) {
                hidden.forEach(function(item) { item.classList.remove('mp-item-hidden'); });
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
            } else {
                allItems.forEach(function(item, i) {
                    if (i >= showCount) item.classList.add('mp-item-hidden');
                });
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
            }
        });
        mpList.appendChild(btn);
    }
}

function playSong(index) {
    if (index < 0 || index >= tracks.length) return;
    playTrack(tracks[index], index);
}

function playTrack(track, index) {
    if (!track || !track.preview) return;
    currentTrackIndex = (typeof index === 'number') ? index : -1;
    audio.src = track.preview;
    audio.play().then(function() {
        isPlaying = true;
        updatePlayButton();
        showNowPlaying(track);
    }).catch(function(e) { console.error('Playback failed:', e); });
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
        audio.play().catch(function(e) { console.error('Playback failed:', e); });
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
    stopViz();
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
    stopViz();
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
var mpRevealed = false;

function checkMpScroll() {
    var rect = mpSection.getBoundingClientRect();
    var triggerPoint = window.innerHeight * 0.75;
    if (rect.top < triggerPoint) {
        if (!mpRevealed) {
            mpRevealed = true;
            mpTitle.classList.add('visible');
            mpGrid.classList.add('visible');
        }
    } else {
        mpRevealed = false;
        mpTitle.classList.remove('visible');
        mpGrid.classList.remove('visible');
    }
}

window.addEventListener('scroll', checkMpScroll, { passive: true });
checkMpScroll();

// ===== Recommendations (BROWSE & DISCOVER) =====
var recShelves = document.getElementById('recShelves');
var recRevealed = false;
var recSection = document.getElementById('recommendations');
var REC_INITIAL_VISIBLE = 2;

var REC_CATEGORIES = [
    { title: 'Top Charts', type: 'charts' },
    { title: 'Pop', type: 'genre', genre: 'pop' },
    { title: 'Hip-Hop', type: 'genre', genre: 'hip hop' },
    { title: 'Electronic', type: 'genre', genre: 'electronic' },
    { title: 'Rock', type: 'genre', genre: 'rock' },
    { title: 'R&B', type: 'genre', genre: 'r&b' },
    { title: 'Latin', type: 'genre', genre: 'latin' },
    { title: 'Country', type: 'genre', genre: 'country' },
    { title: 'Jazz', type: 'genre', genre: 'jazz' },
    { title: 'Classical', type: 'genre', genre: 'classical' },
    { title: 'Metal', type: 'genre', genre: 'metal' },
    { title: 'K-Pop', type: 'genre', genre: 'k-pop' },
    { title: 'Indie', type: 'genre', genre: 'indie' },
    { title: 'Folk', type: 'genre', genre: 'folk' },
    { title: 'Blues', type: 'genre', genre: 'blues' },
    { title: 'Dance', type: 'genre', genre: 'dance' },
];

async function loadRecommendations() {
    recShelves.innerHTML = '';
    var loadedShelves = [];
    await Promise.all(REC_CATEGORIES.map(async function(cat) {
        try {
            var songs = cat.type === 'charts'
                ? await fetchSongs('/api/charts', { limit: 12 })
                : await fetchSongs('/api/genres', { genre: cat.genre, limit: 12 });
            if (songs.length) {
                loadedShelves.push({ title: cat.title, songs: songs });
            }
        } catch (err) {
            console.error('Failed to load shelf "' + cat.title + '":', err);
        }
    }));

    loadedShelves.forEach(function(shelfData, i) {
        var shelf = buildRecShelf(shelfData.title, shelfData.songs);
        if (i >= REC_INITIAL_VISIBLE) shelf.classList.add('rec-shelf-hidden');
        recShelves.appendChild(shelf);
    });

    if (loadedShelves.length > REC_INITIAL_VISIBLE) {
        var moreWrap = document.createElement('div');
        moreWrap.className = 'rec-more-wrap';
        var moreBtn = document.createElement('button');
        moreBtn.className = 'rec-more-btn';
        moreBtn.id = 'recMoreBtn';
        moreBtn.setAttribute('aria-label', 'Discover more genres');
        moreBtn.innerHTML = '<svg class="rec-more-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
        moreBtn.addEventListener('click', function() {
            var hidden = recShelves.querySelectorAll('.rec-shelf-hidden');
            var batch = Array.prototype.slice.call(hidden, 0, 2);
            batch.forEach(function(s) {
                s.classList.remove('rec-shelf-hidden');
            });
            void recShelves.offsetHeight;
            batch.forEach(function(s) {
                s.classList.add('visible');
            });
            if (recShelves.querySelectorAll('.rec-shelf-hidden').length === 0) {
                moreWrap.style.display = 'none';
            }
        });
        moreWrap.appendChild(moreBtn);
        recShelves.appendChild(moreWrap);
    }
}

function buildRecShelf(title, songList) {
    var shelf = document.createElement('div');
    shelf.className = 'rec-shelf';

    var header = document.createElement('div');
    header.className = 'rec-shelf-header';
    header.innerHTML = '<span class="rec-shelf-title">' + title + '</span>' +
        '<button class="rec-shelf-more">VIEW ALL</button>';

    var row = document.createElement('div');
    row.className = 'rec-row';

    songList.forEach(function(track) {
        var card = document.createElement('div');
        card.className = 'rec-card';

        var img = document.createElement('img');
        img.src = track.album.cover_big;
        img.alt = track.title + ' - ' + track.artist.name;
        img.loading = 'lazy';

        var info = document.createElement('div');
        info.className = 'rec-card-info';
        info.innerHTML = '<div class="rec-card-title">' + track.title + '</div><div class="rec-card-artist">' + track.artist.name + '</div>';

        card.appendChild(img);
        card.appendChild(info);
        card.addEventListener('click', function() { playTrack(track); });
        row.appendChild(card);
    });

    shelf.appendChild(header);
    shelf.appendChild(row);
    return shelf;
}

function checkRecScroll() {
    var rect = recSection.getBoundingClientRect();
    var triggerPoint = window.innerHeight * 0.75;
    var shelves = recShelves.querySelectorAll('.rec-shelf:not(.rec-shelf-hidden)');
    var title = recSection.querySelector('.section-title');
    if (rect.top < triggerPoint) {
        if (!recRevealed) {
            recRevealed = true;
            title.classList.add('visible');
            shelves.forEach(function(s) { s.classList.add('visible'); });
        }
    } else {
        recRevealed = false;
        title.classList.remove('visible');
        shelves.forEach(function(s) { s.classList.remove('visible'); });
    }
}

window.addEventListener('scroll', checkRecScroll, { passive: true });
loadRecommendations();

// ===== Visualizer (Web Audio API) =====
// Use a hidden audio element for analysis, keep the visible one for normal playback.
// This avoids CORS issues with createMediaElementSource on cross-origin audio.
var vizAudio = document.getElementById('audioPlayer');
var audioCtx = null;
var analyser = null;
var vizDataArray = null;
var vizAnimId = null;
var vizConnected = false;

var eqCanvas = document.getElementById('eqCanvas');
var eqCtx = eqCanvas.getContext('2d');
var npVizCanvas = document.getElementById('npVizCanvas');
var npVizCtx = npVizCanvas.getContext('2d');

function ensureAudioContext() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return true;
    }
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        vizDataArray = new Uint8Array(analyser.frequencyBinCount);
        return true;
    } catch (e) {
        console.warn('Web Audio API not available:', e);
        return false;
    }
}

function tryConnectSource() {
    if (vizConnected || !audioCtx) return;
    try {
        var source = audioCtx.createMediaElementSource(vizAudio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        vizConnected = true;
    } catch (e) {
        console.warn('Could not connect audio source for visualizer:', e);
    }
}

function resizeEqCanvas() {
    var rect = eqCanvas.parentElement.getBoundingClientRect();
    eqCanvas.width = rect.width;
    eqCanvas.height = rect.height;
}

function resizeNpVizCanvas() {
    var rect = npVizCanvas.parentElement.getBoundingClientRect();
    npVizCanvas.width = rect.width;
    npVizCanvas.height = rect.height;
}

function drawEq() {
    vizAnimId = requestAnimationFrame(drawEq);
    if (!analyser || !vizDataArray) return;

    analyser.getByteFrequencyData(vizDataArray);
    eqCtx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);

    var barCount = analyser.frequencyBinCount;
    var gap = 3;
    var barWidth = (eqCanvas.width - gap * (barCount - 1)) / barCount;
    var centerX = eqCanvas.width / 2;
    var centerY = eqCanvas.height / 2;

    for (var i = 0; i < barCount; i++) {
        var val = vizDataArray[i] / 255;
        var barHeight = val * eqCanvas.height * 0.9;

        var x = centerX - (barCount * (barWidth + gap)) / 2 + i * (barWidth + gap);
        var y = centerY - barHeight / 2;

        var hue = 140 + (i / barCount) * 60;
        var alpha = 0.5 + val * 0.5;
        eqCtx.fillStyle = 'hsla(' + hue + ', 80%, 55%, ' + alpha + ')';
        eqCtx.fillRect(x, y, barWidth, barHeight);
    }
}

function drawNpViz() {
    vizAnimId = requestAnimationFrame(drawNpViz);
    if (!analyser || !vizDataArray) return;

    analyser.getByteFrequencyData(vizDataArray);
    npVizCtx.clearRect(0, 0, npVizCanvas.width, npVizCanvas.height);

    var barCount = analyser.frequencyBinCount;
    var gap = 2;
    var barWidth = (npVizCanvas.width - gap * (barCount - 1)) / barCount;
    var baseHeight = npVizCanvas.height;
    var midX = npVizCanvas.width / 2;

    for (var i = 0; i < barCount; i++) {
        var val = vizDataArray[i] / 255;
        var barHeight = val * baseHeight * 0.85;

        var hue = 280 + (i / barCount) * 60;
        var alpha = 0.4 + val * 0.6;

        var x = midX - (barCount * (barWidth + gap)) / 2 + i * (barWidth + gap);
        var y = baseHeight - barHeight;

        npVizCtx.shadowColor = 'hsla(' + hue + ', 80%, 50%, 0.5)';
        npVizCtx.shadowBlur = val * 12;
        npVizCtx.fillStyle = 'hsla(' + hue + ', 75%, 55%, ' + alpha + ')';
        npVizCtx.fillRect(x, y, barWidth, barHeight);
    }

    npVizCtx.shadowBlur = 0;
}

function startViz() {
    if (!ensureAudioContext()) return;
    tryConnectSource();
    if (!vizConnected) return;
    resizeEqCanvas();
    resizeNpVizCanvas();
    if (!vizAnimId) drawEq();
    drawNpViz();
}

function stopViz() {
    if (vizAnimId) cancelAnimationFrame(vizAnimId);
    vizAnimId = null;
    eqCtx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);
    npVizCtx.clearRect(0, 0, npVizCanvas.width, npVizCanvas.height);
}

audio.addEventListener('play', function() {
    startViz();
});

audio.addEventListener('pause', function() {
    stopViz();
});

audio.addEventListener('loadstart', function() {
    stopViz();
});

window.addEventListener('resize', function() {
    if (vizAnimId) {
        resizeEqCanvas();
        resizeNpVizCanvas();
    }
});

// Genre filter
genreFilters.addEventListener('click', async function(e) {
    var btn = e.target.closest('.genre-btn');
    if (!btn) return;
    genreFilters.querySelectorAll('.genre-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var genre = btn.dataset.genre;
    try {
        slider.classList.add('loading');
        if (genre === 'top') {
            var songs = await fetchSongs('/api/charts', { limit: 10 });
            buildCarousel(songs);
        } else {
            var songs = await fetchSongs('/api/genres', { genre: genre, limit: 10 });
            buildCarousel(songs);
        }
    } catch (err) {
        console.error('Genre filter failed:', err);
    } finally {
        slider.classList.remove('loading');
    }
});

// ===== Side Nav (interactive magnification) =====
function scrollToTarget(target) {
    if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if (target === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        return;
    }
    var el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

var sideNav = document.getElementById('sideNav');
var sideNavItems = sideNav.querySelectorAll('.side-nav-item');

sideNav.addEventListener('click', function(e) {
    var btn = e.target.closest('.side-nav-item');
    if (!btn) return;
    scrollToTarget(btn.dataset.target);
});

sideNav.addEventListener('mousemove', function(e) {
    var mouseY = e.clientY;
    sideNavItems.forEach(function(item) {
        var r = item.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var dist = Math.abs(mouseY - center);
        var range = 120;
        var factor = Math.max(1, 1 + (1 - Math.min(dist, range) / range) * 0.3);
        item.style.transform = 'scale(' + factor + ')';
    });
});

sideNav.addEventListener('mouseleave', function() {
    sideNavItems.forEach(function(item) {
        item.style.transform = '';
    });
});

// Active state for side nav based on scroll position
function updateSideNavActive() {
    var targets = ['mostPlayed', 'recommendations'];
    var current = 'top';
    targets.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            var rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.5) current = id;
        }
    });
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 10) current = 'bottom';
    var map = {
        'top': 'top',
        'mostPlayed': 'mostPlayed',
        'recommendations': 'browse',
        'bottom': 'bottom'
    };
    var activeTarget = map[current] || 'top';
    sideNav.querySelectorAll('.side-nav-item').forEach(function(navBtn) {
        navBtn.classList.toggle('active', navBtn.dataset.target === activeTarget);
    });
}

window.addEventListener('scroll', updateSideNavActive, { passive: true });
updateSideNavActive();

loadCharts();
