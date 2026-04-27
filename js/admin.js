// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDV2p2Fr1_hkVGwW42k3lmv1U09pU_53RQ",
  authDomain: "mktabat-birwalidin.firebaseapp.com",
  projectId: "mktabat-birwalidin",
  storageBucket: "mktabat-birwalidin.firebasestorage.app",
  messagingSenderId: "389831217733",
  appId: "1:389831217733:web:84df36125ac3a657e3092c",
  // Construct databaseURL as it's missing in some configs but required for RTDB
  databaseURL: "https://mktabat-birwalidin-default-rtdb.firebaseio.com" 
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- بيانات الدخول الخاصة باللوحة ---
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS  = '123456';
// ------------------------------------

let siteData = {};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const statusMsg = document.getElementById('saveStatus');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  setupTabs();

  loginForm.addEventListener('submit', handleLogin);
  document.getElementById('btnLogout').addEventListener('click', logout);
  
  // Settings Forms
  document.getElementById('articlesForm').addEventListener('submit', saveArticlesConfig);
  document.getElementById('socialsForm').addEventListener('submit', saveSocialsConfig);

  // Modals Openers
  document.getElementById('btnAddScholar').addEventListener('click', () => openModal('modalScholar', 'formScholar'));
  document.getElementById('btnAddVideo').addEventListener('click', () => openModal('modalVideo', 'formVideo'));
  document.getElementById('btnAddLesson').addEventListener('click', () => openModal('modalLesson', 'formLesson'));

  // Modals Submit
  document.getElementById('formScholar').addEventListener('submit', saveScholar);
  document.getElementById('formVideo').addEventListener('submit', saveVideo);
  document.getElementById('formLesson').addEventListener('submit', saveLesson);
});

/* ---------- Authentication ---------- */
function checkLogin() {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    showDashboard();
    fetchData();
  } else {
    showLogin();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value.trim();

  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    sessionStorage.setItem('isLoggedIn', 'true');
    loginError.style.display = 'none';
    showDashboard();
    fetchData();
  } else {
    loginError.textContent = 'البريد الإلكتروني أو كلمة السر غير صحيحة';
    loginError.style.display = 'block';
  }
}

function logout() {
  sessionStorage.removeItem('isLoggedIn');
  showLogin();
}

function showLogin() { loginScreen.style.display = 'flex'; dashboardScreen.style.display = 'none'; }
function showDashboard() { loginScreen.style.display = 'none'; dashboardScreen.style.display = 'block'; }

/* ---------- Tabs Logic ---------- */
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

/* ---------- Data Fetching & Rendering ---------- */
function fetchData() {
  db.ref('/').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      initDefaultData();
    } else {
      siteData = data;
      renderAll();
    }
  }, (error) => {
    console.error("Firebase Read Error:", error);
    showStatus('حدث خطأ في الاتصال بقاعدة البيانات. تأكد من إعدادات القراءة والكتابة.', 'error');
  });
}

function initDefaultData() {
  const defaultData = {
    socials: { facebook: "#", youtube: "#", telegram: "#", whatsapp: "#" },
    articles: { enabled: true, blogId: "", label: "مقالات", limit: 6 },
    scholars: [],
    videos: [],
    schedule: []
  };
  db.ref('/').set(defaultData).then(() => {
    console.log("Default data initialized");
  });
}

function renderAll() {
  // Render Settings
  if (siteData.articles) {
    document.getElementById('setBlogId').value = siteData.articles.blogId || '';
    document.getElementById('setBlogLabel').value = siteData.articles.label || 'مقالات';
    document.getElementById('setBlogLimit').value = siteData.articles.limit || 6;
  }
  if (siteData.socials) {
    document.getElementById('socFacebook').value = siteData.socials.facebook || '';
    document.getElementById('socYoutube').value = siteData.socials.youtube || '';
    document.getElementById('socTelegram').value = siteData.socials.telegram || '';
    document.getElementById('socWhatsapp').value = siteData.socials.whatsapp || '';
  }

  // Render Scholars
  const sList = document.getElementById('scholarsList');
  sList.innerHTML = '';
  const scholarsArr = objToArray(siteData.scholars);
  if (scholarsArr.length === 0) sList.innerHTML = '<p>لا يوجد مشايخ حالياً.</p>';
  scholarsArr.forEach(s => {
    sList.innerHTML += `
      <div class="list-item">
        <div class="list-info">
          <h3>${s.name}</h3>
          <div class="list-meta">${s.desc.substring(0, 60)}...</div>
        </div>
        <div class="list-actions">
          <button class="btn btn-outline btn-sm" onclick="editScholar('${s.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('scholars', '${s.id}')">حذف</button>
        </div>
      </div>`;
  });

  // Render Videos
  const vList = document.getElementById('videosList');
  vList.innerHTML = '';
  const videosArr = objToArray(siteData.videos);
  if (videosArr.length === 0) vList.innerHTML = '<p>لا توجد فيديوهات حالياً.</p>';
  videosArr.forEach(v => {
    vList.innerHTML += `
      <div class="list-item">
        <div class="list-info">
          <h3>${v.title}</h3>
          <div class="list-meta">ID: ${v.yt_id}</div>
        </div>
        <div class="list-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteItem('videos', '${v.id}')">حذف</button>
        </div>
      </div>`;
  });

  // Render Schedule
  const lList = document.getElementById('lessonsList');
  lList.innerHTML = '';
  const lessonsArr = objToArray(siteData.schedule);
  if (lessonsArr.length === 0) lList.innerHTML = '<p>لا توجد دروس حالياً.</p>';
  lessonsArr.forEach(l => {
    lList.innerHTML += `
      <div class="list-item">
        <div class="list-info">
          <span class="badge badge-success">${l.day}</span>
          <h3 style="margin-top:5px">${l.title}</h3>
          <div class="list-meta">👤 ${l.scholar} | 🕐 ${l.time}</div>
        </div>
        <div class="list-actions">
          <button class="btn btn-outline btn-sm" onclick="editLesson('${l.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('schedule', '${l.id}')">حذف</button>
        </div>
      </div>`;
  });
}

