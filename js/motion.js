  // анимации интерфейса: появление при скролле, счётчики, «прожектор» на карточках,
  // магнитные кнопки, наклон фото объектов, параллакс hero, прогресс прокрутки.
  // Текст страницы не меняется — счётчики возвращают исходное значение из HTML.
  (function(){
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const root = document.documentElement;

    // --- прогресс прокрутки + «сжатие» шапки ---
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    const header = document.querySelector('header');
    const heroPanel = document.querySelector('.hero > .wrap');
    let ticking = false;
    function onScroll(){
      const max = root.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if(header) header.classList.toggle('is-scrolled', y > 24);
      if(heroPanel && !reduce && y < window.innerHeight * 1.2){
        heroPanel.style.setProperty('--hero-shift', (y * 0.18).toFixed(1) + 'px');
      }
      ticking = false;
    }
    window.addEventListener('scroll', ()=>{
      if(!ticking){ ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if(reduce) return;

    // --- появление блоков при скролле (с каскадной задержкой внутри группы) ---
    const groups = [
      '.section-head', '.salah-card',
      '.services > .service', '.process > .process-row', '.cases-grid > .case-row',
      '.faq-list > .faq-item', '.stat-list > .stat', '.coverage-grid > div',
      '.city-tags > .city-tag', '.foot-grid > .foot-col', '.foot-bottom',
      'main > section:not(.hero) > .wrap[style*="820px"]'
    ];
    const revealEls = [];
    groups.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if(el.closest('.hero') || el.classList.contains('reveal')) return;
        const siblings = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.matches(sel)) : [el];
        const i = Math.max(0, siblings.indexOf(el));
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i, 8) * (sel.indexOf('city-tag') > -1 ? 35 : 80) + 'ms';
        revealEls.push(el);
      });
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // после появления снимаем служебные классы — у карточек снова свои, быстрые ховеры
        setTimeout(()=>{ el.style.transitionDelay = ''; el.classList.remove('reveal', 'is-visible'); }, 1600);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));

    // --- счётчики цифр (1000+, 17, 48ч, 2 дня …) ---
    function countUp(el){
      const original = el.textContent;
      const m = original.match(/^(\D*)(\d+)(.*)$/);
      if(!m) return;
      const target = parseInt(m[2], 10);
      if(!target) return;
      const dur = 1400, start = performance.now();
      el.style.fontVariantNumeric = 'tabular-nums';
      function step(now){
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = m[1] + Math.round(target * eased) + m[3];
        if(p < 1) requestAnimationFrame(step);
        else el.textContent = original;
      }
      requestAnimationFrame(step);
    }
    const counterIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){ countUp(e.target); counterIO.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.hero-meta b, .stat b').forEach(el => counterIO.observe(el));

    if(!finePointer) return;

    // --- «прожектор» за курсором на карточках ---
    document.querySelectorAll('.service, .process-row, .faq-item, .salah-card, .diagram-card').forEach(card => {
      card.classList.add('spotlight');
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // --- лёгкий 3D-наклон фото объектов ---
    document.querySelectorAll('.case-row').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', ()=>{ card.style.transform = ''; });
    });

    // --- магнитные кнопки ---
    document.querySelectorAll('.btn-accent, .wa-float, .theme-toggle').forEach(btn => {
      const strength = btn.classList.contains('btn') ? 0.25 : 0.35;
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (x * strength).toFixed(1) + 'px,' + (y * strength).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', ()=>{ btn.style.transform = ''; });
    });
  })();
