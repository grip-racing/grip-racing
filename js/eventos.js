/**
 * eventos.js - Página de eventos especiais (WES e iRacing)
 * Renderiza os eventos como "race cards" agrupados por ano e
 * abre um modal estilo tela de resultado de transmissão.
 */

// ============================================
// HELPERS
// ============================================

function escapeEventoHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Logo da liga (com fallback para texto)
function formatLiga(ligaNome, cssClass = 'liga-display') {
    if (!ligaNome) return '';
    const ligaNormalizada = ligaNome.toLowerCase().replace(/\s+/g, '');
    const logoPath = `assets/ligas/${ligaNormalizada}.png`;
    const nome = escapeEventoHtml(ligaNome);

    return `<span class="${cssClass}">
        <img src="${logoPath}" alt="${nome}" title="${nome}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
        <span class="liga-text" style="display:none;">${nome}</span>
    </span>`;
}

function isDnf(posicao) {
    const posStr = String(posicao).toUpperCase();
    return posStr.includes('DNF') || posStr.includes('ABANDON') || posStr.includes('DQ') || posStr.includes('DNS');
}

// Classe visual do resultado: p1, p2, p3, top10, dnf, field
function resultadoTier(posicao) {
    if (isDnf(posicao)) return 'dnf';
    const pos = parseInt(posicao, 10);
    if (pos === 1) return 'p1';
    if (pos === 2) return 'p2';
    if (pos === 3) return 'p3';
    if (pos >= 4 && pos <= 10) return 'top10';
    return 'field';
}

function resultadoLabel(posicao) {
    if (isDnf(posicao)) {
        const posStr = String(posicao).toUpperCase();
        if (posStr.includes('DQ')) return 'DQ';
        if (posStr.includes('DNS')) return 'DNS';
        return 'DNF';
    }
    const pos = parseInt(posicao, 10);
    return isNaN(pos) ? String(posicao) : `P${pos}`;
}

// "WES Daytona 24h" -> "24H"; "Indy 500" -> "500"
function eventoDuracao(nome) {
    const horas = String(nome).match(/(\d+)\s*h\b/i);
    if (horas) return `${horas[1]}H`;
    const milhas = String(nome).match(/\b(\d{3})\b/);
    if (milhas) return milhas[1];
    return '';
}

const PIN_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const FLAG_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 22V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>';
const PLAY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

let allEventos = [];
let displayEventos = [];
let currentFilter = 'all';
let currentSort = { column: 'temporada', direction: 'desc' };
const ITEMS_PER_PAGE = 30;
let currentPage = 1;
let lastFocusedBeforeModal = null;

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

        const eventosMap = new Map();

        eventosParticipacoes.forEach(p => {
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

            const linkTransmissao = p['Link Transmissao'];
            if (linkTransmissao && linkTransmissao !== '#N/A' && linkTransmissao.trim() !== '') {
                const evento = eventosMap.get(eventoKey);
                linkTransmissao.split('||')
                    .map(link => link.trim())
                    .filter(link => link && link !== '#N/A')
                    .forEach(link => {
                        if (!evento.linksTransmissao.includes(link)) {
                            evento.linksTransmissao.push(link);
                        }
                    });
            }

            eventosMap.get(eventoKey).participacoes.push({
                piloto: p.Piloto,
                final: p.Final,
                pole: p.Pole === 'SIM',
                bestLap: p['Best Lap'] === 'SIM',
                hatTrick: p['Hat-Trick'] === 'SIM',
                chelem: p.Chelem === 'SIM'
            });
        });

        // Agrupar pilotos pela mesma posição (dividem o carro)
        allEventos = Array.from(eventosMap.values()).map(evento => {
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
                if (p.pole) resultado.pole = true;
                if (p.bestLap) resultado.bestLap = true;
                if (p.hatTrick) resultado.hatTrick = true;
                if (p.chelem) resultado.chelem = true;
            });

            const resultados = Array.from(resultadosMap.values())
                .sort((a, b) => {
                    const posA = isNaN(parseInt(a.posicao)) ? 999 : parseInt(a.posicao);
                    const posB = isNaN(parseInt(b.posicao)) ? 999 : parseInt(b.posicao);
                    return posA - posB;
                });

            const melhorResultado = resultados[0];
            const melhorPosNum = parseInt(melhorResultado.posicao);

            return {
                ...evento,
                resultados: resultados,
                melhorResultado: melhorResultado.posicao,
                totalPilotos: evento.participacoes.length,
                pilotos: [...new Set(evento.participacoes.map(p => p.piloto))],
                isVitoria: melhorPosNum === 1,
                isPodio: melhorPosNum >= 2 && melhorPosNum <= 3
            };
        });

        allEventos.forEach((evento, index) => { evento.id = index; });

        displayEventos = [...allEventos];
        sortEventos();

        updateStats();
        updateChipCounts();
        renderEventos();
        setupEventHandlers();
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        const grid = document.getElementById('eventosGrid');
        if (grid) grid.innerHTML = '<div class="eventos-empty">Não foi possível carregar os eventos. Tente recarregar a página.</div>';
    }
}

