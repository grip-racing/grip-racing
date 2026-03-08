// ========================================
// GRIP RACING - DATA LOADER FROM GOOGLE SHEETS
// ========================================

const DATA_SOURCES = {
    participacoes: 'data/data-participacoes.csv',
    estatisticas: 'data/data-stats.csv',
    pilotos: 'data/data-pilotos.csv'
};

// Update statistics on the page
async function updateStatistics() {
    const stats = await window.GripUtils.fetchData(DATA_SOURCES.estatisticas);
    if (!stats || stats.length === 0) return;
    
    // First row has "Total" summary
    const totalRow = stats.find(row => row.RESUMO === 'Total');
    if (!totalRow) return;
    
    console.log('Estatísticas carregadas:', totalRow);
    
    // Extract key numbers
    const participacoes = parseInt(totalRow['Participações'] || totalRow['Participacoes'] || 0);
    const etapas = parseInt(totalRow['Etapas'] || 0);
    const campeonatos = parseInt(totalRow['Campeonatos'] || 0);
    const titulos = parseInt(totalRow['Títulos'] || totalRow['Titulos'] || 0);
    const construtores = parseInt(totalRow['Construtores'] || 0);
    const totalTitulos = titulos + construtores;
    const podios = parseInt(totalRow['Pódios'] || totalRow['Podios'] || 0);
    const vitorias = parseInt(totalRow['P1'] || 0);
    const poles = parseInt(totalRow['Poles'] || 0);
    const fastLaps = parseInt(totalRow['Fast Laps'] || 0);
    const top10 = parseInt(totalRow['Top 10'] || 0);
    const top5 = parseInt(totalRow['Top 5'] || 0);
    
    // Update stat cards based on their labels
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const number = card.querySelector('.stat-number');
        const label = card.querySelector('.stat-label');
        if (!number || !label) return;
        
        const labelText = label.textContent.toLowerCase();
        
        if (labelText.includes('participações')) {
            number.textContent = window.GripUtils.formatNumber(participacoes);
        } else if (labelText.includes('etapas')) {
            number.textContent = window.GripUtils.formatNumber(etapas);
        } else if (labelText.includes('campeonatos')) {
            number.textContent = window.GripUtils.formatNumber(campeonatos);
        } else if (labelText.includes('títulos')) {
            number.textContent = window.GripUtils.formatNumber(totalTitulos);
        } else if (labelText.includes('pódios')) {
            number.textContent = window.GripUtils.formatNumber(podios);
            label.textContent = `Pódios (${vitorias} Vitórias)`;
        } else if (labelText.includes('pole')) {
            number.textContent = window.GripUtils.formatNumber(poles);
        } else if (labelText.includes('voltas')) {
            number.textContent = window.GripUtils.formatNumber(fastLaps);
        } else if (labelText.includes('taxa') || labelText.includes('top 10')) {
            if (participacoes > 0) {
                const taxa = ((top10 / participacoes) * 100).toFixed(0);
                number.textContent = taxa + '%';
            }
        }
    });
    
    // Update about text with real statistics
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        const leadP = aboutText.querySelector('.lead');
        if (leadP) {
            leadP.innerHTML = 'Desde 2008, a Grip Racing é sinônimo de excelência no automobilismo virtual brasileiro.';
        }
        
        // Update main paragraph with current stats
        const mainP = aboutText.querySelectorAll('p')[1];
        if (mainP) {
            mainP.innerHTML = `Ao longo de 18 anos de história, construímos um legado impressionante com <strong>218 pilotos diferentes</strong> que representaram a equipe, acumulando <strong>${window.GripUtils.formatNumber(participacoes)} participações</strong> em <strong>${window.GripUtils.formatNumber(campeonatos)} campeonatos</strong> e <strong>${window.GripUtils.formatNumber(etapas)} etapas</strong>. Conquistamos <strong>${window.GripUtils.formatNumber(totalTitulos)} títulos</strong> (${titulos} de pilotos e ${construtores} de construtores), com <strong>${window.GripUtils.formatNumber(podios)} pódios</strong>, sendo ${vitorias} vitórias.`;
        }
        
        // Update detailed paragraph
        const detailP = aboutText.querySelectorAll('p')[2];
        if (detailP) {
            detailP.innerHTML = `Nossa presença se estende por <strong>29 ligas distintas</strong>, com destaque para F1BC (6.962 participações e 108 títulos), Racing Bears (627 participações), RacersAv, iRacing e competições internacionais. A consistência é nossa marca: <strong>${window.GripUtils.formatNumber(top10)} finalizações no Top 10</strong>, <strong>${window.GripUtils.formatNumber(top5)} no Top 5</strong>, além de ${poles} pole positions e ${fastLaps} voltas mais rápidas. Mais que números, somos uma família unida pela paixão, respeito e fair play.`;
        }
    }
    
    // Update footer stats
    const footerStats = document.querySelector('.footer-stats');
    if (footerStats) {
        footerStats.textContent = `${window.GripUtils.formatNumber(participacoes)} Participações • ${window.GripUtils.formatNumber(podios)} Pódios • ${window.GripUtils.formatNumber(totalTitulos)} Títulos • ${window.GripUtils.formatNumber(campeonatos)} Campeonatos`;
    }
}

