// ─── SUPABASE ────────────────────────────────────────────────
const SB_URL = 'https://zeuwfbycrhxhjwvdvqoi.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldXdmYnljcmh4aGp3dmR2cW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzcxMzcsImV4cCI6MjA4Njg1MzEzN30.4OUEQMFmIY-voG_fW99DPAnEOjaON5fmGmAp92tx8EM'
const sb = supabase.createClient(SB_URL, SB_KEY)

// ─── CONSTANTES ──────────────────────────────────────────────
const ADMIN_PIN = '1225'
const AVATAR_COLORS = ['#8B1A1A','#7A3B00','#1A6B1A','#005E5E','#004F6B','#2B006B','#7A004A','#5B2000','#003A7A','#5B006B','#6B3A00','#004040']
const CUOTA = 50000

// Equipos que siguen en el torneo (32 clasificados a 16avos)
const EQUIPOS = [
  '🇦🇷 Argentina','🇦🇺 Australia','🇧🇪 Bélgica','🇧🇦 Bosnia y Herzegovina',
  '🇧🇷 Brasil','🇨🇻 Cabo Verde','🇨🇦 Canadá','🇨🇮 Costa de Marfil',
  '🇭🇷 Croacia','🇪🇨 Ecuador','🇪🇬 Egipto','🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra',
  '🇪🇸 España','🇺🇸 Estados Unidos','🇫🇷 Francia','🇬🇭 Ghana',
  '🇩🇪 Alemania','🇯🇵 Japón','🇲🇦 Marruecos','🇲🇽 México',
  '🇳🇱 Países Bajos','🇵🇾 Paraguay','🇵🇹 Portugal','🇸🇳 Senegal',
  '🇸🇩 Sudáfrica','🇸🇪 Suecia','🇨🇭 Suiza','🇸🇩 Argelia',
  '🇳🇴 Noruega','🇨🇩 R.D. Congo','🇦🇹 Austria','🇨🇴 Colombia',
].sort((a,b) => a.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g,'').localeCompare(b.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g,'')))

// Participantes hardcoded — actualizar al agregar nuevos
const PARTICIPANTES_LISTA = [
  { id:1, nombre:'Daniel Rios' },
  { id:2, nombre:'Johanna Flores' },
  { id:3, nombre:'Equipo Series' },
]

// Puntos por posición
const PTS = { p1: 5, p2: 3, p3: 2 }

// ─── ESTADO ──────────────────────────────────────────────────
let currentUser  = null
let ranking      = []
let resultado    = null   // { p1, p2, p3 } — el podio real
let misPicks     = null   // { p1, p2, p3 } del usuario logueado

// ─── HELPERS ─────────────────────────────────────────────────
function initials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }
function formatPesos(n) { return '$' + (n).toLocaleString('es-CL') }

function showToast(msg, err=false) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.style.borderColor = err ? '#f87171' : '#4ade80'
  t.style.color = err ? '#f87171' : '#4ade80'
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}

function pillClass(equipo, slot) {
  if (!resultado) return 'pending'
  const real = resultado[slot]
  return equipo === real ? 'hit' : 'miss'
}

// ─── LOGIN ───────────────────────────────────────────────────
function initLogin() {
  const select   = document.getElementById('login-select')
  const loginBtn = document.getElementById('login-btn')

  select.innerHTML = '<option value="">— Selecciona tu nombre —</option>'
  PARTICIPANTES_LISTA.forEach((p, i) => {
    const opt = document.createElement('option')
    opt.value = p.id; opt.dataset.nombre = p.nombre; opt.dataset.idx = i
    opt.textContent = p.nombre
    select.appendChild(opt)
  })
  const sep = document.createElement('option'); sep.disabled = true; sep.textContent = '──────────'
  select.appendChild(sep)
  const admin = document.createElement('option'); admin.value = '__admin__'; admin.textContent = '⚙ Administrador'
  select.appendChild(admin)

  select.addEventListener('change', () => {
    const v = select.value
    loginBtn.disabled = !v
    document.getElementById('pin-wrap').style.display = v === '__admin__' ? 'block' : 'none'
    document.getElementById('login-error').textContent = ''
    document.getElementById('login-pin').value = ''
    if (v === '__admin__') document.getElementById('login-pin').focus()
  })

  document.getElementById('login-pin').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click()
  })

  loginBtn.addEventListener('click', () => {
    const pin   = document.getElementById('login-pin').value.trim()
    const errEl = document.getElementById('login-error')
    const opt   = select.options[select.selectedIndex]
    if (!select.value) { errEl.textContent = 'Selecciona tu nombre'; return }

    if (select.value === '__admin__') {
      if (pin !== ADMIN_PIN) { errEl.textContent = 'PIN incorrecto'; return }
      currentUser = { nombre:'Administrador', isAdmin:true, id:null, color:'#4ade80' }
    } else {
      const idx = parseInt(opt.dataset.idx ?? 0)
      currentUser = { nombre: opt.dataset.nombre||opt.textContent.trim(), isAdmin:false, id:parseInt(select.value), color:AVATAR_COLORS[idx%AVATAR_COLORS.length] }
    }
    sessionStorage.setItem('polla_user', JSON.stringify(currentUser))
    enterApp()
  })
}

