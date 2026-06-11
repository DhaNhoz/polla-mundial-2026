// ─── SUPABASE ────────────────────────────────────────────────
const SB_URL = 'https://zeuwfbycrhxhjwvdvqoi.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldXdmYnljcmh4aGp3dmR2cW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzcxMzcsImV4cCI6MjA4Njg1MzEzN30.4OUEQMFmIY-voG_fW99DPAnEOjaON5fmGmAp92tx8EM'
const sb = supabase.createClient(SB_URL, SB_KEY)

// ─── GRUPOS ──────────────────────────────────────────────────
const GRUPOS = [
  { id:'A', color:'#8B1A1A', teams:['México','Sudáfrica','Corea del Sur','Rep. Checa'] },
  { id:'B', color:'#7A3B00', teams:['Canadá','Qatar','Suiza','Bosnia y Herzegovina'] },
  { id:'C', color:'#5A5000', teams:['Brasil','Marruecos','Haití','Escocia'] },
  { id:'D', color:'#1A6B1A', teams:['Estados Unidos','Paraguay','Australia','Turquía'] },
  { id:'E', color:'#005E5E', teams:['Alemania','Curazao','Costa de Marfil','Ecuador'] },
  { id:'F', color:'#004F6B', teams:['Países Bajos','Japón','Túnez','Suecia'] },
  { id:'G', color:'#002B8B', teams:['Bélgica','Egipto','Irán','Nueva Zelanda'] },
  { id:'H', color:'#2B006B', teams:['España','Cabo Verde','Arabia Saudí','Uruguay'] },
  { id:'I', color:'#5B006B', teams:['Francia','Senegal','Irak','Noruega'] },
  { id:'J', color:'#7A004A', teams:['Argentina','Argelia','Austria','Jordania'] },
  { id:'K', color:'#6B0030', teams:['Portugal','Uzbekistán','Colombia','R.D. Congo'] },
  { id:'L', color:'#5B2000', teams:['Inglaterra','Croacia','Ghana','Panamá'] },
]
const ALL_TEAMS = GRUPOS.flatMap(g => g.teams)

