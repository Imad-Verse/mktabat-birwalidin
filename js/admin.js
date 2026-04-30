// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDV2p2Fr1_hkVGwW42k3lmv1U09pU_53RQ",
  authDomain: "mktabat-birwalidin.firebaseapp.com",
  projectId: "mktabat-birwalidin",
  storageBucket: "mktabat-birwalidin.firebasestorage.app",
  messagingSenderId: "389831217733",
  appId: "1:389831217733:web:84df36125ac3a657e3092c",
  // Construct databaseURL as it's missing in some configs but required for RTDB
  databaseURL: "https://mktabat-birwalidin-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let siteData = {};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const statusMsg = document.getElementById('saveStatus');

let hasUnsavedChanges = false;
let quillEditor;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  quillEditor = new Quill('#schDescEditor', {
    theme: 'snow',
    placeholder: 'اكتب سيرة الشيخ هنا...',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'header': [1, 2, 3, false] }],
        [{ 'align': [] }],
        ['clean']
      ]
    }
  });

  // Authentication Logic with Firebase
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      showDashboard();
      fetchData();
      document.getElementById('connectionStatus').textContent = 'متصل بـ Firebase 🟢';
      document.getElementById('connectionStatus').className = 'badge badge-success';
    } else {
      showLogin();
      document.getElementById('connectionStatus').textContent = 'غير متصل 🔴';
      document.getElementById('connectionStatus').className = 'badge';
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const pass = document.getElementById('adminPass').value.trim();

    firebase.auth().signInWithEmailAndPassword(email, pass)
      .then(() => {
        loginError.style.display = 'none';
      })
      .catch((error) => {
        console.error("Auth Error:", error);
        loginError.textContent = 'خطأ في الدخول: ' + error.message;
        loginError.style.display = 'block';
      });
  });

  document.getElementById('btnLogout').addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
      showLogin();
    });
  });

  setupTabs();
  setupUnsavedWarning();

  // Handle Show All toggle
  const showAllCheck = document.getElementById('setBlogShowAll');
  if (showAllCheck) {
    showAllCheck.addEventListener('change', (e) => {
      document.getElementById('setBlogLimit').disabled = e.target.checked;
    });
  }

  // Settings Forms
  document.getElementById('articlesForm').addEventListener('submit', saveArticlesConfig);
  document.getElementById('socialsForm').addEventListener('submit', saveSocialsConfig);

  // Modals Openers
  document.getElementById('btnAddScholar').addEventListener('click', () => openModal('modalScholar', 'formScholar'));
  document.getElementById('btnAddVideo').addEventListener('click', () => openModal('modalVideo', 'formVideo'));
  document.getElementById('btnAddLesson').addEventListener('click', () => openModal('modalLesson', 'formLesson'));
  document.getElementById('btnAddBlogSection').addEventListener('click', () => openModal('modalBlogSection', 'formBlogSection'));

  // Modals Submit
  document.getElementById('formScholar').addEventListener('submit', saveScholar);
  document.getElementById('formVideo').addEventListener('submit', saveVideo);
  document.getElementById('formLesson').addEventListener('submit', saveLesson);
  document.getElementById('formBlogSection').addEventListener('submit', saveBlogSection);
});

function showLogin() { 
  loginScreen.style.display = 'flex'; 
  dashboardScreen.style.display = 'none'; 
}

function showDashboard() { 
  loginScreen.style.display = 'none'; 
  dashboardScreen.style.display = 'block'; 
}

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

