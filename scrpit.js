/* ============================================================
   PUERTO VIRTUAL CIÉNAGA — lógica de la aplicación
   Persistencia: localStorage (funciona abriendo el archivo
   directamente en el navegador, sin servidor).
   ============================================================ */

const AUTH_KEY = 'pvce_auth_v1';
const DATA_KEY = 'pvce_data_v1';
const SESSION_KEY = 'pvce_session_v1';

function defaultAuth(){ return { user:'admin', pass:'puerto2026' }; }
function defaultData(){
  return {
    buques: [
      {id:uid(), nombre:'MV Ciénaga Star', muelle:'Muelle Norte', carga:'Carbón', arribo:isoDate(-2), salida:isoDate(1), estado:'Atracado', toneladas:18000},
      {id:uid(), nombre:'MV Magdalena Reefer', muelle:'Muelle Sur', carga:'Carga refrigerada', arribo:isoDate(0), salida:isoDate(2), estado:'En operación', toneladas:4200}
    ],
    tractomulas: [
      {id:uid(), placa:'WJP-482', conductor:'Carlos Pérez', empresa:'Transportes del Caribe', peso:32500, ingreso:'07:15', salida:'', estado:'Cargando/Descargando'},
      {id:uid(), placa:'TLR-910', conductor:'Yeison Martínez', empresa:'Coolechera Cargo', peso:0, ingreso:'08:02', salida:'', estado:'Zona de espera'}
    ],
    cargas: [
      {id:uid(), tipo:'Carbón', direccion:'Exportación', fecha:isoDate(-1), cantidad:15000, buque:'MV Ciénaga Star', estado:'En proceso'},
      {id:uid(), tipo:'Carga refrigerada', direccion:'Importación', fecha:isoDate(0), cantidad:850, buque:'MV Magdalena Reefer', estado:'En proceso'},
      {id:uid(), tipo:'Contenedores', direccion:'Exportación', fecha:isoDate(-3), cantidad:120, buque:'', estado:'Completada'}
    ],
    bitacora: [
      {id:uid(), fecha:isoDate(0), hora:'06:30', autor:'admin', evento:'Inicio de turno. Condiciones climáticas favorables para operación de cargue.'}
    ]
  };
}
function uid(){ return 'id' + Math.random().toString(36).slice(2,10); }
function isoDate(offsetDays){
  const d = new Date(); d.setDate(d.getDate()+offsetDays);
  return d.toISOString().slice(0,10);
}
function fmtDate(s){ if(!s) return '—'; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; }

function loadAuth(){
  let a = localStorage.getItem(AUTH_KEY);
  if(!a){ a = JSON.stringify(defaultAuth()); localStorage.setItem(AUTH_KEY, a); }
  return JSON.parse(a);
}
function loadData(){
  let d = localStorage.getItem(DATA_KEY);
  if(!d){ d = JSON.stringify(defaultData()); localStorage.setItem(DATA_KEY, d); }
  return JSON.parse(d);
}
function saveData(data){ localStorage.setItem(DATA_KEY, JSON.stringify(data)); renderAll(); }

let DATA = loadData();

/* ---------------- LOGIN ---------------- */
function doLogin(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const auth = loadAuth();
  const errEl = document.getElementById('loginErr');
  if(u === auth.user && p === auth.pass){
    sessionStorage.setItem(SESSION_KEY, '1');
    errEl.textContent = '';
    enterApp(u);
  } else {
    errEl.textContent = 'Usuario o contraseña incorrectos.';
  }
}
function enterApp(user){
  document.getElementById('loginGate').style.display = 'none';
  document.getElementById('app').classList.add('show');
  document.getElementById('whoUser').textContent = user;
  renderAll();
}
function logout(){
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}
document.getElementById('loginPass').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

window.addEventListener('DOMContentLoaded', () => {
  if(sessionStorage.getItem(SESSION_KEY) === '1'){
    const auth = loadAuth();
    enterApp(auth.user);
  }
});

