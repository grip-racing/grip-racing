/**
 * eventos.js - Gerenciamento da página de eventos especiais (WES e iRacing)
 */

// Format liga with logo or text
function formatLiga(ligaNome, cssClass = 'liga-display') {
    if (!ligaNome) return '';
    const ligaNormalizada = ligaNome.toLowerCase().replace(/\s+/g, '');
    const logoPath = `assets/ligas/${ligaNormalizada}.png`;
    
    return `<span class="${cssClass}">
        <img src="${logoPath}" alt="${ligaNome}" title="${ligaNome}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
        <span class="liga-text" style="display:none;">${ligaNome}</span>
    </span>`;
}

let allEventos = [];
let displayEventos = [];
let currentFilter = 'all';
let currentSort = { column: 'temporada', direction: 'desc' };
const ITEMS_PER_PAGE = 30;
let currentPage = 1;
let currentVideoIndex = 0;
let currentEventoVideos = [];

// ============================================
// CARREGAR E PROCESSAR DADOS
// ============================================

async function loadEventosData() {
    try {
        const participacoes = await fetchData('data/data-participacoes.csv');
        
        // Filtrar apenas eventos (Categoria começa com WES ou Liga = iRacing)
        const eventosParticipacoes = participacoes.filter(p => 
            (p.Categoria && p.Categoria.startsWith('WES') || p.Liga === 'iRacing') && 
            p.Pista && 
            p.Pista.trim() !== ''
        );

        // Agrupar por evento único (Categoria ou Nome do Evento + Liga + Temporada + Pista)
        const eventosMap = new Map();

        eventosParticipacoes.forEach(p => {
            // Para WES, o nome está na Categoria; para iRacing, está na Categoria também
            const nomeEvento = p.Categoria;
            const tipoEvento = (p.Categoria && p.Categoria.startsWith('WES')) ? 'WES' : 'iRacing';
            const eventoKey = `${nomeEvento}_${tipoEvento}_${p.Temporada}_${p.Pista}`;
            
            if (!eventosMap.has(eventoKey)) {
                eventosMap.set(eventoKey, {
                    nome: nomeEvento,
                    tipo: tipoEvento,
                    liga: p.Liga,
                    pista: p.Pista,
                    temporada: p.Temporada,
                    ano: p.Ano,
                    linksTransmissao: [],
                    participacoes: []
                });
            }

            // Adicionar link de transmissão se existir e não estiver duplicado
            const linkTransmissao = p['Link Transmissao'];
            if (linkTransmissao && linkTransmissao !== '#N/A' && linkTransmissao.trim() !== '') {
                const evento = eventosMap.get(eventoKey);
                // Parse múltiplos links separados por ||
                const links = linkTransmissao.split('||')
                    .map(link => link.trim())
                    .filter(link => link && link !== '#N/A');
                
                links.forEach(link => {
                    if (!evento.linksTransmissao.includes(link)) {
                        evento.linksTransmissao.push(link);
                    }
                });
            }

            // Adicionar participação ao evento
            eventosMap.get(eventoKey).participacoes.push({
                piloto: p.Piloto,
                final: p.Final,
                pole: p.Pole === 'SIM',
                bestLap: p['Best Lap'] === 'SIM',
                hatTrick: p['Hat-Trick'] === 'SIM',
                chelem: p.Chelem === 'SIM'
            });
        });

        // Processar eventos agrupando pilotos por posição final
        allEventos = Array.from(eventosMap.values()).map(evento => {
            // Agrupar pilotos pela mesma posição (dividem o carro)
            const resultadosMap = new Map();
            
            evento.participacoes.forEach(p => {
                const pos = p.final;
                if (!resultadosMap.has(pos)) {
                    resultadosMap.set(pos, {
                        posicao: pos,
                        pilotos: [],
                        pole: false,
                        bestLap: false,
                        hatTrick: false,
                        chelem: false
                    });
                }
                
                const resultado = resultadosMap.get(pos);
                resultado.pilotos.push(p.piloto);
                
                // Se qualquer piloto do carro teve pole/bestlap/etc, marcar
                if (p.pole) resultado.pole = true;
                if (p.bestLap) resultado.bestLap = true;
                if (p.hatTrick) resultado.hatTrick = true;
                if (p.chelem) resultado.chelem = true;
            });

            const resultados = Array.from(resultadosMap.values())
                .sort((a, b) => {
                    // Ordenar por posição (tratar DNF, DNS, etc)
                    const posA = isNaN(parseInt(a.posicao)) ? 999 : parseInt(a.posicao);
                    const posB = isNaN(parseInt(b.posicao)) ? 999 : parseInt(b.posicao);
                    return posA - posB;
                });

            // Melhor resultado da Grip Racing neste evento
            const melhorResultado = resultados[0];
            const melhorPosNum = parseInt(melhorResultado.posicao);
            const isVitoria = melhorPosNum === 1;
            const isPodio = melhorPosNum >= 2 && melhorPosNum <= 3;

            return {
                ...evento,
                resultados: resultados,
                melhorResultado: melhorResultado.posicao,
                totalPilotos: evento.participacoes.length,
                pilotos: [...new Set(evento.participacoes.map(p => p.piloto))],
                isVitoria: isVitoria,
                isPodio: isPodio
            };
        });

        // Ordenar por temporada mais recente por padrão
        allEventos.sort((a, b) => {
            const [anoA, temporadaA] = a.temporada.split('-').map(Number);
            const [anoB, temporadaB] = b.temporada.split('-').map(Number);
            if (anoA !== anoB) return anoB - anoA;
            return temporadaB - temporadaA;
        });

        displayEventos = [...allEventos];
        
        updateStats();
        renderEventos();
        setupEventHandlers();
        
        console.log('✅ Eventos carregados:', allEventos.length);
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================

function updateStats() {
    const totalEventos = allEventos.length;
    const totalParticipacoes = allEventos.reduce((sum, e) => sum + e.totalPilotos, 0);
    const totalVitorias = allEventos.filter(e => e.isVitoria).length;
    const totalPodios = allEventos.filter(e => e.isPodio).length;

    document.getElementById('totalEventos').textContent = totalEventos;
    document.getElementById('totalEventosHero').textContent = totalEventos;
    document.getElementById('totalParticipacoesEventos').textContent = totalParticipacoes;
    document.getElementById('totalVitoriasEventos').textContent = totalVitorias;
    document.getElementById('totalPodiosEventos').textContent = totalPodios + totalVitorias;
}

// ============================================
// RENDERIZAR TABELA
// ============================================

function renderEventos() {
    const tbody = document.getElementById('eventosTableBody');
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const eventosToShow = displayEventos.slice(0, endIndex);

    tbody.innerHTML = eventosToShow.map(evento => {
        // Usar logo da liga se disponível
        const ligaParaLogo = evento.tipo === 'WES' ? 'F1BC' : evento.liga;
        const ligaHtml = formatLiga(ligaParaLogo, 'liga-display-evento');
        
        const resultadoBadge = getResultadoBadge(evento.melhorResultado);
        const pilotosHtml = evento.pilotos.slice(0, 3).map(p => 
            `<span class="piloto-tag">${p}</span>`
        ).join('');
        const maisHtml = evento.pilotos.length > 3 ? 
            `<span class="piloto-tag">+${evento.pilotos.length - 3}</span>` : '';

        return `
            <tr onclick="showEventoModal('${evento.nome}', '${evento.tipo}', '${evento.temporada}', '${evento.pista}')">
                <td data-label="Evento">${evento.nome}</td>
                <td data-label="Tipo">${ligaHtml}</td>
                <td data-label="Pista">${evento.pista}</td>
                <td data-label="Temporada">${evento.temporada}</td>
                <td data-label="Resultado">${resultadoBadge}</td>
                <td data-label="Pilotos">
                    <div class="pilotos-evento">
                        ${pilotosHtml}${maisHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Gerenciar botão "Carregar Mais"
    if (displayEventos.length > endIndex) {
        showLoadMoreButton(endIndex, displayEventos.length);
    } else {
        hideLoadMoreButton();
    }
}

function getResultadoBadge(posicao) {
    const posStr = String(posicao).toUpperCase();
    
    // Verificar DNF/ABANDON/DQ
    if (posStr.includes('DNF') || posStr.includes('ABANDON') || posStr.includes('DQ')) {
        return `<span class="resultado-badge dnf">DNF</span>`;
    }
    
    const pos = parseInt(posicao);
    
    if (pos === 1) {
        return `<span class="resultado-badge vitoria">${posicao}°</span>`;
    } else if (pos >= 2 && pos <= 3) {
        return `<span class="resultado-badge podio">${posicao}°</span>`;
    } else if (pos >= 4 && pos <= 10) {
        return `<span class="resultado-badge top10">${posicao}°</span>`;
    } else {
        return `<span class="resultado-badge outros">${posicao}°</span>`;
    }
}

// ============================================
// MODAL DO EVENTO
// ============================================

function showEventoModal(nome, tipo, temporada, pista) {
    const evento = allEventos.find(e => 
        e.nome === nome && 
        e.tipo === tipo && 
        e.temporada === temporada &&
        e.pista === pista
    );

    if (!evento) return;

    // Preencher informações do header
    document.getElementById('modalEventoNome').textContent = evento.nome;
    
    // Usar logo da liga
    const ligaParaLogo = tipo === 'WES' ? 'F1BC' : evento.liga;
    document.getElementById('modalEventoLiga').innerHTML = formatLiga(ligaParaLogo, 'evento-liga-logo');
    document.getElementById('modalEventoPista').textContent = `📍 ${evento.pista}`;
    document.getElementById('modalEventoTemporada').textContent = `📅 ${evento.temporada}`;

    // Transmissão
    const transmissaoContainer = document.getElementById('modalTransmissaoContainer');
    const transmissaoDiv = document.getElementById('modalTransmissao');
    const videoControls = document.getElementById('modalVideoControls');
    
    if (evento.linksTransmissao && evento.linksTransmissao.length > 0) {
        transmissaoContainer.style.display = 'block';
        
        // Converter links para embed
        const convertToEmbed = (url) => {
            if (url.includes('youtube.com/watch?v=')) {
                const videoId = url.split('v=')[1].split('&')[0];
                return `https://www.youtube.com/embed/${videoId}`;
            } else if (url.includes('youtu.be/')) {
                const videoId = url.split('youtu.be/')[1].split('?')[0];
                return `https://www.youtube.com/embed/${videoId}`;
            }
            return url;
        };
        
        const embedUrls = evento.linksTransmissao.map(convertToEmbed);
        
        if (embedUrls.length === 1) {
            // Vídeo único
            transmissaoDiv.innerHTML = `
                <iframe 
                    src="${embedUrls[0]}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
            videoControls.style.display = 'none';
        } else {
            // Múltiplos vídeos - criar estrutura com dados embutidos
            transmissaoDiv.innerHTML = `
                <iframe 
                    src="${embedUrls[0]}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    class="evento-carousel-iframe">
                </iframe>
                <div class="evento-carousel-data" style="display:none;">${embedUrls.join('||')}</div>
            `;
            videoControls.style.display = 'flex';
            document.querySelector('#modalVideoCounter .current-video').textContent = '1';
            document.querySelector('#modalVideoCounter .total-videos').textContent = embedUrls.length;
        }
    } else {
        transmissaoContainer.style.display = 'none';
    }

    // Resultados
    const resultadosDiv = document.getElementById('modalResultados');
    resultadosDiv.innerHTML = evento.resultados.map(resultado => {
        const pos = parseInt(resultado.posicao);
        const posClass = !isNaN(pos) && pos <= 3 ? `pos-${pos}` : '';
        
        const pilotosHtml = resultado.pilotos.map((p, index) => 
            `<span class="evento-resultado-piloto">${p}${index < resultado.pilotos.length - 1 ? ',' : ''}</span>`
        ).join(' ');

        const badgesHtml = [];
        const posicaoStr = String(resultado.posicao).toUpperCase();
        if (posicaoStr.includes('DNF') || posicaoStr.includes('ABANDON') || posicaoStr.includes('DQ')) {
            badgesHtml.push('<span class="evento-badge dnf">DNF</span>');
        }
        if (resultado.pole) badgesHtml.push('<span class="evento-badge pole">Pole</span>');
        if (resultado.bestLap) badgesHtml.push('<span class="evento-badge bestlap">Melhor Volta</span>');
        if (resultado.hatTrick) badgesHtml.push('<span class="evento-badge hattrick">Hat-Trick</span>');
        if (resultado.chelem) badgesHtml.push('<span class="evento-badge chelem">Chelem</span>');

        return `
            <div class="evento-resultado-item ${posClass}">
                <div class="evento-resultado-posicao">${resultado.posicao}°</div>
                <div class="evento-resultado-info">
                    <div class="evento-resultado-pilotos">${pilotosHtml}</div>
                    ${badgesHtml.length > 0 ? `<div class="evento-resultado-badges">${badgesHtml.join('')}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Mostrar modal
    document.getElementById('eventoModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Event tracking
    if (typeof sendEvent === 'function') {
        sendEvent('event_view', {
            event_name: evento.nome,
            event_type: evento.tipo,
            season: evento.temporada
        });
    }
}

function closeEventoModal() {
    document.getElementById('eventoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('eventoModal');
    if (e.target === modal) {
        closeEventoModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEventoModal();
    }
});

// ============================================
// FILTROS E BUSCA
// ============================================

function setupEventHandlers() {
    // Busca
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        applyFiltersAndSearch();
    });

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            applyFiltersAndSearch();

            if (typeof sendEvent === 'function') {
                sendEvent('event_filter', {
                    filter_type: currentFilter
                });
            }
        });
    });

    // Ordenação
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.dataset.sort;
            
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'desc';
            }

            document.querySelectorAll('.sortable').forEach(t => t.classList.remove('sorted'));
            this.classList.add('sorted');

            sortEventos();
            renderEventos();

            if (typeof sendEvent === 'function') {
                sendEvent('column_sort', {
                    column_name: column,
                    sort_direction: currentSort.direction
                });
            }
        });
    });
}

function applyFiltersAndSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    displayEventos = allEventos.filter(evento => {
        // Filtro de tipo
        let passFilter = true;
        if (currentFilter === 'WES') passFilter = evento.tipo === 'WES';
        else if (currentFilter === 'iRacing') passFilter = evento.tipo === 'iRacing';
        else if (currentFilter === 'victories') passFilter = evento.isVitoria;
        else if (currentFilter === 'podiums') passFilter = evento.isPodio || evento.isVitoria;

        if (!passFilter) return false;

        // Busca
        if (searchTerm) {
            return evento.nome.toLowerCase().includes(searchTerm) ||
                   evento.pista.toLowerCase().includes(searchTerm) ||
                   evento.pilotos.some(p => p.toLowerCase().includes(searchTerm));
        }

        return true;
    });

    currentPage = 1;
    sortEventos();
    renderEventos();
}

function sortEventos() {
    displayEventos.sort((a, b) => {
        let aVal, bVal;

        switch (currentSort.column) {
            case 'name':
                aVal = a.nome;
                bVal = b.nome;
                break;
            case 'liga':
                aVal = a.tipo;
                bVal = b.tipo;
                break;
            case 'pista':
                aVal = a.pista;
                bVal = b.pista;
                break;
            case 'temporada':
                const [anoA, tempA] = a.temporada.split('-').map(Number);
                const [anoB, tempB] = b.temporada.split('-').map(Number);
                aVal = anoA * 10 + tempA;
                bVal = anoB * 10 + tempB;
                break;
            case 'resultado':
                aVal = parseInt(a.melhorResultado) || 999;
                bVal = parseInt(b.melhorResultado) || 999;
                break;
            case 'pilotos':
                aVal = a.totalPilotos;
                bVal = b.totalPilotos;
                break;
            default:
                return 0;
        }

        if (typeof aVal === 'string') {
            return currentSort.direction === 'asc' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        } else {
            return currentSort.direction === 'asc' 
                ? aVal - bVal
                : bVal - aVal;
        }
    });
}

// ============================================
// CARREGAR MAIS
// ============================================

function showLoadMoreButton(shown, total) {
    let btn = document.getElementById('loadMoreBtn');
    if (!btn) return;

    btn.style.display = 'block';
    btn.innerHTML = `
        <div class="load-more-container">
            <button class="load-more-btn" onclick="loadMore()">
                <span class="load-more-text">Carregar Mais</span>
                <span class="load-more-count">Mostrando ${shown} de ${total} eventos</span>
            </button>
        </div>
    `;
}

function hideLoadMoreButton() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = 'none';
}

function loadMore() {
    currentPage++;
    renderEventos();

    if (typeof sendEvent === 'function') {
        sendEvent('load_more_events', {
            current_page: currentPage
        });
    }
}

// ============================================
// CARROSSEL DE VÍDEOS
// ============================================

function changeEventoVideo(direction) {
    const transmissaoDiv = document.getElementById('modalTransmissao');
    const dataEl = transmissaoDiv.querySelector('.evento-carousel-data');
    const iframe = transmissaoDiv.querySelector('.evento-carousel-iframe');
    const counterEl = document.querySelector('#modalVideoCounter .current-video');
    
    if (!dataEl || !iframe) return;
    
    const videos = dataEl.textContent.split('||');
    const currentSrc = iframe.getAttribute('src');
    let currentIndex = videos.indexOf(currentSrc);
    
    // Calculate new index with wrapping
    currentIndex = (currentIndex + direction + videos.length) % videos.length;
    
    // Update iframe and counter
    iframe.setAttribute('src', videos[currentIndex]);
    counterEl.textContent = currentIndex + 1;
    
    // Event tracking
    if (typeof sendEvent === 'function') {
        sendEvent('event_video_change', {
            video_index: currentIndex + 1,
            total_videos: videos.length
        });
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadEventosData();
    
    // Event listeners para controles de vídeo
    const prevBtn = document.getElementById('modalVideoPrev');
    const nextBtn = document.getElementById('modalVideoNext');
    
    if (prevBtn) prevBtn.addEventListener('click', () => changeEventoVideo(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeEventoVideo(1));
});