// ─── ENTRAR ──────────────────────────────────────────────────
function setupAppShell() {
  document.getElementById('chip-name').textContent = currentUser.nombre
  const av = document.getElementById('chip-avatar')
  av.textContent = initials(currentUser.nombre)
  av.style.background = currentUser.color + '30'; av.style.color = currentUser.color
  if (currentUser.isAdmin) {
    document.getElementById('user-chip').classList.add('admin-chip')
    if (!document.getElementById('admin-panel-btn')) {
      const btn = document.createElement('button')
      btn.id = 'admin-panel-btn'; btn.className = 'nav-btn'; btn.textContent = '⚙'
      btn.style.marginLeft = '4px'
      btn.addEventListener('click', () => { document.getElementById('admin-modal').classList.add('open'); renderResultadoActual() })
      document.querySelector('.nav').appendChild(btn)
    }
  }
}

async function enterApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-screen').style.display = 'block'
  setupAppShell()
  buildEquipoSelects()
  await loadAll()
}

function logout() {
  sessionStorage.removeItem('polla_user')
  currentUser = null
  const adminBtn = document.getElementById('admin-panel-btn')
  if (adminBtn) adminBtn.remove()
  document.getElementById('user-chip').classList.remove('admin-chip')
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
    if (!btn.dataset.page) return
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('page-' + btn.dataset.page).classList.add('active')
  })
})

// ─── CARGA ───────────────────────────────────────────────────
async function loadAll() {
  await Promise.all([loadRanking(), loadResultado(), loadMisPicks()])
  renderRanking()
  renderStats()
  renderSavedPicks()
}

// ─── RANKING ─────────────────────────────────────────────────
async function loadRanking() {
  try {
    const { data, error } = await sb.from('polla_podio_picks').select('*').order('puntos', { ascending:false })
    if (error) throw error
    ranking = data || []
  } catch(e) { console.error('loadRanking:', e); ranking = [] }
}

async function loadResultado() {
  try {
    const { data, error } = await sb.from('polla_podio_resultado').select('*').limit(1).single()
    if (error && error.code !== 'PGRST116') throw error
    resultado = data || null
  } catch(e) { resultado = null }
}

async function loadMisPicks() {
  if (!currentUser || currentUser.isAdmin) return
  try {
    const { data } = await sb.from('polla_podio_picks').select('*').eq('participante_id', currentUser.id).single()
    misPicks = data || null
  } catch(e) { misPicks = null }
}

function calcPuntos(pick) {
  if (!resultado || !pick) return 0
  let pts = 0
  if (pick.p1 === resultado.p1) pts += PTS.p1
  if (pick.p2 === resultado.p2) pts += PTS.p2
  if (pick.p3 === resultado.p3) pts += PTS.p3
  return pts
}

function renderStats() {
  const n = ranking.length
  document.getElementById('s-part').textContent  = n || '0'
  document.getElementById('s-pozo').textContent   = formatPesos(n * CUOTA)
  const sorted = [...ranking].sort((a,b) => calcPuntos(b) - calcPuntos(a))
  document.getElementById('s-leader').textContent  = sorted[0]?.nombre?.split(' ')[0] || '—'
  document.getElementById('s-pts').textContent     = sorted[0] ? calcPuntos(sorted[0]) : '—'
}