/* ---------------- NAV ---------------- */
document.getElementById('navlist').addEventListener('click', e => {
  const btn = e.target.closest('button[data-target]');
  if(!btn) return;
  document.querySelectorAll('nav.navlist button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('main .section').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-'+btn.dataset.target).classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
});

/* ---------------- MODALS helpers ---------------- */
function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){ document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target === ov) ov.classList.remove('show'); });
});

/* ---------------- BUQUES ---------------- */
let editingBuqueId = null;
function openBuqueModal(id){
  editingBuqueId = id || null;
  document.getElementById('mBuqueTitle').textContent = id ? 'Editar buque' : 'Registrar buque';
  if(id){
    const b = DATA.buques.find(x=>x.id===id);
    fBuqueNombre.value=b.nombre; fBuqueMuelle.value=b.muelle; fBuqueCarga.value=b.carga;
    fBuqueArribo.value=b.arribo; fBuqueSalida.value=b.salida; fBuqueEstado.value=b.estado; fBuqueTon.value=b.toneladas;
  } else {
    ['fBuqueNombre','fBuqueArribo','fBuqueSalida','fBuqueTon'].forEach(id2=>document.getElementById(id2).value='');
    fBuqueMuelle.value='Muelle Norte'; fBuqueCarga.value='Carga general'; fBuqueEstado.value='Programado';
  }
  openModal('modalBuque');
}
function saveBuque(){
  const nombre = fBuqueNombre.value.trim();
  if(!nombre){ alert('Ingresa el nombre del buque.'); return; }
  const rec = {
    id: editingBuqueId || uid(),
    nombre, muelle: fBuqueMuelle.value, carga: fBuqueCarga.value,
    arribo: fBuqueArribo.value, salida: fBuqueSalida.value, estado: fBuqueEstado.value,
    toneladas: Number(fBuqueTon.value)||0
  };
  if(editingBuqueId){
    const i = DATA.buques.findIndex(x=>x.id===editingBuqueId);
    DATA.buques[i]=rec;
  } else {
    DATA.buques.push(rec);
  }
  closeModal('modalBuque');
  saveData(DATA);
}
function deleteBuque(id){
  if(!confirm('¿Eliminar este registro de buque?')) return;
  DATA.buques = DATA.buques.filter(x=>x.id!==id);
  saveData(DATA);
}

/* ---------------- TRACTOMULAS ---------------- */
let editingTractoId = null;
function openTractoModal(id){
  editingTractoId = id || null;
  if(id){
    const t = DATA.tractomulas.find(x=>x.id===id);
    fTractoPlaca.value=t.placa; fTractoConductor.value=t.conductor; fTractoEmpresa.value=t.empresa;
    fTractoPeso.value=t.peso; fTractoIngreso.value=t.ingreso; fTractoSalida.value=t.salida; fTractoEstado.value=t.estado;
  } else {
    ['fTractoPlaca','fTractoConductor','fTractoEmpresa','fTractoPeso','fTractoIngreso','fTractoSalida'].forEach(x=>document.getElementById(x).value='');
    fTractoEstado.value='Zona de espera';
  }
  openModal('modalTracto');
}
function saveTracto(){
  const placa = fTractoPlaca.value.trim();
  if(!placa){ alert('Ingresa la placa del vehículo.'); return; }
  const rec = {
    id: editingTractoId || uid(),
    placa, conductor: fTractoConductor.value.trim(), empresa: fTractoEmpresa.value.trim(),
    peso: Number(fTractoPeso.value)||0, ingreso: fTractoIngreso.value, salida: fTractoSalida.value, estado: fTractoEstado.value
  };
  if(editingTractoId){
    const i = DATA.tractomulas.findIndex(x=>x.id===editingTractoId);
    DATA.tractomulas[i]=rec;
  } else {
    DATA.tractomulas.push(rec);
  }
  closeModal('modalTracto');
  saveData(DATA);
}
function deleteTracto(id){
  if(!confirm('¿Eliminar este registro de tractomula?')) return;
  DATA.tractomulas = DATA.tractomulas.filter(x=>x.id!==id);
  saveData(DATA);
}

