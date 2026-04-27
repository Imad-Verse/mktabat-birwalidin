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
  console.log("جاري الاتصال بـ Firebase...");
  // Fetch everything from Firebase once
  db.ref('/').once('value').then((snapshot) => {
    if(snapshot.exists()){
      siteData = snapshot.val();
      console.log("تم جلب البيانات بنجاح:", siteData);
      renderSite();
    } else {
      console.warn("قاعدة البيانات فارغة تماماً.");
    }
  }).catch(error => {
    console.error("خطأ في جلب البيانات:", error);
  });

  setupMobileMenu();
  setupScrollSpy();
  setupModals();
  setupScrollToTop();
  setupSearch();
});

function setupSearch() {
  const searchScholars = document.getElementById('searchScholars');
  if (searchScholars) {
    searchScholars.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('#scholarsGrid .scholar-card').forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = name.includes(term) ? 'flex' : 'none';
      });
    });
  }

  const searchVideos = document.getElementById('searchVideos');
  if (searchVideos) {
    searchVideos.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('#videosGrid .video-card').forEach(card => {
        const title = card.querySelector('.video-info h3').textContent.toLowerCase();
        card.style.display = title.includes(term) ? 'block' : 'none';
      });
    });
  }
}

function setupModals() {
  const modal = document.getElementById('scholarModal');
  const closeBtn = document.getElementById('modalClose');
  if (modal && closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  const vModal = document.getElementById('videoModal');
  const vCloseBtn = document.getElementById('videoModalClose');
  if (vModal && vCloseBtn) {
    const closeVideo = () => {
      vModal.classList.remove('active');
      vModal.setAttribute('aria-hidden', 'true');
      document.getElementById('videoContainer').innerHTML = ''; // Stop video
    };
    vCloseBtn.addEventListener('click', closeVideo);
    vModal.addEventListener('click', (e) => {
      if (e.target === vModal) closeVideo();
    });
  }
}

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
  if(whatsapp) {
    if (document.getElementById('hero-wa')) document.getElementById('hero-wa').href = whatsapp;
    if (document.getElementById('footer-wa')) document.getElementById('footer-wa').href = whatsapp;
  }
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
  if (!modal) return;

  document.getElementById('modalImg').src = scholar.image;
  document.getElementById('modalName').textContent = scholar.name;
  document.getElementById('modalBio').innerHTML = scholar.desc;
  
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
    wrapper.addEventListener('click', () => openVideoModal(v.yt_id));
  });
}

function openVideoModal(ytId) {
  const modal = document.getElementById('videoModal');
  const container = document.getElementById('videoContainer');
  if (!modal || !container) return;
  container.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  modal.classList.add('active');
  modal.removeAttribute('aria-hidden');
}

