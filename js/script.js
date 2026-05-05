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
let currentVideoPage = 1;
const videosPerPage = 6;
let currentVideoCategory = "الكل";
let currentArticlePage = 1;
const articlesPerPage = 3;
let currentSchedulePage = 1;
const schedulePerPage = 9;
let articlesConfig = { useCover: false }; // To share with pagination

document.addEventListener('DOMContentLoaded', () => {
  console.log("جاري الاتصال بـ Firebase...");
  // Fetch everything from Firebase once
  // Fetch everything from Firebase and listen for changes
  db.ref('/').on('value', (snapshot) => {
    if(snapshot.exists()){
      siteData = snapshot.val();
      console.log("تم تحديث البيانات:", siteData);
      renderSite();
    } else {
      console.warn("قاعدة البيانات فارغة تماماً.");
    }
  }, (error) => {
    console.error("خطأ في جلب البيانات:", error);
  });

  setupMobileMenu();
  setupScrollSpy();
  setupModals();
  setupScrollToTop();
  setupSearch();
  setupAdminAccess();
  setupFadeAnimations();
  trackVisitor();
});

function trackVisitor() {
  const visitsRef = db.ref('stats/visits');
  
  if (!localStorage.getItem('hasVisited')) {
    // Mark as pending immediately to prevent rapid reload spam
    localStorage.setItem('hasVisited', 'pending');
    
    visitsRef.transaction((current_value) => {
      return (current_value || 0) + 1;
    }, (error, committed, snapshot) => {
      if (error) {
        console.error('Visitor tracking transaction failed!', error);
        // Keep marked as visited even on error to prevent infinite retries on permission denied
        localStorage.setItem('hasVisited', 'true');
      } else if (committed) {
        localStorage.setItem('hasVisited', 'true');
      }
    });
  }
}

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
      const allVideos = objToArray(siteData.videos);
      const filtered = allVideos.filter(v => v.title.toLowerCase().includes(term));
      currentVideoPage = 1; // Reset to page 1 on search
      renderVideos(filtered);
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
  renderVideoTabs();
  renderBloggerArticles();
  renderSchedule();
  
  // Update visitor count
  const visitCountEl = document.getElementById('visitCount');
  if (visitCountEl) {
    const count = (siteData.stats && siteData.stats.visits) ? siteData.stats.visits : 0;
    visitCountEl.textContent = count.toLocaleString('ar-SA');
  }
}

function objToArray(obj) {
  if (!obj) return [];
  return Object.keys(obj).map(key => ({ id: key, ...obj[key] }));
}

