(() => {
  const loader = document.querySelector('.loader');
  const menuButton = document.querySelector('.menu-toggle');
  const header = document.querySelector('.site-header');
  const floatingBook = document.querySelector('.floating-book');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('load', () => {
    setTimeout(() => loader?.classList.add('done'), 450);
  });

  /* ------------------------------------------------------------
     Language switcher (elegant pill + dropdown)
     ------------------------------------------------------------ */
  const langSwitcher = document.querySelector('.lang-switcher');
  if (langSwitcher) {
    const langToggle = langSwitcher.querySelector('.lang-toggle');

    const closeLang = () => {
      langSwitcher.classList.remove('open');
      langToggle?.setAttribute('aria-expanded', 'false');
    };

    langToggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = langSwitcher.classList.toggle('open');
      langToggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (event) => {
      if (!langSwitcher.contains(event.target)) closeLang();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLang();
    });
  }

  /* ------------------------------------------------------------
     Booking channel — WhatsApp (single source of truth for links
     that are built in JavaScript, e.g. the mobile panel CTA)
     ------------------------------------------------------------ */
  const WA_NUMBER = '51971518033';
  const waMessages = {
    en: 'Hi! I would like to book the Salinas 4x4 Experience (S/ 90 per person). Which dates are available?',
    es: '¡Hola! Quisiera reservar la Experiencia Salinas 4x4 (S/ 90 por persona). ¿Qué fechas tienen disponibles?',
    fr: "Bonjour ! Je souhaite réserver l'Expérience Salinas 4x4 (S/ 90 par personne). Quelles dates sont disponibles ?",
    de: 'Hallo! Ich möchte das Salinas 4x4 Erlebnis buchen (S/ 90 pro Person). Welche Termine sind verfügbar?'
  };
  const pageLang = document.documentElement.lang || 'en';
  const waHref = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waMessages[pageLang] || waMessages.en);

  /* ------------------------------------------------------------
     Accessible mobile navigation, built from existing markup
     ------------------------------------------------------------ */
  if (menuButton) {
    const nav = document.querySelector('.desktop-nav');
    const langMenu = document.querySelector('.lang-menu');
    const langBlock = langMenu
      ? '<div class="mobile-lang">' + langMenu.innerHTML + '</div>'
      : '';

    const mobilePanel = document.createElement('div');
    mobilePanel.className = 'mobile-panel';
    mobilePanel.innerHTML =
      (nav ? nav.innerHTML : '') +
      langBlock +
      '<a class="mobile-book" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' +
      (pageLang === 'es' ? 'Reserva tu experiencia ↗'
        : pageLang === 'fr' ? 'Réservez votre expérience ↗'
        : pageLang === 'de' ? 'Erlebnis buchen ↗'
        : 'Book your experience ↗') +
      '</a>';

    header.appendChild(mobilePanel);

    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      mobilePanel.classList.toggle('open', !open);
      document.body.classList.toggle('menu-open', !open);
      if (open) document.querySelector('.lang-switcher')?.classList.remove('open');
    });

    mobilePanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      mobilePanel.classList.remove('open');
      document.body.classList.remove('menu-open');
    }));
  }

  /* ------------------------------------------------------------
     Reveal animation
     ------------------------------------------------------------ */
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------
     Header / floating button states
     ------------------------------------------------------------ */
  const onScroll = () => {
    floatingBook?.classList.toggle('visible', window.scrollY > window.innerHeight * .75);
    header?.classList.toggle('header-scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------
     Lenis + GSAP progressive enhancement
     ------------------------------------------------------------ */
  if (!reduceMotion && window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      gsap.fromTo('.hero-image', { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'power2.out' });
      gsap.to('.feature-photo', {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '.feature-image', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.to('.landscape-bg', {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.landscape', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    } else {
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', event => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) { event.preventDefault(); lenis.scrollTo(target, { offset: -20 }); }
      });
    });
  }

  /* ------------------------------------------------------------
     FAQ: keep one answer open at a time
     ------------------------------------------------------------ */
  document.querySelectorAll('.faq-list details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (detail.open) {
        document.querySelectorAll('.faq-list details').forEach(other => {
          if (other !== detail) other.open = false;
        });
      }
    });
  });

  /* ------------------------------------------------------------
     Photo wall lightbox — progressive enhancement, native <dialog>
     Labels come from data-lb-* attributes, so every language keeps
     its own wording. Keyboard: arrows to browse, Esc to close.
     ------------------------------------------------------------ */
  const photoWall = document.querySelector('.photo-wall');
  const photoWallHost = document.querySelector('.photowall');

  if (photoWall && photoWallHost && 'HTMLDialogElement' in window) {
    const cards = Array.from(photoWall.querySelectorAll('.photo-card'));
    const label = (key, fallback) => photoWallHost.getAttribute('data-lb-' + key) || fallback;
    const icons = {
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
      prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>',
      next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>'
    };

    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.innerHTML =
      '<button class="lightbox-btn lightbox-close" type="button" aria-label="' + label('close', 'Close photo') + '">' + icons.close + '</button>' +
      '<button class="lightbox-btn lightbox-prev" type="button" aria-label="' + label('prev', 'Previous photo') + '">' + icons.prev + '</button>' +
      '<button class="lightbox-btn lightbox-next" type="button" aria-label="' + label('next', 'Next photo') + '">' + icons.next + '</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(dialog);

    const dialogImage = dialog.querySelector('img');
    const dialogCaption = dialog.querySelector('figcaption');
    let current = 0;

    const show = index => {
      current = (index + cards.length) % cards.length;
      const thumb = cards[current].querySelector('img');
      dialogImage.src = thumb.currentSrc || thumb.src;
      dialogImage.alt = thumb.alt || '';
      dialogCaption.textContent = cards[current].getAttribute('data-caption') || thumb.alt || '';
    };

    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        show(index);
        if (dialog.open) return;
        dialog.showModal();
        document.body.classList.add('lightbox-open');
      });
    });

    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
    dialog.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));

    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { show(current + 1); event.preventDefault(); }
      if (event.key === 'ArrowLeft') { show(current - 1); event.preventDefault(); }
    });

    dialog.addEventListener('close', () => {
      document.body.classList.remove('lightbox-open');
      dialogImage.removeAttribute('src');
      cards[current]?.focus();
    });
  }
})();