/* ---------------- CARGAS ---------------- */
let editingCargaId = null;
function openCargaModal(id){
  editingCargaId = id || null;
  if(id){
    const c = DATA.cargas.find(x=>x.id===id);
    fCargaTipo.value=c.tipo; fCargaDireccion.value=c.direccion; fCargaFecha.value=c.fecha;
    fCargaCantidad.value=c.cantidad; fCargaBuque.value=c.buque; fCargaEstado.value=c.estado;
  } else {
    ['fCargaFecha','fCargaCantidad','fCargaBuque'].forEach(x=>document.getElementById(x).value='');
    fCargaTipo.value='Carga general'; fCargaDireccion.value='Exportación'; fCargaEstado.value='Programada';
  }
  openModal('modalCarga');
}
function saveCarga(){
  const rec = {
    id: editingCargaId || uid(),
    tipo: fCargaTipo.value, direccion: fCargaDireccion.value, fecha: fCargaFecha.value,
    cantidad: Number(fCargaCantidad.value)||0, buque: fCargaBuque.value.trim(), estado: fCargaEstado.value
  };
  if(editingCargaId){
    const i = DATA.cargas.findIndex(x=>x.id===editingCargaId);
    DATA.cargas[i]=rec;
  } else {
    DATA.cargas.push(rec);
  }
  closeModal('modalCarga');
  saveData(DATA);
}
function deleteCarga(id){
  if(!confirm('¿Eliminar este registro de carga?')) return;
  DATA.cargas = DATA.cargas.filter(x=>x.id!==id);
  saveData(DATA);
}

/* ---------------- BITÁCORA ---------------- */
function openBitacoraModal(){
  fBitFecha.value = isoDate(0);
  fBitHora.value = new Date().toTimeString().slice(0,5);
  fBitAutor.value = document.getElementById('whoUser').textContent;
  fBitEvento.value = '';
  openModal('modalBitacora');
}
function saveBitacora(){
  const evento = fBitEvento.value.trim();
  if(!evento){ alert('Describe el evento.'); return; }
  DATA.bitacora.unshift({
    id: uid(), fecha: fBitFecha.value || isoDate(0), hora: fBitHora.value || '00:00',
    autor: fBitAutor.value.trim() || 'admin', evento
  });
  closeModal('modalBitacora');
  saveData(DATA);
}
function deleteBitacora(id){
  if(!confirm('¿Eliminar este registro de bitácora?')) return;
  DATA.bitacora = DATA.bitacora.filter(x=>x.id!==id);
  saveData(DATA);
}

/* ---------------- BADGES ---------------- */
function estadoBadge(estado){
  const map = {
    'Atracado':'b-green','En operación':'b-orange','Programado':'b-blue','Zarpado':'b-warn',
    'Zona de espera':'b-blue','Inspección':'b-warn','Cargando/Descargando':'b-orange','Despachado':'b-green',
    'Programada':'b-blue','En proceso':'b-orange','Completada':'b-green'
  };
  return `<span class="badge ${map[estado]||'b-blue'}">${estado}</span>`;
}

/* ---------------- RENDER ---------------- */
function renderAll(){
  renderDashboard();
  renderBuques();
  renderTracto();
  renderCargas();
  renderIndicadores();
  renderBitacora();
}

