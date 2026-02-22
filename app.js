// ─────────────────────────────────────────────────
// 1. Theme toggle with animated sun ↔ moon
// ─────────────────────────────────────────────────
(function () {
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme, isInitial = false) {
    const resolved = theme === 'auto' ? getSystemTheme() : theme;

    // Use View Transitions API if supported and not the initial call
    if (document.startViewTransition && !isInitial) {
      // Add attribute to signal we're transitioning
      html.setAttribute('data-theme-transitioning', 'true');

      const transition = document.startViewTransition(() => {
        html.setAttribute('data-theme', theme);
        html.setAttribute('data-active-theme', resolved);
        document.querySelector('meta[name="color-scheme"]').content = resolved;
      });

      transition.finished.finally(() => {
        html.removeAttribute('data-theme-transitioning');
      });
    } else {
      // Fallback or initial call
      html.setAttribute('data-theme', theme);
      html.setAttribute('data-active-theme', resolved);
      document.querySelector('meta[name="color-scheme"]').content = resolved;
    }
  }

  // Init
  applyTheme(stored || 'auto', true);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-active-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });

  // Listen for system changes when on auto
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (html.getAttribute('data-theme') === 'auto') applyTheme('auto');
  });
})();

// ─────────────────────────────────────────────────
// 2. Keyboard shortcuts: 1-4 open tools, letters → search
// ─────────────────────────────────────────────────
(function () {
  const cards = document.querySelectorAll('.card[role="listitem"]');
  const searchInput = document.getElementById('toolSearch');

  document.addEventListener('keydown', (e) => {
    // Skip if user is already in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;

    // Digits 1-5 → open corresponding tool
    if (key >= '1' && key <= '5') {
      const idx = parseInt(key) - 1;
      if (cards[idx]) {
        e.preventDefault();
        cards[idx].click();
      }
      return;
    }

    // Any printable letter → focus search and type it
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      e.preventDefault();
      searchInput.focus();
      searchInput.value += key;
      searchInput.dispatchEvent(new Event('input'));
    }
  });
})();

// ─────────────────────────────────────────────────
// 3. Tilt effect (desktop, fine pointer, no reduced motion)
// ─────────────────────────────────────────────────
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (reduce || !finePointer) return;

  const cards = document.querySelectorAll('.card[data-tilt="on"]');

  function onMove(e) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -6;
    const ry = (px - 0.5) * 8;
    el.style.transform = `translateY(-3px) scale(1.01) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  function onLeave(e) {
    e.currentTarget.style.transform = '';
  }

  cards.forEach(card => {
    card.addEventListener('mousemove', onMove, { passive: true });
    card.addEventListener('mouseleave', onLeave, { passive: true });
  });
})();

// ─────────────────────────────────────────────────
// 4. Particle dot grid background
// ─────────────────────────────────────────────────
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w, h, dots = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    dots = [];
    const count = Math.floor((w * h) / 18000);
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    dots.forEach(d => {
      d.x += d.dx;
      d.y += d.dy;
      if (d.x < 0) d.x = w;
      if (d.x > w) d.x = 0;
      if (d.y < 0) d.y = h;
      if (d.y > h) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 200, 255, ${d.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', init);
})();

// ─────────────────────────────────────────────────
// 5. Cursor-following glow on cards
// ─────────────────────────────────────────────────
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  document.querySelectorAll('.card-glow').forEach(glow => {
    const card = glow.parentElement;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      glow.style.left = (e.clientX - r.left) + 'px';
      glow.style.top = (e.clientY - r.top) + 'px';
    }, { passive: true });
  });
})();

// ─────────────────────────────────────────────────
// 6. Search / Quick Filter
// ─────────────────────────────────────────────────
(function () {
  const input = document.getElementById('toolSearch');
  const cards = document.querySelectorAll('.card[role="listitem"]');
  const noResults = document.getElementById('noResults');

  input.addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.desc')?.textContent.toLowerCase() || '';
      const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.toLowerCase()).join(' ');
      const keywords = (card.dataset.keywords || '').toLowerCase();
      const haystack = `${title} ${desc} ${tags} ${keywords}`;

      if (!q || haystack.includes(q)) {
        card.classList.remove('hidden');
        visible++;
      } else {
        card.classList.add('hidden');
      }
    });

    noResults.classList.toggle('show', visible === 0 && q.length > 0);
  });
})();

// ─────────────────────────────────────────────────
// 9. Lightweight analytics ping
// ─────────────────────────────────────────────────
(function () {
  document.querySelectorAll('.card[role="listitem"]').forEach((card, i) => {
    card.addEventListener('click', () => {
      const toolName = card.querySelector('.title')?.textContent || `tool-${i + 1}`;
      // Use sendBeacon for non-blocking fire-and-forget.
      // Replace the URL below with your actual analytics endpoint.
      const payload = JSON.stringify({
        event: 'tool_click',
        tool: toolName,
        timestamp: new Date().toISOString()
      });
      if (navigator.sendBeacon) {
        // navigator.sendBeacon('/api/analytics', payload);
      }
      // Fallback: console log for development
      console.log('[Analytics]', toolName, 'clicked');
    });
  });
})();
