
  var firebaseConfig = {
  apiKey: "AIzaSyCLZf5H7i1qLV5-pDYuhYG9BigkNh3V9gg",
  authDomain: "portfolio-fccd6.firebaseapp.com",
  projectId: "portfolio-fccd6",
  storageBucket: "portfolio-fccd6.firebasestorage.app",
  messagingSenderId: "668360160690",
  appId: "1:668360160690:web:08661a97217e20bd1fa0ab"
};

(function loadFirebase() {
  var scripts = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
  ];
  var loaded = 0;
  scripts.forEach(function(src) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function() { loaded++; if (loaded === scripts.length) onFirebaseReady(); };
    s.onerror = function() {
      console.error('Failed to load Firebase script:', src);
      loaded++;
      if (loaded === scripts.length) loadDefaultData();
    };
    document.head.appendChild(s);
  });
})();

var _db   = null;
var _auth = null;
var _fbInitialised = false;

// ═══════════════════════════════════════════════════════════════════════
//  FIREBASE INIT
// ═══════════════════════════════════════════════════════════════════════
function onFirebaseReady() {
  try {
    firebase.initializeApp(firebaseConfig);
    _auth = firebase.auth();
    _db   = firebase.firestore();

    _auth.onAuthStateChanged(function(user) {
      if (user) { unlockAdmin(); } else { lockAdmin(); }
    });

    window._fbAuth = _auth;
    window._fbDb   = _db;

    // Timeout fallback — if Firestore takes >8s on slow mobile, load defaults
    var fbTimeout = setTimeout(function() {
      if (!_fbInitialised) {
        console.warn('Firebase timeout — falling back to defaults');
        loadDefaultData();
      }
    }, 8000);

    loadAllFromFirestore(function() {
      _fbInitialised = true;
      clearTimeout(fbTimeout);
    });

  } catch(e) {
    console.error('Firebase init error:', e);
    loadDefaultData();
  }
}

// Load pure defaults without Firestore (fallback)
function loadDefaultData() {
  if (_fbInitialised) return; // already loaded
  _fbInitialised = true;
  stats      = DEFAULT_STATS;
  skills     = DEFAULT_SKILLS;
  projects   = DEFAULT_PROJECTS;
  experience = DEFAULT_EXPERIENCE;
  education  = DEFAULT_EDUCATION;
  contact    = DEFAULT_CONTACT;
  profile    = Object.assign({}, DEFAULT_PROFILE);
  pinataJWT  = '';
  updatePinataLabel();
  renderStats(); renderSkills(); renderProjects();
  renderExperience(); renderEducation(); renderContact();
  applyProfileLinks();
  startTypewriter();
}

// ═══════════════════════════════════════════════════════════════════════
//  FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════════════
function fsGet(key, callback) {
  if (!_db) { callback(null); return; }
  _db.collection('siteData').doc(key).get()
    .then(function(doc) {
      callback(doc.exists && doc.data().value !== undefined ? doc.data().value : null);
    })
    .catch(function(err) {
      console.error('fsGet failed for key:', key, err);
      callback(null);
    });
}

function fsSet(key, value) {
  if (!_db) return;
  _db.collection('siteData').doc(key).set({ value: value })
    .catch(function(e) { console.error('Firestore write error:', e); });
}

