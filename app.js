// ─── SUPABASE ────────────────────────────────────────────────
const SB_URL = 'https://zeuwfbycrhxhjwvdvqoi.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldXdmYnljcmh4aGp3dmR2cW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzcxMzcsImV4cCI6MjA4Njg1MzEzN30.4OUEQMFmIY-voG_fW99DPAnEOjaON5fmGmAp92tx8EM'
const sb = supabase.createClient(SB_URL, SB_KEY)

// ─── DATOS ESTÁTICOS ─────────────────────────────────────────
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

const FASES = [
  { key:'octavos', label:'Octavos', pts:1,  max:32 },
  { key:'cuartos', label:'Cuartos', pts:2,  max:8  },
  { key:'semis',   label:'Semis',   pts:3,  max:4  },
  { key:'final',   label:'Final',   pts:5,  max:2  },
  { key:'campeon', label:'Campeón', pts:10, max:1  },
]

const FASE_COLORS = {
  octavos:'#3A1A00', cuartos:'#001A3A',
  semis:'#1A003A',   final:'#2A1A00', campeon:'#C9A227'
}

const AVATAR_COLORS = [
  '#8B1A1A','#7A3B00','#1A6B1A','#005E5E',
  '#004F6B','#2B006B','#7A004A','#5B2000','#003A7A','#5B006B',
]

// ─── ESTADO ──────────────────────────────────────────────────
let ranking      = []
let predicciones = {}
let clasificados = []

// ─── HELPERS ─────────────────────────────────────────────────
function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.style.borderColor = isError ? '#f87171' : '#4ade80'
  t.style.color       = isError ? '#f87171' : '#4ade80'
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}

// ─── NAVEGACIÓN ──────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('page-' + btn.dataset.page).classList.add('active')
  })
})

// ─── CARGA INICIAL ───────────────────────────────────────────
async function loadAll() {
  try {
    await Promise.all([loadRanking(), loadPredicciones(), loadClasificados()])
  } catch (e) {
    console.error('loadAll error:', e)
  }
  buildGrupos()
  buildEquipoSelect()
}

// ─── RANKING ─────────────────────────────────────────────────
async function loadRanking() {
  try {
    const { data, error } = await sb.from('polla_ranking').select('*').order('posicion')
    if (error) throw error
    ranking = data || []
  } catch (e) {
    console.error('loadRanking:', e)
    ranking = []
  }
  renderRanking()
  renderStats()
}

function renderStats() {
  document.getElementById('s-part').textContent  = ranking.length || '0'
  document.getElementById('s-leader').textContent = ranking[0]?.nombre?.split(' ')[0] || '—'
  document.getElementById('s-max').textContent    = ranking[0]?.puntos_total ?? '0'
}

function renderRanking() {
  const max  = (ranking[0]?.puntos_total) || 1
  const body = document.getElementById('ranking-body')

  if (!ranking.length) {
    body.innerHTML = `<tr><td colspan="8">
      <div class="empty">
        <div style="font-size:32px;margin-bottom:12px">⏳</div>
        <div style="font-weight:600;color:#c8d0e8;margin-bottom:6px">Sin participantes aún</div>
        <div>Los datos aparecerán aquí cuando se carguen las predicciones del Excel.</div>
      </div>
    </td></tr>`
    document.getElementById('detail-cards').innerHTML = ''
    return
  }

  body.innerHTML = ranking.map((p, i) => {
    const pct   = Math.round((p.puntos_total / max) * 100)
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
    const posC  = i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':'pos-n'
    const cell  = k => `<td style="text-align:center;color:#8892b0;font-size:12px">${p['pts_'+k] ?? 0}</td>`
    return `<tr>
      <td><span class="pos-badge ${posC}">${p.posicion}</span></td>
      <td>
        <div class="name-cell">
          <div class="avatar" style="background:${color}25;color:${color}">${initials(p.nombre)}</div>
          <div>
            <div style="font-size:13px;color:#c8d0e8">${p.nombre}</div>
            <div style="font-size:11px;color:#8892b0">🏆 ${p.campeon || '—'}</div>
          </div>
        </div>
      </td>
      ${cell('octavos')}${cell('cuartos')}${cell('semis')}${cell('final')}${cell('campeon')}
      <td style="text-align:right">
        <div class="bar-wrap">
          <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="pts-val">${p.puntos_total}</span>
        </div>
      </td>
    </tr>`
  }).join('')

  renderDetailCards()
}

