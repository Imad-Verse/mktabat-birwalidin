// Admin Panel Logic - GitHub API Integration

let githubUser = '';
let githubRepo = '';
let githubToken = '';

// --- بيانات الدخول الخاصة بك (تستطيع تغييرها من هنا) ---
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS  = '123456';
// --------------------------------------------------
let currentSha = '';
let scheduleData = [];
const FILE_PATH = 'data/schedule.json';

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const lessonsList = document.getElementById('lessonsList');
const statusMsg = document.getElementById('saveStatus');

// Modal Elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const btnAddLesson = document.getElementById('btnAddLesson');
const btnCancelEdit = document.getElementById('btnCancelEdit');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();

  loginForm.addEventListener('submit', handleLogin);
  document.getElementById('btnLogout').addEventListener('click', logout);
  btnAddLesson.addEventListener('click', openAddModal);
  btnCancelEdit.addEventListener('click', closeModal);
  editForm.addEventListener('submit', saveLessonLocally);
  document.getElementById('btnSaveToGithub').addEventListener('click', saveToGithub);
});

/* ---------- Authentication ---------- */
function checkLogin() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const savedUser  = localStorage.getItem('gh_user');
  const savedRepo  = localStorage.getItem('gh_repo');
  const savedToken = localStorage.getItem('gh_token');

  if (savedUser && savedRepo && savedToken) {
    githubUser = savedUser;
    githubRepo = savedRepo;
    githubToken = savedToken;
    
    // Pre-fill form if visible
    document.getElementById('githubUser').value = githubUser;
    document.getElementById('githubRepo').value = githubRepo;
    document.getElementById('githubToken').value = githubToken;
  }

  if (isLoggedIn === 'true' && githubUser && githubRepo && githubToken) {
    showDashboard();
    fetchScheduleFromGithub();
  } else {
    showLogin();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  const user = document.getElementById('githubUser').value.trim();
  const repo = document.getElementById('githubRepo').value.trim();
  const token = document.getElementById('githubToken').value.trim();

  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    // Save GH credentials to localStorage for persistence
    localStorage.setItem('gh_user', user);
    localStorage.setItem('gh_repo', repo);
    localStorage.setItem('gh_token', token);
    githubUser = user;
    githubRepo = repo;
    githubToken = token;

    // Session login
    sessionStorage.setItem('isLoggedIn', 'true');
    loginError.style.display = 'none';
    showDashboard();
    fetchScheduleFromGithub();
  } else {
    showError('البريد الإلكتروني أو كلمة السر غير صحيحة');
  }
}

function logout() {
  sessionStorage.removeItem('isLoggedIn');
  showLogin();
}

function showLogin() {
  loginScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.style.display = 'block';
}

/* ---------- Data Management ---------- */
function fetchScheduleFromGithub() {
  lessonsList.innerHTML = '<p style="text-align:center;">جاري جلب البيانات...</p>';
  
  fetch(`https://api.github.com/repos/${githubUser}/${githubRepo}/contents/${FILE_PATH}`, {
    headers: { 
      'Authorization': `token ${githubToken}`,
      'If-None-Match': '' // Force fresh fetch
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.sha) currentSha = data.sha;
    
    // Decode base64 content
    const decodedContent = decodeURIComponent(escape(atob(data.content)));
    scheduleData = JSON.parse(decodedContent);
    renderLessons();
  })
  .catch(err => {
    console.error(err);
    lessonsList.innerHTML = '<p style="text-align:center;color:red;">حدث خطأ أثناء جلب البيانات. تأكد من أن ملف data/schedule.json موجود.</p>';
  });
}

