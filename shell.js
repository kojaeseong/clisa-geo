/* v3.42 글 쪽(브리핑·특집·결정권자·전망·안내) 머리글 윗줄: 세계 시각, 검색창, 정세 브리핑·다가오는 일정 띠.
   지구본 화면(app.js)과 같은 모양·같은 규칙으로 움직이되, 무거운 자료(eurasia.json)는 받지 않는다.
   띠의 내용: /data/daily.json(매일 바뀜) + /data/shell.json(전체 빌드 때 바뀜: 판단 변경 공지, 열린 전망의 검증 시점, 예정 사건). */
(function(){
  "use strict";
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrow = function(){ return innerWidth <= 960; };
  var fmtKD = function(s){ var a = String(s).split("-").map(Number); return a[1] + "월 " + a[2] + "일"; };
  function daysLeft(due){ var t = new Date(), a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(due || ""); if (!m) return null; return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - a) / 864e5); }
  function daysText(n){ return n == null ? "" : n > 0 ? n + "일 남음" : n === 0 ? "오늘 검증" : "검증 대기"; }
  function evKey(e){ return e.date.length === 7 ? e.date + "-32" : e.date; }
  function evDays(e){ if (e.date.length === 7) return ""; var n0 = daysLeft(e.date), n1 = daysLeft(e.end || e.date); return n0 > 0 ? n0 + "일 남음" : n1 >= 0 ? (n0 === 0 ? "오늘" : "진행 중") : ""; }
  function evDate(e){ if (e.date.length === 7) return (+e.date.slice(5, 7)) + "월 중"; var a = fmtKD(e.date); if (!e.end) return a; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(e.end); return m && e.end.slice(0, 7) === e.date.slice(0, 7) ? a + "~" + (+m[3]) + "일" : a + "~" + fmtKD(e.end); }

  /* 세계 시각(지구본 화면과 같은 도시·같은 배치) */
  var CLOCKS = [["서울·도쿄", "Asia/Seoul"], ["베이징·타이베이", "Asia/Shanghai"], ["테헤란", "Asia/Tehran"], ["모스크바", "Europe/Moscow"], ["키이우", "Europe/Kyiv"], ["브뤼셀", "Europe/Brussels"], ["런던", "Europe/London"], ["워싱턴·뉴욕", "America/New_York"]];
  (function(){
    var el = document.getElementById("clocks"); if (!el || !window.Intl) return;
    var fm = {}, fd = {};
    var F = function(tz){ return fm[tz] || (fm[tz] = new Intl.DateTimeFormat("en-GB", {timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false})); };
    var Fd = function(tz){ return fd[tz] || (fd[tz] = new Intl.DateTimeFormat("en-CA", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"})); };
    el.innerHTML = CLOCKS.map(function(c){ return '<span class="clk" data-tz="' + c[1] + '"><span class="c">' + c[0] + '</span><span class="t"></span><span class="d"></span></span>'; }).join("");
    var tick = function(){ var now = new Date(), seoul = Fd("Asia/Seoul").format(now);
      [].forEach.call(el.querySelectorAll(".clk"), function(x){ var tz = x.dataset.tz, tt = F(tz).format(now); x.querySelector(".t").innerHTML = tt.slice(0, 2) + '<b class="' + (now.getSeconds() % 2 ? "off" : "") + '">:</b>' + tt.slice(3, 5); var d = Fd(tz).format(now); x.querySelector(".d").textContent = d === seoul ? "" : (d < seoul ? "−1일" : "+1일"); }); };
    try { tick(); el.hidden = false; setInterval(function(){ if (document.visibilityState === "visible") tick(); }, 1000); } catch (e) { el.hidden = true; }
    var sb = document.getElementById("srchopen"), h1 = document.querySelector(".brand b"), top = document.querySelector(".top"), lastW = 0;
    var wrapped = function(){ return sb.getBoundingClientRect().top > h1.getBoundingClientRect().bottom - 4; };
    var fit = function(){ if (!sb || !h1) return; if (innerWidth !== lastW) { lastW = innerWidth; el.classList.remove("tight"); top.classList.remove("snug"); el.style.zoom = ""; }
      if (el.classList.contains("tight") || getComputedStyle(el).display === "none") return;
      if (!wrapped()) return;
      if (!top.classList.contains("snug")) { top.classList.add("snug"); if (!wrapped()) return; }
      for (var z = 0.95; z >= 0.7; z -= 0.05) { el.style.zoom = z; if (!wrapped()) return; }
      el.style.zoom = ""; el.classList.add("tight"); top.classList.remove("snug"); };
    fit(); addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(top);
  })();

  /* 검색: '/' 키로도 지구본 화면의 검색 창을 연다 */
  document.addEventListener("keydown", function(e){ if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); location.href = "/?q="; } });

  /* 띠 */
  function runStrip(st, list){
    var bt = st.querySelector(".bs-t"), bn = st.querySelector(".bs-n"), bk = st.querySelector(".bs-k"), bd = st.querySelector(".bs-d"), k = 0, hold = false;
    var show = function(){ var L = list(), N = L.length; if (!N) { st.hidden = true; return; } k = k % N; var x = L[k]; bt.textContent = x.t || ""; bk.textContent = x.k || ""; bd.textContent = x.d ? fmtKD(x.d) : ""; bn.textContent = N > 1 ? (k + 1) + "/" + N : ""; st.href = x.go || "/"; st.hidden = false; };
    show();
    if (!reduceMotion) setInterval(function(){
      if (hold || document.visibilityState !== "visible" || list().length < 2) return;
      bt.classList.add("fade"); setTimeout(function(){ k = (k + 1) % Math.max(1, list().length); show(); bt.classList.remove("fade"); }, 350);
    }, 4000);
    addEventListener("resize", show);
    st.addEventListener("mouseenter", function(){ hold = true; }); st.addEventListener("mouseleave", function(){ hold = false; });
    st.addEventListener("focus", function(){ hold = true; }); st.addEventListener("blur", function(){ hold = false; });
  }
  var J = function(u){ return fetch(u, {cache: "no-cache"}).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); };
  Promise.all([J("/data/daily.json"), J("/data/shell.json")]).then(function(r){
    var b = r[0], s = r[1] || {}, bs = document.getElementById("bstrip"), as = document.getElementById("astrip");
    if (!bs) return;
    var agenda = function(days){
      var L = (s.forecasts || []).filter(function(f){ var n = daysLeft(f.due); return f.status === "open" && n != null && n <= days; })
        .sort(function(a, c){ return a.due.localeCompare(c.due) || c.p - a.p; }).map(function(f){ return {k: f.due, f: f}; })
        .concat((s.events || []).filter(function(e){ var n = daysLeft(e.date.length === 7 ? e.date + "-01" : e.date); return n != null && n <= days && (e.date.length === 7 ? daysLeft(e.date + "-28") >= 0 : (e.end ? daysLeft(e.end) : n) >= 0); }).map(function(e){ return {k: evKey(e), e: e}; }));
      return L.sort(function(a, c){ return a.k.localeCompare(c.k); });
    };
    var agendaItems = function(){ return agenda(90).map(function(x){ return x.f ? {k: "검증 예정", d: x.f.due, t: (x.f.s || x.f.id + " " + x.f.q) + " · " + daysText(daysLeft(x.f.due)), go: "/forecast/#" + x.f.id, soon: daysLeft(x.f.due) <= 30}
      : {k: "예정", d: x.e.date.length === 7 ? "" : x.e.date, t: x.e.t + " · " + (x.e.date.length === 7 ? evDate(x.e) : evDays(x.e)), go: "/", soon: daysLeft(x.e.date.length === 7 ? x.e.date + "-01" : x.e.date) <= 30}; }); };
    var MAIN = [];
    if (b && (b.issues || []).length) {
      var cur = b.issues[0], d7 = new Date(Date.now() - 7 * 864e5), lim = d7.getFullYear() + "-" + String(d7.getMonth() + 1).padStart(2, "0") + "-" + String(d7.getDate()).padStart(2, "0"); var d3 = new Date(Date.now() - 2 * 864e5), lim3 = d3.getFullYear() + "-" + String(d3.getMonth() + 1).padStart(2, "0") + "-" + String(d3.getDate()).padStart(2, "0");
      MAIN = (s.notices || []).filter(function(n){ return n.date >= lim; }).sort(function(a, c){ return c.date.localeCompare(a.date); })
        .map(function(n){ return {k: n.k || "분석 갱신", d: n.date, t: n.h, go: n.link ? "/" + n.link : "/"}; })
        .concat((s.fcr || []).filter(function(r){ return r.date >= lim3; }).map(function(r){ return {k: "전망 조정", d: r.date, t: r.s + " " + r.from + "% → " + r.to + "%", go: "/forecast/#fw-" + r.date}; }))
        .concat(cur.items.map(function(i){ return {k: "정세 브리핑", d: cur.date, t: i.h, go: "/brief/" + cur.date + "/"}; }));
    }
    runStrip(bs, function(){ return narrow() ? MAIN.concat(agendaItems().filter(function(x){ return x.soon; })) : MAIN; });
    if (as) runStrip(as, function(){ return narrow() ? [] : agendaItems(); });
  });
})();