// ─── CALENDARIO COMPLETO ─────────────────────────────────────
// Hora Chile (CLT = UTC-4). Convertir hora local sede → CLT:
// México/GDL/MTY (UTC-6) → +2h Chile | L.A./S.F./SEA/VAN (UTC-7) → +3h Chile
// HOU/DAL/KC/PHI/ATL (UTC-5) → +1h Chile | NJ/BOS/MIA/TOR (UTC-4) = Chile
const PARTIDOS = [
  // ── 11 JUN ──
  { id:1,  fecha:'11 Jun', hora:'15:00', local:'México',          visita:'Sudáfrica',          grupo:'A', sede:'Ciudad de México', estado:'finalizado', gl:0, gv:0 },
  { id:2,  fecha:'11 Jun', hora:'22:00', local:'Corea del Sur',   visita:'Rep. Checa',          grupo:'A', sede:'Guadalajara',       estado:'finalizado', gl:0, gv:0 },
  // ── 12 JUN ──
  { id:3,  fecha:'12 Jun', hora:'15:00', local:'Canadá',          visita:'Bosnia y Herzegovina',grupo:'B', sede:'Toronto',           estado:'pendiente' },
  { id:4,  fecha:'12 Jun', hora:'21:00', local:'Estados Unidos',  visita:'Paraguay',            grupo:'D', sede:'Los Ángeles',       estado:'pendiente' },
  // ── 13 JUN ──
  { id:5,  fecha:'13 Jun', hora:'15:00', local:'Qatar',           visita:'Suiza',               grupo:'B', sede:'San Francisco',     estado:'pendiente' },
  { id:6,  fecha:'13 Jun', hora:'18:00', local:'Brasil',          visita:'Marruecos',           grupo:'C', sede:'Nueva Jersey',      estado:'pendiente' },
  { id:7,  fecha:'13 Jun', hora:'21:00', local:'Haití',           visita:'Escocia',             grupo:'C', sede:'Boston',            estado:'pendiente' },
  { id:8,  fecha:'13 Jun', hora:'22:00', local:'Australia',       visita:'Turquía',             grupo:'D', sede:'Vancouver',         estado:'pendiente' },
  // ── 14 JUN ──
  { id:9,  fecha:'14 Jun', hora:'13:00', local:'Alemania',        visita:'Curazao',             grupo:'E', sede:'Houston',           estado:'pendiente' },
  { id:10, fecha:'14 Jun', hora:'16:00', local:'Países Bajos',    visita:'Japón',               grupo:'F', sede:'Dallas',            estado:'pendiente' },
  { id:11, fecha:'14 Jun', hora:'19:00', local:'Costa de Marfil', visita:'Ecuador',             grupo:'E', sede:'Filadelfia',        estado:'pendiente' },
  { id:12, fecha:'14 Jun', hora:'22:00', local:'Suecia',          visita:'Túnez',               grupo:'F', sede:'Monterrey',         estado:'pendiente' },
  // ── 15 JUN ──
  { id:13, fecha:'15 Jun', hora:'12:00', local:'España',          visita:'Cabo Verde',          grupo:'H', sede:'Atlanta',           estado:'pendiente' },
  { id:14, fecha:'15 Jun', hora:'15:00', local:'Bélgica',         visita:'Egipto',              grupo:'G', sede:'Seattle',           estado:'pendiente' },
  { id:15, fecha:'15 Jun', hora:'18:00', local:'Arabia Saudí',    visita:'Uruguay',             grupo:'H', sede:'Miami',             estado:'pendiente' },
  { id:16, fecha:'15 Jun', hora:'21:00', local:'Irán',            visita:'Nueva Zelanda',       grupo:'G', sede:'Los Ángeles',       estado:'pendiente' },
  // ── 16 JUN ──
  { id:17, fecha:'16 Jun', hora:'15:00', local:'Francia',         visita:'Senegal',             grupo:'I', sede:'Nueva Jersey',      estado:'pendiente' },
  { id:18, fecha:'16 Jun', hora:'18:00', local:'Irak',            visita:'Noruega',             grupo:'I', sede:'Boston',            estado:'pendiente' },
  { id:19, fecha:'16 Jun', hora:'21:00', local:'Argentina',       visita:'Argelia',             grupo:'J', sede:'Kansas City',       estado:'pendiente' },
  { id:20, fecha:'16 Jun', hora:'22:00', local:'Austria',         visita:'Jordania',            grupo:'J', sede:'San Francisco',     estado:'pendiente' },
  // ── 17 JUN ──
  { id:21, fecha:'17 Jun', hora:'13:00', local:'Portugal',        visita:'R.D. Congo',          grupo:'K', sede:'Houston',           estado:'pendiente' },
  { id:22, fecha:'17 Jun', hora:'16:00', local:'Inglaterra',      visita:'Croacia',             grupo:'L', sede:'Dallas',            estado:'pendiente' },
  { id:23, fecha:'17 Jun', hora:'19:00', local:'Ghana',           visita:'Panamá',              grupo:'L', sede:'Toronto',           estado:'pendiente' },
  { id:24, fecha:'17 Jun', hora:'22:00', local:'Uzbekistán',      visita:'Colombia',            grupo:'K', sede:'Ciudad de México',  estado:'pendiente' },
  // ── 18 JUN ──
  { id:25, fecha:'18 Jun', hora:'12:00', local:'Rep. Checa',      visita:'Sudáfrica',           grupo:'A', sede:'Atlanta',           estado:'pendiente' },
  { id:26, fecha:'18 Jun', hora:'15:00', local:'Suiza',           visita:'Bosnia y Herzegovina',grupo:'B', sede:'Los Ángeles',       estado:'pendiente' },
  { id:27, fecha:'18 Jun', hora:'18:00', local:'Canadá',          visita:'Qatar',               grupo:'B', sede:'Vancouver',         estado:'pendiente' },
  { id:28, fecha:'18 Jun', hora:'21:00', local:'México',          visita:'Corea del Sur',       grupo:'A', sede:'Guadalajara',       estado:'pendiente' },
  // ── 19 JUN ──
  { id:29, fecha:'19 Jun', hora:'15:00', local:'Estados Unidos',  visita:'Australia',           grupo:'D', sede:'Seattle',           estado:'pendiente' },
  { id:30, fecha:'19 Jun', hora:'18:00', local:'Escocia',         visita:'Marruecos',           grupo:'C', sede:'Boston',            estado:'pendiente' },
  { id:31, fecha:'19 Jun', hora:'20:30', local:'Brasil',          visita:'Haití',               grupo:'C', sede:'Filadelfia',        estado:'pendiente' },
  { id:32, fecha:'19 Jun', hora:'23:00', local:'Turquía',         visita:'Paraguay',            grupo:'D', sede:'San Francisco',     estado:'pendiente' },
  // ── 20 JUN ──
  { id:33, fecha:'20 Jun', hora:'13:00', local:'Países Bajos',    visita:'Suecia',              grupo:'F', sede:'Houston',           estado:'pendiente' },
  { id:34, fecha:'20 Jun', hora:'16:00', local:'Alemania',        visita:'Costa de Marfil',     grupo:'E', sede:'Toronto',           estado:'pendiente' },
  { id:35, fecha:'20 Jun', hora:'20:00', local:'Ecuador',         visita:'Curazao',             grupo:'E', sede:'Kansas City',       estado:'pendiente' },
  { id:36, fecha:'20 Jun', hora:'22:00', local:'Túnez',           visita:'Japón',               grupo:'F', sede:'Monterrey',         estado:'pendiente' },
  // ── 21 JUN ──
  { id:37, fecha:'21 Jun', hora:'12:00', local:'España',          visita:'Arabia Saudí',        grupo:'H', sede:'Atlanta',           estado:'pendiente' },
  { id:38, fecha:'21 Jun', hora:'15:00', local:'Bélgica',         visita:'Irán',                grupo:'G', sede:'Los Ángeles',       estado:'pendiente' },
  { id:39, fecha:'21 Jun', hora:'18:00', local:'Uruguay',         visita:'Cabo Verde',          grupo:'H', sede:'Miami',             estado:'pendiente' },
  { id:40, fecha:'21 Jun', hora:'21:00', local:'Nueva Zelanda',   visita:'Egipto',              grupo:'G', sede:'Vancouver',         estado:'pendiente' },
  // ── 22 JUN ──
  { id:41, fecha:'22 Jun', hora:'13:00', local:'Argentina',       visita:'Austria',             grupo:'J', sede:'Dallas',            estado:'pendiente' },
  { id:42, fecha:'22 Jun', hora:'17:00', local:'Francia',         visita:'Irak',                grupo:'I', sede:'Filadelfia',        estado:'pendiente' },
  { id:43, fecha:'22 Jun', hora:'20:00', local:'Noruega',         visita:'Senegal',             grupo:'I', sede:'Nueva Jersey',      estado:'pendiente' },
  { id:44, fecha:'22 Jun', hora:'23:00', local:'Jordania',        visita:'Argelia',             grupo:'J', sede:'San Francisco',     estado:'pendiente' },
  // ── 23 JUN ──
  { id:45, fecha:'23 Jun', hora:'13:00', local:'Portugal',        visita:'Uzbekistán',          grupo:'K', sede:'Houston',           estado:'pendiente' },
  { id:46, fecha:'23 Jun', hora:'16:00', local:'Inglaterra',      visita:'Ghana',               grupo:'L', sede:'Boston',            estado:'pendiente' },
  { id:47, fecha:'23 Jun', hora:'19:00', local:'Panamá',          visita:'Croacia',             grupo:'L', sede:'Toronto',           estado:'pendiente' },
  { id:48, fecha:'23 Jun', hora:'22:00', local:'Colombia',        visita:'R.D. Congo',          grupo:'K', sede:'Guadalajara',       estado:'pendiente' },
  // ── 24 JUN ──
  { id:49, fecha:'24 Jun', hora:'15:00', local:'Suiza',           visita:'Canadá',              grupo:'B', sede:'Vancouver',         estado:'pendiente' },
  { id:50, fecha:'24 Jun', hora:'15:00', local:'Bosnia y Herzegovina', visita:'Qatar',          grupo:'B', sede:'Seattle',           estado:'pendiente' },
  { id:51, fecha:'24 Jun', hora:'18:00', local:'Escocia',         visita:'Brasil',              grupo:'C', sede:'Miami',             estado:'pendiente' },
  { id:52, fecha:'24 Jun', hora:'18:00', local:'Marruecos',       visita:'Haití',               grupo:'C', sede:'Atlanta',           estado:'pendiente' },
  { id:53, fecha:'24 Jun', hora:'21:00', local:'Rep. Checa',      visita:'México',              grupo:'A', sede:'Ciudad de México',  estado:'pendiente' },
  { id:54, fecha:'24 Jun', hora:'21:00', local:'Sudáfrica',       visita:'Corea del Sur',       grupo:'A', sede:'Guadalajara',       estado:'pendiente' },
  // ── 25 JUN ──
  { id:55, fecha:'25 Jun', hora:'16:00', local:'Curazao',         visita:'Costa de Marfil',     grupo:'E', sede:'Filadelfia',        estado:'pendiente' },
  { id:56, fecha:'25 Jun', hora:'16:00', local:'Ecuador',         visita:'Alemania',            grupo:'E', sede:'Nueva Jersey',      estado:'pendiente' },
  { id:57, fecha:'25 Jun', hora:'19:00', local:'Japón',           visita:'Suecia',              grupo:'F', sede:'Dallas',            estado:'pendiente' },
  { id:58, fecha:'25 Jun', hora:'19:00', local:'Túnez',           visita:'Países Bajos',        grupo:'F', sede:'Kansas City',       estado:'pendiente' },
  { id:59, fecha:'25 Jun', hora:'22:00', local:'Turquía',         visita:'Estados Unidos',      grupo:'D', sede:'Los Ángeles',       estado:'pendiente' },
  { id:60, fecha:'25 Jun', hora:'22:00', local:'Paraguay',        visita:'Australia',           grupo:'D', sede:'San Francisco',     estado:'pendiente' },
  // ── 26 JUN ──
  { id:61, fecha:'26 Jun', hora:'15:00', local:'Noruega',         visita:'Francia',             grupo:'I', sede:'Boston',            estado:'pendiente' },
  { id:62, fecha:'26 Jun', hora:'15:00', local:'Senegal',         visita:'Irak',                grupo:'I', sede:'Toronto',           estado:'pendiente' },
  { id:63, fecha:'26 Jun', hora:'20:00', local:'Cabo Verde',      visita:'Arabia Saudí',        grupo:'H', sede:'Houston',           estado:'pendiente' },
  { id:64, fecha:'26 Jun', hora:'20:00', local:'Uruguay',         visita:'España',              grupo:'H', sede:'Guadalajara',       estado:'pendiente' },
  { id:65, fecha:'26 Jun', hora:'23:00', local:'Egipto',          visita:'Irán',                grupo:'G', sede:'Seattle',           estado:'pendiente' },
  { id:66, fecha:'26 Jun', hora:'23:00', local:'Nueva Zelanda',   visita:'Bélgica',             grupo:'G', sede:'Vancouver',         estado:'pendiente' },
  // ── 27 JUN ──
  { id:67, fecha:'27 Jun', hora:'17:00', local:'Panamá',          visita:'Inglaterra',          grupo:'L', sede:'Nueva Jersey',      estado:'pendiente' },
  { id:68, fecha:'27 Jun', hora:'17:00', local:'Croacia',         visita:'Ghana',               grupo:'L', sede:'Filadelfia',        estado:'pendiente' },
  { id:69, fecha:'27 Jun', hora:'19:30', local:'Colombia',        visita:'Portugal',            grupo:'K', sede:'Miami',             estado:'pendiente' },
  { id:70, fecha:'27 Jun', hora:'19:30', local:'R.D. Congo',      visita:'Uzbekistán',          grupo:'K', sede:'Atlanta',           estado:'pendiente' },
  { id:71, fecha:'27 Jun', hora:'22:00', local:'Argelia',         visita:'Austria',             grupo:'J', sede:'Kansas City',       estado:'pendiente' },
  { id:72, fecha:'27 Jun', hora:'22:00', local:'Jordania',        visita:'Argentina',           grupo:'J', sede:'Dallas',            estado:'pendiente' },
  // ── FASE ELIMINATORIA ──
  { id:73,  fecha:'28 Jun', hora:'TBD', local:'1A', visita:'2B', grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:74,  fecha:'28 Jun', hora:'TBD', local:'1C', visita:'2D', grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:75,  fecha:'29 Jun', hora:'TBD', local:'1E', visita:'2F', grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:76,  fecha:'29 Jun', hora:'TBD', local:'1G', visita:'2H', grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:77,  fecha:'30 Jun', hora:'TBD', local:'1I', visita:'2J', grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:78,  fecha:'30 Jun', hora:'TBD', local:'1K', visita:'2L', grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:79,  fecha:'1 Jul',  hora:'TBD', local:'3°',  visita:'3°',  grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:80,  fecha:'1 Jul',  hora:'TBD', local:'3°',  visita:'3°',  grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:81,  fecha:'2 Jul',  hora:'TBD', local:'3°',  visita:'3°',  grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:82,  fecha:'2 Jul',  hora:'TBD', local:'3°',  visita:'3°',  grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:83,  fecha:'3 Jul',  hora:'TBD', local:'3°',  visita:'3°',  grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:84,  fecha:'3 Jul',  hora:'TBD', local:'3°',  visita:'3°',  grupo:'16', sede:'TBD', estado:'pendiente' },
  { id:85,  fecha:'4 Jul',  hora:'TBD', local:'W73', visita:'W74', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:86,  fecha:'4 Jul',  hora:'TBD', local:'W75', visita:'W76', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:87,  fecha:'5 Jul',  hora:'TBD', local:'W77', visita:'W78', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:88,  fecha:'5 Jul',  hora:'TBD', local:'W79', visita:'W80', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:89,  fecha:'6 Jul',  hora:'TBD', local:'W81', visita:'W82', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:90,  fecha:'6 Jul',  hora:'TBD', local:'W83', visita:'W84', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:91,  fecha:'7 Jul',  hora:'TBD', local:'W85', visita:'W86', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:92,  fecha:'7 Jul',  hora:'TBD', local:'W87', visita:'W88', grupo:'8',  sede:'TBD', estado:'pendiente' },
  { id:93,  fecha:'9 Jul',  hora:'TBD', local:'W89', visita:'W90', grupo:'4',  sede:'TBD', estado:'pendiente' },
  { id:94,  fecha:'9 Jul',  hora:'TBD', local:'W91', visita:'W92', grupo:'4',  sede:'TBD', estado:'pendiente' },
  { id:95,  fecha:'10 Jul', hora:'TBD', local:'W93', visita:'W94', grupo:'4',  sede:'TBD', estado:'pendiente' },
  { id:96,  fecha:'11 Jul', hora:'TBD', local:'W95', visita:'W96', grupo:'4',  sede:'TBD', estado:'pendiente' },
  { id:97,  fecha:'14 Jul', hora:'TBD', local:'W93', visita:'W94', grupo:'SF', sede:'TBD', estado:'pendiente' },
  { id:98,  fecha:'15 Jul', hora:'TBD', local:'W95', visita:'W96', grupo:'SF', sede:'TBD', estado:'pendiente' },
  { id:99,  fecha:'18 Jul', hora:'TBD', local:'L97', visita:'L98', grupo:'3P', sede:'TBD', estado:'pendiente' },
  { id:100, fecha:'19 Jul', hora:'14:00', local:'Final', visita:'Final', grupo:'F', sede:'MetLife Stadium NJ', estado:'pendiente' },
]