function renderDetailCards() {
  const el = document.getElementById('detail-cards')
  if (!ranking.length) { el.innerHTML = ''; return }

  el.innerHTML = ranking.map((p, i) => {
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
    const chips = FASES.map(f => {
      const pts = p['pts_' + f.key] ?? 0
      const cl  = pts > 0 ? 'hit' : 'pending'
      return `<span class="chip ${cl}">${f.label} ${pts}/${f.max * f.pts}</span>`
    }).join('')
    return `<div class="detail-card">
      <div class="avatar" style="background:${color}25;color:${color};width:36px;height:36px;font-size:13px">${initials(p.nombre)}</div>
      <div style="flex:1">
        <div style="font-size:13px;color:#c8d0e8;margin-bottom:5px">${p.nombre}</div>
        <div class="chips">${chips}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:700;color:#c9a227">${p.puntos_total}</div>
        <div style="font-size:10px;color:#8892b0">${p.aciertos_total ?? 0} aciertos</div>
      </div>
    </div>`
  }).join('')
}

// ─── PREDICCIONES ────────────────────────────────────────────
async function loadPredicciones() {
  try {
    const { data, error } = await sb.from('polla_predicciones').select('participante_id, fase, equipo')
    if (error) throw error
    predicciones = {}
    ;(data || []).forEach(row => {
      if (!predicciones[row.participante_id]) predicciones[row.participante_id] = []
      predicciones[row.participante_id].push({ fase: row.fase, equipo: row.equipo })
    })
  } catch (e) {
    console.error('loadPredicciones:', e)
    predicciones = {}
  }
  buildBracketTabs()
}

function buildBracketTabs() {
  const bar = document.getElementById('bracket-tabs')
  const det = document.getElementById('bracket-detail')

  if (!ranking.length) {
    bar.innerHTML = ''
    det.innerHTML = '<div class="empty">Sin participantes cargados aún.</div>'
    return
  }

  bar.innerHTML = ranking.map((p, i) =>
    `<button class="tab${i===0?' active':''}" data-pid="${p.id}">${p.nombre.split(' ')[0]}</button>`
  ).join('')

  bar.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.tab').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      renderBracketPlayer(parseInt(btn.dataset.pid))
    })
  })

  renderBracketPlayer(ranking[0].id)
}

function renderBracketPlayer(pid) {
  const picks  = predicciones[pid] || []
  const byFase = {}
  picks.forEach(p => {
    if (!byFase[p.fase]) byFase[p.fase] = []
    byFase[p.fase].push(p.equipo)
  })

  const clasSet = {}
  clasificados.forEach(c => {
    if (!clasSet[c.fase]) clasSet[c.fase] = new Set()
    clasSet[c.fase].add(c.equipo)
  })

  const el = document.getElementById('bracket-detail')
  el.innerHTML = FASES.map(f => {
    const teams     = byFase[f.key] || []
    const textColor = f.key === 'campeon' ? '#0A0E1A' : '#e8eaf6'
    const pills     = teams.length
      ? teams.map(t => {
          const hit    = clasSet[f.key]?.has(t)
          const border = hit ? '#2d6a2d' : '#2a3060'
          const tc     = hit ? '#4ade80' : '#c8d0e8'
          return `<span class="team-pill" style="border-color:${border};color:${tc}">${t}</span>`
        }).join('')
      : '<span style="font-size:12px;color:#8892b0;font-style:italic">Sin predicción cargada</span>'

    return `<div class="fase-block">
      <div class="fase-header" style="background:${FASE_COLORS[f.key]};color:${textColor}">
        ${f.label.toUpperCase()} — ${f.pts} pto${f.pts > 1 ? 's' : ''} c/u
      </div>
      <div class="fase-teams">${pills}</div>
    </div>`
  }).join('')
}

// ─── GRUPOS ──────────────────────────────────────────────────
function buildGrupos() {
  document.getElementById('grupos-grid').innerHTML = GRUPOS.map(g =>
    `<div class="grupo-card">
      <div class="grupo-header" style="background:${g.color}">GRUPO ${g.id}</div>
      ${g.teams.map(t => `<div class="grupo-team">${t}</div>`).join('')}
    </div>`
  ).join('')
}

// ─── CLASIFICADOS ────────────────────────────────────────────
async function loadClasificados() {
  try {
    const { data, error } = await sb.from('polla_clasificados').select('*').order('fase').order('equipo')
    if (error) throw error
    clasificados = data || []
  } catch (e) {
    console.error('loadClasificados:', e)
    clasificados = []
  }
  renderClasificadosView()
  renderAdminList()
}

function renderClasificadosView() {
  const el = document.getElementById('clasificados-view')
  if (!clasificados.length) {
    el.innerHTML = '<div class="empty">El admin aún no ha cargado clasificados.</div>'
    return
  }
  const byFase = {}
  clasificados.forEach(c => {
    if (!byFase[c.fase]) byFase[c.fase] = []
    byFase[c.fase].push(c.equipo)
  })
  el.innerHTML = FASES.filter(f => byFase[f.key]).map(f => `
    <div class="fase-block" style="margin-bottom:8px">
      <div class="fase-header" style="background:${FASE_COLORS[f.key]};color:${f.key==='campeon'?'#0a0e1a':'#e8eaf6'}">${f.label.toUpperCase()}</div>
      <div class="fase-teams">${byFase[f.key].map(t => `<span class="team-pill">${t}</span>`).join('')}</div>
    </div>`).join('')
}

