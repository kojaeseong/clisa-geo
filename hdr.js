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
/* 주간 정세 요약 쪽 듣기 단추(2026-11-03 운영자 지시): 판 날짜 제목 옆에 브리핑과 같은 듣기 단추를 붙인다.
   읽는 글과 듣기 엔진은 app.js의 'page' 열쇠(tts1103.py)가 맡는다. 한국어(영문판은 영어) 음성이 없는 기기에서는 단추가 보이지 않는다(.tts-ok). */
(function(){
  /* 2026-11-08 대통령님 지적: 다른 쪽에서 화면 안 단추로 옮겨 오면 듣기 단추가 붙지 않던 것(처음 연 주소만 보고 그만두었음) → 옮길 때마다 주소를 다시 본다 */
  var EN = document.documentElement.lang === "en";
  function put(){ if (!/^\/(en\/)?digest\//.test(location.pathname)) return; var P = document.getElementById("pane-page"); if (!P || P.querySelector('[data-tts="page"]')) return;
    var h = [].filter.call(P.querySelectorAll("h2"), function(x){ return !x.closest("article"); })[0] || P.querySelector("h1"); if (!h || !P.querySelector("article.bi")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "tts"; b.dataset.tts = "page"; b.setAttribute("aria-pressed", "false");
    b.style.marginLeft = "10px"; b.textContent = EN ? "▶ Listen" : "▶ 듣기"; h.appendChild(b); }
  put(); addEventListener("load", put);
  try { new MutationObserver(put).observe(document.body, {childList: true, subtree: true}); } catch (e) {}
})();
/* 띠 타자 효과는 2026-11-08 strips_c.js로 옮김(아카데미·게임 첫 화면과 함께 씀). header1101.py가 hdr.js 끝에 붙인다 */
/* 2026-11-09 대통령님 결재: 머리글에 '처음 오신 분께'(/start/) 링크. 넓은 화면은 메뉴 줄 오른쪽 끝(오른쪽 단추 줄에 넣으면 1300px에서 제호와 겹쳐 옮김), 휴대전화는 메뉴 칸의 마지막 */
(function(){
  var H = document.getElementById("hdr"); if (!H || H.querySelector(".hd-start")) return;
  var EN = document.documentElement.lang === "en", href = EN ? "/en/start/" : "/start/", t = EN ? "Start here" : "처음 오신 분께", here = location.pathname === href;
  function mk(c){ var a = document.createElement("a"); a.className = "hd-start " + c; a.href = href; a.textContent = t; if (here) a.classList.add("here"); return a; }
  var nl = H.querySelector(".hd-nl"); if (nl) nl.insertBefore(mk("m"), nl.querySelector(".bar"));  /* 넓은 화면에서는 메뉴 줄 오른쪽 끝, 휴대전화는 메뉴 칸의 마지막 */
})();
/* 2026-11-10 대통령님 결재: 휴대전화 앱 화면(mapp). 2026-11-10 공개 결재로 기본으로 켜져 있고, /lab/home/에서 끈 기기(localStorage ep.mapp=0)만 예전 화면을 본다.
   머리글 대신 윗줄(‹ 홈·화면 이름·검색)과 아래 고정 칸 4개를 붙이고, 지구본은 세계 정세·나라·권역 화면에서만 보인다. 다른 화면에서 장소를 누르면(표시 띠가 뜨면) 지구본이 위에서 내려온다.
   휴대전화로 사이트 첫 주소('/')에 밖에서 들어오면 첫 화면(/home/)으로 보낸다. 첫 화면이나 아래 고정 칸에서 '세계 정세'를 누른 때는 지구본을 보인다. */
(function(){
  var D = document.documentElement, H = document.getElementById("hdr"), on = false;
  try { on = localStorage.getItem("ep.mapp") !== "0"; } catch (e) { on = true; }  /* 2026-11-10 대통령님 공개 결재: 기본으로 켠다. /lab/home/에서 이 기기만 끌 수 있다 */
  if (!on || !H) { D.classList.remove("mapp"); return; }
  D.classList.add("mapp");
  var EN = D.lang === "en", P = EN ? "/en" : "", HOME = P + "/home/", mq = matchMedia("(max-width:900px)");
  if (mq.matches && (location.pathname === "/" || location.pathname === "/en/") && !location.hash && !location.search) {
    var ro = ""; try { ro = document.referrer ? new URL(document.referrer).origin : ""; } catch (e) {}
    if (ro !== location.origin && !/bot|crawl|spider|slurp|lighthouse|pagespeed|headless/i.test(navigator.userAgent)) { location.replace(HOME); return; }  /* 검색 로봇은 보내지 않는다(첫 주소의 색인 유지) */
  }
  var SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var bar = document.createElement("div"); bar.className = "mab";
  bar.innerHTML = '<a class="mab-h" href="' + HOME + '"><svg ' + SV + '><path d="M15 5l-7 7 7 7"/></svg>' + (EN ? "Home" : "홈") + '</a><b class="mab-t"></b><button type="button" class="mab-s" aria-label="' + (EN ? "Search" : "검색") + '"><svg ' + SV + '><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></svg></button>';
  H.insertBefore(bar, H.firstChild);
  function srch(){ var b = document.getElementById("srchopen"); if (b) b.click(); }
  bar.querySelector(".mab-s").addEventListener("click", srch);
  var dk = document.createElement("nav"); dk.className = "mdock"; dk.setAttribute("aria-label", EN ? "Main screens" : "자주 쓰는 화면");
  dk.innerHTML = '<a data-k="brief" href="' + P + '/brief/"><svg ' + SV + '><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>' + (EN ? "Briefing" : "정세 브리핑") + '</a>' +
    '<a data-k="world" href="' + P + '/"><svg ' + SV + '><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 3.5 5 3.5 8s-1 5.5-3.5 8c-2.5-2.5-3.5-5-3.5-8s1-5.5 3.5-8z"/></svg>' + (EN ? "World" : "세계 정세") + '</a>' +
    '<a data-k="fc" href="' + P + '/forecast/"><svg ' + SV + '><path d="M4 18l5-6 4 3 7-8"/><path d="M15 7h5v5"/></svg>' + (EN ? "Forecasts" : "전망과 검증") + '</a>' +
    '<button type="button" data-k="s"><svg ' + SV + '><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></svg>' + (EN ? "Search" : "검색") + '</button>';
  document.body.appendChild(dk); dk.querySelector("button").addEventListener("click", srch);
  var x = document.createElement("button"); x.type = "button"; x.className = "mloc-x"; x.textContent = EN ? "Close map" : "지도 닫기"; document.body.appendChild(x);
  x.addEventListener("click", function(){ D.classList.remove("locshow"); });
  var MAPT = {overview: 1, detail: 1, region: 1}, SITE_T = EN ? "Clisa Geopolitics" : "클리사 지오폴리틱스", tt = bar.querySelector(".mab-t"), CUR = null;
  function title(){ var t = (document.title || "").split(" | ")[0].trim();
    var p0 = location.pathname.replace(/^\/en(?=\/)/, "");
    if (/^\/heatmap\//.test(p0)) t = EN ? "Heat Map" : "히트맵"; else if (/^\/ripple\//.test(p0)) t = EN ? "Chain Reactions" : "통합신경망";
    else if (CUR === "overview") t = EN ? "World" : "세계 정세"; else if (!t) t = SITE_T;
    tt.textContent = t;
    var p = location.pathname.replace(/^\/en(?=\/)/, ""), k = /^\/(brief|digest|feature)\//.test(p) ? "brief" : /^\/forecast\//.test(p) ? "fc" : MAPT[CUR] ? "world" : "";
    [].forEach.call(dk.querySelectorAll("[data-k]"), function(a){ if (a.dataset.k === k) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }); }
  function tab(t){ var was = D.classList.contains("mapp-map"), m = !!MAPT[t]; CUR = t; D.classList.toggle("mapp-map", m); D.classList.remove("locshow");
    if (m && !was) setTimeout(function(){ try { dispatchEvent(new Event("resize")); } catch (e) {} }, 30);
    setTimeout(title, 60); }
  document.addEventListener("clisa:tab", function(e){ tab(e.detail); });
  var pn = document.querySelector(".pane:not([hidden])"); tab(pn && pn.id ? pn.id.replace(/^pane-/, "") : "overview");
  try { var te = document.querySelector("title"); if (te) new MutationObserver(title).observe(te, {childList: true, characterData: true, subtree: true}); } catch (e) {}
  /* 장소 표시 띠(#markbar)가 뜨면 지구본을 내리고, 표시를 풀면 접는다 */
  var mb = document.getElementById("markbar");
  if (mb) { try { new MutationObserver(function(){ if (!mq.matches || D.classList.contains("mapp-map")) return;
      if (!mb.hidden) { if (!D.classList.contains("locshow")) { D.classList.add("locshow"); try { dispatchEvent(new Event("resize")); } catch (e) {} } } else D.classList.remove("locshow"); }).observe(mb, {attributes: true, attributeFilter: ["hidden"]}); } catch (e) {} }
})();

/* 2026-11-08 대통령님 결재: 띠 C안(확률 계기형). 지오폴리틱스 모든 쪽(header1101.py가 hdr.js 끝에 붙임)과 아카데미·게임 첫 화면(stripc1108.py가 /strips_c.js로)에서 함께 쓴다.
   전망 띠: 확률 막대·확률·변화폭(처음 공개 확률 대비, 전망 조정은 조정 폭)·남은 날. 휴대전화는 막대·남은 날을 빼고 숫자만.
   화면 앱(app.js)과 글 쪽(shell.js)의 띠가 소식을 바꿀 때마다 clStripM(띠, {p, c, due})를 부른다. 이 파일이 늦게 읽히면 띠에 남겨 둔 _m으로 다시 그린다. */
(function(){
  "use strict";
  var EN = /^en/i.test(document.documentElement.lang || ""), RM = false;
  try { RM = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function left(due){ var t = new Date(), a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(due || ""); if (!m) return "";
    var n = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - a) / 864e5);
    return EN ? (n > 1 ? n + " days left" : n === 1 ? "1 day left" : n === 0 ? "Resolves today" : "Awaiting resolution") : (n > 0 ? n + "일 남음" : n === 0 ? "오늘 검증" : "검증 대기"); }
  function draw(st){
    var m = st._m || null, bm = st.querySelector(".bs-m");
    if (!m || m.p == null) { st.classList.remove("c-m"); if (bm) bm.innerHTML = ""; return; }
    if (!bm) { var bt = st.querySelector(".bs-t"); if (!bt) return; bm = document.createElement("span"); bm.className = "bs-m"; bm.setAttribute("aria-hidden", "true"); bt.parentNode.insertBefore(bm, bt.nextSibling); }
    var c = m.c, h = '<span class="bs-bar"><i style="width:' + Math.max(2, Math.min(100, m.p)) + '%"></i></span><b class="bs-pc">' + m.p + "%</b>";
    if (c) h += '<span class="bs-ch ' + (c > 0 ? "up" : "dn") + '">' + (c > 0 ? "▲" : "▼") + Math.abs(c) + "</span>";
    if (m.due) h += '<span class="bs-dl">' + left(m.due) + "</span>";
    bm.innerHTML = h; st.classList.add("c-m");
  }
  window.clStripM = function(st, m){ if (!st) return; st._m = m || null; draw(st); };
  function again(){ document.querySelectorAll(".bstrip").forEach(function(st){ if ("_m" in st) draw(st); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", again); else again();
})();
/* 2026-11-07 시안(대통령님): 띠 제목을 1914 게임의 전문처럼 왼쪽에서 오른쪽으로 빠르게 찍어 보인다.
   분류·날짜·순번은 바로 보이고 제목(.bs-t)만 찍는다. 움직임 줄이기 설정이면 하지 않는다. 화면 낭독기는 띠의 aria-label로 제목 전체를 읽는다. */
(function(){
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) {}
  function textNodes(el){ var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), a = [], n; while ((n = w.nextNode())) a.push(n); return a; }
  function hook(st){
    var bt = st.querySelector(".bs-t"); if (!bt || bt.dataset.tw) return; bt.dataset.tw = "1";
    var last = "", tm = null, mo = new MutationObserver(function(){ run(); });
    var watch = function(){ mo.observe(bt, {childList: true, subtree: true, characterData: true}); };
    function run(){
      var full = bt.textContent; if (!full || full === last) return; last = full;
      var lab = [".bs-k", ".bs-d"].map(function(q){ var e = st.querySelector(q); return e ? e.textContent : ""; }).concat([full]).filter(Boolean).join(" ");
      st.setAttribute("aria-label", lab);
      var ns = textNodes(bt), fs = ns.map(function(n){ return n.nodeValue; });
      mo.disconnect(); clearTimeout(tm); ns.forEach(function(n){ n.nodeValue = ""; }); bt.classList.add("tw-on");
      var k = 0, i = 0;
      (function step(){
        if (k >= ns.length || !bt.contains(ns[k])) { bt.classList.remove("tw-on"); ns.forEach(function(n, j){ n.nodeValue = fs[j]; }); watch(); if (bt.textContent !== last) run(); return; }
        i += 2; ns[k].nodeValue = fs[k].slice(0, i); if (i >= fs[k].length) { k++; i = 0; }
        tm = setTimeout(step, 24);
      })();
    }
    watch(); run();
  }
  function init(){ document.querySelectorAll(".bstrip").forEach(hook); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
