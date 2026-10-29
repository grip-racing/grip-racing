// Pilotos page script — leaderboard estilo timing tower + pódio dinâmico
const DATA_SOURCES = {
    pilotos: 'data/data-pilotos.csv',
    participacoes: 'data/data-participacoes.csv'
};

const DETAIL_PAGE = 'piloto-detalhes-v2.html';

// Colunas numéricas (podem alimentar o pódio)
const METRICS = {
    corridas: { label: 'Corridas', unit: 'largadas' },
    titulos: { label: 'Títulos', unit: 'títulos' },
    vitorias: { label: 'Vitórias', unit: 'vitórias' },
    podios: { label: 'Pódios', unit: 'pódios' },
    poles: { label: 'Poles', unit: 'poles' },
    fastLaps: { label: 'Voltas rápidas', unit: 'voltas rápidas' },
    hatTricks: { label: 'Hat-tricks', unit: 'hat-tricks' },
    chelems: { label: 'Chelems', unit: 'chelems' }
};

const SORT_LABELS = {
    piloto: 'nome',
    estreia: 'estreia',
    ultima: 'última corrida'
};

let allPilotos = [];
let currentSort = { column: 'corridas', direction: 'desc' };
let currentFilter = 'todos';
let podiumMetric = 'corridas';
let fotosDisponiveis = new Set();
let activeSeasonYear = null;
let metricMax = {};

// Paginação para mobile
let currentPage = 1;
const ITEMS_PER_PAGE_MOBILE = 30;
const ITEMS_PER_PAGE_DESKTOP = 9999; // Mostra todos no desktop

// ---------- helpers ----------
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function fotoKey(nome) {
    return nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
}

// Código de 3 letras estilo timing (ex.: "Rodrigo de Sousa" -> "SOU")
function driverCode(nome) {
    const parts = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/);
    const last = parts[parts.length - 1] || nome;
    return last.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '---';
}

function splitName(nome) {
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return { first: '', last: parts[0] };
    return { first: parts[0], last: parts.slice(1).join(' ') };
}

function detailUrl(nome) {
    return `${DETAIL_PAGE}?nome=${encodeURIComponent(nome)}`;
}

function seasonYear(season) {
    const y = parseInt(String(season).split('-')[0], 10);
    return Number.isFinite(y) ? y : null;
}

function fmtNum(n) {
    return window.GripUtils.formatNumber(n);
}

function isMobileViewport() {
    return window.innerWidth <= 768;
}

// ---------- data ----------
async function loadPilotos() {
    // Carregar manifest de fotos disponíveis (evita metralhada de requests)
    try {
        const res = await fetch('assets/pilotos/manifest.json');
        if (res.ok) {
            const lista = await res.json();
            fotosDisponiveis = new Set(lista);
        }
    } catch (_) { /* sem fotos disponíveis */ }

    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);

    if (!pilotos || pilotos.length === 0) {
        document.getElementById('pilotosTableBody').innerHTML = '<tr><td colspan="12" class="empty-row">Erro ao carregar dados</td></tr>';
        return;
    }

    allPilotos = pilotos.map(p => ({
        piloto: p['Piloto'] || p['piloto'] || '',
        corridas: parseInt(p['Corridas'] || p['corridas'] || 0),
        titulos: parseInt(p['Tot. Títulos'] || p['Títulos'] || p['titulos'] || 0),
        podios: parseInt(p['Pódios'] || p['Podios'] || p['podios'] || 0),
        vitorias: parseInt(p['P1'] || p['Vitórias'] || p['vitorias'] || 0),
        poles: parseInt(p['Poles'] || p['poles'] || 0),
        fastLaps: parseInt(p['Fast Laps'] || p['fast_laps'] || 0),
        hatTricks: parseInt(p['Hat-Tricks'] || p['Hat-Trick'] || 0),
        chelems: parseInt(p['Chelems'] || p['Chelem'] || 0),
        top10: parseInt(p['Top 10'] || p['top_10'] || 0),
        estreia: p['Estreia'] || p['estreia'] || '-',
        ultima: p['Ultima'] || p['Última'] || p['ultima'] || '-',
        abandonos: parseInt(p['Abandonos'] || p['abandonos'] || 0)
    })).filter(p => p.piloto);

    // Máximos por métrica (barras de "gap" proporcionais ao líder)
    Object.keys(METRICS).forEach(key => {
        metricMax[key] = Math.max(1, ...allPilotos.map(p => p[key] || 0));
    });

    // Temporada mais recente presente nos dados => filtro "Ativos"
    const years = allPilotos.map(p => seasonYear(p.ultima)).filter(Boolean);
    activeSeasonYear = years.length ? Math.max(...years) : null;
    const activeLabel = document.getElementById('activeSeasonLabel');
    if (activeLabel && activeSeasonYear) activeLabel.textContent = activeSeasonYear;

    updateSummary();
    renderPodium();
    displayPilotos();
}

