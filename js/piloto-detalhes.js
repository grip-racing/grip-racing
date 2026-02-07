// Piloto detalhes page script
const DATA_VERSION = '1.0.17'; // Incrementar quando atualizar os dados
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

let pilotoData = null;
let participacoesData = [];

// Validar se é uma participação válida (não é separador de ano)
function isValidParticipacao(p) {
    // Ignorar linhas que são apenas separadores de ano (sem piloto, pista, etc)
    const piloto = String(p['Piloto'] || '').trim();
    const pista = String(p['Pista'] || '').trim();
    const final = String(p['Final'] || '').trim();
    
    // Se não tem piloto E não tem pista E não tem resultado final, é separador
    return piloto !== '' || pista !== '' || final !== '';
}

// Format position with ordinal
function formatPosition(pos) {
    if (!pos || pos === '-' || pos === 'N/A') return pos;
    const posStr = String(pos).trim();
    if (posStr.toUpperCase().includes('DNF') || posStr.toUpperCase().includes('DQ') || posStr.toUpperCase().includes('ABANDON')) return posStr;
    const num = parseInt(posStr.replace(REGEX_CACHE.digitsOnly, ''));
    if (isNaN(num)) return posStr;
    return num + 'º';
}

// Get badge class for position
function getBadgeClass(pos) {
    if (!pos) return '';
    const posStr = String(pos).trim();
    const num = parseInt(posStr.replace(REGEX_CACHE.digitsOnly, ''));
    if (num === 1) return 'badge-1';
    if (num === 2) return 'badge-2';
    if (num === 3) return 'badge-3';
    return '';
}

// Check if mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Get cached DOM element
function getCachedElement(id) {
    if (!DOM_CACHE[id]) {
        DOM_CACHE[id] = document.getElementById(id);
    }
    return DOM_CACHE[id];
}

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

// Normalize circuit name (remove suffixes like " 2", " 3", etc)
function normalizeCircuitName(circuitName) {
    if (!circuitName) return circuitName;
    // Remove sufixos como " 2", " 3", " II", " III", etc
    return circuitName.replace(REGEX_CACHE.circuitSuffix, '').replace(REGEX_CACHE.circuitRoman, '').trim();
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

// Render transmission link icon (single or carousel)
function renderTransmissionLink(link) {
    const links = parseTransmissionLinks(link);
    if (links.length === 0) return '';
    
    if (links.length === 1) {
        // Single link - render as before
        return `<a href="${links[0]}" target="_blank" rel="noopener noreferrer" class="transmission-link" title="Ver transmissão">📺</a>`;
    }
    
    // Multiple links - render carousel
    const carouselId = `carousel-${Math.random().toString(36).substr(2, 9)}`;
    return `
        <span class="transmission-carousel" id="${carouselId}">
            <button class="carousel-btn carousel-prev" onclick="event.stopPropagation(); changeVideo('${carouselId}', -1)" title="Vídeo anterior">◀</button>
            <a href="${links[0]}" target="_blank" rel="noopener noreferrer" class="transmission-link carousel-current" title="Ver transmissão (1/${links.length})">📺</a>
            <button class="carousel-btn carousel-next" onclick="event.stopPropagation(); changeVideo('${carouselId}', 1)" title="Próximo vídeo">▶</button>
            <span class="carousel-counter">1/${links.length}</span>
            <span class="carousel-data" style="display:none;">${links.join('||')}</span>
        </span>
    `;
}

// Change video in carousel
function changeVideo(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const dataEl = carousel.querySelector('.carousel-data');
    const linkEl = carousel.querySelector('.carousel-current');
    const counterEl = carousel.querySelector('.carousel-counter');
    
    const links = dataEl.textContent.split('||');
    const currentLink = linkEl.getAttribute('href');
    let currentIndex = links.indexOf(currentLink);
    
    // Calculate new index with wrapping
    currentIndex = (currentIndex + direction + links.length) % links.length;
    
    // Update link and counter
    linkEl.setAttribute('href', links[currentIndex]);
    linkEl.setAttribute('title', `Ver transmissão (${currentIndex + 1}/${links.length})`);
    counterEl.textContent = `${currentIndex + 1}/${links.length}`;
}

// Format championship badges for display
function formatChampionshipBadges(qtdPiloto, qtdConstrutores) {
    const mobile = isMobile();
    let badges = '';
    
    if (qtdPiloto > 0) {
        badges += mobile && qtdPiloto > 1 ? `${qtdPiloto}x 🏆` : '🏆'.repeat(qtdPiloto);
    }
    if (qtdConstrutores > 0) {
        if (badges && mobile) badges += ' ';
        badges += mobile && qtdConstrutores > 1 ? `${qtdConstrutores}x 👥` : '👥'.repeat(qtdConstrutores);
    }
    
    return badges ? ' ' + badges : '';
}

// Get piloto name from URL
function getPilotoName() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('nome') || '';
}

