/* 연결 지도 쪽 /links/ (2026-11-02 시안 결재). links1102.py가 붙이고, 자료는 /data/links.json·/en/data/links.json */
(function () {
  function init(root) {
  if (!root || root.getAttribute("data-on")) return; root.setAttribute("data-on", "1");
  var EN = root.getAttribute("data-en") === "1", P = EN ? "/en" : "";
  var T = EN ? {
    vt: ["By Forecast", "By Population", "By Pathway"], hm: "Heat Map",
    h: "How conflicts reach people's lives",
    sub: "Clisa Geopolitics checked each of 43 flashpoints against six channels of impact and six populations, one cell at a time. Cells judged connected show the pathway, the evidence, and the sources; cells judged not connected also give the reason.",
    st: [["cells checked"], ["connected"], ["not connected"], ["undetermined (insufficient data)"]],
    seg: ["Flashpoints", "Populations"], find: "Find a flashpoint", pick: "Select a flashpoint",
    sev: "Severity ", party: "Parties: ", nconn: function (n) { return n + (n === 1 ? " connected cell" : " connected cells"); },
    lg: ["Connected · high confidence", "Connected · medium", "Connected · low", "Not connected (–)", "Undetermined (?)"],
    no: "Not connected", uk: "Undetermined", why: "Why this cell was judged not connected", need: "Data needed to decide",
    conf: "Confidence: ", lag: "Time to effect: ", cat: "Affects: ", dir: "Improves daily life", actor: "Actor: ",
    path: "Pathway", basis: "Evidence", src: "Sources",
    note: "This cell shows Clisa Geopolitics' judgment, with its evidence, that this conflict can affect this population's lives through this channel. It does not estimate the size of any harm.",
    partyG: "People in the countries involved in each conflict", gsum: function (who, nf, nc, hi) { return who + ": <b>" + nf + "</b> connected " + (nf === 1 ? "flashpoint" : "flashpoints") + ", <b>" + nc + "</b> connected " + (nc === 1 ? "cell" : "cells") + " (" + hi + " high confidence). Select a flashpoint to see the pathway and evidence."; },
    count: function (n) { return n === 1 ? "1 flashpoint" : n + " flashpoints"; }, none: "No connected flashpoints",
    cellT: function (c) { return "Connected · " + c + " confidence"; }
  } : {
    vt: ["전망으로 보기", "국민별로 보기", "나비효과 지도로 보기"], hm: "시황판으로 보기",
    h: "분쟁이 생활로 이어지는 경로",
    sub: "클리사 지오폴리틱스는 분쟁 지점 43곳을 6개 영향 경로와 6개 국민 집단에 하나씩 대조했습니다. 이어진다고 판단한 칸에는 경로와 근거, 출처를 밝히고, 이어지지 않는다고 판단한 칸에도 그 이유를 밝혔습니다.",
    st: [["대조한 칸"], ["이어짐"], ["이어지지 않음"], ["판단 불가(자료 부족)"]],
    seg: ["분쟁에서 보기", "국민에서 보기"], find: "분쟁 지점 찾기", pick: "분쟁 지점 선택",
    sev: "심각도 ", party: "당사국 ", nconn: function (n) { return "이어지는 칸 " + n + "개"; },
    lg: ["이어짐 · 확신도 높음", "이어짐 · 중간", "이어짐 · 낮음", "이어지지 않음(–)", "판단 불가(?)"],
    no: "이어지지 않음", uk: "판단 불가", why: "이어지지 않는다고 본 이유", need: "판단에 필요한 자료",
    conf: "확신도 ", lag: "걸리는 시간 ", cat: "영향 범주 ", dir: "생활에 주는 방향: 개선", actor: "주체 ",
    path: "경로", basis: "근거", src: "출처",
    note: "이 칸은 이 분쟁이 이 경로로 이 집단의 생활에 영향을 줄 수 있다는 클리사 지오폴리틱스의 판단과 그 근거입니다. 피해의 크기를 예측한 것은 아닙니다.",
    partyG: "각 분쟁의 당사국 국민", gsum: function (who, nf, nc, hi) { return who + "의 생활로 이어지는 분쟁 지점은 <b>" + nf + "곳</b>, 이어지는 칸은 <b>" + nc + "개</b>입니다(확신도 높음 " + hi + "개). 분쟁 이름을 누르면 경로와 근거가 나옵니다."; },
    count: function (n) { return n + "곳"; }, none: "이어지는 분쟁 지점 없음",
    cellT: function (c) { return "이어짐 · 확신도 " + c; }
  };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); };
  var fmt = function (n) { return n.toLocaleString(EN ? "en-US" : "ko-KR"); };
  var $ = function (s) { return root.querySelector(s); };
  root.innerHTML = '<section class="lkm-hero"><nav class="lkm-vt" aria-label="' + (EN ? "View" : "보기 방식") + '"><a href="' + P + '/">' + T.hm + '</a><a href="' + P + '/outlook/">' + T.vt[0] + '</a><a href="' + P + '/life/">' + T.vt[1] + '</a><a class="on" href="' + P + '/links/" aria-current="page">' + T.vt[2] + "</a></nav>" +
    "<h1>" + esc(T.h) + "</h1><p>" + esc(T.sub) + '</p><div class="lkm-stats" id="lkm-stats"></div></section>' +
    '<div class="lkm-seg" role="tablist"><button class="on" data-v="fp">' + T.seg[0] + '</button><button data-v="grp">' + T.seg[1] + "</button></div>" +
    '<div id="lkm-vfp"><div class="lkm-pick"><select id="lkm-sel" aria-label="' + esc(T.pick) + '"></select><input id="lkm-q" placeholder="' + esc(T.find) + '" aria-label="' + esc(T.find) + '"></div>' +
    '<h2 id="lkm-n"></h2><p class="lkm-meta" id="lkm-m"></p><p class="lkm-st" id="lkm-s"></p><table class="lkm-mx" id="lkm-mx"></table>' +
    '<div class="lkm-lg"><span><em style="background:var(--c3)"></em>' + T.lg[0] + '</span><span><em style="background:var(--c2)"></em>' + T.lg[1] + '</span><span><em style="background:var(--c1)"></em>' + T.lg[2] + '</span><span><em style="background:var(--panel-2);border:1px solid var(--line)"></em>' + T.lg[3] + '</span><span><em style="border:1px dashed var(--muted)"></em>' + T.lg[4] + "</span></div>" +
    '<div class="lkm-det" id="lkm-det"></div></div>' +
    '<div id="lkm-vg" class="hide"><div class="lkm-gch" id="lkm-gch"></div><p class="lkm-gsum" id="lkm-gsum"></p><div id="lkm-rows"></div><div class="lkm-det" id="lkm-det2"></div></div>' +
    '<details class="lkm-how"><summary>' + (EN ? "How the cells are judged" : "판단 기준") + "</summary><ul id=\"lkm-how\"></ul></details>";
  fetch(P + "/data/links.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(go).catch(function () { $("#lkm-n").textContent = EN ? "The data could not be loaded." : "자료를 불러오지 못했습니다."; });

  function go(D) {
    var L = D.L, byFp = {}, fpById = {};
    D.fps.forEach(function (f) { fpById[f.id] = f; });
    D.cells.forEach(function (c) { (byFp[c.f] = byFp[c.f] || []).push(c); });
    var cnt = function (f) { return (byFp[f] || []).filter(function (c) { return c.v === 1; }).length; };
    var fps = D.fps.slice().sort(function (a, b) { return cnt(b.id) - cnt(a.id) || (b.sev || 0) - (a.sev || 0); });
    var t = D.cells.length, y = 0, n = 0, u = 0;
    D.cells.forEach(function (c) { if (c.v === 1) y++; else if (c.v === 0) n++; else u++; });
    $("#lkm-stats").innerHTML = [[fmt(t) + (EN ? "" : "칸"), T.st[0]], [fmt(y), T.st[1]], [fmt(n), T.st[2]], [fmt(u), T.st[3]]].map(function (x) { return '<div class="lkm-stat"><b>' + x[0] + "</b>" + esc(x[1]) + "</div>"; }).join("");
    $("#lkm-how").innerHTML = D.how.map(function (h) { return "<li><b>" + esc(h[0]) + "</b>: " + esc(h[1]) + "</li>"; }).join("");
    var grpName = function (gi, f) { var g = D.groups[gi]; return g === "PARTY" ? (L.gl.PARTY + (f && fpById[f].pt ? " (" + fpById[f].pt + ")" : "")) : L.gl[g]; };
    function detail(c) {
      var f = fpById[c.f], p = L.paths[c.p];
      var head = "<h3>" + esc(f.n) + " → " + esc(grpName(c.g, c.f)) + "</h3>";
      if (c.v !== 1) return head + '<div class="lkm-chips"><span class="lkm-chip">' + esc(p) + '</span><span class="lkm-chip">' + (c.v === 0 ? T.no : T.uk) + '</span></div><div class="lkm-lbl">' + (c.v === 0 ? T.why : T.need) + '</div><p class="lkm-basis">' + esc(c.r) + "</p>";
      var steps = c.m.split(/\s*→\s*/).filter(Boolean);
      var chips = ['<span class="lkm-chip k">' + esc(p) + "</span>", '<span class="lkm-chip">' + T.conf + esc(L.conf[c.c]) + "</span>", '<span class="lkm-chip">' + T.lag + esc(L.lag[c.l]) + "</span>",
        '<span class="lkm-chip">' + T.cat + esc(c.k.map(function (i) { return L.cat[i]; }).join(", ")) + "</span>"];
      if (c.d) chips.push('<span class="lkm-chip">' + T.dir + "</span>");
      if (c.a != null) chips.push('<span class="lkm-chip">' + T.actor + esc(L.actor[c.a]) + "</span>");
      var src = (c.s || []).map(function (s) { var h = s; try { var x = new URL(s); h = x.hostname.replace(/^www\./, "") + x.pathname.slice(0, 48) + (x.pathname.length > 48 ? "…" : ""); } catch (e) {} return '<a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(h) + "</a>"; }).join("");
      return head + '<div class="lkm-chips">' + chips.join("") + '</div><div class="lkm-lbl">' + T.path + '</div><ol class="lkm-chain">' + steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
        '</ol><div class="lkm-lbl">' + T.basis + '</div><p class="lkm-basis">' + esc(c.b) + '</p><div class="lkm-lbl">' + T.src + '</div><div class="lkm-src">' + src + '</div><p class="lkm-note">' + esc(T.note) + "</p>";
    }
    function cellHtml(c) {
      var k = c.p + "-" + c.g;
      if (c.v === 0) return '<td class="no" data-k="' + k + '" title="' + esc(T.no) + '">–</td>';
      if (c.v === 2) return '<td class="uk" data-k="' + k + '" title="' + esc(T.uk) + '">?</td>';
      return '<td class="v' + c.c + '" data-k="' + k + '" title="' + esc(T.cellT(L.conf[c.c])) + '">' + esc(L.confS[c.c]) + (c.d ? "<i>" + esc(L.better) + "</i>" : "") + "</td>";
    }
    var cur = null;
    function pick(id) {
      cur = id; var f = fpById[id], cs = byFp[id] || [], m = {};
      cs.forEach(function (c) { m[c.p + "-" + c.g] = c; });
      $("#lkm-sel").value = id; $("#lkm-n").textContent = f.n;
      $("#lkm-m").textContent = T.sev + f.sev + " · " + T.party + f.pt + " · " + T.nconn(cnt(id));
      $("#lkm-s").textContent = f.st;
      var h = "<thead><tr><th></th>" + D.groups.map(function (g) { return "<th>" + esc(L.gs[g]) + "</th>"; }).join("") + "</tr></thead><tbody>";
      L.paths.forEach(function (p, pi) { h += "<tr><th>" + esc(p) + "</th>" + D.groups.map(function (g, gi) { return cellHtml(m[pi + "-" + gi]); }).join("") + "</tr>"; });
      var mx = $("#lkm-mx"); mx.innerHTML = h + "</tbody>";
      mx.querySelectorAll("td[data-k]").forEach(function (td) { td.onclick = function () { show(m[td.getAttribute("data-k")]); }; });
      var first = cs.filter(function (c) { return c.v === 1; }).sort(function (a, b) { return (a.g - b.g) || (b.c - a.c); })[0] || cs[0];
      show(first);
      try { history.replaceState(null, "", "#" + id); } catch (e) {}
    }
    function show(c) {
      root.querySelectorAll("#lkm-mx td").forEach(function (td) { td.classList.toggle("sel", td.getAttribute("data-k") === c.p + "-" + c.g); });
      $("#lkm-det").innerHTML = detail(c);
    }
    function fill(q) {
      var L2 = fps.filter(function (f) { return !q || f.n.toLowerCase().indexOf(q) >= 0 || f.pt.toLowerCase().indexOf(q) >= 0; });
      $("#lkm-sel").innerHTML = L2.map(function (f) { return '<option value="' + f.id + '">' + esc(f.n) + " (" + cnt(f.id) + ")</option>"; }).join("");
      if (L2.length && !L2.some(function (f) { return f.id === cur; })) pick(L2[0].id); else if (cur) $("#lkm-sel").value = cur;
    }
    $("#lkm-sel").onchange = function () { pick(this.value); };
    $("#lkm-q").oninput = function () { fill(this.value.trim().toLowerCase()); };
    fill("");
    var h0 = (location.hash || "").slice(1);
    pick(fpById[h0] ? h0 : "rus-ukr");
    var gcur = 0;
    function renderG() {
      $("#lkm-gch").innerHTML = D.groups.map(function (g, i) { return '<button data-g="' + i + '" class="' + (i === gcur ? "on" : "") + '">' + esc(L.gl[g]) + "</button>"; }).join("");
      root.querySelectorAll("#lkm-gch button").forEach(function (b) { b.onclick = function () { gcur = +b.getAttribute("data-g"); renderG(); }; });
      var cs = D.cells.filter(function (c) { return c.g === gcur && c.v === 1; });
      var nf = {}; cs.forEach(function (c) { nf[c.f] = 1; });
      var hi = cs.filter(function (c) { return c.c === 3; }).length;
      var who = D.groups[gcur] === "PARTY" ? T.partyG : L.gl[D.groups[gcur]];
      $("#lkm-gsum").innerHTML = T.gsum(esc(who), Object.keys(nf).length, cs.length, hi);
      $("#lkm-rows").innerHTML = L.paths.map(function (p, pi) {
        var r = cs.filter(function (c) { return c.p === pi; }).sort(function (a, b) { return b.c - a.c; });
        return '<div class="lkm-prow"><h4>' + esc(p) + "<small>" + T.count(r.length) + '</small></h4><div class="lkm-pl">' +
          (r.length ? r.map(function (c) { return '<button class="v' + c.c + '" data-f="' + c.f + '" data-p="' + pi + '" title="' + esc(T.cellT(L.conf[c.c])) + '">' + esc(fpById[c.f].n) + "</button>"; }).join("") : '<span class="none">' + T.none + "</span>") + "</div></div>";
      }).join("");
      root.querySelectorAll("#lkm-rows button").forEach(function (b) {
        b.onclick = function () { var c = cs.filter(function (x) { return x.f === b.getAttribute("data-f") && x.p === +b.getAttribute("data-p"); })[0]; var d = $("#lkm-det2"); d.innerHTML = detail(c); d.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      });
      $("#lkm-det2").innerHTML = "";
    }
    renderG();
    root.querySelectorAll(".lkm-seg button").forEach(function (b) {
      b.onclick = function () {
        root.querySelectorAll(".lkm-seg button").forEach(function (x) { x.classList.toggle("on", x === b); });
        $("#lkm-vfp").classList.toggle("hide", b.getAttribute("data-v") !== "fp"); $("#lkm-vg").classList.toggle("hide", b.getAttribute("data-v") !== "grp");
      };
    });
  }
  }
  init(document.getElementById("lkm"));
  /* 화면 안에서 이 쪽으로 돌아오면(뒤로 가기 등) 앱이 글 칸을 새로 넣으므로, 새 #lkm이 생기면 다시 그린다 */
  new MutationObserver(function () { var r = document.getElementById("lkm"); if (r && !r.getAttribute("data-on")) init(r); }).observe(document.body, { childList: true, subtree: true });
})();