const FASE_LABELS = { '16':'Dieciseisavos', '8':'Octavos', '4':'Cuartos', 'SF':'Semifinales', '3P':'3er Lugar', 'F':'Final' }
const FASES = [
  { key:'octavos', label:'Octavos', pts:1,  max:32 },
  { key:'cuartos', label:'Cuartos', pts:2,  max:8  },
  { key:'semis',   label:'Semis',   pts:3,  max:4  },
  { key:'final',   label:'Final',   pts:5,  max:2  },
  { key:'campeon', label:'Campeón', pts:10, max:1  },
]
const FASE_COLORS = { octavos:'#3A1A00', cuartos:'#001A3A', semis:'#1A003A', final:'#2A1A00', campeon:'#C9A227' }
const AVATAR_COLORS = ['#8B1A1A','#7A3B00','#1A6B1A','#005E5E','#004F6B','#2B006B','#7A004A','#5B2000','#003A7A','#5B006B']

// ─── ESTADO ──────────────────────────────────────────────────
let ranking = [], predicciones = {}, clasificados = []
let filtroFecha = 'hoy', filtroGrupo = 'todos'

function initials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }
function showToast(msg, err=false) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.style.borderColor = err ? '#f87171' : '#4ade80'
  t.style.color = err ? '#f87171' : '#4ade80'
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}

