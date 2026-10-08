
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
if (store.get("ep.legoff") === "1") document.documentElement.classList.add("legoff");

const LAYERS = {
  focus:{label:"Analytical focus", desc:"Darker shading means more strategic analyses and forecasts involving the country."},
  risk:{label:"Risk", desc:"Judgment score. Higher means a greater risk of armed conflict or regime instability."},
  mil:{label:"Military power", desc:"Judgment score. Relative military capability on a global scale (U.S. = 100). Figures under country names are active-duty personnel (IISS) and estimated nuclear warheads (SIPRI)."},
  pol:{label:"Political stability", desc:"Judgment score. Higher means a more stable government and policy direction."},
  econ:{label:"Economic weight", desc:"Judgment score. Size of the economy and resilience to shocks."}
};
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
  if (BR) BR.issues.forEach(x => x.items.forEach(i => add("Briefings", fmtKD(x.date) + " · " + i.h, [i.fact, i.link], () => { goBrief(x.date); return "pane-brief"; })));
  /* v3.52 전망 검색(2026-10-05): 짧은 이름과 확률을 제목으로, 사안·분쟁 지점·나라 이름과 '가능성·확률·전망' 같은 말을 본문에 넣어 "러우 전쟁 휴전 가능성" 같은 물음에 전망이 잡히게 한다. 누르면 전망과 검증의 해당 항목으로 간다 */
  D.forecasts.forEach(f => { const c = (D.strategies || []).find(x => x.fp === f.fp), fp = D.flashpoints.find(x => x.id === f.fp);
    add("Forecasts", (f.s || f.q) + " · " + (f.status === "open" ? f.p + "%" : f.status === "yes" ? "Resolved yes" : f.status === "no" ? "Resolved no" : "Voided"),
      [f.q, f.basis, f.void || "", c ? cshort(c) : "", fp ? fp.name_ko : "", (f.countries || []).map(nm).join(" "), "chance probability forecast resolution " + (f.due || "")],
      () => { S.fcf = "all"; renderForecasts(); switchTab("forecast"); const li = document.querySelector('#f-all li[data-fid="' + f.id + '"]'); if (li) { if (!li.id) li.id = "fc-" + f.id; return li.id; } return "pane-forecast"; });
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
  if (!R.length) { box.innerHTML = '<div class="srch-empty">No results for ‘' + esc(q) + "’. Try a shorter word or a different name.<div class=\"chips\" style=\"margin-top:10px\">" + SR_EX.map(x => '<button type="button" class="chip" data-srq="' + esc(x) + '">' + esc(x) + "</button>").join("") + "</div></div>"; return; }
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
  if (!SR.LD && !SR.ldw) { SR.ldw = 1; fetch("/en/data/search_leaders.json").then(r => r.ok ? r.json() : Promise.reject()).then(j => { SR.LD = j; SR.idx = null; if (!$("#srch").hidden) { srBuild(); srRender(); } }).catch(() => { SR.ldw = 0; }); }
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
const BRIEF_P = fetch("/en/data/daily.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
/* v3.86(2026-10-08 결재) 미군 해외 배치는 data/posture.json(매주·매월 예약 작업이 고침)을 따로 받아 자료에 붙인다. 못 받으면 미군 배치 없이 연다 */
const POSTURE_P = fetch("/en/data/posture.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
fetch("/en/data/eurasia.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => POSTURE_P.then(p => { if (p && p.res && p.fleet && p.events) d.posture = p; else delete d.posture; return d; })).then(d => { init(d); return fetch("/data/world-50m.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }); }).then(w => initGlobe(w)).catch(err => {
  console.error(err);
  const l = $("#loading"); if (l) l.textContent = "Couldn’t load the data. Please refresh the page.";
});
const RENDERED = {};
const markR = (t, f) => function(){ RENDERED[t] = true; return f.apply(this, arguments); };
renderStrat = markR("strat", renderStrat); renderForecasts = markR("forecast", renderForecasts); renderGrand = markR("grand", renderGrand); renderIdeas = markR("ideas", renderIdeas); renderMethod = markR("method", renderMethod); renderFeature = markR("feature", renderFeature); renderDiscuss = markR("discuss", renderDiscuss);
const TAB_RENDER = {brief: () => renderBrief(), strat: () => renderStrat(), forecast: () => renderForecasts(), grand: () => renderGrand(), ideas: () => renderIdeas(), method: () => renderMethod(), feature: () => renderFeature(), discuss: () => renderDiscuss()};
function ensureRendered(t){ if (D && TAB_RENDER[t] && !RENDERED[t]) TAB_RENDER[t](); }

const PUB = () => !!(D && D.meta && D.meta.edition === "public");
function initGlobe(w){
  if (!D) return;
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
  (D.strategies || []).forEach(c => { (c.deciders ? c.deciders.items : []).forEach(d => addF(d.iso, 3)); const r = String(c.recipient || ""); addF(r.includes("Ukraine") ? "UKR" : r.includes("Taiwan") ? "TWN" : "KOR", 3); });
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
  if (!HASH0) switchTab("brief");
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
  const col = ramp(S.layer, S.layer === "focus" ? (FOCUS[f.iso] || 0) : (c.scores ? c.scores[S.layer] : 50));
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
  const legOff = off => { document.documentElement.classList.toggle("legoff", off); store.set("ep.legoff", off ? "1" : "0"); $("#legbtn").setAttribute("aria-expanded", !off); };
  if (!narrow()) $("#legbtn").setAttribute("aria-expanded", !document.documentElement.classList.contains("legoff"));
  $("#legbtn").onclick = () => { if (!narrow()) { legOff(false); return; } const L = $("#legend"), o = !L.classList.contains("open"); L.classList.toggle("open", o); $("#legbtn").setAttribute("aria-expanded", o); };
  $("#legend").addEventListener("click", e => { if (!e.target.closest("[data-legx]")) return; if (narrow()) { $("#legend").classList.remove("open"); $("#legbtn").setAttribute("aria-expanded", false); } else legOff(true); });
  $("#lensoff").onclick = () => setLens(null);
  document.querySelectorAll(".gnav [data-tab]").forEach(b => b.onclick = e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); const g = b.closest("details"); if (g) g.open = false; const t = b.dataset.tab; navMark(TAB_ALIAS[t] || t); /* v3.74 누르기 반응(웹 분석 INP 최대 672ms): 메뉴 표시를 먼저 그리고, 무거운 화면 그리기는 다음 차례로 미룬다 */ requestAnimationFrame(() => setTimeout(() => { if (t === "strat") { S.scase = null; caseMark(); } if (t === "brief" && S.bdate) { S.bdate = null; renderBrief(); } switchTab(t); }, 0)); });
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
    if (fcb) { fcPopClose(); fcb.dataset.fc = fcb.dataset.fcgo; S.fcf = "all"; renderForecasts(); switchTab("forecast"); const li = document.querySelector('#f-all li[data-fid="' + fcb.dataset.fc + '"]'); if (li) { li.scrollIntoView({block:"center", behavior: reduceMotion ? "auto" : "smooth"}); li.classList.add("srch-hit"); setTimeout(() => li.classList.add("fade"), 1600); setTimeout(() => li.classList.remove("srch-hit", "fade"), 3000); } return; }
    const ff = ev.target.closest("[data-fcf]");
    if (ff) { S.fcf = ff.dataset.fcf; renderForecasts(); const a = document.getElementById("f-all"); if (a) a.scrollIntoView({block:"start"}); return; }
    const jb = ev.target.closest("[data-jump]");
    if (jb) { const t = document.getElementById(jb.dataset.jump); if (t) t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); return; }
    const x = ev.target.closest("[data-exit]");
    if (x) { const k = (D.strategies || []).find(c => c.fp === x.dataset.exit); if (k) { goCase(k.id); const fu = caseFill(k.id); if (fu) fu.open = true; } else switchTab("strat"); const d = document.getElementById("exc-" + x.dataset.exit); if (d) { d.open = true; d.scrollIntoView({block:"start"}); } return; }
    const cgb = ev.target.closest("[data-cg]");  /* v3.81 핵심 판단의 의회 변수 → 그 사안의 '의회의 쟁점' */
    if (cgb) { const [cid, i] = cgb.dataset.cg.split(":"), d = caseFill(cid); if (d) d.open = true; const t = document.getElementById("cg-" + cid + "-" + i);
      if (t) { t.open = true; t.scrollIntoView({block:"start", behavior: reduceMotion ? "auto" : "smooth"}); t.classList.add("srch-hit"); setTimeout(() => t.classList.add("fade"), 1600); setTimeout(() => t.classList.remove("srch-hit", "fade"), 3000); } return; }
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
  else if (h.iso && D.countries[h.iso]) { const c = D.countries[h.iso]; html = "<b>" + esc(c.name_ko) + '</b> <span class="m">' + esc(c.region) + "</span><br>" + (S.layer === "focus" ? "Related forecasts: <span class=\"num\">" + (FCN[c.iso] || 0) + "</span>" : LAYERS[S.layer].label + ' <span class="num">' + (c.scores ? c.scores[S.layer] : "—") + "</span>") + '<br><span class="m">' + esc(shortLeader(c.leader)) + "</span>"; }
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
  const k = t === "detail" ? "overview" : t === "page" ? ((LOC().match(/^\/(leader|power|guide|brief|about)/) || [])[1] || "") : t;
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
  if (t === "method" && typeof infoLoad === "function") { if (!S.info) S.info = "method"; setTimeout(() => { infoLoad("guide"); infoLoad("about"); }, 0); }
  if (!document.getElementById("pane-" + t)) t = "overview";
  S.tab = t; if (t !== "detail") store.set("ep.tab", t);
  ensureRendered(t);
  navMark(t);
  document.querySelectorAll(".pane").forEach(p => p.hidden = p.id !== "pane-" + t);
  document.getElementById("pane-" + t).scrollTop = 0;
}
function renderLegend(){
  if (!C.risk) return;
  const L = LAYERS[S.layer], stops = [0, .25, .5, .75, 1].map(v => C[S.layer](v)).join(",");
  const line = (col, dash, w) => { w = w || 26; return '<svg width="' + w + '" height="8" aria-hidden="true"><line x1="1" y1="4" x2="' + (w - 1) + '" y2="4" stroke="' + col + '" stroke-width="2"' + (dash ? ' stroke-dasharray="5 4"' : "") + "/></svg>"; };
  const tk = S.layer === "focus" ? "<span>Fewer</span><span></span><span>More</span>" : "<span>0</span><span>50</span><span>100</span>";
  const sw = (k, on, body) => '<button type="button" class="mt" data-mt="' + k + '" aria-pressed="' + on + '"><span class="sw" aria-hidden="true"></span>' + body + "</button>";
  $("#legend").classList.toggle("usfon", !!(S.showUsf && D && D.posture));
  $("#legend").innerHTML = "<button type=\"button\" class=\"legx\" data-legx aria-label=\"Collapse\" title=\"Collapse\">×</button>" +
    "<div><label class=\"lt\" for=\"lysel\">Color the globe by</label><select id=\"lysel\">" + Object.keys(LAYERS).map(k => '<option value="' + k + '"' + (k === S.layer ? " selected" : "") + ">" + LAYERS[k].label + "</option>").join("") + '</select><div class="ld">' + L.desc + "</div></div>" +
    '<div class="ramp" style="background:linear-gradient(90deg,' + stops + ')"></div><div class="ticks">' + tk + "</div>" +
    "<div class=\"keys\"><div class=\"lt\">Show or hide</div>" +
      sw("edge", S.showEdge, '<span class="kk2"><span class="kk">' + line(C.coop, false, 18) + "Cooperation/alliance</span><span class=\"kk\">" + line(C.conflict, true, 18) + "Confrontation/clashes</span></span>") +
      sw("fp", S.showFp, '<span class="kk"><svg width="26" height="12" aria-hidden="true"><circle cx="13" cy="6" r="5" fill="' + C.conflict + '" stroke="' + C.halo + "\" stroke-width=\"1.5\"/></svg>Flashpoints (size = severity)</span>") +
      '<div class="kk" style="padding-left:30px"><svg width="26" height="10" aria-hidden="true"><rect x="3" y="1" width="20" height="8" rx="1" fill="' + C.landOut + '" stroke="' + C.line + "\"/></svg>Not covered</div>" +
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
    changes: '<div class="usf-card"><ul class="usf-ev">' + ev + "</ul><p class=\"m\">Grades: Official (government announcement), Law (statute), Secondary (government confirmation reported by an analytical institution), Reported (media reports, including anonymous officials). Numbers match the symbols on the globe.</p></div>"
  };
}
function usfFill(){  /* 미국의 군 쪽이 글 칸에 있으면 배치·태세 변화 칸을 채운다 */
  const a = document.getElementById("usf-deploy"), b = document.getElementById("usf-changes");
  if (!D || !(a || b) || (a && a.dataset.done)) return;
  if (!D.posture) { [a, b].forEach(x => { if (x) x.textContent = "Could not load U.S. deployment data. Please refresh the page."; }); return; }
  const x = usfParts(); if (a) { a.innerHTML = x.deploy; a.dataset.done = 1; } if (b) b.innerHTML = x.changes;
}
function insightsHtml(){
  const cs = D.strategies || [];
  return (D.insights || []).length ? "<section class=\"sec\" id=\"s-ins\"><h3>Key assessments " + ttsBtn("ins") + "</h3><p class=\"note\" style=\"margin-bottom:8px\">Listed first are the assessments in which Clisa Geopolitics reaches conclusions that differ from the conventional view. Select a chip to see the forecasts tied to an assessment, or the button below to go to the analysis of that issue.</p><ol class=\"ic-list\">" + D.insights.map((k, n) => { const c = cs.find(x => x.id === k.case); const m = enHead(k.t); const head = m ? m[1] : k.t, rest = m ? m[2] : "";
      return '<li class="ic ic-' + esc(k.case) + '"><div class="ic-top"><span class="ic-n">' + (n + 1) + '</span>' + (c ? '<span class="ic-case">' + esc(c.title.split(":")[0]) + "</span>" : "") + (k.fc || []).map(id => { const F = D.forecasts.find(f => f.id === id); return '<button type="button" class="fcchip" data-fc="' + esc(id) + '" title="' + esc(F ? F.q : "") + '">' + fcLab(F, id, F ? F.p : null) + "</button>"; }).join("") + '</div><p class="ic-h">' + esc(head) + "</p>" +
        (rest ? "<p class=\"ic-why\"><b>Reasoning</b> " + esc(rest) + "</p>" : "") + (c || k.feature ? '<div class="chips" style="margin:0">' + (k.feature ? FEATS().filter(F => F.id === k.feature).map(featBtn).join("") : "") + (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + "\">View analysis · " + esc(c.title.split(":")[0]) + "</button>" : "") + "</div>" : "") + "</li>"; }).join("") + "</ol></section>" : "";
}
/* v3.20 정세 브리핑: data/daily.json(평일 갱신)을 따로 읽는다. 없으면 아무것도 보이지 않는다. */
let BR = null; const HASH0 = location.hash;
const PIN = '<svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M5 0a5 5 0 0 0-5 5c0 3.6 5 7 5 7s5-3.4 5-7a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg>';  /* v3.83 위치 아이콘: 누르면 지구본이 그곳을 보이는 이름 끝에 붙인다(2026-10-08 결재) */
const FCE = {up:["↑","Factors raising the probability"], down:["↓","Factors lowering the probability"], none:["–","No change"]};
const fmtKD = s => enDate(s, true);
function dailyIssue(x){
  const fc = f => { const F = D.forecasts.find(z => z.id === f.id), e = FCE[f.e] || FCE.none;
    return '<button type="button" class="fcchip bfc bfc-' + esc(f.e) + '" data-fc="' + esc(f.id) + '" title="' + esc((F ? F.q + " · " : "") + e[1]) + '">' + fcLab(F, f.id, F ? F.p : null) + ' <b aria-hidden="true">' + e[0] + '</b><span class="sr">' + e[1] + "</span></button>"; };
  const cs = id => { const c = (D.strategies || []).find(k => k.id === id); return c ? '<button type="button" class="chip" data-case="' + esc(id) + '">' + esc(c.title.split(":")[0]) + "</button>" : ""; };
  return x.items.map((i, n) => '<article class="bi"' + (x === (BR.issues || [])[0] ? ' id="bi-' + n + '"' : "") + '><h4>' + (i.loc ? '<button type="button" class="bh" data-bloc="' + esc(x.date) + "|" + n + "\" title=\"Show on the globe\">" + esc(i.h) + PIN + "</button>" : esc(i.h)) + "</h4><p>" + esc(i.fact) + "</p><p class=\"bl\"><span class=\"bl-k\">Bearing on the assessments</span>" + esc(i.link) + "</p>" +
      '<div class="chips" style="margin:0">' + cs(i.case) + (i.fc || []).map(fc).join("") + "</div>" +  /* v3.83 장소가 있는 꼭지는 제목을 누르면 지구본이 그곳을 보인다(2026-10-08 결재, 위치 보기 단추를 대신함) */
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
  const li = it => { const F = D.forecasts.find(z => z.id === it.id); return '<li data-fid="' + esc(it.id) + '"><button type="button" class="fcchip" data-fc="' + esc(it.id) + '" title="' + esc(F ? F.q : "") + '">' + (F && F.s ? '<span class="fcs">' + esc(F.s) + "</span>" : esc(it.id)) + '</button> <span class="pp">' + (it.from === it.to ? it.to + "% (unchanged)" : it.from + "% → " + it.to + "%") + "</span><p>" + esc(it.why) + "</p></li>"; };
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
  if (k === "brief" && BR) { const x = briefCur(); return "Briefing, " + enDate(x.date) + ". " + x.items.map(i => i.h + ". " + i.fact).join(" ")  /* v3.38b(2026-10-01): 듣기에서는 '판단과의 연결'을 읽지 않는다. 결론 번호·전망 번호 같은 화면용 표현이 귀로는 어색하기 때문 */ + ((x.more || []).length ? " Other developments. " + x.more.map(m => m.t).join(" ") : ""); }
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
  if (k === "th") return "Key thinkers. " + (D.thinkers || []).map(x => x.name + ". " + (x.idea || "") + " " + (x.now || "") + " " + (x.record || "")).join(" ");
  if (k === "case") { const c = (D.strategies || []).find(z => z.id === id); if (!c) return ""; const B = c.brief || {}; /* v3.75 사안 요약 듣기에 화면 순서대로 '가장 유력한 전개'와 '상대편에서 본 최선의 수'를 넣는다(빠져 있어 건너뛰던 것, 2026-10-07). 괄호 속 보충은 읽지 않는다 */
    const top = ((c.futures || {}).items || []).slice().sort((x, y) => y.p - x.p)[0], W = (c.counter || [])[0];
    return c.title + ". " + (B.q ? "The question. " + B.q + (/[.?!]$/.test(B.q) ? " " : "? ") : "") + (B.a ? "Assessment. " + B.a + " " : "") + (top ? "Most likely outcome. " + top.name + ", " + top.p + " percent. " : "") + (W && W.ranked && W.ranked[0] ? "The other side’s best move. " + W.name.replace(/\s*\(.*\)\s*$/, "") + ". " + ttsNoParen(W.ranked[0].t) + " " : "") + (B.eq ? "The likely outcome. " + B.eq + " " : "") + (B.human ? "What it means for people. " + B.human : ""); }
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
  const parts = ttsSplit(t);
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
    const key = b.dataset.tts, n = window.ttsPick(e.target, ttsSplit(ttsText(key))); if (n < 0) return;
    ttsStop(); TTS.pos[key] = n; ttsToggle(b);
  });
  addEventListener("pagehide", () => ttsStop());
}
/* v3.43d 듣기 따라가기: 문장을 읽기 시작할 때마다 그 문장이 든 문단을 찾아 옅은 바탕색으로 표시하고 화면 가운데로 스크롤한다.
   듣기용 글은 화면 글과 조금 다르므로(퍼센트·괄호 생략 등) 문장 앞·가운데·끝 조각으로 찾고, 찾지 못하면 직전 위치에 머문다.
   접힌 곳(details) 안이면 펼친다. 손으로 스크롤하면 10초 동안 따라가기를 멈춘다(표시는 계속). 결정권자 쪽 듣기도 window.ttsFollow로 같이 쓴다 */