function renderRanking() {
  // Calcular puntos y ordenar
  const sorted = [...ranking].map(r => ({ ...r, pts: calcPuntos(r) }))
    .sort((a,b) => b.pts - a.pts || (a.p1 === resultado?.p1 ? -1 : 1))

  // Podio top 3
  const podioEl = document.getElementById('podio-top')
  const medals = ['🥇','🥈','🥉']
  const pClasses = ['p1','p2','p3']
  const pColors = ['var(--gold)','var(--silver)','var(--bronze)']
  podioEl.innerHTML = [0,1,2].map(i => {
    const p = sorted[i]
    return `<div class="podio-card ${pClasses[i]}">
      <div class="podio-medal">${medals[i]}</div>
      ${p ? `
        <div class="podio-name">${p.nombre}</div>
        <div class="podio-pts ${pClasses[i]}">${p.pts} pts</div>
        <div class="podio-detail">${p.p1||'—'} / ${p.p2||'—'} / ${p.p3||'—'}</div>
      ` : `<div class="podio-name" style="color:var(--muted)">Sin datos</div>`}
    </div>`
  }).join('')

  // Tabla
  const body = document.getElementById('ranking-body')
  if (!sorted.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty">Aún no hay participantes.</div></td></tr>`
    return
  }
  body.innerHTML = sorted.map((p, i) => {
    const isMe = currentUser && !currentUser.isAdmin && p.participante_id === parseInt(currentUser.id)
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
    const posC = i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':'pos-n'
    const pc1 = resultado ? pillClass(p.p1,'p1') : 'pending'
    const pc2 = resultado ? pillClass(p.p2,'p2') : 'pending'
    const pc3 = resultado ? pillClass(p.p3,'p3') : 'pending'
    return `<tr class="${isMe?'me':''}">
      <td><span class="pos-badge ${posC}">${i+1}</span></td>
      <td><div class="name-cell">
        <div class="avatar" style="background:${color}25;color:${color}">${initials(p.nombre)}</div>
        <span style="font-size:13px;color:#c8d0e8">${p.nombre}${isMe?'<span style="font-size:10px;color:#4ade80;background:#0d1a0d;padding:1px 6px;border-radius:4px;margin-left:6px">Tú</span>':''}</span>
      </div></td>
      <td style="text-align:center"><span class="flag-pill ${pc1}">${p.p1||'—'}</span></td>
      <td style="text-align:center"><span class="flag-pill ${pc2}">${p.p2||'—'}</span></td>
      <td style="text-align:center"><span class="flag-pill ${pc3}">${p.p3||'—'}</span></td>
      <td style="text-align:right;font-size:16px;font-weight:700;color:${p.pts>0?'var(--gold)':'var(--muted)'}">${p.pts}</td>
    </tr>`
  }).join('')
}

// ─── MI SELECCIÓN ────────────────────────────────────────────
function buildEquipoSelects() {
  const opts = '<option value="">— Elige —</option>' + EQUIPOS.map(e => `<option value="${e}">${e}</option>`).join('')
  ;['pick-1','pick-2','pick-3','admin-1','admin-2','admin-3'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.innerHTML = opts
  })
}

function renderSavedPicks() {
  const el = document.getElementById('saved-picks-display')
  if (!misPicks) { el.innerHTML = ''; return }

  const pc1 = resultado ? pillClass(misPicks.p1,'p1') : 'pending'
  const pc2 = resultado ? pillClass(misPicks.p2,'p2') : 'pending'
  const pc3 = resultado ? pillClass(misPicks.p3,'p3') : 'pending'
  const pts = calcPuntos(misPicks)

  el.innerHTML = `<div style="background:#0d1a0d;border:1px solid #2d6a2d;border-radius:10px;padding:14px 16px;margin-bottom:16px">
    <div style="font-size:12px;color:var(--green);font-weight:700;margin-bottom:10px">✓ Tu selección guardada${pts>0?` · <span style="color:var(--gold)">${pts} puntos</span>`:''}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <span class="flag-pill ${pc1}">🥇 ${misPicks.p1||'—'}</span>
      <span class="flag-pill ${pc2}">🥈 ${misPicks.p2||'—'}</span>
      <span class="flag-pill ${pc3}">🥉 ${misPicks.p3||'—'}</span>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:8px">Puedes actualizar tu selección mientras el torneo esté en curso.</div>
  </div>`

  // Pre-llenar selects con picks guardados
  document.getElementById('pick-1').value = misPicks.p1 || ''
  document.getElementById('pick-2').value = misPicks.p2 || ''
  document.getElementById('pick-3').value = misPicks.p3 || ''
}