// ─── NAV ─────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('page-'+btn.dataset.page).classList.add('active')
  })
})

// ─── CARGA ───────────────────────────────────────────────────
async function loadAll() {
  try { await Promise.all([loadRanking(), loadPredicciones(), loadClasificados()]) } catch(e) { console.error(e) }
  buildGrupos()
  buildEquipoSelect()
  renderPartidos()
}

// ─── RANKING ─────────────────────────────────────────────────
async function loadRanking() {
  try {
    const { data, error } = await sb.from('polla_ranking').select('*').order('posicion')
    if (error) throw error
    ranking = data || []
  } catch(e) { ranking = [] }
  renderRanking(); renderStats()
}

function renderStats() {
  document.getElementById('s-part').textContent   = ranking.length || '0'
  document.getElementById('s-leader').textContent  = ranking[0]?.nombre?.split(' ')[0] || '—'
  document.getElementById('s-max').textContent     = ranking[0]?.puntos_total ?? '0'
}

function renderRanking() {
  const max  = ranking[0]?.puntos_total || 1
  const body = document.getElementById('ranking-body')
  if (!ranking.length) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty"><div style="font-size:32px;margin-bottom:12px">⏳</div><div style="font-weight:600;color:#c8d0e8;margin-bottom:6px">Sin participantes aún</div><div>Los datos aparecerán cuando se carguen los Excel.</div></div></td></tr>`
    document.getElementById('detail-cards').innerHTML = ''; return
  }
  body.innerHTML = ranking.map((p,i) => {
    const pct = Math.round((p.puntos_total/max)*100)
    const color = AVATAR_COLORS[i%AVATAR_COLORS.length]
    const posC = i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':'pos-n'
    const cell = k => `<td style="text-align:center;color:#8892b0;font-size:12px">${p['pts_'+k]??0}</td>`
    return `<tr>
      <td><span class="pos-badge ${posC}">${p.posicion}</span></td>
      <td><div class="name-cell">
        <div class="avatar" style="background:${color}25;color:${color}">${initials(p.nombre)}</div>
        <div><div style="font-size:13px;color:#c8d0e8">${p.nombre}</div><div style="font-size:11px;color:#8892b0">🏆 ${p.campeon||'—'}</div></div>
      </div></td>
      ${cell('octavos')}${cell('cuartos')}${cell('semis')}${cell('final')}${cell('campeon')}
      <td style="text-align:right"><div class="bar-wrap">
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="pts-val">${p.puntos_total}</span>
      </div></td></tr>`
  }).join('')
  renderDetailCards()
}

