// ========================================
// GRIP RACING - JAVASCRIPT
// ========================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => Number(n).toLocaleString('pt-BR');

// Navbar: estado "scrolled" (header é injetado depois, então busca a cada frame)
(() => {
    let ticking = false;
    const update = () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    document.addEventListener('DOMContentLoaded', update);
})();

// Simple AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', () => {
    const aosElements = document.querySelectorAll('[data-aos]');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        aosElements.forEach(el => el.classList.add('aos-animate'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    aosElements.forEach(el => observer.observe(el));
});

// ========================================
// HOME - estatísticas dinâmicas
// ========================================

const homeStats = {};

// Contador estilo "cronômetro": anima de 0 até o valor final
function runCounter(el, target, duration = 1600) {
    if (prefersReducedMotion) {
        el.textContent = fmt(target);
        return;
    }
    const start = performance.now();
    const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Painel de telemetria: anima quando estiver visível E com dados carregados
function setupTelemetry() {
    const panel = document.querySelector('.telemetry');
    if (!panel) return;

    let visible = false;
    let started = false;
    const start = () => {
        if (started || !visible || !homeStats.loaded) return;
        started = true;
        panel.classList.add('is-live');
        panel.querySelectorAll('.stat-number[data-value]').forEach(el => {
            runCounter(el, parseInt(el.dataset.value, 10) || 0);
        });
    };

    panel.addEventListener('stats:ready', start);

    if (!('IntersectionObserver' in window)) {
        visible = true;
        start();
        return;
    }
    const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
            visible = true;
            io.disconnect();
            start();
        }
    }, { threshold: 0.3 });
    io.observe(panel);
}

function applyFooterStats() {
    if (!homeStats.loaded) return;
    setText('footerParticipacoes', fmt(homeStats.participacoes));
    setText('footerTitulos', fmt(homeStats.titulos));
    setText('footerPodios', fmt(homeStats.podios));
    setText('footerCampeonatos', fmt(homeStats.campeonatos));
}

// Load dynamic stats
async function loadDynamicStats() {
    try {
        const statsResponse = await fetch('/data/data-stats.csv');
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
        const taxaTop10 = totalParticipacoes > 0 ? Math.round((totalTop10 / totalParticipacoes) * 100) : 0;

        Object.assign(homeStats, {
            loaded: true,
            participacoes: totalParticipacoes,
            titulos: totalTitulos,
            podios: totalPodios,
            campeonatos: totalCampeonatos
        });
        applyFooterStats();

        // Daqui para baixo só existe na home
        if (!document.querySelector('.page-home')) return;

        const pilotosResponse = await fetch('/data/data-pilotos.csv');
        const pilotosText = await pilotosResponse.text();
        const totalPilotos = pilotosText.trim().split('\n').length - 1;

        // Painel de telemetria: valor final em data-value (o contador anima até ele)
        const counters = {
            statParticipacoes: totalParticipacoes,
            statEtapas: totalEtapas,
            statCampeonatos: totalCampeonatos,
            statTitulos: totalTitulos,
            statPodios: totalPodios,
            statPoles: totalPoles,
            statFastLaps: totalFastLaps,
            statTaxaTop10: taxaTop10
        };
        Object.entries(counters).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.dataset.value = value;
            el.textContent = fmt(value);
        });
        setText('statTitulosIndividuais', fmt(totalTitulosIndividuais));
        setText('statTitulosConstrutores', fmt(totalTitulosConstrutores));
        setText('statVitorias', fmt(totalVitorias));

        const split = document.getElementById('tmSplitFill');
        if (split && totalTitulos > 0) {
            split.style.setProperty('--fill', `${(totalTitulosIndividuais / totalTitulos) * 100}%`);
        }
        const gauge = document.getElementById('tmGaugeFill');
        if (gauge) gauge.style.setProperty('--fill', `${taxaTop10}%`);

        // Sobre
        setText('totalPilotosAbout', fmt(totalPilotos));
        setText('featurePilotos', fmt(totalPilotos));
        setText('totalTop10About', fmt(totalTop10));
        setText('totalTop5About', fmt(totalTop5));
        setText('totalVitoriasAbout', fmt(totalVitorias));
        // IDs legados (mantidos caso voltem ao HTML)
        setText('totalParticipacoesAbout', fmt(totalParticipacoes));
        setText('totalCampeonatosAbout', fmt(totalCampeonatos));
        setText('totalEtapasAbout', fmt(totalEtapas));
        setText('totalTitulosAbout', fmt(totalTitulos));
        setText('totalTitulosIndivAbout', fmt(totalTitulosIndividuais));
        setText('totalTitulosConstAbout', fmt(totalTitulosConstrutores));
        setText('totalPodiosAbout', fmt(totalPodios));
        setText('totalPolesAbout', fmt(totalPoles));
        setText('totalFastLapsAbout', fmt(totalFastLaps));

        // Equipe
        setText('totalPilotosSection', fmt(totalPilotos));

        const panel = document.querySelector('.telemetry');
        if (panel) panel.dispatchEvent(new CustomEvent('stats:ready'));

        await loadLeagueStats();
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

