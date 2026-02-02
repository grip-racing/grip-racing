// ========================================
// GRIP RACING - JAVASCRIPT
// ========================================

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Simple AOS (Animate On Scroll) implementation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
        }
    });
}, observerOptions);

// Observe all elements with data-aos attribute
document.addEventListener('DOMContentLoaded', () => {
    const aosElements = document.querySelectorAll('[data-aos]');
    aosElements.forEach(element => {
        observer.observe(element);
    });
});

// Counter animation for stats
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = window.formatNumber ? window.formatNumber(target) : target;
            clearInterval(timer);
        } else {
            element.textContent = window.formatNumber ? window.formatNumber(Math.floor(start)) : Math.floor(start);
        }
    }, 16);
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent.trim();
                // Remove pontos e outros caracteres não numéricos para obter o número real
                const cleanNumber = text.replace(/\./g, '').replace(/\D/g, '');
                
                if (text.includes('+')) {
                    const number = parseInt(cleanNumber);
                    if (!isNaN(number)) {
                        stat.textContent = '0';
                        animateCounter(stat, number);
                        // Adiciona o + depois da animação
                        setTimeout(() => {
                            stat.textContent = stat.textContent + '+';
                        }, 2000);
                    }
                } else if (cleanNumber && !isNaN(parseInt(cleanNumber))) {
                    const number = parseInt(cleanNumber);
                    stat.textContent = '0';
                    animateCounter(stat, number);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Add hover effect to staff cards
const staffCards = document.querySelectorAll('.staff-card');
staffCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - (scrolled / window.innerHeight);
    }
});

// Load dynamic stats
async function loadDynamicStats() {
    try {
        const response = await fetch('data/data-pilotos.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        // Parse CSV
        const pilotos = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                corridas: parseInt(values[4]) || 0,
                titulos: parseInt(values[3]) || 0,
                podios: parseInt(values[5]) || 0
            };
        });
        
        // Calculate stats
        const totalPilotos = pilotos.length;
        const totalParticipacoes = pilotos.reduce((sum, p) => sum + p.corridas, 0);
        const totalTitulos = pilotos.reduce((sum, p) => sum + p.titulos, 0);
        const totalPodios = pilotos.reduce((sum, p) => sum + p.podios, 0);
        
        // Format numbers
        const participacoesFormatted = totalParticipacoes.toLocaleString('pt-BR');
        const titulosFormatted = totalTitulos.toLocaleString('pt-BR');
        const podiosFormatted = totalPodios.toLocaleString('pt-BR');
        
        // Update stat cards
        const statParticipacoes = document.getElementById('statParticipacoes');
        const statTitulos = document.getElementById('statTitulos');
        const statPodios = document.getElementById('statPodios');
        
        if (statParticipacoes) statParticipacoes.textContent = totalParticipacoes;
        if (statTitulos) statTitulos.textContent = totalTitulos;
        if (statPodios) statPodios.textContent = totalPodios;
        
        // Update about section
        const pilotosEl = document.getElementById('totalPilotosAbout');
        const participacoesEl = document.getElementById('totalParticipacoesAbout');
        const titulosEl = document.getElementById('totalTitulosAbout');
        const podiosEl = document.getElementById('totalPodiosAbout');
        
        if (pilotosEl) pilotosEl.textContent = totalPilotos;
        if (participacoesEl) participacoesEl.textContent = participacoesFormatted;
        if (titulosEl) titulosEl.textContent = totalTitulos;
        if (podiosEl) podiosEl.textContent = podiosFormatted;
        
        // Update pilotos section
        const pilotosSectionEl = document.getElementById('totalPilotosSection');
        if (pilotosSectionEl) pilotosSectionEl.textContent = totalPilotos;
        
        // Update footer
        const footerParticipacoes = document.getElementById('footerParticipacoes');
        const footerTitulos = document.getElementById('footerTitulos');
        const footerPodios = document.getElementById('footerPodios');
        
        if (footerParticipacoes) footerParticipacoes.textContent = participacoesFormatted;
        if (footerTitulos) footerTitulos.textContent = titulosFormatted;
        if (footerPodios) footerPodios.textContent = podiosFormatted;
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

// Load stats on page load
if (document.querySelector('.about-text')) {
    loadDynamicStats();
}

// Console easter egg
console.log('%c🏁 GRIP RACING 🏁', 'color: #FF6B00; font-size: 30px; font-weight: bold;');
console.log('%cPaixão por velocidade desde 2008!', 'color: #FFFFFF; font-size: 14px;');
console.log('%cInteressado em fazer parte? Entre em contato!', 'color: #999999; font-size: 12px;');
