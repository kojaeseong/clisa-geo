/* 개편 ① 머리글(2026-11-01 승인): 세계 시각 넘기기, 메뉴 밑줄, 영역 전환 손잡이. header1101.py가 붙인다 */
(function(){
  var H = document.getElementById("hdr"); if (!H) return;
  var EN = document.documentElement.lang === "en";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* 메뉴 밑줄: 현재 탭(aria-current) 아래, 마우스를 올리면 그 메뉴로 미끄러진다. 화면 앱이 탭을 바꾸면 따라간다 */
  var nl = H.querySelector(".hd-nl"), bar = nl && nl.querySelector(".bar");
  function place(a){ if (!bar) return; a = a || nl.querySelector('a[aria-current="page"]');
    if (!a || getComputedStyle(bar).display === "none") { bar.style.width = "0"; return; }
    bar.style.left = (a.offsetLeft + 10) + "px"; bar.style.width = Math.max(0, a.offsetWidth - 20) + "px"; }
  if (nl) { nl.querySelectorAll("a").forEach(function(a){ a.addEventListener("mouseenter", function(){ place(a); }); });
    nl.addEventListener("mouseleave", function(){ place(); });
    try { new MutationObserver(function(){ place(); }).observe(nl, {subtree: true, attributes: true, attributeFilter: ["aria-current"]}); } catch (e) {} }
  function knobs(){ H.querySelectorAll(".asw").forEach(function(w){ var o = w.querySelector("a.on"), k = w.querySelector(".asw-k");
    if (o && k && w.offsetParent) { k.style.left = o.offsetLeft + "px"; k.style.width = o.offsetWidth + "px"; } }); }
  /* 세계 시각 8곳: 데스크톱 4곳(1320px 아래 2곳)씩 4초마다, 휴대전화는 영역 전환 옆에서 2곳씩 2초마다 위로 넘긴다. 마우스를 올리면 멈춘다 */
  var C8 = EN ? [["Seoul/Tokyo","Asia/Seoul"],["Beijing/Taipei","Asia/Shanghai"],["Tehran","Asia/Tehran"],["Moscow","Europe/Moscow"],["Kyiv","Europe/Kyiv"],["Brussels","Europe/Brussels"],["London","Europe/London"],["DC/NYC","America/New_York"]]
              : [["서울·도쿄","Asia/Seoul"],["베이징·타이베이","Asia/Shanghai"],["테헤란","Asia/Tehran"],["모스크바","Europe/Moscow"],["키이우","Europe/Kyiv"],["브뤼셀","Europe/Brussels"],["런던","Europe/London"],["워싱턴·뉴욕","America/New_York"]];
  var fm = {}, fd = {};
  function fT(tz){ return (fm[tz] = fm[tz] || new Intl.DateTimeFormat("en-GB", {timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false})).format(new Date()); }
  function fD(tz){ return (fd[tz] = fd[tz] || new Intl.DateTimeFormat("en-CA", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"})).format(new Date()); }
  function cell(c){ var d = Math.round((Date.parse(fD(c[1])) - Date.parse(fD("Asia/Seoul"))) / 864e5);
    return "<span><i>" + c[0] + (d ? " <em>" + (d < 0 ? "−" : "+") + Math.abs(d) + (EN ? "d" : "일") + "</em>" : "") + "</i>" + fT(c[1]) + "</span>"; }
  var CL = []; try { H.querySelectorAll(".hd-clk").forEach(function(b){ CL.push({b: b, m: b.classList.contains("hd-clk-m"), n: 0, i: 0, G: 1, t: 0}); }); } catch (e) {}
  function build(c){ var inn = c.b.querySelector(".hd-clk-in"); if (!inn || !c.b.offsetParent) return;
    var n = (c.m || innerWidth <= 1320) ? 2 : 4, G = []; for (var k = 0; k < C8.length; k += n) G.push(C8.slice(k, k + n));
    inn.innerHTML = G.concat([G[0]]).map(function(g){ return '<div class="g">' + g.map(cell).join("") + "</div>"; }).join("");
    if (c.n !== n) { c.n = n; c.i = 0; } inn.style.transition = "none"; inn.style.transform = "translateY(" + (-c.i * c.b.offsetHeight) + "px)"; c.G = G.length; }
  function step(c){ var inn = c.b.querySelector(".hd-clk-in"); if (!inn || !c.b.offsetParent || c.b.matches(":hover")) return;
    c.i++; inn.style.transition = RM ? "none" : "transform .6s cubic-bezier(.2,.8,.2,1)"; inn.style.transform = "translateY(" + (-c.i * c.b.offsetHeight) + "px)";
    if (c.i >= c.G) setTimeout(function(){ c.i = 0; build(c); }, RM ? 0 : 650); }
  if (window.Intl && CL.length) {
    CL.forEach(build);
    setInterval(function(){ if (document.visibilityState === "hidden") return; var t = Date.now(); CL.forEach(function(c){ if (t - c.t >= (c.m ? 2000 : 4000) - 60) { c.t = t; step(c); } }); }, 500);
    setInterval(function(){ CL.forEach(function(c){ if (!c.b.matches(":hover")) build(c); }); }, 30000);
  }

  /* 밤 화면: 처음에는 기기 설정을 따르고(머리 안의 작은 스크립트가 그리기 전에 정한다), 단추로 바꾸면 그 선택을 기억한다 */
  var th = H.querySelector(".hd-th");
  function thLabel(){ var d = document.documentElement.dataset.theme === "dark"; if (!th) return; th.setAttribute("aria-pressed", d ? "true" : "false");
    var t = EN ? (d ? "Light mode" : "Dark mode") : (d ? "낮 화면으로 보기" : "밤 화면으로 보기"); th.title = t; th.setAttribute("aria-label", t); }
  function thSet(t){ document.documentElement.dataset.theme = t; try { localStorage.setItem("ep.theme", t); } catch (e) {}
    thLabel(); try { if (window.CLISA) window.CLISA.recolor(); } catch (e) {} }
  if (th) { thLabel(); th.addEventListener("click", function(){ thSet(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); }); }
  addEventListener("storage", function(e){ if (e.key === "ep.theme" && e.newValue) { document.documentElement.dataset.theme = e.newValue; thLabel(); try { if (window.CLISA) window.CLISA.recolor(); } catch (x) {} } });  /* 아카데미·게임 소개 쪽 등 다른 탭에서 바꾸면 이 탭도(2026-11-01) */
  /* 읽기 영역 넓히기 단추를 없앴으므로 늘 넓게 읽는다(전에 좁게 고른 방문자도) */
  try { var ap = document.querySelector(".app"); if (ap && !ap.classList.contains("wide")) { ap.classList.add("wide"); localStorage.setItem("ep.wide", "1"); dispatchEvent(new Event("resize")); } } catch (e) {}
  function all(){ place(); knobs(); CL.forEach(build); }
  all(); addEventListener("resize", all); addEventListener("load", all); if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
})();
/* 누름 소리(2026-11-03 운영자 지시: 더 명료하고 또렷하며 타격감 있게, 더 많은 단추에). 소리는 방문자가 '소리 켜기'를 고른 때만(ep.snd=on) 난다.
   창(window)의 포착 단계에서 누름을 받으므로 다른 처리기가 전파를 멈춰도 들린다. 선택하는 누름(전망·브리핑 카드·탭)은 무겁게, 그 밖은 짧게. */
(function(){
  var AC = null, BUS = null, LAST = 0;
  function on(){ try { return localStorage.getItem("ep.snd") === "on"; } catch (e) { return false; } }
  function ctx(){ try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)();
        var cp = AC.createDynamicsCompressor(); cp.threshold.value = -14; cp.ratio.value = 8; cp.attack.value = 0.001; cp.release.value = 0.08;
        BUS = AC.createGain(); BUS.gain.value = 0.8; BUS.connect(cp).connect(AC.destination); }
      if (AC.state === "suspended") AC.resume(); return AC; } catch (e) { return null; } }
  function tone(type, f0, f1, dur, vol, dl){ var t = AC.currentTime + (dl || 0), o = AC.createOscillator(), g = AC.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(BUS); o.start(t); o.stop(t + dur + 0.02); }
  function noise(dur, vol, ft, f0, f1, q){ var t = AC.currentTime, n = Math.max(1, Math.floor(AC.sampleRate * dur)), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; f.type = ft; f.Q.value = q || 1.2;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(BUS); s.start(t); }
  var KIND = {
    /* 짧고 또렷한 딸깍: 높은 대역의 잡음 순간음 + 짧은 몸통음 */
    tap: function(){ noise(0.012, 0.55, "bandpass", 4200, 3000, 1.4); tone("sine", 210, 80, 0.06, 0.42); tone("sine", 2350, 2300, 0.022, 0.05); },
    /* 선택: 타격감 있는 몸통음 + 잡음 순간음 + 짧은 금속 배음 */
    hit: function(){ tone("sine", 160, 50, 0.13, 0.62); noise(0.022, 0.6, "bandpass", 3600, 2200, 1.3); noise(0.06, 0.18, "lowpass", 2200, 320);
      [262, 723, 1415].forEach(function(f, i){ tone("sine", f, f * 0.995, 0.09 / (1 + i * 0.5), 0.05 / (1 + i), 0.003); }); }
  };
  window.clisaSfx = function(k){ if (!on()) return; var now = Date.now(); if (now - LAST < 50) return; LAST = now; if (!ctx()) return; try { (KIND[k] || KIND.tap)(); } catch (e) {} };
  var HIT = '[data-f2],[data-f2c],.f2-ev,.f2-nw,[role="tab"],.hd-nav a,.hd-nav button,nav a';
  var TAP = 'button,a[href],[role="button"],summary,label,select,input[type="checkbox"],input[type="radio"],[onclick],[tabindex="0"]';
  function pointer(el){ for (var i = 0; el && el.nodeType === 1 && i < 4; i++, el = el.parentElement) { try { if (getComputedStyle(el).cursor === "pointer") return true; } catch (e) {} } return false; }
  addEventListener("click", function(ev){ var t = ev.target; if (!t || !t.closest) t = t && t.parentElement; if (!t || !t.closest) return;
    if (t.closest("#f2snd, .hd-snd")) { var will = !on(); if (will) setTimeout(function(){ window.clisaSfx("tap"); }, 0); return; } /* 소리 켜기 단추: 켤 때만 확인음 */
    if (t.closest(HIT)) return window.clisaSfx("hit");
    if (t.closest(TAP) || pointer(t)) window.clisaSfx("tap"); }, true);
})();
/* 소리 켜기·끄기 단추를 모든 쪽 머리글에(2026-11-03 운영자 결재). 넓은 화면은 밤 화면 단추 옆, 좁은 화면은 검색 단추 옆.
   첫 화면 목록의 '소리 켜기'(#f2snd)와 같은 값(ep.snd)을 쓰고, 어느 쪽에서 바꾸든 'clisa:snd' 신호로 서로 맞춘다. */