function objToArray(obj) {
  if (!obj) return [];
  return Object.keys(obj).map(key => ({ id: key, ...obj[key] }));
}

/* ---------- Saving Operations ---------- */
function saveArticlesConfig(e) {
  e.preventDefault();
  db.ref('articles').update({
    blogId: document.getElementById('setBlogId').value.trim(),
    label: document.getElementById('setBlogLabel').value.trim(),
    limit: parseInt(document.getElementById('setBlogLimit').value) || 6
  }).then(() => showStatus('تم حفظ إعدادات المقالات', 'success'));
}

function saveSocialsConfig(e) {
  e.preventDefault();
  db.ref('socials').set({
    facebook: document.getElementById('socFacebook').value.trim(),
    youtube: document.getElementById('socYoutube').value.trim(),
    telegram: document.getElementById('socTelegram').value.trim(),
    whatsapp: document.getElementById('socWhatsapp').value.trim()
  }).then(() => showStatus('تم حفظ الروابط', 'success'));
}

function saveScholar(e) {
  e.preventDefault();
  const id = document.getElementById('schId').value || Date.now().toString();
  db.ref('scholars/' + id).set({
    name: document.getElementById('schName').value,
    desc: document.getElementById('schDesc').value,
    image: document.getElementById('schImg').value,
    facebook: document.getElementById('schFb').value,
    telegram: document.getElementById('schTg').value,
    youtube: document.getElementById('schYt').value
  }).then(() => { closeModal('modalScholar'); showStatus('تم حفظ الشيخ', 'success'); });
}

function saveVideo(e) {
  e.preventDefault();
  const id = document.getElementById('vidId').value || Date.now().toString();
  db.ref('videos/' + id).set({
    title: document.getElementById('vidTitle').value,
    yt_id: document.getElementById('vidYtId').value
  }).then(() => { closeModal('modalVideo'); showStatus('تم حفظ الفيديو', 'success'); });
}

function saveLesson(e) {
  e.preventDefault();
  const id = document.getElementById('lesId').value || Date.now().toString();
  db.ref('schedule/' + id).set({
    day: document.getElementById('lesDay').value,
    title: document.getElementById('lesTitle').value,
    scholar: document.getElementById('lesScholar').value,
    time: document.getElementById('lesTime').value,
    location: document.getElementById('lesLocation').value
  }).then(() => { closeModal('modalLesson'); showStatus('تم حفظ الدرس', 'success'); });
}

window.deleteItem = function(path, id) {
  if (confirm('هل أنت متأكد من الحذف؟')) {
    db.ref(path + '/' + id).remove().then(() => showStatus('تم الحذف بنجاح', 'success'));
  }
}

/* ---------- Modals & Editing ---------- */
window.openModal = function(modalId, formId) {
  document.getElementById(formId).reset();
  document.getElementById(formId).querySelector('input[type="hidden"]').value = '';
  document.getElementById(modalId).classList.add('active');
}

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

window.editScholar = function(id) {
  const s = siteData.scholars[id];
  document.getElementById('schId').value = id;
  document.getElementById('schName').value = s.name || '';
  document.getElementById('schDesc').value = s.desc || '';
  document.getElementById('schImg').value = s.image || '';
  document.getElementById('schFb').value = s.facebook || '';
  document.getElementById('schTg').value = s.telegram || '';
  document.getElementById('schYt').value = s.youtube || '';
  document.getElementById('modalScholar').classList.add('active');
}

window.editLesson = function(id) {
  const l = siteData.schedule[id];
  document.getElementById('lesId').value = id;
  document.getElementById('lesDay').value = l.day || '';
  document.getElementById('lesTitle').value = l.title || '';
  document.getElementById('lesScholar').value = l.scholar || '';
  document.getElementById('lesTime').value = l.time || '';
  document.getElementById('lesLocation').value = l.location || '';
  document.getElementById('modalLesson').classList.add('active');
}

/* ---------- UI Helpers ---------- */
function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg';
  statusMsg.classList.add(`status-${type}`);
  statusMsg.style.display = 'block';
  setTimeout(() => { statusMsg.style.display = 'none'; }, 4000);
}