// ============================================
// ESTATÍSTICAS
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

function passesFilter(evento, filter) {
    if (filter === 'WES') return evento.tipo === 'WES';
    if (filter === 'iRacing') return evento.tipo === 'iRacing';
    if (filter === 'victories') return evento.isVitoria;
    if (filter === 'podiums') return evento.isPodio || evento.isVitoria;
    return true;
}

function updateChipCounts() {
    document.querySelectorAll('.eventos-chip-count').forEach(el => {
        el.textContent = allEventos.filter(e => passesFilter(e, el.dataset.count)).length;
    });
}

// ============================================
// RENDERIZAR RACE CARDS
// ============================================

function renderRaceCard(evento) {
    const tier = resultadoTier(evento.melhorResultado);
    const label = resultadoLabel(evento.melhorResultado);
    const duracao = eventoDuracao(evento.nome);
    const ligaParaLogo = evento.tipo === 'WES' ? 'F1BC' : evento.liga;
    const pilotosHtml = evento.pilotos.slice(0, 3)
        .map(p => `<span class="race-card-driver">${escapeEventoHtml(p)}</span>`).join('');
    const maisHtml = evento.pilotos.length > 3
        ? `<span class="race-card-driver is-more">+${evento.pilotos.length - 3}</span>` : '';
    const temVideo = evento.linksTransmissao.length > 0;
    const posTexto = tier === 'dnf' ? 'não completou' : `melhor resultado ${label}`;

    return `
        <li class="race-card-item">
            <button type="button" class="race-card tier-${tier}" data-evento-id="${evento.id}"
                aria-label="${escapeEventoHtml(evento.nome)}, ${escapeEventoHtml(evento.pista)}, temporada ${escapeEventoHtml(evento.temporada)}, ${posTexto}. Ver resultado">
                <span class="race-card-pos" aria-hidden="true">
                    <span class="race-card-pos-caption">${tier === 'dnf' ? 'Status' : 'Melhor'}</span>
                    <span class="race-card-pos-num">${escapeEventoHtml(label)}</span>
                </span>
                <span class="race-card-body">
                    ${duracao ? `<span class="race-card-watermark" aria-hidden="true">${duracao}</span>` : ''}
                    <span class="race-card-top">
                        <span class="race-card-series series-${evento.tipo.toLowerCase()}">${escapeEventoHtml(evento.tipo)}</span>
                        <span class="race-card-season">${escapeEventoHtml(evento.temporada)}</span>
                        ${formatLiga(ligaParaLogo, 'race-card-liga')}
                    </span>
                    <span class="race-card-name">${escapeEventoHtml(evento.nome)}</span>
                    <span class="race-card-track">${PIN_ICON}${escapeEventoHtml(evento.pista)}</span>
                    <span class="race-card-crew">${pilotosHtml}${maisHtml}</span>
                    <span class="race-card-foot">
                        ${temVideo ? `<span class="race-card-onair">${PLAY_ICON} Transmissão</span>` : '<span></span>'}
                        <span class="race-card-cta">Resultado <span aria-hidden="true">&rarr;</span></span>
                    </span>
                </span>
            </button>
        </li>`;
}

