// =============================================
// rF2 SETUP — CIRCUIT REGISTRY
// =============================================

const CIRCUITS = [
  // ── BRASIL ───────────────────────────────────
  { id: 'interlagos',        group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Interlagos',              name: 'Autódromo José Carlos Pace',          city: 'São Paulo, SP',          sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'goiania',           group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Goiânia',                 name: 'Autódromo Internacional de Goiânia',   city: 'Goiânia, GO',            sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'curitiba',          group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Curitiba',                name: 'Autódromo Internacional de Curitiba',  city: 'Pinhais, PR',            sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'cascavel',          group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Cascavel',                name: 'Autódromo de Cascavel',               city: 'Cascavel, PR',           sentido: 'horario',      perfil: 'misto'          },
  { id: 'taruma',            group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Tarumã',                  name: 'Autódromo de Tarumã',                 city: 'Viamão, RS',             sentido: 'horario',      perfil: 'misto'          },
  { id: 'londrina',          group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Londrina',                name: 'Autódromo Internacional de Londrina',  city: 'Londrina, PR',           sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'velopark',          group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Velopark',                name: 'Velopark',                            city: 'Nova Santa Rita, RS',    sentido: 'anti-horario', perfil: 'tecnico'        },
  { id: 'campo-grande',      group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Campo Grande',            name: 'Autódromo Internacional de Campo Grande', city: 'Campo Grande, MS',    sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'santa-cruz',        group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Santa Cruz do Sul',       name: 'Autódromo de Santa Cruz do Sul',       city: 'Santa Cruz do Sul, RS',  sentido: 'horario',      perfil: 'misto'          },
  { id: 'guapore',           group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Guaporé',                 name: 'Autódromo de Guaporé',                city: 'Guaporé, RS',            sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'caruaru',           group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Caruaru',                  name: 'Autódromo Ayrton Senna',              city: 'Caruaru, PE',            sentido: 'anti-horario', perfil: 'tecnico'        },
  { id: 'velocita',          group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Velo Città',               name: 'Autódromo Velo Città',                city: 'Mogi Guaçu, SP',         sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'brasilia',          group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Brasília',                 name: 'Autódromo Internacional Nelson Piquet', city: 'Brasília, DF',           sentido: 'horario',      perfil: 'misto'          },
  { id: 'passo-fundo',       group: '🇧🇷 Brasil',        flag: '🇧🇷', shortName: 'Passo Fundo',              name: 'Autódromo de Passo Fundo',            city: 'Passo Fundo, RS',        sentido: 'horario',      perfil: 'misto'          },
  { id: 'potrero',           group: '🇦🇷 Argentina',     flag: '🇦🇷', shortName: 'Potrero de los Funes',    name: 'Circuito Potrero de los Funes',        city: 'San Luis',               sentido: 'anti-horario', perfil: 'alta-velocidade'},
  { id: 'buenos-aires-6',    group: '🇦🇷 Argentina',     flag: '🇦🇷', shortName: 'Buenos Aires Nº6',        name: 'Autódromo Oscar Alfredo Gálvez (Nº6)', city: 'Buenos Aires',           sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'termas',            group: '🇦🇷 Argentina',     flag: '🇦🇷', shortName: 'Termas de Rio Hondo',      name: 'Autódromo Termas de Río Hondo',        city: 'Santiago del Estero',    sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'san-juan',          group: '🇦🇷 Argentina',     flag: '🇦🇷', shortName: 'San Juan Villicum',        name: 'Circuito San Juan Villicum',           city: 'San Juan',               sentido: 'horario',      perfil: 'misto'          },
  // ── EUROPA ───────────────────────────────────
  { id: 'silverstone',       group: '🌍 Europa',          flag: '🇬🇧', shortName: 'Silverstone',             name: 'Silverstone Circuit',                 city: 'Northamptonshire, UK',   sentido: 'horario',      perfil: 'alta-velocidade'},
  { id: 'spa',               group: '🌍 Europa',          flag: '🇧🇪', shortName: 'Spa-Francorchamps',       name: 'Circuit de Spa-Francorchamps',         city: 'Stavelot, Bélgica',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'monza',             group: '🌍 Europa',          flag: '🇮🇹', shortName: 'Monza',                   name: 'Autodromo Nazionale di Monza',         city: 'Monza, Itália',          sentido: 'horario',      perfil: 'alta-velocidade'},
  { id: 'monaco',            group: '🌍 Europa',          flag: '🇲🇨', shortName: 'Monaco',                  name: 'Circuit de Monaco',                   city: 'Monte Carlo, Mônaco',    sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'barcelona',         group: '🌍 Europa',          flag: '🇪🇸', shortName: 'Barcelona (Catalunya)',   name: 'Circuit de Barcelona-Catalunya',       city: 'Montmeló, Espanha',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'nurburgring-gp',    group: '🌍 Europa',          flag: '🇩🇪', shortName: 'Nürburgring GP',          name: 'Nürburgring GP-Strecke',              city: 'Nürburg, Alemanha',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'nurburgring-nord',  group: '🌍 Europa',          flag: '🇩🇪', shortName: 'Nürburgring Nordschleife',name: 'Nürburgring Nordschleife',             city: 'Nürburg, Alemanha',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'imola',             group: '🌍 Europa',          flag: '🇮🇹', shortName: 'Imola',                   name: 'Autodromo Enzo e Dino Ferrari',        city: 'Imola, Itália',          sentido: 'horario',      perfil: 'misto'          },
  { id: 'zandvoort',         group: '🌍 Europa',          flag: '🇳🇱', shortName: 'Zandvoort',               name: 'Circuit Zandvoort',                   city: 'Zandvoort, Holanda',     sentido: 'horario',      perfil: 'misto'          },
  { id: 'hungaroring',       group: '🌍 Europa',          flag: '🇭🇺', shortName: 'Hungaroring',             name: 'Hungaroring',                         city: 'Mogyoród, Hungria',      sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'mugello',           group: '🌍 Europa',          flag: '🇮🇹', shortName: 'Mugello',                 name: 'Autodromo del Mugello',               city: 'Scarperia, Itália',      sentido: 'horario',      perfil: 'alta-velocidade'},
  { id: 'le-mans',           group: '🌍 Europa',          flag: '🇫🇷', shortName: 'Le Mans',                 name: 'Circuit de la Sarthe',                city: 'Le Mans, França',        sentido: 'horario',      perfil: 'alta-velocidade'},
  { id: 'paul-ricard',       group: '🌍 Europa',          flag: '🇫🇷', shortName: 'Paul Ricard',             name: 'Circuit Paul Ricard',                 city: 'Le Castellet, França',   sentido: 'horario',      perfil: 'misto'          },
  { id: 'portimao',          group: '🌍 Europa',          flag: '🇵🇹', shortName: 'Portimão',                name: 'Autodromo Internacional do Algarve',  city: 'Portimão, Portugal',     sentido: 'horario',      perfil: 'misto'          },
  { id: 'brands-hatch',      group: '🌍 Europa',          flag: '🇬🇧', shortName: 'Brands Hatch',            name: 'Brands Hatch Circuit',                city: 'Kent, UK',               sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'donington',         group: '🌍 Europa',          flag: '🇬🇧', shortName: 'Donington Park',           name: 'Donington Park Circuit',              city: 'Leicestershire, UK',     sentido: 'horario',      perfil: 'misto'          },
  { id: 'oulton-park',       group: '🌍 Europa',          flag: '🇬🇧', shortName: 'Oulton Park',              name: 'Oulton Park Circuit',                 city: 'Cheshire, UK',           sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'red-bull-ring',     group: '🌍 Europa',          flag: '🇦🇹', shortName: 'Red Bull Ring',            name: 'Red Bull Ring',                       city: 'Spielberg, Áustria',     sentido: 'horario',      perfil: 'misto'          },
  { id: 'hockenheim',        group: '🌍 Europa',          flag: '🇩🇪', shortName: 'Hockenheim',               name: 'Hockenheimring',                      city: 'Hockenheim, Alemanha',   sentido: 'horario',      perfil: 'misto'          },
  { id: 'misano',            group: '🌍 Europa',          flag: '🇮🇹', shortName: 'Misano',                   name: 'Misano World Circuit Marco Simoncelli', city: 'Misano Adriatico, Itália', sentido: 'horario',    perfil: 'misto'          },
  { id: 'vallelunga',        group: '🌍 Europa',          flag: '🇮🇹', shortName: 'Vallelunga',               name: 'Autodromo Vallelunga',                city: 'Campagnano, Itália',     sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'istanbul',          group: '🌍 Europa',          flag: '🇹🇷', shortName: 'Istanbul Park',            name: 'Istanbul Park',                       city: 'Istanbul, Turquia',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'jerez',             group: '🌍 Europa',          flag: '🇪🇸', shortName: 'Jerez',                    name: 'Circuito de Jerez — Ángel Nieto',     city: 'Jerez, Espanha',         sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'magny-cours',       group: '🌍 Europa',          flag: '🇫🇷', shortName: 'Magny-Cours',              name: 'Circuit de Nevers Magny-Cours',       city: 'Magny-Cours, França',    sentido: 'horario',      perfil: 'misto'          },
  { id: 'estoril',           group: '🌍 Europa',          flag: '🇵🇹', shortName: 'Estoril',                  name: 'Autódromo do Estoril',                city: 'Estoril, Portugal',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'brno',              group: '🌍 Europa',          flag: '🇨🇿', shortName: 'Brno',                     name: 'Automotodrom Brno',                   city: 'Brno, Rep. Tcheca',      sentido: 'horario',      perfil: 'misto'          },
  // ── ÁFRICA ───────────────────────────────────
  { id: 'kyalami',           group: '🌍 África',          flag: '🇿🇦', shortName: 'Kyalami',                  name: 'Kyalami Grand Prix Circuit',          city: 'Midrand, África do Sul', sentido: 'horario',      perfil: 'misto'          },
  // ── ÁSIA / ORIENTE MÉDIO ─────────────────────
  { id: 'suzuka',            group: '🌏 Ásia / Oriente Médio', flag: '🇯🇵', shortName: 'Suzuka',            name: 'Suzuka Circuit',                      city: 'Suzuka, Japão',          sentido: 'horario',      perfil: 'misto'          },
  { id: 'bahrain',           group: '🌏 Ásia / Oriente Médio', flag: '🇧🇭', shortName: 'Bahrain',           name: 'Bahrain International Circuit',       city: 'Sakhir, Bahrain',        sentido: 'horario',      perfil: 'misto'          },
  { id: 'jeddah',            group: '🌏 Ásia / Oriente Médio', flag: '🇸🇦', shortName: 'Jeddah',            name: 'Jeddah Corniche Circuit',             city: 'Jeddah, Arábia Saudita', sentido: 'anti-horario', perfil: 'alta-velocidade'},
  { id: 'singapore',         group: '🌏 Ásia / Oriente Médio', flag: '🇸🇬', shortName: 'Singapura',         name: 'Marina Bay Street Circuit',           city: 'Singapura',              sentido: 'anti-horario', perfil: 'tecnico'        },
  { id: 'abu-dhabi',         group: '🌏 Ásia / Oriente Médio', flag: '🇦🇪', shortName: 'Abu Dhabi',         name: 'Yas Marina Circuit',                  city: 'Abu Dhabi, EAU',         sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'lusail',            group: '🌏 Ásia / Oriente Médio', flag: '🇶🇦', shortName: 'Lusail (Qatar)',    name: 'Lusail International Circuit',         city: 'Lusail, Qatar',          sentido: 'anti-horario', perfil: 'alta-velocidade'},
  { id: 'sepang',            group: '🌏 Ásia / Oriente Médio', flag: '🇲🇾', shortName: 'Sepang',            name: 'Sepang International Circuit',         city: 'Kuala Lumpur, Malásia',  sentido: 'horario',      perfil: 'misto'          },
  { id: 'shanghai',          group: '🌏 Ásia / Oriente Médio', flag: '🇨🇳', shortName: 'Shanghai',          name: 'Shanghai International Circuit',       city: 'Xangai, China',          sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'fuji',              group: '🌏 Ásia / Oriente Médio', flag: '🇯🇵', shortName: 'Fuji Speedway',     name: 'Fuji Speedway',                        city: 'Oyama, Japão',           sentido: 'horario',      perfil: 'alta-velocidade'},
  { id: 'okayama',           group: '🌏 Ásia / Oriente Médio', flag: '🇯🇵', shortName: 'Okayama',           name: 'Okayama International Circuit',        city: 'Okayama, Japão',         sentido: 'horario',      perfil: 'misto'          },
  { id: 'yeongam',           group: '🌏 Ásia / Oriente Médio', flag: '🇰🇷', shortName: 'Yeongam (Coreia)',  name: 'Korea International Circuit',          city: 'Yeongam, Coreia do Sul', sentido: 'horario',      perfil: 'misto'          },
  // ── AMÉRICAS ─────────────────────────────────
  { id: 'cota',              group: '🌎 Américas',        flag: '🇺🇸', shortName: 'COTA (Austin)',           name: 'Circuit of the Americas',             city: 'Austin, EUA',            sentido: 'anti-horario', perfil: 'misto'          },
  { id: 'montreal',          group: '🌎 Américas',        flag: '🇨🇦', shortName: 'Montreal',               name: 'Circuit Gilles Villeneuve',           city: 'Montreal, Canadá',       sentido: 'horario',      perfil: 'misto'          },
  { id: 'laguna-seca',       group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Laguna Seca',            name: 'WeatherTech Raceway Laguna Seca',     city: 'Monterey, EUA',          sentido: 'horario',      perfil: 'misto'          },
  { id: 'road-america',      group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Road America',           name: 'Road America',                        city: 'Elkhart Lake, EUA',      sentido: 'horario',      perfil: 'alta-velocidade'},
  { id: 'daytona',           group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Daytona',                name: 'Daytona International Speedway',       city: 'Daytona Beach, EUA',     sentido: 'anti-horario', perfil: 'alta-velocidade'},
  { id: 'mexico-city',       group: '🌎 Américas',        flag: '🇲🇽', shortName: 'Cidade do México',       name: 'Autódromo Hermanos Rodríguez',         city: 'Cidade do México',       sentido: 'horario',      perfil: 'misto'          },
  { id: 'watkins-glen',      group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Watkins Glen',           name: 'Watkins Glen International',           city: 'New York, EUA',          sentido: 'horario',      perfil: 'misto'          },
  { id: 'road-atlanta',      group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Road Atlanta',           name: 'Michelin Raceway Road Atlanta',        city: 'Braselton, EUA',         sentido: 'horario',      perfil: 'misto'          },
  { id: 'sebring',           group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Sebring',                name: 'Sebring International Raceway',        city: 'Sebring, EUA',           sentido: 'horario',      perfil: 'misto'          },
  { id: 'indianapolis',      group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Indianapolis (Road)',    name: 'Indianapolis Motor Speedway (Road)',   city: 'Indianapolis, EUA',      sentido: 'horario',      perfil: 'misto'          },
  { id: 'las-vegas',         group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Las Vegas',              name: 'Las Vegas Strip Circuit',              city: 'Las Vegas, EUA',         sentido: 'anti-horario', perfil: 'alta-velocidade'},
  { id: 'miami',             group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Miami',                  name: 'Miami International Autodrome',        city: 'Miami Gardens, EUA',     sentido: 'horario',      perfil: 'misto'          },
  { id: 'mid-ohio',          group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Mid-Ohio',               name: 'Mid-Ohio Sports Car Course',           city: 'Lexington, EUA',         sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'lime-rock',         group: '🌎 Américas',        flag: '🇺🇸', shortName: 'Lime Rock',              name: 'Lime Rock Park',                       city: 'Connecticut, EUA',       sentido: 'horario',      perfil: 'tecnico'        },
  { id: 'vir',               group: '🌎 Américas',        flag: '🇺🇸', shortName: 'VIR',                    name: 'Virginia International Raceway',       city: 'Alton, EUA',             sentido: 'horario',      perfil: 'misto'          },
  // ── OCEANIA ──────────────────────────────────
  { id: 'melbourne',         group: '🌏 Oceania',         flag: '🇦🇺', shortName: 'Melbourne',              name: 'Albert Park Circuit',                 city: 'Melbourne, Austrália',   sentido: 'horario',      perfil: 'misto'          },
];

function buildCircuitOptions(selectedId) {
  const groups = {};
  for (const c of CIRCUITS) {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  }
  let html = `<option value="">— selecionar circuito —</option>`;
  for (const [groupName, circuits] of Object.entries(groups)) {
    html += `<optgroup label="${groupName}">`;
    for (const c of circuits) {
      const sel = c.id === selectedId ? ' selected' : '';
      html += `<option value="${c.id}"${sel}>${c.flag} ${c.shortName} · ${c.city}</option>`;
    }
    html += `</optgroup>`;
  }
  return html;
}

// =============================================
// rF2 SETUP — DIAGNOSIS SCENARIOS
// =============================================

const SCENARIOS = [
  // ── SOBREESTERÇO ─────────────────────────────
  {
    id: 'oversteer-general',
    category: 'Sobreesterço (Traseira)',
    icon: '↩',
    title: 'Sobreesterço Geral',
    description: 'Traseira sai em vários pontos da curva, carro difícil de controlar.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'rear_arb',   direction: 'up',   label: 'ARB Traseiro',         reason: 'Reduz o roll traseiro, aumenta grip nas curvas.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'front_arb',  direction: 'down', label: 'ARB Dianteiro',        reason: 'Transfere mais carga para o eixo traseiro, melhorando o balanço.' },
      { catKey: 'suspension_and_aero', subKey: 'rear_suspension', fieldKey: 'spring_rate', direction: 'down', label: 'Mola Traseira',       reason: 'Mola mais suave mantém a traseira plantada nas transferências de carga.' },
      { catKey: 'dampers',             subKey: 'rear_dampers',   fieldKey: 'slow_rebound', direction: 'down', label: 'Rebound Lento Traseiro', reason: 'Traseira assenta mais rápido após transferência de carga.' },
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'rear_downforce', direction: 'up', label: 'Downforce Traseiro',  reason: 'Mais carga aerodinâmica na traseira aumenta grip em alta velocidade.' },
    ]
  },
  {
    id: 'oversteer-exit',
    category: 'Sobreesterço (Traseira)',
    icon: '🔥',
    title: 'Saída de Curva Solta',
    description: 'Traseira sai sob aceleração na saída da curva.',
    adjustments: [
      { catKey: 'dampers',             subKey: 'rear_dampers',   fieldKey: 'slow_rebound', direction: 'down', label: 'Rebound Lento Traseiro', reason: 'Permite que a traseira assente rapidamente durante a aceleração.' },
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'preload',      direction: 'down', label: 'Diferencial Preload',   reason: 'Diferencial abre mais cedo, menos travamento e deslizamento.' },
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'power',        direction: 'down', label: 'Diferencial Potência',  reason: 'Reduz travamento sob aceleração, permite rotação individual das rodas.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'rear_arb',     direction: 'up',   label: 'ARB Traseiro',         reason: 'Reduz roll traseiro, mantém tração sob potência.' },
      { catKey: 'suspension_and_aero', subKey: 'toe',            fieldKey: 'rear_toe',     direction: 'up',   label: 'Toe Traseiro (convergência)', reason: 'Mais convergência traseira aumenta estabilidade na saída.' },
    ]
  },
  {
    id: 'oversteer-entry',
    category: 'Sobreesterço (Traseira)',
    icon: '⚡',
    title: 'Entrada Nervosa',
    description: 'Traseira gira na frenagem ou no turn-in da curva.',
    adjustments: [
      { catKey: 'wheels_and_brakes',   subKey: 'brakes',         fieldKey: 'brake_bias',   direction: 'up',   label: 'Brake Bias (Dianteiro)', reason: 'Mais frenagem na frente reduz a tendência de rotação traseira.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'rear_arb',     direction: 'up',   label: 'ARB Traseiro',          reason: 'Maior rigidez traseira resiste ao movimento brusco de entrada.' },
      { catKey: 'dampers',             subKey: 'rear_dampers',   fieldKey: 'slow_bump',    direction: 'up',   label: 'Bump Lento Traseiro',   reason: 'Amortece a transferência de carga rápida na entrada da curva.' },
      { catKey: 'suspension_and_aero', subKey: 'rear_suspension', fieldKey: 'spring_rate', direction: 'up',   label: 'Mola Traseira',         reason: 'Mola mais firme resiste à rotação brusca na entrada.' },
    ]
  },

  // ── SUBESTERÇO ────────────────────────────────
  {
    id: 'understeer-general',
    category: 'Subesterço (Dianteiro)',
    icon: '➡',
    title: 'Subesterço Geral',
    description: 'Carro empurra em vez de virar — dianteiro não tem grip.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'front_arb',   direction: 'down', label: 'ARB Dianteiro',         reason: 'ARB mais suave aumenta o grip dianteiro nas curvas.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'rear_arb',    direction: 'up',   label: 'ARB Traseiro',          reason: 'Transfere o balanço para o dianteiro, reduzindo subesterço.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'spring_rate', direction: 'down', label: 'Mola Dianteira',     reason: 'Mola mais suave maximiza a área de contato do pneu dianteiro.' },
      { catKey: 'wheels_and_brakes',   subKey: 'front_wheels',   fieldKey: 'camber',       direction: 'down', label: 'Câmber Dianteiro',     reason: 'Mais câmber negativo melhora o grip do pneu nas curvas.' },
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'front_downforce', direction: 'up', label: 'Downforce Dianteiro', reason: 'Mais carga aerodinâmica no dianteiro melhora o grip em alta velocidade.' },
    ]
  },
  {
    id: 'understeer-entry',
    category: 'Subesterço (Dianteiro)',
    icon: '🔒',
    title: 'Entrada Travada',
    description: 'Carro não vira na entrada da curva — dianteiro sem resposta no turn-in.',
    adjustments: [
      { catKey: 'wheels_and_brakes',   subKey: 'brakes',         fieldKey: 'brake_bias',   direction: 'up',   label: 'Brake Bias (Dianteiro)', reason: 'Mais peso na frente durante a frenagem melhora o turn-in.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'front_arb',    direction: 'up',   label: 'ARB Dianteiro',          reason: 'ARB mais firme melhora a resposta inicial do dianteiro.' },
      { catKey: 'dampers',             subKey: 'front_dampers',  fieldKey: 'slow_rebound', direction: 'up',   label: 'Rebound Lento Dianteiro', reason: 'Rebound alto mantém o grip dianteiro por mais tempo na entrada.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'spring_rate', direction: 'down', label: 'Mola Dianteira',        reason: 'Mola suave permite mais contato do pneu durante a transferência de carga.' },
    ]
  },
  {
    id: 'understeer-exit',
    category: 'Subesterço (Dianteiro)',
    icon: '🚧',
    title: 'Saída com Subesterço',
    description: 'Dianteiro não segue na saída da curva sob aceleração.',
    adjustments: [
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'preload',      direction: 'up',   label: 'Diferencial Preload',    reason: 'Força as rodas traseiras a girar juntas, melhorando a tração de saída.' },
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'power',        direction: 'up',   label: 'Diferencial Potência',   reason: 'Mais bloqueio sob aceleração mantém a traseira estável na saída.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'rear_arb',     direction: 'up',   label: 'ARB Traseiro',           reason: 'Traseira mais firme libera o dianteiro para seguir sua trajetória.' },
      { catKey: 'wheels_and_brakes',   subKey: 'brakes',         fieldKey: 'brake_bias',   direction: 'down', label: 'Brake Bias (Traseiro)',  reason: 'Menos frenagem dianteira permite mais agressividade na saída.' },
    ]
  },

  // ── VELOCIDADE / ESTABILIDADE ─────────────────
  {
    id: 'straight-speed',
    category: 'Velocidade / Estabilidade',
    icon: '⚡',
    title: 'Mais Velocidade em Reta',
    description: 'Perda de tempo nas retas — precisa reduzir arrasto aerodinâmico.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'rear_downforce',  direction: 'down', label: 'Downforce Traseiro',   reason: 'Menos downforce traseiro reduz o arrasto aerodinâmico.' },
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'front_downforce', direction: 'down', label: 'Downforce Dianteiro',  reason: 'Reduz arrasto frontal para maior velocidade máxima.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'ride_height',   direction: 'down', label: 'Altura Dianteira',     reason: 'Ride height menor reduz a área frontal e melhora a aerodinâmica.' },
      { catKey: 'suspension_and_aero', subKey: 'rear_suspension', fieldKey: 'ride_height',    direction: 'down', label: 'Altura Traseira',      reason: 'Conjunto mais baixo reduz a resistência do ar.' },
    ]
  },
  {
    id: 'highspeed-instability',
    category: 'Velocidade / Estabilidade',
    icon: '💨',
    title: 'Instabilidade em Alta Velocidade',
    description: 'Carro nervoso ou impreciso acima de determinada velocidade.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'rear_downforce',  direction: 'up',   label: 'Downforce Traseiro',   reason: 'Mais carga traseira estabiliza o carro em alta velocidade.' },
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'front_downforce', direction: 'up',   label: 'Downforce Dianteiro',  reason: 'Equilíbrio aerodinâmico melhora a estabilidade geral.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars', fieldKey: 'rear_arb',        direction: 'up',   label: 'ARB Traseiro',          reason: 'Reduz oscilações traseiras em alta velocidade.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'ride_height',   direction: 'up',   label: 'Altura Dianteira',      reason: 'Ride height um pouco maior melhora a estabilidade na frenagem em alta.' },
      { catKey: 'suspension_and_aero', subKey: 'toe',            fieldKey: 'rear_toe',        direction: 'up',   label: 'Toe Traseiro (convergência)', reason: 'Mais convergência traseira melhora a estabilidade direcional.' },
    ]
  },
  {
    id: 'bumpy-track',
    category: 'Velocidade / Estabilidade',
    icon: '〰',
    title: 'Carro Saltando em Irregularidades',
    description: 'Setup muito rígido — carro perde contato com o asfalto em lombadas ou sarjetas.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'spring_rate',   direction: 'down', label: 'Mola Dianteira',       reason: 'Mola mais suave absorve irregularidades sem perder contato.' },
      { catKey: 'suspension_and_aero', subKey: 'rear_suspension',  fieldKey: 'spring_rate',   direction: 'down', label: 'Mola Traseira',        reason: 'Mesmo efeito na traseira — mais compliance mantém o grip.' },
      { catKey: 'dampers',             subKey: 'front_dampers',    fieldKey: 'slow_bump',     direction: 'down', label: 'Bump Lento Dianteiro', reason: 'Amortecedor mais suave permite que o pneu siga o perfil da pista.' },
      { catKey: 'dampers',             subKey: 'rear_dampers',     fieldKey: 'slow_bump',     direction: 'down', label: 'Bump Lento Traseiro',  reason: 'Traseira mais suave reduz os saltos sobre irregularidades.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars',   fieldKey: 'front_arb',     direction: 'down', label: 'ARB Dianteiro',        reason: 'ARB suave permite mais movimento independente de cada roda.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars',   fieldKey: 'rear_arb',      direction: 'down', label: 'ARB Traseiro',         reason: 'Idem na traseira — melhora o conforto sobre buracos e sarjetas.' },
    ]
  },

  // ── CONDIÇÕES ESPECIAIS ───────────────────────
  {
    id: 'wet-setup',
    category: 'Condições Especiais',
    icon: '🌧',
    title: 'Setup para Chuva',
    description: 'Adaptação do setup seco para condições de pista molhada.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'rear_downforce',  direction: 'up',   label: 'Downforce Traseiro (+4-5)',  reason: 'Surface molhada tem menos grip — downforce compensa a perda.' },
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'front_downforce', direction: 'up',   label: 'Downforce Dianteiro (+4-5)', reason: 'Equilíbrio de carga melhora a previsibilidade no molhado.' },
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'power',           direction: 'down', label: 'Diferencial Potência',       reason: 'Reduz wheelspin — rodas devem poder girar individualmente.' },
      { catKey: 'wheels_and_brakes',   subKey: 'brakes',         fieldKey: 'brake_bias',      direction: 'down', label: 'Brake Bias (Traseiro)',      reason: 'Menos frenagem dianteira reduz risco de trava dos pneus.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'spring_rate',   direction: 'down', label: 'Mola Dianteira',             reason: 'Setup mais suave é mais tolerante no baixo grip do molhado.' },
      { catKey: 'suspension_and_aero', subKey: 'rear_suspension',  fieldKey: 'spring_rate',   direction: 'down', label: 'Mola Traseira',              reason: 'Idem — suspensão suave melhora a estabilidade no molhado.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars',   fieldKey: 'front_arb',     direction: 'down', label: 'ARB Dianteiro',              reason: 'ARB suave aumenta a tolerância do carro em condições escorregadias.' },
      { catKey: 'suspension_and_aero', subKey: 'anti_roll_bars',   fieldKey: 'rear_arb',      direction: 'down', label: 'ARB Traseiro',               reason: 'Idem — setup mais permissivo facilita o controle no molhado.' },
    ]
  },
  {
    id: 'qualifying-setup',
    category: 'Condições Especiais',
    icon: '🏆',
    title: 'Setup para Classificação',
    description: 'Maximizar grip para uma volta rápida — sem preocupação com desgaste.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'front_downforce', direction: 'up',   label: 'Downforce Dianteiro',   reason: 'Máximo grip dianteiro para turn-in mais agressivo.' },
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'rear_downforce',  direction: 'up',   label: 'Downforce Traseiro',    reason: 'Mais aderência traseira para aceleração mais precoce.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'spring_rate',   direction: 'down', label: 'Mola Dianteira (suave)', reason: 'Pneus mais carregados, mais área de contato.' },
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'preload',         direction: 'up',   label: 'Diferencial Preload',    reason: 'Setup mais agressivo maximiza tração na volta rápida.' },
      { catKey: 'wheels_and_brakes',   subKey: 'brakes',         fieldKey: 'brake_bias',      direction: 'up',   label: 'Brake Bias (Dianteiro)', reason: 'Mais frenagem dianteira permite trail-braking mais agressivo.' },
    ]
  },
  {
    id: 'race-setup',
    category: 'Condições Especiais',
    icon: '🏁',
    title: 'Setup para Corrida',
    description: 'Priorizar estabilidade e durabilidade dos pneus para a distância de corrida.',
    adjustments: [
      { catKey: 'suspension_and_aero', subKey: 'aerodynamics',   fieldKey: 'rear_downforce',  direction: 'down', label: 'Downforce Traseiro (reduzir)', reason: 'Menos arrasto melhora consumo de combustível e velocidade em reta.' },
      { catKey: 'suspension_and_aero', subKey: 'front_suspension', fieldKey: 'spring_rate',   direction: 'up',   label: 'Mola Dianteira (firmar)',  reason: 'Setup mais firme mantém o balanço com carga de combustível variável.' },
      { catKey: 'suspension_and_aero', subKey: 'rear_suspension',  fieldKey: 'spring_rate',   direction: 'up',   label: 'Mola Traseira (firmar)',   reason: 'Estabilidade ao longo da corrida com tanque cheio.' },
      { catKey: 'powertrain',          subKey: 'differential',   fieldKey: 'power',           direction: 'down', label: 'Diferencial Potência',    reason: 'Setup mais conservador protege pneus traseiros na saída das curvas.' },
      { catKey: 'wheels_and_brakes',   subKey: 'brakes',         fieldKey: 'brake_bias',      direction: 'down', label: 'Brake Bias (menos frente)', reason: 'Menos agressividade no freio dianteiro protege os pneus na corrida.' },
    ]
  },
];

