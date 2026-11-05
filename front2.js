/* 개편 ② 첫 화면 = 전망으로 보기(2026-11-01, 시안 4c). front1101.py가 붙인다. 화면 앱이 세계 정세 화면을 그리면(clisa:overview) 그 자리에 그린다 */
(function(){
  "use strict";
  var EN = document.documentElement.lang === "en", P = EN ? "/en" : "", FD = null, EL = null;
  var T = EN ? {
    vt: ["By Forecast", "By Population", "By Pathway"], hm: "Heat Map", hmT: "Geopolitical Heat Map", rp: "Chain Reactions", rpT: "Current events and their ripple effects", h: "What could happen, and whose lives would it change—and how?",
    sub: "For each forecast with a resolution date, the cards show which scenario the event would make more or less likely, and how the safety and incomes of people in South Korea, the U.S. and three European regions would change if that scenario came about.",
    nl: "Latest briefings · Select one to see forecasts on that issue",
    ver: "Track record", verGo: "Forecasts and Track Record →",
    verT: function(n, h, m){ var w = function(k){ return k < 10 ? ["no","one","two","three","four","five","six","seven","eight","nine"][k] : String(k); };
      return n === 1 ? "One forecast has resolved so far, and it was " + (h ? "right." : m ? "wrong." : "neither right nor wrong.") : "Of " + w(n) + " resolved forecasts, " + w(h) + (h === 1 ? " was" : " were") + " right" + (m ? " and " + w(m) + " wrong" : "") + "."; },
    verL: function(s, p, st){ return " Latest result: “" + s + "” (forecast: " + p + " percent) resolved " + (st === "yes" ? "yes" : "no") + ". "; },
    brier: function(b){ return " Brier score to date: " + b + " (0 is perfect; forecasting 50 percent every time scores 0.25)."; },
    list: "What could happen",
    tabs: ["Effects on People", "Testing Strategic Choices", "Other Forecasts"],
    flt0: "Sorted by resolution date, soonest first.",
    fltP: "The forecast you selected is at the top; the rest are sorted by resolution date.",
    fltC: function(c){ return "Showing only forecasts on " + c + ". "; }, all: "Show all",
    more: function(n){ return "Show " + n + " more"; },
    etc: "Other issues", due: function(d){ return "Resolves " + d; }, left: function(n){ return n === 1 ? "1 day left" : n + " days left"; }, today: "Resolves today", late: "Result pending",
    upN: function(n,b,c,lo,hi){ return "If this happens, the odds of the “"+n+"” scenario rise from "+b+"% to "+c+"%"; }, dnN: function(n,b,c,lo,hi){ return "If this happens, the odds of the “"+n+"” scenario fall from "+b+"% to "+c+"%"; }, rng: function(n,b,c,lo,hi){ return "judgment estimate: "+lo+"–"+hi+"%"; }, alsoN: function(n,b,c,lo,hi){ return "also: “"+n+"” "+b+"% → "+c+"%"; }, detLab: "Current probability → probability if this happens (judgment estimate)", whyL: "Reasoning",
    ifR: "If this happens,", same: function(n){ return " the “" + n + "” scenario comes about"; }, up: function(n){ return " the “" + n + "” scenario becomes more likely"; },
    dn: function(n){ return " the “" + n + "” scenario becomes less likely"; }, also: " · also: ", away: " (less likely)",
    strat: "The assessment this forecast tests", none: "This forecast falls outside the five issues covered in Strategy and Scenarios, so its effects on people have not been calculated yet.",
    noneC: "This forecast is not yet linked to a scenario in the issue analysis, so its effects on people have not been calculated.",
    pplL: function(n){ return "If the \u201c" + n + "\u201d scenario comes about"; }, pplD: function(n){ return "Losses if the \u201c" + n + "\u201d scenario comes about \u00b7 if this event happens, that scenario becomes less likely"; }, note: function(n){ return " · values for " + n; },
    chance: "Chance", na: "Not calculated", sim: "About the same", balt: " (Baltic states only)",
    GS: {KOR: "South Korea", USA: "United States", NEU: "Nordic and Baltic", SEU: "Southern Europe", WCEU: "Western and Central Europe"},
    CN: {"개인": "Personal safety", "공동체": "Community", "정치": "Politics", "경제": "Economy"},
    hist: function(H, d){ return "Probability " + H + " · resolves " + d; }, scLab: function(c){ return "Scenarios and probabilities: " + c; },
    rel: {same: "same event as this forecast", "+": "more likely if this happens", "-": "less likely if this happens"},
    fcGo: "Forecast details →", caseGo: function(c){ return "Full analysis: " + c + " →"; },
    mk: function(s){ return s + " · populations affected"; },
    ents: "Play and Read", game: "Game", feat: "Feature", g62: "The Cuban Missile Crisis", g14: "The July Crisis",
    snd: ["Turn sound on", "Turn sound off"],
    foot: "Clisa Geopolitics analyses are written with the help of AI (Anthropic’s Claude) and reviewed by editors. The changes shown for each population are not results of the forecast event itself; they are human security estimates for the linked scenario if it comes about. Conflict deaths are shown as the number of people killed per year, scaled to each population’s size. For the sudden-upheaval scenario on the Korean Peninsula, the cards use its most likely branch, a localized clash. For the Russia-NATO standoff, the Nordic and Baltic cell uses figures for the three Baltic states.",
    mon: ["January","February","March","April","May","June","July","August","September","October","November","December"]
  } : {
    vt: ["전망으로 보기", "국민별로 보기", "나비효과 지도로 보기"], hm: "시황판으로 보기", hmT: "지정학 시황판", rp: "나비효과로 보기", rpT: "현재 정세와 나비효과", h: "어떤 일이 일어날 수 있으며, 그 일이 누구의 삶을 어떻게 바꾸는가?",
    sub: "결과 확인 날짜가 정해진 전망마다, 그 일이 발생하면 가능성이 커지거나 줄어드는 전개와, 그 전개가 현실이 될 때 한국·미국과 유럽 3개 지역 국민의 안전과 소득에 생기는 변화를 함께 보여 드립니다.",
    nl: "최근 정세 브리핑 · 누르면 그 사안의 전망만 봅니다",
    ver: "검증", verGo: "전망 검증 →",
    verT: function(n, h, m){ return "결과가 나온 전망 " + n + "개 가운데 적중 " + h + "개" + (m ? ", 빗나감 " + m + "개" : "") + "."; },
    verL: function(s, p){ return " 가장 최근 결과는 " + s + "(점수에 쓰인 확률 " + p + "%)로, "; },
    brier: function(b){ return " 기간 평균 브라이어 점수 " + b + "."; },
    list: "일어날 수 있는 일",
    tabs: ["국민 생활과 연결된 전망", "정책 판단을 검증하는 전망", "그 밖의 전망"],
    flt0: "검증 날짜가 가까운 순서입니다.",
    fltP: "고른 전망을 맨 위로 올렸습니다. 나머지는 검증 날짜가 가까운 순서입니다.",
    fltC: function(c){ return c + " 사안의 전망만 보고 있습니다. "; }, all: "모두 보기",
    more: function(n){ return n + "건 더 보기"; },
    etc: "기타 사안", due: function(d){ return "검증 " + d; }, left: function(n){ return n + "일 남음"; }, today: "오늘 검증", late: "결과 확인 중",
    upN: function(n,b,c,lo,hi){ return "이 일이 발생하면 <b>‘"+n+"’</b> 전개의 가능성이 "+b+"%에서 "+c+"%로 커집니다"; }, dnN: function(n,b,c,lo,hi){ return "이 일이 발생하면 <b>‘"+n+"’</b> 전개의 가능성이 "+b+"%에서 "+c+"%로 줄어듭니다"; }, rng: function(n,b,c,lo,hi){ return "판단값 "+lo+"~"+hi+"%"; }, alsoN: function(n,b,c,lo,hi){ return "그 밖에 ‘"+n+"’ "+b+"% → "+c+"%"; }, detLab: "현재 확률 → 이 일이 발생할 때의 확률(판단값)", whyL: "판단 근거",
    ifR: "이 일이 발생하면", same: function(n){ return "이 일은 <b>‘" + n + "’</b> 전개에 해당합니다"; }, up: function(n){ return " <b>‘" + n + "’</b> 전개의 가능성이 커집니다"; },
    dn: function(n){ return " <b>‘" + n + "’</b> 전개의 가능성이 줄어듭니다"; }, also: " · 그 밖에 ", away: "(가능성 줄어듦)",
    strat: "이 전망으로 검증하는 판단", none: "5개 사안 분석에 포함되지 않은 전망이어서, 국민 생활에 대한 영향은 아직 계산하지 않았습니다.",
    noneC: "사안 분석의 전개 시나리오와 아직 연결하지 않은 전망이어서, 국민 생활에 대한 영향은 계산하지 않았습니다.",
    pplL: function(n){ return "‘" + n + "’ 전개가 현실이 되면"; }, pplD: function(n){ return "‘" + n + "’ 전개가 현실이 되면 생길 손실 · 이 일이 발생하면 그 가능성이 줄어듭니다"; }, note: function(n){ return " · " + n + " 값"; },
    chance: "가능성", na: "계산 없음", sim: "현재와 비슷함", balt: " (발트 3국)",
    GS: {KOR: "한국", USA: "미국", NEU: "북유럽·발트", SEU: "남유럽", WCEU: "서유럽·중유럽"},
    CN: {"개인": "개인 안전", "공동체": "공동체", "정치": "정치", "경제": "경제"},
    hist: function(H, d){ return "확률 " + H + " · 검증 " + d; }, scLab: function(c){ return c + " 사안의 전개와 확률"; },
    rel: {same: "이 전망과 같은 사건", "+": "가능성 커짐", "-": "가능성 줄어듦"},
    fcGo: "전망 자세히 보기 →", caseGo: function(c){ return c + " 사안 분석 전문 보기 →"; },
    mk: function(s){ return s + " · 영향을 받는 국민"; },
    ents: "직접 겪어 보기", game: "게임", feat: "특집", g62: "쿠바 미사일 위기", g14: "1914년 7월 위기",
    snd: ["소리 켜기", "소리 끄기"],
    foot: "클리사 지오폴리틱스의 분석은 AI(Anthropic의 Claude)의 도움을 받아 작성하고 편집진이 검토합니다. 카드의 국민별 변화는 전망된 일 자체의 결과가 아니라, 연결된 전개가 현실이 될 때의 인간 안보 추정치입니다. 분쟁 사망은 각 국민의 인구에 맞춰 한 해 사람 수로 적었습니다. 한반도 급변 전개는 하위 전개 가운데 가장 가능성이 높은 국지 충돌 값을, 러시아-NATO 사안의 북유럽·발트 칸은 발트 3국 값을 씁니다."
  };
  var COL = {same: "#1F4FD8", "+": "#D63A1F", "-": "#0E8A6C", strat: "#7A3FB8", none: "#6B7580"};
  var ISOS = {KOR: ["KOR"], USA: ["USA"], NEU: ["DNK","FIN","ISL","NOR","SWE","EST","LVA","LTU"], BALT: ["EST","LVA","LTU"], SEU: ["ITA","ESP","PRT","GRC"], WCEU: ["DEU","FRA","GBR","POL"]};
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var h = function(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); };
  var todayIso = function(){ return new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10); };
  var days = function(d){ return Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(todayIso() + "T00:00:00Z")) / 864e5); };
  var md = function(d){ return EN ? T.mon[+d.slice(5, 7) - 1] + " " + (+d.slice(8)) : (+d.slice(5, 7)) + "월 " + (+d.slice(8)) + "일"; };
  var ymd = function(d){ return EN ? md(d) + ", " + d.slice(0, 4) : d.slice(0, 4) + "년 " + md(d); };
  var L = function(o, k){ return EN ? (o[k + "e"] != null ? o[k + "e"] : o[k]) : o[k]; };
  /* 소리(기본은 끔. 켜면 전망을 고를 때 짧은 소리가 난다) */
  var AC = null, SND = false; try { SND = localStorage.getItem("ep.snd") === "on"; } catch (e) {}
  function thunk(){} /* 누름 소리는 /hdr.js의 clisaSfx가 모든 단추에서 낸다(2026-11-03). 이 자리는 두 번 울리지 않게 비워 둔다 */
  /* 전망 → 이어진 전개(같은 사건이 먼저, 그다음 신호) */
  var prim = function(f){ return f.links.filter(function(l){ return l.rel === "same"; })[0] || f.links.filter(function(l){ return l.rel === "+"; })[0] || f.links[0]; };
  var scOf = function(f){ var l = f.case && prim(f); return l ? FD.cases[f.case].sc[l.sc] : null; };
  var colOf = function(f){ return f.kind === "none" ? "var(--muted)" : "var(--accent)"; };  /* 2026-11-02 대통령님 결정(가안): 색으로 커짐·줄어듦을 나타내지 않는다(적색·녹색이 좋고 나쁨으로 읽힘) */
  var hitG = function(f){ var S = scOf(f); return S ? FD.groups.filter(function(g){ var I = S.imp[g.k]; return I && I.vals.length; }) : []; };
  var TABS = [["ppl", function(f){ return f.kind === "same" || f.kind === "sig"; }], ["strat", function(f){ return f.kind === "strat"; }], ["none", function(f){ return f.kind === "none"; }]];
  var ALL = [], TAB = "ppl", CF = null, SEL = null, N = 1e9, marked = false;  /* 2026-11-06 결재: 전망을 처음부터 모두 보인다(더 보기 단추 없음) */
  function caseName(f){ return f.case ? L(FD.cases[f.case], "t") : (f.ct ? L(f, "ct") : T.etc); }
  function then(f){
    if (f.kind === "strat") return '<div class="f2-concl"><b>' + T.strat + "</b> · " + h(L(f, "concl")) + "</div>";
    if (f.kind === "none") return '<p class="f2-then f2-z">' + (f.case ? T.noneC : T.none) + "</p>";
    var C = FD.cases[f.case], l = prim(f), S = C.sc[l.sc], n = h(L(S, "n"));
    var ic = l.rel === "+" ? "↑" : l.rel === "-" ? "↓" : "=";
    if (f.cd && l.rel !== "same") {  /* 2026-11-02 결재: 조건부 확률(판단값) */
      var g = f.rg[l.sc] || [f.cd[l.sc], f.cd[l.sc]];
      var v2 = (l.rel === "+" ? T.upN : T.dnN)(n, S.p, f.cd[l.sc]);
      var mo = f.links.filter(function(x){ return x !== l; }).map(function(x){ return T.alsoN(h(L(C.sc[x.sc], "n")), C.sc[x.sc].p, f.cd[x.sc]); });
      return '<p class="f2-then"><span class="f2-ic" aria-hidden="true">' + ic + "</span><span>" + v2 + (EN ? "." : "") + ' <span class="f2-rg">' + h(T.rng(0, 0, 0, g[0], g[1])) + "</span>" + (mo.length ? '<span class="f2-more">' + mo.join(" · ") + "</span>" : "") + "</span></p>";
    }
    var v = l.rel === "same" ? T.same(n) : l.rel === "+" ? T.up(n) : T.dn(n);
    var more = f.links.filter(function(x){ return x !== l; }).map(function(x){ return L(C.sc[x.sc], "n") + (x.rel === "-" ? T.away : ""); });
    return '<p class="f2-then"><span class="f2-ic" aria-hidden="true">' + ic + "</span><span>" + (l.rel === "same" && !EN ? "" : '<span class="ar">' + T.ifR + "</span> ") + v + (more.length ? '<span class="f2-more">' + h(T.also + more.join(", ")) + "</span>" : "") + (EN ? "." : "") + "</span></p>";
  }
  function val(v){
    var r = EN ? String(v.rawe).replace(/(^|[\s(])-(?=\d)/g, "$1−") : String(v.raw).replace(/(^|[\s(])-(?=\d)/g, "$1−");
    return v.c === "정치" ? h(T.CN[v.c]) + (EN ? ": " : " ") + h(r) : h(r);
  }
  function ppl(f){
    var S = scOf(f); if (!S) return "";
    var l = prim(f), C = FD.cases[f.case], ch = [], same = [], na = [];
    FD.groups.forEach(function(g){
      var I = S.imp[g.k], nm = T.GS[g.k] + (I && I.gk !== g.k ? T.balt : "");
      if (!I || I.na) { na.push(nm); return; }
      if (!I.vals.length) { same.push(nm); return; }
      var m = Math.min.apply(null, I.vals.map(function(v){ return v.d == null ? 0 : v.d; }));
      var t = I.vals.map(val).join(" · "), cl = l.rel === "-" ? "" : m <= -20 ? "hit2" : m > 0 ? "good" : m <= -0.1 ? "hit" : "";
      var ex = ch.filter(function(x){ return x.t === t; })[0];  /* 같은 변화는 한 줄로 묶는다(예: 유럽 3개 지역 소득 −0.3%) */
      if (ex) ex.n.push(nm); else ch.push({n: [nm], t: t, cl: cl});
    });
    ch = ch.map(function(x){ return '<li class="' + x.cl + '"><b>' + h(x.n.join(" · ")) + "</b><span>" + x.t + "</span></li>"; });
    if (same.length) ch.push('<li class="z"><b>' + h(same.join(" · ")) + "</b><span>" + T.sim + "</span></li>");
    if (na.length) ch.push('<li class="z"><b>' + h(na.join(" · ")) + "</b><span>" + T.na + "</span></li>");
    return '<div class="f2-imp' + (l.rel === "-" ? " avoid" : "") + '"><p class="f2-ml">' + h((l.rel === "-" ? T.pplD : T.pplL)(L(S, "n"))) + (S.note ? h(T.note(L(S, "note"))) : "") + "</p><ul>" + ch.join("") + "</ul>" +
      (/기준/.test(C.split) ? '<p class="f2-split">' + h(L(C, "split")) + "</p>" : "") + "</div>";
  }
  function det(f){
    var C = f.case ? FD.cases[f.case] : null, lk = {};
    f.links.forEach(function(l){ lk[l.sc] = l.rel; });
    var H = f.h.length ? f.h.map(function(x){ return x[1] + "%"; }).join(" → ") : f.p + "%";
    var o = '<div class="f2-det"><p class="f2-q">' + h(L(f, "q")) + '</p><p class="f2-hist">' + h(T.hist(H, ymd(f.due))) + "</p>";
    if (C) o += '<p class="f2-lab">' + h(T.scLab(L(C, "t"))) + '</p><div class="f2-bar">' + C.order.map(function(id){ var s = C.sc[id]; return '<div class="' + (lk[id] ? "on" : "") + '" style="flex:' + Math.max(s.p, 1) + '">' + (s.p >= 6 ? s.p + "%" : "") + "</div>"; }).join("") +
      '</div>' + (f.cd ? '<p class="f2-lab f2-sub">' + h(T.detLab) + "</p>" : "") + '<ul class="f2-scl">' + C.order.map(function(id){ var s = C.sc[id], r = lk[id]; return '<li class="' + (r ? "on" : "") + '">' + h(L(s, "n")) + " " + s.p + "%" + (f.cd ? " → " + f.cd[id] + "%" : "") + (r ? " · " + T.rel[r] : "") + "</li>"; }).join("") + "</ul>" +
      (f.cd ? '<p class="f2-why"><b>' + h(T.whyL) + "</b> · " + h(L(f, "why")) + "</p>" : "");
    o += '<p class="f2-go"><a href="' + P + "/forecast/" + h(f.id) + '/">' + T.fcGo + "</a>" + (C ? '<a href="' + P + "/case/" + h(f.case) + '/">' + h(T.caseGo(L(C, "t"))) + "</a>" : "") + "</p></div>";
    return o;
  }
  function card(f){
    var n = days(f.due), on = f === SEL;
    return '<article class="f2-ev' + (on ? " on" : "") + '" style="--c:' + colOf(f) + '" data-f2="' + h(f.id) + '" tabindex="0" role="button" aria-expanded="' + on + '">' +
      '<p class="f2-meta"><b>' + h(caseName(f)) + "</b> · " + h(T.due(ymd(f.due))) + " · " + (n > 0 ? T.left(n) : n === 0 ? T.today : T.late) + "</p>" +
      '<div class="f2-eh"><h4>' + h(L(f, "s")) + '</h4><span class="f2-pp"><small>' + T.chance + "</small>" + f.p + "%</span></div>" + then(f) + ppl(f) + (on ? det(f) : "") + "</article>";
  }
  function list(){ var t = TABS.filter(function(x){ return x[0] === TAB; })[0]; var R = ALL.filter(t[1]).filter(function(f){ return !CF || f.case === CF; });
    if (SEL && R.indexOf(SEL) >= 0) R = [SEL].concat(R.filter(function(f){ return f !== SEL; })); return R; }
  function verHtml(){
    var A = null, R; try { A = window.CLISA; R = A.data().forecasts.filter(function(f){ return f.status === "yes" || f.status === "no"; }); } catch (e) { return ""; }
    if (!R.length || !A.fcRes) return "";
    var X = R.map(function(f){ return [f, A.fcRes(f)]; }), hit = X.filter(function(x){ return x[1].r === "hit"; }).length, miss = X.filter(function(x){ return x[1].r === "miss"; }).length;
    var B = X.map(function(x){ return x[1].b; }).filter(function(b){ return b != null; }), b = B.length ? (B.reduce(function(a, c){ return a + c; }, 0) / B.length).toFixed(2) : null;
    var last = X.slice().sort(function(a, c){ return String(c[0].resolved || c[0].due).localeCompare(String(a[0].resolved || a[0].due)); })[0];
    var oc = String(last[0].outcome || ""), om = /^.*?[.\u3002](?=\s|$)/.exec(oc); if (om) oc = om[0];
    return '<a class="f2-ver" href="' + P + '/forecast/"><span class="f2-vn">' + hit + "<small>/" + R.length + '</small></span><span class="f2-vx"><b>' + T.ver + "</b> · " + h(T.verT(R.length, hit, miss)) +
      h(T.verL(last[0].s || last[0].q, last[1].pz, last[0].status)) + h(oc) + (b ? h(T.brier(b)) : "") + '</span><span class="f2-vg">' + T.verGo + "</span></a>";
  }
  function entsHtml(){
    var E = [[T.game + " · 1962", T.g62, P + "/play/1962/"], [T.game + " · 1914", T.g14, P + "/play/1914/"]].concat(FD.feats.map(function(x){ return [T.feat + " · " + md(x.d), L(x, "t"), P + "/feature/" + x.id + "/"]; }));
    return '<section class="sec f2-ents"><h3>' + T.ents + "</h3>" + E.map(function(e){ return '<a href="' + h(e[2]) + '"><span>' + h(e[0]) + "</span>" + h(e[1]) + "</a>"; }).join("") + "</section>";
  }
  /* 2026-11-03 대통령님 승인: 첫 화면(/, /heatmap/)은 시황판으로 보기, 전망으로 보기는 /outlook/ */
  function VIEW(){ var p = location.pathname.replace(/^\/en(?=\/)/, ""); return /^\/outlook\/?$/.test(p) ? "fc" : /^\/heatmap\/?$/.test(p) ? "hm" : "rp"; }  /* 2026-11-06 대통령님 결재: 첫 화면(/, /ripple/) = 나비효과로 보기, /heatmap/ = 시황판, /outlook/ = 전망 */
  function vtNav(on){ return '<nav class="f2-vt" aria-label="' + (EN ? "View" : "보기 방식") + '"><a' + (on === "rp" ? ' class="on" aria-current="page"' : "") + ' href="' + P + '/" data-f2v="rp">' + T.rp +
      '</a><a' + (on === "hm" ? ' class="on" aria-current="page"' : "") + ' href="' + P + '/heatmap/" data-f2v="hm">' + T.hm +
      '</a><a' + (on === "fc" ? ' class="on" aria-current="page"' : "") + ' href="' + P + '/outlook/" data-f2v="fc">' + T.vt[0] + '</a><a href="' + P + '/life/">' + T.vt[1] + "</a></nav>"; }  /* 2026-11-06 결재: 나비효과 지도로 보기는 단추 줄에서 빼고 메뉴 탭으로 */
  function hmSize(){ var f = document.getElementById("hm2f"); if (!f || !f.offsetHeight) return; var r = f.getBoundingClientRect(), z = r.height / f.offsetHeight || 1, pn = document.getElementById("panel");
    var want = HMH || (innerWidth < 700 ? 600 : Math.max(480, (pn ? pn.getBoundingClientRect().bottom : innerHeight) - r.top - 2)); f.style.height = (HMH ? HMH : want / z) + "px"; }  /* v4.79f: 시황판이 알려 준 높이(판 1.6:1)를 씀 */
  var HMH = 0; addEventListener("message", function(e){ if (e.data && e.data.hmH && e.origin === location.origin) { HMH = e.data.hmH; hmSize(); } });
  var RPH = 0; function rpSize(){ var f = document.getElementById("rp2f"); if (!f) return; f.style.height = (RPH || 900) + "px"; }
  addEventListener("message", function(e){ if (e.data && e.data.rpH && e.origin === location.origin) { RPH = e.data.rpH; rpSize(); } });
  function drawRipple(el){ EL = el; if (/^\/(ripple\/)?$/.test(location.pathname.replace(/^\/en(?=\/)/, ""))) document.documentElement.classList.add("hm-on"); var ft = el.querySelector(":scope > .site-foot");
    el.innerHTML = '<div class="f2 hm2">' + vtNav("rp") + '<iframe id="rp2f" class="hm2-f rp2-f" src="' + P + '/lab/ripple/?embed=1" title="' + T.rpT + '" loading="eager"></iframe></div>';
    if (ft) el.appendChild(ft); rpSize(); }
  function drawHeat(el){
    EL = el; if (/^\/heatmap\/?$/.test(location.pathname.replace(/^\/en(?=\/)/, ""))) document.documentElement.classList.add("hm-on");  /* 다른 쪽(/life/·/links/ 등)에서 뒤에 그려 둘 때는 지구본을 그대로 둔다 */
    var ft = el.querySelector(":scope > .site-foot");
    el.innerHTML = '<div class="f2 hm2">' + vtNav("hm") + '<iframe id="hm2f" class="hm2-f" src="' + P + '/lab/heatmap/?embed=1" title="' + T.hmT + '" loading="eager"></iframe></div>';
    if (ft) el.appendChild(ft);
    requestAnimationFrame(hmSize); setTimeout(hmSize, 300);
  }
  addEventListener("resize", function(){ clearTimeout(window._hm2r); window._hm2r = setTimeout(hmSize, 120); });
  function draw(el){
    if (VIEW() === "hm") { drawHeat(el); return; }
    if (VIEW() === "rp") { drawRipple(el); return; }
    document.documentElement.classList.remove("hm-on");
    EL = el;
    ALL = FD.fcs.slice().sort(function(a, b){ return a.due.localeCompare(b.due) || b.p - a.p; });
    var ft = el.querySelector(":scope > .site-foot");  /* 화면 앱이 붙인 바닥글은 그대로 둔다 */
    el.innerHTML = '<div class="f2"><section class="f2-who">' + vtNav("fc") +
      "<h2>" + h(T.h) + '</h2><p class="f2-sub">' + h(T.sub) + '</p><p class="f2-nl">' + h(T.nl) + '</p><div class="f2-news" id="f2news"></div></section>' + verHtml() +
      '<section class="sec f2-list"><div class="f2-lh"><h3>' + T.list + '</h3><button type="button" class="f2-snd" id="f2snd" aria-pressed="' + SND + '">' + T.snd[SND ? 1 : 0] + '</button></div><div class="f2-tabs" id="f2tabs" role="tablist"></div><p class="f2-flt" id="f2flt"></p><div id="f2list"></div></section>' +
      entsHtml() + '<p class="note">' + h(T.foot) + "</p></div>";
    if (ft) el.appendChild(ft);
    news(); rows(false);
  }
  function news(){ var w = EL.querySelector("#f2news"); if (!w) return;
    w.innerHTML = FD.news.map(function(n){ return '<button type="button" class="f2-nw' + (CF === n.case ? " on" : "") + '" data-f2c="' + h(n.case) + '"><small>' + h(md(n.d)) + " · " + h(L(FD.cases[n.case], "t")) + "</small>" + h(L(n, "h")) + "</button>"; }).join(""); }
  function rows(animate){
    var before = {}; if (animate && !RM) EL.querySelectorAll(".f2-ev").forEach(function(e){ before[e.dataset.f2] = e.getBoundingClientRect().top; });
    EL.querySelector("#f2tabs").innerHTML = TABS.map(function(t, i){ return '<button type="button" role="tab" aria-selected="' + (t[0] === TAB) + '" class="' + (t[0] === TAB ? "on" : "") + '" data-f2t="' + t[0] + '">' + T.tabs[i] + " <span>" + ALL.filter(t[1]).length + "</span></button>"; }).join("");
    EL.querySelector("#f2flt").innerHTML = CF ? h(T.fltC(L(FD.cases[CF], "t"))) + '<button type="button" data-f2clr="1">' + T.all + "</button>" : SEL ? T.fltP : T.flt0;
    var R = list(), k = Math.max(N, SEL ? 1 : 0);
    EL.querySelector("#f2list").innerHTML = R.slice(0, k).map(card).join("") + (R.length > k ? '<button type="button" class="f2-more" data-f2m="1">' + T.more(R.length - k) + "</button>" : "");
    if (animate && !RM) EL.querySelectorAll(".f2-ev").forEach(function(e){ var b = before[e.dataset.f2], a = e.getBoundingClientRect().top;
      if (b === undefined) { e.animate([{opacity: 0, transform: "translateY(10px)"}, {opacity: 1, transform: "none"}], {duration: 300}); return; }
      if (Math.abs(b - a) > 1) e.animate([{transform: "translateY(" + (b - a) + "px)"}, {transform: "none"}], {duration: 480, easing: "cubic-bezier(.2,.8,.2,1)"}); });
    if (animate && !RM && SEL) { var d = EL.querySelector(".f2-ev.on .f2-det"); if (d) { d.animate([{opacity: 0, transform: "translateY(-4px)"}, {opacity: 1, transform: "none"}], {duration: 320, easing: "ease-out"});
      d.querySelectorAll(".f2-bar div").forEach(function(x, j){ x.animate([{transform: "scaleX(0)"}, {transform: "scaleX(1)"}], {duration: 460, delay: 120 + j * 50, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards"}); }); } }
  }
  function focus(f){
    var A = window.CLISA; if (!A || !A.focus) return;
    if (!f) { if (marked) { marked = false; try { A.focus(null); } catch (e) {} } return; }
    var HG = hitG(f), C = f.case ? FD.cases[f.case] : null;
    try {
      if (HG.length && C && C.ll) {
        var I = []; HG.forEach(function(g){ var gk = scOf(f).imp[g.k].gk; (ISOS[gk] || ISOS[g.k]).forEach(function(x){ if (I.indexOf(x) < 0) I.push(x); }); });
        A.focus({c: C.ll, k: 1.1, isos: I, label: T.mk(L(f, "s")), lon: C.ll[0], lat: C.ll[1], place: caseName(f)});  /* 사건이 일어나는 곳을 가운데에 두고, 영향이 가는 국민의 나라를 칠한다 */
      } else A.focus({isos: f.isos, label: L(f, "s")});
      marked = true;
    } catch (e) {}
  }
  function choose(f){
    if (!f) return;
    if (SEL === f) { SEL = null; rows(true); focus(null); return; }
    SEL = f; thunk(); rows(true); focus(f);
    var c = EL.querySelector(".f2-list"); if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({block: "start", behavior: RM ? "auto" : "smooth"});
  }
  document.addEventListener("click", function(ev){
    if (!EL || !EL.contains(ev.target)) return;
    var t;
    if ((t = ev.target.closest("[data-f2t]"))) { TAB = t.dataset.f2t; CF = null; SEL = null; N = 1e9; rows(true); focus(null); return; }
    if ((t = ev.target.closest("[data-f2c]"))) { var c = t.dataset.f2c; TAB = "ppl"; N = 1e9;
      if (CF === c) { CF = null; SEL = null; news(); rows(true); focus(null); return; }
      CF = c; SEL = null; news(); choose(list()[0]); return; }
    if (ev.target.closest("[data-f2clr]")) { CF = null; SEL = null; news(); rows(true); focus(null); return; }
    if (ev.target.closest("[data-f2m]")) { N += 30; rows(false); return; }
    if ((t = ev.target.closest("#f2snd"))) { var cur = false; try { cur = localStorage.getItem("ep.snd") === "on"; } catch (e) {} SND = !cur; try { localStorage.setItem("ep.snd", SND ? "on" : "off"); } catch (e) {} t.textContent = T.snd[SND ? 1 : 0]; t.setAttribute("aria-pressed", SND); document.dispatchEvent(new CustomEvent("clisa:snd", {detail: SND})); return; }
    if (ev.target.closest("a")) return;
    if ((t = ev.target.closest("[data-f2]"))) { var id = t.dataset.f2; choose(ALL.filter(function(f){ return f.id === id; })[0]); }
  });
  document.addEventListener("keydown", function(ev){ if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches(".f2-ev")) { ev.preventDefault(); ev.target.click(); } });
  document.addEventListener("clisa:snd", function(ev){ SND = !!ev.detail; var b = document.getElementById("f2snd"); if (b) { b.textContent = T.snd[SND ? 1 : 0]; b.setAttribute("aria-pressed", SND); } }); /* 머리글 소리 단추와 맞춤(2026-11-03) */
  var loading = false;
  function go(el){ if (!el) return; if (VIEW() === "hm") { drawHeat(document.getElementById("pane-overview") || el); return; } if (VIEW() === "rp") { drawRipple(document.getElementById("pane-overview") || el); return; } if (FD) { draw(el); if (SEL) focus(SEL); return; } if (loading) return; loading = true;
    fetch(P + "/data/front.json", {cache: "no-cache"}).then(function(r){ return r.json(); }).then(function(d){ FD = d; draw(document.getElementById("pane-overview") || el); fresh(); }).catch(function(){ loading = false; }); }
  // E111(2026-11-03 결재): 최근 정세 브리핑 카드는 빌드 때의 front.json이 아니라 매일 바뀌는 daily.json의 최근 3개 호에서 읽는다. 읽지 못하면 front.json 값을 그대로 둔다.
  function fresh(){ fetch(P + "/data/daily.json", {cache: "no-cache"}).then(function(r){ return r.json(); }).then(function(D){ var out = [];
      (D.issues || []).slice(0, 3).forEach(function(x){ (x.items || []).forEach(function(it){ if (it.case && FD.cases[it.case]) out.push({d: x.date, h: it.h, he: it.h, "case": it.case}); }); });
      if (out.length) { FD.news = out.slice(0, 6); if (EL) news(); } }).catch(function(){}); }
  document.addEventListener("clisa:overview", function(ev){ go(ev.detail); });
  document.addEventListener("clisa:tab", function(ev){ if (ev.detail !== "overview") { document.documentElement.classList.remove("hm-on"); focus(null); } else { if ((VIEW() === "hm" && document.getElementById("hm2f")) || (VIEW() === "rp" && document.getElementById("rp2f"))) document.documentElement.classList.add("hm-on"); if (SEL && FD) focus(SEL); } });
  /* 시황판 ↔ 전망으로 보기: 같은 화면 안에서 바꾸고 주소만 바꾼다(뒤로 가기 지원) */
  document.addEventListener("click", function(ev){ var a = ev.target.closest && ev.target.closest("a[data-f2v]"); if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); ev.stopPropagation();
    if (a.getAttribute("href") !== location.pathname) history.pushState(null, "", a.getAttribute("href")); var po = document.getElementById("pane-overview"); if (po) go(po); }, true);
  addEventListener("popstate", function(){ var p = location.pathname.replace(/^\/en(?=\/)/, ""); if (/^\/(outlook\/?)?$|^\/(heatmap|ripple)\/?$/.test(p)) { var po = document.getElementById("pane-overview"); if (po && po.offsetParent !== null) go(po); } });
  var po = document.getElementById("pane-overview"); if (po && po.children.length && !po.querySelector(".f2")) go(po);
})();