/* ---------- 4. Articles (Blogger) ---------- */
function renderBloggerArticles() {
  const cfg = siteData.articles;
  const grid = document.getElementById('articlesGrid');
  const tabsContainer = document.getElementById('articlesTabs');
  if (!grid || !tabsContainer) return;

  if (!cfg || !cfg.enabled) {
    const section = grid.closest('section');
    if (section) section.style.display = 'none';
    return;
  }

  if (!cfg.blogId) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;text-align:center;">يرجى ضبط معرف المدونة في لوحة التحكم لعرض المقالات.</p>';
    return;
  }

  const sections = objToArray(cfg.sections);
  
  if (sections.length === 0) {
    // If no sections, fetch default (all posts)
    fetchLabelPosts(cfg.blogId, "", cfg.showAll ? 500 : (cfg.limit || 6));
    tabsContainer.style.display = 'none';
  } else {
    tabsContainer.style.display = 'flex';
    tabsContainer.innerHTML = '';
    
    // Add "All" tab as default
    const allBtn = document.createElement('button');
    allBtn.className = 'art-tab-btn active';
    allBtn.textContent = 'الكل';
    allBtn.onclick = () => {
      document.querySelectorAll('.art-tab-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      fetchLabelPosts(cfg.blogId, "", cfg.showAll ? 500 : (cfg.limit || 6), cfg.useCoverOnly);
    };
    tabsContainer.appendChild(allBtn);

    sections.forEach((s) => {
      const btn = document.createElement('button');
      btn.className = 'art-tab-btn';
      btn.textContent = s.title;
      btn.onclick = () => {
        document.querySelectorAll('.art-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchLabelPosts(cfg.blogId, s.label, cfg.showAll ? 500 : (cfg.limit || 6), s.useCoverOnly);
      };
      tabsContainer.appendChild(btn);
    });

    // Load "All" section by default
    fetchLabelPosts(cfg.blogId, "", cfg.showAll ? 500 : (cfg.limit || 6), cfg.useCoverOnly);
  }
}

let currentArticles = [];

function fetchLabelPosts(blogId, label, limit, useCover) {
  const grid = document.getElementById('articlesGrid');
  grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;text-align:center;padding:50px;">جاري التحميل...</div>';
  
  const oldScript = document.getElementById('blogger-jsonp');
  if (oldScript) oldScript.remove();

  const callbackName = 'blogger_cb_' + Math.floor(Math.random() * 1000000);
  
  window[callbackName] = function(data) {
    grid.innerHTML = '';
    const entries = data.feed.entry;
    currentArticles = entries || [];
    
    if (!entries || entries.length === 0) {
      grid.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;text-align:center;padding:40px;">لا توجد مقالات في هذا القسم حالياً.</p>';
      return;
    }

    entries.forEach((entry, idx) => {
      try {
        const title = entry.title.$t;
        const altLink = entry.link.find(l => l.rel === 'alternate');
        const link = altLink ? altLink.href : '#';
        const dateStr = entry.published ? entry.published.$t : new Date().toISOString();
        const date = new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        const content = (entry.content && entry.content.$t) ? entry.content.$t : 
                        ((entry.summary && entry.summary.$t) ? entry.summary.$t : '');
        
        let img = 'cover.png';
        if (!useCover) {
          img = getFirstImage(content);
        }

        const card = `
          <article class="article-card fade-up visible">
            <div class="article-img" onclick="openArticle(${idx})">
              <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='cover.png'">
            </div>
            <div class="article-body">
              <span class="article-date">${date}</span>
              <h3 class="article-title"><a href="javascript:void(0)" onclick="openArticle(${idx})">${title}</a></h3>
              <p class="article-excerpt">${stripHtml(content).substring(0, 100)}...</p>
              <a href="javascript:void(0)" onclick="openArticle(${idx})" class="read-more">اقرأ المزيد ←</a>
            </div>
          </article>
        `;
        grid.innerHTML += card;
      } catch (e) {
        console.error("Error parsing entry:", e);
      }
    });
    delete window[callbackName];
  };

  const labelPart = label ? `/-/${encodeURIComponent(label)}` : '';
  const url = `https://www.blogger.com/feeds/${blogId}/posts/default${labelPart}?alt=json-in-script&callback=${callbackName}&max-results=${limit}&orderby=published`;
  
  const script = document.createElement('script');
  script.id = 'blogger-jsonp';
  script.src = url;
  script.onerror = function() {
    grid.innerHTML = '<p class="error-msg" style="grid-column: 1/-1;text-align:center;padding:40px;">فشل الاتصال بخوادم جوجل. يرجى التأكد من اتصال الإنترنت.</p>';
  };
  document.body.appendChild(script);
}

function openArticle(index) {
  const entry = currentArticles[index];
  if (!entry) return;

  const title = entry.title.$t;
  const content = (entry.content && entry.content.$t) ? entry.content.$t : 
                  ((entry.summary && entry.summary.$t) ? entry.summary.$t : '');
  const dateStr = entry.published ? entry.published.$t : new Date().toISOString();
  const date = new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const altLink = entry.link.find(l => l.rel === 'alternate');
  const link = altLink ? altLink.href : '#';
  const img = getFirstImage(content);

  document.getElementById('artModalTitle').textContent = title;
  document.getElementById('artModalDate').textContent = date;
  document.getElementById('artModalContent').innerHTML = content;
  document.getElementById('artModalImg').src = img;
  document.getElementById('artModalLink').href = link;

  const modal = document.getElementById('articleModal');
  modal.classList.add('active');
  modal.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
}

// Close Art Modal
document.getElementById('articleModalClose')?.addEventListener('click', closeArticleModal);
document.getElementById('articleModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'articleModal') closeArticleModal();
});

function closeArticleModal() {
  const modal = document.getElementById('articleModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
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

  grid.innerHTML = '';
  
  // Prepare lessons for display (handling multiple days)
  let displayLessons = [];
  lessons.forEach(l => {
    if (Array.isArray(l.day)) {
      l.day.forEach(d => displayLessons.push({ ...l, day: d }));
    } else {
      displayLessons.push(l);
    }
  });

  const order = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','يومياً'];
  
  displayLessons.sort((a, b) => {
    const dayDiff = order.indexOf(a.day) - order.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });

  displayLessons.forEach(lesson => {
    const card = document.createElement('div');
    card.className = 'schedule-card fade-up visible';
    card.innerHTML = `
      <span class="schedule-day">${lesson.day}</span>
      <h3>${lesson.title}</h3>
      <div class="schedule-meta">
        <span>👤 ${lesson.scholar}</span>
        <span>🕐 ${lesson.time}</span>
        <span>📍 ${lesson.location}</span>
      </div>
    `;
    grid.appendChild(card);
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

function setupScrollToTop() {
  const scrollTopBtn = document.getElementById('scrollTop');
  if (!scrollTopBtn) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.style.opacity = '1';
      scrollTopBtn.style.visibility = 'visible';
    } else {
      scrollTopBtn.style.opacity = '0';
      scrollTopBtn.style.visibility = 'hidden';
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
