  // prayer times (namaz) — Astana, Hanafi asr, MWL angles — + auto light/dark theme by Maghrib/sunrise
  (function(){
    const LAT = 51.1801, LNG = 71.4460, TZ = 5; // Astana, Kazakhstan (single UTC+5 zone since 2024)
    // Углы и поправки калиброваны по таблице azan.kz (ханафитский мазхаб, г. Астана) — расхождение < 2 минут
    const FAJR_ANGLE = 15, ISHA_ANGLE = 15;
    const ASR_FACTOR = 2; // Hanafi madhhab
    const IHTIYAT = { fajr: -1.2, sunrise: -5.2, dhuhr: 5.0, asr: 4.9, maghrib: 4.35, isha: 0.0 }; // минуты, поправка безопасности как у azan.kz

    function julian(y, m, d){
      if(m <= 2){ y -= 1; m += 12; }
      const A = Math.floor(y/100), B = 2 - A + Math.floor(A/4);
      return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + d + B - 1524.5;
    }
    function sunPos(jd){
      const D = jd - 2451545.0;
      const g = ((357.529 + 0.98560028*D) % 360) * Math.PI/180;
      const q = (280.459 + 0.98564736*D) % 360;
      const Ldeg = (q + 1.915*Math.sin(g) + 0.020*Math.sin(2*g)) % 360;
      const L = Ldeg * Math.PI/180;
      const e = (23.439 - 0.00000036*D) * Math.PI/180;
      let RA = Math.atan2(Math.cos(e)*Math.sin(L), Math.cos(L)) * 180/Math.PI / 15;
      RA = ((RA % 24) + 24) % 24;
      const decl = Math.asin(Math.sin(e)*Math.sin(L));
      let eqt = q/15 - RA;
      if(eqt > 12) eqt -= 24;
      if(eqt < -12) eqt += 24;
      return { decl, eqt };
    }
    function hourAngle(angleDeg, latDeg, decl){
      const lat = latDeg * Math.PI/180;
      const a = angleDeg * Math.PI/180;
      let cosH = (Math.sin(a) - Math.sin(lat)*Math.sin(decl)) / (Math.cos(lat)*Math.cos(decl));
      cosH = Math.max(-1, Math.min(1, cosH));
      return Math.acos(cosH) * 180/Math.PI / 15;
    }
    function asrAngle(factor, latDeg, decl){
      const lat = latDeg * Math.PI/180;
      const x = factor + Math.tan(Math.abs(lat - decl));
      return Math.atan(1/x) * 180/Math.PI;
    }
    function calcTimesFor(date){
      const jd = julian(date.getFullYear(), date.getMonth()+1, date.getDate()) - TZ/24 + 0.5;
      const { decl, eqt } = sunPos(jd);
      const dhuhr = 12 + TZ - LNG/15 - eqt;
      const t = (angle) => hourAngle(angle, LAT, decl);
      return {
        fajr: dhuhr - t(-FAJR_ANGLE) + IHTIYAT.fajr/60,
        sunrise: dhuhr - t(-0.833) + IHTIYAT.sunrise/60,
        dhuhr: dhuhr + IHTIYAT.dhuhr/60,
        asr: dhuhr + t(asrAngle(ASR_FACTOR, LAT, decl)) + IHTIYAT.asr/60,
        maghrib: dhuhr + t(-0.833) + IHTIYAT.maghrib/60,
        isha: dhuhr + t(-ISHA_ANGLE) + IHTIYAT.isha/60
      };
    }
    function fmtHM(h){
      h = ((h % 24) + 24) % 24;
      let hh = Math.floor(h), mm = Math.round((h-hh)*60);
      if(mm === 60){ hh += 1; mm = 0; }
      hh = hh % 24;
      return String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    }

    // current time in Astana civil time (Asia/Almaty = UTC+5, matches unified KZ time since 2024)
    function nowInAstanaHours(){
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).formatToParts(new Date());
      const get = (t) => parseInt(parts.find(p=>p.type===t).value, 10);
      return get('hour') + get('minute')/60 + get('second')/3600;
    }
    function astanaDate(){
      const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
      const [y,m,d] = s.split('-').map(Number);
      return new Date(y, m-1, d);
    }

    const order = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
    const names = { fajr:'Фаджр', sunrise:'Восход', dhuhr:'Зухр', asr:'Аср', maghrib:'Магриб', isha:'Иша' };
    const ids = { fajr:'tFajr', sunrise:'tSunrise', dhuhr:'tDhuhr', asr:'tAsr', maghrib:'tMaghrib', isha:'tIsha' };

    let lastAutoPhase = null;

    function tick(){
      const today = astanaDate();
      const times = calcTimesFor(today);
      const nowH = nowInAstanaHours();

      // render chip times (once is enough, but cheap to redo)
      order.forEach(k => {
        const el = document.getElementById(ids[k]);
        if(el) el.textContent = fmtHM(times[k]);
      });

      // find next prayer (skip "sunrise" as a namaz — it's a marker, not a salah)
      const salahKeys = ['fajr','dhuhr','asr','maghrib','isha'];
      let nextKey = null, nextVal = null;
      for(const k of salahKeys){
        if(times[k] > nowH){ nextKey = k; nextVal = times[k]; break; }
      }
      if(!nextKey){
        // after Isha — next is tomorrow's Fajr
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
        const t2 = calcTimesFor(tomorrow);
        nextKey = 'fajr'; nextVal = t2.fajr + 24;
      }
      const diff = nextVal - nowH; // hours
      const totalSec = Math.max(0, Math.round(diff*3600));
      const hh = Math.floor(totalSec/3600);
      const mm = Math.floor((totalSec%3600)/60);
      const ss = totalSec%60;
      const timerEl = document.getElementById('salahTimer');
      const nameEl = document.getElementById('salahNextName');
      if(timerEl) timerEl.textContent = String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
      if(nameEl) nameEl.textContent = names[nextKey];

      // highlight active chip = next upcoming marker
      document.querySelectorAll('.salah-chip').forEach(c=>{
        c.classList.toggle('active', c.getAttribute('data-key') === nextKey);
      });

      // auto theme: dark from Maghrib to Sunrise, light from Sunrise to Maghrib
      // но только если пользователь ни разу не переключал тему вручную
      let isManual = false;
      try{ isManual = localStorage.getItem('ne-ti-theme-manual') === '1'; }catch(e){}
      if(!isManual){
        const isNight = (nowH >= times.maghrib) || (nowH < times.sunrise);
        const phase = isNight ? 'dark' : 'light';
        if(phase !== lastAutoPhase){
          document.documentElement.setAttribute('data-theme', phase);
          try{ localStorage.setItem('ne-ti-theme', phase); }catch(e){}
          lastAutoPhase = phase;
        }
      }
    }

    tick();
    setInterval(tick, 1000);
  })();


  // portfolio lightbox — click a case photo to view it enlarged
  (function(){
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    if(!lightbox) return;

    function openLightbox(src, alt, caption){
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      lightbox.classList.remove('open');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.case-row').forEach(row=>{
      row.addEventListener('click', ()=>{
        const img = row.querySelector('img');
        if(!img) return;
        openLightbox(img.src, img.alt, row.getAttribute('data-caption'));
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e)=>{
      if(e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeLightbox();
    });
  })();

  // hero load counter animation
  (function(){
    const forceEl = document.getElementById('forceVal');
    const settleEl = document.getElementById('settleVal');
    const arrow = document.getElementById('loadArrow');
    if(!forceEl) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ forceEl.textContent = '850'; settleEl.textContent = '4.2 мм'; return; }
    let t = 0;
    function tick(){
      t += 0.02;
      const force = Math.min(850, Math.round((Math.sin(t*0.6)*0.5+0.5)*850));
      const settle = (force/850*4.2).toFixed(1);
      forceEl.textContent = force;
      settleEl.textContent = settle + ' мм';
      arrow.style.transform = 'translateY(' + (Math.sin(t*0.6)*3) + 'px)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();