// Load league-specific statistics
async function loadLeagueStats() {
    try {
        const response = await fetch('/data/data-participacoes.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');

        const participacoes = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                liga: values[11]?.trim() || '',
                temporada: values[12]?.trim() || '',
                pilotoCampeao: values[9]?.trim() || '',
                construtores: values[10]?.trim() || ''
            };
        }).filter(p => p.liga);

        const totalLigas = new Set(participacoes.map(p => p.liga)).size;

        const leagueStats = (liga) => {
            const data = participacoes.filter(p => p.liga === liga);
            const comTitulos = new Set();
            data.forEach(p => {
                if ((p.pilotoCampeao === 'SIM' || p.construtores === 'SIM' || p.construtores === 'TIME') && p.temporada) {
                    comTitulos.add(p.temporada);
                }
            });
            return { participacoes: data.length, titulos: comTitulos.size };
        };

        const f1bc = leagueStats('F1BC');
        const rb = leagueStats('Racing Bears');
        const racersav = leagueStats('RacersAv');
        const iracing = leagueStats('iRacing');

        setText('totalLigasAbout', totalLigas);
        setText('featureLigas', totalLigas);
        setText('f1bcParticipacoesAbout', fmt(f1bc.participacoes));
        setText('f1bcTitulosAbout', fmt(f1bc.titulos));
        setText('rbParticipacoesAbout', fmt(rb.participacoes));
        setText('rbTitulosAbout', fmt(rb.titulos));
        setText('racersavParticipacoesAbout', fmt(racersav.participacoes));
        setText('racersavTitulosAbout', fmt(racersav.titulos));
        setText('iracingParticipacoesAbout', fmt(iracing.participacoes));

        // Barras proporcionais da tabela de ligas
        const values = {
            f1bcParticipacoesAbout: f1bc.participacoes,
            rbParticipacoesAbout: rb.participacoes,
            racersavParticipacoesAbout: racersav.participacoes,
            iracingParticipacoesAbout: iracing.participacoes
        };
        const max = Math.max(1, ...Object.values(values));
        document.querySelectorAll('[data-bar-for]').forEach(bar => {
            const v = values[bar.dataset.barFor] || 0;
            bar.style.setProperty('--fill', `${Math.max(2, (v / max) * 100)}%`);
        });
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas de ligas:', error);
    }
}

setupTelemetry();
document.addEventListener('footerLoaded', applyFooterStats);
loadDynamicStats();

// Console easter egg
console.log('%c🏁 GRIP RACING 🏁', 'color: #FF6B00; font-size: 30px; font-weight: bold;');
console.log('%cPaixão por velocidade desde 2008!', 'color: #FFFFFF; font-size: 14px;');
console.log('%cInteressado em fazer parte? Entre em contato!', 'color: #999999; font-size: 12px;');
