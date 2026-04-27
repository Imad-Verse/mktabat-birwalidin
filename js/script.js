// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDV2p2Fr1_hkVGwW42k3lmv1U09pU_53RQ",
  authDomain: "mktabat-birwalidin.firebaseapp.com",
  projectId: "mktabat-birwalidin",
  storageBucket: "mktabat-birwalidin.firebasestorage.app",
  messagingSenderId: "389831217733",
  appId: "1:389831217733:web:84df36125ac3a657e3092c",
  databaseURL: "https://mktabat-birwalidin-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let siteData = {};

document.addEventListener('DOMContentLoaded', () => {
  // Fetch everything from Firebase once
  db.ref('/').once('value').then((snapshot) => {
    if(snapshot.exists()){
      siteData = snapshot.val();
      renderSite();
    } else {
      console.warn("No data found in Firebase.");
    }
  }).catch(error => {
    console.error("Error fetching data:", error);
  });

  setupMobileMenu();
  setupScrollSpy();
});

function renderSite() {
  renderSocials();
  renderScholars();
  renderVideos();
  renderBloggerArticles();
  renderSchedule();
}

function objToArray(obj) {
  if (!obj) return [];
  return Object.keys(obj).map(key => ({ id: key, ...obj[key] }));
}

/* ---------- 1. Social Links ---------- */
function renderSocials() {
  if (!siteData.socials) return;
  const { facebook, youtube, telegram, whatsapp } = siteData.socials;
  
  if(facebook && document.getElementById('hero-fb')) document.getElementById('hero-fb').href = facebook;
  if(youtube && document.getElementById('hero-yt')) document.getElementById('hero-yt').href = youtube;
  if(telegram && document.getElementById('hero-tg')) document.getElementById('hero-tg').href = telegram;
  if(whatsapp && document.getElementById('hero-wa')) document.getElementById('hero-wa').href = whatsapp;
}

/* ---------- 2. Scholars ---------- */
function renderScholars() {
  const grid = document.getElementById('scholarsGrid');
  if (!grid) return;
  
  const scholars = objToArray(siteData.scholars);
  if (scholars.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1;text-align:center;">جاري إضافة المشايخ...</p>';
    return;
  }

  grid.innerHTML = '';
  scholars.forEach(s => {
    const card = document.createElement('div');
    card.className = 'scholar-card fade-up visible';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.innerHTML = `
      <img src="${s.image}" alt="${s.name}" loading="lazy" width="120" height="120" onerror="this.src='logo.png'">
      <h3>${s.name}</h3>
      <span class="scholar-btn" aria-hidden="true">المزيد ←</span>
    `;
    card.addEventListener('click', () => openScholarModal(s));
    grid.appendChild(card);
  });
}

function openScholarModal(scholar) {
  let modal = document.getElementById('scholarModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'scholarModal';
    modal.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" id="modalClose" aria-label="إغلاق النافذة">×</button>
        <div class="modal-header">
          <img src="" id="modalImg" alt="" width="100" height="100">
          <h2 id="modal-title"></h2>
        </div>
        <div class="modal-body">
          <p id="modalBio"></p>
          <div class="modal-socials" id="modalSocials"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('modalClose').addEventListener('click', () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  document.getElementById('modalImg').src = scholar.image;
  document.getElementById('modal-title').textContent = scholar.name;
  document.getElementById('modalBio').textContent = scholar.desc;
  
  const sContainer = document.getElementById('modalSocials');
  sContainer.innerHTML = '';
  if(scholar.facebook) sContainer.innerHTML += `<a href="${scholar.facebook}" aria-label="فيسبوك"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"/></svg></a>`;
  if(scholar.youtube) sContainer.innerHTML += `<a href="${scholar.youtube}" aria-label="يوتيوب"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg></a>`;
  if(scholar.telegram) sContainer.innerHTML += `<a href="${scholar.telegram}" aria-label="تلغرام"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M11.9 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.6 8.2l-1.8 8.7c-.1.6-.5.8-1 .5l-2.8-2-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.8l10.5-4c.5-.2.9.1.8.8z"/></svg></a>`;
  if(scholar.whatsapp) sContainer.innerHTML += `<a href="${scholar.whatsapp}" aria-label="واتساب"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4l-2.4-1.2c-.3-.1-.6-.1-.8.2l-.8 1c-.2.2-.4.3-.7.1-1.6-.8-2.9-1.9-3.8-3.4-.2-.3-.1-.5.1-.7l.7-.7c.2-.2.2-.4.1-.6L8.6 6.5c-.2-.4-.5-.4-.8-.4h-.7c-.3 0-.7.1-1 .4-.4.4-1.3 1.3-1.3 3.1s1.4 3.6 1.6 3.8c.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.7.3-.9.3-1.6.2-1.7-.1-.2-.4-.3-.7-.4zM12 21.8A9.9 9.9 0 012.2 12 9.8 9.8 0 0112 2.2 9.9 9.9 0 0121.8 12 9.9 9.9 0 0112 21.8zM12 0A12 12 0 001.2 18.4L0 24l5.7-1.5A12 12 0 0012 24 12 12 0 0012 0z"/></svg></a>`;

  modal.classList.add('active');
  modal.removeAttribute('aria-hidden');
}

/* ---------- 3. Videos ---------- */
function renderVideos() {
  const grid = document.getElementById('videosGrid');
  if (!grid) return;

  const videos = objToArray(siteData.videos);
  if(videos.length === 0) return;

  grid.innerHTML = '';
  videos.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card fade-up visible';
    const thumb = `https://img.youtube.com/vi/${v.yt_id}/hqdefault.jpg`;
    
    card.innerHTML = `
      <div class="video-wrapper" data-yt="${v.yt_id}" role="button" tabindex="0" aria-label="${v.title}" style="background-image:url('${thumb}');background-size:cover;background-position:center">
      </div>
      <div class="video-info"><h3>${v.title}</h3></div>
    `;
    grid.appendChild(card);

    const wrapper = card.querySelector('.video-wrapper');
    wrapper.addEventListener('click', () => loadYouTube(wrapper));
  });
}

