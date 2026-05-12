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

  // ── Circular distance ───────────────────────────────────────────
  function wrappedDist(i) {
    let d = i - current;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  // ── 3D transform per position ───────────────────────────────────
  // Cards are arranged on an arc: active faces viewer straight-on,
  // neighbours are rotated inward and pushed back in Z.
  function computeTransform(pos) {
    const sw = slides[0].getBoundingClientRect().width || 780;
    const abs = Math.abs(pos);
    const sign = Math.sign(pos) || 1;

    if (abs === 0) {
      return { tx: 0,            tz: 0,    ry: 0,           scale: 1,    opacity: 1,    z: 10 };
    }
    if (abs === 1) {
      return { tx: sw * 0.64 * sign, tz: -170, ry: -40 * sign, scale: 0.66, opacity: 0.72, z: 7  };
    }
    if (abs === 2) {
      return { tx: sw * 1.10 * sign, tz: -320, ry: -60 * sign, scale: 0.46, opacity: 0.32, z: 4  };
    }
    return   { tx: sw * 1.55 * sign, tz: -450, ry: -72 * sign, scale: 0.3,  opacity: 0,    z: 1  };
  }

  // ── Apply positions ─────────────────────────────────────────────
  function updatePositions(animated = true) {
    slides.forEach((slide, i) => {
      const { tx, tz, ry, scale, opacity, z } = computeTransform(wrappedDist(i));

      slide.style.transition = animated
        ? 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.75s ease'
        : 'none';
      slide.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
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

  // Click a side card to focus it
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
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
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (touchDeltaX < -50)      goTo(current + 1);
    else if (touchDeltaX > 50)  goTo(current - 1);
  });

  // ── Resize ──────────────────────────────────────────────────────
  window.addEventListener('resize', () => updatePositions(false));

  // ── Init ────────────────────────────────────────────────────────
  requestAnimationFrame(() => updatePositions(false));
})();
