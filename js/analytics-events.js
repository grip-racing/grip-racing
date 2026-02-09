/**
 * Google Analytics 4 - Event Tracking
 * Rastreamento de eventos personalizados para análise de comportamento
 */

// Verifica se o gtag está disponível
function isGtagAvailable() {
    return typeof gtag !== 'undefined';
}

// Função auxiliar para enviar eventos
function sendEvent(eventName, eventParams = {}) {
    if (isGtagAvailable()) {
        gtag('event', eventName, eventParams);
        console.log('📊 GA4 Event:', eventName, eventParams);
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================

// Rastrear cliques no menu de navegação
function trackNavigation() {
    document.querySelectorAll('.nav-menu a, .navbar a').forEach(link => {
        link.addEventListener('click', function(e) {
            const pageName = this.getAttribute('data-page') || this.textContent.trim();
            const href = this.getAttribute('href');
            
            sendEvent('navigation_click', {
                page_name: pageName,
                destination: href,
                link_text: this.textContent.trim()
            });
        });
    });
}

// Rastrear mudança de tema
function trackThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            sendEvent('theme_change', {
                theme: newTheme
            });
        });
    }
}

// ============================================
// PÁGINA DE PILOTOS
// ============================================

// Rastrear busca de pilotos
function trackPilotSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 3) {
                    sendEvent('pilot_search', {
                        search_term: this.value,
                        results_count: document.querySelectorAll('.pilotos-table tbody tr:not([style*="display: none"])').length
                    });
                }
            }, 1000);
        });
    }
}

// Rastrear filtros de pilotos
function trackPilotFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.textContent.trim();
            
            sendEvent('pilot_filter', {
                filter_type: filterType,
                is_active: this.classList.contains('active')
            });
        });
    });
}

// Rastrear ordenação de colunas
function trackColumnSort() {
    document.querySelectorAll('.pilotos-table th.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const columnName = this.textContent.trim();
            const sortDirection = this.classList.contains('sorted') ? 'desc' : 'asc';
            
            sendEvent('column_sort', {
                column_name: columnName,
                sort_direction: sortDirection
            });
        });
    });
}

// Rastrear clique em piloto
function trackPilotClick() {
    document.querySelectorAll('.pilotos-table tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            const pilotName = this.querySelector('td:first-child')?.textContent.trim();
            
            sendEvent('pilot_view', {
                pilot_name: pilotName
            });
        });
    });
}

// Rastrear botão "Carregar Mais"
function trackLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            const currentCount = document.getElementById('loadMoreBtn')?.querySelector('.load-more-count')?.textContent;
            
            sendEvent('load_more_pilots', {
                current_count: currentCount
            });
        });
    }
}

// Rastrear visualização de líderes
function trackLeaderView() {
    document.querySelectorAll('.stat-card-clickable').forEach(card => {
        card.addEventListener('click', function() {
            const statType = this.querySelector('.stat-label-large')?.textContent.trim();
            
            sendEvent('leader_view', {
                stat_type: statType
            });
        });
    });
}

// ============================================
// PÁGINA DE DETALHES DO PILOTO
// ============================================

// Rastrear expansão de estatísticas detalhadas
function trackStatExpansion() {
    document.querySelectorAll('.stat-card-clickable').forEach(card => {
        card.addEventListener('click', function() {
            const statName = this.querySelector('.stat-label-large')?.textContent.trim();
            const isExpanded = this.classList.contains('expanded');
            
            sendEvent('stat_detail_toggle', {
                stat_name: statName,
                action: isExpanded ? 'collapse' : 'expand'
            });
        });
    });
}

// Rastrear clique em corrida (modal)
function trackRaceClick() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.corrida-item')) {
            const corridaItem = e.target.closest('.corrida-item');
            const temporada = corridaItem.closest('.temporada-item')?.querySelector('.temporada-header')?.textContent.trim();
            
            sendEvent('race_view', {
                season: temporada
            });
        }
    });
}

// Rastrear botão "Voltar aos Pilotos"
function trackBackToPilots() {
    const backLink = document.querySelector('.back-link');
    if (backLink) {
        backLink.addEventListener('click', function() {
            sendEvent('back_to_pilots', {
                source: 'detail_page'
            });
        });
    }
}

// ============================================
// PÁGINA DE VÍDEOS
// ============================================