function loadYouTube(wrapper) {
  const videoId = wrapper.getAttribute('data-yt');
  if (!videoId || wrapper.querySelector('iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('allow', 'autoplay; encrypted-media');
  iframe.loading = 'lazy';
  wrapper.style.cursor = 'default';
  wrapper.innerHTML = '';
  wrapper.appendChild(iframe);
}

/* ---------- 4. Articles (Blogger) ---------- */
function renderBloggerArticles() {
  const cfg = siteData.articles;
  if (!cfg || !cfg.enabled || !cfg.blogId) return;

  const grid = document.getElementById('articlesGrid');
  if (!grid) return;

  const url = `https://www.blogger.com/feeds/${cfg.blogId}/posts/default/-/${encodeURIComponent(cfg.label)}?alt=json&max-results=${cfg.limit}`;
  
  fetch(url)
    .then(r => r.json())
    .then(data => {
      const entries = data.feed.entry;
      if (!entries) return;
      grid.innerHTML = '';
      
      entries.forEach(entry => {
        const title = entry.title.$t;
        const content = entry.content ? entry.content.$t : '';
        const excerpt = stripHtml(content).substring(0, 120) + '...';
        const image = getFirstImage(content);
        const link = entry.link.find(l => l.rel === 'alternate');
        const href = link ? link.href : '#';

        grid.innerHTML += `
          <article class="article-card fade-up visible">
            <div class="article-img"><img src="${image}" alt="${title}" loading="lazy" width="400" height="200" onerror="this.src='cover.png'"></div>
            <div class="article-body">
              <span class="article-label">${cfg.label}</span>
              <h3>${title}</h3>
              <p>${excerpt}</p>
              <a href="${href}" class="read-more" target="_blank" rel="noopener">اقرأ المقال ←</a>
            </div>
          </article>
        `;
      });
    }).catch(err => console.log('Blogger Error:', err));
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
function getFirstImage(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : 'cover.png';
}

/* ---------- 5. Schedule ---------- */
function renderSchedule() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;

  const lessons = objToArray(siteData.schedule);
  if (lessons.length === 0) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;text-align:center;">جاري إعداد جدول الدروس...</p>';
    return;
  }

  // Group by day
  const grouped = {};
  lessons.forEach(l => {
    if (!grouped[l.day]) grouped[l.day] = [];
    grouped[l.day].push(l);
  });

  const order = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','يومياً'];
  grid.innerHTML = '';

  order.forEach(day => {
    if (grouped[day]) {
      const col = document.createElement('div');
      col.className = 'schedule-col fade-up visible';
      let html = `<h3>${day}</h3>`;
      grouped[day].forEach(lesson => {
        html += `
          <div class="lesson-card">
            <h4>${lesson.title}</h4>
            <div class="lesson-meta">
              <p><span>👤</span> ${lesson.scholar}</p>
              <p><span>🕐</span> ${lesson.time}</p>
              <p><span>📍</span> ${lesson.location}</p>
            </div>
          </div>
        `;
      });
      col.innerHTML = html;
      grid.appendChild(col);
    }
  });
}

/* ---------- Global UI Interactions ---------- */
function setupMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}

function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    for (let i = sections.length - 1; i >= 0; i--) {
      const top = sections[i].offsetTop;
      if (scrollY >= top) {
        navItems.forEach(n => n.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links a[href="#${sections[i].id}"]`);
        if (activeLink) activeLink.classList.add('active');
        break;
      }
    }
  }, { passive: true });
}
