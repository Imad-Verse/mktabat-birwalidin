/* ============================================
   مكتبة بر الوالدين - Main JavaScript
   Refactored: Performance, Accessibility, SEO
   + Blogger RSS & YouTube API Integration
   ============================================ */

/* ==========================================================
   📌 CONFIGURATION – Fill these values to connect live data
   ========================================================== */
const CONFIG = {

  /* ---- Blogger RSS: Articles Section ---- */
  // Your Blogger blog ID for مقالات (articles)
  // Example: 'https://YOUR-BLOG.blogspot.com/feeds/posts/default/-/مقالات?alt=json&max-results=6'
  blogger: {
    articles: {
      enabled: false,               // ← Set to true when ready
      blogId: '',                    // ← e.g. '1234567890'
      label: 'مقالات',              // ← Blogger label to filter by
      maxResults: 6,
    },
    schedule: {
      enabled: false,               // ← Set to true when ready
      blogId: '',                    // ← same or different blog
      label: 'جدول الدروس',         // ← Blogger label for schedule posts
      maxResults: 6,
    },
  },

  /* ---- YouTube Data API v3: Videos Section ---- */
  youtube: {
    enabled: false,                  // ← Set to true when ready
    apiKey: '',                    // ← Your YouTube Data API v3 key
    channelId: '',                   // ← Your channel ID (UC...)
    maxResults: 6,
  },
};
/* ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- YouTube Iframe Loader (shared by static + API) ---------- */
  function loadYouTube(wrapper) {
    const videoId = wrapper.getAttribute('data-yt');
    if (!videoId || wrapper.querySelector('iframe')) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    iframe.title = wrapper.getAttribute('aria-label') || 'فيديو يوتيوب';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.loading = 'lazy';

    wrapper.style.cursor = 'default';
    wrapper.innerHTML = '';
    wrapper.appendChild(iframe);
  }

  /* ---------- Blogger RSS Fetcher ---------- */
  function buildBloggerUrl(cfg) {
    // Blogger JSON feed URL format
    return `https://www.blogger.com/feeds/${cfg.blogId}/posts/default/-/${encodeURIComponent(cfg.label)}?alt=json&max-results=${cfg.maxResults}`;
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

  // Fetch & render Blogger articles
  if (CONFIG.blogger.articles.enabled && CONFIG.blogger.articles.blogId) {
    const grid = document.getElementById('articlesGrid');
    if (grid) {
      fetch(buildBloggerUrl(CONFIG.blogger.articles))
        .then(r => r.json())
        .then(data => {
          const entries = data.feed.entry;
          if (!entries || entries.length === 0) return;

          grid.innerHTML = ''; // Clear static fallback
          entries.forEach(entry => {
            const title = entry.title.$t;
            const content = entry.content ? entry.content.$t : '';
            const excerpt = stripHtml(content).substring(0, 120) + '...';
            const image = getFirstImage(content);
            const link = entry.link.find(l => l.rel === 'alternate');
            const url = link ? link.href : '#';
            const label = entry.category ? entry.category[0].term : '';

            const card = document.createElement('article');
            card.className = 'article-card fade-up visible';
            card.innerHTML = `
              <div class="article-img"><img src="${image}" alt="${title}" loading="lazy" width="400" height="200"></div>
              <div class="article-body">
                ${label ? `<span class="article-tag">${label}</span>` : ''}
                <h3>${title}</h3>
                <p>${excerpt}</p>
                <a href="${url}" class="article-link" target="_blank" rel="noopener">اقرأ المزيد ←</a>
              </div>`;
            grid.appendChild(card);
          });
        })
        .catch(err => console.warn('Blogger articles fetch failed, using static fallback:', err));
    }
  }

  // Fetch & render Blogger schedule or local JSON
  const scheduleGrid = document.getElementById('scheduleGrid');
  if (scheduleGrid) {
    const loadLocalSchedule = () => {
      fetch('data/schedule.json?t=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
          scheduleGrid.innerHTML = '';
          if(data.length === 0) {
             scheduleGrid.innerHTML = '<p style="text-align:center;width:100%;grid-column:1/-1;">لا توجد دروس مبرمجة حالياً.</p>';
             return;
          }
          data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'schedule-card fade-up visible';
            card.innerHTML = `
              <span class="schedule-day">${item.day}</span>
              <h3>${item.title}</h3>
              ${item.scholar ? `<div style="color:var(--text-light); margin-bottom:12px; font-weight:bold; font-size: 0.95rem;">👤 ${item.scholar}</div>` : ''}
              <div class="schedule-meta">
                <span>🕐 ${item.time}</span>
                <span>📍 ${item.location}</span>
              </div>`;
            scheduleGrid.appendChild(card);
          });
        })
        .catch(err => console.error('Error loading schedule:', err));
    };

    if (CONFIG.blogger.schedule.enabled && CONFIG.blogger.schedule.blogId) {
      fetch(buildBloggerUrl(CONFIG.blogger.schedule))
        .then(r => r.json())
        .then(data => {
          const entries = data.feed.entry;
          if (!entries || entries.length === 0) return loadLocalSchedule();

          scheduleGrid.innerHTML = '';
          entries.forEach(entry => {
            const title = entry.title.$t;
            const content = entry.content ? stripHtml(entry.content.$t).substring(0, 100) : '';
            const label = entry.category ? entry.category[0].term : '';

            const card = document.createElement('div');
            card.className = 'schedule-card fade-up visible';
            card.innerHTML = `
              ${label ? `<span class="schedule-day">${label}</span>` : ''}
              <h3>${title}</h3>
              <div class="schedule-meta"><span>${content}</span></div>`;
            scheduleGrid.appendChild(card);
          });
        })
        .catch(err => {
          console.warn('Blogger schedule fetch failed, using local fallback:', err);
          loadLocalSchedule();
        });
    } else {
      loadLocalSchedule();
    }
  }

  /* ---------- YouTube Data API v3 Fetcher ---------- */
  if (CONFIG.youtube.enabled && CONFIG.youtube.apiKey && CONFIG.youtube.channelId) {
    const grid = document.getElementById('videosGrid');
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtube.apiKey}&channelId=${CONFIG.youtube.channelId}&part=snippet&order=date&type=video&maxResults=${CONFIG.youtube.maxResults}`;

    if (grid) {
      fetch(ytUrl)
        .then(r => r.json())
        .then(data => {
          if (!data.items || data.items.length === 0) return;

          grid.innerHTML = '';
          data.items.forEach(item => {
            const videoId = item.id.videoId;
            const title = item.snippet.title;
            const thumb = item.snippet.thumbnails.high
              ? item.snippet.thumbnails.high.url
              : item.snippet.thumbnails.default.url;

            const card = document.createElement('div');
            card.className = 'video-card fade-up visible';
            card.innerHTML = `
              <div class="video-wrapper" data-yt="${videoId}"
                   role="button" tabindex="0"
                   aria-label="${title}"
                   style="background-image:url(${thumb});background-size:cover;background-position:center">
              </div>
              <div class="video-info"><h3>${title}</h3></div>`;
            grid.appendChild(card);

            // Click-to-play for dynamically added cards
            const wrapper = card.querySelector('.video-wrapper');
            wrapper.addEventListener('click', () => loadYouTube(wrapper));
            wrapper.addEventListener('keydown', e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadYouTube(wrapper); }
            });
          });
        })
        .catch(err => console.warn('YouTube API fetch failed, using static fallback:', err));
    }
  }

  /* ---------- Mobile Navigation Toggle ---------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'فتح القائمة');
      });
    });
  }

  /* ---------- Navbar Active Link on Scroll (debounced) ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActiveNav() {
    const scrollY = window.scrollY + 120;
    let found = false;
    // Iterate in reverse so the last matching section wins
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (!found && scrollY >= top && scrollY < top + height) {
        const id = section.getAttribute('id');
        navItems.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
        found = true;
      }
    }
  }

  /* ---------- Scroll-to-Top Button ---------- */
  const scrollTopBtn = document.getElementById('scrollTop');

  function toggleScrollTop() {
    if (!scrollTopBtn) return;
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Debounced Scroll Handler ---------- */
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        setActiveNav();
        toggleScrollTop();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ---------- Fade-In on Scroll (Intersection Observer) ---------- */
  const fadeEls = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all elements immediately
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ---------- Bind click-to-play for static video wrappers ---------- */
  const videoWrappers = document.querySelectorAll('.video-wrapper[data-yt]');

  videoWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', () => loadYouTube(wrapper));

    // Keyboard support
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('role', 'button');
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadYouTube(wrapper);
      }
    });
  });

  /* ---------- Scholar Modal ---------- */
  const modalOverlay = document.getElementById('scholarModal');
  const modalImg = document.getElementById('modalImg');
  const modalName = document.getElementById('modalName');
  const modalBio = document.getElementById('modalBio');
  const modalSocials = document.getElementById('modalSocials');
  const modalClose = document.getElementById('modalClose');
  let lastFocusedEl = null; // For focus trap restoration

  // Scholar data
  const scholarsData = {
    1: {
      name: 'الشيخ عبد اللطيف سليماني',
      bio: 'طالب علم وداعية إلى الله، متخصص في العقيدة والفقه الإسلامي على منهج أهل السنة والجماعة. له دروس ومحاضرات متعددة في شرح كتب العلم الشرعي.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    2: {
      name: 'الدكتور يحي غشي',
      bio: 'بروفيسور في العقيدة، والمدرس بالجامعة الإسلامية سابقا، والمحاضرة في جامعة غرداية.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    3: {
      name: 'الشيخ جمال ذكار',
      bio: 'من كبار المشايخ في منطقته، متخصص في الفقه المالكي وأصول الفقه. له إسهامات كبيرة في التعليم الشرعي والدعوة إلى الله.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    4: {
      name: 'الشيخ محمد مرابط',
      bio: 'طالب علم وإمام مسجد، يُعنى بتعليم القرآن الكريم وتحفيظه. له حلقات متعددة في التفسير وعلوم القرآن.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    5: {
      name: 'الشيخ محمد رشيد هلالي',
      bio: 'داعية إلى الله وطالب علم شرعي، يهتم بنشر العلم الشرعي الصحيح وفق منهج السلف الصالح. له دروس في العقيدة الواسطية.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    6: {
      name: 'الدكتور نبيل بلهي',
      bio: 'عالم دين وخطيب، متخصص في السيرة النبوية والتاريخ الإسلامي. يقدم محاضرات تربوية ودعوية.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    7: {
      name: 'الشيخ عبد الكريم حڨيڨة',
      bio: 'طالب علم ومربٍّ، يُعنى بتزكية النفوس والتربية الإيمانية على ضوء الكتاب والسنة بفهم سلف الأمة.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    8: {
      name: 'الشيخ يوسف',
      bio: 'داعية ومعلم، يركز على تبسيط العلوم الشرعية وتقديمها بأسلوب عصري يناسب جميع الفئات.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    9: {
      name: 'الشيخ عبد الرحمان بونواشة',
      bio: 'متخصص في علم التوحيد والعقيدة السلفية. له دروس مسجلة وكتابات في شرح كتب أئمة الدعوة.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    10: {
      name: 'الشيخ خالد بوعيش',
      bio: 'إمام وخطيب، يهتم بالفتاوى الشرعية والنوازل المعاصرة وفق منهج أهل السنة والجماعة.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    11: {
      name: 'الشيخ نور الدين تومي',
      bio: 'طالب علم متخصص في اللغة العربية والنحو، يقدم دروسًا في الآجرومية وألفية ابن مالك.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    12: {
      name: 'الشيخ عبد الرحمن عمير',
      bio: 'داعية ومعلم قرآن، يُعنى بتعليم أحكام التجويد ومخارج الحروف وفق رواية ورش عن نافع.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    },
    13: {
      name: 'الشيخ عبد الرحيم بوڨطة',
      bio: 'عالم دين وداعية، يهتم بالردود العلمية والمناظرات الشرعية ونشر المنهج السلفي الصحيح.',
      socials: { youtube: '#', facebook: '#', telegram: '#' }
    }
  };

  // SVG icon templates (avoid repetition)
  const svgIcons = {
    youtube: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
    facebook: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"/></svg>',
    telegram: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M11.9 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.6 8.2l-1.8 8.7c-.1.6-.5.8-1 .5l-2.8-2-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.8l10.5-4c.5-.2.9.1.8.8z"/></svg>'
  };

  const socialLabels = { youtube: 'يوتيوب', facebook: 'فيسبوك', telegram: 'تلغرام' };

  function openModal(id) {
    const data = scholarsData[id];
    if (!data || !modalOverlay) return;

    modalImg.src = `images/${id}.jpg`;
    modalImg.alt = data.name;
    modalName.textContent = data.name;
    modalBio.textContent = data.bio;

    // Build social links using document fragment (avoids innerHTML reflows)
    const fragment = document.createDocumentFragment();
    Object.entries(data.socials).forEach(([platform, url]) => {
      if (!url || !svgIcons[platform]) return;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', socialLabels[platform] || platform);
      a.innerHTML = svgIcons[platform];
      fragment.appendChild(a);
    });
    modalSocials.innerHTML = '';
    modalSocials.appendChild(fragment);

    // Show modal
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Save focus and move to close button
    lastFocusedEl = document.activeElement;
    modalClose.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Restore focus to the element that triggered the modal
    if (lastFocusedEl) {
      lastFocusedEl.focus();
      lastFocusedEl = null;
    }
  }

  // Open modal – click & keyboard support
  document.querySelectorAll('.scholar-card[data-id]').forEach(card => {
    const handler = () => openModal(card.getAttribute('data-id'));
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });

  // Close modal
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Focus trap inside modal + Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    // Focus trap: keep Tab within modal when open
    if (e.key === 'Tab' && modalOverlay && modalOverlay.classList.contains('active')) {
      const focusable = modalOverlay.querySelectorAll(
        'button, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Initial calls
  setActiveNav();
  toggleScrollTop();

});
