// Vídeos — tiles estilo "replay" de transmissão + player em modo teatro.
// Os iframes só são criados quando o usuário dá play (página leve).

let allVideos = [];
let videoCategories = [];
let currentVideoCategory = 'all';
let lastFocusedBeforeTheater = null;

const PLAY_SVG = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

async function loadVideos() {
    const videosGrid = document.getElementById('videos-grid');

    try {
        videosGrid.innerHTML = '<div class="videos-loading">Carregando replays&hellip;</div>';

        const response = await fetch('data/videos.txt');
        const text = await response.text();

        allVideos = parseVideosFile(text);
        allVideos.forEach((video, index) => { video.id = index; });

        if (allVideos.length === 0) {
            videosGrid.innerHTML = '<div class="no-videos">Nenhum vídeo por enquanto.</div>';
            return;
        }

        videoCategories = groupByCategory(allVideos);

        const count = document.getElementById('videosCount');
        if (count) {
            count.textContent = `${allVideos.length} vídeos em ${videoCategories.length} categorias.`;
        }

        renderCategoryChips();
        renderVideos();
        setupTheater();
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        videosGrid.innerHTML = '<div class="no-videos">Erro ao carregar os vídeos. Tente recarregar a página.</div>';
    }
}

function parseVideosFile(text) {
    const videos = [];
    const lines = text.split('\n');
    let currentCategory = 'Sem Categoria';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const categoryMatch = trimmed.match(/^\[CATEGORIA:\s*(.+?)\]$/);
        if (categoryMatch) {
            currentCategory = categoryMatch[1].trim();
            continue;
        }

        const parts = trimmed.split('|');
        if (parts.length >= 2) {
            videos.push({
                url: parts[0].trim(),
                title: parts[1].trim(),
                description: parts[2] ? parts[2].trim() : '',
                category: currentCategory
            });
        }
    }

    return videos;
}

function groupByCategory(videos) {
    const categoryMap = new Map();
    videos.forEach(video => {
        if (!categoryMap.has(video.category)) categoryMap.set(video.category, []);
        categoryMap.get(video.category).push(video);
    });
    return Array.from(categoryMap.entries()).map(([category, videos]) => ({ category, videos }));
}

function slugify(text) {
    return String(text).toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ============================================
// CHIPS DE CATEGORIA
// ============================================

function renderCategoryChips() {
    const chips = document.getElementById('videosChips');
    if (!chips) return;

    const items = [{ key: 'all', label: 'Todos', count: allVideos.length }]
        .concat(videoCategories.map(c => ({ key: c.category, label: c.category, count: c.videos.length })));

    chips.innerHTML = items.map(item => `
        <button type="button" class="videos-chip${item.key === currentVideoCategory ? ' active' : ''}"
            data-category="${escapeHtml(item.key)}" aria-pressed="${item.key === currentVideoCategory}">
            ${escapeHtml(item.label)} <span class="videos-chip-count">${item.count}</span>
        </button>`).join('');

    chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.videos-chip');
        if (!btn) return;
        currentVideoCategory = btn.dataset.category;
        chips.querySelectorAll('.videos-chip').forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        renderVideos();
    });
}

// ============================================
// GRID
// ============================================

function renderVideos() {
    const videosGrid = document.getElementById('videos-grid');
    videosGrid.innerHTML = '';

    const categories = currentVideoCategory === 'all'
        ? videoCategories
        : videoCategories.filter(c => c.category === currentVideoCategory);

    categories.forEach(({ category, videos }) => {
        videosGrid.appendChild(createCategorySection(category, videos));
    });
}

function createCategorySection(category, videos) {
    const section = document.createElement('section');
    section.className = 'category-section';
    const headingId = `cat-${slugify(category)}`;
    section.setAttribute('aria-labelledby', headingId);

    section.innerHTML = `
        <header class="category-head">
            <h2 class="category-title" id="${headingId}">${escapeHtml(category)}</h2>
            <span class="category-count">${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'}</span>
        </header>`;

    const grid = document.createElement('ul');
    grid.className = 'category-grid';

    videos.forEach((video, index) => {
        const li = document.createElement('li');
        li.className = 'category-grid-item' + (index === 0 && videos.length >= 3 ? ' is-featured' : '');
        li.appendChild(createVideoCard(video, index));
        grid.appendChild(li);
    });

    section.appendChild(grid);
    return section;
}