/* ---------- Unsaved Changes Protection ---------- */
function setupUnsavedWarning() {
  const inputs = document.querySelectorAll('.modal-box form input, .modal-box form textarea, .modal-box form select');
  inputs.forEach(input => {
    input.addEventListener('input', () => { hasUnsavedChanges = true; });
  });

  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
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
    socials: { facebook: "#", youtube: "#", telegram: "#", whatsapp: "#", twitter: "#", instagram: "#", tiktok: "#", blog: "#" },
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
    document.getElementById('setBlogLimit').value = siteData.articles.limit || 6;
    document.getElementById('setBlogShowAll').checked = siteData.articles.showAll || false;
    document.getElementById('setBlogLimit').disabled = siteData.articles.showAll || false;
    document.getElementById('setBlogUseCover').checked = !!siteData.articles.useCoverOnly;
  }
  if (siteData.socials) {
    document.getElementById('socFacebook').value = siteData.socials.facebook || '';
    document.getElementById('socYoutube').value = siteData.socials.youtube || '';
    document.getElementById('socTelegram').value = siteData.socials.telegram || '';
    document.getElementById('socTwitter').value = siteData.socials.twitter || '';
    document.getElementById('socInstagram').value = siteData.socials.instagram || '';
    document.getElementById('socWhatsapp').value = siteData.socials.whatsapp || '';
    document.getElementById('socTiktok').value = siteData.socials.tiktok || '';
    document.getElementById('socBlog').value = siteData.socials.blog || '';
    document.getElementById('socFooterDesc').value = siteData.socials.footerDesc || 'منصة علمية دعوية تعليمية تُعنى بنشر العلوم الشرعية بمنهج أهل السنة والجماعة بأسلوب عصري مؤثر.';
    document.getElementById('socAddress').value = siteData.socials.address || 'الجزائر - ورقلة - الزيانية';
    document.getElementById('socMapLink').value = siteData.socials.mapLink || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3386.2054214308655!2d5.3382732!3d31.928179800000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x125d6b0015c4e813%3A0xbec51ecca4e79d08!2z2YXZg9iq2KjYqSDYqNixINin2YTZiNin2YTYr9mK2YY!5e0!3m2!1sar!2sdz!4v1777534218369!5m2!1sar!2sdz';
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
          <div class="list-meta">${stripHtml(s.desc).substring(0, 60)}...</div>
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
          <div class="list-meta">القسم: ${v.category || 'عام'} | ID: ${v.yt_id}</div>
        </div>
        <div class="list-actions">
          <button class="btn btn-outline btn-sm" onclick="editVideo('${v.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('videos', '${v.id}')">حذف</button>
        </div>
      </div>`;
  });

  // Update Category Datalist
  const catList = document.getElementById('videoCategoriesList');
  if (catList) {
    const cats = [...new Set(videosArr.map(v => v.category).filter(c => c))];
    catList.innerHTML = cats.map(c => `<option value="${c}">`).join('');
  }

  // Render Schedule
  const lList = document.getElementById('lessonsList');
  lList.innerHTML = '';
  const lessonsArr = objToArray(siteData.schedule);
  if (lessonsArr.length === 0) lList.innerHTML = '<p>لا توجد دروس حالياً.</p>';
  lessonsArr.forEach(l => {
    lList.innerHTML += `
      <div class="list-item">
        <div class="list-info">
          <span class="badge badge-success">${Array.isArray(l.day) ? l.day.join(' | ') : l.day}</span>
          <h3 style="margin-top:5px">${l.title}</h3>
          <div class="list-meta">👤 ${l.scholar} | 🕐 ${l.time}</div>
        </div>
        <div class="list-actions">
          <button class="btn btn-outline btn-sm" onclick="editLesson('${l.id}')">تعديل</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('schedule', '${l.id}')">حذف</button>
        </div>
      </div>`;
  });

  // Render Blogger Sections
  const bsList = document.getElementById('blogSectionsList');
  if (bsList) {
    bsList.innerHTML = '';
    const sectionsArr = objToArray(siteData.articles ? siteData.articles.sections : null);
    if (sectionsArr.length === 0) bsList.innerHTML = '<p>لم يتم إضافة أي أقسام مخصصة بعد.</p>';
    sectionsArr.forEach(s => {
      bsList.innerHTML += `
        <div class="list-item">
          <div class="list-info">
            <h3>${s.title}</h3>
            <div class="list-meta">الوسم: ${s.label || 'المدونة كاملة'}</div>
          </div>
          <div class="list-actions">
            <button class="btn btn-outline btn-sm" onclick="editBlogSection('${s.id}')">تعديل</button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('articles/sections', '${s.id}')">حذف</button>
          </div>
        </div>`;
    });
  }
}

function objToArray(obj) {
  if (!obj) return [];
  return Object.keys(obj).map(key => ({ id: key, ...obj[key] }));
}

/* ---------- Saving Operations ---------- */
function saveArticlesConfig(e) {
  e.preventDefault();
  let blogId = document.getElementById('setBlogId').value.trim();
  
  // Extract Blog ID from URL if provided (e.g., .../blog/posts/123456)
  if (blogId.includes('/blog/posts/')) {
    blogId = blogId.split('/blog/posts/')[1].split('/')[0].split('?')[0];
  } else if (blogId.includes('/blog/')) {
    blogId = blogId.split('/blog/')[1].split('/')[0].split('?')[0];
  }

  db.ref('articles').update({
    blogId: blogId,
    limit: parseInt(document.getElementById('setBlogLimit').value) || 6,
    showAll: document.getElementById('setBlogShowAll').checked,
    useCoverOnly: document.getElementById('setBlogUseCover').checked
  }).then(() => {
    document.getElementById('setBlogId').value = blogId; // Show cleaned ID
    showStatus('تم حفظ الإعدادات العامة لـ Blogger', 'success');
  });
}

function saveBlogSection(e) {
  e.preventDefault();
  const id = document.getElementById('bsId').value || Date.now().toString();
  let labelInput = document.getElementById('bsLabel').value.trim();
  
  // Extract label if URL is provided
  if (labelInput.includes('/search/label/')) {
    labelInput = decodeURIComponent(labelInput.split('/search/label/')[1].split('?')[0].split('#')[0]);
  } else if (labelInput.includes('http')) {
    labelInput = "";
  }

  db.ref('articles/sections/' + id).set({
    title: document.getElementById('bsTitle').value.trim(),
    label: labelInput,
    useCoverOnly: document.getElementById('bsUseCover').checked
  })
  .then(() => { closeModal('modalBlogSection'); showStatus('تم حفظ القسم بنجاح', 'success'); })
  .catch(err => { showStatus('فشل الحفظ: ' + err.message, 'error'); });
}

function saveSocialsConfig(e) {
  e.preventDefault();
  db.ref('socials').set({
    facebook: document.getElementById('socFacebook').value.trim(),
    youtube: document.getElementById('socYoutube').value.trim(),
    telegram: document.getElementById('socTelegram').value.trim(),
    twitter: document.getElementById('socTwitter').value.trim(),
    instagram: document.getElementById('socInstagram').value.trim(),
    tiktok: document.getElementById('socTiktok').value.trim(),
    blog: document.getElementById('socBlog').value.trim(),
    whatsapp: formatWhatsapp(document.getElementById('socWhatsapp').value.trim()),
    footerDesc: document.getElementById('socFooterDesc').value.trim(),
    address: document.getElementById('socAddress').value.trim(),
    mapLink: extractMapSrc(document.getElementById('socMapLink').value.trim())
  })
  .then(() => showStatus('تم حفظ الإعدادات بنجاح', 'success'))
  .catch(err => { 
    console.error(err); 
    showStatus('فشل الحفظ: ' + err.message, 'error'); 
  });
}

function saveScholar(e) {
  e.preventDefault();
  const id = document.getElementById('schId').value || Date.now().toString();
  const fileInput = document.getElementById('schImgFile');
  const file = fileInput ? fileInput.files[0] : null;

  const saveScholarData = (imageUrl) => {
    db.ref('scholars/' + id).set({
      name: document.getElementById('schName').value,
      desc: quillEditor.root.innerHTML,
      image: imageUrl || document.getElementById('schImg').value,
      facebook: document.getElementById('schFb').value,
      telegram: document.getElementById('schTg').value,
      twitter: document.getElementById('schX').value,
      instagram: document.getElementById('schIg').value,
      youtube: document.getElementById('schYt').value,
      tiktok: document.getElementById('schTt').value,
      blog: document.getElementById('schBlog').value,
      whatsapp: formatWhatsapp(document.getElementById('schWa').value.trim())
    })
    .then(() => { closeModal('modalScholar'); showStatus('تم حفظ الشيخ', 'success'); })
    .catch(err => { 
      console.error(err); 
      alert('فشل الحفظ: ' + err.message);
      showStatus('فشل الحفظ: ' + err.message, 'error'); 
    });
  };

  if (file) {
    showStatus('جاري رفع الصورة...', 'success');
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child('scholars/' + Date.now() + '_' + file.name);
    fileRef.put(file).then((snapshot) => {
      return snapshot.ref.getDownloadURL();
    }).then((downloadURL) => {
      saveScholarData(downloadURL);
    }).catch((error) => {
      alert('فشل رفع الصورة: ' + error.message);
      showStatus('فشل رفع الصورة', 'error');
    });
  } else {
    saveScholarData('');
  }
}

function saveVideo(e) {
  e.preventDefault();
  const id = document.getElementById('vidId').value || Date.now().toString();
  const rawYtId = document.getElementById('vidYtId').value.trim();
  const finalYtId = extractYoutubeId(rawYtId);

  if (!finalYtId) {
    alert('رابط اليوتيوب غير صالح. يرجى التأكد من الرابط أو المعرف.');
    return;
  }

  db.ref('videos/' + id).set({
    title: document.getElementById('vidTitle').value,
    yt_id: finalYtId,
    category: document.getElementById('vidCategory').value.trim()
  })
  .then(() => { closeModal('modalVideo'); showStatus('تم حفظ الفيديو', 'success'); })
  .catch(err => { 
    console.error(err); 
    alert('فشل الحفظ: ' + err.message);
    showStatus('فشل الحفظ: ' + err.message, 'error'); 
  });
}

function saveLesson(e) {
  e.preventDefault();
  const id = document.getElementById('lesId').value || Date.now().toString();
  
  // Collect selected days
  const checkedDays = Array.from(document.querySelectorAll('input[name="lesDay"]:checked')).map(cb => cb.value);
  
  if (checkedDays.length === 0) {
    alert('يرجى اختيار يوم واحد على الأقل.');
    return;
  }

  db.ref('schedule/' + id).set({
    day: checkedDays, // Now saving as an array
    title: document.getElementById('lesTitle').value,
    scholar: document.getElementById('lesScholar').value,
    time: document.getElementById('lesTime').value,
    location: document.getElementById('lesLocation').value
  })
  .then(() => { closeModal('modalLesson'); showStatus('تم حفظ الدرس', 'success'); })
  .catch(err => { 
    console.error(err); 
    alert('فشل الحفظ: ' + err.message);
    showStatus('فشل الحفظ: ' + err.message, 'error'); 
  });
}

window.editVideo = function(id) {
  const v = siteData.videos[id];
  document.getElementById('vidId').value = id;
  document.getElementById('vidTitle').value = v.title || '';
  document.getElementById('vidYtId').value = v.yt_id || '';
  document.getElementById('vidCategory').value = v.category || '';
  document.getElementById('mvTitle').textContent = 'تعديل فيديو';
  document.getElementById('modalVideo').classList.add('active');
}

window.deleteItem = function(path, id) {
  if (confirm('هل أنت متأكد من الحذف؟')) {
    db.ref(path + '/' + id).remove()
      .then(() => showStatus('تم الحذف بنجاح', 'success'))
      .catch(err => { 
        console.error(err); 
        alert('فشل الحذف: ' + err.message);
        showStatus('فشل الحذف: ' + err.message, 'error'); 
      });
  }
}

/* ---------- Modals & Editing ---------- */
window.openModal = function(modalId, formId) {
  document.getElementById(formId).reset();
  const hiddenInput = document.getElementById(formId).querySelector('input[type="hidden"]');
  if (hiddenInput) hiddenInput.value = '';
  
  if (modalId === 'modalScholar' && quillEditor) {
    quillEditor.root.innerHTML = '';
  }
  
  document.getElementById(modalId).classList.add('active');
}

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
  hasUnsavedChanges = false;
}

window.editScholar = function(id) {
  const s = siteData.scholars[id];
  document.getElementById('schId').value = id;
  document.getElementById('schName').value = s.name || '';
  if (quillEditor) quillEditor.root.innerHTML = s.desc || '';
  document.getElementById('schImg').value = s.image || '';
  const fileInput = document.getElementById('schImgFile');
  if (fileInput) fileInput.value = '';
  document.getElementById('schFb').value = s.facebook || '';
  document.getElementById('schTg').value = s.telegram || '';
  document.getElementById('schX').value = s.twitter || '';
  document.getElementById('schIg').value = s.instagram || '';
  document.getElementById('schYt').value = s.youtube || '';
  document.getElementById('schTt').value = s.tiktok || '';
  document.getElementById('schBlog').value = s.blog || '';
  document.getElementById('schWa').value = s.whatsapp || '';
  document.getElementById('modalScholar').classList.add('active');
}

window.editLesson = function(id) {
  const l = siteData.schedule[id];
  document.getElementById('lesId').value = id;
  
  // Restore checkboxes
  const days = Array.isArray(l.day) ? l.day : [l.day];
  document.querySelectorAll('input[name="lesDay"]').forEach(cb => {
    cb.checked = days.includes(cb.value);
  });

  document.getElementById('lesTitle').value = l.title || '';
  document.getElementById('lesScholar').value = l.scholar || '';
  document.getElementById('lesTime').value = l.time || '';
  document.getElementById('lesLocation').value = l.location || '';
  document.getElementById('modalLesson').classList.add('active');
}

window.editBlogSection = function(id) {
  const s = siteData.articles.sections[id];
  document.getElementById('bsId').value = id;
  document.getElementById('bsTitle').value = s.title || '';
  document.getElementById('bsLabel').value = s.label || '';
  document.getElementById('bsUseCover').checked = !!s.useCoverOnly;
  document.getElementById('mbsTitle').textContent = 'تعديل قسم مقالات';
  document.getElementById('modalBlogSection').classList.add('active');
}

/* ---------- UI Helpers ---------- */
function formatWhatsapp(val) {
  if (!val) return "";
  // If it's already a link, return as is
  if (val.includes('http') || val.includes('wa.me')) return val;
  // If it's just numbers, prepend wa.me (remove spaces/pluses)
  const clean = val.replace(/\D/g, '');
  return `https://wa.me/${clean}`;
}

function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg';
  statusMsg.classList.add(`status-${type}`);
  statusMsg.style.display = 'block';
  setTimeout(() => { statusMsg.style.display = 'none'; }, 4000);
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function extractYoutubeId(input) {
  if (!input) return "";
  // If it's already an 11-char ID and no special characters
  if (input.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  
  // Regex for various YouTube URL formats
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = input.match(regex);
  return match ? match[1] : "";
}

function extractMapSrc(input) {
  if (!input) return "";
  // If it's a full iframe tag, extract the src
  if (input.includes('<iframe')) {
    const match = input.match(/src="([^"]+)"/);
    return match ? match[1] : input;
  }
  return input;
}