/* ---------- 1. Social Links ---------- */
function renderSocials() {
  if (!siteData.socials) return;
  const { facebook, youtube, telegram, whatsapp, twitter, instagram, tiktok, blog } = siteData.socials;
  
  if(facebook && document.getElementById('hero-fb')) document.getElementById('hero-fb').href = facebook;
  if(youtube && document.getElementById('hero-yt')) document.getElementById('hero-yt').href = youtube;
  if(telegram && document.getElementById('hero-tg')) document.getElementById('hero-tg').href = telegram;
  if(twitter && document.getElementById('hero-x')) document.getElementById('hero-x').href = twitter;
  if(instagram && document.getElementById('hero-ig')) document.getElementById('hero-ig').href = instagram;
  if(tiktok && document.getElementById('hero-tt')) document.getElementById('hero-tt').href = tiktok;
  if(blog && document.getElementById('hero-blog')) document.getElementById('hero-blog').href = blog;
  if(whatsapp) {
    if (document.getElementById('hero-wa')) document.getElementById('hero-wa').href = whatsapp;
    if (document.getElementById('footer-wa')) document.getElementById('footer-wa').href = whatsapp;
  }
  
  // Footer Description
  const fDesc = document.getElementById('footerDesc');
  if (fDesc) {
    fDesc.textContent = (siteData.socials && siteData.socials.footerDesc) 
      ? siteData.socials.footerDesc 
      : 'منصة علمية دعوية تعليمية تُعنى بنشر العلوم الشرعية بمنهج أهل السنة والجماعة بأسلوب عصري مؤثر.';
  }

  // Footer Address
  const fAddr = document.getElementById('footerAddress');
  if (fAddr) {
    fAddr.textContent = (siteData.socials && siteData.socials.address)
      ? siteData.socials.address
      : 'الجزائر - ورقلة - الزيانية';
  }

  // Footer Map
  const fMap = document.getElementById('footerMap');
  if (fMap && siteData.socials && siteData.socials.mapLink) {
    fMap.src = siteData.socials.mapLink;
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
      <img src="${s.image}" alt="${s.name}" loading="lazy" width="120" height="120" onerror="this.src='assets/images/logo.png'">
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

  document.getElementById('modalImg').src = scholar.image || 'assets/images/logo.png';
  document.getElementById('modalName').textContent = scholar.name;
  document.getElementById('modalBio').innerHTML = scholar.desc;
  
  const sContainer = document.getElementById('modalSocials');
  sContainer.innerHTML = '';
  if(scholar.facebook) sContainer.innerHTML += `<a href="${scholar.facebook}" target="_blank" rel="noopener" aria-label="فيسبوك"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"/></svg></a>`;
  if(scholar.telegram) sContainer.innerHTML += `<a href="${scholar.telegram}" target="_blank" rel="noopener" aria-label="تلغرام"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M11.9 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.6 8.2l-1.8 8.7c-.1.6-.5.8-1 .5l-2.8-2-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.8l10.5-4c.5-.2.9.1.8.8z"/></svg></a>`;
  if(scholar.twitter) sContainer.innerHTML += `<a href="${scholar.twitter}" target="_blank" rel="noopener" aria-label="تويتر"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M18.9 2H22l-6.8 7.7L23 22h-6.3l-4.9-6.4L6.1 22H3l7.2-8.2L2.7 2h6.5l4.5 6 5.2-6zm-1.1 18.2h1.7L7.4 3.8H5.6l12.2 16.4z"/></svg></a>`;
  if(scholar.instagram) sContainer.innerHTML += `<a href="${scholar.instagram}" target="_blank" rel="noopener" aria-label="انستغرام"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.1c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.5-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5 1.3-.1 1.7-.1 4.9-.1M12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6 3.3.9 2.6 1.3 2 2s-1.1 1.3-1.4 2.1c-.3.8-.5 1.7-.6 2.9C0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.3 2.2.6 3.1.3.8.7 1.5 1.4 2.1.7.7 1.3 1.1 2.1 1.4.8.3 1.8.5 3 .6 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c1.3-.1 2.2-.3 3.1-.6.8-.3 1.5-.7 2.1-1.4.7-.7 1.1-1.3 1.4-2.1.3-.8.5-1.7.6-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.3-2.2-.6-3.1-.3-.8-.7-1.5-1.4-2.1-.7-.7-1.3-1.1-2.1-1.4-.8-.3-1.8-.5-3-.6C15.7 0 15.3 0 12 0z"/><path d="M12 5.8c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2-2.8-6.2-6.2-6.2zm0 10.2c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/><circle cx="18.4" cy="5.6" r="1.4"/></svg></a>`;
  if(scholar.youtube) sContainer.innerHTML += `<a href="${scholar.youtube}" target="_blank" rel="noopener" aria-label="يوتيوب"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg></a>`;
  if(scholar.whatsapp) sContainer.innerHTML += `<a href="${scholar.whatsapp}" target="_blank" rel="noopener" aria-label="واتساب"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4l-2.4-1.2c-.3-.1-.6-.1-.8.2l-.8 1c-.2.2-.4.3-.7.1-1.6-.8-2.9-1.9-3.8-3.4-.2-.3-.1-.5.1-.7l.7-.7c.2-.2.2-.4.1-.6L8.6 6.5c-.2-.4-.5-.4-.8-.4h-.7c-.3 0-.7.1-1 .4-.4.4-1.3 1.3-1.3 3.1s1.4 3.6 1.6 3.8c.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.7.3-.9.3-1.6.2-1.7-.1-.2-.4-.3-.7-.4zM12 21.8A9.9 9.9 0 012.2 12 9.8 9.8 0 0112 2.2 9.9 9.9 0 0121.8 12 9.9 9.9 0 0112 21.8zM12 0A12 12 0 001.2 18.4L0 24l5.7-1.5A12 12 0 0012 24 12 12 0 0012 0z"/></svg></a>`;
  if(scholar.tiktok) sContainer.innerHTML += `<a href="${scholar.tiktok}" target="_blank" rel="noopener" aria-label="تيك توك"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.71.49-1.14 1.3-1.1 2.15.01.69.31 1.34.8 1.83.58.6 1.41.83 2.21.73.98-.11 1.84-.81 2.14-1.75.04-.15.06-.31.06-.47v-13.91z"/></svg></a>`;
  if(scholar.blog) sContainer.innerHTML += `<a href="${scholar.blog}" target="_blank" rel="noopener" aria-label="المدونة"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M20.21 0H3.79C1.7 0 0 1.7 0 3.79v16.42C0 22.3 1.7 24 3.79 24h16.42c2.09 0 3.79-1.7 3.79-3.79V3.79C24 1.7 22.3 0 20.21 0zM17 12.3c0 .16-.01.31-.02.46-.01.15-.02.3-.05.45-.02.15-.05.29-.09.43a2.534 2.534 0 0 1-.58 1.05c-.17.18-.36.33-.58.46-.22.12-.45.22-.7.28-.24.06-.5.09-.76.09-.3 0-.64-.06-.99-.18-.35-.12-.7-.31-1.04-.54-.34-.23-.65-.54-.93-.89-.28-.35-.42-.76-.42-1.22 0-.25.04-.49.12-.71.08-.22.18-.42.3-.59.12-.17.26-.32.41-.44.15-.12.3-.21.46-.27l-.02-.13c-.1-.04-.2-.11-.29-.19-.09-.08-.18-.18-.25-.3-.07-.12-.13-.26-.17-.41-.04-.15-.06-.31-.06-.48 0-.41.13-.77.38-1.07.25-.3.57-.54.95-.71.38-.17.81-.25 1.28-.25.48 0 .91.08 1.29.25.38.17.7.41.95.71s.38.66.38 1.07c0 .19-.03.36-.08.52-.05.16-.12.31-.21.45-.09.14-.2.27-.33.38s-.28.19-.44.25l-.04.1c.21.06.41.16.59.29.18.13.34.29.47.47.13.18.24.38.31.6.07.22.11.45.11.69z"/></svg></a>`;

  const lessonsContainer = document.getElementById('modalLessons');
  if (lessonsContainer) {
    const allLessons = objToArray(siteData.schedule);
    const scholarLessons = allLessons.filter(l => 
      l.scholar === scholar.name || 
      (Array.isArray(l.scholar) && l.scholar.includes(scholar.name))
    );
    
    if (scholarLessons.length > 0) {
      let lessonsHTML = '<h4 class="modal-lessons-title">جدول الدروس</h4><div class="scholar-lessons-list">';
      scholarLessons.forEach(l => {
        let daysText = Array.isArray(l.day) ? l.day.join(' و ') : l.day;
        lessonsHTML += `
          <div class="scholar-lesson-item">
            <strong class="scholar-lesson-title">${l.title}</strong>
            <div class="scholar-lesson-meta">
              <span>📅 ${daysText}</span>
              <span>🕐 ${l.time}</span>
              <span>📍 ${l.location}</span>
            </div>
          </div>
        `;
      });
      lessonsHTML += '</div>';
      lessonsContainer.innerHTML = lessonsHTML;
      lessonsContainer.style.display = 'block';
    } else {
      lessonsContainer.innerHTML = '';
      lessonsContainer.style.display = 'none';
    }
  }

  modal.classList.add('active');
  modal.removeAttribute('aria-hidden');
}

/* ---------- 3. Videos ---------- */
function renderVideos(filteredVideos = null) {
  const grid = document.getElementById('videosGrid');
  const pagContainer = document.getElementById('videosPagination');
  if (!grid) return;

  const videos = filteredVideos || objToArray(siteData.videos);
  
  if(videos.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-light)">لا توجد فيديوهات مطابقة للبحث.</p>';
    if (pagContainer) pagContainer.innerHTML = '';
    return;
  }

  // Pagination logic
  const totalVideos = videos.length;
  const totalPages = Math.ceil(totalVideos / videosPerPage);
  
  // Ensure current page is valid
  if (currentVideoPage > totalPages) currentVideoPage = totalPages;
  if (currentVideoPage < 1) currentVideoPage = 1;

  const start = (currentVideoPage - 1) * videosPerPage;
  const end = start + videosPerPage;
  const pageVideos = videos.slice(start, end);

  grid.innerHTML = '';
  pageVideos.forEach(v => {
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

  renderVideosPagination(totalPages, videos);
}

function renderVideoTabs() {
  const tabsContainer = document.getElementById('videosTabs');
  if (!tabsContainer) return;

  const allVideos = objToArray(siteData.videos);
  if (allVideos.length === 0) {
    tabsContainer.style.display = 'none';
    return;
  }

  const categories = ["الكل", ...new Set(allVideos.map(v => v.category).filter(c => c))];
  
  if (categories.length <= 1) {
    tabsContainer.style.display = 'none';
    return;
  }

  tabsContainer.style.display = 'flex';
  tabsContainer.innerHTML = '';
  
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `art-tab-btn ${cat === currentVideoCategory ? 'active' : ''}`;
    btn.textContent = cat;
    btn.onclick = () => {
      currentVideoCategory = cat;
      currentVideoPage = 1;
      document.querySelectorAll('#videosTabs .art-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filtered = cat === "الكل" 
        ? allVideos 
        : allVideos.filter(v => v.category === cat);
      renderVideos(filtered);
    };
    tabsContainer.appendChild(btn);
  });
}

function renderVideosPagination(totalPages, allVideos) {
  const container = document.getElementById('videosPagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = 'السابق';
  prevBtn.disabled = currentVideoPage === 1;
  prevBtn.onclick = () => {
    currentVideoPage--;
    renderVideos(allVideos);
    scrollToVideos();
  };
  container.appendChild(prevBtn);

  // Page Numbers (Simple version)
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentVideoPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentVideoPage = i;
      renderVideos(allVideos);
      scrollToVideos();
    };
    container.appendChild(pageBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = 'التالي';
  nextBtn.disabled = currentVideoPage === totalPages;
  nextBtn.onclick = () => {
    currentVideoPage++;
    renderVideos(allVideos);
    scrollToVideos();
  };
  container.appendChild(nextBtn);
}

function scrollToVideos() {
  const section = document.getElementById('videos');
  if (section) {
    const offset = section.offsetTop - 100;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
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
  const pagContainer = document.getElementById('articlesPagination');
  grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;text-align:center;padding:50px;color:var(--navy)">جاري التحميل...</div>';
  if (pagContainer) pagContainer.innerHTML = '';

  articlesConfig.useCover = useCover;
  currentArticlePage = 1; // Reset to page 1 on new fetch
  
  const oldScript = document.getElementById('blogger-jsonp');
  if (oldScript) oldScript.remove();

  const callbackName = 'blogger_cb_' + Math.floor(Math.random() * 1000000);
  
  window[callbackName] = function(data) {
    const entries = data.feed.entry;
    currentArticles = entries || [];
    renderArticlesPage();
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

function renderArticlesPage() {
  const grid = document.getElementById('articlesGrid');
  if (!grid) return;

  if (currentArticles.length === 0) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;text-align:center;padding:40px;">لا توجد مقالات في هذا القسم حالياً.</p>';
    return;
  }

  const totalPages = Math.ceil(currentArticles.length / articlesPerPage);
  if (currentArticlePage > totalPages) currentArticlePage = totalPages;
  if (currentArticlePage < 1) currentArticlePage = 1;

  const start = (currentArticlePage - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const pageArticles = currentArticles.slice(start, end);

  grid.innerHTML = '';
  pageArticles.forEach((entry, pageIdx) => {
    // Global index in currentArticles
    const globalIdx = start + pageIdx;
    try {
      const title = entry.title.$t;
      const dateStr = entry.published ? entry.published.$t : new Date().toISOString();
      const date = new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const content = (entry.content && entry.content.$t) ? entry.content.$t : 
                      ((entry.summary && entry.summary.$t) ? entry.summary.$t : '');
      
      let img = 'cover.png';
      if (!articlesConfig.useCover) {
        img = getFirstImage(content);
      }

      const card = document.createElement('article');
      card.className = 'article-card fade-up visible';
      card.innerHTML = `
        <div class="article-img" onclick="openArticle(${globalIdx})">
          <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='cover.png'">
        </div>
        <div class="article-body">
          <span class="article-date">${date}</span>
          <h3 class="article-title"><a href="javascript:void(0)" onclick="openArticle(${globalIdx})">${title}</a></h3>
          <p class="article-excerpt">${stripHtml(content).substring(0, 100)}...</p>
          <a href="javascript:void(0)" onclick="openArticle(${globalIdx})" class="read-more">اقرأ المزيد ←</a>
        </div>
      `;
      grid.appendChild(card);
    } catch (e) {
      console.error("Error parsing entry:", e);
    }
  });

  renderArticlesPagination(totalPages);
}

function renderArticlesPagination(totalPages) {
  const container = document.getElementById('articlesPagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = 'السابق';
  prevBtn.disabled = currentArticlePage === 1;
  prevBtn.onclick = () => {
    currentArticlePage--;
    renderArticlesPage();
    scrollToArticles();
  };
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentArticlePage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentArticlePage = i;
      renderArticlesPage();
      scrollToArticles();
    };
    container.appendChild(pageBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = 'التالي';
  nextBtn.disabled = currentArticlePage === totalPages;
  nextBtn.onclick = () => {
    currentArticlePage++;
    renderArticlesPage();
    scrollToArticles();
  };
  container.appendChild(nextBtn);
}

function scrollToArticles() {
  const section = document.getElementById('articles');
  if (section) {
    const offset = section.offsetTop - 100;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
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
  return match ? match[1] : 'assets/images/cover.png';
}

/* ---------- 5. Schedule ---------- */
function renderSchedule() {
  const grid = document.getElementById('scheduleGrid');
  const pagContainer = document.getElementById('schedulePagination');
  if (!grid) return;

  const lessons = objToArray(siteData.schedule);
  if (lessons.length === 0) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;text-align:center;">جاري إعداد جدول الدروس...</p>';
    if (pagContainer) pagContainer.innerHTML = '';
    return;
  }

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

  // Pagination logic
  const totalLessons = displayLessons.length;
  const totalPages = Math.ceil(totalLessons / schedulePerPage);
  
  if (currentSchedulePage > totalPages) currentSchedulePage = totalPages;
  if (currentSchedulePage < 1) currentSchedulePage = 1;

  const start = (currentSchedulePage - 1) * schedulePerPage;
  const end = start + schedulePerPage;
  const pageLessons = displayLessons.slice(start, end);

  const scholarsArray = objToArray(siteData.scholars);

  grid.innerHTML = '';
  pageLessons.forEach(lesson => {
    const card = document.createElement('div');
    card.className = 'schedule-card fade-up visible';
    
    // Normalize scholars to an array for easier handling
    const scholarNames = Array.isArray(lesson.scholar) ? lesson.scholar : [lesson.scholar];
    const scholarsData = scholarNames.map(name => scholarsArray.find(s => s.name === name)).filter(s => s);
    
    // Build images HTML (Overlapping Avatars)
    let imagesHTML = '';
    if (scholarsData.length > 0) {
      scholarsData.forEach((s, idx) => {
        const img = s.image || 'assets/images/logo.png';
        // Applying margin-right for overlapping if it's not the first one
        const style = idx > 0 ? 'margin-right: -15px;' : '';
        imagesHTML += `<img src="${img}" alt="${s.name}" class="schedule-scholar-img" style="z-index: ${10 - idx}; ${style}" onerror="this.src='assets/images/logo.png'">`;
      });
    } else {
      imagesHTML = `<img src="assets/images/logo.png" alt="الشيخ" class="schedule-scholar-img">`;
    }

    const displayNames = scholarNames.join(' و ');

    card.innerHTML = `
      <span class="schedule-day">${lesson.day}</span>
      <h3>${lesson.title}</h3>
      <div class="schedule-meta">
        <div class="scholar-info">
          <div class="scholar-avatars" style="display: flex; align-items: center; margin-left: 10px;">
            ${imagesHTML}
          </div>
          <span>${displayNames}</span>
        </div>
        <span>🕐 ${lesson.time}</span>
        <span>📍 ${lesson.location}</span>
      </div>
    `;
    
    // Make the card clickable if at least one scholar data exists
    if (scholarsData.length > 0) {
      card.style.cursor = 'pointer';
      card.classList.add('clickable-schedule');
      card.addEventListener('click', () => openScholarModal(scholarsData[0]));
    }

    grid.appendChild(card);
  });

  renderSchedulePagination(totalPages);
}

function renderSchedulePagination(totalPages) {
  const container = document.getElementById('schedulePagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = 'السابق';
  prevBtn.disabled = currentSchedulePage === 1;
  prevBtn.onclick = () => {
    currentSchedulePage--;
    renderSchedule();
    scrollToSchedule();
  };
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentSchedulePage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentSchedulePage = i;
      renderSchedule();
      scrollToSchedule();
    };
    container.appendChild(pageBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = 'التالي';
  nextBtn.disabled = currentSchedulePage === totalPages;
  nextBtn.onclick = () => {
    currentSchedulePage++;
    renderSchedule();
    scrollToSchedule();
  };
  container.appendChild(nextBtn);
}

function scrollToSchedule() {
  const section = document.getElementById('schedule');
  if (section) {
    const offset = section.offsetTop - 100;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
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
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// IntersectionObserver for fade-up animations
function setupFadeAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up:not(.visible)').forEach(el => observer.observe(el));
}

function setupAdminAccess() {
  const trigger = document.getElementById('admin-trigger');
  if (!trigger) return;

  let clicks = 0;
  let timer;

  trigger.addEventListener('click', (e) => {
    clicks++;
    
    // Clear existing timer
    if (timer) clearTimeout(timer);

    if (clicks === 3) {
      // Secret combination achieved!
      window.location.href = 'admin.html';
      clicks = 0;
    } else {
      // Reset clicks after 800ms of inactivity
      timer = setTimeout(() => {
        clicks = 0;
      }, 800);
    }
  });
}
