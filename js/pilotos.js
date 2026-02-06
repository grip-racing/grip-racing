// Pilotos page script
const DATA_SOURCES = {
    pilotos: 'data/data-pilotos.csv',
    participacoes: 'data/data-participacoes.csv'
};

let allPilotos = [];
let currentSort = { column: 'corridas', direction: 'desc' };
let currentFilter = 'todos';

// Load and display pilotos
async function loadPilotos() {
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    
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
    
    document.getElementById('totalPilotos').textContent = window.GripUtils.formatNumber(totalPilotos);
    document.getElementById('totalCorridas').textContent = window.GripUtils.formatNumber(totalCorridas);
    document.getElementById('totalPodios').textContent = window.GripUtils.formatNumber(totalPodios);
    document.getElementById('totalCampeoes').textContent = window.GripUtils.formatNumber(campeoes);
    
    // Update hero subtitle
    const heroTotal = document.getElementById('totalPilotosHero');
    if (heroTotal) {
        heroTotal.textContent = window.GripUtils.formatNumber(totalPilotos);
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
                        <span class="stat-badge">🏁 ${window.GripUtils.formatNumber(p.corridas)}</span>
                        <span class="stat-badge stat-badge-highlight">🏆 ${window.GripUtils.formatNumber(p.titulos)}</span>
                        <span class="stat-badge">🏅 ${window.GripUtils.formatNumber(p.podios)}</span>
                    </div>
                </div>
                <button class="expand-btn" onclick="event.stopPropagation(); this.closest('tr').classList.toggle('expanded')"></button>
            </td>
            <td data-label="Corridas" class="expandable-data">${window.GripUtils.formatNumber(p.corridas)}</td>
            <td data-label="Títulos" class="expandable-data">${window.GripUtils.formatNumber(p.titulos)}</td>
            <td data-label="Pódios" class="expandable-data">${window.GripUtils.formatNumber(p.podios)}</td>
            <td data-label="Vit." class="expandable-data">${window.GripUtils.formatNumber(p.vitorias)}</td>
            <td data-label="Poles" class="expandable-data">${window.GripUtils.formatNumber(p.poles)}</td>
            <td data-label="Fast Laps" class="expandable-data hide-mobile">${window.GripUtils.formatNumber(p.fastLaps)}</td>
            <td data-label="HT" class="expandable-data">${window.GripUtils.formatNumber(p.hatTricks)}</td>
            <td data-label="CH" class="expandable-data">${window.GripUtils.formatNumber(p.chelems)}</td>
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

// Setup search listener com debounce
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteResults = document.getElementById('autocompleteResults');
    let selectedIndex = -1;
    
    // Debounce para performance
    const debouncedSearch = window.GripUtils.debounce(() => {
        displayPilotos();
    }, 300);
    
    // Autocomplete
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        selectedIndex = -1; // Reset selection
        
        // Atualizar tabela
        debouncedSearch();
        
        // Mostrar autocomplete apenas se tiver 2+ caracteres
        if (searchTerm.length >= 2) {
            const matches = allPilotos
                .filter(p => p.piloto.toLowerCase().includes(searchTerm))
                .slice(0, 8) // Limitar a 8 sugestões
                .sort((a, b) => {
                    // Priorizar matches no início do nome
                    const aStarts = a.piloto.toLowerCase().startsWith(searchTerm);
                    const bStarts = b.piloto.toLowerCase().startsWith(searchTerm);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    // Depois por número de corridas
                    return b.corridas - a.corridas;
                });
            
            if (matches.length > 0) {
                autocompleteResults.innerHTML = matches.map((p, index) => `
                    <div class="autocomplete-item" data-piloto="${p.piloto}" data-index="${index}">
                        <span class="autocomplete-name">${highlightMatch(p.piloto, searchTerm)}</span>
                        <span class="autocomplete-stats">${p.corridas} corridas${p.titulos > 0 ? ` • ${p.titulos} 🏆` : ''}</span>
                    </div>
                `).join('');
                autocompleteResults.classList.add('show');
            } else {
                autocompleteResults.classList.remove('show');
            }
        } else {
            autocompleteResults.classList.remove('show');
        }
    });
    
    // Click em item do autocomplete
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            const piloto = item.dataset.piloto;
            window.location.href = `piloto-detalhes.html?nome=${encodeURIComponent(piloto)}`;
        } else if (!e.target.closest('.search-box')) {
            // Fechar autocomplete se clicar fora
            autocompleteResults.classList.remove('show');
            selectedIndex = -1;
        }
    });
    
    // Navegação por teclado
    searchInput.addEventListener('keydown', (e) => {
        const items = autocompleteResults.querySelectorAll('.autocomplete-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length > 0) {
                selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                updateSelectedItem(items, selectedIndex);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length > 0) {
                selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                updateSelectedItem(items, selectedIndex);
            }
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && items[selectedIndex]) {
                e.preventDefault();
                const piloto = items[selectedIndex].dataset.piloto;
                window.location.href = `piloto-detalhes.html?nome=${encodeURIComponent(piloto)}`;
            }
        } else if (e.key === 'Escape') {
            autocompleteResults.classList.remove('show');
            selectedIndex = -1;
        }
    });
}

// Update selected item visual feedback
function updateSelectedItem(items, index) {
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// Highlight match in text
function highlightMatch(text, search) {
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + search.length);
    const after = text.substring(index + search.length);
    
    return `${before}<strong>${match}</strong>${after}`;
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