// Load piloto data
async function loadPilotoData() {
    const pilotoNome = getPilotoName();
    if (!pilotoNome) {
        window.location.href = 'pilotos.html';
        return;
    }
    
    console.log(`🏁 Carregando dados de ${pilotoNome}`);
    
    // Load piloto stats
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    pilotoData = pilotos.find(p => 
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    if (!pilotoData) {
        document.getElementById('pilotoName').textContent = 'Piloto não encontrado';
        return;
    }
    
    // Load participacoes
    participacoesData = await window.GripUtils.fetchData(DATA_SOURCES.participacoes);
    
    displayPilotoInfo();
    displayPilotoStats();
    displayTemporadas();
    displayCampeonatos();
    displayCircuitos();
    displayAdvancedStats();
    displayRecordes();
    createRadarChart();
    
    // Listen for theme changes and recreate radar chart
    window.addEventListener('themeChanged', function() {
        createRadarChart();
    });
}

// Exibir agrupamento por circuito
function displayCircuitos() {
    const pilotoNome = pilotoData['Piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );

    if (pilotoParticipacoes.length === 0) {
        document.getElementById('circuitosContainer').innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum dado disponível</p>';
        return;
    }

    // Agrupar por pista
    const circuitosMap = {};
    pilotoParticipacoes.forEach(p => {
        const pistaOriginal = p['Pista'] || 'Desconhecido';
        const pista = normalizeCircuitName(pistaOriginal);
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
                melhorResultado: null,
                melhorPosicao: 999
            };
        }

        circuitosMap[pista].corridas.push(p);
        circuitosMap[pista].total++;

        // Contar estatísticas
        const final = String(p['Final'] || '').trim();
        let posicao = 999;
        
        if (final.match(/^\d+/)) {
            posicao = parseInt(final);
        } else if (final.includes('º')) {
            const match = final.match(/(\d+)º/);
            if (match) posicao = parseInt(match[1]);
        }

        if (posicao === 1) circuitosMap[pista].vitorias++;
        if (posicao <= 3 && posicao > 0) circuitosMap[pista].podios++;
        if (String(p['Pole'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].poles++;
        if (String(p['Best Lap'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].fastLaps++;
        if (String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].hatTricks++;
        if (String(p['Chelem'] || '').trim().toUpperCase() === 'SIM') circuitosMap[pista].chelems++;

        // Melhor resultado
        if (posicao < circuitosMap[pista].melhorPosicao) {
            circuitosMap[pista].melhorPosicao = posicao;
            circuitosMap[pista].melhorResultado = final;
        }
    });

    // Converter em array e ordenar por número de corridas (decrescente) e depois alfabeticamente
    const circuitos = Object.values(circuitosMap).sort((a, b) => {
        // Primeiro por quantidade de corridas (maior para menor)
        if (b.total !== a.total) {
            return b.total - a.total;
        }
        // Depois alfabeticamente
        return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    // Renderizar
    const circuitosHTML = circuitos.map((circ, index) => {
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
            if (pos === 1) classe = 'resultado-vitoria';
            else if (pos === 2) classe = 'resultado-segundo';
            else if (pos === 3) classe = 'resultado-podio';
            melhorTag = `<span class="circuito-melhor ${classe}">Melhor: ${formatPosition(circ.melhorResultado)}</span>`;
        }

        return `
        <div class="circuito-item-wrapper">
            <div class="circuito-item" onclick="toggleCircuito(this)">
                <div class="circuito-header-left">
                    <span class="circuito-nome">${circ.nome}</span>
                    <span class="circuito-participacoes">${circ.total} ${circ.total === 1 ? 'corrida' : 'corridas'}${statsSummary.length > 0 ? ' • ' + statsSummary.join('  ') : ''} ${melhorTag ? '• ' + melhorTag : ''}</span>
                </div>
                <div class="circuito-expand">▼</div>
            </div>
            <div class="circuito-detail" id="circuitoDetail-${index}">
                <div class="circuito-corridas-list">
                    ${circ.corridas.map(c => {
                        const final = String(c['Final'] || '').trim();
                        const pista = String(c['Pista'] || '').trim();
                        const temporada = String(c['Temporada'] || '').trim();
                        const liga = String(c['Liga'] || '').trim();
                        const categoria = String(c['Categoria'] || '').trim();
                        const ano = String(c['Ano'] || '').trim();
                        const transmissao = c['Link Transmissao'] || '';

                        const finalNum = final.match(/^\d+/) ? parseInt(final) : (final.includes('º') ? parseInt(final) : 999);
                        const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
                        const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
                        const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                        const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta Rápida">⚡</span>' : '';
                        const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick: Pole + Vitória + Volta Rápida">🎩</span>' : '';
                        const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem: Pole + Vitória + Volta Rápida + Liderou todas as voltas">👑</span>' : '';
                        const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campeão de Pilotos">🏆</span>' : '';
                        const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                        const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campeão de Construtores">👥</span>' : '';
                        const transmissaoLink = renderTransmissionLink(transmissao);
                        
                        let resultClass = '';
                        if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                        else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                        else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                        else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';

                        const corridaData = JSON.stringify(c).replace(/"/g, '&quot;');
                        
                        return `
                            <div class="circuito-corrida-item" onclick="openCorridaModal(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c)}'>
                                <span class="circuito-corrida-resultado ${resultClass}">${formatPosition(final)}</span>
                                <div class="circuito-corrida-info">
                                    <div>${formatLiga(liga, 'liga-inline')} ${categoria ? categoria : ''}</div>
                                    <div class="circuito-corrida-meta">${temporada} • ${ano}${transmissaoLink ? ' ' + transmissaoLink : ''}</div>
                                </div>
                                <div class="circuito-corrida-badges">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}${campeonatoPiloto}${campeonatoConstrutores}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        `;
    }).join('');

    getCachedElement('circuitosContainer').innerHTML = circuitosHTML;
}

// Toggle para expandir/recolher circuito
function toggleCircuito(element) {
    const wrapper = element.parentElement;
    const detail = wrapper.querySelector('.circuito-detail');
    const expand = element.querySelector('.circuito-expand');
    
    if (detail.style.maxHeight && detail.style.maxHeight !== '0px') {
        expand.style.transform = 'rotate(0deg)';
        detail.style.maxHeight = '0';
    } else {
        expand.style.transform = 'rotate(180deg)';
        detail.style.maxHeight = detail.scrollHeight + 'px';
    }
}

// Global variable to store chart instance
let radarChartInstance = null;

// Create radar chart
async function createRadarChart() {
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    
    // Get max values and top pilots for each stat
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
        
        pilotos.forEach(p => {
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
    
    // Get current pilot stats
    const currentStats = {
        titulos: parseInt(pilotoData['Tot. Títulos'] || pilotoData['Títulos'] || 0),
        corridas: parseInt(pilotoData['Corridas'] || 0),
        vitorias: parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || 0),
        podios: parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || 0),
        poles: parseInt(pilotoData['Poles'] || 0),
        fastLaps: parseInt(pilotoData['Fast Laps'] || 0)
    };
    
    // Calculate percentages
    const percentages = {
        titulos: maxStats.titulos > 0 ? (currentStats.titulos / maxStats.titulos * 100) : 0,
        corridas: maxStats.corridas > 0 ? (currentStats.corridas / maxStats.corridas * 100) : 0,
        vitorias: maxStats.vitorias > 0 ? (currentStats.vitorias / maxStats.vitorias * 100) : 0,
        podios: maxStats.podios > 0 ? (currentStats.podios / maxStats.podios * 100) : 0,
        poles: maxStats.poles > 0 ? (currentStats.poles / maxStats.poles * 100) : 0,
        fastLaps: maxStats.fastLaps > 0 ? (currentStats.fastLaps / maxStats.fastLaps * 100) : 0
    };
    
    // Create comparison list
    const comparisonHtml = `
        <button class="toggle-comparison-btn" onclick="toggleStatsComparison()">
            <span class="toggle-icon">▼</span> Ver comparação com líderes
        </button>
        <div class="stats-comparison hidden">
            <div class="comparison-item">
                <span class="comparison-label">Títulos</span>
                <a href="piloto-detalhes.html?nome=${encodeURIComponent(topPilots.titulos)}" class="comparison-leader">${topPilots.titulos} (${maxStats.titulos})</a>
                <span class="comparison-you">${currentStats.titulos} (${percentages.titulos.toFixed(0)}%)</span>
            </div>
            <div class="comparison-item">
                <span class="comparison-label">Corridas</span>
                <a href="piloto-detalhes.html?nome=${encodeURIComponent(topPilots.corridas)}" class="comparison-leader">${topPilots.corridas} (${maxStats.corridas})</a>
                <span class="comparison-you">${currentStats.corridas} (${percentages.corridas.toFixed(0)}%)</span>
            </div>
            <div class="comparison-item">
                <span class="comparison-label">Vitórias</span>
                <a href="piloto-detalhes.html?nome=${encodeURIComponent(topPilots.vitorias)}" class="comparison-leader">${topPilots.vitorias} (${maxStats.vitorias})</a>
                <span class="comparison-you">${currentStats.vitorias} (${percentages.vitorias.toFixed(0)}%)</span>
            </div>
            <div class="comparison-item">
                <span class="comparison-label">Voltas Rápidas</span>
                <a href="piloto-detalhes.html?nome=${encodeURIComponent(topPilots.fastLaps)}" class="comparison-leader">${topPilots.fastLaps} (${maxStats.fastLaps})</a>
                <span class="comparison-you">${currentStats.fastLaps} (${percentages.fastLaps.toFixed(0)}%)</span>
            </div>
            <div class="comparison-item">
                <span class="comparison-label">Poles</span>
                <a href="piloto-detalhes.html?nome=${encodeURIComponent(topPilots.poles)}" class="comparison-leader">${topPilots.poles} (${maxStats.poles})</a>
                <span class="comparison-you">${currentStats.poles} (${percentages.poles.toFixed(0)}%)</span>
            </div>
            <div class="comparison-item">
                <span class="comparison-label">Pódios</span>
                <a href="piloto-detalhes.html?nome=${encodeURIComponent(topPilots.podios)}" class="comparison-leader">${topPilots.podios} (${maxStats.podios})</a>
                <span class="comparison-you">${currentStats.podios} (${percentages.podios.toFixed(0)}%)</span>
            </div>
        </div>
    `;
    
    // Insert comparison after canvas
    const canvas = document.getElementById('statsRadarChart');
    const existingComparison = document.querySelector('.stats-comparison');
    if (existingComparison) {
        existingComparison.remove();
    }
    const existingBtn = document.querySelector('.toggle-comparison-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    canvas.insertAdjacentHTML('afterend', comparisonHtml);
    
    const ctx = canvas;
    
    // Destroy previous chart instance if exists
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }
    
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Títulos', 'Corridas', 'Vitórias', 'Voltas Rápidas', 'Poles', 'Pódios'],
            datasets: [{
                label: pilotoData['Piloto'] || pilotoData['piloto'],
                data: [
                    percentages.titulos,
                    percentages.corridas,
                    percentages.vitorias,
                    percentages.fastLaps,
                    percentages.poles,
                    percentages.podios
                ],
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
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 12
                        },
                        color: function(context) {
                            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                            return isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
                        },
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: function(context) {
                            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                            return isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
                        }
                    },
                    grid: {
                        color: function(context) {
                            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                            return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    },
                    angleLines: {
                        color: function(context) {
                            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                            return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const percentage = context.parsed.r.toFixed(1);
                            const statKey = ['titulos', 'corridas', 'vitorias', 'fastLaps', 'poles', 'podios'][context.dataIndex];
                            const currentValue = currentStats[statKey];
                            const maxValue = maxStats[statKey];
                            return `${label}: ${currentValue}/${maxValue} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Display piloto info
function displayPilotoInfo() {
    const nome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const estreia = pilotoData['Estreia'] || pilotoData['estreia'] || '-';
    const ultima = pilotoData['Ultima'] || pilotoData['Última'] || pilotoData['ultima'] || '-';
    
    document.getElementById('pilotoName').textContent = nome;
    document.getElementById('pilotoPeriodo').textContent = `${estreia} - ${ultima}`;
    document.title = `${nome} - Grip Racing`;
}

// Show leader modal with top 5
function showLeader(statName, top5) {
    const existingModal = document.querySelector('.leader-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'leader-modal';
    
    const top5Html = top5.map((p, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
        return `
            <div class="top-item ${i < 3 ? 'top-podium' : ''}">
                <span class="top-position">${medal}</span>
                <span class="top-name">${p.name}</span>
                <span class="top-value">${p.value}</span>
                <span class="top-corridas">🏁 ${p.corridas}</span>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="leader-modal-content">
            <h3>🏆 Top 5 em ${statName}</h3>
            <div class="top-list">
                ${top5Html}
            </div>
            <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
        </div>
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

// Toggle stat detail display
// Track sort order for each stat type
const statSortOrder = {
    corridas: 'desc',
    vitorias: 'desc',
    podios: 'desc',
    poles: 'desc',
    fastlaps: 'desc',
    hattricks: 'desc',
    chelems: 'desc'
};

function toggleStatDetail(type) {
    const detailSection = document.getElementById(`statDetail${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const card = document.getElementById(`card${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    // Don't allow toggle if card has no ranking
    if (card && card.classList.contains('no-ranking')) {
        return;
    }
    
    // Close all other details
    document.querySelectorAll('.stat-detail-section').forEach(section => {
        if (section.id !== detailSection.id) {
            section.classList.remove('active');
            section.style.maxHeight = '0';
        }
    });
    document.querySelectorAll('.stat-card-clickable').forEach(c => {
        if (c.id !== card.id) {
            c.classList.remove('active');
        }
    });
    
    // Toggle current detail
    const isActive = detailSection.classList.toggle('active');
    card.classList.toggle('active');
    
    if (isActive) {
        displayStatDetails(type, detailSection);
        setTimeout(() => {
            detailSection.style.maxHeight = detailSection.scrollHeight + 'px';
            
            // Scroll to detail section on mobile
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        }, 10);
    } else {
        detailSection.style.maxHeight = '0';
    }
}

// Display stat details
function displayStatDetails(type, container) {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    let filteredData = [];
    let title = '';
    
    if (type === 'titulos') {
        // Buscar TODAS as participações do piloto para contar corridas por campeonato
        const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
        const todasParticipacoes = participacoesData.filter(p => 
            isValidParticipacao(p) &&
            (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
        );
        
        // Filtrar campeonatos onde foi campeão
        const campeonatosPiloto = todasParticipacoes.filter(c => {
            const campeao = String(c['Piloto Campeao'] || '').trim().toUpperCase();
            return campeao === 'SIM';
        });
        
        const campeonatosConstrutores = todasParticipacoes.filter(c => {
            const construtores = String(c['Construtores'] || '').trim().toUpperCase();
            return construtores === 'SIM' || construtores === 'TIME';
        });
        
        // Filtrar eventos vencidos
        const eventosVencidos = todasParticipacoes.filter(c => {
            const campeao = String(c['Piloto Campeao'] || '').trim().toUpperCase();
            return campeao === 'EVENTO';
        });
        
        // Agrupar títulos de pilotos com contagem real de corridas
        const titulosPilotoUnicos = {};
        campeonatosPiloto.forEach(c => {
            const liga = String(c['Liga'] || 'N/A').trim();
            const temporada = String(c['Temporada'] || '').trim();
            const ano = String(c['Ano'] || '').trim();
            const categoria = String(c['Categoria'] || '').trim();
            const key = `piloto|||${liga}|||${temporada}|||${categoria}`;
            
            if (!titulosPilotoUnicos[key]) {
                // Contar TODAS as corridas desta liga/temporada/categoria
                const corridasCampeonato = todasParticipacoes.filter(p => 
                    isValidParticipacao(p) &&
                    String(p['Liga'] || '').trim() === liga && 
                    String(p['Temporada'] || '').trim() === temporada &&
                    String(p['Categoria'] || '').trim() === categoria
                );
                
                titulosPilotoUnicos[key] = {
                    tipo: 'piloto',
                    liga: liga,
                    temporada: temporada,
                    ano: ano,
                    categoria: categoria,
                    totalCorridas: corridasCampeonato.length,
                    corridas: corridasCampeonato
                };
            }
        });
        
        // Agrupar títulos de construtores com contagem real de corridas
        const titulosConstrutoresUnicos = {};
        campeonatosConstrutores.forEach(c => {
            const liga = String(c['Liga'] || 'N/A').trim();
            const temporada = String(c['Temporada'] || '').trim();
            const ano = String(c['Ano'] || '').trim();
            const categoria = String(c['Categoria'] || '').trim();
            const equipe = String(c['Equipe'] || '').trim();
            const key = `construtor|||${liga}|||${temporada}|||${categoria}`;
            
            if (!titulosConstrutoresUnicos[key]) {
                // Contar TODAS as corridas desta liga/temporada/categoria
                const corridasCampeonato = todasParticipacoes.filter(p => 
                    isValidParticipacao(p) &&
                    String(p['Liga'] || '').trim() === liga && 
                    String(p['Temporada'] || '').trim() === temporada &&
                    String(p['Categoria'] || '').trim() === categoria
                );
                
                // Buscar todos os pilotos que venceram este título de construtores (de TODAS as participações, não só do piloto atual)
                const pilotosCampeoes = [...new Set(
                    participacoesData
                        .filter(p => 
                            isValidParticipacao(p) &&
                            String(p['Liga'] || '').trim() === liga && 
                            String(p['Temporada'] || '').trim() === temporada &&
                            String(p['Categoria'] || '').trim() === categoria &&
                            (String(p['Construtores'] || '').trim().toUpperCase() === 'SIM' || 
                             String(p['Construtores'] || '').trim().toUpperCase() === 'TIME')
                        )
                        .map(p => String(p['Piloto'] || '').trim())
                        .filter(nome => nome !== '')
                )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
                
                titulosConstrutoresUnicos[key] = {
                    tipo: 'construtor',
                    liga: liga,
                    temporada: temporada,
                    ano: ano,
                    categoria: categoria,
                    equipe: equipe,
                    pilotos: pilotosCampeoes,
                    totalCorridas: corridasCampeonato.length,
                    corridas: corridasCampeonato
                };
            }
        });
        
        // Separar e ordenar títulos
        const titulosPiloto = Object.values(titulosPilotoUnicos).sort((a, b) => {
            const anoA = parseInt(a.ano) || 0;
            const anoB = parseInt(b.ano) || 0;
            if (anoB !== anoA) return anoB - anoA;
            return b.temporada.localeCompare(a.temporada);
        });
        
        const titulosConstrutores = Object.values(titulosConstrutoresUnicos).sort((a, b) => {
            const anoA = parseInt(a.ano) || 0;
            const anoB = parseInt(b.ano) || 0;
            if (anoB !== anoA) return anoB - anoA;
            return b.temporada.localeCompare(a.temporada);
        });
        
        // Processar eventos vencidos - agrupar por evento único
        const eventosUnicos = {};
        eventosVencidos.forEach(c => {
            const categoria = String(c['Categoria'] || 'Evento').trim();
            const pista = String(c['Pista'] || 'N/A').trim();
            const liga = String(c['Liga'] || 'N/A').trim();
            const temporada = String(c['Temporada'] || '').trim();
            const ano = String(c['Ano'] || '').trim();
            const key = `evento|||${categoria}|||${pista}|||${liga}|||${temporada}`;
            
            if (!eventosUnicos[key]) {
                eventosUnicos[key] = {
                    tipo: 'evento',
                    categoria: categoria,
                    pista: pista,
                    liga: liga,
                    temporada: temporada,
                    ano: ano,
                    corrida: c
                };
            }
        });
        
        const eventos = Object.values(eventosUnicos).sort((a, b) => {
            const anoA = parseInt(a.ano) || 0;
            const anoB = parseInt(b.ano) || 0;
            if (anoB !== anoA) return anoB - anoA;
            return b.temporada.localeCompare(a.temporada);
        });
        
        const totalTitulos = titulosPiloto.length + titulosConstrutores.length;
        
        const pilotoAtual = pilotoData['Piloto'] || '';
        
        const renderTituloCard = (t, index) => `
            <div class="titulo-card-wrapper">
                <div class="titulo-card ${t.tipo === 'construtor' ? 'titulo-card-construtor' : ''}" onclick="toggleTituloDetail('${t.tipo}-${index}')" style="cursor: pointer;">
                    <div class="titulo-trophy">${t.tipo === 'piloto' ? '🏆' : '👥'}</div>
                    <div class="titulo-content">
                        <div class="titulo-liga-main">${formatLiga(t.liga, 'liga-display-titulo')}</div>
                        <div class="titulo-temporada">${t.temporada}</div>
                        ${t.categoria ? `<div class="titulo-categoria">${t.categoria}</div>` : ''}
                        ${t.tipo === 'construtor' && t.pilotos && t.pilotos.length > 0 ? `<div class="titulo-pilotos">${t.pilotos.map(p => {
                            if (p.toLowerCase() === pilotoAtual.toLowerCase()) {
                                return `<span class="piloto-nome piloto-atual">${p}</span>`;
                            } else {
                                return `<a href="piloto-detalhes.html?nome=${encodeURIComponent(p)}" class="piloto-nome piloto-link" onclick="event.stopPropagation()">${p}</a>`;
                            }
                        }).join('')}</div>` : ''}
                        <div class="titulo-info">
                            <span class="titulo-ano">${t.ano}</span>
                            <span class="titulo-corridas">${t.totalCorridas} corridas</span>
                        </div>
                    </div>
                    <div class="titulo-expand">▼</div>
                </div>
                <div class="titulo-corridas-list" id="tituloDetail-${t.tipo}-${index}">
                ${t.corridas.map(c => {
                    const pistaOriginal = c['Pista'] || 'Desconhecida';
                    const pista = normalizeCircuitName(pistaOriginal);
                    const final = c['Final'] || 'N/A';
                    const transmissao = c['Link Transmissao'] || '';
                    const transmissaoLink = renderTransmissionLink(transmissao);
                    const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
                    const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
                    const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
                    const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                    const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta R\u00e1pida">⚡</span>' : '';
                    const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick: Pole + Vitória + Volta Rápida">🎩</span>' : '';
                    const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem: Pole + Vitória + Volta Rápida + Liderou todas as voltas">👑</span>' : '';
                    const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campe\u00e3o de Pilotos">🏆</span>' : '';
                    const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                    const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campe\u00e3o de Construtores">👥</span>' : '';
                    
                    let resultClass = '';
                    if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                    else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                    else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                    else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                    
                    return `
                        <div class="titulo-corrida-item" onclick="openCorridaModal(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c)}'>
                            <div class="titulo-corrida-resultado ${resultClass}">${formatPosition(final)}</div>
                            <div class="titulo-corrida-pista">${pista}${transmissaoLink ? ' ' + transmissaoLink : ''}</div>
                            <div class="titulo-corrida-badges">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}${campeonatoPiloto}${campeonatoConstrutores}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            </div>
        `;
        
        const renderEventoCard = (e, index) => {
            const c = e.corrida;
            const final = c['Final'] || 'N/A';
            const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
            const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
            const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
            const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
            const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta Rápida">⚡</span>' : '';
            const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick: Pole + Vitória + Volta Rápida">🎩</span>' : '';
            const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem: Pole + Vitória + Volta Rápida + Liderou todas as voltas">👑</span>' : '';
            
            let resultClass = '';
            if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
            else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
            else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
            
            // Normalizar nome da liga para o nome do arquivo
            const ligaNormalizada = e.liga.toLowerCase().replace(/\s+/g, '');
            const logoPath = `assets/ligas/${ligaNormalizada}.png`;
            
            return `
            <div class="titulo-card-wrapper">
                <div class="titulo-card titulo-card-evento" onclick="openCorridaModal(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c)}' style="cursor: pointer;">
                    <div class="titulo-trophy">⭐</div>
                    <div class="titulo-content">
                        <div class="titulo-liga">${e.categoria}</div>
                        <div class="titulo-temporada">${e.pista}</div>
                        <div class="titulo-info">
                            <span class="titulo-ano">${e.temporada}</span>
                            ${formatLiga(e.liga, 'liga-display-small')}
                        </div>
                        <div class="evento-badges-inline">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}</div>
                    </div>
                </div>
            </div>
            `;
        };
        
        const html = `
            <div class="stat-detail-content">
                <h3 class="stat-detail-title">🏆 Campeonatos Vencidos <span class="stat-detail-count">(${totalTitulos})</span></h3>
                
                ${titulosPiloto.length > 0 ? `
                    <div class="titulos-group">
                        <h4 class="titulos-group-title">🏆 Títulos Individuais <span class="titulos-group-count">(${titulosPiloto.length})</span></h4>
                        <div class="titulos-grid">
                            ${titulosPiloto.map((t, i) => renderTituloCard(t, i)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${titulosConstrutores.length > 0 ? `
                    <div class="titulos-group">
                        <h4 class="titulos-group-title">👥 Títulos de Construtores <span class="titulos-group-count">(${titulosConstrutores.length})</span></h4>
                        <div class="titulos-grid">
                            ${titulosConstrutores.map((t, i) => renderTituloCard(t, i)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${eventos.length > 0 ? `
                    <div class="titulos-group">
                        <h4 class="titulos-group-title">⭐ Eventos Vencidos <span class="titulos-group-count">(${eventos.length})</span></h4>
                        <div class="titulos-grid">
                            ${eventos.map((e, i) => renderEventoCard(e, i)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = html;
        return;
    }
    
    if (type === 'corridas') {
        filteredData = pilotoParticipacoes;
        if (statSortOrder[type] === 'desc') {
            filteredData = [...filteredData].reverse();
        }
        title = '🏁 Todas as Corridas';
    } else if (type === 'vitorias') {
        filteredData = pilotoParticipacoes.filter(c => {
            const final = String(c['Final'] || '').trim();
            const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 0;
            return finalNum === 1;
        });
        if (statSortOrder[type] === 'desc') {
            filteredData = filteredData.reverse();
        }
        title = '🥇 Vitórias';
    } else if (type === 'podios') {
        filteredData = pilotoParticipacoes.filter(c => {
            const final = String(c['Final'] || '').trim();
            const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 0;
            return finalNum >= 1 && finalNum <= 3;
        });
        if (statSortOrder[type] === 'desc') {
            filteredData = filteredData.reverse();
        }
        title = '🏅 Pódios';
    } else if (type === 'poles') {
        filteredData = pilotoParticipacoes.filter(c => {
            const pole = String(c['Pole'] || '').trim().toLowerCase();
            return pole === 'sim';
        });
        if (statSortOrder[type] === 'desc') {
            filteredData = filteredData.reverse();
        }
        title = '⚡ Pole Positions';
    } else if (type === 'fastlaps') {
        filteredData = pilotoParticipacoes.filter(c => {
            const bestLap = String(c['Best Lap'] || '').trim().toLowerCase();
            return bestLap === 'sim';
        });
        if (statSortOrder[type] === 'desc') {
            filteredData = filteredData.reverse();
        }
        title = '⏱️ Voltas Mais Rápidas';
    } else if (type === 'hattricks') {
        filteredData = pilotoParticipacoes.filter(c => {
            const hatTrick = String(c['Hat-Trick'] || '').trim().toLowerCase();
            return hatTrick === 'sim';
        });
        if (statSortOrder[type] === 'desc') {
            filteredData = filteredData.reverse();
        }
        title = '🎩 Hat-tricks';
    } else if (type === 'chelems') {
        filteredData = pilotoParticipacoes.filter(c => {
            const chelem = String(c['Chelem'] || '').trim().toLowerCase();
            return chelem === 'sim';
        });
        if (statSortOrder[type] === 'desc') {
            filteredData = filteredData.reverse();
        }
        title = '👑 Chelems';
    }
    
    const sortIcon = statSortOrder[type] === 'desc' ? '↓' : '↑';
    const sortLabel = statSortOrder[type] === 'desc' ? 'Recente' : 'Antigo';
    
    const html = `
        <div class="stat-detail-content">
            <div class="stat-detail-header">
                <h3 class="stat-detail-title">${title} <span class="stat-detail-count">(${filteredData.length})</span></h3>
                <button class="stat-sort-btn" onclick="event.stopPropagation(); toggleStatSort('${type}')" title="Ordenar por ${sortLabel === 'Recente' ? 'mais antigo' : 'mais recente'}">
                    <span class="sort-icon">${sortIcon}</span>
                    <span class="sort-label">${sortLabel}</span>
                </button>
            </div>
            <div class="stat-detail-list">
                ${filteredData.map(c => {
                    const pistaOriginal = c['Pista'] || 'Desconhecida';
                    const pista = normalizeCircuitName(pistaOriginal);
                    const liga = c['Liga'] || 'N/A';
                    const temporada = c['Temporada'] || '';
                    const ano = c['Ano'] || '';
                    const categoria = c['Categoria'] || '';
                    const final = c['Final'] || '-';
                    const transmissao = c['Link Transmissao'] || '';
                    const transmissaoLink = renderTransmissionLink(transmissao);
                    
                    return `
                        <div class="stat-detail-item" onclick="openCorridaModal(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c)}' style="cursor: pointer;">
                            <div class="stat-detail-item-info">
                                <span class="stat-detail-posicao ${getBadgeClass(final)}">${formatPosition(final)}</span>
                            </div>
                            <div class="stat-detail-item-main">
                                <div class="stat-detail-pista">${pista}${transmissaoLink ? ' ' + transmissaoLink : ''}</div>
                                <div class="stat-detail-meta">
                                    ${formatLiga(liga, 'stat-detail-liga')}
                                    ${categoria ? `<span class="stat-detail-categoria">${categoria}</span>` : ''}
                                    ${temporada ? `<span class="stat-detail-temporada">${temporada}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Toggle sort order for stat details
function toggleStatSort(type) {
    statSortOrder[type] = statSortOrder[type] === 'desc' ? 'asc' : 'desc';
    const detailSection = document.getElementById(`statDetail${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (detailSection) {
        displayStatDetails(type, detailSection);
    }
}

// Display piloto stats overview
async function displayPilotoStats() {
    // Calcular títulos reais (apenas campeonatos, sem eventos)
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const todasParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    // Contar campeonatos de piloto
    const campeonatosPiloto = todasParticipacoes.filter(c => {
        const campeao = String(c['Piloto Campeao'] || '').trim().toUpperCase();
        return campeao === 'SIM';
    });
    
    // Contar campeonatos de construtores
    const campeonatosConstrutores = todasParticipacoes.filter(c => {
        const construtores = String(c['Construtores'] || '').trim().toUpperCase();
        return construtores === 'SIM' || construtores === 'TIME';
    });
    
    // Agrupar títulos únicos - adicionar tipo na chave para separar piloto de construtor
    const titulosPilotoUnicos = new Set(campeonatosPiloto.map(c => 
        `PILOTO|||${c['Liga']}|||${c['Temporada']}|||${c['Categoria']}`
    ));
    const titulosConstrutoresUnicos = new Set(campeonatosConstrutores.map(c => 
        `CONSTRUTOR|||${c['Liga']}|||${c['Temporada']}|||${c['Categoria']}`
    ));
    
    const titulos = titulosPilotoUnicos.size + titulosConstrutoresUnicos.size;
    
    // Contar eventos vencidos
    const eventosVencidos = todasParticipacoes.filter(c => {
        const campeao = String(c['Piloto Campeao'] || '').trim().toUpperCase();
        return campeao === 'EVENTO';
    });
    const totalEventos = eventosVencidos.length;
    
    const corridas = parseInt(pilotoData['Corridas'] || pilotoData['corridas'] || 0);
    const vitorias = parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || pilotoData['vitorias'] || 0);
    const podios = parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || pilotoData['podios'] || 0);
    const poles = parseInt(pilotoData['Poles'] || pilotoData['poles'] || 0);
    const fastLaps = parseInt(pilotoData['Fast Laps'] || pilotoData['fast_laps'] || 0);
    
    // Count Hat-tricks and Chelems
    const hatTricks = todasParticipacoes.filter(p => 
        String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM'
    ).length;
    
    const chelems = todasParticipacoes.filter(p => 
        String(p['Chelem'] || '').trim().toUpperCase() === 'SIM'
    ).length;
    
    // Get all pilots for ranking
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    
    // Helper to create ranking badge with click handler
    const createRankBadge = (currentValue, allPilotos, statGetter, statName, formatValue, cardId) => {
        if (corridas < 25) return; // Não mostrar ranking para pilotos com menos de 25 corridas
        if (currentValue === 0) return;
        
        const sorted = allPilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25) // Apenas pilotos com 25+ corridas
            .map(p => ({ 
                name: p['Piloto'] || p['piloto'], 
                value: statGetter(p),
                corridas: parseInt(p['Corridas'] || 0)
            }))
            .filter(p => p.value > 0)
            .sort((a, b) => b.value - a.value);
        
        const rank = sorted.findIndex(p => p.value === currentValue) + 1;
        if (rank === 0) return;
        
        const top5 = sorted.slice(0, 5).map(p => ({
            name: p.name,
            value: formatValue(p.value),
            corridas: window.GripUtils.formatNumber(p.corridas)
        }));
        
        const badge = document.createElement('div');
        badge.className = 'stat-rank-badge';
        if (rank === 1) badge.classList.add('rank-1');
        else if (rank === 2) badge.classList.add('rank-2');
        else if (rank === 3) badge.classList.add('rank-3');
        badge.textContent = `${rank}º`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader(statName, top5);
        };
        
        const card = document.getElementById(cardId);
        if (card) {
            // Remove badge anterior se existir
            const oldBadge = card.querySelector('.stat-rank-badge');
            if (oldBadge) oldBadge.remove();
            card.appendChild(badge);
            card.classList.add('has-ranking');
        }
    };
    
    // Helper to remove ranking from card
    const removeRankingFromCard = (cardId) => {
        if (corridas < 25) {
            const card = document.getElementById(cardId);
            if (card) {
                card.classList.remove('has-ranking');
                // Não remove stat-card-clickable, apenas esconde o badge
                const badge = card.querySelector('.stat-rank-badge');
                if (badge) badge.remove();
            }
        }
    };
    
    // Display stats - lógica especial para títulos/eventos
    const statTitulosEl = getCachedElement('statTitulos');
    const cardTitulosEl = document.getElementById('cardTitulos');
    
    if (titulos === 0 && totalEventos > 0) {
        // Mostrar eventos ao invés de títulos
        statTitulosEl.textContent = window.GripUtils.formatNumber(totalEventos);
        const labelEl = cardTitulosEl.querySelector('.stat-label');
        if (labelEl) labelEl.textContent = 'Eventos';
        const iconEl = cardTitulosEl.querySelector('.stat-icon');
        if (iconEl) iconEl.textContent = '⭐';
        // Não criar badge de ranking para eventos
    } else {
        // Mostrar títulos normalmente
        statTitulosEl.textContent = window.GripUtils.formatNumber(titulos);
        const labelEl = cardTitulosEl.querySelector('.stat-label');
        if (labelEl) labelEl.textContent = 'Títulos';
        const iconEl = cardTitulosEl.querySelector('.stat-icon');
        if (iconEl) iconEl.textContent = '🏆';
        
        createRankBadge(titulos, pilotos, p => {
            // Calcular títulos únicos para cada piloto
            const pNome = p['Piloto'] || p['piloto'] || '';
            const pParticipacoes = participacoesData.filter(part => 
                isValidParticipacao(part) &&
                (part['Piloto'] || part['piloto'] || '').toLowerCase() === pNome.toLowerCase()
            );
            const pCampeonatosPiloto = pParticipacoes.filter(c => String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM');
            const pCampeonatosConstrutores = pParticipacoes.filter(c => {
                const construtores = String(c['Construtores'] || '').trim().toUpperCase();
                return construtores === 'SIM' || construtores === 'TIME';
            });
            const pTitulosPiloto = new Set(pCampeonatosPiloto.map(c => `PILOTO|||${c['Liga']}|||${c['Temporada']}|||${c['Categoria']}`));
            const pTitulosConstrutores = new Set(pCampeonatosConstrutores.map(c => `CONSTRUTOR|||${c['Liga']}|||${c['Temporada']}|||${c['Categoria']}`));
            return pTitulosPiloto.size + pTitulosConstrutores.size;
        }, 'Títulos', v => window.GripUtils.formatNumber(v), 'cardTitulos');
    }
    
    const corridasEl = getCachedElement('statCorridas');
    corridasEl.textContent = window.GripUtils.formatNumber(corridas);
    createRankBadge(corridas, pilotos, p => parseInt(p['Corridas'] || 0), 'Corridas', v => window.GripUtils.formatNumber(v), 'cardCorridas');
    
    const vitoriasEl = getCachedElement('statVitorias');
    vitoriasEl.textContent = window.GripUtils.formatNumber(vitorias);
    createRankBadge(vitorias, pilotos, p => parseInt(p['P1'] || p['Vitórias'] || p['vitorias'] || 0), 'Vitórias', v => window.GripUtils.formatNumber(v), 'cardVitorias');
    
    const podiosEl = getCachedElement('statPodios');
    podiosEl.textContent = window.GripUtils.formatNumber(podios);
    createRankBadge(podios, pilotos, p => parseInt(p['Pódios'] || p['Podios'] || p['podios'] || 0), 'Pódios', v => window.GripUtils.formatNumber(v), 'cardPodios');
    
    const polesEl = getCachedElement('statPoles');
    polesEl.textContent = window.GripUtils.formatNumber(poles);
    createRankBadge(poles, pilotos, p => parseInt(p['Poles'] || p['poles'] || 0), 'Poles', v => window.GripUtils.formatNumber(v), 'cardPoles');
    
    const fastLapsEl = getCachedElement('statFastLaps');
    fastLapsEl.textContent = window.GripUtils.formatNumber(fastLaps);
    createRankBadge(fastLaps, pilotos, p => parseInt(p['Fast Laps'] || p['fast_laps'] || 0), 'Fast Laps', v => window.GripUtils.formatNumber(v), 'cardFastlaps');
    
    getCachedElement('statHatTricks').textContent = window.GripUtils.formatNumber(hatTricks);
    createRankBadge(hatTricks, pilotos, p => {
        // Calcular hat-tricks para cada piloto
        const pNome = p['Piloto'] || p['piloto'] || '';
        const pParticipacoes = participacoesData.filter(part => 
            isValidParticipacao(part) &&
            (part['Piloto'] || part['piloto'] || '').toLowerCase() === pNome.toLowerCase()
        );
        return pParticipacoes.filter(part => String(part['Hat-Trick'] || '').trim().toUpperCase() === 'SIM').length;
    }, 'Hat-tricks', v => window.GripUtils.formatNumber(v), 'cardHattricks');
    
    getCachedElement('statChelems').textContent = window.GripUtils.formatNumber(chelems);
    createRankBadge(chelems, pilotos, p => {
        // Calcular chelems para cada piloto
        const pNome = p['Piloto'] || p['piloto'] || '';
        const pParticipacoes = participacoesData.filter(part => 
            isValidParticipacao(part) &&
            (part['Piloto'] || part['piloto'] || '').toLowerCase() === pNome.toLowerCase()
        );
        return pParticipacoes.filter(part => String(part['Chelem'] || '').trim().toUpperCase() === 'SIM').length;
    }, 'Chelems', v => window.GripUtils.formatNumber(v), 'cardChelems');
    
    // Remove ranking indicators from cards without rankings (< 25 corridas)
    if (corridas < 25) {
        ['cardTitulos', 'cardCorridas', 'cardVitorias', 'cardPodios', 'cardPoles', 'cardFastlaps', 'cardHattricks', 'cardChelems'].forEach(removeRankingFromCard);
    }
    
    // Remove seta e clique quando valor é 0 (sem dados para mostrar)
    const checkAndDisableCard = (cardId, value) => {
        if (value === 0) {
            const card = document.getElementById(cardId);
            if (card) {
                card.classList.remove('stat-card-clickable');
                card.classList.add('no-ranking');
                card.style.pointerEvents = 'none';
                const expandIcon = card.querySelector('.stat-expand-icon');
                if (expandIcon) expandIcon.style.display = 'none';
            }
        }
    };
    
    // Para títulos, verificar ambos títulos e eventos
    checkAndDisableCard('cardTitulos', titulos + totalEventos);
    checkAndDisableCard('cardVitorias', vitorias);
    checkAndDisableCard('cardPodios', podios);
    checkAndDisableCard('cardPoles', poles);
    checkAndDisableCard('cardFastlaps', fastLaps);
    checkAndDisableCard('cardHattricks', hatTricks);
    checkAndDisableCard('cardChelems', chelems);
}

// Display temporadas
function displayTemporadas() {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    if (pilotoParticipacoes.length === 0) {
        document.getElementById('temporadasContainer').innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5);">Nenhuma participação encontrada</p>';
        return;
    }
    
    // Group by ano
    const anosMap = {};
    pilotoParticipacoes.forEach(p => {
        const ano = p['Ano'] || 'Desconhecido';
        if (!anosMap[ano]) {
            anosMap[ano] = [];
        }
        anosMap[ano].push(p);
    });
    
    // Sort anos (most recent first)
    const anos = Object.keys(anosMap).sort((a, b) => {
        const yearA = parseInt(a) || 0;
        const yearB = parseInt(b) || 0;
        return yearB - yearA;
    });
    
    const html = anos.map((ano, anoIndex) => {
        const corridasDoAno = anosMap[ano];
        
        // Group by temporada within this year
        const temporadasMap = {};
        corridasDoAno.forEach(p => {
            const temporada = p['Temporada'] || 'Desconhecida';
            if (!temporadasMap[temporada]) {
                temporadasMap[temporada] = [];
            }
            temporadasMap[temporada].push(p);
        });
        
        const temporadas = Object.keys(temporadasMap);
        const totalCorridas = corridasDoAno.length;
        const totalVitorias = corridasDoAno.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final.includes('1º');
        }).length;
        const totalPodios = corridasDoAno.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final === '2' || final === '3' ||
                   final.includes('1º') || final.includes('2º') || final.includes('3º');
        }).length;
        const totalPoles = corridasDoAno.filter(c => {
            const pole = String(c['Pole'] || '').trim().toLowerCase();
            return pole === 'sim';
        }).length;
        const totalFastLaps = corridasDoAno.filter(c => {
            const bestLap = String(c['Best Lap'] || '').trim().toLowerCase();
            return bestLap === 'sim';
        }).length;
        
        // Check for championships - count how many
        const qtdCampeonatosPiloto = corridasDoAno.filter(c => {
            const campeao = String(c['Piloto Campeao'] || '').trim().toUpperCase();
            return campeao === 'SIM';
        }).length;
        const qtdCampeonatosConstrutores = corridasDoAno.filter(c => {
            const construtores = String(c['Construtores'] || '').trim().toUpperCase();
            return construtores === 'SIM' || construtores === 'TIME';
        }).length;
        
        return `
            <div class="ano-item-wrapper">
                <div class="ano-item" onclick="toggleAno(this)">
                    <div class="ano-header-left">
                        <span class="ano-nome">${ano} ${'🏆'.repeat(qtdCampeonatosPiloto)}${'👥'.repeat(qtdCampeonatosConstrutores)}</span>
                        <span class="ano-info">${temporadas.length} ${temporadas.length === 1 ? 'temporada' : 'temporadas'} • ${totalCorridas} ${totalCorridas === 1 ? 'corrida' : 'corridas'}</span>
                    </div>
                    <div class="ano-stats-mini">
                        ${totalVitorias > 0 ? `<span class="ano-stat-mini">🥇 ${totalVitorias}</span>` : ''}
                        ${totalPodios > 0 ? `<span class="ano-stat-mini">🏅 ${totalPodios}</span>` : ''}
                        ${totalPoles > 0 ? `<span class="ano-stat-mini">🚩 ${totalPoles}</span>` : ''}
                        ${totalFastLaps > 0 ? `<span class="ano-stat-mini">⚡ ${totalFastLaps}</span>` : ''}
                    </div>
                    <div class="ano-expand">▼</div>
                </div>
                <div class="ano-temporadas" id="anoTemporadas-${anoIndex}">
                    ${temporadas.map((temporada, tempIndex) => {
                        const corridas = temporadasMap[temporada];
                        
                        const vitorias = corridas.filter(c => {
                            const final = String(c['Final'] || '').trim();
                            return final === '1' || final.includes('1º');
                        }).length;
                        
                        const podios = corridas.filter(c => {
                            const final = String(c['Final'] || '').trim();
                            return final === '1' || final === '2' || final === '3' ||
                                   final.includes('1º') || final.includes('2º') || final.includes('3º');
                        }).length;
                        
                        const poles = corridas.filter(c => {
                            const pole = String(c['Pole'] || '').trim().toLowerCase();
                            return pole === 'sim';
                        }).length;
                        
                        const fastLaps = corridas.filter(c => {
                            const bestLap = String(c['Best Lap'] || '').trim().toLowerCase();
                            return bestLap === 'sim';
                        }).length;
                                                // Check for championships in this season - count how many
                        const qtdCampeonatosPiloto = corridas.filter(c => {
                            const campeao = String(c['Piloto Campeao'] || '').trim().toUpperCase();
                            return campeao === 'SIM';
                        }).length;
                        const qtdCampeonatosConstrutores = corridas.filter(c => {
                            const construtores = String(c['Construtores'] || '').trim().toUpperCase();
                            return construtores === 'SIM' || construtores === 'TIME';
                        }).length;
                                                const dnfs = corridas.filter(c => {
                            const final = String(c['Final'] || '').trim().toUpperCase();
                            return final.includes('DNF') || final.includes('ABANDONOU') || final.includes('ABANDON');
                        }).length;
                        
                        const corridasHtml = corridas.map(c => {
                            const pistaOriginal = c['Pista'] || 'Desconhecida';
                            const pista = normalizeCircuitName(pistaOriginal);
                            const final = c['Final'] || 'N/A';
                            const liga = c['Liga'] || 'N/A';
                            const categoria = c['Categoria'] || '';
                            const transmissao = c['Link Transmissao'] || '';
                            const transmissaoLink = renderTransmissionLink(transmissao);
                            const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
                            const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
                            const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
                            const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                            const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta R\u00e1pida">⚡</span>' : '';
                            const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick: Pole + Vitória + Volta Rápida">🎩</span>' : '';
                            const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem: Pole + Vitória + Volta Rápida + Liderou todas as voltas">👑</span>' : '';
                            const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campe\u00e3o de Pilotos">🏆</span>' : '';
                            const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                            const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campe\u00e3o de Construtores">👥</span>' : '';
                            
                            let resultClass = '';
                            if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                            else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                            else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                            else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                            
                            return `
                                <div class="corrida-item" onclick="openCorridaModal(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c)}' style="cursor: pointer;">
                                    <div class="corrida-info">
                                        <span class="corrida-resultado ${resultClass}">${formatPosition(final)}</span>
                                    </div>
                                    <div class="corrida-principal">
                                        <div class="corrida-pista">${pista}${transmissaoLink ? ' ' + transmissaoLink : ''}</div>
                                        <div class="corrida-liga-categoria">
                                            ${formatLiga(liga, 'corrida-liga')}
                                            ${categoria ? `<span class="corrida-categoria">${categoria}</span>` : ''}
                                        </div>
                                    </div>
                                    <span class="corrida-badges">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}${campeonatoPiloto}${campeonatoConstrutores}</span>
                                </div>
                            `;
                        }).join('');
                        
                        return `
                            <div class="temporada-item-wrapper">
                                <div class="temporada-item" onclick="toggleTemporada(this)">
                                    <div class="temporada-header-left">
                                        <span class="temporada-nome">${temporada} ${'🏆'.repeat(qtdCampeonatosPiloto)}${'👥'.repeat(qtdCampeonatosConstrutores)}</span>
                                        <span class="temporada-corridas">${corridas.length} corridas</span>
                                    </div>
                                    <div class="temporada-stats-mini">
                                        ${vitorias > 0 ? `<span>🥇 ${vitorias}</span>` : ''}
                                        ${podios > 0 ? `<span>🏅 ${podios}</span>` : ''}
                                        ${poles > 0 ? `<span>🚩 ${poles}</span>` : ''}
                                        ${fastLaps > 0 ? `<span>⚡ ${fastLaps}</span>` : ''}
                                    </div>
                                    <div class="temporada-toggle">▼</div>
                                </div>
                                <div class="temporada-corridas-list">
                                    ${corridasHtml}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('temporadasContainer').innerHTML = html;
}

// Toggle ano expansion
function toggleAno(element) {
    const wrapper = element.closest('.ano-item-wrapper');
    const temporadas = wrapper.querySelector('.ano-temporadas');
    const expand = element.querySelector('.ano-expand');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        temporadas.style.maxHeight = temporadas.scrollHeight + 'px';
    } else {
        expand.style.transform = 'rotate(0deg)';
        temporadas.style.maxHeight = '0';
    }
}

// Toggle temporada expansion
function toggleTemporada(element) {
    const wrapper = element.closest('.temporada-item-wrapper');
    const corridasList = wrapper.querySelector('.temporada-corridas-list');
    const toggle = element.querySelector('.temporada-toggle');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        corridasList.style.maxHeight = corridasList.scrollHeight + 'px';
        toggle.style.transform = 'rotate(180deg)';
        
        // Update parent ano-temporadas height with buffer
        const updateParentHeight = () => {
            const parentTemporadas = wrapper.closest('.ano-temporadas');
            if (parentTemporadas) {
                parentTemporadas.style.maxHeight = (parentTemporadas.scrollHeight + 100) + 'px';
            }
        };
        
        // Update multiple times to ensure proper expansion
        setTimeout(updateParentHeight, 50);
        setTimeout(updateParentHeight, 100);
        setTimeout(updateParentHeight, 200);
        setTimeout(updateParentHeight, 450);
    } else {
        corridasList.style.maxHeight = '0';
        toggle.style.transform = 'rotate(0deg)';
        
        // Update parent ano-temporadas height after collapse
        setTimeout(() => {
            const parentTemporadas = wrapper.closest('.ano-temporadas');
            if (parentTemporadas) {
                parentTemporadas.style.maxHeight = parentTemporadas.scrollHeight + 'px';
            }
        }, 450);
    }
}

// Toggle titulo detail expansion
function toggleTituloDetail(id) {
    const detailElement = document.getElementById(`tituloDetail-${id}`);
    const cardElement = detailElement.previousElementSibling;
    const expandIcon = cardElement.querySelector('.titulo-expand');
    
    if (detailElement.classList.contains('expanded')) {
        detailElement.classList.remove('expanded');
        detailElement.style.maxHeight = '0';
        expandIcon.style.transform = 'rotate(0deg)';
        cardElement.classList.remove('active');
    } else {
        // Fechar outros títulos expandidos
        document.querySelectorAll('.titulo-corridas-list.expanded').forEach(el => {
            el.classList.remove('expanded');
            el.style.maxHeight = '0';
            const prevCard = el.previousElementSibling;
            if (prevCard) {
                const icon = prevCard.querySelector('.titulo-expand');
                if (icon) icon.style.transform = 'rotate(0deg)';
                prevCard.classList.remove('active');
            }
        });
        
        detailElement.classList.add('expanded');
        // Usar um valor muito alto para garantir que todo conteúdo seja visível
        detailElement.style.maxHeight = '5000px';
        expandIcon.style.transform = 'rotate(180deg)';
        cardElement.classList.add('active');
        
        // Scroll suave até o card
        setTimeout(() => {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
    
    // Recalcular altura do container pai statDetailTitulos
    setTimeout(() => {
        const statDetailSection = document.getElementById('statDetailTitulos');
        if (statDetailSection && statDetailSection.classList.contains('active')) {
            statDetailSection.style.maxHeight = 'none';
        }
    }, 50);
}

// Display campeonatos
function displayCampeonatos() {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    // Group by liga and collect all championships
    const campeonatosMap = {};
    pilotoParticipacoes.forEach(p => {
        const liga = p['Liga'] || 'Desconhecido';
        const temporada = p['Temporada'] || '';
        const ano = p['Ano'] || '';
        const categoria = p['Categoria'] || '';
        const key = `${liga}|||${temporada}|||${categoria}`;
        
        if (!campeonatosMap[liga]) {
            campeonatosMap[liga] = {
                nome: liga,
                campeonatos: [],
                campeonatosSet: new Set()
            };
        }
        
        if (!campeonatosMap[liga].campeonatosSet.has(key)) {
            campeonatosMap[liga].campeonatosSet.add(key);
            campeonatosMap[liga].campeonatos.push({
                temporada: temporada,
                ano: ano,
                categoria: categoria,
                corridas: 0
            });
        }
        
        // Count races for this championship
        const idx = campeonatosMap[liga].campeonatos.findIndex(c => 
            c.temporada === temporada && c.categoria === categoria
        );
        if (idx !== -1) {
            campeonatosMap[liga].campeonatos[idx].corridas++;
        }
    });
    
    // Convert to array and sort by championships count
    const campeonatos = Object.values(campeonatosMap)
        .map(c => {
            // Count championships for this league
            const corridasDaLiga = pilotoParticipacoes.filter(p => 
                String(p.Liga || '').trim() === c.nome
            );
            
            const qtdCampeonatosPiloto = corridasDaLiga.filter(corrida => {
                const campeao = String(corrida['Piloto Campeao'] || '').trim().toUpperCase();
                return campeao === 'SIM';
            }).length;
            
            const qtdCampeonatosConstrutores = corridasDaLiga.filter(corrida => {
                const campeao = String(corrida['Construtores'] || '').trim().toUpperCase();
                return campeao === 'SIM' || campeao === 'TIME';
            }).length;
            
            // Count stats for this league
            const vitorias = corridasDaLiga.filter(c => {
                const final = String(c['Final'] || '').trim();
                return final === '1' || final.includes('1º');
            }).length;
            
            const podios = corridasDaLiga.filter(c => {
                const final = String(c['Final'] || '').trim();
                return final === '1' || final === '2' || final === '3' ||
                       final.includes('1º') || final.includes('2º') || final.includes('3º');
            }).length;
            
            const poles = corridasDaLiga.filter(c => 
                String(c['Pole'] || '').trim().toUpperCase() === 'SIM'
            ).length;
            
            const fastLaps = corridasDaLiga.filter(c => 
                String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM'
            ).length;
            
            const hatTricks = corridasDaLiga.filter(c => 
                String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM'
            ).length;
            
            const chelems = corridasDaLiga.filter(c => 
                String(c['Chelem'] || '').trim().toUpperCase() === 'SIM'
            ).length;
            
            return {
                nome: c.nome,
                campeonatos: c.campeonatos.sort((a, b) => {
                    const anoA = parseInt(a.ano) || 0;
                    const anoB = parseInt(b.ano) || 0;
                    return anoB - anoA;
                }),
                total: c.campeonatos.length,
                qtdCampeonatosPiloto,
                qtdCampeonatosConstrutores,
                vitorias,
                podios,
                poles,
                fastLaps,
                hatTricks,
                chelems
            };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 20); // Top 20
    
    const html = campeonatos.map((c, index) => {
        // Build stats summary
        const statsSummary = [];
        if (c.vitorias > 0) statsSummary.push(`🥇 ${c.vitorias}`);
        if (c.hatTricks > 0) statsSummary.push(`🎩 ${c.hatTricks}`);
        if (c.chelems > 0) statsSummary.push(`👑 ${c.chelems}`);
        if (c.poles > 0) statsSummary.push(`🚩 ${c.poles}`);
        if (c.fastLaps > 0) statsSummary.push(`⚡ ${c.fastLaps}`);
        if (c.podios > 0) statsSummary.push(`🏅 ${c.podios}`);
        
        return `
        <div class="campeonato-item-wrapper">
            <div class="campeonato-item" onclick="toggleCampeonato(this)">
                <div class="campeonato-header-left">
                    <span class="campeonato-nome-wrapper">${formatLiga(c.nome, 'campeonato-liga-logo')} ${'🏆'.repeat(c.qtdCampeonatosPiloto)}${'👥'.repeat(c.qtdCampeonatosConstrutores)}</span>
                    <span class="campeonato-participacoes">${c.total} ${c.total === 1 ? 'campeonato' : 'campeonatos'}${statsSummary.length > 0 ? ' • ' + statsSummary.join('  ') : ''}</span>
                </div>
                <div class="campeonato-expand">▼</div>
            </div>
            <div class="campeonato-detail" id="campeonatoDetail-${index}">
                ${c.campeonatos.map((camp, campIdx) => {
                    // Detect championships for this season - count how many
                    const corridasCamp = pilotoParticipacoes.filter(p => 
                        String(p.Liga || '').trim() === c.nome &&
                        String(p.Temporada || '').trim() === camp.temporada &&
                        String(p.Categoria || '').trim() === (camp.categoria || '')
                    );
                    
                    const qtdCampeonatosPiloto = corridasCamp.filter(corrida => {
                        const campeao = String(corrida['Piloto Campeao'] || '').trim().toUpperCase();
                        return campeao === 'SIM';
                    }).length;
                    
                    const qtdCampeonatosConstrutores = corridasCamp.filter(corrida => {
                        const campeao = String(corrida['Construtores'] || '').trim().toUpperCase();
                        return campeao === 'SIM' || campeao === 'TIME';
                    }).length;
                    
                    // Count stats for this championship
                    const vitorias = corridasCamp.filter(corrida => {
                        const final = String(corrida['Final'] || '').trim();
                        return final === '1' || final.includes('1º');
                    }).length;
                    
                    const poles = corridasCamp.filter(corrida => 
                        String(corrida['Pole'] || '').trim().toUpperCase() === 'SIM'
                    ).length;
                    
                    const fastLaps = corridasCamp.filter(corrida => 
                        String(corrida['Best Lap'] || '').trim().toUpperCase() === 'SIM'
                    ).length;
                    
                    const hatTricks = corridasCamp.filter(corrida => 
                        String(corrida['Hat-Trick'] || '').trim().toUpperCase() === 'SIM'
                    ).length;
                    
                    const chelems = corridasCamp.filter(corrida => 
                        String(corrida['Chelem'] || '').trim().toUpperCase() === 'SIM'
                    ).length;
                    
                    const podios = corridasCamp.filter(corrida => {
                        const final = String(corrida['Final'] || '').trim();
                        return final === '1' || final === '2' || final === '3' ||
                               final.includes('1º') || final.includes('2º') || final.includes('3º');
                    }).length;
                    
                    // Build stats summary for this championship
                    const campStatsSummary = [];
                    if (qtdCampeonatosPiloto > 0) campStatsSummary.push(`🏆 ${qtdCampeonatosPiloto}`);
                    if (qtdCampeonatosConstrutores > 0) campStatsSummary.push(`👥 ${qtdCampeonatosConstrutores}`);
                    if (vitorias > 0) campStatsSummary.push(`🥇 ${vitorias}`);
                    if (hatTricks > 0) campStatsSummary.push(`🎩 ${hatTricks}`);
                    if (chelems > 0) campStatsSummary.push(`👑 ${chelems}`);
                    if (poles > 0) campStatsSummary.push(`🚩 ${poles}`);
                    if (fastLaps > 0) campStatsSummary.push(`⚡ ${fastLaps}`);
                    if (podios > 0) campStatsSummary.push(`🏅 ${podios}`);
                    
                    return `
                    <div class="campeonato-subitem-wrapper">
                        <div class="campeonato-subitem" onclick="toggleCampeonatoCorridas(this, '${c.nome}', '${camp.temporada}', '${camp.categoria}')">
                            <div class="campeonato-subitem-info">
                                <span class="campeonato-temporada">${camp.temporada || 'N/A'}</span>
                                ${camp.categoria ? `<span class="campeonato-categoria">${camp.categoria}</span>` : ''}
                            </div>
                            <div class="campeonato-subitem-right">
                                <span class="campeonato-corridas">${camp.corridas} ${camp.corridas === 1 ? 'corrida' : 'corridas'}${campStatsSummary.length > 0 ? ' • ' + campStatsSummary.join(' ') : ''}</span>
                                <div class="campeonato-subexpand">▼</div>
                            </div>
                        </div>
                        <div class="campeonato-corridas-list" id="campeonatoCorridas-${index}-${campIdx}"></div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }).join('');
    
    document.getElementById('campeonatosContainer').innerHTML = html || '<p style="text-align: center; color: rgba(255,255,255,0.5);">Nenhum campeonato encontrado</p>';
}

// Toggle campeonato detail
function toggleCampeonato(element) {
    const wrapper = element.closest('.campeonato-item-wrapper');
    const detail = wrapper.querySelector('.campeonato-detail');
    const expand = element.querySelector('.campeonato-expand');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        detail.style.maxHeight = detail.scrollHeight + 'px';
    } else {
        expand.style.transform = 'rotate(0deg)';
        detail.style.maxHeight = '0';
    }
}

// Toggle campeonato corridas detail
function toggleCampeonatoCorridas(element, liga, temporada, categoria) {
    const wrapper = element.closest('.campeonato-subitem-wrapper');
    const corridasList = wrapper.querySelector('.campeonato-corridas-list');
    const expand = element.querySelector('.campeonato-subexpand');
    
    const isActive = wrapper.classList.toggle('active');
    
    if (isActive) {
        expand.style.transform = 'rotate(180deg)';
        
        // Load corridas if not loaded yet
        if (!corridasList.hasAttribute('data-loaded')) {
            const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
            const corridas = participacoesData.filter(p => 
                isValidParticipacao(p) &&
                (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase() &&
                (p['Liga'] || '') === liga &&
                (p['Temporada'] || '') === temporada &&
                (p['Categoria'] || '') === categoria
            );
            
            const corridasHtml = corridas.map(c => {
                const pistaOriginal = c['Pista'] || 'Desconhecida';
                const pista = normalizeCircuitName(pistaOriginal);
                const final = c['Final'] || 'N/A';
                const transmissao = c['Link Transmissao'] || '';
                const transmissaoLink = renderTransmissionLink(transmissao);
                const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
                const vitoria = finalNum === 1 ? '<span title="Vitória">🥇</span>' : '';
                const podio = (finalNum === 2 || finalNum === 3) ? '<span title="Pódio">🏅</span>' : '';
                const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta R\u00e1pida">⚡</span>' : '';
                const hatTrick = String(c['Hat-Trick'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Hat-trick: Pole + Vit\u00f3ria + Volta R\u00e1pida">🎩</span>' : '';
                const chelem = String(c['Chelem'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Chelem: Pole + Vit\u00f3ria + Volta R\u00e1pida + Liderou todas as voltas">👑</span>' : '';
                const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campe\u00e3o de Pilotos">🏆</span>' : '';
                const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campe\u00e3o de Construtores">👥</span>' : '';
                
                let resultClass = '';
                if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                
                return `
                    <div class="campeonato-corrida-item" onclick="openCorridaModal(this.getAttribute('data-corrida'))" data-corrida='${JSON.stringify(c)}' style="cursor: pointer;">
                        <span class="corrida-resultado ${resultClass}">${formatPosition(final)}</span>
                        <span class="campeonato-corrida-pista">${pista}${transmissaoLink ? ' ' + transmissaoLink : ''}</span>
                        <span class="campeonato-corrida-badges">${vitoria}${podio}${pole}${bestLap}${hatTrick}${chelem}${campeonatoPiloto}${campeonatoConstrutores}</span>
                    </div>
                `;
            }).join('');
            
            corridasList.innerHTML = corridasHtml || '<p style="text-align: center; color: #999; padding: 10px;">Nenhuma corrida encontrada</p>';
            corridasList.setAttribute('data-loaded', 'true');
        }
        
        setTimeout(() => {
            corridasList.style.maxHeight = corridasList.scrollHeight + 'px';
            
            // Update parent campeonato-detail maxHeight with buffer
            const updateParentHeight = () => {
                const parentDetail = wrapper.closest('.campeonato-detail');
                if (parentDetail) {
                    // Add buffer to accommodate all content
                    parentDetail.style.maxHeight = (parentDetail.scrollHeight + 100) + 'px';
                }
            };
            
            // Update multiple times to ensure proper expansion
            setTimeout(updateParentHeight, 50);
            setTimeout(updateParentHeight, 100);
            setTimeout(updateParentHeight, 200);
            setTimeout(updateParentHeight, 450);
        }, 10);
    } else {
        expand.style.transform = 'rotate(0deg)';
        corridasList.style.maxHeight = '0';
        
        // Update parent campeonato-detail maxHeight after collapse
        setTimeout(() => {
            const parentDetail = wrapper.closest('.campeonato-detail');
            if (parentDetail) {
                parentDetail.style.maxHeight = parentDetail.scrollHeight + 'px';
            }
        }, 450);
    }
}

// Display advanced stats
async function displayAdvancedStats() {
    const corridas = parseInt(pilotoData['Corridas'] || pilotoData['corridas'] || 0);
    const vitorias = parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || pilotoData['vitorias'] || 0);
    const podios = parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || pilotoData['podios'] || 0);
    const top10 = parseInt(pilotoData['Top 10'] || pilotoData['top_10'] || 0);
    const abandonos = parseInt(pilotoData['Abandonos'] || pilotoData['abandonos'] || 0);
    
    const taxaPodios = corridas > 0 ? ((podios / corridas) * 100).toFixed(1) + '%' : '-';
    const taxaVitorias = corridas > 0 ? ((vitorias / corridas) * 100).toFixed(1) + '%' : '-';
    const taxaTop10 = corridas > 0 ? ((top10 / corridas) * 100).toFixed(1) + '%' : '-';
    
    const etapasPorPodio = pilotoData['Etapas Por Pódio'] || pilotoData['etapas_por_podio'] || 
                           (podios > 0 ? (corridas / podios).toFixed(1) : '-');
    const etapasPorVitoria = pilotoData['Etapas Por Vitória'] || pilotoData['etapas_por_vitoria'] || 
                             (vitorias > 0 ? (corridas / vitorias).toFixed(1) : '-');
    
    // Get all pilots for ranking calculation
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    
    // Calculate percentage rankings
    const calcPercentageRanking = (statGetter, lowerIsBetter = false) => {
        if (corridas < 25) return '-'; // Não mostrar ranking para pilotos com menos de 25 corridas
        if (corridas === 0) return '-';
        const currentValue = statGetter(pilotoData);
        const currentCorridas = parseInt(pilotoData['Corridas'] || 0);
        if (currentCorridas === 0 || currentValue === 0) return '-';
        
        const currentRate = (currentValue / currentCorridas) * 100;
        
        const rates = pilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25) // Apenas pilotos com 25+ corridas
            .map(p => {
                const pCorridas = parseInt(p['Corridas'] || 0);
                const pStat = statGetter(p);
                return pCorridas > 0 ? (pStat / pCorridas) * 100 : 0;
            })
            .filter(r => r > 0)
            .sort((a, b) => lowerIsBetter ? a - b : b - a);
        
        return rates.filter(r => lowerIsBetter ? r < currentRate : r > currentRate).length + 1;
    };
    
    // Calculate absolute value rankings
    const calcRanking = (statGetter, lowerIsBetter = false) => {
        if (corridas < 25) return '-'; // Não mostrar ranking para pilotos com menos de 25 corridas
        const currentValue = statGetter(pilotoData);
        if (currentValue === 0 || currentValue === '-') return '-';
        
        const sorted = pilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25) // Apenas pilotos com 25+ corridas
            .map(p => statGetter(p))
            .filter(v => v > 0 && v !== '-')
            .sort((a, b) => lowerIsBetter ? a - b : b - a);
        
        return sorted.indexOf(currentValue) + 1;
    };
    
    // Find leaders for each stat
    const findLeader = (statGetter, formatFn) => {
        const sorted = pilotos
            .map(p => ({ name: p['Piloto'] || p['piloto'], value: statGetter(p) }))
            .filter(p => p.value > 0)
            .sort((a, b) => b.value - a.value);
        return sorted[0] ? { name: sorted[0].name, value: formatFn(sorted[0].value) } : null;
    };
    
    const rankTaxaPodios = calcPercentageRanking(p => parseInt(p['Pódios'] || p['Podios'] || p['podios'] || 0));
    const rankTaxaVitorias = calcPercentageRanking(p => parseInt(p['P1'] || p['Vitórias'] || p['vitorias'] || 0));
    const rankTaxaAbandonos = calcPercentageRanking(p => parseInt(p['Abandonos'] || p['abandonos'] || 0), true); // Menor é melhor
    
    // Get top 5 for percentage stats
    const getTop5Percentage = (statGetter, formatFn, lowerIsBetter = false) => {
        const rates = pilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25) // Apenas pilotos com 25+ corridas
            .map(p => {
                const pCorridas = parseInt(p['Corridas'] || 0);
                const pStat = statGetter(p);
                const rate = pCorridas > 0 ? (pStat / pCorridas) * 100 : 0;
                return { name: p['Piloto'] || p['piloto'], value: rate, corridas: pCorridas };
            })
            .filter(r => r.value > 0)
            .sort((a, b) => lowerIsBetter ? a.value - b.value : b.value - a.value);
        return rates.slice(0, 5).map(p => ({
            name: p.name,
            value: formatFn(p.value),
            corridas: window.GripUtils.formatNumber(p.corridas)
        }));
    };
    
    const top5TaxaPodios = getTop5Percentage(p => parseInt(p['Pódios'] || p['Podios'] || p['podios'] || 0), v => v.toFixed(1) + '%');
    const top5TaxaVitorias = getTop5Percentage(p => parseInt(p['P1'] || p['Vitórias'] || p['vitorias'] || 0), v => v.toFixed(1) + '%');
    const top5TaxaTop10 = getTop5Percentage(p => parseInt(p['Top 10'] || p['top_10'] || 0), v => v.toFixed(1) + '%');
    const top5TaxaAbandonos = getTop5Percentage(p => parseInt(p['Abandonos'] || p['abandonos'] || 0), v => v.toFixed(1) + '%', true); // Menor é melhor
    
    // Get top 5 for etapas stats (menor é melhor)
    const getTop5Etapas = (statGetter, formatFn) => {
        const rates = pilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25)
            .map(p => {
                const pCorridas = parseInt(p['Corridas'] || 0);
                const pStat = statGetter(p);
                const rate = pStat > 0 ? pCorridas / pStat : 0;
                return { name: p['Piloto'] || p['piloto'], value: rate, corridas: pCorridas };
            })
            .filter(r => r.value > 0)
            .sort((a, b) => a.value - b.value); // Menor é melhor
        return rates.slice(0, 5).map(p => ({
            name: p.name,
            value: formatFn(p.value),
            corridas: window.GripUtils.formatNumber(p.corridas)
        }));
    };
    
    const top5EtapasPorPodio = getTop5Etapas(p => parseInt(p['Pódios'] || p['Podios'] || p['podios'] || 0), v => v.toFixed(1));
    const top5EtapasPorVitoria = getTop5Etapas(p => parseInt(p['P1'] || p['Vitórias'] || p['vitorias'] || 0), v => v.toFixed(1));
    
    // Calculate rankings for new stats
    const rankTaxaTop10 = calcPercentageRanking(p => parseInt(p['Top 10'] || p['top_10'] || 0));
    const rankEtapasPorPodio = podios > 0 ? (() => {
        if (corridas < 25) return '-';
        const currentRate = corridas / podios;
        const rates = pilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25)
            .map(p => {
                const pCorridas = parseInt(p['Corridas'] || 0);
                const pPodios = parseInt(p['Pódios'] || p['Podios'] || p['podios'] || 0);
                return pPodios > 0 ? pCorridas / pPodios : 0;
            })
            .filter(r => r > 0)
            .sort((a, b) => a - b); // Menor é melhor
        return rates.filter(r => r < currentRate).length + 1;
    })() : '-';
    
    const rankEtapasPorVitoria = vitorias > 0 ? (() => {
        if (corridas < 25) return '-';
        const currentRate = corridas / vitorias;
        const rates = pilotos
            .filter(p => parseInt(p['Corridas'] || 0) >= 25)
            .map(p => {
                const pCorridas = parseInt(p['Corridas'] || 0);
                const pVitorias = parseInt(p['P1'] || p['Vitórias'] || p['vitorias'] || 0);
                return pVitorias > 0 ? pCorridas / pVitorias : 0;
            })
            .filter(r => r > 0)
            .sort((a, b) => a - b); // Menor é melhor
        return rates.filter(r => r < currentRate).length + 1;
    })() : '-';
    
    const taxaPodiosEl = document.getElementById('taxaPodios');
    taxaPodiosEl.textContent = taxaPodios;
    if (rankTaxaPodios !== '-' && top5TaxaPodios.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'rank-badge';
        badge.textContent = ` (${rankTaxaPodios}º)`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader('Taxa de Pódios', top5TaxaPodios);
        };
        taxaPodiosEl.appendChild(badge);
    }
    
    const taxaVitoriasEl = document.getElementById('taxaVitorias');
    taxaVitoriasEl.textContent = taxaVitorias;
    if (rankTaxaVitorias !== '-' && top5TaxaVitorias.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'rank-badge';
        badge.textContent = ` (${rankTaxaVitorias}º)`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader('Taxa de Vitórias', top5TaxaVitorias);
        };
        taxaVitoriasEl.appendChild(badge);
    }
    
    document.getElementById('taxaTop10').textContent = taxaTop10;
    if (rankTaxaTop10 !== '-' && top5TaxaTop10.length > 0) {
        const taxaTop10El = document.getElementById('taxaTop10');
        const badge = document.createElement('span');
        badge.className = 'rank-badge';
        if (rankTaxaTop10 === 1) badge.classList.add('rank-1');
        else if (rankTaxaTop10 === 2) badge.classList.add('rank-2');
        else if (rankTaxaTop10 === 3) badge.classList.add('rank-3');
        badge.textContent = ` (${rankTaxaTop10}º)`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader('Taxa de Top 10', top5TaxaTop10);
        };
        taxaTop10El.appendChild(badge);
    }
    
    document.getElementById('etapasPorPodio').textContent = etapasPorPodio;
    if (rankEtapasPorPodio !== '-' && top5EtapasPorPodio.length > 0) {
        const etapasPorPodioEl = document.getElementById('etapasPorPodio');
        const badge = document.createElement('span');
        badge.className = 'rank-badge';
        if (rankEtapasPorPodio === 1) badge.classList.add('rank-1');
        else if (rankEtapasPorPodio === 2) badge.classList.add('rank-2');
        else if (rankEtapasPorPodio === 3) badge.classList.add('rank-3');
        badge.textContent = ` (${rankEtapasPorPodio}º)`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader('Etapas por Pódio', top5EtapasPorPodio);
        };
        etapasPorPodioEl.appendChild(badge);
    }
    
    document.getElementById('etapasPorVitoria').textContent = etapasPorVitoria;
    if (rankEtapasPorVitoria !== '-' && top5EtapasPorVitoria.length > 0) {
        const etapasPorVitoriaEl = document.getElementById('etapasPorVitoria');
        const badge = document.createElement('span');
        badge.className = 'rank-badge';
        if (rankEtapasPorVitoria === 1) badge.classList.add('rank-1');
        else if (rankEtapasPorVitoria === 2) badge.classList.add('rank-2');
        else if (rankEtapasPorVitoria === 3) badge.classList.add('rank-3');
        badge.textContent = ` (${rankEtapasPorVitoria}º)`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader('Etapas por Vitória', top5EtapasPorVitoria);
        };
        etapasPorVitoriaEl.appendChild(badge);
    }
    
    const taxaAbandonos = corridas > 0 ? ((abandonos / corridas) * 100).toFixed(1) + '%' : '-';
    const abandonosEl = document.getElementById('abandonos');
    abandonosEl.textContent = taxaAbandonos;
    if (rankTaxaAbandonos !== '-' && top5TaxaAbandonos.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'rank-badge';
        badge.textContent = ` (${rankTaxaAbandonos}º)`;
        badge.title = 'Clique para ver o top 5';
        badge.onclick = (e) => {
            e.stopPropagation();
            showLeader('Taxa de Abandono', top5TaxaAbandonos);
        };
        abandonosEl.appendChild(badge);
    }
    
    // Ocultar estatísticas relacionadas a pódios se não houver pódios
    const statTaxaPodios = document.getElementById('statTaxaPodios');
    const statEtapasPorPodio = document.getElementById('statEtapasPorPodio');
    if (statTaxaPodios) statTaxaPodios.style.display = podios > 0 ? '' : 'none';
    if (statEtapasPorPodio) statEtapasPorPodio.style.display = podios > 0 ? '' : 'none';
    
    // Ocultar estatísticas relacionadas a vitórias se não houver vitórias
    const statTaxaVitorias = document.getElementById('statTaxaVitorias');
    const statEtapasPorVitoria = document.getElementById('statEtapasPorVitoria');
    if (statTaxaVitorias) statTaxaVitorias.style.display = vitorias > 0 ? '' : 'none';
    if (statEtapasPorVitoria) statEtapasPorVitoria.style.display = vitorias > 0 ? '' : 'none';
}

// Display recordes
function displayRecordes() {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
        isValidParticipacao(p) &&
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    if (pilotoParticipacoes.length === 0) {
        document.getElementById('recordesContainer').innerHTML = '<p class="loading-text">Sem dados suficientes</p>';
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
    
    // Count Hat-tricks and Chelems
    const hatTricks = pilotoParticipacoes.filter(p => 
        String(p['Hat-Trick'] || '').trim().toUpperCase() === 'SIM'
    ).length;
    
    const chelems = pilotoParticipacoes.filter(p => 
        String(p['Chelem'] || '').trim().toUpperCase() === 'SIM'
    ).length;
    
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
            dominioText = `${normalizeCircuitName(circuitosDominantes[0])} • ${maxVitoriasCircuito} 🥇`;
        } else if (circuitosDominantes.length === 2) {
            dominioText = `${normalizeCircuitName(circuitosDominantes[0])}, ${normalizeCircuitName(circuitosDominantes[1])} • ${maxVitoriasCircuito} 🥇`;
        } else if (circuitosDominantes.length > 2) {
            const todosCircuitos = circuitosDominantes.map(p => normalizeCircuitName(p)).join(', ');
            dominioText = `<span title="${todosCircuitos}">${circuitosDominantes.length} circuitos • ${maxVitoriasCircuito} 🥇</span>`;
        }
    }
    
    const html = `
        ${maxVitoriasConsecutivas === 0 && melhorResultado < 999 ? `
        <div class="recorde-item">
            <span class="recorde-label">🥇 Melhor Resultado</span>
            <span class="recorde-value">${melhorResultado}º</span>
        </div>` : ''}
        ${maxPodiosConsecutivos > 0 ? `
        <div class="recorde-item">
            <span class="recorde-label">🏅 Pódios Consecutivos</span>
            <span class="recorde-value">${maxPodiosConsecutivos}</span>
        </div>` : ''}
        ${maxVitoriasConsecutivas > 0 ? `
        <div class="recorde-item">
            <span class="recorde-label">🔥 Sequência de Vitórias</span>
            <span class="recorde-value">${maxVitoriasConsecutivas}</span>
        </div>` : ''}
        ${circuitosComVitoria > 0 ? `
        <div class="recorde-item">
            <span class="recorde-label">🗺️ Circuitos Vencidos</span>
            <span class="recorde-value">${circuitosComVitoria}</span>
        </div>` : ''}
        ${dominioText ? `
        <div class="recorde-item">
            <span class="recorde-label">🏁 Domínio</span>
            <span class="recorde-value">${dominioText}</span>
        </div>` : ''}
    `;
    
    document.getElementById('recordesContainer').innerHTML = html;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 Inicializando página de detalhes do piloto');
    loadPilotoData();
});

// Toggle stats comparison
function toggleStatsComparison() {
    const comparison = document.querySelector('.stats-comparison');
    const btn = document.querySelector('.toggle-comparison-btn');
    
    comparison.classList.toggle('hidden');
    btn.classList.toggle('active');
    
    if (comparison.classList.contains('hidden')) {
        btn.innerHTML = '<span class="toggle-icon">▼</span> Ver comparação com líderes';
    } else {
        btn.innerHTML = '<span class="toggle-icon">▼</span> Esconder comparação';
    }
}

// Toggle section visibility
function toggleSection(sectionId, button) {
    const section = document.getElementById(sectionId);
    const icon = button.querySelector('.toggle-icon');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        section.classList.remove('section-collapsed');
        icon.style.transform = 'rotate(180deg)';
        button.innerHTML = '<span class="toggle-icon" style="transform: rotate(180deg);">▼</span> ESCONDER';
    } else {
        section.style.display = 'none';
        section.classList.add('section-collapsed');
        icon.style.transform = 'rotate(0deg)';
        button.innerHTML = '<span class="toggle-icon">▼</span> MOSTRAR';
    }
}

// Open corrida details modal
function openCorridaModal(corridaJson) {
    const corrida = JSON.parse(corridaJson);
    
    const pista = corrida['Pista'] || 'N/A';
    const liga = corrida['Liga'] || 'N/A';
    const temporada = corrida['Temporada'] || 'N/A';
    const categoria = corrida['Categoria'] || '';
    const ano = corrida['Ano'] || 'N/A';
    const transmissao = corrida['Link Transmissao'] || '';
    
    // Parse múltiplos links de transmissão
    const transmissionLinks = parseTransmissionLinks(transmissao);
    const hasTransmission = transmissionLinks.length > 0;
    
    // Buscar todos os pilotos Grip que correram nesta mesma etapa
    const corridasNaEtapa = participacoesData.filter(p => {
        return isValidParticipacao(p) &&
               String(p['Liga'] || '').trim() === liga &&
               String(p['Temporada'] || '').trim() === temporada &&
               String(p['Categoria'] || '').trim() === categoria &&
               String(p['Pista'] || '').trim() === pista;
    });
    
    // Agrupar por piloto para evitar duplicatas (usando Map)
    const pilotosMap = new Map();
    corridasNaEtapa.forEach(p => {
        const nome = String(p['Piloto'] || '').trim();
        const final = String(p['Final'] || '').trim();
        const equipe = String(p['Equipe'] || '').trim();
        const finalNum = parseInt(String(final).replace(/[^\d]/g, '')) || 999;
        
        // Se já existe, manter o melhor resultado (menor número = melhor posição)
        if (pilotosMap.has(nome)) {
            const existing = pilotosMap.get(nome);
            // Se o resultado atual é melhor (menor número), substituir
            if (finalNum < existing.finalNum) {
                // Recalcular tudo com o novo resultado
            } else {
                // Manter o existente
                return;
            }
        }
        
        // Calcular badges
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
        
        pilotosMap.set(nome, { 
            nome, 
            final, 
            equipe, 
            finalNum, 
            resultClass,
            badges: vitoria + podio + pole + bestLap + hatTrick + chelem
        });
    });
    
    const outrosGripados = Array.from(pilotosMap.values()).sort((a, b) => a.finalNum - b.finalNum);
    
    // Converter link(s) do YouTube para embed (se houver)
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
            // Vídeo único - sem carrossel
            videoContent = `
                <div class="corrida-modal-video-container">
                    <iframe 
                        src="${embedUrls[0]}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        class="corrida-video-iframe">
                    </iframe>
                </div>
            `;
        } else {
            // Múltiplos vídeos - com carrossel
            const carouselId = 'modal-video-carousel';
            videoContent = `
                <div class="corrida-modal-video-carousel" id="${carouselId}">
                    <div class="corrida-modal-video-container">
                        <iframe 
                            src="${embedUrls[0]}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                            class="corrida-video-iframe modal-carousel-iframe">
                        </iframe>
                    </div>
                    <div class="modal-video-carousel-controls">
                        <button class="modal-carousel-btn modal-carousel-prev" onclick="changeModalVideo(-1)">◀ Anterior</button>
                        <span class="modal-carousel-counter">Vídeo <span class="current-video">1</span>/${embedUrls.length}</span>
                        <button class="modal-carousel-btn modal-carousel-next" onclick="changeModalVideo(1)">Próximo ▶</button>
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
        <div class="corrida-modal-overlay" onclick="closeCorridaModal()">
            <div class="corrida-modal corrida-modal-video corrida-modal-with-sidebar" onclick="event.stopPropagation()">
                <button class="corrida-modal-close" onclick="closeCorridaModal()">✕</button>
                
                <div class="corrida-modal-layout">
                    <div class="corrida-modal-main">
                        <div class="corrida-modal-header">
                            <h2 class="corrida-modal-title">${pista}</h2>
                            <div class="corrida-modal-subtitle">${formatLiga(liga, 'liga-display')} ${categoria ? '• ' + categoria : ''} • ${temporada} • ${ano}</div>
                        </div>
                        
                        ${videoContent}
                    </div>
                    
                    <div class="corrida-modal-sidebar">
                        <div class="corrida-sidebar-header">
                            <h3 class="corrida-sidebar-title">🏎️ Pilotos Grip Racing</h3>
                            <div class="corrida-sidebar-count">${outrosGripados.length} ${outrosGripados.length === 1 ? 'piloto' : 'pilotos'}</div>
                        </div>
                        
                        <div class="corrida-sidebar-list">
                            ${outrosGripados.map((piloto, index) => {
                                const isCurrentPiloto = piloto.nome === pilotoData['Piloto'];
                                const pilotoUrl = `piloto-detalhes.html?nome=${encodeURIComponent(piloto.nome)}`;
                                
                                return `
                                <div class="corrida-sidebar-item ${isCurrentPiloto ? 'current-piloto' : 'clickable-piloto'}" ${!isCurrentPiloto ? `onclick="window.location.href='${pilotoUrl}'"` : ''}>
                                    <div class="sidebar-item-position ${piloto.resultClass}">${formatPosition(piloto.final)}</div>
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

// Close corrida modal
function closeCorridaModal() {
    const modal = document.querySelector('.corrida-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Change video in modal carousel
function changeModalVideo(direction) {
    const carousel = document.getElementById('modal-video-carousel');
    if (!carousel) return;
    
    const dataEl = carousel.querySelector('.modal-carousel-data');
    const iframe = carousel.querySelector('.modal-carousel-iframe');
    const counterEl = carousel.querySelector('.current-video');
    
    const videos = dataEl.textContent.split('||');
    const currentSrc = iframe.getAttribute('src');
    let currentIndex = videos.indexOf(currentSrc);
    
    // Calculate new index with wrapping
    currentIndex = (currentIndex + direction + videos.length) % videos.length;
    
    // Update iframe and counter
    iframe.setAttribute('src', videos[currentIndex]);
    counterEl.textContent = currentIndex + 1;
}
