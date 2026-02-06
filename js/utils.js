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
        const parsed = parseCSV(text, url);
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
