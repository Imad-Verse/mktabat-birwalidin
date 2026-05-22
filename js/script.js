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
  db.ref('/').on('value', (snapshot) => {
    if(snapshot.exists()){
      siteData = snapshot.val();
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
  setupFloatingPlayer();
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

  const searchArticles = document.getElementById('searchArticles');
  if (searchArticles) {
    searchArticles.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = currentArticles.filter(entry => {
        const title = (entry.title && entry.title.$t) ? entry.title.$t.toLowerCase() : '';
        const content = (entry.content && entry.content.$t) ? entry.content.$t.toLowerCase() : 
                        ((entry.summary && entry.summary.$t) ? entry.summary.$t.toLowerCase() : '');
        const categories = entry.category ? entry.category.map(c => c.term.toLowerCase()) : [];
        
        return title.includes(term) || 
               content.includes(term) || 
               categories.some(cat => cat.includes(term));
      });
      currentArticlePage = 1; // Reset to page 1 on search
      renderArticlesPage(filtered);
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

function setupFloatingPlayer() {
  const fpPlayBtn = document.getElementById('fpPlayBtn');
  const fpVolumeSlider = document.getElementById('fpVolumeSlider');
  const fpClose = document.getElementById('fpClose');

  if (fpPlayBtn) {
    fpPlayBtn.addEventListener('click', () => {
      if (activeStationId) {
        const activeStation = radioStations.find(s => s.id === activeStationId);
        if (activeStation) {
          toggleRadioPlay(activeStation.url, activeCardId, activeStation.id);
        }
      }
    });
  }

  if (fpVolumeSlider) {
    fpVolumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      if (globalAudio) {
        globalAudio.volume = vol;
      }
    });
  }

  if (fpClose) {
    fpClose.addEventListener('click', () => {
      if (globalAudio) {
        globalAudio.pause();
        globalAudio.src = '';
      }
      activeRadioUrl = null;
      activeCardId = null;
      activeStationId = null;
      isRadioPlaying = false;
      isRadioBuffering = false;
      updateRadioUIStates();
    });
  }
}

function renderSite() {
  renderSocials();
  renderRadio();
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
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openScholarModal(s);
      }
    });
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
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVideoModal(v.yt_id);
      }
    });
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
      const searchInput = document.getElementById('searchArticles');
      if (searchInput) searchInput.value = '';
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
        const searchInput = document.getElementById('searchArticles');
        if (searchInput) searchInput.value = '';
        fetchLabelPosts(cfg.blogId, s.label, cfg.showAll ? 500 : (cfg.limit || 6), s.useCoverOnly);
      };
      tabsContainer.appendChild(btn);
    });

    // Load "All" section by default
    fetchLabelPosts(cfg.blogId, "", cfg.showAll ? 500 : (cfg.limit || 6), cfg.useCoverOnly);
  }
}

let currentArticles = [];
let displayedArticles = [];
let previousCallbackName = null; // Track JSONP callback to prevent leaks

function fetchLabelPosts(blogId, label, limit, useCover) {
  const grid = document.getElementById('articlesGrid');
  const pagContainer = document.getElementById('articlesPagination');
  
  // Skeleton Loading
  grid.innerHTML = Array(3).fill('').map(() => `
    <div class="article-card-skeleton">
      <div class="skeleton-img skeleton-pulse"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-pulse" style="width:40%;height:12px;"></div>
        <div class="skeleton-line skeleton-pulse" style="width:90%;height:18px;margin-top:12px;"></div>
        <div class="skeleton-line skeleton-pulse" style="width:100%;height:14px;margin-top:16px;"></div>
        <div class="skeleton-line skeleton-pulse" style="width:75%;height:14px;"></div>
        <div class="skeleton-line skeleton-pulse" style="width:30%;height:14px;margin-top:20px;"></div>
      </div>
    </div>
  `).join('');
  if (pagContainer) pagContainer.innerHTML = '';

  articlesConfig.useCover = useCover;
  currentArticlePage = 1;
  
  // Clean up previous JSONP callback safely to prevent memory leaks and unhandled exceptions (race conditions)
  if (previousCallbackName && window[previousCallbackName]) {
    window[previousCallbackName] = () => {}; // Make it a no-op instead of deleting to prevent "not a function" errors
  }
  const oldScript = document.getElementById('blogger-jsonp');
  if (oldScript) oldScript.remove();

  const callbackName = 'blogger_cb_' + Math.floor(Math.random() * 1000000);
  previousCallbackName = callbackName;
  
  window[callbackName] = function(data) {
    const entries = data.feed.entry;
    currentArticles = entries || [];
    // Sort by published date descending (newest first)
    currentArticles.sort((a, b) => {
      const dateA = new Date(a.published.$t);
      const dateB = new Date(b.published.$t);
      return dateB - dateA;
    });
    displayedArticles = [...currentArticles];
    renderArticlesPage();
    delete window[callbackName];
    previousCallbackName = null;
  };

  const labelPart = label ? `/-/${encodeURIComponent(label)}` : '';
  const url = `https://www.blogger.com/feeds/${blogId}/posts/default${labelPart}?alt=json-in-script&callback=${callbackName}&max-results=${limit}&orderby=updated`;
  
  const script = document.createElement('script');
  script.id = 'blogger-jsonp';
  script.src = url;
  script.onerror = function() {
    grid.innerHTML = '<p class="error-msg" style="grid-column: 1/-1;text-align:center;padding:40px;color:var(--text-muted)">فشل الاتصال بخوادم جوجل. يرجى التأكد من اتصال الإنترنت.</p>';
    delete window[callbackName];
    previousCallbackName = null;
  };
  document.body.appendChild(script);
}