function renderDetailCards() {
  const el = document.getElementById('detail-cards')
  if (!ranking.length) { el.innerHTML=''; return }
  el.innerHTML = ranking.map((p,i) => {
    const color = AVATAR_COLORS[i%AVATAR_COLORS.length]
    const chips = FASES.map(f => {
      const pts = p['pts_'+f.key]??0
      return `<span class="chip ${pts>0?'hit':'pending'}">${f.label} ${pts}/${f.max*f.pts}</span>`
    }).join('')
    return `<div class="detail-card">
      <div class="avatar" style="background:${color}25;color:${color};width:36px;height:36px;font-size:13px">${initials(p.nombre)}</div>
      <div style="flex:1"><div style="font-size:13px;color:#c8d0e8;margin-bottom:5px">${p.nombre}</div><div class="chips">${chips}</div></div>
      <div style="text-align:right"><div style="font-size:24px;font-weight:700;color:#c9a227">${p.puntos_total}</div><div style="font-size:10px;color:#8892b0">${p.aciertos_total??0} aciertos</div></div>
    </div>`
  }).join('')
}

// ─── PREDICCIONES ────────────────────────────────────────────
async function loadPredicciones() {
  try {
    const { data, error } = await sb.from('polla_predicciones').select('participante_id,fase,equipo')
    if (error) throw error
    predicciones = {}
    ;(data||[]).forEach(r => {
      if (!predicciones[r.participante_id]) predicciones[r.participante_id] = []
      predicciones[r.participante_id].push({ fase:r.fase, equipo:r.equipo })
    })
  } catch(e) { predicciones = {} }
  buildBracketTabs()
}

