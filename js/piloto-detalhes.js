// Piloto detalhes page script
const DATA_SOURCES = {
    pilotos: 'data/data-pilotos.csv',
    participacoes: 'data/data-participacoes.csv'
};

let pilotoData = null;
let participacoesData = [];

// Parse CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    }).filter(obj => {
        // Filtrar linhas vazias ou inválidas
        return Object.values(obj).some(v => v && v.length > 0);
    });
}

// Fetch data
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return [];
    }
}

// Format number
function formatNumber(num) {
    if (!num || num === '-') return '-';
    const numStr = String(num).replace(/\D/g, '');
    if (!numStr) return num;
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Format position with ordinal
function formatPosition(pos) {
    if (!pos || pos === '-' || pos === 'N/A') return pos;
    const posStr = String(pos).trim();
    if (posStr.toUpperCase().includes('DNF') || posStr.toUpperCase().includes('DQ') || posStr.toUpperCase().includes('ABANDON')) return posStr;
    const num = parseInt(posStr.replace(/\D/g, ''));
    if (isNaN(num)) return posStr;
    return num + 'º';
}

// Get badge class for position
function getBadgeClass(pos) {
    if (!pos) return '';
    const posStr = String(pos).trim();
    const num = parseInt(posStr.replace(/\D/g, ''));
    if (num === 1) return 'badge-1';
    if (num === 2) return 'badge-2';
    if (num === 3) return 'badge-3';
    return '';
}

// Check if mobile
function isMobile() {
    return window.innerWidth <= 768;
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
    const pilotos = await fetchData(DATA_SOURCES.pilotos);
    pilotoData = pilotos.find(p => 
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    if (!pilotoData) {
        document.getElementById('pilotoName').textContent = 'Piloto não encontrado';
        return;
    }
    
    // Load participacoes
    participacoesData = await fetchData(DATA_SOURCES.participacoes);
    
    displayPilotoInfo();
    displayPilotoStats();
    displayTemporadas();
    displayCampeonatos();
    displayAdvancedStats();
    displayRecordes();
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

// Toggle stat detail display
function toggleStatDetail(type) {
    const detailSection = document.getElementById(`statDetail${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const card = document.getElementById(`card${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
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
        }, 10);
    } else {
        detailSection.style.maxHeight = '0';
    }
}

// Display stat details
function displayStatDetails(type, container) {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
        (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase()
    );
    
    let filteredData = [];
    let title = '';
    
    if (type === 'titulos') {
        // Buscar TODAS as participações do piloto para contar corridas por campeonato
        const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
        const todasParticipacoes = participacoesData.filter(p => 
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
        
        console.log(`🏆 Títulos de Piloto: ${campeonatosPiloto.length} linhas`);
        console.log(`🏗️ Títulos de Construtores: ${campeonatosConstrutores.length} linhas`);
        
        // Agrupar títulos de pilotos com contagem real de corridas
        const titulosPilotoUnicos = {};
        campeonatosPiloto.forEach(c => {
            const liga = String(c['Liga'] || 'N/A').trim();
            const temporada = String(c['Temporada'] || '').trim();
            const ano = String(c['Ano'] || '').trim();
            const categoria = String(c['Categoria'] || '').trim();
            const key = `piloto|||${liga}|||${temporada}`;
            
            if (!titulosPilotoUnicos[key]) {
                // Contar TODAS as corridas desta liga/temporada/categoria
                const corridasCampeonato = todasParticipacoes.filter(p => 
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
            const key = `construtor|||${liga}|||${temporada}`;
            
            if (!titulosConstrutoresUnicos[key]) {
                // Contar TODAS as corridas desta liga/temporada/categoria
                const corridasCampeonato = todasParticipacoes.filter(p => 
                    String(p['Liga'] || '').trim() === liga && 
                    String(p['Temporada'] || '').trim() === temporada &&
                    String(p['Categoria'] || '').trim() === categoria
                );
                
                titulosConstrutoresUnicos[key] = {
                    tipo: 'construtor',
                    liga: liga,
                    temporada: temporada,
                    ano: ano,
                    categoria: categoria,
                    equipe: equipe,
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
        
        const totalTitulos = titulosPiloto.length + titulosConstrutores.length;
        console.log(`🏆 Total de títulos únicos: ${totalTitulos}`);
        
        const renderTituloCard = (t, index) => `
            <div class="titulo-card-wrapper">
                <div class="titulo-card ${t.tipo === 'construtor' ? 'titulo-card-construtor' : ''}" onclick="toggleTituloDetail('${t.tipo}-${index}')" style="cursor: pointer;">
                    <div class="titulo-trophy">${t.tipo === 'piloto' ? '🏆' : '👥'}</div>
                    <div class="titulo-content">
                        <div class="titulo-liga">${t.liga}</div>
                        <div class="titulo-temporada">${t.temporada}</div>
                        ${t.categoria ? `<div class="titulo-categoria">${t.categoria}</div>` : ''}
                        <div class="titulo-info">
                            <span class="titulo-ano">${t.ano}</span>
                            <span class="titulo-corridas">${t.totalCorridas} corridas</span>
                        </div>
                    </div>
                    <div class="titulo-expand">▼</div>
                </div>
                <div class="titulo-corridas-list" id="tituloDetail-${t.tipo}-${index}">
                ${t.corridas.map(c => {
                    const pista = c['Pista'] || 'Desconhecida';
                    const final = c['Final'] || 'N/A';
                    const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                    const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta R\u00e1pida">⚡</span>' : '';
                    const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campe\u00e3o de Pilotos">🏆</span>' : '';
                    const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                    const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campe\u00e3o de Construtores">👥</span>' : '';
                    
                    let resultClass = '';
                    if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                    else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                    else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                    else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                    
                    return `
                        <div class="titulo-corrida-item">
                            <div class="titulo-corrida-resultado ${resultClass}">${formatPosition(final)}</div>
                            <div class="titulo-corrida-pista">${pista}</div>
                            <div class="titulo-corrida-badges">${pole}${bestLap}${campeonatoPiloto}${campeonatoConstrutores}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            </div>
        `;
        
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
            </div>
        `;
        
        container.innerHTML = html;
        return;
    }
    
    if (type === 'vitorias') {
        filteredData = pilotoParticipacoes.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final.includes('1º');
        });
        title = '🥇 Vitórias';
    } else if (type === 'podios') {
        filteredData = pilotoParticipacoes.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final === '2' || final === '3' ||
                   final.includes('1º') || final.includes('2º') || final.includes('3º');
        });
        title = '🏅 Pódios';
    } else if (type === 'poles') {
        filteredData = pilotoParticipacoes.filter(c => {
            const pole = String(c['Pole'] || '').trim().toLowerCase();
            return pole === 'sim';
        });
        title = '⚡ Pole Positions';
    } else if (type === 'fastlaps') {
        filteredData = pilotoParticipacoes.filter(c => {
            const bestLap = String(c['Best Lap'] || '').trim().toLowerCase();
            return bestLap === 'sim';
        });
        title = '⏱️ Voltas Mais Rápidas';
    }
    
    const html = `
        <div class="stat-detail-content">
            <h3 class="stat-detail-title">${title} <span class="stat-detail-count">(${filteredData.length})</span></h3>
            <div class="stat-detail-list">
                ${filteredData.map(c => {
                    const pista = c['Pista'] || 'Desconhecida';
                    const liga = c['Liga'] || 'N/A';
                    const temporada = c['Temporada'] || '';
                    const ano = c['Ano'] || '';
                    const categoria = c['Categoria'] || '';
                    const final = c['Final'] || '-';
                    
                    return `
                        <div class="stat-detail-item">
                            <div class="stat-detail-item-info">
                                ${type === 'vitorias' || type === 'podios' ? `<span class="stat-detail-posicao ${getBadgeClass(final)}">${formatPosition(final)}</span>` : ''}
                            </div>
                            <div class="stat-detail-item-main">
                                <div class="stat-detail-pista">${pista}</div>
                                <div class="stat-detail-meta">
                                    <span class="stat-detail-liga">${liga}</span>
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

// Display piloto stats overview
function displayPilotoStats() {
    const titulos = parseInt(pilotoData['Tot. Títulos'] || pilotoData['Títulos'] || pilotoData['titulos'] || 0);
    const corridas = parseInt(pilotoData['Corridas'] || pilotoData['corridas'] || 0);
    const vitorias = parseInt(pilotoData['P1'] || pilotoData['Vitórias'] || pilotoData['vitorias'] || 0);
    const podios = parseInt(pilotoData['Pódios'] || pilotoData['Podios'] || pilotoData['podios'] || 0);
    const poles = parseInt(pilotoData['Poles'] || pilotoData['poles'] || 0);
    const fastLaps = parseInt(pilotoData['Fast Laps'] || pilotoData['fast_laps'] || 0);
    
    document.getElementById('statTitulos').textContent = formatNumber(titulos);
    document.getElementById('statCorridas').textContent = formatNumber(corridas);
    document.getElementById('statVitorias').textContent = formatNumber(vitorias);
    document.getElementById('statPodios').textContent = formatNumber(podios);
    document.getElementById('statPoles').textContent = formatNumber(poles);
    document.getElementById('statFastLaps').textContent = formatNumber(fastLaps);
}

// Display temporadas
function displayTemporadas() {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
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
                            const pista = c['Pista'] || 'Desconhecida';
                            const final = c['Final'] || 'N/A';
                            const liga = c['Liga'] || 'N/A';
                            const categoria = c['Categoria'] || '';
                            const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                            const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta R\u00e1pida">⚡</span>' : '';
                            const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campe\u00e3o de Pilotos">🏆</span>' : '';
                            const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                            const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campe\u00e3o de Construtores">👥</span>' : '';
                            
                            let resultClass = '';
                            if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                            else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                            else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                            else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                            
                            return `
                                <div class="corrida-item">
                                    <div class="corrida-info">
                                        <span class="corrida-resultado ${resultClass}">${formatPosition(final)}</span>
                                    </div>
                                    <div class="corrida-principal">
                                        <div class="corrida-pista">${pista}</div>
                                        <div class="corrida-liga-categoria">
                                            <span class="corrida-liga">${liga}</span>
                                            ${categoria ? `<span class="corrida-categoria">${categoria}</span>` : ''}
                                        </div>
                                    </div>
                                    <span class="corrida-badges">${pole}${bestLap}${campeonatoPiloto}${campeonatoConstrutores}</span>
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
                return campeao === 'SIM';
            }).length;
            
            return {
                nome: c.nome,
                campeonatos: c.campeonatos.sort((a, b) => {
                    const anoA = parseInt(a.ano) || 0;
                    const anoB = parseInt(b.ano) || 0;
                    return anoB - anoA;
                }),
                total: c.campeonatos.length,
                qtdCampeonatosPiloto,
                qtdCampeonatosConstrutores
            };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 20); // Top 20
    
    const html = campeonatos.map((c, index) => `
        <div class="campeonato-item-wrapper">
            <div class="campeonato-item" onclick="toggleCampeonato(this)">
                <div class="campeonato-header-left">
                    <span class="campeonato-nome">${c.nome} ${'🏆'.repeat(c.qtdCampeonatosPiloto)}${'👥'.repeat(c.qtdCampeonatosConstrutores)}</span>
                    <span class="campeonato-participacoes">${c.total} ${c.total === 1 ? 'campeonato' : 'campeonatos'}</span>
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
                        return campeao === 'SIM';
                    }).length;
                    
                    return `
                    <div class="campeonato-subitem-wrapper">
                        <div class="campeonato-subitem" onclick="toggleCampeonatoCorridas(this, '${c.nome}', '${camp.temporada}', '${camp.categoria}')">
                            <div class="campeonato-subitem-info">
                                <span class="campeonato-temporada">${camp.temporada || 'N/A'} ${'🏆'.repeat(qtdCampeonatosPiloto)}${'👥'.repeat(qtdCampeonatosConstrutores)}</span>
                                ${camp.categoria ? `<span class="campeonato-categoria">${camp.categoria}</span>` : ''}
                                ${camp.ano ? `<span class="campeonato-ano">${camp.ano}</span>` : ''}
                            </div>
                            <div class="campeonato-subitem-right">
                                <span class="campeonato-corridas">${camp.corridas} ${camp.corridas === 1 ? 'corrida' : 'corridas'}</span>
                                <div class="campeonato-subexpand">▼</div>
                            </div>
                        </div>
                        <div class="campeonato-corridas-list" id="campeonatoCorridas-${index}-${campIdx}"></div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
    
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
                (p['Piloto'] || p['piloto'] || '').toLowerCase() === pilotoNome.toLowerCase() &&
                (p['Liga'] || '') === liga &&
                (p['Temporada'] || '') === temporada &&
                (p['Categoria'] || '') === categoria
            );
            
            const corridasHtml = corridas.map(c => {
                const pista = c['Pista'] || 'Desconhecida';
                const final = c['Final'] || 'N/A';
                const pole = String(c['Pole'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Pole Position">🚩</span>' : '';
                const bestLap = String(c['Best Lap'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Volta R\u00e1pida">⚡</span>' : '';
                const campeonatoPiloto = String(c['Piloto Campeao'] || '').trim().toUpperCase() === 'SIM' ? '<span title="Campe\u00e3o de Pilotos">🏆</span>' : '';
                const construtoresVal = String(c['Construtores'] || '').trim().toUpperCase();
                const campeonatoConstrutores = (construtoresVal === 'SIM' || construtoresVal === 'TIME') ? '<span title="Campe\u00e3o de Construtores">👥</span>' : '';
                
                let resultClass = '';
                if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                else if (final === '2' || final.includes('2º')) resultClass = 'resultado-segundo';
                else if (final === '3' || final.includes('3º')) resultClass = 'resultado-podio';
                else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                
                return `
                    <div class="campeonato-corrida-item">
                        <span class="corrida-resultado ${resultClass}">${formatPosition(final)}</span>
                        <span class="campeonato-corrida-pista">${pista}</span>
                        <span class="campeonato-corrida-badges">${pole}${bestLap}${campeonatoPiloto}${campeonatoConstrutores}</span>
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
function displayAdvancedStats() {
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
    
    document.getElementById('taxaPodios').textContent = taxaPodios;
    document.getElementById('taxaVitorias').textContent = taxaVitorias;
    document.getElementById('taxaTop10').textContent = taxaTop10;
    document.getElementById('etapasPorPodio').textContent = etapasPorPodio;
    document.getElementById('etapasPorVitoria').textContent = etapasPorVitoria;
    document.getElementById('abandonos').textContent = formatNumber(abandonos);
}

// Display recordes
function displayRecordes() {
    const pilotoNome = pilotoData['Piloto'] || pilotoData['piloto'] || '';
    const pilotoParticipacoes = participacoesData.filter(p => 
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
    
    const html = `
        <div class="recorde-item">
            <span class="recorde-label">Melhor Resultado</span>
            <span class="recorde-value">${melhorResultado < 999 ? melhorResultado + 'º' : 'N/A'}</span>
        </div>
        <div class="recorde-item">
            <span class="recorde-label">Pódios Consecutivos</span>
            <span class="recorde-value">${maxPodiosConsecutivos}</span>
        </div>
        <div class="recorde-item">
            <span class="recorde-label">Total de Etapas</span>
            <span class="recorde-value">${formatNumber(pilotoParticipacoes.length)}</span>
        </div>
    `;
    
    document.getElementById('recordesContainer').innerHTML = html;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 Inicializando página de detalhes do piloto');
    loadPilotoData();
});
