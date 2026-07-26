// =============================================
// rFactor 2 SVM IMPORT / EXPORT
// =============================================
// The .svm format stores an integer *index* per field, plus a human-readable
// comment with the actual value (e.g. RearBrakeSetting=24//53.0:47.0).
// We parse the value from the comment for import, and compute the index
// via (value - min) / step for export.
// =============================================

// =============================================
// SVM MAPS
// Schema field paths: 'category.subcategory.field'
// side: 'left' | 'right' | undefined (non-sided)
// =============================================
const svmMaps = {
  'stock-car-2007-cc': {
    FRONTWING:   { FWSetting:              { path: 'suspension_and_aero.aerodynamics.front_downforce' } },
    REARWING:    { RWSetting:              { path: 'suspension_and_aero.aerodynamics.rear_downforce' } },
    LEFTFENDER:  { FenderFlareSetting:     { path: 'chassis.alignment.fender_flare', side: 'left' } },
    RIGHTFENDER: { FenderFlareSetting:     { path: 'chassis.alignment.fender_flare', side: 'right' } },
    BODYAERO: {
      BrakeDuctSetting:       { path: 'wheels_and_brakes.brakes.front_brake_duct' },
      BrakeDuctRearSetting:   { path: 'wheels_and_brakes.brakes.rear_brake_duct' },
    },
    SUSPENSION: {
      FrontAntiSwaySetting:   { path: 'suspension_and_aero.anti_roll_bars.front_arb' },
      RearAntiSwaySetting:    { path: 'suspension_and_aero.anti_roll_bars.rear_arb' },
      FrontToeInSetting:      { path: 'suspension_and_aero.toe.front_toe' },
      RearToeInSetting:       { path: 'suspension_and_aero.toe.rear_toe' },
      LeftCasterSetting:      { path: 'chassis.alignment.caster', side: 'left' },
      RightCasterSetting:     { path: 'chassis.alignment.caster', side: 'right' },
    },
    CONTROLS: {
      SteerLockSetting:       { path: 'chassis.steering.steering_lock' },
      RearBrakeSetting:       { path: 'wheels_and_brakes.brakes.brake_bias' },
      BrakePressureSetting:   { path: 'wheels_and_brakes.brakes.max_pedal_force' },
    },
    ENGINE: {
      EngineBrakingMapSetting: { path: 'powertrain.electronics.engine_braking' },
    },
    DRIVELINE: {
      DiffPowerSetting:       { path: 'powertrain.differential.power' },
      DiffCoastSetting:       { path: 'powertrain.differential.coast' },
      DiffPreloadSetting:     { path: 'powertrain.differential.preload' },
    },
    FRONTLEFT: {
      CamberSetting:          { path: 'wheels_and_brakes.front_wheels.camber',              side: 'left' },
      PressureSetting:        { path: 'wheels_and_brakes.front_wheels.tire_pressure',       side: 'left' },
      SpringSetting:          { path: 'suspension_and_aero.front_suspension.spring_rate',   side: 'left' },
      RideHeightSetting:      { path: 'suspension_and_aero.front_suspension.ride_height',   side: 'left' },
      SlowBumpSetting:        { path: 'dampers.front_dampers.slow_bump',                    side: 'left' },
      FastBumpSetting:        { path: 'dampers.front_dampers.fast_bump',                    side: 'left' },
      SlowReboundSetting:     { path: 'dampers.front_dampers.slow_rebound',                 side: 'left' },
      FastReboundSetting:     { path: 'dampers.front_dampers.fast_rebound',                 side: 'left' },
    },
    FRONTRIGHT: {
      CamberSetting:          { path: 'wheels_and_brakes.front_wheels.camber',              side: 'right' },
      PressureSetting:        { path: 'wheels_and_brakes.front_wheels.tire_pressure',       side: 'right' },
      SpringSetting:          { path: 'suspension_and_aero.front_suspension.spring_rate',   side: 'right' },
      RideHeightSetting:      { path: 'suspension_and_aero.front_suspension.ride_height',   side: 'right' },
      SlowBumpSetting:        { path: 'dampers.front_dampers.slow_bump',                    side: 'right' },
      FastBumpSetting:        { path: 'dampers.front_dampers.fast_bump',                    side: 'right' },
      SlowReboundSetting:     { path: 'dampers.front_dampers.slow_rebound',                 side: 'right' },
      FastReboundSetting:     { path: 'dampers.front_dampers.fast_rebound',                 side: 'right' },
    },
    REARLEFT: {
      CamberSetting:          { path: 'wheels_and_brakes.rear_wheels.camber',               side: 'left' },
      PressureSetting:        { path: 'wheels_and_brakes.rear_wheels.tire_pressure',        side: 'left' },
      SpringSetting:          { path: 'suspension_and_aero.rear_suspension.spring_rate',    side: 'left' },
      RideHeightSetting:      { path: 'suspension_and_aero.rear_suspension.ride_height',    side: 'left' },
      SlowBumpSetting:        { path: 'dampers.rear_dampers.slow_bump',                     side: 'left' },
      FastBumpSetting:        { path: 'dampers.rear_dampers.fast_bump',                     side: 'left' },
      SlowReboundSetting:     { path: 'dampers.rear_dampers.slow_rebound',                  side: 'left' },
      FastReboundSetting:     { path: 'dampers.rear_dampers.fast_rebound',                  side: 'left' },
    },
    REARRIGHT: {
      CamberSetting:          { path: 'wheels_and_brakes.rear_wheels.camber',               side: 'right' },
      PressureSetting:        { path: 'wheels_and_brakes.rear_wheels.tire_pressure',        side: 'right' },
      SpringSetting:          { path: 'suspension_and_aero.rear_suspension.spring_rate',    side: 'right' },
      RideHeightSetting:      { path: 'suspension_and_aero.rear_suspension.ride_height',    side: 'right' },
      SlowBumpSetting:        { path: 'dampers.rear_dampers.slow_bump',                     side: 'right' },
      FastBumpSetting:        { path: 'dampers.rear_dampers.fast_bump',                     side: 'right' },
      SlowReboundSetting:     { path: 'dampers.rear_dampers.slow_rebound',                  side: 'right' },
      FastReboundSetting:     { path: 'dampers.rear_dampers.fast_rebound',                  side: 'right' },
    },
  }
};