// ─── ADMIN ───────────────────────────────────────────────────
function buildEquipoSelect() {
  const sel = document.getElementById('admin-equipo')
  sel.innerHTML = '<option value="">— Selecciona equipo —</option>' +
    ALL_TEAMS.map(t => `<option value="${t}">${t}</option>`).join('')
}

document.getElementById('btn-admin').addEventListener('click', () => {
  document.getElementById('admin-modal').classList.add('open')
  renderAdminList()
})
document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('admin-modal').classList.remove('open')
})
document.getElementById('admin-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open')
})

document.getElementById('btn-agregar').addEventListener('click', async () => {
  const fase   = document.getElementById('admin-fase').value
  const equipo = document.getElementById('admin-equipo').value
  if (!equipo) { showToast('⚠ Selecciona un equipo', true); return }

  const { error } = await sb.from('polla_clasificados').insert({ fase, equipo })
  if (error) {
    if (error.code === '23505') showToast('⚠ Ese equipo ya está en esta fase', true)
    else showToast('Error: ' + error.message, true)
    return
  }
  showToast(`✓ ${equipo} agregado a ${fase}`)
  await loadClasificados()
  await loadRanking()
})

function renderAdminList() {
  const el = document.getElementById('clasificados-list')
  if (!clasificados.length) { el.innerHTML = ''; return }

  const byFase = {}
  clasificados.forEach(c => {
    if (!byFase[c.fase]) byFase[c.fase] = []
    byFase[c.fase].push(c)
  })

  el.innerHTML = '<div style="margin-top:16px;font-size:11px;color:#8892b0;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Clasificados cargados</div>' +
    FASES.filter(f => byFase[f.key]).map(f =>
      `<div style="margin-bottom:10px">
        <div style="font-size:11px;color:#c9a227;margin-bottom:6px;font-weight:700">${f.label.toUpperCase()}</div>
        ${byFase[f.key].map(c =>
          `<div class="clasificado-item">
            <span>${c.equipo}</span>
            <button class="btn-del" data-id="${c.id}">×</button>
          </div>`
        ).join('')}
      </div>`
    ).join('')

  el.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { error } = await sb.from('polla_clasificados').delete().eq('id', parseInt(btn.dataset.id))
      if (error) { showToast('Error al eliminar', true); return }
      showToast('✓ Eliminado')
      await loadClasificados()
      await loadRanking()
    })
  })
}

// ─── REALTIME ────────────────────────────────────────────────
sb.channel('polla-live')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'polla_puntos' }, () => loadRanking())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'polla_clasificados' }, () => loadClasificados())
  .subscribe()

// ─── PARTIDOS PRÓXIMOS ───────────────────────────────────────
const PROXIMOS = [
  { teams:['México','Sudáfrica'],           hora:'15:00', fecha:'11 Jun', grupo:'A' },
  { teams:['Canadá','Bosnia y Herzegovina'],hora:'15:00', fecha:'11 Jun', grupo:'B' },
  { teams:['Brasil','Marruecos'],           hora:'18:00', fecha:'11 Jun', grupo:'C' },
  { teams:['Estados Unidos','Paraguay'],    hora:'21:00', fecha:'11 Jun', grupo:'D' },
  { teams:['Alemania','Curazao'],           hora:'15:00', fecha:'12 Jun', grupo:'E' },
  { teams:['Países Bajos','Japón'],         hora:'18:00', fecha:'12 Jun', grupo:'F' },
  { teams:['España','Cabo Verde'],          hora:'21:00', fecha:'12 Jun', grupo:'H' },
  { teams:['Argentina','Argelia'],          hora:'15:00', fecha:'13 Jun', grupo:'J' },
]

document.getElementById('upcoming-matches').innerHTML = PROXIMOS.map(m => {
  const g = GRUPOS.find(g => g.id === m.grupo)
  return `<div class="match-card">
    <div><span class="group-pill" style="background:${g?.color||'#1a2040'}">GRP ${m.grupo}</span></div>
    <div class="match-teams">
      <span class="team-name r">${m.teams[0]}</span>
      <div class="score-box" style="background:#10142a">
        <span class="score-n" style="color:#8892b0;font-size:12px">vs</span>
      </div>
      <span class="team-name">${m.teams[1]}</span>
    </div>
    <div class="match-meta">${m.fecha} ${m.hora}</div>
  </div>`
}).join('')

// ─── ARRANCAR ────────────────────────────────────────────────
loadAll()