// Update summary cards
function updateSummary() {
    const totalPilotos = allPilotos.length;
    const campeoes = allPilotos.filter(p => p.titulos > 0).length;
    const totalCorridas = allPilotos.reduce((sum, p) => sum + (p.corridas || 0), 0);
    const totalPodios = allPilotos.reduce((sum, p) => sum + (p.podios || 0), 0);

    document.getElementById('totalPilotos').textContent = fmtNum(totalPilotos);
    document.getElementById('totalCorridas').textContent = fmtNum(totalCorridas);
    document.getElementById('totalPodios').textContent = fmtNum(totalPodios);
    document.getElementById('totalCampeoes').textContent = fmtNum(campeoes);

    const heroTotal = document.getElementById('totalPilotosHero');
    if (heroTotal) heroTotal.textContent = fmtNum(totalPilotos);

    updateSeoTags(totalPilotos);
}

// Title e metas acompanham o total da planilha (o HTML estático é só o fallback sem JS)
function updateSeoTags(total) {
    if (!total) return;
    const n = fmtNum(total);
    document.title = `Pilotos - Grip Racing | ${n} Pilotos e suas Estatísticas`;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.setAttribute('content', `Conheça os ${n} pilotos que fizeram história na Grip Racing. Estatísticas completas, títulos, pódios e participações em corridas virtuais.`);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
        ogDescription.setAttribute('content', `${n} pilotos que fizeram história na Grip Racing. Veja estatísticas completas de títulos, pódios e participações.`);
    }
}

// ---------- pódio ----------
function renderPodium() {
    const podium = document.getElementById('podium');
    if (!podium || allPilotos.length === 0) return;

    const metric = podiumMetric;
    const top = [...allPilotos]
        .filter(p => p[metric] > 0)
        .sort((a, b) => (b[metric] - a[metric]) || (b.corridas - a.corridas) || a.piloto.localeCompare(b.piloto))
        .slice(0, 3);

    const label = document.getElementById('podiumMetricLabel');
    if (label) label.textContent = METRICS[metric].label;

    document.querySelectorAll('.metric-chip').forEach(chip => {
        const on = chip.dataset.metric === metric;
        chip.classList.toggle('active', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Ordem na tela: P2, P1, P3 (degraus); ordem no DOM/leitores: P1, P2, P3
    podium.innerHTML = top.map((p, i) => {
        const pos = i + 1;
        const key = fotoKey(p.piloto);
        const { first, last } = splitName(p.piloto);
        const media = fotosDisponiveis.has(key)
            ? `<img src="assets/pilotos/${key}.png" alt="" class="podium-photo" loading="lazy">`
            : `<span class="podium-code" aria-hidden="true">${driverCode(p.piloto)}</span>`;
        return `
            <li class="podium-step podium-p${pos}">
                <a class="podium-card" href="${detailUrl(p.piloto)}">
                    <span class="podium-pos" aria-label="Posição ${pos}">P${pos}</span>
                    <span class="podium-media">${media}</span>
                    <span class="podium-name">
                        ${first ? `<span class="podium-first">${escapeHtml(first)}</span>` : ''}
                        <span class="podium-last">${escapeHtml(last)}</span>
                    </span>
                    <span class="podium-value">${fmtNum(p[metric])}<small>${METRICS[metric].unit}</small></span>
                    <span class="podium-plinth" aria-hidden="true">${pos}</span>
                </a>
            </li>`;
    }).join('');
}

function setMetric(metric) {
    if (!METRICS[metric]) return;
    podiumMetric = metric;
    currentSort = { column: metric, direction: 'desc' };
    syncMobileSelect();
    resetPagination();
    updateSortUI();
    renderPodium();
    displayPilotos();
}

function setupMetricChips() {
    document.querySelectorAll('.metric-chip').forEach(chip => {
        chip.addEventListener('click', () => setMetric(chip.dataset.metric));
    });
}

// ---------- tabela ----------
function getFilteredPilotos() {
    let list = [...allPilotos];

    if (currentFilter === 'campeoes') {
        list = list.filter(p => p.titulos > 0);
    } else if (currentFilter === 'vencedores') {
        list = list.filter(p => p.vitorias > 0);
    } else if (currentFilter === 'ativos' && activeSeasonYear) {
        list = list.filter(p => seasonYear(p.ultima) === activeSeasonYear);
    }

    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (searchTerm) {
        list = list.filter(p => p.piloto.toLowerCase().includes(searchTerm));
    }

    const { column, direction } = currentSort;
    list.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        let cmp;
        if (typeof aVal === 'number') {
            cmp = direction === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
            cmp = direction === 'asc'
                ? String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true })
                : String(bVal).localeCompare(String(aVal), 'pt-BR', { numeric: true });
        }
        // Desempate estável: mais corridas, depois nome
        return cmp || (b.corridas - a.corridas) || a.piloto.localeCompare(b.piloto);
    });

    return list;
}