function loadAllFromFirestore(onDone) {
  if (!_db) {
    console.warn('_db is null — loading defaults');
    loadDefaultData();
    if (onDone) onDone();
    return;
  }
  var keys = ['stats','skills','projects','experience','education','contact','profile','pinataJWT'];
  var loaded = 0, results = {};
  keys.forEach(function(key) {
    fsGet(key, function(val) {
      results[key] = val;
      loaded++;
      if (loaded === keys.length) {
        stats      = results.stats      || DEFAULT_STATS;
        skills     = results.skills     || DEFAULT_SKILLS;
        projects   = results.projects   || DEFAULT_PROJECTS;
        experience = results.experience || DEFAULT_EXPERIENCE;
        education  = results.education  || DEFAULT_EDUCATION;
        contact    = results.contact    || DEFAULT_CONTACT;
        profile    = results.profile    || Object.assign({}, DEFAULT_PROFILE);
        pinataJWT  = results.pinataJWT  || '';
        updatePinataLabel();
        renderStats(); renderSkills(); renderProjects();
        renderExperience(); renderEducation(); renderContact();
        applyProfileLinks();
        startTypewriter();
        if (onDone) onDone();
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

const DEFAULT_STATS = [
  { id:'stat1', value:5,  suffix:'+', label:'Projects' },
  { id:'stat2', value:10, suffix:'+', label:'Technologies' },
  { id:'stat3', value:6,  suffix:'mo', label:'Industry Exp.' }
];

const DEFAULT_SKILLS = [
  { id:'sk1', icon:'⚡', title:'Languages',  color:'var(--cyan)',   theme:'sk-cyan',   tags:['C++','Java','Python','PHP','JavaScript'] },
  { id:'sk2', icon:'◈', title:'Frameworks', color:'var(--purple)', theme:'sk-purple', tags:['Laravel','Node.js','Express.js','Flask'] },
  { id:'sk3', icon:'⛓', title:'Blockchain', color:'var(--blue)',   theme:'sk-blue',   tags:['Solidity','Ethereum','IPFS'] },
  { id:'sk4', icon:'◫', title:'Databases',  color:'var(--green)',  theme:'sk-green',  tags:['MySQL','PostgreSQL','MongoDB','Firebase'] },
  { id:'sk5', icon:'⬡', title:'Tools',      color:'#f97316',       theme:'sk-orange', tags:['Git','Workbench','phpMyAdmin','Pinata'] }
];

const DEFAULT_PROJECTS = [
  { id:'p1', num:'#01', emoji:'⛓', title:'Blockchain Health Record System',  desc:'Decentralised patient records on Ethereum with IPFS storage and smart-contract access control.', tech:['Solidity','Ethereum','IPFS','Node.js','Pinata'], cat:'blockchain', github:'#', videoHash:'', imageHash:'' },
  { id:'p2', num:'#02', emoji:'🌊', title:'Ocean View Resort Reservation',    desc:'Real-time hotel booking with room availability, management dashboard and automated confirmations.', tech:['Laravel','MySQL','PHP','JavaScript'], cat:'web', github:'#', videoHash:'', imageHash:'' },
  { id:'p3', num:'#03', emoji:'☕', title:'Gallery Café Hotel Reservation',   desc:'Boutique hotel & café platform combining table and room reservations in a unified analytics dashboard.', tech:['Node.js','Express.js','MongoDB','Firebase'], cat:'web', github:'#', videoHash:'', imageHash:'' },
  { id:'p4', num:'#04', emoji:'💰', title:'Personal Finance Management',      desc:'Smart budgeting app with expense tracking, visual analytics and automated financial reports.', tech:['Python','Flask','PostgreSQL','JavaScript'], cat:'mobile', github:'#', videoHash:'', imageHash:'' },
  { id:'p5', num:'#05', emoji:'🔐', title:'Closed-End Booking Website',       desc:'Members-only platform with secure auth, dynamic slot management and SMS/email notifications.', tech:['Laravel','MySQL','PHP','Git'], cat:'web', github:'#', videoHash:'', imageHash:'' }
];

const DEFAULT_EXPERIENCE = [
  { id:'e1', date:'JUNE 2023 — DECEMBER 2023', title:'Software Engineering Intern', org:'American Water', desc:'Developed and maintained enterprise-level web applications alongside senior engineers. Contributed to full-stack features, database optimisation, and participated in agile delivery workflows.' }
];

const DEFAULT_EDUCATION = [
  { id:'ed1', deg:'Bachelor of Science with Honors in Software Engineering', school:'Cardiff Metropolitan University', year:'2025', location:'Cardiff, Wales', badge:'Undergraduate Degree', badgeEmoji:'🎓', logoUrl:'https://www.cardiffmet.ac.uk/Style%20Library/CMU/images/cardiff-met-logo.png', accentColor:'0,82,136', badgeColor:'cyan' },
  { id:'ed2', deg:'Higher Diploma in Computing and Software Engineering', school:'Cardiff Metropolitan University', year:'2024', location:'Cardiff, Wales', badge:'Certification', badgeEmoji:'🎓', logoUrl:'', accentColor:'139,92,246', badgeColor:'purple' },
  { id:'ed3', deg:'Diploma in Information and Communication Technology', school:'ICBT Kandy campus', year:'2023', location:'Kandy', badge:'Award', badgeEmoji:'🏆', logoUrl:'', accentColor:'16,185,129', badgeColor:'green' }
];

const DEFAULT_CONTACT = [
  { id:'c1', icon:'✉', label:'Email',    value:'krish.softtech228@gmail.com', href:'mailto:krish.softtech228@gmail.com' },
  { id:'c2', icon:'⌥', label:'GitHub',   value:'github.com/saturo',           href:'https://github.com' },
  { id:'c3', icon:'💼', label:'LinkedIn', value:'',                            href:'https://linkedin.com' }
];

const DEFAULT_PROFILE = {
  githubUrl:'https://github.com', linkedinUrl:'https://linkedin.com',
  cvIpfsHash:'', cvDirectUrl:'', cvFileName:'CV.pdf'
};

const CAT_COLORS = {
  blockchain: { text:'#3b82f6', bg:'rgba(59,130,246,.1)',  border:'rgba(59,130,246,.25)' },
  web:        { text:'#10b981', bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.25)' },
  mobile:     { text:'#00d4ff', bg:'rgba(0,212,255,.1)',   border:'rgba(0,212,255,.25)'  },
  ai:         { text:'#f97316', bg:'rgba(249,115,22,.1)',  border:'rgba(249,115,22,.25)' },
  other:      { text:'#f43f5e', bg:'rgba(244,63,94,.1)',   border:'rgba(244,63,94,.25)'  }
};

let stats=[], skills=[], projects=[], experience=[], education=[], contact=[];
let profile={};
let pinataJWT='', activeFilter='all', editingId=null, techTags=[];
let currentImgHash='', currentVideoHash='';
let adminUnlocked=false, activeSect='projects';

// ═══════════════════════════════════════════════════════════════════════
//  PROFILE LINKS
// ═══════════════════════════════════════════════════════════════════════
function applyProfileLinks() {
  var cvUrl = profile.cvIpfsHash ? (PINATA_GATEWAY + profile.cvIpfsHash) : (profile.cvDirectUrl || '#');
  document.querySelectorAll('[data-cv-btn],.btn-cv').forEach(function(el) {
    el.href = cvUrl;
    if (cvUrl !== '#') { el.setAttribute('download', profile.cvFileName||'CV.pdf'); el.removeAttribute('target'); } else { el.removeAttribute('download'); }
  });
  document.querySelectorAll('[data-github-btn],.btn-github').forEach(function(el) { if (profile.githubUrl) el.href = profile.githubUrl; });
  document.querySelectorAll('[data-linkedin-btn],.btn-linkedin').forEach(function(el) { if (profile.linkedinUrl) el.href = profile.linkedinUrl; });
  document.querySelectorAll('.hero-actions .btn,#contact .btn,footer a').forEach(function(el) {
    var txt = el.textContent.trim().toLowerCase();
    if (txt.includes('download cv')||txt.includes('cv')) { el.href=cvUrl; if (cvUrl!=='#') el.setAttribute('download', profile.cvFileName||'CV.pdf'); }
    if (txt.includes('github') && profile.githubUrl) el.href = profile.githubUrl;
    if (txt.includes('linkedin') && profile.linkedinUrl) el.href = profile.linkedinUrl;
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════
function unlockAdmin() {
  adminUnlocked = true;
  var fab=document.getElementById('admin-fab'), pill=document.getElementById('pinata-pill');
  if (fab) fab.classList.add('unlocked');
  if (pill) pill.classList.add('unlocked');
  updatePinataLabel();
}
function lockAdmin() {
  adminUnlocked = false;
  var fab=document.getElementById('admin-fab'), pill=document.getElementById('pinata-pill');
  if (fab) fab.classList.remove('unlocked');
  if (pill) pill.classList.remove('unlocked');
}

function triggerAdminLogin() {
  if (adminUnlocked) { openAdmin(); return; }
  modal(
    '<div class="overlay" id="auth" onclick="oci(event,\'auth\')">' +
    '<div class="mbox" style="max-width:380px;text-align:center">' +
    '<button class="mclose" onclick="cm(\'auth\')">&#10005;</button>' +
    '<div style="font-size:2rem;margin-bottom:.6rem">🔐</div>' +
    '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:var(--cyan);letter-spacing:3px;margin-bottom:.3rem">ADMIN ACCESS</div>' +
    '<div style="font-size:.85rem;font-weight:600;margin-bottom:1.6rem;color:var(--text)">Sign in to continue</div>' +
    '<div class="frow" style="text-align:left"><label class="flabel">Email</label><input class="finput" id="auth-email" type="email" placeholder="admin@example.com" autocomplete="email"></div>' +
    '<div class="frow" style="text-align:left"><label class="flabel">Password</label><div style="position:relative"><input class="finput" id="auth-pw" type="password" placeholder="••••••••" onkeydown="if(event.key===\'Enter\')signInWithEmail()" style="padding-right:2.8rem"><button onclick="togglePwVis()" style="position:absolute;right:.7rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);font-size:.9rem;padding:0">👁</button></div></div>' +
    '<div id="auth-err" style="font-size:.72rem;color:#f87171;margin-bottom:.8rem;min-height:1.1rem;text-align:left"></div>' +
    '<button onclick="signInWithEmail()" id="auth-submit" style="width:100%;padding:.75rem;background:var(--cyan);border:none;border-radius:8px;color:#000;font-weight:700;font-family:\'JetBrains Mono\',monospace;font-size:.8rem;letter-spacing:1.5px;cursor:pointer;margin-bottom:.9rem">SIGN IN</button>' +
    '<div style="display:flex;align-items:center;gap:.7rem;margin-bottom:.9rem"><div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:.65rem;color:var(--muted);font-family:\'JetBrains Mono\',monospace">OR</span><div style="flex:1;height:1px;background:var(--border)"></div></div>' +
    '<button onclick="signInWithGoogle()" style="width:100%;padding:.72rem;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.6rem">' +
    '<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.2 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.2 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.5-9.4 6.5-16.2z"/><path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.4 13.2A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7-5.4c-2 1.4-4.6 2.2-8.2 2.2-6.2 0-11.5-3.7-13.4-9.3l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>' +
    'Continue with Google</button>' +
    '<div style="font-size:.62rem;color:var(--muted);margin-top:1.2rem;font-family:\'JetBrains Mono\',monospace;opacity:.6">Ctrl+Shift+A to access</div>' +
    '</div></div>'
  );
  setTimeout(function(){var el=document.getElementById('auth-email');if(el)el.focus();},60);
}

function togglePwVis(){var i=document.getElementById('auth-pw');if(i)i.type=i.type==='password'?'text':'password';}
function setAuthLoading(l){var b=document.getElementById('auth-submit');if(!b)return;b.disabled=l;b.style.opacity=l?'.6':'1';b.textContent=l?'SIGNING IN…':'SIGN IN';}
function showAuthError(m){var e=document.getElementById('auth-err');if(e)e.textContent='✕ '+m;}

function signInWithEmail(){
  if(!window._fbAuth){showAuthError('Auth not ready…');return;}
  var email=(document.getElementById('auth-email').value||'').trim();
  var pw=(document.getElementById('auth-pw').value||'');
  if(!email||!pw){showAuthError('Enter your email and password.');return;}
  setAuthLoading(true);
  window._fbAuth.signInWithEmailAndPassword(email,pw)
    .then(function(){cm('auth');showToast('Welcome back ✓');openAdmin();})
    .catch(function(err){setAuthLoading(false);showAuthError(friendlyAuthError(err.code));var i=document.getElementById('auth-pw');if(i){i.value='';i.focus();}});
}

function signInWithGoogle(){
  if(!window._fbAuth){showAuthError('Auth not ready…');return;}
  window._fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(function(){cm('auth');showToast('Signed in with Google ✓');openAdmin();})
    .catch(function(err){showAuthError(friendlyAuthError(err.code));});
}

function signOut(){if(!window._fbAuth)return;window._fbAuth.signOut().then(function(){showToast('Signed out');cm('adm');});}

function friendlyAuthError(c){
  return({'auth/invalid-email':'Invalid email address.','auth/user-not-found':'No account found.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Incorrect email or password.','auth/too-many-requests':'Too many attempts. Try again later.','auth/network-request-failed':'Network error.','auth/popup-closed-by-user':'Popup closed.','auth/unauthorized-domain':'Domain not authorised in Firebase.'}[c]||'Sign-in failed ('+c+').');
}

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════
function updatePinataLabel(){var el=document.getElementById('pinata-pill');if(el)el.textContent=pinataJWT?'📌 PINATA ✓':'📌 PINATA —';}

function openAdmin(){
  if(!adminUnlocked){triggerAdminLogin();return;}
  var tabs=[{key:'projects',icon:'🗂',label:'Projects'},{key:'skills',icon:'⚡',label:'Skills'},{key:'stats',icon:'📊',label:'Stats'},{key:'experience',icon:'💼',label:'Experience'},{key:'education',icon:'🎓',label:'Education'},{key:'contact',icon:'✉',label:'Contact'},{key:'links',icon:'🔗',label:'CV & Links'}];
  var tabHTML=tabs.map(function(t){var a=activeSect===t.key;return '<button onclick="switchAdminTab(\''+t.key+'\')" id="atab-'+t.key+'" style="padding:.42rem .9rem;border:1px solid '+(a?'rgba(0,212,255,.5)':'var(--border)')+';border-radius:100px;background:'+(a?'rgba(0,212,255,.1)':'transparent')+';color:'+(a?'var(--cyan)':'var(--muted)')+';font-size:.72rem;cursor:pointer;white-space:nowrap;transition:all .2s">'+t.icon+' '+t.label+'</button>';}).join('');
  var signOutBtn='<button onclick="signOut()" style="margin-left:auto;padding:.4rem .85rem;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:100px;color:#f87171;font-size:.7rem;cursor:pointer;white-space:nowrap;font-family:\'JetBrains Mono\',monospace">⏻ Sign out</button>';
  modal('<div class="overlay" id="adm" onclick="oci(event,\'adm\')"><div class="mbox" style="max-width:600px"><button class="mclose" onclick="cm(\'adm\')">&#10005;</button><div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.4rem;align-items:center">'+tabHTML+signOutBtn+'</div><div id="admin-tab-content">'+getTabContent(activeSect)+'</div></div></div>');
}

function switchAdminTab(key){
  activeSect=key;
  document.querySelectorAll('[id^="atab-"]').forEach(function(b){var k=b.id.replace('atab-','');b.style.border=k===key?'1px solid rgba(0,212,255,.5)':'1px solid var(--border)';b.style.background=k===key?'rgba(0,212,255,.1)':'transparent';b.style.color=k===key?'var(--cyan)':'var(--muted)';});
  document.getElementById('admin-tab-content').innerHTML=getTabContent(key);
}

function getTabContent(key){switch(key){case'projects':return buildProjectsTab();case'skills':return buildSkillsTab();case'stats':return buildStatsTab();case'experience':return buildExperienceTab();case'education':return buildEducationTab();case'contact':return buildContactTab();case'links':return buildLinksTab();default:return'';}}

// ═══════════════════════════════════════════════════════════════════════
//  LINKS TAB
// ═══════════════════════════════════════════════════════════════════════
function buildLinksTab(){
  var cvStatus=profile.cvIpfsHash?'<span style="color:#10b981;font-size:.72rem;font-family:\'JetBrains Mono\',monospace">✓ IPFS: '+profile.cvIpfsHash.slice(0,24)+'…</span>':(profile.cvDirectUrl?'<span style="color:#f97316;font-size:.72rem">✓ Direct URL set</span>':'<span style="color:var(--muted);font-size:.72rem">No CV uploaded</span>');
  return '<div style="display:flex;flex-direction:column;gap:1.2rem"><div style="background:rgba(0,212,255,.03);border:1px solid rgba(0,212,255,.12);border-radius:10px;padding:1.1rem"><div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.9rem"><span style="font-size:1.15rem">📄</span><span style="font-size:.82rem;font-weight:600;color:var(--cyan)">CV / Resume</span><span style="margin-left:auto">'+cvStatus+'</span></div><div class="frow" style="margin-bottom:.7rem"><label class="flabel">Upload CV (PDF) via Pinata → IPFS</label><div class="upload-zone" onclick="triggerCvUp()" style="border-color:rgba(0,212,255,.2)"><div id="cv-pre">'+(profile.cvIpfsHash?'<div style="font-size:.72rem;color:#10b981;font-family:\'JetBrains Mono\',monospace;margin-bottom:.3rem">📌 '+profile.cvIpfsHash.slice(0,30)+'…</div>':'<div style="font-size:.7rem;color:#4a5a6a;margin-bottom:.3rem">No file uploaded</div>')+'</div><input type="file" id="cv-file-in" accept=".pdf,application/pdf" style="display:none" onchange="uploadCv(this)"><div id="cv-up-label" style="font-size:.72rem;color:var(--cyan);font-family:\'JetBrains Mono\',monospace">📤 Click to upload PDF</div></div>'+(profile.cvIpfsHash?'<button onclick="removeCv()" class="abtn-del" style="margin-top:.5rem">× Remove CV</button>':'')+'</div><div style="display:flex;align-items:center;gap:.6rem;margin:.2rem 0 .7rem"><div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:.65rem;color:var(--muted);font-family:\'JetBrains Mono\',monospace">OR</span><div style="flex:1;height:1px;background:var(--border)"></div></div><div class="frow" style="margin-bottom:.7rem"><label class="flabel">Direct CV URL</label><input class="finput" id="lnk-cv-url" value="'+esc(profile.cvDirectUrl||'')+'" placeholder="https://drive.google.com/file/d/..."></div><div class="frow"><label class="flabel">CV File Name</label><input class="finput" id="lnk-cv-name" value="'+esc(profile.cvFileName||'CV.pdf')+'" placeholder="YourName_CV.pdf"></div></div><div style="background:rgba(139,92,246,.03);border:1px solid rgba(139,92,246,.12);border-radius:10px;padding:1.1rem"><div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.9rem"><span style="font-size:1.15rem">🔗</span><span style="font-size:.82rem;font-weight:600;color:var(--purple)">Social Links</span></div><div class="frow"><label class="flabel">GitHub Profile URL</label><input class="finput" id="lnk-github" value="'+esc(profile.githubUrl||'')+'" placeholder="https://github.com/yourusername"></div><div class="frow"><label class="flabel">LinkedIn Profile URL</label><input class="finput" id="lnk-linkedin" value="'+esc(profile.linkedinUrl||'')+'" placeholder="https://linkedin.com/in/yourusername"></div></div><div style="display:flex;gap:.75rem;justify-content:flex-end"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveLinksForm()">Save Links</button></div></div>';
}

function saveLinksForm(){
  profile.githubUrl=(document.getElementById('lnk-github').value||'').trim();
  profile.linkedinUrl=(document.getElementById('lnk-linkedin').value||'').trim();
  profile.cvDirectUrl=(document.getElementById('lnk-cv-url').value||'').trim();
  profile.cvFileName=(document.getElementById('lnk-cv-name').value||'CV.pdf').trim();
  fsSet('profile',profile);
  applyProfileLinks();activeSect='links';openAdmin();showToast('Links saved ✓');
}

function triggerCvUp(){if(!pinataJWT){showToast('Set Pinata JWT first',true);return;}document.getElementById('cv-file-in').click();}

async function uploadCv(inp){
  var file=inp.files[0];if(!file)return;
  var lbl=document.getElementById('cv-up-label');if(lbl)lbl.textContent='Uploading… 0%';
  try{
    var data = await pinataUploadWithProgress(file, file.name||'CV.pdf', function(pct){
      if(lbl) lbl.textContent='Uploading… '+pct+'%';
    });
    profile.cvIpfsHash=data.IpfsHash;profile.cvFileName=file.name||'CV.pdf';profile.cvDirectUrl='';
    fsSet('profile',profile);
    applyProfileLinks();showToast('CV uploaded to IPFS ✓');
    activeSect='links';document.getElementById('admin-tab-content').innerHTML=buildLinksTab();
  }catch(e){
    showToast('Upload failed: '+e.message,true);
    if(lbl)lbl.textContent='📤 Click to upload PDF';
  }
}

function removeCv(){
  if(!confirm('Remove CV?'))return;
  profile.cvIpfsHash='';
  fsSet('profile',profile);
  applyProfileLinks();showToast('CV removed');
  document.getElementById('admin-tab-content').innerHTML=buildLinksTab();
}

// ═══════════════════════════════════════════════════════════════════════
//  PINATA UPLOAD HELPERS — retry + progress
// ═══════════════════════════════════════════════════════════════════════

/**
 * Upload a file to Pinata with automatic retries on network errors.
 * @param {File} file
 * @param {string} name  - metadata name
 * @param {number} retries - max attempts (default 3)
 */
async function pinataUpload(file, name, retries) {
  retries = retries || 3;
  var lastError;
  for (var attempt = 1; attempt <= retries; attempt++) {
    try {
      var fd = new FormData();
      fd.append('file', file);
      fd.append('pinataMetadata', JSON.stringify({ name: name }));
      var res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + pinataJWT },
        body: fd
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json(); // success — return immediately
    } catch(e) {
      lastError = e;
      console.warn('Pinata upload attempt ' + attempt + ' failed:', e.message);
      if (attempt < retries) {
        // Wait before retrying: 1.5s, 3s, 4.5s …
        await new Promise(function(r){ setTimeout(r, 1500 * attempt); });
      }
    }
  }
  throw lastError; // all attempts exhausted
}

/**
 * Upload with XHR so we can show real % progress, plus retry on failure.
 * @param {File} file
 * @param {string} name
 * @param {function} onProgress - called with 0-100
 * @param {number} retries
 */
function pinataUploadWithProgress(file, name, onProgress, retries) {
  retries = retries || 3;
  var attempt = 0;

  function tryUpload() {
    attempt++;
    return new Promise(function(resolve, reject) {
      var fd = new FormData();
      fd.append('file', file);
      fd.append('pinataMetadata', JSON.stringify({ name: name }));

      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
      xhr.setRequestHeader('Authorization', 'Bearer ' + pinataJWT);

      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round(e.loaded / e.total * 100));
        }
      };

      xhr.onload = function() {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('HTTP ' + xhr.status + ': ' + xhr.responseText));
        }
      };

      xhr.onerror = function() { reject(new Error('ERR_NETWORK_CHANGED or connection lost')); };
      xhr.ontimeout = function() { reject(new Error('Upload timed out')); };
      xhr.timeout = 120000; // 2-minute timeout per attempt

      xhr.send(fd);
    });
  }

  function run() {
    return tryUpload().catch(function(err) {
      console.warn('Pinata upload attempt ' + attempt + ' failed:', err.message);
      if (attempt < retries) {
        if (onProgress) onProgress(0); // reset progress bar
        return new Promise(function(r){ setTimeout(r, 1500 * attempt); }).then(run);
      }
      throw err;
    });
  }

  return run();
}

// ═══════════════════════════════════════════════════════════════════════
//  PROJECTS TAB
// ═══════════════════════════════════════════════════════════════════════
function buildProjectsTab(){
  var rows=projects.map(function(p){return '<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;margin-bottom:.5rem"><span style="font-size:1.2rem">'+p.emoji+'</span><div style="flex:1;min-width:0"><div style="font-size:.82rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(p.title)+'</div><div style="font-family:\'JetBrains Mono\',monospace;font-size:.6rem;color:var(--muted)">'+esc(p.num)+' · '+esc(p.cat)+'</div></div><button onclick="editProject(\''+p.id+'\')" class="abtn-edit">Edit</button><button onclick="deleteItem(\'projects\',\''+p.id+'\')" class="abtn-del">Del</button></div>';}).join('');
  return '<button onclick="addProject()" class="abtn-add">+ New Project</button>'+rows;
}

function addProject(){editingId=null;techTags=[];currentImgHash='';currentVideoHash='';showProjectForm({id:'new_'+Date.now(),num:'#'+String(projects.length+1).padStart(2,'0'),emoji:'🚀',title:'',desc:'',tech:[],cat:'web',github:'',videoHash:'',imageHash:''});}
function editProject(id){var p=projects.find(function(x){return x.id===id;});if(!p)return;editingId=id;techTags=p.tech.slice();currentImgHash=p.imageHash||'';currentVideoHash=p.videoHash||'';showProjectForm(p);}

function showProjectForm(p){
  cm('adm');
  var cats=['blockchain','web','mobile','ai','other'];
  var emojis=['⛓','🌊','☕','💰','🔐','🚀','🧠','🌐','📱','🎮','🔬','⚡','🛡','🗺','📊','🤖','🏗','🔭','🎯','🧩'];
  var catOpts=cats.map(function(c){return '<option value="'+c+'"'+(p.cat===c?' selected':'')+'>'+c+'</option>';}).join('');
  var emojiBtns=emojis.map(function(e){return '<button onclick="pickE(\''+e+'\')" style="width:33px;height:33px;border:1px solid '+(p.emoji===e?'var(--cyan)':'var(--border)')+';border-radius:5px;background:'+(p.emoji===e?'rgba(0,212,255,.1)':'rgba(255,255,255,.03)')+';font-size:1.05rem;cursor:pointer">'+e+'</button>';}).join('');
  var imgPre=currentImgHash?'<img src="'+PINATA_GATEWAY+currentImgHash+'" style="max-height:70px;border-radius:6px;margin-bottom:.4rem;" alt="preview">':'<div style="font-size:.7rem;color:#4a3a5a;margin-bottom:.4rem">No image</div>';
  var rmImgBtn=currentImgHash?'<button onclick="removeImg()" class="abtn-del" style="margin-top:.4rem">× Remove</button>':'';
  var vidPre=currentVideoHash?'<video src="'+PINATA_GATEWAY+currentVideoHash+'" style="max-height:70px;border-radius:6px;margin-bottom:.4rem;max-width:100%" muted playsinline></video>':'<div style="font-size:.7rem;color:#3a2a5a;margin-bottom:.4rem">No video</div>';
  var rmVidBtn=currentVideoHash?'<button onclick="removeVideo()" class="abtn-del" style="margin-top:.4rem">× Remove</button>':'';
  modal('<div class="overlay" id="frm" onclick="oci(event,\'frm\')"><div class="mbox"><button class="mclose" onclick="openAdmin()">&#10005;</button><div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--cyan),var(--blue),var(--purple));border-radius:14px 14px 0 0"></div><div style="font-size:.78rem;font-weight:600;color:var(--cyan);margin-bottom:1.2rem;padding-top:.4rem">'+(editingId?'Edit Project':'New Project')+'</div><div class="frow"><label class="flabel">Title *</label><input class="finput" id="f-title" value="'+esc(p.title)+'" placeholder="Project name"></div><div class="frow"><label class="flabel">Description</label><textarea class="finput" id="f-desc" style="resize:vertical;min-height:70px;line-height:1.65">'+esc(p.desc)+'</textarea></div><div class="fgrid"><div><label class="flabel">Category</label><select class="finput" id="f-cat">'+catOpts+'</select></div><div><label class="flabel">Number</label><input class="finput" id="f-num" value="'+esc(p.num)+'" placeholder="#06"></div></div><div class="frow"><label class="flabel">Emoji</label><div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.3rem" id="epicker">'+emojiBtns+'</div><input type="hidden" id="f-emoji" value="'+esc(p.emoji)+'"></div><div class="frow"><label class="flabel">Technologies</label><div style="display:flex;gap:.5rem"><input class="finput" id="f-tech-in" placeholder="Add & press Enter" style="flex:1" onkeydown="if(event.key===\'Enter\'){event.preventDefault();addTag()}"><button onclick="addTag()" style="padding:.55rem .85rem;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.25);border-radius:7px;color:var(--cyan);cursor:pointer">+</button></div><div id="tags-out" style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem">'+techTags.map(tagEl).join('')+'</div></div><div class="frow"><label class="flabel">GitHub URL</label><input class="finput" id="f-github" value="'+esc(p.github)+'" placeholder="https://github.com/..."></div><div class="frow"><label class="flabel">Demo Video (IPFS)</label><div class="upload-zone upload-zone-video" onclick="triggerVideoUp()"><div id="vid-pre">'+vidPre+'</div><input type="file" id="vid-in" accept="video/*" style="display:none" onchange="uploadVideo(this)"><div id="vid-label" style="font-size:.72rem;color:#8b5cf6;font-family:\'JetBrains Mono\',monospace">&#127909; Click to upload video</div></div>'+rmVidBtn+'</div><div class="frow"><label class="flabel">Screenshot (IPFS)</label><div class="upload-zone" onclick="triggerUp()"><div id="img-pre">'+imgPre+'</div><input type="file" id="img-in" accept="image/*" style="display:none" onchange="uploadImg(this)"><div id="up-label" style="font-size:.72rem;color:#e6008a;font-family:\'JetBrains Mono\',monospace">&#128228; Click to upload image</div></div>'+rmImgBtn+'</div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.2rem"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveProjectForm()">'+(editingId?'Save Changes':'Add Project')+'</button></div></div></div>');
}

function saveProjectForm(){
  var title=document.getElementById('f-title').value.trim();
  if(!title){showToast('Title required',true);return;}
  var p={id:editingId||('p'+Date.now()),num:document.getElementById('f-num').value.trim(),emoji:document.getElementById('f-emoji').value,title:title,desc:document.getElementById('f-desc').value.trim(),tech:techTags.slice(),cat:document.getElementById('f-cat').value,github:document.getElementById('f-github').value.trim(),videoHash:currentVideoHash,imageHash:currentImgHash};
  if(editingId){projects=projects.map(function(x){return x.id===editingId?p:x;});}else{projects.push(p);}
  fsSet('projects',projects);
  renderProjects();activeSect='projects';openAdmin();showToast('Project saved');
}

// ═══════════════════════════════════════════════════════════════════════
//  SKILLS TAB
// ═══════════════════════════════════════════════════════════════════════
function buildSkillsTab(){var rows=skills.map(function(sk){return '<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;margin-bottom:.5rem"><span style="font-size:1.2rem">'+sk.icon+'</span><div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(sk.title)+'</div><div style="font-size:.68rem;color:var(--muted);margin-top:.15rem">'+sk.tags.join(', ')+'</div></div><button onclick="editSkill(\''+sk.id+'\')" class="abtn-edit">Edit</button><button onclick="deleteItem(\'skills\',\''+sk.id+'\')" class="abtn-del">Del</button></div>';}).join('');return '<button onclick="addSkill()" class="abtn-add">+ New Skill Category</button>'+rows;}
function addSkill(){editingId=null;techTags=[];showSkillForm({id:'sk'+Date.now(),icon:'⚡',title:'',color:'var(--cyan)',theme:'sk-cyan',tags:[]});}
function editSkill(id){var sk=skills.find(function(x){return x.id===id;});if(!sk)return;editingId=id;techTags=sk.tags.slice();showSkillForm(sk);}
function showSkillForm(sk){cm('adm');var THEMES=['sk-cyan','sk-purple','sk-blue','sk-green','sk-orange'];var themeOpts=THEMES.map(function(t){return '<option value="'+t+'"'+(sk.theme===t?' selected':'')+'>'+t+'</option>';}).join('');modal('<div class="overlay" id="skfrm" onclick="oci(event,\'skfrm\')"><div class="mbox" style="max-width:460px"><button class="mclose" onclick="openAdmin()">&#10005;</button><div style="font-size:.78rem;font-weight:600;color:var(--cyan);margin-bottom:1.2rem">'+(editingId?'Edit Skill Category':'New Skill Category')+'</div><div class="fgrid"><div><label class="flabel">Icon / Emoji</label><input class="finput" id="sk-icon" value="'+esc(sk.icon)+'" placeholder="⚡"></div><div><label class="flabel">Title</label><input class="finput" id="sk-title" value="'+esc(sk.title)+'" placeholder="Languages"></div></div><div class="frow"><label class="flabel">Theme</label><select class="finput" id="sk-theme">'+themeOpts+'</select></div><div class="frow"><label class="flabel">Technologies / Tags</label><div style="display:flex;gap:.5rem"><input class="finput" id="f-tech-in" placeholder="Add & press Enter" style="flex:1" onkeydown="if(event.key===\'Enter\'){event.preventDefault();addTag()}"><button onclick="addTag()" style="padding:.55rem .85rem;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.25);border-radius:7px;color:var(--cyan);cursor:pointer">+</button></div><div id="tags-out" style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem">'+techTags.map(tagEl).join('')+'</div></div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.2rem"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveSkillForm()">'+(editingId?'Save Changes':'Add Category')+'</button></div></div></div>');}
function saveSkillForm(){var TC={'sk-cyan':'var(--cyan)','sk-purple':'var(--purple)','sk-blue':'var(--blue)','sk-green':'var(--green)','sk-orange':'#f97316'};var theme=document.getElementById('sk-theme').value;var sk={id:editingId||('sk'+Date.now()),icon:document.getElementById('sk-icon').value.trim()||'⚡',title:document.getElementById('sk-title').value.trim(),color:TC[theme]||'var(--cyan)',theme:theme,tags:techTags.slice()};if(!sk.title){showToast('Title required',true);return;}if(editingId){skills=skills.map(function(x){return x.id===editingId?sk:x;});}else{skills.push(sk);}fsSet('skills',skills);renderSkills();activeSect='skills';openAdmin();showToast('Skills saved');}

// ═══════════════════════════════════════════════════════════════════════
//  STATS TAB
// ═══════════════════════════════════════════════════════════════════════
function buildStatsTab(){var rows=stats.map(function(s,i){return '<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;margin-bottom:.5rem"><div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(s.label)+'</div><div style="font-size:.68rem;color:var(--cyan);font-family:\'JetBrains Mono\',monospace">'+s.value+s.suffix+'</div></div><button onclick="editStat('+i+')" class="abtn-edit">Edit</button></div>';}).join('');return '<div style="font-size:.75rem;color:var(--muted);margin-bottom:1rem">Edit the three stat counters shown in the About section.</div>'+rows;}
function editStat(idx){var s=stats[idx];cm('adm');modal('<div class="overlay" id="stfrm" onclick="oci(event,\'stfrm\')"><div class="mbox" style="max-width:380px"><button class="mclose" onclick="openAdmin()">&#10005;</button><div style="font-size:.78rem;font-weight:600;color:var(--cyan);margin-bottom:1.2rem">Edit Stat: '+esc(s.label)+'</div><div class="frow"><label class="flabel">Label</label><input class="finput" id="st-label" value="'+esc(s.label)+'"></div><div class="fgrid"><div><label class="flabel">Value (number)</label><input class="finput" id="st-value" type="number" value="'+s.value+'"></div><div><label class="flabel">Suffix</label><input class="finput" id="st-suffix" value="'+esc(s.suffix)+'"></div></div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.2rem"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveStatForm('+idx+')">Save</button></div></div></div>');}
function saveStatForm(idx){stats[idx].label=document.getElementById('st-label').value.trim();stats[idx].value=parseInt(document.getElementById('st-value').value)||0;stats[idx].suffix=document.getElementById('st-suffix').value;fsSet('stats',stats);renderStats();activeSect='stats';openAdmin();showToast('Stat saved');}

// ═══════════════════════════════════════════════════════════════════════
//  EXPERIENCE TAB
// ═══════════════════════════════════════════════════════════════════════
function buildExperienceTab(){var rows=experience.map(function(e){return '<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;margin-bottom:.5rem"><div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(e.title)+'</div><div style="font-size:.68rem;color:var(--muted)">'+esc(e.org)+' · '+esc(e.date)+'</div></div><button onclick="editExp(\''+e.id+'\')" class="abtn-edit">Edit</button><button onclick="deleteItem(\'experience\',\''+e.id+'\')" class="abtn-del">Del</button></div>';}).join('');return '<button onclick="addExp()" class="abtn-add">+ New Experience</button>'+rows;}
function addExp(){editingId=null;showExpForm({id:'e'+Date.now(),date:'',title:'',org:'',desc:''});}
function editExp(id){var e=experience.find(function(x){return x.id===id;});if(!e)return;editingId=id;showExpForm(e);}
function showExpForm(e){cm('adm');modal('<div class="overlay" id="efrm" onclick="oci(event,\'efrm\')"><div class="mbox" style="max-width:480px"><button class="mclose" onclick="openAdmin()">&#10005;</button><div style="font-size:.78rem;font-weight:600;color:var(--cyan);margin-bottom:1.2rem">'+(editingId?'Edit Experience':'New Experience')+'</div><div class="frow"><label class="flabel">Job Title *</label><input class="finput" id="ex-title" value="'+esc(e.title)+'" placeholder="Software Engineer"></div><div class="frow"><label class="flabel">Organisation</label><input class="finput" id="ex-org" value="'+esc(e.org)+'" placeholder="Company Name"></div><div class="frow"><label class="flabel">Date Range</label><input class="finput" id="ex-date" value="'+esc(e.date)+'" placeholder="JAN 2023 — DEC 2023"></div><div class="frow"><label class="flabel">Description</label><textarea class="finput" id="ex-desc" style="resize:vertical;min-height:90px;line-height:1.65">'+esc(e.desc)+'</textarea></div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.2rem"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveExpForm()">'+(editingId?'Save Changes':'Add Experience')+'</button></div></div></div>');}
function saveExpForm(){var title=document.getElementById('ex-title').value.trim();if(!title){showToast('Title required',true);return;}var e={id:editingId||('e'+Date.now()),date:document.getElementById('ex-date').value.trim(),title:title,org:document.getElementById('ex-org').value.trim(),desc:document.getElementById('ex-desc').value.trim()};if(editingId){experience=experience.map(function(x){return x.id===editingId?e:x;});}else{experience.push(e);}fsSet('experience',experience);renderExperience();activeSect='experience';openAdmin();showToast('Experience saved');}

// ═══════════════════════════════════════════════════════════════════════
//  EDUCATION TAB
// ═══════════════════════════════════════════════════════════════════════
function buildEducationTab(){var rows=education.map(function(ed){return '<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;margin-bottom:.5rem"><span style="font-size:1.2rem">'+ed.badgeEmoji+'</span><div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(ed.deg)+'</div><div style="font-size:.68rem;color:var(--muted)">'+esc(ed.school)+' · '+esc(ed.year)+'</div></div><button onclick="editEdu(\''+ed.id+'\')" class="abtn-edit">Edit</button><button onclick="deleteItem(\'education\',\''+ed.id+'\')" class="abtn-del">Del</button></div>';}).join('');return '<button onclick="addEdu()" class="abtn-add">+ New Education</button>'+rows;}
function addEdu(){editingId=null;showEduForm({id:'ed'+Date.now(),deg:'',school:'',year:'',location:'',badge:'',badgeEmoji:'🎓',logoUrl:'',accentColor:'0,212,255',badgeColor:'cyan'});}
function editEdu(id){var ed=education.find(function(x){return x.id===id;});if(!ed)return;editingId=id;showEduForm(ed);}
function showEduForm(ed){cm('adm');var bcOpts=['cyan','purple','green','blue','orange'].map(function(c){return '<option value="'+c+'"'+(ed.badgeColor===c?' selected':'')+'>'+c+'</option>';}).join('');var emojis=['🎓','🏫','🏆','📜','🏅','⭐','🔬','💡','🖥','📚'];var emojiBtns=emojis.map(function(e){return '<button onclick="pickEduEmoji(\''+e+'\')" style="width:33px;height:33px;border:1px solid '+(ed.badgeEmoji===e?'var(--cyan)':'var(--border)')+';border-radius:5px;background:'+(ed.badgeEmoji===e?'rgba(0,212,255,.1)':'rgba(255,255,255,.03)')+';font-size:1.1rem;cursor:pointer">'+e+'</button>';}).join('');modal('<div class="overlay" id="edfrm" onclick="oci(event,\'edfrm\')"><div class="mbox" style="max-width:480px"><button class="mclose" onclick="openAdmin()">&#10005;</button><div style="font-size:.78rem;font-weight:600;color:var(--cyan);margin-bottom:1.2rem">'+(editingId?'Edit Education':'New Education')+'</div><div class="frow"><label class="flabel">Degree / Qualification *</label><input class="finput" id="ed-deg" value="'+esc(ed.deg)+'" placeholder="BSc Software Engineering"></div><div class="frow"><label class="flabel">Institution</label><input class="finput" id="ed-school" value="'+esc(ed.school)+'" placeholder="University Name"></div><div class="fgrid"><div><label class="flabel">Years</label><input class="finput" id="ed-year" value="'+esc(ed.year)+'" placeholder="2021 — 2025"></div><div><label class="flabel">Location</label><input class="finput" id="ed-location" value="'+esc(ed.location)+'" placeholder="Cardiff, Wales"></div></div><div class="frow"><label class="flabel">Badge Text</label><input class="finput" id="ed-badge" value="'+esc(ed.badge)+'" placeholder="Undergraduate Degree"></div><div class="frow"><label class="flabel">Logo URL (optional)</label><input class="finput" id="ed-logo" value="'+esc(ed.logoUrl)+'" placeholder="https://university.ac.uk/logo.png"></div><div class="fgrid"><div><label class="flabel">Badge Colour</label><select class="finput" id="ed-bc">'+bcOpts+'</select></div><div><label class="flabel">Accent (R,G,B)</label><input class="finput" id="ed-accent" value="'+esc(ed.accentColor)+'" placeholder="0,82,136"></div></div><div class="frow"><label class="flabel">Icon</label><div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.3rem" id="edu-epicker">'+emojiBtns+'</div><input type="hidden" id="ed-emoji" value="'+esc(ed.badgeEmoji)+'"></div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.2rem"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveEduForm()">'+(editingId?'Save Changes':'Add Education')+'</button></div></div></div>');}
function pickEduEmoji(e){document.getElementById('ed-emoji').value=e;document.querySelectorAll('#edu-epicker button').forEach(function(b){var s=b.textContent===e;b.style.border='1px solid '+(s?'var(--cyan)':'var(--border)');b.style.background=s?'rgba(0,212,255,.1)':'rgba(255,255,255,.03)';});}
function saveEduForm(){var deg=document.getElementById('ed-deg').value.trim();if(!deg){showToast('Degree required',true);return;}var ed={id:editingId||('ed'+Date.now()),deg:deg,school:document.getElementById('ed-school').value.trim(),year:document.getElementById('ed-year').value.trim(),location:document.getElementById('ed-location').value.trim(),badge:document.getElementById('ed-badge').value.trim(),badgeEmoji:document.getElementById('ed-emoji').value,logoUrl:document.getElementById('ed-logo').value.trim(),accentColor:document.getElementById('ed-accent').value.trim()||'0,212,255',badgeColor:document.getElementById('ed-bc').value};if(editingId){education=education.map(function(x){return x.id===editingId?ed:x;});}else{education.push(ed);}fsSet('education',education);renderEducation();activeSect='education';openAdmin();showToast('Education saved');}

// ═══════════════════════════════════════════════════════════════════════
//  CONTACT TAB
// ═══════════════════════════════════════════════════════════════════════
function buildContactTab(){var rows=contact.map(function(c){return '<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;margin-bottom:.5rem"><span style="font-size:1.2rem">'+c.icon+'</span><div style="flex:1"><div style="font-size:.82rem;font-weight:500">'+esc(c.label)+'</div><div style="font-size:.68rem;color:var(--muted)">'+esc(c.value)+'</div></div><button onclick="editContact(\''+c.id+'\')" class="abtn-edit">Edit</button><button onclick="deleteItem(\'contact\',\''+c.id+'\')" class="abtn-del">Del</button></div>';}).join('');return '<button onclick="addContact()" class="abtn-add">+ New Contact</button>'+rows;}
function addContact(){editingId=null;showContactForm({id:'c'+Date.now(),icon:'📧',label:'',value:'',href:''});}
function editContact(id){var c=contact.find(function(x){return x.id===id;});if(!c)return;editingId=id;showContactForm(c);}
function showContactForm(c){cm('adm');var icons=['✉','⌥','💼','🐙','🐦','📱','🌐','📞','💬'];var iconBtns=icons.map(function(i){return '<button onclick="pickContactIcon(\''+i+'\')" style="width:33px;height:33px;border:1px solid '+(c.icon===i?'var(--cyan)':'var(--border)')+';border-radius:5px;background:'+(c.icon===i?'rgba(0,212,255,.1)':'rgba(255,255,255,.03)')+';font-size:1.1rem;cursor:pointer">'+i+'</button>';}).join('');modal('<div class="overlay" id="cfrm" onclick="oci(event,\'cfrm\')"><div class="mbox" style="max-width:420px"><button class="mclose" onclick="openAdmin()">&#10005;</button><div style="font-size:.78rem;font-weight:600;color:var(--cyan);margin-bottom:1.2rem">'+(editingId?'Edit Contact':'New Contact')+'</div><div class="frow"><label class="flabel">Icon</label><div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.3rem" id="contact-ipicker">'+iconBtns+'</div><input type="hidden" id="c-icon" value="'+esc(c.icon)+'"></div><div class="fgrid"><div><label class="flabel">Label</label><input class="finput" id="c-label" value="'+esc(c.label)+'" placeholder="Email"></div><div><label class="flabel">Display Value</label><input class="finput" id="c-value" value="'+esc(c.value)+'" placeholder="you@email.com"></div></div><div class="frow"><label class="flabel">Link / href</label><input class="finput" id="c-href" value="'+esc(c.href)+'" placeholder="mailto:you@email.com"></div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.2rem"><button onclick="openAdmin()" style="padding:.65rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button class="save-btn" onclick="saveContactForm()">'+(editingId?'Save Changes':'Add Contact')+'</button></div></div></div>');}
function pickContactIcon(i){document.getElementById('c-icon').value=i;document.querySelectorAll('#contact-ipicker button').forEach(function(b){var s=b.textContent===i;b.style.border='1px solid '+(s?'var(--cyan)':'var(--border)');b.style.background=s?'rgba(0,212,255,.1)':'rgba(255,255,255,.03)';});}
function saveContactForm(){var label=document.getElementById('c-label').value.trim();if(!label){showToast('Label required',true);return;}var c={id:editingId||('c'+Date.now()),icon:document.getElementById('c-icon').value,label:label,value:document.getElementById('c-value').value.trim(),href:document.getElementById('c-href').value.trim()};if(editingId){contact=contact.map(function(x){return x.id===editingId?c:x;});}else{contact.push(c);}fsSet('contact',contact);renderContact();activeSect='contact';openAdmin();showToast('Contact saved');}

// ═══════════════════════════════════════════════════════════════════════
//  DELETE
// ═══════════════════════════════════════════════════════════════════════
function deleteItem(type,id){
  var map={projects:projects,skills:skills,experience:experience,education:education,contact:contact};
  var store=map[type];if(!store||!confirm('Remove this item?'))return;
  map[type]=store.filter(function(x){return x.id!==id;});
  if(type==='projects'){projects=map[type];fsSet('projects',projects);renderProjects();}
  else if(type==='skills'){skills=map[type];fsSet('skills',skills);renderSkills();}
  else if(type==='experience'){experience=map[type];fsSet('experience',experience);renderExperience();}
  else if(type==='education'){education=map[type];fsSet('education',education);renderEducation();}
  else if(type==='contact'){contact=map[type];fsSet('contact',contact);renderContact();}
  activeSect=type;openAdmin();showToast('Removed');
}

// ═══════════════════════════════════════════════════════════════════════
//  PINATA MODAL
// ═══════════════════════════════════════════════════════════════════════
function openPinataModal(){if(!adminUnlocked)return;modal('<div class="overlay" id="pin" onclick="oci(event,\'pin\')"><div class="mbox" style="max-width:420px"><button class="mclose" onclick="cm(\'pin\')">&#10005;</button><div style="font-size:1.8rem;margin-bottom:.6rem">&#128204;</div><div style="font-weight:600;color:#e6008a;margin-bottom:.5rem">Pinata Configuration</div><div style="font-size:.78rem;color:var(--muted);line-height:1.75;margin-bottom:1.3rem">Paste your Pinata JWT to enable IPFS uploads.<br>Get it from <span style="color:#e6008a">app.pinata.cloud → API Keys</span>.</div><div class="frow"><label class="flabel">JWT Token</label><textarea class="finput" id="jwt-in" style="min-height:80px;font-size:.7rem;word-break:break-all;resize:vertical" placeholder="eyJhbGci...">'+pinataJWT+'</textarea></div><div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1rem"><button onclick="cm(\'pin\')" style="padding:.6rem 1.3rem;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:.78rem;cursor:pointer">Cancel</button><button onclick="saveJWT()" style="padding:.6rem 1.5rem;background:#e6008a;border:none;border-radius:6px;color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">Save</button></div></div></div>');}
function saveJWT(){var v=document.getElementById('jwt-in').value.trim();pinataJWT=v;fsSet('pinataJWT',v);updatePinataLabel();cm('pin');showToast(v?'Pinata JWT saved':'JWT cleared');}

// ═══════════════════════════════════════════════════════════════════════
//  UPLOAD HELPERS (image + video — use new retry+progress functions)
// ═══════════════════════════════════════════════════════════════════════
function pickE(e){document.getElementById('f-emoji').value=e;document.querySelectorAll('#epicker button').forEach(function(b){var s=b.textContent===e;b.style.border='1px solid '+(s?'var(--cyan)':'var(--border)');b.style.background=s?'rgba(0,212,255,.1)':'rgba(255,255,255,.03)';});}
function tagEl(t){return '<span style="padding:.2rem .6rem;background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);border-radius:5px;font-size:.7rem;color:var(--cyan);font-family:\'JetBrains Mono\',monospace;display:inline-flex;align-items:center;gap:.3rem">'+esc(t)+'<span onclick="rmTag(\''+esc(t)+'\')" style="cursor:pointer;color:#f87171">&#215;</span></span>';}
function addTag(){var inp=document.getElementById('f-tech-in');var val=inp.value.trim();if(val&&!techTags.includes(val)){techTags.push(val);document.getElementById('tags-out').innerHTML=techTags.map(tagEl).join('');}inp.value='';}
function rmTag(t){techTags=techTags.filter(function(x){return x!==t;});document.getElementById('tags-out').innerHTML=techTags.map(tagEl).join('');}

function triggerUp(){if(!pinataJWT){showToast('Set Pinata JWT first',true);return;}document.getElementById('img-in').click();}

async function uploadImg(inp) {
  var file = inp.files[0]; if (!file) return;
  var lbl = document.getElementById('up-label');
  lbl.textContent = 'Uploading… 0%';
  try {
    var data = await pinataUploadWithProgress(
      file,
      document.getElementById('f-title').value || 'img',
      function(pct) { lbl.textContent = 'Uploading… ' + pct + '%'; }
    );
    currentImgHash = data.IpfsHash;
    document.getElementById('img-pre').innerHTML =
      '<img src="' + PINATA_GATEWAY + data.IpfsHash + '" style="max-height:70px;border-radius:6px;margin-bottom:.4rem" alt="preview">';
    lbl.textContent = '📌 ' + data.IpfsHash.slice(0, 20) + '…';
    showToast('Image uploaded to IPFS ✓');
  } catch(e) {
    showToast('Upload failed: ' + e.message, true);
    lbl.textContent = '📤 Click to upload image';
  }
}

function removeImg(){currentImgHash='';var pre=document.getElementById('img-pre');if(pre)pre.innerHTML='<div style="font-size:.7rem;color:#4a3a5a;margin-bottom:.4rem">No image</div>';var lbl=document.getElementById('up-label');if(lbl)lbl.textContent='📤 Click to upload image';}

function triggerVideoUp(){if(!pinataJWT){showToast('Set Pinata JWT first',true);return;}document.getElementById('vid-in').click();}

async function uploadVideo(inp) {
  var file = inp.files[0]; if (!file) return;
  var lbl = document.getElementById('vid-label');
  lbl.textContent = 'Uploading… 0%';
  try {
    var data = await pinataUploadWithProgress(
      file,
      (document.getElementById('f-title').value || 'video') + '-demo',
      function(pct) { lbl.textContent = 'Uploading… ' + pct + '%'; }
    );
    currentVideoHash = data.IpfsHash;
    document.getElementById('vid-pre').innerHTML =
      '<video src="' + PINATA_GATEWAY + data.IpfsHash + '" style="max-height:70px;border-radius:6px;margin-bottom:.4rem;max-width:100%" muted playsinline></video>';
    lbl.textContent = '📌 ' + data.IpfsHash.slice(0, 20) + '…';
    showToast('Video uploaded to IPFS ✓');
  } catch(e) {
    showToast('Upload failed: ' + e.message, true);
    lbl.textContent = '🎬 Click to upload video';
  }
}

function removeVideo(){currentVideoHash='';var pre=document.getElementById('vid-pre');if(pre)pre.innerHTML='<div style="font-size:.7rem;color:#3a2a5a;margin-bottom:.4rem">No video</div>';var lbl=document.getElementById('vid-label');if(lbl)lbl.textContent='🎬 Click to upload video';}

// ═══════════════════════════════════════════════════════════════════════
//  RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════
function renderStats(){var el=document.getElementById('stats-row');if(!el)return;el.innerHTML=stats.map(function(s){return '<div class="stat"><div class="stat-n" id="'+s.id+'">'+s.value+s.suffix+'</div><div class="stat-l">'+esc(s.label)+'</div></div>';}).join('');var statObs=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;stats.forEach(function(s){var elem=document.getElementById(s.id);if(!elem)return;var cur=0,step=s.value/40;var t=setInterval(function(){cur+=step;if(cur>=s.value){cur=s.value;clearInterval(t);}elem.textContent=Math.ceil(cur)+s.suffix;},40);});statObs.disconnect();});},{threshold:.5});statObs.observe(el);}
function renderSkills(){var el=document.getElementById('skills-grid');if(!el)return;el.innerHTML=skills.map(function(sk){return '<div class="skill-card '+sk.theme+' reveal"><div class="skill-title" style="color:'+sk.color+'">'+sk.icon+' &nbsp;'+esc(sk.title)+'</div><div class="skill-tags">'+sk.tags.map(function(t){return '<span class="stag">'+esc(t)+'</span>';}).join('')+'</div></div>';}).join('');reObserve();}
function renderProjects(){var grid=document.getElementById('projects-grid');if(!grid)return;var list=activeFilter==='all'?projects:projects.filter(function(p){return p.cat===activeFilter;});if(!list.length){grid.innerHTML='<div style="grid-column:1/-1;padding:4rem;text-align:center;color:var(--muted);font-size:.85rem">No projects in this category</div>';return;}grid.innerHTML=list.map(buildProjectCard).join('');reObserve();}
function buildProjectCard(p){var c=CAT_COLORS[p.cat]||CAT_COLORS.other;var mediaHtml=p.videoHash?'<video src="'+PINATA_GATEWAY+p.videoHash+'" class="project-video" autoplay muted loop playsinline></video><div class="project-img-overlay"></div>':(p.imageHash?'<img src="'+PINATA_GATEWAY+p.imageHash+'" alt="'+esc(p.title)+'" onerror="this.style.display=\'none\'"><div class="project-img-overlay"></div>':'<div class="project-placeholder">'+p.emoji+'</div>');return '<div class="project-card reveal" onclick="openProjectViewer(\''+p.videoHash+'\')"><div class="project-img">'+mediaHtml+'<div class="project-num">'+esc(p.num)+'</div><div class="project-cat-pill" style="background:'+c.bg+';border:1px solid '+c.border+';color:'+c.text+'">'+esc(p.cat)+'</div></div><div class="project-body"><div class="project-title">'+esc(p.title)+'</div><div class="project-desc">'+esc(p.desc)+'</div><div class="project-tech">'+p.tech.map(function(t){return '<span class="ptag">'+esc(t)+'</span>';}).join('')+'</div><div class="project-links">'+(p.github&&p.github!=='#'?'<a href="'+p.github+'" class="plink" target="_blank">&#8599; GitHub</a>':'')+'</div></div></div>';}
function openProjectViewer(videoHash){if(!videoHash){showToast('No video available',true);return;}modal('<div class="overlay video-modal" id="vidModal" onclick="oci(event,\'vidModal\')"><div class="video-box"><button class="video-close" onclick="cm(\'vidModal\')">&#10005;</button><video src="'+PINATA_GATEWAY+videoHash+'" controls autoplay></video></div></div>');}
function filter(cat,btn){activeFilter=cat;document.querySelectorAll('.fbtn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');renderProjects();}
function renderExperience(){var el=document.getElementById('timeline');if(!el)return;el.innerHTML=experience.map(function(e){return '<div class="tl-line"><div class="tl-dot"></div><div class="tl-date">'+esc(e.date)+'</div><div class="tl-title">'+esc(e.title)+'</div><div class="tl-org">'+esc(e.org)+'</div><p class="tl-desc">'+esc(e.desc)+'</p></div>';}).join('');}
function renderEducation(){var el=document.getElementById('edu-grid');if(!el)return;var BS={cyan:'background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.2);color:var(--cyan)',purple:'background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);color:var(--purple)',green:'background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);color:var(--green)',blue:'background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.25);color:#3b82f6',orange:'background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.25);color:#f97316'};el.innerHTML=education.map(function(ed){var iconHtml=ed.logoUrl?'<img src="'+ed.logoUrl+'" onerror="this.parentElement.innerHTML=\''+ed.badgeEmoji+'\'" alt="'+esc(ed.school)+'" />':'<span style="font-size:1.5rem">'+ed.badgeEmoji+'</span>';var bs=BS[ed.badgeColor]||BS.cyan;return '<div class="edu-card reveal"><div class="edu-icon" style="background:rgba('+ed.accentColor+',.12);border-color:rgba('+ed.accentColor+',.3)">'+iconHtml+'</div><div style="flex:1"><div class="edu-deg">'+esc(ed.deg)+'</div><div class="edu-school">'+esc(ed.school)+'</div><div class="edu-year">'+esc(ed.year)+(ed.location?' &nbsp;&middot;&nbsp; '+esc(ed.location):'')+'</div><span class="edu-badge" style="'+bs+'">'+ed.badgeEmoji+' '+esc(ed.badge)+'</span></div></div>';}).join('');reObserve();}
function renderContact(){var el=document.getElementById('contact-cards');if(!el)return;el.innerHTML=contact.map(function(c){return '<a href="'+c.href+'" class="contact-card" '+(c.href.startsWith('http')?'target="_blank"':'')+'><span class="cc-icon">'+c.icon+'</span><span class="cc-label">'+esc(c.label)+'</span><span class="cc-val">'+esc(c.value)+'</span></a>';}).join('');}

// ═══════════════════════════════════════════════════════════════════════
//  TYPEWRITER
// ═══════════════════════════════════════════════════════════════════════
function startTypewriter(){var LINES=[{type:'comment',text:'About me...Had shortened'},{type:'blank'},{type:'prop',key:'name',val:'"Krish"',valClass:'t-str'},{type:'prop',key:'role',val:'"Software Engineer"',valClass:'t-str'},{type:'prop',key:'stack',val:'["Full-Stack", "Blockchain"]',valClass:'t-str',isArr:true},{type:'prop',key:'status',val:'"open to work"',valClass:'t-str'},{type:'method',key:'build',val:'"future"'},{type:'close',text:'};'}];function buildLineHTML(line,charCount){switch(line.type){case'blank':return{html:'<br>',totalChars:0};case'comment':return charCount>=line.text.length?{html:'<span class="t-comment">'+line.text+'</span>',totalChars:line.text.length}:{html:line.text.slice(0,charCount),totalChars:line.text.length};case'prop':{var raw='  '+line.key+': '+line.val+',';var ch=charCount;var html='';var parts=[{t:'  '},{t:line.key,cls:'t-var'},{t:': '}];if(line.isArr){parts=parts.concat([{t:'['},{t:'"Full-Stack"',cls:'t-str'},{t:', '},{t:'"Blockchain"',cls:'t-str'},{t:']'},{t:','}]);}else{parts=parts.concat([{t:line.val,cls:line.valClass},{t:','}]);}for(var i=0;i<parts.length;i++){var p=parts[i];if(ch<=0)break;var s=p.t;if(ch>=s.length){html+=p.cls?'<span class="'+p.cls+'">'+s+'</span>':s;ch-=s.length;}else{html+=p.cls?'<span class="'+p.cls+'">'+s.slice(0,ch)+'</span>':s.slice(0,ch);break;}}return{html:html,totalChars:raw.length};}case'method':{var raw='  build: () => "future"';var ch=charCount;var html='';var parts=[{t:'  '},{t:'build',cls:'t-fn'},{t:': () => '},{t:'"future"',cls:'t-str'}];for(var i=0;i<parts.length;i++){var p=parts[i];if(ch<=0)break;var s=p.t;if(ch>=s.length){html+=p.cls?'<span class="'+p.cls+'">'+s+'</span>':s;ch-=s.length;}else{html+=p.cls?'<span class="'+p.cls+'">'+s.slice(0,ch)+'</span>':s.slice(0,ch);break;}}return{html:html,totalChars:raw.length};}case'close':return charCount>=line.text.length?{html:line.text,totalChars:line.text.length}:{html:line.text.slice(0,charCount),totalChars:line.text.length};default:return{html:'',totalChars:0};}}var totalChars=0;for(var i=0;i<LINES.length;i++){if(LINES[i].type!=='blank')totalChars+=buildLineHTML(LINES[i],9999).totalChars;}var pos=0,direction=1,pausing=false;function render(charPos){var out=document.getElementById('typewriter-output');if(!out)return;var html='',charsLeft=charPos;for(var i=0;i<LINES.length;i++){var line=LINES[i];if(line.type==='blank'){html+='<br>';continue;}var r=buildLineHTML(line,charsLeft);html+=r.html;charsLeft-=r.totalChars;if(charsLeft<=0){html+='<span class="t-cur">&#9611;</span><br>';for(var j=i+1;j<LINES.length;j++)html+='<br>';break;}html+='<br>';}out.innerHTML=html;}function tick(){if(pausing)return;render(pos);if(direction===1){if(pos>=totalChars){pausing=true;setTimeout(function(){direction=-1;pausing=false;tick();},2200);return;}pos++;setTimeout(tick,38);}else{if(pos<=0){pausing=true;setTimeout(function(){direction=1;pausing=false;tick();},500);return;}pos--;setTimeout(tick,18);}}setTimeout(tick,800);}

// ═══════════════════════════════════════════════════════════════════════
//  CORE UTILITIES
// ═══════════════════════════════════════════════════════════════════════
function modal(html){document.getElementById('modal-root').innerHTML=html;}
function cm(id){var el=document.getElementById(id);if(el)el.remove();}
function oci(e,id){if(e.target===e.currentTarget)cm(id);}
function showToast(msg,err){var r=document.getElementById('toast-root');var d=document.createElement('div');d.className='toast'+(err?' err':'');d.textContent=msg;r.innerHTML='';r.appendChild(d);setTimeout(function(){d.remove();},2600);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
var obs=new IntersectionObserver(function(entries){entries.forEach(function(e,i){if(e.isIntersecting)setTimeout(function(){e.target.classList.add('in');},i*55);});},{threshold:.08});
function reObserve(){document.querySelectorAll('.reveal').forEach(function(el){if(!el.classList.contains('in'))obs.observe(el);});}
document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.shiftKey&&e.key==='A'){e.preventDefault();triggerAdminLogin();}});
