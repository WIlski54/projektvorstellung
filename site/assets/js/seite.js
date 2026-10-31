/* Drei Werkzeuge, ein Bauprinzip – Bewegung und Interaktion
   Ohne JavaScript, bei „Bewegung reduzieren“ und auf schmalen Bildschirmen bleibt die Seite statisch und vollständig bedienbar. */
(function () {
  'use strict';
  var html = document.documentElement;
  html.classList.add('js');
  var leise = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var lenis = null;
  var animModus = function () { return html.classList.contains('anim'); };

  /* ---------- Gerissene Papierkanten (gleich bei jedem Laden) ---------- */
  var saat = 7;
  function zufall() { saat = (saat * 16807) % 2147483647; return saat / 2147483647; }
  $$('.riss').forEach(function (r) {
    var p = [], n = 46;
    for (var i = 0; i <= n; i++) p.push((i / n * 100).toFixed(2) + '% ' + (18 + zufall() * 52).toFixed(1) + '%');
    r.style.clipPath = 'polygon(' + p.join(',') + ',100% 100%,0 100%)';
  });

  /* ---------- Arbeitsblatt: Ansichten ---------- */
  var tabs = $$('[role=tab]');
  var adresse = $('#adresse'), bildtext = $('#bildtext'), deckel = $('#deckel'), dashbild = $('#dashbild');
  var aktiverTab = tabs[0];
  function zeigeAnsicht(t) {
    tabs.forEach(function (x) {
      var an = x === t, p = document.getElementById(x.getAttribute('aria-controls'));
      x.setAttribute('aria-selected', an); x.tabIndex = an ? 0 : -1;
      p.classList.toggle('aktiv', an);
      if (an) { adresse.textContent = p.dataset.adresse; bildtext.textContent = p.dataset.text; }
    });
  }
  function waehle(t, fokus) {
    if (t === aktiverTab) { if (fokus) t.focus(); return; }
    var vorher = aktiverTab; aktiverTab = t;
    var zuHilfe = t.id === 't-hilfe';
    if (window.gsap && !leise && zuHilfe && vorher.id === 't-lehrer') {
      // Aus der roten Zelle ins Schülerblatt hineinzoomen
      gsap.killTweensOf(dashbild);
      gsap.timeline()
        .to(dashbild, { scale: 2.8, transformOrigin: '88.6% 47.8%', duration: 0.6, ease: 'power2.in' })
        .add(function () { zeigeAnsicht(t); })
        .fromTo('#p-hilfe .bild', { scale: 1.18 }, { scale: 1, duration: 0.8, ease: 'power3.out' })
        .set(dashbild, { scale: 1 }, '+=0.3');
    } else {
      zeigeAnsicht(t);
    }
    if (zuHilfe && window.gsap && !leise) {
      // Der Kommentar „schreibt“ sich Zeile für Zeile
      gsap.fromTo(deckel, { scaleY: 1 }, { scaleY: 0, duration: 1.6, delay: vorher.id === 't-lehrer' ? 0.9 : 0.3, ease: 'steps(7)' });
    }
    if (fokus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      if (animModus() && lenis) {
        lenis.scrollTo(t, { offset: -(window.innerHeight / 2 - t.offsetHeight / 2), duration: 1.2 });
      } else { waehle(t); }
    });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (n) { e.preventDefault(); waehle(tabs[(i + n + tabs.length) % tabs.length], true); }
    });
  });

  /* ---------- Papiertheater: Szenen ---------- */
  var DAUER = 4200;
  var kasten = $('#guckkasten'), bilder = $$('img', kasten), ut = $('#untertitel'), szenen = $('#szenen'),
      steuer = $('#steuer'), knopf = $('#abspielen'), symbol = $('#abspielsymbol');
  var nr = 0, timer = null, rest = DAUER, startzeit = 0, laeuft = false, gestartet = false;
  szenen.style.setProperty('--dauer', DAUER + 'ms');
  bilder.forEach(function (b, n) {
    var k = document.createElement('button'); k.setAttribute('aria-label', 'Szene ' + (n + 1));
    k.addEventListener('click', function () { zeige(n); rest = DAUER; if (laeuft) plane(DAUER); });
    szenen.appendChild(k);
  });
  function zeige(n) {
    nr = n;
    bilder.forEach(function (b, m) { b.classList.toggle('aktiv', m === n); });
    $$('button', szenen).forEach(function (k, m) { k.setAttribute('aria-current', m === n); });
    ut.textContent = bilder[n].dataset.text;
  }
  function plane(ms) {
    clearTimeout(timer); startzeit = performance.now(); rest = ms;
    timer = setTimeout(function () { zeige((nr + 1) % bilder.length); plane(DAUER); }, ms);
  }
  function spiele() {
    if (laeuft) return; laeuft = gestartet = true; steuer.classList.remove('pausiert');
    symbol.setAttribute('d', 'M4 2.5h3v11H4zM9 2.5h3v11H9z'); knopf.setAttribute('aria-label', 'Szenen anhalten');
    plane(rest);
  }
  function halte() {
    if (!laeuft) return; laeuft = false; clearTimeout(timer);
    rest = Math.max(200, rest - (performance.now() - startzeit)); steuer.classList.add('pausiert');
    symbol.setAttribute('d', 'M4 2.5v11l9-5.5z'); knopf.setAttribute('aria-label', 'Szenen abspielen');
  }
  knopf.addEventListener('click', function () { laeuft ? halte() : spiele(); });
  steuer.classList.add('pausiert');
  zeige(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) { halte(); return; }
      if (!leise && !animModus() && !gestartet) spiele();
    }, { threshold: 0.45 }).observe(kasten);
  }

  /* ---------- Buch: Pfeile (statischer Modus) und Leser ---------- */
  var band = $('#band');
  function rutsch(r) { band.scrollBy({ left: r * band.clientWidth * 0.8, behavior: leise ? 'auto' : 'smooth' }); }
  $('#vor').addEventListener('click', function () { rutsch(1); });
  $('#zurueck').addEventListener('click', function () { rutsch(-1); });

  var leser = $('#leser'), zuletzt = null;
  $('#buch-auf').addEventListener('click', function () {
    zuletzt = document.activeElement;
    if (!$('iframe', leser)) {
      var f = document.createElement('iframe'); f.src = 'buch/index.html'; f.title = 'Das große Ägypten-Popup-Buch'; f.allow = 'fullscreen; autoplay';
      leser.appendChild(f);
    }
    leser.classList.add('offen'); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop();
    $('#buch-zu').focus();
  });
  function zu() { leser.classList.remove('offen'); document.body.style.overflow = ''; if (lenis) lenis.start(); if (zuletzt) zuletzt.focus(); }
  $('#buch-zu').addEventListener('click', zu);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && leser.classList.contains('offen')) zu(); });

  /* ---------- Arbeitsblatt: Demofilm ---------- */
  var kino = $('#kino'), film = $('#film'), vorFilm = null;
  $('#film-auf').addEventListener('click', function () {
    vorFilm = document.activeElement;
    kino.classList.add('offen'); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop();
    $('#film-zu').focus();
    var p = film.play(); if (p && p.catch) p.catch(function () {});
  });
  function filmZu() {
    film.pause(); kino.classList.remove('offen'); document.body.style.overflow = ''; if (lenis) lenis.start();
    if (vorFilm) vorFilm.focus();
  }
  $('#film-zu').addEventListener('click', filmZu);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && kino.classList.contains('offen')) filmZu(); });

  /* ================= Ab hier: Bewegung ================= */
  if (!window.gsap || leise) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

  /* ---------- Auftakt: Buchstaben falten sich hoch, Karten klappen auf ---------- */
  var titel = SplitText.create('#titel', { type: 'words,chars', wordsClass: 'wort', charsClass: 'zeichen' });
  gsap.timeline({ defaults: { ease: 'back.out(1.5)' } })
    .from(titel.chars, { rotationX: -105, yPercent: 18, opacity: 0, duration: 0.9, stagger: 0.026 })
    .from('.hero .unter, .hero .aktionen', { opacity: 0, y: 18, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, '-=0.55')
    .from('.klappe', { rotationX: 84, transformPerspective: 1400, duration: 1.15, stagger: 0.16, ease: 'back.out(1.25)' }, 0.35)
    .from('.klappe .zettel', { opacity: 0, y: 8, duration: 0.4, stagger: 0.12, ease: 'power2.out' }, '-=0.5');

  /* ---------- Großer Bildschirm: Scroll-Geschichte ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 1000px)', function () {
    html.classList.add('anim', 'lenis');

    // Weiches Scrollen, an GSAP gekoppelt (eine gemeinsame Schleife)
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    var takt = function (t) { lenis.raf(t * 1000); };
    gsap.ticker.add(takt); gsap.ticker.lagSmoothing(0);
    var anker = function (e) {
      var z = document.querySelector(this.getAttribute('href'));
      if (z) { e.preventDefault(); lenis.scrollTo(z, { duration: 1.6 }); }
    };
    var ankerLinks = $$('a[href^="#"]');
    ankerLinks.forEach(function (a) { a.addEventListener('click', anker); });

    // Klebe-Positionen: ein Abschnitt bleibt liegen, bis das nächste Blatt darübergeschoben ist
    function klebe() {
      $$('.buch').forEach(function (s) { s.style.setProperty('--klebe', Math.min(0, window.innerHeight - s.offsetHeight) + 'px'); });
    }
    ScrollTrigger.addEventListener('refresh', klebe);

    // Hero: Die Karten falten sich zurück in den Tisch
    gsap.to('#buehne', { rotationX: 64, yPercent: 14, scale: 0.86, ease: 'none',
      scrollTrigger: { trigger: '#ablauf', start: 'top bottom', end: 'top 15%', scrub: true } });
    gsap.to('.hero-text', { y: -70, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '#ablauf', start: 'top bottom', end: 'top top', scrub: true } });

    // Leporello: entfaltet sich Feld für Feld, ein Bleistiftstrich verbindet die Schritte
    var falze = $$('.falz');
    // Das Leporello bleibt fixiert, bis das Arbeitsblatt-Blatt ganz darübergeschoben ist (ein Mechanismus, kein Sprung)
    var AUFFALTEN = 1100;
    var lep = gsap.timeline({ scrollTrigger: { trigger: '#ablauf-inhalt', start: 'center center',
      end: function () { return '+=' + (AUFFALTEN + 450 + window.innerHeight * 1.25); }, scrub: 0.8, pin: true, invalidateOnRefresh: true } });
    lep.from('.strich path', { drawSVG: '0%', duration: falze.length, ease: 'none' }, 0)
       .from(falze, { rotationY: function (i) { return i % 2 ? -92 : 92; }, opacity: 0, duration: 1, stagger: 0.85, ease: 'power2.out' }, 0)
       .from('.ablauf .fazit', { opacity: 0, y: 24, duration: 0.8 }, '-=0.3');
    lep.to({}, { duration: lep.duration() * (450 + window.innerHeight * 1.25) / AUFFALTEN });

    // Arbeitsblatt: das Fenster „landet“ wie eine eingeklebte Karte
    gsap.from('#fenster', { rotationX: 56, rotationZ: -4, scale: 0.8, y: 140, transformPerspective: 1600, ease: 'none',
      scrollTrigger: { trigger: '.ab-raster', start: 'top bottom', end: 'top 25%', scrub: true } });
    // Sanftes Einblenden über eine lange Scrollstrecke – fertig erst auf Lesehöhe
    function einblenden(el, o) {
      o = o || {};
      return gsap.fromTo(el, { y: o.y || 70, opacity: 0, filter: 'blur(' + (o.blur || 10) + 'px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', ease: 'power1.out', stagger: o.stagger || 0,
          scrollTrigger: { trigger: o.trigger || el, pinnedContainer: o.pin, start: o.start || 'top 96%', end: o.end || 'top 42%', scrub: 1 } });
    }
    var abTitel = SplitText.create('#ab-titel', { type: 'lines', linesClass: 'zeile', mask: 'lines' });
    gsap.from(abTitel.lines, { yPercent: 110, ease: 'power1.out', stagger: 0.3,
      scrollTrigger: { trigger: '#ab-titel', start: 'top 96%', end: 'top 30%', scrub: 1 } });
    einblenden('.ab .einleitung', { start: 'top 98%', end: 'top 38%' });
    // Ablauf: Überschrift und Text
    einblenden('.ablauf .kopfzeile h2', { start: 'top 96%', end: 'top 40%', pin: '#ablauf-inhalt' });
    einblenden('.ablauf .kopfzeile p', { start: 'top 98%', end: 'top 45%', pin: '#ablauf-inhalt' });
    // Schluss
    einblenden('.fuss .gross', { start: 'top 95%', end: 'top 45%' });
    einblenden('.fuss .zeile', { start: 'top 100%', end: 'top 75%', y: 30, blur: 6 });

    tabs.forEach(function (t, i) {
      var teile = [$('strong', t), $('span', t)], letzter = i === tabs.length - 1;
      var tl = gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 95%', end: letzter ? 'center 55%' : 'bottom 5%', scrub: 1 } })
        .fromTo(teile, { y: 90, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.25, ease: 'power1.out' });
      if (!letzter) {
        tl.to(teile, { y: 0, opacity: 1, duration: 0.6 })
          .to(teile, { y: -60, opacity: 0.12, filter: 'blur(6px)', duration: 1, stagger: 0.12, ease: 'power1.in' });
      }
    });
    $$('.ab .fakten > div, .ab .zum-live').forEach(function (el, i) {
      gsap.from(el, { y: 70, opacity: 0, filter: 'blur(10px)', ease: 'power1.out',
        scrollTrigger: { trigger: i < 3 ? '.ab .fakten' : el, start: 'top ' + (i < 3 ? 100 - i * 3 : 100) + '%', end: 'top ' + (i < 3 ? 80 - i * 3 : 86) + '%', scrub: 0.6 } });
    });

    // … und die drei Schritte steuern die Ansicht
    tabs.forEach(function (t) {
      ScrollTrigger.create({ trigger: t, start: 'top center', end: 'bottom center',
        onToggle: function (s) { if (s.isActive) waehle(t); } });
    });

    // Vorhang als Übergang ins Papiertheater
    var bl = $('#blende'), bahnL = $('.bahn.l', bl), bahnR = $('.bahn.r', bl), schab = $('.schabracke', bl), vtitel = $('.titel', bl);
    gsap.set(bahnL, { xPercent: -102 }); gsap.set(bahnR, { xPercent: 102 }); gsap.set(schab, { yPercent: -110 });
    gsap.timeline({ scrollTrigger: { trigger: '#papiertheater', start: 'top bottom', end: 'top top', scrub: true } })
      .to(schab, { yPercent: 0, duration: 0.35, ease: 'power2.out' }, 0)
      .to(bahnL, { xPercent: 0, duration: 1, ease: 'power1.inOut' }, 0)
      .to(bahnR, { xPercent: 0, duration: 1, ease: 'power1.inOut' }, 0)
      .to(vtitel, { opacity: 1, duration: 0.25 }, 0.75);
    // Liegen Steuerleiste und die drei Stärken schon auf der Bühne, kommen sie erst nach dem Öffnen im selben Ablauf
    var theaterEl = $('#papiertheater'), dreiEl = $('.theater .drei'), dreiBloecke = $$('.theater .drei > div');
    var imVorhang = (dreiEl.getBoundingClientRect().top - theaterEl.getBoundingClientRect().top) + 60 < window.innerHeight;
    dreiBloecke.forEach(function (d) {
      var linie = document.createElement('i'); linie.className = 'linie'; linie.setAttribute('aria-hidden', 'true');
      d.insertBefore(linie, d.firstChild);
    });
    // Zeitplan: kurz geschlossen stehen (0–0,3), langsam öffnen (0,3–1,9), Schabracke hebt sich, danach erst die Blöcke
    var oeffnen = gsap.timeline({ scrollTrigger: { trigger: '#papiertheater', start: 'top top', end: imVorhang ? '+=240%' : '+=130%', scrub: 0.8, pin: true,
        onUpdate: function (s) { if (s.progress > (imVorhang ? 0.55 : 0.8) && !gestartet) spiele(); } } })
      .to({}, { duration: 0.3 }, 0)
      .to(vtitel, { opacity: 0, scale: 0.94, duration: 0.3, ease: 'none' }, 0.2)
      .to(bahnL, { xPercent: -102, scaleX: 0.75, transformOrigin: 'left center', duration: 1.6, ease: 'sine.inOut' }, 0.3)
      .to(bahnR, { xPercent: 102, scaleX: 0.75, transformOrigin: 'right center', duration: 1.6, ease: 'sine.inOut' }, 0.3)
      .to(schab, { yPercent: -110, duration: 0.6, ease: 'sine.in' }, 1.4)
      .from('#papiertheater .kopfzeile', { y: 50, opacity: 0, filter: 'blur(8px)', duration: 0.6, ease: 'power1.out' }, 1.0);
    if (imVorhang) {
      oeffnen.fromTo('#steuer', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power1.out' }, 2.25);
      dreiBloecke.forEach(function (d, i) {
        var t0 = 2.45 + i * 0.3;
        oeffnen.fromTo($('.linie', d), { scaleX: 0, opacity: 0.3 }, { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, t0)
          .fromTo($('h3', d), { y: 70, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' }, t0 + 0.1)
          .fromTo($('p', d), { y: 50, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' }, t0 + 0.2);
      });
      oeffnen.to({}, { duration: 0.35 });
    }

    // Papiertheater: sonst treten Steuerleiste und die drei Stärken beim Scrollen ins Rampenlicht
    if (!imVorhang) {
      gsap.from('#steuer', { y: 30, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#steuer', pinnedContainer: '#papiertheater', start: 'top 96%', end: 'top 78%', scrub: 0.8 } });
      dreiBloecke.forEach(function (d, i) {
        gsap.timeline({ scrollTrigger: { trigger: d, pinnedContainer: '#papiertheater', start: 'top ' + (100 - i * 5) + '%', end: 'top ' + (72 - i * 5) + '%', scrub: 1 } })
          .fromTo($('.linie', d), { scaleX: 0, opacity: 0.3 }, { scaleX: 1, opacity: 1, duration: 1, ease: 'power2.out' }, 0)
          .fromTo($('h3', d), { y: 90, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }, 0.25)
          .fromTo($('p', d), { y: 70, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }, 0.5);
      });
    }

    // Buch: Ein Buchdeckel schiebt sich über die Bühne und klappt auf – dahinter stellt sich die Seite auf
    var deckel = $('#deckel-buch'), deckelSchatten = $('.schatten', deckel);
    gsap.set(deckel, { yPercent: 105, rotationX: 22, scale: 0.9, transformOrigin: 'left center', visibility: 'visible' });
    gsap.timeline({ scrollTrigger: { trigger: '#popup-buch', start: 'top bottom', end: 'top top', scrub: true } })
      .to(deckel, { yPercent: 0, rotationX: 0, scale: 1, duration: 1, ease: 'power2.out' });
    var buchTitel = SplitText.create('#buch-titel', { type: 'lines', linesClass: 'zeile' });
    var mische = function (a, b) { return Object.assign({}, b, a); };
    var aufklappen = { rotationX: 86, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1200 };
    gsap.timeline({ scrollTrigger: { trigger: '#popup-buch', start: 'top top', end: '+=180%', scrub: 1.1, pin: '#buch-kopf' } })
      .to(deckel, { rotationY: -178, duration: 1, ease: 'power1.inOut' }, 0)
      .to(deckelSchatten, { opacity: 0.55, duration: 0.5, ease: 'none' }, 0)
      .set(deckel, { autoAlpha: 0 }, 0.99)
      .from(buchTitel.lines, mische({ duration: 0.45, stagger: 0.12, ease: 'back.out(1.6)' }, aufklappen), 0.42)
      .from('#popup-buch .kopfzeile p', mische({ duration: 0.4, ease: 'back.out(1.4)' }, aufklappen), 0.62)
      .from('#aufschlag', { rotationX: 78, transformOrigin: '50% 100%', transformPerspective: 2000, duration: 1.1, ease: 'power2.out' }, 0.75)
      .from('#aufschlag .ueber > *', { y: 30, opacity: 0, duration: 0.35, stagger: 0.12 }, 1.8)
      .to({}, { duration: 0.25 });
    $$('#zahlen > div').forEach(function (d, i) {
      gsap.from(d, mische({ ease: 'back.out(1.5)',
        scrollTrigger: { trigger: '#zahlen', pinnedContainer: '#buch-kopf', start: 'top ' + (96 - i * 5) + '%', end: 'top ' + (70 - i * 5) + '%', scrub: 0.8 } }, aufklappen));
    });
    var stTitel = SplitText.create('#stationen-titel', { type: 'words', wordsClass: 'wort', mask: 'words' });
    gsap.fromTo(stTitel.words, { yPercent: 115, opacity: 0, filter: 'blur(8px)' },
      { yPercent: 0, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', stagger: 0.15,
        scrollTrigger: { trigger: '#querfahrt', start: 'top 95%', end: 'top 12%', scrub: 1 } });

    // Buch: das große Bild klappt auf, die Zahlen zählen hoch
    $$('#zahlen b').forEach(function (b) {
      var ziel = +b.dataset.zahl, obj = { v: 0 };
      if (!ziel) return;
      gsap.to(obj, { v: ziel, duration: 1.4, ease: 'power2.out', snap: { v: 1 },
        onUpdate: function () { b.textContent = obj.v; },
        scrollTrigger: { trigger: '#zahlen', pinnedContainer: '#buch-kopf', start: 'top 82%', once: true } });
    });

    // Buch: Querfahrt durch die neun Stationen
    var karten = $$('article', band), lauf = $('#lauf'), epoche = $('#epoche'), zeit = $('#zeit'), zuletztNr = -1;
    var weite = function () { return Math.max(0, band.scrollWidth - band.parentElement.clientWidth); };
    function stationen() {
      var x = gsap.getProperty(band, 'x'), basis = band.getBoundingClientRect().left - x, mitte = window.innerWidth / 2, best = 0, bestD = 9;
      karten.forEach(function (k, i) {
        var c = basis + x + k.offsetLeft + k.offsetWidth / 2, d = (c - mitte) / window.innerWidth, a = Math.min(1, Math.abs(d) * 1.9);
        gsap.set(k, { rotationX: a * 18, y: a * 22, scale: 1 - a * 0.1, opacity: 1 - a * 0.45, transformPerspective: 2200 });
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
      });
      if (best !== zuletztNr) { zuletztNr = best; epoche.textContent = karten[best].dataset.epoche; zeit.textContent = karten[best].dataset.zeit; }
      var w = weite(); gsap.set(lauf, { scaleX: w ? -x / w : 0 });
    }
    gsap.to(band, { x: function () { return -weite(); }, ease: 'none', onUpdate: stationen,
      scrollTrigger: { trigger: '#querfahrt', start: 'top top', end: function () { return '+=' + weite(); },
        pin: true, scrub: 0.6, invalidateOnRefresh: true, onRefresh: stationen } });
    stationen();

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    klebe();

    return function () {
      gsap.ticker.remove(takt); lenis.destroy(); lenis = null;
      ankerLinks.forEach(function (a) { a.removeEventListener('click', anker); });
      ScrollTrigger.removeEventListener('refresh', klebe);
      html.classList.remove('anim', 'lenis');
      karten.forEach(function (k) { gsap.set(k, { clearProps: 'all' }); });
    };
  });
})();