function numCell(p, key, label) {
    const value = p[key] || 0;
    const sorted = currentSort.column === key;
    const cls = ['num'];
    if (sorted) cls.push('is-sorted');
    if (!value) cls.push('is-zero');
    const bar = sorted && value
        ? `<span class="gap-bar" style="--w-scale:${Math.max(0.04, value / metricMax[key]).toFixed(3)}" aria-hidden="true"></span>`
        : '';
    return `<td class="${cls.join(' ')}" data-label="${label}"><span class="num-val">${fmtNum(value)}</span>${bar}</td>`;
}

function displayPilotos() {
    const filtered = getFilteredPilotos();
    const isMobile = isMobileViewport();
    const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;

    const count = document.getElementById('resultsCount');
    const sortLabel = METRICS[currentSort.column]?.label || SORT_LABELS[currentSort.column] || currentSort.column;
    if (count) {
        count.innerHTML = `<strong>${fmtNum(filtered.length) || 0}</strong> ${filtered.length === 1 ? 'piloto' : 'pilotos'} · ordenado por <strong>${escapeHtml(sortLabel.toLowerCase())}</strong>`;
    }

    const tbody = document.getElementById('pilotosTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-row">Nenhum piloto encontrado. Tente outro nome ou limpe os filtros.</td></tr>';
        hideLoadMoreButton();
        return;
    }

    const totalItems = filtered.length;
    const visible = filtered.slice(0, Math.min(currentPage * itemsPerPage, totalItems));

    tbody.innerHTML = visible.map((p, i) => {
        const pos = i + 1;
        const key = fotoKey(p.piloto);
        const { first, last } = splitName(p.piloto);
        const tier = p.titulos > 0 ? 'tier-champ' : (p.vitorias > 0 ? 'tier-winner' : 'tier-driver');
        const posCls = pos <= 3 ? ` pos-top pos-${pos}` : '';
        const avatar = fotosDisponiveis.has(key)
            ? `<img src="assets/pilotos/${key}.png" class="piloto-avatar-mini" alt="" loading="lazy">`
            : `<span class="piloto-avatar-mini avatar-code" aria-hidden="true">${driverCode(p.piloto)}</span>`;
        const champ = p.titulos > 0
            ? `<span class="champ-flag" title="${p.titulos} título${p.titulos > 1 ? 's' : ''}">${p.titulos}×</span>`
            : '';
        const estreiaSorted = currentSort.column === 'estreia' ? ' is-sorted' : '';
        const ultimaSorted = currentSort.column === 'ultima' ? ' is-sorted' : '';
        const isActive = activeSeasonYear && seasonYear(p.ultima) === activeSeasonYear;

        return `
        <tr class="${tier}${posCls}" data-piloto="${escapeHtml(p.piloto)}">
            <td class="col-pos"><span class="pos-num">${pos}</span></td>
            <td class="col-name piloto-name-cell">
                <a class="driver-link" href="${detailUrl(p.piloto)}">
                    ${avatar}
                    <span class="piloto-name-text">${first ? `<span class="name-first">${escapeHtml(first)}</span> ` : ''}<span class="name-last">${escapeHtml(last)}</span></span>
                    ${champ}
                </a>
            </td>
            ${numCell(p, 'corridas', 'Corridas')}
            ${numCell(p, 'titulos', 'Títulos')}
            ${numCell(p, 'vitorias', 'Vitórias')}
            ${numCell(p, 'podios', 'Pódios')}
            ${numCell(p, 'poles', 'Poles')}
            ${numCell(p, 'fastLaps', 'V. rápidas')}
            ${numCell(p, 'hatTricks', 'Hat-tricks')}
            ${numCell(p, 'chelems', 'Chelems')}
            <td class="season${estreiaSorted}" data-label="Estreia">${escapeHtml(p.estreia)}</td>
            <td class="season${ultimaSorted}${isActive ? ' is-active' : ''}" data-label="Última">${escapeHtml(p.ultima)}</td>
        </tr>`;
    }).join('');

    // Linha inteira clicável (o link interno garante teclado, ctrl+clique e leitores de tela)
    tbody.querySelectorAll('tr[data-piloto]').forEach(tr => {
        tr.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            window.location.href = detailUrl(tr.dataset.piloto);
        });
    });

    if (isMobile && visible.length < totalItems) {
        showLoadMoreButton(visible.length, totalItems);
    } else {
        hideLoadMoreButton();
    }
}

