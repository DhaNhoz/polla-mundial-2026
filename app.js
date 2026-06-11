// ─── SUPABASE ────────────────────────────────────────────────
const SB_URL = 'https://zeuwfbycrhxhjwvdvqoi.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldXdmYnljcmh4aGp3dmR2cW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzcxMzcsImV4cCI6MjA4Njg1MzEzN30.4OUEQMFmIY-voG_fW99DPAnEOjaON5fmGmAp92tx8EM'
const sb = supabase.createClient(SB_URL, SB_KEY)

// ─── AUTH ────────────────────────────────────────────────────
const ADMIN_PIN = '2026'  // Solo el admin necesita PIN

let currentUser = null  // { nombre, isAdmin, id, color }

const AVATAR_COLORS = ['#8B1A1A','#7A3B00','#1A6B1A','#005E5E','#004F6B','#2B006B','#7A004A','#5B2000','#003A7A','#5B006B']

function initials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }
function showToast(msg, err=false) {
  const t = document.getElementById('toast')
  t.textContent = msg; t.style.borderColor = err?'#f87171':'#4ade80'; t.style.color = err?'#f87171':'#4ade80'
  t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2800)
}

// ─── LOGIN ───────────────────────────────────────────────────
let ranking = [], predicciones = {}, clasificados = []
let filtroFecha = 'hoy', filtroGrupo = 'todos'  // unused, kept for safety

async function initLogin() {
  const select = document.getElementById('login-select')

  // Mostrar estado cargando
  select.innerHTML = '<option value="">Cargando participantes...</option>'
  select.disabled = true

  // Cargar participantes desde Supabase
  let data = []
  try {
    const res = await sb.from('polla_participantes').select('id,nombre').order('nombre')
    data = res.data || []
  } catch(e) {
    console.error('Error cargando participantes:', e)
  }

  // Reconstruir opciones
  select.innerHTML = '<option value="">— Selecciona tu nombre —</option>'
  select.disabled = false

  // Participantes primero
  data.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id; opt.dataset.nombre = p.nombre; opt.textContent = p.nombre
    select.appendChild(opt)
  })

  // Separador y admin al final
  if (data.length > 0) {
    const sep = document.createElement('option')
    sep.disabled = true; sep.textContent = '──────────'
    select.appendChild(sep)
  }

  const adminOpt = document.createElement('option')
  adminOpt.value = '__admin__'; adminOpt.textContent = '⚙ Administrador'
  select.appendChild(adminOpt)

  select.addEventListener('change', () => {
    const v = select.value
    document.getElementById('login-btn').disabled = !v
    // PIN solo para admin
    document.getElementById('pin-wrap').style.display = v === '__admin__' ? 'block' : 'none'
    document.getElementById('login-error').textContent = ''
    document.getElementById('login-pin').value = ''
    if (v === '__admin__') document.getElementById('login-pin').focus()
  })

  document.getElementById('login-pin').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-btn').click()
  })

  document.getElementById('login-btn').addEventListener('click', () => {
    const sel   = document.getElementById('login-select')
    const pin   = document.getElementById('login-pin').value.trim()
    const errEl = document.getElementById('login-error')

    if (sel.value === '__admin__') {
      if (pin !== ADMIN_PIN) { errEl.textContent = 'PIN incorrecto'; return }
      currentUser = { nombre:'Administrador', isAdmin:true, id:null, color:'#4ade80' }
    } else {
      // Participantes entran directo, sin PIN
      const opt    = sel.options[sel.selectedIndex]
      const nombre = opt.dataset.nombre || opt.textContent
      const id     = parseInt(sel.value)
      const idx    = (data||[]).findIndex(p => p.id === id)
      currentUser  = { nombre, isAdmin:false, id, color:AVATAR_COLORS[idx % AVATAR_COLORS.length] }
    }

    // Guardar sesión
    sessionStorage.setItem('polla_user', JSON.stringify(currentUser))
    enterApp()
  })
}

function enterApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-screen').style.display = 'block'

  // Chip de usuario
  const chip = document.getElementById('user-chip')
  document.getElementById('chip-name').textContent = currentUser.nombre
  const av = document.getElementById('chip-avatar')
  av.textContent = initials(currentUser.nombre)
  av.style.background = currentUser.color + '30'
  av.style.color = currentUser.color
  if (currentUser.isAdmin) chip.classList.add('admin-chip')

  // Mostrar/ocultar botón admin
  if (currentUser.isAdmin) {
    const adminBtn = document.createElement('button')
    adminBtn.className = 'admin-btn'
    adminBtn.textContent = '⚙ Panel'
    adminBtn.style.marginLeft = '8px'
    adminBtn.addEventListener('click', () => { document.getElementById('admin-modal').classList.add('open'); renderAdminList() })
    chip.parentNode.insertBefore(adminBtn, chip)
  }

  loadAll()
}