function buildBracketTabs() {
  const bar = document.getElementById('bracket-tabs')
  const det = document.getElementById('bracket-detail')
  if (!ranking.length) { bar.innerHTML=''; det.innerHTML='<div class="empty">Sin participantes cargados aún.</div>'; return }
  bar.innerHTML = ranking.map((p,i) =>
    `<button class="tab${i===0?' active':''}" data-pid="${p.id}">${p.nombre.split(' ')[0]}</button>`
  ).join('')
  bar.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => { bar.querySelectorAll('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderBracketPlayer(parseInt(btn.dataset.pid)) })
  })
  if (ranking.length) renderBracketPlayer(ranking[0].id)
}

function renderBracketPlayer(pid) {
  const picks = predicciones[pid]||[]
  const byFase = {}
  picks.forEach(p => { if (!byFase[p.fase]) byFase[p.fase]=[]; byFase[p.fase].push(p.equipo) })
  const clasSet = {}
  clasificados.forEach(c => { if (!clasSet[c.fase]) clasSet[c.fase]=new Set(); clasSet[c.fase].add(c.equipo) })
  document.getElementById('bracket-detail').innerHTML = FASES.map(f => {
    const teams = byFase[f.key]||[]
    const pills = teams.length
      ? teams.map(t => { const hit=clasSet[f.key]?.has(t); return `<span class="team-pill" style="border-color:${hit?'#2d6a2d':'#2a3060'};color:${hit?'#4ade80':'#c8d0e8'}">${t}</span>` }).join('')
      : '<span style="font-size:12px;color:#8892b0;font-style:italic">Sin predicción cargada</span>'
    return `<div class="fase-block"><div class="fase-header" style="background:${FASE_COLORS[f.key]};color:${f.key==='campeon'?'#0A0E1A':'#e8eaf6'}">${f.label.toUpperCase()} — ${f.pts} pto${f.pts>1?'s':''} c/u</div><div class="fase-teams">${pills}</div></div>`
  }).join('')
}

