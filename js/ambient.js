/* ══════════════════════════════════════════════
   AMBIENT — Nupcial Platform
   Partículas douradas flutuando suavemente.
══════════════════════════════════════════════ */

(function () {

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  Object.assign(canvas.style, {
    position:      'fixed',
    inset:         '0',
    width:         '100%',
    height:        '100%',
    zIndex:        '0',
    pointerEvents: 'none',
    opacity:       '1',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, particles, raf;

  const isDark = document.body.classList.contains('dark')
    || window.location.pathname.includes('index');

  const COLORS_DARK  = ['rgba(201,168,76,', 'rgba(232,213,163,', 'rgba(138,110,47,'];
  const COLORS_LIGHT = ['rgba(201,168,76,', 'rgba(90,99,71,',   'rgba(107,117,96,'];
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x          = Math.random() * W;
      this.y          = initial ? Math.random() * H : H + 10;
      this.size       = Math.random() * 1.8 + 0.4;
      this.speedY     = -(Math.random() * 0.35 + 0.1);
      this.speedX     = (Math.random() - 0.5) * 0.18;
      this.opacity    = 0;
      this.maxOpacity = Math.random() * 0.45 + 0.1;
      this.fadeIn     = Math.random() * 0.004 + 0.002;
      this.fadeOut    = Math.random() * 0.002 + 0.001;
      this.fading     = false;
      this.color      = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.wave       = Math.random() * Math.PI * 2;
      this.waveSpeed  = Math.random() * 0.012 + 0.004;
      this.waveAmp    = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.wave += this.waveSpeed;
      this.x    += this.speedX + Math.sin(this.wave) * this.waveAmp;
      this.y    += this.speedY;

      if (!this.fading) {
        this.opacity = Math.min(this.opacity + this.fadeIn, this.maxOpacity);
        if (this.y < H * 0.15) this.fading = true;
      } else {
        this.opacity -= this.fadeOut;
      }

      if (this.opacity <= 0 || this.y < -10) this.reset();
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.opacity + ')';
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 18000), 55);
    particles = Array.from({ length: count }, () => new Particle());
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    init();
    tick();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  });

  init();
  tick();

})();