// Update staff information
async function updateStaff() {
    const pilotos = await window.GripUtils.fetchData(DATA_SOURCES.pilotos);
    if (!pilotos || pilotos.length === 0) return;
        
    // Create a map of pilots by name (normalize names)
    const pilotosMap = {};
    pilotos.forEach(piloto => {
        const nome = (piloto.Piloto || '').trim();
        if (nome) {
            pilotosMap[nome.toLowerCase()] = piloto;
        }
    });
    
    // Update staff cards
    const staffCards = document.querySelectorAll('.staff-card');
    staffCards.forEach(card => {
        const nameElement = card.querySelector('.staff-name');
        if (!nameElement) return;
        
        const nomeCard = nameElement.textContent.trim();
        const nomeNormalizado = nomeCard.toLowerCase();
        
        // Try to find pilot (try exact match and partial matches)
        let pilotoData = pilotosMap[nomeNormalizado];
        
        // Try partial match if exact doesn't work
        if (!pilotoData) {
            for (const [key, value] of Object.entries(pilotosMap)) {
                if (key.includes(nomeNormalizado.split(' ')[0]) || nomeNormalizado.includes(key.split(' ')[0])) {
                    pilotoData = value;
                    break;
                }
            }
        }
        
        if (pilotoData) {
            const titulosInd = parseInt(pilotoData['Títulos'] || 0);
            const titulosConst = parseInt(pilotoData['Construtores'] || 0);
            const totTitulos = parseInt(pilotoData['Tot. Títulos'] || 0);
            const poles = parseInt(pilotoData['Poles'] || 0);
            const podios = parseInt(pilotoData['Podios'] || pilotoData['Pódios'] || 0);
            const top10 = parseInt(pilotoData['Top 10'] || 0);
            const corridas = parseInt(pilotoData['Corridas'] || 0);
            const vitorias = parseInt(pilotoData['P1'] || 0);
            const fastLaps = parseInt(pilotoData['Fast Laps'] || 0);

            // Update badges
            const badges = card.querySelectorAll('.highlight-badge');
            badges.forEach(badge => {
                const text = badge.textContent.toLowerCase();
                
                if (text.includes('título')) {
                    badge.textContent = `🏆 ${totTitulos} Títulos`;
                } else if (text.includes('pole')) {
                    badge.textContent = `⚡ ${poles} Poles`;
                } else if (text.includes('pódio')) {
                    badge.textContent = `🏍️ ${podios} Pódios`;
                } else if (text.includes('top 10')) {
                    badge.textContent = `🎯 ${top10} Top 10s`;
                } else if (text.includes('v. rápidas') || text.includes('rápida')) {
                    badge.textContent = `⚡ ${fastLaps} V. Rápidas`;
                }
            });

            // Update description stat elements
            card.querySelectorAll('[data-stat]').forEach(el => {
                switch (el.getAttribute('data-stat')) {
                    case 'tot-titulos':   el.textContent = totTitulos; break;
                    case 'titulos-ind':   el.textContent = titulosInd; break;
                    case 'titulos-const': el.textContent = titulosConst; break;
                    case 'poles':         el.textContent = poles; break;
                    case 'podios':        el.textContent = podios; break;
                    case 'top10':         el.textContent = top10; break;
                    case 'corridas':      el.textContent = corridas; break;
                    case 'vitorias':      el.textContent = vitorias; break;
                    case 'fast-laps':     el.textContent = fastLaps; break;
                }
            });
        }
    });
}

// Initialize data loading
async function initializeData() {
    console.log('🏁 Carregando dados da Grip Racing...');
    
    try {
        await Promise.all([
            // updateStatistics(), // Desabilitado - estatísticas agora são carregadas pelo script.js
            updateStaff()
        ]);
        
        console.log('✅ Dados carregados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
}

// Load data when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeData);
} else {
    initializeData();
}

// Optional: Refresh data every 5 minutes
// setInterval(initializeData, 5 * 60 * 1000);
