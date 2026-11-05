/* 나비효과로 보기 2단계(시안 2026-11-06, 배포 전): 각 쪽의 꼭지에 '나비효과로 보기 →' 칩.
   결재된 연쇄 고리(chains.json)·전망 대응표(fcmap.json)에 이어진 꼭지에만 붙인다.
   누르면 rpfocus {s:[전망 id 또는 연쇄 칸 id], t}를 남기고 첫 화면(나비효과로 보기)을 새로 연다 → 그림이 '한 항목 보기'로 열린다. */
(function(){
  var EN = /^\/en\//.test(location.pathname), P = EN ? "/en" : "";
  if (/\/(lab\/)?ripple\//.test(location.pathname)) return;
  var TXT = EN ? "See chain reactions →" : "지정학 신경망 보기 →";
  var OUT = null, FM = null, DLY = null, busy = false;
  function J(u){ return fetch(P + u, {cache: "no-cache"}).then(function(r){ return r.json(); }); }
  function css(){ if (document.getElementById("rp3css")) return; var s = document.createElement("style"); s.id = "rp3css";
    s.textContent = "a.rp3{display:inline-flex;align-items:center;gap:4px;margin:8px 0 0;padding:4px 11px;border:1px solid #2f6bff;border-radius:999px;color:#2f6bff;background:transparent;font:600 12.5px/1.25 system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;text-decoration:none;white-space:nowrap;cursor:pointer}" +
      "a.rp3:hover{background:#2f6bff;color:#fff}html[data-theme=dark] a.rp3,.dark a.rp3{border-color:#7fa6ff;color:#9db9ff}" +
      ".rp3w{display:block}#tip a.rp3{border-color:#7fa6ff;color:#9db9ff}#tip a.rp3:hover{background:#7fa6ff;color:#0b111d}";
    document.head.appendChild(s); }
  function okNode(n){ return !!(OUT.has(n) || OUT.m[n]); }
  function okFc(id){ var m = FM[id]; if (!m) return false; var cs = [m].concat(m.alt ? [m.alt] : []);
    for (var i = 0; i < cs.length; i++){ var c = cs[i]; if (c && c.node && c.rel !== "none" && (OUT.from[c.node] || OUT.m[c.node])) return true; } return false; }
  function go(seeds){ try { sessionStorage.setItem("rpfocus", JSON.stringify({s: seeds, t: Date.now()})); } catch(e){}
    var w = window; try { w = window.top; } catch(e){} w.location.assign(P + "/"); }
  function chip(host, seeds, key, wrap){
    if (!seeds.length) return; var k = seeds.join("|");
    var old = host.querySelector(":scope > .rp3w, :scope > a.rp3"); if (old){ if (old.getAttribute("data-k") === k) return; old.remove(); }
    var a = document.createElement("a"); a.className = "rp3"; a.href = P + "/"; a.textContent = TXT; a.setAttribute("data-k", k);
    a.addEventListener("click", function(ev){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); go(seeds); }, true);
    ["mousedown", "keydown", "touchstart"].forEach(function(t){ a.addEventListener(t, function(ev){ ev.stopPropagation(); }, {passive: true}); });
    var el = a; if (wrap){ el = document.createElement("div"); el.className = "rp3w"; el.setAttribute("data-k", k); el.appendChild(a); }
    host.appendChild(el); }
  function scan(){
    if (!OUT) return;
    /* 전망 카드(전망으로 보기) */
    document.querySelectorAll("article.f2-ev[data-f2]").forEach(function(a){ var id = a.getAttribute("data-f2"); if (okFc(id)) chip(a, [id], 0, true); });
    /* 전망 쪽 */
    var fm = location.pathname.match(/\/forecast\/(f\d+)\/?$/), fh = document.querySelector(".fd-h");
    if (fm && fh && okFc(fm[1])) chip(fh, [fm[1]], 0, true);
    /* 산업 카드 */
    document.querySelectorAll('article[id^="ind-"]').forEach(function(a){ var n = "ind:" + a.id.slice(4); if (okNode(n)) chip(a, [n], 0, true); });
    /* 국민의 삶: 고른 국민 */
    var on = document.querySelector("button.l2-chip.on[data-l2g]"), one = document.querySelector("p.l2-one");
    if (on && one && one.offsetParent){ var g = "grp:" + on.getAttribute("data-l2g"), hostL = one.parentNode;
      if (okNode(g)){ var ex = hostL.querySelector(":scope > .rp3w"); if (!ex || ex.getAttribute("data-k") !== g){ if (ex) ex.remove(); var tmp = document.createElement("div"); chip(tmp, [g], 0, true); one.after(tmp.firstChild); } }
      else { var ex2 = hostL.querySelector(":scope > .rp3w"); if (ex2) ex2.remove(); } }
    /* 분쟁 지점(나비효과 지도 쪽) */
    var sel = document.getElementById("lkm-sel");
    if (sel && sel.value){ var pick = sel.closest(".lkm-pick") || sel.parentNode, f = "fp:" + sel.value, ex3 = pick.nextElementSibling && pick.nextElementSibling.classList.contains("rp3w") ? pick.nextElementSibling : null;
      if (okNode(f)){ if (!ex3 || ex3.getAttribute("data-k") !== f){ if (ex3) ex3.remove(); var t2 = document.createElement("div"); chip(t2, [f], 0, true); pick.after(t2.firstChild); } } else if (ex3) ex3.remove(); }
    /* 사안 전개 */
    document.querySelectorAll('article.fut[id^="fut-"]').forEach(function(a){ var m = a.id.match(/^fut-([a-z]+)-(.+)$/); if (m && okNode(m[1] + ":" + m[2])) chip(a, [m[1] + ":" + m[2]], 0, true); });
    /* 사안의 바깥 변수(펼치는 칸) */
    document.querySelectorAll('article.case-a[id^="case-"] .exts details.dec').forEach(function(d){ var cid = d.closest("article.case-a").id.slice(5), nm = d.querySelector("summary .nm"), dl = d.querySelector("dl");
      var m = nm && nm.textContent.match(/^(X\d+)\s/); if (m && dl && okNode(cid + ":" + m[1])) chip(d, [cid + ":" + m[1]], 0, true); });
    /* 시황판 설명 상자 */
    var tip = document.getElementById("tip");
    var mk = tip && tip.querySelector("[data-rpid]");
    if (mk && tip.style.display !== "none" && (tip.classList.contains("pin") || tip.classList.contains("sheet")) && !tip.querySelector("a.rp3")){ var id = mk.getAttribute("data-rpid"); var s = /^f\d+$/.test(id) ? (okFc(id) ? [id] : []) : (okNode(id) ? [id] : []); if (s.length){ var t3 = document.createElement("div"); chip(t3, s, 0, true); var at = tip.querySelector(".mean") || tip.querySelector(".grp"); if (at) at.after(t3.firstChild); else tip.appendChild(t3.firstChild); } }
    /* 정세 브리핑 꼭지 */
    var bis = document.querySelectorAll("article.bi");
    if (bis.length){ if (!DLY){ if (!busy){ busy = true; J("/data/daily.json").then(function(d){ DLY = {h: {}, d: {}}; (d.issues || []).forEach(function(iss){ DLY.d[iss.date] = iss.items || []; (iss.items || []).forEach(function(x){ DLY.h[(x.h || "").replace(/\s+/g, " ").trim()] = x; }); }); scan(); }).catch(function(){}); } }
      else bis.forEach(function(a){ var bl = a.querySelector("[data-bloc]"), x = null; if (bl){ var q = bl.getAttribute("data-bloc").split("|"); x = (DLY.d[q[0]] || [])[+q[1]]; }
        if (!x){ var h = a.querySelector("h2,h3,h4"); if (h) x = DLY.h[h.textContent.replace(/\s+/g, " ").trim()]; } if (!x) return; var s = [];
        (x.fc || []).forEach(function(c){ if (s.indexOf(c.id) < 0 && okFc(c.id)) s.push(c.id); });
        (x.fp || []).forEach(function(f){ var n = "fp:" + (f.id || f); if (s.indexOf(n) < 0 && okNode(n)) s.push(n); });
        if (s.length) chip(a, s, 0, true); }); }
  }
  Promise.all([J("/data/chains.json"), J("/data/fcmap.json")]).then(function(r){
    var C = r[0], set = new Set(), from = {}; (C.links || []).forEach(function(l){ set.add(l.f); set.add(l.t); from[l.f] = 1; });
    OUT = set; OUT.from = from; OUT.m = C.M || {}; FM = {}; (r[1] || []).forEach(function(m){ FM[m.id] = m; });
    css(); scan(); var tm = null;
    new MutationObserver(function(){ if (tm) return; tm = setTimeout(function(){ tm = null; scan(); }, 250); }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["class"]});
    document.addEventListener("change", function(e){ if (e.target && e.target.id === "lkm-sel") setTimeout(scan, 50); }, true);
  }).catch(function(){});
})();
