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