function renderEventos() {
    const grid = document.getElementById('eventosGrid');
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const eventosToShow = displayEventos.slice(0, endIndex);

    const status = document.getElementById('eventosStatus');
    if (status) {
        status.textContent = displayEventos.length === allEventos.length
            ? `${allEventos.length} eventos no grid`
            : `${displayEventos.length} de ${allEventos.length} eventos`;
    }

    if (eventosToShow.length === 0) {
        grid.innerHTML = `
            <div class="eventos-empty">
                <strong>Bandeira amarela.</strong>
                Nenhum evento encontrado com esses filtros.
                <button type="button" class="eventos-reset" onclick="resetEventosFilters()">Limpar filtros</button>
            </div>`;
        hideLoadMoreButton();
        return;
    }

    // Agrupar por ano quando ordenado por temporada
    if (currentSort.column === 'temporada') {
        const grupos = [];
        eventosToShow.forEach(evento => {
            const ano = String(evento.temporada).split('-')[0];
            let grupo = grupos[grupos.length - 1];
            if (!grupo || grupo.ano !== ano) {
                grupo = { ano, eventos: [] };
                grupos.push(grupo);
            }
            grupo.eventos.push(evento);
        });

        grid.innerHTML = grupos.map(grupo => {
            const vitorias = grupo.eventos.filter(e => e.isVitoria).length;
            return `
            <section class="eventos-season" aria-labelledby="season-${grupo.ano}">
                <header class="eventos-season-head">
                    <h2 class="eventos-season-year" id="season-${grupo.ano}">${grupo.ano}</h2>
                    <span class="eventos-season-meta">${grupo.eventos.length} ${grupo.eventos.length === 1 ? 'evento' : 'eventos'}${vitorias ? ` &middot; ${vitorias} ${vitorias === 1 ? 'vitória' : 'vitórias'}` : ''}</span>
                </header>
                <ul class="race-card-list">${grupo.eventos.map(renderRaceCard).join('')}</ul>
            </section>`;
        }).join('');
    } else {
        grid.innerHTML = `<ul class="race-card-list">${eventosToShow.map(renderRaceCard).join('')}</ul>`;
    }

    if (displayEventos.length > endIndex) {
        showLoadMoreButton(endIndex, displayEventos.length);
    } else {
        hideLoadMoreButton();
    }
}

// Compatibilidade com código antigo
function getResultadoBadge(posicao) {
    const tier = resultadoTier(posicao);
    return `<span class="resultado-badge tier-${tier}">${escapeEventoHtml(resultadoLabel(posicao))}</span>`;
}

// ============================================
// MODAL DO EVENTO
// ============================================

function toEmbedUrl(url) {
    if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
}

function buildEmbedIframe(src, title, extraClass = '') {
    return `<iframe src="${escapeEventoHtml(src)}" title="${escapeEventoHtml(title)}" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen ${extraClass ? `class="${extraClass}"` : ''}></iframe>`;
}

function openEventoModalById(id) {
    const evento = allEventos.find(e => e.id === id);
    if (evento) openEventoModal(evento);
}

// Mantido por compatibilidade (assinatura antiga)
function showEventoModal(nome, tipo, temporada, pista) {
    const evento = allEventos.find(e =>
        e.nome === nome && e.tipo === tipo && e.temporada === temporada && e.pista === pista
    );
    if (evento) openEventoModal(evento);
}