// Gerenciar botão "Carregar Mais"
function showLoadMoreButton(shown, total) {
    let btn = document.getElementById('loadMoreBtn');
    if (!btn) {
        const container = document.querySelector('.table-container');
        btn = document.createElement('div');
        btn.id = 'loadMoreBtn';
        btn.className = 'load-more-container';
        btn.innerHTML = `
            <button type="button" class="load-more-btn">
                <span class="load-more-text">Carregar mais</span>
                <span class="load-more-count"></span>
            </button>
        `;
        container.after(btn);
        btn.querySelector('.load-more-btn').addEventListener('click', loadMore);
    }

    btn.style.display = 'block';
    btn.querySelector('.load-more-count').textContent = `Mostrando ${shown} de ${total} pilotos`;
}

function hideLoadMoreButton() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = 'none';
}

function loadMore() {
    const previous = document.querySelectorAll('#pilotosTableBody tr').length;
    currentPage++;
    displayPilotos();

    // Leva o foco/scroll para o primeiro item novo
    const rows = document.querySelectorAll('#pilotosTableBody tr');
    const firstNew = rows[previous];
    if (firstNew) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        firstNew.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        const link = firstNew.querySelector('a');
        if (link) link.focus({ preventScroll: true });
    }
}

function resetPagination() {
    currentPage = 1;
}

// ---------- ordenação ----------
function setupSortListeners() {
    document.querySelectorAll('#pilotosTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;

            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                // Texto começa A→Z / temporada mais antiga; números começam do maior
                currentSort.direction = (column === 'piloto' || column === 'estreia') ? 'asc' : 'desc';
            }

            if (METRICS[column] && podiumMetric !== column) {
                podiumMetric = column;
                renderPodium();
            }

            syncMobileSelect();
            resetPagination();
            updateSortUI();
            displayPilotos();
        });
    });

    updateSortUI();
}

function updateSortUI() {
    document.querySelectorAll('#pilotosTable th.sortable').forEach(th => {
        const active = th.dataset.sort === currentSort.column;
        th.classList.toggle('sorted', active);
        if (active) {
            th.setAttribute('aria-sort', currentSort.direction === 'asc' ? 'ascending' : 'descending');
        } else {
            th.removeAttribute('aria-sort');
        }
        const icon = th.querySelector('.sort-icon');
        if (icon) icon.textContent = active ? (currentSort.direction === 'asc' ? '▲' : '▼') : '';
    });
}

function syncMobileSelect() {
    const select = document.getElementById('mobileSortSelect');
    if (!select) return;
    const value = `${currentSort.column}-${currentSort.direction}`;
    const exists = [...select.options].some(o => o.value === value);
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = value;
        const label = METRICS[currentSort.column]?.label || SORT_LABELS[currentSort.column] || currentSort.column;
        opt.textContent = `${label} (${currentSort.direction === 'asc' ? 'crescente' : 'decrescente'})`;
        opt.dataset.dynamic = 'true';
        select.querySelectorAll('option[data-dynamic]').forEach(o => o.remove());
        select.appendChild(opt);
    }
    select.value = value;
}

// ---------- filtros ----------
function setupFilterListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            currentFilter = btn.dataset.filter;
            resetPagination();
            displayPilotos();
        });
    });
}

