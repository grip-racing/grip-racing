// ========================================
// GRIP RACING - UTILITY FUNCTIONS
// ========================================

// Simple cache for fetch requests
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Parse CSV with proper handling of quoted fields
function parseCSV(csv, url = '') {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    const parsed = lines.slice(1).map(line => {
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
    
    return parsed;
}

// Colunas somáveis do CSV de pilotos
const PILOTO_SUM_COLUMNS = [
    'Títulos', 'Construtores', 'Tot. Títulos', 'Corridas', 'Podios', 'P1', 'P2', 'P3',
    'Top 5', 'Top 10', 'Poles', 'Fast Laps', 'Abandonos', 'DQ', 'Hat-Tricks', 'Chelems'
];

// Razão "etapas por X" no mesmo formato da planilha
function etapasPor(corridas, divisor, vazio) {
    return divisor > 0 ? (Math.round((corridas / divisor) * 100) / 100).toString() : vazio;
}

// Junta linhas do mesmo piloto (ex.: nome com espaço sobrando na planilha
// vira uma segunda linha; depois do trim do parser, os nomes ficam iguais)
function mergePilotosDuplicados(pilotos) {
    const porNome = new Map();

    pilotos.forEach(row => {
        const nome = (row['Piloto'] || '').replace(/\s+/g, ' ').trim();
        if (!nome) return;

        const atual = porNome.get(nome);
        if (!atual) {
            porNome.set(nome, { ...row, Piloto: nome });
            return;
        }

        PILOTO_SUM_COLUMNS.forEach(col => {
            if (col in atual || col in row) {
                atual[col] = String((parseInt(atual[col]) || 0) + (parseInt(row[col]) || 0));
            }
        });
        if (row['Estreia'] && (!atual['Estreia'] || row['Estreia'] < atual['Estreia'])) atual['Estreia'] = row['Estreia'];
        if (row['Ultima'] && (!atual['Ultima'] || row['Ultima'] > atual['Ultima'])) atual['Ultima'] = row['Ultima'];

        const corridas = parseInt(atual['Corridas']) || 0;
        const abandonos = (parseInt(atual['Abandonos']) || 0) + (parseInt(atual['DQ']) || 0);
        atual['Etapas por DNF/DQ'] = etapasPor(corridas, abandonos, '0');
        atual['Etapas Por Podio'] = etapasPor(corridas, parseInt(atual['Podios']) || 0, 'N/A');
        atual['Etapas Por Vitoria'] = etapasPor(corridas, parseInt(atual['P1']) || 0, 'N/A');
    });

    return [...porNome.values()];
}

// Fetch data with cache
async function fetchData(url) {
    try {
        // Check cache first
        const cached = dataCache.get(url);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            console.log(`📦 Cache hit: ${url}`);
            return cached.data;
        }
        
        console.log(`📥 Fetching: ${url}`);
        const response = await fetch(url);
        const text = await response.text();
        console.log(`✅ Loaded ${url}: ${text.length} bytes`);
        let parsed = parseCSV(text, url);
        if (url.includes('data-pilotos')) {
            parsed = mergePilotosDuplicados(parsed);
        }
        console.log(`✅ Parsed ${url}: ${parsed.length} rows`);
        
        // Store in cache
        dataCache.set(url, {
            data: parsed,
            timestamp: Date.now()
        });
        
        return parsed;
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        return [];
    }
}

// Clear cache (useful for forced refresh)
function clearDataCache() {
    dataCache.clear();
    console.log('🗑️ Cache limpo');
}

// Format number with thousand separators
function formatNumber(num) {
    if (!num || num === '-') return '-';
    const numStr = String(num).replace(/\D/g, '');
    if (!numStr) return num;
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Debounce function for search inputs
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.GripUtils = {
        parseCSV,
        fetchData,
        clearDataCache,
        formatNumber,
        debounce
    };
}
