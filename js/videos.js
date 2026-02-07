// Carrega e exibe os vídeos

async function loadVideos() {
    const videosGrid = document.getElementById('videos-grid');
    
    try {
        videosGrid.innerHTML = '<div class="loading">Carregando vídeos... 🎬</div>';
        
        const response = await fetch('data/videos.txt');
        const text = await response.text();
        
        const videos = parseVideosFile(text);
        
        if (videos.length === 0) {
            videosGrid.innerHTML = '<div class="no-videos">Nenhum vídeo por enquanto... 😢</div>';
            return;
        }
        
        videosGrid.innerHTML = '';
        
        // Agrupa vídeos por categoria
        const categories = groupByCategory(videos);
        
        // Renderiza cada categoria
        categories.forEach(({ category, videos }) => {
            const categorySection = createCategorySection(category, videos);
            videosGrid.appendChild(categorySection);
        });
        
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        videosGrid.innerHTML = '<div class="no-videos">Erro ao carregar os vídeos 😢</div>';
    }
}

function parseVideosFile(text) {
    const videos = [];
    const lines = text.split('\n');
    let currentCategory = 'Sem Categoria';
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Ignora linhas vazias e comentários
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        
        // Verifica se é um marcador de categoria
        const categoryMatch = trimmed.match(/^\[CATEGORIA:\s*(.+?)\]$/);
        if (categoryMatch) {
            currentCategory = categoryMatch[1].trim();
            continue;
        }
        
        // Parse do vídeo
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
        const category = video.category;
        if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
        }
        categoryMap.get(category).push(video);
    });
    
    // Converte para array e retorna
    return Array.from(categoryMap.entries()).map(([category, videos]) => ({
        category,
        videos
    }));
}

function createCategorySection(category, videos) {
    const section = document.createElement('div');
    section.className = 'category-section';
    
    const header = document.createElement('h2');
    header.className = 'category-title';
    header.textContent = category;
    section.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'category-grid';
    
    videos.forEach(video => {
        const card = createVideoCard(video);
        grid.appendChild(card);
    });
    
    section.appendChild(grid);
    
    return section;
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const embedUrl = getEmbedUrl(video.url);
    
    card.innerHTML = `
        <div class="video-wrapper">
            <iframe 
                src="${embedUrl}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
        <div class="video-info">
            <div class="video-title">${escapeHtml(video.title)}</div>
            ${video.description ? `<div class="video-description">${escapeHtml(video.description)}</div>` : ''}
        </div>
    `;
    
    return card;
}

function getEmbedUrl(url) {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Twitch Clips
    if (url.includes('clips.twitch.tv') || url.includes('twitch.tv/') && url.includes('/clip/')) {
        const clipId = url.split('/').pop().split('?')[0];
        return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}`;
    }
    
    // Streamable
    if (url.includes('streamable.com')) {
        const videoId = url.split('/').pop();
        return `https://streamable.com/e/${videoId}`;
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Se não reconhecer, tenta usar a URL diretamente
    return url;
}

function extractYouTubeId(url) {
    // Formato: youtube.com/watch?v=VIDEO_ID
    if (url.includes('watch?v=')) {
        return url.split('watch?v=')[1].split('&')[0];
    }
    
    // Formato: youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
    }
    
    // Formato: youtube.com/embed/VIDEO_ID
    if (url.includes('embed/')) {
        return url.split('embed/')[1].split('?')[0];
    }
    
    return url;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carrega os vídeos quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadVideos);