function renderDashboard(){
  const totalTon = DATA.cargas.reduce((s,c)=>s+c.cantidad,0);
  const buquesActivos = DATA.buques.filter(b=>['Atracado','En operación'].includes(b.estado)).length;
  const contenedores = DATA.cargas.filter(c=>c.tipo==='Contenedores').reduce((s,c)=>s+c.cantidad,0);
  const vehiculos = DATA.tractomulas.length;

  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card"><div class="lab">Buques activos</div><div class="num">${buquesActivos}</div><div class="sub">${DATA.buques.length} registrados en total</div></div>
    <div class="stat-card"><div class="lab">Contenedores operados</div><div class="num">${contenedores}</div><div class="sub">unidades registradas</div></div>
    <div class="stat-card"><div class="lab">Carga movilizada</div><div class="num">${totalTon.toLocaleString('es-CO')}</div><div class="sub">toneladas / unidades acumuladas</div></div>
    <div class="stat-card"><div class="lab">Vehículos atendidos</div><div class="num">${vehiculos}</div><div class="sub">tractomulas en el sistema</div></div>
  `;

  const tickerItems = [
    {lab:'Buques activos', val:buquesActivos},
    {lab:'Contenedores', val:contenedores},
    {lab:'Toneladas movilizadas', val:totalTon.toLocaleString('es-CO')},
    {lab:'Tractomulas', val:vehiculos},
    {lab:'Registros de bitácora', val:DATA.bitacora.length},
  ];
  const trackHtml = tickerItems.map(i=>`<span class="ticker-item"><span class="lab">${i.lab}</span><span class="val">${i.val}</span></span>`).join('');
  document.getElementById('tickerTrack').innerHTML = trackHtml + trackHtml;

  document.getElementById('dashBuquesResumen').textContent = DATA.buques.length
    ? DATA.buques.slice(-3).reverse().map(b=>`${b.nombre} (${b.estado})`).join(' · ')
    : 'Sin registros aún.';
  document.getElementById('dashTractoResumen').textContent = DATA.tractomulas.length
    ? DATA.tractomulas.slice(-3).reverse().map(t=>`${t.placa} (${t.estado})`).join(' · ')
    : 'Sin registros aún.';
}

function renderBuques(){
  const tbody = document.getElementById('tblBuques');
  document.getElementById('countBuques').textContent = `(${DATA.buques.length})`;
  if(!DATA.buques.length){ tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No hay buques registrados. Usa "+ Registrar buque".</td></tr>`; }
  else {
    tbody.innerHTML = DATA.buques.map(b=>`
      <tr>
        <td><b>${b.nombre}</b></td>
        <td>${b.muelle}</td>
        <td>${b.carga}</td>
        <td class="mono">${fmtDate(b.arribo)}</td>
        <td class="mono">${fmtDate(b.salida)}</td>
        <td>${estadoBadge(b.estado)}</td>
        <td class="row-actions">
          <button class="icon-btn" onclick="openBuqueModal('${b.id}')">Editar</button>
          <button class="icon-btn del" onclick="deleteBuque('${b.id}')">Eliminar</button>
        </td>
      </tr>`).join('');
  }
  const norte = DATA.buques.filter(b=>b.muelle==='Muelle Norte');
  const sur = DATA.buques.filter(b=>b.muelle==='Muelle Sur');
  document.getElementById('muelleNorteResumen').textContent = norte.length ? norte.map(b=>b.nombre).join(', ') : 'Sin buques asignados.';
  document.getElementById('muelleSurResumen').textContent = sur.length ? sur.map(b=>b.nombre).join(', ') : 'Sin buques asignados.';
}

function renderTracto(){
  const tbody = document.getElementById('tblTracto');
  document.getElementById('countTracto').textContent = `(${DATA.tractomulas.length})`;
  if(!DATA.tractomulas.length){ tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No hay tractomulas registradas.</td></tr>`; }
  else {
    tbody.innerHTML = DATA.tractomulas.map(t=>`
      <tr>
        <td class="mono">${t.placa}</td>
        <td>${t.conductor||'—'}</td>
        <td>${t.empresa||'—'}</td>
        <td class="mono">${t.ingreso||'—'}</td>
        <td class="mono">${t.salida||'—'}</td>
        <td class="mono">${t.peso ? t.peso.toLocaleString('es-CO') : '—'}</td>
        <td>${estadoBadge(t.estado)}</td>
        <td class="row-actions">
          <button class="icon-btn" onclick="openTractoModal('${t.id}')">Editar</button>
          <button class="icon-btn del" onclick="deleteTracto('${t.id}')">Eliminar</button>
        </td>
      </tr>`).join('');
  }
}

function renderCargas(){
  const tbody = document.getElementById('tblCargas');
  document.getElementById('countCargas').textContent = `(${DATA.cargas.length})`;
  if(!DATA.cargas.length){ tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No hay cargas registradas.</td></tr>`; }
  else {
    tbody.innerHTML = [...DATA.cargas].reverse().map(c=>`
      <tr>
        <td class="mono">${fmtDate(c.fecha)}</td>
        <td>${c.tipo}</td>
        <td>${c.direccion==='Exportación' ? '<span class="badge b-blue">Exportación</span>' : '<span class="badge b-orange">Importación</span>'}</td>
        <td>${c.buque||'—'}</td>
        <td class="mono">${c.cantidad.toLocaleString('es-CO')}</td>
        <td>${estadoBadge(c.estado)}</td>
        <td class="row-actions">
          <button class="icon-btn" onclick="openCargaModal('${c.id}')">Editar</button>
          <button class="icon-btn del" onclick="deleteCarga('${c.id}')">Eliminar</button>
        </td>
      </tr>`).join('');
  }
}

