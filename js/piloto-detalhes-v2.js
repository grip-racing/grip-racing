// Piloto detalhes v2 - Design limpo
const DATA_VERSION = '1.0.22'; // Incrementar quando atualizar os dados
const DATA_SOURCES = {
    pilotos: `data/data-pilotos.csv?v=${DATA_VERSION}`,
    participacoes: `data/data-participacoes.csv?v=${DATA_VERSION}`
};

// Cache de RegEx compiladas para melhor performance
const REGEX_CACHE = {
    digitsOnly: /\D/g,
    circuitSuffix: /\s+\d+$/,
    circuitRoman: /\s+[IVX]+$/,
    leadingDigits: /^\d+/
};

// Cache de elementos DOM
const DOM_CACHE = {};

// Cache de estatísticas globais (calculado uma vez)
const STATS_CACHE = {};

let pilotoData = null;
let participacoesData = [];
let allPilotosData = [];
let pilotoParticipacoes = []; // Cache das participações do piloto atual

// Track sort order for each stat type
const statSortOrder = {
    races: 'desc',
    wins: 'desc',
    podiums: 'desc',
    poles: 'desc',
    fastlaps: 'desc',
    hattricks: 'desc',
    chelems: 'desc'
};

// Toggle stat sort order and refresh modal
function toggleStatSort(type) {
    statSortOrder[type] = statSortOrder[type] === 'desc' ? 'asc' : 'desc';
    // Update modal content without closing it
    updateStatDetailModalContent(type);
}

