const Views = {
  Home: 'home',
  Deposit: 'deposit',
  Shop: 'shop',
  Transport: 'transport',
  Sorting: 'sorting',
  Treatment: 'treatment',
  Dashboard: 'dashboard',
  Storage: 'storage',
  Entities: 'entities',
  SHG: 'shg',
  Education: 'education',
  Alerts: 'alerts',
  Docs: 'docs'
};

const AppState = {
  citizens: [],
  shopInventory: [],
  transports: [],
  sorting: [],
  biogas: [],
  wte: [],
  recyclables: [],
  shgs: [],
  shgOutputs: [],
  education: [],
  alerts: [],
  shops: [ {id:'SHOP-1', name:'Sehkari Shop A', capacityKg:1000}, {id:'SHOP-2', name:'Sehkari Shop B', capacityKg:1500} ],
  plants: [ {id:'PLANT-1', name:'Central Waste Plant'}, {id:'PLANT-2', name:'East Waste Plant'} ],
  settings: { payoutPerKg: 2.0, shopCapacityKg: 1000, role: 'Citizen', activeShopId:'SHOP-1', activePlantId:'PLANT-1' }
};

const StorageKey = 'wm-proto-v1';
function loadState() {
  try {
    const raw = localStorage.getItem(StorageKey);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.assign(AppState, data);
  } catch (e) { console.error('Failed to load state', e); }
}
function saveState() { localStorage.setItem(StorageKey, JSON.stringify(AppState)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmt(n, d=2) { return Number(n).toFixed(d); }

function navButton(id, label) {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = () => routeTo(id);
  b.dataset.view = id;
  return b;
}

function renderNav(active) {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  const buttons = [
    [Views.Home, 'Overview'],
    [Views.Deposit, 'Citizen Deposit'],
    [Views.Shop, 'Sehkari Shop'],
    [Views.Transport, 'Transport'],
    [Views.Sorting, 'Sorting'],
    [Views.Treatment, 'Treatment'],
    [Views.Dashboard, 'Dashboards'],
    [Views.SHG, 'SHG & Cloth'],
    [Views.Education, 'NSS Outreach'],
    [Views.Entities, 'Entities'],
    [Views.Alerts, 'Alerts'],
    [Views.Docs, 'Docs / PDF'],
    [Views.Storage, 'Backup']
  ].map(([id, label]) => navButton(id, label));
  buttons.forEach(b => nav.appendChild(b));
  [...nav.children].forEach(btn => btn.classList.toggle('active', btn.dataset.view === active));
  hydrateSelectors();
}

function setView(html) { document.getElementById('view').innerHTML = html; }

function routeTo(view) {
  renderNav(view);
  const routes = {
    [Views.Home]: renderHome,
    [Views.Deposit]: renderDeposit,
    [Views.Shop]: renderShop,
    [Views.Transport]: renderTransport,
    [Views.Sorting]: renderSorting,
    [Views.Treatment]: renderTreatment,
    [Views.Dashboard]: renderDashboard,
    [Views.Storage]: renderStorage,
    [Views.Entities]: renderEntities,
    [Views.SHG]: renderSHG,
    [Views.Education]: renderEducation,
    [Views.Alerts]: renderAlerts,
    [Views.Docs]: renderDocs
  };
  routes[view]();
}

function hydrateSelectors() {
  const roleSel = document.getElementById('role-select');
  if (roleSel) roleSel.value = AppState.settings.role;
  const shopSel = document.getElementById('shop-select');
  if (shopSel) {
    shopSel.innerHTML = AppState.shops.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    shopSel.value = AppState.settings.activeShopId;
  }
  const plantSel = document.getElementById('plant-select');
  if (plantSel) {
    plantSel.innerHTML = AppState.plants.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    plantSel.value = AppState.settings.activePlantId;
  }
}
function changeRole(role) { AppState.settings.role = role; saveState(); routeTo(Views.Home); }
function selectShop(id) { AppState.settings.activeShopId = id; saveState(); routeTo(Views.Shop); }
function selectPlant(id) { AppState.settings.activePlantId = id; saveState(); routeTo(Views.Transport); }

function renderHome() {
  const totals = computeTotals();
  setView(`
    <div class="grid">
      <div class="card">
        <h3>Citizen Deposits</h3>
        <div class="muted">Total weight</div>
        <div style="font-size:28px;">${fmt(totals.depositsKg)} kg</div>
        <div class="muted">Payouts: ₹ ${fmt(totals.payouts)}</div>
      </div>
      <div class="card">
        <h3>Shop Inventory</h3>
        <div class="muted">On hand</div>
        <div style="font-size:28px;">${fmt(totals.shopKg)} kg</div>
        <div class="muted">Capacity: ${fmt(AppState.settings.shopCapacityKg)} kg</div>
      </div>
      <div class="card">
        <h3>Treatment</h3>
        <div class="muted">Biogas electricity</div>
        <div style="font-size:28px;">${fmt(totals.biogasKWh)} kWh</div>
        <div class="muted">WtE electricity: ${fmt(totals.wteKWh)} kWh</div>
      </div>
    </div>
  `);
}

function renderDeposit() {
  setView(`
    <div class="grid">
      <div class="card">
        <h3>Deposit Waste</h3>
        <div class="row">
          <div style="flex:1">
            <label>Aadhar (simulate scan)</label>
            <input id="dep-aad" placeholder="XXXX-XXXX-XXXX" maxlength="14" />
          </div>
          <div style="flex:1">
            <label>Name</label>
            <input id="dep-name" placeholder="Citizen name" />
          </div>
        </div>
        <div class="row">
          <div style="flex:1">
            <label>Shop</label>
            <select id="dep-shop">${AppState.shops.map(s=>`<option value="${s.id}" ${s.id===AppState.settings.activeShopId?'selected':''}>${s.name}</option>`).join('')}</select>
          </div>
          <div style="flex:1">
            <label>Waste Type</label>
            <select id="dep-type">
              <option>Wet</option>
              <option>Dry</option>
              <option>Cloth</option>
            </select>
          </div>
          <div style="flex:1">
            <label>Sub Type</label>
            <input id="dep-sub" placeholder="e.g., kitchen, plastic, cotton" />
          </div>
          <div style="flex:1">
            <label>Weight (kg)</label>
            <input id="dep-w" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn" onclick="simulateWeight('dep-w')">Sim weigh</button>
          <button class="btn primary" onclick="submitDeposit()">Submit & payout</button>
        </div>
        <div class="muted" style="margin-top:8px;">Payout rate: ₹ ${fmt(AppState.settings.payoutPerKg)} / kg</div>
      </div>
      <div class="card">
        <h3>Recent Deposits</h3>
        <div style="max-height:260px; overflow:auto;">
          ${renderDepositsTable(AppState.citizens.slice(-20).reverse())}
        </div>
      </div>
    </div>
  `);
}

function renderDepositsTable(rows) {
  if (!rows.length) return '<div class="muted">No deposits yet.</div>';
  return `
    <table>
      <thead><tr><th>Time</th><th>Aadhar</th><th>Name</th><th>Type</th><th>Sub</th><th>Kg</th><th>₹</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${new Date(r.time).toLocaleString()}</td><td>${r.aadhar}</td><td>${r.name}</td><td>${r.wasteType}</td><td>${r.subType||''}</td><td>${fmt(r.weightKg)}</td><td>${fmt(r.amount)}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

function simulateWeight(inputId) {
  const el = document.getElementById(inputId);
  const val = (Math.random()*5+0.2).toFixed(2);
  el.value = val;
}

function submitDeposit() {
  const aadhar = document.getElementById('dep-aad').value.trim();
  const name = document.getElementById('dep-name').value.trim() || 'Citizen';
  const shopId = document.getElementById('dep-shop').value;
  const wasteType = document.getElementById('dep-type').value;
  const subType = document.getElementById('dep-sub').value.trim();
  const weightKg = Number(document.getElementById('dep-w').value);
  if (!aadhar || !weightKg) { alert('Enter Aadhar and weight'); return; }
  const amount = weightKg * AppState.settings.payoutPerKg;
  const rec = { id: uid(), aadhar, name, wasteType, subType, weightKg, amount, time: Date.now() };
  AppState.citizens.push(rec);
  AppState.shopInventory.push({ id: uid(), shopId, type: wasteType, subType, weightKg, time: Date.now() });
  saveState();
  routeTo(Views.Deposit);
  alert(`Payout: ₹ ${fmt(amount)}`);
}

function renderShop() {
  const shop = AppState.shops.find(s=>s.id===AppState.settings.activeShopId) || AppState.shops[0];
  const onHand = AppState.shopInventory.filter(x=>x.shopId===shop.id).reduce((s, x) => s + Number(x.weightKg||0), 0);
  const cap = shop.capacityKg ?? AppState.settings.shopCapacityKg;
  const nearFull = onHand >= cap;
  setView(`
    <div class="grid">
      <div class="card">
        <h3>${shop.name} Inventory</h3>
        <div class="muted">On hand</div>
        <div style="font-size:28px;">${fmt(onHand)} / ${fmt(cap)} kg ${nearFull?'<span class="pill" style="border-color:var(--warn);">Full</span>':''}</div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn warn" onclick="requestPickup()">Request Plant Pickup</button>
          <button class="btn" onclick="clearInventory()">Clear Inventory</button>
        </div>
      </div>
      <div class="card">
        <h3>Items</h3>
        <div style="max-height:300px; overflow:auto;">
          ${renderInventoryTable(AppState.shopInventory.filter(x=>x.shopId===shop.id).slice(-100).reverse())}
        </div>
      </div>
    </div>
  `);
  if (nearFull) pushAlert('Capacity', `${shop.name} capacity reached`, 'warning');
}

function renderInventoryTable(rows) {
  if (!rows.length) return '<div class="muted">No inventory.</div>';
  return `
    <table>
      <thead><tr><th>Time</th><th>Type</th><th>Sub</th><th>Kg</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${new Date(r.time).toLocaleString()}</td><td>${r.type}</td><td>${r.subType||''}</td><td>${fmt(r.weightKg)}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

function requestPickup() {
  const shop = AppState.shops.find(s=>s.id===AppState.settings.activeShopId) || AppState.shops[0];
  const total = AppState.shopInventory.filter(x=>x.shopId===shop.id).reduce((s, x) => s + Number(x.weightKg||0), 0);
  if (!total) { alert('No inventory to pickup'); return; }
  const vehicleId = 'TRK-' + Math.floor(Math.random()*900+100);
  const gross = total + (Math.random()*2000+5000);
  const tare = gross - total;
  const gps = simulateRoute();
  const toPlant = AppState.plants.find(p=>p.id===AppState.settings.activePlantId) || AppState.plants[0];
  AppState.transports.push({ id: uid(), vehicleId, from: shop.name, to: toPlant.name, gps, gross, tare, net: total, time: Date.now() });
  saveState();
  alert('Pickup requested. Vehicle dispatched: ' + vehicleId);
  routeTo(Views.Transport);
}

function clearInventory() {
  const shopId = AppState.settings.activeShopId;
  AppState.shopInventory = AppState.shopInventory.filter(x=>x.shopId!==shopId);
  saveState();
  routeTo(Views.Shop);
}

function renderTransport() {
  setView(`
    <div class="grid">
      <div class="card">
        <h3>Trips</h3>
        ${renderTransportTable(AppState.transports.slice(-50).reverse())}
      </div>
      <div class="card">
        <h3>Weighbridge Monitor</h3>
        <div class="muted">Alerts if |gross - tare - net| > 5%</div>
        <div style="max-height:300px; overflow:auto;">${renderWeighAlerts()}</div>
      </div>
    </div>
  `);
}

function renderTransportTable(rows) {
  if (!rows.length) return '<div class="muted">No trips yet.</div>';
  return `
    <table>
      <thead><tr><th>Time</th><th>Vehicle</th><th>From</th><th>To</th><th>Gross</th><th>Tare</th><th>Net</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${new Date(r.time).toLocaleString()}</td><td>${r.vehicleId}</td><td>${r.from}</td><td>${r.to}</td><td>${fmt(r.gross,0)}</td><td>${fmt(r.tare,0)}</td><td>${fmt(r.net)}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

function renderWeighAlerts() {
  if (!AppState.transports.length) return '<div class="muted">No data.</div>';
  const rows = AppState.transports.map(t => {
    const calc = t.gross - t.tare;
    const diff = Math.abs(calc - t.net);
    const pct = (diff / (t.net||1)) * 100;
    const ok = pct <= 5;
    if (!ok) pushAlert('Weighbridge', `Variance ${fmt(pct)}% on ${t.vehicleId}`, 'danger');
    return `<div class="row" style="justify-content:space-between; margin:6px 0;">
      <div>${new Date(t.time).toLocaleString()} — ${t.vehicleId}</div>
      <div class="pill" style="border-color:${ok?'var(--accent)':'var(--danger)'}">${ok?'OK':'Alert: '+fmt(pct)+'%'}</div>
    </div>`;
  }).reverse();
  return rows.join('');
}

function simulateRoute() {
  const pts = [];
  let lat = 28.61, lng = 77.21;
  for (let i=0;i<10;i++) { lat += (Math.random()-0.5)*0.01; lng += (Math.random()-0.5)*0.01; pts.push({lat,lng, t: Date.now()+i*60000}); }
  return pts;
}

function renderSorting() {
  setView(`
    <div class="grid">
      <div class="card">
        <h3>Register Sorting</h3>
        <div class="row">
          <div style="flex:1">
            <label>Method</label>
            <select id="sort-method"><option>Robot (AQC)</option><option>Manual</option></select>
          </div>
          <div style="flex:1">
            <label>Type</label>
            <select id="sort-type"><option>Wet</option><option>Dry</option><option>Cloth</option></select>
          </div>
          <div style="flex:1">
            <label>Sub Type</label>
            <input id="sort-sub" placeholder="e.g., plastic, cotton" />
          </div>
          <div style="flex:1">
            <label>Weight (kg)</label>
            <input id="sort-w" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn" onclick="simulateWeight('sort-w')">Sim weigh</button>
          <button class="btn primary" onclick="submitSorting()">Add</button>
        </div>
      </div>
      <div class="card">
        <h3>Recent Sorting</h3>
        <div style="max-height:300px; overflow:auto;">
          ${renderSortingTable(AppState.sorting.slice(-50).reverse())}
        </div>
      </div>
    </div>
  `);
}

function renderSortingTable(rows) {
  if (!rows.length) return '<div class="muted">No records.</div>';
  return `
    <table>
      <thead><tr><th>Time</th><th>Method</th><th>Type</th><th>Sub</th><th>Kg</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${new Date(r.time).toLocaleString()}</td><td>${r.method}</td><td>${r.type}</td><td>${r.subType||''}</td><td>${fmt(r.weightKg)}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

function submitSorting() {
  const method = document.getElementById('sort-method').value;
  const type = document.getElementById('sort-type').value;
  const subType = document.getElementById('sort-sub').value.trim();
  const weightKg = Number(document.getElementById('sort-w').value);
  if (!weightKg) { alert('Enter weight'); return; }
  AppState.sorting.push({ id: uid(), method, type, subType, weightKg, time: Date.now() });
  saveState();
  routeTo(Views.Sorting);
}

function renderTreatment() {
  setView(`
    <div class="grid">
      <div class="card">
        <h3>Biogas Plant</h3>
        <div class="row">
          <div style="flex:1"><label>Intake (kg)</label><input id="bio-in" type="number" min="0" step="0.1"></div>
          <div style="flex:1"><label>Electricity (kWh)</label><input id="bio-kwh" type="number" min="0" step="0.1"></div>
          <div style="flex:1"><label>Fuel (m³)</label><input id="bio-fuel" type="number" min="0" step="0.01"></div>
          <div style="flex:1"><label>Digestate (kg)</label><input id="bio-dig" type="number" min="0" step="0.1"></div>
        </div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn" onclick="simulateBiogasSensors()">Sim sensors</button>
          <button class="btn primary" onclick="submitBiogas()">Record</button>
        </div>
      </div>
      <div class="card">
        <h3>Recyclables to MRF</h3>
        <div class="row">
          <div style="flex:1"><label>Material</label><input id="rec-mat" placeholder="Plastic, Metal, Paper" /></div>
          <div style="flex:1"><label>Weight (kg)</label><input id="rec-kg" type="number" min="0" step="0.1" /></div>
          <div style="flex:1"><label>MRF ID</label><input id="rec-mrf" placeholder="MRF-001" /></div>
        </div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn" onclick="simulateRecyclableSample()">Sim sample</button>
          <button class="btn primary" onclick="submitRecyclable()">Send</button>
        </div>
      </div>
      <div class="card">
        <h3>Waste to Energy</h3>
        <div class="row">
          <div style="flex:1"><label>Intake (kg)</label><input id="wte-in" type="number" min="0" step="0.1"></div>
          <div style="flex:1"><label>Electricity (kWh)</label><input id="wte-kwh" type="number" min="0" step="0.1"></div>
          <div style="flex:1"><label>Steam (t)</label><input id="wte-steam" type="number" min="0" step="0.01"></div>
          <div style="flex:1"><label>Ash (kg)</label><input id="wte-ash" type="number" min="0" step="0.1"></div>
          <div style="flex:1"><label>Fly Ash (kg)</label><input id="wte-fly" type="number" min="0" step="0.1"></div>
        </div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn" onclick="simulateWteSensors()">Sim sensors</button>
          <button class="btn primary" onclick="submitWTE()">Record</button>
        </div>
      </div>
    </div>
  `);
}

function simulateBiogasSensors() {
  document.getElementById('bio-in').value = (Math.random()*500+100).toFixed(1);
  document.getElementById('bio-kwh').value = (Math.random()*200+50).toFixed(1);
  document.getElementById('bio-fuel').value = (Math.random()*80+10).toFixed(2);
  document.getElementById('bio-dig').value = (Math.random()*300+50).toFixed(1);
}
function submitBiogas() {
  const intakeKg = Number(document.getElementById('bio-in').value);
  const electricityKWh = Number(document.getElementById('bio-kwh').value);
  const fuelM3 = Number(document.getElementById('bio-fuel').value);
  const digestateKg = Number(document.getElementById('bio-dig').value);
  if (!intakeKg) { alert('Enter intake'); return; }
  AppState.biogas.push({ id: uid(), intakeKg, electricityKWh, fuelM3, digestateKg, sensors: { t: Date.now() } });
  saveState();
  routeTo(Views.Treatment);
}
function submitRecyclable() {
  const material = (document.getElementById('rec-mat').value||'').trim();
  const weightKg = Number(document.getElementById('rec-kg').value);
  const mrfId = (document.getElementById('rec-mrf').value||'MRF-001').trim();
  if (!material || !weightKg) { alert('Enter material and weight'); return; }
  AppState.recyclables.push({ id: uid(), material, weightKg, mrfId });
  saveState();
  routeTo(Views.Treatment);
}
function simulateRecyclableSample() {
  const materials = [
    {name:'Plastic (PET)', min:5, max:30},
    {name:'Plastic (HDPE)', min:5, max:30},
    {name:'Paper', min:10, max:50},
    {name:'Cardboard', min:15, max:60},
    {name:'Metal (Aluminium)', min:2, max:15},
    {name:'Metal (Steel)', min:5, max:40},
    {name:'Glass', min:10, max:80}
  ];
  const m = materials[Math.floor(Math.random()*materials.length)];
  const kg = (Math.random()*(m.max-m.min)+m.min).toFixed(1);
  document.getElementById('rec-mat').value = m.name;
  document.getElementById('rec-kg').value = kg;
  document.getElementById('rec-mrf').value = 'MRF-' + Math.floor(Math.random()*900+100);
}
function submitWTE() {
  const intakeKg = Number(document.getElementById('wte-in').value);
  const electricityKWh = Number(document.getElementById('wte-kwh').value);
  const steamT = Number(document.getElementById('wte-steam').value);
  const ashKg = Number(document.getElementById('wte-ash').value);
  const flyAshKg = Number(document.getElementById('wte-fly').value);
  if (!intakeKg) { alert('Enter intake'); return; }
  AppState.wte.push({ id: uid(), intakeKg, electricityKWh, steamT, ashKg, flyAshKg });
  saveState();
  routeTo(Views.Treatment);
}
function simulateWteSensors() {
  // Simulate weighbridge intake, electricity yield factor, steam production, and ash fractions
  const intake = (Math.random()*2000 + 500).toFixed(1); // kg
  const kwhPerTon = Math.random()*450 + 350; // 350-800 kWh/ton
  const electricity = ((Number(intake)/1000) * kwhPerTon).toFixed(1);
  const steam = ((Number(intake)/1000) * (Math.random()*2 + 3)).toFixed(2); // 3-5 t/ton
  const ashFraction = Math.random()*0.2 + 0.1; // 10%-30%
  const ash = (Number(intake) * ashFraction * 0.7).toFixed(1);
  const fly = (Number(intake) * ashFraction * 0.3).toFixed(1);
  document.getElementById('wte-in').value = intake;
  document.getElementById('wte-kwh').value = electricity;
  document.getElementById('wte-steam').value = steam;
  document.getElementById('wte-ash').value = ash;
  document.getElementById('wte-fly').value = fly;
}

function renderDashboard() {
  const t = computeTotals();
  setView(`
    <div class="grid">
      <div class="card"><h3>Totals</h3>
        <div>Deposits: <b>${fmt(t.depositsKg)}</b> kg, Payouts: ₹ <b>${fmt(t.payouts)}</b></div>
        <div>Shop on hand: <b>${fmt(t.shopKg)}</b> kg</div>
        <div>Biogas: <b>${fmt(t.biogasKWh)}</b> kWh, Fuel: <b>${fmt(t.biogasFuel)}</b> m³</div>
        <div>WtE: <b>${fmt(t.wteKWh)}</b> kWh, Ash: <b>${fmt(t.wteAsh)}</b> kg</div>
        <div>Recyclables to MRF: <b>${fmt(t.recyclablesKg)}</b> kg</div>
      </div>
      <div class="card"><h3>Anomalies</h3>
        ${renderAnomalies()}
      </div>
      <div class="card"><h3>7-day Trend</h3>
        ${renderCharts()}
      </div>
    </div>
  `);
}

function renderAnomalies() {
  const alerts = [];
  (AppState.transports||[]).forEach(t => {
    const calc = t.gross - t.tare;
    const diff = Math.abs(calc - t.net);
    const pct = (diff / (t.net||1)) * 100;
    if (pct > 5) alerts.push(`Weighbridge variance ${fmt(pct)}% on ${t.vehicleId}`);
  });
  if (!alerts.length) return '<div class="muted">No anomalies detected.</div>';
  return `<ul>${alerts.map(a=>`<li>${a}</li>`).join('')}</ul>`;
}

function renderCharts() {
  const days = Array.from({length:7}, (_,i)=>{
    const day = new Date(); day.setDate(day.getDate()-(6-i)); day.setHours(0,0,0,0);
    const start = day.getTime(); const end = start + 86400000;
    const dep = AppState.citizens.filter(x=>x.time>=start && x.time<end).reduce((s,x)=>s+Number(x.weightKg||0),0);
    const energy = AppState.biogas.filter(x=>x.id).filter(x=>x.sensors && x.sensors.t>=start && x.sensors.t<end).reduce((s,x)=>s+Number(x.electricityKWh||0),0) + AppState.wte.filter(x=>x.id).reduce((s,x)=>s+Number((x._t && x._t>=start && x._t<end)?x.electricityKWh:0),0);
    return {label: day.toLocaleDateString(undefined,{weekday:'short'}), dep, energy};
  });
  const maxDep = Math.max(1, ...days.map(d=>d.dep));
  const maxEn = Math.max(1, ...days.map(d=>d.energy));
  const w = 500, h = 120, pad = 20;
  const barW = (w - pad*2) / (days.length*2);
  const depBars = days.map((d,i)=>{
    const bh = (d.dep/maxDep)*(h-pad*1.5);
    return `<rect x="${pad + i*2*barW}" y="${h-bh}" width="${barW-4}" height="${bh}" fill="#7bd88f" />`;
  }).join('');
  const enBars = days.map((d,i)=>{
    const bh = (d.energy/maxEn)*(h-pad*1.5);
    return `<rect x="${pad + i*2*barW + barW}" y="${h-bh}" width="${barW-4}" height="${bh}" fill="#ffcc66" />`;
  }).join('');
  const labels = days.map((d,i)=>`<text x="${pad + i*2*barW + barW/2}" y="${h-2}" font-size="10" fill="#c9d2ffbb" text-anchor="middle">${d.label}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${depBars}${enBars}${labels}</svg>`;
}

function renderEntities() {
  setView(`
    <div class="grid">
      <div class="card"><h3>Shops</h3>
        <div class="row" style="margin-bottom:8px;">
          <input id="new-shop-name" placeholder="Name" style="flex:2" />
          <input id="new-shop-cap" type="number" min="0" step="1" placeholder="Capacity kg" style="flex:1" />
          <button class="btn" onclick="addShop()">Add</button>
        </div>
        ${renderShopsTable()}
      </div>
      <div class="card"><h3>Plants</h3>
        <div class="row" style="margin-bottom:8px;">
          <input id="new-plant-name" placeholder="Name" style="flex:1" />
          <button class="btn" onclick="addPlant()">Add</button>
        </div>
        ${renderPlantsTable()}
      </div>
    </div>
  `);
}
function renderShopsTable() {
  if (!AppState.shops.length) return '<div class="muted">No shops.</div>';
  return `<table><thead><tr><th>ID</th><th>Name</th><th>Capacity</th></tr></thead><tbody>${AppState.shops.map(s=>`<tr><td>${s.id}</td><td>${s.name}</td><td>${s.capacityKg} kg</td></tr>`).join('')}</tbody></table>`;
}
function renderPlantsTable() {
  if (!AppState.plants.length) return '<div class="muted">No plants.</div>';
  return `<table><thead><tr><th>ID</th><th>Name</th></tr></thead><tbody>${AppState.plants.map(p=>`<tr><td>${p.id}</td><td>${p.name}</td></tr>`).join('')}</tbody></table>`;
}
function addShop() {
  const name = (document.getElementById('new-shop-name').value||'').trim();
  const cap = Number(document.getElementById('new-shop-cap').value)||1000;
  if (!name) return alert('Enter name');
  const id = 'SHOP-' + Math.floor(Math.random()*900+100);
  AppState.shops.push({id, name, capacityKg:cap});
  saveState(); routeTo(Views.Entities);
}
function addPlant() {
  const name = (document.getElementById('new-plant-name').value||'').trim();
  if (!name) return alert('Enter name');
  const id = 'PLANT-' + Math.floor(Math.random()*900+100);
  AppState.plants.push({id, name});
  saveState(); routeTo(Views.Entities);
}

function renderSHG() {
  setView(`
    <div class="grid">
      <div class="card"><h3>Register SHG</h3>
        <div class="row">
          <input id="shg-name" placeholder="SHG Name" style="flex:2" />
          <input id="shg-members" type="number" min="1" step="1" placeholder="Members" style="flex:1" />
          <select id="shg-skill" style="flex:1"><option>Handloom</option><option>Bag making</option><option>Decor</option></select>
          <button class="btn" onclick="addSHG()">Add</button>
        </div>
        ${renderSHGTable()}
      </div>
      <div class="card"><h3>Cloth Processing</h3>
        <div class="row">
          <select id="shg-select" style="flex:2">${AppState.shgs.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
          <input id="shg-cloth" type="number" min="0" step="0.1" placeholder="Cloth used (kg)" style="flex:1" />
          <select id="shg-product" style="flex:1"><option>Cloth bag</option><option>Rug (Dari)</option><option>Decor item</option></select>
          <input id="shg-qty" type="number" min="1" step="1" placeholder="Qty" style="flex:1" />
          <button class="btn primary" onclick="recordSHGOutput()">Record</button>
        </div>
        <div class="muted">Use cloth waste from inventory; promotes skill development for SHGs and prisoners.</div>
        ${renderSHGOutputTable()}
      </div>
    </div>
  `);
}
function renderSHGTable() {
  if (!AppState.shgs.length) return '<div class="muted">No SHGs yet.</div>';
  return `<table><thead><tr><th>Name</th><th>Members</th><th>Skill</th></tr></thead><tbody>${AppState.shgs.map(s=>`<tr><td>${s.name}</td><td>${s.members}</td><td>${s.skill}</td></tr>`).join('')}</tbody></table>`;
}
function renderSHGOutputTable() {
  if (!AppState.shgOutputs.length) return '<div class="muted">No outputs recorded.</div>';
  return `<table><thead><tr><th>Time</th><th>SHG</th><th>Product</th><th>Qty</th><th>Cloth Used (kg)</th></tr></thead><tbody>${AppState.shgOutputs.slice(-50).reverse().map(o=>{
    const s = AppState.shgs.find(x=>x.id===o.shgId); return `<tr><td>${new Date(o.time).toLocaleString()}</td><td>${s? s.name:o.shgId}</td><td>${o.product}</td><td>${o.quantity}</td><td>${fmt(o.clothKg)}</td></tr>`;
  }).join('')}</tbody></table>`;
}
function addSHG() {
  const name = (document.getElementById('shg-name').value||'').trim();
  const members = Number(document.getElementById('shg-members').value)||1;
  const skill = document.getElementById('shg-skill').value;
  if (!name) return alert('Enter SHG name');
  AppState.shgs.push({id: uid(), name, members, skill});
  saveState(); routeTo(Views.SHG);
}
function recordSHGOutput() {
  const shgId = document.getElementById('shg-select').value;
  const clothKg = Number(document.getElementById('shg-cloth').value);
  const product = document.getElementById('shg-product').value;
  const quantity = Number(document.getElementById('shg-qty').value)||1;
  if (!shgId || !clothKg) return alert('Enter SHG and cloth');
  let remaining = clothKg;
  const shopId = AppState.settings.activeShopId;
  for (const item of AppState.shopInventory.filter(x=>x.shopId===shopId && x.type==='Cloth')) {
    if (remaining <= 0) break;
    const take = Math.min(item.weightKg, remaining);
    item.weightKg -= take; remaining -= take;
  }
  AppState.shopInventory = AppState.shopInventory.filter(x=>x.weightKg>0);
  AppState.shgOutputs.push({id: uid(), shgId, product, quantity, clothKg, time: Date.now()});
  saveState(); routeTo(Views.SHG);
}

function renderEducation() {
  setView(`
    <div class="grid">
      <div class="card"><h3>NSS Outreach Session</h3>
        <div class="row">
          <input id="edu-date" type="date" style="flex:1" />
          <input id="edu-area" placeholder="Area / Society" style="flex:2" />
          <input id="edu-att" type="number" min="1" step="1" placeholder="Attendees" style="flex:1" />
          <input id="edu-topic" placeholder="Topic (segregation, composting, SHG)" style="flex:2" />
          <button class="btn primary" onclick="addEducation()">Add</button>
        </div>
        ${renderEducationTable()}
      </div>
    </div>
  `);
}
function renderEducationTable() {
  if (!AppState.education.length) return '<div class="muted">No sessions yet.</div>';
  return `<table><thead><tr><th>Date</th><th>Area</th><th>Attendees</th><th>Topic</th></tr></thead><tbody>${AppState.education.slice(-50).reverse().map(e=>`<tr><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.area}</td><td>${e.attendees}</td><td>${e.topic}</td></tr>`).join('')}</tbody></table>`;
}
function addEducation() {
  const date = new Date(document.getElementById('edu-date').value||Date.now()).getTime();
  const area = (document.getElementById('edu-area').value||'').trim();
  const attendees = Number(document.getElementById('edu-att').value)||0;
  const topic = (document.getElementById('edu-topic').value||'').trim();
  if (!area || !attendees) return alert('Enter area and attendees');
  AppState.education.push({id: uid(), date, area, attendees, topic});
  saveState(); routeTo(Views.Education);
}

function pushAlert(type, message, severity='info') {
  AppState.alerts.push({id: uid(), type, message, severity, time: Date.now()});
  saveState();
}
function renderAlerts() {
  if (!AppState.alerts.length) { setView('<div class="card">No alerts.</div>'); return; }
  setView(`
    <div class="card">
      <h3>Notifications & Audit Log</h3>
      <table><thead><tr><th>Time</th><th>Type</th><th>Severity</th><th>Message</th></tr></thead>
      <tbody>${AppState.alerts.slice(-200).reverse().map(a=>`<tr><td>${new Date(a.time).toLocaleString()}</td><td>${a.type}</td><td><span class="pill" style="border-color:${a.severity==='danger'?'var(--danger)':a.severity==='warning'?'var(--warn)':'var(--muted)'}">${a.severity}</span></td><td>${a.message}</td></tr>`).join('')}</tbody></table>
    </div>
  `);
}

function renderDocs() {
  const docHtml = `
    <div class="card">
      <h3>Prototype Documentation</h3>
      <p class="muted">This document explains each module/page and its purpose.</p>
      <h4>1) Overview</h4>
      <p>High-level totals for deposits, shop inventory, and treatment outputs.</p>
      <h4>2) Citizen Deposit</h4>
      <ul>
        <li>Aadhar (simulated), name</li>
        <li>Waste type: Wet, Dry, Cloth; optional sub-type</li>
        <li>Weight via manual input or weigh simulation</li>
        <li>Payout auto-calculated; deposited weight moves to selected Sehkari shop</li>
      </ul>
      <h4>3) Sehkari Shop</h4>
      <ul>
        <li>Per-shop inventory with capacity indicator</li>
        <li>Request pickup to plant; generates transport trip</li>
        <li>Clear inventory (demo function)</li>
      </ul>
      <h4>4) Transport</h4>
      <ul>
        <li>Trip list with GPS simulation</li>
        <li>Weighbridge check: alerts if variance exceeds 5%</li>
      </ul>
      <h4>5) Sorting</h4>
      <ul>
        <li>Register sorting by Robot (AQC-like) or Manual</li>
        <li>Record type/sub-type and weight</li>
      </ul>
      <h4>6) Treatment</h4>
      <ul>
        <li>Biogas: intake, electricity, fuel, digestate (with sensor simulation)</li>
        <li>Recyclables: dispatch to MRF (material, kg, MRF id)</li>
        <li>Waste-to-Energy: intake, kWh, steam, ash, fly ash</li>
      </ul>
      <h4>7) SHG & Cloth</h4>
      <ul>
        <li>Register SHGs (name, members, skill)</li>
        <li>Convert cloth waste to products (bags, rugs, decor) consuming cloth inventory</li>
      </ul>
      <h4>8) NSS Outreach</h4>
      <ul>
        <li>Log education sessions: date, area, attendees, topic</li>
      </ul>
      <h4>9) Entities</h4>
      <ul>
        <li>Manage shops (capacity) and plants</li>
      </ul>
      <h4>10) Alerts</h4>
      <ul>
        <li>Notifications/audit log (capacity warnings, weighbridge anomalies)</li>
      </ul>
      <h4>11) Dashboards</h4>
      <ul>
        <li>Totals, anomalies, 7-day trend chart</li>
      </ul>
      <h4>12) Backup</h4>
      <ul>
        <li>Export/import JSON, change payout rate and capacity</li>
      </ul>
      <div class="actions" style="margin-top:12px;">
        <button class="btn primary" onclick="window.print()">Print / Save as PDF</button>
      </div>
    </div>
  `;
  setView(docHtml);
}

function renderStorage() {
  setView(`
    <div class="grid">
      <div class="card">
        <h3>Backup / Restore</h3>
        <div class="actions">
          <button class="btn" onclick="downloadBackup()">Export JSON</button>
          <label class="btn" style="cursor:pointer;">
            Import JSON <input id="imp" type="file" accept="application/json" style="display:none" onchange="importBackup(this)">
          </label>
          <button class="btn danger" onclick="wipeAll()">Wipe All</button>
        </div>
        <div class="muted" style="margin-top:8px;">All data stays in this browser only.</div>
      </div>
      <div class="card">
        <h3>Settings</h3>
        <div class="row">
          <div style="flex:1"><label>Payout per kg (₹)</label><input id="set-pay" type="number" min="0" step="0.1" value="${AppState.settings.payoutPerKg}"></div>
          <div style="flex:1"><label>Shop capacity (kg)</label><input id="set-cap" type="number" min="0" step="1" value="${AppState.settings.shopCapacityKg}"></div>
        </div>
        <div class="actions" style="margin-top:12px;">
          <button class="btn primary" onclick="saveSettings()">Save Settings</button>
        </div>
      </div>
    </div>
  `);
}

function saveSettings() {
  const p = Number(document.getElementById('set-pay').value);
  const c = Number(document.getElementById('set-cap').value);
  if (p>=0) AppState.settings.payoutPerKg = p;
  if (c>=0) AppState.settings.shopCapacityKg = c;
  saveState();
  alert('Saved');
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(AppState, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wm-prototype-backup.json'; a.click();
  URL.revokeObjectURL(url);
}
function importBackup(input) {
  const file = input.files[0];
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try { const data = JSON.parse(fr.result); Object.assign(AppState, data); saveState(); routeTo(Views.Home); alert('Imported'); }
    catch (e) { alert('Invalid file'); }
  };
  fr.readAsText(file);
}
function wipeAll() { if (confirm('Wipe all data?')) { localStorage.removeItem(StorageKey); location.reload(); } }

function computeTotals() {
  const depositsKg = AppState.citizens.reduce((s,x)=>s+Number(x.weightKg||0),0);
  const payouts = AppState.citizens.reduce((s,x)=>s+Number(x.amount||0),0);
  const shopKg = AppState.shopInventory.reduce((s,x)=>s+Number(x.weightKg||0),0);
  const biogasKWh = AppState.biogas.reduce((s,x)=>s+Number(x.electricityKWh||0),0);
  const biogasFuel = AppState.biogas.reduce((s,x)=>s+Number(x.fuelM3||0),0);
  const wteKWh = AppState.wte.reduce((s,x)=>s+Number(x.electricityKWh||0),0);
  const wteAsh = AppState.wte.reduce((s,x)=>s+Number(x.ashKg||0),0) + AppState.wte.reduce((s,x)=>s+Number(x.flyAshKg||0),0);
  const recyclablesKg = AppState.recyclables.reduce((s,x)=>s+Number(x.weightKg||0),0);
  return { depositsKg, payouts, shopKg, biogasKWh, biogasFuel, wteKWh, wteAsh, recyclablesKg };
}

loadState();
routeTo(Views.Home);