function openEventoModal(evento) {
    lastFocusedBeforeModal = document.activeElement;

    document.getElementById('modalEventoNome').textContent = evento.nome;
    const ligaParaLogo = evento.tipo === 'WES' ? 'F1BC' : evento.liga;
    document.getElementById('modalEventoLiga').innerHTML = formatLiga(ligaParaLogo, 'evento-liga-logo');
    document.getElementById('modalEventoPista').innerHTML = `${PIN_ICON}<span>${escapeEventoHtml(evento.pista)}</span>`;
    document.getElementById('modalEventoTemporada').innerHTML = `${FLAG_ICON}<span>Temporada ${escapeEventoHtml(evento.temporada)}</span>`;

    // Transmissão
    const transmissaoContainer = document.getElementById('modalTransmissaoContainer');
    const transmissaoDiv = document.getElementById('modalTransmissao');
    const videoControls = document.getElementById('modalVideoControls');

    if (evento.linksTransmissao && evento.linksTransmissao.length > 0) {
        transmissaoContainer.style.display = 'block';
        const embedUrls = evento.linksTransmissao.map(toEmbedUrl);
        const titulo = `Transmissão: ${evento.nome}`;

        if (embedUrls.length === 1) {
            transmissaoDiv.innerHTML = buildEmbedIframe(embedUrls[0], titulo);
            videoControls.style.display = 'none';
        } else {
            transmissaoDiv.innerHTML = buildEmbedIframe(embedUrls[0], titulo, 'evento-carousel-iframe');
            transmissaoDiv.dataset.videos = JSON.stringify(embedUrls);
            transmissaoDiv.dataset.index = '0';
            videoControls.style.display = 'flex';
            document.querySelector('#modalVideoCounter .current-video').textContent = '1';
            document.querySelector('#modalVideoCounter .total-videos').textContent = embedUrls.length;
        }
    } else {
        transmissaoContainer.style.display = 'none';
        transmissaoDiv.innerHTML = '';
    }

    // Resultados (timing tower)
    const resultadosDiv = document.getElementById('modalResultados');
    resultadosDiv.innerHTML = evento.resultados.map(resultado => {
        const tier = resultadoTier(resultado.posicao);
        const label = resultadoLabel(resultado.posicao);

        const pilotosHtml = resultado.pilotos
            .map(p => `<span class="evento-resultado-piloto">${escapeEventoHtml(p)}</span>`)
            .join('<span class="evento-resultado-sep" aria-hidden="true">/</span>');

        const badges = [];
        if (tier === 'dnf') badges.push(`<span class="evento-badge dnf">${label}</span>`);
        if (resultado.pole) badges.push('<span class="evento-badge pole">Pole</span>');
        if (resultado.bestLap) badges.push('<span class="evento-badge bestlap">Melhor volta</span>');
        if (resultado.hatTrick) badges.push('<span class="evento-badge hattrick">Hat-trick</span>');
        if (resultado.chelem) badges.push('<span class="evento-badge chelem">Chelem</span>');

        return `
            <div class="evento-resultado-item tier-${tier}">
                <div class="evento-resultado-posicao">${escapeEventoHtml(label)}</div>
                <div class="evento-resultado-info">
                    <div class="evento-resultado-pilotos">${pilotosHtml}</div>
                    ${badges.length ? `<div class="evento-resultado-badges">${badges.join('')}</div>` : ''}
                </div>
                <div class="evento-resultado-car" aria-label="${resultado.pilotos.length} ${resultado.pilotos.length === 1 ? 'piloto' : 'pilotos'}">
                    ${resultado.pilotos.length}<small>${resultado.pilotos.length === 1 ? 'piloto' : 'pilotos'}</small>
                </div>
            </div>`;
    }).join('');

    const modal = document.getElementById('eventoModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const dialog = modal.querySelector('.evento-modal');
    if (dialog) dialog.scrollTop = 0;
    const closeBtn = modal.querySelector('.evento-modal-close');
    if (closeBtn) closeBtn.focus();

    if (typeof sendEvent === 'function') {
        sendEvent('event_view', {
            event_name: evento.nome,
            event_type: evento.tipo,
            season: evento.temporada
        });
    }
}

function isEventoModalOpen() {
    const modal = document.getElementById('eventoModal');
    return modal && modal.style.display !== 'none';
}

function closeEventoModal() {
    const modal = document.getElementById('eventoModal');
    if (!modal || modal.style.display === 'none') return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Para o vídeo ao fechar
    const transmissaoDiv = document.getElementById('modalTransmissao');
    if (transmissaoDiv) transmissaoDiv.innerHTML = '';
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
        lastFocusedBeforeModal.focus();
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('eventoModal');
    if (e.target === modal) closeEventoModal();
});

