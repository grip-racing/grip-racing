// Components Loader - Carrega header e footer compartilhados em todas as páginas

// Load Header
async function loadHeader() {
    try {
        const response = await fetch('components/header.html');
        const html = await response.text();
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = html;
            
            // Marca a página ativa com base na URL atual
            const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
            const links = document.querySelectorAll('.nav-menu a');
            links.forEach(link => {
                const page = link.getAttribute('data-page');
                if (page === currentPage || (currentPage === 'index' && page === 'home')) {
                    link.classList.add('active');
                }
            });
            
            // Reativa o menu mobile após carregar o header
            setupMobileMenu();
        }
    } catch (error) {
        console.error('Erro ao carregar header:', error);
    }
}

// Load Footer
async function loadFooter() {
    try {
        const response = await fetch('components/footer.html');
        const html = await response.text();
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = html;
            
            // Update current year after loading footer
            const currentYearElement = document.getElementById('currentYear');
            if (currentYearElement) {
                currentYearElement.textContent = new Date().getFullYear();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar footer:', error);
    }
}

// Setup Mobile Menu
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }
}

// Load components on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadHeader();
        loadFooter();
    });
} else {
    loadHeader();
    loadFooter();
}