function getThumbnail(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return `https://i.ytimg.com/vi/${extractYouTubeId(url)}/hqdefault.jpg`;
    }
    return '';
}

function createVideoCard(video, index) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'video-card video-item';
    card.dataset.videoId = String(video.id);
    card.setAttribute('data-video-url', video.url);
    card.setAttribute('aria-label', `Assistir: ${video.title}${video.description ? ' — ' + video.description : ''}`);

    const thumb = getThumbnail(video.url);
    const numero = String(index + 1).padStart(2, '0');

    card.innerHTML = `
        <span class="video-wrapper">
            ${thumb
                ? `<img class="video-thumb" src="${thumb}" alt="" loading="lazy" decoding="async">`
                : '<span class="video-thumb video-thumb-empty" aria-hidden="true"></span>'}
            <span class="video-shade" aria-hidden="true"></span>
            <span class="video-tag" aria-hidden="true">Replay</span>
            <span class="video-num" aria-hidden="true">#${numero}</span>
            <span class="video-play" aria-hidden="true">${PLAY_SVG}<span class="video-play-label">Assistir</span></span>
        </span>
        <span class="video-info">
            <span class="video-title">${escapeHtml(video.title)}</span>
            ${video.description ? `<span class="video-description">${escapeHtml(video.description)}</span>` : ''}
        </span>`;

    card.addEventListener('click', () => openTheater(video));
    return card;
}

// ============================================
// PLAYER EM MODO TEATRO
// ============================================

function setupTheater() {
    const theater = document.getElementById('videoTheater');
    const closeBtn = document.getElementById('videoTheaterClose');
    if (!theater || theater.dataset.ready) return;
    theater.dataset.ready = '1';

    closeBtn.addEventListener('click', closeTheater);
    theater.addEventListener('click', (e) => {
        if (e.target === theater) closeTheater();
    });

    document.addEventListener('keydown', (e) => {
        if (theater.hidden) return;
        if (e.key === 'Escape') {
            closeTheater();
        } else if (e.key === 'Tab') {
            const focusables = Array.from(theater.querySelectorAll('button, iframe'));
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

function openTheater(video) {
    const theater = document.getElementById('videoTheater');
    const frame = document.getElementById('videoTheaterFrame');
    lastFocusedBeforeTheater = document.activeElement;

    document.getElementById('videoTheaterTitle').textContent = video.title;
    document.getElementById('videoTheaterDesc').textContent = video.description || '';

    let src = getEmbedUrl(video.url);
    src += (src.includes('?') ? '&' : '?') + 'autoplay=1';

    frame.innerHTML = `<iframe src="${escapeHtml(src)}" title="${escapeHtml(video.title)}" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;

    theater.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('videoTheaterClose').focus();

    if (typeof sendEvent === 'function') {
        sendEvent('video_click', { video_title: video.title, video_url: video.url });
    }
}

function closeTheater() {
    const theater = document.getElementById('videoTheater');
    if (!theater || theater.hidden) return;
    theater.hidden = true;
    document.getElementById('videoTheaterFrame').innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocusedBeforeTheater && typeof lastFocusedBeforeTheater.focus === 'function') {
        lastFocusedBeforeTheater.focus();
    }
}

// ============================================
// URLs
// ============================================

function getEmbedUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${extractYouTubeId(url)}`;
    }
    if (url.includes('clips.twitch.tv') || url.includes('twitch.tv/') && url.includes('/clip/')) {
        const clipId = url.split('/').pop().split('?')[0];
        return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}`;
    }
    if (url.includes('streamable.com')) {
        return `https://streamable.com/e/${url.split('/').pop()}`;
    }
    if (url.includes('vimeo.com')) {
        return `https://player.vimeo.com/video/${url.split('/').pop()}`;
    }
    return url;
}

function extractYouTubeId(url) {
    if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
    return url;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadVideos);