// ─── CIRCUIT TIPS ─────────────────────────────────────────────────────────────
const CIRCUIT_TIPS = {
  'alta-velocidade_seco': {
    icon: '⚡',
    text: 'Circuito de alta velocidade + seco: priorize baixo arrasto. Reduza as asas, firme as molas, ARBs mais rígidos para curvas sustentadas.',
  },
  'alta-velocidade_molhado': {
    icon: '🌧',
    text: 'Alta velocidade + molhado: cuidado com instabilidade em alta velocidade. Aumente downforce (+5 pts), suavize suspensão e reduza diferencial.',
  },
  'tecnico_seco': {
    icon: '🔧',
    text: 'Circuito técnico + seco: maximize downforce e grip mecânico. Diferencial suave para curvas lentas, freio bem à frente.',
  },
  'tecnico_molhado': {
    icon: '🌧',
    text: 'Técnico + molhado: setup muito suave e permissivo. Asas altas, ARBs brandos, diferencial aberto — priorize estabilidade.',
  },
  'misto_seco': {
    icon: '🏁',
    text: 'Circuito misto + seco: compromisso entre grip e velocidade. Asas intermediárias, molas balanceadas entre firme e suave.',
  },
  'misto_molhado': {
    icon: '🌧',
    text: 'Misto + molhado: aumente downforce, suavize suspensão, reduza diferencial de potência. Bias ligeiramente mais para trás.',
  },
};