// ---------- busca + autocomplete ----------
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteResults = document.getElementById('autocompleteResults');
    let selectedIndex = -1;

    const closeAutocomplete = () => {
        autocompleteResults.classList.remove('show');
        searchInput.setAttribute('aria-expanded', 'false');
        searchInput.removeAttribute('aria-activedescendant');
        selectedIndex = -1;
    };

    const debouncedSearch = window.GripUtils.debounce(() => {
        resetPagination();
        displayPilotos();
    }, 200);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        selectedIndex = -1;
        debouncedSearch();

        if (searchTerm.length >= 2) {
            const matches = allPilotos
                .filter(p => p.piloto.toLowerCase().includes(searchTerm))
                .sort((a, b) => {
                    const aStarts = a.piloto.toLowerCase().startsWith(searchTerm);
                    const bStarts = b.piloto.toLowerCase().startsWith(searchTerm);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return b.corridas - a.corridas;
                })
                .slice(0, 8);

            if (matches.length > 0) {
                autocompleteResults.innerHTML = matches.map((p, index) => `
                    <div class="autocomplete-item" role="option" id="ac-opt-${index}" aria-selected="false" data-piloto="${escapeHtml(p.piloto)}" data-index="${index}">
                        <span class="autocomplete-code" aria-hidden="true">${driverCode(p.piloto)}</span>
                        <span class="autocomplete-name">${highlightMatch(p.piloto, searchTerm)}</span>
                        <span class="autocomplete-stats">${p.corridas} corridas${p.titulos > 0 ? ` · ${p.titulos} títulos` : ''}</span>
                    </div>
                `).join('');
                autocompleteResults.classList.add('show');
                searchInput.setAttribute('aria-expanded', 'true');
            } else {
                closeAutocomplete();
            }
        } else {
            closeAutocomplete();
        }
    });

    document.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            window.location.href = detailUrl(item.dataset.piloto);
        } else if (!e.target.closest('.search-box')) {
            closeAutocomplete();
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = autocompleteResults.querySelectorAll('.autocomplete-item');
        const isOpen = autocompleteResults.classList.contains('show');

        if (e.key === 'ArrowDown' && isOpen) {
            e.preventDefault();
            if (items.length > 0) {
                selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                updateSelectedItem(items, selectedIndex, searchInput);
            }
        } else if (e.key === 'ArrowUp' && isOpen) {
            e.preventDefault();
            if (items.length > 0) {
                selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                updateSelectedItem(items, selectedIndex, searchInput);
            }
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && items[selectedIndex]) {
                e.preventDefault();
                window.location.href = detailUrl(items[selectedIndex].dataset.piloto);
            }
        } else if (e.key === 'Escape') {
            closeAutocomplete();
        }
    });
}

function updateSelectedItem(items, index, input) {
    items.forEach((item, i) => {
        const on = i === index;
        item.classList.toggle('selected', on);
        item.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
            item.scrollIntoView({ block: 'nearest' });
            input.setAttribute('aria-activedescendant', item.id);
        }
    });
}

function highlightMatch(text, search) {
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return escapeHtml(text);

    const before = text.substring(0, index);
    const match = text.substring(index, index + search.length);
    const after = text.substring(index + search.length);

    return `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
}

// ---------- ordenação mobile ----------
function setupMobileSortListener() {
    const mobileSortSelect = document.getElementById('mobileSortSelect');
    if (!mobileSortSelect) return;
    mobileSortSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        const cut = value.lastIndexOf('-');
        const column = value.slice(0, cut);
        const direction = value.slice(cut + 1);
        currentSort = { column, direction };
        if (METRICS[column] && podiumMetric !== column) {
            podiumMetric = column;
            renderPodium();
        }
        resetPagination();
        updateSortUI();
        displayPilotos();
    });
}

// Listener para redimensionamento (mobile <-> desktop): só re-renderiza ao cruzar o breakpoint
function setupResizeListener() {
    let resizeTimer;
    let wasMobile = isMobileViewport();
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const nowMobile = isMobileViewport();
            if (nowMobile !== wasMobile) {
                wasMobile = nowMobile;
                resetPagination();
                displayPilotos();
            }
        }, 250);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPilotos();
    setupSortListeners();
    setupFilterListeners();
    setupSearchListener();
    setupMobileSortListener();
    setupMetricChips();
    setupResizeListener();
});