// Generic template uses the same SVM key structure
svmMaps['generic'] = svmMaps['stock-car-2007-cc'];

// Car-specific SVM file headers
const svmHeaders = {
  'stock-car-2007-cc': 'VehicleClassSetting="Stock07CC"\nUpgradeSetting=(1,0,0,0)',
  'generic': '',
};

// SVM section output order
const SVM_SECTION_ORDER = [
  'GENERAL', 'LEFTFENDER', 'RIGHTFENDER', 'FRONTWING', 'REARWING',
  'BODYAERO', 'SUSPENSION', 'CONTROLS', 'ENGINE', 'DRIVELINE',
  'FRONTLEFT', 'FRONTRIGHT', 'REARLEFT', 'REARRIGHT', 'BASIC',
];

// =============================================
// HELPERS
// =============================================

/**
 * Extract the first numeric value from an SVM comment string.
 * "53.0:47.0"  → 53.0    (brake bias → take front %)
 * "-2.5 deg"   → -2.5
 * "70 N/mm"    → 70
 * "34L (21laps)" → 34
 * "Detached"   → null    (will fall back to index calc)
 */
function parseSvmComment(comment) {
  if (!comment) return null;
  const c = comment.trim();
  if (/^(Detached|N\/A|Off|none|N\/A)/i.test(c)) return null;
  const m = c.match(/^-?\d+\.?\d*/);
  return m ? parseFloat(m[0]) : null;
}

/** Round value to the precision implied by the step */
function snapToStep(value, field) {
  const decimals = (field.step.toString().split('.')[1] || '').length;
  const snapped = Math.round((value - field.min) / field.step) * field.step + field.min;
  return parseFloat(snapped.toFixed(decimals));
}

/** Compute SVM index from a value and schema field */
function valueToIndex(value, field) {
  return Math.round((value - field.min) / field.step);
}

/** Format a comment string for export */
function svmExportComment(value, field) {
  const decimals = (field.step.toString().split('.')[1] || '').length;
  const str = value.toFixed(decimals);
  return field.unit ? `${str} ${field.unit}` : str;
}

// =============================================
// IMPORT
// =============================================

/**
 * Parse an SVM text and populate a values object compatible with the schema.
 * Returns { values, issues[] }
 */