function logout() {
  sessionStorage.removeItem('polla_user')
  currentUser = null
  document.getElementById('login-screen').style.display = 'flex'
  document.getElementById('app-screen').style.display = 'none'
  document.getElementById('login-select').value = ''
  document.getElementById('login-pin').value = ''
  document.getElementById('login-btn').disabled = true
  document.getElementById('pin-wrap').style.display = 'none'
}

// ─── NAV ─────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'))
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('page-'+btn.dataset.page).classList.add('active')
  })
})

// ─── CARGA ───────────────────────────────────────────────────
async function loadAll() {
  try { await Promise.all([loadRanking(), loadPredicciones(), loadClasificados()]) } catch(e) { console.error(e) }
  buildGrupos()
  buildEquipoSelect()
  renderMyBracket()
}

// ─── RANKING ─────────────────────────────────────────────────
async function loadRanking() {
  try {
    const { data, error } = await sb.from('polla_ranking').select('*').order('posicion')
    if (error) throw error
    ranking = data||[]
  } catch(e) { ranking=[] }
  renderRanking(); renderStats()
}

function renderStats() {
  document.getElementById('s-part').textContent  = ranking.length||'0'
  document.getElementById('s-leader').textContent = ranking[0]?.nombre?.split(' ')[0]||'—'
  document.getElementById('s-max').textContent    = ranking[0]?.puntos_total??'0'
}

function renderRanking() {
  const max  = ranking[0]?.puntos_total||1
  const body = document.getElementById('ranking-body')
  if (!ranking.length) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty"><div style="font-size:32px;margin-bottom:10px">⏳</div><div style="font-weight:600;color:#c8d0e8;margin-bottom:5px">Sin participantes aún</div><div>Los datos aparecerán cuando se carguen los Excel.</div></div></td></tr>`
    document.getElementById('detail-cards').innerHTML=''; return
  }
  body.innerHTML = ranking.map((p,i) => {
    const pct = Math.round((p.puntos_total/max)*100)
    const color = AVATAR_COLORS[i%AVATAR_COLORS.length]
    const posC = i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':'pos-n'
    const isMe = currentUser && !currentUser.isAdmin && p.id === currentUser.id
    const cell = k => `<td style="text-align:center;color:#8892b0;font-size:12px">${p['pts_'+k]??0}</td>`
    return `<tr class="${isMe?'me':''}">
      <td><span class="pos-badge ${posC}">${p.posicion}</span></td>
      <td><div class="name-cell">
        <div class="avatar" style="background:${color}25;color:${color}">${initials(p.nombre)}</div>
        <div>
          <div style="font-size:13px;color:#c8d0e8">${p.nombre}${isMe?' <span style="font-size:10px;color:#4ade80;background:#0d1a0d;padding:1px 6px;border-radius:4px;margin-left:4px">Tú</span>':''}</div>
          <div style="font-size:11px;color:#8892b0">🏆 ${p.campeon||'—'}</div>
        </div>
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
  const FASES_DEF = [
    {key:'octavos',label:'Octavos',pts:1,max:32},{key:'cuartos',label:'Cuartos',pts:2,max:8},
    {key:'semis',label:'Semis',pts:3,max:4},{key:'final',label:'Final',pts:5,max:2},{key:'campeon',label:'Campeón',pts:10,max:1}
  ]
  el.innerHTML = ranking.map((p,i) => {
    const color = AVATAR_COLORS[i%AVATAR_COLORS.length]
    const isMe = currentUser && !currentUser.isAdmin && p.id === currentUser.id
    const chips = FASES_DEF.map(f => `<span class="chip ${(p['pts_'+f.key]??0)>0?'hit':'pending'}">${f.label} ${p['pts_'+f.key]??0}/${f.max*f.pts}</span>`).join('')
    return `<div class="detail-card ${isMe?'me':''}">
      <div class="avatar" style="background:${color}25;color:${color};width:34px;height:34px;font-size:11px">${initials(p.nombre)}</div>
      <div style="flex:1"><div style="font-size:13px;color:#c8d0e8;margin-bottom:4px">${p.nombre}${isMe?' <span style="font-size:10px;color:#4ade80">← Tú</span>':''}</div><div class="chips">${chips}</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:700;color:#c9a227">${p.puntos_total}</div><div style="font-size:10px;color:#8892b0">${p.aciertos_total??0} aciertos</div></div>
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
      if (!predicciones[r.participante_id]) predicciones[r.participante_id]=[]
      predicciones[r.participante_id].push({fase:r.fase,equipo:r.equipo})
    })
  } catch(e) { predicciones={} }
}

