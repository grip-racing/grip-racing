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
        // Fetch stats from data-stats.csv (consolidated data)
        const statsResponse = await fetch('data/data-stats.csv');
        const statsText = await statsResponse.text();
        const statsLines = statsText.trim().split('\n');
        
        // Parse the "Total" row (line 2)
        const totalLine = statsLines[1].split(',');
        
        const totalTitulosIndividuais = parseInt(totalLine[1]) || 0;
        const totalTitulosConstrutores = parseInt(totalLine[2]) || 0;
        const totalTitulos = totalTitulosIndividuais + totalTitulosConstrutores;
        const totalParticipacoes = parseInt(totalLine[3]) || 0;
        const totalPodios = parseInt(totalLine[4]) || 0;
        const totalVitorias = parseInt(totalLine[5]) || 0;
        const totalTop5 = parseInt(totalLine[8]) || 0;
        const totalTop10 = parseInt(totalLine[9]) || 0;
        const totalPoles = parseInt(totalLine[10]) || 0;
        const totalFastLaps = parseInt(totalLine[11]) || 0;
        const totalCampeonatos = parseInt(totalLine[14]) || 0;
        const totalEtapas = parseInt(totalLine[15]) || 0;
        
        // Calculate % Taxa Top 10
        const taxaTop10 = totalParticipacoes > 0 ? Math.round((totalTop10 / totalParticipacoes) * 100) : 0;
        
        // Get total pilotos from data-pilotos.csv for about section
        const pilotosResponse = await fetch('data/data-pilotos.csv');
        const pilotosText = await pilotosResponse.text();
        const pilotosLines = pilotosText.trim().split('\n');
        const totalPilotos = pilotosLines.length - 1;
        
        // Update stat cards
        const statParticipacoes = document.getElementById('statParticipacoes');
        const statEtapas = document.getElementById('statEtapas');
        const statCampeonatos = document.getElementById('statCampeonatos');
        const statTitulos = document.getElementById('statTitulos');
        const statTitulosIndividuais = document.getElementById('statTitulosIndividuais');
        const statTitulosConstrutores = document.getElementById('statTitulosConstrutores');
        const statPodios = document.getElementById('statPodios');
        const statVitorias = document.getElementById('statVitorias');
        const statPoles = document.getElementById('statPoles');
        const statFastLaps = document.getElementById('statFastLaps');
        const statTaxaTop10 = document.getElementById('statTaxaTop10');
        
        if (statParticipacoes) statParticipacoes.textContent = totalParticipacoes;
        if (statEtapas) statEtapas.textContent = totalEtapas;
        if (statCampeonatos) statCampeonatos.textContent = totalCampeonatos;
        if (statTitulos) statTitulos.textContent = totalTitulos;
        if (statTitulosIndividuais) statTitulosIndividuais.textContent = totalTitulosIndividuais;
        if (statTitulosConstrutores) statTitulosConstrutores.textContent = totalTitulosConstrutores;
        if (statPodios) statPodios.textContent = totalPodios;
        if (statVitorias) statVitorias.textContent = totalVitorias;
        if (statPoles) statPoles.textContent = totalPoles;
        if (statFastLaps) statFastLaps.textContent = totalFastLaps;
        if (statTaxaTop10) statTaxaTop10.textContent = taxaTop10;
        
        // Update about section - text
        const pilotosAbout = document.getElementById('totalPilotosAbout');
        const participacoesAbout = document.getElementById('totalParticipacoesAbout');
        const campeonatosAbout = document.getElementById('totalCampeonatosAbout');
        const etapasAbout = document.getElementById('totalEtapasAbout');
        const titulosAbout = document.getElementById('totalTitulosAbout');
        const titulosIndivAbout = document.getElementById('totalTitulosIndivAbout');
        const titulosConstAbout = document.getElementById('totalTitulosConstAbout');
        const podiosAbout = document.getElementById('totalPodiosAbout');
        const vitoriasAbout = document.getElementById('totalVitoriasAbout');
        const top10About = document.getElementById('totalTop10About');
        const top5About = document.getElementById('totalTop5About');
        const polesAbout = document.getElementById('totalPolesAbout');
        const fastLapsAbout = document.getElementById('totalFastLapsAbout');
        
        if (pilotosAbout) pilotosAbout.textContent = totalPilotos;
        if (participacoesAbout) participacoesAbout.textContent = totalParticipacoes.toLocaleString('pt-BR');
        if (campeonatosAbout) campeonatosAbout.textContent = totalCampeonatos;
        if (etapasAbout) etapasAbout.textContent = totalEtapas.toLocaleString('pt-BR');
        if (titulosAbout) titulosAbout.textContent = totalTitulos;
        if (titulosIndivAbout) titulosIndivAbout.textContent = totalTitulosIndividuais;
        if (titulosConstAbout) titulosConstAbout.textContent = totalTitulosConstrutores;
        if (podiosAbout) podiosAbout.textContent = totalPodios.toLocaleString('pt-BR');
        if (vitoriasAbout) vitoriasAbout.textContent = totalVitorias;
        if (top10About) top10About.textContent = totalTop10.toLocaleString('pt-BR');
        if (top5About) top5About.textContent = totalTop5.toLocaleString('pt-BR');
        if (polesAbout) polesAbout.textContent = totalPoles;
        if (fastLapsAbout) fastLapsAbout.textContent = totalFastLaps;
        
        // Update about section - feature cards
        const featureTitulos = document.getElementById('featureTitulos');
        const featureTitulosIndiv = document.getElementById('featureTitulosIndiv');
        const featureTitulosConst = document.getElementById('featureTitulosConst');
        const featureVitorias = document.getElementById('featureVitorias');
        const featurePodios = document.getElementById('featurePodios');
        const featurePilotos = document.getElementById('featurePilotos');
        
        if (featureTitulos) featureTitulos.textContent = totalTitulos;
        if (featureTitulosIndiv) featureTitulosIndiv.textContent = totalTitulosIndividuais;
        if (featureTitulosConst) featureTitulosConst.textContent = totalTitulosConstrutores;
        if (featureVitorias) featureVitorias.textContent = totalVitorias;
        if (featurePodios) featurePodios.textContent = totalPodios.toLocaleString('pt-BR');
        if (featurePilotos) featurePilotos.textContent = totalPilotos;
        
        // Load league-specific stats from participacoes.csv
        await loadLeagueStats();
        
        // Update pilotos section
        const pilotosSectionEl = document.getElementById('totalPilotosSection');
        if (pilotosSectionEl) pilotosSectionEl.textContent = totalPilotos;
        
        // Update footer
        const footerParticipacoes = document.getElementById('footerParticipacoes');
        const footerTitulos = document.getElementById('footerTitulos');
        const footerPodios = document.getElementById('footerPodios');
        
        if (footerParticipacoes) footerParticipacoes.textContent = totalParticipacoes.toLocaleString('pt-BR');
        if (footerTitulos) footerTitulos.textContent = totalTitulos;
        if (footerPodios) footerPodios.textContent = totalPodios.toLocaleString('pt-BR');
        
        // Load league-specific stats
        await loadLeagueStats();
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