const TF = {scope: null, blocks: [], last: -1, el: null, hold: 0};
const tfNorm = t => String(t).replace(/percent/gi, "").replace(/[^0-9A-Za-z가-힣]/g, "");
const TF_SEL = "p,li,dd,dt,h1,h2,h3,h4,h5,td,th,summary,blockquote", TF_LEAF = TF_SEL + ",div";
/* 범위: 단추가 든 탭(또는 결정권자 쪽 글 칸) 전체의 맨 안쪽 글 칸들. 찾기는 단추 바로 뒤의 칸에서 시작한다 */
function tfStart(scope, btn){
  tfEnd(); if (!scope) return;
  TF.scope = scope;
  /* 맨 안쪽 칸은 글 전체, 안에 칸을 품은 칸(<li><b>제목</b><p>설명</p>)은 제 몫의 글(제목)만 */
  const own = e => [...e.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.matches(TF_LEAF) && !n.querySelector(TF_LEAF))).map(n => n.textContent).join(" ");
  TF.blocks = [...scope.querySelectorAll(TF_LEAF)].filter(e => !e.closest("button")).map(e => ({e, t: tfNorm(e.querySelector(TF_LEAF) ? own(e) : e.textContent)})).filter(x => x.t.length > 1);
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
function briefCur(){ return BR && ((BR.issues || []).find(x => x.date === S.bdate) || BR.issues[0]); }
function renderBrief(){
  const el = $("#pane-brief"); if (!el) return;
  if (!BR || !(BR.issues || []).length) { el.innerHTML = "<div class=\"sec\"><h2>Briefing</h2><p class=\"note\">Loading the briefing…</p></div>"; return; }
  const cur = briefCur(), others = BR.issues.filter(x => x !== cur);
  el.innerHTML = "<section class=\"sec dbrief\" id=\"brief\"><div class=\"bh\"><h2>Briefing</h2><span class=\"bd\">" + enDate(cur.date) + "</span>" + ttsBtn("brief") + "</div>" +
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
  S.bdate = null; renderBrief(); switchTab("brief"); const a = document.getElementById("bi-" + x.j) || document.getElementById("brief");
  if (a) { a.scrollIntoView({block: a.id === "brief" ? "start" : "center", behavior: reduceMotion ? "auto" : "smooth"}); if (a.id !== "brief") { a.classList.add("hl"); setTimeout(() => a.classList.remove("hl"), 2000); } }
}
function runStrip(st, list){
  const bt = st.querySelector(".bs-t"), bn = st.querySelector(".bs-n"), bk = st.querySelector(".bs-k"), bd = st.querySelector(".bs-d");
  let k = 0, hold = false;
  const show = () => { const L = list(), N = L.length; if (!N) { st.hidden = true; return; } k = k % N; const x = L[k]; bt.textContent = x.t || ""; bk.textContent = x.k || ""; bd.textContent = x.d ? fmtKD(x.d) : ""; bn.textContent = N > 1 ? (k + 1) + "/" + N : ""; st.hidden = false; };
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
    BR = b; const cur = b.issues[0];
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
function renderOverview(){
  if (!D) return;
  const fps = D.flashpoints.slice().sort((a, b) => b.severity - a.severity || String(b.last_major_event?.date).localeCompare(String(a.last_major_event?.date)));
  $("#pane-overview").innerHTML = dueHtml() +
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
    (compact ? "" : '<div class="b">' + esc(f.basis) + "</div>") + (f.void && !compact ? "<div class=\"vr\">Voided · " + esc(f.void) + "</div>" : "") +
    '<div class="foot"><span class="mono fid">' + esc(f.id) + '</span><span class="st ' + st[0] + '">' + st[1] + "</span><span>Resolution date <span class=\"mono\">" + esc(enDate(f.due)) + "</span></span>" + (compact ? "" : fcHist(f.id) + '<span class="chips" style="margin:0">' + f.countries.map(chip).join("") + "</span>") + "</div></div></li>";
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
    back + '<div class="sec"><p class="eyebrow">' + esc(c.region) + (c.tier === 1 ? "" : " · Short profile") + '</p><h2 style="margin-top:4px">' + esc(c.name_ko) + " " + (c.situation ? ttsBtn("country:" + c.iso) : "") + '</h2><p class="meta" style="margin-top:4px">' + esc(c.leader) + "</p>" + leaderLink(c.iso, "Decision-maker analysis · ") + " " + powerLink(c.iso, "Power structure · ") + "</div>" +
    '<p class="lead">' + esc(c.situation) + "</p>" + gsBlock(c) + countryIntentHtml(c) + countryPublicsHtml(c) + histBlock(c) +
    "<section class=\"sec\"><h3>Judgment scores <span style=\"font-weight:400\">(0–100)</span></h3><div class=\"scores\">" + JLAYERS.map(k =>
      '<div class="score"><span' + (k === S.layer ? ' style="font-weight:600"' : "") + ">" + LAYERS[k].label + '</span><span class="track" style="height:8px;background:var(--panel-2);border-radius:2px;overflow:hidden"><span style="display:block;height:100%;width:' + c.scores[k] + "%;background:" + ramp(k, c.scores[k]) + ';border-radius:0 4px 4px 0"></span></span><span class="mono" style="text-align:right;font-size:12px">' + c.scores[k] + "</span></div>").join("") + "</div></section>" +
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
    (fps.length ? "<section class=\"sec\"><h3>Related flashpoints</h3><div class=\"chips\" style=\"margin:0\">" + fps.map(f => '<button type="button" class="chip" data-fp="' + esc(f.id) + '">' + esc(f.name_ko) + "</button>").join("") + "</div></section>" : "") +
    (fcs.length ? "<section class=\"sec\"><h3>Related forecasts</h3><ul class=\"list\">" + fcs.map(f => forecastRow(f, true)).join("") + "</ul><p class=\"note\" style=\"margin-top:8px\"><button type=\"button\" class=\"chip\" data-go=\"forecast\">All forecasts</button></p></section>" : "") +
    ((c.uncertain || []).length ? "<details class=\"src\"><summary>Unverified · " + c.uncertain.length + "</summary><ul>" + c.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") +
    "<details class=\"src\"><summary>Sources · " + (c.sources || []).length + "</summary><ul>" + (c.sources || []).map(srcItem).join("") + "</ul></details>";
}
function countryIntentHtml(c){
  const v = c.intent; const cases = (D.strategies || []).filter(k => k.deciders && k.deciders.items.some(d => d.iso === c.iso));
  if (!v && !cases.length) return "";
  const row = x => '<tr><td><span class="sw ' + x.w + '">' + (x.w === "said" ? "Said" : "Did") + '</span></td><td class="mono">' + esc(enDate(x.date)) + "</td><td>" + esc(x.k) + "</td><td>" + esc(x.t) + (x.url ? ' <a href="' + esc(x.url) + "\" target=\"_blank\" rel=\"noopener\">Original</a>" : "") + "</td></tr>";
  const sig = v ? v.signals.slice().sort((a, b) => a.w === b.w ? String(b.date).localeCompare(String(a.date)) : (a.w === "said" ? -1 : 1)) : [];
  return "<section class=\"sec\" id=\"c-intent\"><h3>Intent indicators · words and deeds</h3>" + (v ? '<p><span class="fit ' + fitCls(v.fit) + '">' + esc(ev(v.fit)) + '</span></p><div class="tbl-wrap intent-c"><table class="tbl" style="min-width:480px"><tbody>' + sig.map(row).join("") + '</tbody></table></div><p style="font-size:13px;color:var(--ink)">' + esc(v.read) + "</p>" : "") +
    (cases.length ? "<p class=\"note\" style=\"margin-top:6px\">Strategic analyses in which this country is a decision-maker · " + cases.map(k => '<button type="button" class="chip" data-case="' + esc(k.id) + '">' + esc(k.title.split(":")[0]) + "</button>").join(" ") + "</p>" : "") + "</section>";
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
  const L = S.layer === "focus" ? "risk" : S.layer;
  const top = Object.values(D.countries).filter(c => !c.offmap && c.scores).sort((a, b) => b.scores[L] - a.scores[L]).slice(0, 10);
  return "<div class=\"layer-sw\" role=\"radiogroup\" aria-label=\"Globe view\">" + Object.keys(LAYERS).map(k => '<button type="button" role="radio" class="chip' + (k === S.layer ? " on" : "") + '" aria-checked="' + (k === S.layer) + '" data-layer="' + k + '">' + LAYERS[k].label + "</button>").join("") + "</div>" +
    '<p class="note" style="margin:8px 0">' + LAYERS[L].label + ": top 10 countries · " + esc(LAYERS[L].desc) + '</p><div class="bars">' + top.map(c =>
      '<button type="button" class="bar" data-iso="' + c.iso + '"><span>' + esc(c.name_ko) + '</span><span class="track"><span class="fill" style="display:block;width:' + c.scores[L] + "%;background:" + ramp(L, c.scores[L]) + '"></span></span><span class="v">' + c.scores[L] + "</span></button>").join("") + "</div>";
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
    tocHtml([["g-scn","Scenarios"],["g-trend","Structural trends"],["g-mx","Relationship matrix"],["g-drv","Drivers of grand strategy"],["g-ten","History and structure"],["g-score","Country scores"]]) +
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
    "<section class=\"sec\" id=\"g-score\"><h3>Country judgment scores and globe views</h3><p class=\"note\" style=\"margin-bottom:8px\">By default, the globe is colored by analytical focus. The four scores below are judgment estimates, not measured values, and are offered as supplementary material.</p><div id=\"scorebox\">" + scoreBoxHtml() + "</div></section>" +
    "<section class=\"sec\"><h3>Grand strategy by country</h3><div class=\"chips\" style=\"margin:0\">" + Object.values(D.countries).filter(c => c.gs).map(c => chip(c.iso)).join("") + "</div></section>" +
    "";
}
const FP_AN = {"rus-ukr":"rus-ukr", "iran-war":"iran-war", "taiwan-strait":"taiwan", "korea":"korea-deal"};
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
  return '<section class="stp">' + stpH(n, "Decision-Maker Analysis") + "<p class=\"note\">For each country with decision-making power, this section sets out, from that country’s own perspective, how it defines the problem, what it seeks to achieve, which means it uses, and how it is likely to respond to the strategic actor’s options, then compares each country’s preferred outcomes in a single table. Intent is assessed by separating words from costly actions.</p>" +
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
    "<h3 style=\"margin:6px 0 0\">Preferred outcomes by country</h3><div class=\"tbl-wrap\"><table class=\"tbl pref\" style=\"min-width:560px\"><thead><tr><th>Country</th>" + O.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span> " + esc(fn[k]) + "</th>").join("") + "</tr></thead><tbody>" +
      X.items.map(d => "<tr><td><b>" + esc(nm(d.iso)) + '</b><br><span class="note">' + esc(ev(d.power)) + "</span></td>" + O.map(k => { const v = d.pref[k]; return '<td><span class="lv ' + lvc[v[0]] + '">' + esc(ev(v[0])) + '</span><span class="why">' + esc(v[1]) + "</span></td>"; }).join("") + "</tr>").join("") +
    '</tbody></table></div><p class="note">' + esc(X.syn.note) + '</p><ol class="synth">' + X.syn.reads.map(r => "<li><b>" + esc(r.t) + "</b><span>" + esc(r.d) + "</span></li>").join("") + "</ol>" + congHtml(c) + "</section>";
}
/* v3.54 의회의 쟁점: 결정권자의 결정에 의회가 조건·동의·거부권을 행사하는 쟁점(사안 쪽 3단계 끝) */
let CGF = null;
document.addEventListener("toggle", e => { const d = e.target; if (!d.open || !d.matches || !d.matches("details.cgf[data-fk]") || d.dataset.on) return; d.dataset.on = "1";
  const put = () => { const p = d.querySelector("p"); if (p) p.textContent = (CGF && CGF[d.dataset.fk]) || "Could not load the summary. Select the meeting name to view the original."; };
  if (CGF) put(); else fetch("/data/cg_speakers.json").then(r => r.ok ? r.json() : {}).then(j => { CGF = j; put(); }).catch(() => { CGF = {}; put(); }); }, true);
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
  const base = {}; c.wellbeing.groups.forEach(g => base[g.k] = g.score);
  const gname = {}; c.wellbeing.groups.forEach(g => gname[g.k] = g.name);
  const pb = key => '<div class="pbar" role="img" aria-label="' + F.items.map(f => f.id + " " + f[key] + "%").join(", ") + '">' + F.items.map(f => '<i style="flex:' + f[key] + ' 0 0;background:' + fcol(f.id) + '">' + f.id + " " + f[key] + "%</i>").join("") + "</div>";
  const cell = (f, g, k) => {
    if (f.score) return fmt(f.score[g][k]) + wdl(f.score[g][k], base[g][k]);
    const a = f.score_bad[g][k], b = f.score_good[g][k];
    return a == null ? "—" : fmt(a) + " ~ " + fmt(b);
  };
  const rg = r => r ? ' <span class="rng">(' + r[0] + "~" + r[1] + ")</span>" : "";
  const ftab = f => "<div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:440px\"><thead><tr><th>2030</th>" + WDIM.map(([k, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" +
    Object.keys(base).map(g => "<tr><td>" + esc(gname[g]) + "</td>" + WDIM.map(([k]) => '<td class="mono">' + cell(f, g, k) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  return '<section class="stp">' + stpH(n, "Possible outcomes and external variables") + '<p class="note">' + esc(F.note) + "</p>" +
    '<div class="pstack"><div class="prow"><span>' + (F.rec_same ? "Probability" : "Current trend") + "</span>" + pb("p") + "</div>" + (F.rec_same ? "" : "<div class=\"prow\"><span>If recommendations are followed</span>" + pb("p_rec") + "</div>") + "</div>" +
    '<div class="futs">' + F.items.map(f => '<article class="fut" id="fut-' + esc(c.id) + "-" + f.id + '" style="--c:' + fcol(f.id) + '"><div class="hd"><span class="id">' + f.id + "</span><b>" + esc(f.name) + '</b><span class="pp">' + (F.rec_same ? f.p + "%" + rg(f.rng) : "Current trend " + f.p + "%" + rg(f.rng) + " · if recommendations are followed " + f.p_rec + "%" + rg(f.rng_rec)) + (f.prev2w ? '<small>' + f.prev2w[0] + (F.rec_same ? "" : " · " + f.prev2w[1]) + "</small>" : f.prev ? '<small>' + f.prev[0] + " · " + f.prev[1] + "</small>" : f.id === "F5" ? "<small></small>" : "") + "</span></div>" +
      "<p>" + esc(f.story) + "</p><p class=\"tst\"><b>Resolution criteria</b> · " + esc(f.test) + (f.fc ? ' <span class="mono">(' + f.fc + ")</span>" : "") + "</p>" +
      "<p style=\"font-size:12px\"><b>Early signs</b> · " + f.signs.map(esc).join(" · ") + "</p>" + sigHtml(f) +
      "<details class=\"src\"><summary>What this outcome means for people (well-being index)</summary>" + ftab(f) + '<p class="note">' + esc(f.why) + (f.score ? " ▲▼ show change from 2026." : " Values run from worse to better.") + "</p></details></article>").join("") + "</div>" +
    extHtml(c) + worldHtml(c) + aiHtml(c) + "</section>";
}
/* v3.26 사안 outlook: 흐름·창·사건·경로·반증 신호. 본문의 {{fc:fNN}}은 그날 확률을 보이는 전망 칩, {{case:id}}는 사안 칩 */
function olkT(t, fid){
  return esc(t).replace(/\{\{n:([\d,]+)\}\}/g, (m, ns) => '<sup class="fn">' + ns.split(",").map(n => '<button type="button" data-jump="fn-' + esc(fid || "") + "-" + n + '" id="fnr-' + esc(fid || "") + "-" + n + "\" aria-label=\"Key term " + n + '">' + n + "</button>").join("·") + "</sup>")  /* v3.29 용어 풀이 번호 */.replace(/\{\{fc:(f\d+)\}\}/g, (m, id) => { const F = D.forecasts.find(f => f.id === id); return F ? ' <button type="button" class="fcchip" data-fc="' + id + '" title="' + esc(F.q) + '">' + fcLab(F, id, F.p) + "</button>" : ""; })
    .replace(/\{\{case:([\w-]+)\}\}/g, (m, id) => { const k = (D.strategies || []).find(x => x.id === id); return k ? ' <button type="button" class="chip" data-case="' + esc(id) + '">' + esc(k.title.split(":")[0]) + "</button>" : ""; });
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
function featArticle(F){
  const c = (D.strategies || []).find(x => x.id === F.case);
  return '<article class="sec olk" id="feat-' + esc(F.id) + "\"><p class=\"eyebrow\">Feature" + (c ? " · " + esc(c.title.split(":")[0]) : "") + " · " + fmtKD(F.date) + '</p><h2 class="olk-t">' + esc(F.title).replace(/(\d+%\S+)/g, '<span style="white-space:nowrap">$1</span>') + " " + ttsBtn("feat:" + F.id) + "</h2>" + featBody(F) +
    (c ? '<div class="chips" style="margin:0"><button type="button" class="chip" data-case="' + esc(c.id) + "\">View analysis · " + esc(c.title.split(":")[0]) + "</button></div>" : "") + "</article>";
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
  return "<h3 style=\"margin:8px 0 0\">Outcomes under each world scenario</h3><p class=\"note\">" + esc(W.note) + " World scenarios are on the <button type=\"button\" class=\"chip\" data-go=\"grand\">World Order tab</button>.</p><div class=\"tbl-wrap\"><table class=\"tbl ext\" style=\"min-width:560px\"><thead><tr><th>World scenario</th><th>Probability</th>" + W.order.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span><br>" + esc(fn[k]) + "</th>").join("") + "</tr></thead><tbody>" +
    W.rows.map(r => "<tr><td><b>" + esc(r.id + ". " + r.name) + '</b><br><span class="note">' + esc(r.why) + '</span></td><td class="mono">' + r.p + "%</td>" + r.cond.map(v => '<td class="mono">' + v + "</td>").join("") + "</tr>").join("") +
    "<tr class=\"base\"><td>Weighted total (check)</td><td class=\"mono\">100%</td>" + W.mix.map((v, i) => '<td class="mono">' + v + "<span class=\"dd\">baseline " + W.base[i] + "</span></td>").join("") + "</tr></tbody></table></div>";
}
function extHtml(c){
  const X = c.external; if (!X) return "";
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  const dv = (v, b) => { const d = v - b; return '<span class="dd">' + (d > 0 ? "▲" + d : d < 0 ? "▼" + (-d) : "±0") + "</span>"; };
  return "<h3 style=\"margin:8px 0 0\">External variables and conditional outcomes</h3><p class=\"note\">" + esc(X.note) + "</p>" +
    "<div class=\"tbl-wrap\"><table class=\"tbl ext\" style=\"min-width:600px\"><thead><tr><th>External variable (through 2030)</th><th>Likelihood</th>" + X.order.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span><br>" + esc(fn[k]) + "</th>").join("") + "<th>Judgments affected</th></tr></thead><tbody>" +
    "<tr class=\"base\"><td>Baseline · current trend</td><td class=\"mono\">—</td>" + X.base.map(v => '<td class="mono">' + v + "</td>").join("") + "<td></td></tr>" +
    X.items.map(x => "<tr><td><b>" + esc(x.t) + '</b><br><span class="note">' + esc(x.def) + '</span></td><td class="mono">' + x.p + "%</td>" + x.cond.map((v, i) => '<td class="mono">' + v + dv(v, X.base[i]) + "</td>").join("") + '<td class="note">' + esc(x.flips) + "</td></tr>").join("") +
    "</tbody></table></div><p class=\"note\">The middle columns show the probability (%) of each outcome if the variable occurs; ▲▼ show change from the baseline. These are judgment estimates, so differences of about ±5 points should not be read as meaningful.</p><div class=\"exts\">" + X.items.map(x => '<details class="dec"><summary><span class="nm">' + esc(x.id + " " + x.t) + '</span><span class="pw">' + x.p + '%</span><span class="fr">' + esc(x.why) + "</span></summary><dl><dt>Countries that would react most</dt><dd>" + x.who.map(chip).join(" ") + "</dd><dt>Leading indicators</dt><dd>" + esc(x.sign) + "</dd></dl></details>").join("") + "</div>" +
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
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return "<div class=\"tbl-wrap\"><table class=\"tbl evt\" style=\"min-width:820px\"><thead><tr><th>Option</th>" + G.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + "<th>Cost</th><th>Reversibility</th><th>Escalation risk</th><th>Feasibility</th></tr></thead><tbody>" +
    c.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + G.map(g => { const e = a.ev[g.id]; return "<td>" + sc(e.s) + '<span class="why">' + esc(e.t) + "</span></td>"; }).join("") +
      "<td>" + esc(ev(a.ev.cost)) + "</td><td>" + esc(ev(a.ev.rev2)) + "</td><td>" + esc(ev(a.ev.esc2)) + "</td><td>" + esc(ev(a.ev.feas)) + "</td></tr>").join("") + "</tbody></table></div>" +
    "<p class=\"note\">−2 major loss · −1 loss · 0 neutral · +1 gain · +2 major gain. Scores are not added up across objectives; options are ranked first by their scores on higher-priority objectives.</p>";
}
function humanHtml(c, n9, n10){
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
    "<h3 style=\"margin:6px 0 0\">Expected values for 2030" + (c.futures.rec_same ? "" : ": the effect of the recommendations") + "</h3><div class=\"tbl-wrap\"><table class=\"tbl\" style=\"min-width:520px\"><thead><tr><th>Group</th><th>Dimension</th><th>2026</th><th>" + (c.futures.rec_same ? "Expected" : "Current trend") + "</th>" + (c.futures.rec_same ? "" : "<th>If recommendations are followed</th>") + "<th>Worst-case future</th></tr></thead><tbody>" + erows.join("") + "</tbody></table></div>" +
    '<p class="note">' + esc(E.note) + (c.futures.rec_same ? " ▲▼ show change from 2026." : " In the current-trend column, ▲▼ show change from 2026; in the recommendations column, change from the current trend.") + "</p><div class=\"lesson-box\"><b>Interpretation</b>" + esc(E.read) + "</div></section>" +
    '<section class="stp">' + stpH(n10, "Where the Clisa Geopolitics assessment departs from the strategic actor’s ranking") + '<p class="note">' + esc(H.note) + '</p><div class="divs">' +
    H.items.map(x => '<article class="dv"><div class="hd"><span class="id">' + esc(x.alt) + "</span><b>" + esc((c.alts.find(a => a.id === x.alt) || {}).name || "") + "</b></div><dl><dt>By the strategic actor’s standard</dt><dd>" + esc(x.client) + "</dd><dt>Clisa Geopolitics assessment</dt><dd class=\"cl\">" + esc(x.clisa) + "</dd><dt>What the strategic actor pays</dt><dd>" + esc(x.cost) + "</dd><dt>Consequences for people</dt><dd>" + esc(x.gain) + "</dd></dl></article>").join("") + "</div></section>";
}
function prevHtml(c){
  const P = c.prev; if (!P || PUB()) return "";
  return '<details class="src"><summary>' + esc(P.label) + '</summary><div style="display:grid;gap:10px;margin-top:8px"><p class="note"></p><ol class="synth">' +
    P.conclusions.map(k => "<li><b>" + esc(k.id + " · " + k.t) + "</b><span>" + esc(k.why) + "</span></li>").join("") + '</ol><div class="verdict">' +
    P.verdict.excluded.map(x => "<div class=\"misread\"><b>Not put forward</b>" + esc(x) + "</div>").join("") + P.verdict.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + ". " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + "</div></div></details>";
}
function briefHtml(c){
  const B = c.brief || {};
  const top = c.futures.items.slice().sort((a, b) => b.p - a.p)[0];
  const W = (c.counter || [])[0];
  const fcs = D.forecasts.filter(f => f.fp === c.fp && f.status === "open").sort((a, b) => a.due.localeCompare(b.due));
  const fb = f => 'data-fut="' + esc(c.id) + ":" + esc(f.id) + '"';
  return '<section class="brief"><dl class="tw">' +
    (B.q ? "<dt>The question</dt><dd>" + esc(B.q) + "</dd>" : "") +
    (B.a ? "<dt>Assessment</dt><dd class=\"ba\">" + esc(B.a) + "</dd>" : "") +
    "<dt>Most likely outcome</dt><dd><button type=\"button\" class=\"futlink\" " + fb(top) + '><span class="mono" style="color:' + fcol(top.id) + '">' + top.id + "</span> " + esc(top.name) + ' <span class="mono">' + top.p + "%</span>" + (top.rng ? ' <span class="rng">(' + top.rng[0] + "~" + top.rng[1] + ")</span>" : "") + ' <span class="note">→</span></button>' +
      "<div class=\"pbar pmini\" role=\"group\" aria-label=\"Probability by outcome\">" + c.futures.items.map(f => '<button type="button" ' + fb(f) + ' style="flex:' + f.p + ' 0 0;background:' + fcol(f.id) + '" title="' + esc(f.id + " " + f.name + " " + f.p + "%") + '"' + (f.p < 15 ? ' class="sm"' : "") + ">" + f.id + "<span>" + f.p + "%</span></button>").join("") + "</div></dd>" +
    (W ? "<dt>The other side’s best move</dt><dd><b>" + esc(enShort(W.name)) + "</b> · " + esc(W.ranked[0].t) + "</dd>" : "") +
    (B.eq ? "<dt>The likely outcome</dt><dd>" + esc(B.eq) + "</dd>" : "") +
    (B.human ? "<dt>What it means for people</dt><dd>" + esc(B.human) + "</dd>" : "") +
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
function caseFullHtml(c){
  const step = (n, t, body) => '<section class="stp">' + stpH(n, t) + body + "</section>";
  const layer = (L, q) => '<div class="lyr l' + L + '"><b>' + LNAME[L] + "</b><span>" + esc(q) + "</span></div>";
  const T = D.philosophy.tree.layers || [];
  const lq = id => (T.find(x => x.id === id) || {}).q || "";
  const cl = c.client;
  const an = FP_AN[c.fp] ? D.history.analogies.find(x => x.id === FP_AN[c.fp]) : null;
  const pf = D.forecasts.filter(f => f.fp === c.fp).map(f => f.id);
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
      layer("V", lq("V")) +
      step(12, "Forecasts and disconfirming signals", '<ul class="list">' + c.predictions.map(p => '<li><div class="fc"><div class="q">' + esc(p.q) + '</div><div class="p">' + p.p + "<small>%</small></div><div class=\"foot\"><span>Resolution date <span class=\"mono\">" + esc(enDate(p.due)) + "</span></span><span>" + esc(p.note) + "</span></div></div></li>").join("") + "</ul><p class=\"note\" style=\"margin-top:6px\">All related forecasts for this issue (" + pf.join(", ") + ") are on the Forecasts and Track Record tab. <button type=\"button\" class=\"chip\" data-go=\"forecast\">View Forecasts and Track Record</button></p><h3 style=\"margin:10px 0 6px\">What would prompt a reassessment</h3><ul class=\"watch\">" + c.falsify.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>") +
      (PUB() || !c.changed ? "" : '<section class="sec"><h3></h3><ul class="list">' + c.changed.map(x => '<li class="rv"><p style="color:var(--ink)">' + esc(x) + "</p></li>").join("") + "</ul></section>") +
      prevHtml(c) +
      "<details class=\"src\"><summary>Sources · " + c.sources.length + "</summary><ul>" + c.sources.map(srcItem).join("") + "</ul></details>";
}
/* v3.52 사안의 결정권자: 전략 주체의 결정권자와 사안에서 분석한 주요국 결정권자를 모두 칩으로(2026-10-05 결재) */
function caseLeaders(c){
  const L = LLK(), me = c.id === "ukraine" ? "UKR" : "KOR";
  const xs = [...new Set([me].concat(((c.deciders || {}).items || []).map(d => d.iso)))].filter(i => L[i]);
  return xs.length ? "<div class=\"chips cl-ld\" style=\"margin:8px 0 0\"><span class=\"note\">Decision-makers</span>" + xs.map(i => '<a class="chip" href="' + lurl(i) + '">' + esc(L[i].name) + (i === me ? " <span class=\"note\">strategic actor</span>" : "") + "</a>").join("") + "</div>" + casePower(c) : casePower(c);
}
/* v3.53 사안 머리의 권력 구조 칩: 전략 주체와 결정권을 가진 나라 가운데 권력 구조 쪽이 있는 나라 */
function casePower(c){
  const P = PLK(), me = c.id === "ukraine" ? "UKR" : "KOR";
  const xs = [...new Set([me].concat(((c.deciders || {}).items || []).map(d => d.iso)))].filter(i => P[i]);
  return xs.length ? "<div class=\"chips cl-ld\" style=\"margin:6px 0 0\"><span class=\"note\">Power structures</span>" + xs.map(i => '<a class="chip" href="/en/power/#' + i + '">' + esc(P[i].name) + "</a>").join("") + "</div>" : "";
}
function caseArt(c, i){
  const cl = c.client;
  return '<article class="sec case-a" id="case-' + esc(c.id) + '" data-cid="' + esc(c.id) + "\" style=\"display:grid;gap:22px\"><div><p class=\"eyebrow\">Issue " + (i + 1) + " · Strategic actor: " + esc(cl ? cl.name : c.recipient) + " · As of " + esc(enDate(c.asof)) + '</p><h2 style="margin-top:4px;font-size:20px">' + esc(c.title) + " " + ttsBtn("case:" + c.id) + "</h2>" + (c.status ? '<p class="meta" style="margin-top:4px">' + esc(c.status) + "</p>" : "") + caseLeaders(c) + (FEATS().some(F => F.case === c.id) ? '<div class="chips" style="margin:8px 0 0">' + FEATS().filter(F => F.case === c.id).map(featBtn).join("") + "</div>" : "") + "</div>" +
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
  return "<p style=\"font-size:12px\"><b>Signal forecasts</b> · " + (up.length ? "Toward this outcome: " + up.map(g => fcBtn(g.id)).join(" ") : "") + (dn.length ? (up.length ? " · " : "") + "Away from it: " + dn.map(g => fcBtn(g.id)).join(" ") : "") + "</p>";
}
function fcByBranch(c, fs){
  const byId = id => fs.find(f => f.id === id), used = new Set(), sub = (t, ids) => { const xs = ids.map(byId).filter(Boolean); xs.forEach(f => used.add(f.id)); return xs.length ? '<p class="note" style="margin:10px 0 4px">' + t + '</p><ul class="list">' + xs.map(f => forecastRow(f, false)).join("") + "</ul>" : ""; };
  const its = c.futures.items.slice().sort((a, b) => b.p - a.p);
  let h = its.map(it => '<div class="fbr" style="border-top:1px solid var(--line);padding-top:10px;margin-top:14px"><h4 style="margin:0"><span class="mono" style="color:' + fcol(it.id) + '">' + esc(it.id) + "</span> " + esc(it.name) + ' <span class="mono">' + it.p + "%</span>" + (it.rng ? ' <span class="rng">(' + it.rng[0] + "~" + it.rng[1] + ")</span>" : "") + "</h4><p class=\"note\" style=\"margin:2px 0 0\">Resolution criteria · " + esc(it.test) + "</p>" +
    sub("Forecasts tied to the resolution criteria", it.fc ? [it.fc] : []) + sub("Forecasts that tilt toward this outcome", (it.sig || []).filter(g => g.dir === "+").map(g => g.id)) + sub("Forecasts that tilt away from it", (it.sig || []).filter(g => g.dir === "-").map(g => g.id)) +
    (!it.fc && !(it.sig || []).length ? "<p class=\"note\" style=\"margin:6px 0 0\">No forecasts are linked to this outcome yet. It will be judged against its resolution criteria at the end of 2030.</p>" : "") + "</div>").join("");
  const cf = f => f.fp === c.fp, expo = (D.fc_expo || []).map(byId).filter(f => f && cf(f) && !used.has(f.id));
  h += expo.length ? "<div style=\"border-top:1px solid var(--line);padding-top:10px;margin-top:14px\"><h4 style=\"margin:0\">South Korea’s exposure and the recommendations</h4><p class=\"note\" style=\"margin:2px 0 0\">These forecasts ask not which outcome will materialize but what price South Korea pays and whether the recommendations are carried out.</p><ul class=\"list\">" + expo.map(f => { used.add(f.id); return forecastRow(f, false); }).join("") + "</ul></div>" : "";
  const rest = fs.filter(f => cf(f) && !used.has(f.id));
  h += rest.length ? "<div style=\"border-top:1px solid var(--line);padding-top:10px;margin-top:14px\"><h4 style=\"margin:0\">Other forecasts on this issue</h4><ul class=\"list\">" + rest.map(f => forecastRow(f, false)).join("") + "</ul></div>" : "";
  return h;
}
function renderForecasts(){
  const fs = D.forecasts.slice().sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p);
  const done = fs.filter(f => f.status === "yes" || f.status === "no");
  const miss = done.filter(f => (f.status === "yes") !== (f.p >= 50));
  const brier = done.length ? (done.reduce((s, f) => s + Math.pow(f.p / 100 - (f.status === "yes" ? 1 : 0), 2), 0) / done.length).toFixed(3) : "—";
  $("#pane-forecast").innerHTML =
    "<div class=\"sec\"><h2>Forecasts and Track Record</h2><p class=\"lead\" style=\"margin-top:8px\">Every forecast states a probability and a resolution date. Once that date passes, the outcome and the forecast’s accuracy are published, and forecasts that missed are not deleted.</p></div>" +
    '<div class="score-card"><div><b class="mono">' + fs.length + "</b><span>Total forecasts</span></div><div><b class=\"mono\">" + done.length + "</b><span>Resolved</span></div><div><b class=\"mono\">" + brier + "</b><span>Accuracy (Brier score)</span></div></div>" +
    "<p class=\"note\">Accuracy is measured by the Brier score: the mean of (probability − actual outcome)². Zero is perfect; assigning 50% to every forecast yields 0.25." + (PUB() ? "" : "") + "</p>" +
    (FCR().length ? "<section class=\"sec\" id=\"f-week\"><h3>Weekly forecast review</h3><p class=\"note\" style=\"margin-bottom:8px\">Every Monday, forecast probabilities are revisited in light of the previous week’s events. Both revised and unchanged forecasts are listed, with reasons.</p>" + FCR().map((r, i) => weekHtml(r, i === 0)).join("") + "</section>" : "") +
    "<section class=\"sec\"><h3>Missed forecasts</h3><p class=\"note\" style=\"margin-bottom:8px\">Forecasts rated 50% or higher that did not happen, or rated below 50% that did.</p>" + (miss.length ? '<ul class="list">' + miss.map(f => forecastRow(f, false)).join("") + "</ul>" : "<p class=\"note\">No forecasts have been resolved yet.</p>") + "</section>" +
    ((PUB() && (D.notices || []).length) ? "<section class=\"sec\"><h3>Revised assessments</h3><ul class=\"tl\">" + D.notices.slice().reverse().map(l => { const m = /^case\/([\w-]+)\/$/.exec(l.link || ""), k = m && (D.strategies || []).find(x => x.id === m[1]), fm = /^feature\/([\w-]+)\/$/.exec(l.link || ""), F = fm && FEATS().find(x => x.id === fm[1]); return '<li><span class="d">' + esc(enDate(l.date)) + "</span><span>" + esc(l.text) + (F ? " " + featBtn(F) : "") + (k ? ' <button type="button" class="chip" data-case="' + esc(k.id) + "\">View analysis · " + esc(k.title.split(":")[0]) + "</button>" : "") + "</span></li>"; }).join("") + "</ul></section>" : "") +
    (() => { const cs = D.strategies || [], cf = f => { const c = cs.find(x => x.fp === f.fp); return c ? c.id : "etc"; };
      const opts = [["all", "All", fs.length]].concat(cs.map(c => [c.id, c.title.split(":")[0], fs.filter(f => cf(f) === c.id).length]), [["etc", "Other conflicts", fs.filter(f => cf(f) === "etc").length]]);
      const sel = S.fcf || "all", shown = sel === "all" ? fs : fs.filter(f => cf(f) === sel);
      const cc = cs.find(c => c.id === sel);
      return '<section class="sec" id="f-all"><h3>' + (cc ? esc(cc.title.split(":")[0]) + " · forecasts by outcome" : "All forecasts · by resolution date") + "</h3><div class=\"chips fcf\" role=\"group\" aria-label=\"Filter forecasts by issue\" style=\"margin:0 0 8px\">" + opts.filter(o => o[2]).map(o => '<button type="button" class="chip' + (o[0] === sel ? " on" : "") + '" data-fcf="' + o[0] + '" aria-pressed="' + (o[0] === sel) + '">' + esc(o[1]) + ' <span class="mono">' + o[2] + "</span></button>").join("") + '</div>' + (cc ? "<p class=\"note\" style=\"margin:0 0 4px\">For each possible outcome on the issue, this view groups the forecasts tied to its resolution criteria with the signal forecasts that tilt toward (or away from) it. Outcome probabilities come from the issue analysis, and the same forecast may appear under more than one outcome.</p>" + fcByBranch(cc, fs) : '<ul class="list">' + shown.map(f => forecastRow(f, false)).join("") + "</ul>") + "</section>"; })();
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
    "<section class=\"sec\" id=\"i-th\"><h3>Key thinkers " + ttsBtn("th") + "</h3><p class=\"note\" style=\"margin-bottom:8px\">Each thinker’s core argument, how it applies to the current situation, and what it got right and wrong in history.</p><ul class=\"list\">" + D.thinkers.map(t => {
      return '<li><article class="thinker"><div class="who"><h4>' + esc(t.name) + '</h4><span class="meta">' + esc(t.life) + " · " + esc(t.role) + '</span></div><div class="works">' + esc(t.works) + "</div>" +
        "<dl><div><dt>Core argument</dt><dd>" + esc(t.idea) + "</dd></div><div><dt>Application to the current situation</dt><dd>" + esc(t.now) + "</dd></div><div><dt>Hits and misses</dt><dd>" + esc(t.record) + "</dd></div></dl></article></li>";  /* v3.86: '지구본에서 보기'(관점) 단추를 내림 */
    }).join("") + "</ul></section>";
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
    "<div class=\"sec\"><h2>Methodology</h2><p class=\"lead\" style=\"margin-top:8px\">This section sets out the purpose of Clisa Geopolitics, how its judgments are structured, how they are verified, and its sources and limitations. The ultimate purpose is individual human well-being, which is not a variable in the calculation but the standard that sets the direction of all analysis.</p>" + (pub ? "" : '<p class="note" style="margin-top:6px">' + esc(M.version) + (M.status ? " · " + esc(M.status) : "") + "</p>") + "</div>" +
    "<section class=\"sec\"><h3>Charter" + (F.charter.status && !pub ? " · " + esc(F.charter.status) : "") + '</h3><div class="charter">' + F.charter.items.map(it => "<div><b>" + esc(it.k) + "</b><p>" + esc(it.t) + (it.by ? "<small>" + esc(it.by) + "</small>" : "") + "</p></div>").join("") + "</div></section>" + questionsHtml() +
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
      "<h3 style=\"margin-top:14px\">Index rules</h3><ul>" + I.rules.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul><h3 style=\"margin-top:14px\">Index limitations</h3><ul>" + I.limits.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>"
     : '<section class="sec method"><h3>' + esc(I.title) + '</h3><p>' + esc(I.unit) + " The index has four dimensions: " + I.dims.map(d => esc(d.name)).join(", ") + ". They are not combined into a single score.</p><ul style=\"margin-top:6px\">" + I.dims.map(d => "<li><b>" + esc(d.name) + "</b> · Source: " + esc(d.src) + "</li>").join("") + "</ul><h3 style=\"margin-top:14px\">Index limitations</h3><ul>" + I.limits.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>") +
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
  if (t === "brief") { if (!BR) return LOC().indexOf("/brief/") === 0 ? LOC() : "/brief/"; const c = briefCur(); return "/brief/" + (c && BR && c !== BR.issues[0] ? c.date + "/" : ""); }
  if (t === "feature") { const L = FEATS(), c = L.find(F => F.id === S.feat); return "/feature/" + (c && c !== L[0] ? c.id + "/" : ""); }
  if (t === "page") return LOC();
  if (t === "method") return "/" + (S.info || "method") + "/";
  if (/^(grand|ideas|forecast)$/.test(t)) return "/" + t + "/";
  if (t === "detail") return S.sel && hasPage(S.sel) ? "/country/" + S.sel + "/" : "/";
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
  if ((m = p.match(/^\/brief\/(\d{4}-\d{2}-\d{2})\/?$/))) {
    if (BR && !BR.issues.some(x => x.date === m[1])) { pageGo(enAdd(p)); return true; }
    S.bdate = m[1]; renderBrief(); switchTab("brief"); return true; }
  if (/^\/brief\/?$/.test(p)) { S.bdate = null; renderBrief(); switchTab("brief"); return true; }
  if ((m = p.match(/^\/feature\/([\w-]+)\/?$/)) && FEATS().some(F => F.id === m[1])) { goFeat(m[1]); return true; }
  if (/^\/feature\/?$/.test(p)) { goFeat(null); return true; }
  if ((m = p.match(/^\/(method|guide|about)\/?$/))) { infoGo(m[1]); return true; }  /* v3.79 사이트 안내 탭 하나에 3개 부분 */
  if (/^\/(leader|power|subscribe)(\/|$)/.test(p)) { pageGo(enAdd(p)); return true; }
  if ((m = p.match(/^\/(grand|ideas|forecast)\/?$/))) { switchTab(m[1]); return true; }
  if (p === "/" && !location.hash) { switchTab(ROUTE_FIRST && !location.search ? "brief" : "overview"); return true; }  /* 처음 들어온 '/'는 정세 브리핑, 화면 안에서 돌아온 '/'는 세계 정세 */
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
  if (t === "brief") { const c = BR && briefCur(), m = c && c !== BR.issues[0] && /^(\d{4})-(\d{2})-(\d{2})/.exec(c.date); return gl("brief") + (m ? " · " + enDate(c.date) : "") + sx; }
  if (t === "feature") { const L = FEATS(), c = L.find(F => F.id === S.feat); return (c && c !== L[0] ? c.title : gl("feature")) + sx; }
  if (t === "detail") return S.sel && hasPage(S.sel) ? D.countries[S.sel].name_ko + ": Situation and Grand Strategy" + sx : SITE_T;
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
const SOFT_RE = /^\/(?:$|(?:case|country|brief|feature|leader|power|guide|about|subscribe|grand|ideas|method|forecast)(?:\/|$))/;
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
  document.querySelector(".app").classList.toggle("noglobe", S.tab === "method" || S.tab === "ideas");
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
function navSnap(){ const pn = document.getElementById("pane-" + S.tab); return {tab: S.tab, path: S.tab === "page" ? PAGE_CUR : null, info: S.info, scase: S.scase, sel: S.sel, selFp: S.selFp, fcf: S.fcf, y: narrow() ? scrollY : (pn ? pn.scrollTop : 0)}; }
function navUpd(){ if (navBtn) navBtn.hidden = !NAV.length; }
function navPush(){
  if (NAV_BUSY || !D) return;
  const s = navSnap(), t = NAV[NAV.length - 1];
  if (t && t.tab === s.tab && t.path === s.path && t.scase === s.scase && t.sel === s.sel && t.selFp === s.selFp && Math.abs(t.y - s.y) < 40) return;
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
      if (s.tab === "forecast" && s.fcf) { S.fcf = s.fcf; renderForecasts(); }
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
  if (ev.target.closest("[data-case],[data-fcgo],[data-feat],[data-iso],[data-fp],[data-go],[data-exit],[data-q],[data-fcf],#bstrip,#srchres [data-sri]")) navPush();
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
  el.innerHTML = '<div class="fcp-h"><span class="mono">' + esc(id) + "</span> forecast · " + (st ? esc(st) : "Currently " + F.p + "%") + "<button type=\"button\" class=\"fcp-x\" aria-label=\"Close\">×</button></div><p>" + esc(F.q) + "</p>" +
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
const CLOCKS = [["Seoul/Tokyo", "Asia/Seoul"], ["Beijing/Taipei", "Asia/Shanghai"], ["Tehran", "Asia/Tehran"], ["Moscow", "Europe/Moscow"], ["Kyiv", "Europe/Kyiv"], ["Brussels", "Europe/Brussels"], ["London", "Europe/London"], ["Washington/New York", "America/New_York"]];
(function(){
  const el = document.getElementById("clocks"); if (!el || !window.Intl) return;
  const fm = {}; const F = tz => fm[tz] || (fm[tz] = new Intl.DateTimeFormat("en-US", {timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23"}));
  const D_ = {}; const Fd = tz => D_[tz] || (D_[tz] = new Intl.DateTimeFormat("en-US", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"}));
  const ymd = (tz, d) => { const p = Fd(tz).formatToParts(d), g = t => (p.find(x => x.type === t) || {}).value; return g("year") + "-" + g("month") + "-" + g("day"); };
  el.innerHTML = CLOCKS.map(([c, tz]) => '<span class="clk" data-tz="' + tz + '"><span class="c">' + c + '</span><span class="t"></span><span class="d"></span></span>').join("");
  const tick = () => { const now = new Date(), seoul = ymd("Asia/Seoul", now);
    el.querySelectorAll(".clk").forEach(x => { const tz = x.dataset.tz; const tt = F(tz).format(now); x.querySelector(".t").innerHTML = tt.slice(0, 2) + '<b class="' + (now.getSeconds() % 2 ? "off" : "") + '">:</b>' + tt.slice(3, 5); const d = ymd(tz, now); x.querySelector(".d").textContent = d === seoul ? "" : d < seoul ? "−1 day" : "+1 day"; }); };
  try { tick(); el.hidden = false; setInterval(() => { if (document.visibilityState === "visible") tick(); }, 1000); } catch (e) { el.hidden = true; }
  /* 검색창이 둘째 줄로 밀리면(글꼴·배율 때문에 폭이 모자랄 때) 시각을 숨겨 머리글을 한 줄로 지킨다 */
  const sb = document.getElementById("srchopen"), h1 = document.querySelector(".brand h1");
  let lastW = 0; const top = document.querySelector(".top");
  const wrapped = () => sb.getBoundingClientRect().top > h1.getBoundingClientRect().bottom - 4;
  /* 1단계 snug(부제 숨김·검색창 축소) → 2단계 시각 묶음을 0.7배까지 축소(zoom) → 3단계 tight(숨김) */
  const fit = () => { if (!sb || !h1) return; if (innerWidth !== lastW) { lastW = innerWidth; el.classList.remove("tight"); top.classList.remove("snug"); el.style.zoom = ""; }
    if (el.classList.contains("tight") || getComputedStyle(el).display === "none") return;
    if (!wrapped()) return;
    if (!top.classList.contains("snug")) { top.classList.add("snug"); if (!wrapped()) return; }
    for (let z = 0.95; z >= 0.7; z -= 0.05) { el.style.zoom = z; if (!wrapped()) return; }
    el.style.zoom = ""; el.classList.add("tight"); top.classList.remove("snug"); };
  fit(); addEventListener("resize", fit);
  if (document.fonts) { document.fonts.addEventListener("loadingdone", fit); if (document.fonts.ready) document.fonts.ready.then(fit); }
  new ResizeObserver(fit).observe(top);
})();

/* 위로 가기 */
const topBtn = document.getElementById("totop");
function updTop(){
  if (!topBtn) return;
  if (narrow()) { const p = document.getElementById("panel"); topBtn.hidden = !(scrollY > p.offsetTop + 900); }
  else { const a = document.getElementById("pane-" + S.tab); topBtn.hidden = !(a && a.scrollTop > 900); }
}
document.getElementById("panel").addEventListener("scroll", updTop, true);
addEventListener("scroll", updTop, {passive:true});
topBtn.onclick = () => {
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