// ─── MI BRACKET (pestaña personalizada) ──────────────────────
const FASE_COLORS_MAP = { octavos:'#3A1A00', cuartos:'#001A3A', semis:'#1A003A', final:'#2A1A00', campeon:'#C9A227' }
const FASES_LIST = [
  {key:'octavos',label:'Octavos de Final',pts:1},{key:'cuartos',label:'Cuartos de Final',pts:2},
  {key:'semis',label:'Semifinales',pts:3},{key:'final',label:'Final',pts:5},{key:'campeon',label:'Campeón',pts:10}
]

function renderMyBracket() {
  const el = document.getElementById('my-bracket-content')
  if (!currentUser || currentUser.isAdmin) {
    el.innerHTML = '<div class="section-title">Vista general</div><p style="color:var(--muted);font-size:13px">Selecciona un participante en la tabla de Ranking para ver su bracket completo.</p>'; return
  }

  const picks = predicciones[currentUser.id]||[]
  const byFase = {}
  picks.forEach(p => { if(!byFase[p.fase]) byFase[p.fase]=[]; byFase[p.fase].push(p.equipo) })

  const clasSet = {}
  clasificados.forEach(c => { if(!clasSet[c.fase]) clasSet[c.fase]=new Set(); clasSet[c.fase].add(c.equipo) })

  const myRanking = ranking.find(r=>r.id===currentUser.id)

  el.innerHTML = `
    <div class="section-title">Mi Bracket</div>
    ${myRanking ? `<div class="my-bracket-hero">
      <div class="avatar" style="background:${currentUser.color}25;color:${currentUser.color};width:44px;height:44px;font-size:15px;flex-shrink:0">${initials(currentUser.nombre)}</div>
      <div style="flex:1">
        <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px">${currentUser.nombre}</div>
        <div style="font-size:12px;color:var(--muted)">Posición <strong style="color:var(--gold)">#${myRanking.posicion}</strong> · <strong style="color:#fff">${myRanking.puntos_total}</strong> puntos · Campeón elegido: <strong style="color:var(--gold)">${myRanking.campeon||'—'}</strong></div>
      </div>
    </div>` : ''}
    ${!picks.length ? '<div class="empty" style="padding:20px">Aún no se han cargado tus predicciones.</div>' :
      FASES_LIST.map(f => {
        const teams = byFase[f.key]||[]
        const pills = teams.length
          ? teams.map(t => {
              const hit = clasSet[f.key]?.has(t)
              const miss = clasificados.filter(c=>c.fase===f.key).length>0 && !hit
              return `<span class="team-pill" style="border-color:${hit?'#2d6a2d':miss?'#3a1a1a':'#2a3060'};color:${hit?'#4ade80':miss?'#f87171':'#c8d0e8'}">${hit?'✓ ':miss?'✗ ':''}${t}</span>`
            }).join('')
          : '<span style="font-size:12px;color:#8892b0;font-style:italic">Sin predicción cargada</span>'
        return `<div class="fase-block">
          <div class="fase-header" style="background:${FASE_COLORS_MAP[f.key]};color:${f.key==='campeon'?'#0A0E1A':'#e8eaf6'}">${f.label.toUpperCase()} — ${f.pts} pto${f.pts>1?'s':''} c/u</div>
          <div class="fase-teams">${pills}</div>
        </div>`
      }).join('')
    }`
}

