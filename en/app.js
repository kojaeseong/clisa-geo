
(function(){
"use strict";

/* ---------- English edition helpers (en/patch_app.py) ---------- */
const EN_P = "/en";
/* route paths are handled without the /en prefix; enAdd puts it back on everything written to the address bar or to an href */
const enStrip = p => { p = String(p == null ? "/" : p); return p === EN_P ? "/" : p.indexOf(EN_P + "/") === 0 ? p.slice(EN_P.length) : p; };
const enAdd = p => (typeof p === "string" && p.charAt(0) === "/" && p.charAt(1) !== "/" && !/^\/(en|data)(\/|$|#|\?)/.test(p)) ? EN_P + p : p;
const LOC = () => enStrip(location.pathname);
const EN_MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
/* "2026-10-06" → "October 6, 2026" (noYear: "October 6"); "2026-10" → "October 2026"; anything else unchanged */
const enDate = (s, noYear) => { const t = String(s == null ? "" : s).trim(), m = /^(\d{4})-(\d{2})(?:-(\d{2}))?(.*)$/.exec(t); if (!m || !EN_MON[+m[2] - 1]) return t;
  const M = EN_MON[+m[2] - 1]; return (m[3] ? M + " " + (+m[3]) + (noYear ? "" : ", " + m[1]) : M + " " + m[1]) + m[4]; };
const pl = (n, one, many) => n + " " + (n === 1 ? one : (many || one + "s"));
/* enum values stay Korean in the data (code compares them); this is the display text */
const EN_ENUM = {"일치":"Consistent","부분 일치":"Largely consistent","부분 불일치":"Partly inconsistent","불일치":"Inconsistent",
  "부합":"Fits","조건부":"Conditional","상충":"Conflicts","반박":"Refutes","지지":"Supports","보정":"Qualifies",
  "높음":"High","중간":"Medium","낮음":"Low","매우 높음":"Very high","매우 낮음":"Very low","가치 판단":"Value judgment",
  "선호":"Preferred","수용":"Acceptable","불편":"Uncomfortable","거부":"Rejected","구조 우위":"Structure prevails","혼재":"Mixed",
  "통과":"Passed","일부":"Partial","없음":"None","산출":"Output","점검":"Check","집권":"In office","야당·후보":"Opposition or candidate","민간":"Private citizen","기타":"Other"};
const ev = x => { const s = String(x == null ? "" : x).trim(); if (EN_ENUM[s]) return EN_ENUM[s]; const m = /^(\S+)(\s.*)$/s.exec(s); return m && EN_ENUM[m[1]] ? EN_ENUM[m[1]] + m[2] : x; };
/* English sentence boundary: ., ? or ! (optionally closing quote) + space + capital/digit; not after common abbreviations (U.S., e.g., Mr. …) */
const EN_SENT = /(?<!\b(?:e\.g|i\.e|vs|etc|approx|Mr|Mrs|Ms|Dr|St|No|Jr|Sr|Gen|Lt|Col|Sgt|Rep|Sen|Gov|Prof|Jan|Feb|Aug|Sept|Oct|Nov|Dec|U\.S|U\.K|U\.N|E\.U|a\.m|p\.m)\.)(?<=[.?!]["”’)]?)\s+(?=["“‘(]?[A-Z0-9])/;
const enHead = t => { const a = String(t).split(EN_SENT); return a.length > 1 ? [String(t), a[0], a.slice(1).join(" ")] : null; };
const enShort = s => String(s || "").replace(/\s*\([^()]*\)\s*$/, "");  /* "China (Taiwan Strait)" → "China" */
/* the header language switch (#langsw, in the shell) always points at the Korean page for the current address */
(function(){ const upd = () => { const a = document.getElementById("langsw"); if (a) a.setAttribute("href", LOC() + location.search + location.hash); };
  ["pushState", "replaceState"].forEach(k => { const o = history[k]; history[k] = function(){ const r = o.apply(this, arguments); upd(); return r; }; });
  addEventListener("popstate", upd); addEventListener("hashchange", upd); upd(); })();
const $ = s => document.querySelector(s);
/* v3.37(2026-10-01): 칩에는 번호를 보이지 않고 짧은 이름만 보인다(이름이 없는 전망만 번호). 번호는 설명 창과 전망과 검증에 남는다 */
const fcLab = (F, id, p) => (F && F.s ? '<span class="fcs">' + esc(F.s) + '</span>' : '<span class="fcn">' + esc(id) + '</span>') + (p != null ? ' ' + p + '%' : '');
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => matchMedia("(max-width: 960px)").matches;
const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };
{ const v = store.get("ep.legoff"); if (v === "1" || (v !== "0" && matchMedia("(min-width: 961px)").matches)) document.documentElement.classList.add("legoff"); }  /* v4.38c(2026-10-27): 처음 오는 데스크톱 방문자는 범례를 접은 채로(지구본을 가리지 않게), 펼치거나 접은 뒤에는 그 선택대로 */

const LAYERS = {
  focus:{label:"Analytical focus", desc:"Darker shading means more strategic analyses and forecasts involving the country."},
  mil:{label:"Military power", desc:"Military expenditure in 2025, SIPRI (log scale). The figures under names are active personnel and nuclear warheads."}
};
/* v4.36(2026-10-27 결재) 판단 점수를 내리고 군사력 색은 측정값(SIPRI 군사비)으로: 5억~1조 달러를 0~100에 로그로 놓는다 */
function milV(c){ const x = c && c.mil && c.mil.spend_usd_bn; if (!x) return null; return Math.max(0, Math.min(100, (Math.log10(x) - Math.log10(0.5)) / (3 - Math.log10(0.5)) * 100)); }
const JLAYERS = ["risk", "mil", "pol", "econ"];
const TAB_ALIAS = {philo:"method", shelf:"ideas", history:"ideas", exit:"strat"};
let FOCUS = {}, FCN = {};
const LENS_NAME = {mackinder:"Mackinder’s Heartland", spykman:"Spykman’s Rimland", mao:"Mao’s protracted war", kissinger:"Kissinger’s triangular diplomacy", lky:"Lee Kuan Yew’s balance of power", brzezinski:"Brzezinski’s anti-hegemonic coalition", allison:"Allison’s Thucydides Trap", huntington:"Huntington’s civilizational fault lines", mearsheimer:"Mearsheimer’s offensive realism"};
const LABEL_AT = {USA:[-98,39], CAN:[-100,58], FRA:[2.5,46.6], NOR:[9,61.5], ESP:[-3.7,40.3], NLD:[5.5,52.2], DNK:[9.3,56], CHL:[-71,-33], RUS:[98,62], AUS:[134,-25], CHN:[103,34], IND:[79,22], KAZ:[67,48], MNG:[103,46.5], IRN:[54,32.5], SAU:[45,24], TUR:[35,39], PAK:[69,29.5], IDN:[114,-1.5], PHL:[122.5,12], VNM:[106.3,15.5], TWN:[121,23.7], JPN:[138.5,36.8], KOR:[127.9,36.3], PRK:[126.8,40.3], UKR:[31.5,49], BLR:[28,53.5], ISR:[34.9,31.2]};
const HOME = [-95, -28, 0], HOME_K = 1;
const REGIONS = ["East Asia","Southeast Asia","South Asia","Central and Inner Asia","Russia and Eastern Europe","Caucasus and Anatolia","Middle East and North Africa","Europe","North America","Latin America","Africa","Oceania"];

const S = { layer: "focus", prevTab: "overview", showFp:true, showEdge:true, showUsf:false, sel:null, selFp:null, lens:null, hover:null, hoverFp:null, rot:HOME.slice(), k:HOME_K, tab:"overview", scase: null };
if (!LAYERS[S.layer]) S.layer = "focus";
let D = null, features = [], byIso = {}, borders = null, C = {}, labelPos = {};
const grat = d3.geoGraticule10();
const wrap = $("#wrap"), base = $("#base"), over = $("#over");
const bctx = base.getContext("2d"), octx = over.getContext("2d");
const projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
const pathB = d3.geoPath(projection, bctx), pathO = d3.geoPath(projection, octx);
let W = 0, H = 0, R0 = 1, dpr = 1, dragging = false;

/* ---------- colours ---------- */
function readColors(){
  const cs = getComputedStyle(document.documentElement);
  const g = n => cs.getPropertyValue("--" + n).trim();
  C = { ocean:g("ocean"), ocean2:g("ocean-2"), grat:g("grat"), landOut:g("land-out"), border:g("border"), ink:g("ink"), muted:g("muted"),
        line:g("line"), accent:g("accent"), coop:g("coop"), conflict:g("conflict"), halo:g("halo"), panel2:g("panel-2") };
  for (const k of Object.keys(LAYERS)) C[k] = (k === "focus" ? d3.interpolateHcl : d3.interpolateLab)(g(k + "-0"), g(k + "-1"));  /* v3.51 농도 색은 색상을 고정한 채(HCL) 섞어 연보라 기를 없앤다 */
}
const ramp = (layer, v) => C[layer](Math.max(0, Math.min(100, v)) / 100);

/* ---------- formatting ---------- */
function fmtUsdBn(bn){
  if (bn == null) return "—";
  const r1 = v => (Math.round(v * 10) / 10).toLocaleString("en-US");
  if (bn >= 1000) return "$" + r1(bn / 1000) + " trillion";
  if (bn >= 1) return "$" + (bn >= 100 ? Math.round(bn).toLocaleString("en-US") : r1(bn)) + " billion";
  return "$" + Math.max(1, Math.round(bn * 1000)).toLocaleString("en-US") + " million";
}
const fmtPeople = n => n == null ? "—" : Number(n).toLocaleString("en-US");
const fmtPct = v => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(1) + "%";
const fmtDeg = (v, pos, neg) => Math.abs(v).toFixed(1) + "°" + (v >= 0 ? pos : neg);
const pips = n => "<span class=\"pips\" aria-label=\"Severity " + n + '/5">' + [1,2,3,4,5].map(i => '<i class="' + (i <= n ? "on" : "") + '"></i>').join("") + "</span>";
const shortLeader = s => String(s || "").split(" (")[0].split(", ")[0];
const chip = iso => { const c = D.countries[iso]; return c ? '<button type="button" class="chip' + (c.tier === 1 ? " t1" : "") + '" data-iso="' + iso + '">' + esc(c.name_ko) + "</button>" : ""; };
function srcItem(s){
  const url = String(s).split(" ")[0], note = String(s).slice(url.length).trim();
  let host = url; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch(e){}
  return '<li><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(host) + "</a>" + (note ? " " + esc(note) : "") + "</li>";
}

/* ---------- v3.13 사이트 검색 ---------- */
const SR = {idx:null, act:-1, items:[], more:{}};
const SR_ALIAS = [["Taiwan","Taiwanese","taiwan"],["North Korea","DPRK","dprk"],["South Korea","ROK","Republic of Korea"],["U.S.","US"],["Hormuz","hormuz"],["Ukraine","Ukrainian"],["European Union","eu"],["NATO","nato"],["hbm","high-bandwidth memory"],["rare earths","rare earth"],["China-Japan","Sino-Japanese"],["U.S.-China","US-China"],["Russia-Ukraine","Russo-Ukrainian","Ukraine war"],["ceasefire","armistice","end of the war","ceasefire","peace talks"],
  /* v3.52 검색 보강(2026-10-05): 독자가 쓰는 말과 사이트의 말을 잇는다 */
  ["unification","reunification","inter-Korean"],["happiness","well-being index","happiness index","quality of life","well-being"],["population","demographics","low birth rate","fertility rate","births","aging","working-age","workforce"],
  ["jobs","employment","employment rate","hiring","youth employment"],["elderly","old-age poverty","retirement","seniors","pensions"],["education","schools","universities"],
  ["war","all-out war","armed conflict","clashes","escalation","world war","World War III"],["stocks","stock market","share prices","KOSPI"],["interest rates","policy rate"],
  ["OPCON","wartime operational control"],["North Korean nukes","North Korean nuclear program","Pyongyang nuclear"],["U.S.-China","US-China","Sino-American","U.S.-China tensions","U.S.-China rivalry"],
  ["korea","southkorea"],["northkorea","dprk"],["china","China"],["japan","Japan"],["russia","Russia"],["iran","Iran"],["ukraine","Ukraine"],["usa","america","U.S."],
  ["semiconductors","semiconductor","chip","chips"],["briefing","briefings","news","latest briefing"],["subscribe","new post alerts","rss","alerts"],["A Note from the Founder","founder note","founder","contact","contact details"]  /* 공개판 변환이 따옴표 안의 낱말 '운영…자'를 지우므로 '운영자 인사말' 꼴로만 쓴다 */,
  /* v3.52b 결정권자 쪽 본문 검색과 함께(2026-10-05) */
  ["dictatorship","dictator","personalist rule","authoritarianism","concentration of power","long-term rule","one-man rule","strongman"],["election","presidential election","general election","election delay","postponed election"],["succession","successor","succession plan","heir"]];
const srNorm = t => String(t).toLowerCase().replace(/\s+/g, "");
const SR_SOFT = new Set(["chance","chances","probability","likelihood","likely","odds","forecast","forecasts","prediction","whether","about","on","regarding","when","how","will","would","is","could","can","does","do","problem","conflict","situation","issue","status","happen","happens","are","occur","should","what","which","why","really","lately","recent","future","the","a","an","of","in","to","for","and"].map(srNorm));
/* 낱말 끝의 조사와 '문제·갈등' 같은 꼬리말을 떼어 본 형태도 함께 찾는다 */
const SR_TAIL = ["’s", "\'s"];  /* English: possessive endings only */
const SR_SKIP = new Set(["sources","src","url","num","iso","id","fp","lat","lon","ids","countries","scores","phase","fc","steps","lens","lens_fp","lens_off","log","discuss","review","status","made","revised","due","date","asof","rng","rng_rec","inputs","score","p","p_rec","k","w","case","kind"]);
function srTexts(x, out){
  if (typeof x === "string") { if (/[가-힣A-Za-z]/.test(x) && !/^https?:/.test(x)) out.push(x.replace(/\{\{[^}]*\}\}/g, "")); }
  else if (Array.isArray(x)) x.forEach(v => srTexts(v, out));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { if (!SR_SKIP.has(k)) srTexts(v, out); }
  return out;
}
function srBuild(){
  const E = [], add = (g, t, body, go, tkey) => { const b = srTexts(body, []).join(" · "); E.push({g, t, b, tk:srNorm(tkey == null ? t : tkey), bk:srNorm(b), go}); };
  const toPane = (tab, cb) => () => { if (cb) cb(); switchTab(tab); return "pane-" + tab; };
  for (const [iso, c] of Object.entries(D.countries)) add("Countries", c.name_ko + (c.leader ? " · " + String(c.leader).split(/[,/(]/)[0].trim() : ""), c, () => { selectCountry(iso, true); return "pane-detail"; });
  D.flashpoints.forEach(fp => add("Flashpoints", fp.name_ko, fp, () => { selectFp(fp.id); return "pane-detail"; }));
  (D.strategies || []).forEach(c => add("Strategic Analysis", c.title, c, () => { goCase(c.id); caseFill(c.id); return "case-" + c.id; }));
  /* v3.19 여론·의지 항목을 따로 색인 */
  const toCase = (id, tgt) => () => { goCase(id); caseFill(id); return tgt; }, cshort = c => String(c.title).split(":")[0];
  (D.strategies || []).forEach(c => {
    ((c.publics || {}).items || []).forEach((p, i) => add("Strategic Analysis", cshort(c) + " · Domestic opinion · " + p.who, [p, "public opinion"], toCase(c.id, "pub-" + c.id + "-" + i)));
    ((c.deciders || {}).items || []).forEach(d => add("Strategic Analysis", cshort(c) + " · Decision-maker analysis · " + nm(d.iso), [d, "intent"], toCase(c.id, "dec-" + c.id + "-" + d.iso)));
  });
  for (const [iso, c] of Object.entries(D.countries)) if (c.intent) add("Countries", c.name_ko + " · Intent indicators · words and deeds", [c.intent, "intent"], () => { selectCountry(iso, true); return "c-intent"; });
  FEATS().forEach(F => add("Features", F.title, F, () => { goFeat(F.id); return "feat-" + F.id; }));
  (D.insights || []).forEach(k => add("Key Assessments", String(k.t).split(EN_SENT)[0], [k.t, k.classic || ""], toPane("strat")));
  (D.digest || []).forEach(g => add("Global Overview", g.t, g.d, toPane("overview")));
  if (BR) BR.issues.forEach(x => x.items.forEach(i => add("Briefings", fmtKD(x.date) + " · " + i.h, [i.fact || "", i.link || ""], () => { goBrief(x.date); return "pane-brief"; })));
  /* v3.52 전망 검색(2026-10-05): 짧은 이름과 확률을 제목으로, 사안·분쟁 지점·나라 이름과 '가능성·확률·전망' 같은 말을 본문에 넣어 "러우 전쟁 휴전 가능성" 같은 물음에 전망이 잡히게 한다. 누르면 전망과 검증의 해당 항목으로 간다 */
  D.forecasts.forEach(f => { const c = fcCase(f), fp = D.flashpoints.find(x => x.id === f.fp);
    add("Forecasts", (f.s || f.q) + " · " + (f.status === "open" ? f.p + "%" : f.status === "yes" ? "Resolved yes" : f.status === "no" ? "Resolved no" : "Voided"),
      [f.q, f.basis, f.void || "", c ? cshort(c) : "", fp ? fp.name_ko : "", (f.countries || []).map(nm).join(" "), "chance probability forecast resolution " + (f.due || "")],
      () => { fcOpen(f.id); return "pane-forecast"; });  /* v4.22 전망별 화면으로 */
  });
  const G = D.grand || {}, enPair = i => i === "USA" ? "U.S." : ((D.countries[i] || {}).name_ko || i);
  (G.trends || []).forEach(t => add("World Order", t.t, t, toPane("grand")));
  (G.scenarios || []).forEach(t => add("World Order", "Scenario · " + t.name, t, toPane("grand")));
  (G.dyads || []).forEach(t => add("World Order", enPair(t.a) + "-" + enPair(t.b) + " relations", t, toPane("grand")));
  (G.tensions || []).forEach(t => add("World Order", enPair(t.a) + "-" + enPair(t.b) + " · History and structure", t, toPane("grand")));
  ((D.history || {}).analogies || []).forEach(a => add("History and Ideas", "Historical precedent · " + a.now + (a.cases ? " ↔ " + [].concat(a.cases).join(", ") : ""), a, toPane("ideas")));
  ((D.history || {}).laws || []).forEach(l => add("History and Ideas", l.t, l, toPane("ideas")));
  (D.thinkers || []).forEach(t => add("History and Ideas", t.name, t, toPane("ideas")));
  (((D.philosophy || {}).questions) || []).forEach(q => add("Methodology", "Questions raised about the purpose · " + q.id + ". " + q.title, q, toPane("method")));
  (((D.methodology || {}).terms) || []).forEach(t => add("Methodology", Array.isArray(t) ? t[0] : t.t, t, toPane("method")));
  /* v3.52 사이트 메뉴와 글 쪽(운영자 인사말·새 글 알림·사이트 안내), 결정권자 쪽, 특집의 절 */
  const page = u => () => { pageGo(enAdd(u), true); return "pane-page"; };
  [["Briefings", "briefing today latest news morning daily major events developments briefings", () => { goBrief(); return "pane-brief"; }],
   ["Features", "features articles in-depth essays topics", () => { switchTab("feature"); return "pane-feature"; }],
   ["Global Overview", "global overview globe map summary upcoming events schedule flashpoints conflict zones countries", toPane("overview")],
   ["Strategic Analysis", "strategic analysis issues Korean Peninsula Taiwan Strait Russia-Ukraine war Iran Hormuz semiconductors chips assessment scenarios", toPane("strat")],
   ["World Order", "world order world scenarios great powers relations trends", toPane("grand")],
   ["Forecasts and Track Record", "forecasts track record probability prediction accuracy hit rate Brier score results", toPane("forecast")],
   ["Power Structures", "power structures decision-making decision-maker leader president chairman prime minister worldview how decisions are made constitution legislature parliament National Assembly Congress Senate House seats ruling party opposition veto election impeachment consent lawmakers statements", page("/power/")],
   ["History and Ideas", "history precedents thinkers classics recurring patterns", toPane("ideas")],
   ["Methodology", "methodology procedures rules well-being index judgment estimate method", toPane("method")],
   ["Site Guide", "site guide how to use screens explanation help shortcuts", page("/guide/")],
   ["A Note from the Founder", "note from the founder Jae-Seong Ko about contact email inquiries", page("/about/")],
   ["Subscribe to Updates", "new post alerts subscribe RSS feed app updates", page("/subscribe/")]].forEach(([t, b, go]) => add("Site Menu", t, b, go));
  D.strategies.forEach(c => (c.congress || []).forEach((x, i) => add("Strategic Analysis", cshort(c) + " · Issues before the legislature · " + x.t, [x.t, x.stage, x.power, x.votes || "", x.sides || "", nm(x.iso), "legislature parliament National Assembly Congress Senate House consent vote"], toCase(c.id, "cg-" + c.id + "-" + i))));
  Object.entries(PLK()).forEach(([i, L]) => { add("Power Structures", L.name + ": power structure", [L.name, L.system || "", "power structure decision-making constitution veto election impeachment consent troop deployment treaties budget"], page("/power/#" + i));
    if (L.pb) add("Power Structures", L.pb, [L.pb, L.name, "power centers legislature parliament National Assembly seats ruling party opposition votes parties committees lawmakers statements issues"], page("/power/" + i + "/")); });  /* v3.62 나라 기본 내용은 첫 쪽, 권력기관은 나라별 쪽 */
  Object.entries(LLK()).forEach(([i, L]) => add("Decision-Makers", L.name + " · Worldview and decision-making", [L.name, nm(i), "decision-maker leader worldview decision-making words and deeds"], page(lurl(i))));
  /* v3.52b 결정권자 쪽의 절별 본문(data/search_leaders.json, 검색 창을 처음 열 때 받아 온다). 이름은 본문에만 넣어, 이름만 찾을 때는 결정권자 쪽 자체가 먼저 나오게 한다 */
  (SR.LD || []).forEach(L => (L.sections || []).forEach((s, si) => add("Decision-Maker Analysis", L.name + " · " + s.h, [L.name, nm(L.iso), s.t], vs => {
    pageGo(lurl(L.iso), true, () => { const h2 = document.querySelectorAll("#pane-page .page-pre h2")[si];
      const nmk = srNorm(L.name + nm(L.iso)), key = vs.filter(v => !nmk.includes(v)); srLand("pane-page", key.length ? key : vs, h2); });
    return null; }, s.h)));
  FEATS().forEach(F => (F.sections || []).forEach(S => add("Features", F.title + " · " + S.h, S.blocks ? S.blocks.filter(b => b.p || b.table).map(b => b.p || b.table) : S, () => { goFeat(F.id); return "feat-" + F.id; })));
  SR.idx = E;
}
function srVariants(tok){
  const n = srNorm(tok), forms = [n];
  for (const t of SR_TAIL) if (n.length > t.length + 1 && n.endsWith(t)) { forms.push(n.slice(0, -t.length)); break; }
  const out = new Set();
  for (const f of forms) { out.add(f); const g = SR_ALIAS.find(a => a.some(v => srNorm(v) === f)); if (g) g.forEach(v => out.add(srNorm(v))); }
  return [...out];
}
function srSearch(q, loose){
  const all = q.trim().split(/\s+/).filter(Boolean), soft = all.filter(t => SR_SOFT.has(srNorm(t))), hard = all.filter(t => !SR_SOFT.has(srNorm(t)));
  const toks = (hard.length ? hard : all).map(srVariants), softv = hard.length ? soft.map(srVariants) : [];  /* v3.52 '가능성·확률·여부' 같은 말은 있어도 되고 없어도 되는 조건 */
  if (!toks.length) return [];
  const R = [];
  for (const e of SR.idx) {
    let sc = 0, ok = true, hit = 0;
    for (const vs of toks) {
      const inT = vs.some(v => e.tk.includes(v)), inB = vs.some(v => e.bk.includes(v));
      if (!inT && !inB) { if (loose) continue; ok = false; break; }
      hit++;
      sc += (inT ? 20 : 0) + (e.tk === vs[0] ? 30 : 0) + Math.min(10, vs.reduce((s, v) => s + (e.bk.split(v).length - 1), 0));
    }
    if (loose && !hit) ok = false;
    if (ok) { if (loose) sc += hit * 50; for (const vs of softv) if (vs.some(v => e.tk.includes(v) || e.bk.includes(v))) sc += 8;
      if (e.g === "Forecasts" && soft.some(t => /chance|probability|likelihood|odds|forecast|will/i.test(t))) sc += 40;  /* 확률을 묻는 말이면 전망을 맨 위로 */
      R.push({e, sc, vs:toks.flat()}); }
  }
  return R.sort((a, b) => b.sc - a.sc);
}
function srSnip(text, vs){
  /* v3.52b 여러 낱말이면 본문에서 가장 드물게 나오는 낱말(보통 이름이 아닌 쪽, 예: '푸틴 독재'의 '독재') 둘레를 보이고, 그 구간 안의 찾는 말은 모두 표시한다 */
  const rx = v => new RegExp(v.split("").map(ch => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*"), "gi");
  let at = -1, len = 0, best = Infinity;
  for (const v of vs) { if (!v) continue; const ms = [...text.matchAll(rx(v))]; if (ms.length && (ms.length < best || (ms.length === best && ms[0].index < at))) { best = ms.length; at = ms[0].index; len = ms[0][0].length; } }
  if (at < 0) return esc(text.slice(0, 90)) + (text.length > 90 ? "…" : "");
  const a = Math.max(0, at - 36), b = Math.min(text.length, at + len + 60), seg = text.slice(a, b), marks = [];
  for (const v of vs) if (v) for (const m of seg.matchAll(rx(v))) marks.push([m.index, m.index + m[0].length]);
  marks.sort((x, y) => x[0] - y[0]); let h = "", c = 0;
  for (const [s0, e0] of marks) { if (s0 < c) continue; h += esc(seg.slice(c, s0)) + "<mark>" + esc(seg.slice(s0, e0)) + "</mark>"; c = e0; }
  return (a > 0 ? "…" : "") + h + esc(seg.slice(c)) + (b < text.length ? "…" : "");
}
const SR_ORDER = ["Site Menu","Power Structures","Decision-Makers","Decision-Maker Analysis","Countries","Features","Key Assessments","Strategic Analysis","Flashpoints","Global Overview","Forecasts","Briefings","World Order","History and Ideas","Methodology"];
const SR_EX = ["chance of war in Korea","Kim Jong Un","chance of a Ukraine ceasefire","well-being index","population","Hormuz","chip tariffs","USFK"];  /* v3.52 */
function srRender(){
  const q = $("#srchq").value, box = $("#srchres");
  SR.items = []; SR.act = -1;
  if (!q.trim()) { box.innerHTML = "<div class=\"srch-empty\"><span>Try searching for</span><div class=\"chips\">" + SR_EX.map(x => '<button type="button" class="chip" data-srq="' + esc(x) + '">' + esc(x) + "</button>").join("") + "</div></div>"; return; }
  let R = srSearch(q), part = false;
  if (!R.length && q.trim().split(/\s+/).length > 1) { R = srSearch(q, true); part = R.length > 0; }  /* v3.52 */
  if (!R.length) { box.innerHTML = '<div class="srch-empty">No results for ‘' + esc(q) + "’ returned no results. Try a shorter word or a different name.<div class=\"chips\" style=\"margin-top:10px\">" + SR_EX.map(x => '<button type="button" class="chip" data-srq="' + esc(x) + '">' + esc(x) + "</button>").join("") + "</div></div>"; return; }
  let h = part ? "<div class=\"srch-note\">No result contains all your search terms; showing results that match some of them.</div>" : "";
  /* v3.19 제목이 맞은 묶음을 먼저 보인다. 점수가 같으면 SR_ORDER 순서 */
  const best = {}; R.forEach(r => { if (!(r.e.g in best)) best[r.e.g] = r.sc; });
  const GO = SR_ORDER.filter(g => g in best).sort((a, b) => best[b] - best[a] || SR_ORDER.indexOf(a) - SR_ORDER.indexOf(b));
  for (const g of GO) {
    const rs = R.filter(r => r.e.g === g); if (!rs.length) continue;
    const lim = SR.more[g] ? rs.length : 5;
    h += '<div class="srch-g"><span>' + g + "</span><span>" + rs.length + "</span></div>";
    rs.slice(0, lim).forEach(r => { const i = SR.items.push(r) - 1; h += '<button type="button" class="srch-item" role="option" aria-selected="false" data-sri="' + i + '"><b>' + srSnip(r.e.t, r.vs) + '</b><span class="snip">' + srSnip(r.e.b, r.vs) + "</span></button>"; });
    if (rs.length > lim) h += '<button type="button" class="srch-more" data-srmore="' + esc(g) + '">' + (rs.length - lim) + " more</button>";
  }
  box.innerHTML = h;
}
function srMove(d){
  const els = [...document.querySelectorAll("#srchres .srch-item")]; if (!els.length) return;
  SR.act = (SR.act + d + els.length) % els.length;
  els.forEach((el, i) => el.setAttribute("aria-selected", i === SR.act));
  els[SR.act].scrollIntoView({block:"nearest"});
}
function srLand(paneId, vs, from){
  const pane = document.getElementById(paneId); if (!pane) return;
  const w = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT); let n, hit = null;
  if (from && pane.contains(from)) { w.currentNode = from; hit = from; }  /* v3.52b 절 제목에서부터 찾고, 다음 절 전에 없으면 절 제목에 머문다 */
  while ((n = w.nextNode())) { if (from && n.parentElement.closest("h2") && !from.contains(n)) break; const t = srNorm(n.nodeValue); if (vs.some(v => t.includes(v))) { hit = n.parentElement; break; } }
  const scoped = !/^pane-/.test(paneId);
  if (!hit) { if (!scoped) return; hit = pane; }
  for (let p = hit; p && p !== (scoped ? document.body : pane); p = p.parentElement) if (p.tagName === "DETAILS") p.open = true;
  const blk = hit === pane ? pane : (hit.closest("li, article, section, details, p, dd, div") || hit);
  blk.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block: blk.getBoundingClientRect().height > innerHeight * 0.7 ? "start" : "center"});
  blk.classList.add("srch-hit"); setTimeout(() => blk.classList.add("fade"), 1600); setTimeout(() => blk.classList.remove("srch-hit", "fade"), 3000);
}
function srOpen(){
  if (!SR.LD && !SR.ldw) { SR.ldw = 1; fetch("/en/data/search_leaders.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : Promise.reject()).then(j => { SR.LD = j; SR.idx = null; if (!$("#srch").hidden) { srBuild(); srRender(); } }).catch(() => { SR.ldw = 0; }); }
  if (!SR.idx) srBuild(); $("#srch").hidden = false; const i = $("#srchq"); i.focus(); i.select(); srRender(); }
function srClose(){ $("#srch").hidden = true; $("#srchopen").focus({preventScroll:true}); }
function srGo(i){
  const r = SR.items[i]; if (!r) return;
  srClose();
  const pane = r.e.go(r.vs);
  if (narrow()) $("#panel").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"});
  if (pane) setTimeout(() => srLand(pane, r.vs), 60);  /* 글 쪽을 받아 오는 항목은 스스로 자리를 찾는다(null) */
}
function setupSearch(){
  let tm = null;
  $("#srchopen").onclick = srOpen;
  $("#srchx").onclick = srClose;
  $("#srch").addEventListener("click", e => { if (e.target.id === "srch") srClose(); });
  $("#srchq").addEventListener("input", () => { clearTimeout(tm); SR.more = {}; tm = setTimeout(srRender, 110); });
  $("#srchres").addEventListener("click", e => {
    const it = e.target.closest("[data-sri]"); if (it) return srGo(+it.dataset.sri);
    const mo = e.target.closest("[data-srmore]"); if (mo) { SR.more[mo.dataset.srmore] = true; srRender(); return; }
    const ex = e.target.closest("[data-srq]"); if (ex) { $("#srchq").value = ex.dataset.srq; srRender(); $("#srchq").focus(); }
  });
  document.addEventListener("keydown", e => {
    const open = !$("#srch").hidden;
    if (!open && e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); srOpen(); return; }
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); srClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); srMove(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); srMove(-1); }
    else if (e.key === "Enter" && document.activeElement.id === "srchq") { e.preventDefault(); srGo(SR.act >= 0 ? SR.act : 0); }
  });
}

/* ---------- load ---------- */
/* v3.34 속도: 자료·브리핑·지도를 함께 받되, 글은 자료가 오는 즉시 그리고 지구본은 지도가 온 뒤에 그린다. 탭 내용은 처음 열 때 그린다 */
/* v3.96h 새 판 확인: 열어 둔 화면이나 브라우저에 남은 화면이 옛 판이면 한 번 다시 불러온다(화면의 clisa-build 판 표시와 /ver.json 비교, fresh_ver.py) */
(function(){ const me = document.querySelector('meta[name="clisa-build"]'), mv = me ? me.getAttribute("content") : "", sc = document.querySelector('script[src*="app.js?v="]'), lg = sc && sc.getAttribute("src").indexOf("/en/") === 0 ? "en" : "ko"; if (!mv) return;
  let hid = 0; const chk = () => fetch("/ver.json", {cache: "no-store"}).then(r => r.ok ? r.json() : null).then(j => { const nv = j && j[lg]; if (!nv || nv === mv) return; try { const k = "vre:" + nv; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch(e){ return; } location.reload(); }).catch(() => {});
  chk(); document.addEventListener("visibilitychange", () => { if (document.hidden) hid = Date.now(); else if (hid && Date.now() - hid > 180000) chk(); }); addEventListener("pageshow", e => { if (e.persisted) chk(); }); })();
const BRIEF_P = fetch("/en/data/daily.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
/* v3.86(2026-10-08 결재) 미군 해외 배치는 data/posture.json(매주·매월 예약 작업이 고침)을 따로 받아 자료에 붙인다. 못 받으면 미군 배치 없이 연다 */
const POSTURE_P = fetch("/en/data/posture.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
fetch("/en/data/eurasia.json", {cache: "no-cache"}).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => POSTURE_P.then(p => { if (p && p.res && p.fleet && p.events) d.posture = p; else delete d.posture; return d; })).then(d => { init(d); return fetch("/data/world-50m.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }); }).then(w => initGlobe(w)).catch(err => {
  console.error(err);
  const l = $("#loading"); if (l) l.textContent = "Couldn’t load the data. Please refresh the page.";
});
const RENDERED = {};
const markR = (t, f) => function(){ RENDERED[t] = true; return f.apply(this, arguments); };
renderStrat = markR("strat", renderStrat); renderForecasts = markR("forecast", renderForecasts); renderGrand = markR("grand", renderGrand); renderIdeas = markR("ideas", renderIdeas); renderMethod = markR("method", renderMethod); renderFeature = markR("feature", renderFeature); renderDiscuss = markR("discuss", renderDiscuss);
const TAB_RENDER = {industry: () => renderIndustry(), brief: () => renderBrief(), strat: () => renderStrat(), forecast: () => renderForecasts(), grand: () => renderGrand(), ideas: () => renderIdeas(), method: () => renderMethod(), feature: () => renderFeature(), discuss: () => renderDiscuss()};
function ensureRendered(t){ if (D && TAB_RENDER[t] && !RENDERED[t]) TAB_RENDER[t](); }

const PUB = () => !!(D && D.meta && D.meta.edition === "public");
function initGlobe(w){
  if (!D) return;
  if (!narrow() && !document.documentElement.classList.contains("legoff") && !S.zfold) S.zfoldAuto = true;  /* v4.38c 범례를 펼쳐 둔 방문자는 권역 판을 접은 채로 */
  zoneBarSync();  /* v4.38 */
  aswFold();
  const numToIso = {};
  for (const [iso, c] of Object.entries(D.countries)) if (c.num) numToIso[c.num] = iso;
  features = topojson.feature(w, w.objects.countries).features;
  for (const f of features) { f.iso = numToIso[+f.id] || null; if (f.iso) byIso[f.iso] = f; }
  features.sort((a, b) => (a.iso ? 1 : 0) - (b.iso ? 1 : 0));
  borders = topojson.mesh(w, w.objects.countries, (a, b) => a !== b);
  for (const iso of Object.keys(byIso)) labelPos[iso] = LABEL_AT[iso] || d3.geoCentroid(byIso[iso]);
  requestDraw(true);
}
function init(d){
  D = d;
  /* v3.20d 공개판 머리글에서 기준일을 뺀다(기준일은 세계 정세·사안·전망에 둠). 내부판은 기준일과 판 표시 유지 */
  if (PUB()) { const as = document.querySelector(".top .asof"); if (as) as.remove(); } else { $("#asof").textContent = D.meta.asof; $("#ver").textContent = " · " + D.meta.version; }
  if (PUB()) { const tb = $("#tab-discuss"); if (tb) tb.remove(); }
  else { const b = document.createElement("span"); b.className = "edtag"; b.textContent = ""; $(".brand").appendChild(b); }
  D.flashpoints.forEach((fp, i) => fp.phase = (i * 0.137) % 1);
  const addF = (iso, v) => { FOCUS[iso] = (FOCUS[iso] || 0) + v; };
  D.forecasts.forEach(f => f.countries.forEach(i => { addF(i, 1); FCN[i] = (FCN[i] || 0) + 1; }));
  D.flashpoints.forEach(fp => fp.countries.forEach(i => addF(i, 1)));
  (D.strategies || []).forEach(c => { (c.deciders ? c.deciders.items : []).forEach(d => addF(d.iso, 3)); const r = String(c.recipient || ""); addF(c.subject || (r.includes("Ukraine") ? "UKR" : r.includes("Taiwan") ? "TWN" : "KOR"), 3); });
  const fmx = Math.max(1, ...Object.values(FOCUS)); for (const k of Object.keys(FOCUS)) FOCUS[k] = Math.round(100 * Math.sqrt(FOCUS[k] / fmx));
  $("#loading").remove();
  readColors(); setupInteraction(); resize();
  new ResizeObserver(resize).observe(wrap);
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const retheme = () => { readColors(); renderLegend(); requestDraw(true); renderOverview(); renderGrand(); if (S.tab === "detail") renderDetail(); };
  mq.addEventListener ? mq.addEventListener("change", retheme) : mq.addListener(retheme);
  new MutationObserver(retheme).observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});
  setLayer(S.layer);
  renderOverview(); renderDetail();
  /* v3.43 첫 화면은 언제나 정세 브리핑(최신 호 전문). 특정 주소·#표식으로 들어오면 그 화면 */
  if (!HASH0) switchTab("overview");  /* v3.99(2026-10-12 결재): 첫 화면은 지구본과 세계 정세(맨 위 정세 브리핑) */
  const Q0 = ROUTES && /[?&]q(=|&|$)/.test(location.search) ? (new URLSearchParams(location.search).get("q") || "") : null;
  if (!applyRoute()) applyHash(); HASH_READY = true; ROUTE_FIRST = false; routeSync(true);
  if (Q0 !== null) { srOpen(); if (Q0) { $("#srchq").value = Q0; srRender(); } }
  setupSearch();
  ttsSetup();
  loadBrief();
  runStrip($("#astrip"), () => narrow() ? [] : agendaItems());
  loop();
}

/* ---------- drawing ---------- */
function resize(){
  const r = wrap.getBoundingClientRect();
  W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const [c, ctx] of [[base, bctx], [over, octx]]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  R0 = Math.min(W, H) * (narrow() ? 0.47 : 0.45);
  requestDraw(true);
}
function proj(){ projection.translate([W / 2, H / 2]).scale(R0 * S.k).rotate(S.rot); }
const center = () => { proj(); const c = projection.invert([W / 2, H / 2]); return (c && isFinite(c[0])) ? c : [-S.rot[0], -S.rot[1]]; };
/* versor: quaternion trackball rotation (after Mike Bostock's versor) */
const versor = (function(){
  const acos = Math.acos, asin = Math.asin, atan2 = Math.atan2, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, max = Math.max, min = Math.min, rad = Math.PI / 180, deg = 180 / Math.PI;
  function v(e){ const l = e[0] / 2 * rad, sl = sin(l), cl = cos(l), p = e[1] / 2 * rad, sp = sin(p), cp = cos(p), g = (e[2] || 0) / 2 * rad, sg = sin(g), cg = cos(g);
    return [cl * cp * cg + sl * sp * sg, sl * cp * cg - cl * sp * sg, cl * sp * cg + sl * cp * sg, cl * cp * sg - sl * sp * cg]; }
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  v.cartesian = e => { const l = e[0] * rad, p = e[1] * rad, cp = cos(p); return [cp * cos(l), cp * sin(l), sin(p)]; };
  v.rotation = q => [atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * deg,
                     asin(max(-1, min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * deg,
                     atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * deg];
  v.delta = (v0, v1) => { const w = cross(v0, v1), l = sqrt(dot(w, w)); if (!l) return [1, 0, 0, 0];
    const t = acos(max(-1, min(1, dot(v0, v1)))) / 2, s = sin(t); return [cos(t), w[2] / l * s, -w[1] / l * s, w[0] / l * s]; };
  v.multiply = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
                          a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  return v;
})();

function fillFor(f){
  const c = f.iso && D.countries[f.iso];
  if (!c) return C.landOut;
  const mv = S.layer === "mil" ? milV(c) : 0;
  if (S.layer === "mil" && mv == null) return C.landOut;  /* 군사비 자료 없음은 분석 범위 밖과 같은 회색(범례에 밝힘) */
  const col = ramp(S.layer, S.layer === "focus" ? (FOCUS[f.iso] || 0) : 25 + 0.75 * mv);  /* 군사력: 가장 연한 색도 회색·바다와 구별되게 25부터 */
  if (S.lens && !S.lens.set.has(f.iso)) return d3.interpolateLab(col, C.landOut)(0.78);
  return col;
}
function drawBase(){
  if (!(W > 0 && H > 0)) return;  /* v3.79 사이트 안내 탭처럼 지구본을 감춘 동안에는 그리지 않는다 */
  proj();
  bctx.clearRect(0, 0, W, H);
  const r = R0 * S.k, cx = W / 2, cy = H / 2;
  const g = bctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
  g.addColorStop(0, C.ocean); g.addColorStop(1, C.ocean2);
  bctx.beginPath(); pathB({type:"Sphere"}); bctx.fillStyle = g; bctx.fill();
  bctx.beginPath(); pathB(grat); bctx.strokeStyle = C.grat; bctx.lineWidth = 0.6; bctx.stroke();
  for (const f of features) { bctx.beginPath(); pathB(f); bctx.fillStyle = fillFor(f); bctx.fill(); }
  if (borders) { bctx.beginPath(); pathB(borders); bctx.strokeStyle = C.border; bctx.lineWidth = 0.5; bctx.stroke(); }
  if (S.hover && byIso[S.hover] && S.hover !== S.sel) { bctx.beginPath(); pathB(byIso[S.hover]); bctx.strokeStyle = C.ink; bctx.lineWidth = 1.2; bctx.stroke(); }
  if (S.sel && byIso[S.sel]) { bctx.beginPath(); pathB(byIso[S.sel]); bctx.strokeStyle = C.accent; bctx.lineWidth = 2.4; bctx.stroke(); }
  if (S.mark && S.mark.isos) for (const i of S.mark.isos) if (byIso[i]) { bctx.beginPath(); pathB(byIso[i]); bctx.strokeStyle = C.accent; bctx.lineWidth = 2.2; bctx.stroke(); }  /* v3.79 일정·나라 표시 */
  bctx.beginPath(); pathB({type:"Sphere"}); bctx.strokeStyle = C.line; bctx.lineWidth = 1; bctx.stroke();
  const cc = center(); $("#readout").textContent = "Center " + fmtDeg(cc[0], "E", "W") + " " + fmtDeg(cc[1], "N", "S") + " · " + S.k.toFixed(1) + "×";
}
function edgeRelevant(e){
  if (!S.lens) return true;
  const capIso = k => (D.capitals[k] || [])[3];
  return S.lens.set.has(capIso(e.a)) && S.lens.set.has(capIso(e.b));
}
function drawOver(t){
  if (!(W > 0 && H > 0)) return;
  proj();
  octx.clearRect(0, 0, W, H);
  const ctr = center();
  if (S.showEdge) {
    for (const e of D.edges) {
      const a = D.capitals[e.a], b = D.capitals[e.b];
      const ls = {type:"LineString", coordinates:[[a[0], a[1]], [b[0], b[1]]]};
      const alpha = (edgeRelevant(e) ? 1 : 0.2) * (S.layer === "mil" ? 0.3 : 1);
      octx.setLineDash([]); octx.globalAlpha = 0.75 * alpha; octx.strokeStyle = C.halo; octx.lineWidth = 3.6;
      octx.beginPath(); pathO(ls); octx.stroke();
      octx.globalAlpha = alpha; octx.lineWidth = 1.7;
      octx.setLineDash(e.kind === "conflict" ? [5, 4] : []);
      octx.strokeStyle = e.kind === "conflict" ? C.conflict : C.coop;
      octx.beginPath(); pathO(ls); octx.stroke();
    }
    octx.setLineDash([]); octx.globalAlpha = 1;
  }
  const USF = S.showUsf && D.posture, lboxes = [], usfOps = USF ? layoutUsf(ctr, lboxes) : [];  /* 나라 이름은 미군 기호를 피해 놓는다 */
  const MIL = S.layer === "mil";  /* v3.76 군사력 보기에서는 관계선·분쟁지를 옅게 하고 이름·숫자를 맨 위에 그린다 */
  const drawLabels = () => {
  octx.font = '500 11px "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
  octx.textAlign = "center"; octx.textBaseline = "middle"; octx.lineJoin = "round";
  /* 군사력 보기: 병력이 큰 나라부터 놓고, 이미 놓은 이름·숫자와 겹치면 그 나라는 건너뛴다(확대하면 나타남) */
  const mw = i => { const m = (D.countries[i] || {}).mil || {}; return ({KOR: 3e12, PRK: 2e12, JPN: 1e12}[i] || 0) + (m.nukes ? 1e9 + m.nukes : 0) + (m.active_personnel || 0); };  /* 한국·북한·일본 먼저, 다음 핵보유국, 다음 병력 순 */
  const keys = MIL ? Object.keys(labelPos).sort((x, y) => mw(y) - mw(x)) : Object.keys(labelPos);
  const boxes = lboxes, hit = (x0, y0, x1, y1) => boxes.some(b => x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]);
  for (const iso of keys) {
    const c = D.countries[iso];
    if (!c || (c.tier !== 1 && S.k < 1.7)) continue;
    const ll = labelPos[iso];
    if (d3.geoDistance(ll, ctr) > 1.38) continue;
    const p0 = projection(ll); if (!p0) continue; let p = p0;
    const dim = S.lens && !S.lens.set.has(iso);
    if (USF && !MIL) { const hw = octx.measureText(c.name_ko).width / 2 + 2; if (hit(p0[0] - hw, p0[1] - 7, p0[0] + hw, p0[1] + 7)) continue; boxes.push([p0[0] - hw, p0[1] - 7, p0[0] + hw, p0[1] + 7]); }
    if (MIL) { const m = c.mil || {}, sw = (m.active_personnel || m.nukes) ? (String(m.active_personnel || "").length + (m.nukes ? 7 + String(m.nukes).length : 0)) * 5.6 : 0;
      const hw = Math.max(octx.measureText(c.name_ko).width, sw) / 2 + 2, h1 = sw ? 19 : 8;  /* 겹치면 위·아래·옆으로 비켜 본다 */
      const off = [[0, 0], [0, -26], [0, 26], [-hw - 6, 0], [hw + 6, 0], [0, -48], [0, 48]].find(([dx, d]) => !hit(p0[0] + dx - hw, p0[1] + d - 8, p0[0] + dx + hw, p0[1] + d + h1)); if (!off) continue;
      p = [p0[0] + off[0], p0[1] + off[1]]; boxes.push([p[0] - hw, p[1] - 8, p[0] + hw, p[1] + h1]); }
    octx.globalAlpha = dim ? 0.45 : 1;
    octx.lineWidth = 3; octx.strokeStyle = C.halo; octx.strokeText(c.name_ko, p[0], p[1]);
    octx.fillStyle = C.ink; octx.fillText(c.name_ko, p[0], p[1]);
    /* v3.76 '군사력' 보기에서 나라 이름 아래에 현역 병력과 핵탄두 추정치를 적는다(IISS·SIPRI, 나라 자료의 mil) */
    if (S.layer === "mil" && c.mil && iso !== "EUR") {
      const ap = c.mil.active_personnel, nk = c.mil.nukes;
      const man = n => n >= 1e6 ? (Math.round(n / 1e4) / 100) + "M" : Math.round(n / 1e3) + "k";
      const parts = []; if (ap) parts.push(man(ap)); if (nk) parts.push(nk.toLocaleString("en-US") + " warheads");
      if (parts.length) {
        const s2 = parts.join(" · "); octx.font = '600 10px "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
        octx.lineWidth = 3; octx.strokeStyle = C.halo; octx.strokeText(s2, p[0], p[1] + 12);
        octx.fillStyle = nk ? C.conflict : C.ink; octx.fillText(s2, p[0], p[1] + 12);
        octx.font = '500 11px "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
      }
    }
  }
  octx.globalAlpha = 1; };
  if (!MIL && !USF) drawLabels();
  octx.globalAlpha = 1;
  if (S.showFp) {
    for (const fp of D.flashpoints) {
      fp._p = null;  /* v3.85: 미군 배치와 함께 그릴지는 분쟁지 스위치가 정한다 */
      const ll = [fp.lon, fp.lat];
      if (d3.geoDistance(ll, ctr) > 1.52) continue;
      const p = projection(ll); if (!p) continue;
      fp._p = p;
      const rad = 2.6 + fp.severity * 1.15;
      const dim = S.lens && !S.lens.fpAll && !fp.countries.some(c => S.lens.set.has(c));
      const fa = MIL ? 0.3 : 1; octx.globalAlpha = (dim ? 0.3 : 1) * fa;
      if (!reduceMotion && fp.severity >= 4 && !dim && !MIL) {
        const ph = ((t || 0) / 1800 + fp.phase) % 1;
        octx.beginPath(); octx.arc(p[0], p[1], rad + ph * rad * 2.4, 0, Math.PI * 2);
        octx.strokeStyle = C.conflict; octx.globalAlpha = (1 - ph) * 0.55; octx.lineWidth = 1.2; octx.stroke();
        octx.globalAlpha = 1;
      }
      octx.beginPath(); octx.arc(p[0], p[1], rad, 0, Math.PI * 2);
      octx.fillStyle = C.conflict; octx.fill(); octx.lineWidth = 1.6; octx.strokeStyle = C.halo; octx.stroke();
      if (fp.id === S.selFp || fp.id === S.hoverFp) {
        octx.beginPath(); octx.arc(p[0], p[1], rad + 4.5, 0, Math.PI * 2);
        octx.strokeStyle = C.accent; octx.lineWidth = 2; octx.stroke();
      }
      octx.globalAlpha = 1;
    }
  }
  if (MIL || USF) drawLabels();
  for (const f of usfOps) f();
  if (S.mark && S.mark.lon != null) {  /* v3.79 일정 장소(도시)의 점과 이름 */
    const ll = [S.mark.lon, S.mark.lat];
    if (d3.geoDistance(ll, ctr) < 1.5) { const p = projection(ll);
      if (p) { octx.beginPath(); octx.arc(p[0], p[1], 6.5, 0, Math.PI * 2); octx.fillStyle = C.accent; octx.fill(); octx.lineWidth = 2.5; octx.strokeStyle = C.halo; octx.stroke();
        if (S.mark.place) { octx.font = '700 12px "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif'; octx.textAlign = "center"; octx.textBaseline = "middle"; octx.lineJoin = "round";
          octx.lineWidth = 3.5; octx.strokeStyle = C.halo; octx.strokeText(S.mark.place, p[0], p[1] - 16); octx.fillStyle = C.accent; octx.fillText(S.mark.place, p[0], p[1] - 16); } } }
  }
  if (S.zonePins && S.zonePins.length) {  /* v4.38 권역 지구본: 최근 2주 브리핑의 사건 장소(●)와 다가오는 일정(○), 이름은 겹치지 않는 것만 */
    const pts = [], bx = [];
    for (const q of S.zonePins) { const ll = [q.lon, q.lat]; if (d3.geoDistance(ll, ctr) > 1.45) continue; const p = projection(ll); if (!p) continue;
      if (pts.some(o => Math.hypot(o[0] - p[0], o[1] - p[1]) < 5)) continue; pts.push([p[0], p[1], q]); }
    for (const [x, y, q] of pts) { octx.beginPath(); octx.arc(x, y, 4.5, 0, Math.PI * 2);
      if (q.k === "b") { octx.fillStyle = C.accent; octx.fill(); octx.lineWidth = 1.6; octx.strokeStyle = C.halo; octx.stroke(); }
      else { octx.fillStyle = C.halo; octx.fill(); octx.lineWidth = 2.2; octx.strokeStyle = C.accent; octx.stroke(); } }
    octx.font = '600 10.5px "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif'; octx.textAlign = "left"; octx.textBaseline = "middle"; octx.lineJoin = "round";
    for (const [x, y, q] of pts) { if (!q.place) continue; const w = octx.measureText(q.place).width, b = [x + 7, y - 7, x + 9 + w, y + 7];
      if (bx.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue; bx.push(b);
      octx.lineWidth = 3; octx.strokeStyle = C.halo; octx.strokeText(q.place, x + 8, y); octx.fillStyle = C.ink; octx.fillText(q.place, x + 8, y); }
  }
}
/* v3.77 미군 해외 배치: 상주(원, DMDC 분기 통계)와 전개(함정 기호·증파▲·감축▼·법◆·계획◇와 번호). 설명과 출처는 세계 정세 탭 맨 위 카드. 부대 단위 실시간 위치는 싣지 않는다(R24) */
const manK = n => n >= 1000 ? (Math.round(n / 100) / 10) + "k" : String(n);
const USF_GL = {up: "▲", down: "▼", law: "◆", plan: "◇"};
const usfEvents = () => D.posture.events.map((e, n) => Object.assign(e, {no: n + 1}));
function usfFleet(){  /* 같은 해역의 함정은 기호 하나로 묶는다 */
  const g = {}; for (const v of D.posture.fleet.items) (g[v.g] = g[v.g] || []).push(v);
  return Object.entries(g).map(([name, vs]) => ({name, vs, lat: vs.reduce((a, v) => a + v.lat, 0) / vs.length, lon: vs.reduce((a, v) => a + v.lon, 0) / vs.length,
    cv: vs.filter(v => v.type === "cv").length, ar: vs.filter(v => v.type !== "cv").length}));
}
function layoutUsf(ctr, boxes){  /* 그릴 일과 차지할 자리를 먼저 정한다. 나라 이름은 그 자리를 피해 놓는다 */
  const P = D.posture, F = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif', z = Math.sqrt(S.k), ops = [];
  const hit = (x0, y0, x1, y1) => boxes.some(b => x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]);
  const txt = (t, x, y, col, font) => ops.push(() => { octx.font = font; octx.lineWidth = 3; octx.strokeStyle = C.halo; octx.strokeText(t, x, y); octx.fillStyle = col; octx.fillText(t, x, y); });
  const place = (t, x, y, font, dys) => { octx.font = font; const w = octx.measureText(t).width / 2 + 2;
    for (const d of dys) { const yy = y + d; if (!hit(x - w, yy - 7, x + w, yy + 7)) { boxes.push([x - w, yy - 7, x + w, yy + 7]); return yy; } } return null; };
  const at = (o, lon, lat) => { o._p = null; const ll = [lon, lat]; if (d3.geoDistance(ll, ctr) > 1.45) return null; const p = projection(ll); if (p) o._p = p; return p; };
  const res = P.res.items.filter(r => at(r, r.lon, r.lat));
  for (const r of res) { const p = r._p; r._r = (2 + Math.sqrt(r.n) / 10) * z;  /* 원 넓이 ∝ 인원 */
    ops.push(() => { octx.beginPath(); octx.arc(p[0], p[1], r._r, 0, Math.PI * 2); octx.globalAlpha = 0.18; octx.fillStyle = C.accent; octx.fill(); octx.globalAlpha = 0.9; octx.lineWidth = 1.4; octx.strokeStyle = C.accent; octx.stroke(); octx.globalAlpha = 1; }); }
  const FL = usfFleet(); D.posture._fl = FL;
  for (const g of FL) { const p = at(g, g.lon, g.lat); if (!p) continue; boxes.push([p[0] - 10, p[1] - 7, p[0] + 10, p[1] + 6]);
    ops.push(() => { octx.beginPath(); octx.moveTo(p[0] - 9, p[1] - 2); octx.lineTo(p[0] + 9, p[1] - 2); octx.lineTo(p[0] + 5.5, p[1] + 4); octx.lineTo(p[0] - 5.5, p[1] + 4); octx.closePath();
      octx.fillStyle = C.ink; octx.fill(); octx.lineWidth = 1.5; octx.strokeStyle = C.halo; octx.stroke(); octx.fillRect(p[0] + 1, p[1] - 6, 3, 4); }); }
  const EV = usfEvents();
  for (const e of EV) { const p = at(e, e.lon, e.lat); if (!p) continue; boxes.push([p[0] - 7, p[1] - 8, p[0] + 7, p[1] + 8]); }
  for (const e of EV) { if (!e._p) continue; const p = e._p, col = e.kind === "up" ? C.conflict : e.kind === "down" ? C.accent : C.ink;
    txt(USF_GL[e.kind], p[0], p[1], col, "700 15px " + F);
    const f = "800 10px " + F, t = String(e.no), w = 5; let q = null;
    for (const [dx, dy] of [[13, -7], [-13, -7], [13, 7], [-13, 7]]) if (!hit(p[0] + dx - w, p[1] + dy - 6, p[0] + dx + w, p[1] + dy + 6)) { q = [p[0] + dx, p[1] + dy]; boxes.push([q[0] - w, q[1] - 6, q[0] + w, q[1] + 6]); break; }
    if (q) txt(t, q[0], q[1], col, f); }
  for (const g of FL) { if (!g._p) continue;  /* 해역 이름 대신 항모·상륙전단 수 */
    const t = [g.cv ? g.cv + (g.cv > 1 ? " carriers" : " carrier") : "", g.ar ? g.ar + (g.ar > 1 ? " ARGs" : " ARG") : ""].filter(Boolean).join(" · "), f = "700 10px " + F, y = place(t, g._p[0], g._p[1], f, [13, -13, 25]); if (y != null) txt(t, g._p[0], y, C.ink, f); }
  for (const r of res) {  /* 큰 곳부터 이름·인원(확대하면 작은 곳도), 직전 분기보다 5% 넘게 늘거나 줄면 ▲▼ */
    if (r.n < (S.k >= 2.2 ? 500 : S.k >= 1.5 ? 3000 : 10000)) continue;
    const ch = r.prev ? (r.n - r.prev) / r.prev : 0, mk = ch >= 0.05 ? " ▲" : ch <= -0.05 ? " ▼" : "";
    const t = r.name + " " + manK(r.n) + mk, f = "700 10.5px " + F, y = place(t, r._p[0], r._p[1], f, r._r > 14 ? [0, -r._r - 7, r._r + 7] : [r._r + 7, -r._r - 7]);
    if (y != null) txt(t, r._p[0], y, C.accent, f);
  }
  return ops;
}
let needBase = true, scheduled = false, lastOver = 0, spinOnly = false;
let GLOBE_VIS = true, QUIET = 0;  /* v3.25 아래 자전 설명 참조 */
function requestDraw(all, spin){
  if (all !== false) needBase = true;
  spinOnly = scheduled ? (spinOnly && !!spin) : !!spin;
  if (scheduled) return; scheduled = true;
  requestAnimationFrame(t => { scheduled = false; if (!D) return;
    if (spinOnly && t < QUIET) { spinOnly = false; return; }  /* 누른 직후에는 자전 때문에 예약된 그리기를 건너뛴다 */
    spinOnly = false; if (needBase) { drawBase(); needBase = false; } drawOver(t); lastOver = t; });
}
/* v3.9 자전: 360°/480초, v3.25부터 250ms마다 그림. 지구본을 만지거나 국가를 고르면 멈추고, 20초 뒤 다시 돈다. 움직임 줄이기 설정이면 돌지 않는다 */
const SPIN = { on: true,  /* v3.86: 다음 방문에는 다시 돈다 */ until: 0, last: 0, dps: 360 / 480 };
function spinHold(ms){ SPIN.until = performance.now() + (ms || 20000); }
/* v3.74 화면 밀림 방지(웹 분석 CLS 0.34~0.39): 이동 뒤 2.5초에 단락 건너뛰기를 되돌리면, 되살아난 단락이 한 프레임 비었다가 다시 그려지며 읽던 글이 밀린 것으로 잡혔다. 한 번 모두 배치한 화면은 그대로 둔다(되돌리지 않음) */
function cvRestore(pn){ }
/* v3.25 단락 건너뛰기(content-visibility)를 쓰는 동안에도 칩·검색 이동이 정확한 자리에 닿도록, 이동 직전에 그 탭의 단락을 모두 배치한다(한 번 배치한 크기는 기억됨) */
(() => { const orig = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(o){ const pn = this.closest && this.closest(".pane");
    if (pn && !pn.classList.contains("cv-off")) { pn.classList.add("cv-off"); void pn.offsetHeight; clearTimeout(pn._cv); pn._cv = setTimeout(() => cvRestore(pn), 2500); }
    return orig.call(this, o); }; })();
/* v3.25 반응 속도: 지구본이 화면 밖에 있거나 내용 영역을 누른 직후(12초)에는 자전과 분쟁지 깜박임을 그리지 않는다. 지구본 그리기가 누르기 반응을 늦추던 문제 */
try { new IntersectionObserver(es => { GLOBE_VIS = es[es.length - 1].isIntersecting; }, {threshold: 0.05}).observe(document.getElementById("wrap")); } catch(e){}
const quiet = e => { if (!e.target.closest || !e.target.closest("#wrap")) { QUIET = performance.now() + 12000; spinHold(12000); } };
addEventListener("pointerdown", quiet, {capture: true, passive: true}); addEventListener("keydown", quiet, {capture: true, passive: true});
function spinActive(now){ return SPIN.on && !reduceMotion && !dragging && GLOBE_VIS && S.tab !== "detail" && now > SPIN.until && document.visibilityState === "visible"; }
function loop(){
  if (reduceMotion) return;
  const tick = t => {
    if (D && spinActive(t)) {
      const dt = SPIN.last ? Math.min(0.2, (t - SPIN.last) / 1000) : 0;
      if (t - (SPIN.drawn || 0) > 250) {  /* v3.25 0.75°/초의 느린 자전이라 초당 4번 그려도 매끄럽다(이전 15번) */ S.rot = [S.rot[0] + SPIN.dps * (t - (SPIN.drawn || t)) / 1000, S.rot[1], S.rot[2] || 0]; SPIN.drawn = t; requestDraw(true, true); }
      SPIN.last = t;
    } else { SPIN.last = 0; SPIN.drawn = 0; }
    if (D && S.showFp && GLOBE_VIS && t > QUIET && document.visibilityState === "visible" && !scheduled && t - lastOver > 33) { drawOver(t); lastOver = t; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- interaction ---------- */
function hitTest(x, y){
  if (S.showUsf && D.posture) {  /* v3.77 미군 배치 표시가 켜져 있으면 그 기호를 먼저 본다 */
    const P = D.posture, cand = [...P.events.map(o => [o, 9]), ...(P._fl || []).map(o => [o, 11]), ...P.res.items.map(o => [o, Math.max(6, o._r || 0)])];
    let best = null, bd = 1e9; for (const [o, rr] of cand) { if (!o._p) continue; const dd = Math.hypot(o._p[0] - x, o._p[1] - y); if (dd < rr && dd < bd) { bd = dd; best = o; } }
    if (best) return {usf: best};
  }
  if (S.showFp) {
    let best = null, bd = 1e9;
    for (const fp of D.flashpoints) { if (!fp._p) continue; const dd = Math.hypot(fp._p[0] - x, fp._p[1] - y); if (dd < 4 + fp.severity * 1.15 + 6 && dd < bd) { bd = dd; best = fp; } }
    if (best) return {fp:best};
  }
  proj();
  const ll = projection.invert([x, y]);
  if (!ll || !isFinite(ll[0]) || !isFinite(ll[1]) || d3.geoDistance(ll, center()) > Math.PI / 2 - 0.01) return {};
  for (let i = features.length - 1; i >= 0; i--) { const f = features[i]; if (d3.geoContains(f, ll)) return {iso:f.iso, f}; }
  return {};
}
let zoomTo = () => {};
document.addEventListener("click", e => { if (e.target.closest("#markoff")) viewRestore(); });  /* v3.79 사안·일정·나라로 지구본을 옮길 때 배율도 맞춘다(setupInteraction에서 채움) */
function setupInteraction(){
  const sel = d3.select(over);
  // wheel / pinch zoom only; one-finger or mouse drag rotates the globe freely (trackball)
  const zoom = d3.zoom().scaleExtent([0.7, 10])
    .filter(ev => ev.type === "wheel" || (ev.touches && ev.touches.length > 1))
    .on("zoom", ev => { S.k = ev.transform.k; requestDraw(); });
  sel.call(zoom).on("dblclick.zoom", null);
  sel.call(zoom.transform, d3.zoomIdentity.scale(HOME_K));
  let v0 = null, r0 = null, q0 = null;
  const drag = d3.drag().clickDistance(4)
    .filter(ev => (!ev.touches || ev.touches.length === 1) && !ev.button && !ev.ctrlKey)
    .on("start", ev => {
      proj();
      const p = projection.invert([ev.x, ev.y]);
      if (!p || !isFinite(p[0]) || d3.geoDistance(p, center()) > Math.PI / 2) { v0 = null; return; }
      v0 = versor.cartesian(p); r0 = projection.rotate(); q0 = versor(r0);
      dragging = true; hideTip();
    })
    .on("drag", ev => {
      if (!v0) return;
      const p = projection.rotate(r0).invert([ev.x, ev.y]);
      if (!p || !isFinite(p[0]) || !isFinite(p[1])) return;
      const q1 = versor.multiply(q0, versor.delta(v0, versor.cartesian(p)));
      S.rot = versor.rotation(q1); requestDraw();
    })
    .on("end", () => { v0 = null; dragging = false; });
  sel.call(drag);
  $("#zin").onclick = () => sel.transition().duration(reduceMotion ? 0 : 250).call(zoom.scaleBy, 1.5);
  $("#zout").onclick = () => sel.transition().duration(reduceMotion ? 0 : 250).call(zoom.scaleBy, 1 / 1.5);
  $("#zreset").onclick = () => { markSet(null); flyTo(-HOME[0], -HOME[1], true); sel.transition().duration(reduceMotion ? 0 : 400).call(zoom.transform, d3.zoomIdentity.scale(HOME_K)); };
  zoomTo = k => sel.transition().duration(reduceMotion ? 0 : 700).call(zoom.transform, d3.zoomIdentity.scale(k));

  let hoverRaf = 0;
  over.addEventListener("pointerdown", () => spinHold(20000));
  over.addEventListener("wheel", () => spinHold(20000), {passive:true});
  (function(){
    const b = $("#spin"); if (!b) return;
    const set = on => { SPIN.on = on; b.textContent = on ? "⏸" : "⟳"; const l = on ? "Stop globe rotation" : "Start globe rotation"; b.title = l; b.setAttribute("aria-label", l); b.setAttribute("aria-pressed", on); };
    if (reduceMotion) b.hidden = true;
    set(SPIN.on); b.onclick = () => set(!SPIN.on);
  })();
  over.addEventListener("pointermove", ev => {
    if (dragging || ev.pointerType === "touch") return;
    const r = over.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
    cancelAnimationFrame(hoverRaf);
    hoverRaf = requestAnimationFrame(() => {
      const h = hitTest(x, y);
      const hv = h.fp || h.usf ? null : (h.iso || null), hf = h.fp ? h.fp.id : null;
      if (hv !== S.hover || hf !== S.hoverFp) { const baseChanged = hv !== S.hover; S.hover = hv; S.hoverFp = hf; requestDraw(baseChanged); }
      showTip(h, x, y);
    });
  });
  over.addEventListener("pointerleave", () => { S.hover = null; S.hoverFp = null; hideTip(); requestDraw(); });
  over.addEventListener("click", ev => {
    const r = over.getBoundingClientRect(); const h = hitTest(ev.clientX - r.left, ev.clientY - r.top);
    if (h.fp) selectFp(h.fp.id, true);
    else if (h.iso && D.countries[h.iso]) selectCountry(h.iso, true, true);
  });

  $("#legend").addEventListener("click", e => { const b = e.target.closest("[data-mt]"); if (!b) return; if (b.dataset.mt === "fp") S.showFp = !S.showFp; else if (b.dataset.mt === "usf") { setUsf(!S.showUsf); if (VIEW0) VIEW0.usf = null; }  /* v3.85(2026-10-08 결재): 켜도 지구본을 옮기거나 회전을 멈추지 않는다 */ else S.showEdge = !S.showEdge; renderLegend(); requestDraw(false); });
  $("#legend").addEventListener("change", e => { if (e.target.id === "lysel") setLayer(e.target.value); });
  /* v3.43f 데스크탑: '지구본 색 기준' 상자를 접으면 왼쪽 아래 작은 '지도 표시' 단추로 바뀐다(처음엔 펼침, 접은 상태는 브라우저에 기억). 모바일: 예전처럼 단추로 열고 닫는다 */
  const legOff = off => legSet(off, true);
  if (!narrow()) $("#legbtn").setAttribute("aria-expanded", !document.documentElement.classList.contains("legoff"));
  $("#legbtn").onclick = () => { if (!narrow()) { legOff(false); return; } const L = $("#legend"), o = !L.classList.contains("open"); L.classList.toggle("open", o); $("#legbtn").setAttribute("aria-expanded", o); };
  $("#legend").addEventListener("click", e => { if (!e.target.closest("[data-legx]")) return; if (narrow()) { $("#legend").classList.remove("open"); $("#legbtn").setAttribute("aria-expanded", false); } else legOff(true); });
  $("#lensoff").onclick = () => setLens(null);
  document.querySelectorAll(".gnav [data-tab]").forEach(b => b.onclick = e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); const g = b.closest("details"); if (g) g.open = false; const t = b.dataset.tab; navMark(TAB_ALIAS[t] || t); /* v3.74 누르기 반응(웹 분석 INP 최대 672ms): 메뉴 표시를 먼저 그리고, 무거운 화면 그리기는 다음 차례로 미룬다 */ requestAnimationFrame(() => setTimeout(() => { if (t === "strat") { S.scase = null; caseMark(); } if (t === "brief" && S.bdate) { S.bdate = null; renderBrief(); } if (t === "forecast" && S.ffc) { S.ffc = null; renderForecasts(); } switchTab(t); }, 0)); });
  document.addEventListener("click", ev => {
    const ly = ev.target.closest("[data-layer]");
    if (ly) { setLayer(ly.dataset.layer); return; }
    const m = ev.target.closest("[data-mx]");
    if (m) { mxSel = m.dataset.mx.split("|"); document.querySelectorAll(".mx button.sel").forEach(x => x.classList.remove("sel")); m.classList.add("sel"); $("#dyad-box").innerHTML = dyadHtml(mxSel[0], mxSel[1]); return; }
    const qb = ev.target.closest("[data-q]");
    if (qb) { switchTab("method"); const d = document.getElementById("pq-" + qb.dataset.q); if (d) { d.open = true; d.scrollIntoView({block:"start"}); } return; }
    const fb = ev.target.closest("[data-feat]");
    if (fb) { ev.preventDefault(); goFeat(fb.dataset.feat); return; }
    const bb = ev.target.closest("[data-brief]");
    if (bb) { ev.preventDefault(); goBrief(bb.dataset.brief); return; }
    const icb = ev.target.closest("[data-indc]");  /* v3.93 산업별 영향: 나라 고르기 */
    if (icb) { INDC = icb.dataset.indc; INDOPEN = null; renderIndustry(); return; }
    const icl = ev.target.closest("[data-ind]");  /* 칸을 누르면 전개별 판단을 펼치고 다시 누르면 접는다 */
    if (icl) { const md = icl.dataset.indm || "d"; INDOPEN = INDOPEN === icl.dataset.ind && INDMODE === md ? null : icl.dataset.ind; INDMODE = md; indBoard(); if (INDOPEN) { const b = document.querySelector('[data-ind="' + CSS.escape(INDOPEN) + '"]'); detReveal(b && (b.closest(".mc,.ma,.ind-card") || b).querySelector(".ind-det")); } return; }
    const lfb = ev.target.closest("[data-life]");  /* 사람들의 삶: 누구의 삶으로 볼까 */
    if (lfb) { LIFE = lfb.dataset.life; store.set("ep.life", LIFE); const g = document.getElementById("lifegrid"), x = BR && BR.issues[0];
      if (g) g.innerHTML = (D.strategies || []).filter(c => c.hs7).map(c => lifeCard(c, x)).join("");
      const lb = document.getElementById("lifeboard"); if (lb) { lb.innerHTML = lifeRows(); fitTrends(lb); } document.querySelectorAll("[data-life]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.life === LIFE))); return; }
    const hsb = ev.target.closest("[data-hs]");  /* 시안: 세계 정세 카드 → 그 사안의 삶에 미치는 영향 */
    if (hsb) { const id = hsb.dataset.hs; goCase(id); const d = caseFill(id); if (d) d.open = true; setTimeout(() => { const t = (hsb.dataset.hsg && document.getElementById("hs7-" + id + "-" + hsb.dataset.hsg)) || document.getElementById("hs7-" + id); if (t) t.scrollIntoView({block: "start"}); }, 60); return; }
    const cs = ev.target.closest("[data-case]");
    if (cs) { goCase(cs.dataset.case, true); return; }
    const blb = ev.target.closest("[data-bloc]");
    if (blb && BR) { const [d, n] = blb.dataset.bloc.split("|"), x = BR.issues.find(z => z.date === d), it = x && x.items[+n]; if (it && it.loc) placeGo(it.loc, "Briefing · " + it.h); return; }
    const dgb = ev.target.closest("[data-dg]");  /* v3.83 정세 요약 제목 → 관련국을 지구본에 */
    if (dgb) { const g = (D.digest || [])[+dgb.dataset.dg]; if (g && (g.ids || []).length) placeGo({isos: g.ids}, "Situation summary · " + g.t); return; }
    const evb = ev.target.closest("[data-ev]");
    if (evb) { evGo(evb.dataset.ev, evb); return; }
    const fcp = ev.target.closest("[data-fc]");
    if (fcp && !fcp.closest("#fcpop")) { fcPop(fcp); if (fcp.closest("#due")) fcGo(fcp.dataset.fc); return; }
    const fcb = ev.target.closest("[data-fcgo]");
    if (fcb) { fcPopClose(); fcOpen(fcb.dataset.fcgo); return; }  /* v4.22 전망과 검증에서 보기: 전망별 화면으로 */
    const fcd = ev.target.closest("[data-fcd]");  /* v4.22 전망별 화면 열기(빈 값이면 목록) */
    if (fcd) { fcOpen(fcd.dataset.fcd); return; }
    const fcw = ev.target.closest("[data-fcw]");
    if (fcw) { S.fcw = fcw.dataset.fcw; const pn = $("#pane-forecast"), y = pn.scrollTop; renderForecasts(); pn.scrollTop = y; return; }
    const fcc = ev.target.closest("[data-fccopy]");
    if (fcc) { try { navigator.clipboard.writeText(fcc.dataset.fccopy); fcc.textContent = FCT.copied; } catch(e){} return; }
    const ff = ev.target.closest("[data-fcf]");
    if (ff) { S.fcf = ff.dataset.fcf; renderForecasts(); const a = document.getElementById("f-all"); if (a) a.scrollIntoView({block:"start"}); return; }
    const jb = ev.target.closest("[data-jump]");
    if (jb) { const t = document.getElementById(jb.dataset.jump); if (t) t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); return; }
    const x = ev.target.closest("[data-exit]");
    if (x) { const k = (D.strategies || []).find(c => c.fp === x.dataset.exit); if (k) { goCase(k.id); const fu = caseFill(k.id); if (fu) fu.open = true; } else switchTab("strat"); const d = document.getElementById("exc-" + x.dataset.exit); if (d) { d.open = true; d.scrollIntoView({block:"start"}); } return; }
    const cgb = ev.target.closest("[data-cg]");  /* v3.81 핵심 판단의 의회 변수 → 그 사안의 '의회의 쟁점' */
    if (cgb) { const [cid, i] = cgb.dataset.cg.split(":"), d = caseFill(cid); if (d) d.open = true; const t = document.getElementById("cg-" + cid + "-" + i);
      if (t) { t.open = true; t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); t.classList.add("srch-hit"); setTimeout(() => t.classList.add("fade"), 1600); setTimeout(() => t.classList.remove("srch-hit", "fade"), 3000); } return; }
    const fgo = ev.target.closest("[data-futgo]");  /* v4.32(2026-10-23 지시): 산업별 미래·국민의 삶의 전개 이름 → 그 사안의 전개 설명 */
    if (fgo) { const [cid, fid] = fgo.dataset.futgo.split(":"); goCase(cid); setTimeout(() => { const d = caseFill(cid); if (d) d.open = true; const t = document.getElementById("fut-" + cid + "-" + fid);
      if (t) { t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); t.classList.add("srch-hit"); setTimeout(() => t.classList.add("fade"), 1600); setTimeout(() => t.classList.remove("srch-hit", "fade"), 3000); } }, 80); return; }
    const fub = ev.target.closest("[data-fut]");
    if (fub) { const [cid, fid] = fub.dataset.fut.split(":"), d = caseFill(cid); if (d) d.open = true; const t = document.getElementById("fut-" + cid + "-" + fid);
      if (t) { t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); t.classList.add("srch-hit"); setTimeout(() => t.classList.add("fade"), 1600); setTimeout(() => t.classList.remove("srch-hit", "fade"), 3000); } return; }
    const fwb = ev.target.closest("[data-fw]");
    if (fwb) { switchTab("forecast"); const d = document.getElementById("fw-" + fwb.dataset.fw); if (d) { d.open = true; const sc = d.previousElementSibling && d.previousElementSibling.tagName === "P" ? d.parentElement : d; requestAnimationFrame(() => sc.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"})); } return; }
    const a = ev.target.closest("[data-iso],[data-fp],[data-lens],[data-go]");
    if (!a) return;
    if (a.dataset.iso) { const inMap = !!a.closest("#wrap"); selectCountry(a.dataset.iso, !inMap, inMap);
      if (a.dataset.sec) requestAnimationFrame(() => { const t = document.getElementById(a.dataset.sec); if (t) t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); }); }  /* v3.57 나라 쪽 특정 절로 */
    else if (a.dataset.fp) selectFp(a.dataset.fp, false);
    else if (a.dataset.lens) setLens(a.dataset.lens);
    else if (a.dataset.go) switchTab(a.dataset.go);
  });
}
function showTip(h, x, y){
  const tip = $("#tip");
  let html = "";
  if (h.usf) { const o = h.usf, P = D.posture, ymd = ymdK;
    if (o.kind) html = '<span class="m num">' + o.no + " · " + ymd(o.date) + "</span> <b>" + esc(o.t) + '</b><br><span class="m">' + esc(o.grade) + " · " + esc(o.src) + "</span>";
    else if (o.vs) html = "<b>" + esc(o.name) + "</b>" + o.vs.map(v => "<br>" + esc(v.name) + ' <span class="m">' + (v.type === "cv" ? "Carrier" : "Amphibious ready group") + " · homeport " + esc(v.home) + "</span>" + (v.note ? '<br><span class="m">' + esc(v.note) + "</span>" : "")).join("") + "<br><span class=\"m\">USNI fleet tracker · " + ymd(P.fleet.asof) + "</span>";
    else html = "<b>" + esc(o.name) + "</b> U.S. troops stationed <span class=\"num\">" + o.n.toLocaleString("ko-KR") + "</span>" + (o.prev ? "<br><span class=\"m\">Previous quarter " + o.prev.toLocaleString("ko-KR") + " · " + ((o.n - o.prev) >= 0 ? "+" : "") + (o.n - o.prev).toLocaleString("ko-KR") + "</span>" : "") + "<br><span class=\"m\">DMDC · as of " + ymd(P.res.asof) + "</span>";
  }
  else if (h.fp) html = "<b>" + esc(h.fp.name_ko) + "</b><br>" + pips(h.fp.severity) + " <span class=\"m\">Severity " + h.fp.severity + "/5</span><br><span class=\"m num\">" + esc(enDate(h.fp.last_major_event ? h.fp.last_major_event.date : "")) + "</span> " + esc(h.fp.last_major_event ? h.fp.last_major_event.text : "");
  else if (h.iso && D.countries[h.iso]) { const c = D.countries[h.iso]; html = "<b>" + esc(c.name_ko) + '</b> <span class="m">' + esc(c.region) + "</span><br>" + (S.layer === "focus" ? "Related forecasts: <span class=\"num\">" + (FCN[c.iso] || 0) + "</span>" : "Defense spending <span class=\"num\">" + fmtUsdBn(c.mil && c.mil.spend_usd_bn) + "</span>") + '<br><span class="m">' + esc(shortLeader(c.leader)) + "</span>"; }
  else if (h.f) html = "<b>" + esc(h.f.properties.name) + "</b><br><span class=\"m\">Not covered</span>";
  if (!html) return hideTip();
  tip.innerHTML = html; tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.min(W - tw - 8, x + 14) + "px";
  tip.style.top = Math.min(H - th - 8, y + 14) + "px";
}
function hideTip(){ $("#tip").hidden = true; }

function flyTo(lon, lat, exact){
  spinHold(20000);
  const c0 = center(), g0 = S.rot[2] || 0;
  const c1 = [lon, Math.max(-80, Math.min(80, exact ? lat : lat * 0.85))];
  if (reduceMotion) { S.rot = [-c1[0], -c1[1], 0]; requestDraw(); return; }
  const gi = d3.geoInterpolate(c0, c1), t0 = performance.now();
  const step = now => { const k = Math.min(1, (now - t0) / 900), e = d3.easeCubicInOut(k), c = gi(e); S.rot = [-c[0], -c[1], g0 * (1 - e)]; requestDraw(); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
/* v3.79 지도 연계(2026-10-07 결재): 사안·일정·권력 구조의 나라를 고르면 지구본이 그곳으로 간다.
   옮기기 전의 지구본(방향·배율·색 기준)을 VIEW0에 두었다가, 그 화면(탭)을 떠나면 되돌린다. 방문자가 그사이 색 기준을 직접 고르면 색 기준은 되돌리지 않는다 */
let VIEW0 = null, VIEW_CASE = null;
/* v3.82 권력 구조의 쪽들(전체·나라·결정권자)은 한 화면으로 본다. 나라 쪽과 결정권자 쪽 사이를 오가도 지구본은 그 나라에 머문다 */
const pwPath = p => /^(?:\/en)?\/power\//.test(p || ""), pwIso = p => { const m = /^(?:\/en)?\/power\/([A-Z]{3})\//.exec(p || ""); return m ? m[1] : null; };
function pwView(iso, n){  /* 처음 들어온 쪽이면 세계 지도 자료가 아직 없을 수 있으므로, 준비될 때까지 잠시 기다린다(그사이 다른 화면으로 옮기면 그만둔다) */
  if (S.tab !== "page" || !pwPath(PAGE_CUR)) return;
  if (/\/military\/$/.test(PAGE_CUR) && iso === "USA") { if (D.posture && !S.showUsf) { viewSave(); setUsf(true); renderLegend(); requestDraw(true); } return; }  /* v3.86 미국의 군 쪽을 여는 동안 지구본은 미군 해외 배치를 보인다(떠나면 되돌린다) */
  if (byIso[iso] && labelPos[iso]) countryView(iso); else if (n < 40) setTimeout(() => pwView(iso, n + 1), 250);
}
const viewKey = () => S.tab + (S.tab === "page" ? "|" + (pwPath(PAGE_CUR) ? "power" + (/\/military\/$/.test(PAGE_CUR) ? "-mil" : "") : PAGE_CUR) : "");
/* v3.86(2026-10-08 결재): 미군 배치는 세계 정세를 겹쳐 보는 표시가 아니라 한 행위자(미국)의 눈으로 지구본을 바꿔 보는 '보기'다.
   켜면 관계선·분쟁지 스위치를 끄고(방문자가 다시 켜면 함께 그린다), 끄면 켜기 전 상태로 되돌린다(군사력 보기에서는 분쟁지를 남긴다) */
function setUsf(on){
  if (!!on === S.showUsf) return;
  S.showUsf = !!on;
  if (on) { S._preUsf = {edge: S.showEdge, fp: S.showFp}; S.showEdge = false; if (S.layer !== "mil") S.showFp = false; }
  else if (S._preUsf) { S.showEdge = S._preUsf.edge; S.showFp = S._preUsf.fp; S._preUsf = null; }
}
function viewSave(){ if (!VIEW0) VIEW0 = {rot: S.rot.slice(), k: S.k, layer: S.layer, usf: S.showUsf, key: viewKey()}; else VIEW0.key = viewKey(); }
function viewGo(lon, lat, k, shift){
  viewSave();
  /* 데스크톱에서 범례가 펼쳐져 있으면 지구본 가운데가 범례에 가리므로, 표시할 곳이 범례 오른쪽 위에 오도록 중심을 옮긴다(사안 지도는 이미 그렇게 맞춘 중심을 씀) */
  if (shift && !narrow() && W > 0 && !document.documentElement.classList.contains("legoff")) {
    const t = d3.geoOrthographic().translate([W / 2, H / 2]).scale(R0 * k).rotate([-lon, -lat, 0]).clipAngle(90), c = t.invert([W / 2 - W * 0.16, H / 2 + H * 0.08]);
    if (c && isFinite(c[0]) && isFinite(c[1])) { lon = c[0]; lat = c[1]; }
  }
  flyTo(lon, lat, true); zoomTo(k); spinHold(36e5);
}
function viewRestore(){
  const v = VIEW0; VIEW0 = null; VIEW_CASE = null; markSet(null); if (!v) return;
  if (v.layer && v.layer !== S.layer) setLayer(v.layer, true);
  if (v.usf != null && v.usf !== S.showUsf) { setUsf(v.usf); renderLegend(); }  /* 사안 화면에서 저절로 켠 미군 배치는 끈다(방문자가 직접 켜고 끈 것은 그대로) */
  flyTo(-v.rot[0], -v.rot[1], true); zoomTo(v.k); spinHold(20000);
}
/* 나라(들)를 한눈에 보는 중심과 배율: 한 나라는 넓이로, 여러 나라는 서로 떨어진 거리로 */
function isoView(isos){
  isos = isos.filter(i => byIso[i] && labelPos[i]); if (!isos.length) return null;
  if (isos.length === 1) { const p = labelPos[isos[0]]; return [p[0], p[1], Math.max(1.3, Math.min(3.6, 0.9 / Math.sqrt(d3.geoArea(byIso[isos[0]]))))]; }
  const c = d3.geoCentroid({type: "MultiPoint", coordinates: isos.map(i => labelPos[i])}); let dm = 0;
  for (const a of isos) for (const b of isos) dm = Math.max(dm, d3.geoDistance(labelPos[a], labelPos[b]));
  /* v4.31(2026-10-23 결재): 멀리 떨어진 나라가 섞이면(이란·미국처럼 대양 한가운데가 나오는 경우) 가장 작은 나라를 중심에 두고,
     그 나라에서 약 3,000km 안에 국경이 있는 나라까지만 함께 보인다. 나머지 나라는 색 표시만 남는다(markSet은 그대로 모든 나라) */
  if (dm > 0.8) {
    const s = isos.slice().sort((a, b) => d3.geoArea(byIso[a]) - d3.geoArea(byIso[b]))[0], p0 = labelPos[s];
    const near = iso => { let best = null, bd = 9; const walk = x => { if (typeof x[0] === "number") { const d = d3.geoDistance(p0, x); if (d < bd) { bd = d; best = x; } } else x.forEach(walk); };
      walk(byIso[iso].geometry.coordinates); if (bd >= 0.47) return null; return d3.geoDistance(p0, labelPos[iso]) < 0.47 ? labelPos[iso] : best; };  /* 이웃 나라의 가운데가 가까우면 그 나라 전체를, 멀면(러시아처럼 큰 나라) 가까운 국경 쪽만 */
    const pts = [p0].concat(isos.filter(i => i !== s).map(near).filter(Boolean));
    if (pts.length === 1) return isoView([s]);
    const cc = d3.geoCentroid({type: "MultiPoint", coordinates: pts}); let d = 0;
    for (const a of pts) for (const b of pts) d = Math.max(d, d3.geoDistance(a, b));
    return [cc[0], cc[1], Math.max(1.3, Math.min(3, 1.6 / Math.max(d, 0.01)))];
  }
  const lat = dm > 1.2 ? isos.reduce((a, i) => a + labelPos[i][1], 0) / isos.length : c[1];  /* 멀리 떨어진 나라들(미국·중국)은 극지방 위가 아니라 두 나라 위도의 평균에서 본다 */
  return [c[0], lat, Math.max(1, Math.min(3, 1.6 / Math.max(dm, 0.01)))];
}
/* 사안을 고르면(읽는 위치가 그 사안으로 옮겨 가도) 그 사안의 지도(D.strategies[].map)로 */
function caseView(id){
  if (S.tab !== "strat" || !id || id === VIEW_CASE) return;
  const c = (D.strategies || []).find(x => x.id === id), m = c && c.map; if (!m) return;
  VIEW_CASE = id; markSet(null);
  if (m.home) viewGo(-HOME[0], -HOME[1], HOME_K); else viewGo(m.lon, m.lat, m.k);
  if (m.layer && m.layer !== S.layer) setLayer(m.layer, true);
  const usf = m.layer === "mil" && !!D.posture;  /* v3.79b(2026-10-08 결재): 분쟁 사안은 해외 주둔 미군도 함께 보인다 */
  if (VIEW0 && VIEW0.usf != null && usf !== S.showUsf) { setUsf(usf); renderLegend(); requestDraw(true); }
}
/* 지구본에 표시하는 장소·나라(일정, 권력 구조의 나라). label이 있으면 지구본 위 띠에 이름과 '표시 해제'를 보인다 */
function markSet(m){
  S.mark = m || null; const b = document.getElementById("markbar");
  if (b) { b.hidden = !(m && m.label); if (m && m.label) document.getElementById("markname").textContent = m.label; }
  requestDraw(true);
}
function evGo(id, chip){
  const e = (D.events || []).find(x => x.id === id); if (!e) return;
  evPop(chip, e); placeGo(e.loc || {}, "Event · " + e.t);
}
/* 장소(도시·분쟁지의 점)가 있으면 그곳을, 없으면 관련국을 보인다. 스마트폰에서는 지도 쪽으로 올라가고 '이전 화면'으로 돌아온다 */
function placeGo(L, label){
  const isos = L.isos || [], v = L.lon != null ? [L.lon, L.lat, 3.2] : isoView(isos); if (!v) return;
  if (narrow()) navPush();
  viewGo(v[0], v[1], v[2], true);
  markSet({lon: L.lon, lat: L.lat, place: L.place, isos, label});
  if (narrow()) document.getElementById("wrap").scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"});
}
/* v3.79c '다가오는 일정'의 전망: 전망에 연결된 분쟁지의 위치(경제·외교 전망은 결정하는 나라) */
function fcGo(id){
  const F = D.forecasts.find(f => f.id === id); if (!F) return;
  const fp = !F.loc && F.fp && D.flashpoints.find(x => x.id === F.fp);
  placeGo(F.loc || (fp ? {lon: fp.lon, lat: fp.lat, place: fp.name_ko, isos: F.countries || []} : {isos: F.countries || []}), "Forecast · " + (F.s || F.q));
}
function evPop(chip, e){
  if (FCP && FCP.dataset.for === "ev:" + e.id) { fcPopClose(); return; }
  fcPopClose();
  const L = e.loc || {}, cs = (D.strategies || []).filter(c => (e.cases || []).includes(c.id)).map(c => c.title.split(":")[0]);
  const where = L.place || (L.isos || []).map(i => (D.countries[i] || {}).name_ko).filter(Boolean).join(" · ");
  const el = document.createElement("div"); el.id = "fcpop"; el.dataset.for = "ev:" + e.id; el.setAttribute("role", "dialog");
  el.innerHTML = "<div class=\"fcp-h\">Event · " + esc(evDate(e)) + "<button type=\"button\" class=\"fcp-x\" aria-label=\"Close\">×</button></div><p>" + esc(e.t) + "</p>" +
    (where ? '<p class="fcp-d">' + (L.place ? "Location: " : "Countries: ") + esc(where) + "</p>" : "") + (cs.length ? "<p class=\"fcp-d\">Related issues · " + esc(cs.join(" · ")) + "</p>" : "");
  document.body.appendChild(el); FCP = el;
  const r = chip.getBoundingClientRect(), w = Math.min(340, innerWidth - 24), h = el.offsetHeight;
  el.style.width = w + "px"; el.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + "px";
  el.style.top = (r.bottom + 8 + h > innerHeight && r.top - 8 - h > 0 ? r.top - 8 - el.offsetHeight : r.bottom + 8) + "px";
  el.querySelector(".fcp-x").onclick = fcPopClose;
}
/* 권력 구조의 나라 단추: 그 나라 글로 내려가며 지구본도 그 나라를 확대한다 */
function countryView(iso){ const v = isoView([iso]); if (!v) return; viewGo(v[0], v[1], v[2], true); markSet({isos: [iso]}); }
function setLayer(l, temp){
  if (!LAYERS[l]) return;
  S.layer = l; if (!temp) { if (VIEW0) VIEW0.layer = null; }  /* 방문자가 직접 고르면 사안 화면을 떠날 때도 그 선택을 둔다. v3.86: 다음 방문에는 기본 상태로 연다 */
  document.querySelectorAll("[data-layer]").forEach(b => { const on = b.dataset.layer === l; b.setAttribute("aria-checked", on); b.classList.toggle("on", on); });
  renderLegend(); requestDraw(true);
  const sb = document.getElementById("scorebox"); if (sb && D) sb.innerHTML = scoreBoxHtml();
}
function setLens(id){
  if (!id || (S.lens && S.lens.id === id)) S.lens = null;
  else { const t = D.thinkers.find(x => x.id === id); S.lens = {id, set:new Set(t.lens), fpAll:t.lens_fp === "all", off:t.lens_off || []}; }
  $("#lensbar").hidden = !S.lens;
  if (S.lens) $("#lensname").textContent = "Lens · " + LENS_NAME[S.lens.id];
  document.querySelectorAll("#offmap [data-iso]").forEach(b => b.classList.toggle("on", !!(S.lens && S.lens.off.includes(b.dataset.iso))));
  document.querySelectorAll(".lens-btn[data-lens]").forEach(b => { const on = !!(S.lens && S.lens.id === b.dataset.lens); b.setAttribute("aria-pressed", on); if (b.dataset.kind === "shelf") b.textContent = on ? "Turn off lens" : "View on globe · " + LENS_NAME[b.dataset.lens]; });
  requestDraw(true);
}
function selectCountry(iso, fly, fromMap){
  if (!D.countries[iso]) return;
  navPush();
  if (S.tab !== "detail") S.prevTab = S.tab;
  S.sel = iso; S.selFp = null;
  renderDetail(); switchTab("detail");
  if (fly && byIso[iso]) { const p = labelPos[iso]; flyTo(p[0], p[1]); }
  requestDraw(true);
  if (narrow() && fromMap) $("#panel").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"});
}
function selectFp(id, fromMap){
  const fp = D.flashpoints.find(f => f.id === id); if (!fp) return;
  navPush();
  if (S.tab !== "detail") S.prevTab = S.tab;
  S.selFp = id; S.sel = null;
  renderDetail(); switchTab("detail");
  flyTo(fp.lon, fp.lat); requestDraw(true);
  if (narrow() && fromMap) $("#panel").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"});
}
/* v3.42 사이트 메뉴의 현재 위치 표시(사안 화면·나라 화면은 '세계 정세'·'전략 분석' 아래로 본다) */
function navMark(t){
  const k = t === "detail" || t === "region" || (t === "brief" && S.bdate) ? "overview" : t === "page" ? ((LOC().match(/^\/(leader|power|guide|brief|about)/) || [])[1] || "") : t;
  document.querySelectorAll(".gnav [data-tab],.gnav [data-nav]").forEach(a => { if ((a.dataset.tab || a.dataset.nav) === k) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const g = document.querySelector(".gmore"); if (g) g.classList.toggle("cur", !!g.querySelector("[aria-current]"));
}
document.addEventListener("click", e => { const g = document.querySelector(".gmore[open]"); if (g && !g.contains(e.target)) g.open = false; });
/* v3.43e 메뉴 한 줄 맞추기와 '더 보기' 목록 화면 안에 두기 */
function gnavFit(){
  const n = document.querySelector(".gnav"); if (!n) return;
  n.classList.remove("t1", "t2"); if (innerWidth > 960) return;
  const wrapped = () => { const it = [...n.children].filter(e => e.offsetParent && !e.classList.contains("wide-btn")); return it.length && it.some(e => Math.abs(e.offsetTop - it[0].offsetTop) > 4); };
  if (wrapped()) { n.classList.add("t1"); if (wrapped()) n.classList.add("t2"); }
}
gnavFit(); addEventListener("resize", gnavFit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(gnavFit);
(function(){ const g = document.querySelector(".gmore"); if (!g) return;
  g.addEventListener("toggle", () => { const m = g.querySelector(".gmore-m"); if (!m) return; m.style.transform = ""; if (!g.open) return;
    const r = m.getBoundingClientRect(), pad = 8; let dx = 0;
    if (r.right > innerWidth - pad) dx = innerWidth - pad - r.right; if (r.left + dx < pad) dx = pad - r.left;
    if (dx) m.style.transform = "translateX(" + Math.round(dx) + "px)"; }); })();
function switchTab(t){
  t = TAB_ALIAS[t] || t;
  if (t !== "region" && S.zone) zoneOff();  /* v4.38 */
  if (t === "method" && typeof infoLoad === "function") { if (!S.info) S.info = "method"; setTimeout(() => { infoLoad("guide"); infoLoad("about"); }, 0); }
  if (!document.getElementById("pane-" + t)) t = "overview";
  S.tab = t; if (t !== "detail") store.set("ep.tab", t);
  ensureRendered(t);
  navMark(t);
  document.querySelectorAll(".pane").forEach(p => p.hidden = p.id !== "pane-" + t);
  document.getElementById("pane-" + t).scrollTop = 0;
}
function renderLegend(){
  if (!C.mil) return;  /* v4.36b: 판단 점수 층을 내린 뒤 C.risk가 없어 범례가 비던 오류(E68) */
  const L = LAYERS[S.layer], stops = (S.layer === "mil" ? [.25, .44, .63, .81, 1] : [0, .25, .5, .75, 1]).map(v => C[S.layer](v)).join(",");
  const line = (col, dash, w) => { w = w || 26; return '<svg width="' + w + '" height="8" aria-hidden="true"><line x1="1" y1="4" x2="' + (w - 1) + '" y2="4" stroke="' + col + '" stroke-width="2"' + (dash ? ' stroke-dasharray="5 4"' : "") + "/></svg>"; };
  const tk = "<span>Fewer</span><span></span><span>More</span>";
  const sw = (k, on, body) => '<button type="button" class="mt" data-mt="' + k + '" aria-pressed="' + on + '"><span class="sw" aria-hidden="true"></span>' + body + "</button>";
  $("#legend").classList.toggle("usfon", !!(S.showUsf && D && D.posture));
  const lbn = document.getElementById("legbtn");  /* v4.38c 접힌 범례 단추에도 최소 범례(권역 단추처럼 현재 값을 보인다) */
  if (lbn) lbn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 3 2.5 7 10 11l7.5-4L10 3Z"/><path d="m2.5 10.5 7.5 4 7.5-4"/><path d="m2.5 14 7.5 4 7.5-4"/></svg>' + "Map layers" + '<span class="lgm"><i style="background:linear-gradient(90deg,' + stops + ')"></i>' + esc(L.label) + "</span>";
  $("#legend").innerHTML = "<button type=\"button\" class=\"legx\" data-legx aria-label=\"Collapse\" title=\"Collapse\">×</button>" +
    "<div><label class=\"lt\" for=\"lysel\">Color the globe by</label><select id=\"lysel\">" + Object.keys(LAYERS).map(k => '<option value="' + k + '"' + (k === S.layer ? " selected" : "") + ">" + LAYERS[k].label + "</option>").join("") + '</select><div class="ld">' + L.desc + "</div></div>" +
    '<div class="ramp" style="background:linear-gradient(90deg,' + stops + ')"></div><div class="ticks">' + tk + "</div>" +
    '<div class="kk"><svg width="20" height="10" aria-hidden="true"><rect x="1" y="1" width="18" height="8" rx="1" fill="' + C.landOut + '" stroke="' + C.line + '"/></svg>' + (S.layer === "mil" ? "Outside scope · no spending data" : "Outside scope") + "</div>" +
    "<div class=\"keys\"><div class=\"lt\">Show or hide</div>" +
      sw("edge", S.showEdge, '<span class="kk2"><span class="kk">' + line(C.coop, false, 18) + "Cooperation/alliance</span><span class=\"kk\">" + line(C.conflict, true, 18) + "Confrontation/clashes</span></span>") +
      sw("fp", S.showFp, '<span class="kk"><svg width="26" height="12" aria-hidden="true"><circle cx="13" cy="6" r="5" fill="' + C.conflict + '" stroke="' + C.halo + "\" stroke-width=\"1.5\"/></svg>Flashpoints (size = severity)</span>") +
    "</div>" + (D && D.posture ? "<div class=\"actv\"><div class=\"lt\">Military deployments</div><button type=\"button\" class=\"av\" data-mt=\"usf\" aria-pressed=\"" + S.showUsf + "\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\"><circle cx=\"8\" cy=\"8\" r=\"6.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"/><circle cx=\"8\" cy=\"8\" r=\"2.4\" fill=\"currentColor\"/></svg><span>U.S. forces abroad</span><span class=\"avs\">" + (S.showUsf ? "On · turn off" : "Turn on") + '</span></button>' +
      "<div class=\"ld\">Turning this on hides relationship lines and flashpoints.</div>" + (S.showUsf ? usfLegend() : "") + "</div>" : "");
}
/* v3.77 미군 해외 배치: 범례에는 기호 설명만. v3.86부터 자료와 출처는 권력 구조 > 미국 > 군 쪽(usfParts) */
const SHIP_SVG = c => '<svg width="16" height="10" aria-hidden="true" style="vertical-align:-1px"><path d="M1 3H15L12 9H4Z" fill="' + c + '"/><rect x="8" y="0" width="3" height="3" fill="' + c + '"/></svg>';
function usfLegend(){
  return '<div class="usf ld"><span><b style="color:' + C.accent + "\">○</b> Stationed troops</span><span>" + SHIP_SVG(C.ink) + " Carriers, amphibious groups</span><span><b style=\"color:" + C.conflict + "\">▲</b> Buildup</span><span><b style=\"color:" + C.accent + "\">▼</b> Drawdown</span><span>◆ Law</span><span>◇ Plan</span>" +
    "<a class=\"chip\" href=\"/en/power/USA/military/\" data-usfgo>U.S. armed forces · data and sources →</a></div>";
}
const ymdK = s => { const a = s.split("-"), M = ["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."][+a[1] - 1]; return a[2] ? M + " " + (+a[2]) + ", " + a[0] : M + " " + a[0]; };
/* v3.86(2026-10-08 결재) 미국의 군 쪽(/power/USA/military/)의 '배치'와 '태세 변화'를 data/posture.json으로 채운다 */
function usfParts(){
  const P = D.posture, R = P.res, sh = R.shares, a = sh[0], z = sh[sh.length - 1], q = ymdK;
  const spark = k => { const v = sh.map(x => x[k]), mn = Math.min(...v), mx = Math.max(...v), r = (mx - mn) || 1;
    return '<svg width="64" height="18" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.5" points="' + v.map((y, n) => (2 + n * 12) + "," + (16 - (y - mn) / r * 14).toFixed(1)).join(" ") + '"/></svg>'; };
  const row = (k, lab) => '<tr><th>' + lab + '</th><td class="bar" style="background-size:' + z[k] + '% 8px"></td><td class="num">' + z[k].toFixed(1) + '%</td><td class="sp">' + spark(k) + '</td><td class="num m">' + a[k].toFixed(1) + "% → " + z[k].toFixed(1) + "%</td></tr>";
  const top = R.items.slice(0, 8).map(r => { const d = r.prev ? r.n - r.prev : 0; return "<li><b>" + esc(r.name) + '</b> <span class="num">' + r.n.toLocaleString("ko-KR") + "</span> <span class=\"m num\">" + (d >= 0 ? "+" : "") + d.toLocaleString("ko-KR") + "</span></li>"; }).join("");
  const lk = e => { const c = e.case && (D.strategies || []).find(x => x.id === e.case), fp = e.fp && D.flashpoints.find(x => x.id === e.fp);
    const h = (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + '">' + esc(c.title.split(":")[0]) + "</button>" : "") +
      (e.fc || []).map(id => { const F = D.forecasts.find(f => f.id === id && f.status === "open"); return F ? '<button type="button" class="fcchip" data-fc="' + esc(id) + '" title="' + esc(F.q) + '">' + fcLab(F, id, F.p) + "</button>" : ""; }).join("") +
      (fp ? '<button type="button" class="chip" data-fp="' + esc(fp.id) + '">' + esc(fp.name_ko) + "</button>" : "");
    return h ? '<div class="ml-l">' + h + "</div>" : ""; };
  const ev = usfEvents().slice().reverse().map(e => '<li><span class="usf-g usf-' + e.kind + '">' + USF_GL[e.kind] + e.no + '</span><span class="m num">' + ymdK(e.date) + "</span> " + esc(e.t) + ' <span class="grade">' + esc(e.grade) + "</span> " + (e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener" class="m">' + esc(e.src) + "</a>" : '<span class="m">' + esc(e.src) + "</span>") + lk(e) + "</li>").join("");
  const fl = usfFleet().map(g => "<li><b>" + esc(g.name) + "</b> " + g.vs.map(v => esc(v.name) + (v.fwd ? "<span class=\"m\"> (homeport " + esc(v.home) + ")</span>" : "")).join(", ") + "</li>").join("");
  return {
    deploy: "<div class=\"usf-card\"><p class=\"note\">While this page is open, the globe shows U.S. forces abroad. Circles are permanently stationed troops, ship symbols are carriers and amphibious ready groups, and numbered symbols are the buildups, drawdowns, laws and plans listed under posture changes below.</p>" +
      "<h4>Share of stationed troops by region</h4><p class=\"m\">U.S. troops stationed abroad: " + R.total.toLocaleString("ko-KR") + " (as of " + ymdK(R.asof) + "), " + q(a.q) + " to " + q(z.q) + ", 6 quarters</p>" +
      '<table class="usf-t">' + row("ip", "Indo-Pacific") + row("eu", "Europe") + row("me", "Middle East") + "</table>" +
      '<p class="m">' + esc(R.note) + "</p>" +
      "<h4>Largest stationed contingents</h4><ul class=\"usf-top\">" + top + "</ul><p class=\"m\">The second figure is the change from the previous quarter (" + q(sh[sh.length - 2].q) + ")</p>" +
      "<h4>Carriers and amphibious groups</h4><ul class=\"usf-top\">" + fl + '</ul>' +
      "<p class=\"m\">Sources: <a href=\"" + esc(R.url) + "\" target=\"_blank\" rel=\"noopener\">Defense Manpower Data Center (DMDC)</a> quarterly statistics · <a href=\"" + esc(P.fleet.url) + "\" target=\"_blank\" rel=\"noopener\">USNI News Fleet Tracker</a> " + ymdK(P.fleet.asof) + " · Ship positions are approximate sea areas based on public information. Ship positions and posture changes are updated weekly; stationed troop numbers are updated each quarter when the Pentagon releases new figures.</p></div>",
    changes: '<div class="usf-card"><ul class="usf-ev">' + ev + "</ul><p class=\"m\">Grades: Official (government announcement), Law (statute), Secondary (government confirmation relayed by an analytical institution), Reported (press reports, including those citing anonymous officials). Numbers match the symbols on the globe.</p></div>"
  };
}
function usfFill(){  /* 미국의 군 쪽이 글 칸에 있으면 배치·태세 변화 칸을 채운다 */
  const a = document.getElementById("usf-deploy"), b = document.getElementById("usf-changes");
  if (!D || !(a || b) || (a && a.dataset.done)) return;
  if (!D.posture) { [a, b].forEach(x => { if (x) x.textContent = "Could not load U.S. deployment data. Please refresh the page."; }); return; }
  const x = usfParts(); if (a) { a.innerHTML = x.deploy; a.dataset.done = 1; } if (b) b.innerHTML = x.changes;
}
/* v4.08 (English): one-line summary above the Industry Outlook and People's Lives charts, and the subject phrase of each key judgment. Fixed sentence frames; only the dot counts change */
const oB = (k, t) => '<b class="o-' + k + '">' + t + "</b>";
const enList = L => L.length < 2 ? L[0] : L.slice(0, -1).join(", ") + " and " + L[L.length - 1];
function oneInd(name, n, I){
  const G = n.better, K = n.big, B = n.big + n.worse, S = n.same, sj = oB("s", esc(name) + ":"), par = K ? " (" + (K === B ? "all of them" : K) + " by more than 30% or into a loss)" : "";
  let t;
  if (!G && !B) t = sj + " profits stay in line with trend in all 100 futures through 2030.";
  else { t = sj + " profits " + (G >= B ? oB("g", "beat the trend by more than 10% in " + G + " of 100 futures") + " through 2030" + (B ? " and " + oB("w", "fall short by more than 10% in " + B) + par : " and never fall short by more than 10%")
      : oB("w", "fall short of the trend by more than 10% in " + B + " of 100 futures") + " through 2030" + par + (G ? " and " + oB("g", "beat it by more than 10% in " + G) : " and never beat it by more than 10%")) + ".";
    if (S) t += " In " + S + ", they stay in line with trend."; }
  return '<p class="one"><small>All five issues combined</small>' + t + (I ? indKeys(I) : "") + "</p>";
}
function oneLife(name, n){
  const G = n.better, K = n.big, B = n.big + n.worse, S = n.same, sj = oB("s", esc(name) + ":"), par = K ? " (" + (K === B ? "all of them much worse" : "much worse in " + K) + ")" : "";
  let t;
  if (!G && !B) t = sj + " life stays about the same as today in all 100 futures through 2030.";
  else { t = sj + " life is " + (B >= G ? oB("w", "worse than today in " + B + " of 100 futures") + " through 2030" + par + (G ? " and " + oB("g", "better in " + G) : " and better in none")
      : oB("g", "better than today in " + G + " of 100 futures") + " through 2030" + (B ? " and " + oB("w", "worse in " + B) + par : " and worse in none")) + ".";
    if (S) t += " In " + S + ", it is about the same."; }
  return '<p class="one"><small>All five issues combined</small>' + t + "</p>";
}
function oneMain(pr){  /* people directly involved differ by issue, so they can't be combined: show who fares worst and best side by side */
  const a = pr.map(([c, G]) => { const n = hsCount(c.hs7, G, "p"); return [G.name, n.big + n.worse]; });
  const hi = Math.max(...a.map(x => x[1])), lo = Math.min(...a.map(x => x[1])), nm = v => a.filter(x => x[1] === v).map(x => x[0]);
  const t = hi === lo ? "For the people directly involved in every issue, life is worse than today in " + oB("w", hi + " of 100 futures") + " through 2030."
    : "Across 100 futures through 2030, life is worse than today most often for " + oB("s", esc(enList(nm(hi)))) + " (" + oB("w", hi + " of 100") + ")" + (lo ? " and least often for " + oB("s", esc(enList(nm(lo)))) + " (" + oB("w", String(lo)) + ")." : ", while " + oB("s", esc(enList(nm(lo)))) + " are never worse off.");
  return '<p class="one">' + t + "</p>";
}
const INS_SUBJ = ["For South Korea, a risk as real as war", "What North Korea wants most out of negotiations", "South Korea's troop shortage around 2040", "A ceasefire on the current front line in the Russia-Ukraine war", "The course of events in the Taiwan Strait", "Iran", "A permanent U.S. military presence"];
function insHead(h){ const s = INS_SUBJ.find(p => String(h).indexOf(p) === 0); return s ? oB("s", esc(s)) + esc(String(h).slice(s.length)) : esc(h); }
function indKeys(I){  /* v4.12 (English): the scenario that cuts / lifts the industry's profits most (likelihood × size) */
  const all = []; IND.cases.forEach(c => c.scen.forEach(s => { const z = (IND.cells[I.k][c.id] || {})[s.id]; if (z && Math.abs(z.x) >= 0.03) all.push({c, s, x: z.x, e: s.p * Math.abs(z.x)}); }));
  const pick = (f, big) => all.filter(o => f(o) && (!big || Math.abs(o.x) > 0.10)).sort((a, b) => b.e - a.e)[0];
  const dn = pick(o => o.x < 0, 1) || pick(o => o.x < 0), up = pick(o => o.x > 0, 1) || pick(o => o.x > 0);
  const lab = o => esc(IND_SHORT[o.c.id] || o.c.title) + ", “" + esc(o.s.name) + "” (" + o.s.p + " of 100 futures)";
  return '<span class="ok"><i class="ok-w">Downside driver</i>' + (dn ? lab(dn) + ": profits about " + Math.round(-dn.x * 100) + " percent below trend." : "No scenario cuts profits by more than 3 percent.") + "</span>" +
    '<span class="ok"><i class="ok-g">Upside driver</i>' + (up ? lab(up) + ": profits about " + Math.round(up.x * 100) + " percent above trend." : "No scenario lifts profits by more than 3 percent.") + "</span>";
}
const IND_GRP = {a: ["Industries whose profits change sharply depending on how the conflicts turn out", "Industries whose profits rise more than 10 percent above trend in at least one scenario."],
  b: ["Industries for which the conflicts are mainly a risk", "Some scenarios cut profits sharply, but none lift them sharply. The industry's own growth is already in the baseline; the conflicts act only as risks that could knock it off that path."],
  c: ["Industries little affected by these conflicts", "In fewer than 5 of 100 futures do profits move more than 10 percent from trend."], open: "Show the charts",
  note: "The downside and upside drivers are, among scenarios that move profits more than 10 percent from trend, the ones with the largest likelihood times size of change. If there are none, they are chosen from scenarios that move profits more than 3 percent."};
function indGrp(I){ if (IND.cases.some(c => c.scen.some(s => ((IND.cells[I.k][c.id] || {})[s.id] || {}).c === "better"))) return "a";
  const n = cmbCount("ind|" + I.k, BR.issues[0].date); return n.big + n.worse + n.better < 5 ? "c" : "b"; }
function indGrpWrap(L, f){
  return ["a", "b", "c"].map(g => { const M = L.filter(x => indGrp(x[0]) === g); if (!M.length) return "";
    const h = '<h3 class="ind-gh">' + IND_GRP[g][0] + '</h3><p class="ind-gd">' + (g === "c" ? esc(enList(M.map(x => x[0].name))) + ". " : "") + IND_GRP[g][1] + "</p>";
    return '<section class="ind-g ind-g-' + g + '">' + h + (g === "c" ? '<details class="ind-small"><summary>' + IND_GRP.open + "</summary>" + M.map(f).join("") + "</details>" : M.map(f).join("")) + "</section>"; }).join("");
}
const IND_TXT = {  /* v4.13 (English): Industry Outlook reframed as how much the conflicts shake each industry's profits */
  h2: "How much will five conflicts shake industry profits?",
  lead: "<b>Where, and by how much, five conflicts could move industry profits through 2030.</b> The baseline is the profit path each industry follows if every conflict stays as it is today; growth unrelated to the conflicts is already in that baseline. Each dot is one way a conflict could unfold, and larger dots are more likely. Dots clustered near zero mean the conflicts barely change the industry's path. Select a row to see the reasoning for each scenario. Dot positions and sizes are Clisa Geopolitics' judgment estimates.",
  size: "Dot size = likelihood of the scenario", band: "Gray band = in line with trend (±10%)",
  of: p => p + " of 100 futures", chg: x => "profits " + indPct(x)};

function insightsHtml(){
  const cs = D.strategies || [];
  return (D.insights || []).length ? "<section class=\"sec\" id=\"s-ins\"><h3>Key assessments " + ttsBtn("ins") + "</h3><p class=\"note\" style=\"margin-bottom:8px\">Listed first are the assessments in which Clisa Geopolitics reaches conclusions that differ from the conventional view. Select a chip to see the forecasts tied to an assessment, or the button below to go to the analysis of that issue.</p><ol class=\"ic-list\">" + D.insights.map((k, n) => { const c = cs.find(x => x.id === k.case); const m = enHead(k.t); const head = m ? m[1] : k.t, rest = m ? m[2] : "";
      return '<li class="ic ic-' + esc(k.case) + '"><div class="ic-top"><span class="ic-n">' + (n + 1) + '</span>' + (c ? '<span class="ic-case">' + esc(c.title.split(":")[0]) + "</span>" : "") + (k.fc || []).map(id => { const F = D.forecasts.find(f => f.id === id); return '<button type="button" class="fcchip" data-fc="' + esc(id) + '" title="' + esc(F ? F.q : "") + '">' + fcLab(F, id, F ? F.p : null) + "</button>"; }).join("") + '</div><p class="ic-h">' + insHead(head) + "</p>" +
        (rest ? "<p class=\"ic-why\"><b>Reasoning</b> " + esc(rest) + "</p>" : "") + (c || k.feature ? '<div class="chips" style="margin:0">' + (k.feature ? FEATS().filter(F => F.id === k.feature).map(featBtn).join("") : "") + (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + "\">View analysis · " + esc(c.title.split(":")[0]) + "</button>" : "") + "</div>" : "") + "</li>"; }).join("") + "</ol></section>" : "";
}
/* v3.20 정세 브리핑: data/daily.json(평일 갱신)을 따로 읽는다. 없으면 아무것도 보이지 않는다. */
let BR = null; const HASH0 = location.hash;
const PIN = '<svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M5 0a5 5 0 0 0-5 5c0 3.6 5 7 5 7s5-3.4 5-7a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg>';  /* v3.83 위치 아이콘: 누르면 지구본이 그곳을 보이는 이름 끝에 붙인다(2026-10-08 결재) */
const FCE = {up:["↑","Factors raising the probability"], down:["↓","Factors lowering the probability"], none:["–","No change"]};
/* v4.38d(2026-10-27 결재): 브리핑의 전망 칩 앞면에 현재 확률·짧은 이름·검증 시점, 맨 끝에 이 사건의 방향(↑↓–)을 떼어 둔다 */
const FCDUE_W = "due|-|".split("|");
const fcDueS = d => "due " + enDate(d, String(d).slice(0, 4) === String(new Date().getFullYear()));
function fcChip(f){
  const F = D.forecasts.find(z => z.id === f.id), e = FCE[f.e] || FCE.none, st = F && {yes: "Resolved yes", no: "Resolved no", void: "Voided"}[F.status];
  return '<button type="button" class="fcchip bfc bfc-' + esc(f.e) + '" data-fc="' + esc(f.id) + '" title="' + esc((F ? F.q + " · " : "") + e[1]) + '">' +
    (F ? '<span class="bfc-p">' + (st ? esc(st) : F.p + "%") + "</span>" : "") + '<span class="bfc-t">' + esc(F && F.s ? F.s : f.id) + "</span>" +
    (F && F.due && !st ? '<span class="bfc-d">' + fcDueS(F.due) + "</span>" : "") + '<span class="bfc-e" aria-hidden="true">' + e[0] + '</span><span class="sr">' + e[1] + "</span></button>";
}
const fmtKD = s => enDate(s, true);
function dailyIssue(x){
  const fc = fcChip;
  const cs = id => { const c = (D.strategies || []).find(k => k.id === id); return c ? '<button type="button" class="chip" data-case="' + esc(id) + '">' + esc(c.title.split(":")[0]) + "</button>" : ""; };
  return x.items.map((i, n) => '<article class="bi"' + (x === (BR.issues || [])[0] ? ' id="bi-' + n + '"' : "") + '><h4>' + (i.loc ? '<button type="button" class="bh" data-bloc="' + esc(x.date) + "|" + n + "\" title=\"Show on the globe\">" + esc(i.h) + PIN + "</button>" : esc(i.h)) + "</h4>" + (i.fact ? "<p>" + esc(i.fact) + "</p>" : "") + (i.link ? "<p class=\"bl\"><span class=\"bl-k\">Bearing on the assessments</span>" + esc(i.link) + "</p>" : "") +  /* v3.92: 한 줄 정보 형식의 호는 fact·link가 없다 */
      '<div class="chips" style="margin:0">' + cs(i.case) + (i.fc || []).map(fc).join("") + ((i.loc || {}).isos || []).map(chip).join("") + "</div>" +  /* v4.37 꼭지의 나라 → 나라 카드 */  /* v3.83 장소가 있는 꼭지는 제목을 누르면 지구본이 그곳을 보인다(2026-10-08 결재, 위치 보기 단추를 대신함) */
      ((i.src || []).length ? "<details class=\"src\"><summary>Sources · " + i.src.length + "</summary><ul>" + i.src.map(srcItem).join("") + "</ul></details>" : "") + "</article>").join("") +
    weekLine(x.date) +
    ((x.more || []).length ? "<div class=\"bm\"><b>Other developments</b><ul>" + x.more.map(m => "<li>" + esc(m.t) + ((m.src || []).length ? ' <a href="' + esc(m.src[0]) + "\" target=\"_blank\" rel=\"noopener\" class=\"note\">Source</a>" : "") + "</li>").join("") + "</ul></div>" : "");
}
/* v3.52 주간 전망 점검(2026-10-05 결재): 날짜별 브리핑에 속할 내용이 아니어서 전망과 검증 탭으로 옮겼다(D.fc_reviews, 최신이 앞).
   점검한 날의 브리핑에는 한 줄 안내만 둔다 */
const FCR = () => (D.fc_reviews || []).map(r => Object.assign({}, r, {items: (r.items || []).filter(it => D.forecasts.some(f => f.id === it.id))})).filter(r => r.items.length || r.note);
function weekLine(date){
  const r = FCR().find(x => x.date === date); if (!r) return "";
  const ch = r.items.filter(it => it.from !== it.to).length, keep = r.items.length - ch;
  return "<p class=\"bw1\"><b>This week’s forecast review</b> " + [ch ? ch + " revised" : "", keep ? keep + " unchanged" : ""].filter(Boolean).join(", ") + ' <button type="button" class="chip" data-fw="' + esc(r.date) + "\">View in Forecasts and Track Record →</button></p>";
}
function weekHtml(r, open){  /* v3.50 전망 번호 대신 짧은 이름(교본 9장) */
  const li = it => { const F = D.forecasts.find(z => z.id === it.id); return '<li data-fid="' + esc(it.id) + '"><button type="button" class="fcchip" data-fc="' + esc(it.id) + '" title="' + esc(F ? F.q : "") + '">' + (F && F.s ? '<span class="fcs">' + esc(F.s) + "</span>" : esc(it.id)) + '</button> <span class="pp' + (it.from === it.to ? ' pp0">' + it.to + "% (unchanged)" : '"><i aria-hidden="true">' + (it.to > it.from ? "▲" : "▼") + "</i>" + it.from + "% → " + it.to + "%") + "</span><p>" + esc(it.why) + "</p></li>"; };
  return '<details class="fw" id="fw-' + esc(r.date) + '"' + (open ? " open" : "") + '><summary><b>' + fmtKD(r.date) + " review</b> <span class=\"note\">" + r.items.filter(it => it.from !== it.to).length + " revised · " + r.items.filter(it => it.from === it.to).length + " unchanged</span></summary>" +
    (r.note ? '<p class="note">' + esc(r.note) + "</p>" : "") + (r.items.length ? "<ul>" + r.items.map(li).join("") + "</ul>" : "") + "</details>";
}
function fcHist(id){  /* 전망 항목의 확률 조정 이력 */
  const h = FCR().slice().reverse().flatMap(r => r.items.filter(it => it.id === id && it.from !== it.to).map(it => fmtKD(r.date) + " " + it.from + "% → " + it.to + "%"));
  return h.length ? "<span class=\"fch\">Probability revised · " + esc(h.join(" · ")) + "</span>" : "";
}
/* v3.22 듣기: 기기에 내장된 한국어 음성으로 읽는다(파일·서버 없음). 한국어 음성이 없는 기기에서는 단추가 보이지 않는다(.tts-ok) */
const TTS = {btn:null, key:null, cur:0, pos:{}};
const ttsLab = key => (TTS.pos[key] ? "▶ Resume" : "▶ Listen");
const ttsBtn = key => '<button type="button" class="tts" data-tts="' + esc(key) + '" aria-pressed="false">' + ttsLab(key) + "</button>";
function ttsVoice(){ try { const vs = speechSynthesis.getVoices() || []; return vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; } catch(e){ return null; } }
function ttsText(key){
  const [k, id] = String(key).split(":");
  if (k === "brief" && BR) { const x = briefCur(); return "Briefing, " + enDate(x.date) + ". " + x.items.map(i => i.h + "." + (i.fact ? " " + i.fact : "")).join(" ")  /* v3.38b(2026-10-01): 듣기에서는 '판단과의 연결'을 읽지 않는다. 결론 번호·전망 번호 같은 화면용 표현이 귀로는 어색하기 때문 */ + ((x.more || []).length ? " Other developments. " + x.more.map(m => m.t).join(" ") : ""); }
  if (k === "digest") return "Global overview. " + D.digest.map(g => g.t + ". " + g.d).join(" ");
  if (k === "ins") return "Key assessments. " + (D.insights || []).map(g => { const a = String(g.t).split(EN_SENT); return a[0] + (a.length > 1 ? " Reasoning. " + a.slice(1).join(" ") : ""); }).join(" ");
  const cn = i => (D.countries[i] || {}).name_ko || i;
  const jw = w => w + " and";
  if (k === "scn") return "World scenarios through 2030. " + D.grand.scenarios.map(x => x.name + ", " + x.p + " percent. " + x.d + " " + (x.korea || "")).join(" ");
  if (k === "trend") return "Structural trends. " + D.grand.trends.map(x => x.t + ". " + x.d).join(" ");
  if (k === "ten") return "Where history and structure diverge. " + D.grand.tensions.map(x => jw(cn(x.a)) + " " + cn(x.b) + ". " + (x.memory || "") + " " + (x.structure || "") + " " + (x.note || "")).join(" ");
  if (k === "dyad") { const [a, b] = id.split("|"), G = D.grand, d = G.dyads.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)), c = G.cells.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    return jw(cn(a)) + " " + cn(b) + " relations. " + (c ? c.t + ". " : "") + (d ? "Where they can cooperate. " + d.coop.join(", ") + ". Where they clash. " + d.conflict.join(", ") + ". Outlook. " + d.outlook : ""); }
  const H = D.history || {};
  if (k === "an") return "Historical precedents. " + (H.analogies || []).map(x => x.now + ". " + [].concat(x.cases || []).join(", ") + ". " + (x.then || "") + " " + (x.implies || "") + " " + (x.breaks || "")).join(" ");
  if (k === "law") return "Recurring patterns in history. " + (H.laws || []).map(x => x.t + ". " + x.d).join(" ");
  if (k === "th") return "Key thinkers. " + (D.thinkers || []).map(x => x.name + ". " + (x.bio || "") + " Core propositions. " + (x.props || []).map(p => p.t).join(" ") + " " + (x.claim || x.idea || "") + " " + (x.develop || "") + " " + (x.critique || "") + " " + (x.now || "") + " " + (x.record || "")).join(" ");
  if (k === "case") { const c = (D.strategies || []).find(z => z.id === id); if (!c) return ""; const B = c.brief || {}; /* v3.75 사안 요약 듣기에 화면 순서대로 '가장 유력한 전개'와 '상대편에서 본 최선의 수'를 넣는다(빠져 있어 건너뛰던 것, 2026-10-07). 괄호 속 보충은 읽지 않는다 */
    const top = ((c.futures || {}).items || []).slice().sort((x, y) => y.p - x.p)[0], W = (c.counter || [])[0];
    return c.title + ". " + (B.q ? "The question. " + B.q + (/[.?!]$/.test(B.q) ? " " : "? ") : "") + (B.a ? "Assessment. " + B.a + " " : "") + (top ? "Most likely scenario. " + top.name + ", " + top.p + " percent. " : "") + (W && W.ranked && W.ranked[0] ? "The other side’s best move. " + W.name.replace(/\s*\(.*\)\s*$/, "") + ". " + ttsNoParen(W.ranked[0].t) + " " : "") + (B.eq ? "The likely outcome. " + B.eq + " " : "") + (B.human ? "What it means for people. " + B.human : ""); }
  if (k === "feat") { const F = FEATS().find(z => z.id === id); if (!F) return ""; const t = x => ttsNoParen(String(x || "").replace(/\{\{[^}]*\}\}/g, ""));  /* v3.28 특집 듣기: 칩 표기는 읽지 않는다 */
    if (F.kind === "essay") return "Feature. " + F.title + ". " + (F.summary_h || "Summary") + ". " + (F.summary || []).map(t).join(" ") + " " + (F.sections || []).map(S => S.h + ". " + S.blocks.filter(b => b.p).map(b => t(b.p)).join(" ")).join(" ") +
      ((F.events || []).length ? " " + F.events_h + ". " + F.events.map(x => x.when + ". " + t(x.t)).join(" ") : "") + ((F.paths || []).length ? " " + F.paths_h + ". " + t(F.paths_lead) + " " + F.paths.map(x => x.k + ". " + t(x.t)).join(" ") : "") + ((F.falsify || []).length ? " " + F.falsify_h + ". " + t(F.falsify_lead) + " " + F.falsify.map(t).join(" ") : "");  /* v3.44 서술형 특집 듣기: 표는 읽지 않는다 */
    return "Feature. " + F.title + ". " + ((F.summary || []).length ? (F.summary_h || "Summary") + ". " + F.summary.map(t).join(" ") + " " : "") + t(F.lead) + " " + F.flows_h + ". " + F.flows.map(x => t(x.k) + ". " + t(x.t)).join(" ") + " " + F.window_h + ". " + F.window.map(t).join(" ") + " " + F.events_h + ". " + F.events.map(x => x.when + ". " + t(x.t)).join(" ") + " " + F.paths_h + ". " + t(F.paths_lead) + " " + F.paths.map(x => x.k + ". " + t(x.t)).join(" ") + " " + F.falsify_h + ". " + t(F.falsify_lead) + " " + F.falsify.map(t).join(" "); }
  if (k === "country") { const c = D.countries[id]; if (!c) return ""; return c.name_ko + ". " + (c.situation || "") + " " + (c.recent || []).slice(-3).map(r => r.text).join(" "); }
  return "";
}
/* v3.23 브리핑 듣기: 판단과의 연결은 괄호 속 설명(사안 이름·결론 번호 등)을 빼고 읽는다 */
const ttsNoParen = t => String(t).replace(/\s*\([^()]*\)/g, "");
/* 멈춘 문장 위치를 기억했다가 같은 단추를 다시 누르면 거기서 이어 읽는다. 끝까지 들으면 처음으로 돌아간다 */
/* 듣는 동안 화면이 절전으로 꺼지지 않게 한다(Screen Wake Lock, 지원 기기만) */
async function ttsWake(on){
  try { if (on) { if (!TTS.wl && navigator.wakeLock) { TTS.wl = await navigator.wakeLock.request("screen"); TTS.wl.addEventListener("release", () => { TTS.wl = null; }); } }
        else if (TTS.wl) { await TTS.wl.release(); TTS.wl = null; } } catch(e){}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && TTS.btn) ttsWake(true); });
function ttsStop(done){
  ttsWake(false);
  if (TTS.key) TTS.pos[TTS.key] = done ? 0 : TTS.cur;
  if (done && TTS.sc) { TTS.sc.classList.remove("tts-live"); TTS.sc = null; TTS.last = null; }
  try { speechSynthesis.cancel(); } catch(e){}
  if (TTS.btn) { TTS.btn.setAttribute("aria-pressed", "false"); TTS.btn.textContent = ttsLab(TTS.key); }
  TTS.btn = null; TTS.key = null; tfEnd();
}
function ttsToggle(b){
  if (TTS.btn === b) { ttsStop(); return; }
  ttsStop(); const key = b.dataset.tts, v = ttsVoice(), t = ttsText(key); if (!v || !t) return;
  const parts = ttsSplit(ttsDrop(t));
  if (TTS.sc) TTS.sc.classList.remove("tts-live"); TTS.sc = b.closest(".pane") || document.body; TTS.sc.classList.add("tts-live"); TTS.last = b;
  let from = TTS.pos[key] || 0; if (from >= parts.length) from = 0;
  TTS.btn = b; TTS.key = key; TTS.cur = from; b.setAttribute("aria-pressed", "true"); b.textContent = "■ Stop";
  tfStart(b.closest(".pane") || document.body, b); TF.hold = 0;
  /* v3.25 단추 모양을 먼저 바꿔 보이고, 음성 준비(문장 넣기·화면 꺼짐 방지)는 그다음 틀에서 한다 */
  requestAnimationFrame(() => setTimeout(() => { if (TTS.btn !== b) return; ttsWake(true);
  parts.slice(from).forEach((x, i) => { const n = from + i, u = new SpeechSynthesisUtterance(x.trim()); u.voice = v; u.lang = /^en/i.test(v.lang) ? v.lang : "en-US"; u.rate = 1.05;
    u.onstart = () => { if (TTS.btn === b) { TTS.cur = n; tfShow(tfFind(x)); } };
    if (n === parts.length - 1) u.onend = () => { if (TTS.btn === b) ttsStop(true); };
    speechSynthesis.speak(u); });
  }, 0));
}
/* v3.46c 원하는 곳부터 듣기(2026-10-04): 듣는 중이거나 멈춘 상태에서 문단을 누르면 그 문단의 첫 문장부터 읽는다.
   누른 문단의 글에 듣기용 문장의 앞(또는 끝) 조각이 들어 있는 첫 문장을 찾는다. 연결·단추·칩을 누를 때와 글을 고를 때는 움직이지 않는다 */
/* v4.10 (2026-10-15 operator request): do not read text inside parentheses or square brackets (original-language names, dates, source marks) */
const TTS_ENUM = /^\s*(?:[\uac00-\ud7a3]|\d{1,2}|[A-Za-z]|[ivxIVX]{1,4}|[①-⑳])\s*$/;  /* keep enumerators such as (1), (a), (i) */
const ttsDrop = t => { let s = String(t); for (let k = 0; k < 2; k++) s = s.replace(/(\s*)\(([^()]*)\)|\s*（[^（）]*）|\s*\[[^\[\]]*\]/g, (m, sp, x) => x !== undefined && TTS_ENUM.test(x) ? (sp || "") + x.trim() + "," : ""); return s; };
const ttsSplit = t => String(t).replace(/\s+/g, " ").trim().split(EN_SENT).filter(Boolean);
window.ttsPick = (target, parts) => {
  const blk = target && target.closest && target.closest(TF_SEL); if (!blk) return -1;
  const bt = tfNorm(blk.textContent); if (bt.length < 4) return -1;
  const K = parts.map(tfNorm);
  for (let i = 0; i < K.length; i++) if (K[i].length >= 6 && bt.startsWith(K[i].slice(0, 12))) return i;  /* 문단의 첫 문장 */
  for (let i = 0; i < K.length; i++) if (K[i].length >= 14 && (bt.includes(K[i].slice(0, 14)) || bt.includes(K[i].slice(-14)))) return i;
  return -1;
};
const TTS_SKIP = "a,button,summary,input,select,textarea,label,[data-tts],.chip,.fcchip";
function ttsSetup(){
  if (!("speechSynthesis" in window)) return;
  const upd = () => document.documentElement.classList.toggle("tts-ok", !!ttsVoice());
  upd(); try { speechSynthesis.addEventListener("voiceschanged", upd); } catch(e){}
  document.addEventListener("click", e => { const b = e.target.closest("[data-tts]"); if (b) { e.preventDefault(); ttsToggle(b); } });
  document.addEventListener("click", e => {
    const b = TTS.btn || (TTS.last && TTS.last.isConnected ? TTS.last : null); if (!b || e.target.closest(TTS_SKIP)) return;
    if (!TTS.sc || !TTS.sc.contains(e.target) || String(getSelection ? getSelection() : "").length) return;
    const key = b.dataset.tts, n = window.ttsPick(e.target, ttsSplit(ttsDrop(ttsText(key)))); if (n < 0) return;
    ttsStop(); TTS.pos[key] = n; ttsToggle(b);
  });
  addEventListener("pagehide", () => ttsStop());
}
/* v3.43d 듣기 따라가기: 문장을 읽기 시작할 때마다 그 문장이 든 문단을 찾아 옅은 바탕색으로 표시하고 화면 가운데로 스크롤한다.
   듣기용 글은 화면 글과 조금 다르므로(퍼센트·괄호 생략 등) 문장 앞·가운데·끝 조각으로 찾고, 찾지 못하면 직전 위치에 머문다.
   접힌 곳(details) 안이면 펼친다. 손으로 스크롤하면 10초 동안 따라가기를 멈춘다(표시는 계속). 결정권자 쪽 듣기도 window.ttsFollow로 같이 쓴다 */
const TF = {scope: null, blocks: [], last: -1, el: null, hold: 0};
const tfNorm = t => String(t).replace(/percent/gi, "").replace(/\(([^()]*)\)|（[^（）]*）|\[[^\[\]]*\]/g, (m, x) => x !== undefined && TTS_ENUM.test(x) ? x : "").replace(/[^0-9A-Za-z가-힣]/g, "");
const TF_SEL = "p,li,dd,dt,h1,h2,h3,h4,h5,td,th,summary,blockquote", TF_LEAF = TF_SEL + ",div";
/* 범위: 단추가 든 탭(또는 결정권자 쪽 글 칸) 전체의 맨 안쪽 글 칸들. 찾기는 단추 바로 뒤의 칸에서 시작한다 */
function tfStart(scope, btn){
  tfEnd(); if (!scope) return;
  TF.scope = scope;
  /* 맨 안쪽 칸은 글 전체, 안에 칸을 품은 칸(<li><b>제목</b><p>설명</p>)은 제 몫의 글(제목)만 */
  const own = e => [...e.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.matches(TF_LEAF) && !n.querySelector(TF_LEAF))).map(n => n.textContent).join(" ");
  TF.blocks = [...scope.querySelectorAll(TF_LEAF)].filter(e => !e.closest("button") && !e.closest("details.src, .chips"))  /* v3.86e 출처 목록과 칩 줄은 읽지 않으므로 찾는 범위에서도 뺀다(영문 쪽 제목 문장이 출처 항목에 걸려 맨 아래로 튀던 문제) */.map(e => ({e, t: tfNorm(e.querySelector(TF_LEAF) ? own(e) : e.textContent)})).filter(x => x.t.length > 1);
  const i = btn ? TF.blocks.findIndex(x => btn.compareDocumentPosition(x.e) & Node.DOCUMENT_POSITION_FOLLOWING) : 0;
  TF.last = Math.max(0, i) - 1; TF.start = Math.max(0, i);
}
function tfEnd(){ if (TF.el) TF.el.classList.remove("tts-on"); TF.el = null; TF.scope = null; TF.blocks = []; TF.last = -1; }
function tfFind(s){
  const k = tfNorm(s), B = TF.blocks; if (k.length < 2 || !B.length) return -1;
  const from = Math.max(TF.start || 0, TF.last);
  if (k.length >= 8) {
    const keys = [k.slice(0, 14)]; if (k.length > 30) keys.push(k.slice(14, 28)); if (k.length > 18) keys.push(k.slice(-14));
    for (const st of [from, 0]) for (const key of keys) for (let i = st; i < B.length; i++) if (B[i].t.includes(key)) return i;
  }
  /* 짧은 문장('판단.', '관리된 경쟁, 35퍼센트.')과 못 찾은 문장: 머리 6자로 바로 뒤쪽 몇 칸에서만 찾는다(엉뚱한 곳으로 튀지 않게) */
  const h = k.slice(0, 6);
  for (let i = Math.max(0, TF.last); i < Math.min(B.length, Math.max(0, TF.last) + 15); i++) if (B[i].t.includes(h)) return i;
  return -1;
}
function tfShow(i){
  if (window.__tfLog) window.__tfLog.push(i);
  if (i < 0 || !TF.scope || !TF.scope.isConnected) return;
  TF.last = i; const el = TF.blocks[i].e; if (el === TF.el) return;
  if (TF.el) TF.el.classList.remove("tts-on"); TF.el = el; el.classList.add("tts-on");
  for (let d = el.closest("details"); d && TF.scope.contains(d); d = d.parentElement && d.parentElement.closest("details")) d.open = true;
  if (Date.now() < TF.hold || !el.offsetParent) return;
  const big = el.getBoundingClientRect().height > innerHeight * 0.6;
  el.scrollIntoView({block: big ? "start" : "center", behavior: reduceMotion ? "auto" : "smooth"});
}
window.ttsFollow = (btn, sent) => { const sc = btn.closest(".page-pre") || btn.closest("main") || document.body; if (TF.scope !== sc) tfStart(sc, btn); tfShow(tfFind(sent)); };
window.ttsFollowEnd = () => tfEnd();
(function(){ const hold = () => { if (TF.scope) TF.hold = Date.now() + 10000; };
  addEventListener("wheel", hold, {passive: true}); addEventListener("touchmove", hold, {passive: true});
  addEventListener("keydown", e => { if (/^(PageUp|PageDown|ArrowUp|ArrowDown|Home|End| )$/.test(e.key)) hold(); });
  addEventListener("mousedown", e => { if (e.target.classList && e.target.classList.contains("pane")) hold(); }); })();  /* 스크롤 막대 끌기 */
function pastIssue(o){  /* v3.92e: 지난 정보는 눌러서 그 자리에서 펼친다. 그날의 한 줄 정보를 모두 보이고, 전문이 있는 호는 '전문 보기'를 붙인다 */
  const full = o.items.some(i => i.link), csn = id => LB_SHORT[id] || "Other";
  return '<details class="lb-past"><summary><span class="mono">' + fmtKD(o.date) + '</span><span class="nm">' + esc((o.items[0] || {}).h || "") + '</span><span class="lb-pn">' + (o.items.length + (o.more || []).length) + "</span></summary>" +
    '<ul class="lb-list">' + o.items.map(i => '<li><span class="lb-cs">' + esc(csn(i.case)) + '</span><span class="lb-t">' + esc(i.h) + "</span>" + lbFx(i, true) + ((i.src || []).length ? '<a class="lb-src" href="' + esc(i.src[0]) + "\" target=\"_blank\" rel=\"noopener\">Source</a>" : "") + bhFact(i) + "</li>").join("") +
    (o.more || []).map(m => "<li><span class=\"lb-cs lb-etc\">Other</span><span class=\"lb-t\">" + esc(firstSent(m.t)) + "</span>" + ((m.src || []).length ? '<a class="lb-src" href="' + esc(m.src[0]) + "\" target=\"_blank\" rel=\"noopener\">Source</a>" : "") + "</li>").join("") + "</ul>" +
    '<p class="lb-pf"><a class="chip" href="/brief/' + esc(o.date) + '/" data-brief="' + esc(o.date) + '">' + (full ? "Read that day's full briefing →" : "Go to that day's page →") + "</a></p></details>";
}
function briefCur(){ return BR && ((BR.issues || []).find(x => x.date === S.bdate) || BR.issues[0]); }
function renderBrief(){
  const el = $("#pane-brief"); if (!el) return;
  if (!BR || !(BR.issues || []).length) { el.innerHTML = "<div class=\"sec\"><h2>Briefing</h2><p class=\"note\">Loading the briefing…</p></div>"; return; }
  const cur = briefCur(), others = BR.issues.filter(x => x !== cur);
  /* v3.92d: 최신 호도 날짜를 골라 들어오면(지난 정보 목록, 검색, /brief/날짜/) 예전 형식 전문으로 보인다. 전문(fact)이 있는 최신 호는 지난 정보 맨 위에 둔다 */
  const past = BR.issues.filter(x => x !== cur || x.items.some(i => i.link));
  if (cur === BR.issues[0] && !S.bdate) { el.innerHTML = '<div class="sec lbwrap">' + lifeBoardHtml(cur) + "</div>"; el.scrollTop = 0; fitTrends(el); return; }  /* v3.99: 정세 브리핑은 세계 정세 탭 맨 위로 옮김 */
  el.innerHTML = (cur === BR.issues[0] ? "<p class=\"lb-back\"><button type=\"button\" class=\"chip\" data-go=\"overview\" data-bgo=\"1\">← Briefing in Global Overview</button></p>" : "") + "<section class=\"sec dbrief\" id=\"brief\"><div class=\"bh\"><h2>Briefing</h2><span class=\"bd\">" + enDate(cur.date) + "</span>" + ttsBtn("brief") + "</div>" +
    "<p class=\"note\">Major recent events and how they bear on Clisa Geopolitics’ assessments and forecasts. The arrows (↑·↓) show whether an event makes a forecast more or less likely to come true. Forecast probabilities are reviewed and revised every week.</p>" +
    dailyIssue(cur) + "</section>" +
    (others.length ? "<section class=\"sec\"><h3>Past briefings</h3><ul class=\"list blist\">" + others.map(o => '<li><a class="row-btn" href="/en/brief/' + esc(o.date) + '/" data-brief="' + esc(o.date) + '"><span class="mono">' + fmtKD(o.date) + '</span> <span class="nm">' + esc((o.items[0] || {}).h || "") + "</span></a></li>").join("") + "</ul></section>" : "");
  el.scrollTop = 0;
}
function goBrief(date){ S.bdate = date || null; renderBrief(); switchTab("brief"); }
function dailyHtml(){
  if (!BR || !(BR.issues || []).length) return "";
  const cur = BR.issues[0], old = BR.issues.slice(1);
  return "<section class=\"sec dbrief\" id=\"brief\"><div class=\"bh\"><h2>Briefing</h2><span class=\"bd\">" + enDate(cur.date) + '</span>' + ttsBtn("brief") + '</div>' +
    "<p class=\"note\">Major recent events and how they bear on Clisa Geopolitics’ assessments and forecasts. The arrows (↑·↓) show whether an event makes a forecast more or less likely to come true. Forecast probabilities are reviewed and revised every week.</p>" +
    dailyIssue(cur) +
    (old.length ? "<details class=\"bold\"><summary>Past briefings · " + old.length + "</summary>" + old.map(o => '<details class="bo"><summary>' + fmtKD(o.date) + " · " + esc((o.items[0] || {}).h || "") + "</summary>" + dailyIssue(o) + "</details>").join("") + "</details>" : "") +
    "</section>";
}
/* v3.36b 돌아가는 띠. 항목 {k 머리말, d 날짜, t 제목, 그리고 n(공지)·j(브리핑 번호)·f(전망)·e(사건) 가운데 하나}. 4초마다 한 건씩 바꾸고, 마우스를 올리거나 누르고 있으면 멈춘다 */
function agendaItems(){
  return agenda(90).map(x => x.f ? {k: "Resolution due", d: x.f.due, t: (x.f.s || x.f.id + " " + x.f.q) + " · " + daysText(daysLeft(x.f.due)), f: x.f, soon: daysLeft(x.f.due) <= 30}
    : {k: "Upcoming", d: x.e.date.length === 7 ? "" : x.e.date, t: x.e.t + " · " + (x.e.date.length === 7 ? evDate(x.e) : evDays(x.e)), e: x.e, soon: daysLeft(x.e.date.length === 7 ? x.e.date + "-01" : x.e.date) <= 30});
}
function stripGo(x){
  if (x.w) { switchTab("forecast"); const d = document.getElementById("fw-" + x.w.date); if (d) { d.open = true; const li = d.querySelector('li[data-fid="' + x.w.id + '"]') || d;
    requestAnimationFrame(() => { li.scrollIntoView({block: "center", behavior: reduceMotion ? "auto" : "smooth"}); li.classList.add("srch-hit"); setTimeout(() => li.classList.add("fade"), 1600); setTimeout(() => li.classList.remove("srch-hit", "fade"), 3000); }); } return; }
  const fm = x.n && /^feature\/([\w-]+)\/$/.exec(x.n.link || ""); if (fm) { goFeat(fm[1]); return; }
  /* v3.37b(2026-10-01): 일정 띠의 항목은 전망이든 사건이든 첫 화면의 '다가오는 일정' 표에서 그 줄로 간다. 전망의 설명 창과 사안 분석은 표의 줄에서 이어진다 */
  if (x.e || x.f) { switchTab("overview"); const li = document.getElementById("due-" + (x.f ? "f" + x.f.due : x.e.id)) || document.getElementById("due");
    if (li) { li.scrollIntoView({block: "center", behavior: reduceMotion ? "auto" : "smooth"}); li.classList.add("srch-hit"); setTimeout(() => li.classList.add("fade"), 1600); setTimeout(() => li.classList.remove("srch-hit", "fade"), 2400); } return; }
  if (x.n) { const m = /^case\/([\w-]+)\/$/.exec(x.n.link || ""), c = m && (D.strategies || []).find(z => z.id === m[1]);
    if (c) { goCase(c.id); caseFill(c.id); const o = document.getElementById("outlook-" + c.id);
      if (o) { const f = o.closest("details"); if (f) f.open = true; o.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); }
      } 
    else switchTab("forecast");
    return; }
  switchTab("overview"); const a = document.getElementById("bi-" + x.j) || document.getElementById("brief");
  if (a) { a.scrollIntoView({block: a.id === "brief" ? "start" : "center", behavior: reduceMotion ? "auto" : "smooth"}); if (a.id !== "brief") { a.classList.add("hl"); setTimeout(() => a.classList.remove("hl"), 2000); } }
}
function runStrip(st, list){
  const bt = st.querySelector(".bs-t"), bn = st.querySelector(".bs-n"), bk = st.querySelector(".bs-k"), bd = st.querySelector(".bs-d");
  let k = 0, hold = false;
  const show = () => { const L = list(), N = L.length; if (!N) { st.hidden = true; return; } k = k % N; const x = L[k]; bt.textContent = x.t || ""; bk.textContent = x.k || ""; bd.textContent = x.d ? fmtKD(x.d) : ""; bn.textContent = N > 1 ? (k + 1) + "/" + N : ""; st.classList.toggle("bs-due", !!(x.f || x.e)); st.hidden = false; };  /* v4.24 좁은 화면에서 예정 항목이 돌 때 띠의 왼쪽 선을 붉게 */
  show();
  if (!reduceMotion) setInterval(() => {
    if (hold || document.visibilityState !== "visible" || list().length < 2) return;
    bt.classList.add("fade"); setTimeout(() => { k = (k + 1) % Math.max(1, list().length); show(); bt.classList.remove("fade"); }, 350);
  }, 4000);
  addEventListener("resize", show);
  st.addEventListener("mouseenter", () => hold = true); st.addEventListener("mouseleave", () => hold = false);
  st.addEventListener("focus", () => hold = true); st.addEventListener("blur", () => hold = false);
  st.addEventListener("pointerdown", () => hold = true); st.addEventListener("pointercancel", () => hold = false);
  st.onclick = () => { hold = false; const L = list(); if (L.length) stripGo(L[k % L.length]); };
}
function loadBrief(){
  BRIEF_P.then(b => {
    if (!b || !(b.issues || []).length) { $("#bstrip").hidden = true; return; }
    BR = b; const cur = b.issues[0]; lkRefresh();  /* v4.37 나라 카드 연결 칸의 브리핑 */
    if (S.tab === "forecast") { const pn = $("#pane-forecast"), y = pn ? pn.scrollTop : 0; renderForecasts(); if (pn) pn.scrollTop = y; }  /* v4.22 전망별 화면의 관련 사건은 브리핑 자료가 온 뒤 · v4.23 목록의 관련 꼭지 수도 */
    if (typeof IND !== "undefined" && IND && document.getElementById("indboard")) indBoard();  /* v3.98: 산업 탭이 브리핑 자료보다 먼저 그려졌으면 추이를 넣어 다시 그림 */
    /* v3.27 판단 변경 공지(머리말 n.k, 없으면 "분석 갱신")는 공지 날짜로부터 7일 동안 띠 첫머리에 두고, 그 뒤로 브리핑 제목을 돌린다(2026-10-01) */
    /* v3.44b 특집 공지는 11일 동안 둔다(2026-10-04) */
    const ymd = x => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"), lim = ymd(new Date(Date.now() - 7 * 864e5)), limF = ymd(new Date(Date.now() - 11 * 864e5));
    const NS = (D.notices || []).filter(n => n.date >= (n.k === "Features" ? limF : lim)).slice().sort((a, b) => b.date.localeCompare(a.date))
      .map(n => ({k: n.k || "Analysis update", d: n.date, t: n.h || String(n.text).split(EN_SENT)[0], n}));
    /* v3.52b 전망 조정(주간 전망 점검에서 확률을 바꾼 전망)은 점검한 날부터 사흘 동안 공지 다음에 돌린다(2026-10-05) */
    const lim3 = ymd(new Date(Date.now() - 2 * 864e5));
    const FRS = FCR().filter(r => r.date >= lim3).flatMap(r => r.items.filter(it => it.from !== it.to).map(it => { const F = D.forecasts.find(z => z.id === it.id);
      return {k: "Forecast revised", d: r.date, t: (F && F.s ? F.s : it.id) + " " + it.from + "% → " + it.to + "%", w: {date: r.date, id: it.id}}; }));
    const MAIN = NS.concat(FRS, cur.items.map((i, j) => ({k: "Briefings", d: cur.date, t: i.h, j})));
    runStrip($("#bstrip"), () => narrow() ? MAIN.concat(agendaItems().filter(x => x.soon)) : MAIN);  /* 모바일: 띠가 하나이므로 30일 안의 일정을 섞는다(2026-10-01) */
    renderOverview(); renderBrief(); SR.idx = null; if (S.tab === "brief" && ROUTES) applyRoute();
  }).catch(() => { const st = $("#bstrip"); if (st && !BR) st.hidden = true; });
}
/* v3.99 시안: 정세 브리핑을 세계 정세 탭 맨 위에. 최근 3개 호(발행일 기준)를 펼쳐 두고, 그 이전 호는 '지난 브리핑 더보기'로 그 자리에서 펼친다.
   정보마다 그날 그 사안의 확률이 바뀌었으면 국민의 삶(그 사안의 카드)과 산업별 미래(그 변경으로 점 개수가 가장 크게 움직인 업종의 추이)로 가는 단추를 붙인다 */
const BH_CUT = 6, BH_N = 2;  /* 2026-10-12 결재: 최근 2개 호(발행일 기준) */
function bhFx(i, d){
  const fc = (i.fc || []).map(fcChip).join("");
  const C = i.case ? (D.strategies || []).find(s => s.id === i.case) : null, moved = C && C.hs7 && (C.hs7.changes || []).some(x => x.d === d);
  return fc + (moved ? "<span class=\"bh-gx\"><span class=\"lb-fx lb-fx-on\">Graphs updated</span><button type=\"button\" class=\"bh-go\" data-golife=\"" + esc(i.case) + "\">People's Lives →</button><button type=\"button\" class=\"bh-go\" data-goind=\"" + esc(i.case + "|" + d) + "\">Industry Outlook →</button></span>" : "");
}
function bhFact(i){ return i.fact && !i.link ? '<span class="lb-f">' + esc(i.fact) + "</span>" : ""; }  /* v4.01(2026-10-12 결재): 한 줄 정보 아래 사실 1~2문장(판단과의 연결 문장이 있는 예전 형식 호는 전문 쪽에서 봄) */
function bhItems(x, top){
  const csn = id => LB_SHORT[id] || "Other", N = x.items.length + (x.more || []).length, cut = N > BH_CUT, cx = k => cut && k >= BH_CUT ? ' class="bh-x"' : "";  /* 하루 6줄이 넘으면 나머지는 접는다 */
  return '<ul class="lb-list' + (cut ? " bh-cut" : "") + '">' + x.items.map((i, n) => '<li' + (top ? ' id="bi-' + n + '"' : "") + cx(n) + '><span class="lb-cs">' + esc(csn(i.case)) + '</span><span class="lb-t">' + (i.loc ? '<button type="button" class="bh" data-bloc="' + esc(x.date) + "|" + n + "\" title=\"Show on the globe\">" + esc(i.h) + PIN + "</button>" : esc(i.h)) + "</span>" + bhFx(i, x.date) +
    ((i.src || []).length ? '<a class="lb-src" href="' + esc(i.src[0]) + "\" target=\"_blank\" rel=\"noopener\">Source</a>" : "") + bhFact(i) + "</li>").join("") +
    (x.more || []).map((m, k) => '<li' + cx(x.items.length + k) + "><span class=\"lb-cs lb-etc\">Other</span><span class=\"lb-t\">" + esc(firstSent(m.t)) + "</span>" + ((m.src || []).length ? '<a class="lb-src" href="' + esc(m.src[0]) + "\" target=\"_blank\" rel=\"noopener\">Source</a>" : "") + "</li>").join("") +
    (cut ? '<li class="bh-xb"><button type="button" class="bh-xbtn" data-bcut="1">' + "Show " + (N - BH_CUT) + " more" + "</button></li>" : "") + "</ul>";
}
function briefHomeHtml(){
  if (!BR || !(BR.issues || []).length) return "";
  const top = BR.issues.slice(0, BH_N), old = BR.issues.slice(BH_N);
  return "<section class=\"sec bhome\" id=\"brief\"><div class=\"bh\"><h2>Briefing</h2>" + ttsBtn("brief") + "</div>" +
    top.map((x, k) => '<div class="bh-day"><p class="bh-dd"><span>' + fmtKD(x.date) + "</span>" + (x.items.some(i => i.link) ? '<a class="bh-full" href="/en/brief/' + esc(x.date) + '/" data-brief="' + esc(x.date) + "\">Full briefing →</a>" : "") + "</p>" + bhItems(x, !k) + weekLine(x.date) + "</div>").join("") +
    (old.length ? "<button type=\"button\" class=\"bh-more\" data-bmore=\"1\" aria-expanded=\"false\">Earlier briefings · <span class=\"mono\">" + old.length + " days</span></button><div class=\"bh-old\" hidden>" + old.map(pastIssue).join("") + "</div>" : "") + "</section>";
}
document.addEventListener("click", ev => {  /* v3.99: 지난 브리핑 더보기(그 자리에서 펼침), 정세 브리핑으로 가는 단추 */
  const bc = ev.target.closest("[data-bcut]"); if (bc) { const u = bc.closest("ul"); if (u) u.classList.remove("bh-cut"); bc.closest("li").remove(); return; }
  const m = ev.target.closest("[data-bmore]"); if (m) { const o = m.nextElementSibling, op = m.getAttribute("aria-expanded") !== "true"; if (o) o.hidden = !op; m.setAttribute("aria-expanded", op); m.firstChild.textContent = op ? "Hide earlier briefings · " : "Earlier briefings · "; return; }
  const lx = ev.target.closest("[data-lbx]"); if (lx) { const md = lx.dataset.lbxm || "d"; LBX = LBX === lx.dataset.lbx && LBXM === md ? null : lx.dataset.lbx; LBXM = md; const b = document.getElementById("lifeboard"); if (b) { b.innerHTML = lifeRows(); fitTrends(b); } if (LBX) { const x = document.querySelector('[data-lbx="' + CSS.escape(LBX) + '"]'); detReveal(x && (x.closest(".mc,.ma,.lbx-card") || x).querySelector(".ind-det")); } return; }
  const dj = ev.target.closest("[data-dj]"); if (dj) { const a = document.getElementById(dj.dataset.dj); if (a) a.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); return; }
  const mj = ev.target.closest("[data-mj]"); if (mj) { MIOPEN = mj.dataset.mj; INDOPEN = null; indBoard(); mGo("ind-" + MIOPEN); return; }
  const mlj = ev.target.closest("[data-mlj]"); if (mlj) { MLOPEN = mlj.dataset.mlj; LBX = null; const b = document.getElementById("lifeboard"); if (b) { b.innerHTML = lifeRows(); fitTrends(b); } mGo("lbx-" + MLOPEN); return; }
  const mi = ev.target.closest("[data-mi]"); if (mi) { MIOPEN = MIOPEN === mi.dataset.mi ? null : mi.dataset.mi; INDOPEN = null; indBoard(); detReveal(MIOPEN && document.getElementById("ind-" + MIOPEN)); return; }
  const ml = ev.target.closest("[data-ml]"); if (ml) { MLOPEN = MLOPEN === ml.dataset.ml ? null : ml.dataset.ml; LBX = null; const b = document.getElementById("lifeboard"); if (b) { b.innerHTML = lifeRows(); fitTrends(b); } detReveal(MLOPEN && document.getElementById("lbx-" + MLOPEN)); return; }
  const gl = ev.target.closest("[data-golife]"); if (gl) { S.bdate = null; const rows = lbxGroups(), r = rows.find(x => x[4].some(p => p[0].id === gl.dataset.golife)); if (r) { LBX = r[0] + "|" + gl.dataset.golife; LBXM = "t"; MLOPEN = r[0]; } renderBrief(); switchTab("brief"); if (r && isMob()) mGo("lbx-" + r[0]); else requestAnimationFrame(() => { const a = r && document.getElementById("lbx-" + r[0]); if (a) a.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); }); return; }
  const gi = ev.target.closest("[data-goind]"); if (gi) { const [cid, d] = gi.dataset.goind.split("|"); switchTab("industry"); let n = 0; const go = () => { if (!IND) { if (++n < 60) setTimeout(go, 100); return; } indJump(cid, d); }; go(); return; }
  const g = ev.target.closest("[data-bgo]"); if (g) requestAnimationFrame(() => { const b = document.getElementById("brief"); if (b) b.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); });
});
function renderOverview(){
  if (!D) return;
  const fps = D.flashpoints.slice().sort((a, b) => b.severity - a.severity || String(b.last_major_event?.date).localeCompare(String(a.last_major_event?.date)));
  $("#pane-overview").innerHTML = briefHomeHtml() + dueHtml() +
    '<div class="sec"><p class="eyebrow">' + esc(D.meta.scope) + "</p><h2 style=\"margin-top:4px\">Global Overview</h2><p class=\"meta\" style=\"margin-top:4px\">Analysis as of <span class=\"mono\">" + esc(enDate(D.meta.asof)) + "</span>" + (BR && BR.issues[0].date > D.meta.asof ? " · Latest developments checked <span class=\"mono\">" + esc(enDate(BR.issues[0].date)) + "</span>" : "") + " · " + pl(D.digest.length, "summary", "summaries") + " · " + pl(fps.length, "flashpoint") + "</p><p class=\"lead\" style=\"margin-top:8px\">Flashpoints around the world and the main currents in global affairs, as of the date above. Clisa Geopolitics’ assessments of these developments are in Strategic Analysis; the structural forces behind them are in World Order.</p>" +
    ((D.insights || []).length ? "<button type=\"button\" class=\"entry\" data-go=\"strat\">View Clisa Geopolitics’ " + pl(D.insights.length, "key assessment") + "<span aria-hidden=\"true\">→</span></button>" : "") + "</div>" +
    "<section class=\"sec\"><h3>Situation summaries " + ttsBtn("digest") + '</h3><div class="digest">' + D.digest.map((g, gi) => '<article><div class="h">' + ((g.ids || []).length ? '<button type="button" class="bh" data-dg="' + gi + "\" title=\"Show on the globe\">" + esc(g.t) + PIN + "</button>" : esc(g.t)) + "</div><p>" + esc(g.d) + '</p><div class="chips">' + g.ids.map(chip).join("") + "</div></article>").join("") + "</div></section>" +
    ((!PUB() && D.discuss && D.discuss.threads.length) ? "<section class=\"sec\"><h3>Ongoing discussions</h3>" + D.discuss.threads.map(t => '<button type="button" class="row-btn" data-go="discuss"><span class="nm">' + esc(t.title) + '</span><span class="meta">' + "Opened " + esc(enDate(t.opened)) + " · " + esc(t.status) + "</span></button>").join("") + "</section>" : "") +
    "<section class=\"sec\"><h3>Flashpoints by severity</h3><ul class=\"list\">" + fps.map(fp =>
      '<li><button type="button" class="row-btn" data-fp="' + esc(fp.id) + '"><span class="fp-head"><span class="nm">' + esc(fp.name_ko) + "</span>" + pips(fp.severity) + '</span><span class="meta"><span class="mono">' + esc(enDate(fp.last_major_event?.date || "")) + "</span> " + esc(fp.last_major_event?.text || "") + "</span></button></li>").join("") + "</ul></section>" +
    (PUB() ? "" : '<section class="sec"><h3></h3><ul class="tl">' + D.log.slice().reverse().map(l => '<li><span class="d">' + esc(enDate(l.date)) + "</span><span><b>" + esc(l.ver) + "</b> " + esc(l.text) + ((l.details || []).length ? "<details class=\"src\" style=\"margin-top:4px\"><summary>Changes · " + l.details.length + "</summary><ul>" + l.details.map(x => '<li><span class="note">' + esc(x.where) + "</span><br>" + esc(x.before) + "<br>→ " + esc(x.after) + "</li>").join("") + "</ul></details>" : "") /* v3.2 */ + "</span></li>").join("") + "</ul></section>") +
    "<p class=\"note\">Clisa Geopolitics analyses are written with the help of AI (Anthropic’s Claude) and reviewed by editors.</p>";
}
function forecastRow(f, compact){
  const st = {open:["open","Open"], yes:["yes","Resolved yes"], no:["no","Resolved no"], void:["void","Voided"]}[f.status] || ["open","Open"];
  return '<li data-fid="' + esc(f.id) + '"><div class="fc"><div class="q">' + esc(f.q) + '</div><div class="p">' + f.p + '<small>%</small></div><div class="prob"><i style="width:' + f.p + '%"></i></div>' +
    (compact ? "" : '<div class="b">' + esc(f.basis) + "</div>") + (f.rs && !compact ? "<div class=\"b rs\">Resolves on: " + esc(f.rs) + "</div>" : "") /* v4.21 rs */ + (f.void && !compact ? "<div class=\"vr\">Voided · " + esc(f.void) + "</div>" : "") +
    '<div class="foot"><span class="mono fid">' + esc(f.id) + '</span><span class="st ' + st[0] + '">' + st[1] + "</span><span>Resolution date <span class=\"mono\">" + esc(enDate(f.due)) + "</span></span>" + (compact ? "" : fcHist(f.id) + '<span class="chips" style="margin:0">' + f.countries.map(chip).join("") + '<button type="button" class="chip" data-fcd="' + esc(f.id) + '">' + FCT.detail + '</button></span>') + "</div></div></li>";  /* v4.22 전망별 화면 */
}
function renderDetail(){
  const el = $("#pane-detail");
  const back = '<button type="button" class="chip back" data-navback="1" data-prev="' + esc(S.prevTab || "overview") + "\">← Back</button>";
  if (S.selFp) {
    const fp = D.flashpoints.find(f => f.id === S.selFp);
    const fcs = D.forecasts.filter(f => f.fp === fp.id);
    el.innerHTML =
      back + "<div class=\"sec\"><p class=\"eyebrow\">Flashpoint</p><h2 style=\"margin-top:4px\">" + esc(fp.name_ko) + '</h2><p class="meta" style="margin-top:6px">' + pips(fp.severity) + " Severity " + fp.severity + '/5 · <span class="mono">' + fp.lat.toFixed(2) + "°, " + fp.lon.toFixed(2) + "°</span></p></div>" +
      '<p class="lead">' + esc(fp.status_ko) + "</p>" +
      (fp.last_major_event ? "<section class=\"sec\"><h3>Latest major event</h3><ul class=\"tl\"><li><span class=\"d\">" + esc(enDate(fp.last_major_event.date)) + "</span><span>" + esc(fp.last_major_event.text) + "</span></li></ul></section>" : "") +
      "<section class=\"sec\"><h3>Countries involved</h3><div class=\"chips\" style=\"margin:0\">" + fp.countries.map(chip).join("") + "</div></section>" +
      (fcs.length ? "<section class=\"sec\"><h3>Related forecasts</h3><ul class=\"list\">" + fcs.map(f => forecastRow(f, true)).join("") + "</ul></section>" : "") +
      ((D.strategies || []).some(c => c.fp === fp.id) ? "<section class=\"sec\"><h3>Strategic Analysis</h3>" + D.strategies.filter(c => c.fp === fp.id).map(c => '<p style="margin-bottom:6px">' + esc(c.title) + '</p><button type="button" class="chip" data-case="' + esc(c.id) + "\">View Strategic Analysis · " + esc(c.title.split(":")[0]) + '</button>').join("") + "</section>" : "") +
      (exitCase(fp.id) ? "<section class=\"sec\"><h3>How each side sees it, and the way out</h3><div class=\"misread\"><b>Most dangerous misreading</b>" + esc(exitCase(fp.id).misread) + '</div><p style="margin-top:8px"><button type="button" class="chip" data-exit="' + esc(fp.id) + "\">View each side’s perceptions and exits · " + esc(fp.name_ko) + '</button></p></section>' : "") +
      (FP_AN[fp.id] ? "<section class=\"sec\"><h3>Similar historical precedents</h3>" + analogHtml(D.history.analogies.find(x => x.id === FP_AN[fp.id]), true) + "</section>" : "") +
      "<details class=\"src\"><summary>Sources · " + (fp.sources || []).length + "</summary><ul>" + (fp.sources || []).map(srcItem).join("") + "</ul></details>";
    return;
  }
  if (!S.sel) {
    const groups = REGIONS.map(r => {
      const cs = Object.values(D.countries).filter(c => c.region === r).sort((a, b) => a.tier - b.tier || a.name_ko.localeCompare(b.name_ko, "en"));
      return '<div class="region"><h4>' + r + '</h4><div class="chips" style="margin:0">' + cs.map(c => chip(c.iso)).join("") + "</div></div>";
    }).join("");
    el.innerHTML = '<div class="empty">' + back + "<h2>Select a country</h2><p class=\"lead\">Select a country or flashpoint marker on the globe, or pick one from the list below, to see its situation, capabilities, recent developments and sources. Countries in bold have full profiles.</p>" + groups +
      "<div class=\"region\"><h4>Non-state actors</h4><div class=\"chips\" style=\"margin:0\">" + chip("EUR") + "</div></div></div>";
    return;
  }
  const c = D.countries[S.sel], m = c.mil || {}, e = c.econ || {}, p = c.pol || {};
  const fps = D.flashpoints.filter(f => f.countries.includes(c.iso));
  const fcs = D.forecasts.filter(f => f.countries.includes(c.iso));
  const recent = (c.recent || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const fig = (label, val, sub) => "<div><dt>" + label + "</dt><dd>" + val + (sub ? "<small>" + sub + "</small>" : "") + "</dd></div>";
  el.innerHTML =
    back + '<div class="sec"><p class="eyebrow">' + esc(c.region) + '</p><h2 style="margin-top:4px">' + esc(c.name_ko) + " " + (c.situation ? ttsBtn("country:" + c.iso) : "") + '</h2><p class="meta" style="margin-top:4px">' + esc(c.leader) + "</p>" + leaderLink(c.iso, "Decision-maker analysis · ") + " " + powerLink(c.iso, "Power structure · ") + "</div>" +
    '<p class="lead">' + esc(c.situation) + "</p>" + linksHtml(c) + gsBlock(c) + countryIntentHtml(c) + countryPublicsHtml(c) + histBlock(c) +
    "<section class=\"sec\"><h3>Capabilities</h3><dl class=\"figs\">" +
      fig("Defense spending", fmtUsdBn(m.spend_usd_bn), m.spend_year ? m.spend_year + "" : "") +
      fig("Active-duty troops", fmtPeople(m.active_personnel)) +
      fig("Nuclear warheads", m.nukes ? m.nukes.toLocaleString("en-US") : "—") +
      fig("Nominal GDP", fmtUsdBn(e.gdp_usd_bn), e.gdp_usd_bn ? "2025" : "") +
      fig("2026 growth forecast", fmtPct(e.growth_2026_pct)) +
      fig("Next election", p.next_election ? '<span style="font:13px var(--sans)">' + esc(p.next_election) + "</span>" : "—") +
    "</dl>" + (m.note ? "<p class=\"note\" style=\"margin-top:8px\">Military · " + esc(m.note) + "</p>" : "") + (e.note ? "<p class=\"note\" style=\"margin-top:4px\">Economy · " + esc(e.note) + "</p>" : "") + "</section>" +
    (p.regime ? "<section class=\"sec\"><h3>Politics</h3><dl class=\"kv\"><dt>System</dt><dd>" + esc(p.regime) + "</dd>" + (p.stability ? "<dt>Stability</dt><dd>" + esc(p.stability) + "</dd>" : "") + "</dl></section>" : "") +
    (recent.length ? "<section class=\"sec\"><h3>Recent developments</h3><ul class=\"tl\">" + recent.map(r => '<li><span class="d">' + esc(enDate(r.date)) + "</span><span>" + esc(r.text) + "</span></li>").join("") + "</ul></section>" : "") +
    (c.watch && c.watch.length ? "<section class=\"sec\"><h3>What to watch</h3><ul class=\"watch\">" + c.watch.map(w => "<li>" + esc(w) + "</li>").join("") + "</ul></section>" : "") +
    ((c.uncertain || []).length ? "<details class=\"src\"><summary>Unverified · " + c.uncertain.length + "</summary><ul>" + c.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") +
    "<details class=\"src\"><summary>Sources · " + (c.sources || []).length + "</summary><ul>" + (c.sources || []).map(srcItem).join("") + "</ul></details>";
}
/* v4.36(2026-10-27 결재) 나라 카드의 '클리사 지오폴리틱스에서 보기' · v4.37(같은 날 결재) 콘텐츠를 한곳에 · v4.38 권역 페이지도 같은 함수(lkHtml) */
const LK_GAME = {"1914": "The July Crisis before the First World War", "1962": "The Cuban Missile Crisis"};
const LK_STEP = {br: 10, fc: 5}, LKZ_STEP = {br: 10, fc: 10};
const LK_H = "Issues|Flashpoints|Forecasts|Briefings|Briefing digest|Features|Calendar|History games".split("|");  /* 줄 머리 이름표(영문판은 이 한 줄을 통째로 옮김) */
const LKZ_H = "Countries|Extra-regional powers".split("|");
function lkState(kind, key, step){ S.lk = S.lk || {}; const o = S.lk[kind]; if (!o || o.key !== key) S.lk[kind] = {key: key, br: step.br, fc: step.fc, step: step}; return S.lk[kind]; }
function linksHtml(c){ return '<div id="c-links-w">' + linksBody(c) + "</div>"; }
function lkRefresh(){
  const w = document.getElementById("c-links-w"); if (w && S.sel && D.countries[S.sel]) w.innerHTML = linksBody(D.countries[S.sel]);
  if (S.zone) { const z = document.getElementById("z-links-w"); if (z) z.innerHTML = zoneBody(S.zone); S.zonePins = zonePins(new Set(zoneIsos(S.zone))); requestDraw(); }
}
const lkHas = (xs, set) => (xs || []).some(i => set.has(i));
/* 연결 자료 모으기: 나라 하나(set 크기 1)든 권역이든 같은 기준 */
function lkData(set, L){
  const fo = D.forecasts.filter(f => lkHas(f.countries, set));
  const br = []; if (BR) (BR.issues || []).forEach(x => (x.items || []).forEach(i => { if (lkHas((i.loc || {}).isos, set)) br.push([x, i]); }));
  return {
    cs: (D.strategies || []).filter(k => (L.cases || []).includes(k.id)),
    fps: D.flashpoints.filter(f => lkHas(f.countries, set)),
    fs: fo.filter(f => f.status === "open").sort((a, b) => a.due.localeCompare(b.due)).concat(fo.filter(f => f.status !== "open").sort((a, b) => String(b.resolved || b.due).localeCompare(String(a.resolved || a.due)))),
    br: br,
    dg: D.digest.map((g, gi) => [g, gi]).filter(([g]) => lkHas(g.ids, set)),
    ft: FEATS().filter(F => (L.feats || []).includes(F.id)),
    ev: (D.events || []).filter(e => lkHas((e.loc || {}).isos, set) && daysLeft(e.date.length === 7 ? e.date + "-28" : (e.end || e.date)) >= 0),
    gm: (L.games || []).filter(g => LK_GAME[g])
  };
}
function lkHtml(id, kind, st, d, pre){
  pre = pre || "";
  if (!pre && !(d.cs.length + d.fps.length + d.fs.length + d.br.length + d.dg.length + d.ft.length + d.ev.length + d.gm.length)) return "";
  const row = (k, body, c) => '<div class="lk-r' + (c ? " c" : "") + '"><span class="lk-h">' + k + '</span><div class="lk-b">' + body + "</div></div>";
  const li = (dd, t, v) => '<li><span class="d">' + dd + '</span><span class="t">' + t + "</span>" + (v ? '<span class="v">' + v + "</span>" : "") + "</li>";
  const more = (k, n) => n > 0 ? '<button type="button" class="bh-xbtn lk-more" data-lkm="' + kind + ":" + k + '">' + "More" + ' <span class="mono">' + n + "</span></button>" : "";
  const ym = x => x.slice(0, 4) + "." + x.slice(5, 7), md = x => x.slice(5, 7) + "." + x.slice(8, 10);
  const RS = {yes: "Resolved yes", no: "Resolved no", void: "Voided"};
  const fsv = d.fs.slice(0, st.fc), brv = d.br.slice(0, st.br);
  return '<section class="sec lkbox" id="' + id + '">' + (kind === "c" ? "<h3>On Clisa Geopolitics</h3>" : "") + '<div class="lk">' + pre +
    (d.cs.length ? row(LK_H[0], '<div class="chips">' + d.cs.map(k => '<button type="button" class="chip" data-case="' + esc(k.id) + '">' + esc(k.title.split(":")[0]) + "</button>").join("") + "</div>", 1) : "") +
    (d.fps.length ? row(LK_H[1], '<div class="chips">' + d.fps.map(f => '<button type="button" class="chip" data-fp="' + esc(f.id) + '">' + esc(f.name_ko) + "</button>").join("") + "</div>", 1) : "") +
    (d.fs.length ? row(LK_H[2], "<ul>" + fsv.map(f => li(ym(f.due), '<button type="button" class="lt" data-fc="' + esc(f.id) + '" title="' + esc(f.q) + '">' + esc(f.s || f.q) + "</button>" + (RS[f.status] ? ' <span class="lk-rs">' + RS[f.status] + "</span>" : ""), f.p + "%")).join("") + "</ul>" + more("fc", d.fs.length - fsv.length)) : "") +
    (d.br.length ? row(LK_H[3], "<ul>" + brv.map(([x, i]) => li(md(x.date), '<a class="lt" href="' + FCT.href("/brief/" + esc(x.date) + "/") + '" data-brief="' + esc(x.date) + '">' + esc(i.h) + "</a>")).join("") + "</ul>" + more("br", d.br.length - brv.length)) : "") +
    (d.dg.length ? row(LK_H[4], "<ul>" + d.dg.map(([g, gi]) => li("", '<button type="button" class="lt" data-dg="' + gi + '">' + esc(g.t) + "</button>")).join("") + "</ul>") : "") +
    (d.ft.length ? row(LK_H[5], "<ul>" + d.ft.map(F => li(md(F.date), '<a class="lt" href="' + FCT.href("/feature/" + esc(F.id) + "/") + '" data-feat="' + esc(F.id) + '">' + esc(F.title) + "</a>")).join("") + "</ul>") : "") +
    (d.ev.length ? row(LK_H[6], "<ul>" + d.ev.map(e => li(e.date.length === 7 ? ym(e.date) : md(e.date), '<button type="button" class="lt" data-ev="' + esc(e.id) + '">' + esc(e.t) + "</button>")).join("") + "</ul>") : "") +
    (d.gm.length ? row(LK_H[7], "<ul>" + d.gm.map(g => li(g, '<a class="lt" href="' + FCT.href("/play/" + g + "/") + '">' + LK_GAME[g] + "</a>")).join("") + "</ul>") : "") +
    "</div></section>";
}
function linksBody(c){ return lkHtml("c-links", "c", lkState("c", c.iso, LK_STEP), lkData(new Set([c.iso]), c.links || {})); }
/* v4.38 시안: 휴대전화에서 세 영역 전환 단추를 펼침 단추 하나로 */
function aswFold(){
  const n = document.querySelector(".toggles .asw"); if (!n || document.querySelector(".asw-t")) return; const o = n.querySelector("a.on"); if (!o) return;
  const t = document.createElement("button"); t.type = "button"; t.className = "asw-t"; t.setAttribute("aria-haspopup", "true"); t.setAttribute("aria-expanded", "false"); t.setAttribute("aria-label", n.getAttribute("aria-label") || "");
  t.innerHTML = "<span>" + esc(o.textContent) + '</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  n.parentNode.insertBefore(t, n);
  const set = v => { n.classList.toggle("open", v); t.setAttribute("aria-expanded", v); };
  t.addEventListener("click", e => { e.stopPropagation(); set(!n.classList.contains("open")); });
  document.addEventListener("click", e => { if (!n.contains(e.target) && e.target !== t) set(false); });
  addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
}
/* v4.38 권역별 정세: 권역(zone)은 자료 D.zones, 나라마다 c.zone. 미국·중국은 역외 강대국(D.zones_powers)이라 권역에 넣지 않는다 */
S.zfold = store.get("ep.zfold") === "1";
/* v4.38c 범례와 권역 판은 데스크톱에서 함께 펼치지 않는다: 범례를 펼치면 권역 판이 잠시 접히고, 권역 판을 펼치면 범례가 접힌다 */
function legSet(off, keep){
  const H0 = document.documentElement; H0.classList.toggle("legoff", off); if (keep) store.set("ep.legoff", off ? "1" : "0");
  const b = document.getElementById("legbtn"); if (b) b.setAttribute("aria-expanded", !off);
  if (!narrow()) { if (!off && !S.zfold && !S.zfoldAuto) { S.zfoldAuto = true; zoneBarSync(); } else if (off && S.zfoldAuto) { S.zfoldAuto = false; zoneBarSync(); } }
}
const ZN = () => (D && D.zones) || [], ZPW = () => (D && D.zones_powers) || [];
const zoneOf = id => ZN().find(z => z.id === id);
const zoneIsos = id => Object.keys(D.countries).filter(k => D.countries[k].zone === id);
function zoneBody(id){
  const set = new Set(zoneIsos(id)), U = {cases: [], feats: [], games: []};
  /* 사안은 권역 나라가 결정권자인 사안, 특집·게임은 권역 나라 연결의 합 */
  (D.strategies || []).forEach(k => { if (((k.deciders || {}).items || []).some(x => set.has(x.iso))) U.cases.push(k.id); });
  set.forEach(i => { const L = D.countries[i].links || {}; ["feats", "games"].forEach(t => (L[t] || []).forEach(v => { if (!U[t].includes(v)) U[t].push(v); })); });
  const nm = i => (D.countries[i] || {}).name_ko || i;
  const pre = '<div class="lk-r c"><span class="lk-h">' + LKZ_H[0] + '</span><div class="lk-b"><div class="chips">' + [...set].sort((a, b) => nm(a).localeCompare(nm(b), "ko")).map(chip).join("") + "</div></div></div>" +
    '<div class="lk-r c"><span class="lk-h">' + LKZ_H[1] + '</span><div class="lk-b"><div class="chips">' + ZPW().map(chip).join("") + "</div></div></div>";
  return lkHtml("z-links", "z", lkState("z", id, LKZ_STEP), lkData(set, U), pre);
}
function zonePins(set){
  const out = [], t0 = new Date(Date.now() - 14 * 864e5), lim = t0.getFullYear() + "-" + String(t0.getMonth() + 1).padStart(2, "0") + "-" + String(t0.getDate()).padStart(2, "0");
  if (BR) (BR.issues || []).forEach(x => { if (x.date < lim) return; (x.items || []).forEach(i => { const L = i.loc; if (L && L.lon != null && lkHas(L.isos, set)) out.push({lon: L.lon, lat: L.lat, place: String(L.place || "").split("(")[0].trim(), k: "b"}); }); });
  (D.events || []).forEach(e => { const L = e.loc; if (L && L.lon != null && lkHas(L.isos, set) && daysLeft(e.date.length === 7 ? e.date + "-28" : (e.end || e.date)) >= 0) out.push({lon: L.lon, lat: L.lat, place: String(L.place || "").split("(")[0].trim(), k: "e"}); });
  return out;
}
function zoneBarSync(){
  const b = document.getElementById("zonebar"); if (!b) return; if (!ZN().length) { b.hidden = true; return; }
  const fold = !narrow() && (S.zfold || S.zfoldAuto), z0 = zoneOf(S.zone); b.classList.toggle("fold", !!fold);  /* v4.38b 지도 표시처럼 접기(데스크톱) */
  if (fold) { b.innerHTML = '<button type="button" class="legbtn zbtn" data-zfold="0" aria-expanded="false"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="7.2"/><path d="M2.8 10h14.4M10 2.8c2.2 2.3 2.2 12.1 0 14.4M10 2.8c-2.2 2.3-2.2 12.1 0 14.4"/></svg>' + "Regions" + (z0 ? " <b>" + esc(z0.name_ko) + "</b>" : "") + "</button>"; b.hidden = false; return; }
  b.innerHTML = '<span class="lbl">' + "Regions" + '</span><button type="button" class="zx" data-zfold="1" aria-label="' + "Collapse" + '" title="' + "Collapse" + '">×</button>' + ZN().map(z => '<button type="button" class="zc" data-zone="' + esc(z.id) + '" aria-pressed="' + (S.zone === z.id) + '">' + esc(z.name_ko) + "</button>").join("") +
    '<div class="zp-row"><span class="lbl zp">' + LKZ_H[1] + "</span>" + ZPW().map(i => '<button type="button" class="zc" data-iso="' + i + '">' + esc(D.countries[i].name_ko) + "</button>").join("") + "</div>" +
    (D.countries.EUR ? '<span class="lbl zp zo">' + "Non-state actors" + '</span><button type="button" class="zc zo" data-iso="EUR">' + esc(D.countries.EUR.name_ko) + "</button>" : "");  /* 휴대전화에서는 국가 밖 행위자도 이 줄로(지구본 아래 따로 있던 줄을 대신) */
  b.hidden = false;
  const on = b.querySelector('[aria-pressed="true"]'); if (on && narrow()) on.scrollIntoView({block: "nearest", inline: "center"});
}
function renderRegion(){
  const el = document.getElementById("pane-region"); if (!el) return; const z = zoneOf(S.zone); if (!z) { el.innerHTML = ""; return; }
  el.innerHTML = '<div class="sec"><p class="eyebrow">' + "Regional Outlook" + '</p><h2 style="margin-top:4px">' + esc(z.name_ko) + "</h2>" +
    '<p class="note">' + "Issues, forecasts and briefings involving the countries of this region. The U.S. and China act across several regions, so they are listed separately as extra-regional powers." + "</p>" +
    '<p class="note zkey"><span class="zk b"></span>' + "Event locations in the past two weeks' briefings" + ' <span class="zk e"></span>' + "Upcoming events" + "</p></div>" +
    '<div id="z-links-w">' + zoneBody(z.id) + "</div>";
  el.scrollTop = 0;
}
function goZone(id){
  const z = zoneOf(id); if (!z) return;
  const set = new Set(zoneIsos(id));
  S.zone = id; S.lens = {id: "zone:" + id, set: set, off: []}; S.zonePins = zonePins(set);
  const H0 = document.documentElement; if (!narrow() && !H0.classList.contains("legoff")) { legSet(true, false); S.zoneLeg = true; }  /* 권역을 가리지 않게 범례를 잠시 접음(저장하지 않음) */
  renderRegion(); switchTab("region"); zoneBarSync();
  viewGo(z.lon, z.lat, z.k, true); requestDraw(true);
}
function zoneOff(){ if (!S.zone) return; S.zone = null; S.zonePins = null; if (S.zoneLeg) { S.zoneLeg = false; legSet(false, false); } if (S.lens && String(S.lens.id).indexOf("zone:") === 0) S.lens = null; zoneBarSync(); requestDraw(true); }
document.addEventListener("click", ev => {
  const zf = ev.target.closest("[data-zfold]"); if (zf) { S.zfold = zf.dataset.zfold === "1"; S.zfoldAuto = false; store.set("ep.zfold", S.zfold ? "1" : "0"); if (!S.zfold && !narrow() && !document.documentElement.classList.contains("legoff")) legSet(true, true); zoneBarSync(); return; }
  const zb = ev.target.closest("[data-zone]");  /* v4.38 권역 단추: 다시 누르면 권역 보기를 끄고 세계 정세로 */
  if (zb) { ev.preventDefault(); if (S.zone === zb.dataset.zone && S.tab === "region") { zoneOff(); viewRestore(); switchTab("overview"); } else goZone(zb.dataset.zone); return; }
  const b = ev.target.closest("[data-lkm]"); if (!b || !S.lk) return;  /* 연결 칸의 더 보기(그 자리에서) */
  const [kind, k] = b.dataset.lkm.split(":"), o = S.lk[kind]; if (!o) return;
  o[k] += o.step[k]; lkRefresh();
});
function countryIntentHtml(c){
  const v = c.intent; const cases = (D.strategies || []).filter(k => k.deciders && k.deciders.items.some(d => d.iso === c.iso));
  if (!v && !cases.length) return "";
  const row = x => '<tr><td><span class="sw ' + x.w + '">' + (x.w === "said" ? "Said" : "Did") + '</span></td><td class="mono">' + esc(enDate(x.date)) + "</td><td>" + esc(x.k) + "</td><td>" + esc(x.t) + (x.url ? ' <a href="' + esc(x.url) + "\" target=\"_blank\" rel=\"noopener\">Original</a>" : "") + "</td></tr>";
  const sig = v ? v.signals.slice().sort((a, b) => a.w === b.w ? String(b.date).localeCompare(String(a.date)) : (a.w === "said" ? -1 : 1)) : [];
  return "<section class=\"sec\" id=\"c-intent\"><h3>Intent indicators · words and deeds</h3>" + (v ? '<p><span class="fit ' + fitCls(v.fit) + '">' + esc(ev(v.fit)) + '</span></p><div class="tbl-wrap intent-c"><table class="tbl" style="min-width:480px"><tbody>' + sig.map(row).join("") + '</tbody></table></div><p style="font-size:13px;color:var(--ink)">' + esc(v.read) + "</p>" : "") +
    (cases.length ? "<p class=\"note\" style=\"margin-top:6px\">Strategic analyses in which this country is a deciding power · " + cases.map(k => '<button type="button" class="chip" data-case="' + esc(k.id) + '">' + esc(k.title.split(":")[0]) + "</button>").join(" ") + "</p>" : "") + "</section>";
}
function gsBlock(c){
  const g = c.gs; if (!g) return "";
  const ul = xs => "<ul>" + xs.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  return "<section class=\"sec gs\"><h3>Grand strategy</h3>" +
    '<p class="gs-core">' + esc(g.core) + "</p>" +
    '<div class="gs-grid">' +
      "<div class=\"gs-box goal wide\"><h5><i></i>Must achieve</h5>" + ul(g.goals) + "</div>" +
      "<div class=\"gs-box give\"><h5><i></i>Can concede</h5>" + ul(g.give) + "</div>" +
      "<div class=\"gs-box never\"><h5><i></i>Will never concede</h5>" + ul(g.never) + "</div>" +
    "</div>" +
    "<p>" + esc(g.summary) + "</p>" +
    "<p class=\"note\"><b style=\"color:var(--ink-2)\">Internal contradiction</b> · " + esc(g.contra) + "</p>" + drvBlock(c) + "</section>";
}
const nm = iso => (D.countries[iso] || {}).name_ko || iso;
const DLAB = {geo:"Geography", power:"National power", regime:"Regime and domestic politics", memory:"Historical memory"};
const drvBar = w => '<div class="drv" role="img" aria-label="' + Object.keys(DLAB).map(k => DLAB[k] + " " + w[k]).join(", ") + '">' + Object.keys(DLAB).map(k => '<i style="flex:' + w[k] + " 0 0;background:var(--d-" + k + ')"></i>').join("") + "</div>";
const drvLab = (w, top) => '<div class="drv-lab">' + Object.keys(DLAB).map(k => '<span style="--c:var(--d-' + k + ')"' + (k === top ? ' class="top"' : "") + ">" + DLAB[k] + " <b>" + w[k] + "</b></span>").join("") + "</div>";
function drvBlock(c){
  const d = c.drivers; if (!d) return "";
  return "<div style=\"display:grid;gap:6px;margin-top:4px\"><h3 style=\"margin:0\">What drives this grand strategy <span style=\"font-weight:400\">(relative weight, total 100)</span></h3>" + drvBar(d.w) + drvLab(d.w, d.top) + "<p class=\"note\">The dominant driver is <b style=\"color:var(--ink)\">" + DLAB[d.top] + "</b>. " + esc(d.why) + "</p></div>";
}
function cellColor(sv){
  const t = Math.abs(sv) === 2 ? 0.9 : Math.abs(sv) === 1 ? 0.42 : 0;
  return sv === 0 ? C.panel2 : d3.interpolateLab(C.panel2, sv > 0 ? C.coop : C.conflict)(t);
}
function dyadHtml(a, b){
  const G = D.grand;
  const d = G.dyads.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const cell = G.cells.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const li = xs => "<ul>" + xs.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  let h = '<div class="dyad"><div class="pair">' + esc(nm(a)) + " ↔ " + esc(nm(b)) + " " + ttsBtn("dyad:" + a + "|" + b) + "</div>";
  if (cell) h += "<p class=\"meta\">Relationship score <span class=\"mono\">" + (cell.s > 0 ? "+" : cell.s < 0 ? "−" : "") + Math.abs(cell.s) + "</span> · " + esc(cell.t) + "</p>";
  if (d) h += "<div class=\"cols\"><div><h5 class=\"c\">Where they can cooperate</h5>" + li(d.coop) + "</div><div><h5 class=\"x\">Where they clash</h5>" + li(d.conflict) + "</div></div><p><b>Outlook</b> · " + esc(d.outlook) + "</p>";
  return h + '<div class="chips" style="margin:0">' + chip(a) + chip(b) + "</div></div>";
}
let mxSel = ["USA", "CHN"];
const ABBR = {USA:"U.S.", CHN:"", RUS:"Russia", EUR:"EU", JPN:"", KOR:"S. Korea", PRK:"N. Korea", IND:"India", IRN:"Iran", ISR:"Israel", TUR:"Turkey"};
function scoreBoxHtml(){
  const top = Object.values(D.countries).filter(c => !c.offmap && milV(c) != null).sort((a, b) => b.mil.spend_usd_bn - a.mil.spend_usd_bn).slice(0, 10);
  return "<div class=\"layer-sw\" role=\"radiogroup\" aria-label=\"Globe view\">" + Object.keys(LAYERS).map(k => '<button type="button" role="radio" class="chip' + (k === S.layer ? " on" : "") + '" aria-checked="' + (k === S.layer) + '" data-layer="' + k + '">' + LAYERS[k].label + "</button>").join("") + "</div>" +
    "<p class=\"note\" style=\"margin:8px 0\">Top 10 by military expenditure · SIPRI, 2025 (bars on a log scale)</p><div class=\"bars\">" + top.map(c =>
      '<button type="button" class="bar" data-iso="' + c.iso + '"><span>' + esc(c.name_ko) + '</span><span class="track"><span class="fill" style="display:block;width:' + milV(c) + "%;background:" + ramp("mil", 25 + 0.75 * milV(c)) + '"></span></span><span class="v">' + fmtUsdBn(c.mil.spend_usd_bn) + "</span></button>").join("") + "</div>";
}
function renderGrand(){
  const G = D.grand, M = G.matrix_order;
  const score = (a, b) => { const c = G.cells.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)); return c ? c.s : null; };
  const hasDy = (a, b) => G.dyads.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const sign = v => v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0";
  let mx = "<div class=\"mx-wrap\"><table class=\"mx\" aria-label=\"Cooperation-conflict matrix of major actors\"><thead><tr><th></th>" + M.map(i => "<th scope=\"col\" title=\"" + esc(nm(i)) + "\">" + esc(ABBR[i] || nm(i)) + "</th>").join("") + "</tr></thead><tbody>";
  for (const a of M) {
    mx += '<tr><th scope="row">' + esc(nm(a)) + "</th>";
    for (const b of M) {
      if (a === b) { mx += '<td class="diag"></td>'; continue; }
      const v = score(a, b), sel = (mxSel[0] === a && mxSel[1] === b) || (mxSel[0] === b && mxSel[1] === a);
      mx += '<td><button type="button" class="' + (sel ? "sel" : "") + '" data-mx="' + a + "|" + b + '" title="' + esc(nm(a) + " ↔ " + nm(b)) + '" style="background:' + cellColor(v) + ";color:" + (Math.abs(v) === 2 ? "var(--panel)" : "var(--ink)") + (hasDy(a, b) ? ";font-weight:600" : ";font-weight:400") + '">' + sign(v) + (hasDy(a, b) ? "•" : "") + "</button></td>";
    }
    mx += "</tr>";
  }
  mx += "</tbody></table></div>";
  const key = '<div class="mx-key">' + [[-2,"Structural conflict"],[-1,"Mostly competitive"],[0,"Mixed"],[1,"Mostly cooperative"],[2,"Alliance-level"]].map(([v,l]) => '<span><i style="background:' + cellColor(v) + '"></i>' + sign(v) + " " + l + "</span>").join("") + "<span>• Detailed analysis available</span></div>";
  const others = G.dyads.filter(d => !(M.includes(d.a) && M.includes(d.b)));
  const order = ["geo","power","regime","memory"];
  const cs = Object.values(D.countries).filter(c => c.drivers).sort((a, b) => order.indexOf(a.drivers.top) - order.indexOf(b.drivers.top) || b.drivers.w[b.drivers.top] - a.drivers.w[a.drivers.top]);
  const cnt = k => cs.filter(c => c.drivers.top === k).length;
  $("#pane-grand").innerHTML =
    "<div class=\"sec\"><h2>World Order</h2><p class=\"meta\" style=\"margin-top:4px\">" + pl(G.scenarios.length, "world scenario") + " · " + pl(G.trends.length, "structural trend") + " · " + pl(G.dyads.length, "relationship analysis", "relationship analyses") + "</p><p class=\"lead\" style=\"margin-top:8px\">Beyond individual issues, this section examines the structures that shape the world order as a whole: world scenarios through 2030, structural trends, and the grand strategies of major actors and their relations with one another, along with how each scenario would affect the course of individual issues.</p></div>" +
    tocHtml([["g-scn","Scenarios"],["g-trend","Structural trends"],["g-mx","Relationship matrix"],["g-drv","Drivers of grand strategy"],["g-ten","History and structure"],["g-score","Globe views"]]) +
    "<section class=\"sec\" id=\"g-scn\"><h3>World scenarios through 2030 · probabilities sum to 100% " + ttsBtn("scn") + '</h3><ul class="list">' + G.scenarios.map(sc => {
      const th = D.thinkers.find(t => t.id === sc.thinker);
      return '<li class="scn"><div class="scn-h"><b>' + esc(sc.id + ". " + sc.name) + '</b><span class="p">' + sc.p + '<small style="font-size:12px;color:var(--muted)">%</small></span></div><div class="prob"><i style="width:' + sc.p + '%"></i></div><p style="font-size:13px;color:var(--ink-2)">' + esc(sc.d) + "</p><div><h3 style=\"margin:4px 0 4px\">Leading indicators</h3><ul>" + sc.signals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div><div class=\"kr\"><b>For South Korea</b> · " + esc(sc.korea) + "</div>" + (sc.case_fut || sc.korea_fut ? "<div class=\"note\" style=\"margin:0;display:grid;gap:3px\"><b style=\"color:var(--ink-2)\">How each issue unfolds by 2030 in this scenario</b>" + Object.entries(Object.assign({korea: sc.korea_fut}, sc.case_fut || {})).filter(([, m]) => m).map(([cid, m]) => { const k = (D.strategies || []).find(x => x.id === cid); return '<span><button type="button" class="chip" data-case="' + cid + '">' + esc(k ? k.title.split(":")[0] : cid) + "</button> " + Object.entries(m).map(([f, v]) => '<span class="mono" style="color:' + fcol(f) + '">' + f + " " + v + "%</span>").join(" · ") + "</span>"; }).join("") + "</div>" : "") + (th ? '<button type="button" class="lens-btn" data-lens="' + th.id + "\">Thinker’s lens · " + esc(th.name) + "</button>" : "") + "</li>";
    }).join("") + "</ul><p class=\"note\" style=\"margin-top:8px\">Scenario probabilities are judgment estimates and are revised as leading indicators emerge.</p></section>" +
    "<section class=\"sec\" id=\"g-trend\"><h3>Structural trends " + ttsBtn("trend") + '</h3><ul class="list">' + G.trends.map(t => '<li class="trend"><b>' + esc(t.t) + "</b><p>" + esc(t.d) + "</p>" + (t.prec_note ? "<p class=\"pn\">Precedent check · " + esc(t.prec_note) + "</p>" : "") + (t.review ? "<p class=\"pn\">Independent red-team review · " + esc(t.review) + "</p>" : "") + aiPrecHtml(t.prec, "") + "</li>").join("") + "</ul></section>" +
    "<section class=\"sec\" id=\"g-mx\"><h3>Cooperation-conflict matrix · select a cell to see the bilateral relationship</h3><p class=\"note\" style=\"margin-bottom:8px\">Conflict arises where countries’ top priorities and non-negotiables collide; deals become possible where one side’s list of acceptable concessions overlaps with the other side’s list of must-haves.</p>" + mx + key + '<div id="dyad-box" style="margin-top:12px">' + dyadHtml(mxSel[0], mxSel[1]) + "</div></section>" +
    (others.length ? "<section class=\"sec\"><h3>Key relationships outside the matrix</h3>" + others.map(d => '<details class="dy"><summary>' + esc(nm(d.a)) + " ↔ " + esc(nm(d.b)) + "</summary>" + dyadHtml(d.a, d.b) + "</details>").join("") + "</section>" : "") +
    "<section class=\"sec\" id=\"g-drv\"><h3>What drives grand strategy</h3><p class=\"note\" style=\"margin-bottom:10px\">Countries by dominant driver: geography " + cnt("geo") + ", regime and domestic politics " + cnt("regime") + ", national power " + cnt("power") + ", historical memory " + cnt("memory") + ". In most countries, historical memory draws the lines that will not be crossed rather than driving strategy as a whole. " + esc(G.drivers_note) + "</p>" +
      drvLab({geo:"",power:"",regime:"",memory:""}, null).replace(/ <b><\/b>/g, "") +
      '<div style="display:grid;gap:2px;margin-top:8px">' + cs.map(c => '<button type="button" class="drv-row" data-iso="' + c.iso + '"><span class="n">' + esc(c.name_ko) + "</span>" + drvBar(c.drivers.w) + '<span class="t">' + DLAB[c.drivers.top] + " " + c.drivers.w[c.drivers.top] + "</span></button>").join("") + "</div></section>" +
    "<section class=\"sec\" id=\"g-ten\"><h3>Where history and structure diverge " + ttsBtn("ten") + "</h3><p class=\"note\" style=\"margin-bottom:8px\">These are relationships in which historical grievances run deep but the balance of power demands cooperation. Whether memory or structure prevails shows how much history actually moves grand strategy.</p><ul class=\"list\">" +
      G.tensions.map(t => '<li class="ten"><div class="hd"><b>' + esc(nm(t.a)) + " ↔ " + esc(nm(t.b)) + '</b><span class="st ' + (t.verdict === "구조 우위" ? "yes" : "open") + '">' + esc(ev(t.verdict)) + "</span></div><dl><dt>Memory</dt><dd>" + esc(t.memory) + "</dd><dt>Structure</dt><dd>" + esc(t.structure) + "</dd></dl><p class=\"note\">" + esc(t.note) + "</p></li>").join("") + "</ul></section>" +
    "<section class=\"sec\" id=\"g-score\"><h3>Globe views</h3><p class=\"note\" style=\"margin-bottom:8px\">By default, the globe is colored by analytical focus. The military power view is colored by 2025 military expenditure (SIPRI).</p><div id=\"scorebox\">" + scoreBoxHtml() + "</div></section>" +
    "<section class=\"sec\"><h3>Grand strategy by country</h3><div class=\"chips\" style=\"margin:0\">" + Object.values(D.countries).filter(c => c.gs).map(c => chip(c.iso)).join("") + "</div></section>" +
    "";
}
const FP_AN = {"rus-ukr":"rus-ukr", "iran-war":"iran-war", "taiwan-strait":"taiwan", "korea":"korea-deal", "baltic-kaliningrad-suwalki":"east-flank"};
function histBlock(c){
  const h = c.hist; if (!h) return "";
  return "<section class=\"sec hist\"><h3>Geopolitics in history</h3><p class=\"hist-mean\">" + esc(h.meaning) + "</p>" +
    '<ul class="tl">' + h.episodes.map(e => '<li><span class="d">' + esc(e.y) + "</span><span>" + esc(e.t) + "</span></li>").join("") + "</ul>" +
    "<div class=\"lesson\"><b>What they learned from history</b><p>" + esc(h.learned) + "</p></div>" +
    "<div class=\"lesson\"><b>History’s warning</b><p>" + esc(h.read) + "</p></div></section>";
}
function analogHtml(a, compact){
  if (!a) return "";
  return '<article class="an">' + (compact ? "" : "<h4>" + esc(a.now) + "</h4>") +
    '<div class="tags">' + a.cases.map(x => '<span class="tag">' + esc(x) + "</span>").join("") + "</div>" +
    "<dl><div><dt>How it played out then</dt><dd>" + esc(a.then) + "</dd></div><div><dt>Implications for today</dt><dd class=\"imp\">" + esc(a.implies) + "</dd></div><div><dt class=\"brk\">How today differs</dt><dd>" + esc(a.breaks) + "</dd></div></dl>" +
    (compact ? "" : '<div class="chips" style="margin:0">' + a.countries.map(chip).join("") + "</div>") + "</article>";
}

const exitCase = id => (D.exits && D.exits.cases.find(c => c.fp === id)) || null;

function renderDiscuss(){
  const th = (D.discuss && D.discuss.threads) || [];
  const vcls = v => v.startsWith("지지") ? "ok" : v.startsWith("보정") ? "fix" : "no";
  $("#pane-discuss").innerHTML =
    '<div class="sec"><p class="eyebrow"></p><h2 style="margin-top:4px"></h2></div>' +
    th.map((t, i) =>
      "<article class=\"sec\" style=\"display:grid;gap:22px\"><div><p class=\"eyebrow\">Discussion " + String(i + 1).padStart(2, "0") + " · " + "Opened " + esc(enDate(t.opened)) + " · " + esc(t.status) + '</p><h2 style="margin-top:4px;font-size:20px">' + esc(t.title) + "</h2></div>" +
      '<section class="sec"><h3>' + esc(t.claim_by) + "’s thesis</h3><ol class=\"claim\">" + t.claim.map(c => "<li>" + esc(c) + "</li>").join("") + "</ol></section>" +
      "<section class=\"sec\"><h3>What history confirms · " + esc(t.history.title) + '</h3><ul class="hpoints">' + t.history.points.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul><div class=\"lesson-box\" style=\"margin-top:10px\"><b>The upshot</b>" + esc(t.history.lesson) + "</div></section>" +
      "<section class=\"sec\"><h3>Reviewing the thesis</h3><ul class=\"list\">" + t.review.map(r => '<li class="rv"><div class="hd"><span>' + esc(r.step) + '</span><span class="vd ' + vcls(r.verdict) + '">' + esc(ev(r.verdict)) + "</span></div><p>" + esc(r.text) + "</p></li>").join("") + "</ul></section>" +
      "<section class=\"sec\"><h3>Missing factors</h3><ul class=\"list\">" + t.missing.map(m => '<li class="rv"><b>' + esc(m.t) + '</b><p>' + esc(m.d) + "</p></li>").join("") + "</ul></section>" +
      "<section class=\"sec\"><h3>Possible paths to unification</h3><div style=\"display:grid;gap:10px\">" + t.paths.map(p => '<div class="path"><div class="hd"><b>' + esc(p.name) + '</b><span class="aim">' + esc(p.odds) + '</span></div><p class="meta">' + esc(p.who) + "</p><dl><dt>What it would look like</dt><dd>" + esc(p.how) + "</dd><dt>Precedent</dt><dd>" + esc(p.precedent) + "</dd><dt>Conditions</dt><dd>" + esc(p.cond) + "</dd></dl></div>").join("") + '</div>' + (PUB() ? "" : '<p class="note" style="margin-top:8px"></p>') + '</section>' +
      (t.closing ? '<section class="sec"><h3>' + esc(t.closing.by) + "’s conclusion · " + esc(enDate(t.closing.date)) + '</h3><ol class="claim">' + t.closing.points.map(c => "<li>" + esc(c) + "</li>").join("") + "</ol><div class=\"lesson-box\" style=\"margin-top:10px\"><b>Where the discussion goes next</b>" + esc(t.closing.note) + "</div></section>" : "") +
      "<section class=\"sec\"><h3>Open questions</h3><ul class=\"watch\">" + t.open.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>" +
      "<section class=\"sec\"><h3>Signals to watch</h3><ul class=\"watch\">" + t.signals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>" +
      "<details class=\"src\"><summary>Sources · " + t.sources.length + "</summary><ul>" + t.sources.map(srcItem).join("") + "</ul></details></article>"
    ).join('<hr style="border:0;border-top:1px solid var(--line);margin:0">');
}
const WDIM = [["safety","Life and safety"],["living","Livelihood"],["freedom","Freedom"],["bond","Relationships and community"]];
const FCOL = {F1:"var(--d-geo)", F5:"var(--d-deal)", F2:"var(--d-regime)", F3:"var(--d-memory)", F4:"var(--d-power)", U6:"var(--d-deal)", I6:"var(--d-deal)"};
const FSLOT = ["var(--d-geo)","var(--d-memory)","var(--d-power)","var(--conflict)","var(--d-regime)"];
const fcol = k => FCOL[k] || FSLOT[(parseInt(String(k).replace(/\D/g, ""), 10) - 1) % 5] || "var(--muted)";
const LNAME = {"1":"Ⅰ. Situation assessment","2":"Ⅱ. Strategy evaluation","3":"Ⅲ. What it means for people","V":"Ⅳ. Verification"};
const wbar = v => v == null ? "<span class=\"bar na\"><b>Not yet measured</b><i></i></span>" : '<span class="bar"><b>' + (Math.round(v * 10) / 10) + '</b><i style="--w:' + Math.max(0, Math.min(100, v)) + '%"></i></span>';
const wdl = (v, b) => { if (v == null || b == null) return ""; const d = Math.round((v - b) * 10) / 10; return '<span class="dl ' + (d > 0.05 ? "up" : d < -0.05 ? "dn" : "eq") + '">' + (d > 0.05 ? "▲" + d : d < -0.05 ? "▼" + Math.abs(d) : "±0") + "</span>"; };
const fmt = v => v == null ? "—" : String(Math.round(v * 10) / 10);
const stpH = (n, t) => '<div class="stp-h"><i>' + n + "</i><b>" + esc(t) + "</b></div>";
const ltag = L => '<span class="ltag l' + L + '">' + ({"1":"Ⅰ","2":"Ⅱ","3":"Ⅲ","V":"Ⅳ"}[L] || L) + "</span>";
function concHtml(c){
  if (!c.conclusions) return "";
  const cls = t => t === "높음" ? "hi" : t === "중간" ? "mid" : t === "가치 판단" ? "val" : "lo";
  /* v3.81 의회 변수: 이 판단에 영향을 주는 '의회의 쟁점'(congress[].affects). 누르면 그 쟁점을 펼친다 */
  const cgv = id => { const L = (c.congress || []).map((x, i) => [x, i]).filter(([x]) => (x.affects || []).includes(id));
    return L.length ? "<span><b>Legislative factor</b>" + L.map(([x, i]) => '<button type="button" class="chip" data-cg="' + esc(c.id) + ":" + i + '">' + esc(nm(x.iso)) + " · " + esc(x.t) + "</button>").join(" ") + "</span>" : ""; };
  return "<section class=\"concl\"><h3>Key judgments</h3><ol>" + c.conclusions.map(k =>
    '<li><span class="cid">' + k.id + '</span><div><div class="ct">' + (k.L ? ltag(k.L) : "") + esc(k.t) + '<span class="conf ' + cls(k.conf) + '">' + (k.conf === "가치 판단" ? "Value judgment" : "Confidence " + esc(ev(k.conf)) + (k.confp ? " " + k.confp + "%" : "")) + '</span></div><div class="cm">' +
    "<span><b>Reasoning</b>" + esc(k.why) + " (" + (k.steps.length === 1 ? "step " : "steps ") + k.steps.join(", ") + ")</span>" +
    "<span><b>What would change this assessment</b>" + esc(k.flip) + "</span>" +
    (k.fc.length ? "<span><b>Forecasts that test it</b>" + k.fc.map(f => '<span class="mono">' + f + "</span>").join(", ") + "</span>" : "") + cgv(k.id) +
    "</div></div></li>").join("") + "</ol><p class=\"note\">Confidence expresses, as a range, the likelihood that a judgment will not be overturned within five years. Value judgments under ‘What it means for people’ are not assigned probabilities." + (PUB() ? "" : "") + '</p></section>';
}
const fitCls = f => f === "일치" ? "ok" : f === "불일치" ? "no" : "part";
function intentHtml(d, caseId){
  const cv = (D.countries[d.iso] || {}).intent, dv = d.intent || {};
  if (!cv && !dv.read) return "";
  const v = {said: (cv ? cv.signals : []).filter(x => x.w === "said" && (!x.case || x.case === caseId)), did: (cv ? cv.signals : []).filter(x => x.w === "did" && (!x.case || x.case === caseId)),
             fit: dv.fit || (cv || {}).fit, read: dv.read || (cv || {}).read, watch: dv.watch || (cv || {}).watch || []};
  const row = (x, w) => '<tr><td><span class="sw ' + w + '">' + (w === "said" ? "Said" : "Did") + '</span></td><td class="mono">' + esc(enDate(x.date)) + "</td><td>" + esc(x.k) + "</td><td>" + esc(x.t) + (x.url ? ' <a href="' + esc(x.url) + "\" target=\"_blank\" rel=\"noopener\">Original</a>" : "") + "</td></tr>";
  return "<div class=\"intent\"><div class=\"ih\"><b>Intent indicators</b><span class=\"fit " + fitCls(v.fit) + "\">Words and deeds: " + esc(ev(v.fit)) + '</span></div><div class="tbl-wrap"><table class="tbl" style="min-width:480px"><tbody>' +
    v.said.map(x => row(x, "said")).join("") + v.did.map(x => row(x, "did")).join("") + '</tbody></table></div><p class="ir">' + esc(v.read) + "</p><p class=\"note\"><b>Signals to watch</b> · " + v.watch.map(w => esc(w.t) + " (" + esc(w.when) + ")").join(" · ") + "</p><p class=\"note\">All signals are in the <button type=\"button\" class=\"chip\" data-iso=\"" + esc(d.iso) + '">' + esc(nm(d.iso)) + " country profile</button>.</p></div>";
}
/* v3.40 결정권자 쪽(/leader/<slug>/) 연결 */
function LLK(){ return D.leader_links || {}; }
const lurl = i => "/en/power/" + i + "/" + (LLK()[i] || {}).slug + "/";  /* v3.60 결정권자 쪽은 권력 구조 아래(시안) */
function leadersRow(){
  const L = LLK(), order = ["USA", "CHN", "PRK", "RUS", "KOR", "UKR"].filter(i => L[i]);
  return order.length ? "<section class=\"sec\"><h3>Decision-makers</h3><p class=\"note\" style=\"margin:4px 0 8px\">For each issue, an analysis of the worldview and decision-making style of the person who makes the final call, and of whether that person’s words match their decisions.</p><div style=\"display:flex;flex-wrap:wrap;gap:6px\">" +
    order.map(i => '<a class="chip" href="' + lurl(i) + '">' + esc(L[i].name) + (i === "KOR" || i === "UKR" ? " · strategic actor" : "") + "</a>").join("") + "<a class=\"chip\" href=\"/en/power/\">All power structures →</a></div></section>" : "";
}
/* v3.53 권력 구조 쪽(/power/<ISO>/) 연결 */
function PLK(){ return D.power_links || {}; }
function powerLink(iso, pre, hash){ const L = PLK()[iso]; return L ? '<a class="chip" style="display:inline-block;margin-top:6px" href="' + (hash ? "/en/power/" + iso + "/" + hash : "/en/power/#" + iso) + '">' + esc(pre) + esc(L.name) + " · who decides and who can block it →</a>" : ""; }
function leaderLink(iso, pre){ const L = LLK()[iso]; return L ? '<a class="chip" style="display:inline-block;margin-top:6px" href="' + lurl(iso) + '">' + esc(pre) + esc(L.name) + " · worldview and decision-making →</a>" : ""; }
function decHtml(c, n){
  const X = c.deciders; if (!X) return "";
  const O = c.external ? c.external.order : c.futures.items.map(f => f.id);
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  const lvc = {"선호":"lv-a","수용":"lv-b","불편":"lv-c","거부":"lv-d"};
  const ul = a => "<ul>" + a.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  return '<section class="stp">' + stpH(n, "Decision-Maker Analysis") + "<p class=\"note\">For each country with decision-making power, this section sets out, from that country’s own perspective, how it defines the problem, what it seeks to achieve, which means it uses, and how it is likely to respond to the strategic actor’s options, then compares each country’s preferred scenarios in a single table. Intent is assessed by separating words from costly actions.</p>" +
    '<div class="decs">' + X.items.map((d, i) => '<details class="dec" id="dec-' + esc(c.id) + '-' + d.iso + '"' + (i === 0 ? " open" : "") + '><summary><span class="nm">' + esc(nm(d.iso)) + "</span><span class=\"pw\">Decision power " + esc(ev(d.power)) + '</span><span class="fr">' + esc(d.frame) + "</span></summary><dl>" +
      (LLK()[d.iso] ? "<dt>Decision-maker</dt><dd>" + leaderLink(d.iso, "") + "</dd>" : "") +
      (PLK()[d.iso] ? "<dt>Power structure</dt><dd>" + powerLink(d.iso, "") + "</dd>" : "") +
      "<dt>Instruments of power</dt><dd>" + esc(d.means) + "</dd>" +
      "<dt>Objectives in order of priority</dt><dd><ol>" + d.goals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ol></dd>" +
      "<dt>Strategy</dt><dd>" + esc(d.strategy) + "</dd>" +
      "<dt>Current tactics</dt><dd>" + ul(d.tactics) + "</dd>" +
      "<dt>Lines it will not cross</dt><dd class=\"red\">" + ul(d.red) + "</dd>" +
      "<dt>View of external variables</dt><dd>" + esc(d.ext) + "</dd>" +
      "<dt>What it wants from the strategic actor</dt><dd>" + esc(d.want) + "</dd>" +
      "<dt>Response to the strategic actor’s options</dt><dd>" + esc(d.onrec) + "</dd>" +
      "<dt>Leverage held by the strategic actor</dt><dd class=\"lev\">" + esc(d.lever) + "</dd>" +
      "</dl>" + intentHtml(d, c.id) + '<div class="chips" style="margin:0 12px 12px"><button type="button" class="chip" data-iso="' + d.iso + '">' + esc(nm(d.iso)) + " profile and grand strategy</button></div></details>").join("") + "</div>" +
    (X.intent ? "<h3 style=\"margin:6px 0 0\">Do words match deeds?</h3><p class=\"note\">" + esc(X.intent.note) + "</p><div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:520px\"><thead><tr><th>Country</th><th>Consistency</th><th>Interpretation</th></tr></thead><tbody>" +
      X.items.filter(d => d.intent).map(d => "<tr><td><b>" + esc(nm(d.iso)) + '</b></td><td><span class="fit ' + fitCls(d.intent.fit) + '">' + esc(ev(d.intent.fit)) + "</span></td><td>" + esc(d.intent.read) + "</td></tr>").join("") + "</tbody></table></div><div class=\"lesson-box\"><b>What words and deeds imply</b>" + esc(X.intent.read) + "</div>" : "") +
    "<h3 style=\"margin:6px 0 0\">Preferred scenarios by country</h3><div class=\"tbl-wrap\"><table class=\"tbl pref\" style=\"min-width:560px\"><thead><tr><th>Country</th>" + O.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span> " + esc(fn[k]) + "</th>").join("") + "</tr></thead><tbody>" +
      X.items.map(d => "<tr><td><b>" + esc(nm(d.iso)) + '</b><br><span class="note">' + esc(ev(d.power)) + "</span></td>" + O.map(k => { const v = d.pref[k]; return '<td><span class="lv ' + lvc[v[0]] + '">' + esc(ev(v[0])) + '</span><span class="why">' + esc(v[1]) + "</span></td>"; }).join("") + "</tr>").join("") +
    '</tbody></table></div><p class="note">' + esc(X.syn.note) + '</p><ol class="synth">' + X.syn.reads.map(r => "<li><b>" + esc(r.t) + "</b><span>" + esc(r.d) + "</span></li>").join("") + "</ol>" + congHtml(c) + "</section>";
}
/* v3.54 의회의 쟁점: 결정권자의 결정에 의회가 조건·동의·거부권을 행사하는 쟁점(사안 쪽 3단계 끝) */
let CGF = null;
document.addEventListener("toggle", e => { const d = e.target; if (!d.open || !d.matches || !d.matches("details.cgf[data-fk]") || d.dataset.on) return; d.dataset.on = "1";
  const put = () => { const p = d.querySelector("p"); if (p) p.textContent = (CGF && CGF[d.dataset.fk]) || "Could not load the summary. Select the meeting name to view the original."; };
  if (CGF) put(); else fetch("/data/cg_speakers.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : {}).then(j => { CGF = j; put(); }).catch(() => { CGF = {}; put(); }); }, true);
function congHtml(c){
  const X = c.congress; if (!X || !X.length) return "";
  const row = (k, v) => v ? "<dt>" + k + "</dt><dd>" + esc(v) + "</dd>" : "";
  const qd = d => enDate(d || "");
  if (D.cgv2) return cgV2(c, X, row, qd);  /* v3.84(2026-10-08 결재): 확정·본회의 표결이 있는 쟁점에만 찬반 발언(각 2건)과 당론과 다른 표. 발언 많은 의원 목록은 내림(교본 4.8) */
  return "<h3 style=\"margin:14px 0 0\">Issues before the legislature</h3><p class=\"note\" style=\"margin:4px 0 8px\">These are issues on which the legislature can attach conditions to the decision-maker’s choices or exercise powers of consent or veto. Each legislature’s composition and powers, and statements on each issue, are on the Power Structures page.</p><div class=\"decs\">" +
    X.map((x, i) => '<details class="dec" id="cg-' + esc(c.id) + '-' + i + '"><summary><span class="nm">' + esc(nm(x.iso)) + '</span><span class="fr">' + esc(x.t) + "</span></summary><dl>" +
      row("Current stage", x.stage) + row("Legislative powers", x.power) + row("Vote count", x.votes) + row("Positions", x.sides) + row("Next steps and deadlines", x.next) +
      (x.govnote ? "<dt>Government position</dt><dd>Testimony and answers to lawmakers by government officials signal the government’s intent rather than the legislature’s, so they appear under <a class=\"chip\" href=\"" + (LLK()[x.iso] ? lurl(x.iso) + "#intent" : "/en/power/#" + esc(x.iso)) + '">' + esc((LLK()[x.iso] || {}).name || nm(x.iso)) + " · What the government says and does</a>, sorted into words and deeds.</dd>" : "") +
      ((x.fc || []).length ? "<dt>Related forecasts</dt><dd><div class=\"chips\" style=\"margin:0\">" + x.fc.map(fcBtn).join("") + "</div></dd>" : "") +
      ((x.quotes || []).length || (x.speakers && x.speakers.list.length) || (x.devvotes || []).length ? "<dt>Statements in the legislature</dt><dd>" + [(x.quotes || []).length ? "Key statements: " + x.quotes.length + "" : "", x.speakers && x.speakers.list.length ? esc(x.speakers.h || "Most frequent speakers:") + " " + pl(x.speakers.list.length, "person", "people") : "", (x.devvotes || []).length ? "Votes against the party line: " + x.devvotes.length + "" : ""].filter(Boolean).join(" · ") + " — all collected with the original text on the Power Structures page.<br>" + powerLink(x.iso, "Issues before the legislature · ", "#cg-" + c.id + "-" + i) + "</dd>" : "") +
      "</dl></details>").join("") + "</div>";
}
function cgV2(c, X, row, qd){
  const q1 = q => '<li class="cgq2"><p>“' + esc(q.ex) + '”</p><span>' + esc(q.who) + " · " + esc([q.party, q.role].filter(Boolean).join(" · ")) + " · " + qd(q.date) + (q.devnote ? " · <b>" + esc(q.devnote) + "</b>" : "") + ' · <a href="' + esc(q.url) + "\" target=\"_blank\" rel=\"noopener\">Original" + ({en: "", zh: " (Chinese)", uk: " (Ukrainian)", ja: " (Japanese)", he: " (Hebrew)"}[q.lang] || "") + "</a></span></li>";
  const Q = x => x.quotes || [], side = (x, k) => Q(x).filter(q => q.side === k && !q.dev);
  return "<h3 style=\"margin:14px 0 0\">Issues before the legislature</h3><p class=\"note\" style=\"margin:4px 0 8px\">These are issues on which the legislature can attach conditions to the decision-maker’s choices or exercise powers of consent or veto. Members’ statements appear only for issues where a law, budget or consent motion has been enacted or a floor vote has been held, two from each side.</p><div class=\"decs\">" +
    X.map((x, i) => '<details class="dec" id="cg-' + esc(c.id) + '-' + i + '"><summary><span class="nm">' + esc(nm(x.iso)) + '</span><span class="fr">' + esc(x.t) + "</span></summary><dl>" +
      row("Current stage", x.stage) + row("Legislative powers", x.power) + row("Vote count", x.votes) +
      ((x.devvotes || []).length ? "<dt>Votes against the party line</dt><dd><ul class=\"cgdv\">" + x.devvotes.map(v => "<li><b>" + esc(v.label) + "</b> · " + qd(v.date) + " · " + esc(v.t) + "</li>").join("") + "</ul></dd>" : "") +
      (Q(x).length ? "<dt>Floor statements for and against</dt><dd><div class=\"cgsides\">" + [["yes", "For"], ["no", "Against"]].map(([k, t]) => '<div><b class="cgk">' + t + "</b>" + (side(x, k).length ? '<ul class="cgql">' + side(x, k).map(q1).join("") + "</ul>" : '<p class="note" style="margin:0">' + esc((x.qnone || {})[k] || "") + "</p>") + "</div>").join("") + "</div></dd>" : x.decided && x.qnote ? "<dt>Floor statements for and against</dt><dd class=\"note\">" + esc(x.qnote) + "</dd>" : row("Positions", x.sides)) +
      (Q(x).some(q => q.dev) ? "<dt>Statements by members who broke with their party</dt><dd><ul class=\"cgql\">" + Q(x).filter(q => q.dev).map(q1).join("") + "</ul></dd>" : "") +
      row("Next steps and deadlines", x.next) +
      ((x.fc || []).length ? "<dt>Related forecasts</dt><dd><div class=\"chips\" style=\"margin:0\">" + x.fc.map(fcBtn).join("") + "</div></dd>" : "") +
      "</dl></details>").join("") + "</div>";
}
function futHtml(c, n){
  const F = c.futures; if (!F) return "";
  const WG = c.wellbeing ? c.wellbeing.groups : [];  /* v3.90 새 사안(러시아-NATO 대치)은 인간 안보 방식만 있어 기존 지표가 없다 */
  const base = {}; WG.forEach(g => base[g.k] = g.score);
  const gname = {}; WG.forEach(g => gname[g.k] = g.name);
  const pb = key => '<div class="pbar" role="img" aria-label="' + F.items.map(f => f.id + " " + f[key] + "%").join(", ") + '">' + F.items.map(f => '<i style="flex:' + f[key] + ' 0 0;background:' + fcol(f.id) + '">' + f.id + " " + f[key] + "%</i>").join("") + "</div>";
  const cell = (f, g, k) => {
    if (f.score) return fmt(f.score[g][k]) + wdl(f.score[g][k], base[g][k]);
    const a = f.score_bad[g][k], b = f.score_good[g][k];
    return a == null ? "—" : fmt(a) + " ~ " + fmt(b);
  };
  const rg = r => r ? ' <span class="rng">(' + r[0] + "~" + r[1] + ")</span>" : "";
  const ftab = f => "<div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:440px\"><thead><tr><th>2030</th>" + WDIM.map(([k, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" +
    Object.keys(base).map(g => "<tr><td>" + esc(gname[g]) + "</td>" + WDIM.map(([k]) => '<td class="mono">' + cell(f, g, k) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  return '<section class="stp">' + stpH(n, "Scenarios and external variables") + '<p class="note">' + esc(F.note) + "</p>" +
    '<div class="pstack"><div class="prow"><span>' + (F.rec_same ? "Probability" : "Current trend") + "</span>" + pb("p") + "</div>" + (F.rec_same ? "" : "<div class=\"prow\"><span>If the recommendation is followed</span>" + pb("p_rec") + "</div>") + "</div>" +
    '<div class="futs">' + F.items.map(f => '<article class="fut" id="fut-' + esc(c.id) + "-" + f.id + '" style="--c:' + fcol(f.id) + '"><div class="hd"><span class="id">' + f.id + "</span><b>" + esc(f.name) + '</b><span class="pp">' + (F.rec_same ? f.p + "%" + rg(f.rng) : "Current trend " + f.p + "%" + rg(f.rng) + " · if the recommendation is followed " + f.p_rec + "%" + rg(f.rng_rec)) + (f.prev2w ? '<small>' + f.prev2w[0] + (F.rec_same ? "" : " · " + f.prev2w[1]) + "</small>" : f.prev ? '<small>' + f.prev[0] + " · " + f.prev[1] + "</small>" : f.id === "F5" ? "<small></small>" : "") + "</span></div>" +
      "<p>" + esc(f.story) + "</p><p class=\"tst\"><b>Resolution criteria</b> · " + esc(f.test) + (f.fc ? ' <span class="mono">(' + f.fc + ")</span>" : "") + "</p>" +
      "<p style=\"font-size:12px\"><b>Early signs</b> · " + f.signs.map(esc).join(" · ") + "</p>" + sigHtml(f) +
      (c.hs7 ? '<button type="button" class="chip" data-jump="hs7-' + esc(c.id) + "\">What this scenario means for people's lives →</button></article>" : "<details class=\"src\"><summary>What this scenario means for people (well-being index)</summary>" + ftab(f) + '<p class="note">' + esc(f.why) + (f.score ? " ▲▼ show change from 2026." : " Values run from worse to better.") + "</p></details></article>")).join("") + "</div>" +
    extHtml(c) + (!c.external && (F.ext_list || []).length ? "<h3 style=\"margin:8px 0 0\">External variables</h3><p class=\"note\">Factors the strategic actor cannot control but that shift the probability of each scenario.</p><ul class=\"list\">" + F.ext_list.map(x => '<li class="rv"><p style="color:var(--ink)">' + esc(x) + "</p></li>").join("") + "</ul>" : "") + worldHtml(c) + aiHtml(c) + "</section>";
}
/* v3.26 사안 outlook: 흐름·창·사건·경로·반증 신호. 본문의 {{fc:fNN}}은 그날 확률을 보이는 전망 칩, {{case:id}}는 사안 칩 */
function olkT(t, fid){
  return esc(t).replace(/\{\{n:([\d,]+)\}\}/g, (m, ns) => '<sup class="fn">' + ns.split(",").map(n => '<button type="button" data-jump="fn-' + esc(fid || "") + "-" + n + '" id="fnr-' + esc(fid || "") + "-" + n + "\" aria-label=\"Key term " + n + '">' + n + "</button>").join("·") + "</sup>")  /* v3.29 용어 풀이 번호 */.replace(/\{\{fc:(f\d+)\}\}/g, (m, id) => { const F = D.forecasts.find(f => f.id === id); return F ? ' <button type="button" class="fcchip" data-fc="' + id + '" title="' + esc(F.q) + '">' + fcLab(F, id, F.p) + "</button>" : ""; })
    .replace(/\{\{case:([\w-]+)\}\}/g, (m, id) => { const k = (D.strategies || []).find(x => x.id === id); return k ? ' <button type="button" class="chip" data-case="' + esc(id) + '">' + esc(k.title.split(":")[0]) + "</button>" : ""; })
    .replace(/\{\{life:([\w-]+)\|([^}|]+)\}\}/g, (m, id, lab) => ' <button type="button" class="chip" data-golife="' + id + '">' + lab + "</button>")  /* v4.17 특집 칩: 국민의 삶 탭의 그 사안 줄로 */
    .replace(/\{\{acad:([\w\/-]+)\|([^}|]+)\}\}/g, (m, p, lab) => ' <a class="chip" href="' + (location.pathname.indexOf("/en/") === 0 ? "/en" : "") + "/academy/" + p + '/">' + lab + "</a>");  /* v4.17 특집 칩: 클리사 아카데미 강의로 */
}
/* v3.28 특집: 글마다 제목·날짜·사안. 특집 탭에 최신 글은 펼치고 지난 글은 접어 둔다. 사안 화면·주요 판단 카드에는 제목을 단 단추만 둔다 */
const FEATS = () => D.features || [];
const featBtn = F => '<button type="button" class="chip feat-btn" data-feat="' + esc(F.id) + "\">Feature · " + esc(F.title) + ' <span aria-hidden="true">→</span></button>';
function featBody(O){
  const T = x => olkT(x, O.id);
  if (O.kind === "essay") {  /* v3.44 서술형 특집: 요약 · 절(문단과 표) · 산출 방법 · 출처 */
    const tbl = b => '<div class="ess-tw"><table class="ess-t"><thead><tr>' + b.table.head.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" + b.table.rows.map(r => "<tr>" + r.map((c, i) => (i ? "<td>" : '<th scope="row">') + (!i && String(c).includes("\n") ? esc(String(c).split("\n")[0]) + '<small class="ess-rd">' + esc(String(c).split("\n").slice(1).join(" ")) + "</small>" : esc(c)) + (i ? "</td>" : "</th>")).join("") + "</tr>").join("") + "</tbody></table></div>";
    return '<div class="lesson-box ess-sum"><b>' + esc(O.summary_h || "Summary") + "</b><" + (O.summary_ol ? "ol" : "ul") + ">" + (O.summary || []).map(x => "<li>" + T(x) + "</li>").join("") + "</" + (O.summary_ol ? "ol" : "ul") + "></div>" +
      (O.sections || []).map(S => "<h3>" + esc(S.h) + "</h3>" + S.blocks.map(b => b.svg ? '<figure class="ess-fig"><figcaption>' + esc(b.h || "") + "</figcaption>" + b.svg + (b.note ? '<p class="note">' + esc(b.note) + "</p>" : "") + "</figure>"
        : b.table ? (b.fold ? '<details class="src ess-fold"><summary>' + esc(b.fold) + "</summary>" + tbl(b) + "</details>" : tbl(b)) : '<p class="ess-p">' + T(b.p) + "</p>").join("")).join("") +
      ((O.events || []).length ? "<h3>" + esc(O.events_h) + '</h3><ul class="tl">' + O.events.map(x => '<li><span class="d">' + esc(x.when) + "</span><span>" + T(x.t) + "</span></li>").join("") + "</ul>" : "") +
      ((O.paths || []).length ? "<h3>" + esc(O.paths_h) + "</h3>" + (O.paths_lead ? '<p class="note">' + T(O.paths_lead) + "</p>" : "") + '<ul class="list fl">' + O.paths.map(x => "<li><b>" + T(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" : "") +
      ((O.falsify || []).length ? "<h3>" + esc(O.falsify_h) + "</h3>" + (O.falsify_lead ? '<p class="note">' + T(O.falsify_lead) + "</p>" : "") + '<ul class="watch">' + O.falsify.map(x => "<li>" + T(x) + "</li>").join("") + "</ul>" : "") +
      ((O.method || []).length ? "<h3>" + esc(O.method_h || "How it was calculated") + '</h3><ul class="list fl">' + O.method.map(x => "<li><b>" + esc(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" : "") +
      ((O.notes || []).length ? '<section class="fnotes"><h3>' + esc(O.notes_h || "Key terms") + "</h3><ol>" + O.notes.map((n, i) => '<li id="fn-' + esc(O.id) + "-" + (i + 1) + '"><b>' + esc(n.k) + "</b> · " + esc(n.t) + ' <button type="button" class="fnback" data-jump="fnr-' + esc(O.id) + "-" + (i + 1) + "\" aria-label=\"Back to text\">↩</button></li>").join("") + "</ol></section>" : "") +
      ((O.sources || []).length ? "<details class=\"src\"><summary>Sources · " + O.sources.length + "</summary><ul>" + O.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "");
  }
  return ((O.summary || []).length ? '<div class="lesson-box ess-sum"><b>' + esc(O.summary_h || "Summary") + "</b><ul>" + O.summary.map(x => "<li>" + T(x) + "</li>").join("") + "</ul></div>" : "") +
    "<p>" + T(O.lead) + "</p>" +
    "<h3>" + esc(O.flows_h) + '</h3><ul class="list fl">' + O.flows.map(x => "<li><b>" + T(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" +
    '<div class="lesson-box"><b>' + esc(O.window_h) + "</b>" + O.window.map(x => "<p>" + T(x) + "</p>").join("") + "</div>" +
    "<h3>" + esc(O.events_h) + '</h3><ul class="tl">' + O.events.map(x => '<li><span class="d">' + esc(x.when) + "</span><span>" + T(x.t) + "</span></li>").join("") + "</ul>" +
    "<h3>" + esc(O.paths_h) + '</h3><p class="note">' + T(O.paths_lead) + '</p><ul class="list fl">' + O.paths.map(x => "<li><b>" + T(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" +
    "<h3>" + esc(O.falsify_h) + '</h3><p class="note">' + T(O.falsify_lead) + '</p><ul class="watch">' + O.falsify.map(x => "<li>" + T(x) + "</li>").join("") + "</ul>" +
    ((O.notes || []).length ? '<section class="fnotes"><h3>' + esc(O.notes_h || "Key terms") + "</h3><ol>" + O.notes.map((n, i) => '<li id="fn-' + esc(O.id) + "-" + (i + 1) + '"><b>' + esc(n.k) + "</b> · " + esc(n.t) + ' <button type="button" class="fnback" data-jump="fnr-' + esc(O.id) + "-" + (i + 1) + "\" aria-label=\"Back to text\">↩</button></li>").join("") + "</ol></section>" : "") +
    ((O.sources || []).length ? "<details class=\"src\"><summary>Sources · " + O.sources.length + "</summary><ul>" + O.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "");
}
/* v4.37 특집에 나오는 나라(links.feats: 나라 이름 3번 이상) */
const fIsos = F => Object.keys(D.countries).filter(k => ((D.countries[k].links || {}).feats || []).includes(F.id));
function featArticle(F){
  const c = (D.strategies || []).find(x => x.id === F.case);
  return '<article class="sec olk" id="feat-' + esc(F.id) + '"><p class="eyebrow">' + (F.kicker ? esc(F.kicker) : "Features") + (c ? " · " + esc(c.title.split(":")[0]) : "") + " · " + fmtKD(F.date) + '</p><h2 class="olk-t">' + esc(F.title).replace(/(\d+%\S+)/g, '<span style="white-space:nowrap">$1</span>') + " " + ttsBtn("feat:" + F.id) + "</h2>" + featBody(F) +
    ((c || fIsos(F).length) ? '<div class="chips" style="margin:0">' + (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + "\">View analysis · " + esc(c.title.split(":")[0]) + "</button>" : "") + fIsos(F).map(chip).join("") + "</div>" : "") + "</article>";
}
function renderFeature(){
  const L0 = FEATS(); if (!$("#pane-feature")) return;
  const cur = L0.find(F => F.id === S.feat) || L0[0];
  $("#pane-feature").innerHTML = "<div class=\"sec\"><h2>Features</h2></div>" + (cur ? featArticle(cur) : "") +
    (L0.length > 1 ? "<section class=\"sec\"><h3>More features</h3><ul class=\"list blist\">" + L0.filter(F => F !== cur).map(F => '<li><a class="row-btn" href="/en/feature/' + esc(F.id) + '/" data-feat="' + esc(F.id) + '"><span class="mono">' + fmtKD(F.date) + '</span> <span class="nm">' + esc(F.title) + "</span></a></li>").join("") + "</ul></section>" : "");
  $("#pane-feature").scrollTop = 0;
}
function renderFeatureOld(){
  const L = FEATS(); if (!$("#pane-feature")) return;
  $("#pane-feature").innerHTML = "<div class=\"sec\"><h2>Features</h2></div>" + (L.length ? featArticle(L[0]) : "") +
    (L.length > 1 ? "<section class=\"sec\"><h3>Past features · " + (L.length - 1) + "</h3>" + L.slice(1).map(F => '<details class="fold" id="featd-' + esc(F.id) + '"><summary>' + fmtKD(F.date) + " · " + esc(F.title) + "</summary>" + featArticle(F) + "</details>").join("") + "</section>" : "");
}
function goFeat(id){
  S.feat = id || null; renderFeature(); switchTab("feature");
}
function aiHtml(c){
  const A = c.ai; if (!A) return "";
  return "<div class=\"aibox\"><div class=\"aih\"><span class=\"aitag\">AI factor</span><b>" + esc(A.t) + "</b></div><dl class=\"tw\"><dt>What’s at stake</dt><dd>" + esc(A.stake) + "</dd><dt>Impact</dt><dd>" + esc(A.moves) + "</dd><dt>What the strategic actor holds</dt><dd>" + esc(A.lever) + "</dd><dt>Leading indicators</dt><dd><ul>" + A.signs.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul></dd></dl>' + (A.review ? '<p class="note"><span class="vd ' + (A.review === "통과" ? "ok" : "fix") + "\">Independent red-team review</span> " + esc(A.review) + '</p>' : '') /* v3.0b */ + aiPrecHtml(A.prec, A.prec_insight) + "<p class=\"note\">The broader effects of AI on geopolitics are covered under <button type=\"button\" class=\"chip\" data-go=\"grand\">Structural trends on the World Order tab</button>.</p></div>";
}
function theoryHtml(c){
  const X = c.theory; if (!X || !(X.links || []).length) return "";
  const vc = v => v === "지지" || v === "부합" ? "ok" : v === "반박" || v === "상충" ? "no" : "fix";
  const byC = {}; X.links.forEach(l => (byC[l.claim] = byC[l.claim] || []).push(l));
  const ct = id => { const k = (c.conclusions || []).find(x => x.id === id); return k ? k.t : ""; };
  return "<details class=\"src theo\"><summary>Judgments tested against theory and the classics · comparisons: " + X.links.length + "</summary>" +
    (X.status && !PUB() ? '<p class="note" style="margin-top:6px"><span class="vd fix">' + esc(X.status) + "</span></p>" : "") +
    "<p class=\"note\" style=\"margin:6px 0 8px\">Key conclusions are compared with classic works and research on the same structural problem. The classics and theories are themselves open to testing: each entry states whether the work supports the judgment, qualifies it, or contradicts it, and where the theory has been wrong.</p><div class=\"aiprec\">" +
    Object.keys(byC).map(id => '<article class="dv"><div class="hd"><span class="id">' + esc(id) + '</span><span class="note">' + esc(ct(id)) + "</span></div><ul class=\"list\" style=\"margin-top:6px\">" +
      byC[id].map(l => '<li><span class="kd">' + esc(l.kind) + '</span><b>' + esc(l.work) + '</b> <span class="vd ' + vc(l.verdict) + '">' + esc(ev(l.verdict)) + "</span><p>" + esc(l.idea) + "</p><p class=\"tl-w\">Where it applies · " + esc(l.fit) + "</p><p class=\"tl-w\">Limits · " + esc(l.limit) + "</p>" +
        ((l.sources || []).length ? "<details class=\"src\"><summary>Sources</summary><ul>" + l.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") + "</li>").join("") + "</ul></article>").join("") +
    (X.insight ? "<div class=\"lesson-box\"><b>What the comparison reveals</b>" + esc(X.insight) + "</div>" : "") +
    ((X.uncertain || []).length ? "<details class=\"src\"><summary>Unverified · " + X.uncertain.length + "</summary><ul>" + X.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") +
    "</div></details>";
}
/* v3.19 여론 조사 한 건. 사안과 나라 프로필이 함께 쓴다 */
function pubArticle(p, id, hd){
  return '<article class="dv"' + (id ? ' id="' + esc(id) + '"' : "") + '><div class="hd"><span class="id">' + esc(p.who) + '</span>' + (hd || "") + '</div><p style="margin-top:4px"><b>' + esc(p.q) + '</b></p><p class="mono pub-s">' + esc(p.series) + ' <span class="note">(' + esc(p.unit) + ")</span></p><p class=\"note\">Latest survey · " + esc(p.latest) + "</p><p>" + esc(p.read) + "</p><p class=\"tl-w\">Caveat · " + esc(p.caveat) + "</p>" +
      ((p.sources || []).length ? "<details class=\"src\"><summary>Sources</summary><ul>" + p.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") + "</article>";
}
/* v3.19 나라 프로필: 이 나라 국민을 대상으로 한 여론 조사를 사안에서 모아 보인다 */
function countryPublicsHtml(c){
  const alias = {"South Korea": "KOR", "Korea": "KOR", "U.S.": "USA"}, isoOf = n => alias[n] || (Object.values(D.countries).find(x => x.name_ko === n) || {}).iso;
  const L = [];
  (D.strategies || []).forEach(k => ((k.publics || {}).items || []).forEach((p, i) => {
    const who = String(p.who).split(" · ")[0].split(/·|,| and /).map(x => isoOf(x.trim()));
    if (who.includes(c.iso)) L.push({p, k, i});
  }));
  if (!L.length) return "";
  return "<section class=\"sec\" id=\"c-pub\"><h3>Domestic opinion · surveys: " + L.length + "</h3>" +
    L.map(x => pubArticle(x.p, "", '<button type="button" class="chip" data-case="' + esc(x.k.id) + '" style="margin-left:auto">' + esc(String(x.k.title).split(":")[0]) + "</button>")).join("") + "</section>";
}
function publicsHtml(c){
  const X = c.publics; if (!X || !(X.items || []).length) return "";
  return '<details class="src theo pub" id="pub-' + esc(c.id) + "\"><summary>Domestic opinion and room to negotiate · surveys: " + X.items.length + "</summary>" +
    "<p class=\"note\" style=\"margin:6px 0 8px\">Strategy evaluations are measured against the government’s objectives, but domestic opinion determines how wide a range of options the government can actually choose from. Polls in each country with decision-making power are checked against the pollsters’ original releases to show where they diverge from the assessment and which signals would change it. Because question wording differs across pollsters, different surveys are not stitched into a single time series.</p><div class=\"aiprec\">" +
    X.items.map((p, i) => pubArticle(p, "pub-" + c.id + "-" + i)).join("") +
    "<div class=\"lesson-box\"><b>How opinion sets the room to negotiate</b>" + esc(X.read) + (X.watch ? "<p class=\"tl-w\" style=\"margin-top:6px\">Signals that would change the assessment · " + esc(X.watch) + "</p>" : "") + "</div></div></details>";
}
function aiPrecHtml(L, ins){
  if (!L || !L.length) return "";
  const vc = v => v === "지지" || v === "부합" ? "ok" : v === "반박" || v === "상충" ? "no" : "fix";
  return "<details class=\"src\"><summary>Precedent check · judgments: " + L.length + "</summary><div class=\"aiprec\" style=\"margin-top:8px\">" +
    L.map(k => '<article class="dv chk-' + vc(k.verdict) + '"><div class="hd"><span class="id">' + esc(k.claim) + '</span><span class="vd ' + vc(k.verdict) + '">' + esc(ev(k.verdict)) + "</span></div><dl><dt>Reasoning</dt><dd>" + esc(k.reason) + "</dd><dt>Precedents compared</dt><dd><ul>" +
      k.precedents.map(p => "<li><b>" + esc(p.name) + '</b> <span class="mono note">' + esc(p.period) + "</span><br>" + esc(p.what) + '<br><span class="note">' + esc(p.relevance) + "</span>" + (p.sources && p.sources.length ? '<ul>' + p.sources.map(srcItem).join("") + "</ul>" : "") + "</li>").join("") + "</ul></dd></dl></article>").join("") +
    (ins ? "<div class=\"lesson-box\"><b>What the precedents reveal</b>" + esc(ins) + "</div>" : "") + "</div></details>";
}
function worldHtml(c){
  const W = c.world; if (!W) return "";
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  return "<h3 style=\"margin:8px 0 0\">Issue scenarios under each world scenario</h3><p class=\"note\">" + esc(W.note) + " World scenarios are on the <button type=\"button\" class=\"chip\" data-go=\"grand\">World Order tab</button>.</p><div class=\"tbl-wrap\"><table class=\"tbl ext\" style=\"min-width:560px\"><thead><tr><th>World scenario</th><th>Probability</th>" + W.order.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span><br>" + esc(fn[k]) + "</th>").join("") + "</tr></thead><tbody>" +
    W.rows.map(r => "<tr><td><b>" + esc(r.id + ". " + r.name) + '</b><br><span class="note">' + esc(r.why) + '</span></td><td class="mono">' + r.p + "%</td>" + r.cond.map(v => '<td class="mono">' + v + "</td>").join("") + "</tr>").join("") +
    "<tr class=\"base\"><td>Weighted total (check)</td><td class=\"mono\">100%</td>" + W.mix.map((v, i) => '<td class="mono">' + v + "<span class=\"dd\">baseline " + W.base[i] + "</span></td>").join("") + "</tr></tbody></table></div>";
}
function extHtml(c){
  const X = c.external; if (!X) return "";
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  const dv = (v, b) => { const d = v - b; return '<span class="dd">' + (d > 0 ? "▲" + d : d < 0 ? "▼" + (-d) : "±0") + "</span>"; };
  return "<h3 style=\"margin:8px 0 0\">External variables and conditional scenarios</h3><p class=\"note\">" + esc(X.note) + "</p>" +
    "<div class=\"tbl-wrap\"><table class=\"tbl ext\" style=\"min-width:600px\"><thead><tr><th>External variable (through 2030)</th><th>Likelihood</th>" + X.order.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span><br>" + esc(fn[k]) + "</th>").join("") + "<th>Judgments affected</th></tr></thead><tbody>" +
    "<tr class=\"base\"><td>Baseline · current trend</td><td class=\"mono\">—</td>" + X.base.map(v => '<td class="mono">' + v + "</td>").join("") + "<td></td></tr>" +
    X.items.map(x => "<tr><td><b>" + esc(x.t) + '</b><br><span class="note">' + esc(x.def) + '</span></td><td class="mono">' + x.p + "%</td>" + x.cond.map((v, i) => '<td class="mono">' + v + dv(v, X.base[i]) + "</td>").join("") + '<td class="note">' + esc(x.flips) + "</td></tr>").join("") +
    "</tbody></table></div><p class=\"note\">The middle columns show the probability (%) of each scenario if the variable occurs; ▲▼ show change from the baseline. These are judgment estimates, so differences of about ±5 points should not be read as meaningful.</p><div class=\"exts\">" + X.items.map(x => '<details class="dec"><summary><span class="nm">' + esc(x.id + " " + x.t) + '</span><span class="pw">' + x.p + '%</span><span class="fr">' + esc(x.why) + "</span></summary><dl><dt>Countries that would react most</dt><dd>" + x.who.map(chip).join(" ") + "</dd>" + (x.crit ? "<dt>Criteria</dt><dd>" + esc(x.crit) + "</dd>" : "") + "<dt>Leading indicators</dt><dd>" + esc(x.sign) + "</dd>" + (x.basis ? "<dt>Evidence and precedents</dt><dd>" + esc(x.basis) + "</dd>" : "") + "</dl></details>").join("") + "</div>" +
    "<div class=\"lesson-box\"><b>What the external variables imply</b><ul class=\"facts\" style=\"margin-top:6px\">" + X.reads.map(r => "<li>" + esc(r) + "</li>").join("") + "</ul></div>";
}
function counterHtml(c){
  const L = c.counter; if (!L || !L.length) return "";
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return L.map(W => "<section class=\"stp counter\"><div class=\"stp-h\"><i>⇄</i><b>The other side’s best move · " + esc(W.name) + '</b></div><p class="note">' + esc(W.note) + " Priority order: <span class=\"mono\">" + esc(W.order) + "</span></p>" +
    '<details class="src"><summary>' + esc(enShort(W.name)) + "’s objectives (" + W.goals.length + ") and sources</summary><ul class=\"list goals\">" + W.goals.map(g => '<li class="rv"><span><b class="mono" style="color:var(--conflict)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + "<br><span class=\"note\">Source · " + esc(g.src) + "</span></p></li>").join("") + "</ul></details>" +
    "<div class=\"tbl-wrap\"><table class=\"tbl evt\" style=\"min-width:720px\"><thead><tr><th>Move</th>" + W.goals.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + "<th>Feasibility</th></tr></thead><tbody>" +
    W.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + a.ev.map(e => "<td>" + sc(e[0]) + '<span class="why">' + esc(e[1]) + "</span></td>").join("") + "<td>" + esc(ev(a.feas)) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<div class="verdict">' + W.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + ". " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + "</div><div class=\"lesson-box\"><b>Compared with the step 5 estimate (the adversary’s response)</b>" + esc(W.read) + "</div></section>").join("");
}
function twowayHtml(c){
  const T = c.twoway; if (!T) return "";
  return "<section class=\"stp twoway\"><div class=\"stp-h\"><i>⇆</i><b>Two-way review · where the best moves meet</b></div><p class=\"note\">This section examines where an equilibrium emerges when the strategic actor and its counterpart each play their best move according to their own objectives.</p>" +
    "<div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:420px\"><thead><tr><th>Strategic actor</th><th>Best move</th></tr></thead><tbody>" + T.pairs.map(p => "<tr><td><b>" + esc(p[0]) + "</b></td><td>" + esc(p[1]) + "</td></tr>").join("") + "</tbody></table></div>" +
    "<dl class=\"tw\"><dt>Equilibrium</dt><dd>" + esc(T.equilibrium) + "</dd><dt>Zone of possible agreement</dt><dd>" + esc(T.zopa) + "</dd><dt>Shared traps</dt><dd><ul>" + T.traps.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></dd>" +
    (T.changes && !PUB() ? '<dt></dt><dd><ul>' + T.changes.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></dd>" : "") + "</dl></section>";
}
function swapHtml(c){
  const W = c.swap; if (!W) return "";
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return "<section class=\"stp swap\"><div class=\"stp-h\"><i>↔</i><b>Swapping the strategic actor · " + esc(W.name) + '</b></div><p class="note">' + esc(W.note) + " Priority order: <span class=\"mono\">" + esc(W.order) + '</span></p><ul class="list goals">' +
    W.goals.map(g => '<li class="rv"><span><b class="mono" style="color:var(--accent)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + "<br><span class=\"note\">Source · " + esc(g.src) + "</span></p></li>").join("") + "</ul>" +
    "<div class=\"tbl-wrap\"><table class=\"tbl evt\" style=\"min-width:720px\"><thead><tr><th>Option</th>" + W.goals.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + "<th>Feasibility</th></tr></thead><tbody>" +
    W.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + a.ev.map(e => "<td>" + sc(e[0]) + '<span class="why">' + esc(e[1]) + "</span></td>").join("") + "<td>" + esc(ev(a.feas)) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<div class="verdict">' + W.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + ". " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + "</div><div class=\"lesson-box\"><b>What swapping the actor reveals</b>" + esc(W.lesson) + "</div></section>";
}
function evalHtml(c){
  const G = c.client.goals;
  const HC = c.alts.some(a => a.ev.cost);  /* v3.90 비용 판단이 없는 사안은 비용 칸을 두지 않는다 */
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return "<div class=\"tbl-wrap\"><table class=\"tbl evt\" style=\"min-width:820px\"><thead><tr><th>Option</th>" + G.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + (HC ? "<th>Cost</th>" : "") + "<th>Reversibility</th><th>Escalation risk</th><th>Feasibility</th></tr></thead><tbody>" +
    c.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + G.map(g => { const e = a.ev[g.id]; return "<td>" + sc(e.s) + '<span class="why">' + esc(e.t) + "</span></td>"; }).join("") +
      (HC ? "<td>" + esc(ev(a.ev.cost)) + "</td>" : "") + "<td>" + esc(ev(a.ev.rev2)) + "</td><td>" + esc(ev(a.ev.esc2)) + "</td><td>" + esc(ev(a.ev.feas)) + "</td></tr>").join("") + "</tbody></table></div>" +
    "<p class=\"note\">−2 major loss · −1 loss · 0 neutral · +1 gain · +2 major gain. Scores are not added up across objectives; options are ranked first by their scores on higher-priority objectives.</p>";
}
/* v3.90(2026-10-10 결재): Ⅲ 인간 안보 화면 2안. 집단별 카드(첫 문장, '2030년까지 100번의 미래' 점 그림, 범주별 현재·가장 나쁜 경우·가장 좋은 경우 선 그림, 가장 나쁜 경우의 원래 단위 풀이), 숫자 표는 접힘 */
const HS_CAT = [["개인", "Personal safety"], ["공동체", "Community"], ["정치", "Political"], ["경제", "Economic"]];
const HS_COL = {better: "#0EA5A4", same: "#D3D8DE", worse: "#F59E0B", big: "#C8102E"};  /* v3.93 색상 B안(2026-10-11 결재): 진홍·호박색·청록 */
const HS_LAB = {better: "Better", same: "About the same", worse: "Worse", big: "Much worse"};
const HS_ORD = ["big", "worse", "better", "same"];  /* v3.92c: 점 그림(위에서부터)·횟수·구성 설명의 순서를 하나로(크게 악화됨 → 악화됨 → 개선됨 → 현재와 비슷함) */
function hsCount(H, G, key){
  const c = {better: 0, same: 0, worse: 0, big: 0}; H.scen.forEach(s => { c[G.cls[s.id]] += s[key]; });
  /* v3.90 점 100개의 합이 100이 되도록 최대 잉여 방식으로 정수화한다. 잉여가 같으면 위험 쪽(크게 나빠짐, 나빠짐)을 먼저 올려 작은 확률의 위험이 사라지지 않게 한다 */
  const ks = ["big", "worse", "better", "same"], n = {}; ks.forEach(k => n[k] = Math.floor(c[k] + 1e-9));
  let r = 100 - ks.reduce((a, k) => a + n[k], 0);
  ks.slice().sort((x, y) => ((c[y] - n[y]) - (c[x] - n[x])) || ks.indexOf(x) - ks.indexOf(y)).forEach(k => { if (r > 0 && c[k] - n[k] > 1e-9) { n[k]++; r--; } });
  return n;
}
function hsDots(c){
  const seq = []; HS_ORD.forEach(k => { for (let i = 0; i < Math.round(c[k]); i++) seq.push(k); });
  while (seq.length < 100) seq.push("same"); seq.length = 100;
  return '<svg viewBox="0 0 110 110" class="hs-dots" role="img" aria-label="' + HS_ORD.filter(k => Math.round(c[k])).map(k => HS_LAB[k] + " " + Math.round(c[k]) + "").join(", ") + '">' +
    seq.map((k, i) => '<circle cx="' + (5.5 + (i % 10) * 11) + '" cy="' + (5.5 + Math.floor(i / 10) * 11) + '" r="4.2" fill="' + HS_COL[k] + '"></circle>').join("") + "</svg>";
}
function hsLegend(c, c2){
  return '<ul class="hs-lg">' + HS_ORD.filter(k => Math.round(c[k]) || Math.round(c2[k])).map(k => '<li><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + " <b>" + Math.round(c[k]) + "</b>" + (Math.round(c2[k]) !== Math.round(c[k]) ? "<span class=\"note hs-rec\">→ if the recommendation is followed: " + Math.round(c2[k]) + "</span>" : "") + "</li>").join("") + "</ul>";
}
function hsLine(H, G){
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const W = 340, L = 74, R = W - 10, sc = v => L + (R - L) * v / 100; let y = 20, rows = "";
  HS_CAT.forEach(([k, lab]) => {
    const v = G.cat[k];
    rows += '<text x="0" y="' + (y + 4) + '" class="hs-l">' + lab + "</text>";
    if (v.na) { rows += '<text x="' + L + '" y="' + (y + 4) + "\" class=\"hs-n\">Not measurable</text>"; y += 32; return; }
    rows += '<line x1="' + L + '" x2="' + R + '" y1="' + y + '" y2="' + y + '" class="hs-t"/>';
    if (v.worst_sc) rows += '<line x1="' + sc(v.worst) + '" x2="' + sc(v.now) + '" y1="' + y + '" y2="' + y + '" stroke="#C8102E" stroke-width="2"/><circle cx="' + sc(v.worst) + '" cy="' + y + "\" r=\"5\" fill=\"var(--panel)\" stroke=\"#C8102E\" stroke-width=\"2\"><title>Worst case " + fmt(v.worst) + '</title></circle><text x="' + sc(v.worst) + '" y="' + (y + 17) + '" class="hs-w" text-anchor="middle">' + Math.round(v.worst) + "</text>";
    if (v.best_sc) rows += '<line x1="' + sc(v.now) + '" x2="' + sc(v.best) + '" y1="' + y + '" y2="' + y + '" stroke="#0EA5A4" stroke-width="2"/><circle cx="' + sc(v.best) + '" cy="' + y + "\" r=\"5\" fill=\"var(--panel)\" stroke=\"#0EA5A4\" stroke-width=\"2\"><title>Best case " + fmt(v.best) + '</title></circle><text x="' + sc(v.best) + '" y="' + (y + 17) + '" class="hs-b" text-anchor="middle">' + Math.round(v.best) + "</text>";
    rows += '<circle cx="' + sc(v.now) + '" cy="' + y + "\" r=\"5\" fill=\"var(--accent)\"><title>Now " + fmt(v.now) + '</title></circle><text x="' + Math.min(sc(v.now), R - 6) + '" y="' + (y - 9) + '" class="hs-v" text-anchor="middle">' + Math.round(v.now) + "</text>";
    y += 36;
  });
  return '<svg viewBox="0 0 ' + W + " " + y + "\" class=\"hs-line\" role=\"img\" aria-label=\"Current and worst-case scores by category\">" + rows + "</svg>";
}
function hsWorstSc(G){ const w = HS_CAT.map(([k]) => G.cat[k]).filter(v => !v.na && v.worst_sc); if (!w.length) return null; const cnt = {}; w.forEach(v => cnt[v.worst_sc] = (cnt[v.worst_sc] || 0) + 1); return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; }
function hsBestSc(G){ const b = HS_CAT.map(([k]) => G.cat[k]).filter(v => !v.na && v.best_sc); return b.length ? b[0].best_sc : null; }
/* v3.96i 집단 순서: 2030년까지 100번의 미래에서 삶이 달라지는(점이 칠해지는) 횟수가 많은 집단부터. 같으면 크게 악화됨·악화됨이 많은 쪽, 그다음 자료 순서 */
function hsOrd(H, gs){ const n = G => hsCount(H, G, "p"), sc = gs.map((G, i) => { const c = n(G); return {G, i, k: [100 - c.same, c.big, c.worse]}; });
  return sc.sort((a, b) => b.k[0] - a.k[0] || b.k[1] - a.k[1] || b.k[2] - a.k[2] || a.i - b.i).map(x => x.G); }
function hsCard(H, G, cid){
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const c = hsCount(H, G, "p"), c2 = hsCount(H, G, "p_rec"), ws = hsWorstSc(G), bs = hsBestSc(G);
  const facts = ws ? HS_CAT.map(([k]) => { const v = G.cat[k]; if (k === "정치") return v.na || v.by[ws] > v.now - 1 ? "" : "More state violence"; return (v.by_raw || {})[ws]; }).filter(Boolean) : [];
  const al = ws ? (G.al[ws] || []) : [];
  return '<article class="hs-card"' + (cid ? ' id="hs7-' + esc(cid) + "-" + esc(G.k) + '"' : "") + '><div class="hs-hd"><b>' + esc(G.name) + "</b><span>" + esc(G.size) + '</span></div><p class="hs-hl">' + esc(G.line) + "</p><div class=\"hs-grid\"><figure><figcaption>100 futures through 2030</figcaption>" + hsDots(c) + hsLegend(c, c2) + "</figure>" +
    "<figure><figcaption>Now (<span style=\"color:var(--accent)\">●</span>)" + (ws ? " and worst case (<span style=\"color:#C8102E\">○</span>, " + esc(SN[ws].name) + " " + SN[ws].p + "%)" : "") + (bs ? " · best case (<span style=\"color:#0EA5A4\">○</span>, " + esc(SN[bs].name) + " " + SN[bs].p + "%)" : "") + " · scores 0–100, higher is better</figcaption>" + hsLine(H, G) +
    (ws ? '<p class="hs-wf">' + esc(SN[ws].name) + " scenario · " + facts.map(esc).join(" · ") + (al.length ? ' · <span class="hs-al">' + esc(al.join("·")) + " alert</span>" : "") + "</p>" : "") +
    (G.al_now.length ? "<p class=\"hs-wf\">Current alerts · <span class=\"hs-al\">" + esc(G.al_now.join("·")) + "</span></p>" : "") + "</figure></div></article>";
}
function hsTables(H){
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const cur = "<div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:560px\"><thead><tr><th>Group</th>" + HS_CAT.map(([k, l]) => "<th>" + l + "</th>").join("") + "<th>Current alerts</th></tr></thead><tbody>" +
    H.groups.map(G => "<tr><td>" + esc(G.name) + "</td>" + HS_CAT.map(([k]) => { const v = G.cat[k]; return v.na ? "<td class=\"note\">Not measurable</td>" : '<td class="mono">' + fmt(v.now) + '<small class="hs-rw">' + esc(v.raw || "") + "</small></td>"; }).join("") + '<td class="note">' + esc(G.al_now.join("·") || "None") + "</td></tr>").join("") + "</tbody></table></div>";
  const ex = "<div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:560px\"><thead><tr><th>Group</th><th>Category</th><th>Now</th><th>Staying the course</th><th>If the recommendation is followed</th><th>Worst case</th></tr></thead><tbody>" +
    H.groups.map(G => HS_CAT.map(([k, l]) => { const v = G.cat[k]; return v.na ? "<tr><td>" + esc(G.name) + "</td><td>" + l + "</td><td colspan=\"4\" class=\"note\">Not measurable</td></tr>" : "<tr><td>" + esc(G.name) + "</td><td>" + l + '</td><td class="mono">' + fmt(v.now) + '</td><td class="mono">' + fmt(v.exp) + '</td><td class="mono">' + fmt(v.rec) + '</td><td class="mono">' + (v.worst_sc ? fmt(v.worst) + ' <span class="note">(' + esc(SN[v.worst_sc].name) + " " + SN[v.worst_sc].p + "%)</span>" : "<span class=\"note\">No scenario makes it worse</span>") + "</td></tr>"; }).join("")).join("") + "</tbody></table></div>";
  const by = H.groups.map(G => "<details class=\"src\"><summary>Scores by scenario · " + esc(G.name) + "</summary><div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:620px\"><thead><tr><th>Scenario (probability)</th>" + HS_CAT.map(([k, l]) => "<th>" + l + "</th>").join("") + "<th>Alerts</th></tr></thead><tbody>" +
    H.scen.map(s => "<tr><td><b class=\"mono\">" + esc(s.id) + "</b> " + esc(s.name) + '<br><span class="note">' + s.p + "%" + (s.p_rec !== s.p ? " · if the recommendation is followed " + s.p_rec + "%" : "") + "</span></td>" + HS_CAT.map(([k]) => { const v = G.cat[k], r = (v.by_raw || {})[s.id]; return v.na ? '<td class="note">' + esc(r || "Not measurable") + "</td>" : '<td class="mono">' + fmt(v.by[s.id]) + (r ? '<small class="hs-rw">' + esc(r) + "</small>" : "") + "</td>"; }).join("") + '<td class="note">' + esc((G.al[s.id] || []).join("·") || "None") + "</td></tr>").join("") + "</tbody></table></div></details>").join("");
  return "<h4 class=\"hs-h4\">Life today · 2026</h4>" + cur + "<h4 class=\"hs-h4\">Change through 2030 (probability-weighted)</h4>" + ex + "<p class=\"note\">The \"Staying the course\" and \"If the recommendation is followed\" figures are probability-weighted averages: each scenario's 2030 score multiplied by its probability, then summed. When life barely changes in the most likely scenarios, these figures barely move either, so gauge the size of the risk from the worst case and its probability.</p>" + by;
}
/* 시안(2026-10-10): 확률 변경 전후의 점 개수와 변경 이력 */
function hsCountP(H, G, pm){ return hsCount({scen: H.scen.map(s => Object.assign({}, s, {q: pm[s.id] != null ? pm[s.id] : s.p}))}, G, "q"); }
const kd = s => { const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(s)); return m ? (+m[1]) + "/" + (+m[2]) + "" : String(s); };
function hsDiff(H, G, x){ const a = hsCountP(H, G, x.prev), b = hsCountP(H, G, x.next), d = HS_ORD.filter(k => a[k] !== b[k]).map(k => HS_LAB[k] + " " + a[k] + "→" + b[k] + ""); return d.length ? d.join(" · ") : "No change in the dot counts"; }
function hsChgLine(H, G){
  const x = (H.changes || []).slice(-1)[0];
  return '<p class="lh-chg">' + (x ? "<b>Latest change · " + kd(x.d) + " · " + esc(x.kind) + "</b><br>" + esc(hsDiff(H, G, x)) : "No probability changes since publication on October 10") + "</p>";
}
function hsHistHtml(H){
  const ch = H.changes || [], SN = {}; H.scen.forEach(s => SN[s.id] = s);
  return "<details class=\"src\"><summary>Probability change log · " + (ch.length ? ch.length + "" : "no changes") + "</summary>" + (ch.length ? '<ul class="tl">' + ch.slice().reverse().map(x => '<li><span class="d">' + esc(x.d) + "</span><span><b>" + esc(x.kind) + "</b> · " + esc(x.why) + '<br><span class="note">' + Object.keys(x.next).filter(k => x.prev[k] !== x.next[k]).map(k => esc(k + " " + (SN[k] ? SN[k].name : "")) + " " + x.prev[k] + "% → " + x.next[k] + "%").join(" · ") + "</span><br>" + H.groups.filter(G => !G.fold).map(G => esc(G.name) + ": " + esc(hsDiff(H, G, x))).join("<br>") + "</span></li>").join("") + "</ul>" : "<p class=\"note\">No probabilities have changed since publication on October 10, 2026.</p>") + "</details>";
}
function lifeMain(c){ const H = c.hs7; return H.groups.find(g => !g.fold) || H.groups[0]; }
function lifeNums(n, sep){ return ["big", "worse", "better"].filter(k => n[k]).map(k => '<span style="white-space:nowrap"><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + " " + n[k] + "</span>").join(sep || " · ") || "About the same as today in all 100"; }
/* 브리핑 첫머리 '사람들의 삶'(2026-10-10 통합안, 큰 카드). 누구의 삶으로 볼지 고른다: 당사국 국민·한국인·미국인·유럽인·러시아인.
   골라진 집단이 어느 미래에서도 '거의 같음'이면 점 그림 없이 한 줄로 줄인다(영향받는 사람만 크게) */
const LIFE_SEL_ALL = [["main", "People in the countries involved"], ["KOR", "South Koreans"], ["USA", "Americans"], ["EU", "Europeans"], ["RUS", "Russians"]];
const LIFE_SEL = LIFE_SEL_ALL.slice(0, 1);  /* v4.11(2026-10-17 결재): 한국인·미국인·유럽인·러시아인 보기는 기준 시점(현재 값이 2025년 통계라 이미 입은 분쟁 피해가 빠짐)을 2026년으로 맞춘 뒤 다시 올린다 */
const LIFE_MAIN2 = {ukraine: "RUS"};  /* v4.11: 교전 양쪽을 모두 계산한 사안은 상대국 국민도 당사국 보기에 */
const lpid = (c, G) => c.id + (LIFE_MAIN[c.id] && G.k !== LIFE_MAIN[c.id] ? "~" + G.k : "");
const LIFE_MAIN = {korea: "KOR", taiwan: "TWN", ukraine: "UKR", iran: "IRN", poland: "POL"};
const LIFE_EU = ["NEU", "NORD", "BALT", "DEU", "SEU", "WCEU"];
let LIFE = (() => { const v = store.get("ep.life"); return LIFE_SEL.some(x => x[0] === v) ? v : "main"; })();
function lifePick(c){
  const H = c.hs7, by = k => H.groups.find(g => g.k === k);
  if (LIFE === "main") return by(LIFE_MAIN[c.id]) || lifeMain(c);
  if (LIFE !== "EU") return by(LIFE);
  const eu = H.groups.filter(g => LIFE_EU.includes(g.k)); if (!eu.length) return null;
  const risk = g => H.scen.reduce((a, s) => a + (g.cls[s.id] === "big" ? 2 : g.cls[s.id] === "worse" ? 1 : 0) * s.p, 0);
  return eu.slice().sort((a, b) => risk(b) - risk(a))[0];
}
function lifeCard(c, x){
  const H = c.hs7, G = lifePick(c), nm = c.title.split(":")[0], k = x ? x.items.map((i, j) => i.case === c.id ? j : -1).filter(j => j >= 0) : [];
  const brf = k.length ? '<button type="button" class="chip lh-brf" data-jump="bi-' + k[0] + "\">Today's briefing: " + k.length + " ↓</button>" : "";
  if (!G) return '<article class="lh-card lh-none"><p class="lh-case">' + esc(nm) + "</p><p class=\"lh-line\">Not calculated for this issue.</p></article>";
  const n = hsCount(H, G, "p"), hit = H.scen.some(s => G.cls[s.id] !== "same");
  const eu = LIFE === "EU" && hit && H.groups.filter(g => LIFE_EU.includes(g.k)).length > 1 ? "<span class=\"lh-sub\">The most affected group in Europe</span>" : "";
  const hd = '<p class="lh-case">' + esc(nm) + '</p><div class="lh-hd"><b>' + esc(G.name) + "</b><span>" + esc(G.size) + "</span>" + eu + "</div>";
  const go = '<div class="lh-act"><button type="button" class="chip" data-hs="' + esc(c.id) + "\">See the effects on lives →</button>" + brf + "</div>";
  if (!hit) return '<article class="lh-card lh-none">' + hd + "<p class=\"lh-flat\">About the same as today in all 100 futures</p><p class=\"lh-line\">" + esc(G.line) + "</p>" + go + "</article>";
  return '<article class="lh-card">' + hd + '<div class="lh-body">' + hsDots(n) + "<div>" + hsLegend(n, n) + '</div></div><p class="lh-line">' + esc(G.line) + "</p>" + hsChgLine(H, G) + go + "</article>";
}
function lifeBigHtml(x){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  return "<section class=\"life\" id=\"s-life\"><h3 class=\"lm-h\" style=\"margin:14px 0 2px\">People's lives · 100 futures through 2030</h3><p class=\"note\" style=\"margin:0\">For each of the five issues, how many of 100 possible futures through 2030 leave life better or worse (judgment estimates). Choose whose lives to view.</p>" +
    "<div class=\"lsel\" role=\"group\" aria-label=\"Whose lives to show\">" + (LIFE_SEL.length > 1 ? LIFE_SEL : []).map(([k, l]) => '<button type="button" data-life="' + k + '" aria-pressed="' + (k === LIFE) + '">' + l + "</button>").join("") + "</div>" +
    '<div class="lh-row" id="lifegrid">' + cs.map(c => lifeCard(c, x)).join("") + "</div></section>";
}
/* v3.92 시안(2026-10-10): 첫 화면 = '사람들의 삶' 그래프판 + 그래프를 움직이는 한 줄 정보.
   사안마다 한 줄(점 그림 · 집단과 횟수 · 첫 문장 · 이 사안의 최근 한 줄 정보), 그 아래 오늘의 한 줄 정보 전체와 지난 날짜 */
const firstSent = t => { const m = /^(.+?다\.)(\s|$)/.exec(String(t || "")); return m ? m[1] : String(t || ""); };
function lifeNumsBig(n){ return ["big", "worse", "better", "same"].filter(k => n[k]).map(k => '<span class="lb-k' + (k === "same" ? " lb-same" : "") + '"><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + " <b>" + n[k] + "</b></span>").join(""); }
const LB_SHORT = {korea: "Korean Peninsula", taiwan: "Taiwan Strait", ukraine: "Russia-Ukraine war", iran: "Iran and Hormuz", poland: "Russia-NATO"};
function lbCase(H, G){  /* 그래프 옆 한 줄: 가장 나쁜 경우(와 가장 좋은 경우)를 원래 단위로 */
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const ws = hsWorstSc(G), bs = hsBestSc(G), fx = sid => HS_CAT.map(([k]) => { const v = G.cat[k]; if (k === "정치") return v.na || v.by[sid] > v.now - 1 ? "" : "More state violence"; return (v.by_raw || {})[sid]; }).filter(Boolean);
  const line = (lab, sid) => { const f = fx(sid), al = G.al[sid] || []; return '<p class="lb-ws"><b>' + lab + "</b> · " + esc(SN[sid].name) + " " + SN[sid].p + "%" + (f.length ? " · " + f.map(esc).join(" · ") : "") + (al.length && lab === "Worst case" ? ' · <span class="hs-al">' + esc(al.join("·")) + " alert</span>" : "") + "</p>"; };
  const bad = ws && (G.cls[ws] === "worse" || G.cls[ws] === "big");  /* 악화로 분류되는 전개가 없으면 '가장 나쁜 경우'를 보이지 않는다 */
  return (bad ? line("Worst case", ws) : "") + (bs && (!bad || G.cls[bs] === "better") ? line("Best case", bs) : "") || '<p class="lb-line">' + esc(firstSent(G.line)) + "</p>";
}
function lbFx(i, quiet, d){  /* 한 줄 정보가 그래프·전망에 주는 영향. v3.95: 그날 그 사안의 전개 확률이 바뀌었으면 '그래프 변경' */
  const fc = (i.fc || []).map(fcChip).join("");
  const C = d && i.case ? (D.strategies || []).find(s => s.id === i.case) : null;
  const moved = C && C.hs7 && (C.hs7.changes || []).some(x => x.d === d);
  return fc + (moved ? "<span class=\"lb-fx lb-fx-on\">Graph updated</span>" : "") || (quiet ? "" : "<span class=\"lb-fx\">No change to the graph</span>");
}
function lbRecentHtml(rec, today){  /* v3.98: 국민의 삶 카드와 산업별 영향 선 그래프 상세가 함께 씀 */
  return rec.length ? '<ul class="lb-rc">' + rec.map(([d, i]) => '<li><span class="lb-d' + (d === today ? " lb-today" : "") + '">' + (d === today ? "Today" : md(d)) + '</span><span class="lb-t">' + esc(i.h) + "</span>" + lbFx(i, true) + "</li>").join("") + "</ul>" : "<p class=\"note\">No recent updates</p>";
}
function lbRecent(cid, n){  /* 이 사안의 최근 한 줄 정보(최근 호부터) */
  const out = []; (BR.issues || []).some(x => { x.items.forEach(i => { if (i.case === cid && out.length < n) out.push([x.date, i]); }); return out.length >= n; }); return out;
}
/* v3.92 시안: 일자별 선 그래프. 날마다 그날의 확률로 '악화 이상'(크게 악화됨+악화됨)과 '개선됨' 횟수를 계산해 잇는다.
   10월 9일 값은 그날 공개돼 있던 확률에 현재의 분류를 적용한 값이다(인간 안보 그래프는 10월 10일 공개). 사안이 공개되기 전 날은 그리지 않는다.
   확률은 판단을 고칠 때만 바뀌므로 선은 계단 모양이다. 아래 눈금은 그 사안의 한 줄 정보가 들어온 날(오늘은 빨강), 동그라미는 그래프가 바뀐 날 */
const LB_START = "2026-10-09", LB_CASE0 = {poland: "2026-10-10"};
const ymdAdd = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const md = d => (+d.slice(5, 7)) + "." + (+d.slice(8, 10));
function lbTrend(c, G, LAB, OPT){ LAB = LAB || HS_LAB; OPT = OPT || {};  /* v3.96f: 점 그림의 4개 분류마다 선 하나(그 기간에 한 번이라도 있는 분류만), 색은 점 그림과 같게. 현재와 비슷함이 기간 내내 50번 이상이면 그 선은 빼서 다른 선이 공간을 쓰게 함(모두 현재와 비슷함이면 그 선만) */
  const H = c.hs7, today = BR.issues[0].date, ch = OPT.ch || (H.changes || []).slice().sort((a, b) => a.d.localeCompare(b.d));
  const cur = {}; H.scen.forEach(s => cur[s.id] = s.p);
  const mapAt = OPT.mapAt || (d => { let m = ch.length && ch[0].d > d ? ch[0].prev : null; ch.forEach(x => { if (x.d <= d) m = x.next; }); return m || cur; }), cnt = OPT.cnt || (m => hsCountP(H, G, m));  /* v3.99: 5개 사안 종합은 날짜로 점 개수를 계산하는 함수를 넘겨 받음 */
  let a = LB_START, b = today; const have = (Date.parse(b) - Date.parse(a)) / 864e5;  /* 기록이 짧을 때는 7일 창에서 시작해 30일까지 늘리고, 그 뒤로는 최근 30일 */
  const span = Math.min(29, Math.max(6, have)); if (have > span) a = ymdAdd(b, -span); const end = ymdAdd(a, span);
  const s0 = OPT.c0 || LB_CASE0[c.id], c0 = s0 && s0 > a ? s0 : a;
  const days = []; for (let d = c0; d <= b; d = ymdAdd(d, 1)) days.push(d);
  const ser = days.map(d => Object.assign({d}, cnt(mapAt(d))));
  const KS0 = HS_ORD.filter(k => ser.some(v => v[k] > 0)), KS = KS0.length > 1 && ser.every(v => v.same >= 50) ? KS0.filter(k => k !== "same") : KS0, LC = {big: "#C8102E", worse: "#E8890C", better: "#0EA5A4", same: "#8C96A3"};
  const W = OPT.w || 300, Hh = OPT.h || 154, L = 6, R = W - 34, T = 12, B = Hh - 22, X = d => L + (R - L) * ((Date.parse(d) - Date.parse(a)) / 864e5) / span;
  const mx = Math.max(1, ...ser.map(v => Math.max(...KS.map(k => v[k])))), yMax = mx >= 95 ? 100 : Math.max(10, Math.ceil((mx + 1) / 5) * 5), Y = v => B - (B - T) * v / yMax;
  const path = k => ser.map((v, i) => (i ? "H" + X(v.d).toFixed(1) + "V" : "M" + X(v.d).toFixed(1) + ",") + Y(v[k]).toFixed(1)).join("");
  const last = ser[ser.length - 1];
  const dots = k => ser.map(v => '<circle cx="' + X(v.d).toFixed(1) + '" cy="' + Y(v[k]).toFixed(1) + '" r="2.2" fill="' + LC[k] + '"><title>' + esc(kd(v.d) + " · " + LAB[k] + " " + v[k] + "") + "</title></circle>").join("");
  const mine = i => OPT.anyCase ? !!i.case : i.case === c.id;
  const info = (BR.issues || []).filter(x => x.date >= c0 && x.date <= b && x.items.some(mine)).map(x => '<rect x="' + (X(x.date) - 1.5).toFixed(1) + '" y="' + (B + 4) + '" width="3" height="6" rx="1" class="lt-tick' + (x.date === today ? " lt-today" : "") + '"><title>' + esc(kd(x.date) + " · one-line updates: " + x.items.filter(mine).length + "") + "</title></rect>").join("");
  const chg = ch.filter(x => x.d >= c0 && x.d <= b).map(x => { const p = cnt(x.prev), n = cnt(x.next);  /* v3.96g: 바뀐 지점에 동그라미 대신 바뀌기 직전의 점 개수를 작은 숫자로(선의 왼쪽 위, 같은 날 숫자끼리 10px 간격) */
    const ls = KS.filter(k => p[k] !== n[k]).map(k => ({k, y: Y(p[k]) - 4})).sort((u, v) => u.y - v.y); ls.forEach((o, i) => { if (i && o.y - ls[i - 1].y < 10) o.y = ls[i - 1].y + 10; });
    return ls.map(o => '<text x="' + (X(x.d) - 3).toFixed(1) + '" y="' + o.y.toFixed(1) + '" class="lt-pv" text-anchor="end" fill="' + LC[o.k] + '"><title>' + esc(kd(x.d) + " · before the change, " + LAB[o.k] + " " + p[o.k] + " → " + n[o.k] + " · " + x.kind) + "</title>" + p[o.k] + "</text>").join(""); }).join("");
  const lab = KS.map(k => ({k, y: Y(last[k]) + 4})).sort((p, q) => p.y - q.y);  /* 오른쪽 끝 숫자: 겹치지 않게 11px 간격으로 밀어 냄 */
  lab.forEach((o, i) => { if (i && o.y - lab[i - 1].y < 11) o.y = lab[i - 1].y + 11; });
  const over = lab.length ? lab[lab.length - 1].y - (B + 4) : 0; if (over > 0) lab.forEach(o => o.y -= over);
  const xt = (span >= 20 ? [a, ymdAdd(a, Math.round(span / 3)), ymdAdd(a, Math.round(span * 2 / 3)), end] : [a, ymdAdd(a, Math.round(span / 2)), end]).map(d => '<text x="' + X(d).toFixed(1) + '" y="' + (Hh - 2) + '" class="lt-x" text-anchor="' + (d === a ? "start" : d === end ? "end" : "middle") + '">' + md(d) + "</text>").join("");
  const pre = c0 < "2026-10-10" ? '<rect x="' + X(c0).toFixed(1) + '" y="' + T + '" width="' + (X("2026-10-10") - X(c0)).toFixed(1) + '" height="' + (B - T) + "\" class=\"lt-pre\"><title>The October 9 value applies the current classification to that day's probabilities</title></rect>" : "";
  if (OPT.bare) return '<svg class="lt-bare" viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="' + esc(G.name + ": daily key dot counts, " + kd(last.d) + " " + KS.map(k => LAB[k] + " " + last[k] + "").join(", ")) + '">' + pre +
    [0.5, 1].map(f => '<line x1="' + L + '" x2="' + R + '" y1="' + Y(yMax * f).toFixed(1) + '" y2="' + Y(yMax * f).toFixed(1) + '" class="lt-grid"/>').join("") + '<line x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '" class="lt-ax"/>' +
    '<text x="' + (R + 4) + '" y="' + (Y(yMax) + 3).toFixed(1) + '" class="lt-y">' + yMax + "</text>" + KS.map(k => '<path d="' + path(k) + '" class="lt-ln" stroke="' + LC[k] + '"/>' + dots(k)).join("") + chg + info +
    lab.map(o => '<text x="' + (X(last.d) + 7).toFixed(1) + '" y="' + o.y.toFixed(1) + '" class="lt-v" fill="' + LC[o.k] + '">' + last[o.k] + "</text>").join("") + xt + "</svg>";  /* v3.99: 최종 결과 칸 안에 바로 보이는 선 그래프(제목 없이) */
  return '<figure class="lt"' + (OPT.tag ? ' data-lt="' + esc(OPT.tag) + '" data-w="' + W + '"' : "") + "><figcaption class=\"lt-cap\"><span>Key dot counts by day</span><span class=\"note\">" + (have > 29 ? "Last 30 days" : "Since " + kd(LB_START)) + '</span></figcaption><svg viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="' + esc(G.name + ": daily key dot counts, " + kd(last.d) + " " + KS.map(k => LAB[k] + " " + last[k] + "").join(", ")) + '">' + pre +
    [0.5, 1].map(f => '<line x1="' + L + '" x2="' + R + '" y1="' + Y(yMax * f).toFixed(1) + '" y2="' + Y(yMax * f).toFixed(1) + '" class="lt-grid"/>').join("") + '<line x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '" class="lt-ax"/>' +
    '<text x="' + (R + 4) + '" y="' + (Y(yMax) + 3).toFixed(1) + '" class="lt-y">' + yMax + "</text>" +
    KS.map(k => '<path d="' + path(k) + '" class="lt-ln" stroke="' + LC[k] + '"/>' + dots(k)).join("") + chg + info +
    lab.map(o => '<text x="' + (X(last.d) + 7).toFixed(1) + '" y="' + o.y.toFixed(1) + '" class="lt-v" fill="' + LC[o.k] + '">' + last[o.k] + "</text>").join("") + xt + "</svg></figure>";
}
/* v3.94(2026-10-11 결재: 가안+나안) 그래프가 움직인 까닭을 보이기. 나안: 점 개수 옆 최근 7일 증감. 가안: 선 그래프 아래 최근 변경 한 줄 */
function lbMapAt(H){ const ch = (H.changes || []).slice().sort((a, b) => a.d.localeCompare(b.d)), cur = {}; H.scen.forEach(s => cur[s.id] = s.p);
  return d => { let m = ch.length && ch[0].d > d ? ch[0].prev : null; ch.forEach(x => { if (x.d <= d) m = x.next; }); return m || cur; }; }
function lbDelta(c, G){ const H = c.hs7, a = hsCountP(H, G, lbMapAt(H)(ymdAdd(BR.issues[0].date, -7))), b = hsCount(H, G, "p"), o = {}; HS_ORD.forEach(k => o[k] = b[k] - a[k]); return o; }
function lbWhy(c, G){
  const H = c.hs7, ch = (H.changes || []).slice().sort((a, b) => a.d.localeCompare(b.d)), x = ch[ch.length - 1];
  if (!x) return "<p class=\"lb-why lb-why0\"><b>No recent change</b>Probabilities for this issue have not changed since publication on October 10.</p>";
  const SN = {}; H.scen.forEach(s => SN[s.id] = s.name);
  const ds = Object.keys(x.next).filter(k => x.prev[k] !== x.next[k]).sort((p, q) => Math.abs(x.next[q] - x.prev[q]) - Math.abs(x.next[p] - x.prev[p]));
  const a = hsCountP(H, G, x.prev), b = hsCountP(H, G, x.next);
  return '<p class="lb-why"><b>Changed ' + enDate(x.d, true) + "</b><span class=\"lb-why-c\">" + ds.slice(0, 2).map(k => '<span class="lb-why-k">' + esc(SN[k] || k) + " " + x.prev[k] + "→" + x.next[k] + "%</span>").join("") + (ds.length > 2 ? "<span class=\"lb-why-k\">and " + (ds.length - 2) + " more</span>" : "") + "</span>" +
    "<span class=\"lb-why-n\"><span class=\"lb-why-k\">Worse or much worse " + (a.big + a.worse) + "→" + (b.big + b.worse) + "</span><span class=\"lb-why-k\">Better " + a.better + "→" + b.better + "</span></span></p>";
}
function lbStats(n, dl){  /* v3.94g: 3개 색 분류는 0번이어도 늘 보이고(0번은 맨 뒤), 최근 7일 증감도 0까지 모두 보인다 */
  const ks = ["big", "worse", "better"].filter(k => n[k]).concat(n.same ? ["same"] : [], ["big", "worse", "better"].filter(k => !n[k]), n.same ? [] : ["same"]);  /* v3.96e: 현재와 비슷함도 0번이면 맨 뒤에 0으로(4개 분류 늘 표시) */
  return '<ul class="lb-st' + (ks.length > 3 ? " lb-st4" : "") + '">' + ks.map(k => { const d = dl ? (dl[k] || 0) : 0;
    const cls = !d ? "z" : k === "same" ? "n" : ((d > 0) === (k === "better") ? "good" : "bad");
    return '<li class="lb-st-' + k + (n[k] ? "" : " lb-st-zero") + '"><b>' + (n[k] || 0) + '</b><span><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + "</span>" +
      '<em class="lb-dl lb-dl-' + cls + "\" title=\"Change over the past 7 days\">" + (d ? (d > 0 ? "▲" : "▼") + Math.abs(d) : "0") + "</em></li>"; }).join("") + "<li class=\"lb-dl-note\">▲▼ 7-day change</li>" + "</ul>";
}
function lbMix(H, G){  /* v3.92c 점 100개의 구성: 분류마다 그 분류에 드는 전개와 확률 */
  return '<div class="lb-mix"><ul>' +  /* v3.94f: 제목 '점 100개의 구성' 삭제(위 '2030년까지 100번의 미래'와 색 이름으로 이어짐) */ ["big", "worse", "better", "same"].map(k => {
    const ss = H.scen.filter(s => G.cls[s.id] === k && s.p > 0).sort((x, y) => y.p - x.p); if (!ss.length) return "";
    const sh = ss.slice(0, 3), more = ss.length - sh.length;
    return '<li><span class="lb-mk"><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + '</span><span class="lb-ms">' + sh.map(s => futGo(((D.strategies || []).find(x => x.hs7 === H) || {}).id, s.id, esc(s.name)) + " " + s.p + "%").join(" · ") + (more ? " and " + more + " more" : "") + "</span></li>";
  }).join("") + "</ul></div>";
}
function lbDetail(H, G, sid, lab){  /* v3.92c 가장 나쁜(좋은) 경우의 4개 차원: 원래 단위와 점수 변화 */
  const S = H.scen.find(s => s.id === sid); if (!S) return "";
  const rows = HS_CAT.map(([k, nm]) => { const v = G.cat[k]; if (!v || v.na) return ""; const to = v.by[sid], d = to - v.now; if (Math.abs(d) <= 1) return "";
    const raw = k === "정치" ? (d < 0 ? "More state violence" : "Less state violence") : ((v.by_raw || {})[sid] || "");
    return '<li><span class="lb-dk">' + nm + '</span><span class="lb-dv">' + esc(raw) + '</span><span class="lb-dp">' + Math.round(v.now) + "→" + Math.round(to) + "</span></li>"; }).join("");
  /* v3.94c: 예상 경보는 카드에 쓰지 않는다(현재 켜진 경보만 카드 머리에). 제목은 '~가 오면', 점수 칸에 '현재→이 경우' 머리말 */
  return '<div class="lb-det"><p class="lb-lab">' + "If the " + lab.toLowerCase() + " plays out · <b>" + futGo(((D.strategies || []).find(x => x.hs7 === H) || {}).id, S.id, esc(S.name)) + "</b> (" + S.p + "% likely)" + '<span class="lb-col">Score: now → scenario</span></p>' + (rows ? '<ul>' + rows + "</ul>" : "") + "</div>";
}
function lbBrief(H, G, sid, lab){  /* 가장 나쁜 경우를 자세히 보인 카드에서는 가장 좋은 경우를 한 줄로 */
  const S = H.scen.find(s => s.id === sid); if (!S) return "";
  const f = HS_CAT.map(([k, nm]) => { const v = G.cat[k]; if (!v || v.na) return ""; const d = v.by[sid] - v.now; if (Math.abs(d) <= 1) return ""; return nm + " " + Math.round(v.now) + "→" + Math.round(v.by[sid]) + ""; }).filter(Boolean);
  return '<div class="lb-det lb-det-b"><p class="lb-lab">' + "If the " + lab.toLowerCase() + " plays out · <b>" + futGo(((D.strategies || []).find(x => x.hs7 === H) || {}).id, S.id, esc(S.name)) + "</b> (" + S.p + "% likely)" + (f.length ? '<span class="lb-col">Score: now → scenario</span></p><p class="lb-ws">' + esc(f.join(" · ")) + "</p>" : "</p>") + "</div>";
}
function lbExplain(H, G){
  const ws = hsWorstSc(G), bs = hsBestSc(G), bad = ws && (G.cls[ws] === "worse" || G.cls[ws] === "big"), good = bs && G.cls[bs] === "better";
  if (!bad && !good) return '<p class="lb-flatline">' + esc(firstSent(G.line)) + "</p>";
  return lbMix(H, G) + (bad ? lbDetail(H, G, ws, "Worst case") : "") + (good ? (bad ? lbBrief(H, G, bs, "Best case") : lbDetail(H, G, bs, "Best case")) : "");
}
function lifeRow(c){
  const H = c.hs7, G = lifePick(c), nm = c.title.split(":")[0];
  if (!G) return "";
  const n = hsCount(H, G, "p"), rec = lbRecent(c.id, 3), today = BR.issues[0].date;
  const head = '<header class="lb-hd"><span class="lb-case">' + esc(nm) + '</span><b class="lb-gname">' + esc(G.name) + '</b><span class="lb-size">' + esc(G.size) + '</span>' + (G.al_now && G.al_now.length ? '<span class="lb-alnow">Current alerts · ' + esc((a => a.length < 2 ? a[0] : a.slice(0, -1).join(", ") + " & " + a[a.length - 1])(G.al_now.map((x, i) => i ? x.toLowerCase() : x))) + "</span>" : "") + '<button type="button" class="lb-more" data-hs="' + esc(c.id) + "\">Effects on lives <span aria-hidden=\"true\">→</span></button></header>";
  const recent = lbRecentHtml(rec, today);
  /* v3.92c: 왼쪽 칸 = 점 그림·횟수와 그 설명, 오른쪽 칸 = 선 그래프와 최근 정보. 두 칸은 세로선으로 나눈다. 100번 모두 현재와 비슷한 집단도 같은 모양으로 그린다 */
  return '<article class="lb-card" id="lb-' + esc(c.id) + '">' + head + '<div class="lb-cols">' +
    '<div class="lb-left"><p class="lb-lab lb-fut">100 futures through 2030</p><div class="lb-top"><button type="button" class="lb-dots" data-hs="' + esc(c.id) + '" aria-label="' + esc(nm + " · " + G.name + " · see the effects on lives in detail") + '">' + hsDots(n) + "</button>" + lbStats(n, lbDelta(c, G)) + "</div>" + lbExplain(H, G) + "</div>" +
    '<div class="lb-right">' + lbTrend(c, G, null, {tag: "lb|" + c.id}) + lbWhy(c, G) + "<div class=\"lb-rcw\"><p class=\"lb-lab\">Latest updates</p>" + recent + "</div></div></div></article>";
}
/* v3.99 시안(2026-10-12 제안): 국민의 삶도 산업별 미래처럼 국민(집단)마다 한 줄. 왼쪽에 5개 사안 종합, 오른쪽에 사안별 점 그래프와 그 아래 점 개수 추이.
   점 그래프를 누르면 그 사안의 판단 근거(점 100개의 구성, 가장 나쁜·좋은 경우), 추이를 누르면 선 그래프와 최근 변경·최근 정보 */
let LBX = null, LBXM = "d";
const LIFE_EU_ORD = ["WCEU", "SEU", "NEU", "DEU", "NORD", "BALT"];
function lbxGroups(){  /* [[행 키, 이름, 크기, 경보, [[사안, 집단]…]]…] */
  const cs = (D.strategies || []).filter(c => c.hs7);
  if (LIFE === "main") return [["main", "People in the countries involved", "", [], cs.flatMap(c => [[c, c.hs7.groups.find(g => g.k === LIFE_MAIN[c.id]) || lifeMain(c)]].concat(LIFE_MAIN2[c.id] && c.hs7.groups.some(g => g.k === LIFE_MAIN2[c.id]) ? [[c, c.hs7.groups.find(g => g.k === LIFE_MAIN2[c.id])]] : []))]];
  const ks = LIFE === "EU" ? LIFE_EU_ORD : [LIFE];
  return ks.map(k => { const pr = cs.map(c => [c, c.hs7.groups.find(g => g.k === k)]).filter(x => x[1]); if (!pr.length) return null; const G = pr[0][1];
    return [k, G.name, G.size, G.al_now || [], pr]; }).filter(Boolean);
}
function lbxScore(pr){ return pr.reduce((a, [c, G]) => { const n = hsCount(c.hs7, G, "p"); return [a[0] + n.big + n.worse + n.better, a[1] + n.big + n.worse]; }, [0, 0]); }
function lifeRows(){
  const rows = lbxGroups().map((r, i) => [r, lbxScore(r[4]), i]);
  rows.sort((x, y) => (y[1][0] - x[1][0]) || (y[1][1] - x[1][1]) || (x[2] - y[2]));
  if (isMob()) return lifeRowsM(rows);
  const today = BR.issues[0].date;
  return (rows.length > 1 ? mChips(rows.map(([r]) => ["lbx-" + r[0], r[1], r[0] !== "main" && cmbFull(r[0]) ? cmbCount("life|" + r[0], today) : null]), "data-dj", null) : "") + rows.map(([r]) => lbxRow(r)).join("");
}
function lbxRow([rk, name, size, al, pr]){
  const ord = pr.map(([c, G], i) => [c, G, hsCount(c.hs7, G, "p"), i]);
  ord.sort((x, y) => ((y[2].big + y[2].worse + y[2].better) - (x[2].big + x[2].worse + x[2].better)) || ((y[2].big + y[2].worse) - (x[2].big + x[2].worse)) || (x[3] - y[3]));
  const cells = ord.map(([c, G, n]) => { const id = rk + "|" + lpid(c, G), open = LBX === id;
    return dotCell('data-lbx="' + esc(id) + '"', esc(LB_SHORT[c.id] || c.title) + (rk === "main" ? '<small class="ind-sub">' + esc(G.name) + "</small>" : ""), n, lbDelta(c, G), open && LBXM !== "t", open && LBXM === "t", indSpark(indSer(c, G))); }).join("");
  const full = rk !== "main" && cmbFull(rk), ak = "life|" + rk, oa = LBX === rk + "|all";
  const all = full ? dotCell('data-lbx="' + esc(rk + "|all") + '"', "All five issues combined", cmbCount(ak, BR.issues[0].date), cmbDelta(ak), oa && LBXM !== "t", oa && LBXM === "t", cmbLine(ak, name, HS_LAB), "ind-allc") : "";
  const op = LBX && LBX.split("|")[0] === rk ? LBX.split("|")[1] : null, oc = op && op !== "all" ? pr.find(x => lpid(x[0], x[1]) === op) : null;
  const det = oa ? (LBXM === "t" ? lbxAllTrend(rk, name) : cmbDetail("All five issues combined · " + esc(name), cmbCount(ak, BR.issues[0].date), "life", rk, HS_LAB)) : oc ? (LBXM === "t" ? lbxTrend(oc[0], oc[1]) : lbxDetail(oc[0], oc[1])) : "";
  return '<article class="lb-card ind-card lbx-card' + (full ? "" : " lbx-noall") + (rk === "main" ? " lbx-main" : "") + '" id="lbx-' + esc(rk) + '"><header class="lb-hd"><b class="lb-gname">' + esc(name) + "</b>" + (size ? '<span class="lb-size">' + esc(size) + "</span>" : "") +
    (al.length ? '<span class="lb-alnow">Current alerts · ' + esc((a => a.length < 2 ? a[0] : a.slice(0, -1).join(", ") + " & " + a[a.length - 1])(al.map((x, i) => i ? x.toLowerCase() : x))) + "</span>" : "") + (rk === "main" ? "<span class=\"ind-mem\">For each issue, people in the countries directly involved (both warring sides in the Russia-Ukraine war)</span>" + oneMain(pr) : full ? oneLife(name, cmbCount(ak, BR.issues[0].date)) : "") + "</header>" +
    (full ? '<div class="ind-all">' + all + "</div>" : "") + '<div class="ind-cw">' + (full ? "<p class=\"ind-capr\">100 futures, issue by issue</p>" : "") + '<div class="ind-cells">' + cells + "</div></div>" + det + "</article>";
}
function lbxDetail(c, G){
  const nm = c.title.split(":")[0];
  return '<div class="ind-det lbx-det"><p class="lb-lab">' + esc(nm) + " · " + esc(G.name) + '<button type="button" class="lb-more" data-hs="' + esc(c.id) + '" data-hsg="' + esc(G.k) + "\">See effects on people's lives <span aria-hidden=\"true\">→</span></button></p>" + lbExplain(c.hs7, G) + "</div>";
}
function lbxTrend(c, G){
  const nm = c.title.split(":")[0];
  return '<div class="ind-det ind-det-t"><p class="lb-lab">' + esc(nm) + " · " + esc(G.name) + "</p>" + lbTrend(c, G, null, {tag: "lbg|" + c.id + "|" + G.k, w: 680, h: 220}) +
    '<div class="ind-tr">' + indWhy(c, G, HS_LAB, "Dot counts for " + esc(G.name)) + "<div class=\"lb-rcw\"><p class=\"lb-lab\">Latest updates</p>" + lbRecentHtml(lbRecent(c.id, 3), BR.issues[0].date) + "</div></div></div>";
}
function lbxAllTrend(rk, name){
  return "<div class=\"ind-det ind-det-t\"><p class=\"lb-lab\">All five issues combined · " + esc(name) + "</p>" + cmbTrend("life|" + rk, name, null, {tag: "cmb|life|" + rk, w: 680, h: 220}) +
    '<div class="ind-tr">' + cmbWhy("life|" + rk, HS_LAB) + "<div class=\"lb-rcw\"><p class=\"lb-lab\">Latest updates</p>" + lbRecentHtml(cmbRecent(3), BR.issues[0].date) + "</div></div></div>";
}
function lbImpact(c){ const G = lifePick(c); if (!G) return [-1, -1]; const n = hsCount(c.hs7, G, "p"); return [n.big + n.worse + n.better, n.big + n.worse]; }
function lifeRowsOld(){  /* v3.92c: 색 점(나쁜 삶·나은 삶)이 많은 사안부터. 같으면 악화 이상이 많은 쪽, 그다음 원래 순서 */
  const cs = (D.strategies || []).filter(c => c.hs7).map((c, i) => [c, lbImpact(c), i]);
  cs.sort((x, y) => (y[1][0] - x[1][0]) || (y[1][1] - x[1][1]) || (x[2] - y[2]));
  return cs.map(([c]) => lifeRow(c)).join("");
}

/* v3.93 산업별 영향: data/industry.json(탭을 열 때만 받음). 업종마다 5개 사안의 '점 100개'를 나란히 보이고, 칸을 누르면 전개별 판단과 근거를 펼친다.
   분류: 정상 영업이익(기준 매출 × 10년 영업이익률 중앙값, 하한 3%) 대비 +10% 넘게 개선됨, −10% 넘게 악화됨, −30% 넘게 또는 업종 적자 크게 악화됨.
   비교 기준은 사안마다 '현 상태 지속' 전개(국민의 삶 그래프의 이란 사안은 전쟁 전 기준이라 다름). */
let IND = null, INDC = "kr", INDOPEN = null, INDMODE = "d";  /* v3.98: INDMODE d = 점 그래프 상세(전개별 판단), t = 선 그래프 상세(추이) */
const IND_LAB = {big: "Much worse", worse: "Worse", better: "Better", same: "In line with trend"};
const IND_SHORT = {korea: "Korean Peninsula", taiwan: "Taiwan Strait", ukraine: "Russia-Ukraine war", iran: "Iran and Hormuz", poland: "Russia-NATO"};
function indCount(k, c){ const v = IND.cells[k][c.id]; const G = {cls: {}}; c.scen.forEach(s => G.cls[s.id] = v[s.id].c); return hsCount({scen: c.scen}, G, "p"); }
function indPct(x){ return (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(Math.round(x * 100)) + "%"; }
/* v3.98 시안: 산업별 영향의 추이(국민의 삶과 같은 날짜별 확률 이력 × 업종 분류) */
/* v3.99 시안: 5개 사안 종합. 사안마다 전개가 하나씩 일어나는 100번의 미래를 함께 놓고, 그 결합 효과로 분류한다.
   사안 사이의 상관은 대전략 분석의 세계 시나리오 A~E로만 넣는다(같은 세계 시나리오 안에서는 사안끼리 독립). 세계 시나리오별 조건부 확률은 각 사안의
   'world' 표를 쓰되, 그날의 전개 확률에 맞도록 비례 조정(반복 비례 맞춤)한다. 결합 효과: 산업은 정상 영업이익 대비 변화율의 합, 국민의 삶은 4개 범주 점수 변화의 합(0~100점 안). */
const CMB = {cache: {}};
function cmbCases(){ return (D.strategies || []).filter(s => s.hs7 && s.world && s.world.rows && s.world.rows.length); }
function cmbCond(s, pd){
  const W = s.world, ord = W.order, ids = s.hs7.scen.map(x => x.id), fam = id => ord.includes(id) ? id : (ord.find(o => id.indexOf(o) === 0) || id);
  const fs = {}; ids.forEach(id => { const f = fam(id); fs[f] = (fs[f] || 0) + (pd[id] || 0); });
  const wp = W.rows.map(r => r.p / 100), tot = wp.reduce((x, y) => x + y, 0); wp.forEach((v, i) => wp[i] = v / tot);
  /* 국민의 삶의 전개가 전략 분석의 전개와 묶음이 다를 때(한반도: '무장한 정체'에 '체제 유지 승계' 일부 2%p를 넣음) 세계 시나리오 표를 그 묶음에 맞게 옮긴다.
     옮기는 몫 = 공개 당시 국민의 삶 전개 확률의 묶음 합과 전략 분석 전개 확률(world.base)의 차이 */
  const P0 = {}; s.hs7.scen.forEach(x => P0[x.id] = x.p); const f0 = {}; ids.forEach(id => { const f = fam(id); f0[f] = (f0[f] || 0) + (P0[id] || 0); });
  const dif = ord.map((o, j) => W.base && W.base[j] ? (f0[o] || 0) - W.base[j] : 0), T = dif.reduce((x, y) => x + Math.max(0, y), 0);
  const C2 = W.rows.map(r => { if (!T) return r.cond.slice(); const give = ord.map((o, j) => dif[j] < 0 ? r.cond[j] * (-dif[j] / W.base[j]) : 0), G = give.reduce((x, y) => x + y, 0);
    return r.cond.map((c, j) => dif[j] < 0 ? c - give[j] : dif[j] > 0 ? c + G * dif[j] / T : c); });
  let M = W.rows.map((r, w) => ids.map(id => { const j = ord.indexOf(fam(id)); return Math.max(1e-6, j < 0 ? 1 : C2[w][j]) * (fs[fam(id)] ? (pd[id] || 0) / fs[fam(id)] : 0); }));
  const nr = () => { M = M.map(row => { const t = row.reduce((x, y) => x + y, 0) || 1; return row.map(v => v / t); }); };
  for (let it = 0; it < 40; it++) { nr(); const mix = ids.map((_, k) => M.reduce((x, row, w) => x + wp[w] * row[k], 0)); M = M.map(row => row.map((v, k) => mix[k] > 0 ? v * ((pd[ids[k]] || 0) / 100) / mix[k] : 0)); }
  nr(); return {ids, wp, M};
}
function cmbMaps(d){ return cmbCases().map(s => lbMapAt(s.hs7)(d)); }
function cmbSig(d){ return cmbCases().map(s => (s.hs7.changes || []).filter(x => x.d <= d).length).join("."); }
function cmbProb(val, clsf, d){  /* val(s, sid) → 효과 벡터(없으면 null = 이 사안의 계산 대상 아님), clsf(벡터) → 분류 */
  const cs = cmbCases(), maps = cmbMaps(d), per = cs.map((s, i) => ({s, C: cmbCond(s, maps[i])})), out = {big: 0, worse: 0, better: 0, same: 0}, byW = [];
  per[0].C.wp.forEach((pw, w) => { const ow = {big: 0, worse: 0, better: 0, same: 0};
    let dist = [{v: null, p: 1}];
    per.forEach(({s, C}) => { const nd = new Map();
      dist.forEach(o => C.ids.forEach((id, k) => { const q = C.M[w][k]; if (!q) return; const e = val(s, id); const v2 = o.v ? o.v.map((x, j) => x + (e ? e[j] : 0)) : (e ? e.slice() : null);
        const key = v2 ? v2.map(x => x.toFixed(3)).join(",") : "0"; const z = nd.get(key); if (z) z.p += o.p * q; else nd.set(key, {v: v2, p: o.p * q}); }));
      dist = [...nd.values()]; });
    dist.forEach(o => { const k = clsf(o.v); out[k] += pw * o.p; ow[k] += o.p; }); byW.push(ow);
  });
  const ks = ["big", "worse", "better", "same"], G = {cls: {}}; ks.forEach(k => G.cls[k] = k); const R = o => hsCount({scen: ks.map(k => ({id: k, q: o[k] * 100}))}, G, "q");
  const r = R(out), W0 = cs[0].world.rows; r.w = byW.map((o, i) => Object.assign(R(o), {id: W0[i].id, name: W0[i].name, p: W0[i].p})); return r;
}
function cmbChParts(k, s, sid){  /* v3.99 경로 구분: 한 칸의 효과를 경로별 몫으로 [[경로, 값]…] */
  const v = IND.cells[k] && IND.cells[k][s.id], z = v && v[sid]; if (!z || !z.x) return [];
  return z.ch2 && z.w2 ? [[z.ch || "?", z.x * (1 - z.w2)], [z.ch2, z.x * z.w2]] : [[z.ch || ("?" + s.id), z.x]];
}
function cmbChSum(parts){  /* 같은 경로의 같은 부호 효과는 가장 큰 것 하나만, 반대 부호는 더해 상쇄, 경로끼리는 더함 */
  const m = {}; parts.forEach(([c, x]) => { const o = m[c] || (m[c] = {p: 0, n: 0}); if (x > 0) o.p = Math.max(o.p, x); else o.n = Math.min(o.n, x); });
  return Object.values(m).reduce((t, o) => t + o.p + o.n, 0);
}
function cmbIndProb(k, d){  /* 산업 종합: 전개 조합을 모두 펼쳐 경로 규칙으로 합침 */
  const cs = cmbCases(), maps = cmbMaps(d), per = cs.map((s, i) => ({s, C: cmbCond(s, maps[i]), P: {}}));
  per.forEach(o => o.C.ids.forEach(id => o.P[id] = cmbChParts(k, o.s, id)));
  const cl = x => { x = Math.round(x * 1000) / 1000; return x > 0.10 ? "better" : x < -0.30 ? "big" : x < -0.10 ? "worse" : "same"; };
  const out = {big: 0, worse: 0, better: 0, same: 0}, byW = [];
  per[0].C.wp.forEach((pw, w) => { const ow = {big: 0, worse: 0, better: 0, same: 0};
    const go = (i, q, parts) => { if (q < 1e-12) return; if (i === per.length) { const c = cl(cmbChSum(parts)); ow[c] += q; out[c] += pw * q; return; }
      const o = per[i]; o.C.ids.forEach((id, j) => { const qq = o.C.M[w][j]; if (qq) go(i + 1, q * qq, o.P[id].length ? parts.concat(o.P[id]) : parts); }); };
    go(0, 1, []); byW.push(ow); });
  const ks = ["big", "worse", "better", "same"], G = {cls: {}}; ks.forEach(x => G.cls[x] = x); const R = o => hsCount({scen: ks.map(x => ({id: x, q: o[x] * 100}))}, G, "q");
  const r = R(out), W0 = cs[0].world.rows; r.w = byW.map((o, i) => Object.assign(R(o), {id: W0[i].id, name: W0[i].name, p: W0[i].p})); return r;
}
function cmbCount(key, d){  /* key: "ind|<산업 키>" 또는 "life|<집단 키>". 확률이 바뀐 날에만 다시 계산 */
  const ck = key + "@" + cmbSig(d); if (CMB.cache[ck]) return CMB.cache[ck];
  const [t, k] = key.split("|"); let r;
  if (t === "ind") r = cmbIndProb(k, d);
  else { const CAT = ["개인", "공동체", "정치", "경제"], now = cmbNow(k);
    r = cmbProb((s, sid) => { const G = s.hs7.groups.find(g => g.k === k); if (!G) return null; return CAT.map(c => { const x = G.cat[c]; return x && !x.na && x.by && x.by[sid] != null ? x.by[sid] - x.now : 0; }); },
      v => { const dd = v ? v.map((x, j) => Math.round(Math.max(-now[j], Math.min(100 - now[j], x)) * 10) / 10) : [0, 0, 0, 0];  /* 부동소수 경계: 합계를 0.1점에서 반올림한 뒤 분류(검토 지적) */
        if (Math.max(...dd) > 20) return "better"; if (Math.min(...dd) < -20 || dd.filter(q => q < -10).length >= 2) return "big"; if (Math.min(...dd) < -1) return "worse"; if (Math.max(...dd) > 1) return "better"; return "same"; }, d); }
  return (CMB.cache[ck] = r);
}
function cmbNow(k){ const CAT = ["개인", "공동체", "정치", "경제"]; for (const s of cmbCases()) { const G = s.hs7.groups.find(g => g.k === k); if (G) return CAT.map(c => G.cat[c] && !G.cat[c].na ? G.cat[c].now : 50); } return [50, 50, 50, 50]; }
function cmbFull(k){ return cmbCases().every(s => s.hs7.groups.some(g => g.k === k)); }  /* 국민의 삶 종합은 5개 사안 모두에서 계산한 집단만 */
function cmbCh(){ const ds = [...new Set(cmbCases().flatMap(s => (s.hs7.changes || []).map(x => x.d)))].sort(); return ds.map(d => ({d, prev: ymdAdd(d, -1), next: d, kind: "Probability adjustment"})); }
function cmbC0(){ return Object.values(LB_CASE0).sort().pop() || LB_START; }
function cmbTrend(key, name, LAB, opt){ return lbTrend({id: "all", hs7: {scen: [], changes: []}}, {name}, LAB, Object.assign({mapAt: d => d, cnt: d => cmbCount(key, d), ch: cmbCh(), anyCase: true, c0: cmbC0()}, opt || {})); }
function cmbLine(key, name, LAB){ return cmbTrend(key, name, LAB, {bare: true, w: 300, h: !narrow() && innerHeight < 820 ? 100 : 130}); }  /* 데스크톱의 낮은 화면: 종합 칸이 한 화면에 들어오게 선 그래프를 낮춘다 */
function cmbSpark(key){  /* 칸 안의 작은 추이선과 같은 모양 */
  const today = BR.issues[0].date, c0 = cmbC0(), days = []; for (let d = c0; d <= today; d = ymdAdd(d, 1)) days.push(d);
  const ser = days.map(d => cmbCount(key, d)), KS0 = HS_ORD.filter(k => ser.some(v => v[k] > 0)), KS = KS0.length > 1 && ser.every(v => v.same >= 50) ? KS0.filter(k => k !== "same") : KS0;
  return indSpark({days, ser, KS});
}
function cmbWhy(key, LAB){  /* 종합의 선 그래프 아래 상자: 가장 최근 확률 변경일에 바뀐 사안과 종합 점 개수의 변화 */
  const ch = cmbCh(), x = ch[ch.length - 1];
  if (!x) return "<div class=\"ind-why ind-why0\"><p class=\"iw-h\"><b>No recent change</b></p></div>";
  const a = cmbCount(key, x.prev), b = cmbCount(key, x.next), ks0 = ["big", "worse", "better"].filter(k => a[k] || b[k]), ks = ks0.length ? ks0 : ["same"];
  const row = (l, u, v) => '<li><span class="iw-k">' + l + '</span><span class="iw-v">' + u + '<i>→</i>' + v + "</span></li>";
  const cs = cmbCases().filter(s => (s.hs7.changes || []).some(z => z.d === x.d));
  return '<div class="ind-why"><p class="iw-h"><b>Changed ' + enDate(x.d, true) + "</b></p>" +
    cs.map(s => { const z = (s.hs7.changes || []).filter(q => q.d === x.d).pop(); if (!z) return ""; const SN = {}; s.hs7.scen.forEach(q => SN[q.id] = q.name);
      const ds = Object.keys(z.next).filter(q => z.prev[q] !== z.next[q]).sort((p, q) => Math.abs(z.next[q] - z.prev[q]) - Math.abs(z.next[p] - z.prev[p]));
      return '<div class="iw-s"><p class="iw-t">' + esc(LB_SHORT[s.id] || s.title.split(":")[0]) + " scenario probabilities</p><ul>" + ds.map(q => row(esc(SN[q] || q), z.prev[q] + "%", z.next[q] + "%")).join("") + "</ul></div>"; }).join("") +
    "<div class=\"iw-s\"><p class=\"iw-t\">Dot counts, all five issues combined</p><ul>" + ks.map(k => row('<i class="iw-c" style="background:' + HS_COL[k] + '"></i>' + LAB[k], a[k] + "", b[k] + "")).join("") + "</ul></div></div>";
}
function indG(I, c){ const v = IND.cells[I.k][c.id], G = {cls: {}, name: I.name}; c.scen.forEach(s => G.cls[s.id] = v[s.id].c); return G; }
function indCase(c){ return typeof BR !== "undefined" && BR && BR.issues && BR.issues.length && D ? (D.strategies || []).find(s => s.id === c.id && s.hs7) : null; }
function indDelta(cs, G){ const H = cs.hs7, a = hsCountP(H, G, lbMapAt(H)(ymdAdd(BR.issues[0].date, -7))), b = hsCount(H, G, "p"), o = {}; HS_ORD.forEach(k => o[k] = b[k] - a[k]); return o; }
function indSer(cs, G){  /* 칸 안의 작은 추이선 자료: 국민의 삶 선 그래프와 같은 규칙(현재와 비슷함이 늘 50번 이상이면 뺌) */
  const H = cs.hs7, mapAt = lbMapAt(H), today = BR.issues[0].date; let a = LB_START; const have = (Date.parse(today) - Date.parse(a)) / 864e5, span = Math.min(29, Math.max(6, have)); if (have > span) a = ymdAdd(today, -span);
  const c0 = LB_CASE0[cs.id] && LB_CASE0[cs.id] > a ? LB_CASE0[cs.id] : a, days = []; for (let d = c0; d <= today; d = ymdAdd(d, 1)) days.push(d);
  const ser = days.map(d => hsCountP(H, G, mapAt(d))), KS0 = HS_ORD.filter(k => ser.some(v => v[k] > 0)), KS = KS0.length > 1 && ser.every(v => v.same >= 50) ? KS0.filter(k => k !== "same") : KS0;
  return {days, ser, KS};
}
function indSpark(S){  /* v3.98: 작은 추이선은 모양만 보임. 세로는 그 칸의 최솟값~최댓값, 가로는 자료가 있는 기간을 칸 너비에 맞춤. 바뀐 적이 없으면 가운데 수평선 */
  const {days, ser, KS} = S, W = 96, Hh = 30, n = days.length, vs = ser.flatMap(v => KS.map(k => v[k])), lo = Math.min(...vs), hi = Math.max(...vs);
  const X = i => 3 + (W - 6) * (n > 1 ? i / (n - 1) : 1), Y = v => hi === lo ? Hh / 2 - 1 : Hh - 6 - (Hh - 12) * (v - lo) / (hi - lo);
  const LC = {big: "#C8102E", worse: "#E8890C", better: "#0EA5A4", same: "#8C96A3"};
  return '<svg class="ind-sp" viewBox="0 0 ' + W + " " + Hh + '" aria-hidden="true">' +
    KS.map(k => '<path d="' + ser.map((v, i) => (i ? "H" + X(i).toFixed(1) + "V" : "M" + X(i).toFixed(1) + ",") + Y(v[k]).toFixed(1)).join("") + '" fill="none" stroke="' + LC[k] + '" stroke-width="1.8" stroke-linejoin="round"/><circle cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(ser[n - 1][k]).toFixed(1) + '" r="2.2" fill="' + LC[k] + '"/>').join("") + "</svg>";
}
/* v4.32 전개 이름을 누르면 그 사안의 전개 설명으로(F4a~F4d처럼 한 전개를 나눈 것은 본래 전개 F4로) */
function futGo(cid, sid, label){ return cid ? '<button type="button" class="futgo" data-futgo="' + esc(cid) + ":" + esc(String(sid).replace(/^([A-Z]\d+)[a-z]$/, "$1")) + "\" title=\"See this scenario\">" + label + "</button>" : label; }
function indDetail(I, c){
  const v = IND.cells[I.k][c.id], T = {base: "Baseline", shock: "3-year average from the year of the event", state: "2030 level"};
  return '<div class="ind-det"><p class="lb-lab">' + esc(c.title) + " · " + esc(I.name) + (c.id === "iran" ? " <span class=\"note\">This issue is measured against a continuing war.</span>" : "") + '</p><ul>' +
    c.scen.slice().sort((a, b) => b.p - a.p).map(s => { const z = v[s.id];
      return '<li><span class="ind-sn">' + futGo(c.id, s.id, esc(s.name)) + ' <span class="mono">' + s.p + '%</span></span><span class="ind-c" style="--c:' + HS_COL[z.c] + '">' + (s.t === "base" ? "Baseline path" : IND_LAB[z.c] + " " + indPct(z.x)) + '</span>' +
        (s.t === "base" ? "<span class=\"ind-w note\">The conflict persists in its current form. Other scenarios are measured against this baseline.</span>" : '<span class="ind-w">' + (z.w ? esc(z.w) + " " : "") + "<span class=\"note\">Revenue " + indPct(z.r / 100) + ", margin " + (z.dm >= 0 ? "+" : "−") + Math.abs(z.dm) + " pp · range " + indPct(z.lo) + " to " + indPct(z.hi) + " · " + T[s.t] + "</span></span>") + "</li>"; }).join("") + "</ul></div>";
}
function indWhy(cs, G, LAB, lab2){ LAB = LAB || IND_LAB;  /* v3.98: 선 그래프 오른쪽 상자. 가장 최근 확률 변경의 까닭, 바뀐 전개 확률, 이 업종의 점 개수 변화 */
  const H = cs.hs7, ch = (H.changes || []).slice().sort((a, b) => a.d.localeCompare(b.d)), x = ch[ch.length - 1];
  if (!x) return "<div class=\"ind-why ind-why0\"><p class=\"iw-h\"><b>No recent change</b></p><p class=\"iw-r\">Probabilities for this issue have not changed since they were published on October 10.</p></div>";
  const SN = {}; H.scen.forEach(s => SN[s.id] = s.name);
  const ds = Object.keys(x.next).filter(k => x.prev[k] !== x.next[k]).sort((p, q) => Math.abs(x.next[q] - x.prev[q]) - Math.abs(x.next[p] - x.prev[p]));
  const a = hsCountP(H, G, x.prev), b = hsCountP(H, G, x.next), ks0 = ["big", "worse", "better"].filter(k => a[k] || b[k]), ks = ks0.length ? ks0 : ["same"];
  const row = (l, u, v) => '<li><span class="iw-k">' + l + '</span><span class="iw-v">' + u + '<i>→</i>' + v + "</span></li>";
  return '<div class="ind-why"><p class="iw-h"><b>Changed ' + enDate(x.d, true) + "</b></p>" + (x.why ? '<p class="iw-r">' + esc(x.why) + "</p>" : "") +
    "<div class=\"iw-s\"><p class=\"iw-t\">Scenario probabilities</p><ul>" + ds.map(k => row(esc(SN[k] || k), x.prev[k] + "%", x.next[k] + "%")).join("") + "</ul></div>" +
    '<div class="iw-s"><p class="iw-t">' + (lab2 || "Dot counts for this industry") + '</p><ul>' + ks.map(k => row('<i class="iw-c" style="background:' + HS_COL[k] + '"></i>' + LAB[k], a[k] + "", b[k] + "")).join("") + "</ul></div></div>";
}
const IND_NARROW = typeof matchMedia === "function" ? matchMedia("(max-width:699px)") : null;
function indTrendPanel(I, c){  /* v3.98: 칸 아래쪽(작은 추이선)을 누르면 펼치는 선 그래프 상세. 위 = 선 그래프(전체 폭), 아래 왼쪽 = 최근 변경, 아래 오른쪽 = 최근 정보 */
  const cs = indCase(c), G = indG(I, c); if (!cs) return "";
  const opt = IND_NARROW && IND_NARROW.matches ? {w: 340, h: 196} : {w: 680, h: 220};
  opt.tag = "ind|" + I.k + "|" + c.id;
  return '<div class="ind-det ind-det-t"><p class="lb-lab">' + esc(c.title) + " · " + esc(I.name) + '</p>' + lbTrend(cs, G, IND_LAB, opt) +
    '<div class="ind-tr">' + indWhy(cs, G) + "<div class=\"lb-rcw\"><p class=\"lb-lab\">Latest updates</p>" + lbRecentHtml(lbRecent(cs.id, 3), BR.issues[0].date) + "</div></div></div>";
}
function indJump(cid, d){  /* v3.99(2026-10-12 결재): 정세 브리핑의 '산업별 미래 →' — 그날의 확률 변경으로 점 개수가 가장 크게 움직인 업종의 선 그래프 상세를 연다 */
  const c = IND.cases.find(x => x.id === cid), cs = c && indCase(c), ch = cs && (cs.hs7.changes || []).filter(x => x.d === d).pop();
  let best = null;
  if (ch) IND.inds.forEach((I, i) => { const G = indG(I, c), a = hsCountP(cs.hs7, G, ch.prev), b = hsCountP(cs.hs7, G, ch.next), sc = ["big", "worse", "better"].reduce((t, k) => t + Math.abs(b[k] - a[k]), 0);
    const key = [sc, I.c === INDC ? 1 : 0, -i]; if (sc && (!best || key[0] > best.key[0] || (key[0] === best.key[0] && (key[1] > best.key[1] || (key[1] === best.key[1] && key[2] > best.key[2]))))) best = {I, key}; });
  if (best) { INDC = best.I.c; INDOPEN = best.I.k + "|" + cid; INDMODE = "d"; MIOPEN = best.I.k; }
  renderIndustry();
  requestAnimationFrame(() => { const a = best && document.getElementById("ind-" + best.I.k); if (a) a.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); });
}
function indBoard(){ const b = document.getElementById("indboard"); if (b) { b.innerHTML = indRows(); fitTrends(b); } }
function trendH(w, wide){  /* 데스크톱에서 선 그래프 높이를 보이는 칸의 높이에 맞춘다(그래프와 변경 내용이 한 화면에 더 많이 들어오게) */
  if (w < 600) return 196; if (narrow()) return wide; const p = document.getElementById("pane-" + S.tab), ph = (p && p.clientHeight) || innerHeight;
  return Math.round(Math.max(150, Math.min(wide, ph * 0.34)));
}
function fitTrends(root){  /* v3.99: 선 그래프의 그림 폭을 실제로 보이는 폭에 맞춰 다시 그려 글자 크기가 화면 폭과 관계없이 같게 한다(지구본 없는 넓은 화면) */
  (root || document).querySelectorAll("figure.lt[data-lt]").forEach(f => { const w = Math.round(f.clientWidth); if (!w || Math.abs(w - +f.dataset.w) < 6) return;
    const [k, a, b] = f.dataset.lt.split("|"); let html = "";
    if (k === "lbg") { const c = (D.strategies || []).find(x => x.id === a), G = c && c.hs7.groups.find(g => g.k === b); if (G) html = lbTrend(c, G, null, {tag: f.dataset.lt, w, h: trendH(w, 220)}); }
    else if (k === "lb") { const c = (D.strategies || []).find(x => x.id === a), G = c && lifePick(c); if (G) html = lbTrend(c, G, null, {tag: f.dataset.lt, w, h: Math.round(Math.min(210, Math.max(154, w * 0.42)))}); }
    else if (k === "cmb") { const [, t, key] = f.dataset.lt.split("|"); const nm = t === "ind" ? ((IND && IND.inds.find(x => x.k === key)) || {}).name : key; html = cmbTrend(t + "|" + key, nm || "", t === "ind" ? IND_LAB : null, {tag: f.dataset.lt, w, h: trendH(w, t === "ind" ? 230 : 220)}); }
    else if (k === "ind" && IND) { const I = IND.inds.find(x => x.k === a), c = IND.cases.find(x => x.id === b), cs = c && indCase(c); if (I && cs) html = lbTrend(cs, indG(I, c), IND_LAB, {tag: f.dataset.lt, w, h: trendH(w, 230)}); }
    if (html) f.outerHTML = html; });
}
{ let rt = 0; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (S.tab === "brief" || S.tab === "industry") fitTrends(document.getElementById("pane-" + S.tab)); }, 150); }); }
if (IND_NARROW && IND_NARROW.addEventListener) IND_NARROW.addEventListener("change", () => { if (IND && document.getElementById("indboard")) indBoard(); const lb = document.getElementById("lifeboard"); if (lb && BR) { lb.innerHTML = lifeRows(); fitTrends(lb); } });
function dotCell(at, name, n, dl, oD, oT, spark, cls){  /* v3.99: 점 그래프 칸(위: 점 그래프와 개수, 아래: 점 개수 추이). at = 누를 때 쓰는 data 속성 이름, 값은 "<행>|<열>" */
  const k0 = at.split("=")[0], bad = n.big + n.worse, good = n.better;
  const dv = k => dl && dl[k] ? '<i class="ind-d ' + ((dl[k] > 0) === (k === "better") ? "good" : "bad") + "\" title=\"Change over the past 7 days\">" + (dl[k] > 0 ? "▲" : "▼") + Math.abs(dl[k]) + "</i>" : "";
  return '<div class="ind-cell' + (oD || oT ? " on" : "") + (cls ? " " + cls : "") + '"><button type="button" class="ind-cb' + (oD ? " on" : "") + '" ' + at + " title=\"Open the reasoning\" aria-expanded=\"" + !!oD + '"><span class="ind-cn">' + name + "</span>" + hsDots(n) +
    '<span class="ind-ct">' + (bad || good ? (n.big ? "<b class=\"ind-big\">Much worse " + n.big + dv("big") + "</b>" : "") + (n.worse ? "<b class=\"ind-bad\">Worse " + n.worse + dv("worse") + "</b>" : "") + (good ? "<b class=\"ind-good\">Better " + good + dv("better") + "</b>" : "") : "<span class=\"note\">No change</span>") + "</span></button>" +
    (spark ? '<button type="button" class="ind-tb' + (oT ? " on" : "") + '" ' + at + ' ' + k0 + "m=\"t\" title=\"Open the line chart and recent changes\" aria-expanded=\"" + !!oT + "\"><span class=\"ind-tl\">Dot-count trend</span>" + spark + "</button>" : "") + "</div>";
}
function cmbDelta(key){ const t = BR.issues[0].date, a = cmbCount(key, ymdAdd(t, -7)), b = cmbCount(key, t), o = {}; HS_ORD.forEach(k => o[k] = b[k] - a[k]); return o; }
const CMB_NOTE = {  /* v3.99: 종합 그래프의 계산 설명(짧게) */
  ind: "The combined chart adds up the profit change judged for each issue across 100 futures in which all five issues unfold together, then compares the total with the current trend. A loss from one issue can be offset by a gain from another. Where two issues act through the same channel (for example, the same European defense procurement), only the larger of the two effects is counted. Factory capacity limits are not taken into account. Links between the issues are captured through the world scenarios on the World Order tab.",
  life: "The combined chart adds up the change in the four category scores judged for each issue across 100 futures in which all five issues unfold together, then compares the result with today. Links between the issues are captured through the world scenarios on the World Order tab."};
function cmbDetail(title, n, kind, key, LAB){  /* 종합 점 그래프를 누르면: 국민의 삶 카드와 같은 형식의 근거, 짧은 계산 설명, 국제 질서 흐름별 점 개수 */
  return '<div class="ind-det lbx-det cmb-det"><p class="lb-lab">' + title + "</p>" + cmbExplain(kind, key, LAB) +
    '<p class="cmb-m1">' + CMB_NOTE[kind] + "</p>" +
    "<details class=\"cmb-wd\"><summary>How the 100 futures shift with the world order</summary><div class=\"cmb-l\">" + n.w.map(w => '<div class="cmb-w"><p class="cmb-c">' + esc(w.name) + ' <span class="mono">' + w.p + '%</span></p><div class="cmb-b">' + hsDots(w) + '<span class="cmb-n">' + lifeNums(w, "<br>") + "</span></div></div>").join("") + "</div></details></div>";
}
function cmbCombos(kind, k, d){  /* 오늘 확률로 5개 사안의 전개 조합을 모두 펼침(세계 시나리오로 가중). [{p, sids, v, c}] */
  const cs = cmbCases(), maps = cmbMaps(d), per = cs.map((s, i) => ({s, C: cmbCond(s, maps[i])})), CAT = ["개인", "공동체", "정치", "경제"];
  const val = kind === "ind" ? (s, sid) => { const v = IND.cells[k] && IND.cells[k][s.id]; return [v && v[sid] ? v[sid].x : 0]; }  /* 사안별 원래 효과(표시용) */
    : (s, sid) => { const G = s.hs7.groups.find(g => g.k === k); return CAT.map(c => { const x = G && G.cat[c]; return x && !x.na && x.by && x.by[sid] != null ? x.by[sid] - x.now : 0; }); };
  const now = kind === "ind" ? [0] : cmbNow(k), M = new Map();
  per[0].C.wp.forEach((pw, w) => { let L = [{p: pw, sids: [], v: now.map(() => 0)}];
    per.forEach(({s, C}) => { const nl = []; L.forEach(o => C.ids.forEach((id, j) => { const q = C.M[w][j]; if (q > 1e-9) { const e = val(s, id); nl.push({p: o.p * q, sids: o.sids.concat(id), v: o.v.map((x, i) => x + e[i])}); } })); L = nl; });
    L.forEach(o => { const key = o.sids.join(","); const z = M.get(key); if (z) z.p += o.p; else M.set(key, o); }); });
  if (kind === "ind") M.forEach(o => { o.raw = o.v[0]; o.v = [cmbChSum(o.sids.flatMap((sid, i) => cmbChParts(k, per[i].s, sid)))]; });  /* 합계는 경로 규칙으로 */
  const cl = kind === "ind" ? v => { const x = Math.round(v[0] * 1000) / 1000; return x > 0.10 ? "better" : x < -0.30 ? "big" : x < -0.10 ? "worse" : "same"; }
    : v => { const dd = v.map((x, j) => Math.round(Math.max(-now[j], Math.min(100 - now[j], x)) * 10) / 10); if (Math.max(...dd) > 20) return "better"; if (Math.min(...dd) < -20 || dd.filter(q => q < -10).length >= 2) return "big"; if (Math.min(...dd) < -1) return "worse"; if (Math.max(...dd) > 1) return "better"; return "same"; };
  return {cs, now, val, L: [...M.values()].map(o => Object.assign(o, {c: cl(o.v)}))};
}
function cmbExplain(kind, k, LAB){  /* 국민의 삶 카드와 같은 형식: 점 100개의 구성(분류마다 주로 들어 있는 전개), 가장 나쁜·좋은 경우 */
  const {cs, now, val, L} = cmbCombos(kind, k, BR.issues[0].date), SN = {}; cs.forEach(s => s.hs7.scen.forEach(x => SN[s.id + "|" + x.id] = x.name));
  const nm = key => { const c = key.split("|")[0], sh = LB_SHORT[c] || "", n = SN[key] || ""; return n.indexOf(sh.split(/[·\s-]/)[0]) === 0 ? n : sh + " " + n; };
  const sign = (s, sid) => { const e = val(s, sid); return Math.min(...e) < -1e-9 ? -1 : Math.max(...e) > 1e-9 ? 1 : 0; };
  const mix = ["big", "worse", "better"].map(c => { const sub = L.filter(o => o.c === c), tot = sub.reduce((a, o) => a + o.p, 0); if (tot < 0.005) return "";
    const acc = {}; sub.forEach(o => o.sids.forEach((sid, i) => { if (sign(cs[i], sid) === (c === "better" ? 1 : -1)) { const key = cs[i].id + "|" + sid; acc[key] = (acc[key] || 0) + o.p; } }));
    const top = Object.entries(acc).sort((a, b) => b[1] - a[1]).filter(e => Math.round(e[1] * 100) >= 1).slice(0, 3);
    return '<li><span class="lb-mk"><i style="background:' + HS_COL[c] + '"></i>' + LAB[c] + '</span><span class="lb-ms">' + (top.length ? top.map(([key, p]) => esc(nm(key)) + " " + Math.round(p * 100) + "").join(" · ") : "Small changes from several issues adding up") + "</span></li>"; }).join("");
  const pick = c => L.filter(o => o.c === c).sort((a, b) => b.p - a.p)[0];
  const wc = pick("big") ? "big" : pick("worse") ? "worse" : null, w = wc && pick(wc), b = pick("better");
  const CN = ["개인", "공동체", "정치", "경제"].map(k => (HS_CAT.find(c => c[0] === k) || [k, k])[1]);
  const det = (o, lab) => { if (!o) return ""; const sc = o.sids.map((sid, i) => [cs[i], sid]).filter(([s, sid]) => sign(s, sid));
    const rows = kind === "ind" ? sc.map(([s, sid]) => '<li><span class="lb-dk">' + esc(LB_SHORT[s.id]) + '</span><span class="lb-dv">' + esc(SN[s.id + "|" + sid]) + '</span><span class="lb-dp">' + indPct(val(s, sid)[0]) + "</span></li>").join("") + (Math.abs(o.raw - o.v[0]) > 0.0005 ? "<li><span class=\"lb-dk\">Overlap</span><span class=\"lb-dv\">Same channel: only the larger effect counts</span><span class=\"lb-dp\">" + indPct(o.v[0] - o.raw) + "</span></li>" : "") + "<li class=\"cmb-sum\"><span class=\"lb-dk\">Total</span><span class=\"lb-dv\"></span><span class=\"lb-dp\">" + indPct(o.v[0]) + "</span></li>"
      : CN.map((nm, j) => { const to = Math.max(0, Math.min(100, now[j] + o.v[j])); return Math.abs(o.v[j]) > 1 ? '<li><span class="lb-dk">' + nm + '</span><span class="lb-dv"></span><span class="lb-dp">' + Math.round(now[j]) + "→" + Math.round(to) + "</span></li>" : ""; }).join("");
    return '<div class="lb-det"><p class="lb-lab">' + lab + " · <b>" + sc.map(([s, sid]) => esc(nm(s.id + "|" + sid))).join(" + ") + "</b> (" + (o.p < 0.005 ? "under 1% likely" : "likelihood " + Math.round(o.p * 100) + "%") + ")" + '<span class="lb-col">' + (kind === "ind" ? "Profit vs. trend" : "Score: now → this case") + "</span></p><ul>" + rows + "</ul></div>"; };
  return '<div class="lb-mix"><ul>' + mix + "</ul></div>" + (w ? det(w, "If the most likely bad case plays out") : "") + (b ? det(b, "If the most likely good case plays out") : "");
}
function cmbRecent(n){ const out = []; (BR.issues || []).some(x => { x.items.forEach(i => { if (i.case && out.length < n) out.push([x.date, i]); }); return out.length >= n; }); return out; }
function indX(x){ const v = Math.max(-0.6, Math.min(0.6, x)); return (50 + v / 0.6 * 50).toFixed(2); }
function indStrip(I){  /* v4.13: 사안마다 한 줄, 전개마다 점 하나(가로 위치 = 현 추세 대비 이익 변화, 크기 = 가능성, 색 = 분류). 줄을 누르면 판단 근거 */
  const ax = [-0.3, -0.1, 0, 0.1, 0.3];
  const grid = '<span class="ist-band" style="left:' + indX(-0.1) + "%;width:" + (indX(0.1) - indX(-0.1)).toFixed(2) + '%"></span>' + ax.map(a => '<span class="ist-g' + (a ? "" : " ist-0") + '" style="left:' + indX(a) + '%"></span>').join("");
  const head = '<div class="ist-r ist-ax" aria-hidden="true"><span class="ist-c"></span><span class="ist-p">' + ax.map(a => '<span class="ist-al' + (Math.abs(a) === 0.1 ? " ist-al10" : "") + '" style="left:' + indX(a) + '%">' + (a ? (a > 0 ? "+" : "−") + Math.round(Math.abs(a * 100)) + "%" : "0") + "</span>").join("") + "</span></div>";
  const rows = IND.cases.map(c => { const v = IND.cells[I.k][c.id] || {}, id = I.k + "|" + c.id, open = INDOPEN === id;
    const dots = c.scen.filter(s => s.t !== "base").sort((a, b) => b.p - a.p).map(s => { const z = v[s.id] || {x: 0, c: "same"}, d = Math.round(7 + 12 * Math.sqrt(Math.min(s.p, 50) / 50));
      return '<i class="ist-d ist-' + z.c + (Math.abs(z.x) > 0.6 ? " ist-cl" : "") + '" style="left:' + indX(z.x) + "%;width:" + d + "px;height:" + d + 'px" title="' + esc(s.name + " · " + IND_TXT.of(s.p) + " · " + IND_TXT.chg(z.x)) + '"></i>'; }).join("");
    return '<button type="button" class="ist-r' + (open ? " on" : "") + '" data-ind="' + esc(id) + '" aria-expanded="' + open + '"><span class="ist-c">' + esc(IND_SHORT[c.id] || c.title) + '</span><span class="ist-p">' + grid + dots + "</span></button>" + (open ? indDetail(I, c) : ""); }).join("");
  return '<div class="ist">' + head + rows + "</div>";
}
function indRow2(I){
  return '<article class="lb-card ind2" id="ind-' + esc(I.k) + '"><header class="lb-hd"><b class="lb-gname">' + esc(I.name) + "</b><span class=\"lb-size\">Normal operating margin " + (I.m * 100).toFixed(1) + "%" + (I.floor ? " (floor)" : "") + '</span><span class="ind-mem">' + esc(I.mem.join(", ")) + "</span></header>" +
    '<p class="one one-k">' + indKeys(I) + "</p>" + indStrip(I) + "</article>";
}
function indRow(I){
  const ns = IND.cases.map((c, i) => [c, indCount(I.k, c), i]);
  ns.sort((x, y) => ((y[1].big + y[1].worse + y[1].better) - (x[1].big + x[1].worse + x[1].better)) || ((y[1].big + y[1].worse) - (x[1].big + x[1].worse)) || (x[2] - y[2]));  /* v3.94f: 업종마다 색 점이 많은 분쟁부터 */
  const cells = ns.map(([c, n]) => { const bad = n.big + n.worse, good = n.better, open = INDOPEN === I.k + "|" + c.id, oD = open && INDMODE !== "t", oT = open && INDMODE === "t", cs = indCase(c), G = indG(I, c), dl = cs ? indDelta(cs, G) : {};
    const dv = k => dl[k] ? '<i class="ind-d ' + ((dl[k] > 0) === (k === "better") ? "good" : "bad") + "\" title=\"Change over the past 7 days\">" + (dl[k] > 0 ? "▲" : "▼") + Math.abs(dl[k]) + "</i>" : "";
    return '<div class="ind-cell' + (open ? " on" : "") + '"><button type="button" class="ind-cb' + (oD ? " on" : "") + '" data-ind="' + esc(I.k + "|" + c.id) + '" aria-expanded="' + oD + '"><span class="ind-cn">' + esc(IND_SHORT[c.id] || c.title) + "</span>" + hsDots(n) +
      '<span class="ind-ct">' + (bad || good ? (n.big ? "<b class=\"ind-big\">Much worse " + n.big + dv("big") + "</b>" : "") + (n.worse ? "<b class=\"ind-bad\">Worse " + n.worse + dv("worse") + "</b>" : "") + (good ? "<b class=\"ind-good\">Better " + good + dv("better") + "</b>" : "") : "<span class=\"note\">No change</span>") + "</span></button>" + (cs ? '<button type="button" class="ind-tb' + (oT ? " on" : "") + '" data-ind="' + esc(I.k + "|" + c.id) + '" data-indm="t" aria-expanded="' + oT + "\"><span class=\"ind-tl\">Dot-count trend</span>" + indSpark(indSer(cs, G)) + "</button>" : "") + "</div>"; }).join("");  /* v3.94g: 크게 악화를 따로, 한 줄에 하나씩 */
  const op = INDOPEN && INDOPEN.split("|")[0] === I.k ? IND.cases.find(c => c.id === INDOPEN.split("|")[1]) : null, oa = INDOPEN === I.k + "|all", ak = "ind|" + I.k;
  const opd = op ? (INDMODE === "t" ? indTrendPanel(I, op) : indDetail(I, op)) : oa ? (INDMODE === "t" ? indAllTrend(I) : cmbDetail("All five issues combined · " + esc(I.name), cmbCount(ak, BR.issues[0].date), "ind", I.k, IND_LAB)) : "";
  const all = dotCell('data-ind="' + esc(I.k + "|all") + '"', "All five issues combined", cmbCount(ak, BR.issues[0].date), cmbDelta(ak), oa && INDMODE !== "t", oa && INDMODE === "t", cmbLine(ak, I.name, IND_LAB), "ind-allc");
  return '<article class="lb-card ind-card" id="ind-' + esc(I.k) + '"><header class="lb-hd"><b class="lb-gname">' + esc(I.name) + "</b><span class=\"lb-size\">Normal operating margin " + (I.m * 100).toFixed(1) + "%" + (I.floor ? " (floor)" : "") + '</span><span class="ind-mem">' + esc(I.mem.join(", ")) + "</span>" + oneInd(I.name, cmbCount(ak, BR.issues[0].date), I) + "</header>" +
    '<div class="ind-all">' + all + "</div><div class=\"ind-cw\"><p class=\"ind-capr\">100 futures, issue by issue</p><div class=\"ind-cells\">" + cells + "</div></div>" + opd + "</article>";
}
function indAllTrend(I){
  const opt = IND_NARROW && IND_NARROW.matches ? {w: 340, h: 196} : {w: 680, h: 230}; opt.tag = "cmb|ind|" + I.k;
  return "<div class=\"ind-det ind-det-t\"><p class=\"lb-lab\">All five issues combined · " + esc(I.name) + "</p>" + cmbTrend("ind|" + I.k, I.name, IND_LAB, opt) +
    '<div class="ind-tr">' + cmbWhy("ind|" + I.k, IND_LAB) + "<div class=\"lb-rcw\"><p class=\"lb-lab\">Latest updates</p>" + lbRecentHtml(cmbRecent(3), BR.issues[0].date) + "</div></div></div>";
}
/* v3.99c 휴대전화(699px 이하) 전용 구조: 목록 → 펼침 → 상세가 누른 줄 바로 아래.
   1) 산업(국민)마다 한 줄: 이름, 5개 사안 종합의 작은 점 그림과 개수. 누르면 그 자리에서 펼침
   2) 펼치면 종합의 점 그래프와 선 그래프를 크게, 그 아래 사안별 줄(작은 점 그림·개수·추이선)
   3) 사안 줄이나 종합 그래프를 누르면 상세가 바로 그 아래에 열림(화면 아래로 밀려나지 않게) */
let MIOPEN = undefined, MLOPEN = undefined;
const isMob = () => !!(IND_NARROW && IND_NARROW.matches);
const M_LAB = {big: "Much worse", worse: "Worse", better: "Better"};
function mNums(n, dl){
  const dv = k => dl && dl[k] ? ' <i class="ind-d ' + ((dl[k] > 0) === (k === "better") ? "good" : "bad") + '">' + (dl[k] > 0 ? "▲" : "▼") + Math.abs(dl[k]) + "</i>" : "";
  const t = ["big", "worse", "better"].filter(k => n[k]).map(k => '<b class="m-' + k + '">' + M_LAB[k] + " " + n[k] + dv(k) + "</b>").join("");
  return t || "<span class=\"note\">No change</span>";
}
function mCaseRow(at, open, mode, name, sub, n, dl, spark, det){  /* 사안 한 줄: 왼쪽(점·이름·개수)은 판단 근거, 오른쪽(추이선)은 선 그래프 */
  const k0 = at.split("=")[0], oD = open && mode !== "t", oT = open && mode === "t";
  return '<div class="mc' + (open ? " on" : "") + '"><div class="mc-r"><button type="button" class="mc-a' + (oD ? " on" : "") + '" ' + at + ' aria-expanded="' + oD + '">' + hsDots(n) +
    '<span class="mc-t"><span class="mc-n">' + name + (sub ? "<small>" + sub + "</small>" : "") + '</span><span class="mc-c">' + mNums(n, dl) + "</span></span></button>" +
    (spark ? '<button type="button" class="mc-s' + (oT ? " on" : "") + '" ' + at + " " + k0 + 'm="t" aria-expanded="' + oT + '">' + spark + "<span class=\"mc-sl\">Trend ›</span></button>" : "") + "</div>" + (open ? det : "") + "</div>";
}
function mAll(at, open, mode, n, dl, line, det){  /* 펼친 줄의 맨 위: 종합 점 그래프와 선 그래프 */
  const k0 = at.split("=")[0], oD = open && mode !== "t", oT = open && mode === "t";
  return '<div class="ma' + (open ? " on" : "") + "\"><p class=\"ma-h\">All five issues combined</p><button type=\"button\" class=\"ma-d" + (oD ? " on" : "") + '" ' + at + ' aria-expanded="' + oD + '">' + hsDots(n) +
    '<span class="ma-c">' + mNums(n, dl) + "<span class=\"ma-more\">Reasoning ›</span></span></button>" +
    '<button type="button" class="ma-l' + (oT ? " on" : "") + '" ' + at + " " + k0 + 'm="t" aria-expanded="' + oT + "\"><span class=\"ma-lh\">Dot-count trend ›</span>" + line + "</button>" + (open ? det : "") + "</div>";
}
function mLine(key, name, LAB){  /* 휴대전화: 종합 선 그래프를 화면 폭에 맞춰 그려 글자가 사안별 선 그래프와 같은 크기로 보이게 */
  const w = Math.max(240, Math.min(600, (innerWidth || 390) - 84)); return cmbTrend(key, name, LAB, {bare: true, w, h: Math.round(Math.min(200, Math.max(160, w * 0.55)))}); }
function mChips(list, attr, cur){  /* 휴대전화: 펼치기 전에 무엇이 있는지 보이는 칩 목록. 칩 아래 막대는 종합의 크게 악화·악화·개선 점 개수(100개 중) */
  return "<nav class=\"mchips\" id=\"mchips\" aria-label=\"Jump to a row\">" + list.map(([k, nm, n]) => '<button type="button" class="mch' + (k === cur ? " on" : "") + '" ' + attr + '="' + esc(k) + '" aria-pressed="' + (k === cur) + '"><span class="mch-n">' + esc(nm) + "</span>" +
    (n ? '<span class="mch-b" aria-hidden="true">' + ["big", "worse", "better"].map(x => n[x] ? '<i class="mb-' + x + '" style="width:' + n[x] + '%"></i>' : "").join("") + "</span>" : "") + "</button>").join("") + "</nav>";
}
function mGo(id){ requestAnimationFrame(() => { const a = document.getElementById(id); if (!a) return; const t = a.querySelector(".mc.on,.ma.on") || a; t.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); }); }
function mTopTarget(){ const p = document.getElementById("pane-" + S.tab); if (!p || p.hidden || !p.querySelector("#indboard,#lifeboard")) return null; return p.querySelector("#mchips") || p.querySelector(".lb-ctl"); }
function mTopList(){  /* 휴대전화의 산업별 미래·국민의 삶: 목록(칩)을 지나 내려가면 '위로' 단추가 '↑ 목록'이 되어 칩 목록으로 돌아간다 */
  const t = S.tab === "industry" || S.tab === "brief" ? mTopTarget() : null; if (!t) return null;
  const p = document.getElementById("pane-" + S.tab), top = Math.max(0, p ? p.getBoundingClientRect().top : 0);  /* 데스크톱은 칸 안에서 스크롤 */
  return t.getBoundingClientRect().bottom < top ? t : null; }
function mSort(a){ return a.sort((x, y) => ((y[1].big + y[1].worse + y[1].better) - (x[1].big + x[1].worse + x[1].better)) || ((y[1].big + y[1].worse) - (x[1].big + x[1].worse)) || (x[2] - y[2])); }
function indRowsM(L){
  if (MIOPEN === undefined) MIOPEN = null;  /* 처음에는 모두 닫고 위의 산업 칩을 목차로 쓴다 */
  const today = BR.issues[0].date;
  return mChips(L.map(([I]) => [I.k, I.name, cmbCount("ind|" + I.k, today)]), "data-mj", MIOPEN) + indGrpWrap(L, ([I]) => { const ak = "ind|" + I.k, n = cmbCount(ak, today), ex = MIOPEN === I.k;
    let body = "";
    if (ex) { const ns = mSort(IND.cases.map((c, i) => [c, indCount(I.k, c), i])), oa = INDOPEN === I.k + "|all";
      body = '<div class="mi-b">' + oneInd(I.name, n, I) + mAll('data-ind="' + esc(I.k + "|all") + '"', oa, INDMODE, n, cmbDelta(ak), mLine(ak, I.name, IND_LAB), oa ? (INDMODE === "t" ? indAllTrend(I) : cmbDetail("All five issues combined · " + esc(I.name), n, "ind", I.k, IND_LAB)) : "") +
        "<p class=\"ind-capr\">100 futures, issue by issue</p>" + ns.map(([c, nc]) => { const id = I.k + "|" + c.id, op = INDOPEN === id, cs = indCase(c), G = indG(I, c);
          return mCaseRow('data-ind="' + esc(id) + '"', op, INDMODE, esc(IND_SHORT[c.id] || c.title), "", nc, cs ? indDelta(cs, G) : null, cs ? indSpark(indSer(cs, G)) : "", op ? (INDMODE === "t" ? indTrendPanel(I, c) : indDetail(I, c)) : ""); }).join("") +
        '<p class="mi-mem">' + esc(I.mem.join(", ")) + " · Normal operating margin " + (I.m * 100).toFixed(1) + "%</p></div>"; }
    return '<article class="mi' + (ex ? " ex" : "") + '" id="ind-' + esc(I.k) + '"><button type="button" class="mi-h" data-mi="' + esc(I.k) + '" aria-expanded="' + ex + '">' + hsDots(n) +
      '<span class="mi-t"><span class="mi-n">' + esc(I.name) + '</span><span class="mi-c">' + mNums(n) + '</span></span><span class="mi-x" aria-hidden="true"></span></button>' + body + "</article>";
  });
}
function lifeRowsM(rows){
  if (MLOPEN && !rows.some(r => r[0][0] === MLOPEN)) MLOPEN = null;
  const today = BR.issues[0].date, one = rows.length === 1;
  return (one ? "" : mChips(rows.map(([r]) => [r[0], r[1], r[0] !== "main" && cmbFull(r[0]) ? cmbCount("life|" + r[0], today) : null]), "data-mlj", MLOPEN)) + rows.map(([r]) => { const [rk, name, size, al, pr] = r, full = rk !== "main" && cmbFull(rk), ak = "life|" + rk, n = full ? cmbCount(ak, today) : null, ex = one || MLOPEN === rk;
    let body = "";
    if (ex) { const ord = mSort(pr.map(([c, G], i) => [c, hsCount(c.hs7, G, "p"), i, G])), oa = LBX === rk + "|all";
      body = '<div class="mi-b">' + (rk === "main" ? oneMain(pr) : full ? oneLife(name, n) : "") + (full ? mAll('data-lbx="' + esc(rk + "|all") + '"', oa, LBXM, n, cmbDelta(ak), mLine(ak, name, HS_LAB), oa ? (LBXM === "t" ? lbxAllTrend(rk, name) : cmbDetail("All five issues combined · " + esc(name), n, "life", rk, HS_LAB)) : "") + "<p class=\"ind-capr\">100 futures, issue by issue</p>" : "") +
        ord.map(([c, nc, , G]) => { const id = rk + "|" + lpid(c, G), op = LBX === id;
          return mCaseRow('data-lbx="' + esc(id) + '"', op, LBXM, esc(LB_SHORT[c.id] || c.title), rk === "main" ? esc(G.name) : "", nc, lbDelta(c, G), indSpark(indSer(c, G)), op ? (LBXM === "t" ? lbxTrend(c, G) : lbxDetail(c, G)) : ""); }).join("") +
        (size || al.length ? '<p class="mi-mem">' + esc(size) + (al.length ? (size ? " · " : "") + "Alerts: " + esc(al.join("·")) : "") + "</p>" : "") + "</div>"; }
    const head = (full ? hsDots(n) : "") + '<span class="mi-t"><span class="mi-n">' + esc(name) + '</span><span class="mi-c">' + (full ? mNums(n) : '<span class="note">' + (rk === "main" ? "For each issue, people in the countries directly involved (both warring sides in the Russia-Ukraine war)" : "") + "</span>") + "</span></span>";
    return '<article class="mi' + (ex ? " ex" : "") + (full ? "" : " mi-nd") + '" id="lbx-' + esc(rk) + '">' + (one ? '<div class="mi-h mi-h1">' + head + "</div>" : '<button type="button" class="mi-h" data-ml="' + esc(rk) + '" aria-expanded="' + ex + '">' + head + '<span class="mi-x" aria-hidden="true"></span></button>') + body + "</article>";
  }).join("");
}
function detReveal(el){  /* 누른 곳 아래에 열린 상세가 화면 밖이면 보이도록 부드럽게 내림 */
  if (!el) return; requestAnimationFrame(() => { const r = el.getBoundingClientRect(), vh = innerHeight || document.documentElement.clientHeight;
    if (r.top > vh * 0.75 || r.top < 0) el.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); });
}
function indRows(){
  const L = IND.inds.filter(I => I.c === INDC).map((I, i) => { const t = IND.cases.reduce((a, c) => { const n = indCount(I.k, c); return [a[0] + n.big + n.worse + n.better, a[1] + n.big + n.worse]; }, [0, 0]); return [I, t, i]; });
  L.sort((x, y) => (y[1][0] - x[1][0]) || (y[1][1] - x[1][1]) || (x[2] - y[2]));  /* 색 점이 많은 업종부터 */
  const G = ["a", "b", "c"].flatMap(g => L.filter(x => indGrp(x[0]) === g));  /* v4.12 묶음 순서대로 */
  return mChips(G.map(([I]) => ["ind-" + I.k, I.name, null]), "data-dj", null) + indGrpWrap(G, ([I]) => indRow2(I));  /* v4.13: 데스크톱·휴대전화 같은 카드(점 그림 100개·선 그래프 대신 전개별 점) */
}
function renderIndustry(){
  const el = $("#pane-industry"); if (!el) return;
  if (!IND) { el.innerHTML = "<div class=\"sec\"><p class=\"note\">Loading Industry Outlook…</p></div>";
    fetch("/en/data/industry.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).then(d => { if (d) { IND = d; renderIndustry(); } else el.innerHTML = "<div class=\"sec\"><p class=\"note\">Industry Outlook could not be loaded.</p></div>"; }).catch(() => {}); return; }
  el.innerHTML = "<section class=\"lb ind\" id=\"s-ind\"><p class=\"eyebrow\">Industry Outlook · as of " + enDate(IND.asof) + "</p><h2 class=\"lb-h\">" + IND_TXT.h2 + '</h2>' +
    '<p class="lb-lead">' + IND_TXT.lead + '</p>' +
    "<div class=\"lb-ctl\"><div class=\"lsel\" role=\"group\" aria-label=\"Choose which country's industries to show\">" + [["kr", "South Korean industries"], ["us", "U.S. industries"]].map(([k, l]) => '<button type="button" data-indc="' + k + '" aria-pressed="' + (k === INDC) + '">' + l + "</button>").join("") + "</div>" +
    '<p class="lb-leg">' + ["big", "worse", "better", "same"].map(k => '<span><i class="ist-' + k + '"></i>' + IND_LAB[k] + "</span>").join("") + "<span>" + IND_TXT.size + "</span><span>" + IND_TXT.band + "</span></p></div>" +
    '<div class="lb-board" id="indboard">' + indRows() + "</div>" +
    '<div class="ind-note"><p>' + IND_GRP.note + "</p><p><b>How the assessment works.</b> For each industry, every scenario in each conflict is assessed for how far 2030 operating profit would diverge from the current trend, through shifts in revenue and in operating margin. The change is measured against the industry's normal operating profit, based on the median operating margin of the past decade (with a floor of 3 percent). A gain of more than 10 percent counts as Better; a decline of more than 10 percent as Worse; and a decline of more than 30 percent, or an industry-wide loss, as Much worse. Shocks such as a blockade or a war are measured as a three-year average from the year they occur; changes of state such as a ceasefire or a settlement are measured at their 2030 level. Industries with thin normal margins (defense at 5.0 percent, shipbuilding at 3.0 percent) tend to show outsize swings from even modest changes in margin.</p>" +
    "<p><b>Sources.</b> Company results are drawn from raw filings with DART, the electronic disclosure system run by South Korea's Financial Supervisory Service, and with the U.S. Securities and Exchange Commission (SEC). For U.S. companies that do not report operating income—all financial firms, the integrated oil majors, and some agriculture and aerospace companies—pretax income is used instead. The normal operating margin for South Korean finance is based on the past three years.</p>" +
    "<p class=\"note\">This tab assesses how conflicts could affect the profits of entire industries. It does not constitute investment advice on any individual company.</p></div></section>"; fitTrends(el);
}
function lifeBoardHtml(x){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  const csn = id => LB_SHORT[id] || "Other";
  return "<section class=\"lb\" id=\"s-life\"><p class=\"eyebrow\">People's Lives · as of " + enDate(x.date) + "</p><h2 class=\"lb-h\">100 futures through 2030</h2>" +
    "<p class=\"lb-lead\"><b>How will five conflicts change life for the people of the countries involved by 2030? Across 100 possible futures, in how many does the conflict leave their lives better than today, and in how many worse?</b> For each issue, 100 dots show the spread of possible futures, and that spread shifts as new events unfold. Only the effects of the conflict are counted; changes unrelated to it, such as economic growth, are left out. Select a chart to see the detailed reasoning. The dot counts are calculated from Clisa Geopolitics' judgment estimates.</p>" +
    "<div class=\"lb-ctl\"><div class=\"lsel\" role=\"group\" aria-label=\"Whose lives to show\">" + (LIFE_SEL.length > 1 ? LIFE_SEL : []).map(([k, l]) => '<button type="button" data-life="' + k + '" aria-pressed="' + (k === LIFE) + '">' + l + "</button>").join("") + "</div>" +
    '<p class="lb-leg">' + HS_ORD.map(k => '<span><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + "</span>").join("") + "<span class=\"lb-leg-l\"><i class=\"lg-bad\"></i>Key dot counts over time</span><span class=\"lb-leg-l\"><i class=\"lg-tick\"></i>One-line update</span><span class=\"lb-leg-l\"><b class=\"lg-pv\">22</b>Count just before a change</span></p></div>" +
    '<div class="lb-board" id="lifeboard">' + lifeRows() + "</div>" +
    "<p class=\"lb-note\">Much worse: any one category falls by more than 20 points, or two categories fall by more than 10 points each. In the daily chart, the October 9 value applies the current classification to that day's probabilities (the graph was published on October 10).</p></section>" +
    "<p class=\"lb-tobr\"><button type=\"button\" class=\"chip\" data-go=\"overview\" data-bgo=\"1\">What moved these graphs · see the briefing →</button></p>";
}
function lifeStripHtml(x){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  return "<div class=\"lm-row\" aria-label=\"People's lives · 100 futures through 2030\">" + cs.map(c => { const G = lifeMain(c), n = hsCount(c.hs7, G, "p"), k = x.items.filter(i => i.case === c.id).length;
    return '<button type="button" class="lm" data-hs="' + esc(c.id) + '"><span class="lm-c">' + esc(c.title.split(":")[0]) + '</span><span class="lm-g">' + esc(G.name) + "</span>" + hsDots(n) + '<span class="lm-n">' + lifeNums(n, "<br>") + "</span>" + (k ? "<span class=\"lm-t\">Today's briefing: " + k + "</span>" : "") + "</button>"; }).join("") + "</div>";
}
function lifeItemHtml(id){
  const c = (D.strategies || []).find(k => k.id === id); if (!c || !c.hs7) return "";
  const G = lifeMain(c), n = hsCount(c.hs7, G, "p");
  return '<button type="button" class="bi-life" data-hs="' + esc(id) + '">' + hsDots(n) + "<span><b>" + esc(G.name) + ": 100 futures through 2030</b><br>" + lifeNums(n) + " · see the effects on lives →</span></button>";
}
function lifeHeroHtml(){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  return "<section class=\"sec\" id=\"s-life\"><h3>People's lives · 100 futures through 2030</h3><p class=\"note\">For one group in each of the five issues, the dots show how many of 100 possible futures through 2030 leave that group better or worse off. Probabilities and classifications are judgment estimates; the method is set out in each issue's analysis under ‘What this issue means for people's lives’.</p><div class=\"lh-grid\">" +
    cs.map(c => { const H = c.hs7, G = H.groups.find(g => !g.fold) || H.groups[0], n = hsCount(H, G, "p"), nm = c.title.split(":")[0];
      return '<article class="lh-card"><p class="lh-case">' + esc(nm) + '</p><div class="lh-hd"><b>' + esc(G.name) + "</b><span>" + esc(G.size) + '</span></div><div class="lh-body">' + hsDots(n) + "<div>" + hsLegend(n, n) + '</div></div><p class="lh-line">' + esc(G.line) + "</p>" + hsChgLine(H, G) + '<button type="button" class="chip" data-hs="' + esc(c.id) + '">' + esc(nm) + " · see the effects on lives →</button></article>"; }).join("") + "</div></section>";
}
function hs7Html(c, n9){
  const H0 = c.hs7, main = hsOrd(H0, H0.groups.filter(G => !G.fold)), fold = hsOrd(H0, H0.groups.filter(G => G.fold)), H = Object.assign({}, H0, {groups: main.concat(fold)});
  return '<section class="stp" id="hs7-' + esc(c.id) + '">' + stpH(n9, "What this issue means for people's lives") + '<p class="hs-lead">' + esc(H.lead) + "</p>" +
    main.map(G => hsCard(H, G, c.id)).join("") +
    (fold.length ? "<details class=\"src\"><summary>Other groups · " + fold.map(G => esc(G.name)).join(", ") + "</summary>" + fold.map(G => hsCard(H, G, c.id)).join("") + "</details>" : "") +
    "<div class=\"lesson-box\"><b>Reading the graph</b>" + esc(H.read) + "</div>" +
    ((c.people || []).length ? "<details class=\"src\"><summary>Everyone affected · including groups not scored</summary><div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Who</th><th>What is at stake</th></tr></thead><tbody>" + c.people.map(p => "<tr><td>" + esc(p.who) + "</td><td>" + esc(p.how) + "</td></tr>").join("") + "</tbody></table></div></details>" : "") +  /* v3.90 2안: 기존 '영향받는 사람' 표를 접힘으로 남긴다 */
    hsHistHtml(H) +
    "<details class=\"src\"><summary>Detailed tables and method</summary><p class=\"note\">Scores follow the UN's human security categories. Personal safety is the rate of violent deaths; Community is the share of people forced from their homes (for separated families, contact with relatives); Political is freedom from state torture and political killing (the V-Dem physical integrity index); Economic is per capita income at purchasing power parity. Food, health and environment appear as alerts when a threshold is crossed. Categories are never combined. Current scores are measured values; future probabilities and scores are judgment estimates. The dot colors classify each scenario: Much worse if any one category falls by more than 20 points or two fall by more than 10 points each, Worse if a category falls by more than one point, Better if one rises by more than one point (judgment estimates). " + (H.split ? esc(H.split) + " " : "") + "Formulas and sources are in the <button type=\"button\" class=\"chip\" data-go=\"method\">Methodology tab</button>.</p>" + hsTables(H) + "</details></section>";
}
function humanHtml(c, n9, n10){
  if (c.hs7) return hs7Html(c, n9) + humanDivHtml(c, n10);
  const W = c.wellbeing, I = D.indicator, H = c.human;
  const base = {}; W.groups.forEach(g => base[g.k] = g.score);
  const gname = {}; W.groups.forEach(g => gname[g.k] = g.name);
  const E = c.futures.expect;
  const erows = []; Object.keys(base).forEach(g => WDIM.forEach(([k, l]) => { if (E.now[g][k] != null) erows.push("<tr><td>" + esc(gname[g]) + "</td><td>" + l + '</td><td class="mono">' + fmt(base[g][k]) + '</td><td class="mono">' + fmt(E.now[g][k]) + wdl(E.now[g][k], base[g][k]) + '</td>' + (c.futures.rec_same ? "" : '<td class="mono"><b>' + fmt(E.rec[g][k]) + "</b>" + wdl(E.rec[g][k], E.now[g][k]) + "</td>") + '<td class="mono" style="color:var(--conflict)">' + fmt(E.worst[g][k]) + "</td></tr>"); }));
  return '<section class="stp">' + stpH(n9, "Who is affected, and effects across four dimensions") +
    "<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Who</th><th>What is at stake</th></tr></thead><tbody>" + c.people.map(p => "<tr><td>" + esc(p.who) + "</td><td>" + esc(p.how) + "</td></tr>").join("") + "</tbody></table></div>" +
    "<h3 style=\"margin:6px 0 0\">Personal well-being index · 2026 baseline</h3><p class=\"note\">" + esc(I.unit) + " The four dimensions are not combined. " + esc(W.status) + ". Formulas and sources are on the <button type=\"button\" class=\"chip\" data-go=\"method\">Methodology tab</button>.</p>" +
    "<div class=\"wbt\"><table><thead><tr><th>Group</th>" + WDIM.map(([k, l]) => "<th>" + l + (k === "safety" ? "<span class=\"est\">includes judgment estimates</span>" : "") + "</th>").join("") + "</tr></thead><tbody>" +
    W.groups.map(g => '<tr><td class="g"><b>' + esc(g.name) + "</b><span>" + esc(g.size) + "</span></td>" + WDIM.map(([k]) => "<td>" + wbar(g.score[k]) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>" +
    "<details class=\"src\"><summary>Basis for judgment estimates and source data</summary><ul>" + W.groups.map(g => Object.values(g.why).map(t => "<li><b>" + esc(g.name) + "</b> · " + esc(t) + "</li>").join("")).join("") + "</ul>" +
    "<div class=\"tbl-wrap\" style=\"margin-top:8px\"><table class=\"tbl\"><thead><tr><th>Item</th><th>" + esc((W.cols || ["South Korea"])[0]) + "</th>" + ((W.cols || ["", "North Korea"])[1] ? "<th>" + esc((W.cols || ["", "North Korea"])[1]) + "</th>" : "") + "<th>Source</th></tr></thead><tbody>" + W.facts.map(f => "<tr><td>" + esc(f.k) + "</td><td>" + esc(f.ROK) + "</td>" + ((W.cols || ["", "North Korea"])[1] ? "<td>" + esc(f.PRK) + "</td>" : "") + '<td class="note">' + esc(f.src) + "</td></tr>").join("") + "</tbody></table></div></details>" +
    "<h3 style=\"margin:6px 0 0\">How the options affect people’s lives</h3><details class=\"src\"><summary>Show each option’s effects across the four dimensions</summary><div style=\"display:grid;gap:10px;margin-top:8px\">" + c.alts.map(a => '<div class="altc"><div class="hd"><span class="id">' + a.id + "</span><b>" + esc(a.name) + "</b></div><dl>" + WDIM.map(([k, l]) => "<dt>" + l + "</dt><dd>" + esc(a.eff[k]) + "</dd>").join("") + "</dl><p class=\"lose\">Who loses most · " + esc(a.loser) + "</p></div>").join("") + "</div></details>" +
    "<h3 style=\"margin:6px 0 0\">Expected values for 2030" + (c.futures.rec_same ? "" : ": the effect of the recommendation") + "</h3><div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:520px\"><thead><tr><th>Group</th><th>Dimension</th><th>2026</th><th>" + (c.futures.rec_same ? "Expected" : "Current trend") + "</th>" + (c.futures.rec_same ? "" : "<th>If the recommendation is followed</th>") + "<th>Worst-case future</th></tr></thead><tbody>" + erows.join("") + "</tbody></table></div>" +
    '<p class="note">' + esc(E.note) + (c.futures.rec_same ? " ▲▼ show change from 2026." : " In the current-trend column, ▲▼ show change from 2026; in the recommendation column, change from the current trend.") + "</p><div class=\"lesson-box\"><b>Interpretation</b>" + esc(E.read) + "</div></section>" +
    '<section class="stp">' + stpH(n10, "Where the Clisa Geopolitics assessment departs from the strategic actor’s ranking") + '<p class="note">' + esc(H.note) + '</p><div class="divs">' +
    H.items.map(x => '<article class="dv"><div class="hd"><span class="id">' + esc(x.alt) + "</span><b>" + esc((c.alts.find(a => a.id === x.alt) || {}).name || "") + "</b></div><dl><dt>By the strategic actor’s standard</dt><dd>" + esc(x.client) + "</dd><dt>Clisa Geopolitics assessment</dt><dd class=\"cl\">" + esc(x.clisa) + "</dd><dt>What the strategic actor pays</dt><dd>" + esc(x.cost) + "</dd><dt>Consequences for people</dt><dd>" + esc(x.gain) + "</dd></dl></article>").join("") + "</div></section>";
}
function humanDivHtml(c, n10){
  const H = c.human;
  return '<section class="stp">' + stpH(n10, "Where the Clisa Geopolitics assessment departs from the strategic actor’s ranking") + '<p class="note">' + esc(H.note) + '</p><div class="divs">' +
    H.items.map(x => '<article class="dv"><div class="hd"><span class="id">' + esc(x.alt) + "</span><b>" + esc((c.alts.find(a => a.id === x.alt) || {}).name || "") + "</b></div><dl><dt>By the strategic actor’s standard</dt><dd>" + esc(x.client) + "</dd><dt>Clisa Geopolitics assessment</dt><dd class=\"cl\">" + esc(x.clisa) + "</dd><dt>What the strategic actor pays</dt><dd>" + esc(x.cost) + "</dd><dt>Consequences for people</dt><dd>" + esc(x.gain) + "</dd></dl></article>").join("") + "</div></section>";
}
function prevHtml(c){
  const P = c.prev; if (!P || PUB()) return "";
  return '<details class="src"><summary>' + esc(P.label) + '</summary><div style="display:grid;gap:10px;margin-top:8px"><p class="note"></p><ol class="synth">' +
    P.conclusions.map(k => "<li><b>" + esc(k.id + " · " + k.t) + "</b><span>" + esc(k.why) + "</span></li>").join("") + '</ol><div class="verdict">' +
    P.verdict.excluded.map(x => "<div class=\"misread\"><b>Not put forward</b>" + esc(x) + "</div>").join("") + P.verdict.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + ". " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + "</div></div></details>";
}
/* v3.96i 사안 요약에 '사람들의 삶'을 꺼내 둔다: 분석 전문을 펼치지 않아도 집단별 100번의 미래와 그 집단의 자세한 내용으로 가는 단추가 보이게 */
function briefLife(c){
  const H = c.hs7; if (!H) return "";
  const gs = hsOrd(H, H.groups.filter(G => !G.fold)).filter(G => hsCount(H, G, "p").same < 100);
  return '<div class="bl-row">' + gs.map(G => { const n = hsCount(H, G, "p"); return '<button type="button" class="bi-life" data-hs="' + esc(c.id) + '" data-hsg="' + esc(G.k) + '">' + hsDots(n) + "<span><b>" + esc(G.name) + "</b><br>" + lifeNums(n) + "</span></button>"; }).join("") + "</div>" +
    '<div class="lh-act"><button type="button" class="chip" data-hs="' + esc(c.id) + "\">See the effects on lives →</button>" + "</div>";
}
function briefHtml(c){
  const B = c.brief || {};
  const top = c.futures.items.slice().sort((a, b) => b.p - a.p)[0];
  const W = (c.counter || [])[0];
  const fcs = D.forecasts.filter(f => fcIn(f, c) && f.status === "open").sort((a, b) => a.due.localeCompare(b.due));
  const fb = f => 'data-fut="' + esc(c.id) + ":" + esc(f.id) + '"';
  return '<section class="brief"><dl class="tw">' +
    (B.q ? "<dt>The question</dt><dd>" + esc(B.q) + "</dd>" : "") +
    (B.a ? "<dt>Assessment</dt><dd class=\"ba\">" + esc(B.a) + "</dd>" : "") +
    "<dt>Most likely scenario</dt><dd><button type=\"button\" class=\"futlink\" " + fb(top) + '><span class="mono" style="color:' + fcol(top.id) + '">' + top.id + "</span> " + esc(top.name) + ' <span class="mono">' + top.p + "%</span>" + (top.rng ? ' <span class="rng">(' + top.rng[0] + "~" + top.rng[1] + ")</span>" : "") + ' <span class="note">→</span></button>' +
      "<div class=\"pbar pmini\" role=\"group\" aria-label=\"Probability by scenario\">" + c.futures.items.map(f => '<button type="button" ' + fb(f) + ' style="flex:' + f.p + ' 0 0;background:' + fcol(f.id) + '" title="' + esc(f.id + " " + f.name + " " + f.p + "%") + '"' + (f.p < 15 ? ' class="sm"' : "") + ">" + f.id + "<span>" + f.p + "%</span></button>").join("") + "</div></dd>" +
    (W ? "<dt>The other side’s best move</dt><dd><b>" + esc(enShort(W.name)) + "</b> · " + esc(W.ranked[0].t) + "</dd>" : "") +
    (B.eq ? "<dt>The likely outcome</dt><dd>" + esc(B.eq) + "</dd>" : "") +
    (B.human ? "<dt>What it means for people</dt><dd>" + esc(B.human) + briefLife(c) + "</dd>" : "") +
    (fcs.length ? "<dt>Related forecasts <span class=\"note mono\">" + fcs.length + '</span></dt><dd><div class="chips" style="margin:0">' + fcs.map(f => fcBtn(f.id)).join("") + "</div><p class=\"note\" style=\"margin:4px 0 0\">Listed by nearest resolution date. Select one to see the question and its resolution date.</p></dd>" : "") +
    "</dl></section>";
}
function precHtml(c){
  const X = c.precedents;
  const head = '<section class="stp">' + stpH(1, "Review of past attempts") + "<p class=\"note\">This step first establishes the solutions tried in the past (the format, agenda and sequencing of negotiations, how agreements were implemented or collapsed, and why they succeeded or failed) and then tests later judgments against these precedents.</p>";
  if (!X) return head + "<p class=\"note\">The review of past attempts on this issue is in progress.</p></section>";
  const vc = v => v === "지지" || v === "부합" ? "ok" : v === "반박" || v === "상충" ? "no" : "fix";
  return head + (X.status && !PUB() ? '<p class="note"><span class="vd fix">' + esc(X.status) + "</span> Reviewed " + esc(enDate(X.asof || "")) + "</p>" : "") +
    '<div style="display:grid;gap:6px">' + X.items.map(p => '<details class="src prec"><summary><b>' + esc(p.name) + '</b> <span class="mono note">' + esc(p.period) + "</span></summary>" +
      "<dl class=\"tw\" style=\"margin-top:8px\"><dt>Format</dt><dd>" + esc(p.format) + "</dd><dt>Outcome</dt><dd>" + esc(p.outcome) + "</dd><dt>Why</dt><dd>" + esc(p.why) + "</dd><dt>How today differs</dt><dd>" + esc(p.differs) + "</dd><dt>Sources</dt><dd><ul>" + (p.sources || []).map(srcItem).join("") + "</ul></dd></dl></details>").join("") + "</div>" +
    '<h3 style="margin:10px 0 0">' + (PUB() ? "Judgments in light of precedent" : "Comparison with existing judgments") + '</h3><div class="divs">' +
      X.checks.map(k => '<article class="dv chk-' + vc(k.verdict) + '"><div class="hd"><span class="id">' + esc(k.claim) + '</span><span class="vd ' + vc(k.verdict) + '">' + esc(ev(k.verdict)) + '</span><span class="note mono">' + esc((k.precedents || []).join(", ")) + "</span></div><dl><dt>Reasoning</dt><dd>" + esc(k.reason) + "</dd>" + (k.proposed ? "<dt>Proposed revision</dt><dd class=\"cl\">" + esc(k.proposed) + "</dd>" : "") + "</dl></article>").join("") + "</div>" +
    (X.insight ? "<div class=\"lesson-box\"><b>What the precedents reveal</b>" + esc(X.insight) + "</div>" : "") +
    ((X.uncertain || []).length ? "<details class=\"src\"><summary>Unverified · " + X.uncertain.length + "</summary><ul>" + X.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") + "</section>";
}
function exitBlock(c){
  const x = exitCase(c.fp), E = D.exits; if (!x) return "";
  return '<details class="src" id="exc-' + esc(c.fp) + "\"><summary>How each side sees it, and the way out · each party’s perceptions and face-saving exits</summary><div class=\"exc-body\">" +
    '<ol class="qs">' + E.questions.map(q => "<li>" + esc(q) + "</li>").join("") + "</ol>" +
    '<div style="display:grid;gap:10px">' + x.parties.map(p =>
      '<div class="eye"><div class="hd"><b>' + esc(nm(p.iso)) + "</b><span class=\"aim\" title=\"Reading of aims\">" + esc(p.aim) + "</span></div><dl>" +
      "<div><dt>How it sees the other side</dt><dd>" + esc(p.reads) + "</dd></div>" +
      "<div><dt>What it fears most</dt><dd>" + esc(p.fear) + "</dd></div>" +
      "<div><dt>What it must tell its domestic audience in order to back down</dt><dd class=\"say\">“" + esc(p.say) + "”</dd></div>" +
      "</dl><p class=\"note\">Reading of aims · " + esc(p.aim_note) + "</p></div>").join("") + "</div>" +
    "<div class=\"misread\"><b>Most dangerous misreading</b>" + esc(x.misread) + "</div>" +
    "<section class=\"sec\"><h3>Face-saving exits</h3>" + x.exits.map(e =>
      '<div class="exit"><h5>' + esc(e.title) + "</h5><ul>" + Object.entries(e.claims).map(([k, v]) => "<li><b>" + esc(nm(k)) + "</b> “" + esc(v) + "”</li>").join("") + "</ul><p class=\"pre\"><b>Precedent</b> · " + esc(e.precedent) + "</p><p class=\"obs\"><b>Obstacle</b> · " + esc(e.obstacle) + "</p></div>").join("") + "</section>" +
    "<section class=\"sec\"><h3>Signals to watch</h3><ul class=\"watch\">" + x.signals.map(v => "<li>" + esc(v) + "</li>").join("") + "</ul></section>" +
    "<p class=\"note\">These perceptions and exits are analytical judgments, not the official positions of the governments concerned.</p></div></details>";
}
/* v3.35 다가오는 검증 시점(2026-10-01): 첫 화면에 검증 시점이 가까운 열린 전망을 남은 날수와 함께 보이고, 30일 안의 것은 맨 위 띠에도 돌린다 */
function daysLeft(due){ const t = new Date(); const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(due || ""); if (!m) return null; return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - a) / 864e5); }
function daysText(n){ return n == null ? "" : n > 0 ? pl(n, "day") + " left" : n === 0 ? "Resolves today" : "Awaiting resolution"; }
function dueSoon(days){ return D.forecasts.filter(f => f.status === "open" && daysLeft(f.due) != null && daysLeft(f.due) <= days).sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p); }
/* v3.36 다가오는 일정(2026-10-01): 전망의 검증 시점과 예정된 사건(D.events)을 날짜순으로 섞는다. 달만 정해진 사건(YYYY-MM)은 '11월 중'으로 적고 남은 날수는 적지 않는다 */
function evKey(e){ return e.date.length === 7 ? e.date + "-32" : e.date; }
function evDays(e){ if (e.date.length === 7) return ""; const n0 = daysLeft(e.date), n1 = daysLeft(e.end || e.date); return n0 > 0 ? pl(n0, "day") + " left" : n1 >= 0 ? (n0 === 0 ? "Today" : "Under way") : ""; }
function evDate(e){ if (e.date.length === 7) return "Sometime in " + EN_MON[+e.date.slice(5, 7) - 1]; const a = fmtKD(e.date); if (!e.end) return a; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(e.end); return m && e.end.slice(0, 7) === e.date.slice(0, 7) ? a + "–" + (+m[3]) : a + " – " + fmtKD(e.end); }
function evSoon(days){ return (D.events || []).filter(e => { const k = evKey(e); const n = daysLeft(e.date.length === 7 ? e.date + "-01" : e.date); return n != null && n <= days && (e.date.length === 7 ? daysLeft(e.date + "-28") >= 0 : (e.end ? daysLeft(e.end) : n) >= 0); }); }
function agenda(days){
  const L = dueSoon(days).map(f => ({k: f.due, f})).concat(evSoon(days).map(e => ({k: evKey(e), e})));
  return L.sort((a, b) => a.k.localeCompare(b.k));
}
function dueHtml(){
  /* 나안(2026-10-01 결재): 달별로 묶고 한 줄에 날짜·제목·남은 날수만 둔다. 같은 날의 전망은 한 줄에 모은다 */
  const L = agenda(120); if (!L.length) return "";
  const dayOf = x => x.e ? (x.e.date.length === 7 ? "TBD" : (+x.e.date.slice(8, 10)) + (x.e.end && x.e.end.slice(0, 7) === x.e.date.slice(0, 7) ? "–" + (+x.e.end.slice(8, 10)) : "")) : String(+x.f.due.slice(8, 10));
  const months = [];
  for (const x of L) {
    const mk = x.k.slice(0, 7); let M = months.find(m => m.mk === mk); if (!M) { M = {mk, rows: []}; months.push(M); }
    if (x.f) { const key = "f" + x.f.due; let R = M.rows.find(r => r.key === key); if (!R) { R = {key, k: x.k, day: dayOf(x), fs: [], n: daysLeft(x.f.due)}; M.rows.push(R); } R.fs.push(x.f); }
    else M.rows.push({key: x.e.id, k: x.k, day: dayOf(x), e: x.e, n: x.e.date.length === 7 ? null : daysLeft(x.e.date), dt: evDays(x.e)});
  }
  const row = r => '<li id="due-' + esc(r.key) + '"><span class="d">' + esc(r.day) + '</span><span class="t">' + (r.fs ? "<span class=\"evk\">Forecast</span>" + r.fs.slice(0, 3).map(f => '<button type="button" class="fcl" data-fc="' + esc(f.id) + '" title="' + esc(f.q) + '">' + fcLab(f, f.id, f.p) + PIN + "</button>").join('<span class="sep">·</span>') + (r.fs.length > 3 ? "<span class=\"sep\">·</span><button type=\"button\" class=\"fcl more\" data-go=\"forecast\">+" + (r.fs.length - 3) + " more</button>" : "")
    : '<button type="button" class="fcl" data-ev="' + esc(r.e.id) + '">' + esc(r.e.t) + PIN + "</button>") + "</span>" +  /* v3.79 일정을 누르면 설명과 지구본의 장소(사안 화면으로 넘어가지 않음) */
    (r.fs ? '<span class="n' + (r.n <= 7 ? " hot" : "") + '">' + daysText(r.n) + "</span>" : r.dt ? '<span class="n' + (r.n != null && r.n <= 7 ? " hot" : "") + '">' + r.dt + "</span>" : "") + "</li>";
  return "<section class=\"sec due\" id=\"due\"><h3>Upcoming events</h3><div class=\"mo\">" + months.map(M => '<div class="m">' + EN_MON[+M.mk.slice(5, 7) - 1] + "</div><ul>" + M.rows.map(row).join("") + "</ul>").join("") +
    "</div><p class=\"note\" style=\"margin-top:8px\"><button type=\"button\" class=\"chip\" data-go=\"forecast\">All forecasts →</button></p></section>";
}
function upcomingHtml(){
  const up = D.forecasts.filter(f => f.status === "open").slice().sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p).slice(0, 3);
  return up.length ? "<section class=\"sec\"><h3>Upcoming resolutions</h3><ul class=\"list\">" + up.map(f => forecastRow(f, true)).join("") + "</ul><p class=\"note\" style=\"margin-top:8px\"><button type=\"button\" class=\"chip\" data-go=\"forecast\">All forecasts</button></p></section>" : "";
}
/* v3.43 사안별 분석: 사안 전부를 한 화면에 차례로 펼친다. 사안 단추는 해당 사안으로 스크롤하고, 읽는 위치에 따라 단추 강조와 주소(/case/사안/)가 바뀐다.
   분석 전문(details.full)은 처음 펼칠 때 그린다. 전문이 사안 분량의 약 9할이어서, 모든 사안을 펼쳐도 처음 그리는 양은 예전 한 사안보다 적다 */
let STRAT_D = null;
/* v4.29 둘째 전략 주체(2026-10-23): 한 사안에 전략 주체가 둘이면 둘째 주체의 4·5·7~11단계를 따로 펼친다 */
function s2Html(c){
  const X = c.s2; if (!X) return "";
  const nmS = X.client.name, G = X.client.goals, AUX = X.aux || [];
  const stH = (n, t) => '<div class="stp-h"><i>' + n + "</i><b>" + esc(t) + '</b><span class="s2tag">' + esc(nmS) + "</span></div>";
  const step = (n, t, body) => '<section class="stp">' + stH(n, t) + body + "</section>";
  const sc = s => typeof s === "string" ? '<span class="sc sz">' + esc(s) + "</span>" : '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  const A = id => X.alts.find(a => a.id === id) || {};
  const code = id => '<span class="s2c">' + esc(id) + "</span>";
  const altCard = a => '<li><div class="s2a-h">' + code(a.id) + "<b>" + esc(a.name) + "</b></div><p>" + esc(a.desc) + "</p></li>";
  const main = X.alts.filter(a => !AUX.includes(a.id)), aux = X.alts.filter(a => AUX.includes(a.id));
  const evCard = r => '<li class="s2e"><div class="s2e-h">' + code(r.id) + "<b>" + esc(A(r.id).name) + "</b><span class=\"s2e-t\">Reversibility: " + esc(r.rev) + " · Escalation risk: " + esc(r.esc) + " · Feasibility: " + esc(r.feas) + '</span></div><div class="s2e-g">' + r.s.map((v, k) => '<span><em>' + esc(G[k].s || G[k].id) + "</em>" + sc(v) + "</span>").join("") + "</div><p>" + esc(r.why) + "</p></li>";
  const evMain = X.eval.rows.filter(r => !AUX.includes(r.id)), evAux = X.eval.rows.filter(r => AUX.includes(r.id));
  const F = (c.futures || {}).items || [], rec = X.rec;
  const dlt = f => { const d = rec.p[f.id] - f.p; return d === 0 ? "<span class=\"s2d z\">No change</span>" : '<span class="s2d ' + (d > 0 ? "up" : "dn") + '">' + (d > 0 ? "+" : "−") + Math.abs(d) + "%p</span>"; };
  const R1 = X.ranked[0];
  return "<section class=\"s2box\"><div class=\"s2h\"><p class=\"eyebrow\">Strategic actor 2</p><h3>" + esc(nmS) + "</h3><p>" + "This issue has two strategic actors. Steps 2–11 above are assessed against the objectives of the " + esc(c.client.name) + "; the steps below, built on the same situation assessment (steps 1–6), are assessed against the objectives of the " + esc(nmS) + ".</p><div class=\"s2sum\"><span><em>Objectives</em>" + G.length + "</span><span><em>Options</em>" + X.alts.length + "</span><span><em>Top option</em>" + esc(R1.name) + "</span></div></div>" +
    step(4, "Full review of options", '<p class="note">' + esc(X.deciders) + "</p><h4 class=\"s2sub\">Courses of action · choose one</h4><ul class=\"s2alts\">" + main.map(altCard).join("") + "</ul><h4 class=\"s2sub\">Supporting measures</h4><ul class=\"s2alts\">" + aux.map(altCard).join("") + "</ul>") +
    step(5, "Response of the most capable adversary (" + (X.foe || "adversary") + ")", '<dl class="s2resp">' + X.responses.map(r => "<dt>" + code(r[0]) + esc(A(r[0]).name) + "</dt><dd>" + esc(r[1]) + "</dd>").join("") + "</dl>") +
    step(7, "Strategic actor and objectives", "<p><b>" + esc(nmS) + "</b> · Priority order: <span class=\"mono\">" + esc(X.client.order) + '</span></p><ul class="list goals">' + G.map(g => '<li class="rv"><span><b class="mono" style="color:var(--accent)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + "<br><span class=\"note\">Source · " + esc(g.src) + "</span></p></li>").join("") + '</ul><p class="note">' + esc(X.client.note) + "</p>") +
    step(8, "Evaluating options against objectives", '<p class="note">' + esc(X.eval.base) + '</p><ul class="s2ev">' + evMain.map(evCard).join("") + "</ul><h4 class=\"s2sub\">Supporting measures</h4><ul class=\"s2ev\">" + evAux.map(evCard).join("") + "</ul>") +
    step(9, "Ranking by the strategic actor’s standard", '<p class="note">' + esc(X.rule) + "</p><div class=\"s2r1\"><p class=\"s2r1-k\">Top option</p><h4>" + esc(R1.name) + '</h4><p class="s2path">' + esc(R1.id) + "</p><p>" + esc(R1.t) + '</p></div><ol class="s2rk" start="2">' + X.ranked.slice(1).map(r => "<li><div><b>" + esc(r.name) + "</b>" + code(r.id) + "</div><p>" + esc(r.t) + "</p></li>").join("") + "</ol>" +
      "<div class=\"s2p\"><p class=\"s2p-h\">Scenario probabilities if this course is followed</p><table><thead><tr><th>Scenario</th><th>Now</th><th>Under the top option</th><th></th></tr></thead><tbody>" + F.map(f => "<tr><td>" + esc(f.name) + '</td><td class="mono">' + f.p + '%</td><td class="mono">' + rec.p[f.id] + "% <small>(" + rec.rng[f.id][0] + (rec.rng[f.id][1] !== rec.rng[f.id][0] ? "~" + rec.rng[f.id][1] : "") + ")</small></td><td>" + dlt(f) + "</td></tr>").join("") + '</tbody></table><p class="note">' + esc(rec.basis) + "</p></div>" +
      "<details class=\"src\"><summary>Precedent check · " + X.prec.length + "</summary><ul>" + X.prec.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></details>") +
    step(10, "Who is affected", '<dl class="s2ppl">' + X.people.map(r => "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>").join("") + "</dl>") +
    step(11, "Where the Clisa Geopolitics assessment differs", '<p class="note">' + esc(X.diff.note) + "</p><div class=\"tbl-wrap\"><table class=\"tbl s2df\"><thead><tr><th>Option</th><th>" + esc(nmS) + " ranking</th><th>People-centered</th><th>Why</th></tr></thead><tbody>" + X.diff.rows.map(r => '<tr' + (r[1] !== r[2] ? ' class="ne"' : "") + "><td><b>" + esc(r[0]) + '</b></td><td class="mono">' + r[1] + "</td><td class=\"mono\">" + r[2] + "</td><td>" + esc(r[3]) + "</td></tr>").join("") + "</tbody></table></div><div class=\"lesson-box\"><b>What is paid and what is gained</b>" + esc(X.diff.pay) + "</div><div class=\"lesson-box\"><b>Do the two strategic actors’ choices fit together?</b>" + esc(X.fit) + "</div>") +
    (X.pred || X.falsify ? step(12, "Forecasts and disconfirming signals", '<ul class="list">' + (X.pred || []).map(id => D.forecasts.find(f => f.id === id)).filter(Boolean).map(g => '<li><div class="fc"><div class="q">' + esc(g.q) + '</div><div class="p">' + g.p + "<small>%</small></div><div class=\"foot\"><span>Resolution date <span class=\"mono\">" + esc(enDate(g.due)) + "</span></span><span>" + esc(g.s) + "</span></div></div></li>").join("") + "</ul><h3 style=\"margin:10px 0 6px\">What would prompt a reassessment</h3><ul class=\"watch\">" + (X.falsify || []).map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>") : "") +
    (X.pub ? step(13, "Cross-check against public opinion and Congress", X.pub.map(x => "<p>" + esc(x) + "</p>").join("")) : "") +
    "</section>";
}
function caseFullHtml(c){
  const step = (n, t, body) => '<section class="stp">' + stpH(n, t) + body + "</section>";
  const layer = (L, q) => '<div class="lyr l' + L + '"><b>' + LNAME[L] + "</b><span>" + esc(q) + "</span></div>";
  const T = D.philosophy.tree.layers || [];
  const lq = id => (T.find(x => x.id === id) || {}).q || "";
  const cl = c.client;
  const an = FP_AN[c.fp] ? D.history.analogies.find(x => x.id === FP_AN[c.fp]) : null;
  const pf = D.forecasts.filter(f => fcIn(f, c)).map(f => f.id);
  return concHtml(c) +
      layer("1", lq("1")) +
      precHtml(c) +
      step(2, "Establishing the facts", '<ul class="facts">' + c.facts.map(f => "<li>" + esc(f) + "</li>").join("") + "</ul>" +
        (c.law ? '<div class="lesson-box"><b>' + esc(c.law.title) + '</b><ul class="facts" style="margin-top:6px">' + c.law.points.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul><p style="margin-top:8px;color:var(--ink)">' + esc(c.law.result) + "</p></div>" : "") +
        (an ? "<details class=\"src\"><summary>Similar historical precedents · " + esc(an.now) + "</summary>" + analogHtml(an, true) + "</details>" : "")) +
      decHtml(c, 3) + exitBlock(c) +
      step(4, "Full review of options", "<p class=\"note\">Includes every option the strategic actor is actually weighing. None is excluded on moral grounds." + (PUB() || c.id !== "korea" ? "" : "") + '</p><ul class="list">' + c.alts.map(a => '<li class="rv"><span><b style="font-family:var(--mono);color:var(--accent)">' + a.id + "</b> <b>" + esc(a.name) + "</b></span><p>" + esc(a.desc) + "</p></li>").join("") + "</ul>") +
      step(5, "Response of the most capable adversary", '<p class="note">' + esc(c.responses.note) + "</p><div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:640px\"><thead><tr><th>Option</th>" + (c.responses.cols || ["CHN","PRK","JPN","RUS","USA"]).map(k => "<th>" + esc(nm(k)) + "</th>").join("") + "</tr></thead><tbody>" + c.responses.rows.map(r => '<tr><td class="mono">' + esc(r.alt) + "</td>" + (c.responses.cols || ["CHN","PRK","JPN","RUS","USA"]).map(k => "<td>" + esc(r[k] || "") + "</td>").join("") + "</tr>").join("") + "</tbody></table></div><div class=\"lesson-box\"><b>What changes when the most capable adversary is assumed</b>" + esc(c.responses.lesson) + "</div>") +
      futHtml(c, 6) +
      layer("2", lq("2")) +
      step(7, "Strategic actor and objectives", "<p><b>" + esc(cl.name) + "</b> · Priority order: <span class=\"mono\">" + esc(cl.order) + '</span></p><ul class="list goals">' + cl.goals.map(g => '<li class="rv"><span><b class="mono" style="color:var(--accent)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + "<br><span class=\"note\">Source · " + esc(g.src) + "</span></p></li>").join("") + '</ul><p class="note">' + esc(cl.note) + "</p>") +
      step(8, "Evaluating options against objectives", evalHtml(c)) +
      step(9, "Ranking by the strategic actor’s standard", '<div class="verdict">' + c.rank2.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + ". " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") +
        "<div class=\"lesson-box\"><b>Tensions within the combination</b>" + esc(c.rank2.tension) + "</div><div class=\"lesson-box\"><b>Left for the strategic actor to decide</b>" + esc(c.rank2.undecided) + "</div></div>") + swapHtml(c) + counterHtml(c) + twowayHtml(c) +
      layer("3", lq("3")) +
      humanHtml(c, 10, 11) +
      s2Html(c) +
      layer("V", lq("V")) +
      step(12, "Forecasts and disconfirming signals", '<ul class="list">' + c.predictions.map(p => '<li><div class="fc"><div class="q">' + esc(p.q) + '</div><div class="p">' + p.p + "<small>%</small></div><div class=\"foot\"><span>Resolution date <span class=\"mono\">" + esc(enDate(p.due)) + "</span></span><span>" + esc(p.note) + "</span></div></div></li>").join("") + "</ul><p class=\"note\" style=\"margin-top:6px\">All related forecasts for this issue (" + pf.join(", ") + ") are on the Forecasts and Track Record tab. <button type=\"button\" class=\"chip\" data-go=\"forecast\">View Forecasts and Track Record</button></p><h3 style=\"margin:10px 0 6px\">What would prompt a reassessment</h3><ul class=\"watch\">" + c.falsify.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>") +
      (PUB() || !c.changed ? "" : '<section class="sec"><h3></h3><ul class="list">' + c.changed.map(x => '<li class="rv"><p style="color:var(--ink)">' + esc(x) + "</p></li>").join("") + "</ul></section>") +
      prevHtml(c) +
      "<details class=\"src\"><summary>Sources · " + c.sources.length + "</summary><ul>" + c.sources.map(srcItem).join("") + "</ul></details>";
}
/* v3.52 사안의 결정권자: 전략 주체의 결정권자와 사안에서 분석한 주요국 결정권자를 모두 칩으로(2026-10-05 결재) */
function caseLeaders(c){
  const L = LLK(), me = c.subject || (c.id === "ukraine" ? "UKR" : "KOR");
  const xs = [...new Set([me].concat(((c.deciders || {}).items || []).map(d => d.iso)))].filter(i => L[i]);
  return xs.length ? "<div class=\"chips cl-ld\" style=\"margin:8px 0 0\"><span class=\"note\">Decision-makers</span>" + xs.map(i => '<a class="chip" href="' + lurl(i) + '">' + esc(L[i].name) + (i === me || (c.s2 && i === c.s2.subject) ? " <span class=\"note\">strategic actor</span>" : "") + "</a>").join("") + "</div>" + casePower(c) : casePower(c);
}
/* v3.53 사안 머리의 권력 구조 칩: 전략 주체와 결정권을 가진 나라 가운데 권력 구조 쪽이 있는 나라 */
function casePower(c){
  const P = PLK(), me = c.subject || (c.id === "ukraine" ? "UKR" : "KOR");
  const xs = [...new Set([me].concat(((c.deciders || {}).items || []).map(d => d.iso)))].filter(i => P[i]);
  return xs.length ? "<div class=\"chips cl-ld\" style=\"margin:6px 0 0\"><span class=\"note\">Power structures</span>" + xs.map(i => '<a class="chip" href="/en/power/#' + i + '">' + esc(P[i].name) + "</a>").join("") + "</div>" : "";
}
function caseArt(c, i){
  const cl = c.client;
  return '<article class="sec case-a" id="case-' + esc(c.id) + '" data-cid="' + esc(c.id) + "\" style=\"display:grid;gap:22px\"><div><p class=\"eyebrow\">Issue " + (i + 1) + " · Strategic actor: " + esc(cl ? cl.name : c.recipient) + (c.s2 ? " · " + esc(c.s2.client.name) : "") + " · As of " + esc(enDate(c.asof)) + '</p><h2 style="margin-top:4px;font-size:20px">' + esc(c.title) + " " + ttsBtn("case:" + c.id) + "</h2>" + (c.status ? '<p class="meta" style="margin-top:4px">' + esc(c.status) + "</p>" : "") + caseLeaders(c) + (FEATS().some(F => F.case === c.id) ? '<div class="chips" style="margin:8px 0 0">' + FEATS().filter(F => F.case === c.id).map(featBtn).join("") + "</div>" : "") + "</div>" +
    briefHtml(c) + theoryHtml(c) + publicsHtml(c) +
    '<details class="full" data-cid="' + esc(c.id) + "\"><summary>Full analysis · from situation assessment to verification</summary><div class=\"full-body\"></div></details>" +
    "<div class=\"chips\" style=\"margin:0\"><button type=\"button\" class=\"chip\" data-go=\"method\">View Methodology</button><button type=\"button\" class=\"chip\" data-fp=\"" + esc(c.fp) + "\">View on map · " + esc((D.flashpoints.find(f => f.id === c.fp) || {}).name_ko || "") + "</button></div>" + caseFbHtml(c) + "</article>";
}
/* 사안의 분석 전문을 채운다(이미 채웠으면 그대로). 검색·띠·출구 단추가 전문 속 위치로 갈 때 먼저 부른다 */
function caseFill(id){
  const d = document.querySelector('#pane-strat details.full[data-cid="' + id + '"]'), c = (D.strategies || []).find(x => x.id === id);
  if (d && c && !d.dataset.on) { d.dataset.on = "1"; d.querySelector(".full-body").innerHTML = caseFullHtml(c); }
  return d;
}
document.addEventListener("toggle", e => { const d = e.target; if (d.open && d.matches && d.matches("details.full[data-cid]")) caseFill(d.dataset.cid); }, true);
function caseMark(){ caseMark0(); if (S.scase) caseView(S.scase); }
function caseMark0(){ document.querySelectorAll("#pane-strat .case-sw [data-case]").forEach(b => { if (b.dataset.case === S.scase) { b.setAttribute("aria-current", "true"); const nv = b.parentElement; if (nv.scrollWidth > nv.clientWidth) { const br = b.getBoundingClientRect(), nr = nv.getBoundingClientRect(); nv.scrollLeft += br.left - nr.left - (nr.width - br.width) / 2; } } else b.removeAttribute("aria-current"); }); }
function renderStrat(){
  const ss = D.strategies || []; if (!ss.length) return;
  const pn = $("#pane-strat");
  if (STRAT_D === D && pn.querySelector(".case-a")) { caseMark(); return; }
  STRAT_D = D;
  pn.innerHTML =
    "<div class=\"sec\"><h2>Strategic Analysis</h2><p class=\"lead\" style=\"margin-top:8px\">Each issue is analyzed from the strategic actor’s point of view. The analysis has four parts: situation assessment (Ⅰ), strategy evaluation (Ⅱ), what it means for people (Ⅲ), and verification (Ⅳ).</p></div>" +
    insightsHtml() + upcomingHtml() + leadersRow() +
    "<h3 id=\"s-case\" style=\"margin:6px 0 0\">Analysis by issue <span class=\"note\" style=\"font-weight:400\">· " + pl(ss.length, "issue") + "</span></h3>" +
    (ss.length > 1 ? "<nav class=\"case-sw\" aria-label=\"Jump to an issue\">" + ss.map(k => '<button type="button" data-case="' + esc(k.id) + '">' + esc(k.title.split(":")[0]) + "</button>").join("") + "</nav>" : "") +
    ss.map(caseArt).join("");
  caseMark();
}
/* 사안으로 이동: 사안 단추, 주소(/case/사안/), 이전 화면에서 쓴다 */
function goCase(id, smooth){
  S.scase = id; renderStrat(); if (S.tab !== "strat") switchTab("strat");
  else if (!ROUTES && HASH_READY) { try { history.replaceState(null, "", "#" + id); } catch(e){} }
  const a = document.getElementById("case-" + id); if (!a) return;
  const pn = document.getElementById("pane-strat"); pn.classList.add("cv-off"); clearTimeout(pn._cv); pn._cv = setTimeout(() => cvRestore(pn), 2500);
  a.scrollIntoView({block: "start", behavior: smooth && !reduceMotion ? "smooth" : "auto"});
  caseMark();
}
/* 읽는 위치 따라가기: 스크롤이 멎으면 화면 위쪽에 걸린 사안을 현재 사안으로 삼고, 단추를 강조하고, 주소를 바꾼다(기록은 쌓지 않음) */
function caseSpy(){
  if (S.tab !== "strat" || !D) return;
  const arts = document.querySelectorAll("#pane-strat .case-a"); if (!arts.length) return;
  const r = document.getElementById("pane-strat").getBoundingClientRect(), lim = narrow() ? innerHeight * 0.45 : r.top + Math.min(r.height, innerHeight) * 0.45;
  let cur = null; arts.forEach(a => { if (a.getBoundingClientRect().top <= lim) cur = a.dataset.cid; });
  if (cur === S.scase) return;
  S.scase = cur; caseMark();
  if (ROUTES) routeSync(true); else if (HASH_READY) { try { history.replaceState(null, "", "#" + (cur || "strat")); } catch(e){} }
}
(function(){ let tm = null; const on = () => { clearTimeout(tm); tm = setTimeout(caseSpy, 120); };
  addEventListener("scroll", on, {passive: true}); document.getElementById("pane-strat").addEventListener("scroll", on, {passive: true}); })();
/* v3.41 신호 전망: 갈래 쪽(+)이나 반대쪽(-)으로 기울게 하는 기존 전망 */
function fcBtn(id){ const F = D.forecasts.find(x => x.id === id); return '<button type="button" class="fcchip" data-fc="' + esc(id) + '" title="' + esc(F ? F.q : "") + '">' + fcLab(F, id, F ? F.p : null) + "</button>"; }
function sigHtml(f){
  const sg = f.sig || [], up = sg.filter(g => g.dir === "+"), dn = sg.filter(g => g.dir === "-");
  if (!sg.length) return "";
  return "<p style=\"font-size:12px\"><b>Signal forecasts</b> · " + (up.length ? "Toward this scenario: " + up.map(g => fcBtn(g.id)).join(" ") : "") + (dn.length ? (up.length ? " · " : "") + "Away from it: " + dn.map(g => fcBtn(g.id)).join(" ") : "") + "</p>";
}
function fcByBranch(c, fs){
  const byId = id => fs.find(f => f.id === id), used = new Set(), sub = (t, ids) => { const xs = ids.map(byId).filter(Boolean); xs.forEach(f => used.add(f.id)); return xs.length ? '<p class="note" style="margin:10px 0 4px">' + t + '</p><ul class="list">' + xs.map(f => forecastRow(f, false)).join("") + "</ul>" : ""; };
  const its = c.futures.items.slice().sort((a, b) => b.p - a.p);
  let h = its.map(it => '<div class="fbr" style="border-top:1px solid var(--line);padding-top:10px;margin-top:14px"><h4 style="margin:0"><span class="mono" style="color:' + fcol(it.id) + '">' + esc(it.id) + "</span> " + esc(it.name) + ' <span class="mono">' + it.p + "%</span>" + (it.rng ? ' <span class="rng">(' + it.rng[0] + "~" + it.rng[1] + ")</span>" : "") + "</h4><p class=\"note\" style=\"margin:2px 0 0\">Resolution criteria · " + esc(it.test) + "</p>" +
    sub("Forecasts tied to the resolution criteria", it.fc ? [it.fc] : []) + sub("Forecasts that tilt toward this scenario", (it.sig || []).filter(g => g.dir === "+").map(g => g.id)) + sub("Forecasts that tilt away from it", (it.sig || []).filter(g => g.dir === "-").map(g => g.id)) +
    (!it.fc && !(it.sig || []).length ? "<p class=\"note\" style=\"margin:6px 0 0\">No forecasts are linked to this scenario yet. It will be checked against its resolution criteria at the end of 2030.</p>" : "") + "</div>").join("");
  const cf = f => fcIn(f, c), expo = (D.fc_expo || []).map(byId).filter(f => f && cf(f) && !used.has(f.id));
  h += expo.length ? "<div style=\"border-top:1px solid var(--line);padding-top:10px;margin-top:14px\"><h4 style=\"margin:0\">South Korea’s exposure and the recommendations</h4><p class=\"note\" style=\"margin:2px 0 0\">These forecasts ask not which scenario will materialize but what price South Korea pays and whether the recommendations are carried out.</p><ul class=\"list\">" + expo.map(f => { used.add(f.id); return forecastRow(f, false); }).join("") + "</ul></div>" : "";
  const rest = fs.filter(f => cf(f) && !used.has(f.id));
  h += rest.length ? "<div style=\"border-top:1px solid var(--line);padding-top:10px;margin-top:14px\"><h4 style=\"margin:0\">Other forecasts on this issue</h4><ul class=\"list\">" + rest.map(f => forecastRow(f, false)).join("") + "</ul></div>" : "";
  return h;
}
/* v4.22 전망별 화면(/forecast/f02/)과 판가름 목록(2026-10-20 결재). 일자별 확률은 공개판 fc_hist(그날 공개판에 실렸던 값 그대로).
   화면 문구는 모두 FCT에 둔다(영문판은 en/patch_app.py가 FCT 구역을 en/fct_en.js로 통째로 바꾼다) */
/* v4.22 forecast pages and resolution lists: English strings (replaces the Korean FCT block; en/patch_app.py) */
const FCT = {
  yd: ["Remote chance", "Highly unlikely", "Unlikely", "Realistic possibility", "Likely", "Highly likely", "Almost certain"], ydNote: "The likelihood terms next to each forecast probability follow the wording used in UK government intelligence assessments. The UK leaves deliberate gaps between terms (for example, 5–10%), while Clisa assigns a term to every probability.",
  md: s => enDate(s, true), ymd: s => enDate(s), ym: s => EN_MON[+s.slice(5, 7) - 1].slice(0, 3) + " " + s.slice(0, 4),
  tk: s => EN_MON[+s.slice(5, 7) - 1].slice(0, 3) + " " + (+s.slice(8, 10)), left: n => pl(n, "day") + " left", late: n => "Past due", dd: n => pl(n, "day"), cnt: n => pl(n, "forecast"), more: n => "Show " + n + " more",
  today: "Today", checking: "Result pending", firstRes: "First result", acc: "Accuracy (Brier score)", detail: "Details →", copied: "Copied", title: s => s + " · Forecast",
  late_h: "Forecasts awaiting their result", s30: "Resolving within 30 days", s30none: "No forecast reaches its resolution date in the next 30 days.", s90: "Resolving within 90 days",
  due: d => "Resolves " + d, etc: "Other conflicts", back: "← All forecasts", eyebrow: (id, c) => "Forecast " + id + " · " + c,
  pNow: "Current probability", pThen: "Probability at the time", caseGo: c => c + " analysis →", dueAt: "Resolution date", made: "Made", madeV: (d, p) => d + " · started at " + p + "%", rs: "Resolves on",
  resH: "Result", resD: d => " · confirmed " + d, voidL: "Voided", yes: "Resolved yes", no: "Resolved no", resSub: (p, b) => "Probability at the time " + p + "% · Brier score " + b,
  chartH: "Probability over time", span: "Period", w30: "Last 30 days", wAll: "All time", aria: s => s + ": probability over time", ev: "Events",
  revT: (d, x) => d + " weekly review · " + x, keep: p => p + "%, unchanged", chg: (a, b) => a + "% → " + b + "%",
  legF: "Weekly review that changed it", legO: "Weekly review that kept it", legU: "Briefing · raises the probability", legD: "Briefing · lowers the probability",
  chartNote: "Probabilities are revisited every Monday in the weekly forecast review. Each value in the chart is the probability as published that day.", futNote: " The dotted line shows the time left until the resolution date.",
  whyH: "Why it changed or held", week: "Weekly forecast review", first: p => "Started at " + p + "%", firstD: "Forecast made",
  evH: "Related events", evNote: "Events the daily briefing linked to this forecast. The arrows show whether an event makes the outcome more or less likely.", evGo: "That day's briefing →",
  E: {up: ["↑", "Factors raising the probability"], down: ["↓", "Factors lowering the probability"], none: ["–", "No change"]},
  fzH: "Probability used for scoring", fzV: (d, p, k) => p + "%, as it stood on " + d + " (changes in the final " + (k === 1 ? "day do" : ["zero", "one", "two", "three", "four", "five", "six", "seven"][k] + " days do") + " not count toward the score)",
  ocNoteF: (d, p, fd) => "Resolves " + d + ". Because changes in the final days do not count, those days are scored at the " + p + "% probability that stood on " + fd + "; on that basis, the scores for each outcome are shown below. Closer to 0 is better.",
  ocH: "When the result comes in", ocNote: (d, p) => "Resolves " + d + ". If the current " + p + "% holds until then, the forecast would score as shown below for each outcome (the average of its daily Brier scores). Closer to 0 is better.",
  ocY: "If it happens", ocN: "If it does not",
  yLow: p => "At " + p + "%, it was judged unlikely, so it would join the missed forecasts.", yHigh: p => "At " + p + "%, it was judged likely, so the forecast would hold up.",
  nLow: p => "At " + p + "%, it was judged unlikely, so the forecast would hold up.", nHigh: p => "At " + p + "%, it was judged likely, so it would join the missed forecasts.",
  ocFirst: (p, a, b) => "Scores had it stayed at its starting " + p + "%: " + a + " if it happens, " + b + " if it does not",
  sibH: "Other forecasts on this issue", shareH: "Share", shareX: "Share on X", copy: "Copy link", sub: "Subscribe to Updates",
  calH: "What resolves when", calNote: "Each dot is one forecast. Darker dots are forecasts judged more likely; click one to open it.",
  calM: (y, m, first) => EN_MON[m - 1].slice(0, 3) + (first || m === 1 ? " " + y : ""), calRest: (y, m0) => (m0 === 7 ? "H2 " : EN_MON[m0 - 1].slice(0, 3) + "–Dec ") + y, calY: y => String(y),
  legP: "Probability", legB: ["20% or less", "21–40%", "41–60%", "61–80%", "81% or more"],
  hDays: (done, n) => (n === 1 ? "day" : "days") + (done ? " to the next result" : " to the first result"), hToday: "Resolves today", hK: (d, c) => "Resolves " + d + " · " + c, hNote: "When the result is in, this card will show whether the forecast was right.", hStart: d => "Started " + d,
  stOpen: "open", stChg: "revised", stDone: "resolved", stVoid: "voided",
  rel: n => pl(n, "related event"), later: n => pl(n, "later forecast") + " · see the full list ↓",
  accH: "How accuracy is calculated", accP: d => "For each resolved forecast, take (probability − outcome)² using the probability on each day from publication to the resolution date (or to the day the event occurs, if it comes true sooner), and average the results (the Brier score). Probabilities can be revised until the resolution date, but revisions made in the last seven days up to and including that date do not count; those days are scored at the probability that stood the day before (for forecasts open only briefly, the window never exceeds a quarter of the period from publication to the resolution date). An outcome that happened counts as 1; one that did not counts as 0. Closer to 0 is better; giving every forecast 50 percent scores 0.25." + (d ? " The score will appear here after the first result comes in on " + d + "." : ""), accGo: "See how results are checked in Methodology →",
  href: p => EN_P + p,
  tweet: (q, p, d) => "“" + q + "” Clisa Geopolitics puts this at " + p + "%. Resolves " + d + ".",
};

const fcToday = () => { const n = new Date(), k = new Date(n.getTime() + (n.getTimezoneOffset() + 540) * 60000); return k.getFullYear() + "-" + String(k.getMonth() + 1).padStart(2, "0") + "-" + String(k.getDate()).padStart(2, "0"); };
const fcUTC = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const fcDays = (a, b) => Math.round((fcUTC(b) - fcUTC(a)) / 864e5);
const fcAdd = (s, n) => new Date(fcUTC(s) + n * 864e5).toISOString().slice(0, 10);
/* v4.31(2026-10-23 결재): 전망의 사안은 분쟁 지점(fp)이 아니라 cases(첫째가 주 사안)로 정한다. fp는 지도에만 쓴다 */
function fcCase(f){ const cs = D.strategies || []; return (f.cases && cs.find(c => c.id === f.cases[0])) || cs.find(c => c.fp === f.fp); }
function fcIn(f, c){ return f.cases ? f.cases.includes(c.id) : f.fp === c.fp; }
const fcCaseOf = f => fcCase(f);
const fcCaseName = f => { const c = fcCaseOf(f); return c ? c.title.split(":")[0] : FCT.etc; };
const fcHistOf = f => ((D.fc_hist || {})[f.id] || [[f.made || f.due, f.p]]);
/* v4.24 기간 평균 브라이어 점수(2026-10-20 결재): 공개한 날부터 검증 시점(그 전에 실현이 확정되면 그날)까지 날마다의 확률로 매긴 점수의 평균.
   확률을 고치지 않은 날은 직전 확률이 이어진다. 아직 열린 전망은 현재 확률이 검증 시점까지 이어진다고 본다 */
const fcEnd = f => (f.resolved && f.resolved < f.due ? f.resolved : f.due);
/* v4.34 마지막 k일 동결(2026-10-25 결재): k = min(7, 공개 일수의 4분의 1). 동결일(검증 시점 k일 전) 뒤에 고친 확률은 점수에 넣지 않는다 */
const fcFzK = f => { const H = fcHistOf(f); return Math.max(0, Math.min(7, Math.floor((fcDays(H[0][0], f.due) + 1) / 4))); };
const fcFz = f => fcAdd(f.due, -fcFzK(f));
const fcPAt = (f, d) => { const H = fcHistOf(f); let p = H[0][1]; H.forEach(h => { if (h[0] <= d) p = h[1]; }); return p; };
function fcBrierT(f, y){
  const H = fcHistOf(f), end = fcEnd(f), fz = fcFz(f); let d = H[0][0], i = 0, cur = H[0][1], s = 0, n = 0;
  for (; d <= end && n < 5000; d = fcAdd(d, 1)) { const q = d <= fz ? d : fz; while (i + 1 < H.length && H[i + 1][0] <= q) { i++; cur = H[i][1]; } s += Math.pow(cur / 100 - y, 2); n++; }
  return n ? s / n : Math.pow(f.p / 100 - y, 2);
}
const fcPP = it => it.from === it.to ? FCT.keep(it.to) : FCT.chg(it.from, it.to);
function fcOpen(id){ S.ffc = id || null; S.fcw = "30"; renderForecasts(); switchTab("forecast"); }
/* v4.23 전망과 검증 탭 머리(2026-10-20 결재): 다음 결과 카드·숫자 꼬리표·판가름 달력 */
const FC_RAMP = ["#C9D6F5", "#9DB3EC", "#6A8BE0", "#3D63D4", "#1A3FA8"], fcCol = p => FC_RAMP[Math.min(4, Math.max(0, Math.floor((p - 1) / 20)))];
function fcSpark(f, t){
  const H = fcHistOf(f); if (H.length < 2 && H[0][1] === f.p) return "";
  const w = 150, h = 46, x0 = H[0][0], span = Math.max(1, fcDays(x0, t)), X = d => 4 + (w - 8) * Math.max(0, Math.min(1, fcDays(x0, d) / span)), Y = p => h - 6 - (h - 14) * p / 100;
  let d = "M" + X(x0) + "," + Y(H[0][1]), cur = H[0][1]; const pts = [[x0, cur]];
  H.slice(1).forEach(([dd, p]) => { if (dd > t) return; d += " H" + X(dd) + " V" + Y(p); cur = p; pts.push([dd, p]); });
  d += " H" + X(t);
  return '<svg class="fh-sp" viewBox="0 0 ' + w + " " + (h + 14) + '" width="' + w + '" height="' + (h + 14) + '" aria-hidden="true"><path d="' + d + '"/>' +
    pts.map(([dd, p], i) => '<circle cx="' + X(dd) + '" cy="' + Y(p) + '" r="3.5"/><text x="' + (X(dd) + (i ? 6 : 0)) + '" y="' + (Y(p) + (i ? 12 : -7)) + '">' + p + "%</text>").join("") +
    '<text class="d" x="4" y="' + (h + 12) + '">' + esc(FCT.hStart(FCT.tk(x0))) + '</text><text class="d" x="' + (w - 4) + '" y="' + (h + 12) + '" text-anchor="end">' + FCT.today + "</text></svg>";
}
function fcHeroHtml(op, done, t){
  const nx = op[0]; if (!nx) return "";
  const n = fcDays(t, nx.due);
  return '<button type="button" class="fh-card" data-fcd="' + esc(nx.id) + '"><div class="fh-cd">' + (n > 0 ? "<b>" + n + "</b><span>" + FCT.hDays(done.length, n) + "</span>" : "<b>" + (n === 0 ? "0" : "…") + "</b><span>" + (n === 0 ? FCT.hToday : FCT.checking) + "</span>") + "</div>" +
    '<div class="fh-t"><small>' + esc(FCT.hK(FCT.md(nx.due), fcCaseName(nx))) + "</small><div>" + esc(nx.s || nx.q) + "</div><p>" + FCT.hNote + "</p></div>" +
    '<div class="fh-p"><b>' + nx.p + "%</b>" + ydWord(nx.p, "yw yh") + "<span>" + FCT.pNow + "</span>" + fcSpark(nx, t) + "</div></button>";
}
function fcStatsHtml(fs, op, done, brier){
  const chg = op.filter(f => fcHistOf(f)[0][1] !== f.p).length, vd = fs.filter(f => f.status === "void").length;
  return '<div class="fh-st"><span><b>' + op.length + "</b>" + FCT.stOpen + "</span><span><b>" + chg + "</b>" + FCT.stChg + "</span><span><b>" + done.length + "</b>" + FCT.stDone + "</span>" + (vd ? "<span><b>" + vd + "</b>" + FCT.stVoid + "</span>" : "") + (done.length ? "<span><b>" + brier + "</b>" + FCT.acc + "</span>" : "") + "</div>";
}
function fcCalHtml(op, t){
  const y0 = +t.slice(0, 4), m0 = +t.slice(5, 7), cols = [];
  for (let i = 0; i < 9; i++) { const k = m0 - 1 + i, y = y0 + Math.floor(k / 12), m = k % 12 + 1; cols.push({l: FCT.calM(y, m, i === 0 && false), now: i === 0, t: f => +f.due.slice(0, 4) === y && +f.due.slice(5, 7) === m, y, m}); }
  cols.forEach((c, i) => { if (c.m === 1 && i) c.l = FCT.calM(c.y, c.m, true); });
  const last = cols[cols.length - 1], rm = last.m + 1;
  if (rm <= 12 && op.some(f => +f.due.slice(0, 4) === last.y && +f.due.slice(5, 7) >= rm)) cols.push({l: FCT.calRest(last.y, rm), t: f => +f.due.slice(0, 4) === last.y && +f.due.slice(5, 7) >= rm});
  const ys = [...new Set(op.map(f => +f.due.slice(0, 4)).filter(y => y > last.y))].sort();
  ys.forEach(y => cols.push({l: FCT.calY(y), t: f => +f.due.slice(0, 4) === y}));
  const past = op.filter(f => f.due < t); if (past.length) cols[0].t = (g => f => g(f) || f.due < t)(cols[0].t);
  return '<section class="sec" id="f-cal"><h3>' + FCT.calH + '</h3><p class="note" style="margin-bottom:4px">' + FCT.calNote + '</p><div class="fcal" style="grid-template-columns:repeat(' + cols.length + ',minmax(0,1fr))">' +
    cols.map(c => { const xs = op.filter(c.t).sort((a, b) => b.p - a.p); return '<div class="fc-c' + (c.now ? " now" : "") + '"><div class="fc-s">' + xs.map(f => '<button type="button" class="fc-d" data-fcd="' + esc(f.id) + '" data-tip="' + esc(f.s || f.q) + '" data-tm="' + esc(fcCaseName(f) + " · " + FCT.ymd(f.due)) + '" data-tp="' + f.p + '" aria-label="' + esc((f.s || f.q) + " " + f.p + "%") + '" style="background:' + fcCol(f.p) + '"></button>').join("") + '</div><div class="fc-n">' + (xs.length || "") + '</div><div class="fc-m">' + c.l + "</div></div>"; }).join("") +
    '</div><div class="fcal-lg">' + FCT.legP + " " + FCT.legB.map((b, i) => '<span><i style="background:' + FC_RAMP[i] + '"></i>' + b + "</span>").join("") + "</div></section>";
}
function fcCalTip(){
  const pn = $("#pane-forecast"); if (!pn || pn.dataset.tip) return; pn.dataset.tip = "1";
  let tip = null; const hide = () => { if (tip) tip.hidden = true; };
  pn.addEventListener("pointerover", ev => { const d = ev.target.closest && ev.target.closest(".fcal .fc-d"); if (!d) return hide();
    if (!tip) { tip = document.createElement("div"); tip.className = "fcal-tip"; document.body.appendChild(tip); }
    tip.innerHTML = esc(d.dataset.tip) + "<br><span>" + esc(d.dataset.tm) + "</span> · <b>" + esc(d.dataset.tp) + "%</b>"; tip.hidden = false;
    const r = d.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(r.left, innerWidth - 296)) + "px"; tip.style.top = (r.bottom + 8) + "px"; });
  pn.addEventListener("pointerout", ev => { if (ev.target.closest && ev.target.closest(".fcal .fc-d")) hide(); });
  pn.addEventListener("scroll", hide, {passive: true}); addEventListener("scroll", hide, {passive: true});
}
function fcSoonRow(f, t){
  const n = fcDays(t, f.due);
  return '<li><button type="button" data-fcd="' + esc(f.id) + '"><span class="dl">' + (n < 0 ? FCT.late(-n) : FCT.dd(n)) + '</span><span class="sq">' + esc(f.s || f.q) + "<small>" + esc(fcCaseName(f)) + " · " + FCT.due(FCT.md(f.due)) + fcRowX(f) + '</small></span><span class="pb"><i style="width:' + f.p + '%"></i></span><b>' + f.p + "%" + ydWord(f.p) + "</b></button></li>";
}
function ydBand(p){ return p <= 7 ? 0 : p <= 22 ? 1 : p <= 37 ? 2 : p <= 52 ? 3 : p <= 77 ? 4 : p <= 92 ? 5 : 6; }
function ydWord(p, cls){  /* v4.27 확률 잣대 표현: 첫 낱말과 나머지를 나눠 휴대전화 목록에서 줄을 바꾼다 */
  const t = FCT.yd[ydBand(+p)], i = t.indexOf(" ");
  const inner = (i > 0 && (t.indexOf("chance") === 0 || !/[가-힣]/.test(t))) ? '<span class="y1">' + esc(t.slice(0, i)) + '</span> <span class="y2">' + esc(t.slice(i + 1)) + "</span>" : esc(t);
  return '<span class="' + (cls || "yw") + '">' + inner + "</span>";
}
function fcRowX(f){  /* v4.23 처음 확률과 다르면 변화, 정세 브리핑에서 연결한 꼭지 수 */
  const h0 = fcHistOf(f)[0][1], n = fcEvents(f).length;
  const a = (h0 !== f.p ? '<span class="fchg">' + h0 + "% " + (f.p < h0 ? "▼" : "▲") + " " + f.p + "%</span>" : "") + (n ? '<span class="frel">' + FCT.rel(n) + "</span>" : "");
  return a ? '<span class="fx">' + a + "</span>" : "";
}
function fcSoonHtml(t){
  const op = D.forecasts.filter(f => f.status === "open").sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p);
  const late = op.filter(f => f.due < t), a = op.filter(f => f.due >= t && fcDays(t, f.due) <= 30), b = op.filter(f => { const n = fcDays(t, f.due); return n > 30 && n <= 90; });
  const ul = (xs, c) => '<ul class="fsoon' + (c ? " " + c : "") + '">' + xs.map(f => fcSoonRow(f, t)).join("") + "</ul>";
  return '<section class="sec" id="f-soon">' +
    (late.length ? "<h3>" + FCT.late_h + ' <span class="note">' + FCT.cnt(late.length) + "</span></h3>" + ul(late, "s30") + '<div style="height:14px"></div>' : "") +
    "<h3>" + FCT.s30 + "</h3>" + (a.length ? ul(a, "s30") : '<p class="note">' + FCT.s30none + "</p>") +
    (b.length ? '<h3 style="margin-top:14px">' + FCT.s90 + ' <span class="note">' + FCT.cnt(b.length) + "</span></h3>" + ul(b) : "") +
    (() => { const rest = op.filter(f => fcDays(t, f.due) > 90).length; return rest ? '<p class="fh-later"><button type="button" class="chip" data-jump="f-all">' + FCT.later(rest) + "</button></p>" : ""; })() + "</section>";
}
function fcEvents(f){
  const out = []; if (!BR) return out;
  BR.issues.forEach(x => x.items.forEach(it => (it.fc || []).forEach(r => { if (r.id === f.id) out.push([x.date, r.e, it]); })));
  return out.sort((a, b) => b[0].localeCompare(a[0]));
}
function fcChart(f, t){
  const H = fcHistOf(f), made = H[0][0], open = f.status === "open";
  const x1 = open ? (f.due > t && fcDays(t, f.due) <= 30 ? f.due : t) : f.status === "void" ? (f.due < t ? f.due : t) : (f.resolved && f.resolved < f.due ? f.resolved : f.due);  /* 무효는 오늘까지, 확정된 전망은 확정일까지 */
  let x0 = S.fcw === "all" ? made : fcAdd(x1 > t ? t : x1, -30);
  if (fcDays(x0, x1) < 7) x0 = fcAdd(x1, -7);
  const nw = innerWidth < 600, W = nw ? 340 : 520, Ht = nw ? 250 : 262, L = 44, R = 10, T = 22, B = 66, span = Math.max(1, fcDays(x0, x1));  /* 좁은 화면은 좁은 그림(글자 크기 유지) */
  const X = d => L + (W - L - R) * Math.max(0, Math.min(1, fcDays(x0, d) / span)), Y = p => T + (Ht - T - B) * (1 - p / 100);
  const o = ['<svg class="fd-ch" viewBox="0 0 ' + W + " " + Ht + '" role="img" aria-label="' + esc(FCT.aria(f.s || f.q)) + '">'];
  [0, 25, 50, 75, 100].forEach(p => o.push('<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(p) + '" y2="' + Y(p) + '" class="g' + (p === 50 ? " g50" : "") + '"/><text x="' + (L - 6) + '" y="' + (Y(p) + 4) + '" class="ax" text-anchor="end">' + p + "%</text>"));
  const tk = t > x0 && t < x1 ? [x0, fcAdd(x0, Math.round(fcDays(x0, t) / 2)), t, x1] : [0, 1, 2, 3, 4].map(i => fcAdd(x0, Math.round(span * i / 4)));  /* 오늘이 안에 있으면 처음·가운데·오늘·끝 */
  let tkl = ""; tk.forEach((d, i) => { const lb = span > 200 ? FCT.ym(d) : FCT.tk(d); if (lb === tkl || (i && i < tk.length - 1 && fcDays(d, x1) < span * .12)) return; tkl = lb; o.push('<text x="' + X(d) + '" y="' + (Ht - B + 16) + '" class="ax" text-anchor="' + (i === 0 ? "start" : i === tk.length - 1 ? "end" : "middle") + '">' + lb + "</text>"); });
  const st = made > x0 ? made : x0; let cur = H[0][1]; H.forEach(h => { if (h[0] <= st) cur = h[1]; });
  const lineEnd = open ? (t < x1 ? t : x1) : x1;
  let d = "M" + X(st) + "," + Y(cur); const lab = [[st, cur]];
  H.forEach(h => { if (h[0] > st && h[0] <= lineEnd) { d += " H" + X(h[0]) + " V" + Y(h[1]); cur = h[1]; lab.push([h[0], h[1]]); } });
  d += " H" + X(lineEnd); o.push('<path d="' + d + '" class="ln"/>');
  if (open && lineEnd < x1) o.push('<path d="M' + X(lineEnd) + "," + Y(cur) + " H" + X(x1) + '" class="ln fut"/>');
  const tl = t === x1 || (f.due > t && f.due <= x1 && X(f.due) - X(t) < 120);  /* 검증 시점 표시와 겹치면 오늘 표시는 선의 왼쪽에 */
  if (t >= x0 && t <= x1) o.push('<line x1="' + X(t) + '" x2="' + X(t) + '" y1="' + (T - 6) + '" y2="' + (Ht - B) + '" class="vl today"/><text x="' + (X(t) + (tl ? -4 : 4)) + '" y="' + (tl ? T + 8 : T - 9) + '" class="ax today" text-anchor="' + (tl ? "end" : "start") + '">' + FCT.today + "</text>");
  if (f.due >= x0 && f.due <= x1 && f.due !== t) o.push('<line x1="' + X(f.due) + '" x2="' + X(f.due) + '" y1="' + (T - 6) + '" y2="' + (Ht - B) + '" class="vl due"/><text x="' + (X(f.due) - 4) + '" y="' + (T - 9) + '" class="ax due" text-anchor="end">' + FCT.dueAt + "</text>");
  FCR().forEach(r => r.items.forEach(it => { if (it.id === f.id && r.date >= x0 && r.date <= x1) o.push('<circle cx="' + X(r.date) + '" cy="' + Y(it.to) + '" r="5" class="rv' + (it.from !== it.to ? " chg" : "") + '"><title>' + esc(FCT.revT(FCT.md(r.date), fcPP(it))) + "</title></circle>"); }));
  lab.forEach(([dd, p]) => o.push('<text x="' + (X(dd) + 6) + '" y="' + (Y(p) - 8) + '" class="vlab">' + p + "%</text>"));
  const yb = Ht - B + 40;
  o.push('<text x="' + (L - 6) + '" y="' + (yb + 4) + '" class="ax" text-anchor="end">' + FCT.ev + '</text><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yb + '" y2="' + yb + '" class="g"/>');
  fcEvents(f).forEach(([dt, k, it]) => { if (dt < x0 || dt > x1) return; const a = FCT.E[k] || FCT.E.none; o.push('<g class="ev ' + (FCT.E[k] ? k : "none") + '"><circle cx="' + X(dt) + '" cy="' + yb + '" r="7"/><text x="' + X(dt) + '" y="' + (yb + 4) + '" text-anchor="middle">' + a[0] + "</text><title>" + esc(FCT.md(dt) + " · " + it.h) + "</title></g>"); });
  o.push("</svg>");
  return o.join("");
}
function fcDetailHtml(f){
  const t = fcToday(), H = fcHistOf(f), open = f.status === "open", n = fcDays(t, f.due), c = fcCaseOf(f), fz = fcFz(f), fzOn = fcFzK(f) > 0 && t > fz, pz = fcPAt(f, fz);
  const sib = D.forecasts.filter(x => x.fp && x.fp === f.fp && x.id !== f.id).sort((a, b) => a.due.localeCompare(b.due));
  const rv = []; FCR().forEach(r => r.items.forEach(it => { if (it.id === f.id) rv.push([r.date, it]); }));
  const evs = fcEvents(f), br = (p, y) => Math.pow(p / 100 - (y ? 1 : 0), 2).toFixed(2), low = f.p < 50, res = f.status === "yes" || f.status === "no";
  const url = location.origin + FCT.href("/forecast/" + f.id + "/");
  return '<div class="sec"><p style="margin:0 0 10px"><button type="button" class="chip back" data-fcd="">' + FCT.back + "</button></p>" +
    '<div class="fd-h"><div><p class="eyebrow">' + esc(FCT.eyebrow(f.id, fcCaseName(f))) + '</p><h2 class="fd-q">' + esc(f.q) + "</h2></div>" +
    '<div class="fd-p"><b>' + f.p + "%</b>" + ydWord(f.p, "yw yd") + "<span>" + (open ? FCT.pNow : FCT.pThen) + "</span></div></div>" +
    '<div class="chips" style="margin-top:8px">' + (f.countries || []).map(chip).join("") + (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + '">' + esc(FCT.caseGo(c.title.split(":")[0])) + "</button>" : "") + "</div>" +
    '<dl class="fd-meta"><dt>' + FCT.dueAt + "</dt><dd>" + FCT.ymd(f.due) + (open ? ' <span class="fd-dd">' + (n > 0 ? FCT.left(n) : n === 0 ? FCT.today : FCT.checking) + "</span>" : "") + "</dd>" +
    "<dt>" + FCT.made + "</dt><dd>" + FCT.madeV(FCT.ymd(H[0][0]), H[0][1]) + "</dd>" + (fzOn ? "<dt>" + FCT.fzH + "</dt><dd>" + FCT.fzV(FCT.ymd(fz), pz, fcFzK(f)) + "</dd>" : "") + (f.rs ? "<dt>" + FCT.rs + "</dt><dd>" + esc(f.rs) + "</dd>" : "") + "</dl></div>" +
    (res || f.status === "void" ? '<section class="sec fd-rc"><p class="eyebrow">' + FCT.resH + (f.resolved ? FCT.resD(FCT.ymd(f.resolved)) : "") + "</p>" +
      (f.status === "void" ? "<p><b>" + FCT.voidL + "</b></p><p>" + esc(f.void || "") + "</p>" :
        "<p><b>" + (f.status === "yes" ? FCT.yes : FCT.no) + '</b> <span class="note">' + FCT.resSub(f.p, fcBrierT(f, f.status === "yes" ? 1 : 0).toFixed(2)) + "</span></p>" + (f.outcome ? "<p>" + esc(f.outcome) + "</p>" : "") +
        ((f.outcome_src || []).length ? '<p class="note">' + f.outcome_src.map(u => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]) + "</a>").join(" · ") + "</p>" : "")) + "</section>" : "") +
    '<section class="sec"><div class="fd-ht"><h3>' + FCT.chartH + '</h3><div class="fd-seg" role="group" aria-label="' + FCT.span + '"><button type="button" data-fcw="30" aria-pressed="' + (S.fcw !== "all") + '">' + FCT.w30 + '</button><button type="button" data-fcw="all" aria-pressed="' + (S.fcw === "all") + '">' + FCT.wAll + "</button></div></div>" +
      fcChart(f, t) +
      '<div class="fd-leg"><span><i class="f"></i>' + FCT.legF + '</span><span><i class="o"></i>' + FCT.legO + '</span><span><i class="u"></i>' + FCT.legU + '</span><span><i class="d"></i>' + FCT.legD + "</span></div>" +
      '<p class="note">' + FCT.chartNote + (open ? FCT.futNote : "") + "</p></section>" +
    '<section class="sec"><h3>' + FCT.whyH + '</h3><ul class="fd-tl">' +
      rv.map(([dt, it]) => '<li><span class="d">' + FCT.md(dt) + "</span><div><b>" + fcPP(it) + '</b> <span class="note">' + FCT.week + "</span><p>" + esc(it.why) + "</p></div></li>").join("") +
      '<li><span class="d">' + FCT.md(H[0][0]) + "</span><div><b>" + FCT.first(H[0][1]) + '</b> <span class="note">' + FCT.firstD + "</span><p>" + esc(f.basis || "") + "</p></div></li></ul></section>" +
    (evs.length ? '<section class="sec"><h3>' + FCT.evH + '</h3><p class="note" style="margin-bottom:8px">' + FCT.evNote + '</p><ul class="fd-tl">' +
      evs.map(([dt, k, it]) => { const a = FCT.E[k] || FCT.E.none; return '<li><span class="d">' + FCT.md(dt) + '</span><div><span class="fd-ar ' + (FCT.E[k] ? k : "none") + '">' + a[0] + " " + a[1] + "</span> <b>" + esc(it.h) + "</b>" + (it.link ? "<p>" + esc(it.link) + "</p>" : "") + '<a class="fd-more" href="' + FCT.href("/brief/" + esc(dt) + "/") + '">' + FCT.evGo + "</a></div></li>"; }).join("") + "</ul></section>" : "") +
    (open ? '<section class="sec"><h3>' + FCT.ocH + '</h3><p class="note" style="margin-bottom:8px">' + (fzOn ? FCT.ocNoteF(FCT.ymd(f.due), pz, FCT.ymd(fz)) : FCT.ocNote(FCT.ymd(f.due), f.p)) + "</p>" +
      '<div class="fd-oc"><div class="y"><h4>' + FCT.ocY + "</h4><b>" + fcBrierT(f, 1).toFixed(2) + "</b><p>" + (low ? FCT.yLow(f.p) : FCT.yHigh(f.p)) + "</p></div>" +
      '<div class="n"><h4>' + FCT.ocN + "</h4><b>" + fcBrierT(f, 0).toFixed(2) + "</b><p>" + (low ? FCT.nLow(f.p) : FCT.nHigh(f.p)) + "</p></div></div>" +
      (H[0][1] !== f.p ? '<p class="note" style="margin-top:8px">' + FCT.ocFirst(H[0][1], br(H[0][1], true), br(H[0][1], false)) + "</p>" : "") + "</section>" : "") +
    (sib.length ? '<section class="sec"><h3>' + FCT.sibH + '</h3><ul class="fsoon">' + sib.map(x => '<li><button type="button" data-fcd="' + esc(x.id) + '"><span class="dl"></span><span class="sq">' + esc(x.s || x.q) + "<small>" + FCT.due(FCT.ymd(x.due)) + '</small></span><span class="pb"><i style="width:' + x.p + '%"></i></span><b>' + x.p + "%</b></button></li>").join("") + "</ul></section>" : "") +
    '<section class="sec"><h3>' + FCT.shareH + '</h3><div class="fd-share"><a class="chip" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(FCT.tweet(f.q, f.p, FCT.ymd(f.due))) + "&url=" + encodeURIComponent(url) + '" target="_blank" rel="noopener">' + FCT.shareX + '</a><button type="button" class="chip" data-fccopy="' + esc(url) + '">' + FCT.copy + '</button><a class="chip" href="' + FCT.href("/subscribe/") + '">' + FCT.sub + "</a></div></section>";
}
function renderForecasts(){
  if (S.ffc) { const F = D.forecasts.find(f => f.id === S.ffc); if (F) { $("#pane-forecast").innerHTML = fcDetailHtml(F); return; } S.ffc = null; }
  const fs = D.forecasts.slice().sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p);
  const done = fs.filter(f => f.status === "yes" || f.status === "no");
  const miss = done.filter(f => (f.status === "yes") !== (f.p >= 50));
  const brier = done.length ? (done.reduce((s, f) => s + fcBrierT(f, f.status === "yes" ? 1 : 0), 0) / done.length).toFixed(3) : "—";  /* v4.24 기간 평균 */
  const t0 = fcToday(), op0 = fs.filter(f => f.status === "open").sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p), nx = op0[0];
  $("#pane-forecast").innerHTML =
    "<div class=\"sec\"><h2>Forecasts and Track Record</h2><p class=\"lead\" style=\"margin-top:8px\">Every forecast states its probability and a resolution date; on that date, it is checked against what actually happened, and the result is published.</p><p class=\"ydnote\">" + esc(FCT.ydNote) + "</p></div>" +
    fcHeroHtml(op0, done, t0) + fcStatsHtml(fs, op0, done, brier) +  /* v4.23 다음 결과 카드와 숫자 꼬리표(성적표 3칸을 대신함) */
    fcCalHtml(op0, t0) +  /* v4.23 판가름 달력 */
    fcSoonHtml(t0) +  /* v4.22 판가름 목록 */
    '<details class="facc"><summary>' + FCT.accH + "</summary><p>" + FCT.accP(done.length || !nx ? "" : FCT.md(nx.due)) + '</p><p><button type="button" class="chip" data-go="method">' + FCT.accGo + "</button></p></details>" +
    (FCR().length ? "<section class=\"sec\" id=\"f-week\"><h3>Weekly forecast review</h3><p class=\"note\" style=\"margin-bottom:8px\">Every Monday, forecast probabilities are revisited in light of the previous week’s events. Both revised and unchanged forecasts are listed, with reasons.</p>" + FCR().map((r, i) => weekHtml(r, i === 0)).join("") + "</section>" : "") +
    "<section class=\"sec\"><h3>Missed forecasts</h3><p class=\"note\" style=\"margin-bottom:8px\">Forecasts rated 50% or higher that did not happen, or rated below 50% that did.</p>" + (miss.length ? '<ul class="list">' + miss.map(f => forecastRow(f, false)).join("") + "</ul>" : "<p class=\"note\">No forecasts have been resolved yet.</p>") + "</section>" +
    ((PUB() && (D.notices || []).length) ? "<section class=\"sec\"><h3>Revised assessments</h3><ul class=\"tl\">" + D.notices.slice().reverse().map(l => { const m = /^case\/([\w-]+)\/$/.exec(l.link || ""), k = m && (D.strategies || []).find(x => x.id === m[1]), fm = /^feature\/([\w-]+)\/$/.exec(l.link || ""), F = fm && FEATS().find(x => x.id === fm[1]); return '<li><span class="d">' + esc(enDate(l.date)) + "</span><span>" + esc(l.text) + (F ? " " + featBtn(F) : "") + (k ? ' <button type="button" class="chip" data-case="' + esc(k.id) + "\">View analysis · " + esc(k.title.split(":")[0]) + "</button>" : "") + "</span></li>"; }).join("") + "</ul></section>" : "") +
    (() => { const cs = D.strategies || [], cf = f => { const c = fcCase(f); return c ? c.id : "etc"; };
      const opts = [["all", "All", fs.length]].concat(cs.map(c => [c.id, c.title.split(":")[0], fs.filter(f => cf(f) === c.id).length]), [["etc", "Other conflicts", fs.filter(f => cf(f) === "etc").length]]);
      const sel = S.fcf || "all", shown = sel === "all" ? fs : fs.filter(f => cf(f) === sel);
      const cc = cs.find(c => c.id === sel);
      return '<section class="sec" id="f-all"><h3>' + (cc ? esc(cc.title.split(":")[0]) + " · forecasts by scenario" : "All forecasts · by resolution date") + "</h3><div class=\"chips fcf\" role=\"group\" aria-label=\"Filter forecasts by issue\" style=\"margin:0 0 8px\">" + opts.filter(o => o[2]).map(o => '<button type="button" class="chip' + (o[0] === sel ? " on" : "") + '" data-fcf="' + o[0] + '" aria-pressed="' + (o[0] === sel) + '">' + esc(o[1]) + ' <span class="mono">' + o[2] + "</span></button>").join("") + '</div>' + (cc ? "<p class=\"note\" style=\"margin:0 0 4px\">For each possible scenario on the issue, this view groups the forecasts tied to its resolution criteria with the signal forecasts that tilt toward (or away from) it. Scenario probabilities come from the issue analysis, and the same forecast may appear under more than one scenario.</p>" + fcByBranch(cc, fs) : '<ul class="list">' + shown.map(f => forecastRow(f, false)).join("") + "</ul>") + "</section>"; })();
  fcCalTip();  /* v4.23 */
}

function frameworkHtml(){
  const F = D.meta.framework; if (!F) return "";
  return "<section class=\"sec method\"><h3>Layers of analysis</h3><p class=\"note\" style=\"margin-bottom:10px\">From facts to verification, every judgment is built to trace back to evidence in the preceding layer and to be tested in the following one. Each layer lists what is in place and what still needs strengthening.</p><ol class=\"fw\">" +
    F.layers.map(l => '<li><div class="fw-h"><b>' + esc(l.n) + "</b><span>" + esc(l.q) + "</span></div><p><span class=\"ok\">In place</span> " + esc(l.have) + "</p><p><span class=\"gap\">Needs strengthening</span> " + esc(l.gap) + "</p></li>").join("") + "</ol></section>" +
    "<section class=\"sec method\"><h3>Elements that need strengthening</h3><ul class=\"list\">" + F.missing.map(m => '<li class="rv"><b>' + esc(m.t) + (m.status ? ' <span class="fit ' + (m.status === "일부" ? "part" : "no") + '">' + esc(ev(m.status)) + "</span>" : "") + "</b><p>" + esc(m.d) + (m.now ? "<br><span class=\"note\">Current status · " + esc(m.now) + "</span>" : "") + "</p></li>").join("") + "</ul></section>";
}


function questionsHtml(){
  const F = D.philosophy;
  return "<section class=\"sec\"><h3>Questions raised about the purpose</h3><p class=\"note\" style=\"margin-bottom:8px\">The philosophical questions raised against the goal of individual human well-being, with the main positions, the strongest objection, a provisional answer, the problems that remain, and how the answer is applied in the analysis.</p>" + F.questions.map(q =>
      '<details class="pq" id="pq-' + q.id + '"><summary><b>' + esc(q.id + ". " + q.title) + '</b> <span class="aim">' + (q.prev_answer && !PUB() ? "" : "Provisional answer") + '</span></summary><div class="pq-body">' +
      "<div><h5>Where it arises in geopolitics</h5><p>" + esc(q.scene) + "</p></div>" +
      "<div><h5>Main positions</h5><ul>" + q.positions.map(p => "<li><b>" + esc(p.who) + "</b> · " + esc(p.view) + "</li>").join("") + "</ul></div>" +
      "<div class=\"obj\"><h5>Strongest objection</h5><p>" + esc(q.objection) + "</p></div>" +
      "<div class=\"ans\"><h5>Provisional answer</h5><p style=\"color:var(--ink)\">" + esc(q.answer) + "</p></div>" +
      (q.prev_answer && !PUB() ? '<div><h5></h5><p class="note">' + esc(q.prev_answer) + "</p></div>" : "") +
      "<div><h5>What remains unresolved</h5><p>" + esc(q.remains) + "</p></div>" +
      "<div class=\"rule\"><h5>How it is applied in the analysis</h5><p>" + (PUB() ? "" : "<b>" + esc(q.rule.id) + "</b> · ") + esc(q.rule.text) + "</p></div>" +
      "</div></details>").join("") + '<p class="note" style="margin-top:8px">' + esc(F.note) + "</p></section>";
}
function tocHtml(L){
  return "<nav class=\"toc\" aria-label=\"Sections on this tab\">" + L.map(([id, t]) => '<button type="button" data-jump="' + id + '">' + esc(t) + "</button>").join("") + "</nav>";
}
function renderIdeas(){
  const H = D.history;
  $("#pane-ideas").innerHTML =
    "<div class=\"sec\"><h2>History and Ideas</h2><p class=\"meta\" style=\"margin-top:4px\">" + pl(H.analogies.length, "historical precedent") + " · " + pl(H.laws.length, "recurring pattern") + " · " + pl(D.thinkers.length, "key thinker") + "</p><p class=\"lead\" style=\"margin-top:8px\">This section collects the historical precedents behind the analysis, the patterns that recur in history, and the perspectives of geopolitical thinkers.</p></div>" +
    tocHtml([["i-an","Historical precedents"],["i-law","Recurring patterns"],["i-th","Key thinkers"]]) +
    "<section class=\"sec\" id=\"i-an\"><h3>Historical precedents " + ttsBtn("an") + "</h3><p class=\"note\" style=\"margin-bottom:8px\">Past cases structurally similar to the current situation: how they unfolded, what they imply for today, and how today differs.</p><ul class=\"list\">" + H.analogies.map(a => "<li>" + analogHtml(a, false) + "</li>").join("") + "</ul></section>" +
    "<section class=\"sec\" id=\"i-law\"><h3>Recurring patterns in history " + ttsBtn("law") + '</h3><ul class="list">' + H.laws.map(l => '<li class="law"><b>' + esc(l.t) + "</b><p>" + esc(l.d) + '</p><div class="chips" style="margin-top:4px">' + l.cases.map(chip).join("") + "</div></li>").join("") + "</ul></section>" +
    "<section class=\"sec\" id=\"i-th\"><h3>Key thinkers " + ttsBtn("th") + "</h3><p class=\"note\" style=\"margin-bottom:8px\">Each profile includes a short biography, core propositions, core argument and how the thinking developed, a signature passage, criticism and limits, how the ideas look in light of current events, and what has held up against history and what has not. A \"Predictive\" proposition concerns how the world works and can be proved right or wrong by events; a \"Normative\" proposition concerns what is right.</p>" +
      '<div class="chips th-idx">' + D.thinkers.map(t => '<a class="chip" href="#th-' + esc(t.id) + '">' + esc(t.name) + "</a>").join("") + "</div>" +
      '<ul class="list">' + D.thinkers.map(t => {
      const row = (k, v) => v ? "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>" : "";
      const props = (t.props || []).length ? '<ol class="props">' + t.props.map(p => '<li><span class="pk ' + (p.k === "Predictive" || p.k === "Predictive" ? "pk-f" : "pk-v") + '">' + esc(p.k) + "</span>" + esc(p.t) + "</li>").join("") + "</ol>" : "";
      const q = t.quote, quote = q ? '<blockquote class="tq">' + esc(q.ko) + "</blockquote>" + (q.orig && q.ko.replace(/["“”'‘’]/g, "").trim() !== q.orig.replace(/["“”'‘’]/g, "").trim() ? '<p class="tq-o">' + esc(q.orig) + "</p>" : "") + '<p class="tq-s">' + esc(q.src) + "</p>" : "";
      const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
      const grp = []; (t.sources || []).forEach(u => { const h = hostOf(u); let g = grp.find(x => x.h === h); if (!g) { g = {h, us: []}; grp.push(g); } g.us.push(u); });
      const srcs = grp.length ? '<p class="tsrc">' + grp.map(g => '<span class="tsg">' + esc(g.h) + " " + g.us.map((u, i) => '<a href="' + esc(u) + '" target="_blank" rel="noopener" title="' + esc(u) + '">' + (i + 1) + "</a>").join(" ") + "</span>").join(" · ") + "</p>" : "";
      return '<li id="th-' + esc(t.id) + '"><article class="thinker"><div class="who"><h4>' + esc(t.name) + '</h4><span class="meta">' + esc(t.life) + " · " + esc(t.role) + "</span>" + (t.sub ? '<span class="tsub">' + esc(t.sub) + "</span>" : "") + '</div><div class="works">' + esc(t.works) + "</div>" +
        "<dl>" + row("Biographical note", esc(t.bio || "")) + row("Core propositions", props) + row("Core argument", esc(t.claim || t.idea || "")) + row("How the thinking developed", esc(t.develop || "")) + row("Signature passage", quote) + row("Criticism and limits", esc(t.critique || "")) + row("In light of current events", esc(t.now || "")) + row("What held up and what didn't", esc(t.record || "")) + row("Sources (N)".replace("N", (t.sources || []).length), srcs) + "</dl></article></li>";  /* v4.03 사상가 기본 정보 14명(2026-10-14 결재) */
    }).join("") + "</ul></section>";
}
function divisionHtml(M){  /* v4.24 사람과 AI의 분업(2026-10-20 결재) */
  const V = M.division; if (!V) return "";
  const g = V.game, at = g ? (g.after == null ? V.p.length - 1 : g.after) : -1;
  return '<section class="sec" id="m-div"><h3>' + esc(V.t) + "</h3>" + V.p.map((t, i) => '<p style="margin:0 0 10px;line-height:1.75">' + esc(t) + "</p>" +
    (i === at ? '<p style="margin:0 0 12px"><a class="chip" href="' + esc(FCT.href(g.href)) + '">' + esc(g.label) + "</a></p>" : "")).join("") + "</section>";
}
function renderMethod(){
  const F = D.philosophy, M = D.methodology, I = D.indicator;
  const R = F.rules || [];
  const qByRule = {}; R.forEach(r => qByRule[r.id] = r.q);
  const rc = r => '<button type="button" class="rchip" data-q="' + esc(qByRule[r] || "") + '">' + esc(r) + "</button>";
  const T = F.tree, LY = T.layers || [];
  const stepsOf = L => T.steps.filter(s => s.L === L);
  const P = F.prev, pub = PUB();
  const inner = !pub; /* 작업 설명서는 내부판에만 */
  $("#pane-method").innerHTML =
    "<div class=\"sec\"><h2>Methodology</h2><p class=\"lead\" style=\"margin-top:8px\">This section sets out the purpose of Clisa Geopolitics, how its judgments are structured and verified, and its sources and limitations. Its ultimate aim is the well-being of individual people, the standard that guides every analysis.</p>" + (pub ? "" : '<p class="note" style="margin-top:6px">' + esc(M.version) + (M.status ? " · " + esc(M.status) : "") + "</p>") + "</div>" +
    "<section class=\"sec\"><h3>Charter" + (F.charter.status && !pub ? " · " + esc(F.charter.status) : "") + '</h3><div class="charter">' + F.charter.items.map(it => "<div><b>" + esc(it.k) + "</b><p>" + esc(it.t) + (it.by ? "<small>" + esc(it.by) + "</small>" : "") + "</p></div>").join("") + "</div></section>" + questionsHtml() + divisionHtml(M) +
    "<section class=\"sec\"><h3>How judgments are structured</h3><div class=\"tree\"><div class=\"root\">" + esc(T.root) + '</div><div class="arrow"></div>' +
      '<div class="layers">' + LY.map(l => '<div class="layer l' + l.id + '"><div class="lh"><b>' + esc(LNAME[l.id]) + "</b><span>" + esc(l.q) + '</span></div><p class="note">' + esc(l.d) + "</p>" +
        (inner ? '<ol class="steps" style="counter-reset:st ' + ((stepsOf(l.id)[0] || {n: 1}).n - 1) + '">' + stepsOf(l.id).map(st => "<li><div><b>" + esc(st.t) + "</b><p>" + esc(st.d) + "</p>" + st.rules.map(rc).join("") + "</div></li>").join("") + "</ol>" : "") + "</div>").join("") + "</div>" +
      "<div class=\"rules2\"><div class=\"lesson-box\"><b>Editorial principle · the sole criterion for what is not recommended</b>" + esc(T.editorial) + "</div><div class=\"lesson-box\"><b>Quality standards</b>" + esc(T.quality) + "</div></div></div></section>" +
    (inner ? "<section class=\"sec method\"><h3>Step-by-step specifications</h3><p class=\"note\" style=\"margin-bottom:8px\">Each step specifies its purpose, inputs, key questions, outputs, rules, and common failures. Select a step to expand it.</p><div style=\"display:grid;gap:6px\">" +
      M.steps.map(st => '<details class="mstep"><summary><i class="l' + st.L + '">' + st.n + "</i><b>" + esc(st.t) + "</b><em>" + esc(LNAME[st.L]) + (st.rules.length ? " · " + st.rules.join(" · ") : "") + "</em></summary><dl>" +
        "<dt>Purpose</dt><dd>" + esc(st.aim) + "</dd><dt>Inputs</dt><dd>" + esc(st.in) + "</dd><dt>Key questions</dt><dd><ul>" + st.ask.map(q => "<li>" + esc(q) + "</li>").join("") + "</ul></dd>" +
        "<dt>Outputs</dt><dd>" + esc(st.out) + "</dd>" + (st.rules.length ? "<dt>Rules</dt><dd>" + st.rules.map(rc).join(" ") + "</dd>" : "") +
        "<dt>Common failures</dt><dd class=\"bad\">" + esc(st.fail) + "</dd></dl></details>").join("") + "</div></section>" +
    "<section class=\"sec\"><h3>Rules · by part</h3>" + LY.map(l => { const rs = R.filter(r => r.L === l.id); return rs.length ? '<h4 class="rl-h">' + esc(LNAME[l.id]) + '</h4><ul class="list">' + rs.map(r => '<li style="display:grid;grid-template-columns:44px 1fr;gap:8px;font-size:13px;align-items:start">' + rc(r.id) + "<span>" + esc(r.text) + (r.from ? '<br><span class="note">' + esc(r.from) + "</span>" : "") + (r.prev ? '<details class="src" style="margin-top:4px"><summary></summary><p class="note">' + esc(r.prev) + "</p></details>" : "") + "</span></li>").join("") + "</ul>" : ""; }).join("") + "</section>" : "") +
    (M.changes && inner ? '<section class="sec method"><h3></h3><div class="tbl-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th></th><th></th><th></th></tr></thead><tbody>' + M.changes.map(x => "<tr><td><b>" + esc(x.t) + "</b></td><td>" + esc(x.was) + "</td><td>" + esc(x.now) + "</td></tr>").join("") + "</tbody></table></div></section>" : "") +
    (M.intent_types && inner ? "<section class=\"sec method\"><h3>Intent indicators · how reliable signals are</h3><p class=\"note\" style=\"margin-bottom:8px\">Intent is read first from costly actions rather than from words. The more costly a signal is to send and the harder it is to reverse, the more reliable it is. Signals are listed from most to least reliable.</p><div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:600px\"><thead><tr><th>Signal</th><th>Why it is credible</th><th>Pitfalls</th><th>Example</th></tr></thead><tbody>" +
      M.intent_types.map(t => "<tr><td><b>" + esc(t.k) + "</b></td><td>" + esc(t.why) + '</td><td class="note">' + esc(t.trap) + "</td><td>" + esc(t.ex) + "</td></tr>").join("") + "</tbody></table></div></section>" : "") +
    (inner ? "<section class=\"sec method\"><h3>Output templates</h3><div class=\"tmpl\">" + M.outputs.map(o => '<div class="' + (o.kind === "산출" ? "" : "chk") + '"><span class="kind">' + esc(ev(o.kind)) + "</span><b>" + esc(o.k) + "</b><p>" + esc(o.t) + "</p><ol>" + o.fields.map(x => "<li>" + esc(x) + "</li>").join("") + "</ol></div>").join("") + "</div></section>" : "") +
    (inner ? '<section class="sec method"><h3>' + esc(I.title) + " · formulas and sources</h3><p>" + esc(I.unit) + '</p><div class="idim" style="margin-top:8px">' + I.dims.map(d => "<div><b>" + esc(d.name) + "</b><code>" + esc(d.formula) + "</code><ul>" + d.parts.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul><small>Source · " + esc(d.src) + "</small></div>").join("") + "</div>" +
      "<h3 style=\"margin-top:14px\">Index rules</h3><ul>" + (I.rules || []).map(x => "<li>" + esc(x) + "</li>").join("") + "</ul><h3 style=\"margin-top:14px\">Index limitations</h3><ul>" + I.limits.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>"
     : '<section class="sec method"><h3>' + esc(I.title) + '</h3><p>' + esc(I.unit) + (I.dims.length === 4 ? " The index has four dimensions: " + I.dims.map(d => esc(d.name)).join(", ") + ". The dimensions are not combined into a single score." : "") + '</p><ul style="margin-top:6px">' + I.dims.map(d => "<li><b>" + esc(d.name) + "</b>" + (d.formula && I.dims.length !== 4 ? " · " + esc(d.formula) + (d.parts || []).map(x => ". " + esc(x)).join("") : "") + " · Source: " + esc(d.src) + "</li>").join("") + "</ul><h3 style=\"margin-top:14px\">Index limitations</h3><ul>" + I.limits.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>") +
    "<section class=\"sec method\"><h3>Verification and updates</h3><ul>" + M.update.map(x => "<li>" + esc(x) + "</li>").join("") + "<li>Country profiles, flashpoints, and forecasts live in a single data file; replacing it with newly researched data updates the entire site.</li><li>" + (pub ? "When a published judgment is changed, the date, the change, and the reason are posted under Revised assessments on the Forecasts and Track Record tab." : "") + "</li><li>Forecasts are never deleted. Once the resolution date passes, each is marked resolved yes or resolved no and counted toward accuracy. Forecasts whose answer was already settled when the question was written are marked voided and excluded from accuracy.</li></ul></section>" +
    (inner ? frameworkHtml() : "") +
    "<section class=\"sec method\"><h3>Scope of analysis</h3><p>" + esc(D.meta.scope) + ". Countries shown in color on the map are covered; gray marks countries not yet within scope. The EU and NATO are not countries and are treated in separate profiles.</p></section>" +
    "<section class=\"sec method\"><h3>Figures and scores</h3><ul>" + D.meta.method.map(m => "<li>" + esc(m) + "</li>").join("") + "</ul></section>" +
    (P && inner ? '<section class="sec"><details class="src"><summary>' + esc(P.label) + '</summary><div style="display:grid;gap:8px;margin-top:8px"><div class="charter">' + P.charter.items.map(it => "<div><b>" + esc(it.k) + "</b><p>" + esc(it.t) + "<small>" + esc(it.by) + "</small></p></div>").join("") + '</div><ul class="facts">' + P.gates.map(g => "<li><b>" + esc(g.label) + "</b> · " + esc(g.t) + " → " + esc(g.fail) + "</li>").join("") + "</ul></div></details></section>" : "") +
    "<p class=\"note\" style=\"margin:4px 0 12px\">Historical precedents, recurring patterns, and key thinkers are on the <button type=\"button\" class=\"chip\" data-go=\"ideas\">History and Ideas tab</button>. Unverified items for individual countries appear on each country’s page.</p>" +
    ((D.meta.uncertain || []).length ? "<section class=\"sec method\"><h3>Unverified items across the data</h3><details class=\"src\"><summary>Items not tied to a specific country · " + D.meta.uncertain.length + "</summary><ul>" + D.meta.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details></section>" : "") +
    "<section class=\"sec method\"><h3>Glossary</h3><div class=\"tbl-wrap\"><table class=\"tbl\"><tbody>" + M.terms.map(t => '<tr><td style="white-space:nowrap"><b>' + esc(t[0]) + "</b></td><td>" + esc(t[1]) + "</td></tr>").join("") + "</tbody></table></div></section>" +
    "<section class=\"sec method\"><h3>Data sources</h3><p class=\"note\" style=\"margin-bottom:6px\">Clisa Geopolitics analyses are written with the help of AI (Anthropic’s Claude) and reviewed by editors.</p><ul><li>Borders: Natural Earth 1:50m (world-atlas). Borders shown do not represent any political position.</li><li>Defense spending: SIPRI Military Expenditure Database · Nuclear warheads: SIPRI Yearbook 2026 · Armed forces: IISS Military Balance · Economy: IMF WEO</li></ul></section>";
}

/* v3.3 */
const MAIL = "clisageo@clisa.ai";
let HASH_READY = false;
function leadBold(t){
  const m = String(t).match(/^(.+?\.)\s(.+)$/s);
  return m ? "<b>" + esc(m[1]) + "</b> " + esc(m[2]) : esc(t);
}
function mailRow(subject){
  const href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(subject);
  return '<span class="mailrow"><span class="mail"><a href="' + esc(href) + '">' + MAIL + '</a></span><button type="button" class="copy-btn" data-copy="' + MAIL + "\">Copy email</button></span>";
}
/* v3.78 복사할 때 출처를 덧붙인다(2026-10-07 결재). 본문을 40자 이상 골라 복사하면 붙여 넣은 글 끝에 사이트 이름과 그 화면의 주소가 따라간다. 짧은 낱말과 검색창·입력칸 복사는 그대로 둔다 */
document.addEventListener("copy", e => {
  const sel = window.getSelection && getSelection(); if (!sel || sel.isCollapsed || !e.clipboardData) return;
  const a = document.activeElement; if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable)) return;
  const t = sel.toString(); if (t.replace(/\s+/g, "").length < 40) return;
  const url = location.origin + location.pathname + location.hash, box = document.createElement("div");
  for (let i = 0; i < sel.rangeCount; i++) box.appendChild(sel.getRangeAt(i).cloneContents());
  e.clipboardData.setData("text/plain", t.replace(/\s+$/, "") + "\n\nSource: Clisa Geopolitics (" + url + ")");
  e.clipboardData.setData("text/html", box.innerHTML + "<p>Source: <a href=\"" + esc(url) + "\">Clisa Geopolitics</a> (" + esc(url) + ")</p>");
  e.preventDefault();
});
function footHtml(noMail){
  return '<footer class="site-foot">' + (noMail ? "" : "<p class=\"fb\">Please send factual errors or evidence against any judgment to the address below. Confirmed errors are corrected, and the corrections are disclosed.</p>" +
    mailRow("[Clisa Geopolitics] Feedback")) +
    "<p>Clisa Geopolitics analyses are written with the help of AI (Anthropic’s Claude) and reviewed by editors.</p>" +
    "<p>Content on this site is analysis provided for informational purposes and is not investment, legal, or policy advice. Probabilistic forecasts are estimates presented together with the reasoning behind them.</p>" +
    "<p>This site has no user accounts. Email addresses and messages received as feedback are used only to reply and to correct errors, and are deleted one year after they are handled.</p>" +
    "<p>© 2026 Jae-Seong Ko · <a href=\"/en/about/\">A Note from the Founder</a> · <a href=\"/en/subscribe/\">Subscribe</a></p>" +
    "<p>The design, text, and data compilations of Clisa Geopolitics are protected by copyright. Sharing links and quoting parts are permitted; when quoting, please cite “Clisa Geopolitics” and the page address as the source (copying 40 or more characters of text adds the source automatically). To reproduce or redistribute all or a substantial part, please ask for permission first at <a href='mailto:clisageo@clisa.ai'>clisageo@clisa.ai</a>.</p></footer>";
}
function caseFbHtml(c){
  const name = String(c.title || "").split(":")[0];
  return "<div class=\"case-fb\"><b>Feedback on this analysis</b><span>" + esc(name) + " analysis: please report any factual errors, contrary evidence, or missing precedents. Putting the issue name in the subject line speeds up review.</span>" + mailRow("[Clisa Geopolitics] " + name + " analysis: feedback") + "</div>";
}
function withFoot(fn, pane, extra){
  return function(){
    const r = fn.apply(this, arguments);
    const el = document.getElementById(pane);
    if (el && !el.querySelector(":scope > .site-foot")) {
      const x = extra ? extra() : ""; if (x) el.insertAdjacentHTML("beforeend", x);
      el.insertAdjacentHTML("beforeend", footHtml(!!x));
    }
    return r;
  };
}
renderOverview = withFoot(renderOverview, "pane-overview");
renderDetail = withFoot(renderDetail, "pane-detail");
renderGrand = withFoot(renderGrand, "pane-grand");
renderIdeas = withFoot(renderIdeas, "pane-ideas");
renderForecasts = withFoot(renderForecasts, "pane-forecast");
renderMethod = withFoot(renderMethod, "pane-method");
/* v3.79 사이트 안내 탭(2026-10-07 결재): 분석 방법(이 탭이 그림) 아래에 이용 안내·운영자 인사말(각 쪽의 글 칸을 받아 옴)을 잇고, 맨 위 단추 3개로 해당 부분에 내려간다 */
const INFO = [["method", "Methodology"], ["guide", "Using the Site"], ["about", "A Note from the Founder"]];
const infoUrl = k => "/en/" + k + "/";
renderMethod = (f => function(){ f(); infoWrap(); })(renderMethod);
function infoWrap(){
  const pn = $("#pane-method"); if (pn.querySelector(".info-nav")) return;
  const top = document.createElement("div"); top.className = "sec info-top";
  top.innerHTML = "<h2>Site Guide</h2><div class=\"chips info-nav\">" + INFO.map(([k, t]) => '<a class="chip" href="' + infoUrl(k) + '" data-info="' + k + '">' + t + "</a>").join("") + "</div>";
  const first = pn.firstElementChild; pn.insertBefore(top, first); if (first) first.id = "i-method";
  const foot = pn.querySelector("footer.site-foot");
  INFO.slice(1).forEach(([k]) => { const x = document.createElement("section"); x.id = "i-" + k; x.className = "info-sec"; pn.insertBefore(x, foot); });
}
function infoLoad(k){
  const x = document.getElementById("i-" + k); if (!x || x.dataset.ok) return Promise.resolve();
  const put = h => { x.innerHTML = h.replace(/#pane-page \.page-pre/g, "#pane-method .page-pre"); x.querySelectorAll(".pfoot").forEach(f => f.remove()); x.dataset.ok = "1"; };  /* 각 쪽에 딸린 바닥글(.pfoot)은 빼고, 탭 맨 아래 바닥글 하나만 둔다 */
  const u = infoUrl(k), pp = Object.keys(PAGE_C).find(q => q === u || q.endsWith(u));
  if (pp) { put(PAGE_C[pp].h); return Promise.resolve(); }
  return fetch(u, {credentials: "same-origin"}).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => {
    const d = new DOMParser().parseFromString(t, "text/html"), q = d.querySelector("#pane-page .page-pre"); if (q) put(q.outerHTML); }).catch(() => {});
}
function infoGo(k){
  S.info = k; ensureRendered("method"); switchTab("method");
  Promise.all(["guide", "about"].map(infoLoad)).then(() => { const t = document.getElementById("i-" + k); if (t && k !== "method") t.scrollIntoView({block: "start"}); });
}
renderStrat = withFoot(renderStrat, "pane-strat", () => " ");  /* v3.43 사안별 의견 상자는 각 사안 끝에 있으므로, 꼬리말에는 메일 줄을 다시 넣지 않는다 */

/* 탭·사안 주소: #strat, #korea 같은 짧은 표식만 쓴다 */
function applyHash(){
  let h = ""; try { h = decodeURIComponent(location.hash.slice(1)); } catch(e){}
  if (!h) return;
  const ss = D.strategies || [];
  if (ss.some(c => c.id === h)) { goCase(h); return; }
  if (/^[A-Z]{3}$/.test(h) && D.countries[h]) { selectCountry(h, true); return; }  /* v3.24 나라 페이지에서 오는 주소(#RUS) */
  if (h !== "detail" && document.getElementById("pane-" + (TAB_ALIAS[h] || h))) switchTab(h);
}
/* v3.42 경로 주소: 배포본(meta app-routes)에서는 화면마다 /case/korea/, /grand/ 같은 실제 주소를 쓴다. 내부판은 예전처럼 #표식 */
const ROUTES = !!document.querySelector('meta[name="app-routes"]'); let ROUTE_FIRST = true;
const hasPage = iso => { const c = D && D.countries[iso]; return !!(c && c.tier === 1 && c.situation); };
function routeOf(){
  const t = S.tab;
  if (t === "overview") return "/";
  if (t === "strat") return "/case/" + (S.scase ? S.scase + "/" : "");
  if (t === "brief") { if (!BR) return /^\/(brief|life)\//.test(LOC()) ? LOC() : "/life/"; const c = briefCur(); return c && BR && S.bdate ? "/brief/" + c.date + "/" : "/life/"; }  /* v3.99: 국민의 삶은 /life/, 날짜별 브리핑 전문은 /brief/날짜/ */
  if (t === "feature") { const L = FEATS(), c = L.find(F => F.id === S.feat); return "/feature/" + (c && c !== L[0] ? c.id + "/" : ""); }
  if (t === "page") return LOC();
  if (t === "method") return "/" + (S.info || "method") + "/";
  if (t === "forecast" && S.ffc) return "/forecast/" + S.ffc + "/";  /* v4.22 전망별 화면 */
  if (/^(grand|ideas|forecast|industry)$/.test(t)) return "/" + t + "/";
  if (t === "detail") return S.sel && hasPage(S.sel) ? "/country/" + S.sel + "/" : "/";
  if (t === "region") return S.zone ? "/region/" + S.zone + "/" : "/";  /* v4.38 */
  return null;
}
function routeSync(rep){
  if (!ROUTES || !HASH_READY || !D) return;
  const r = routeOf(); if (!r || (r === LOC() && !location.hash && !location.search)) return;
  try { history[rep ? "replaceState" : "pushState"](null, "", enAdd(r)); } catch(e){}
  document.title = titleOf();
}
function applyRoute(){
  if (!ROUTES) return false;
  const p = LOC(), ss = D.strategies || []; let m;
  if ((m = p.match(/^\/case\/([a-z0-9-]+)\/?$/)) && ss.some(c => c.id === m[1])) { goCase(m[1]); return true; }
  if (/^\/case\/?$/.test(p)) { S.scase = null; switchTab("strat"); return true; }
  if ((m = p.match(/^\/country\/([A-Z]{3})\/?$/)) && D.countries[m[1]]) { selectCountry(m[1], true); return true; }
  if ((m = p.match(/^\/region\/([a-z-]+)\/?$/)) && zoneOf(m[1])) { goZone(m[1]); return true; }  /* v4.38 */
  if ((m = p.match(/^\/brief\/(\d{4}-\d{2}-\d{2})\/?$/))) {
    if (BR && !BR.issues.some(x => x.date === m[1])) { pageGo(enAdd(p)); return true; }
    S.bdate = m[1]; renderBrief(); switchTab("brief"); return true; }
  if (/^\/life\/?$/.test(p)) { S.bdate = null; renderBrief(); switchTab("brief"); return true; }
  if (/^\/brief\/?$/.test(p)) { switchTab("overview"); requestAnimationFrame(() => { const b = document.getElementById("brief"); if (b) b.scrollIntoView({block: "start"}); }); return true; }  /* v3.99: 정세 브리핑은 세계 정세 맨 위 */
  if (/^\/industry\/?$/.test(p)) { switchTab("industry"); return true; }
  if ((m = p.match(/^\/feature\/([\w-]+)\/?$/)) && FEATS().some(F => F.id === m[1])) { goFeat(m[1]); return true; }
  if (/^\/feature\/?$/.test(p)) { goFeat(null); return true; }
  if ((m = p.match(/^\/(method|guide|about)\/?$/))) { infoGo(m[1]); return true; }  /* v3.79 사이트 안내 탭 하나에 3개 부분 */
  if (/^\/(leader|power|subscribe)(\/|$)/.test(p)) { pageGo(enAdd(p)); return true; }
  if ((m = p.match(/^\/forecast\/(f\d+)\/?$/)) && D.forecasts.some(f => f.id === m[1])) { fcOpen(m[1]); return true; }  /* v4.22 */
  if ((m = p.match(/^\/(grand|ideas|forecast)\/?$/))) { if (m[1] === "forecast" && S.ffc) { S.ffc = null; renderForecasts(); } switchTab(m[1]); return true; }
  if (p === "/" && !location.hash) { switchTab("overview"); return true; }  /* 처음 들어온 '/'는 정세 브리핑, 화면 안에서 돌아온 '/'는 세계 정세 */
  return false;
}
addEventListener("popstate", () => { if (D && ROUTES) { HASH_READY = false; applyRoute(); HASH_READY = true; if (S.tab !== "page") document.title = titleOf(); } });
/* v3.43 새로 불러오지 않는 이동: 결정권자·사이트 안내·지난 브리핑 쪽은 내용이 자료 파일에 없고 그 쪽의 HTML에만 있다.
   링크를 누르면 그 HTML을 뒤에서 받아 글 칸(.page-pre)만 지금 화면의 pane-page에 끼우고 주소와 제목을 바꾼다. 받은 쪽은 기억해 두고 다시 받지 않는다.
   받기에 실패하거나 글 칸이 없으면 예전처럼 그 주소로 새로 연다. 쪽 안의 링크(사이트 안내의 /grand/ 등)도 같은 길로 화면 안에서 옮긴다 */
const SITE_T = document.title.split(" | ").pop();
const PAGE_C = {}; let PAGE_CUR = null, PAGE_SEQ = 0;
(function(){ const pp = document.querySelector("#pane-page .page-pre"); if (pp) { PAGE_CUR = location.pathname; PAGE_C[PAGE_CUR] = {h: pp.outerHTML, t: document.title}; } })();
function titleOf(){
  const t = S.tab, sx = " | " + SITE_T, gl = k => { const a = document.querySelector('.gnav > a[data-tab="' + k + '"]'); return a ? a.textContent.trim() : ""; };
  if (t === "page") return (PAGE_C[PAGE_CUR] || {}).t || document.title;
  if (t === "overview" || !D) return SITE_T;
  if (t === "strat") { const c = S.scase && (D.strategies || []).find(x => x.id === S.scase); return (c ? c.title : gl("strat")) + sx; }
  if (t === "brief") { const c = BR && S.bdate && briefCur(), m = c && /^(\d{4})-(\d{2})-(\d{2})/.exec(c.date); return (m ? "Briefing · " + enDate(c.date) : gl("brief")) + sx; }
  if (t === "feature") { const L = FEATS(), c = L.find(F => F.id === S.feat); return (c && c !== L[0] ? c.title : gl("feature")) + sx; }
  if (t === "detail") return S.sel && hasPage(S.sel) ? D.countries[S.sel].name_ko + ": Situation and Grand Strategy" + sx : SITE_T;
  if (t === "region") { const z = zoneOf(S.zone); return z ? z.name_ko + " Outlook" + sx : SITE_T; }  /* v4.38 */
  if (t === "forecast" && S.ffc) { const F = D.forecasts.find(f => f.id === S.ffc); if (F) return FCT.title(F.s || F.q) + sx; }  /* v4.22 */
  return (gl(t) || SITE_T) + (gl(t) ? sx : "");
}
const isPagePath = p => { if (/^\/(leader|power|subscribe)(\/|$)/.test(p)) return true; const m = /^\/brief\/(\d{4}-\d{2}-\d{2})\/?$/.exec(p); return !!(m && BR && !BR.issues.some(x => x.date === m[1])); };
function pageShow(p, x){
  ttsStop(); try { speechSynthesis.cancel(); } catch(e){}
  const pn = document.getElementById("pane-page"); pn.innerHTML = x.h;
  /* 쪽에 딸린 스크립트(결정권자 쪽의 듣기)는 innerHTML로는 돌지 않으므로 새로 만들어 붙인다. 자료용 JSON은 그대로 둔다 */
  pn.querySelectorAll("script").forEach(o => { if (o.type && !/javascript/.test(o.type)) return; const n = document.createElement("script"); n.textContent = o.textContent; o.replaceWith(n); });
  PAGE_CUR = p; switchTab("page"); document.title = x.t;
}
/* p의 쪽을 글 칸에 보인다. push: 주소 기록을 새로 쌓는다(링크), 아니면 지금 주소 그대로(뒤로 가기·첫 진입). after: 보인 뒤 할 일(스크롤 복원 등) */
function pageGo(url, push, after){
  const u = new URL(url, location.href), p = u.pathname, seq = ++PAGE_SEQ;
  const same = p === PAGE_CUR && !!document.querySelector("#pane-page .page-pre");
  const done = x => { if (seq !== PAGE_SEQ) return;
    if (push) { try { history.pushState(null, "", p + u.hash); } catch(e){} }
    const hr = HASH_READY; HASH_READY = false;
    if (same) { switchTab("page"); document.title = x.t; } else pageShow(p, x);  /* 이미 글 칸에 있는 쪽이면 다시 그리지 않는다 */
    HASH_READY = hr;
    const t = u.hash && document.getElementById(decodeURIComponent(u.hash.slice(1)));
    const pi = pwIso(p) || (pwPath(p) && /^#[A-Z]{3}$/.test(u.hash) ? u.hash.slice(1) : null);  /* v3.82 권력 구조의 나라·결정권자 쪽이면 지구본이 그 나라를 보인다 */
    requestAnimationFrame(() => { if (t) { if (t.tagName === "DETAILS") t.open = true; t.scrollIntoView({block: "start"}); } if (pi && D.countries[pi]) pwView(pi, 0); if (after) after(); updTop(); }); };
  if (PAGE_C[p]) { done(PAGE_C[p]); return; }
  document.documentElement.classList.add("pg-wait");
  fetch(p, {credentials: "same-origin"}).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => {
    const d = new DOMParser().parseFromString(t, "text/html"), pp = d.querySelector("#pane-page .page-pre"); if (!pp) throw 0;
    const x = PAGE_C[p] = {h: pp.outerHTML, t: d.title}; done(x);
  }).catch(() => { if (seq === PAGE_SEQ) location.href = u.href; }).finally(() => document.documentElement.classList.remove("pg-wait"));
}
/* 사이트 안의 링크(a href)를 화면 안에서 옮긴다. 새 창·수정 키·다른 사이트·파일은 브라우저에 맡긴다 */
const SOFT_RE = /^\/(?:$|(?:case|country|region|brief|life|industry|feature|leader|power|guide|about|subscribe|grand|ideas|method|forecast)(?:\/|$))/;
document.addEventListener("click", ev => {
  if (!ROUTES || !D || ev.defaultPrevented || ev.button || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
  const a = ev.target.closest("a[href]"); if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
  let u; try { u = new URL(a.getAttribute("href"), location.href); } catch(e){ return; }
  if (u.origin !== location.origin || !/^\/en(\/|$)/.test(u.pathname) || !SOFT_RE.test(enStrip(u.pathname)) || /\.[a-z0-9]+$/i.test(u.pathname)) return;
  if (u.pathname === location.pathname && u.hash) {  /* v3.79 쪽 안의 바로가기(권력 구조의 나라 단추): 이전 화면으로 돌아올 수 있게 기록하고, 나라면 지구본도 옮긴다 */
    const id = decodeURIComponent(u.hash.slice(1)), t = a.closest("#pane-page") && document.getElementById(id);
    if (t) { ev.preventDefault(); navPush(); t.scrollIntoView({block: "start"}); if (/^[A-Z]{3}$/.test(id)) countryView(id); }
    return;
  }
  ev.preventDefault();
  const g = a.closest("details.gmore"); if (g) g.open = false;
  if (!a.closest(".gnav")) navPush();
  if (isPagePath(enStrip(u.pathname))) { pageGo(u.href, true); return; }
  try { history.pushState(null, "", u.pathname + u.search + u.hash); } catch(e){ location.href = u.href; return; }
  HASH_READY = false; const ok = applyRoute(); HASH_READY = true;
  if (!ok) { location.href = u.href; return; }
  document.title = titleOf();
});
document.addEventListener("click", () => setTimeout(() => routeSync(false), 0));
const _switchTab = switchTab;
switchTab = function(t){
  /* v3.43 결정권자 쪽의 듣기는 예전에 쪽을 떠나면(새로 불러오면) 멈췄다. 화면 안 이동에서도 쪽을 떠날 때 멈춘다 */
  const lb = document.getElementById("ltts"); if (lb && t !== "page" && lb.getAttribute("aria-pressed") === "true") lb.click();
  _switchTab(t);
  if (VIEW0 && VIEW0.key !== viewKey()) viewRestore();  /* v3.79 사안·일정·나라로 옮긴 지구본을 그 화면을 떠나면 되돌린다 */
  if (S.mark && !VIEW0) markSet(null);
  document.querySelector(".app").classList.toggle("noglobe", S.tab === "method" || S.tab === "ideas" || S.tab === "industry" || S.tab === "feature" || (S.tab === "brief" && !S.bdate));  /* v4.19(2026-10-18 결재): 특집도 지구본 없이, 글 칸은 680px(글자 확대 반영 시 약 770px)로 가운데 */  /* v3.99(2026-10-12 결재): 산업별 미래와 국민의 삶도 지구본 없이 넓은 글 칸 */
  if (S.tab === "brief" || S.tab === "industry") fitTrends(document.getElementById("pane-" + S.tab));
  if (S.tab === "page") usfFill();  /* v3.86(2026-10-08 결재): 역사와 사상도 지구본 없이 */  /* v3.79 사이트 안내(분석 방법·이용 안내·운영자 인사말)는 지구본 없이 글만 */
  if (HASH_READY && ROUTES) routeSync(false);
  else if (HASH_READY && S.tab !== "detail") {
    const tok = S.tab === "strat" ? (S.scase || "strat") : S.tab;
    try { history.replaceState(null, "", "#" + tok); } catch(e){}
  }
  if (narrow()) {
    const pr = document.getElementById("panel").getBoundingClientRect();
    if (pr.top < 0 || (S.tab === "detail" && pr.top > innerHeight * 0.55)) document.getElementById("panel").scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"});
  }
  updTop();
};
addEventListener("hashchange", () => { if (D) applyHash(); });

/* 넓게 읽기 */
(function(){
  const b = document.getElementById("widebtn"), app = document.querySelector(".app");
  const set = on => { app.classList.toggle("wide", on); b.setAttribute("aria-pressed", on); b.title = on ? "Widen globe" : "Widen reading pane"; b.setAttribute("aria-label", b.title); store.set("ep.wide", on ? "1" : "0"); };
  set(store.get("ep.wide") !== "0");
  b.onclick = () => set(!app.classList.contains("wide"));
})();

/* v3.32 이전 화면: 칩·카드·띠·검색 결과로 화면을 옮길 때마다 직전 화면(탭, 사안, 선택한 나라·분쟁지, 스크롤 위치)을 쌓아 두고 되돌린다 */
const NAV = []; let NAV_BUSY = false;
const navBtn = document.getElementById("navback");
function navSnap(){ const pn = document.getElementById("pane-" + S.tab); return {tab: S.tab, path: S.tab === "page" ? PAGE_CUR : null, info: S.info, scase: S.scase, sel: S.sel, selFp: S.selFp, fcf: S.fcf, ffc: S.ffc || null, y: narrow() ? scrollY : (pn ? pn.scrollTop : 0)}; }
function navUpd(){ if (navBtn) navBtn.hidden = !NAV.length; }
function navPush(){
  if (NAV_BUSY || !D) return;
  const s = navSnap(), t = NAV[NAV.length - 1];
  if (t && t.tab === s.tab && t.path === s.path && t.scase === s.scase && t.sel === s.sel && t.selFp === s.selFp && t.ffc === s.ffc && Math.abs(t.y - s.y) < 40) return;
  NAV.push(s); if (NAV.length > 30) NAV.shift(); navUpd();
}
function navBack(){
  const s = NAV.pop(); navUpd(); if (!s) return false;
  const pnY = () => { const pn = document.getElementById("pane-" + s.tab); if (narrow()) scrollTo(0, s.y); else if (pn) pn.scrollTop = s.y; updTop(); };
  if (s.tab === "page" && s.path && (s.path !== PAGE_CUR || S.tab !== "page")) { pageGo(s.path, ROUTES, pnY); return true; }
  NAV_BUSY = true;
  try {
    if (s.tab === "detail" && (s.sel || s.selFp)) { if (s.sel) selectCountry(s.sel, true); else selectFp(s.selFp); }
    else {
      if (s.tab === "strat") { S.scase = s.scase; renderStrat(); }
      if (s.tab === "method") S.info = s.info;
      if (s.tab === "forecast") { if (s.fcf) S.fcf = s.fcf; S.ffc = s.ffc || null; renderForecasts(); }
      switchTab(s.tab);
    }
  } finally { NAV_BUSY = false; }
  const pn = document.getElementById("pane-" + s.tab);
  if (pn) { pn.classList.add("cv-off"); clearTimeout(pn._cv); pn._cv = setTimeout(() => cvRestore(pn), 2500); }
  requestAnimationFrame(() => { if (narrow()) scrollTo(0, s.y); else if (pn) pn.scrollTop = s.y; updTop(); });
  return true;
}
document.addEventListener("click", ev => {
  if (ev.target.closest("#navback,[data-navback]")) return;
  if (ev.target.closest(".gnav")) return;
  if (ev.target.closest("[data-futgo],[data-case],[data-fcgo],[data-feat],[data-iso],[data-fp],[data-go],[data-exit],[data-q],[data-fcf],[data-fcd],[data-golife],[data-goind],#bstrip,#srchres [data-sri]")) navPush();
}, true);
document.addEventListener("click", ev => {
  const b = ev.target.closest("#navback,[data-navback]"); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  if (!navBack() && b.dataset.prev) switchTab(b.dataset.prev);
}, true);

/* v3.33 전망 칩을 누르면 다른 탭으로 넘어가지 않고 칩 아래에 전망 문장·현재 확률·검증 시점을 펼친다. '전망과 검증에서 보기'로 넘어간다 */
let FCP = null;
function fcPopClose(){ if (FCP) { FCP.remove(); FCP = null; } }
function fcPop(chip){
  const id = chip.dataset.fc, F = D.forecasts.find(f => f.id === id); if (!F) return;
  if (FCP && FCP.dataset.for === id && FCP._chip === chip) { fcPopClose(); return; }
  fcPopClose();
  const st = {yes: "Resolved yes", no: "Resolved no", void: "Voided"}[F.status];
  const ef = chip.classList.contains("bfc-up") ? "up" : chip.classList.contains("bfc-down") ? "down" : chip.classList.contains("bfc-none") ? "none" : null;
  const EF = {up: ["↑", "Factors raising the probability"], down: ["↓", "Factors lowering the probability"], none: ["–", "No change"]};
  const el = document.createElement("div"); el.id = "fcpop"; el.dataset.for = id; el._chip = chip; el.setAttribute("role", "dialog");
  el.innerHTML = '<div class="fcp-h"><b class="fcp-s">' + esc(F.s || F.q) + "</b> · " + (st ? esc(st) : "Currently " + F.p + "%") + "<button type=\"button\" class=\"fcp-x\" aria-label=\"Close\">×</button></div><p>" + esc(F.q) + "</p>" +
    (ef ? "<p class=\"fcp-e\">This event · <b class=\"fe-" + ef + '">' + EF[ef][0] + "</b> " + EF[ef][1] + "</p>" : "") +
    "<p class=\"fcp-d\">Resolution date <span class=\"mono\">" + esc(enDate(F.due)) + '</span></p><button type="button" class="chip" data-fcgo="' + esc(id) + "\">View in Forecasts and Track Record →</button>";
  document.body.appendChild(el); FCP = el;
  const r = chip.getBoundingClientRect(), w = Math.min(340, innerWidth - 24), h = el.offsetHeight;
  el.style.width = w + "px";
  el.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + "px";
  el.style.top = (r.bottom + 8 + h > innerHeight && r.top - 8 - h > 0 ? r.top - 8 - el.offsetHeight : r.bottom + 8) + "px";
  el.querySelector(".fcp-x").onclick = fcPopClose;
}
document.addEventListener("click", ev => { if (FCP && !ev.target.closest("#fcpop,[data-fc],[data-ev]")) fcPopClose(); }, true);
document.addEventListener("keydown", ev => { if (ev.key === "Escape") fcPopClose(); });
addEventListener("scroll", fcPopClose, true); addEventListener("resize", fcPopClose);

/* v3.39 세계 시각: 1초마다 갱신(콜론 깜빡임, 움직임 줄이기 설정이면 깜빡이지 않음). 서울과 날짜가 다르면 −1일·+1일을 붙인다 */
/* 배치(2026-10-01): 서울 칸이 맨 왼쪽, 서울과 가까운 순으로 두 칸씩 오른쪽으로. 각 칸은 위가 서울에 더 가까운 도시. 세로로 먼저 채우는 그리드 */
const CLOCKS = [["Seoul/Tokyo", "Asia/Seoul"], ["Beijing/Taipei", "Asia/Shanghai"], ["Tehran", "Asia/Tehran"], ["Moscow", "Europe/Moscow"], ["Kyiv", "Europe/Kyiv"], ["Brussels", "Europe/Brussels"], ["London", "Europe/London"], ["DC/NYC", "America/New_York"]];
(function(){
  const el = document.getElementById("clocks"); if (!el || !window.Intl) return;
  const fm = {}; const F = tz => fm[tz] || (fm[tz] = new Intl.DateTimeFormat("en-US", {timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23"}));
  const D_ = {}; const Fd = tz => D_[tz] || (D_[tz] = new Intl.DateTimeFormat("en-US", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"}));
  const ymd = (tz, d) => { const p = Fd(tz).formatToParts(d), g = t => (p.find(x => x.type === t) || {}).value; return g("year") + "-" + g("month") + "-" + g("day"); };
  el.innerHTML = CLOCKS.map(([c, tz]) => '<span class="clk" data-tz="' + tz + '"><span class="c">' + c + '</span><span class="t"></span><span class="d"></span></span>').join("");
  const tick = () => { const now = new Date(), seoul = ymd("Asia/Seoul", now);
    el.querySelectorAll(".clk").forEach(x => { const tz = x.dataset.tz; const tt = F(tz).format(now); x.querySelector(".t").innerHTML = tt.slice(0, 2) + '<b class="' + (now.getSeconds() % 2 ? "off" : "") + '">:</b>' + tt.slice(3, 5); const d = ymd(tz, now); x.querySelector(".d").textContent = d === seoul ? "" : d < seoul ? "−1d" : "+1d"; }); };
  try { tick(); el.hidden = false; setInterval(() => { if (document.visibilityState === "visible") tick(); }, 1000); } catch (e) { el.hidden = true; }
  /* 검색창이 둘째 줄로 밀리면(글꼴·배율 때문에 폭이 모자랄 때) 시각을 숨겨 머리글을 한 줄로 지킨다 */
  const sb = document.getElementById("srchopen"), h1 = document.querySelector(".brand :is(h1,.bh1)");
  let lastW = 0; const top = document.querySelector(".top");
  const wrapped = () => sb.getBoundingClientRect().top > h1.getBoundingClientRect().bottom - 4;
  /* 1단계 snug(부제 숨김·검색창 축소) → 2단계 시각 묶음을 0.7배까지 축소(zoom) → 3단계 tight(숨김) */
  const fit = () => { if (!sb || !h1) return; el.classList.remove("tight"); top.classList.remove("snug"); el.style.zoom = "";  /* v4.19 매번 처음부터 맞춘다: 글꼴이 늦게 들어오면 처음 계산에서 숨긴 시각이 다시 나오지 않던 문제 */
    if (el.classList.contains("tight") || getComputedStyle(el).display === "none") return;
    if (!wrapped()) return;
    top.classList.add("snug"); if (!wrapped()) return;  /* v4.19 먼저 검색창·영문 제호를 줄이고, 그다음 시각을 0.8배까지(더 작으면 읽기 어려워 숨긴다) */
    for (let z = 0.95; z >= 0.79; z -= 0.05) { el.style.zoom = z; if (!wrapped()) return; }
    el.style.zoom = ""; el.classList.add("tight"); top.classList.remove("snug"); };
  fit(); addEventListener("resize", fit);
  if (document.fonts) { document.fonts.addEventListener("loadingdone", fit); if (document.fonts.ready) document.fonts.ready.then(fit); }
  new ResizeObserver(fit).observe(top);
})();

/* 위로 가기 */
const topBtn = document.getElementById("totop"), TOP_TX = topBtn ? topBtn.textContent : "";
function updTop(){
  if (!topBtn) return;
  const lt = mTopList(), tx = lt ? "↑ Back to list" : TOP_TX; if (topBtn.textContent !== tx) topBtn.textContent = tx; topBtn.classList.toggle("totop-l", !!lt);
  if (lt) { topBtn.hidden = false; return; }
  if (narrow()) { const p = document.getElementById("panel"); topBtn.hidden = !(scrollY > p.offsetTop + 900); }
  else { const a = document.getElementById("pane-" + S.tab); topBtn.hidden = !(a && a.scrollTop > 900); }
}
document.getElementById("panel").addEventListener("scroll", updTop, true);
addEventListener("scroll", updTop, {passive:true});
topBtn.onclick = () => {
  const lt = mTopList(); if (lt) { lt.scrollIntoView({block: "start", behavior: reduceMotion ? "auto" : "smooth"}); setTimeout(updTop, 600); return; }
  if (narrow()) document.getElementById("panel").scrollIntoView({block:"start"});
  else { const a = document.getElementById("pane-" + S.tab); if (a) a.scrollTop = 0; }
  updTop();
};

/* 주소 복사 */
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-copy]"); if (!b) return;
  const v = b.dataset.copy, old = b.textContent;
  const done = ok => { b.textContent = ok ? "Copied" : "Address selected"; setTimeout(() => b.textContent = old, 1600); };
  const sel = () => { const m = b.parentElement.querySelector(".mail"); if (m) { const r = document.createRange(); r.selectNodeContents(m); const w = getSelection(); w.removeAllRanges(); w.addRange(r); } done(false); };
  try { navigator.clipboard.writeText(v).then(() => done(true), sel); } catch(e){ sel(); }
});
})();
/* v4.32(2026-10-23 결재, 머리말 제목 중복 정리): 쪽의 제목 h1이 있는 쪽(국가·권력 구조·특집·브리핑 등)에서는 머리글의 사이트 이름(p.bh1)이 제목이 아니다.
   탭 화면(전망과 검증·전략 분석 등)처럼 보이는 h1이 없으면 사이트 이름을 1단계 제목(role=heading)으로 알려 화면 읽기 프로그램이 제목 없이 두지 않게 한다 */
(function(){ const b = document.querySelector(".brand .bh1"); if (!b) return;
  const sync = () => { const other = [...document.querySelectorAll("h1")].some(h => h.offsetParent !== null);
    if (other) { b.removeAttribute("role"); b.removeAttribute("aria-level"); } else { b.setAttribute("role", "heading"); b.setAttribute("aria-level", "1"); } };
  let t = 0; new MutationObserver(() => { clearTimeout(t); t = setTimeout(sync, 150); }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"]});
  sync(); })();