// Update modal content without recreating it
function updateStatDetailModalContent(statType) {
    const modalExists = document.querySelector('.stat-detail-modal-overlay');
    if (!modalExists) return;
    
    // Regenerate items with new sort order
    let items = [];
    let icon = '';
    let title = '';
    
    switch(statType) {
        case 'races':
            title = 'Corridas';
            icon = '🏁';
            items = pilotoParticipacoes.map(p => ({
                title: `${normalizeCircuitNameV2(p['Pista'])}`,
                subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                badges: getBadgesForRace(p),
                clickable: true,
                data: p
            }));
            break;
            
        case 'wins':
            title = 'Vitórias';
            icon = '🥇';
            items = pilotoParticipacoes
                .filter(p => String(p['Final'] || '').trim() === '1' || String(p['Final'] || '').trim().toUpperCase() === 'P1')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'podiums':
            title = 'Pódios';
            icon = '�';
            items = pilotoParticipacoes
                .filter(p => {
                    const final = String(p['Final'] || '').trim();
                    const finalNum = parseInt(final.replace(/[^\d]/g, ''));
                    return finalNum >= 1 && finalNum <= 3;
                })
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'poles':
            title = 'Pole Positions';
            icon = '⚡';
            items = pilotoParticipacoes
                .filter(p => String(p['Pole'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'fastlaps':
            title = 'Voltas Rápidas';
            icon = '⏱️';
            items = pilotoParticipacoes
                .filter(p => String(p['Best Lap'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'hattricks':
            title = 'Hat-tricks';
            icon = '🎩';
            items = pilotoParticipacoes
                .filter(p => String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'chelems':
            title = 'Grand Chelems';
            icon = '👑';
            items = pilotoParticipacoes
                .filter(p => String(p['Chelem'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
    }
    
    // Apply sorting
    if (statSortOrder[statType] === 'desc') {
        items.reverse();
    }
    
    // Update sort button
    const sortIcon = statSortOrder[statType] === 'desc' ? '↓' : '↑';
    const sortLabel = statSortOrder[statType] === 'desc' ? 'Recente' : 'Antigo';
    
    // Update DOM elements
    const modalTitle = modalExists.querySelector('.stat-detail-modal-title');
    const sortContainer = modalExists.querySelector('.stat-sort-container-v2');
    const itemsList = modalExists.querySelector('.stat-detail-list');
    
    if (modalTitle) {
        modalTitle.innerHTML = `${icon} ${title} (${items.length})`;
    }
    
    if (sortContainer) {
        const sortBtn = sortContainer.querySelector('.stat-sort-btn-v2');
        if (sortBtn) {
            sortBtn.title = `Ordenar por ${sortLabel === 'Recente' ? 'mais antigo' : 'mais recente'}`;
            const sortIconEl = sortBtn.querySelector('.sort-icon-v2');
            const sortLabelEl = sortBtn.querySelector('.sort-label-v2');
            if (sortIconEl) sortIconEl.textContent = sortIcon;
            if (sortLabelEl) sortLabelEl.textContent = sortLabel;
        }
    }
    
    if (itemsList) {
        itemsList.innerHTML = items.map(item => `
            <div class="stat-detail-item ${item.clickable ? 'stat-detail-clickable' : ''}" ${item.clickable ? `onclick="closeStatDetailModal(); openCorridaModalV2(this.getAttribute('data-corrida'));" data-corrida='${JSON.stringify(item.data).replace(/'/g, "&apos;")}'` : ''}>
                <div class="stat-detail-item-content">
                    <div class="stat-detail-item-title">${item.title}</div>
                    <div class="stat-detail-item-subtitle">${item.subtitle}</div>
                </div>
                ${item.badges ? `<div class="stat-detail-item-badges">${item.badges}</div>` : ''}
            </div>
        `).join('');
    }
}

// Função para voltar para a página de origem
function goBack(event) {
    event.preventDefault();
    event.stopPropagation();
    if (window.history.length > 1 && document.referrer) {
        window.history.back();
    } else {
        window.location.href = 'pilotos.html';
    }
}

// Validar participação
function isValidParticipacao(p) {
    const piloto = String(p['Piloto'] || '').trim();
    const pista = String(p['Pista'] || '').trim();
    const final = String(p['Final'] || '').trim();
    return piloto !== '' || pista !== '' || final !== '';
}

// Get piloto name from URL
function getPilotoName() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('nome') || urlParams.get('piloto') || '';
}

// Load piloto data
async function loadPilotoData() {
    const pilotoNome = getPilotoName();
    if (!pilotoNome) {
        window.location.href = 'pilotos.html';
        return;
    }
    
    // Load data
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    allPilotosData = pilotos;
    
    pilotoData = pilotos.find(p => 
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    if (!pilotoData) {
        document.getElementById('pilotoNameV2').textContent = 'Piloto não encontrado';
        return;
    }
    
    participacoesData = await window.GripUtils.fetchData(DATA_SOURCES.participacoes);
    
    // Cache das participações do piloto (usado em várias funções)
    pilotoParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    // Display all
    displayPilotoInfo();
    displayHeroMedals();
    displayTitlesWithMedals(); // Add titles after medals
    displayStatsBar();
    displayAdvancedStats();
    displayRecordes();
    createYearlyChart();
    createRadarChartV2();
    displayTemporadas();
    displayCampeonatos();
    displayCircuitos();
    displayPrimeirosMarcos();
    initHistoryTabs();
    
    // Theme change listener
    window.addEventListener('themeChanged', function() {
        createYearlyChart();
    });
}

// Display piloto info
function displayPilotoInfo() {
    const nome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const estreia = pilotoData['Estreia'] || pilotoData['estreia'] || '-';
    const ultima = pilotoData['Ultima'] || pilotoData['Última'] || pilotoData['ultima'] || '-';
    
    document.getElementById('pilotoNameV2').textContent = nome;
    document.getElementById('pilotoSubtitleV2').textContent = `${estreia} - ${ultima}`;
    document.title = `${nome} - Grip Racing`;
}

// Display hero medals for top 3 global rankings
function displayHeroMedals() {
    const container = document.getElementById('heroMedals');
    if (!container) return;
    
    const medals = [];
    
    // Definir todos os stats para verificar
    const statsToCheck = [
        { key: 'Corridas', label: 'Corridas', aliases: ['corridas'] },
        { key: 'Títulos', label: 'Títulos', aliases: ['titulos'] },
        { key: 'Construtores', label: 'Títulos de Construtores', aliases: ['construtores'] },
        { key: 'Pódios', label: 'Pódios', aliases: ['Podios', 'podios'] },
        { key: 'P1', label: 'Vitórias', aliases: ['Vitórias', 'vitorias'] },
        { key: 'P2', label: 'Segundos Lugares', aliases: [] },
        { key: 'P3', label: 'Terceiros Lugares', aliases: [] },
        { key: 'Poles', label: 'Pole Positions', aliases: ['poles'] },
        { key: 'Fast Laps', label: 'Voltas Rápidas', aliases: ['fast_laps'] },
        { key: 'Top 10', label: 'Top 10', aliases: [] },
        { key: 'Abandonos', label: 'Abandonos', aliases: ['abandonos'] },
        { key: 'DQ', label: 'Desqualificações', aliases: ['dq'] }
    ];
    
    // Para cada stat, verificar se o piloto está no top 3
    statsToCheck.forEach(stat => {
        const value = getStatValue(pilotoData, stat.key, stat.aliases);
        if (value === 0) return;
        
        const ranking = getGlobalRanking(stat.key, stat.aliases, value);
        if (ranking <= 3) {
            medals.push({
                position: ranking,
                emoji: ranking === 1 ? '🥇' : ranking === 2 ? '🥈' : '🥉',
                label: stat.label,
                value: value
            });
        }
    });
    
    // Hat-tricks e Chelems a partir dos dados de participação (usando cache)
    if (pilotoParticipacoes.length > 0) {
        const hatTricks = pilotoParticipacoes.filter(p => 
            String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM'
        ).length;
        
        const chelems = pilotoParticipacoes.filter(p => 
            String(p['Chelem'] || '').trim().toUpperCase() === 'SIM'
        ).length;
        
        if (hatTricks > 0) {
            const ranking = getGlobalRankingFromParticipations('Hat-Trick', hatTricks);
            if (ranking <= 3) {
                medals.push({
                    position: ranking,
                    emoji: ranking === 1 ? '🥇' : ranking === 2 ? '🥈' : '🥉',
                    label: 'Hat-tricks',
                    value: hatTricks
                });
            }
        }
        
        if (chelems > 0) {
            const ranking = getGlobalRankingFromParticipations('Chelem', chelems);
            if (ranking <= 3) {
                medals.push({
                    position: ranking,
                    emoji: ranking === 1 ? '🥇' : ranking === 2 ? '🥈' : '🥉',
                    label: 'Chelems',
                    value: chelems
                });
            }
        }
    }
    
    // Ordenar medalhas por posição (1º, 2º, 3º)
    medals.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return b.value - a.value;
    });
    
    // Renderizar medalhas agrupadas
    if (medals.length > 0) {
        // Agrupar por tipo de medalha
        const grouped = {
            1: { emoji: '🥇', medals: [] },
            2: { emoji: '🥈', medals: [] },
            3: { emoji: '🥉', medals: [] }
        };
        
        medals.forEach(medal => {
            grouped[medal.position].medals.push(medal);
        });
        
        // Renderizar medalhas agrupadas
        container.innerHTML = Object.values(grouped)
            .filter(group => group.medals.length > 0)
            .map(group => {
                const tooltipText = group.medals.map(m => m.label).join('<br>');
                return `
                    <span class="hero-medal-group">
                        ${group.emoji} <span class="medal-count">×${group.medals.length}</span>
                        <span class="medal-tooltip">${tooltipText}</span>
                    </span>
                `;
            }).join('');
    } else {
        container.innerHTML = '';
    }
}

// Helper: get stat value from pilotoData
function getStatValue(piloto, key, aliases) {
    let value = piloto[key];
    if (value === undefined || value === null || value === '') {
        for (let alias of aliases) {
            value = piloto[alias];
            if (value !== undefined && value !== null && value !== '') break;
        }
    }
    return parseInt(value || 0);
}

// Helper: get global ranking for a stat
function getGlobalRanking(statKey, aliases, value) {
    if (value === 0) return 999;
    
    // Get all values for this stat (only pilots with value > 0)
    const allValues = allPilotosData
        .map(p => getStatValue(p, statKey, aliases))
        .filter(v => v > 0);
    
    // Count how many pilots have MORE than this value
    const pilotsAbove = allValues.filter(v => v > value).length;
    
    // Ranking is number of pilots above + 1
    return pilotsAbove + 1;
}

// Helper: get global ranking for combined stats (e.g., Títulos + Construtores)
function getGlobalRankingCombined(statKeys, aliasesArray, value) {
    if (value === 0) return 999;
    
    // Get all combined values (only pilots with value > 0)
    const allValues = allPilotosData
        .map(p => {
            let total = 0;
            statKeys.forEach((key, index) => {
                total += getStatValue(p, key, aliasesArray[index]);
            });
            return total;
        })
        .filter(v => v > 0);
    
    // Count how many pilots have MORE than this value
    const pilotsAbove = allValues.filter(v => v > value).length;
    
    // Ranking is number of pilots above + 1
    return pilotsAbove + 1;
}

// Helper: get global ranking from participations data
function getGlobalRankingFromParticipations(field, value) {
    if (value === 0) return 999;
    
    // Calculate for all pilots
    const pilotCounts = {};
    
    participacoesData.forEach(p => {
        if (!isValidParticipacao(p)) return;
        
        const pilotoNome = p['Piloto'] || p['piloto'] || '';
        if (!pilotoNome) return;
        
        const fieldValue = String(p[field] || '').trim().toUpperCase();
        if (fieldValue === 'SIM') {
            pilotCounts[pilotoNome] = (pilotCounts[pilotoNome] || 0) + 1;
        }
    });
    
    // Sort all values descending
    const allValues = Object.values(pilotCounts).sort((a, b) => b - a);
    
    // Count how many pilots have more (standard competition ranking)
    const pilotsAhead = allValues.filter(v => v > value).length;
    
    // Rank is number of pilots ahead + 1
    return pilotsAhead + 1;
}

// Display titles in medal style
function displayTitlesWithMedals() {
    const titulos = parseInt(pilotoData['Títulos'] || pilotoData['titulos'] || 0);
    const construtores = parseInt(pilotoData['Construtores'] || pilotoData['construtores'] || 0);
    
    const container = document.getElementById('heroMedals');
    let html = container.innerHTML; // Preserve existing medals
    
    // Add separator if there are medals already
    if (titulos > 0 || construtores > 0) {
        if (html.trim()) {
            html += '<div class="medals-separator"></div>';
        }
    }
    
    if (titulos > 0) {
        html += `
            <div class="hero-medal-group">
                <span class="medal-emoji">🏆</span>
                <span class="medal-count">×${titulos}</span>
                <div class="medal-tooltip">Campeão de Pilotos</div>
            </div>
        `;
    }
    
    if (construtores > 0) {
        html += `
            <div class="hero-medal-group">
                <span class="medal-emoji">👥</span>
                <span class="medal-count">×${construtores}</span>
                <div class="medal-tooltip">Campeão de Construtores</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Get top medals if piloto is in top 3 globally
function getTopMedalsForStat(statName, value) {
    if (value === 0) return '';
    
    // Ordenar todos os pilotos pelo stat
    const sorted = [...allPilotosData].map(p => {
        let val = 0;
        if (statName === 'Títulos') {
            val = parseInt(p['Títulos'] || p['titulos'] || 0);
        } else if (statName === 'Construtores') {
            val = parseInt(p['Construtores'] || p['construtores'] || 0);
        }
        return { nome: p['Piloto'] || p['piloto'], value: val };
    }).sort((a, b) => b.value - a.value);
    
    // Encontrar posição
    const posicao = sorted.findIndex(p => p.value === value);
    
    if (posicao === 0) return '<span class="medal">🥇</span>';
    if (posicao === 1) return '<span class="medal">🥈</span>';
    if (posicao === 2) return '<span class="medal">🥉</span>';
    
    return '';
}

// Display stats bar
function displayStatsBar() {
    // Pre-calcular totais em cache
    precalculateStatTotals();
    
    const corridas = parseInt(pilotoData['Corridas'] || pilotoData['corridas'] || 0);
    const titulos = parseInt(pilotoData['Títulos'] || pilotoData['titulos'] || 0);
    const construtores = parseInt(pilotoData['Construtores'] || pilotoData['construtores'] || 0);
    const totalTitulos = titulos + construtores;
    const podios = parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || pilotoData['podios'] || 0);
    const vitorias = parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || pilotoData['vitorias'] || 0);
    const poles = parseInt(pilotoData['Poles'] || pilotoData['poles'] || 0);
    const fastLaps = parseInt(pilotoData['Fast Laps'] || pilotoData['fast_laps'] || 0);
    
    // Usar cache de participações do piloto
    const hatTricks = pilotoParticipacoes.filter(p => String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM').length;
    const chelems = pilotoParticipacoes.filter(p => String(p['Chelem'] || '').trim().toUpperCase() === 'SIM').length;
    
    // Calcular rankings
    const rankingCorridas = getGlobalRanking('Corridas', ['corridas'], corridas);
    const rankingTitulos = totalTitulos > 0 ? getGlobalRankingCombined(['Títulos', 'Construtores'], [['titulos'], ['construtores']], totalTitulos) : 0;
    const rankingPodios = getGlobalRanking('Pódios', ['Podios', 'podios'], podios);
    const rankingVitorias = getGlobalRanking('P1', ['Vitórias', 'vitorias'], vitorias);
    const rankingPoles = getGlobalRanking('Poles', ['poles'], poles);
    const rankingFastLaps = getGlobalRanking('Fast Laps', ['fast_laps'], fastLaps);
    const rankingHatTricks = hatTricks > 0 ? getGlobalRankingFromParticipations('Hat-Trick', hatTricks) : 0;
    const rankingChelems = chelems > 0 ? getGlobalRankingFromParticipations('Chelem', chelems) : 0;
    
    // Calcular total de pilotos com hat-tricks e chelems
    const totalHatTricks = calculateTotalPilotsWithStat('Hat-Trick');
    const totalChelems = calculateTotalPilotsWithStat('Chelem');
    
    // Calcular total de pilotos com valores > 0 para cada estatística
    const totalComCorridas = calculateTotalPilotsWithStatValue('Corridas', ['corridas']);
    const totalComTitulos = calculateTotalPilotsWithCombinedStatValue(['Títulos', 'Construtores'], [['titulos'], ['construtores']]);
    const totalComPodios = calculateTotalPilotsWithStatValue('Pódios', ['Podios', 'podios']);
    const totalComVitorias = calculateTotalPilotsWithStatValue('P1', ['Vitórias', 'vitorias']);
    const totalComPoles = calculateTotalPilotsWithStatValue('Poles', ['poles']);
    const totalComFastLaps = calculateTotalPilotsWithStatValue('Fast Laps', ['fast_laps']);
    
    document.getElementById('statBarRaces').textContent = window.GripUtils.formatNumber(corridas);
    document.getElementById('statBarTitles').textContent = window.GripUtils.formatNumber(totalTitulos);
    document.getElementById('statBarPodiums').textContent = window.GripUtils.formatNumber(podios);
    document.getElementById('statBarWins').textContent = window.GripUtils.formatNumber(vitorias);
    document.getElementById('statBarPoles').textContent = window.GripUtils.formatNumber(poles);
    document.getElementById('statBarFastLaps').textContent = window.GripUtils.formatNumber(fastLaps);
    document.getElementById('statBarHatTricks').textContent = window.GripUtils.formatNumber(hatTricks);
    document.getElementById('statBarChelems').textContent = window.GripUtils.formatNumber(chelems);
    
    // Adicionar rankings e cliques
    addDetailedStatCard('statBarRaces', rankingCorridas, totalComCorridas, 'races', corridas);
    addDetailedStatCard('statBarTitles', rankingTitulos, totalComTitulos, 'titles', totalTitulos);
    addDetailedStatCard('statBarPodiums', rankingPodios, totalComPodios, 'podiums', podios);
    addDetailedStatCard('statBarWins', rankingVitorias, totalComVitorias, 'wins', vitorias);
    addDetailedStatCard('statBarPoles', rankingPoles, totalComPoles, 'poles', poles);
    addDetailedStatCard('statBarFastLaps', rankingFastLaps, totalComFastLaps, 'fastlaps', fastLaps);
    addDetailedStatCard('statBarHatTricks', rankingHatTricks, totalHatTricks, 'hattricks', hatTricks);
    addDetailedStatCard('statBarChelems', rankingChelems, totalChelems, 'chelems', chelems);
}

function addDetailedStatCard(elementId, ranking, total, statType, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const parent = element.closest('.stat-bar-content');
    if (!parent) return;
    
    // Remove ranking anterior se existir
    const existingRanking = parent.querySelector('.stat-ranking');
    if (existingRanking) existingRanking.remove();
    
    if (ranking > 0 && ranking <= total) {
        const rankingEl = document.createElement('div');
        rankingEl.className = 'stat-ranking';
        rankingEl.textContent = `#${ranking} de ${total}`;
        parent.appendChild(rankingEl);
    }
    
    // Tornar card clicável apenas se houver valor
    const card = element.closest('.stat-bar-item');
    if (card && value > 0) {
        card.style.cursor = 'pointer';
        card.onclick = () => showStatDetailModal(statType);
    } else if (card) {
        card.style.cursor = 'default';
        card.onclick = null;
    }
}

// Calculate total pilots with a specific stat from participations
function calculateTotalPilotsWithStat(field) {
    const pilotCounts = {};
    
    participacoesData.forEach(p => {
        if (!isValidParticipacao(p)) return;
        const pilotoNome = p['Piloto'] || p['piloto'] || '';
        if (!pilotoNome) return;
        
        const fieldValue = String(p[field] || '').trim().toUpperCase();
        if (fieldValue === 'SIM') {
            pilotCounts[pilotoNome] = (pilotCounts[pilotoNome] || 0) + 1;
        }
    });
    
    return Object.keys(pilotCounts).length;
}

// Calculate total pilots with a specific stat value > 0
function calculateTotalPilotsWithStatValue(statKey, aliases) {
    const cacheKey = `total_${statKey}_${aliases.join('_')}`;
    if (STATS_CACHE[cacheKey] !== undefined) {
        return STATS_CACHE[cacheKey];
    }
    const total = allPilotosData.filter(p => getStatValue(p, statKey, aliases) > 0).length;
    STATS_CACHE[cacheKey] = total;
    return total;
}

// Calculate total pilots with combined stat value > 0 (e.g., Títulos + Construtores)
function calculateTotalPilotsWithCombinedStatValue(statKeys, aliasesArray) {
    const cacheKey = `total_combined_${statKeys.join('_')}`;
    if (STATS_CACHE[cacheKey] !== undefined) {
        return STATS_CACHE[cacheKey];
    }
    const total = allPilotosData.filter(p => {
        let totalValue = 0;
        statKeys.forEach((key, index) => {
            totalValue += getStatValue(p, key, aliasesArray[index]);
        });
        return totalValue > 0;
    }).length;
    STATS_CACHE[cacheKey] = total;
    return total;
}

// Pre-calculate all stat totals in a single pass for better performance
function precalculateStatTotals() {
    if (STATS_CACHE.precalculated) return;
    
    // Calcular todos os totais de uma vez
    calculateTotalPilotsWithStatValue('Corridas', ['corridas']);
    calculateTotalPilotsWithCombinedStatValue(['Títulos', 'Construtores'], [['titulos'], ['construtores']]);
    calculateTotalPilotsWithStatValue('Pódios', ['Podios', 'podios']);
    calculateTotalPilotsWithStatValue('P1', ['Vitórias', 'vitorias']);
    calculateTotalPilotsWithStatValue('Poles', ['poles']);
    calculateTotalPilotsWithStatValue('Fast Laps', ['fast_laps']);
    
    STATS_CACHE.precalculated = true;
}

// Add Top 5 stat card (for Hat-tricks and Chelems)
function addTop5StatCard(elementId, ranking, total, statKey, label, icon, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const parent = element.closest('.stat-bar-content');
    if (!parent) return;
    
    // Remove ranking anterior se existir
    const existingRanking = parent.querySelector('.stat-ranking');
    if (existingRanking) existingRanking.remove();
    
    if (value > 0 && ranking > 0 && ranking <= total) {
        const rankingEl = document.createElement('div');
        rankingEl.className = 'stat-ranking';
        rankingEl.textContent = `#${ranking} de ${total}`;
        parent.appendChild(rankingEl);
    }
    
    // Tornar card clicável se houver valor
    const card = element.closest('.stat-bar-item');
    if (card && value > 0) {
        card.style.cursor = 'pointer';
        card.onclick = () => showTop5Modal(statKey, label, icon);
    }
}

// Função auxiliar para pegar top N incluindo empates na última posição
function getTopNWithTies(data, n = 5) {
    if (data.length <= n) return data;
    
    const result = data.slice(0, n);
    const lastValue = result[n - 1].valor;
    
    // Adicionar todos os empates com o último valor
    for (let i = n; i < data.length; i++) {
        if (data[i].valor === lastValue) {
            result.push(data[i]);
        } else {
            break;
        }
    }
    
    return result;
}

// Modal com Top 5
function showTop5Modal(statKey, label, icon, titleType = null, fromDetailModal = null) {
    let top5Data = [];
    
    // Se for títulos e tiver um tipo específico
    if (statKey === 'Títulos' && titleType) {
        const pilotTitles = {};
        
        if (titleType === 'individual') {
            // Títulos individuais da planilha de pilotos
            allPilotosData.forEach(p => {
                const nome = p['Piloto'] || p['piloto'];
                const titulos = getStatValue(p, 'Títulos', ['titulos']);
                if (titulos > 0) {
                    pilotTitles[nome] = titulos;
                }
            });
        } else if (titleType === 'construtores') {
            // Títulos de construtores da planilha de pilotos
            allPilotosData.forEach(p => {
                const nome = p['Piloto'] || p['piloto'];
                const construtores = getStatValue(p, 'Construtores', ['construtores']);
                if (construtores > 0) {
                    pilotTitles[nome] = construtores;
                }
            });
        } else if (titleType === 'geral') {
            // Títulos totais (individual + construtores) da planilha de pilotos
            allPilotosData.forEach(p => {
                const nome = p['Piloto'] || p['piloto'];
                const titulos = getStatValue(p, 'Títulos', ['titulos']);
                const construtores = getStatValue(p, 'Construtores', ['construtores']);
                const total = titulos + construtores;
                if (total > 0) {
                    pilotTitles[nome] = total;
                }
            });
        }
        
        const sortedData = Object.entries(pilotTitles)
            .map(([nome, valor]) => ({ nome, valor }))
            .sort((a, b) => b.valor - a.valor);
        top5Data = getTopNWithTies(sortedData, 5);
        
        // Atualizar label baseado no tipo
        if (titleType === 'individual') label = 'Títulos Individuais';
        if (titleType === 'construtores') label = 'Títulos de Construtores';
        if (titleType === 'geral') label = 'Títulos Totais';
    } else if (statKey === 'Hat-Trick' || statKey === 'Chelem') {
        // Calcular de participações
        const pilotCounts = {};
        
        participacoesData.forEach(p => {
            if (!isValidParticipacao(p)) return;
            const nome = p['Piloto'] || p['piloto'] || '';
            if (!nome) return;
            
            const fieldValue = String(p[statKey] || '').trim().toUpperCase();
            if (fieldValue === 'SIM') {
                pilotCounts[nome] = (pilotCounts[nome] || 0) + 1;
            }
        });
        
        const sortedData = Object.entries(pilotCounts)
            .map(([nome, valor]) => ({ nome, valor }))
            .sort((a, b) => b.valor - a.valor);
        top5Data = getTopNWithTies(sortedData, 5);
    } else {
        // Estatísticas regulares
        const statKeys = {
            'Corridas': ['Corridas', 'corridas'],
            'Títulos': ['Títulos', 'titulos'],
            'Pódios': ['Pódios', 'Podios', 'podios'],
            'P1': ['P1', 'Vitórias', 'vitorias'],
            'Poles': ['Poles', 'poles'],
            'Fast Laps': ['Fast Laps', 'fast_laps']
        };
        
        const keys = statKeys[statKey] || [statKey];
        
        const sortedData = allPilotosData
            .map(p => {
                let valor = 0;
                for (const key of keys) {
                    const v = p[key];
                    if (v !== undefined && v !== null && v !== '') {
                        valor = parseInt(v);
                        break;
                    }
                }
                return { nome: p['Piloto'] || p['piloto'], valor };
            })
            .filter(p => p.valor > 0)
            .sort((a, b) => b.valor - a.valor);
        top5Data = getTopNWithTies(sortedData, 5);
    }
    
    const currentPiloto = pilotoData['Piloto'] || pilotoData['piloto'];
    
    // Calcular posições com empates
    const positionsWithTies = [];
    let currentPosition = 1;
    for (let i = 0; i < top5Data.length; i++) {
        if (i > 0 && top5Data[i].valor !== top5Data[i - 1].valor) {
            currentPosition = i + 1;
        }
        positionsWithTies.push(currentPosition);
    }
    
    const modalHTML = `
        <div class="top5-modal-overlay" onclick="closeTop5Modal()">
            <div class="top5-modal" onclick="event.stopPropagation()">
                <button class="top5-modal-close" onclick="closeTop5Modal()">✕</button>
                <h2 class="top5-modal-title">${icon} Top 5 - ${label}</h2>
                ${fromDetailModal ? `<button class="top5-modal-back" onclick="closeTop5Modal(); showStatDetailModal('${fromDetailModal}');">← Voltar</button>` : ''}
                <div class="top5-list">
                    ${top5Data.map((item, index) => {
                        const isCurrentPiloto = item.nome === currentPiloto;
                        const pilotoUrl = `piloto-detalhes-v2.html?nome=${encodeURIComponent(item.nome)}`;
                        const position = positionsWithTies[index];
                        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
                        
                        return `
                            <div class="top5-item ${isCurrentPiloto ? 'top5-current' : ''}" ${!isCurrentPiloto ? `onclick="window.location.href='${pilotoUrl}'" style="cursor: pointer;"` : ''}>
                                <span class="top5-position">${medal || `#${position}`}</span>
                                <span class="top5-nome">${item.nome}</span>
                                <span class="top5-valor">${item.valor}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function closeTop5Modal() {
    const modal = document.querySelector('.top5-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Modal detalhado de estatística
function showStatDetailModal(statType) {
    // Usar cache de participações do piloto
    
    let title = '';
    let icon = '';
    let items = [];
    let top5Data = null; // Para mapear o statType ao top5
    
    switch(statType) {
        case 'titles':
            title = 'Títulos';
            icon = '🏆';
            top5Data = { statKey: 'Títulos', icon: '🏆', label: 'Títulos', multipleTitleButtons: true };
            // Agrupar por temporada com títulos
            const titulos = {};
            let totalTitulosPiloto = 0;
            let totalTitulosConstrutores = 0;
            
            pilotoParticipacoes.forEach(p => {
                const isPilotoCampeao = String(p['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM';
                const isConstrutores = ['SIM', 'TIME'].includes(String(p['Construtores'] || '').trim().toUpperCase());
                
                if (isPilotoCampeao || isConstrutores) {
                    const key = `${p['Liga']}|||${p['Temporada']}|||${p['Categoria']}`;
                    if (!titulos[key]) {
                        titulos[key] = {
                            liga: p['Liga'],
                            temporada: p['Temporada'],
                            categoria: p['Categoria'],
                            piloto: isPilotoCampeao,
                            construtores: isConstrutores
                        };
                    } else {
                        if (isPilotoCampeao) titulos[key].piloto = true;
                        if (isConstrutores) titulos[key].construtores = true;
                    }
                }
            });
            
            items = Object.values(titulos).map(t => {
                const badges = [];
                if (t.piloto) {
                    badges.push('🏆 Piloto');
                    totalTitulosPiloto++;
                }
                if (t.construtores) {
                    badges.push('👥 Construtores');
                    totalTitulosConstrutores++;
                }
                
                return {
                    title: `${formatLigaV2(t.liga)} ${t.temporada}`,
                    subtitle: t.categoria ? t.categoria : '',
                    badges: badges.join(' '),
                    clickable: false,
                    customCount: totalTitulosPiloto + totalTitulosConstrutores
                };
            });
            
            // Override items.length with actual title count
            if (items.length > 0) {
                items[0].totalCount = totalTitulosPiloto + totalTitulosConstrutores;
            }
            break;
            
        case 'wins':
            title = 'Vitórias';
            icon = '🥇';
            top5Data = { statKey: 'P1', icon: '🥇', label: 'Vitórias' };
            items = pilotoParticipacoes
                .filter(p => String(p['Final'] || '').trim() === '1')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'podiums':
            title = 'Pódios';
            icon = '🏅';
            top5Data = { statKey: 'Pódios', icon: '🏅', label: 'Pódios' };
            items = pilotoParticipacoes
                .filter(p => {
                    const final = String(p['Final'] || '').trim();
                    return final === '1' || final === '2' || final === '3';
                })
                .map(p => {
                    const final = String(p['Final'] || '').trim();
                    return {
                        title: `${normalizeCircuitNameV2(p['Pista'])} - ${formatPositionV2(final)}`,
                        subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                        badges: getBadgesForRace(p),
                        clickable: true,
                        data: p
                    };
                });
            break;
            
        case 'races':
            title = 'Corridas';
            icon = '🏁';
            top5Data = { statKey: 'Corridas', icon: '🏁', label: 'Corridas' };
            items = pilotoParticipacoes.map(p => {
                const final = String(p['Final'] || '').trim();
                return {
                    title: `${normalizeCircuitNameV2(p['Pista'])} - ${formatPositionV2(final)}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                };
            });
            break;
            
        case 'poles':
            title = 'Pole Positions';
            icon = '⚡';
            top5Data = { statKey: 'Poles', icon: '⚡', label: 'Pole Positions' };
            items = pilotoParticipacoes
                .filter(p => String(p['Pole'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'fastlaps':
            title = 'Voltas Rápidas';
            icon = '⏱️';
            top5Data = { statKey: 'Fast Laps', icon: '⏱️', label: 'Voltas Rápidas' };
            items = pilotoParticipacoes
                .filter(p => String(p['Best Lap'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'hattricks':
            title = 'Hat-tricks';
            icon = '🎩';
            top5Data = { statKey: 'Hat-Trick', icon: '🎩', label: 'Hat-tricks' };
            items = pilotoParticipacoes
                .filter(p => String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
            
        case 'chelems':
            title = 'Grand Chelems';
            icon = '👑';
            top5Data = { statKey: 'Chelem', icon: '👑', label: 'Grand Chelems' };
            items = pilotoParticipacoes
                .filter(p => String(p['Chelem'] || '').trim().toUpperCase() === 'SIM')
                .map(p => ({
                    title: `${normalizeCircuitNameV2(p['Pista'])}`,
                    subtitle: `${formatLigaV2(p['Liga'])} • ${p['Temporada']} • ${p['Ano']}`,
                    badges: getBadgesForRace(p),
                    clickable: true,
                    data: p
                }));
            break;
    }
    
    // Apply sorting (titles don't need sorting as they're grouped)
    if (statType !== 'titles' && statSortOrder[statType] === 'desc') {
        items.reverse();
    }
    
    // Prepare sort button
    const sortIcon = statSortOrder[statType] === 'desc' ? '↓' : '↑';
    const sortLabel = statSortOrder[statType] === 'desc' ? 'Recente' : 'Antigo';
    
    const modalHTML = `
        <div class="stat-detail-modal-overlay" onclick="closeStatDetailModal()">
            <div class="stat-detail-modal" onclick="event.stopPropagation()">
                <button class="stat-detail-modal-close" onclick="closeStatDetailModal()">✕</button>
                <h2 class="stat-detail-modal-title">${icon} ${title} (${items.length > 0 && items[0].totalCount ? items[0].totalCount : items.length})</h2>
                ${top5Data ? (
                    top5Data.multipleTitleButtons ? `
                    <div class="stat-detail-top5-buttons">
                        <button class="stat-detail-top5-btn stat-detail-top5-btn-small" onclick="closeStatDetailModal(); showTop5Modal('${top5Data.statKey}', '${top5Data.icon}', '${top5Data.label}', 'individual', 'titles');">🏆 Individual</button>
                        <button class="stat-detail-top5-btn stat-detail-top5-btn-small" onclick="closeStatDetailModal(); showTop5Modal('${top5Data.statKey}', '${top5Data.icon}', '${top5Data.label}', 'construtores', 'titles');">👥 Construtores</button>
                        <button class="stat-detail-top5-btn stat-detail-top5-btn-small" onclick="closeStatDetailModal(); showTop5Modal('${top5Data.statKey}', '${top5Data.icon}', '${top5Data.label}', 'geral', 'titles');">🌟 Geral</button>
                    </div>
                    ` : `<button class="stat-detail-top5-btn" onclick="closeStatDetailModal(); showTop5Modal('${top5Data.statKey}', '${top5Data.icon}', '${top5Data.label}', null, '${statType}');">🏆 Ver Top 5 Global</button>`
                ) : ''}
                ${statType !== 'titles' ? `
                <div class="stat-sort-container-v2">
                    <button class="stat-sort-btn-v2" onclick="event.stopPropagation(); toggleStatSort('${statType}')" title="Ordenar por ${sortLabel === 'Recente' ? 'mais antigo' : 'mais recente'}">
                        <span class="sort-icon-v2">${sortIcon}</span>
                        <span class="sort-label-v2">${sortLabel}</span>
                    </button>
                </div>
                ` : ''}
                <div class="stat-detail-list">
                    ${items.map(item => `
                        <div class="stat-detail-item ${item.clickable ? 'stat-detail-clickable' : ''}" ${item.clickable ? `onclick="closeStatDetailModal(); openCorridaModalV2(this.getAttribute('data-corrida'));" data-corrida='${JSON.stringify(item.data).replace(/'/g, "&apos;")}'` : ''}>
                            <div class="stat-detail-item-content">
                                <div class="stat-detail-item-title">${item.title}</div>
                                <div class="stat-detail-item-subtitle">${item.subtitle}</div>
                            </div>
                            ${item.badges ? `<div class="stat-detail-item-badges">${item.badges}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function closeStatDetailModal() {
    const modal = document.querySelector('.stat-detail-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

function getBadgesForRace(corrida) {
    const badges = [];
    
    const final = String(corrida['Final'] || '').trim();
    const finalNum = parseInt(final.replace(/[^\d]/g, '')) || 999;
    
    if (finalNum === 1) badges.push('🥇');
    else if (finalNum === 2) badges.push('🥈');
    else if (finalNum === 3) badges.push('🥉');
    
    if (String(corrida['Pole'] || '').trim().toUpperCase() === 'SIM') badges.push('🚩');
    if (String(corrida['Best Lap'] || '').trim().toUpperCase() === 'SIM') badges.push('⚡');
    if (String(corrida['Hat-Trick'] || '').trim().toUpperCase() === 'SIM') badges.push('🎩');
    if (String(corrida['Chelem'] || '').trim().toUpperCase() === 'SIM') badges.push('👑');
    
    return badges.join(' ');
}

// Display advanced stats
function displayAdvancedStats() {
    const corridas = parseInt(pilotoData['Corridas'] || 0);
    const podios = parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || 0);
    const vitorias = parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || 0);
    const top10 = parseInt(pilotoData['Top 10'] || 0);
    const abandonos = parseInt(pilotoData['Abandonos'] || 0);
    const dq = parseInt(pilotoData['DQ'] || 0);
    
    const taxaPodios = corridas > 0 ? ((podios / corridas) * 100).toFixed(1) + '%' : '-';
    const taxaVitorias = corridas > 0 ? ((vitorias / corridas) * 100).toFixed(1) + '%' : '-';
    const taxaTop10 = corridas > 0 ? ((top10 / corridas) * 100).toFixed(1) + '%' : '-';
    const taxaAbandono = corridas > 0 ? (((abandonos + dq) / corridas) * 100).toFixed(1) + '%' : '-';
    const etapasPorPodio = podios > 0 ? (corridas / podios).toFixed(2) : '-';
    const etapasPorVitoria = vitorias > 0 ? (corridas / vitorias).toFixed(2) : '-';
    
    document.getElementById('taxaPodiosV2').textContent = taxaPodios;
    document.getElementById('taxaVitoriasV2').textContent = taxaVitorias;
    document.getElementById('taxaTop10V2').textContent = taxaTop10;
    document.getElementById('etapasPorPodioV2').textContent = etapasPorPodio;
    document.getElementById('etapasPorVitoriaV2').textContent = etapasPorVitoria;
    document.getElementById('abandonosV2').textContent = taxaAbandono;
}

// Display recordes
function displayRecordes() {
    // Usar cache de participações do piloto
    
    if (pilotoParticipacoes.length === 0) {
        document.getElementById('recordesContainerV2').innerHTML = '<p class="loading-text">Sem dados</p>';
        return;
    }
    
    // Find best result (menor número = melhor)
    let melhorResultado = 999;
    pilotoParticipacoes.forEach(p => {
        const final = String(p['Final'] || '999').trim();
        // Extrair apenas o número
        const numero = parseInt(final.replace(/[^\d]/g, '')) || 999;
        if (numero < melhorResultado && numero > 0) {
            melhorResultado = numero;
        }
    });
    
    // Count consecutive podiums
    let maxPodiosConsecutivos = 0;
    let currentStreak = 0;
    pilotoParticipacoes.forEach(p => {
        const final = String(p['Final'] || '').trim();
        const numero = parseInt(final.replace(/[^\d]/g, '')) || 999;
        const isPodio = numero >= 1 && numero <= 3;
        
        if (isPodio) {
            currentStreak++;
            maxPodiosConsecutivos = Math.max(maxPodiosConsecutivos, currentStreak);
        } else {
            currentStreak = 0;
        }
    });
    
    // Count unique circuits with victories
    const vitoriasParticipacoes = pilotoParticipacoes.filter(p => {
        const final = String(p['Final'] || '').trim();
        const numero = parseInt(final.replace(/[^\d]/g, '')) || 999;
        return numero === 1;
    });
    
    const circuitosComVitoria = new Set(
        vitoriasParticipacoes.map(p => String(p['Pista'] || '').trim())
    ).size;
    
    // Count consecutive victories
    let maxVitoriasConsecutivas = 0;
    let currentWinStreak = 0;
    pilotoParticipacoes.forEach(p => {
        const final = String(p['Final'] || '').trim();
        const numero = parseInt(final.replace(/[^\d]/g, '')) || 999;
        
        if (numero === 1) {
            currentWinStreak++;
            maxVitoriasConsecutivas = Math.max(maxVitoriasConsecutivas, currentWinStreak);
        } else {
            currentWinStreak = 0;
        }
    });
    
    // Find circuit(s) with most victories
    const vitoriasPerCircuit = {};
    vitoriasParticipacoes.forEach(p => {
        const pista = String(p['Pista'] || '').trim();
        vitoriasPerCircuit[pista] = (vitoriasPerCircuit[pista] || 0) + 1;
    });
    
    let maxVitoriasCircuito = 0;
    Object.values(vitoriasPerCircuit).forEach(count => {
        if (count > maxVitoriasCircuito) {
            maxVitoriasCircuito = count;
        }
    });
    
    // Get all circuits with max victories
    const circuitosDominantes = Object.entries(vitoriasPerCircuit)
        .filter(([pista, count]) => count === maxVitoriasCircuito)
        .map(([pista]) => pista);
    
    let dominioText = '';
    // Só mostrar domínio se tiver pelo menos 3 vitórias no circuito
    if (maxVitoriasCircuito >= 3) {
        if (circuitosDominantes.length === 1) {
            dominioText = `${normalizeCircuitNameV2(circuitosDominantes[0])} • ${maxVitoriasCircuito} 🥇`;
        } else if (circuitosDominantes.length === 2) {
            dominioText = `${normalizeCircuitNameV2(circuitosDominantes[0])}, ${normalizeCircuitNameV2(circuitosDominantes[1])} • ${maxVitoriasCircuito} 🥇`;
        } else if (circuitosDominantes.length > 2) {
            const todosCircuitos = circuitosDominantes.map(p => normalizeCircuitNameV2(p)).join(', ');
            dominioText = `<span title="${todosCircuitos}">${circuitosDominantes.length} circuitos • ${maxVitoriasCircuito} 🥇</span>`;
        }
    }
    
    const html = `
        ${maxVitoriasConsecutivas === 0 && melhorResultado < 999 ? `
        <div class="recorde-v2-item">
            <span class="recorde-v2-label">🥇 Melhor Resultado</span>
            <span class="recorde-v2-value">${melhorResultado}º</span>
        </div>` : ''}
        ${maxPodiosConsecutivos > 0 ? `
        <div class="recorde-v2-item">
            <span class="recorde-v2-label">🏅 Pódios Consecutivos</span>
            <span class="recorde-v2-value">${maxPodiosConsecutivos}</span>
        </div>` : ''}
        ${maxVitoriasConsecutivas > 0 ? `
        <div class="recorde-v2-item">
            <span class="recorde-v2-label">🔥 Sequência de Vitórias</span>
            <span class="recorde-v2-value">${maxVitoriasConsecutivas}</span>
        </div>` : ''}
        ${circuitosComVitoria > 0 ? `
        <div class="recorde-v2-item">
            <span class="recorde-v2-label">🗺️ Circuitos Vencidos</span>
            <span class="recorde-v2-value">${circuitosComVitoria}</span>
        </div>` : ''}
        ${dominioText ? `
        <div class="recorde-v2-item">
            <span class="recorde-v2-label">🏁 Domínio</span>
            <span class="recorde-v2-value">${dominioText}</span>
        </div>` : ''}
    `;
    
    document.getElementById('recordesContainerV2').innerHTML = html;
}

// Create yearly performance chart
function createYearlyChart() {
    const canvas = document.getElementById('yearlyPerformanceChartV2');
    if (!canvas) return;
    
    // Destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    const ctx = canvas.getContext('2d');
    
    // Agrupar por ano - usa cache global
    const anoStats = {};
    pilotoParticipacoes.forEach(p => {
        const ano = p['Ano'] || 'Desconhecido';
        if (!anoStats[ano]) {
            anoStats[ano] = { corridas: 0, vitorias: 0, podios: 0, top10: 0 };
        }
        anoStats[ano].corridas++;
        const final = String(p['Final'] || '').trim();
        if (final === '1') {
            anoStats[ano].vitorias++;
        }
        const finalNum = parseInt(final.replace(/[^\d]/g, ''));
        if (finalNum >= 1 && finalNum <= 3) {
            anoStats[ano].podios++;
        }
        if (finalNum >= 1 && finalNum <= 10) {
            anoStats[ano].top10++;
        }
    });
    
    const anos = Object.keys(anoStats).sort();
    const corridasData = anos.map(ano => anoStats[ano].corridas);
    const vitoriasData = anos.map(ano => anoStats[ano].vitorias);
    const podiosData = anos.map(ano => anoStats[ano].podios);
    const top10Data = anos.map(ano => anoStats[ano].top10);
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: anos,
            datasets: [
                {
                    label: 'Corridas',
                    data: corridasData,
                    backgroundColor: 'rgba(255, 107, 0, 0.3)',
                    borderColor: '#ff6b00',
                    borderWidth: 2,
                    order: 1
                },
                {
                    label: 'Top 10',
                    data: top10Data,
                    backgroundColor: 'rgba(100, 200, 255, 0.4)',
                    borderColor: '#64c8ff',
                    borderWidth: 2,
                    order: 2
                },
                {
                    label: 'Pódios',
                    data: podiosData,
                    backgroundColor: 'rgba(255, 153, 0, 0.5)',
                    borderColor: '#ff9900',
                    borderWidth: 2,
                    order: 3
                },
                {
                    label: 'Vitórias',
                    data: vitoriasData,
                    backgroundColor: 'rgba(255, 215, 0, 0.8)',
                    borderColor: '#FFD700',
                    borderWidth: 2,
                    order: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        padding: 12,
                        font: {
                            size: 12,
                            family: "'Montserrat', sans-serif",
                            weight: 600
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#fff' : '#000',
                    bodyColor: isDark ? '#fff' : '#000',
                    borderColor: '#ff6b00',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: {
                            family: "'Montserrat', sans-serif"
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            family: "'Montserrat', sans-serif"
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// Display temporadas (expandable by year and season)
function displayTemporadas() {
    // Usar cache de participações do piloto
    const container = document.getElementById('temporadasContainerV2');
    if (pilotoParticipacoes.length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhuma participação encontrada</p>';
        return;
    }
    
    // Group by ano
    const anosMap = {};
    pilotoParticipacoes.forEach(p => {
        const ano = p['Ano'] || 'Desconhecido';
        if (!anosMap[ano]) anosMap[ano] = [];
        anosMap[ano].push(p);
    });
    
    const anos = Object.keys(anosMap).sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0));
    
    const html = anos.map((ano, anoIndex) => {
        const corridasDoAno = anosMap[ano];
        
        // Group by temporada
        const temporadasMap = {};
        corridasDoAno.forEach(p => {
            const temporada = p['Temporada'] || 'Desconhecida';
            if (!temporadasMap[temporada]) temporadasMap[temporada] = [];
            temporadasMap[temporada].push(p);
        });
        
        const temporadas = Object.keys(temporadasMap);
        const totalCorridas = corridasDoAno.length;
        const totalVitorias = corridasDoAno.filter(c => String(c['Final'] || '').trim() === '1').length;
        const totalPodios = corridasDoAno.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final === '2' || final === '3';
        }).length;
        const totalPoles = corridasDoAno.filter(c => String(c['Pole'] || '').trim().toUpperCase() === 'SIM').length;
        const totalFastLaps = corridasDoAno.filter(c => String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM').length;
        const totalTop10 = corridasDoAno.filter(c => {
            const final = String(c['Final'] || '').trim();
            const finalNum = parseInt(final.replace(/[^\d]/g, ''));
            return finalNum >= 1 && finalNum <= 10;
        }).length;
        
        const qtdCampeonatosPiloto = corridasDoAno.filter(c => String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM').length;
        const qtdCampeonatosConstrutores = corridasDoAno.filter(c => {
            const val = String(c['Construtores'] || '').trim().toUpperCase();
            return val === 'SIM' || val === 'TIME';
        }).length;
        
        return `
            <div class="ano-item-wrapper-v2">
                <div class="ano-item-v2" onclick="toggleAnoV2(this)">
                    <div class="ano-header-left-v2">
                        <span class="ano-nome-v2">${ano} ${'🏆'.repeat(qtdCampeonatosPiloto)}${'👥'.repeat(qtdCampeonatosConstrutores)}</span>
                        <span class="ano-info-v2">${temporadas.length} ${temporadas.length === 1 ? 'temporada' : 'temporadas'} • ${totalCorridas} ${totalCorridas === 1 ? 'corrida' : 'corridas'}</span>
                    </div>
                    <div class="ano-stats-mini-v2">
                        ${totalVitorias > 0 ? `<span>🥇 ${totalVitorias}</span>` : ''}
                        ${totalPodios > 0 ? `<span>🏅 ${totalPodios}</span>` : ''}
                        ${totalTop10 > 0 ? `<span>🔟 ${totalTop10}</span>` : ''}
                        ${totalPoles > 0 ? `<span>🚩 ${totalPoles}</span>` : ''}
                        ${totalFastLaps > 0 ? `<span>⚡ ${totalFastLaps}</span>` : ''}
                    </div>
                    <div class="ano-expand-v2">▼</div>
                </div>
                <div class="ano-temporadas-v2">
                    ${temporadas.map(temporada => {
                        const corridas = temporadasMap[temporada];
                        const vitorias = corridas.filter(c => String(c['Final'] || '').trim() === '1').length;
                        const podios = corridas.filter(c => {
                            const final = String(c['Final'] || '').trim();
                            return final === '1' || final === '2' || final === '3';
                        }).length;
                        const poles = corridas.filter(c => String(c['Pole'] || '').trim().toUpperCase() === 'SIM').length;
                        const fastLaps = corridas.filter(c => String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM').length;
                        const top10 = corridas.filter(c => {
                            const final = String(c['Final'] || '').trim();
                            const finalNum = parseInt(final.replace(/[^\d]/g, ''));
                            return finalNum >= 1 && finalNum <= 10;
                        }).length;
                        
                        const qtdCampeonatosPiloto = corridas.filter(c => String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM').length;
                        const qtdCampeonatosConstrutores = corridas.filter(c => {
                            const val = String(c['Construtores'] || '').trim().toUpperCase();
                            return val === 'SIM' || val === 'TIME';
                        }).length;
                        
                        const corridasHtml = corridas.map(c => {
                            const pista = normalizeCircuitNameV2(c['Pista'] || 'Desconhecida');
                            const final = c['Final'] || 'N/A';
                            const liga = c['Liga'] || 'N/A';
                            const categoria = c['Categoria'] || '';
                            const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
                            
                            const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
                            const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
                            const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                            const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta Rápida">⚡</span>' : '';
                            const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick">🎩</span>' : '';
                            const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem">👑</span>' : '';
                            const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campeão">🏆</span>' : '';
                            const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                            const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Construtores">👥</span>' : '';
                            
                            let resultClass = '';
                            if (finalNum === 1) resultClass = 'resultado-vitoria-v2';
                            else if (finalNum === 2) resultClass = 'resultado-segundo-v2';
                            else if (finalNum === 3) resultClass = 'resultado-podio-v2';
                            else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf-v2';
                            
                            return `
                                <div class="corrida-item-v2" onclick="openCorridaModalV2(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c).replace(/'/g, "&apos;")}'>
                                    <span class="corrida-resultado-v2 ${resultClass}">${formatPositionV2(final)}</span>
                                    <div class="corrida-principal-v2">
                                        <div class="corrida-pista-v2">${pista}</div>
                                        <div class="corrida-liga-categoria-v2">
                                            ${formatLigaV2(liga)}
                                            ${categoria ? `<span class="corrida-categoria-v2">${categoria}</span>` : ''}
                                        </div>
                                    </div>
                                    <span class="corrida-badges-v2">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}${campeonatoPiloto}${campeonatoConstrutores}</span>
                                </div>
                            `;
                        }).join('');
                        
                        return `
                            <div class="temporada-item-wrapper-v2">
                                <div class="temporada-item-v2" onclick="toggleTemporadaV2(this)">
                                    <div class="temporada-header-left-v2">
                                        <span class="temporada-nome-v2">${temporada} ${'🏆'.repeat(qtdCampeonatosPiloto)}${'👥'.repeat(qtdCampeonatosConstrutores)}</span>
                                        <span class="temporada-corridas-v2">${corridas.length} corridas</span>
                                    </div>
                                    <div class="temporada-stats-mini-v2">
                                        ${vitorias > 0 ? `<span>🥇 ${vitorias}</span>` : ''}
                                        ${podios > 0 ? `<span>🏅 ${podios}</span>` : ''}
                                        ${top10 > 0 ? `<span>🔟 ${top10}</span>` : ''}
                                        ${poles > 0 ? `<span>🚩 ${poles}</span>` : ''}
                                        ${fastLaps > 0 ? `<span>⚡ ${fastLaps}</span>` : ''}
                                    </div>
                                    <div class="temporada-toggle-v2">▼</div>
                                </div>
                                <div class="temporada-corridas-list-v2">
                                    ${corridasHtml}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Display campeonatos (leagues with championships)
function displayCampeonatos() {
    // Usar cache de participações do piloto
    const container = document.getElementById('campeonatosContainerV2');
    if (pilotoParticipacoes.length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum dado disponível</p>';
        return;
    }
    
    // Group by liga
    const ligasMap = {};
    pilotoParticipacoes.forEach(p => {
        const liga = p['Liga'] || 'Desconhecido';
        if (!ligasMap[liga]) {
            ligasMap[liga] = { corridas: [], campeonatos: new Set() };
        }
        ligasMap[liga].corridas.push(p);
        
        const key = `${p['Temporada']}|||${p['Categoria']}`;
        ligasMap[liga].campeonatos.add(key);
    });
    
    const ligas = Object.keys(ligasMap).map(liga => {
        const corridasDaLiga = ligasMap[liga].corridas;
        const vitorias = corridasDaLiga.filter(c => String(c['Final'] || '').trim() === '1').length;
        const podios = corridasDaLiga.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final === '2' || final === '3';
        }).length;
        const poles = corridasDaLiga.filter(c => String(c['Pole'] || '').trim().toUpperCase() === 'SIM').length;
        const fastLaps = corridasDaLiga.filter(c => String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM').length;
        const hatTricks = corridasDaLiga.filter(c => String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM').length;
        const chelems = corridasDaLiga.filter(c => String(c['Chelem'] || '').trim().toUpperCase() === 'SIM').length;
        
        const qtdCampeonatosPiloto = corridasDaLiga.filter(c => String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM').length;
        const qtdCampeonatosConstrutores = corridasDaLiga.filter(c => {
            const val = String(c['Construtores'] || '').trim().toUpperCase();
            return val === 'SIM' || val === 'TIME';
        }).length;
        
        return {
            nome: liga,
            total: ligasMap[liga].campeonatos.size,
            corridas: corridasDaLiga,
            vitorias,
            podios,
            poles,
            fastLaps,
            hatTricks,
            chelems,
            qtdCampeonatosPiloto,
            qtdCampeonatosConstrutores
        };
    }).sort((a, b) => b.total - a.total);
    
    const html = ligas.map((liga, index) => {
        const statsSummary = [];
        if (liga.vitorias > 0) statsSummary.push(`🥇 ${liga.vitorias}`);
        if (liga.hatTricks > 0) statsSummary.push(`🎩 ${liga.hatTricks}`);
        if (liga.chelems > 0) statsSummary.push(`👑 ${liga.chelems}`);
        if (liga.poles > 0) statsSummary.push(`🚩 ${liga.poles}`);
        if (liga.fastLaps > 0) statsSummary.push(`⚡ ${liga.fastLaps}`);
        if (liga.podios > 0) statsSummary.push(`🏅 ${liga.podios}`);
        
        // Agrupar corridas por temporada
        const temporadasMap = {};
        liga.corridas.forEach(c => {
            const key = `${c['Temporada']}|||${c['Categoria']}`;
            if (!temporadasMap[key]) {
                temporadasMap[key] = {
                    temporada: c['Temporada'],
                    categoria: c['Categoria'],
                    corridas: []
                };
            }
            temporadasMap[key].corridas.push(c);
        });
        
        const temporadas = Object.values(temporadasMap).sort((a, b) => {
            const anoA = parseInt(a.temporada.match(/\d{4}/) || '0');
            const anoB = parseInt(b.temporada.match(/\d{4}/) || '0');
            return anoB - anoA;
        });
        
        return `
            <div class="campeonato-item-wrapper-v2">
                <div class="campeonato-item-v2" onclick="toggleCampeonatoV2(this)">
                    <div class="campeonato-header-v2">
                        ${formatLigaV2(liga.nome)} ${'🏆'.repeat(liga.qtdCampeonatosPiloto)}${'👥'.repeat(liga.qtdCampeonatosConstrutores)}
                    </div>
                    <div class="campeonato-info-v2">
                        ${liga.total} ${liga.total === 1 ? 'campeonato' : 'campeonatos'}
                        ${statsSummary.length > 0 ? ' • ' + statsSummary.join(' ') : ''}
                    </div>
                    <div class="campeonato-expand-v2">▼</div>
                </div>
                <div class="campeonato-detail-v2">
                    ${temporadas.map(temp => {
                        const tempStats = [];
                        const vit = temp.corridas.filter(c => String(c['Final'] || '').trim() === '1').length;
                        const pod = temp.corridas.filter(c => {
                            const f = String(c['Final'] || '').trim();
                            return f === '1' || f === '2' || f === '3';
                        }).length;
                        if (vit > 0) tempStats.push(`🥇 ${vit}`);
                        if (pod > 0) tempStats.push(`🏅 ${pod}`);
                        
                        return `
                            <div class="campeonato-temporada-wrapper-v2">
                                <div class="campeonato-temporada-v2" onclick="toggleCampeonatoTemporadaV2(this)">
                                    <div class="campeonato-temporada-nome-v2">
                                        ${temp.temporada} ${temp.categoria ? '• ' + temp.categoria : ''}
                                    </div>
                                    <div class="campeonato-temporada-stats-v2">
                                        ${temp.corridas.length} corridas${tempStats.length > 0 ? ' • ' + tempStats.join(' ') : ''}
                                    </div>
                                    <div class="campeonato-temporada-expand-v2">▼</div>
                                </div>
                                <div class="campeonato-temporada-corridas-v2">
                                    ${temp.corridas.map(c => {
                                        const pista = c['Pista'] || 'N/A';
                                        const final = String(c['Final'] || '-').trim();
                                        const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM';
                                        const fastLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM';
                                        const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM';
                                        const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM';
                                        
                                        const badges = [];
                                        if (final === '1') badges.push('🥇');
                                        else if (final === '2') badges.push('🥈');
                                        else if (final === '3') badges.push('🥉');
                                        if (pole) badges.push('🚩');
                                        if (fastLap) badges.push('⚡');
                                        if (hatTrick) badges.push('🎩');
                                        if (chelem) badges.push('👑');
                                        
                                        return `
                                            <div class="corrida-campeonato-item-v2" onclick="openCorridaModalV2(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c).replace(/'/g, "&apos;")}'>
                                                <div class="corrida-campeonato-pista-v2">${pista}</div>
                                                <div class="corrida-campeonato-resultado-v2">
                                                    <span class="corrida-campeonato-posicao-v2">P${final}</span>
                                                    ${badges.length > 0 ? '<span class="corrida-campeonato-badges-v2">' + badges.join(' ') + '</span>' : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Display circuitos (tracks with stats)
function displayCircuitos() {
    // Usar cache de participações do piloto
    const container = document.getElementById('circuitosContainerV2');
    if (pilotoParticipacoes.length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum dado disponível</p>';
        return;
    }
    
    // Group by track
    const circuitosMap = {};
    pilotoParticipacoes.forEach(p => {
        const pista = normalizeCircuitNameV2(p['Pista'] || 'Desconhecido');
        if (!circuitosMap[pista]) {
            circuitosMap[pista] = {
                nome: pista,
                corridas: [],
                total: 0,
                vitorias: 0,
                podios: 0,
                poles: 0,
                fastLaps: 0,
                hatTricks: 0,
                chelems: 0,
                melhorPosicao: 999
            };
        }
        
        circuitosMap[pista].corridas.push(p);
        circuitosMap[pista].total++;
        
        const final = String(p['Final'] || '').trim();
        const posicao = parseInt(final.replace(/[^\d]/g, '')) || 999;
        
        if (posicao === 1) circuitosMap[pista].vitorias++;
        if (posicao <= 3 && posicao > 0) circuitosMap[pista].podios++;
        if (String(p['Pole'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].poles++;
        if (String(p['Best Lap'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].fastLaps++;
        if (String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].hatTricks++;
        if (String(p['Chelem'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].chelems++;
        
        if (posicao < circuitosMap[pista].melhorPosicao) {
            circuitosMap[pista].melhorPosicao = posicao;
            circuitosMap[pista].melhorResultado = final;
        }
    });
    
    const circuitos = Object.values(circuitosMap).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    
    const html = circuitos.map((circ, index) => {
        const statsSummary = [];
        if (circ.vitorias > 0) statsSummary.push(`🥇 ${circ.vitorias}`);
        if (circ.podios > 0) statsSummary.push(`🏅 ${circ.podios}`);
        if (circ.poles > 0) statsSummary.push(`🚩 ${circ.poles}`);
        if (circ.fastLaps > 0) statsSummary.push(`⚡ ${circ.fastLaps}`);
        if (circ.hatTricks > 0) statsSummary.push(`🎩 ${circ.hatTricks}`);
        if (circ.chelems > 0) statsSummary.push(`👑 ${circ.chelems}`);
        
        let melhorTag = '';
        if (circ.melhorResultado) {
            const pos = circ.melhorPosicao;
            let classe = '';
            if (pos === 1) classe = 'resultado-vitoria-v2';
            else if (pos === 2) classe = 'resultado-segundo-v2';
            else if (pos === 3) classe = 'resultado-podio-v2';
            melhorTag = `<span class="circuito-melhor-v2 ${classe}">Melhor: ${formatPositionV2(circ.melhorResultado)}</span>`;
        }
        
        // Corridas individuais
        const corridasHtml = circ.corridas.map(c => {
            const final = String(c['Final'] || '').trim();
            const temporada = String(c['Temporada'] || '').trim();
            const liga = String(c['Liga'] || '').trim();
            const categoria = String(c['Categoria'] || '').trim();
            const ano = String(c['Ano'] || '').trim();
            
            const finalNum = parseInt(final.replace(/[^\d]/g, '')) || 999;
            const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
            const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
            const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole">🚩</span>' : '';
            const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta Rápida">⚡</span>' : '';
            const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick">🎩</span>' : '';
            const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem">👑</span>' : '';
            
            let resultClass = '';
            if (finalNum === 1) resultClass = 'resultado-vitoria';
            else if (finalNum === 2) resultClass = 'resultado-segundo';
            else if (finalNum === 3) resultClass = 'resultado-podio';
            
            return `
                <div class="circuito-corrida-item-v2" onclick="openCorridaModalV2(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c).replace(/'/g, "&apos;")}'>
                    <span class="circuito-corrida-resultado-v2 ${resultClass}">${formatPositionV2(final)}</span>
                    <div class="circuito-corrida-info-v2">
                        <div>${formatLigaV2(liga)} ${categoria ? categoria : ''}</div>
                        <div class="circuito-corrida-meta-v2">${temporada} • ${ano}</div>
                    </div>
                    <div class="circuito-corrida-badges-v2">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="circuito-item-wrapper-v2">
                <div class="circuito-item-v2" onclick="toggleCircuitoV2(this)">
                    <div class="circuito-nome-v2">${circ.nome}</div>
                    <div class="circuito-info-v2">
                        ${circ.total} ${circ.total === 1 ? 'corrida' : 'corridas'}
                        ${statsSummary.length > 0 ? ' • ' + statsSummary.join(' ') : ''}
                        ${melhorTag ? ' • ' + melhorTag : ''}
                    </div>
                    <div class="circuito-expand-v2">▼</div>
                </div>
                <div class="circuito-detail-v2">
                    ${corridasHtml}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Display primeiros marcos
function displayPrimeirosMarcos() {
    const container = document.getElementById('marcosContainerV2');
    if (pilotoParticipacoes.length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum dado disponível</p>';
        return;
    }
    
    // Ordenar participações cronologicamente (ano, temporada, data)
    const participacoesOrdenadas = [...pilotoParticipacoes].sort((a, b) => {
        const anoA = parseInt(a['Ano']) || 0;
        const anoB = parseInt(b['Ano']) || 0;
        if (anoA !== anoB) return anoA - anoB;
        
        const tempA = a['Temporada'] || '';
        const tempB = b['Temporada'] || '';
        return tempA.localeCompare(tempB);
    });
    
    // Encontrar marcos
    const marcos = {};
    
    // Primeira corrida
    if (participacoesOrdenadas.length > 0) {
        marcos.primeiraCorrida = participacoesOrdenadas[0];
    }
    
    // Primeira vitória
    marcos.primeiraVitoria = participacoesOrdenadas.find(p => String(p['Final'] || '').trim() === '1');
    
    // Primeiro pódio
    marcos.primeiroPodio = participacoesOrdenadas.find(p => {
        const final = String(p['Final'] || '').trim();
        return final === '1' || final === '2' || final === '3';
    });
    
    // Primeira pole
    marcos.primeiraPole = participacoesOrdenadas.find(p => String(p['Pole'] || '').trim().toUpperCase() === 'SIM');
    
    // Primeira fast lap
    marcos.primeiraFastLap = participacoesOrdenadas.find(p => String(p['Best Lap'] || '').trim().toUpperCase() === 'SIM');
    
    // Primeiro hat-trick
    marcos.primeiroHatTrick = participacoesOrdenadas.find(p => String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM');
    
    // Primeiro chelem
    marcos.primeiroChelem = participacoesOrdenadas.find(p => String(p['Chelem'] || '').trim().toUpperCase() === 'SIM');
    
    // Primeiro título individual
    marcos.primeiroTituloIndividual = participacoesOrdenadas.find(p => String(p['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM');
    
    // Primeiro título de equipes/construtores
    marcos.primeiroTituloEquipes = participacoesOrdenadas.find(p => {
        const val = String(p['Construtores'] || '').trim().toUpperCase();
        return val === 'SIM' || val === 'TIME';
    });
    
    // Renderizar marcos
    const marcosConfig = [
        { key: 'primeiraCorrida', icon: '🏁', title: 'Primeira Corrida', color: '#666' },
        { key: 'primeiroPodio', icon: '🏅', title: 'Primeiro Pódio', color: '#cd7f32' },
        { key: 'primeiraVitoria', icon: '🥇', title: 'Primeira Vitória', color: '#ffd700' },
        { key: 'primeiraPole', icon: '🚩', title: 'Primeira Pole Position', color: '#ff6b00' },
        { key: 'primeiraFastLap', icon: '⚡', title: 'Primeira Volta Mais Rápida', color: '#9d4edd' },
        { key: 'primeiroHatTrick', icon: '🎩', title: 'Primeiro Hat-Trick', color: '#e63946' },
        { key: 'primeiroChelem', icon: '👑', title: 'Primeiro Chelem', color: '#f77f00' },
        { key: 'primeiroTituloIndividual', icon: '🏆', title: 'Primeiro Título Individual', color: '#06ffa5' },
        { key: 'primeiroTituloEquipes', icon: '👥', title: 'Primeiro Título de Equipes', color: '#4cc9f0' }
    ];
    
    // Filtrar apenas marcos alcançados
    const marcosAlcancados = marcosConfig.filter(config => marcos[config.key]);
    
    if (marcosAlcancados.length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum marco alcançado ainda</p>';
        return;
    }
    
    const html = marcosAlcancados.map(config => {
        const marco = marcos[config.key];
        const pista = marco['Pista'] || 'N/A';
        const liga = formatLigaV2(marco['Liga'] || '');
        const temporada = marco['Temporada'] || '';
        const ano = marco['Ano'] || '';
        const categoria = marco['Categoria'] || '';
        const final = String(marco['Final'] || '-').trim();
        
        // Formatar posição (adicionar P apenas para números)
        const isNumeric = /^\d+$/.test(final);
        const resultadoFormatado = final !== '-' ? (isNumeric ? `P${final}` : final) : '';
        
        return `
            <div class="marco-item-v2" onclick="openCorridaModalV2(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(marco).replace(/'/g, "&apos;")}'>
                <div class="marco-icon-v2" style="color: ${config.color};">${config.icon}</div>
                <div class="marco-content-v2">
                    <div class="marco-title-v2">${config.title}</div>
                    <div class="marco-info-v2">
                        <strong>${pista}</strong>
                        ${resultadoFormatado ? `<span class="marco-resultado-v2">${resultadoFormatado}</span>` : ''}
                    </div>
                    <div class="marco-meta-v2">
                        ${liga} ${categoria ? '• ' + categoria : ''} • ${temporada} • ${ano}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="marcos-grid-v2">${html}</div>`;
}

// Helper functions

// Get cached DOM element
function getCachedElement(id) {
    if (!DOM_CACHE[id]) {
        DOM_CACHE[id] = document.getElementById(id);
    }
    return DOM_CACHE[id];
}

// Check if mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Normalize circuit name (remove suffixes like " 2", " 3", etc)
function normalizeCircuitNameV2(circuitName) {
    if (!circuitName) return circuitName;
    // Remove sufixos como " 2", " 3", " II", " III", etc
    return circuitName.replace(REGEX_CACHE.circuitSuffix, '').replace(REGEX_CACHE.circuitRoman, '').trim();
}

// Format liga with logo or text
function formatLigaV2(ligaNome) {
    if (!ligaNome) return '';
    const ligaNormalizada = ligaNome.toLowerCase().replace(/\s+/g, '');
    const logoPath = `assets/ligas/${ligaNormalizada}.png`;
    return `<img src="${logoPath}" alt="${ligaNome}" title="${ligaNome}" class="liga-logo-v2" onerror="this.style.display='none';this.outerHTML='<span class=\\'liga-text-v2\\'>${ligaNome}</span>';">`;
}

// Format position with ordinal
function formatPositionV2(pos) {
    if (!pos || pos === '-' || pos === 'N/A') return pos;
    const posStr = String(pos).trim();
    if (posStr.toUpperCase().includes('DNF') || posStr.toUpperCase().includes('DQ') || posStr.toUpperCase().includes('ABANDON')) return posStr;
    const num = parseInt(posStr.replace(REGEX_CACHE.digitsOnly, ''));
    if (isNaN(num)) return posStr;
    return num + 'º';
}

// Get badge class for position
function getBadgeClassV2(pos) {
    if (!pos) return '';
    const posStr = String(pos).trim();
    const num = parseInt(posStr.replace(REGEX_CACHE.digitsOnly, ''));
    if (num === 1) return 'badge-1';
    if (num === 2) return 'badge-2';
    if (num === 3) return 'badge-3';
    return '';
}

// Check if transmission link is valid
function isValidTransmissionLink(link) {
    if (!link || link.trim() === '' || link === '#N/A' || link === 'N/A' || link === '-') return false;
    const trimmed = link.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

// Parse multiple transmission links separated by ||
function parseTransmissionLinks(transmissionField) {
    if (!transmissionField || transmissionField.trim() === '') return [];
    return transmissionField.split('||')
        .map(link => link.trim())
        .filter(link => isValidTransmissionLink(link));
}

// Toggle functions
function toggleAnoV2(element) {
    const wrapper = element.closest('.ano-item-wrapper-v2');
    const temporadas = wrapper.querySelector('.ano-temporadas-v2');
    const expand = element.querySelector('.ano-expand-v2');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        temporadas.style.maxHeight = (temporadas.scrollHeight + 100) + 'px';
    } else {
        expand.style.transform = 'rotate(0deg)';
        temporadas.style.maxHeight = '0';
    }
    
    // Atualizar altura do tab panel pai
    updateParentHeights(wrapper);
}

function toggleTemporadaV2(element) {
    const wrapper = element.closest('.temporada-item-wrapper-v2');
    const corridasList = wrapper.querySelector('.temporada-corridas-list-v2');
    const toggle = element.querySelector('.temporada-toggle-v2');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        corridasList.style.maxHeight = (corridasList.scrollHeight + 100) + 'px';
        toggle.style.transform = 'rotate(180deg)';
        
        setTimeout(() => {
            const parentTemporadas = wrapper.closest('.ano-temporadas-v2');
            if (parentTemporadas) {
                parentTemporadas.style.maxHeight = (parentTemporadas.scrollHeight + 100) + 'px';
            }
            updateParentHeights(wrapper);
        }, 50);
    } else {
        corridasList.style.maxHeight = '0';
        toggle.style.transform = 'rotate(0deg)';
        
        setTimeout(() => {
            const parentTemporadas = wrapper.closest('.ano-temporadas-v2');
            if (parentTemporadas) {
                parentTemporadas.style.maxHeight = parentTemporadas.scrollHeight + 'px';
            }
            updateParentHeights(wrapper);
        }, 450);
    }
}

// Helper function to update all parent container heights
function updateParentHeights(element) {
    const updateHeights = () => {
        // Add buffer to ensure full content is visible
        const buffer = 50;
        
        // Update campeonato-detail-v2 if exists
        const campeonatoDetail = element.closest('.campeonato-detail-v2');
        if (campeonatoDetail && campeonatoDetail.style.maxHeight !== '0px') {
            campeonatoDetail.style.maxHeight = (campeonatoDetail.scrollHeight + buffer) + 'px';
        }
        
        // Update ano-temporadas-v2 if exists
        const anoTemporadas = element.closest('.ano-temporadas-v2');
        if (anoTemporadas && anoTemporadas.style.maxHeight !== '0px') {
            anoTemporadas.style.maxHeight = (anoTemporadas.scrollHeight + buffer) + 'px';
        }
        
        // Update circuito-detail-v2 if exists
        const circuitoDetail = element.closest('.circuito-detail-v2');
        if (circuitoDetail && circuitoDetail.style.maxHeight !== '0px') {
            circuitoDetail.style.maxHeight = (circuitoDetail.scrollHeight + buffer) + 'px';
        }
    };
    
    // Update multiple times to ensure all parent containers adjust
    setTimeout(updateHeights, 50);
    setTimeout(updateHeights, 150);
    setTimeout(updateHeights, 300);
    setTimeout(updateHeights, 500);
}

function toggleCampeonatoV2(element) {
    const wrapper = element.closest('.campeonato-item-wrapper-v2');
    const detail = wrapper.querySelector('.campeonato-detail-v2');
    const expand = element.querySelector('.campeonato-expand-v2');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        detail.style.maxHeight = (detail.scrollHeight + 100) + 'px';
    } else {
        expand.style.transform = 'rotate(0deg)';
        detail.style.maxHeight = '0';
    }
    
    // Atualizar altura do tab panel pai
    updateParentHeights(wrapper);
}

function toggleCircuitoV2(element) {
    const wrapper = element.closest('.circuito-item-wrapper-v2');
    const detail = wrapper.querySelector('.circuito-detail-v2');
    const expand = element.querySelector('.circuito-expand-v2');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        detail.style.maxHeight = (detail.scrollHeight + 100) + 'px';
    } else {
        expand.style.transform = 'rotate(0deg)';
        detail.style.maxHeight = '0';
    }
    
    // Atualizar altura do tab panel pai
    updateParentHeights(wrapper);
}

function toggleCampeonatoTemporadaV2(element) {
    const wrapper = element.closest('.campeonato-temporada-wrapper-v2');
    const corridas = wrapper.querySelector('.campeonato-temporada-corridas-v2');
    const expand = element.querySelector('.campeonato-temporada-expand-v2');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        corridas.style.maxHeight = (corridas.scrollHeight + 100) + 'px';
        
        // Atualizar altura do pai
        setTimeout(() => {
            const parentDetail = wrapper.closest('.campeonato-detail-v2');
            if (parentDetail) {
                parentDetail.style.maxHeight = (parentDetail.scrollHeight + 100) + 'px';
            }
            updateParentHeights(wrapper);
        }, 50);
    } else {
        expand.style.transform = 'rotate(0deg)';
        corridas.style.maxHeight = '0';
        
        setTimeout(() => {
            const parentDetail = wrapper.closest('.campeonato-detail-v2');
            if (parentDetail) {
                parentDetail.style.maxHeight = parentDetail.scrollHeight + 'px';
            }
            updateParentHeights(wrapper);
        }, 450);
    }
}

// Modal de corrida
function openCorridaModalV2(corridaJson) {
    const corrida = JSON.parse(corridaJson);
    
    const pista = corrida['Pista'] || 'N/A';
    const liga = corrida['Liga'] || 'N/A';
    const temporada = corrida['Temporada'] || 'N/A';
    const categoria = corrida['Categoria'] || '';
    const ano = corrida['Ano'] || 'N/A';
    const transmissao = corrida['Link Transmissao'] || '';
    
    const transmissionLinks = parseTransmissionLinksV2(transmissao);
    const hasTransmission = transmissionLinks.length > 0;
    
    const corridasNaEtapa = participacoesData.filter(p => {
        return isValidParticipacao(p) &&
               String(p['Liga'] || '').trim() === liga &&
               String(p['Temporada'] || '').trim() === temporada &&
               String(p['Categoria'] || '').trim() === categoria &&
               String(p['Pista'] || '').trim() === pista;
    });
    
    const pilotosMap = new Map();
    corridasNaEtapa.forEach(p => {
        const nome = String(p['Piloto'] || '').trim();
        const final = String(p['Final'] || '').trim();
        const equipe = String(p['Equipe'] || '').trim();
        const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
        
        if (pilotosMap.has(nome)) {
            const existing = pilotosMap.get(nome);
            if (finalNum >= existing.finalNum) return;
        }
        
        const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
        const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
        const pole = String(p['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
        const bestLap = String(p['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta Rápida">⚡</span>' : '';
        const hatTrick = String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick">🎩</span>' : '';
        const chelem = String(p['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem">👑</span>' : '';
        
        let resultClass = '';
        if (finalNum === 1) resultClass = 'resultado-vitoria';
        else if (finalNum === 2) resultClass = 'resultado-segundo';
        else if (finalNum === 3) resultClass = 'resultado-podio';
        
        pilotosMap.set(nome, { nome, final, equipe, finalNum, resultClass, badges: vitoria + podio + pole + bestLap + hatTrick + chelem });
    });
    
    const outrosGripados = Array.from(pilotosMap.values()).sort((a, b) => a.finalNum - b.finalNum);
    
    let videoContent = '';
    if (hasTransmission) {
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
        
        const embedUrls = transmissionLinks.map(convertToEmbed);
        
        if (embedUrls.length === 1) {
            videoContent = `
                <div class="corrida-modal-video-container">
                    <iframe src="${embedUrls[0]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="corrida-video-iframe"></iframe>
                </div>
            `;
        } else {
            const carouselId = 'modal-video-carousel';
            videoContent = `
                <div class="corrida-modal-video-carousel" id="${carouselId}">
                    <div class="corrida-modal-video-container">
                        <iframe src="${embedUrls[0]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="corrida-video-iframe modal-carousel-iframe"></iframe>
                    </div>
                    <div class="modal-video-carousel-controls">
                        <button class="modal-carousel-btn modal-carousel-prev" onclick="changeModalVideoV2(-1)">◀ Anterior</button>
                        <span class="modal-carousel-counter">Vídeo <span class="current-video">1</span>/${embedUrls.length}</span>
                        <button class="modal-carousel-btn modal-carousel-next" onclick="changeModalVideoV2(1)">Próximo ▶</button>
                    </div>
                    <div class="modal-carousel-data" style="display:none;">${embedUrls.join('||')}</div>
                </div>
            `;
        }
    } else {
        videoContent = `
            <div class="corrida-modal-no-video">
                <div class="no-video-icon">📹</div>
                <div class="no-video-text">Transmissão não disponível</div>
                <div class="no-video-subtitle">Confira os resultados dos pilotos Grip ao lado</div>
            </div>
        `;
    }
    
    const modalHTML = `
        <div class="corrida-modal-overlay" onclick="closeCorridaModalV2()">
            <div class="corrida-modal corrida-modal-video corrida-modal-with-sidebar" onclick="event.stopPropagation()">
                <button class="corrida-modal-close" onclick="closeCorridaModalV2()">✕</button>
                <div class="corrida-modal-layout">
                    <div class="corrida-modal-main">
                        <div class="corrida-modal-header">
                            <h2 class="corrida-modal-title">${pista}</h2>
                            <div class="corrida-modal-subtitle">${formatLigaV2(liga)} ${categoria ? '• ' + categoria : ''} • ${temporada} • ${ano}</div>
                        </div>
                        ${videoContent}
                    </div>
                    <div class="corrida-modal-sidebar">
                        <div class="corrida-sidebar-header">
                            <h3 class="corrida-sidebar-title">🏎️ Pilotos Grip Racing</h3>
                            <div class="corrida-sidebar-count">${outrosGripados.length} ${outrosGripados.length === 1 ? 'piloto' : 'pilotos'}</div>
                        </div>
                        <div class="corrida-sidebar-list">
                            ${outrosGripados.map(piloto => {
                                const isCurrentPiloto = piloto.nome === (pilotoData['Piloto'] || pilotoData['piloto']);
                                const pilotoUrl = `piloto-detalhes-v2.html?nome=${encodeURIComponent(piloto.nome)}`;
                                return `
                                <div class="corrida-sidebar-item ${isCurrentPiloto ? 'current-piloto' : 'clickable-piloto'}" ${!isCurrentPiloto ? `onclick="window.location.href='${pilotoUrl}'"` : ''}>
                                    <div class="sidebar-item-position ${piloto.resultClass}">${formatPositionV2(piloto.final)}</div>
                                    <div class="sidebar-item-info">
                                        <div class="sidebar-item-nome">${piloto.nome}</div>
                                        <div class="sidebar-item-details">
                                            <span class="sidebar-item-equipe">${piloto.equipe}</span>
                                            ${piloto.badges ? `<span class="sidebar-item-badges">${piloto.badges}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function closeCorridaModalV2() {
    const modal = document.querySelector('.corrida-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

function changeModalVideoV2(direction) {
    const carousel = document.getElementById('modal-video-carousel');
    if (!carousel) return;
    
    const dataEl = carousel.querySelector('.modal-carousel-data');
    const iframe = carousel.querySelector('.modal-carousel-iframe');
    const counterEl = carousel.querySelector('.current-video');
    
    const videos = dataEl.textContent.split('||');
    const currentSrc = iframe.getAttribute('src');
    let currentIndex = videos.indexOf(currentSrc);
    
    currentIndex = (currentIndex + direction + videos.length) % videos.length;
    
    iframe.setAttribute('src', videos[currentIndex]);
    counterEl.textContent = currentIndex + 1;
}

function parseTransmissionLinksV2(transmissionField) {
    if (!transmissionField || transmissionField.trim() === '') return [];
    return transmissionField.split('||')
        .map(link => link.trim())
        .filter(link => {
            if (!link || link === '#N/A' || link === 'N/A' || link === '-') return false;
            return link.startsWith('http://') || link.startsWith('https://');
        });
}

// Gráfico Radar
let radarChartInstanceV2 = null;

async function createRadarChartV2() {
    const canvas = document.getElementById('statsRadarChartV2');
    if (!canvas) return;
    
    const stats = ['titulos', 'corridas', 'vitorias', 'podios', 'poles', 'fastLaps'];
    const statKeys = {
        titulos: ['Tot. Títulos', 'Títulos', 'titulos'],
        corridas: ['Corridas', 'corridas'],
        vitorias: ['P1', 'Vitórias', 'vitorias'],
        podios: ['Pódios', 'Podios', 'podios'],
        poles: ['Poles', 'poles'],
        fastLaps: ['Fast Laps', 'fast_laps']
    };
    
    const maxStats = {};
    const topPilots = {};
    
    stats.forEach(stat => {
        let maxValue = 0;
        let topPilot = null;
        
        allPilotosData.forEach(p => {
            let value = 0;
            for (const key of statKeys[stat]) {
                if (p[key]) {
                    value = parseInt(p[key]);
                    break;
                }
            }
            
            if (value > maxValue) {
                maxValue = value;
                topPilot = p['Piloto'] || p['piloto'] || 'Desconhecido';
            }
        });
        
        maxStats[stat] = maxValue;
        topPilots[stat] = topPilot;
    });
    
    const currentStats = {
        titulos: parseInt(pilotoData['Títulos'] || pilotoData['titulos'] || 0) + parseInt(pilotoData['Construtores'] || pilotoData['construtores'] || 0),
        corridas: parseInt(pilotoData['Corridas'] || pilotoData['corridas'] || 0),
        vitorias: parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || pilotoData['vitorias'] || 0),
        podios: parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || pilotoData['podios'] || 0),
        poles: parseInt(pilotoData['Poles'] || pilotoData['poles'] || 0),
        fastLaps: parseInt(pilotoData['Fast Laps'] || pilotoData['fast_laps'] || 0)
    };
    
    const percentages = {
        titulos: maxStats.titulos > 0 ? (currentStats.titulos / maxStats.titulos * 100) : 0,
        corridas: maxStats.corridas > 0 ? (currentStats.corridas / maxStats.corridas * 100) : 0,
        vitorias: maxStats.vitorias > 0 ? (currentStats.vitorias / maxStats.vitorias * 100) : 0,
        podios: maxStats.podios > 0 ? (currentStats.podios / maxStats.podios * 100) : 0,
        poles: maxStats.poles > 0 ? (currentStats.poles / maxStats.poles * 100) : 0,
        fastLaps: maxStats.fastLaps > 0 ? (currentStats.fastLaps / maxStats.fastLaps * 100) : 0
    };
    
    if (radarChartInstanceV2) radarChartInstanceV2.destroy();
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Criar lista de líderes abaixo do canvas
    const leadersHTML = `
        <div class="radar-leaders">
            <div class="radar-leader-item">
                <span class="radar-leader-label">🏆 Títulos:</span>
                <a href="piloto-detalhes-v2.html?nome=${encodeURIComponent(topPilots.titulos)}" class="radar-leader-name">${topPilots.titulos}</a>
                <span class="radar-leader-value">${maxStats.titulos}</span>
            </div>
            <div class="radar-leader-item">
                <span class="radar-leader-label">🥇 Vitórias:</span>
                <a href="piloto-detalhes-v2.html?nome=${encodeURIComponent(topPilots.vitorias)}" class="radar-leader-name">${topPilots.vitorias}</a>
                <span class="radar-leader-value">${maxStats.vitorias}</span>
            </div>
            <div class="radar-leader-item">
                <span class="radar-leader-label">🏅 Pódios:</span>
                <a href="piloto-detalhes-v2.html?nome=${encodeURIComponent(topPilots.podios)}" class="radar-leader-name">${topPilots.podios}</a>
                <span class="radar-leader-value">${maxStats.podios}</span>
            </div>
            <div class="radar-leader-item">
                <span class="radar-leader-label">🚩 Poles:</span>
                <a href="piloto-detalhes-v2.html?nome=${encodeURIComponent(topPilots.poles)}" class="radar-leader-name">${topPilots.poles}</a>
                <span class="radar-leader-value">${maxStats.poles}</span>
            </div>
            <div class="radar-leader-item">
                <span class="radar-leader-label">⚡ V. Rápidas:</span>
                <a href="piloto-detalhes-v2.html?nome=${encodeURIComponent(topPilots.fastLaps)}" class="radar-leader-name">${topPilots.fastLaps}</a>
                <span class="radar-leader-value">${maxStats.fastLaps}</span>
            </div>
        </div>
    `;
    
    const existingLeaders = canvas.parentElement.querySelector('.radar-leaders');
    if (existingLeaders) existingLeaders.remove();
    canvas.parentElement.insertAdjacentHTML('beforeend', leadersHTML);
    
    radarChartInstanceV2 = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: ['Títulos', 'Corridas', 'Vitórias', 'Voltas Rápidas', 'Poles', 'Pódios'],
            datasets: [{
                label: pilotoData['Piloto'] || pilotoData['piloto'],
                data: [percentages.titulos, percentages.corridas, percentages.vitorias, percentages.fastLaps, percentages.poles, percentages.podios],
                backgroundColor: 'rgba(255, 107, 0, 0.2)',
                borderColor: 'rgba(255, 107, 0, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 107, 0, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 107, 0, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: (value) => value + '%',
                        font: { size: 11, family: "'Montserrat', sans-serif" },
                        color: textColor,
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: { size: 12, weight: 600, family: "'Montserrat', sans-serif" },
                        color: textColor
                    },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#fff' : '#000',
                    bodyColor: isDark ? '#fff' : '#000',
                    borderColor: '#ff6b00',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => `${context.parsed.r.toFixed(1)}% do líder`
                    }
                }
            }
        }
    });
    
    window.addEventListener('themeChanged', () => createRadarChartV2());
}

// ============================================
// HISTORY TABS
// ============================================

function initHistoryTabs() {
    const tabButtons = document.querySelectorAll('.history-tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remove active class from all buttons and panels
            document.querySelectorAll('.history-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.history-tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            const panel = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
}

// Expose toggle functions to global scope (for onclick handlers)
window.toggleAnoV2 = toggleAnoV2;
window.toggleTemporadaV2 = toggleTemporadaV2;
window.toggleCampeonatoV2 = toggleCampeonatoV2;
window.toggleCircuitoV2 = toggleCircuitoV2;
window.toggleCampeonatoTemporadaV2 = toggleCampeonatoTemporadaV2;
window.openCorridaModalV2 = openCorridaModalV2;
window.closeCorridaModalV2 = closeCorridaModalV2;
window.showTop5Modal = showTop5Modal;
window.closeTop5Modal = closeTop5Modal;
window.closeStatDetailModal = closeStatDetailModal;
window.changeModalVideoV2 = changeModalVideoV2;

// Init
loadPilotoData();