document.getElementById('submit-picks').addEventListener('click', async () => {
  const p1 = document.getElementById('pick-1').value
  const p2 = document.getElementById('pick-2').value
  const p3 = document.getElementById('pick-3').value
  const err = document.getElementById('picks-error')

  if (!p1 || !p2 || !p3) { err.textContent = 'Debes elegir los 3 puestos'; return }
  if (p1===p2 || p1===p3 || p2===p3) { err.textContent = 'Los 3 equipos deben ser distintos'; return }
  err.textContent = ''

  const pts = calcPuntos({ p1, p2, p3 })
  const payload = { participante_id: currentUser.id, nombre: currentUser.nombre, p1, p2, p3, puntos: pts }

  const { error } = await sb.from('polla_podio_picks').upsert(payload, { onConflict: 'participante_id' })
  if (error) { showToast('Error al guardar: ' + error.message, true); return }

  showToast('✓ Selección guardada')
  misPicks = payload
  await loadAll()
})

// ─── ADMIN ───────────────────────────────────────────────────
document.getElementById('close-modal').addEventListener('click', () => document.getElementById('admin-modal').classList.remove('open'))
document.getElementById('admin-modal').addEventListener('click', e => { if (e.target===e.currentTarget) e.currentTarget.classList.remove('open') })

async function renderResultadoActual() {
  await loadResultado()
  const el = document.getElementById('resultado-actual')
  if (resultado) {
    el.style.display = 'block'
    el.innerHTML = `<div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Podio oficial guardado</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="flag-pill hit">🥇 ${resultado.p1}</span>
        <span class="flag-pill hit">🥈 ${resultado.p2}</span>
        <span class="flag-pill hit">🥉 ${resultado.p3}</span>
      </div>`
    document.getElementById('admin-1').value = resultado.p1 || ''
    document.getElementById('admin-2').value = resultado.p2 || ''
    document.getElementById('admin-3').value = resultado.p3 || ''
  } else {
    el.style.display = 'none'
  }
}

document.getElementById('btn-guardar-resultado').addEventListener('click', async () => {
  const p1 = document.getElementById('admin-1').value
  const p2 = document.getElementById('admin-2').value
  const p3 = document.getElementById('admin-3').value
  if (!p1||!p2||!p3) { showToast('Completa los 3 puestos', true); return }
  if (p1===p2||p1===p3||p2===p3) { showToast('Los 3 equipos deben ser distintos', true); return }

  // Guardar resultado
  const { error } = await sb.from('polla_podio_resultado').upsert({ id:1, p1, p2, p3 })
  if (error) { showToast('Error: ' + error.message, true); return }

  // Recalcular puntos de todos los picks
  resultado = { p1, p2, p3 }
  const { data: picks } = await sb.from('polla_podio_picks').select('*')
  for (const pick of picks||[]) {
    const pts = calcPuntos(pick)
    await sb.from('polla_podio_picks').update({ puntos: pts }).eq('participante_id', pick.participante_id)
  }

  showToast('✓ Resultado guardado — puntos actualizados')
  document.getElementById('admin-modal').classList.remove('open')
  await loadAll()
})

// ─── REALTIME ────────────────────────────────────────────────
sb.channel('polla-podio-live')
  .on('postgres_changes', {event:'*', schema:'public', table:'polla_podio_picks'}, async () => {
    await loadRanking(); renderRanking(); renderStats()
  })
  .on('postgres_changes', {event:'*', schema:'public', table:'polla_podio_resultado'}, async () => {
    await loadResultado(); await loadAll()
  })
  .subscribe()

// ─── ARRANCAR ────────────────────────────────────────────────
;(async function start() {
  buildEquipoSelects()
  initLogin()
  const saved = sessionStorage.getItem('polla_user')
  if (saved) {
    try {
      currentUser = JSON.parse(saved)
      if (currentUser.id) currentUser.id = parseInt(currentUser.id)
      await enterApp()
    } catch(e) { sessionStorage.removeItem('polla_user'); currentUser = null }
  }
})()