// Rastrear clique em vídeo
function trackVideoClick() {
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', function() {
            const videoTitle = this.querySelector('.video-title')?.textContent.trim();
            const videoUrl = this.getAttribute('data-video-url');
            
            sendEvent('video_click', {
                video_title: videoTitle,
                video_url: videoUrl
            });
        });
    });
}

// ============================================
// PÁGINA DE INSCRIÇÕES
// ============================================

// Rastrear clique em links de inscrição
function trackInscriptionClick() {
    document.querySelectorAll('.social-btn, .btn-primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim();
            const href = this.getAttribute('href');
            
            sendEvent('inscription_click', {
                button_text: buttonText,
                destination: href
            });
        });
    });
}

// ============================================
// LINKS EXTERNOS
// ============================================

// Rastrear cliques em links externos (YouTube, Discord, etc)
function trackExternalLinks() {
    document.querySelectorAll('a[href*="youtube.com"], a[href*="discord"], a[href*="instagram"], a[href*="twitter"], a[href*="facebook"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const destination = new URL(this.href).hostname;
            
            sendEvent('external_link', {
                destination: destination,
                link_text: this.textContent.trim(),
                url: this.href
            });
        });
    });
}

// ============================================
// INTERAÇÕES GERAIS
// ============================================

// Rastrear tempo na página (a cada 30 segundos)
let timeOnPage = 0;
function trackTimeOnPage() {
    setInterval(() => {
        timeOnPage += 30;
        
        if (timeOnPage % 60 === 0) { // A cada minuto
            sendEvent('time_on_page', {
                seconds: timeOnPage,
                page_path: window.location.pathname
            });
        }
    }, 30000);
}

// Rastrear scroll depth
let maxScrollDepth = 0;
function trackScrollDepth() {
    window.addEventListener('scroll', function() {
        const scrollPercentage = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        
        if (scrollPercentage > maxScrollDepth) {
            maxScrollDepth = scrollPercentage;
            
            // Enviar evento a cada 25%
            if (maxScrollDepth >= 25 && maxScrollDepth < 50 && !window.scroll25Sent) {
                sendEvent('scroll_depth', { depth: 25 });
                window.scroll25Sent = true;
            } else if (maxScrollDepth >= 50 && maxScrollDepth < 75 && !window.scroll50Sent) {
                sendEvent('scroll_depth', { depth: 50 });
                window.scroll50Sent = true;
            } else if (maxScrollDepth >= 75 && maxScrollDepth < 100 && !window.scroll75Sent) {
                sendEvent('scroll_depth', { depth: 75 });
                window.scroll75Sent = true;
            } else if (maxScrollDepth >= 100 && !window.scroll100Sent) {
                sendEvent('scroll_depth', { depth: 100 });
                window.scroll100Sent = true;
            }
        }
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

function initAnalyticsTracking() {
    // Aguardar o DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTracking);
    } else {
        setupTracking();
    }
}

function setupTracking() {
    // Eventos gerais (todas as páginas)
    trackNavigation();
    trackThemeToggle();
    trackExternalLinks();
    trackTimeOnPage();
    trackScrollDepth();
    
    // Eventos específicos por página
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('pilotos.html')) {
        // Página de listagem de pilotos
        trackPilotSearch();
        trackPilotFilters();
        trackColumnSort();
        trackPilotClick();
        trackLoadMore();
    } else if (currentPage.includes('piloto-detalhes.html')) {
        // Página de detalhes do piloto
        trackStatExpansion();
        trackRaceClick();
        trackBackToPilots();
        trackLeaderView();
    } else if (currentPage.includes('eventos.html')) {
        // Página de eventos
        trackPilotSearch(); // Reutiliza busca
        trackPilotFilters(); // Reutiliza filtros
        trackColumnSort(); // Reutiliza ordenação
    } else if (currentPage.includes('videos.html')) {
        // Página de vídeos
        trackVideoClick();
    } else if (currentPage.includes('inscricoes.html')) {
        // Página de inscrições
        trackInscriptionClick();
    }
    
    // Evento de página visualizada
    sendEvent('page_view', {
        page_title: document.title,
        page_path: window.location.pathname
    });
    
    console.log('✅ Analytics tracking initialized');
}

// Iniciar rastreamento
initAnalyticsTracking();