// ─── GRUPOS ──────────────────────────────────────────────────
const GRUPOS = [
  {id:'A',color:'#8B1A1A',teams:['México','Sudáfrica','Corea del Sur','Rep. Checa']},
  {id:'B',color:'#7A3B00',teams:['Canadá','Qatar','Suiza','Bosnia y Herzegovina']},
  {id:'C',color:'#5A5000',teams:['Brasil','Marruecos','Haití','Escocia']},
  {id:'D',color:'#1A6B1A',teams:['Estados Unidos','Paraguay','Australia','Turquía']},
  {id:'E',color:'#005E5E',teams:['Alemania','Curazao','Costa de Marfil','Ecuador']},
  {id:'F',color:'#004F6B',teams:['Países Bajos','Japón','Túnez','Suecia']},
  {id:'G',color:'#002B8B',teams:['Bélgica','Egipto','Irán','Nueva Zelanda']},
  {id:'H',color:'#2B006B',teams:['España','Cabo Verde','Arabia Saudí','Uruguay']},
  {id:'I',color:'#5B006B',teams:['Francia','Senegal','Irak','Noruega']},
  {id:'J',color:'#7A004A',teams:['Argentina','Argelia','Austria','Jordania']},
  {id:'K',color:'#6B0030',teams:['Portugal','Uzbekistán','Colombia','R.D. Congo']},
  {id:'L',color:'#5B2000',teams:['Inglaterra','Croacia','Ghana','Panamá']},
]
const ALL_TEAMS = GRUPOS.flatMap(g=>g.teams)

function buildGrupos() {
  document.getElementById('grupos-grid').innerHTML = GRUPOS.map(g =>
    `<div class="grupo-card"><div class="grupo-header" style="background:${g.color}">GRUPO ${g.id}</div>${g.teams.map(t=>`<div class="grupo-team">${t}</div>`).join('')}</div>`
  ).join('')
}

// ─── CLASIFICADOS ────────────────────────────────────────────
async function loadClasificados() {
  try {
    const {data,error} = await sb.from('polla_clasificados').select('*').order('fase').order('equipo')
    if(error) throw error
    clasificados = data||[]
  } catch(e) { clasificados=[] }
  renderClasificadosView(); renderAdminList()
}

function renderClasificadosView() {
  const el = document.getElementById('clasificados-view')
  if (!clasificados.length) { el.innerHTML='<div class="empty">El admin aún no ha cargado clasificados.</div>'; return }
  const byFase={}; clasificados.forEach(c=>{if(!byFase[c.fase]) byFase[c.fase]=[]; byFase[c.fase].push(c.equipo)})
  el.innerHTML = FASES_LIST.filter(f=>byFase[f.key]).map(f =>
    `<div class="fase-block" style="margin-bottom:7px"><div class="fase-header" style="background:${FASE_COLORS_MAP[f.key]};color:${f.key==='campeon'?'#0a0e1a':'#e8eaf6'}">${f.label.toUpperCase()}</div><div class="fase-teams">${byFase[f.key].map(t=>`<span class="team-pill">${t}</span>`).join('')}</div></div>`
  ).join('')
}