// ─── GRUPOS ──────────────────────────────────────────────────
function buildGrupos() {
  document.getElementById('grupos-grid').innerHTML = GRUPOS.map(g =>
    `<div class="grupo-card"><div class="grupo-header" style="background:${g.color}">GRUPO ${g.id}</div>${g.teams.map(t=>`<div class="grupo-team">${t}</div>`).join('')}</div>`
  ).join('')
}

// ─── CLASIFICADOS ────────────────────────────────────────────
async function loadClasificados() {
  try {
    const { data, error } = await sb.from('polla_clasificados').select('*').order('fase').order('equipo')
    if (error) throw error
    clasificados = data||[]
  } catch(e) { clasificados=[] }
  renderClasificadosView(); renderAdminList()
}

function renderClasificadosView() {
  const el = document.getElementById('clasificados-view')
  if (!clasificados.length) { el.innerHTML='<div class="empty">El admin aún no ha cargado clasificados.</div>'; return }
  const byFase={}; clasificados.forEach(c=>{ if(!byFase[c.fase]) byFase[c.fase]=[]; byFase[c.fase].push(c.equipo) })
  el.innerHTML = FASES.filter(f=>byFase[f.key]).map(f =>
    `<div class="fase-block" style="margin-bottom:8px"><div class="fase-header" style="background:${FASE_COLORS[f.key]};color:${f.key==='campeon'?'#0a0e1a':'#e8eaf6'}">${f.label.toUpperCase()}</div><div class="fase-teams">${byFase[f.key].map(t=>`<span class="team-pill">${t}</span>`).join('')}</div></div>`
  ).join('')
}

// ─── PARTIDOS ────────────────────────────────────────────────
function renderPartidos() {
  const HOY_FECHAS = ['11 Jun']
  const MANANA_FECHAS = ['12 Jun']
  
  // Filtrar según pestaña activa
  let filtrados = PARTIDOS.filter(p => {
    const esGrupo = !['16','8','4','SF','3P','F'].includes(p.grupo)
    if (filtroFecha === 'hoy')    return HOY_FECHAS.includes(p.fecha)
    if (filtroFecha === 'manana') return MANANA_FECHAS.includes(p.fecha)
    if (filtroFecha === 'grupos') return esGrupo
    if (filtroFecha === 'elim')   return !esGrupo
    return true // 'todos'
  })
  if (filtroGrupo !== 'todos') filtrados = filtrados.filter(p => p.grupo === filtroGrupo)

  // Agrupar por fecha
  const porFecha = {}
  filtrados.forEach(p => {
    if (!porFecha[p.fecha]) porFecha[p.fecha] = []
    porFecha[p.fecha].push(p)
  })

  const container = document.getElementById('partidos-container')
  if (!filtrados.length) {
    container.innerHTML = '<div class="empty">No hay partidos para este filtro.</div>'
    return
  }

  container.innerHTML = Object.entries(porFecha).map(([fecha, partidos]) => {
    const rows = partidos.map(p => {
      const g = GRUPOS.find(g => g.id === p.grupo)
      const gc = g?.color || '#2a2a4a'
      const label = FASE_LABELS[p.grupo] || `Grupo ${p.grupo}`
      const isElim = ['16','8','4','SF','3P','F'].includes(p.grupo)

      let scoreHtml = ''
      if (p.estado === 'en_vivo') {
        scoreHtml = `<div class="score-box live-score"><span class="score-n">${p.gl??0}</span><span class="score-sep">-</span><span class="score-n">${p.gv??0}</span></div>`
      } else if (p.estado === 'finalizado') {
        scoreHtml = `<div class="score-box fin-score"><span class="score-n">${p.gl??0}</span><span class="score-sep">-</span><span class="score-n">${p.gv??0}</span></div>`
      } else {
        scoreHtml = `<div class="score-box vs-box"><span style="color:#8892b0;font-size:11px;font-weight:600">VS</span></div>`
      }

      const estadoBadge = p.estado === 'en_vivo'
        ? `<span class="live-badge"><span class="live-dot"></span>EN VIVO</span>`
        : p.estado === 'finalizado'
          ? `<span style="color:#6b7a9f;font-size:10px;letter-spacing:.5px">FINAL</span>`
          : `<span style="color:#8892b0;font-size:11px">${p.hora}</span>`

      return `<div class="match-row">
        <div class="match-group-badge" style="background:${gc}20;border-color:${gc}40;color:${gc}">${label}</div>
        <div class="match-teams">
          <span class="team-name r">${p.local}</span>
          ${scoreHtml}
          <span class="team-name">${p.visita}</span>
        </div>
        <div class="match-right">
          ${estadoBadge}
          <div style="font-size:10px;color:#6b7a9f;margin-top:2px">${p.sede}</div>
        </div>
      </div>`
    }).join('')

    return `<div class="date-block">
      <div class="date-header">${fecha}</div>
      ${rows}
    </div>`
  }).join('')
}