// Load league-specific statistics
async function loadLeagueStats() {
    try {
        const response = await fetch('data/data-participacoes.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        // Parse CSV
        const participacoes = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                liga: values[11]?.trim() || '',
                temporada: values[12]?.trim() || '',
                pilotoCampeao: values[9]?.trim() || '',
                construtores: values[10]?.trim() || ''
            };
        }).filter(p => p.liga); // Remove empty leagues
        
        // Calculate unique leagues
        const uniqueLeagues = new Set(participacoes.map(p => p.liga));
        const totalLigas = uniqueLeagues.size;
        
        // Calculate F1BC stats
        const f1bcData = participacoes.filter(p => p.liga === 'F1BC');
        const f1bcParticipacoes = f1bcData.length;
        
        // Count unique championships with titles (one per temporada)
        const f1bcCampeonatosComTitulos = new Set();
        f1bcData.forEach(p => {
            if ((p.pilotoCampeao === 'SIM' || p.construtores === 'SIM' || p.construtores === 'TIME') && p.temporada) {
                f1bcCampeonatosComTitulos.add(p.temporada);
            }
        });
        const f1bcTitulos = f1bcCampeonatosComTitulos.size;
        
        // Calculate Racing Bears stats
        const rbData = participacoes.filter(p => p.liga === 'Racing Bears');
        const rbParticipacoes = rbData.length;
        const rbCampeonatosComTitulos = new Set();
        rbData.forEach(p => {
            if ((p.pilotoCampeao === 'SIM' || p.construtores === 'SIM' || p.construtores === 'TIME') && p.temporada) {
                rbCampeonatosComTitulos.add(p.temporada);
            }
        });
        const rbTitulos = rbCampeonatosComTitulos.size;
        
        // Calculate RacersAv stats
        const racersavData = participacoes.filter(p => p.liga === 'RacersAv');
        const racersavParticipacoes = racersavData.length;
        const racersavCampeonatosComTitulos = new Set();
        racersavData.forEach(p => {
            if ((p.pilotoCampeao === 'SIM' || p.construtores === 'SIM' || p.construtores === 'TIME') && p.temporada) {
                racersavCampeonatosComTitulos.add(p.temporada);
            }
        });
        const racersavTitulos = racersavCampeonatosComTitulos.size;
        
        // Calculate iRacing stats
        const iracingParticipacoes = participacoes.filter(p => p.liga === 'iRacing').length;
        
        // Update UI
        const totalLigasEl = document.getElementById('totalLigasAbout');
        const featureLigas = document.getElementById('featureLigas');
        const f1bcParticipacoesEl = document.getElementById('f1bcParticipacoesAbout');
        const f1bcTitulosEl = document.getElementById('f1bcTitulosAbout');
        const rbParticipacoesEl = document.getElementById('rbParticipacoesAbout');
        const rbTitulosEl = document.getElementById('rbTitulosAbout');
        const racersavParticipacoesEl = document.getElementById('racersavParticipacoesAbout');
        const racersavTitulosEl = document.getElementById('racersavTitulosAbout');
        const iracingParticipacoesEl = document.getElementById('iracingParticipacoesAbout');
        
        if (totalLigasEl) totalLigasEl.textContent = totalLigas;
        if (featureLigas) featureLigas.textContent = totalLigas;
        if (f1bcParticipacoesEl) f1bcParticipacoesEl.textContent = f1bcParticipacoes.toLocaleString('pt-BR');
        if (f1bcTitulosEl) f1bcTitulosEl.textContent = f1bcTitulos;
        if (rbParticipacoesEl) rbParticipacoesEl.textContent = rbParticipacoes;
        if (rbTitulosEl) rbTitulosEl.textContent = rbTitulos;
        if (racersavParticipacoesEl) racersavParticipacoesEl.textContent = racersavParticipacoes;
        if (racersavTitulosEl) racersavTitulosEl.textContent = racersavTitulos;
        if (iracingParticipacoesEl) iracingParticipacoesEl.textContent = iracingParticipacoes;
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas de ligas:', error);
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
