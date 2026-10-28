// =============================================
// FUEL CALCULATOR
// =============================================
let isFuelCalcOpen = false;
let fcActiveTab    = 'pre';   // 'pre' | 'race'
let fcDurationMode = 'time';  // 'time' | 'laps'  (pré-corrida)
let fcRaceMode     = 'time';  // 'time' | 'laps'  (durante a corrida)

function launchFuelCalc() {
  isFuelCalcOpen = true;

  const workspace = document.getElementById('tool-workspace');
  workspace.style.display = 'block';
  document.getElementById('tool-renderer').innerHTML = renderFuelCalcPanel();
  if (!document.body.dataset.tool) {
    setTimeout(() => workspace.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
}

function renderFuelCalcPanel(preserve) {


  // Restaurar estado a partir do preserve
  if (preserve) {
    if (preserve.activeTab)    fcActiveTab    = preserve.activeTab;
    if (preserve.durationMode) fcDurationMode = preserve.durationMode;
    if (preserve.raceMode)     fcRaceMode     = preserve.raceMode;
  }

  // Valores pré-corrida
  const lapVal      = preserve?.lapTime    || '';
  const consVal     = preserve?.fuelPerLap || '';
  const durVal      = preserve?.duration   || '';
  const lapCountVal = preserve?.lapCount   || '';
  const extChk      = preserve?.extra      ? 'checked' : '';

  // Valores durante a corrida
  const raceFuelVal    = preserve?.currentFuel     || '';
  const raceConsVal    = preserve?.raceConsumption || '';
  const raceLapTimeVal = preserve?.raceLapTime     || '';
  const raceRemTimeVal = preserve?.remainingTime   || '';
  const raceRemLapsVal  = preserve?.remainingLaps   || '';
  const raceExtraChk    = preserve?.raceExtra        ? 'checked' : '';

  const preDisp  = fcActiveTab === 'pre'  ? '' : 'display:none';
  const raceDisp = fcActiveTab === 'race' ? '' : 'display:none';

  const durDisp    = fcDurationMode === 'time' ? '' : 'display:none';
  const lapCntDisp = fcDurationMode === 'laps' ? '' : 'display:none';

  const raceLtDisp  = fcRaceMode === 'time' ? '' : 'display:none';
  const raceRtDisp  = fcRaceMode === 'time' ? '' : 'display:none';
  const raceRlDisp  = fcRaceMode === 'laps' ? '' : 'display:none';

  // Campo com rótulo ligado ao input, unidade fixa e dica de formato
  const field = (o) => `
          <div class="fuel-field${o.span ? ' fuel-field--span' : ''}"${o.wrapId ? ` id="${o.wrapId}"` : ''}${o.style ? ` style="${o.style}"` : ''}>
            <label class="fuel-label" for="${o.id}">${o.label}</label>
            <div class="fuel-input-wrap">
              <input type="${o.type || 'text'}" id="${o.id}" class="fuel-input"${o.inputmode ? ` inputmode="${o.inputmode}"` : ''}
                placeholder="${o.ph}"${o.attrs ? ' ' + o.attrs : ''} autocomplete="off"
                aria-describedby="${o.id}-hint" value="${escapeHtmlFC(o.value)}" />
              <span class="fuel-unit" aria-hidden="true">${o.unit}</span>
            </div>
            <div class="fuel-input-hint" id="${o.id}-hint">${o.hint}</div>
          </div>`;

  // Tela do MFD (estado inicial: aguardando dados)
  const screen = (resultId, title) => `
        <div class="fuel-display" aria-live="polite">
          <div class="fuel-display-top">
            <span><b>FUEL</b> &middot; ${title}</span>
            <span class="fuel-leds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
          </div>
          <div class="fuel-idle">
            <div class="fuel-idle-value">--,--<small>L</small></div>
            <div class="fuel-idle-text">Aguardando dados &middot; preencha e calcule</div>
          </div>
          <div class="fuel-result" id="${resultId}" style="display:none"></div>
        </div>`;

  return `
    <div class="fuel-calc-panel">
      <div class="fuel-tabs" role="group" aria-label="Momento da corrida">
        <button type="button" class="fuel-tab${fcActiveTab === 'pre'  ? ' active' : ''}" aria-pressed="${fcActiveTab === 'pre'}" onclick="switchFuelTab('pre')">
          <span class="fuel-tab-num">01</span> Pré-Corrida <span class="fuel-tab-sub">Quanto abastecer</span>
        </button>
        <button type="button" class="fuel-tab${fcActiveTab === 'race' ? ' active' : ''}" aria-pressed="${fcActiveTab === 'race'}" onclick="switchFuelTab('race')">
          <span class="fuel-tab-num">02</span> Durante a Corrida <span class="fuel-tab-sub">Dá para terminar?</span>
        </button>
      </div>

      <!-- PRÉ-CORRIDA -->
      <div id="fc-tab-pre" class="fuel-tab-content" style="${preDisp}">
        <div class="fuel-console">
          <form class="fuel-inputs" novalidate onsubmit="event.preventDefault(); calcFuel(); fcRevealResult(this);">
            <div class="fuel-panel-title">Dados da prova</div>
            <div class="fuel-mode-toggle" role="group" aria-label="Duração da prova definida">
              <button type="button" class="fuel-mode-btn${fcDurationMode === 'time' ? ' active' : ''}" aria-pressed="${fcDurationMode === 'time'}" onclick="switchDurationMode('time')">Por Tempo</button>
              <button type="button" class="fuel-mode-btn${fcDurationMode === 'laps' ? ' active' : ''}" aria-pressed="${fcDurationMode === 'laps'}" onclick="switchDurationMode('laps')">Por Voltas</button>
            </div>
            <div class="fuel-calc-form">
              ${field({ id: 'fc-laptime', label: 'Tempo de Volta', unit: 'm:ss', ph: '1:32', hint: 'Minutos:segundos, ex.: 1:32', value: lapVal })}
              ${field({ id: 'fc-consumption', label: 'Consumo por Volta', unit: 'L/volta', ph: '2,8', hint: 'Use vírgula ou ponto', inputmode: 'decimal', value: consVal })}
              ${field({ id: 'fc-duration', wrapId: 'fc-duration-field', style: durDisp, span: true, type: 'number', label: 'Duração da Corrida', unit: 'min', ph: '60', hint: 'Tempo total da prova', attrs: 'min="1" step="1"', value: durVal })}
              ${field({ id: 'fc-lapcount', wrapId: 'fc-lapcount-field', style: lapCntDisp, span: true, type: 'number', label: 'Número de Voltas', unit: 'voltas', ph: '30', hint: 'Total de voltas da prova', attrs: 'min="1" step="1"', value: lapCountVal })}
            </div>
            <div class="fuel-check-row">
              <label class="fuel-check-label">
                <input type="checkbox" id="fc-extra" ${extChk} />
                <span class="fuel-check-text">+1 volta de margem de segurança</span>
              </label>
            </div>
            <button type="submit" class="fuel-calc-btn">Calcular combustível</button>
          </form>
          ${screen('fuel-result', 'Pré-corrida')}
        </div>
      </div>

      <!-- DURANTE A CORRIDA -->
      <div id="fc-tab-race" class="fuel-tab-content" style="${raceDisp}">
        <div class="fuel-console">
          <form class="fuel-inputs" novalidate onsubmit="event.preventDefault(); calcRaceFuel(); fcRevealResult(this);">
            <div class="fuel-panel-title">Situação agora</div>
            <div class="fuel-mode-toggle" role="group" aria-label="Restante da prova definido">
              <button type="button" class="fuel-mode-btn${fcRaceMode === 'time' ? ' active' : ''}" aria-pressed="${fcRaceMode === 'time'}" onclick="switchRaceMode('time')">Por Tempo</button>
              <button type="button" class="fuel-mode-btn${fcRaceMode === 'laps' ? ' active' : ''}" aria-pressed="${fcRaceMode === 'laps'}" onclick="switchRaceMode('laps')">Por Voltas</button>
            </div>
            <div class="fuel-calc-form">
              ${field({ id: 'fc-race-fuel', label: 'Combustível no Tanque', unit: 'L', ph: '15,0', hint: 'Quanto tem agora', inputmode: 'decimal', value: raceFuelVal })}
              ${field({ id: 'fc-race-consumption', label: 'Consumo por Volta', unit: 'L/volta', ph: '2,8', hint: 'Média das últimas voltas', inputmode: 'decimal', value: raceConsVal })}
              ${field({ id: 'fc-race-laptime', wrapId: 'fc-race-laptime-field', style: raceLtDisp, label: 'Tempo de Volta', unit: 'm:ss', ph: '1:32', hint: 'Minutos:segundos', value: raceLapTimeVal })}
              ${field({ id: 'fc-race-remaining-time', wrapId: 'fc-race-remtime-field', style: raceRtDisp, type: 'number', label: 'Tempo Restante', unit: 'min', ph: '20', hint: 'Minutos até a bandeirada', attrs: 'min="0" step="1"', value: raceRemTimeVal })}
              ${field({ id: 'fc-race-remaining-laps', wrapId: 'fc-race-remlaps-field', style: raceRlDisp, span: true, type: 'number', label: 'Voltas Restantes', unit: 'voltas', ph: '8', hint: 'Voltas até a bandeirada', attrs: 'min="1" step="1"', value: raceRemLapsVal })}
            </div>
            <div class="fuel-check-row">
              <label class="fuel-check-label">
                <input type="checkbox" id="fc-race-extra" ${raceExtraChk} />
                <span class="fuel-check-text">+1 volta de margem de segurança</span>
              </label>
            </div>
            <button type="submit" class="fuel-calc-btn">Calcular situação</button>
          </form>
          ${screen('race-result', 'Em corrida')}
        </div>
      </div>
    </div>
  `;
}

// ---- Tab / mode switchers ----

function switchFuelTab(tab) {
  fcActiveTab = tab;
  document.getElementById('fc-tab-pre').style.display  = tab === 'pre'  ? '' : 'none';
  document.getElementById('fc-tab-race').style.display = tab === 'race' ? '' : 'none';
  document.querySelectorAll('.fuel-tab').forEach((btn, i) => {
    const on = (i === 0 && tab === 'pre') || (i === 1 && tab === 'race');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
}

function switchDurationMode(mode) {
  fcDurationMode = mode;
  document.getElementById('fc-duration-field').style.display  = mode === 'time' ? '' : 'none';
  document.getElementById('fc-lapcount-field').style.display  = mode === 'laps' ? '' : 'none';
  document.querySelectorAll('#fc-tab-pre .fuel-mode-btn').forEach((btn, i) => {
    const on = (i === 0 && mode === 'time') || (i === 1 && mode === 'laps');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
  document.getElementById('fuel-result').style.display = 'none';
}

function switchRaceMode(mode) {
  fcRaceMode = mode;
  document.getElementById('fc-race-laptime-field').style.display = mode === 'time' ? '' : 'none';
  document.getElementById('fc-race-remtime-field').style.display = mode === 'time' ? '' : 'none';
  document.getElementById('fc-race-remlaps-field').style.display = mode === 'laps' ? '' : 'none';
  document.querySelectorAll('#fc-tab-race .fuel-mode-btn').forEach((btn, i) => {
    const on = (i === 0 && mode === 'time') || (i === 1 && mode === 'laps');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
  document.getElementById('race-result').style.display = 'none';
}

// ---- Cálculo pré-corrida ----

function calcFuel() {
  const fuelPerLap = fcParse(document.getElementById('fc-consumption').value);
  const extraLap   = document.getElementById('fc-extra').checked;
  const resultEl   = document.getElementById('fuel-result');

  let laps;
  let lapTimeSec = null;

  if (fcDurationMode === 'time') {
    const lapTimeStr = document.getElementById('fc-laptime').value.trim();
    const raceMins   = fcParse(document.getElementById('fc-duration').value);
    const lapParts   = lapTimeStr.match(/^(\d+):([0-5]\d)$/);
    if (!lapParts || isNaN(fuelPerLap) || fuelPerLap <= 0 || isNaN(raceMins) || raceMins <= 0) {
      resultEl.style.display = 'block';
      resultEl.dataset.state = 'error';
      resultEl.innerHTML = `<div class="fuel-error">Preencha todos os campos corretamente. Formato do tempo: m:ss</div>`;
      return;
    }
    lapTimeSec = parseInt(lapParts[1]) * 60 + parseInt(lapParts[2]);
    laps = Math.ceil((raceMins * 60) / lapTimeSec);
  } else {
    const lapCount   = fcParse(document.getElementById('fc-lapcount').value);
    const lapTimeStr = document.getElementById('fc-laptime').value.trim();
    if (isNaN(lapCount) || lapCount <= 0 || isNaN(fuelPerLap) || fuelPerLap <= 0) {
      resultEl.style.display = 'block';
      resultEl.dataset.state = 'error';
      resultEl.innerHTML = `<div class="fuel-error">Informe o número de voltas e o consumo corretamente.</div>`;
      return;
    }
    laps = Math.ceil(lapCount);
    const lapParts = lapTimeStr.match(/^(\d+):([0-5]\d)$/);
    if (lapParts) lapTimeSec = parseInt(lapParts[1]) * 60 + parseInt(lapParts[2]);
  }

  if (extraLap) laps += 1;

  const totalFuel      = laps * fuelPerLap;
  const lapTimeDisplay = lapTimeSec !== null ? fuelCalcFormatTime(lapTimeSec) : '—';

  resultEl.style.display = 'block';
  resultEl.dataset.state = 'info';
  resultEl.innerHTML = `
    <div class="fuel-result-grid">
      <div class="fuel-result-item">
        <div class="fuel-result-value">${laps}</div>
        <div class="fuel-result-label">Voltas</div>
      </div>
      <div class="fuel-result-item fuel-result-main">
        <div class="fuel-result-value">${fcFmt(totalFuel, 2)}&thinsp;L</div>
        <div class="fuel-result-label">Combustível Total</div>
      </div>
      <div class="fuel-result-item">
        <div class="fuel-result-value">${lapTimeDisplay}</div>
        <div class="fuel-result-label">Tempo de Volta</div>
      </div>
    </div>
    ${extraLap ? `<div class="fuel-result-note">✓ +1 volta de margem incluída</div>` : ''}
  `;
}

// ---- Cálculo durante a corrida ----

function calcRaceFuel() {
  const currentFuel = fcParse(document.getElementById('fc-race-fuel').value);
  const fuelPerLap  = fcParse(document.getElementById('fc-race-consumption').value);
  const resultEl    = document.getElementById('race-result');

  let remainingLaps;

  if (fcRaceMode === 'time') {
    const lapTimeStr    = document.getElementById('fc-race-laptime').value.trim();
    const remainingMins = parseFloat(document.getElementById('fc-race-remaining-time').value);
    const lapParts      = lapTimeStr.match(/^(\d+):([0-5]\d)$/);
    if (!lapParts || isNaN(fuelPerLap) || fuelPerLap <= 0 ||
        isNaN(currentFuel) || currentFuel < 0 ||
        isNaN(remainingMins) || remainingMins <= 0) {
      resultEl.style.display = 'block';
      resultEl.dataset.state = 'error';
      resultEl.innerHTML = `<div class="fuel-error">Preencha todos os campos. Formato do tempo: m:ss</div>`;
      return;
    }
    const lapTimeSec = parseInt(lapParts[1]) * 60 + parseInt(lapParts[2]);
    remainingLaps = Math.ceil((remainingMins * 60) / lapTimeSec);
  } else {
    const remLaps = parseFloat(document.getElementById('fc-race-remaining-laps').value);
    if (isNaN(fuelPerLap) || fuelPerLap <= 0 ||
        isNaN(currentFuel) || currentFuel < 0 ||
        isNaN(remLaps) || remLaps <= 0) {
      resultEl.style.display = 'block';
      resultEl.dataset.state = 'error';
      resultEl.innerHTML = `<div class="fuel-error">Preencha todos os campos corretamente.</div>`;
      return;
    }
    remainingLaps = Math.ceil(remLaps);
  }

  const raceExtra    = document.getElementById('fc-race-extra').checked;
  if (raceExtra) remainingLaps += 1;

  const fuelNeeded   = remainingLaps * fuelPerLap;
  const surplus      = currentFuel - fuelNeeded;
  const lapsAvail    = Math.floor(currentFuel / fuelPerLap);
  const canFinish    = surplus >= 0;
  const isTight      = canFinish && surplus <= 1;
  const surplusAbs   = Math.abs(surplus);
  const surplusColor = canFinish ? (isTight ? 'var(--fc-tight)' : 'var(--fc-ok)') : 'var(--fc-nok)';
  const surplusLabel = canFinish ? 'Sobra' : 'Falta';
  const verdictClass = isTight ? 'fuel-verdict-tight' : (canFinish ? 'fuel-verdict-ok' : 'fuel-verdict-nok');
  const verdict      = isTight ? '⚡ Dá no limite' : (canFinish ? '✓ Combustível suficiente' : '⚠ Precisa ir ao box');

  // L&C: calcular quando há déficit
  let lncHtml = '';
  if (!canFinish) {
    const targetCons   = currentFuel / remainingLaps;
    const savingsLap   = fuelPerLap - targetCons;
    const reductionPct = (savingsLap / fuelPerLap) * 100;
    let lncClass, lncText;
    if (reductionPct <= 5)       { lncClass = 'fuel-verdict-ok';      lncText = '✓ L&C tranquilo'; }
    else if (reductionPct <= 10) { lncClass = 'fuel-verdict-tight';   lncText = '⚡ L&C moderado'; }
    else if (reductionPct <= 20) { lncClass = 'fuel-verdict-warning'; lncText = '⚠ L&C agressivo'; }
    else                         { lncClass = 'fuel-verdict-nok';     lncText = '✗ L&C impossível'; }
    lncHtml = `
      <div class="fuel-result-grid fuel-result-grid--lnc">
        <div class="fuel-result-item">
          <div class="fuel-result-value fuel-result-value--sm">${fcFmt(targetCons, 3)}&thinsp;L</div>
          <div class="fuel-result-label">Consumo Alvo</div>
        </div>
        <div class="fuel-result-item">
          <div class="fuel-result-value fuel-result-value--sm">${fcFmt(savingsLap, 3)}&thinsp;L</div>
          <div class="fuel-result-label">Economia/Volta</div>
        </div>
        <div class="fuel-result-item">
          <div class="fuel-result-value fuel-result-value--sm">${fcFmt(reductionPct, 1)}%</div>
          <div class="fuel-result-label">Redução</div>
        </div>
      </div>
      <div class="fuel-verdict ${lncClass}">${lncText}</div>`;
  }

  resultEl.style.display = 'block';
  resultEl.dataset.state = isTight ? 'tight' : (canFinish ? 'ok' : 'nok');
  resultEl.innerHTML = `
    <div class="fuel-result-grid">
      <div class="fuel-result-item">
        <div class="fuel-result-value">${remainingLaps}</div>
        <div class="fuel-result-label">Voltas restantes</div>
      </div>
      <div class="fuel-result-item">
        <div class="fuel-result-value fuel-result-value--big" style="color:${surplusColor}">${fcFmt(surplusAbs, 2)}&thinsp;L</div>
        <div class="fuel-result-label">${surplusLabel}</div>
      </div>
      <div class="fuel-result-item">
        <div class="fuel-result-value">${lapsAvail}</div>
        <div class="fuel-result-label">Voltas possíveis</div>
      </div>
    </div>
    ${raceExtra ? `<div class="fuel-result-note">✓ +1 volta de margem incluída</div>` : ''}
    ${canFinish ? `<div class="fuel-verdict ${verdictClass}">${verdict}</div>` : ''}
    ${lncHtml}
  `;
}

// ---- Helpers ----
function fcParse(val) {
  return parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''));
}

function fcFmt(num, dec) {
  return num.toFixed(dec).replace('.', ',');
}

function fuelCalcFormatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeHtmlFC(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (document.body.dataset.tool === 'fuel-calc') {
  launchFuelCalc();
}

// ---- Apresentação: no celular a tela de resultado fica abaixo do formulário,
// então rolamos até ela depois de calcular. ----
function fcRevealResult(form) {
  if (!window.matchMedia('(max-width: 899px)').matches) return;
  const display = form?.parentElement?.querySelector('.fuel-display');
  if (!display) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  display.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
}
