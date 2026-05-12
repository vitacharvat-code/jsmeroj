(() => {
  const track = document.getElementById('sliderTrack');
  const dotsEl = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const slides = Array.from(track.querySelectorAll('.slide'));

  let current = 0;
  let isAnimating = false;
  const players = [];

  // ── YouTube IFrame API ──────────────────────────────────────────
  window.onYouTubeIframeAPIReady = function () {
    document.querySelectorAll('.yt-player').forEach((el, i) => {
      const vid = el.dataset.vid;
      players[i] = new YT.Player(el, {
        videoId: vid,
        playerVars: {
          autoplay: i === 0 ? 1 : 0,
          mute: 1,
          loop: 1,
          playlist: vid,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady(e) {
            if (i === 0) e.target.playVideo();
          },
        },
      });
    });
  };

  function syncVideos() {
    players.forEach((p, i) => {
      if (!p || typeof p.playVideo !== 'function') return;
      if (i === current) {
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    });
  }

  // ── Dots ────────────────────────────────────────────────────────
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Snímek ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  // ── Layout helpers ──────────────────────────────────────────────
  function slideWidth() {
    return slides[0].getBoundingClientRect().width;
  }

  function gapSize() {
    return parseFloat(getComputedStyle(track).gap) || 40;
  }

  // ── Track update ────────────────────────────────────────────────
  function updateTrack(animated = true) {
    const sw = slideWidth();
    const gap = gapSize();
    const offset = -current * (sw + gap);

    track.style.transition = animated
      ? 'transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)'
      : 'none';
    track.style.transform = `translateX(${offset}px)`;

    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    Array.from(dotsEl.children).forEach((dot, i) => dot.classList.toggle('is-active', i === current));

    syncVideos();
  }

  function goTo(index) {
    if (isAnimating || index === current) return;
    isAnimating = true;
    current = Math.max(0, Math.min(index, slides.length - 1));
    updateTrack(true);
    setTimeout(() => { isAnimating = false; }, 750);
  }

  // ── Controls ────────────────────────────────────────────────────
  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // ── Touch / swipe ───────────────────────────────────────────────
  let touchStartX = 0;
  let touchDeltaX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchDeltaX = 0;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    touchDeltaX = e.touches[0].clientX - touchStartX;
    const base = -current * (slideWidth() + gapSize());
    track.style.transition = 'none';
    track.style.transform = `translateX(${base + touchDeltaX}px)`;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (touchDeltaX < -50) goTo(current + 1);
    else if (touchDeltaX > 50) goTo(current - 1);
    else updateTrack(true);
  });

  // ── Init ────────────────────────────────────────────────────────
  requestAnimationFrame(() => updateTrack(false));
})();