function importSvmText(text, schema, templateId) {
  const sectionMap = svmMaps[templateId];
  const issues = [];

  // Build defaults from schema
  const values = {};
  for (const [catKey, cat] of Object.entries(schema.categories)) {
    values[catKey] = {};
    for (const [subKey, sub] of Object.entries(cat)) {
      values[catKey][subKey] = {};
      for (const [fieldKey, field] of Object.entries(sub)) {
        values[catKey][subKey][fieldKey] = field.sides === 'both'
          ? { left: field.default, right: field.default }
          : field.default;
      }
    }
  }

  if (!sectionMap) {
    issues.push('noSvmMap');
    return { values, issues };
  }

  // Parse SVM into sections: { SECTIONNAME: { KeySetting: { index, comment } } }
  const parsed = {};
  let section = 'GLOBAL';
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('//')) continue;
    const sec = line.match(/^\[([^\]]+)\]/);
    if (sec) { section = sec[1].toUpperCase(); parsed[section] = parsed[section] || {}; continue; }
    // Active setting line: Key=index//comment  OR  Key=value (no comment)
    const m = line.match(/^(\w+)=(-?\d+\.?\d*)(\/\/(.*))?$/);
    if (m) {
      parsed[section] = parsed[section] || {};
      parsed[section][m[1]] = { index: parseInt(m[2]), comment: m[4] || '' };
    }
  }

  // Apply mapped values
  let mapped = 0;
  for (const [secName, keys] of Object.entries(sectionMap)) {
    const secData = parsed[secName];
    if (!secData) continue;
    for (const [svmKey, mapDef] of Object.entries(keys)) {
      const entry = secData[svmKey];
      if (!entry) continue;
      const [catKey, subKey, fieldKey] = mapDef.path.split('.');
      const field = schema.categories[catKey]?.[subKey]?.[fieldKey];
      if (!field) continue;

      // Prefer comment value; fall back to index-based
      let value = parseSvmComment(entry.comment);
      if (value === null) {
        value = field.min + entry.index * field.step;
      }

      // Clamp + snap
      value = Math.min(field.max, Math.max(field.min, value));
      value = snapToStep(value, field);

      if (field.sides === 'both') {
        if (mapDef.side === 'left')  values[catKey][subKey][fieldKey].left  = value;
        if (mapDef.side === 'right') values[catKey][subKey][fieldKey].right = value;
      } else {
        values[catKey][subKey][fieldKey] = value;
      }
      mapped++;
    }
  }

  if (mapped === 0) issues.push('noFieldsMapped');
  return { values, issues };
}

// =============================================
// EXPORT
// =============================================

/**
 * Build an SVM text string from current values.
 * Returns the SVM string, or null if no map exists for this template.
 */
function buildSvmText(values, schema, templateId, setupName, trackName) {
  const sectionMap = svmMaps[templateId];
  if (!sectionMap) return null;

  // Collect per-section output lines
  const sectionLines = {};

  for (const [secName, keys] of Object.entries(sectionMap)) {
    sectionLines[secName] = sectionLines[secName] || [];
    for (const [svmKey, mapDef] of Object.entries(keys)) {
      const [catKey, subKey, fieldKey] = mapDef.path.split('.');
      const field = schema.categories[catKey]?.[subKey]?.[fieldKey];
      if (!field) continue;

      let value;
      const stored = values[catKey]?.[subKey]?.[fieldKey];
      if (field.sides === 'both') {
        value = (stored && mapDef.side) ? stored[mapDef.side] : field.default;
      } else {
        value = stored ?? field.default;
      }

      const index   = valueToIndex(value, field);
      const comment = svmExportComment(value, field);
      sectionLines[secName].push(`${svmKey}=${index}//${comment}`);
    }
  }

  // Build header
  const header = svmHeaders[templateId] || '';
  let out = `// Generated by rF2 Setup Builder\n`;
  if (setupName)  out += `// Setup: ${setupName}\n`;
  if (trackName)  out += `// Track: ${trackName}\n`;
  if (header)     out += `${header}\n`;
  out += '\n';

  // Append sections in canonical order
  for (const sec of SVM_SECTION_ORDER) {
    const lines = sectionLines[sec];
    if (!lines || lines.length === 0) continue;
    out += `[${sec}]\n`;
    out += lines.join('\n') + '\n\n';
  }

  // BASIC section (rF2 requires it)
  out += '[BASIC]\nDownforce=0.500000\nBalance=0.500000\nRide=0.500000\nGearing=0.500000\nCustom=1\n';

  return out;
}

// =============================================
// UI
// =============================================

function triggerImportSvm(toolId) {
  document.getElementById('import-svm-' + toolId)?.click();
}

function importSvmFile(event, toolId) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const schema = currentSchema;
    const { values, issues } = importSvmText(e.target.result, schema, selectedTemplateId);

    if (issues.includes('noSvmMap')) {
      alert(uiStrings.noSvmMap);
      return;
    }

    currentValues   = values;
    currentSetupName = file.name.replace(/\.svm$/i, '') || uiStrings.importedSetup;
    currentTrackName = '';
    activeCategory  = null;
    linkState       = {};
    activeTagFilter = new Set();
    savedValues     = JSON.parse(JSON.stringify(values)); // imported state = new baseline
    isInBuilder     = true;
    renderTool(schema);
  };
  reader.readAsText(file);
  event.target.value = '';
}

function downloadSvm() {
  const svm = buildSvmText(currentValues, currentSchema, selectedTemplateId, currentSetupName, currentTrackName);
  if (!svm) { alert(uiStrings.noSvmMap); return; }
  const blob = new Blob([svm], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = (currentSetupName || 'setup').replace(/[^\w\s-]/g, '') + '.svm';
  a.click();
  URL.revokeObjectURL(a.href);
}
