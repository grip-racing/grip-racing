// Pilotos page script
const DATA_SOURCES = {
    pilotos: 'data/data-pilotos.csv',
    participacoes: 'data/data-participacoes.csv'
};

let allPilotos = [];
let currentSort = { column: 'corridas', direction: 'desc' };
let currentFilter = 'todos';

// Parse CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
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

// Load and display pilotos
async function loadPilotos() {
    const pilotos = await fetchData(DATA_SOURCES.pilotos);
    
    if (!pilotos || pilotos.length === 0) {
        document.getElementById('pilotosTableBody').innerHTML = '<tr><td colspan="9">Erro ao carregar dados</td></tr>';
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
    }));
    
    updateSummary();
    displayPilotos();
}

// Update summary cards
function updateSummary() {
    const totalPilotos = allPilotos.length;
    const campeoes = allPilotos.filter(p => p.titulos > 0).length;
    const totalCorridas = allPilotos.reduce((sum, p) => {
        const corridas = parseInt(p.corridas) || 0;
        return sum + corridas;
    }, 0);
    const totalPodios = allPilotos.reduce((sum, p) => {
        const podios = parseInt(p.podios) || 0;
        return sum + podios;
    }, 0);
    
    document.getElementById('totalPilotos').textContent = formatNumber(totalPilotos);
    document.getElementById('totalCorridas').textContent = formatNumber(totalCorridas);
    document.getElementById('totalPodios').textContent = formatNumber(totalPodios);
    document.getElementById('totalCampeoes').textContent = formatNumber(campeoes);
    
    // Update hero subtitle
    const heroTotal = document.getElementById('totalPilotosHero');
    if (heroTotal) {
        heroTotal.textContent = formatNumber(totalPilotos);
    }
}

// Display pilotos in table
function displayPilotos() {
    let filteredPilotos = [...allPilotos];
    
    // Apply filter
    if (currentFilter === 'campeoes') {
        filteredPilotos = filteredPilotos.filter(p => p.titulos > 0);
    }
    
    // Apply search
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredPilotos = filteredPilotos.filter(p => 
            p.piloto.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort
    filteredPilotos.sort((a, b) => {
        let aVal = a[currentSort.column];
        let bVal = b[currentSort.column];
        
        // Handle numeric vs string
        if (typeof aVal === 'number') {
            return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
            if (currentSort.direction === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        }
    });
    
    // Render table
    const tbody = document.getElementById('pilotosTableBody');
    if (filteredPilotos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px;">Nenhum piloto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredPilotos.map(p => `
        <tr>
            <td data-label="Piloto" class="piloto-name-cell">
                <div class="piloto-name-wrapper">
                    <span class="piloto-name-text">${p.piloto}</span>
                    <div class="piloto-badges">
                        <span class="stat-badge">🏁 ${formatNumber(p.corridas)}</span>
                        <span class="stat-badge stat-badge-highlight">🏆 ${formatNumber(p.titulos)}</span>
                        <span class="stat-badge">🏅 ${formatNumber(p.podios)}</span>
                    </div>
                </div>
                <button class="expand-btn" onclick="event.stopPropagation(); this.closest('tr').classList.toggle('expanded')"></button>
            </td>
            <td data-label="Corridas" class="expandable-data">${formatNumber(p.corridas)}</td>
            <td data-label="Títulos" class="expandable-data">${formatNumber(p.titulos)}</td>
            <td data-label="Pódios" class="expandable-data">${formatNumber(p.podios)}</td>
            <td data-label="Vit." class="expandable-data">${formatNumber(p.vitorias)}</td>
            <td data-label="Poles" class="expandable-data">${formatNumber(p.poles)}</td>
            <td data-label="Fast Laps" class="expandable-data hide-mobile">${formatNumber(p.fastLaps)}</td>
            <td data-label="HT" class="expandable-data">${formatNumber(p.hatTricks)}</td>
            <td data-label="CH" class="expandable-data">${formatNumber(p.chelems)}</td>
            <td data-label="Estreia" class="expandable-data hide-mobile">${p.estreia}</td>
            <td data-label="Última" class="expandable-data hide-mobile">${p.ultima}</td>
        </tr>
    `).join('');
    
    // Adicionar evento de clique para navegação (exceto no botão)
    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', (e) => {
            if (!e.target.classList.contains('expand-btn')) {
                const pilotoNome = tr.querySelector('.piloto-name-text').textContent.trim();
                window.location.href = `piloto-detalhes.html?nome=${encodeURIComponent(pilotoNome)}`;
            }
        });
    });
}

// Setup sort listeners
function setupSortListeners() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'desc';
            }
            
            updateSortUI();
            displayPilotos();
        });
    });
    
    // Set initial sort UI
    updateSortUI();
}

// Update sort UI indicators
function updateSortUI() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sorted');
        const icon = th.querySelector('.sort-icon');
        if (icon) icon.textContent = '';
    });
    
    const activeHeader = document.querySelector(`[data-sort="${currentSort.column}"]`);
    if (activeHeader) {
        activeHeader.classList.add('sorted');
        const icon = activeHeader.querySelector('.sort-icon');
        if (icon) {
            icon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        }
    }
}

// Setup filter listeners
function setupFilterListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displayPilotos();
        });
    });
}

// Setup search listener
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        displayPilotos();
    });
}

// Setup mobile sort listener
function setupMobileSortListener() {
    const mobileSortSelect = document.getElementById('mobileSortSelect');
    if (mobileSortSelect) {
        mobileSortSelect.addEventListener('change', (e) => {
            const [column, direction] = e.target.value.split('-');
            currentSort.column = column;
            currentSort.direction = direction;
            displayPilotos();
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPilotos();
    setupSortListeners();
    setupFilterListeners();
    setupSearchListener();
    setupMobileSortListener();
});
