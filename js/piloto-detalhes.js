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
                    const pole = c['Pole'] === 'Sim' ? '🏁' : '';
                    const bestLap = c['Best Lap'] === 'Sim' ? '⚡' : '';
                    
                    let resultClass = '';
                    if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
                    else if (final === '2' || final === '3' || final.includes('2º') || final.includes('3º')) resultClass = 'resultado-podio';
                    else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
                    
                    return `
                        <div class="titulo-corrida-item">
                            <div class="titulo-corrida-pista">${pista}</div>
                            <div class="titulo-corrida-resultado ${resultClass}">${final}</div>
                            <div class="titulo-corrida-badges">${pole}${bestLap}</div>
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
                            <div class="stat-detail-item-main">
                                <div class="stat-detail-pista">${pista}</div>
                                <div class="stat-detail-meta">
                                    <span class="stat-detail-liga">${liga}</span>
                                    ${categoria ? `<span class="stat-detail-categoria">${categoria}</span>` : ''}
                                    ${temporada ? `<span class="stat-detail-temporada">${temporada}</span>` : ''}
                                </div>
                            </div>
                            <div class="stat-detail-item-info">
                                ${type === 'vitorias' || type === 'podios' ? `<span class="stat-detail-posicao">${final}</span>` : ''}
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
    
    // Group by temporada
    const temporadasMap = {};
    pilotoParticipacoes.forEach(p => {
        const temporada = p['Temporada'] || p['temporada'] || 'Desconhecida';
        if (!temporadasMap[temporada]) {
            temporadasMap[temporada] = [];
        }
        temporadasMap[temporada].push(p);
    });
    
    // Sort temporadas (most recent first)
    const temporadas = Object.keys(temporadasMap).sort((a, b) => {
        const yearA = parseInt(a.match(/\d{4}/)?.[0] || 0);
        const yearB = parseInt(b.match(/\d{4}/)?.[0] || 0);
        return yearB - yearA;
    });
    
    const html = temporadas.map(temporada => {
        const corridas = temporadasMap[temporada];
        
        // Vitórias: quando Final = 1 ou contém "1º"
        const vitorias = corridas.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final.includes('1º');
        }).length;
        
        // Pódios: quando Final = 1, 2, 3 ou contém 1º, 2º, 3º
        const podios = corridas.filter(c => {
            const final = String(c['Final'] || '').trim();
            return final === '1' || final === '2' || final === '3' ||
                   final.includes('1º') || final.includes('2º') || final.includes('3º');
        }).length;
        
        // Poles: quando Pole = "Sim"
        const poles = corridas.filter(c => {
            const pole = String(c['Pole'] || '').trim().toLowerCase();
            return pole === 'sim';
        }).length;
        
        // DNFs: quando Final contém "DNF" ou "Abandonou"
        const dnfs = corridas.filter(c => {
            const final = String(c['Final'] || '').trim().toUpperCase();
            return final.includes('DNF') || final.includes('ABANDONOU') || final.includes('ABANDON');
        }).length;
        
        const corridasHtml = corridas.map(c => {
            const pista = c['Pista'] || 'Desconhecida';
            const final = c['Final'] || 'N/A';
            const liga = c['Liga'] || 'N/A';
            const categoria = c['Categoria'] || '';
            const ano = c['Ano'] || '';
            const pole = c['Pole'] === 'Sim' ? '🏁' : '';
            const bestLap = c['Best Lap'] === 'Sim' ? '⚡' : '';
            
            // Cor do resultado
            let resultClass = '';
            if (final === '1' || final.includes('1º')) resultClass = 'resultado-vitoria';
            else if (final === '2' || final === '3' || final.includes('2º') || final.includes('3º')) resultClass = 'resultado-podio';
            else if (final.toUpperCase().includes('DNF') || final.toUpperCase().includes('ABANDON')) resultClass = 'resultado-dnf';
            
            return `
                <div class="corrida-item">
                    <div class="corrida-principal">
                        <div class="corrida-pista">${pista}</div>
                        <div class="corrida-liga-categoria">
                            <span class="corrida-liga">${liga}</span>
                            ${categoria ? `<span class="corrida-categoria">${categoria}</span>` : ''}
                            ${ano ? `<span class="corrida-ano">${ano}</span>` : ''}
                        </div>
                    </div>
                    <div class="corrida-info">
                        <span class="corrida-resultado ${resultClass}">${final}</span>
                        <span class="corrida-badges">${pole}${bestLap}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="temporada-item">
                <div class="temporada-header" onclick="toggleTemporada(this)">
                    <div class="temporada-header-left">
                        <span class="temporada-nome">${temporada}</span>
                        <span class="temporada-corridas">${corridas.length} corridas</span>
                    </div>
                    <span class="temporada-toggle">▼</span>
                </div>
                <div class="temporada-stats">
                    <div class="temporada-stat">
                        <span class="temporada-stat-value">${vitorias}</span>
                        <span class="temporada-stat-label">Vitórias</span>
                    </div>
                    <div class="temporada-stat">
                        <span class="temporada-stat-value">${podios}</span>
                        <span class="temporada-stat-label">Pódios</span>
                    </div>
                    <div class="temporada-stat">
                        <span class="temporada-stat-value">${poles}</span>
                        <span class="temporada-stat-label">Poles</span>
                    </div>
                    <div class="temporada-stat">
                        <span class="temporada-stat-value">${dnfs}</span>
                        <span class="temporada-stat-label">DNFs</span>
                    </div>
                </div>
                <div class="temporada-corridas-list">
                    ${corridasHtml}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('temporadasContainer').innerHTML = html;
}

// Toggle temporada expansion
function toggleTemporada(header) {
    const item = header.parentElement;
    const corridasList = item.querySelector('.temporada-corridas-list');
    const toggle = header.querySelector('.temporada-toggle');
    
    item.classList.toggle('expanded');
    
    if (item.classList.contains('expanded')) {
        corridasList.style.maxHeight = corridasList.scrollHeight + 'px';
        toggle.style.transform = 'rotate(180deg)';
    } else {
        corridasList.style.maxHeight = '0';
        toggle.style.transform = 'rotate(0deg)';
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
    
    // Group by liga (campeonato)
    const campeonatosMap = {};
    pilotoParticipacoes.forEach(p => {
        const campeonato = p['Liga'] || 'Desconhecido';
        campeonatosMap[campeonato] = (campeonatosMap[campeonato] || 0) + 1;
    });
    
    // Sort by participacoes
    const campeonatos = Object.entries(campeonatosMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20); // Top 20
    
    const html = campeonatos.map(([nome, participacoes]) => `
        <div class="campeonato-item">
            <span class="campeonato-nome">${nome}</span>
            <span class="campeonato-participacoes">${participacoes} corridas</span>
        </div>
    `).join('');
    
    document.getElementById('campeonatosContainer').innerHTML = html || '<p style="text-align: center; color: rgba(255,255,255,0.5);">Nenhum campeonato encontrado</p>';
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