// Event listeners para filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.filter-group').querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'))
    btn.classList.add('active')
    if (btn.dataset.fecha !== undefined) filtroFecha = btn.dataset.fecha
    if (btn.dataset.grupo !== undefined) filtroGrupo = btn.dataset.grupo
    renderPartidos()
  })
})

// ─── ADMIN ───────────────────────────────────────────────────
function buildEquipoSelect() {
  document.getElementById('admin-equipo').innerHTML =
    '<option value="">— Selecciona equipo —</option>' +
    ALL_TEAMS.map(t=>`<option value="${t}">${t}</option>`).join('')
}

document.getElementById('btn-admin').addEventListener('click', () => { document.getElementById('admin-modal').classList.add('open'); renderAdminList() })
document.getElementById('close-modal').addEventListener('click', () => document.getElementById('admin-modal').classList.remove('open'))
document.getElementById('admin-modal').addEventListener('click', e => { if (e.target===e.currentTarget) e.currentTarget.classList.remove('open') })

document.getElementById('btn-agregar').addEventListener('click', async () => {
  const fase   = document.getElementById('admin-fase').value
  const equipo = document.getElementById('admin-equipo').value
  if (!equipo) { showToast('⚠ Selecciona un equipo', true); return }
  const { error } = await sb.from('polla_clasificados').insert({ fase, equipo })
  if (error) { showToast(error.code==='23505'?'⚠ Ya está en esta fase':'Error: '+error.message, true); return }
  showToast(`✓ ${equipo} agregado a ${fase}`)
  await loadClasificados(); await loadRanking()
})

function renderAdminList() {
  const el = document.getElementById('clasificados-list')
  if (!clasificados.length) { el.innerHTML=''; return }
  const byFase={}; clasificados.forEach(c=>{ if(!byFase[c.fase]) byFase[c.fase]=[]; byFase[c.fase].push(c) })
  el.innerHTML = '<div style="margin-top:16px;font-size:11px;color:#8892b0;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Clasificados cargados</div>' +
    FASES.filter(f=>byFase[f.key]).map(f =>
      `<div style="margin-bottom:10px"><div style="font-size:11px;color:#c9a227;margin-bottom:6px;font-weight:700">${f.label.toUpperCase()}</div>
      ${byFase[f.key].map(c=>`<div class="clasificado-item"><span>${c.equipo}</span><button class="btn-del" data-id="${c.id}">×</button></div>`).join('')}</div>`
    ).join('')
  el.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { error } = await sb.from('polla_clasificados').delete().eq('id',parseInt(btn.dataset.id))
      if (error) { showToast('Error al eliminar',true); return }
      showToast('✓ Eliminado'); await loadClasificados(); await loadRanking()
    })
  })
}

// ─── REALTIME ────────────────────────────────────────────────
sb.channel('polla-live')
  .on('postgres_changes',{event:'*',schema:'public',table:'polla_puntos'},()=>loadRanking())
  .on('postgres_changes',{event:'*',schema:'public',table:'polla_clasificados'},()=>loadClasificados())
  .subscribe()

// ─── ARRANCAR ────────────────────────────────────────────────
loadAll()