// Esc fecha; Tab fica preso dentro do modal
document.addEventListener('keydown', (e) => {
    if (!isEventoModalOpen()) return;
    if (e.key === 'Escape') {
        closeEventoModal();
        return;
    }
    if (e.key === 'Tab') {
        const dialog = document.querySelector('#eventoModal .evento-modal');
        const focusables = Array.from(dialog.querySelectorAll('button, [href], iframe, input, select, [tabindex]:not([tabindex="-1"])'))
            .filter(el => el.offsetParent !== null);
        if (focusables.length === 0) return;
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

// ============================================
// FILTROS, BUSCA E ORDENAÇÃO
// ============================================

function setActiveChip(filter) {
    document.querySelectorAll('.eventos-chip').forEach(b => {
        const active = b.dataset.filter === filter;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function resetEventosFilters() {
    currentFilter = 'all';
    setActiveChip('all');
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    applyFiltersAndSearch();
}

function setupEventHandlers() {
    document.getElementById('searchInput').addEventListener('input', applyFiltersAndSearch);

    document.querySelectorAll('.eventos-chip').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            setActiveChip(currentFilter);
            applyFiltersAndSearch();
            if (typeof sendEvent === 'function') {
                sendEvent('event_filter', { filter_type: currentFilter });
            }
        });
    });

    const sortSelect = document.getElementById('eventosSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const [column, direction] = this.value.split(':');
            currentSort = { column, direction };
            sortEventos();
            currentPage = 1;
            renderEventos();
            if (typeof sendEvent === 'function') {
                sendEvent('column_sort', { column_name: column, sort_direction: direction });
            }
        });
    }

    // Delegação de clique nos race cards
    document.getElementById('eventosGrid').addEventListener('click', (e) => {
        const card = e.target.closest('.race-card');
        if (card) openEventoModalById(Number(card.dataset.eventoId));
    });
}

function applyFiltersAndSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

    displayEventos = allEventos.filter(evento => {
        if (!passesFilter(evento, currentFilter)) return false;
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

function temporadaValue(temporada) {
    const [ano, temp] = String(temporada).split('-').map(Number);
    return (ano || 0) * 10 + (temp || 0);
}

function sortEventos() {
    displayEventos.sort((a, b) => {
        let aVal, bVal;
        switch (currentSort.column) {
            case 'name':
                aVal = a.nome; bVal = b.nome; break;
            case 'liga':
                aVal = a.tipo; bVal = b.tipo; break;
            case 'pista':
                aVal = a.pista; bVal = b.pista; break;
            case 'temporada':
                aVal = temporadaValue(a.temporada); bVal = temporadaValue(b.temporada); break;
            case 'resultado':
                aVal = parseInt(a.melhorResultado) || 999; bVal = parseInt(b.melhorResultado) || 999; break;
            case 'pilotos':
                aVal = a.totalPilotos; bVal = b.totalPilotos; break;
            default:
                return 0;
        }
        let cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
        if (currentSort.direction === 'desc') cmp = -cmp;
        // Desempate: mais recente primeiro
        return cmp || temporadaValue(b.temporada) - temporadaValue(a.temporada);
    });
}

// ============================================
// CARREGAR MAIS
// ============================================

function showLoadMoreButton(shown, total) {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;
    btn.style.display = 'block';
    btn.innerHTML = `
        <div class="eventos-load-more">
            <button type="button" class="btn-primary" onclick="loadMore()">Carregar mais</button>
            <span class="eventos-load-more-count">Mostrando ${shown} de ${total} eventos</span>
        </div>`;
}

function hideLoadMoreButton() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = 'none';
}

function loadMore() {
    currentPage++;
    renderEventos();
    if (typeof sendEvent === 'function') {
        sendEvent('load_more_events', { current_page: currentPage });
    }
}

// ============================================
// CARROSSEL DE VÍDEOS
// ============================================

function changeEventoVideo(direction) {
    const transmissaoDiv = document.getElementById('modalTransmissao');
    const iframe = transmissaoDiv.querySelector('.evento-carousel-iframe');
    if (!iframe || !transmissaoDiv.dataset.videos) return;

    const videos = JSON.parse(transmissaoDiv.dataset.videos);
    let index = Number(transmissaoDiv.dataset.index || 0);
    index = (index + direction + videos.length) % videos.length;
    transmissaoDiv.dataset.index = String(index);

    iframe.setAttribute('src', videos[index]);
    document.querySelector('#modalVideoCounter .current-video').textContent = index + 1;

    if (typeof sendEvent === 'function') {
        sendEvent('event_video_change', { video_index: index + 1, total_videos: videos.length });
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadEventosData();

    const prevBtn = document.getElementById('modalVideoPrev');
    const nextBtn = document.getElementById('modalVideoNext');
    if (prevBtn) prevBtn.addEventListener('click', () => changeEventoVideo(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeEventoVideo(1));
});
