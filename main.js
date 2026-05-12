(() => {
  const track = document.getElementById('sliderTrack');
  const dotsEl = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const slides = Array.from(track.querySelectorAll('.slide'));
  const n = slides.length;

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
          onReady(e) { if (i === 0) e.target.playVideo(); },
        },
      });
    });
  };

  function syncVideos() {
    players.forEach((p, i) => {
      if (!p || typeof p.playVideo !== 'function') return;
      i === current ? p.playVideo() : p.pauseVideo();
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

  // ── Helpers ─────────────────────────────────────────────────────
  function wrappedDist(i) {
    let d = i - current;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  // perspective() in the transform keeps iframes renderable
  // (parent-level `perspective` property breaks iframes in 3D context)
  function computeTransform(pos) {
    const sw = slides[0].offsetWidth || 760; // offsetWidth ignores CSS transforms (unlike getBoundingClientRect)
    const abs = Math.abs(pos);
    const sign = Math.sign(pos) || 1;
    const P = 'perspective(1100px)';

    if (abs === 0) return { t: 'translateX(0px) scale(1)',                                              opacity: 1,    z: 10 };
    if (abs === 1) return { t: `translateX(${sw * 0.63 * sign}px) ${P} rotateY(${-38 * sign}deg) scale(0.74)`, opacity: 0.78, z: 7  };
    if (abs === 2) return { t: `translateX(${sw * 1.09 * sign}px) ${P} rotateY(${-58 * sign}deg) scale(0.52)`, opacity: 0.38, z: 4  };
    return             { t: `translateX(${sw * 1.55 * sign}px) ${P} rotateY(${-70 * sign}deg) scale(0.34)`, opacity: 0,    z: 1  };
  }

  // ── Apply positions ─────────────────────────────────────────────
  function updatePositions(animated = true) {
    slides.forEach((slide, i) => {
      const { t, opacity, z } = computeTransform(wrappedDist(i));
      slide.style.transition = animated
        ? 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.75s ease'
        : 'none';
      slide.style.transform = t;
      slide.style.opacity = opacity;
      slide.style.zIndex = z;
      slide.classList.toggle('is-active', i === current);
    });
    Array.from(dotsEl.children).forEach((dot, i) =>
      dot.classList.toggle('is-active', i === current)
    );
    syncVideos();
  }

  // ── Navigation ──────────────────────────────────────────────────
  function goTo(index) {
    if (isAnimating || ((index % n + n) % n) === current) return;
    isAnimating = true;
    current = (index % n + n) % n;
    updatePositions(true);
    setTimeout(() => { isAnimating = false; }, 800);
  }

  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // ── Touch ───────────────────────────────────────────────────────
  let touchStartX = 0, touchDeltaX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchDeltaX = 0;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    touchDeltaX = e.touches[0].clientX - touchStartX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (touchDeltaX < -50)     goTo(current + 1);
    else if (touchDeltaX > 50) goTo(current - 1);
  });

  window.addEventListener('resize', () => updatePositions(false));

  requestAnimationFrame(() => updatePositions(false));
})();
