  // ставим тему до отрисовки — по фазе намаза (Магриб→Восход = тёмная), чтобы не было "мигания"
  // ЕСЛИ пользователь переключал тему вручную — его выбор в приоритете, авторасчёт не трогаем
  (function(){
    try{
      if(localStorage.getItem('ne-ti-theme-manual') === '1'){
        var savedManual = localStorage.getItem('ne-ti-theme');
        document.documentElement.setAttribute('data-theme', savedManual || 'light');
        return;
      }
    }catch(e){}
    try{
      var LAT = 51.1801, LNG = 71.4460, TZ = 5;
      function julian(y,m,d){ if(m<=2){y-=1;m+=12;} var A=Math.floor(y/100),B=2-A+Math.floor(A/4);
        return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5; }
      function sunPos(jd){ var D=jd-2451545.0;
        var g=((357.529+0.98560028*D)%360)*Math.PI/180;
        var q=(280.459+0.98564736*D)%360;
        var Ldeg=(q+1.915*Math.sin(g)+0.020*Math.sin(2*g))%360;
        var L=Ldeg*Math.PI/180;
        var e=(23.439-0.00000036*D)*Math.PI/180;
        var RA=Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L))*180/Math.PI/15;
        RA=((RA%24)+24)%24;
        var decl=Math.asin(Math.sin(e)*Math.sin(L));
        var eqt=q/15-RA; if(eqt>12)eqt-=24; if(eqt<-12)eqt+=24;
        return {decl:decl, eqt:eqt}; }
      function hourAngle(angleDeg,latDeg,decl){ var lat=latDeg*Math.PI/180, a=angleDeg*Math.PI/180;
        var cosH=(Math.sin(a)-Math.sin(lat)*Math.sin(decl))/(Math.cos(lat)*Math.cos(decl));
        cosH=Math.max(-1,Math.min(1,cosH));
        return Math.acos(cosH)*180/Math.PI/15; }

      var parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Almaty', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date()).split('-');
      var y=+parts[0], m=+parts[1], d=+parts[2];
      var jd = julian(y,m,d) - TZ/24 + 0.5;
      var sp = sunPos(jd);
      var dhuhr = 12 + TZ - LNG/15 - sp.eqt;
      var sunrise = dhuhr - hourAngle(-0.833, LAT, sp.decl) - 5.2/60;
      var maghrib = dhuhr + hourAngle(-0.833, LAT, sp.decl) + 4.35/60;

      var tp = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Almaty', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false}).formatToParts(new Date());
      var get = function(t){ return parseInt(tp.find(function(p){return p.type===t;}).value, 10); };
      var nowH = get('hour') + get('minute')/60 + get('second')/3600;

      var isNight = (nowH >= maghrib) || (nowH < sunrise);
      var theme = isNight ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      try{ localStorage.setItem('ne-ti-theme', theme); }catch(e){}
    }catch(e){
      try{
        var saved = localStorage.getItem('ne-ti-theme');
        document.documentElement.setAttribute('data-theme', saved || 'light');
      }catch(e2){
        document.documentElement.setAttribute('data-theme','light');
      }
    }
  })();
