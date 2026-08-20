  document.getElementById('year').textContent = new Date().getFullYear();

  // theme toggle
  (function(){
    const btn = document.getElementById('themeToggle');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try{
        localStorage.setItem('ne-ti-theme', next);
        localStorage.setItem('ne-ti-theme-manual', '1'); // помечаем: выбор сделан руками, авторасчёт больше не трогает тему
      }catch(e){}
    });
  })();

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o=>{
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