const ANTICLOCKWISE_TIP = {
  icon: '🔄',
  text: 'Sentido anti-horário: desgaste assimétrico de pneus mais pronunciado (maior carga no lado esquerdo). Se permitido, considere pressões ligeiramente assimétricas.',
};

// ─── BUILD PANEL HTML ─────────────────────────────────────────────────────────
function buildDiagnosisPanel(circuitInfo) {
  const { sentido, perfil, condicao } = circuitInfo || {};

  // Banner contextual
  let bannerHtml = '';
  const tipKey = `${perfil}_${condicao}`;
  const tip = CIRCUIT_TIPS[tipKey];
  if (tip) {
    bannerHtml += `<div class="diagnosis-tip"><span class="diagnosis-tip-icon">${tip.icon}</span><span>${tip.text}</span></div>`;
  }
  if (sentido === 'anti-horario') {
    bannerHtml += `<div class="diagnosis-tip diagnosis-tip-warn"><span class="diagnosis-tip-icon">${ANTICLOCKWISE_TIP.icon}</span><span>${ANTICLOCKWISE_TIP.text}</span></div>`;
  }

  // Agrupar cenários por categoria
  const categories = {};
  for (const sc of SCENARIOS) {
    if (!categories[sc.category]) categories[sc.category] = [];
    categories[sc.category].push(sc);
  }

  let bodyHtml = '';
  for (const [catName, scenarios] of Object.entries(categories)) {
    bodyHtml += `<div class="diagnosis-category">
      <div class="diagnosis-category-title">${catName}</div>`;
    for (const sc of scenarios) {
      const adjustHtml = sc.adjustments.map(a => `
        <div class="diagnosis-adjustment">
          <span class="diagnosis-adj-dir ${a.direction === 'up' ? 'up' : 'down'}">${a.direction === 'up' ? '↑' : '↓'}</span>
          <span class="diagnosis-adj-label">${a.label}</span>
          <span class="diagnosis-adj-reason">${a.reason}</span>
          <button class="diagnosis-goto" onclick="navigateToField('${a.catKey}','${a.subKey}','${a.fieldKey}')">Ver →</button>
        </div>`).join('');

      bodyHtml += `
        <div class="diagnosis-card" id="sc-${sc.id}">
          <button class="diagnosis-card-header" onclick="toggleScenario('${sc.id}')">
            <span class="diagnosis-card-icon">${sc.icon}</span>
            <span class="diagnosis-card-title">${sc.title}</span>
            <span class="diagnosis-card-desc">${sc.description}</span>
            <span class="diagnosis-card-arrow">▾</span>
          </button>
          <div class="diagnosis-card-body" id="scb-${sc.id}">
            ${adjustHtml}
          </div>
        </div>`;
    }
    bodyHtml += `</div>`;
  }

  return `
    <div class="analysis-panel diagnosis-panel" role="dialog">
      <div class="analysis-header">
        <span class="analysis-title">Diagnóstico de Setup</span>
        <button class="analysis-close" onclick="hideDiagnosis()">✕</button>
      </div>
      <div class="diagnosis-banner">${bannerHtml}</div>
      <div class="analysis-body diagnosis-body">${bodyHtml}</div>
    </div>`;
}

// ─── TOGGLE SCENARIO CARD ─────────────────────────────────────────────────────
function toggleScenario(id) {
  const card = document.getElementById('sc-' + id);
  if (!card) return;
  const isOpen = card.classList.contains('open');
  // Close all
  document.querySelectorAll('.diagnosis-card.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) card.classList.add('open');
}
