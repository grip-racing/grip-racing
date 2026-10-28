// Components Loader - Carrega header e footer compartilhados em todas as páginas

// Load Header
async function loadHeader() {
    try {
        const response = await fetch('/components/header.html');
        const html = await response.text();
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = html;

            // Marca a página ativa com base na URL atual
            const path = window.location.pathname;
            const currentPage = path.startsWith('/ferramentas')
                ? 'ferramentas'
                : (path.split('/').pop().replace('.html', '') || 'index');
            const links = document.querySelectorAll('.nav-menu a');
            links.forEach(link => {
                const page = link.getAttribute('data-page');
                if (page === currentPage || (currentPage === 'index' && page === 'home')) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });

            // Reativa o menu mobile após carregar o header
            setupMobileMenu();
            setupDropdowns();
            setupSkipLink();
            if (currentPage === 'index') setupScrollSpy();

            // Update logos after header is loaded
            if (window.updateThemeLogos) {
                window.updateThemeLogos();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar header:', error);
    }
}

// Load Footer
async function loadFooter() {
    try {
        const response = await fetch('/components/footer.html');
        const html = await response.text();
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = html;

            // Update current year after loading footer
            const currentYearElement = document.getElementById('currentYear');
            if (currentYearElement) {
                currentYearElement.textContent = new Date().getFullYear();
            }

            // Update logos after footer is loaded
            if (window.updateThemeLogos) {
                window.updateThemeLogos();
            }

            // Notifica scripts que dependem do footer (ex.: estatísticas da home)
            document.dispatchEvent(new CustomEvent('footerLoaded'));
        }
    } catch (error) {
        console.error('Erro ao carregar footer:', error);
    }
}

// Setup Mobile Menu
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    if (!mobileMenuBtn || !navMenu) return;

    const setOpen = (open) => {
        navMenu.classList.toggle('active', open);
        mobileMenuBtn.classList.toggle('active', open);
        mobileMenuBtn.setAttribute('aria-expanded', String(open));
        mobileMenuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        document.body.classList.toggle('nav-open', open);
    };

    mobileMenuBtn.addEventListener('click', () => {
        setOpen(!navMenu.classList.contains('active'));
    });

    // Close mobile menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            setOpen(false);
            mobileMenuBtn.focus();
        }
    });

    // Fecha ao voltar para desktop
    window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
        if (e.matches) setOpen(false);
    });
}

// Dropdown "A Equipe" (clique/teclado; hover no desktop via CSS)
function setupDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        if (!toggle) return;

        const setOpen = (open) => {
            toggle.setAttribute('aria-expanded', String(open));
            dropdown.classList.toggle('open', open);
        };

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });

        dropdown.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                e.stopPropagation();
                setOpen(false);
                toggle.focus();
            }
        });

        dropdown.addEventListener('focusout', (e) => {
            if (!dropdown.contains(e.relatedTarget)) setOpen(false);
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) setOpen(false);
        });

        dropdown.querySelectorAll('.nav-submenu a').forEach(a => {
            a.addEventListener('click', () => setOpen(false));
        });
    });
}

// "Pular para o conteúdo": foca o primeiro bloco depois do header
function setupSkipLink() {
    const skip = document.querySelector('.skip-link');
    if (!skip) return;
    skip.addEventListener('click', (e) => {
        const target = document.getElementById('conteudo')
            || document.querySelector('main')
            || document.getElementById('header-container')?.nextElementSibling;
        if (!target) return;
        e.preventDefault();
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView();
    });
}

// Na home, destaca no menu a seção visível
function setupScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const map = {};
    document.querySelectorAll('.nav-menu a[data-page]').forEach(a => { map[a.dataset.page] = a; });
    const sections = ['home', 'about', 'achievements', 'staff', 'memorial', 'contact']
        .map(id => document.getElementById(id))
        .filter(Boolean);
    const toggle = document.querySelector('.nav-dropdown-toggle');

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            Object.values(map).forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
            const link = map[id];
            if (link) {
                link.classList.add('active');
                link.setAttribute('aria-current', id === 'home' ? 'page' : 'location');
            }
            if (toggle) toggle.classList.toggle('active', id !== 'home');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(s => spy.observe(s));
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