function renderLessons() {
  lessonsList.innerHTML = '';
  if (scheduleData.length === 0) {
    lessonsList.innerHTML = '<p style="text-align:center;">القائمة فارغة، أضف درساً جديداً.</p>';
    return;
  }

  scheduleData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'lesson-item';
    card.innerHTML = `
      <div class="lesson-info">
        <span class="lesson-day">${item.day}</span>
        <h3>${item.title}</h3>
        <div style="color:var(--text-light); margin-bottom:8px; font-weight:bold;">${item.scholar || ''}</div>
        <div class="lesson-meta">
          <span>🕐 ${item.time}</span>
          <span>📍 ${item.location}</span>
        </div>
      </div>
      <div class="lesson-actions">
        <button class="btn btn-outline" onclick="editLesson(${index})">تعديل</button>
        <button class="btn btn-danger" onclick="deleteLesson(${index})">حذف</button>
      </div>
    `;
    lessonsList.appendChild(card);
  });
}

/* ---------- Modal Logic ---------- */
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'إضافة درس جديد';
  document.getElementById('editId').value = '';
  document.getElementById('editDay').value = 'السبت';
  document.getElementById('editTitle').value = '';
  document.getElementById('editScholar').value = '';
  document.getElementById('editTime').value = '';
  document.getElementById('editLocation').value = '';
  editModal.classList.add('active');
}

window.editLesson = function(index) {
  const item = scheduleData[index];
  document.getElementById('modalTitle').textContent = 'تعديل الدرس';
  document.getElementById('editId').value = index;
  document.getElementById('editDay').value = item.day;
  document.getElementById('editTitle').value = item.title;
  document.getElementById('editScholar').value = item.scholar || '';
  document.getElementById('editTime').value = item.time;
  document.getElementById('editLocation').value = item.location;
  editModal.classList.add('active');
}

window.deleteLesson = function(index) {
  if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
    scheduleData.splice(index, 1);
    renderLessons();
    showStatus('تم حذف الدرس محلياً. اضغط "حفظ ونشر" لتأكيد التغيير على الموقع.', 'success');
  }
}

function closeModal() {
  editModal.classList.remove('active');
}

function saveLessonLocally(e) {
  e.preventDefault();
  const idIndex = document.getElementById('editId').value;
  
  const newLesson = {
    id: Date.now().toString(), // unique id
    day: document.getElementById('editDay').value,
    title: document.getElementById('editTitle').value,
    scholar: document.getElementById('editScholar').value,
    time: document.getElementById('editTime').value,
    location: document.getElementById('editLocation').value
  };

  if (idIndex === '') {
    // Add new
    scheduleData.push(newLesson);
  } else {
    // Update existing (keep old id)
    newLesson.id = scheduleData[idIndex].id;
    scheduleData[idIndex] = newLesson;
  }

  closeModal();
  renderLessons();
  showStatus('تم تعديل القائمة محلياً. اضغط "حفظ ونشر" لتطبيق التغيير على الموقع.', 'success');
}

/* ---------- GitHub Saving ---------- */
function saveToGithub() {
  const btn = document.getElementById('btnSaveToGithub');
  btn.textContent = 'جاري الحفظ...';
  btn.disabled = true;

  const contentStr = JSON.stringify(scheduleData, null, 2);
  // Encode utf-8 to base64 properly
  const encodedContent = btoa(unescape(encodeURIComponent(contentStr)));

  const payload = {
    message: 'Update schedule from Admin CMS',
    content: encodedContent,
    sha: currentSha
  };

  fetch(`https://api.github.com/repos/${githubUser}/${githubRepo}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.content && data.content.sha) {
      currentSha = data.content.sha; // Update SHA for next edits
      showStatus('تم الحفظ بنجاح! سيتم تحديث الموقع خلال دقيقة واحدة.', 'success');
    } else {
      throw new Error(data.message || 'فشل الحفظ');
    }
  })
  .catch(err => {
    console.error(err);
    showStatus('حدث خطأ أثناء الحفظ. يرجى التأكد من الصلاحيات.', 'error');
  })
  .finally(() => {
    btn.textContent = '💾 حفظ التعديلات ونشرها';
    btn.disabled = false;
  });
}

function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg';
  statusMsg.classList.add(`status-${type}`);
  statusMsg.style.display = 'block';
  
  setTimeout(() => {
    statusMsg.style.display = 'none';
  }, 6000);
}