function renderArticlesPage(filteredArticles = null) {
  const grid = document.getElementById('articlesGrid');
  if (!grid) return;

  displayedArticles = filteredArticles || currentArticles;

  if (displayedArticles.length === 0) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;text-align:center;padding:40px;color:var(--text-muted)">لا توجد مقالات مطابقة للبحث أو في هذا القسم حالياً.</p>';
    const pagContainer = document.getElementById('articlesPagination');
    if (pagContainer) pagContainer.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(displayedArticles.length / articlesPerPage);
  if (currentArticlePage > totalPages) currentArticlePage = totalPages;
  if (currentArticlePage < 1) currentArticlePage = 1;

  const start = (currentArticlePage - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const pageArticles = displayedArticles.slice(start, end);

  grid.innerHTML = '';
  pageArticles.forEach((entry, pageIdx) => {
    // Global index in displayedArticles
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

      const categories = entry.category ? entry.category.map(c => c.term) : [];
      const labelsHTML = categories.length > 0 ? `<div class="article-labels">${categories.slice(0, 2).map(cat => `<span class="article-tag">${cat}</span>`).join('')}</div>` : '';

      const card = document.createElement('article');
      card.className = 'article-card fade-up visible';
      const excerptText = cleanExcerpt(content, 180);
      card.innerHTML = `
        <div class="article-img" onclick="openArticle(${globalIdx})">
          <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='assets/images/cover.png'">
        </div>
        <div class="article-body">
          <div class="article-meta-top">
            <span class="article-date">${date}</span>
            ${labelsHTML}
          </div>
          <h3 class="article-title"><a href="javascript:void(0)" onclick="openArticle(${globalIdx})">${title}</a></h3>
          <p class="article-excerpt">${excerptText}</p>
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
    renderArticlesPage(displayedArticles);
    scrollToArticles();
  };
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentArticlePage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentArticlePage = i;
      renderArticlesPage(displayedArticles);
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
    renderArticlesPage(displayedArticles);
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
  const entry = displayedArticles[index];
  if (!entry) return;

  const title = entry.title.$t;
  const rawContent = (entry.content && entry.content.$t) ? entry.content.$t : 
                  ((entry.summary && entry.summary.$t) ? entry.summary.$t : '');
  const content = cleanArticleContent(rawContent);
  const dateStr = entry.published ? entry.published.$t : new Date().toISOString();
  const date = new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const altLink = entry.link.find(l => l.rel === 'alternate');
  const link = altLink ? altLink.href : '#';
  const img = getFirstImage(rawContent);
  const categories = entry.category ? entry.category.map(c => c.term) : [];

  document.getElementById('artModalTitle').textContent = title;
  document.getElementById('artModalDate').textContent = date;
  document.getElementById('artModalContent').innerHTML = content;
  
  // Handle hero image - hide if it's the fallback
  const modalImgEl = document.getElementById('artModalImg');
  const modalImgContainer = document.querySelector('.article-modal-img');
  if (img && img !== 'assets/images/cover.png') {
    modalImgEl.src = img;
    modalImgContainer.style.display = 'block';
  } else {
    modalImgContainer.style.display = 'none';
  }
  
  document.getElementById('artModalLink').href = link;

  // Render share buttons
  const shareContainer = document.getElementById('artModalShare');
  if (shareContainer) {
    const encodedUrl = encodeURIComponent(link);
    const encodedTitle = encodeURIComponent(title);
    shareContainer.innerHTML = `
      <button class="share-btn share-fb" data-share="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" aria-label="مشاركة على فيسبوك">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"/></svg>
      </button>
      <button class="share-btn share-tw" data-share="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" aria-label="مشاركة على تويتر">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.9 2H22l-6.8 7.7L23 22h-6.3l-4.9-6.4L6.1 22H3l7.2-8.2L2.7 2h6.5l4.5 6 5.2-6zm-1.1 18.2h1.7L7.4 3.8H5.6l12.2 16.4z"/></svg>
      </button>
      <button class="share-btn share-wa" data-share="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" aria-label="مشاركة على واتساب">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4l-2.4-1.2c-.3-.1-.6-.1-.8.2l-.8 1c-.2.2-.4.3-.7.1-1.6-.8-2.9-1.9-3.8-3.4-.2-.3-.1-.5.1-.7l.7-.7c.2-.2.2-.4.1-.6L8.6 6.5c-.2-.4-.5-.4-.8-.4h-.7c-.3 0-.7.1-1 .4-.4.4-1.3 1.3-1.3 3.1s1.4 3.6 1.6 3.8c.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.7.3-.9.3-1.6.2-1.7-.1-.2-.4-.3-.7-.4zM12 21.8A9.9 9.9 0 012.2 12 9.8 9.8 0 0112 2.2 9.9 9.9 0 0121.8 12 9.9 9.9 0 0112 21.8zM12 0A12 12 0 001.2 18.4L0 24l5.7-1.5A12 12 0 0012 24 12 12 0 0012 0z"/></svg>
      </button>
      <button class="share-btn share-tg" data-share="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" aria-label="مشاركة على تلغرام">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M11.9 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.6 8.2l-1.8 8.7c-.1.6-.5.8-1 .5l-2.8-2-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.8l10.5-4c.5-.2.9.1.8.8z"/></svg>
      </button>
      <button class="share-btn share-copy" data-copy="${link}" aria-label="نسخ الرابط">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>
    `;

    // Add event listeners to share buttons
    shareContainer.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.open(btn.dataset.share, '_blank', 'width=600,height=400');
      });
    });

    const copyBtn = shareContainer.querySelector('[data-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        copyArticleLink(this.dataset.copy, this);
      });
    }
  }

  // Render labels
  const labelsContainer = document.getElementById('artModalLabels');
  if (labelsContainer) {
    labelsContainer.innerHTML = categories.map(c => `<span class="article-tag">${c}</span>`).join('');
  }

  const modal = document.getElementById('articleModal');
  modal.classList.add('active');
  modal.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';

  // Setup reading progress bar
  setupReadingProgress();
}

function copyArticleLink(link, btn) {
  navigator.clipboard.writeText(link).then(() => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="#25D366" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('copied');
    }, 2000);
  });
}

function setupReadingProgress() {
  const scrollArea = document.querySelector('.modal-scroll-area');
  const progressBar = document.getElementById('readingProgress');
  if (!scrollArea || !progressBar) return;

  progressBar.style.width = '0%';
  
  scrollArea.addEventListener('scroll', function onScroll() {
    const scrollTop = scrollArea.scrollTop;
    const scrollHeight = scrollArea.scrollHeight - scrollArea.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = Math.min(progress, 100) + '%';
  });
}

// Close Art Modal
document.getElementById('articleModalClose')?.addEventListener('click', closeArticleModal);
document.getElementById('articleModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'articleModal') closeArticleModal();
});

// Global Escape key handler for all modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close article modal
    const artModal = document.getElementById('articleModal');
    if (artModal && artModal.classList.contains('active')) {
      closeArticleModal();
      return;
    }
    // Close video modal
    const vModal = document.getElementById('videoModal');
    if (vModal && vModal.classList.contains('active')) {
      vModal.classList.remove('active');
      vModal.setAttribute('aria-hidden', 'true');
      document.getElementById('videoContainer').innerHTML = '';
      return;
    }
    // Close scholar modal
    const sModal = document.getElementById('scholarModal');
    if (sModal && sModal.classList.contains('active')) {
      sModal.classList.remove('active');
      sModal.setAttribute('aria-hidden', 'true');
      return;
    }
  }
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

/**
 * Creates a clean excerpt from HTML content
 * Strips HTML, removes excessive whitespace, and truncates to length
 */
function cleanExcerpt(html, maxLength = 180) {
  let text = stripHtml(html).trim();
  // Remove excessive whitespace and newlines
  text = text.replace(/\s+/g, ' ');
  // Remove leading/trailing quotes or special chars
  text = text.replace(/^[\s"'«»]+/, '');
  
  if (text.length <= maxLength) return text;
  
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...';
}
function getFirstImage(html) {
  if (!html) return 'assets/images/cover.png';
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = div.querySelectorAll('img');
  
  for (let img of imgs) {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const cls = img.getAttribute('class') || '';
    
    // Logic to detect emojis
    const isEmoji = cls.includes('emoji') || 
                    (alt.length > 0 && alt.length <= 2) || 
                    src.includes('/emoji/') ||
                    src.includes('img.emoji') ||
                    (img.getAttribute('width') && parseInt(img.getAttribute('width')) < 32) ||
                    (img.getAttribute('height') && parseInt(img.getAttribute('height')) < 32);
    
    if (!isEmoji && src && !src.includes('clear.cache.gif')) {
      return src;
    }
  }
  return 'assets/images/cover.png';
}

/**
 * Cleans Blogger content by replacing emoji images with their alt text
 * and ensuring other images are handled properly.
 */
function cleanArticleContent(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Clean all inline styles (except for iframe video embeds or specific elements) to preserve custom clean styling
  div.querySelectorAll('*').forEach(el => {
    if (el.tagName !== 'IFRAME' && el.tagName !== 'VIDEO') {
      el.removeAttribute('style');
    }
  });
  
  let firstRealImageRemoved = false;
  const imgs = div.querySelectorAll('img');
  
  imgs.forEach(img => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const cls = img.getAttribute('class') || '';
    
    const isEmoji = cls.includes('emoji') || 
                    (alt.length > 0 && alt.length <= 2) || 
                    src.includes('/emoji/') ||
                    src.includes('img.emoji') ||
                    (img.getAttribute('width') && parseInt(img.getAttribute('width')) < 32) ||
                    (img.getAttribute('height') && parseInt(img.getAttribute('height')) < 32);
                    
    if (isEmoji) {
      if (alt && alt.length <= 2) {
        const textNode = document.createTextNode(alt);
        img.parentNode.replaceChild(textNode, img);
      } else {
        img.classList.add('emoji');
      }
    } else {
      // Remove the first real image to prevent duplication with the hero image
      if (!firstRealImageRemoved && src && !src.includes('clear.cache.gif')) {
        // Check if img is inside a link or separator - remove the container
        const parent = img.parentElement;
        if (parent && (parent.tagName === 'A' || parent.classList.contains('separator'))) {
          parent.remove();
        } else {
          img.remove();
        }
        firstRealImageRemoved = true;
      } else {
        img.classList.remove('emoji');
        img.classList.add('article-content-img');
      }
    }
  });
  
  // Clean up empty paragraphs and excessive breaks
  const paragraphs = div.querySelectorAll('p, div');
  paragraphs.forEach(p => {
    if (!p.textContent.trim() && !p.querySelector('img, iframe, video')) {
      // Only remove if completely empty (no meaningful content)
      if (p.children.length === 0 || (p.children.length === 1 && p.children[0].tagName === 'BR')) {
        p.remove();
      }
    }
  });
  
  return div.innerHTML;
}



/* ---------- 5. Schedule ---------- */
function createScheduleCard(lesson, todayName, scholarsArray, isFeatured = false) {
  const card = document.createElement('div');
  const isToday = lesson.day === todayName || (Array.isArray(lesson.day) && lesson.day.includes(todayName)) || lesson.day === 'يومياً';
  card.className = `schedule-card fade-up visible${isToday ? ' today-highlight' : ''}`;
  
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
  const todayBadgeHTML = isToday ? `<span class="schedule-today-badge">درس اليوم 🌟</span>` : '';

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
      <span class="schedule-day">${lesson.day}</span>
      ${todayBadgeHTML}
    </div>
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
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => openScholarModal(scholarsData[0]));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openScholarModal(scholarsData[0]);
      }
    });
  }

  return card;
}

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

  const scholarsArray = objToArray(siteData.scholars);
  const daysOfWeekAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const todayName = daysOfWeekAr[new Date().getDay()];

  // Pinned/Featured Today's Lessons Logic
  const todayLessonsContainer = document.getElementById('todayLessonsContainer');
  const todayLessonsGrid = document.getElementById('todayLessonsGrid');
  const todayDateBadge = document.getElementById('todayDateBadge');

  const todayLessons = displayLessons.filter(lesson => {
    return lesson.day === todayName || (Array.isArray(lesson.day) && lesson.day.includes(todayName)) || lesson.day === 'يومياً';
  });

  if (todayLessons.length > 0) {
    if (todayLessonsContainer && todayLessonsGrid) {
      todayLessonsGrid.innerHTML = '';
      todayLessons.forEach(lesson => {
        const card = createScheduleCard(lesson, todayName, scholarsArray, true);
        todayLessonsGrid.appendChild(card);
      });
      
      if (todayDateBadge) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('ar-EG', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        todayDateBadge.textContent = formattedDate;
      }
      
      todayLessonsContainer.style.display = 'block';
    }
  } else {
    if (todayLessonsContainer) {
      todayLessonsContainer.style.display = 'none';
    }
  }

  // Pagination logic
  const totalLessons = displayLessons.length;
  const totalPages = Math.ceil(totalLessons / schedulePerPage);
  
  if (currentSchedulePage > totalPages) currentSchedulePage = totalPages;
  if (currentSchedulePage < 1) currentSchedulePage = 1;

  const start = (currentSchedulePage - 1) * schedulePerPage;
  const end = start + schedulePerPage;
  const pageLessons = displayLessons.slice(start, end);

  grid.innerHTML = '';
  pageLessons.forEach(lesson => {
    const card = createScheduleCard(lesson, todayName, scholarsArray, false);
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
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 15;
    
    if (isAtBottom && navItems.length > 0) {
      navItems.forEach(n => n.classList.remove('active'));
      navItems[navItems.length - 1].classList.add('active');
      return;
    }

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

/* ==========================================================================
   📻 قسم الإذاعة الدعوية والقرآنية - Premium Glassmorphic Islamic Radio
   ========================================================================== */

const radioGroups = {
  hafs: {
    title: "تلاوات برواية حفص عن عاصم",
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
    fallbackImg: "assets/images/logo.png"
  },
  warsh: {
    title: "تلاوات برواية ورش عن نافع",
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
    fallbackImg: "assets/images/logo.png"
  },
  tafseer: {
    title: "إذاعات التفسير والعلوم القرآنية",
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
    fallbackImg: "https://www.arrabita.ma/wp-content/uploads/2021/04/ma3lamatmalek.jpg"
  },
  hadith: {
    title: "إذاعات الحديث النبوي الشريف",
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    fallbackImg: "https://upload.wikimedia.org/wikipedia/commons/0/00/SaheehAlBukhari1.png"
  },
  seerah: {
    title: "إذاعات السيرة النبوية والشمائل",
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
    fallbackImg: "https://www.arrabita.ma/wp-content/uploads/2021/04/ma3lamatmalek.jpg"
  },
  duroos: {
    title: "إذاعات الدروس والمحاضرات العلمية",
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    fallbackImg: "assets/images/logo.png"
  }
};

const radioStations = [
  // Hafs
  {
    id: "hafs_ali_jaber",
    name: "علي عبد الله جابر",
    url: "https://backup.qurango.net/radio/ali_jaber",
    group: "hafs",
    img: "https://i0.wp.com/quran-uni.com/wp-content/uploads/abdullah-ali-jaber.jpg"
  },
  {
    id: "hafs_al_hussary",
    name: "محمود خليل الحصري",
    url: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary",
    group: "hafs",
    img: "https://ar.assabile.com/media/person/200x256/mahmoud-khalil-al-hussary.png"
  },
  {
    id: "hafs_al_minshawi",
    name: "محمد صديق المنشاوي",
    url: "https://backup.qurango.net/radio/mohammed_siddiq_alminshawi",
    group: "hafs",
    img: "https://i0.wp.com/quran-uni.com/wp-content/uploads/mohamed-seddik-el-menchaoui.png"
  },
  {
    id: "hafs_ayyoub",
    name: "محمد أيوب",
    url: "https://backup.qurango.net/radio/mohammed_ayyub",
    group: "hafs",
    img: "https://i0.wp.com/quran-uni.com/wp-content/uploads/Mohamed-Ayoub.jpg"
  },
  {
    id: "hafs_abdulbasit",
    name: "عبد الباسط عبد الصمد",
    url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad",
    group: "hafs",
    img: "https://is.gd/HiSoXE"
  },
  {
    id: "hafs_al_huthaifi",
    name: "علي الحذيفي",
    url: "https://backup.qurango.net/radio/ali_alhuthaifi",
    group: "hafs",
    img: "https://s3-eu-west-1.amazonaws.com/content.argaamnews.com/8750d869-ec5b-416a-9554-702582372866.jpg"
  },

  // Warsh
  {
    id: "warsh_abdulbasit",
    name: "عبد الباسط عبد الصمد",
    url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_warsh",
    group: "warsh",
    img: "https://is.gd/HiSoXE"
  },
  {
    id: "warsh_al_hussary",
    name: "محمود خليل الحصري",
    url: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary_warsh",
    group: "warsh",
    img: "https://ar.assabile.com/media/person/200x256/mahmoud-khalil-al-hussary.png"
  },

  // Tafseer
  {
    id: "tafseer_al_saadi",
    name: "تفسير ناصر السعدي",
    url: "https://radio.elibana.org/radio/8010/tasfia2",
    group: "tafseer",
    subtitle: "تفسير القرآن الكريم - الجزء الثاني"
  },
  {
    id: "tafseer_bin_uthaymeen",
    name: "تفسير ابن عثيمين",
    url: "https://backup.qurango.net/radio/tafseer",
    group: "tafseer",
    subtitle: "تفسير القرآن الكريم كاملاً"
  },
  {
    id: "tafseer_mukhtasar",
    name: "المختصر في التفسير",
    url: "https://backup.qurango.net/radio/mukhtasartafsir",
    group: "tafseer",
    subtitle: "تفسير القرآن الكريم"
  },
  {
    id: "tafseer_muyassar",
    name: "التفسير الميسر",
    url: "https://server03.quran-uni.com:7042/;*.mp3",
    group: "tafseer",
    subtitle: "تفسير القرآن الكريم"
  },
  {
    id: "tafseer_al_tabari",
    name: "الخلاصة من تفسير الطبري",
    url: "https://backup.qurango.net/radio/tabri",
    group: "tafseer"
  },

  // Hadith
  {
    id: "hadith_mowatta",
    name: "موطأ الإمام مالك",
    url: "https://serverkw.quran-uni.com:8322/;",
    group: "hadith",
    subtitle: "الحديث الشريف",
    img: "https://www.arrabita.ma/wp-content/uploads/2021/04/ma3lamatmalek.jpg"
  },
  {
    id: "hadith_al_darimi",
    name: "سنن الدارمي",
    url: "https://serverkw.quran-uni.com:7179/;",
    group: "hadith",
    subtitle: "الحديث الشريف",
    img: "https://www.al-ilmiyah.com/Covers/front_medium/978-2-7451-0945-3.jpg"
  },
  {
    id: "hadith_ahmad",
    name: "مسند أحمد",
    url: "https://serverkw.quran-uni.com:7172/;",
    group: "hadith",
    subtitle: "من مسند أبي سعيد الخدري إلى مسند أنس بن مالك",
    img: "https://is.gd/uFXoww"
  },
  {
    id: "hadith_al_nasai",
    name: "سنن النسائي",
    url: "https://serverkw.quran-uni.com:8332/;",
    group: "hadith",
    subtitle: "من كتاب الطهارة إلى كتاب صلاة العيدين",
    img: "https://is.gd/ob8kSl"
  },
  {
    id: "hadith_ibn_majah",
    name: "سنن ابن ماجه",
    url: "https://serverkw.quran-uni.com:8324/;",
    group: "hadith",
    subtitle: "من المقدمة إلى كتاب الشفعة",
    img: "https://www.al-ilmiyah.com/Covers/front_medium/978-2-7451-2574-3.jpg"
  },
  {
    id: "hadith_abi_dawud",
    name: "سنن أبي داود",
    url: "https://serverkw.quran-uni.com:8320/;",
    group: "hadith",
    subtitle: "من كتاب الإجازة إلى كتاب الأدب",
    img: "https://is.gd/gaZrTQ"
  },
  {
    id: "hadith_al_bukhari",
    name: "صحيح البخاري",
    url: "https://serverkw.quran-uni.com:8266/;",
    group: "hadith",
    subtitle: "من كتاب بدء الوحي إلى كتاب البيوع",
    img: "https://upload.wikimedia.org/wikipedia/commons/0/00/SaheehAlBukhari1.png"
  },
  {
    id: "hadith_riyad_salihin",
    name: "رياض الصالحين",
    url: "https://serverkw.quran-uni.com:8308/;",
    group: "hadith",
    subtitle: "الحديث الشريف",
    img: "https://is.gd/3q6cix"
  },
  {
    id: "hadith_al_arbaeen",
    name: "الأربعون النووية",
    url: "https://serverkw.quran-uni.com:8302/;",
    group: "hadith",
    subtitle: "الحديث الشريف",
    img: "https://sam-books.com/cdn/shop/files/0028AE27-F4DB-478E-9994-4BFDA25BDEEA.jpg"
  },
  {
    id: "hadith_al_tirmidhi",
    name: "جامع الترمذي",
    url: "https://serverkw.quran-uni.com:8298/;",
    group: "hadith",
    subtitle: "من كتاب الطهارة إلى كتاب الفرائض",
    img: "https://is.gd/e0Qmig"
  },
  {
    id: "hadith_muslim",
    name: "صحيح مسلم",
    url: "https://serverkw.quran-uni.com:8286/;",
    group: "hadith",
    subtitle: "من كتاب الإيمان إلى كتاب الحج",
    img: "https://www.mimham.net/imgmou-27"
  },

  // Seerah
  {
    id: "seerah_almukhtasar",
    name: "المختصر في السيرة النبوية",
    url: "https://backup.qurango.net/radio/almukhtasar_fi_alsiyra",
    group: "seerah"
  },
  {
    id: "seerah_mukhtasar_rasool",
    name: "مختصر سيرة الرسول ﷺ",
    url: "https://serverkw.quran-uni.com:7185/;",
    group: "seerah"
  },
  {
    id: "seerah_alraheeq",
    name: "الرحيق المختوم",
    url: "https://serverkw.quran-uni.com:7187/;",
    group: "seerah"
  },
  {
    id: "seerah_allulu",
    name: "اللؤلؤ المكنون في سيرة النبي المأمون",
    url: "https://serverkw.quran-uni.com:7180/;",
    group: "seerah"
  },
  {
    id: "seerah_zilal",
    name: "في ظلال السيرة النبوية",
    url: "https://backup.qurango.net/radio/fi_zilal_alsiyra",
    group: "seerah"
  },
  {
    id: "seerah_sahabah",
    name: "صور من حياة الصحابة",
    url: "https://backup.qurango.net/radio/sahabah",
    group: "seerah",
    subtitle: "رضوان الله عليهم"
  },

  // Duroos
  {
    id: "duroos_almutoon",
    name: "المتون العلمية",
    url: "https://stream-166.zeno.fm/etzx31pvxpnuv?zs=imrtVdCXST-sZMbj6P1ANg",
    group: "duroos",
    subtitle: "موقع السنة"
  },
  {
    id: "duroos_lectures",
    name: "محاضرات 24 ساعة",
    url: "https://stream-149.zeno.fm/hxjiakqplsptv?zs=9rrBoHCcRNm0sqdpheBjDQ",
    group: "duroos",
    subtitle: "موقع السنة"
  }
];

// Global Audio Player Variables
let globalAudio = null;
let activeRadioUrl = null;
let activeCardId = null;
let activeStationId = null;
let isRadioPlaying = false;
let isRadioBuffering = false;

/**
 * Initializes the unified HTML5 Audio instance with event listeners
 */
function initRadioPlayer() {
  if (globalAudio) return;
  
  globalAudio = new Audio();
  
  // Listen to audio buffering and status events
  globalAudio.addEventListener('waiting', () => {
    isRadioBuffering = true;
    updateRadioUIStates();
  });
  
  globalAudio.addEventListener('loadstart', () => {
    isRadioBuffering = true;
    updateRadioUIStates();
  });
  
  globalAudio.addEventListener('playing', () => {
    isRadioBuffering = false;
    isRadioPlaying = true;
    updateRadioUIStates();
  });
  
  globalAudio.addEventListener('pause', () => {
    isRadioPlaying = false;
    updateRadioUIStates();
  });
  
  globalAudio.addEventListener('error', (e) => {
    console.error("خطأ في تشغيل البث المباشر للإذاعة:", e);
    isRadioBuffering = false;
    isRadioPlaying = false;
    activeRadioUrl = null;
    activeCardId = null;
    activeStationId = null;
    updateRadioUIStates();
    
    // Sleek alerts for streams that are down or offline
    alert("عذراً، فشل الاتصال بالبث المباشر لهذه الإذاعة حالياً. قد تكون الإذاعة متوقفة مؤقتاً أو هناك خلل بالشبكة.");
  });

  globalAudio.addEventListener('ended', () => {
    isRadioPlaying = false;
    isRadioBuffering = false;
    updateRadioUIStates();
  });
}

/**
 * Toggles radio playback, clearing memory buffer on pause to optimize data usage
 */
function toggleRadioPlay(stationUrl, cardId, stationId) {
  initRadioPlayer();
  
  // If we click the already active station which is playing/buffering -> STOP IT
  if (activeStationId === stationId && (isRadioPlaying || isRadioBuffering)) {
    globalAudio.pause();
    globalAudio.src = ''; // De-allocate browser stream buffer immediately (important for mobile data!)
    
    activeRadioUrl = null;
    activeCardId = null;
    activeStationId = null;
    isRadioPlaying = false;
    isRadioBuffering = false;
    updateRadioUIStates();
    return;
  }
  
  // Reset all other audio/video tags (e.g. stop YouTube videos if playing)
  const vModal = document.getElementById('videoModal');
  if (vModal && vModal.classList.contains('active')) {
    vModal.classList.remove('active');
    vModal.setAttribute('aria-hidden', 'true');
    document.getElementById('videoContainer').innerHTML = '';
  }
  
  // Update state to load new station
  activeRadioUrl = stationUrl;
  activeCardId = cardId;
  activeStationId = stationId;
  isRadioPlaying = false;
  isRadioBuffering = true;
  updateRadioUIStates();
  
  try {
    globalAudio.src = stationUrl;
    globalAudio.load();
    
    // Live streams must be loaded from fresh edge
    const playPromise = globalAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Stream successfully started
      }).catch(err => {
        console.warn("فشل التشغيل التلقائي:", err);
        isRadioBuffering = false;
        isRadioPlaying = false;
        activeRadioUrl = null;
        activeCardId = null;
        activeStationId = null;
        updateRadioUIStates();
      });
    }
  } catch (err) {
    console.error("حدث خطأ أثناء تحميل الملف الصوتي:", err);
  }
}

/**
 * Allows user to play/stop current active station directly from the collapsed card header
 */
function toggleCardPlayback(cardId, e) {
  if (e) e.stopPropagation(); // Prevents collapsing/expanding the card
  
  if (activeCardId === cardId) {
    const activeStation = radioStations.find(s => s.id === activeStationId);
    if (activeStation) {
      toggleRadioPlay(activeStation.url, cardId, activeStation.id);
    }
  }
}

/**
 * Expand clicked card and collapse all other accordion-style cards
 */
function toggleCardExpansion(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  
  const isExpanded = card.classList.contains('expanded');
  const header = card.querySelector('.radio-card-header');
  const list = card.querySelector('.radio-stations-list');
  
  // 1. Collapse all other accordion cards
  document.querySelectorAll('.radio-card').forEach(c => {
    if (c.id !== cardId) {
      c.classList.remove('expanded');
      c.querySelector('.radio-card-header').setAttribute('aria-expanded', 'false');
      const otherList = c.querySelector('.radio-stations-list');
      if (otherList) {
        otherList.style.maxHeight = '0px';
      }
    }
  });
  
  // 2. Toggle active card expansion
  if (!isExpanded) {
    card.classList.add('expanded');
    header.setAttribute('aria-expanded', 'true');
    if (list) {
      const inner = list.querySelector('.stations-list-inner');
      list.style.maxHeight = (inner.scrollHeight + 20) + 'px';
      
      // Auto scroll active item into view if it belongs to this card
      if (activeCardId === cardId && activeStationId) {
        setTimeout(() => {
          const activeItem = document.getElementById(`station_item_${activeStationId}`);
          if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 300);
      }
    }
  } else {
    card.classList.remove('expanded');
    header.setAttribute('aria-expanded', 'false');
    if (list) {
      list.style.maxHeight = '0px';
    }
  }
}

/**
 * Dynamically builds and inserts the Radio layout inside index.html
 */
function renderRadio() {
  const grid = document.getElementById('radioGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Group stations
  const grouped = {};
  Object.keys(radioGroups).forEach(key => {
    grouped[key] = radioStations.filter(s => s.group === key);
  });
  
  Object.keys(radioGroups).forEach(groupKey => {
    const info = radioGroups[groupKey];
    const stations = grouped[groupKey];
    
    if (stations.length === 0) return;
    
    const cardId = `radio_card_${groupKey}`;
    const card = document.createElement('div');
    card.className = 'radio-card fade-up';
    card.id = cardId;
    
    let listHTML = '';
    stations.forEach(s => {
      const fallback = info.fallbackImg;
      const img = s.img || fallback;
      const subtitleText = s.subtitle || 'إذاعة بث مباشر 24 ساعة';
      
      listHTML += `
        <div class="radio-station-item" id="station_item_${s.id}">
          <div class="station-details">
            <img src="${img}" alt="${s.name}" class="station-avatar" onerror="this.onerror=null; this.src='${fallback}'" loading="lazy">
            <div class="station-meta">
              <span class="station-name">${s.name}</span>
              <span class="station-subtitle">${subtitleText}</span>
            </div>
          </div>
          <button class="station-play-btn" onclick="toggleRadioPlay('${s.url}', '${cardId}', '${s.id}')" aria-label="تشغيل الإذاعة">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="radio-card-header" onclick="toggleCardExpansion('${cardId}')" role="button" aria-expanded="false" tabindex="0">
        <div class="header-main">
          <div class="header-icon-wrapper">
            ${info.icon}
          </div>
          <div class="header-text">
            <h3>${info.title}</h3>
            <span class="stations-badge">${stations.length} إذاعة</span>
          </div>
        </div>
        
        <div class="header-controls">
          <!-- Audio Visualizer (Equalizer Animation) -->
          <div class="card-mini-visualizer" id="card_visualizer_${cardId}">
            <span class="eq-bar bar1"></span>
            <span class="eq-bar bar2"></span>
            <span class="eq-bar bar3"></span>
          </div>
          
          <!-- Mini Pause/Play on closed card -->
          <button class="card-mini-play-btn" id="card_btn_${cardId}" onclick="toggleCardPlayback('${cardId}', event)" aria-label="تحكم البث">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          
          <div class="accordion-arrow-wrapper">
            <svg class="accordion-arrow" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="radio-stations-list">
        <div class="stations-list-inner">
          ${listHTML}
        </div>
      </div>
    `;
    
    grid.appendChild(card);
    
    // Add Keyboard Enter key integration for accessibility
    const cardHeader = card.querySelector('.radio-card-header');
    cardHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCardExpansion(cardId);
      }
    });
  });
  
  // Re-observe animations since new dynamic elements were generated
  setupFadeAnimations();
}

/**
 * Synchronizes playing states, adding glowing glass overlays, spin loaders and visualizers
 */
function updateRadioUIStates() {
  // 1. Reset all card outer controllers and visualization
  document.querySelectorAll('.radio-card').forEach(card => {
    const cardId = card.id;
    const miniBtn = document.getElementById(`card_btn_${cardId}`);
    const miniViz = document.getElementById(`card_visualizer_${cardId}`);
    
    card.classList.remove('card-playing', 'card-buffering');
    
    if (miniBtn) {
      miniBtn.innerHTML = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      miniBtn.classList.remove('playing', 'buffering');
      miniBtn.style.display = 'none'; // Hidden when dormant
    }
    
    if (miniViz) {
      miniViz.classList.remove('active');
    }
  });
  
  // 2. Reset all internal lists play buttons
  document.querySelectorAll('.radio-station-item').forEach(item => {
    item.classList.remove('playing', 'buffering');
    const playBtn = item.querySelector('.station-play-btn');
    if (playBtn) {
      playBtn.innerHTML = `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      playBtn.classList.remove('playing', 'buffering');
    }
  });
  
  // 3. Highlight playing/buffering active station
  if (activeStationId) {
    const activeItem = document.getElementById(`station_item_${activeStationId}`);
    const activeCard = document.getElementById(activeCardId);
    
    if (activeCard) {
      const cardMiniBtn = document.getElementById(`card_btn_${activeCardId}`);
      const cardMiniViz = document.getElementById(`card_visualizer_${activeCardId}`);
      
      if (cardMiniBtn) cardMiniBtn.style.display = 'flex'; // Expose controls
      
      if (isRadioBuffering) {
        activeCard.classList.add('card-buffering');
        if (cardMiniBtn) {
          cardMiniBtn.classList.add('buffering');
          cardMiniBtn.innerHTML = `<div class="radio-mini-spinner"></div>`;
        }
      } else if (isRadioPlaying) {
        activeCard.classList.add('card-playing');
        if (cardMiniBtn) {
          cardMiniBtn.classList.add('playing');
          cardMiniBtn.innerHTML = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`; // Pause
        }
        if (cardMiniViz) {
          cardMiniViz.classList.add('active'); // Animate bars
        }
      }
    }
    
    if (activeItem) {
      const playBtn = activeItem.querySelector('.station-play-btn');
      
      if (isRadioBuffering) {
        activeItem.classList.add('buffering');
        if (playBtn) {
          playBtn.classList.add('buffering');
          playBtn.innerHTML = `<div class="radio-spinner"></div>`;
        }
      } else if (isRadioPlaying) {
        activeItem.classList.add('playing');
        if (playBtn) {
          playBtn.classList.add('playing');
          playBtn.innerHTML = `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`; // Pause
        }
      }
    }
  }

  // 4. Update the Floating Player UI
  const fp = document.getElementById('floatingPlayer');
  const fpTitle = document.getElementById('fpTitle');
  const fpSubtitle = document.getElementById('fpSubtitle');
  const fpImg = document.getElementById('fpImg');
  const fpPlayBtn = document.getElementById('fpPlayBtn');
  const fpVolumeSlider = document.getElementById('fpVolumeSlider');

  if (activeStationId) {
    const activeStation = radioStations.find(s => s.id === activeStationId);
    if (activeStation) {
      const info = radioGroups[activeStation.group];
      const fallback = info ? info.fallbackImg : 'assets/images/logo.png';
      const img = activeStation.img || fallback;
      const subtitleText = activeStation.subtitle || 'بث مباشر 24 ساعة';

      if (fpTitle) fpTitle.textContent = activeStation.name;
      if (fpSubtitle) fpSubtitle.textContent = subtitleText;
      if (fpImg) fpImg.src = img;

      if (fp) {
        fp.classList.add('active');
        if (isRadioPlaying) {
          fp.classList.add('playing');
          fp.classList.remove('buffering');
          if (fpPlayBtn) fpPlayBtn.innerHTML = `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        } else if (isRadioBuffering) {
          fp.classList.add('buffering');
          fp.classList.remove('playing');
          if (fpPlayBtn) fpPlayBtn.innerHTML = `<div class="radio-mini-spinner" style="border-color: var(--navy) var(--navy) transparent transparent"></div>`;
        }
      }
      // Sync the volume slider to currently active audio volume
      if (fpVolumeSlider && globalAudio) {
        fpVolumeSlider.value = globalAudio.volume;
      }
    }
  } else {
    if (fp) {
      fp.classList.remove('active', 'playing', 'buffering');
    }
  }
}

