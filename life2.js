/* 개편 ③ 국민의 삶 = 국민별로 보기(2026-11-01). life1101.py가 붙인다. 화면 앱의 renderBrief를 감싸, 국민의 삶 화면(/life/)일 때만 새 화면을 그린다 */
(function(){
  var EN = document.documentElement.lang === "en", LF = null, G = "KOR", OPEN = null;
  try { var q = new URLSearchParams(location.search).get("g"); if (q) G = q; else { var v = localStorage.getItem("ep.lifeg"); if (v) G = v; } } catch (e) {}
  var T = EN ? {
    eye: "People's Lives \u00b7 as of ", h: "Whose lives would you like to see?",
    sub: "Choose a population to see how the five conflicts could change its people's lives through 2030, shown as 100 possible futures. The dot counts are Clisa Geopolitics' judgment estimates.",
    off: "Other countries · coming soon", h3: "If you lived to 2030 a hundred times over",
    s1: ": 100 possible futures through 2030, shown as dots for each issue. Select a row to see the reasoning.",
    party: "People in the countries directly involved (both warring sides in the Russia-Ukraine war)",
    LN: {x: "Much worse", w: "Worse", b: "Better", s: "About the same"}, tr: "Daily dot counts", today: "Today", rev: " revision · ",
    small: "Classified as about the same, though changes were measured: ", smallT: " \u2014 Income changes under 2% and score changes of one point or less fall within the margin of error of the judgment estimates and are not used in the classification.",
    worst: "If the worst case plays out \u00b7 ", best: "If the best case plays out \u00b7 ", ch: "% likely", none: "None of the 100 futures leaves this group worse off than today.",
    more: "More on the effects on people's lives \u2192", al: "Alerts: ", nochg: "No change", vdem: "V-Dem physical integrity index ", pt: " pts",
    foot: "Much worse: any one category falls by more than 20 points, or two categories fall by more than 10.",
    CN: {"개인": "Personal safety", "공동체": "Community", "정치": "Political", "경제": "Economic"}, mon: ["January","February","March","April","May","June","July","August","September","October","November","December"]
  } : {
    eye: "국민의 삶 · ", eyeEnd: " 기준", h: "어느 국민의 삶을 보시겠습니까",
    sub: "국민을 고르면 5개 분쟁이 2030년까지 그 국민의 삶을 어떻게 바꿀 수 있는지, 일어날 수 있는 100가지 미래로 보여 드립니다. 점의 개수는 클리사 지오폴리틱스의 판단값입니다.",
    off: "그 밖의 나라 · 준비 중", h3: "2030년까지 100번을 살게 된다면",
    s1: "에게 2030년까지 올 수 있는 미래 100번을 사안마다 점으로 나타냈습니다. 줄을 누르면 근거가 열립니다.",
    party: "분쟁의 직접 당사국 국민(러-우 전쟁은 교전 양쪽)",
    LN: {x: "크게 악화", w: "악화", b: "개선", s: "현재와 비슷함"}, tr: "일자별 점 개수 추이", today: "오늘", rev: " 판단 변경 · ",
    small: "현재와 비슷함으로 분류했지만 측정된 변화: ", smallT: " — 소득 2% 미만·점수 1점 이하는 판단값의 오차 안이라 분류에 넣지 않습니다.",
    worst: "가장 나쁜 경우가 오면 · ", best: "가장 좋은 경우 · ", ch: "%", chP: "확률 ", none: "이 국민에게는 현재보다 못한 미래가 없습니다.",
    more: "삶에 미치는 영향 자세히 →", al: "경보: ", nochg: "변화 없음", vdem: "V-Dem 신체적 온전성 지수 ", pt: "점",
    foot: "크게 악화: 한 범주라도 20점 넘게 떨어지거나 두 범주가 10점 넘게 떨어지는 경우.",
    CN: {"개인": "개인 안전", "공동체": "공동체", "정치": "정치", "경제": "경제"}
  };
  var GROUPS = EN ? [["KOR","South Koreans"],["USA","Americans"],["NEU","Nordic and Baltic Europeans"],["SEU","Southern Europeans"],["WCEU","Western and Central Europeans"],["PARTY","People in the countries involved"]]
                  : [["KOR","한국"],["USA","미국"],["NEU","북유럽·발트"],["SEU","남유럽"],["WCEU","서유럽·중유럽"],["PARTY","분쟁 당사국 국민"]];
  var ISOS = {KOR: ["KOR"], USA: ["USA"], NEU: ["DNK","FIN","ISL","NOR","SWE","EST","LVA","LTU"], SEU: ["ITA","ESP","PRT","GRC"], WCEU: ["DEU","FRA","GBR","POL"], PARTY: ["IRN","UKR","RUS","TWN","KOR","POL"]};
  var LC = {x: "#C8102E", w: "#F59E0B", b: "#0EA5A4", s: "var(--same,#D3D8DE)"}, LCS = {x: "#C8102E", w: "#E8890C", b: "#0D9488", s: "#9AA4AE"};
  var h = function(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); };
  var nm = function(o, a, b){ return EN ? o[b] : o[a]; };
  var AP = ["Jan.","Feb.","March","April","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];
  var fmtD = function(iso){ var p = iso.split("-"); return EN ? T.mon[+p[1] - 1] + " " + (+p[2]) : (+p[1]) + "월 " + (+p[2]) + "일"; };
  var todayIso = function(){ var d = new Date(Date.now() + 9 * 36e5); return d.toISOString().slice(0, 10); };
  function serOf(c){  /* 빌드한 날 뒤로는 판단이 바뀌지 않았으므로 오늘까지 마지막 값을 잇는다 */
    var s = c.ser.slice(), d0 = Date.parse(c.start + "T00:00:00Z"), want = Math.round((Date.parse(todayIso() + "T00:00:00Z") - d0) / 864e5) + 1;
    while (s.length < want && s.length) s.push(s[s.length - 1]); return s; }
  function spark(c){
    var ser = serOf(c), W = 300, H = 96, L = 18, R = W - 30, Tp = 18, B = H - 18, n = ser.length;
    var KS = "xwbs".split("").filter(function(k){ return ser.some(function(o){ return o[k]; }); }).filter(function(k){ return !(k === "s" && ser.every(function(o){ return o.s >= 50; }) && "xwb".split("").some(function(q){ return ser.some(function(o){ return o[q]; }); })); });
    var yMax = Math.max.apply(null, [10].concat(ser.reduce(function(a, o){ return a.concat(KS.map(function(k){ return o[k]; })); }, [])));
    var X = function(i){ return L + (R - L) * (n > 1 ? i / (n - 1) : 0); }, Y = function(v){ return B - (B - Tp) * v / yMax; };
    var d0 = new Date(c.start + "T00:00:00Z"), dt = function(i){ var d = new Date(d0); d.setUTCDate(d.getUTCDate() + i); return EN ? AP[d.getUTCMonth()] + " " + d.getUTCDate() : (d.getUTCMonth() + 1) + "." + d.getUTCDate(); };
    var ch = []; for (var i = 1; i < n; i++) if (KS.some(function(k){ return ser[i][k] !== ser[i - 1][k]; })) ch.push(i);
    var g = '<line x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '" style="stroke:var(--line)"/>';
    g += KS.map(function(k){ return '<path fill="none" stroke="' + LCS[k] + '" stroke-width="2.2" d="' + ser.map(function(o, i){ return (i ? "L" + X(i).toFixed(1) + "," + Y(ser[i - 1][k]).toFixed(1) + "L" : "M") + X(i).toFixed(1) + "," + Y(o[k]).toFixed(1); }).join("") + '"/>'; }).join("");
    var lastLab = -99, labOn = {}; ch.forEach(function(i){ if (X(i) - lastLab >= 26) { labOn[i] = 1; lastLab = X(i); } });
    ch.forEach(function(i){ KS.forEach(function(k){ if (ser[i][k] === ser[i - 1][k] || !labOn[i]) return;
      g += '<rect x="' + (X(i) - 9).toFixed(1) + '" y="' + Tp + '" width="18" height="' + (B - Tp) + '" fill="transparent"><title>' + dt(i) + T.rev + T.LN[k] + " " + ser[i - 1][k] + "→" + ser[i][k] + (EN ? "" : "번") + "</title></rect>";
      g += '<text x="' + (X(i) - 4).toFixed(1) + '" y="' + (Y(ser[i - 1][k]) - 4).toFixed(1) + '" text-anchor="end" font-size="10.5" font-weight="700" fill="' + LCS[k] + '">' + ser[i - 1][k] + "</text>"; }); });
    var last = ser[n - 1]; KS.slice().sort(function(a, b){ return last[b] - last[a]; }).forEach(function(k, j, arr){ var y = Y(last[k]) + 4; arr.slice(0, j).forEach(function(q){ if (Math.abs(Y(last[q]) + 4 - y) < 11) y += 11; });
      g += '<text x="' + (R + 5) + '" y="' + y.toFixed(1) + '" font-size="11" font-weight="800" fill="' + LCS[k] + '">' + last[k] + "</text>"; });
    var ticks = [0].concat(ch.filter(function(i){ return labOn[i]; }), [n - 1]).filter(function(v, i, a){ return a.indexOf(v) === i; }).filter(function(v, i, a){ return i === 0 || i === a.length - 1 || (X(v) - X(a[i - 1]) >= 30 && X(a[a.length - 1]) - X(v) >= 30); });
    g += ticks.map(function(i){ return '<text x="' + X(i).toFixed(1) + '" y="' + (H - 4) + '" font-size="10" style="fill:var(--muted)" text-anchor="' + (i === 0 ? "start" : i === n - 1 ? "end" : "middle") + '">' + (i === n - 1 ? T.today : dt(i)) + "</text>"; }).join("");
    return '<svg class="l2-sp" viewBox="0 0 ' + W + " " + H + '" width="100%" height="' + H + '" role="img" aria-label="' + h(T.tr) + '">' + g + "</svg>"; }
  function alTag(a){ if (!(a && a.length)) return ""; return ' <span class="l2-al">' + (EN ? h(a.join(" and ")) + (a.length > 1 ? " alerts" : " alert") : h(a.join("\u00b7")) + " 경보") + "</span>"; }
  function rowsT(W){ var R = EN ? W.rows_en : W.rows;
    return "<table>" + R.map(function(r, j){ var raw = r.raw ? String(r.raw).replace(/^V-Dem /, T.vdem) : T.nochg; var k = W.rows[j].c;
      return "<tr><td>" + h(T.CN[k]) + "</td><td>" + h(raw) + '</td><td class="sc">' + (r.now != null ? Math.round(r.now) + "→" + Math.round(r.to != null ? r.to : r.now) + T.pt : "") + "</td></tr>"; }).join("") + "</table>"; }
  function det(c){ var L = c.lists, W = c.worst, B = c.best;
    var lst = "xwbs".split("").filter(function(k){ return L[k].length; }).map(function(k){ return '<p><b style="color:' + (k === "s" ? "var(--ink-2)" : LCS[k]) + '">● ' + T.LN[k] + "</b> " +
      L[k].map(function(x){ return h(nm(x, "n", "ne")) + " " + x.p + "%" + alTag(EN ? x.al_en : x.al); }).join(" · ") + "</p>"; }).join("");
    var sm = c.small.length ? '<p class="l2-sm">' + T.small + c.small.map(function(x){ return h(nm(x, "n", "ne")) + "(" + h(x.m.map(function(m){ return T.CN[m[0]] + " " + (EN ? m[2] : m[1]); }).join(", ")) + ")"; }).join(" · ") + T.smallT + "</p>" : "";
    var lab = function(t, X){ return '<div class="l2-lab">' + t + h(nm(X, "n", "ne")) + " (" + (EN ? X.p + T.ch : T.chP + X.p + "%") + ")</div>"; };
    var wr = W ? lab(T.worst, W) + rowsT(W) + ((EN ? W.al_en : W.al).length ? '<p class="l2-sm"><span class="l2-al">' + T.al + h((EN ? W.al_en.map(function(x){ return String(x).toLowerCase(); }).join(", ") : W.al.join("\u00b7"))) + "</span></p>" : "") : '<p class="l2-sm">' + T.none + "</p>";
    var br = B ? '<div class="l2-best">' + lab(T.best, B) + rowsT(B) + "</div>" : "";
    return '<div class="l2-fd"><div class="l2-fdl">' + lst + sm + '</div><div class="l2-fdr">' + wr + br +
      '<button type="button" class="chip l2-more" data-hs="' + h(c.case) + '" data-hsg="' + h(c.k) + '">' + T.more + "</button></div></div>"; }
  function row(c, key){
    var dots = "", seq = []; "xwbs".split("").forEach(function(k){ for (var i = 0; i < c.now[k]; i++) seq.push(k); }); seq.slice(0, 100).forEach(function(k){ dots += '<i style="background:' + LC[k] + '"></i>'; });
    var o = OPEN === key;
    return '<div class="l2-fr' + (o ? " op" : "") + '" data-key="' + key + '" role="button" tabindex="0" aria-expanded="' + o + '"><div class="l2-nm"><b>' + h(nm(c, "t", "te")) + "</b><small>" + h(nm(c, "gn", "gne")) + '</small></div><div class="l2-dt" aria-hidden="true">' + dots + '</div><div class="l2-ct"><div class="l2-cn">' +
      "xwbs".split("").filter(function(k){ return c.now[k]; }).map(function(k){ return '<span style="color:' + (k === "s" ? "var(--ink-2)" : LCS[k]) + '">' + T.LN[k] + " <b>" + c.now[k] + "</b></span>"; }).join(" · ") +
      '</div><div class="l2-tr"><span>' + T.tr + "</span>" + spark(c) + "</div></div></div>" + (o ? det(c) : ""); }
  /* 요약 한 문장(현행 국민의 삶의 요약 문장을 이어받음, 2026-11-01): 당사국 국민은 나쁜 삶이 가장 많은 국민과 가장 적은 국민, 다른 국민은 사안끼리 */
  function jong(w){ var c = String(w).trim().slice(-1), k = c.charCodeAt(0) - 0xAC00; return (k >= 0 && k < 11172) ? k % 28 : -1; }
  var ro = function(w){ var j = jong(w); return (j <= 0 || j === 8) ? "로" : "으로"; }, eun = function(w){ var j = jong(w); return j <= 0 ? "는" : "은"; }, gwa = function(w){ var j = jong(w); return j <= 0 ? "와" : "과"; };
  function listKo(L){ return L.length > 1 ? L.slice(0, -1).map(function(x, i){ return i === L.length - 2 ? x + gwa(x) : x + ","; }).join(" ") + " " + L[L.length - 1] : L[0]; }
  function listEn(L){ return L.length > 2 ? L.slice(0, -1).join(", ") + " and " + L[L.length - 1] : L.join(" and "); }
  function summary(R){
    R = R.filter(Boolean); if (!R.length) return "";
    var party = G === "PARTY", a = R.map(function(c){ return [party ? nm(c, "gn", "gne") : (EN ? String(c.te).replace(/^The /, "the ") : c.t), c.now.x + c.now.w]; });
    var hi = Math.max.apply(null, a.map(function(x){ return x[1]; })), lo = Math.min.apply(null, a.map(function(x){ return x[1]; }));
    var who = function(v){ return a.filter(function(x){ return x[1] === v; }).map(function(x){ return x[0]; }); };
    var b = function(t, cl){ return '<b class="' + cl + '">' + h(t) + "</b>"; }, t;
    if (EN) {  /* 영문 검토 반영(2026-11-01): has·face, 1~9는 글자로 */
      var W9 = ["zero","one","two","three","four","five","six","seven","eight","nine"], num = function(n){ return n >= 0 && n <= 9 ? W9[n] : String(n); };
      var Lh = listEn(who(hi)), Ll = listEn(who(lo)), gn0 = h(nm(R[0], "gn", "gne"));
      if (!hi) t = party ? "No population here faces a future worse than today through 2030." : "For " + gn0 + ", none of the 100 futures through 2030 is worse than today.";
      else if (party) t = hi === lo ? "Every population here has the same number of futures worse than today: " + b(num(hi), "w") + " of 100 through 2030."
        : "Through 2030, " + b(Lh, "s") + " face the most futures worse than today, at " + b(num(hi), "w") + " of 100; " + b(Ll, "s") + (lo ? " face the fewest, at " + b(num(lo), "w") + "." : " face none.");
      else t = "For " + gn0 + ", " + b(Lh, "s") + " " + (who(hi).length > 1 ? "have" : "has") + " the most futures worse than today, at " + b(num(hi), "w") + " of 100 through 2030" +
        (hi === lo ? "." : "; " + b(Ll, "s") + " " + (who(lo).length > 1 ? "have" : "has") + (lo ? " the fewest, at " + b(num(lo), "w") + "." : " none."));
    } else {
      if (!hi) t = (party ? "당사국 국민" : h(nm(R[0], "gn", "gne"))) + "에게는 2030년까지 100번의 미래 가운데 현재보다 나쁜 삶이 없습니다.";
      else if (party) { var H = listKo(who(hi)), Lw = listKo(who(lo));
        t = hi === lo ? "당사국 국민은 모두 2030년까지 100번의 미래 중 " + b(hi + "번", "w") + "이 현재보다 나쁜 삶입니다."
          : "2030년까지 100번의 미래 가운데 현재보다 나쁜 삶이 가장 많은 국민은 " + b(H, "s") + ro(H) + " " + b(hi + "번", "w") + "이고, " + (lo ? "가장 적은 국민은 " + b(Lw, "s") + ro(Lw) + " " + b(lo + "번", "w") + "입니다." : b(Lw, "s") + eun(Lw) + " 나빠지는 경우가 없습니다."); }
      else { var H2 = listKo(who(hi)), L2 = listKo(who(lo));
        t = h(nm(R[0], "gn", "gne")) + "에게 2030년까지 100번의 미래 가운데 현재보다 나쁜 삶이 가장 많은 사안은 " + b(H2, "s") + ro(H2) + " " + b(hi + "번", "w") + (hi === lo ? "입니다." : "이고, " + (lo ? "가장 적은 사안은 " + b(L2, "s") + ro(L2) + " " + b(lo + "번", "w") + "입니다." : b(L2, "s") + "에서는 나빠지는 경우가 없습니다.")); }
    }
    return '<p class="l2-one">' + t + "</p>"; }
  function html(){
    var R = (G === "PARTY" ? LF.party : LF.view[G]) || [], gn = (GROUPS.find(function(x){ return x[0] === G; }) || [])[1] || "";
    var who = G === "PARTY" ? T.party : (R[0] ? nm(R[0], "gn", "gne") : gn);
    return '<div class="sec l2"><div class="l2-who">' + vtHtml() + '<p class="l2-eye">' + T.eye + fmtD(LF.asof) + (T.eyeEnd || "") + "</p><h2>" + T.h + '</h2><p class="l2-sub">' + T.sub + '</p><div class="l2-chips" role="group">' +
      GROUPS.map(function(g){ return '<button type="button" class="l2-chip' + (g[0] === G ? " on" : "") + '" aria-pressed="' + (g[0] === G) + '" data-l2g="' + g[0] + '">' + h(g[1]) + "</button>"; }).join("") +
      '<span class="l2-chip off" aria-disabled="true">' + T.off + "</span></div></div>" +
      summary(R) + '<section class="l2-fut"><h3>' + T.h3 + '</h3><p class="l2-s">' + h(who) + T.s1 + '</p><div class="l2-lg">' + "xwbs".split("").map(function(k){ return '<span><i style="background:' + LC[k] + '"></i>' + T.LN[k] + "</span>"; }).join("") + "</div>" +
      R.filter(Boolean).map(function(c, i){ return row(c, G + i); }).join("") + '<p class="l2-sm l2-foot">' + T.foot + "</p></section></div>"; }
  function mark(){ try { if (window.CLISA.state().tab !== "brief") return; } catch (e) {} marked = true; try { markSet({label: G === "PARTY" ? T.party : ((LF.view[G] || [])[0] ? nm(LF.view[G][0], "gn", "gne") : ""), isos: ISOS[G] || []}); } catch (e) {} }
  function draw(el){ if (!LF) return;
    el.innerHTML = html(); mark();
    el.querySelectorAll("[data-l2g]").forEach(function(b){ b.onclick = function(){ G = b.dataset.l2g; OPEN = null; try { localStorage.setItem("ep.lifeg", G); } catch (e) {} draw(el); }; });
    el.querySelectorAll(".l2-fr").forEach(function(r){ var tg = function(ev){ if (ev.target.closest("a,button")) return; OPEN = OPEN === r.dataset.key ? null : r.dataset.key; draw(el); var n = el.querySelector('.l2-fr[data-key="' + r.dataset.key + '"]'); if (n && n.scrollIntoView) n.scrollIntoView({block: "nearest"}); };
      r.onclick = tg; r.onkeydown = function(ev){ if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); tg(ev); } }; }); }
  /* 개편 ②(2026-11-01): 첫 화면(전망으로 보기)이 붙어 있을 때만 보기 전환 단추를 둔다(front2.css에 모양이 있다) */
  function vtHtml(){ if (!document.querySelector('script[src*="/front2.js"]')) return ""; var P = EN ? "/en" : "";
    return '<nav class="l2-vt" aria-label="' + (EN ? "View" : "보기 방식") + '"><a href="' + P + '/">' + (EN ? "Chain Reactions" : "통합 신경망 보기") + '</a><a href="' + P + '/heatmap/">' + (EN ? "Heat Map" : "시황판으로 보기") + '</a><a href="' + P + '/outlook/">' + (EN ? "By Forecast" : "전망으로 보기") + "</a></nav>"; }  /* 2026-11-06 결재: 첫 화면 단추 줄과 같은 순서. 2026-11-08 대통령님: '국민별로 보기' 뺌(첫 화면과 같게) */
  var marked = false, S = {get bdate(){ try { return window.CLISA.state().bdate; } catch (e) { return null; } }};
  function markSet(m){ try { window.CLISA.markSet(m); } catch (e) {} }
  document.addEventListener("clisa:life", function(ev){ var el = ev.detail; if (!el || S.bdate) return; if (LF) draw(el); else load(); });  /* 지구본 표시는 국민의 삶 탭이 열려 있을 때만(E91) */
  document.addEventListener("clisa:tab", function(ev){ if (ev.detail !== "brief") { if (marked) { marked = false; markSet(null); } return; }
    setTimeout(function(){ var el = document.getElementById("pane-brief"); if (LF && el && el.querySelector(".l2") && !S.bdate) mark(); }, 0); });
  function load(){ fetch("/data/life.json", {credentials: "same-origin"}).then(function(r){ return r.json(); }).then(function(j){ LF = j; var el = document.getElementById("pane-brief"); if (el && el.querySelector(".lbwrap") && !S.bdate) draw(el); }).catch(function(){}); }
  if (/\/life\/?$/.test(location.pathname)) load();  /* 국민의 삶 화면이 아니면 자료를 미리 받지 않는다 */
})();