// ─── CLASIFICADOS ────────────────────────────────────────────  {id:1,fecha:'11 Jun',hora:'15:00',local:'México',visita:'Sudáfrica',grupo:'A',sede:'Ciudad de México',estado:'pendiente'},
  {id:2,fecha:'11 Jun',hora:'22:00',local:'Corea del Sur',visita:'Rep. Checa',grupo:'A',sede:'Guadalajara',estado:'pendiente'},
  {id:3,fecha:'12 Jun',hora:'15:00',local:'Canadá',visita:'Bosnia y Herzegovina',grupo:'B',sede:'Toronto',estado:'pendiente'},
  {id:4,fecha:'12 Jun',hora:'21:00',local:'Estados Unidos',visita:'Paraguay',grupo:'D',sede:'Los Ángeles',estado:'pendiente'},
  {id:5,fecha:'13 Jun',hora:'15:00',local:'Qatar',visita:'Suiza',grupo:'B',sede:'San Francisco',estado:'pendiente'},
  {id:6,fecha:'13 Jun',hora:'18:00',local:'Brasil',visita:'Marruecos',grupo:'C',sede:'Nueva Jersey',estado:'pendiente'},
  {id:7,fecha:'13 Jun',hora:'21:00',local:'Haití',visita:'Escocia',grupo:'C',sede:'Boston',estado:'pendiente'},
  {id:8,fecha:'13 Jun',hora:'22:00',local:'Australia',visita:'Turquía',grupo:'D',sede:'Vancouver',estado:'pendiente'},
  {id:9,fecha:'14 Jun',hora:'13:00',local:'Alemania',visita:'Curazao',grupo:'E',sede:'Houston',estado:'pendiente'},
  {id:10,fecha:'14 Jun',hora:'16:00',local:'Países Bajos',visita:'Japón',grupo:'F',sede:'Dallas',estado:'pendiente'},
  {id:11,fecha:'14 Jun',hora:'19:00',local:'Costa de Marfil',visita:'Ecuador',grupo:'E',sede:'Filadelfia',estado:'pendiente'},
  {id:12,fecha:'14 Jun',hora:'22:00',local:'Suecia',visita:'Túnez',grupo:'F',sede:'Monterrey',estado:'pendiente'},
  {id:13,fecha:'15 Jun',hora:'12:00',local:'España',visita:'Cabo Verde',grupo:'H',sede:'Atlanta',estado:'pendiente'},
  {id:14,fecha:'15 Jun',hora:'15:00',local:'Bélgica',visita:'Egipto',grupo:'G',sede:'Seattle',estado:'pendiente'},
  {id:15,fecha:'15 Jun',hora:'18:00',local:'Arabia Saudí',visita:'Uruguay',grupo:'H',sede:'Miami',estado:'pendiente'},
  {id:16,fecha:'15 Jun',hora:'21:00',local:'Irán',visita:'Nueva Zelanda',grupo:'G',sede:'Los Ángeles',estado:'pendiente'},
  {id:17,fecha:'16 Jun',hora:'15:00',local:'Francia',visita:'Senegal',grupo:'I',sede:'Nueva Jersey',estado:'pendiente'},
  {id:18,fecha:'16 Jun',hora:'18:00',local:'Irak',visita:'Noruega',grupo:'I',sede:'Boston',estado:'pendiente'},
  {id:19,fecha:'16 Jun',hora:'21:00',local:'Argentina',visita:'Argelia',grupo:'J',sede:'Kansas City',estado:'pendiente'},
  {id:20,fecha:'16 Jun',hora:'22:00',local:'Austria',visita:'Jordania',grupo:'J',sede:'San Francisco',estado:'pendiente'},
  {id:21,fecha:'17 Jun',hora:'13:00',local:'Portugal',visita:'R.D. Congo',grupo:'K',sede:'Houston',estado:'pendiente'},
  {id:22,fecha:'17 Jun',hora:'16:00',local:'Inglaterra',visita:'Croacia',grupo:'L',sede:'Dallas',estado:'pendiente'},
  {id:23,fecha:'17 Jun',hora:'19:00',local:'Ghana',visita:'Panamá',grupo:'L',sede:'Toronto',estado:'pendiente'},
  {id:24,fecha:'17 Jun',hora:'22:00',local:'Uzbekistán',visita:'Colombia',grupo:'K',sede:'Ciudad de México',estado:'pendiente'},
  {id:25,fecha:'18 Jun',hora:'12:00',local:'Rep. Checa',visita:'Sudáfrica',grupo:'A',sede:'Atlanta',estado:'pendiente'},
  {id:26,fecha:'18 Jun',hora:'15:00',local:'Suiza',visita:'Bosnia y Herzegovina',grupo:'B',sede:'Los Ángeles',estado:'pendiente'},
  {id:27,fecha:'18 Jun',hora:'18:00',local:'Canadá',visita:'Qatar',grupo:'B',sede:'Vancouver',estado:'pendiente'},
  {id:28,fecha:'18 Jun',hora:'21:00',local:'México',visita:'Corea del Sur',grupo:'A',sede:'Guadalajara',estado:'pendiente'},
  {id:29,fecha:'19 Jun',hora:'15:00',local:'Estados Unidos',visita:'Australia',grupo:'D',sede:'Seattle',estado:'pendiente'},
  {id:30,fecha:'19 Jun',hora:'18:00',local:'Escocia',visita:'Marruecos',grupo:'C',sede:'Boston',estado:'pendiente'},
  {id:31,fecha:'19 Jun',hora:'20:30',local:'Brasil',visita:'Haití',grupo:'C',sede:'Filadelfia',estado:'pendiente'},
  {id:32,fecha:'19 Jun',hora:'23:00',local:'Turquía',visita:'Paraguay',grupo:'D',sede:'San Francisco',estado:'pendiente'},
  {id:33,fecha:'20 Jun',hora:'13:00',local:'Países Bajos',visita:'Suecia',grupo:'F',sede:'Houston',estado:'pendiente'},
  {id:34,fecha:'20 Jun',hora:'16:00',local:'Alemania',visita:'Costa de Marfil',grupo:'E',sede:'Toronto',estado:'pendiente'},
  {id:35,fecha:'20 Jun',hora:'20:00',local:'Ecuador',visita:'Curazao',grupo:'E',sede:'Kansas City',estado:'pendiente'},
  {id:36,fecha:'20 Jun',hora:'22:00',local:'Túnez',visita:'Japón',grupo:'F',sede:'Monterrey',estado:'pendiente'},
  {id:37,fecha:'21 Jun',hora:'12:00',local:'España',visita:'Arabia Saudí',grupo:'H',sede:'Atlanta',estado:'pendiente'},
  {id:38,fecha:'21 Jun',hora:'15:00',local:'Bélgica',visita:'Irán',grupo:'G',sede:'Los Ángeles',estado:'pendiente'},
  {id:39,fecha:'21 Jun',hora:'18:00',local:'Uruguay',visita:'Cabo Verde',grupo:'H',sede:'Miami',estado:'pendiente'},
  {id:40,fecha:'21 Jun',hora:'21:00',local:'Nueva Zelanda',visita:'Egipto',grupo:'G',sede:'Vancouver',estado:'pendiente'},
  {id:41,fecha:'22 Jun',hora:'13:00',local:'Argentina',visita:'Austria',grupo:'J',sede:'Dallas',estado:'pendiente'},
  {id:42,fecha:'22 Jun',hora:'17:00',local:'Francia',visita:'Irak',grupo:'I',sede:'Filadelfia',estado:'pendiente'},
  {id:43,fecha:'22 Jun',hora:'20:00',local:'Noruega',visita:'Senegal',grupo:'I',sede:'Nueva Jersey',estado:'pendiente'},
  {id:44,fecha:'22 Jun',hora:'23:00',local:'Jordania',visita:'Argelia',grupo:'J',sede:'San Francisco',estado:'pendiente'},
  {id:45,fecha:'23 Jun',hora:'13:00',local:'Portugal',visita:'Uzbekistán',grupo:'K',sede:'Houston',estado:'pendiente'},
  {id:46,fecha:'23 Jun',hora:'16:00',local:'Inglaterra',visita:'Ghana',grupo:'L',sede:'Boston',estado:'pendiente'},
  {id:47,fecha:'23 Jun',hora:'19:00',local:'Panamá',visita:'Croacia',grupo:'L',sede:'Toronto',estado:'pendiente'},
  {id:48,fecha:'23 Jun',hora:'22:00',local:'Colombia',visita:'R.D. Congo',grupo:'K',sede:'Guadalajara',estado:'pendiente'},
  {id:49,fecha:'24 Jun',hora:'15:00',local:'Suiza',visita:'Canadá',grupo:'B',sede:'Vancouver',estado:'pendiente'},
  {id:50,fecha:'24 Jun',hora:'15:00',local:'Bosnia y Herzegovina',visita:'Qatar',grupo:'B',sede:'Seattle',estado:'pendiente'},
  {id:51,fecha:'24 Jun',hora:'18:00',local:'Escocia',visita:'Brasil',grupo:'C',sede:'Miami',estado:'pendiente'},
  {id:52,fecha:'24 Jun',hora:'18:00',local:'Marruecos',visita:'Haití',grupo:'C',sede:'Atlanta',estado:'pendiente'},
  {id:53,fecha:'24 Jun',hora:'21:00',local:'Rep. Checa',visita:'México',grupo:'A',sede:'Ciudad de México',estado:'pendiente'},
  {id:54,fecha:'24 Jun',hora:'21:00',local:'Sudáfrica',visita:'Corea del Sur',grupo:'A',sede:'Guadalajara',estado:'pendiente'},
  {id:55,fecha:'25 Jun',hora:'16:00',local:'Curazao',visita:'Costa de Marfil',grupo:'E',sede:'Filadelfia',estado:'pendiente'},
  {id:56,fecha:'25 Jun',hora:'16:00',local:'Ecuador',visita:'Alemania',grupo:'E',sede:'Nueva Jersey',estado:'pendiente'},
  {id:57,fecha:'25 Jun',hora:'19:00',local:'Japón',visita:'Suecia',grupo:'F',sede:'Dallas',estado:'pendiente'},
  {id:58,fecha:'25 Jun',hora:'19:00',local:'Túnez',visita:'Países Bajos',grupo:'F',sede:'Kansas City',estado:'pendiente'},
  {id:59,fecha:'25 Jun',hora:'22:00',local:'Turquía',visita:'Estados Unidos',grupo:'D',sede:'Los Ángeles',estado:'pendiente'},
  {id:60,fecha:'25 Jun',hora:'22:00',local:'Paraguay',visita:'Australia',grupo:'D',sede:'San Francisco',estado:'pendiente'},
  {id:61,fecha:'26 Jun',hora:'15:00',local:'Noruega',visita:'Francia',grupo:'I',sede:'Boston',estado:'pendiente'},
  {id:62,fecha:'26 Jun',hora:'15:00',local:'Senegal',visita:'Irak',grupo:'I',sede:'Toronto',estado:'pendiente'},
  {id:63,fecha:'26 Jun',hora:'20:00',local:'Cabo Verde',visita:'Arabia Saudí',grupo:'H',sede:'Houston',estado:'pendiente'},
  {id:64,fecha:'26 Jun',hora:'20:00',local:'Uruguay',visita:'España',grupo:'H',sede:'Guadalajara',estado:'pendiente'},
  {id:65,fecha:'26 Jun',hora:'23:00',local:'Egipto',visita:'Irán',grupo:'G',sede:'Seattle',estado:'pendiente'},
  {id:66,fecha:'26 Jun',hora:'23:00',local:'Nueva Zelanda',visita:'Bélgica',grupo:'G',sede:'Vancouver',estado:'pendiente'},
  {id:67,fecha:'27 Jun',hora:'17:00',local:'Panamá',visita:'Inglaterra',grupo:'L',sede:'Nueva Jersey',estado:'pendiente'},
  {id:68,fecha:'27 Jun',hora:'17:00',local:'Croacia',visita:'Ghana',grupo:'L',sede:'Filadelfia',estado:'pendiente'},
  {id:69,fecha:'27 Jun',hora:'19:30',local:'Colombia',visita:'Portugal',grupo:'K',sede:'Miami',estado:'pendiente'},
  {id:70,fecha:'27 Jun',hora:'19:30',local:'R.D. Congo',visita:'Uzbekistán',grupo:'K',sede:'Atlanta',estado:'pendiente'},
  {id:71,fecha:'27 Jun',hora:'22:00',local:'Argelia',visita:'Austria',grupo:'J',sede:'Kansas City',estado:'pendiente'},
  {id:72,fecha:'27 Jun',hora:'22:00',local:'Jordania',visita:'Argentina',grupo:'J',sede:'Dallas',estado:'pendiente'},
  // Eliminatoria
  {id:73,fecha:'28 Jun',hora:'TBD',local:'1° A',visita:'2° B',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:74,fecha:'28 Jun',hora:'TBD',local:'1° C',visita:'2° D',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:75,fecha:'29 Jun',hora:'TBD',local:'1° E',visita:'2° F',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:76,fecha:'29 Jun',hora:'TBD',local:'1° G',visita:'2° H',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:77,fecha:'30 Jun',hora:'TBD',local:'1° I',visita:'2° J',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:78,fecha:'30 Jun',hora:'TBD',local:'1° K',visita:'2° L',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:79,fecha:'1 Jul',hora:'TBD',local:'3° mejor',visita:'3° mejor',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:80,fecha:'1 Jul',hora:'TBD',local:'3° mejor',visita:'3° mejor',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:81,fecha:'2 Jul',hora:'TBD',local:'3° mejor',visita:'3° mejor',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:82,fecha:'2 Jul',hora:'TBD',local:'3° mejor',visita:'3° mejor',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:83,fecha:'3 Jul',hora:'TBD',local:'3° mejor',visita:'3° mejor',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:84,fecha:'3 Jul',hora:'TBD',local:'3° mejor',visita:'3° mejor',grupo:'16',sede:'TBD',estado:'pendiente'},
  {id:85,fecha:'4 Jul',hora:'TBD',local:'Ganador R1',visita:'Ganador R2',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:86,fecha:'4 Jul',hora:'TBD',local:'Ganador R3',visita:'Ganador R4',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:87,fecha:'5 Jul',hora:'TBD',local:'Ganador R5',visita:'Ganador R6',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:88,fecha:'5 Jul',hora:'TBD',local:'Ganador R7',visita:'Ganador R8',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:89,fecha:'6 Jul',hora:'TBD',local:'Ganador R9',visita:'Ganador R10',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:90,fecha:'6 Jul',hora:'TBD',local:'Ganador R11',visita:'Ganador R12',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:91,fecha:'7 Jul',hora:'TBD',local:'Ganador R13',visita:'Ganador R14',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:92,fecha:'7 Jul',hora:'TBD',local:'Ganador R15',visita:'Ganador R16',grupo:'8',sede:'TBD',estado:'pendiente'},
  {id:93,fecha:'9 Jul',hora:'TBD',local:'Cuarto 1',visita:'Cuarto 2',grupo:'4',sede:'TBD',estado:'pendiente'},
  {id:94,fecha:'9 Jul',hora:'TBD',local:'Cuarto 3',visita:'Cuarto 4',grupo:'4',sede:'TBD',estado:'pendiente'},
  {id:95,fecha:'10 Jul',hora:'TBD',local:'Cuarto 5',visita:'Cuarto 6',grupo:'4',sede:'TBD',estado:'pendiente'},
  {id:96,fecha:'11 Jul',hora:'TBD',local:'Cuarto 7',visita:'Cuarto 8',grupo:'4',sede:'TBD',estado:'pendiente'},
  {id:97,fecha:'14 Jul',hora:'TBD',local:'Semi 1',visita:'Semi 2',grupo:'SF',sede:'TBD',estado:'pendiente'},
  {id:98,fecha:'15 Jul',hora:'TBD',local:'Semi 3',visita:'Semi 4',grupo:'SF',sede:'TBD',estado:'pendiente'},
  {id:99,fecha:'18 Jul',hora:'TBD',local:'3er Lugar',visita:'3er Lugar',grupo:'3P',sede:'TBD',estado:'pendiente'},
  {id:100,fecha:'19 Jul',hora:'14:00',local:'Finalista 1',visita:'Finalista 2',grupo:'FIN',sede:'MetLife Stadium, NJ',estado:'pendiente'},
]