(function(){
  var EN = document.documentElement.lang === "en", SV = 'viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICON = '<svg class="i-on" ' + SV + '><path d="M3 8h3l4-3v10l-4-3H3z"/><path d="M13 7.5a3.5 3.5 0 0 1 0 5M15.3 5.3a6.6 6.6 0 0 1 0 9.4"/></svg><svg class="i-off" ' + SV + '><path d="M3 8h3l4-3v10l-4-3H3z"/><path d="M13.5 8l4 4M17.5 8l-4 4"/></svg>';
  function on(){ try { return localStorage.getItem("ep.snd") === "on"; } catch (e) { return false; } }
  function lab(b){ var s = on(), t = EN ? (s ? "Turn sound off" : "Turn sound on") : (s ? "소리 끄기" : "소리 켜기"); b.setAttribute("aria-pressed", s ? "true" : "false"); b.title = t; b.setAttribute("aria-label", t); }
  var BS = [];
  function mk(where, cls){ var b = document.createElement("button"); b.type = "button"; b.className = "hd-th hd-snd " + cls; b.innerHTML = ICON; lab(b);
    b.addEventListener("click", function(){ var s = !on(); try { localStorage.setItem("ep.snd", s ? "on" : "off"); } catch (e) {} BS.forEach(lab); document.dispatchEvent(new CustomEvent("clisa:snd", {detail: s})); });
    where(b); BS.push(b); }
  var th = document.querySelector("header.hd .hd-th"), so = document.querySelector("header.hd .srch-open");
  if (th) mk(function(b){ th.parentNode.insertBefore(b, th); }, "d");
  if (so) mk(function(b){ so.parentNode.insertBefore(b, so.nextSibling); }, "m");
  document.addEventListener("clisa:snd", function(){ BS.forEach(lab); });
  addEventListener("storage", function(e){ if (e.key === "ep.snd") BS.forEach(lab); });
})();
