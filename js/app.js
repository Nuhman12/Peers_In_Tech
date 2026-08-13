/* ===========================================================
   PEERS-IN-TECH — app.js
   Shared behaviour across all pages
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky header: transparent over hero, solid once scrolled ---------- */
  const header = document.querySelector('header');
  if (header) {
    const applyScrollState = () => {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    applyScrollState();
    window.addEventListener('scroll', applyScrollState, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Active nav link ---------- */
  const current = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---------- Ticker content ---------- */
  const ticker = document.getElementById('ticker');
  if (ticker) {
    const skills = ["Digital Literacy","Graphic Design","Microsoft Office","Web Development","Python Programming","UI/UX Design","Cybersecurity Basics"];
    const dup = [...skills, ...skills];
    ticker.innerHTML = dup.map(s => `<span>${s}</span>`).join('');
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ---------- Hero peer-network canvas ---------- */
  const canvas = document.getElementById('network');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W, H, nodes = [];
    const NODE_COUNT = 42;

    function resize() {
      const parent = canvas.parentElement;
      W = canvas.width = parent.offsetWidth;
      H = canvas.height = parent.offsetHeight;
    }

    function initNodes() {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 1.6 + 1
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, W, H);
      for (const n of nodes) {
        if (!reduceMotion) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > W) n.vx *= -1;
          if (n.y < 0 || n.y > H) n.vy *= -1;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(255,199,44,${(1 - dist / 150) * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(step);
    }

    resize();
    initNodes();
    step();
    window.addEventListener('resize', () => {
      resize(); initNodes();
      if (reduceMotion) step();
    });
  }

  /* ---------- Gallery lightbox (gallery.html) ---------- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    let currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      const item = items[currentIndex];
      lightboxImg.src = item.dataset.src;
      lightboxImg.alt = item.dataset.caption;
      lightboxCaption.textContent = item.dataset.caption;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    function showRelative(offset) {
      currentIndex = (currentIndex + offset + items.length) % items.length;
      openLightbox(currentIndex);
    }

    items.forEach((item, index) => {
      const btn = item.querySelector('.gallery-item-btn');
      btn.addEventListener('click', () => openLightbox(index));
    });

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', () => showRelative(-1));
    document.getElementById('lightbox-next').addEventListener('click', () => showRelative(1));

    // Click on the dark backdrop (not the image or controls) closes it
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showRelative(-1);
      if (e.key === 'ArrowRight') showRelative(1);
    });
  }

  /* ---------- FAQ: close others on open (optional polish) ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.faq-item[open]').forEach(other => {
          if (other !== item) other.removeAttribute('open');
        });
      }
    });
  });

});