// ─── ADMIN ───────────────────────────────────────────────────
function buildEquipoSelect() {
  document.getElementById('admin-equipo').innerHTML =
    '<option value="">— Selecciona equipo —</option>'+ALL_TEAMS.map(t=>`<option value="${t}">${t}</option>`).join('')
}

document.getElementById('close-modal').addEventListener('click', ()=>document.getElementById('admin-modal').classList.remove('open'))
document.getElementById('admin-modal').addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.remove('open') })

document.getElementById('btn-agregar').addEventListener('click', async ()=>{
  const fase   = document.getElementById('admin-fase').value
  const equipo = document.getElementById('admin-equipo').value
  if (!equipo) { showToast('⚠ Selecciona un equipo',true); return }
  const {error} = await sb.from('polla_clasificados').insert({fase,equipo})
  if (error) { showToast(error.code==='23505'?'⚠ Ya está en esta fase':'Error: '+error.message,true); return }
  showToast(`✓ ${equipo} agregado`)
  await loadClasificados(); await loadRanking()
})

function renderAdminList() {
  const el = document.getElementById('clasificados-list')
  if (!clasificados.length) { el.innerHTML=''; return }
  const byFase={}; clasificados.forEach(c=>{if(!byFase[c.fase]) byFase[c.fase]=[]; byFase[c.fase].push(c)})
  el.innerHTML = '<div style="margin-top:14px;font-size:11px;color:#8892b0;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Clasificados cargados</div>'+
    FASES_LIST.filter(f=>byFase[f.key]).map(f=>
      `<div style="margin-bottom:10px"><div style="font-size:11px;color:#c9a227;margin-bottom:5px;font-weight:700">${f.label.toUpperCase()}</div>
      ${byFase[f.key].map(c=>`<div class="clasificado-item"><span>${c.equipo}</span><button class="btn-del" data-id="${c.id}">×</button></div>`).join('')}</div>`
    ).join('')
  el.querySelectorAll('.btn-del').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const {error} = await sb.from('polla_clasificados').delete().eq('id',parseInt(btn.dataset.id))
      if(error){showToast('Error',true);return}
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
;(async function start() {
  const savedUser = sessionStorage.getItem('polla_user')
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser)
      document.getElementById('login-screen').style.display = 'none'
      document.getElementById('app-screen').style.display = 'block'
      const av = document.getElementById('chip-avatar')
      document.getElementById('chip-name').textContent = currentUser.nombre
      av.textContent = initials(currentUser.nombre)
      av.style.background = currentUser.color+'30'; av.style.color = currentUser.color
      if (currentUser.isAdmin) {
        document.getElementById('user-chip').classList.add('admin-chip')
        const adminBtn = document.createElement('button')
        adminBtn.className='admin-btn'; adminBtn.textContent='⚙ Panel'; adminBtn.style.marginLeft='8px'
        adminBtn.addEventListener('click',()=>{document.getElementById('admin-modal').classList.add('open');renderAdminList()})
        document.getElementById('user-chip').parentNode.insertBefore(adminBtn, document.getElementById('user-chip'))
      }
      await loadAll()
    } catch(e) {
      sessionStorage.removeItem('polla_user')
      await initLogin()
    }
  } else {
    await initLogin()
  }
})()