function renderIndicadores(){
  const totalTon = DATA.cargas.reduce((s,c)=>s+c.cantidad,0);
  const buquesActivos = DATA.buques.filter(b=>['Atracado','En operación'].includes(b.estado)).length;
  const contenedores = DATA.cargas.filter(c=>c.tipo==='Contenedores').reduce((s,c)=>s+c.cantidad,0);
  const vehiculos = DATA.tractomulas.length;
  const exportaciones = DATA.cargas.filter(c=>c.direccion==='Exportación').reduce((s,c)=>s+c.cantidad,0);
  const importaciones = DATA.cargas.filter(c=>c.direccion==='Importación').reduce((s,c)=>s+c.cantidad,0);

  document.getElementById('kpiRow').innerHTML = `
    <div class="kpi"><div class="n">${totalTon.toLocaleString('es-CO')}</div><div class="l">Toneladas movilizadas</div></div>
    <div class="kpi"><div class="n">${DATA.buques.length}</div><div class="l">Número de buques</div></div>
    <div class="kpi"><div class="n">${contenedores}</div><div class="l">Contenedores operados</div></div>
    <div class="kpi"><div class="n">${vehiculos}</div><div class="l">Vehículos atendidos</div></div>
    <div class="kpi"><div class="n">${buquesActivos}</div><div class="l">Buques activos hoy</div></div>
  `;

  const tipos = ['Carga general','Granel sólido','Granel líquido','Contenedores','Carga refrigerada','Carbón','Proyectos especiales'];
  const porTipo = tipos.map(t=>({tipo:t, val: DATA.cargas.filter(c=>c.tipo===t).reduce((s,c)=>s+c.cantidad,0)}));
  const maxTipo = Math.max(1, ...porTipo.map(t=>t.val));
  document.getElementById('barsCarga').innerHTML = porTipo.map(t=>`
    <div class="bar-row">
      <div class="bar-label"><span>${t.tipo}</span><span>${t.val.toLocaleString('es-CO')}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(t.val/maxTipo*100)}%"></div></div>
    </div>`).join('');

  const maxIE = Math.max(1, exportaciones, importaciones);
  document.getElementById('barsImpExp').innerHTML = `
    <div class="bar-row">
      <div class="bar-label"><span>Exportaciones</span><span>${exportaciones.toLocaleString('es-CO')}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(exportaciones/maxIE*100)}%"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label"><span>Importaciones</span><span>${importaciones.toLocaleString('es-CO')}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(importaciones/maxIE*100)}%"></div></div>
    </div>`;
}

function renderBitacora(){
  const tbody = document.getElementById('tblBitacora');
  document.getElementById('countBitacora').textContent = `(${DATA.bitacora.length})`;
  if(!DATA.bitacora.length){ tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No hay registros en la bitácora.</td></tr>`; }
  else {
    tbody.innerHTML = DATA.bitacora.map(b=>`
      <tr>
        <td class="mono">${fmtDate(b.fecha)}</td>
        <td class="mono">${b.hora}</td>
        <td>${b.autor}</td>
        <td>${b.evento}</td>
        <td class="row-actions"><button class="icon-btn del" onclick="deleteBitacora('${b.id}')">Eliminar</button></td>
      </tr>`).join('');
  }
}