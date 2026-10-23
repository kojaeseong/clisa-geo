
(function(){
"use strict";
const $ = s => document.querySelector(s);
/* v3.37(2026-10-01): 칩에는 번호를 보이지 않고 짧은 이름만 보인다(이름이 없는 전망만 번호). 번호는 설명 창과 전망과 검증에 남는다 */
const fcLab = (F, id, p) => (F && F.s ? '<span class="fcs">' + esc(F.s) + '</span>' : '<span class="fcn">' + esc(id) + '</span>') + (p != null ? ' ' + p + '%' : '');
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => matchMedia("(max-width: 960px)").matches;
const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };
if (store.get("ep.legoff") === "1") document.documentElement.classList.add("legoff");

const LAYERS = {
  focus:{label:"분석 대상 지역", desc:"짙을수록 해당 국가가 관련된 전략 분석과 전망이 많습니다."},
  risk:{label:"위험도", desc:"판단 점수. 높을수록 무력 충돌이나 체제 불안의 위험이 큽니다."},
  mil:{label:"군사력", desc:"판단 점수. 세계 기준(미국 = 100)의 상대적 군사 능력. 나라 이름 아래 숫자는 현역 병력(IISS)과 핵탄두 추정치(SIPRI)입니다."},
  pol:{label:"정치 안정", desc:"판단 점수. 높을수록 정권과 정책 방향이 안정적입니다."},
  econ:{label:"경제 비중", desc:"판단 점수. 경제 규모와 충격에 대한 회복력."}
};
const JLAYERS = ["risk", "mil", "pol", "econ"];
const TAB_ALIAS = {philo:"method", shelf:"ideas", history:"ideas", exit:"strat"};
let FOCUS = {}, FCN = {};
const LENS_NAME = {mackinder:"매킨더의 심장지대", spykman:"스파이크먼의 림랜드", mao:"마오의 지구전", kissinger:"키신저의 삼각외교", lky:"리콴유의 균형론", brzezinski:"브레진스키의 반패권 연합", allison:"앨리슨의 투키디데스 함정", huntington:"헌팅턴의 문명 단층선", mearsheimer:"미어샤이머의 공격적 현실주의"};
const LABEL_AT = {USA:[-98,39], CAN:[-100,58], FRA:[2.5,46.6], NOR:[9,61.5], ESP:[-3.7,40.3], NLD:[5.5,52.2], DNK:[9.3,56], CHL:[-71,-33], RUS:[98,62], AUS:[134,-25], CHN:[103,34], IND:[79,22], KAZ:[67,48], MNG:[103,46.5], IRN:[54,32.5], SAU:[45,24], TUR:[35,39], PAK:[69,29.5], IDN:[114,-1.5], PHL:[122.5,12], VNM:[106.3,15.5], TWN:[121,23.7], JPN:[138.5,36.8], KOR:[127.9,36.3], PRK:[126.8,40.3], UKR:[31.5,49], BLR:[28,53.5], ISR:[34.9,31.2]};
const HOME = [-95, -28, 0], HOME_K = 1;
const REGIONS = ["동아시아","동남아시아","남아시아","중앙아시아·내륙","러시아·동유럽","캅카스·아나톨리아","중동·북아프리카","유럽","북미","중남미","아프리카","오세아니아"];

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
  const eok = Math.round(bn * 10);
  if (eok >= 10000) { const jo = Math.floor(eok / 10000), r = eok % 10000; return jo + "조" + (r ? " " + r.toLocaleString("ko-KR") + "억" : "") + " 달러"; }
  return Math.max(1, eok).toLocaleString("ko-KR") + "억 달러";
}
const fmtPeople = n => n == null ? "—" : (n >= 10000 ? (Math.round(n / 1000) / 10).toLocaleString("ko-KR") + "만 명" : n.toLocaleString("ko-KR") + "명");
const fmtPct = v => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(1) + "%";
const fmtDeg = (v, pos, neg) => Math.abs(v).toFixed(1) + "°" + (v >= 0 ? pos : neg);
const pips = n => '<span class="pips" aria-label="심각도 ' + n + '/5">' + [1,2,3,4,5].map(i => '<i class="' + (i <= n ? "on" : "") + '"></i>').join("") + "</span>";
const shortLeader = s => String(s || "").split(" (")[0].split(", ")[0];
const chip = iso => { const c = D.countries[iso]; return c ? '<button type="button" class="chip' + (c.tier === 1 ? " t1" : "") + '" data-iso="' + iso + '">' + esc(c.name_ko) + "</button>" : ""; };
function srcItem(s){
  const url = String(s).split(" ")[0], note = String(s).slice(url.length).trim();
  let host = url; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch(e){}
  return '<li><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(host) + "</a>" + (note ? " " + esc(note) : "") + "</li>";
}

/* ---------- v3.13 사이트 검색 ---------- */
const SR = {idx:null, act:-1, items:[], more:{}};
const SR_ALIAS = [["대만","타이완","taiwan"],["북한","북조선","dprk"],["한국","대한민국","남한"],["미국","미합중국"],["호르무즈","hormuz"],["우크라이나","우크라"],["유럽연합","eu"],["나토","nato"],["hbm","고대역폭메모리"],["희토류","rare earth"],["중일","중국·일본"],["미중","미·중"],["러우","러-우","러·우"],["휴전","정전","종전","ceasefire","평화협상"],
  /* v3.52 검색 보강(2026-10-05): 독자가 쓰는 말과 사이트의 말을 잇는다 */
  ["통일","남북통일","남북관계"],["행복","행복지표","행복지수","삶의질","웰빙"],["인구","인구문제","저출산","출산율","출생아","고령화","생산연령","일할나이"],
  ["일자리","고용","고용률","취업","청년고용"],["노인","노인빈곤","노후","고령층","연금"],["교육","학교","대학"],
  ["전쟁","전면전","무력충돌","교전","확전","세계대전","3차세계대전"],["주식","증시","주가","코스피"],["금리","기준금리"],
  ["전작권","전시작전통제권"],["북핵","북한핵","북한의핵"],["미중","미·중","미국중국","미중갈등","미중경쟁"],
  ["korea","southkorea"],["northkorea","dprk"],["china","중국"],["japan","일본"],["russia","러시아"],["iran","이란"],["ukraine","우크라이나"],["usa","america","미국"],
  ["반도체","semiconductor","chip","chips"],["브리핑","정세브리핑","뉴스","오늘브리핑"],["구독","새글알림","rss","알림"],["운영자 인사말","인사말","만든사람","문의","연락처"]  /* 공개판 변환이 따옴표 안의 낱말 '운영…자'를 지우므로 '운영자 인사말' 꼴로만 쓴다 */,
  /* v3.52b 결정권자 쪽 본문 검색과 함께(2026-10-05) */
  ["독재","독재자","개인독재","권위주의","권력집중","장기집권","1인지배","일인지배"],["선거","대선","총선","선거연기","선거유예"],["후계","후계자","후계구도","승계"]];
const SR_SOFT = new Set(["가능성","확률","전망","여부","관련","대해","대한","언제","어떻게","될까","되나","있나","있을까","인가","은","는","이","가","의","문제","갈등","상황","이슈","현황","나나요","나요","일어날까","할까","뭐","무엇","왜","정말","요즘","최근","앞으로"]);
/* 낱말 끝의 조사와 '문제·갈등' 같은 꼬리말을 떼어 본 형태도 함께 찾는다 */
const SR_TAIL = ["에서는","에서","으로","에는","까지","부터","문제","갈등","정책","상황","이슈","가능성","전망","의","은","는","이","가","을","를","에","과","와","로","도"];  /* v3.52 */
const SR_SKIP = new Set(["sources","src","url","num","iso","id","fp","lat","lon","ids","countries","scores","phase","fc","steps","lens","lens_fp","lens_off","log","discuss","review","status","made","revised","due","date","asof","rng","rng_rec","inputs","score","p","p_rec","k","w","case","kind"]);
const srNorm = t => String(t).toLowerCase().replace(/\s+/g, "");
function srTexts(x, out){
  if (typeof x === "string") { if (/[가-힣A-Za-z]/.test(x) && !/^https?:/.test(x)) out.push(x.replace(/\{\{[^}]*\}\}/g, "")); }
  else if (Array.isArray(x)) x.forEach(v => srTexts(v, out));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { if (!SR_SKIP.has(k)) srTexts(v, out); }
  return out;
}
function srBuild(){
  const E = [], add = (g, t, body, go, tkey) => { const b = srTexts(body, []).join(" · "); E.push({g, t, b, tk:srNorm(tkey == null ? t : tkey), bk:srNorm(b), go}); };
  const toPane = (tab, cb) => () => { if (cb) cb(); switchTab(tab); return "pane-" + tab; };
  for (const [iso, c] of Object.entries(D.countries)) add("나라", c.name_ko + (c.leader ? " · " + String(c.leader).split(/[,/(]/)[0].trim() : ""), c, () => { selectCountry(iso, true); return "pane-detail"; });
  D.flashpoints.forEach(fp => add("분쟁 지점", fp.name_ko, fp, () => { selectFp(fp.id); return "pane-detail"; }));
  (D.strategies || []).forEach(c => add("전략 분석 사안", c.title, c, () => { goCase(c.id); caseFill(c.id); return "case-" + c.id; }));
  /* v3.19 여론·의지 항목을 따로 색인 */
  const toCase = (id, tgt) => () => { goCase(id); caseFill(id); return tgt; }, cshort = c => String(c.title).split(":")[0];
  (D.strategies || []).forEach(c => {
    ((c.publics || {}).items || []).forEach((p, i) => add("전략 분석 사안", cshort(c) + " · 국내 여론 · " + p.who, [p, "여론"], toCase(c.id, "pub-" + c.id + "-" + i)));
    ((c.deciders || {}).items || []).forEach(d => add("전략 분석 사안", cshort(c) + " · 결정권자 분석 · " + nm(d.iso), [d, "의지"], toCase(c.id, "dec-" + c.id + "-" + d.iso)));
  });
  for (const [iso, c] of Object.entries(D.countries)) if (c.intent) add("나라", c.name_ko + " · 의지 지표 · 말과 행동", [c.intent, "의지"], () => { selectCountry(iso, true); return "c-intent"; });
  FEATS().forEach(F => add("특집", F.title, F, () => { goFeat(F.id); return "feat-" + F.id; }));
  (D.insights || []).forEach(k => add("주요 판단", String(k.t).split(/(?<=다\.)\s/)[0], [k.t, k.classic || ""], toPane("strat")));
  (D.digest || []).forEach(g => add("세계 정세", g.t, g.d, toPane("overview")));
  if (BR) BR.issues.forEach(x => x.items.forEach(i => add("정세 브리핑", fmtKD(x.date) + " · " + i.h, [i.fact || "", i.link || ""], () => { goBrief(x.date); return "pane-brief"; })));
  /* v3.52 전망 검색(2026-10-05): 짧은 이름과 확률을 제목으로, 사안·분쟁 지점·나라 이름과 '가능성·확률·전망' 같은 말을 본문에 넣어 "러우 전쟁 휴전 가능성" 같은 물음에 전망이 잡히게 한다. 누르면 전망과 검증의 해당 항목으로 간다 */
  D.forecasts.forEach(f => { const c = (D.strategies || []).find(x => x.fp === f.fp), fp = D.flashpoints.find(x => x.id === f.fp);
    add("전망", (f.s || f.q) + " · " + (f.status === "open" ? f.p + "%" : f.status === "yes" ? "실현" : f.status === "no" ? "불발" : "무효"),
      [f.q, f.basis, f.void || "", c ? cshort(c) : "", fp ? fp.name_ko : "", (f.countries || []).map(nm).join(" "), "가능성 확률 전망 검증 " + (f.due || "")],
      () => { fcOpen(f.id); return "pane-forecast"; });  /* v4.22 전망별 화면으로 */
  });
  const G = D.grand || {};
  (G.trends || []).forEach(t => add("국제 질서", t.t, t, toPane("grand")));
  (G.scenarios || []).forEach(t => add("국제 질서", "시나리오 · " + t.name, t, toPane("grand")));
  (G.dyads || []).forEach(t => add("국제 질서", ((D.countries[t.a] || {}).name_ko || t.a) + "·" + ((D.countries[t.b] || {}).name_ko || t.b) + " 관계", t, toPane("grand")));
  (G.tensions || []).forEach(t => add("국제 질서", ((D.countries[t.a] || {}).name_ko || t.a) + "·" + ((D.countries[t.b] || {}).name_ko || t.b) + " · 역사와 구조", t, toPane("grand")));
  ((D.history || {}).analogies || []).forEach(a => add("역사와 사상", "역사적 선례 · " + a.now + (a.cases ? " ↔ " + [].concat(a.cases).join(", ") : ""), a, toPane("ideas")));
  ((D.history || {}).laws || []).forEach(l => add("역사와 사상", l.t, l, toPane("ideas")));
  (D.thinkers || []).forEach(t => add("역사와 사상", t.name, t, toPane("ideas")));
  (((D.philosophy || {}).questions) || []).forEach(q => add("분석 방법", "목적에 제기되는 질문 · " + q.id + ". " + q.title, q, toPane("method")));
  (((D.methodology || {}).terms) || []).forEach(t => add("분석 방법", Array.isArray(t) ? t[0] : t.t, t, toPane("method")));
  /* v3.52 사이트 메뉴와 글 쪽(운영자 인사말·새 글 알림·사이트 안내), 결정권자 쪽, 특집의 절 */
  const page = u => () => { pageGo(u, true); return "pane-page"; };
  [["정세 브리핑", "오늘 브리핑 최신 소식 뉴스 아침 매일 주요 사건 동향 정세브리핑", () => { goBrief(); return "pane-brief"; }],
   ["특집", "특집 기사 깊이 있는 글 주제", () => { switchTab("feature"); return "pane-feature"; }],
   ["세계 정세", "세계 정세 지구본 지도 정세 요약 다가오는 일정 분쟁지 나라", toPane("overview")],
   ["전략 분석", "전략 분석 사안 한반도 대만해협 러-우 전쟁 이란 호르무즈 반도체 판단 시나리오", toPane("strat")],
   ["국제 질서", "국제 질서 세계 시나리오 강대국 관계 흐름", toPane("grand")],
   ["전망과 검증", "전망 검증 확률 예측 적중 브라이어 점수 결과", toPane("forecast")],
   ["권력 구조", "권력 구조 결정 구조 결정권자 지도자 대통령 주석 위원장 총리 세계관 결정 방식 권력 구조 헌법 의회 국회 상원 하원 의석 여당 야당 거부권 선거 탄핵 동의 의원 발언", page("/power/")],
   ["역사와 사상", "역사 선례 사상가 고전 반복 유형", toPane("ideas")],
   ["분석 방법", "분석 방법 절차 규칙 행복 지표 판단값 방법론", toPane("method")],
   ["사이트 안내", "사이트 안내 이용 방법 화면 설명 도움말 바로가기", page("/guide/")],
   ["운영자 인사말", "운영자 인사말 만든 사람 고재성 소개 연락 이메일 문의", page("/about/")],
   ["새 글 알림 받기", "새 글 알림 구독 RSS 피드 받아 보기 구독 앱", page("/subscribe/")]].forEach(([t, b, go]) => add("사이트 메뉴", t, b, go));
  D.strategies.forEach(c => (c.congress || []).forEach((x, i) => add("전략 분석 사안", cshort(c) + " · 의회의 쟁점 · " + x.t, [x.t, x.stage, x.power, x.votes || "", x.sides || "", nm(x.iso), "의회 국회 상원 하원 동의 표결"], toCase(c.id, "cg-" + c.id + "-" + i))));
  Object.entries(PLK()).forEach(([i, L]) => { add("권력 구조", L.name + "의 권력 구조", [L.name, L.system || "", "권력 구조 결정 구조 헌법 거부권 선거 탄핵 동의 파병 조약 예산"], page("/power/#" + i));
    if (L.pb) add("권력 구조", L.pb, [L.pb, L.name, "권력기관 의회 국회 의석 여당 야당 의결 정당 위원회 의원 발언 쟁점"], page("/power/" + i + "/")); });  /* v3.62 나라 기본 내용은 첫 쪽, 권력기관은 나라별 쪽 */
  Object.entries(LLK()).forEach(([i, L]) => add("결정권자", L.name + " · 세계관과 결정 방식", [L.name, nm(i), "결정권자 지도자 세계관 결정 방식 말과 행동"], page(lurl(i))));
  /* v3.52b 결정권자 쪽의 절별 본문(data/search_leaders.json, 검색 창을 처음 열 때 받아 온다). 이름은 본문에만 넣어, 이름만 찾을 때는 결정권자 쪽 자체가 먼저 나오게 한다 */
  (SR.LD || []).forEach(L => (L.sections || []).forEach((s, si) => add("결정권자 분석", L.name + " · " + s.h, [L.name, nm(L.iso), s.t], vs => {
    pageGo(lurl(L.iso), true, () => { const h2 = document.querySelectorAll("#pane-page .page-pre h2")[si];
      const nmk = srNorm(L.name + nm(L.iso)), key = vs.filter(v => !nmk.includes(v)); srLand("pane-page", key.length ? key : vs, h2); });
    return null; }, s.h)));
  FEATS().forEach(F => (F.sections || []).forEach(S => add("특집", F.title + " · " + S.h, S.blocks ? S.blocks.filter(b => b.p || b.table).map(b => b.p || b.table) : S, () => { goFeat(F.id); return "feat-" + F.id; })));
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
      if (e.g === "전망" && soft.some(t => /가능성|확률|전망|될까|있을까/.test(t))) sc += 40;  /* 확률을 묻는 말이면 전망을 맨 위로 */
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
const SR_ORDER = ["사이트 메뉴","권력 구조","결정권자","결정권자 분석","나라","특집","주요 판단","전략 분석 사안","분쟁 지점","세계 정세","전망","정세 브리핑","국제 질서","역사와 사상","분석 방법"];
const SR_EX = ["한반도 전쟁 가능성","김정은","러우 휴전 가능성","행복 지표","인구","호르무즈","반도체 관세","주한미군"];  /* v3.52 */
function srRender(){
  const q = $("#srchq").value, box = $("#srchres");
  SR.items = []; SR.act = -1;
  if (!q.trim()) { box.innerHTML = '<div class="srch-empty"><span>찾아볼 만한 말</span><div class="chips">' + SR_EX.map(x => '<button type="button" class="chip" data-srq="' + esc(x) + '">' + esc(x) + "</button>").join("") + "</div></div>"; return; }
  let R = srSearch(q), part = false;
  if (!R.length && q.trim().split(/\s+/).length > 1) { R = srSearch(q, true); part = R.length > 0; }  /* v3.52 */
  if (!R.length) { box.innerHTML = '<div class="srch-empty">‘' + esc(q) + '’에 맞는 내용이 없습니다. 더 짧은 낱말이나 다른 이름으로 찾아 보십시오.<div class="chips" style="margin-top:10px">' + SR_EX.map(x => '<button type="button" class="chip" data-srq="' + esc(x) + '">' + esc(x) + "</button>").join("") + "</div></div>"; return; }
  let h = part ? '<div class="srch-note">찾는 말이 모두 들어 있는 내용은 없어, 일부 낱말이 맞는 내용을 보여 줍니다.</div>' : "";
  /* v3.19 제목이 맞은 묶음을 먼저 보인다. 점수가 같으면 SR_ORDER 순서 */
  const best = {}; R.forEach(r => { if (!(r.e.g in best)) best[r.e.g] = r.sc; });
  const GO = SR_ORDER.filter(g => g in best).sort((a, b) => best[b] - best[a] || SR_ORDER.indexOf(a) - SR_ORDER.indexOf(b));
  for (const g of GO) {
    const rs = R.filter(r => r.e.g === g); if (!rs.length) continue;
    const lim = SR.more[g] ? rs.length : 5;
    h += '<div class="srch-g"><span>' + g + "</span><span>" + rs.length + "건</span></div>";
    rs.slice(0, lim).forEach(r => { const i = SR.items.push(r) - 1; h += '<button type="button" class="srch-item" role="option" aria-selected="false" data-sri="' + i + '"><b>' + srSnip(r.e.t, r.vs) + '</b><span class="snip">' + srSnip(r.e.b, r.vs) + "</span></button>"; });
    if (rs.length > lim) h += '<button type="button" class="srch-more" data-srmore="' + esc(g) + '">' + (rs.length - lim) + "건 더 보기</button>";
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
  if (!SR.LD && !SR.ldw) { SR.ldw = 1; fetch("/data/search_leaders.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : Promise.reject()).then(j => { SR.LD = j; SR.idx = null; if (!$("#srch").hidden) { srBuild(); srRender(); } }).catch(() => { SR.ldw = 0; }); }
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
const BRIEF_P = fetch("/data/daily.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
/* v3.86(2026-10-08 결재) 미군 해외 배치는 data/posture.json(매주·매월 예약 작업이 고침)을 따로 받아 자료에 붙인다. 못 받으면 미군 배치 없이 연다 */
const POSTURE_P = fetch("/data/posture.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null);
fetch("/data/eurasia.json", {cache: "no-cache"}).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => POSTURE_P.then(p => { if (p && p.res && p.fleet && p.events) d.posture = p; else delete d.posture; return d; })).then(d => { init(d); return fetch("/data/world-50m.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }); }).then(w => initGlobe(w)).catch(err => {
  console.error(err);
  const l = $("#loading"); if (l) l.textContent = "데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.";
});
const RENDERED = {};
const markR = (t, f) => function(){ RENDERED[t] = true; return f.apply(this, arguments); };
renderStrat = markR("strat", renderStrat); renderForecasts = markR("forecast", renderForecasts); renderGrand = markR("grand", renderGrand); renderIdeas = markR("ideas", renderIdeas); renderMethod = markR("method", renderMethod); renderFeature = markR("feature", renderFeature); renderDiscuss = markR("discuss", renderDiscuss);
const TAB_RENDER = {industry: () => renderIndustry(), brief: () => renderBrief(), strat: () => renderStrat(), forecast: () => renderForecasts(), grand: () => renderGrand(), ideas: () => renderIdeas(), method: () => renderMethod(), feature: () => renderFeature(), discuss: () => renderDiscuss()};
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
  (D.strategies || []).forEach(c => { (c.deciders ? c.deciders.items : []).forEach(d => addF(d.iso, 3)); const r = String(c.recipient || ""); addF(c.subject || (r.includes("우크라이나") ? "UKR" : r.includes("대만") ? "TWN" : "KOR"), 3); });
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
  const cc = center(); $("#readout").textContent = "중심 " + fmtDeg(cc[0], "E", "W") + " " + fmtDeg(cc[1], "N", "S") + " · " + S.k.toFixed(1) + "×";
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
      const man = n => n >= 10000 ? (n >= 1e5 ? Math.round(n / 1e4) : (Math.round(n / 1e3) / 10)) + "만" : n >= 1000 ? (Math.round(n / 100) / 10) + "천" : n + "명";  /* v3.79 9,700명이 '10천'으로 나오던 오류 */
      const parts = []; if (ap) parts.push(man(ap)); if (nk) parts.push("핵 " + nk.toLocaleString("ko-KR"));
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
const manK = n => n >= 10000 ? (Math.round(n / 1e3) / 10) + "만" : n >= 1000 ? (Math.round(n / 100) / 10) + "천" : String(n);
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
    const t = [g.cv ? "항모 " + g.cv : "", g.ar ? "상륙전단 " + g.ar : ""].filter(Boolean).join(" · "), f = "700 10px " + F, y = place(t, g._p[0], g._p[1], f, [13, -13, 25]); if (y != null) txt(t, g._p[0], y, C.ink, f); }
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
    const set = on => { SPIN.on = on; b.textContent = on ? "⏸" : "⟳"; const l = on ? "지구본 회전 멈춤" : "지구본 회전 시작"; b.title = l; b.setAttribute("aria-label", l); b.setAttribute("aria-pressed", on); };
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
    if (blb && BR) { const [d, n] = blb.dataset.bloc.split("|"), x = BR.issues.find(z => z.date === d), it = x && x.items[+n]; if (it && it.loc) placeGo(it.loc, "브리핑 · " + it.h); return; }
    const dgb = ev.target.closest("[data-dg]");  /* v3.83 정세 요약 제목 → 관련국을 지구본에 */
    if (dgb) { const g = (D.digest || [])[+dgb.dataset.dg]; if (g && (g.ids || []).length) placeGo({isos: g.ids}, "정세 요약 · " + g.t); return; }
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
    else if (o.vs) html = "<b>" + esc(o.name) + "</b>" + o.vs.map(v => "<br>" + esc(v.name) + ' <span class="m">' + (v.type === "cv" ? "항모" : "상륙전단") + " · 모항 " + esc(v.home) + "</span>" + (v.note ? '<br><span class="m">' + esc(v.note) + "</span>" : "")).join("") + '<br><span class="m">미 해군연구소 함대 추적 · ' + ymd(P.fleet.asof) + "</span>";
    else html = "<b>" + esc(o.name) + '</b> 상주 미군 <span class="num">' + o.n.toLocaleString("ko-KR") + "</span>명" + (o.prev ? '<br><span class="m">직전 분기 ' + o.prev.toLocaleString("ko-KR") + "명 · " + ((o.n - o.prev) >= 0 ? "+" : "") + (o.n - o.prev).toLocaleString("ko-KR") + "</span>" : "") + '<br><span class="m">미 국방부 인력데이터센터 · ' + ymd(P.res.asof) + " 기준</span>";
  }
  else if (h.fp) html = "<b>" + esc(h.fp.name_ko) + "</b><br>" + pips(h.fp.severity) + ' <span class="m">심각도 ' + h.fp.severity + "/5</span><br><span class=\"m num\">" + esc(h.fp.last_major_event ? h.fp.last_major_event.date : "") + "</span> " + esc(h.fp.last_major_event ? h.fp.last_major_event.text : "");
  else if (h.iso && D.countries[h.iso]) { const c = D.countries[h.iso]; html = "<b>" + esc(c.name_ko) + '</b> <span class="m">' + esc(c.region) + "</span><br>" + (S.layer === "focus" ? '관련 전망 <span class="num">' + (FCN[c.iso] || 0) + "</span>건" : LAYERS[S.layer].label + ' <span class="num">' + (c.scores ? c.scores[S.layer] : "—") + "</span>") + '<br><span class="m">' + esc(shortLeader(c.leader)) + "</span>"; }
  else if (h.f) html = "<b>" + esc(h.f.properties.name) + '</b><br><span class="m">분석 범위 밖</span>';
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
  evPop(chip, e); placeGo(e.loc || {}, "일정 · " + e.t);
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
  placeGo(F.loc || (fp ? {lon: fp.lon, lat: fp.lat, place: fp.name_ko, isos: F.countries || []} : {isos: F.countries || []}), "전망 · " + (F.s || F.q));
}
function evPop(chip, e){
  if (FCP && FCP.dataset.for === "ev:" + e.id) { fcPopClose(); return; }
  fcPopClose();
  const L = e.loc || {}, cs = (D.strategies || []).filter(c => (e.cases || []).includes(c.id)).map(c => c.title.split(":")[0]);
  const where = L.place || (L.isos || []).map(i => (D.countries[i] || {}).name_ko).filter(Boolean).join(" · ");
  const el = document.createElement("div"); el.id = "fcpop"; el.dataset.for = "ev:" + e.id; el.setAttribute("role", "dialog");
  el.innerHTML = '<div class="fcp-h">일정 · ' + esc(evDate(e)) + '<button type="button" class="fcp-x" aria-label="닫기">×</button></div><p>' + esc(e.t) + "</p>" +
    (where ? '<p class="fcp-d">' + (L.place ? "장소 " : "관련국 ") + esc(where) + "</p>" : "") + (cs.length ? '<p class="fcp-d">관련 사안 · ' + esc(cs.join(" · ")) + "</p>" : "");
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
  if (S.lens) $("#lensname").textContent = "관점 · " + LENS_NAME[S.lens.id];
  document.querySelectorAll("#offmap [data-iso]").forEach(b => b.classList.toggle("on", !!(S.lens && S.lens.off.includes(b.dataset.iso))));
  document.querySelectorAll(".lens-btn[data-lens]").forEach(b => { const on = !!(S.lens && S.lens.id === b.dataset.lens); b.setAttribute("aria-pressed", on); if (b.dataset.kind === "shelf") b.textContent = on ? "관점 끄기" : "지구본에서 보기 · " + LENS_NAME[b.dataset.lens]; });
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
  const k = t === "detail" || (t === "brief" && S.bdate) ? "overview" : t === "page" ? ((location.pathname.match(/^\/(leader|power|guide|brief|about)/) || [])[1] || "") : t;
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
  const tk = S.layer === "focus" ? "<span>적음</span><span></span><span>많음</span>" : "<span>0</span><span>50</span><span>100</span>";
  const sw = (k, on, body) => '<button type="button" class="mt" data-mt="' + k + '" aria-pressed="' + on + '"><span class="sw" aria-hidden="true"></span>' + body + "</button>";
  $("#legend").classList.toggle("usfon", !!(S.showUsf && D && D.posture));
  $("#legend").innerHTML = '<button type="button" class="legx" data-legx aria-label="접기" title="접기">×</button>' +
    '<div><label class="lt" for="lysel">지구본 색 기준</label><select id="lysel">' + Object.keys(LAYERS).map(k => '<option value="' + k + '"' + (k === S.layer ? " selected" : "") + ">" + LAYERS[k].label + "</option>").join("") + '</select><div class="ld">' + L.desc + "</div></div>" +
    '<div class="ramp" style="background:linear-gradient(90deg,' + stops + ')"></div><div class="ticks">' + tk + "</div>" +
    '<div class="keys"><div class="lt">표시 켜고 끄기</div>' +
      sw("edge", S.showEdge, '<span class="kk2"><span class="kk">' + line(C.coop, false, 18) + "협력·동맹</span><span class=\"kk\">" + line(C.conflict, true, 18) + "대립·교전</span></span>") +
      sw("fp", S.showFp, '<span class="kk"><svg width="26" height="12" aria-hidden="true"><circle cx="13" cy="6" r="5" fill="' + C.conflict + '" stroke="' + C.halo + '" stroke-width="1.5"/></svg>분쟁지 (크기 = 심각도)</span>') +
      '<div class="kk" style="padding-left:30px"><svg width="26" height="10" aria-hidden="true"><rect x="3" y="1" width="20" height="8" rx="1" fill="' + C.landOut + '" stroke="' + C.line + '"/></svg>분석 범위 밖</div>' +
    "</div>" + (D && D.posture ? '<div class="actv"><div class="lt">군사 배치 보기</div><button type="button" class="av" data-mt="usf" aria-pressed="' + S.showUsf + '"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.4" fill="currentColor"/></svg><span>미군 해외 배치</span><span class="avs">' + (S.showUsf ? "보는 중 · 끄기" : "켜기") + '</span></button>' +
      '<div class="ld">켜면 관계선과 분쟁지 표시가 꺼집니다.</div>' + (S.showUsf ? usfLegend() : "") + "</div>" : "");
}
/* v3.77 미군 해외 배치: 범례에는 기호 설명만. v3.86부터 자료와 출처는 권력 구조 > 미국 > 군 쪽(usfParts) */
const SHIP_SVG = c => '<svg width="16" height="10" aria-hidden="true" style="vertical-align:-1px"><path d="M1 3H15L12 9H4Z" fill="' + c + '"/><rect x="8" y="0" width="3" height="3" fill="' + c + '"/></svg>';
function usfLegend(){
  return '<div class="usf ld"><span><b style="color:' + C.accent + '">○</b> 상주 인원</span><span>' + SHIP_SVG(C.ink) + ' 항모·상륙전단</span><span><b style="color:' + C.conflict + '">▲</b> 증파</span><span><b style="color:' + C.accent + '">▼</b> 감축</span><span>◆ 법</span><span>◇ 계획</span>' +
    '<a class="chip" href="/power/USA/military/" data-usfgo>미국의 군 · 자료와 출처 →</a></div>';
}
const ymdK = s => { const a = s.split("-"); return a[0] + "년 " + (+a[1]) + "월" + (a[2] ? " " + (+a[2]) + "일" : ""); };
/* v3.86(2026-10-08 결재) 미국의 군 쪽(/power/USA/military/)의 '배치'와 '태세 변화'를 data/posture.json으로 채운다 */
function usfParts(){
  const P = D.posture, R = P.res, sh = R.shares, a = sh[0], z = sh[sh.length - 1], q = ymdK;
  const spark = k => { const v = sh.map(x => x[k]), mn = Math.min(...v), mx = Math.max(...v), r = (mx - mn) || 1;
    return '<svg width="64" height="18" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.5" points="' + v.map((y, n) => (2 + n * 12) + "," + (16 - (y - mn) / r * 14).toFixed(1)).join(" ") + '"/></svg>'; };
  const row = (k, lab) => '<tr><th>' + lab + '</th><td class="bar" style="background-size:' + z[k] + '% 8px"></td><td class="num">' + z[k].toFixed(1) + '%</td><td class="sp">' + spark(k) + '</td><td class="num m">' + a[k].toFixed(1) + "% → " + z[k].toFixed(1) + "%</td></tr>";
  const top = R.items.slice(0, 8).map(r => { const d = r.prev ? r.n - r.prev : 0; return "<li><b>" + esc(r.name) + '</b> <span class="num">' + r.n.toLocaleString("ko-KR") + '명</span> <span class="m num">' + (d >= 0 ? "+" : "") + d.toLocaleString("ko-KR") + "</span></li>"; }).join("");
  const lk = e => { const c = e.case && (D.strategies || []).find(x => x.id === e.case), fp = e.fp && D.flashpoints.find(x => x.id === e.fp);
    const h = (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + '">' + esc(c.title.split(":")[0]) + "</button>" : "") +
      (e.fc || []).map(id => { const F = D.forecasts.find(f => f.id === id && f.status === "open"); return F ? '<button type="button" class="fcchip" data-fc="' + esc(id) + '" title="' + esc(F.q) + '">' + fcLab(F, id, F.p) + "</button>" : ""; }).join("") +
      (fp ? '<button type="button" class="chip" data-fp="' + esc(fp.id) + '">' + esc(fp.name_ko) + "</button>" : "");
    return h ? '<div class="ml-l">' + h + "</div>" : ""; };
  const ev = usfEvents().slice().reverse().map(e => '<li><span class="usf-g usf-' + e.kind + '">' + USF_GL[e.kind] + e.no + '</span><span class="m num">' + ymdK(e.date) + "</span> " + esc(e.t) + ' <span class="grade">' + esc(e.grade) + "</span> " + (e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener" class="m">' + esc(e.src) + "</a>" : '<span class="m">' + esc(e.src) + "</span>") + lk(e) + "</li>").join("");
  const fl = usfFleet().map(g => "<li><b>" + esc(g.name) + "</b> " + g.vs.map(v => esc(v.name) + (v.fwd ? '<span class="m">(모항 ' + esc(v.home) + ")</span>" : "")).join(", ") + "</li>").join("");
  return {
    deploy: '<div class="usf-card"><p class="note">이 쪽을 여는 동안 지구본에 미군 해외 배치가 보입니다. 원은 상주 인원, 배 모양은 항모·상륙전단, 번호를 붙인 기호는 아래 태세 변화의 증파·감축·법·계획입니다.</p>' +
      '<h4>상주 인원의 지역별 비중</h4><p class="m">해외 상주 미군 ' + R.total.toLocaleString("ko-KR") + "명(" + ymdK(R.asof) + " 기준), " + q(a.q) + "부터 " + q(z.q) + "까지 6개 분기</p>" +
      '<table class="usf-t">' + row("ip", "인도·태평양") + row("eu", "유럽") + row("me", "중동") + "</table>" +
      '<p class="m">' + esc(R.note) + "</p>" +
      '<h4>상주 인원이 많은 곳</h4><ul class="usf-top">' + top + '</ul><p class="m">숫자 옆은 직전 분기(' + q(sh[sh.length - 2].q) + ")보다 늘거나 준 인원</p>" +
      '<h4>항모·상륙전단</h4><ul class="usf-top">' + fl + '</ul>' +
      '<p class="m">출처: <a href="' + esc(R.url) + '" target="_blank" rel="noopener">미 국방부 인력데이터센터(DMDC)</a> 분기 통계 · <a href="' + esc(P.fleet.url) + '" target="_blank" rel="noopener">미 해군연구소(USNI) 함대 추적</a> ' + ymdK(P.fleet.asof) + " · 함정 위치는 공개 자료 기준의 대략적 해역입니다. 함정 위치와 태세 변화는 매주, 상주 인원은 국방부 통계가 새로 나오는 분기마다 고칩니다.</p></div>",
    changes: '<div class="usf-card"><ul class="usf-ev">' + ev + '</ul><p class="m">등급: 공식(정부 발표), 법(법 조문), 2차(분석 기관이 전한 정부 확인), 보도(익명 당국자 등 언론 보도). 번호는 지구본의 기호 번호와 같습니다.</p></div>'
  };
}
function usfFill(){  /* 미국의 군 쪽이 글 칸에 있으면 배치·태세 변화 칸을 채운다 */
  const a = document.getElementById("usf-deploy"), b = document.getElementById("usf-changes");
  if (!D || !(a || b) || (a && a.dataset.done)) return;
  if (!D.posture) { [a, b].forEach(x => { if (x) x.textContent = "미군 배치 자료를 불러오지 못했습니다. 새로고침해 주세요."; }); return; }
  const x = usfParts(); if (a) { a.innerHTML = x.deploy; a.dataset.done = 1; } if (b) b.innerHTML = x.changes;
}
/*ONE{*/ /* v4.08 시안(2026-10-16): 산업별 미래·국민의 삶 카드 맨 위 한 문장, 전략 분석 판단 문장의 주어 구절. 정해 둔 틀 문장에 점 개수만 끼운다 */
const jo = (w, a, b) => { const t = String(w), c = t.slice(-1), h = c.charCodeAt(0) - 0xAC00; return t + ((h >= 0 && h <= 11171) ? (h % 28 ? a : b) : ("013678".indexOf(c) >= 0 ? a : b)); };
const roOf = w => { const h = String(w).slice(-1).charCodeAt(0) - 0xAC00; return (h >= 0 && h <= 11171 && h % 28 && h % 28 !== 8) ? "으로" : "로"; };
const oB = (k, t) => '<b class="o-' + k + '">' + t + "</b>";
function oneInd(name, n, I){
  const G = n.better, K = n.big, B = n.big + n.worse, S = n.same, sj = oB("s", esc(name) + " 이익은"), par = K ? "(" + (K === B ? "모두" : "그 가운데 " + K + "번은") + " 30% 넘게 줄거나 적자)" : "";
  let t;
  if (!G && !B) t = sj + " 2030년까지 100번의 미래 모두 현 추세와 비슷합니다.";
  else { t = sj + " 2030년까지 100번의 미래 중 " + (G >= B ? oB("g", G + "번 현 추세보다 10% 넘게 늘고") + ", " + (B ? oB("w", B + "번은 10% 넘게 줄어듭니다") + par : "10% 넘게 줄어드는 경우는 없습니다")
      : G ? oB("w", B + "번 현 추세보다 10% 넘게 줄고") + par + ", " + oB("g", G + "번은 10% 넘게 늘어납니다") : oB("w", B + "번 현 추세보다 10% 넘게 줄어듭니다") + par) + ".";
    if (S) t += " " + S + "번은 현 추세와 비슷합니다.";
    }
  return '<p class="one"><small>5개 사안 종합</small>' + t + (I ? indKeys(I) : "") + "</p>";
}
function oneLife(name, n){
  const G = n.better, K = n.big, B = n.big + n.worse, S = n.same, sj = oB("s", esc(jo(name, "은", "는"))), par = K ? "(" + (K === B ? "모두" : "그 가운데 " + K + "번은") + " 크게 나빠진 삶)" : "";
  let t;
  if (!G && !B) t = sj + " 2030년까지 100번의 미래 모두 현재와 비슷한 삶입니다.";
  else { t = sj + " 2030년까지 100번의 미래 중 " + (B >= G ? oB("w", B + "번이 현재보다 나쁜 삶") + par + "이고, " + (G ? oB("g", G + "번이 나은 삶") + "입니다" : "나은 삶은 없습니다")
      : oB("g", G + "번이 현재보다 나은 삶") + "이고, " + (B ? oB("w", B + "번이 나쁜 삶") + par + "입니다" : "나쁜 삶은 없습니다")) + ".";
    if (S) t += " " + S + "번은 현재와 비슷한 삶입니다.";
    }
  return '<p class="one"><small>5개 사안 종합</small>' + t + "</p>";
}
function oneMain(pr){  /* 당사국 국민: 사안마다 국민이 달라 합칠 수 없으므로, 현재보다 나쁜 삶이 가장 많은 국민과 가장 적은 국민을 나란히 */
  const a = pr.map(([c, G]) => { const n = hsCount(c.hs7, G, "p"); return [G.name, n.big + n.worse, n.better]; });
  const hi = Math.max(...a.map(x => x[1])), lo = Math.min(...a.map(x => x[1])), nm = v => a.filter(x => x[1] === v).map(x => x[0]);
  const list = v => { const L = nm(v); return L.length > 1 ? L.slice(0, -1).map((x, i) => i === L.length - 2 ? jo(x, "과", "와") : x + ",").join(" ") + " " + L[L.length - 1] : L[0]; };
  const t = hi === lo ? "당사국 국민은 모두 2030년까지 100번의 미래 중 " + oB("w", hi + "번") + "이 현재보다 나쁜 삶입니다."
    : "2030년까지 100번의 미래 가운데 현재보다 나쁜 삶이 가장 많은 국민은 " + oB("s", esc(list(hi))) + roOf(list(hi)) + " " + oB("w", hi + "번") + "이고, " + (lo ? "가장 적은 국민은 " + oB("s", esc(list(lo))) + roOf(list(lo)) + " " + oB("w", lo + "번") + "입니다." : oB("s", esc(jo(list(lo), "은", "는"))) + " 나빠지는 경우가 없습니다.");
  return '<p class="one">' + t + "</p>";
}
const INS_SUBJ = ["한국에 전쟁 못지않게 현실적인 위험은", "북한이 협상의 대가로 가장 원하는 것은", "2040년 전후 한국의 병력 부족은", "현재 전선에서의 러-우 정전은", "대만해협의 향방은", "이란은", "미군 상설 주둔이 겨냥하는 것은"];
function insHead(h){ const s = INS_SUBJ.find(p => String(h).indexOf(p) === 0); return s ? oB("s", esc(s)) + esc(String(h).slice(s.length)) : esc(h); }
function indKeys(I){  /* v4.12(2026-10-17 결재): 산업마다 이익을 가장 크게 줄이는 전개와 늘리는 전개(가능성 × 크기 기준) */
  const all = []; IND.cases.forEach(c => c.scen.forEach(s => { const z = (IND.cells[I.k][c.id] || {})[s.id]; if (z && Math.abs(z.x) >= 0.03) all.push({c, s, x: z.x, e: s.p * Math.abs(z.x)}); }));
  const pick = (f, big) => all.filter(o => f(o) && (!big || Math.abs(o.x) > 0.10)).sort((a, b) => b.e - a.e)[0];  /* 점 그림에 색으로 잡히는 전개(±10% 넘게)를 먼저, 없으면 3% 넘는 전개 */
  const dn = pick(o => o.x < 0, 1) || pick(o => o.x < 0), up = pick(o => o.x > 0, 1) || pick(o => o.x > 0);
  const lab = o => esc(IND_SHORT[o.c.id] || o.c.title) + " ‘" + esc(o.s.name) + "’(100번 중 " + o.s.p + "번)";
  return '<span class="ok"><i class="ok-w">하락 요인</i>' + (dn ? lab(dn) + ": 이익이 현 추세보다 약 " + Math.round(-dn.x * 100) + "% 줄어듭니다." : "어느 전개에서도 이익이 3% 넘게 줄지 않습니다.") + "</span>" +
    '<span class="ok"><i class="ok-g">상승 요인</i>' + (up ? lab(up) + ": 이익이 현 추세보다 약 " + Math.round(up.x * 100) + "% 늘어납니다." : "어느 전개에서도 이익이 3% 넘게 늘지 않습니다.") + "</span>";
}
const IND_GRP = {a: ["분쟁 결과에 따라 이익이 크게 변하는 산업", "전개에 따라 이익이 현 추세보다 10% 넘게 늘어나는 경우가 있는 산업입니다."],
  b: ["분쟁이 주로 위험으로 작용하는 산업", "이익을 크게 줄이는 전개는 있지만 크게 늘리는 전개는 없는 산업입니다. 이 산업의 성장은 기준선에 이미 들어 있고, 분쟁은 그 길을 끊을 수 있는 위험으로만 작용합니다."],
  c: ["이 분쟁들의 영향이 작은 산업", "100번의 미래 가운데 이익이 현 추세보다 10% 넘게 달라지는 경우가 5번 미만인 산업입니다."], open: "칸 펼쳐 보기",
  note: "하락 요인과 상승 요인은 이익을 현 추세보다 10% 넘게 바꾸는 전개 가운데 가능성과 변화의 크기를 곱한 값이 가장 큰 전개입니다. 그런 전개가 없으면 3% 넘게 바꾸는 전개 가운데 고릅니다."};
function indGrp(I){ if (IND.cases.some(c => c.scen.some(s => ((IND.cells[I.k][c.id] || {})[s.id] || {}).c === "better"))) return "a";
  const n = cmbCount("ind|" + I.k, BR.issues[0].date); return n.big + n.worse + n.better < 5 ? "c" : "b"; }
function indGrpWrap(L, f){  /* 산업을 3개 묶음으로: 기회와 위험이 함께, 위험이 주로, 영향이 작음(접어 둠) */
  return ["a", "b", "c"].map(g => { const M = L.filter(x => indGrp(x[0]) === g); if (!M.length) return "";
    const h = '<h3 class="ind-gh">' + IND_GRP[g][0] + '</h3><p class="ind-gd">' + (g === "c" ? esc(M.map(x => x[0].name).join(", ")) + " · " : "") + IND_GRP[g][1] + "</p>";
    return '<section class="ind-g ind-g-' + g + '">' + h + (g === "c" ? '<details class="ind-small"><summary>' + IND_GRP.open + "</summary>" + M.map(f).join("") + "</details>" : M.map(f).join("")) + "</section>"; }).join("");
}
const IND_TXT = {  /* v4.13(2026-10-17 결재): 산업별 미래를 '분쟁이 산업 이익을 얼마나 흔드는가'로 개편 */
  h2: "5개 분쟁은 산업 이익을 얼마나 흔들까?",
  lead: "<b>5개 분쟁이 2030년까지 산업별 이익을 어디서, 얼마나 흔드는지 보여 줍니다.</b> 기준선은 각 분쟁이 현재 상태로 이어질 때 그 산업이 가는 이익 추세이며, 분쟁과 관계없는 성장은 이 기준선에 이미 들어 있습니다. 점 하나가 분쟁의 전개 하나이고, 점이 클수록 그 전개의 가능성이 큽니다. 점이 0 근처에 모여 있으면 분쟁이 그 산업의 길을 거의 바꾸지 않는다는 뜻입니다. 줄을 누르면 전개별 판단 근거가 열립니다. 점의 위치와 크기는 클리사 지오폴리틱스의 판단값입니다.",
  size: "점 크기 = 그 전개의 가능성", band: "회색 띠 = 현 추세와 비슷함(±10%)",
  of: p => "100번 중 " + p + "번", chg: x => "이익 " + indPct(x)};
/*}ONE*/
function insightsHtml(){
  const cs = D.strategies || [];
  return (D.insights || []).length ? '<section class="sec" id="s-ins"><h3>주요 판단 ' + ttsBtn("ins") + '</h3><p class="note" style="margin-bottom:8px">클리사 지오폴리틱스의 분석 가운데 통상적 시각과 결론을 달리하는 판단을 우선 제시합니다. 칩을 누르면 그 판단과 관련한 전망이 뜨고, 아래 단추를 누르면 해당 사안의 분석으로 이동합니다.</p><ol class="ic-list">' + D.insights.map((k, n) => { const c = cs.find(x => x.id === k.case); const m = String(k.t).match(/^(.+?다\.)\s(.+)$/s); const head = m ? m[1] : k.t, rest = m ? m[2] : "";
      return '<li class="ic ic-' + esc(k.case) + '"><div class="ic-top"><span class="ic-n">' + (n + 1) + '</span>' + (c ? '<span class="ic-case">' + esc(c.title.split(":")[0]) + "</span>" : "") + (k.fc || []).map(id => { const F = D.forecasts.find(f => f.id === id); return '<button type="button" class="fcchip" data-fc="' + esc(id) + '" title="' + esc(F ? F.q : "") + '">' + fcLab(F, id, F ? F.p : null) + "</button>"; }).join("") + '</div><p class="ic-h">' + insHead(head) + "</p>" +
        (rest ? '<p class="ic-why"><b>근거</b> ' + esc(rest) + "</p>" : "") + (c || k.feature ? '<div class="chips" style="margin:0">' + (k.feature ? FEATS().filter(F => F.id === k.feature).map(featBtn).join("") : "") + (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + '">사안 분석 보기 · ' + esc(c.title.split(":")[0]) + "</button>" : "") + "</div>" : "") + "</li>"; }).join("") + "</ol></section>" : "";
}
/* v3.20 정세 브리핑: data/daily.json(평일 갱신)을 따로 읽는다. 없으면 아무것도 보이지 않는다. */
let BR = null; const HASH0 = location.hash;
const PIN = '<svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M5 0a5 5 0 0 0-5 5c0 3.6 5 7 5 7s5-3.4 5-7a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg>';  /* v3.83 위치 아이콘: 누르면 지구본이 그곳을 보이는 이름 끝에 붙인다(2026-10-08 결재) */
const FCE = {up:["↑","확률 상승 요인"], down:["↓","확률 하락 요인"], none:["–","변화 없음"]};
const fmtKD = s => { const a = String(s).split("-").map(Number); return a[1] + "월 " + a[2] + "일"; };
function dailyIssue(x){
  const fc = f => { const F = D.forecasts.find(z => z.id === f.id), e = FCE[f.e] || FCE.none;
    return '<button type="button" class="fcchip bfc bfc-' + esc(f.e) + '" data-fc="' + esc(f.id) + '" title="' + esc((F ? F.q + " · " : "") + e[1]) + '">' + fcLab(F, f.id, F ? F.p : null) + ' <b aria-hidden="true">' + e[0] + '</b><span class="sr">' + e[1] + "</span></button>"; };
  const cs = id => { const c = (D.strategies || []).find(k => k.id === id); return c ? '<button type="button" class="chip" data-case="' + esc(id) + '">' + esc(c.title.split(":")[0]) + "</button>" : ""; };
  return x.items.map((i, n) => '<article class="bi"' + (x === (BR.issues || [])[0] ? ' id="bi-' + n + '"' : "") + '><h4>' + (i.loc ? '<button type="button" class="bh" data-bloc="' + esc(x.date) + "|" + n + '" title="지구본에서 위치 보기">' + esc(i.h) + PIN + "</button>" : esc(i.h)) + "</h4>" + (i.fact ? "<p>" + esc(i.fact) + "</p>" : "") + (i.link ? '<p class="bl"><span class="bl-k">판단과의 연결</span>' + esc(i.link) + "</p>" : "") +  /* v3.92: 한 줄 정보 형식의 호는 fact·link가 없다 */
      '<div class="chips" style="margin:0">' + cs(i.case) + (i.fc || []).map(fc).join("") + "</div>" +  /* v3.83 장소가 있는 꼭지는 제목을 누르면 지구본이 그곳을 보인다(2026-10-08 결재, 위치 보기 단추를 대신함) */
      ((i.src || []).length ? '<details class="src"><summary>출처 ' + i.src.length + "</summary><ul>" + i.src.map(srcItem).join("") + "</ul></details>" : "") + "</article>").join("") +
    weekLine(x.date) +
    ((x.more || []).length ? '<div class="bm"><b>그 밖의 동향</b><ul>' + x.more.map(m => "<li>" + esc(m.t) + ((m.src || []).length ? ' <a href="' + esc(m.src[0]) + '" target="_blank" rel="noopener" class="note">출처</a>' : "") + "</li>").join("") + "</ul></div>" : "");
}
/* v3.52 주간 전망 점검(2026-10-05 결재): 날짜별 브리핑에 속할 내용이 아니어서 전망과 검증 탭으로 옮겼다(D.fc_reviews, 최신이 앞).
   점검한 날의 브리핑에는 한 줄 안내만 둔다 */
const FCR = () => (D.fc_reviews || []).map(r => Object.assign({}, r, {items: (r.items || []).filter(it => D.forecasts.some(f => f.id === it.id))})).filter(r => r.items.length || r.note);
function weekLine(date){
  const r = FCR().find(x => x.date === date); if (!r) return "";
  const ch = r.items.filter(it => it.from !== it.to).length, keep = r.items.length - ch;
  return '<p class="bw1"><b>이번 주 전망 점검</b> ' + [ch ? ch + "건 조정" : "", keep ? keep + "건 유지" : ""].filter(Boolean).join(", ") + ' <button type="button" class="chip" data-fw="' + esc(r.date) + '">전망과 검증에서 보기 →</button></p>';
}
function weekHtml(r, open){  /* v3.50 전망 번호 대신 짧은 이름(교본 9장) */
  const li = it => { const F = D.forecasts.find(z => z.id === it.id); return '<li data-fid="' + esc(it.id) + '"><button type="button" class="fcchip" data-fc="' + esc(it.id) + '" title="' + esc(F ? F.q : "") + '">' + (F && F.s ? '<span class="fcs">' + esc(F.s) + "</span>" : esc(it.id)) + '</button> <span class="pp' + (it.from === it.to ? ' pp0">' + it.to + "% 유지" : '"><i aria-hidden="true">' + (it.to > it.from ? "▲" : "▼") + "</i>" + it.from + "% → " + it.to + "%") + "</span><p>" + esc(it.why) + "</p></li>"; };
  return '<details class="fw" id="fw-' + esc(r.date) + '"' + (open ? " open" : "") + '><summary><b>' + fmtKD(r.date) + ' 점검</b> <span class="note">' + r.items.filter(it => it.from !== it.to).length + "건 조정 · " + r.items.filter(it => it.from === it.to).length + "건 유지</span></summary>" +
    (r.note ? '<p class="note">' + esc(r.note) + "</p>" : "") + (r.items.length ? "<ul>" + r.items.map(li).join("") + "</ul>" : "") + "</details>";
}
function fcHist(id){  /* 전망 항목의 확률 조정 이력 */
  const h = FCR().slice().reverse().flatMap(r => r.items.filter(it => it.id === id && it.from !== it.to).map(it => fmtKD(r.date) + " " + it.from + "% → " + it.to + "%"));
  return h.length ? '<span class="fch">확률 조정 · ' + esc(h.join(" · ")) + "</span>" : "";
}
/* v3.22 듣기: 기기에 내장된 한국어 음성으로 읽는다(파일·서버 없음). 한국어 음성이 없는 기기에서는 단추가 보이지 않는다(.tts-ok) */
const TTS = {btn:null, key:null, cur:0, pos:{}};
const ttsLab = key => (TTS.pos[key] ? "▶ 이어 듣기" : "▶ 듣기");
const ttsBtn = key => '<button type="button" class="tts" data-tts="' + esc(key) + '" aria-pressed="false">' + ttsLab(key) + "</button>";
function ttsVoice(){ try { return (speechSynthesis.getVoices() || []).find(v => /^ko/i.test(v.lang)) || null; } catch(e){ return null; } }
function ttsText(key){
  const [k, id] = String(key).split(":");
  if (k === "brief" && BR) { const x = briefCur(); return fmtKD(x.date) + " 정세 브리핑. " + x.items.map(i => i.h + "." + (i.fact ? " " + i.fact : "")).join(" ")  /* v3.38b(2026-10-01): 듣기에서는 '판단과의 연결'을 읽지 않는다. 결론 번호·전망 번호 같은 화면용 표현이 귀로는 어색하기 때문 */ + ((x.more || []).length ? " 그 밖의 동향. " + x.more.map(m => m.t).join(" ") : ""); }
  if (k === "digest") return "세계 정세 요약. " + D.digest.map(g => g.t + ". " + g.d).join(" ");
  if (k === "ins") return "주요 판단. " + (D.insights || []).map(g => { const a = String(g.t).split(/(?<=다\.)\s/); return a[0] + (a.length > 1 ? " 근거. " + a.slice(1).join(" ") : ""); }).join(" ");
  const cn = i => (D.countries[i] || {}).name_ko || i;
  const jw = w => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? "과" : "와"); };
  if (k === "scn") return "2030년까지의 세계 시나리오. " + D.grand.scenarios.map(x => x.name + ", " + x.p + "퍼센트. " + x.d + " " + (x.korea || "")).join(" ");
  if (k === "trend") return "구조적 흐름. " + D.grand.trends.map(x => x.t + ". " + x.d).join(" ");
  if (k === "ten") return "역사와 구조가 어긋나는 관계. " + D.grand.tensions.map(x => jw(cn(x.a)) + " " + cn(x.b) + ". " + (x.memory || "") + " " + (x.structure || "") + " " + (x.note || "")).join(" ");
  if (k === "dyad") { const [a, b] = id.split("|"), G = D.grand, d = G.dyads.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)), c = G.cells.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    return jw(cn(a)) + " " + cn(b) + "의 관계. " + (c ? c.t + ". " : "") + (d ? "협력할 수 있는 것. " + d.coop.join(", ") + ". 충돌하는 것. " + d.conflict.join(", ") + ". 전망. " + d.outlook : ""); }
  const H = D.history || {};
  if (k === "an") return "역사적 선례. " + (H.analogies || []).map(x => x.now + ". " + [].concat(x.cases || []).join(", ") + ". " + (x.then || "") + " " + (x.implies || "") + " " + (x.breaks || "")).join(" ");
  if (k === "law") return "역사적 반복 유형. " + (H.laws || []).map(x => x.t + ". " + x.d).join(" ");
  if (k === "th") return "참고 사상가. " + (D.thinkers || []).map(x => x.name + ". " + (x.bio || "") + " 핵심 명제. " + (x.props || []).map(p => p.t).join(" ") + " " + (x.claim || x.idea || "") + " " + (x.develop || "") + " " + (x.critique || "") + " " + (x.now || "") + " " + (x.record || "")).join(" ");
  if (k === "case") { const c = (D.strategies || []).find(z => z.id === id); if (!c) return ""; const B = c.brief || {}; /* v3.75 사안 요약 듣기에 화면 순서대로 '가장 유력한 전개'와 '상대편에서 본 최선의 수'를 넣는다(빠져 있어 건너뛰던 것, 2026-10-07). 괄호 속 보충은 읽지 않는다 */
    const top = ((c.futures || {}).items || []).slice().sort((x, y) => y.p - x.p)[0], W = (c.counter || [])[0];
    return c.title + ". " + (B.q ? "핵심 질문. " + B.q + (/[.?!]$/.test(B.q) ? " " : "? ") : "") + (B.a ? "판단. " + B.a + " " : "") + (top ? "가장 유력한 전개. " + top.name + ", " + top.p + "퍼센트. " : "") + (W && W.ranked && W.ranked[0] ? "상대편에서 본 최선의 수. " + W.name.replace(/\s*\(.*\)\s*$/, "") + ". " + ttsNoParen(W.ranked[0].t) + " " : "") + (B.eq ? "균형점. " + B.eq + " " : "") + (B.human ? "개인에게 미치는 영향. " + B.human : ""); }
  if (k === "feat") { const F = FEATS().find(z => z.id === id); if (!F) return ""; const t = x => ttsNoParen(String(x || "").replace(/\{\{[^}]*\}\}/g, ""));  /* v3.28 특집 듣기: 칩 표기는 읽지 않는다 */
    if (F.kind === "essay") return "특집. " + F.title + ". " + (F.summary_h || "요약") + ". " + (F.summary || []).map(t).join(" ") + " " + (F.sections || []).map(S => S.h + ". " + S.blocks.filter(b => b.p).map(b => t(b.p)).join(" ")).join(" ") +
      ((F.events || []).length ? " " + F.events_h + ". " + F.events.map(x => x.when + ". " + t(x.t)).join(" ") : "") + ((F.paths || []).length ? " " + F.paths_h + ". " + t(F.paths_lead) + " " + F.paths.map(x => x.k + ". " + t(x.t)).join(" ") : "") + ((F.falsify || []).length ? " " + F.falsify_h + ". " + t(F.falsify_lead) + " " + F.falsify.map(t).join(" ") : "");  /* v3.44 서술형 특집 듣기: 표는 읽지 않는다 */
    return "특집. " + F.title + ". " + ((F.summary || []).length ? (F.summary_h || "요약") + ". " + F.summary.map(t).join(" ") + " " : "") + t(F.lead) + " " + F.flows_h + ". " + F.flows.map(x => t(x.k) + ". " + t(x.t)).join(" ") + " " + F.window_h + ". " + F.window.map(t).join(" ") + " " + F.events_h + ". " + F.events.map(x => x.when + ". " + t(x.t)).join(" ") + " " + F.paths_h + ". " + t(F.paths_lead) + " " + F.paths.map(x => x.k + ". " + t(x.t)).join(" ") + " " + F.falsify_h + ". " + t(F.falsify_lead) + " " + F.falsify.map(t).join(" "); }
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
  TTS.btn = b; TTS.key = key; TTS.cur = from; b.setAttribute("aria-pressed", "true"); b.textContent = "■ 멈춤";
  tfStart(b.closest(".pane") || document.body, b); TF.hold = 0;
  /* v3.25 단추 모양을 먼저 바꿔 보이고, 음성 준비(문장 넣기·화면 꺼짐 방지)는 그다음 틀에서 한다 */
  requestAnimationFrame(() => setTimeout(() => { if (TTS.btn !== b) return; ttsWake(true);
  parts.slice(from).forEach((x, i) => { const n = from + i, u = new SpeechSynthesisUtterance(x.trim()); u.voice = v; u.lang = v.lang; u.rate = 1.05;
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
const ttsSplit = t => String(t).replace(/\s+/g, " ").trim().split(/(?<=[.?!])\s+/).filter(Boolean);
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
const tfNorm = t => String(t).replace(/퍼센트/g, "").replace(/\(([^()]*)\)|（[^（）]*）|\[[^\[\]]*\]/g, (m, x) => x !== undefined && TTS_ENUM.test(x) ? x : "").replace(/[^0-9A-Za-z가-힣]/g, "");
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
  const full = o.items.some(i => i.link), csn = id => LB_SHORT[id] || "기타";
  return '<details class="lb-past"><summary><span class="mono">' + fmtKD(o.date) + '</span><span class="nm">' + esc((o.items[0] || {}).h || "") + '</span><span class="lb-pn">' + (o.items.length + (o.more || []).length) + "건</span></summary>" +
    '<ul class="lb-list">' + o.items.map(i => '<li><span class="lb-cs">' + esc(csn(i.case)) + '</span><span class="lb-t">' + esc(i.h) + "</span>" + lbFx(i, true) + ((i.src || []).length ? '<a class="lb-src" href="' + esc(i.src[0]) + '" target="_blank" rel="noopener">출처</a>' : "") + bhFact(i) + "</li>").join("") +
    (o.more || []).map(m => '<li><span class="lb-cs lb-etc">기타</span><span class="lb-t">' + esc(firstSent(m.t)) + "</span>" + ((m.src || []).length ? '<a class="lb-src" href="' + esc(m.src[0]) + '" target="_blank" rel="noopener">출처</a>' : "") + "</li>").join("") + "</ul>" +
    '<p class="lb-pf"><a class="chip" href="/brief/' + esc(o.date) + '/" data-brief="' + esc(o.date) + '">' + (full ? "이날 정세 브리핑 전문 보기 →" : "이날 쪽으로 →") + "</a></p></details>";
}
function briefCur(){ return BR && ((BR.issues || []).find(x => x.date === S.bdate) || BR.issues[0]); }
function renderBrief(){
  const el = $("#pane-brief"); if (!el) return;
  if (!BR || !(BR.issues || []).length) { el.innerHTML = '<div class="sec"><h2>정세 브리핑</h2><p class="note">정세 브리핑을 불러오는 중입니다.</p></div>'; return; }
  const cur = briefCur(), others = BR.issues.filter(x => x !== cur);
  /* v3.92d: 최신 호도 날짜를 골라 들어오면(지난 정보 목록, 검색, /brief/날짜/) 예전 형식 전문으로 보인다. 전문(fact)이 있는 최신 호는 지난 정보 맨 위에 둔다 */
  const past = BR.issues.filter(x => x !== cur || x.items.some(i => i.link));
  if (cur === BR.issues[0] && !S.bdate) { el.innerHTML = '<div class="sec lbwrap">' + lifeBoardHtml(cur) + "</div>"; el.scrollTop = 0; fitTrends(el); return; }  /* v3.99: 정세 브리핑은 세계 정세 탭 맨 위로 옮김 */
  el.innerHTML = (cur === BR.issues[0] ? '<p class="lb-back"><button type="button" class="chip" data-go="overview" data-bgo="1">← 세계 정세의 정세 브리핑</button></p>' : "") + '<section class="sec dbrief" id="brief"><div class="bh"><h2>정세 브리핑</h2><span class="bd">' + fmtKD(cur.date) + "</span>" + ttsBtn("brief") + "</div>" +
    '<p class="note">최근 일어난 주요 사건을 클리사 지오폴리틱스의 판단·전망과 연결해 정리합니다. 화살표(↑·↓)는 해당 사건이 전망의 실현 가능성을 높이는지 낮추는지를 표시한 것입니다. 전망 확률은 매주 검토해 수정합니다.</p>' +
    dailyIssue(cur) + "</section>" +
    (others.length ? '<section class="sec"><h3>지난 정세 브리핑</h3><ul class="list blist">' + others.map(o => '<li><a class="row-btn" href="/brief/' + esc(o.date) + '/" data-brief="' + esc(o.date) + '"><span class="mono">' + fmtKD(o.date) + '</span> <span class="nm">' + esc((o.items[0] || {}).h || "") + "</span></a></li>").join("") + "</ul></section>" : "");
  el.scrollTop = 0;
}
function goBrief(date){ S.bdate = date || null; renderBrief(); switchTab("brief"); }
function dailyHtml(){
  if (!BR || !(BR.issues || []).length) return "";
  const cur = BR.issues[0], old = BR.issues.slice(1);
  return '<section class="sec dbrief" id="brief"><div class="bh"><h2>정세 브리핑</h2><span class="bd">' + fmtKD(cur.date) + '</span>' + ttsBtn("brief") + '</div>' +
    '<p class="note">최근 일어난 주요 사건을 클리사 지오폴리틱스의 판단·전망과 연결해 정리합니다. 화살표(↑·↓)는 해당 사건이 전망의 실현 가능성을 높이는지 낮추는지를 표시한 것입니다. 전망 확률은 매주 검토해 수정합니다.</p>' +
    dailyIssue(cur) +
    (old.length ? '<details class="bold"><summary>지난 브리핑 ' + old.length + "건</summary>" + old.map(o => '<details class="bo"><summary>' + fmtKD(o.date) + " · " + esc((o.items[0] || {}).h || "") + "</summary>" + dailyIssue(o) + "</details>").join("") + "</details>" : "") +
    "</section>";
}
/* v3.36b 돌아가는 띠. 항목 {k 머리말, d 날짜, t 제목, 그리고 n(공지)·j(브리핑 번호)·f(전망)·e(사건) 가운데 하나}. 4초마다 한 건씩 바꾸고, 마우스를 올리거나 누르고 있으면 멈춘다 */
function agendaItems(){
  return agenda(90).map(x => x.f ? {k: "검증 예정", d: x.f.due, t: (x.f.s || x.f.id + " " + x.f.q) + " · " + daysText(daysLeft(x.f.due)), f: x.f, soon: daysLeft(x.f.due) <= 30}
    : {k: "예정", d: x.e.date.length === 7 ? "" : x.e.date, t: x.e.t + " · " + (x.e.date.length === 7 ? evDate(x.e) : evDays(x.e)), e: x.e, soon: daysLeft(x.e.date.length === 7 ? x.e.date + "-01" : x.e.date) <= 30});
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
    if (S.tab === "forecast") { const pn = $("#pane-forecast"), y = pn ? pn.scrollTop : 0; renderForecasts(); if (pn) pn.scrollTop = y; }  /* v4.22 전망별 화면의 관련 사건은 브리핑 자료가 온 뒤 · v4.23 목록의 관련 꼭지 수도 */
    if (typeof IND !== "undefined" && IND && document.getElementById("indboard")) indBoard();  /* v3.98: 산업 탭이 브리핑 자료보다 먼저 그려졌으면 추이를 넣어 다시 그림 */
    /* v3.27 판단 변경 공지(머리말 n.k, 없으면 "분석 갱신")는 공지 날짜로부터 7일 동안 띠 첫머리에 두고, 그 뒤로 브리핑 제목을 돌린다(2026-10-01) */
    /* v3.44b 특집 공지는 11일 동안 둔다(2026-10-04) */
    const ymd = x => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"), lim = ymd(new Date(Date.now() - 7 * 864e5)), limF = ymd(new Date(Date.now() - 11 * 864e5));
    const NS = (D.notices || []).filter(n => n.date >= (n.k === "특집" ? limF : lim)).slice().sort((a, b) => b.date.localeCompare(a.date))
      .map(n => ({k: n.k || "분석 갱신", d: n.date, t: n.h || String(n.text).split(/(?<=다\.)\s/)[0], n}));
    /* v3.52b 전망 조정(주간 전망 점검에서 확률을 바꾼 전망)은 점검한 날부터 사흘 동안 공지 다음에 돌린다(2026-10-05) */
    const lim3 = ymd(new Date(Date.now() - 2 * 864e5));
    const FRS = FCR().filter(r => r.date >= lim3).flatMap(r => r.items.filter(it => it.from !== it.to).map(it => { const F = D.forecasts.find(z => z.id === it.id);
      return {k: "전망 조정", d: r.date, t: (F && F.s ? F.s : it.id) + " " + it.from + "% → " + it.to + "%", w: {date: r.date, id: it.id}}; }));
    const MAIN = NS.concat(FRS, cur.items.map((i, j) => ({k: "정세 브리핑", d: cur.date, t: i.h, j})));
    runStrip($("#bstrip"), () => narrow() ? MAIN.concat(agendaItems().filter(x => x.soon)) : MAIN);  /* 모바일: 띠가 하나이므로 30일 안의 일정을 섞는다(2026-10-01) */
    renderOverview(); renderBrief(); SR.idx = null; if (S.tab === "brief" && ROUTES) applyRoute();
  }).catch(() => { const st = $("#bstrip"); if (st && !BR) st.hidden = true; });
}
/* v3.99 시안: 정세 브리핑을 세계 정세 탭 맨 위에. 최근 3개 호(발행일 기준)를 펼쳐 두고, 그 이전 호는 '지난 브리핑 더보기'로 그 자리에서 펼친다.
   정보마다 그날 그 사안의 확률이 바뀌었으면 국민의 삶(그 사안의 카드)과 산업별 미래(그 변경으로 점 개수가 가장 크게 움직인 업종의 추이)로 가는 단추를 붙인다 */
const BH_CUT = 6, BH_N = 2;  /* 2026-10-12 결재: 최근 2개 호(발행일 기준) */
function bhFx(i, d){
  const fc = (i.fc || []).map(f => { const F = D.forecasts.find(z => z.id === f.id), e = FCE[f.e] || FCE.none; return '<button type="button" class="fcchip bfc bfc-' + esc(f.e) + '" data-fc="' + esc(f.id) + '" title="' + esc((F ? F.q + " · " : "") + e[1]) + '"><span class="lb-fcl">전망</span> ' + esc(F && F.s ? F.s : f.id) + " " + e[0] + "</button>"; }).join("");
  const C = i.case ? (D.strategies || []).find(s => s.id === i.case) : null, moved = C && C.hs7 && (C.hs7.changes || []).some(x => x.d === d);
  return fc + (moved ? '<span class="bh-gx"><span class="lb-fx lb-fx-on">그래프 변경</span><button type="button" class="bh-go" data-golife="' + esc(i.case) + '">국민의 삶 →</button><button type="button" class="bh-go" data-goind="' + esc(i.case + "|" + d) + '">산업별 미래 →</button></span>' : "");
}
function bhFact(i){ return i.fact && !i.link ? '<span class="lb-f">' + esc(i.fact) + "</span>" : ""; }  /* v4.01(2026-10-12 결재): 한 줄 정보 아래 사실 1~2문장(판단과의 연결 문장이 있는 예전 형식 호는 전문 쪽에서 봄) */
function bhItems(x, top){
  const csn = id => LB_SHORT[id] || "기타", N = x.items.length + (x.more || []).length, cut = N > BH_CUT, cx = k => cut && k >= BH_CUT ? ' class="bh-x"' : "";  /* 하루 6줄이 넘으면 나머지는 접는다 */
  return '<ul class="lb-list' + (cut ? " bh-cut" : "") + '">' + x.items.map((i, n) => '<li' + (top ? ' id="bi-' + n + '"' : "") + cx(n) + '><span class="lb-cs">' + esc(csn(i.case)) + '</span><span class="lb-t">' + (i.loc ? '<button type="button" class="bh" data-bloc="' + esc(x.date) + "|" + n + '" title="지구본에서 위치 보기">' + esc(i.h) + PIN + "</button>" : esc(i.h)) + "</span>" + bhFx(i, x.date) +
    ((i.src || []).length ? '<a class="lb-src" href="' + esc(i.src[0]) + '" target="_blank" rel="noopener">출처</a>' : "") + bhFact(i) + "</li>").join("") +
    (x.more || []).map((m, k) => '<li' + cx(x.items.length + k) + '><span class="lb-cs lb-etc">기타</span><span class="lb-t">' + esc(firstSent(m.t)) + "</span>" + ((m.src || []).length ? '<a class="lb-src" href="' + esc(m.src[0]) + '" target="_blank" rel="noopener">출처</a>' : "") + "</li>").join("") +
    (cut ? '<li class="bh-xb"><button type="button" class="bh-xbtn" data-bcut="1">' + "나머지 " + (N - BH_CUT) + "건 더 보기" + "</button></li>" : "") + "</ul>";
}
function briefHomeHtml(){
  if (!BR || !(BR.issues || []).length) return "";
  const top = BR.issues.slice(0, BH_N), old = BR.issues.slice(BH_N);
  return '<section class="sec bhome" id="brief"><div class="bh"><h2>정세 브리핑</h2>' + ttsBtn("brief") + "</div>" +
    top.map((x, k) => '<div class="bh-day"><p class="bh-dd"><span>' + fmtKD(x.date) + "</span>" + (x.items.some(i => i.link) ? '<a class="bh-full" href="/brief/' + esc(x.date) + '/" data-brief="' + esc(x.date) + '">전문 보기 →</a>' : "") + "</p>" + bhItems(x, !k) + weekLine(x.date) + "</div>").join("") +
    (old.length ? '<button type="button" class="bh-more" data-bmore="1" aria-expanded="false">지난 브리핑 더보기 <span class="mono">' + old.length + '일</span></button><div class="bh-old" hidden>' + old.map(pastIssue).join("") + "</div>" : "") + "</section>";
}
document.addEventListener("click", ev => {  /* v3.99: 지난 브리핑 더보기(그 자리에서 펼침), 정세 브리핑으로 가는 단추 */
  const bc = ev.target.closest("[data-bcut]"); if (bc) { const u = bc.closest("ul"); if (u) u.classList.remove("bh-cut"); bc.closest("li").remove(); return; }
  const m = ev.target.closest("[data-bmore]"); if (m) { const o = m.nextElementSibling, op = m.getAttribute("aria-expanded") !== "true"; if (o) o.hidden = !op; m.setAttribute("aria-expanded", op); m.firstChild.textContent = op ? "지난 브리핑 접기 " : "지난 브리핑 더보기 "; return; }
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
    '<div class="sec"><p class="eyebrow">' + esc(D.meta.scope) + '</p><h2 style="margin-top:4px">세계 정세</h2><p class="meta" style="margin-top:4px">분석 기준일 <span class="mono">' + esc(D.meta.asof) + "</span>" + (BR && BR.issues[0].date > D.meta.asof ? ' · 동향 점검 <span class="mono">' + esc(BR.issues[0].date) + "</span>" : "") + " · 정세 요약 " + D.digest.length + "건 · 분쟁 지점 " + fps.length + '곳</p><p class="lead" style="margin-top:8px">세계 곳곳의 분쟁 지점과 국제 정세의 주요 흐름을 기준일 현재로 정리합니다. 이 정세에 대한 클리사 지오폴리틱스의 판단은 전략 분석에서, 그 배경이 되는 구조는 국제 질서에서 볼 수 있습니다.</p>' +
    ((D.insights || []).length ? '<button type="button" class="entry" data-go="strat">클리사 지오폴리틱스의 주요 판단 ' + D.insights.length + '건 보기<span aria-hidden="true">→</span></button>' : "") + "</div>" +
    '<section class="sec"><h3>정세 요약 ' + ttsBtn("digest") + '</h3><div class="digest">' + D.digest.map((g, gi) => '<article><div class="h">' + ((g.ids || []).length ? '<button type="button" class="bh" data-dg="' + gi + '" title="지구본에서 위치 보기">' + esc(g.t) + PIN + "</button>" : esc(g.t)) + "</div><p>" + esc(g.d) + '</p><div class="chips">' + g.ids.map(chip).join("") + "</div></article>").join("") + "</div></section>" +
    ((!PUB() && D.discuss && D.discuss.threads.length) ? '<section class="sec"><h3>진행 중인 논의</h3>' + D.discuss.threads.map(t => '<button type="button" class="row-btn" data-go="discuss"><span class="nm">' + esc(t.title) + '</span><span class="meta">' + esc(t.opened) + " 개설 · " + esc(t.status) + "</span></button>").join("") + "</section>" : "") +
    '<section class="sec"><h3>분쟁지 · 심각도 순</h3><ul class="list">' + fps.map(fp =>
      '<li><button type="button" class="row-btn" data-fp="' + esc(fp.id) + '"><span class="fp-head"><span class="nm">' + esc(fp.name_ko) + "</span>" + pips(fp.severity) + '</span><span class="meta"><span class="mono">' + esc(fp.last_major_event?.date || "") + "</span> " + esc(fp.last_major_event?.text || "") + "</span></button></li>").join("") + "</ul></section>" +
    (PUB() ? "" : '<section class="sec"><h3></h3><ul class="tl">' + D.log.slice().reverse().map(l => '<li><span class="d">' + esc(l.date) + "</span><span><b>" + esc(l.ver) + "</b> " + esc(l.text) + ((l.details || []).length ? '<details class="src" style="margin-top:4px"><summary>수정 전후 ' + l.details.length + '건</summary><ul>' + l.details.map(x => '<li><span class="note">' + esc(x.where) + "</span><br>" + esc(x.before) + "<br>→ " + esc(x.after) + "</li>").join("") + "</ul></details>" : "") /* v3.2 */ + "</span></li>").join("") + "</ul></section>") +
    '<p class="note">클리사 지오폴리틱스의 분석은 AI(Anthropic의 Claude)의 도움을 받아 작성하고 편집진이 검토합니다.</p>';
}
function forecastRow(f, compact){
  const st = {open:["open","검증 전"], yes:["yes","실현"], no:["no","불발"], void:["void","무효"]}[f.status] || ["open","검증 전"];
  return '<li data-fid="' + esc(f.id) + '"><div class="fc"><div class="q">' + esc(f.q) + '</div><div class="p">' + f.p + '<small>%</small></div><div class="prob"><i style="width:' + f.p + '%"></i></div>' +
    (compact ? "" : '<div class="b">' + esc(f.basis) + "</div>") + (f.rs && !compact ? '<div class="b rs">결과 확인 · ' + esc(f.rs) + "</div>" : "") /* v4.21 rs */ + (f.void && !compact ? '<div class="vr">무효 처리 · ' + esc(f.void) + "</div>" : "") +
    '<div class="foot"><span class="mono fid">' + esc(f.id) + '</span><span class="st ' + st[0] + '">' + st[1] + '</span><span>검증 시점 <span class="mono">' + esc(f.due) + "</span></span>" + (compact ? "" : fcHist(f.id) + '<span class="chips" style="margin:0">' + f.countries.map(chip).join("") + '<button type="button" class="chip" data-fcd="' + esc(f.id) + '">' + FCT.detail + '</button></span>') + "</div></div></li>";  /* v4.22 전망별 화면 */
}
function renderDetail(){
  const el = $("#pane-detail");
  const back = '<button type="button" class="chip back" data-navback="1" data-prev="' + esc(S.prevTab || "overview") + '">← 이전 화면</button>';
  if (S.selFp) {
    const fp = D.flashpoints.find(f => f.id === S.selFp);
    const fcs = D.forecasts.filter(f => f.fp === fp.id);
    el.innerHTML =
      back + '<div class="sec"><p class="eyebrow">분쟁지</p><h2 style="margin-top:4px">' + esc(fp.name_ko) + '</h2><p class="meta" style="margin-top:6px">' + pips(fp.severity) + " 심각도 " + fp.severity + '/5 · <span class="mono">' + fp.lat.toFixed(2) + "°, " + fp.lon.toFixed(2) + "°</span></p></div>" +
      '<p class="lead">' + esc(fp.status_ko) + "</p>" +
      (fp.last_major_event ? '<section class="sec"><h3>최근 주요 사건</h3><ul class="tl"><li><span class="d">' + esc(fp.last_major_event.date) + "</span><span>" + esc(fp.last_major_event.text) + "</span></li></ul></section>" : "") +
      '<section class="sec"><h3>관련국</h3><div class="chips" style="margin:0">' + fp.countries.map(chip).join("") + "</div></section>" +
      (fcs.length ? '<section class="sec"><h3>관련 전망</h3><ul class="list">' + fcs.map(f => forecastRow(f, true)).join("") + "</ul></section>" : "") +
      ((D.strategies || []).some(c => c.fp === fp.id) ? '<section class="sec"><h3>전략 분석</h3>' + D.strategies.filter(c => c.fp === fp.id).map(c => '<p style="margin-bottom:6px">' + esc(c.title) + '</p><button type="button" class="chip" data-case="' + esc(c.id) + '">전략 분석 보기 · ' + esc(c.title.split(":")[0]) + '</button>').join("") + "</section>" : "") +
      (exitCase(fp.id) ? '<section class="sec"><h3>각자의 눈과 출구</h3><div class="misread"><b>가장 위험한 오독</b>' + esc(exitCase(fp.id).misread) + '</div><p style="margin-top:8px"><button type="button" class="chip" data-exit="' + esc(fp.id) + '">당사자별 인식과 출구 보기 · ' + esc(fp.name_ko) + '</button></p></section>' : "") +
      (FP_AN[fp.id] ? '<section class="sec"><h3>유사한 역사적 선례</h3>' + analogHtml(D.history.analogies.find(x => x.id === FP_AN[fp.id]), true) + "</section>" : "") +
      '<details class="src"><summary>출처 ' + (fp.sources || []).length + "건</summary><ul>" + (fp.sources || []).map(srcItem).join("") + "</ul></details>";
    return;
  }
  if (!S.sel) {
    const groups = REGIONS.map(r => {
      const cs = Object.values(D.countries).filter(c => c.region === r).sort((a, b) => a.tier - b.tier || a.name_ko.localeCompare(b.name_ko, "ko"));
      return '<div class="region"><h4>' + r + '</h4><div class="chips" style="margin:0">' + cs.map(c => chip(c.iso)).join("") + "</div></div>";
    }).join("");
    el.innerHTML = '<div class="empty">' + back + '<h2>국가 선택</h2><p class="lead">지구본에서 국가나 분쟁지 표시를 선택하거나 아래 목록에서 선택하면 정세, 능력, 최근 동향과 출처를 볼 수 있습니다. 굵은 이름은 상세 프로필이 있는 국가입니다.</p>' + groups +
      '<div class="region"><h4>국가 밖 행위자</h4><div class="chips" style="margin:0">' + chip("EUR") + "</div></div></div>";
    return;
  }
  const c = D.countries[S.sel], m = c.mil || {}, e = c.econ || {}, p = c.pol || {};
  const fps = D.flashpoints.filter(f => f.countries.includes(c.iso));
  const fcs = D.forecasts.filter(f => f.countries.includes(c.iso));
  const recent = (c.recent || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const fig = (label, val, sub) => "<div><dt>" + label + "</dt><dd>" + val + (sub ? "<small>" + sub + "</small>" : "") + "</dd></div>";
  el.innerHTML =
    back + '<div class="sec"><p class="eyebrow">' + esc(c.region) + (c.tier === 1 ? "" : " · 약식 프로필") + '</p><h2 style="margin-top:4px">' + esc(c.name_ko) + " " + (c.situation ? ttsBtn("country:" + c.iso) : "") + '</h2><p class="meta" style="margin-top:4px">' + esc(c.leader) + "</p>" + leaderLink(c.iso, "결정권자 분석 · ") + " " + powerLink(c.iso, "권력 구조 · ") + "</div>" +
    '<p class="lead">' + esc(c.situation) + "</p>" + gsBlock(c) + countryIntentHtml(c) + countryPublicsHtml(c) + histBlock(c) +
    '<section class="sec"><h3>판단 점수 <span style="font-weight:400">(0–100)</span></h3><div class="scores">' + JLAYERS.map(k =>
      '<div class="score"><span' + (k === S.layer ? ' style="font-weight:600"' : "") + ">" + LAYERS[k].label + '</span><span class="track" style="height:8px;background:var(--panel-2);border-radius:2px;overflow:hidden"><span style="display:block;height:100%;width:' + c.scores[k] + "%;background:" + ramp(k, c.scores[k]) + ';border-radius:0 4px 4px 0"></span></span><span class="mono" style="text-align:right;font-size:12px">' + c.scores[k] + "</span></div>").join("") + "</div></section>" +
    '<section class="sec"><h3>능력 지표</h3><dl class="figs">' +
      fig("국방비", fmtUsdBn(m.spend_usd_bn), m.spend_year ? m.spend_year + "년" : "") +
      fig("현역 병력", fmtPeople(m.active_personnel)) +
      fig("핵탄두", m.nukes ? m.nukes.toLocaleString("ko-KR") + "기" : "—") +
      fig("명목 GDP", fmtUsdBn(e.gdp_usd_bn), e.gdp_usd_bn ? "2025년" : "") +
      fig("2026 성장 전망", fmtPct(e.growth_2026_pct)) +
      fig("다음 선거", p.next_election ? '<span style="font:13px var(--sans)">' + esc(p.next_election) + "</span>" : "—") +
    "</dl>" + (m.note ? '<p class="note" style="margin-top:8px">군사 · ' + esc(m.note) + "</p>" : "") + (e.note ? '<p class="note" style="margin-top:4px">경제 · ' + esc(e.note) + "</p>" : "") + "</section>" +
    (p.regime ? '<section class="sec"><h3>정치</h3><dl class="kv"><dt>체제</dt><dd>' + esc(p.regime) + "</dd>" + (p.stability ? "<dt>안정성</dt><dd>" + esc(p.stability) + "</dd>" : "") + "</dl></section>" : "") +
    (recent.length ? '<section class="sec"><h3>최근 동향</h3><ul class="tl">' + recent.map(r => '<li><span class="d">' + esc(r.date) + "</span><span>" + esc(r.text) + "</span></li>").join("") + "</ul></section>" : "") +
    (c.watch && c.watch.length ? '<section class="sec"><h3>주시할 변수</h3><ul class="watch">' + c.watch.map(w => "<li>" + esc(w) + "</li>").join("") + "</ul></section>" : "") +
    (fps.length ? '<section class="sec"><h3>관련 분쟁지</h3><div class="chips" style="margin:0">' + fps.map(f => '<button type="button" class="chip" data-fp="' + esc(f.id) + '">' + esc(f.name_ko) + "</button>").join("") + "</div></section>" : "") +
    (fcs.length ? '<section class="sec"><h3>관련 전망</h3><ul class="list">' + fcs.map(f => forecastRow(f, true)).join("") + '</ul><p class="note" style="margin-top:8px"><button type="button" class="chip" data-go="forecast">전망 전체 보기</button></p></section>' : "") +
    ((c.uncertain || []).length ? '<details class="src"><summary>확인하지 못한 사항 ' + c.uncertain.length + "건</summary><ul>" + c.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") +
    '<details class="src"><summary>출처 ' + (c.sources || []).length + "건</summary><ul>" + (c.sources || []).map(srcItem).join("") + "</ul></details>";
}
function countryIntentHtml(c){
  const v = c.intent; const cases = (D.strategies || []).filter(k => k.deciders && k.deciders.items.some(d => d.iso === c.iso));
  if (!v && !cases.length) return "";
  const row = x => '<tr><td><span class="sw ' + x.w + '">' + (x.w === "said" ? "말" : "행동") + '</span></td><td class="mono">' + esc(x.date) + "</td><td>" + esc(x.k) + "</td><td>" + esc(x.t) + (x.url ? ' <a href="' + esc(x.url) + '" target="_blank" rel="noopener">원문</a>' : "") + "</td></tr>";
  const sig = v ? v.signals.slice().sort((a, b) => a.w === b.w ? String(b.date).localeCompare(String(a.date)) : (a.w === "said" ? -1 : 1)) : [];
  return '<section class="sec" id="c-intent"><h3>의지 지표 · 말과 행동</h3>' + (v ? '<p><span class="fit ' + fitCls(v.fit) + '">' + esc(v.fit) + '</span></p><div class="tbl-wrap intent-c"><table class="tbl" style="min-width:480px"><tbody>' + sig.map(row).join("") + '</tbody></table></div><p style="font-size:13px;color:var(--ink)">' + esc(v.read) + "</p>" : "") +
    (cases.length ? '<p class="note" style="margin-top:6px">이 국가가 결정권자로 등장하는 전략 분석 · ' + cases.map(k => '<button type="button" class="chip" data-case="' + esc(k.id) + '">' + esc(k.title.split(":")[0]) + "</button>").join(" ") + "</p>" : "") + "</section>";
}
function gsBlock(c){
  const g = c.gs; if (!g) return "";
  const ul = xs => "<ul>" + xs.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  return '<section class="sec gs"><h3>대전략</h3>' +
    '<p class="gs-core">' + esc(g.core) + "</p>" +
    '<div class="gs-grid">' +
      '<div class="gs-box goal wide"><h5><i></i>반드시 이루려는 것</h5>' + ul(g.goals) + "</div>" +
      '<div class="gs-box give"><h5><i></i>양보할 수 있는 것</h5>' + ul(g.give) + "</div>" +
      '<div class="gs-box never"><h5><i></i>절대 양보 못할 것</h5>' + ul(g.never) + "</div>" +
    "</div>" +
    "<p>" + esc(g.summary) + "</p>" +
    '<p class="note"><b style="color:var(--ink-2)">내적 모순</b> · ' + esc(g.contra) + "</p>" + drvBlock(c) + "</section>";
}
const nm = iso => (D.countries[iso] || {}).name_ko || iso;
const DLAB = {geo:"지리", power:"국력", regime:"체제·국내정치", memory:"역사적 기억"};
const drvBar = w => '<div class="drv" role="img" aria-label="' + Object.keys(DLAB).map(k => DLAB[k] + " " + w[k]).join(", ") + '">' + Object.keys(DLAB).map(k => '<i style="flex:' + w[k] + " 0 0;background:var(--d-" + k + ')"></i>').join("") + "</div>";
const drvLab = (w, top) => '<div class="drv-lab">' + Object.keys(DLAB).map(k => '<span style="--c:var(--d-' + k + ')"' + (k === top ? ' class="top"' : "") + ">" + DLAB[k] + " <b>" + w[k] + "</b></span>").join("") + "</div>";
function drvBlock(c){
  const d = c.drivers; if (!d) return "";
  return '<div style="display:grid;gap:6px;margin-top:4px"><h3 style="margin:0">무엇이 이 대전략을 움직이나 <span style="font-weight:400">(상대 비중, 합계 100)</span></h3>' + drvBar(d.w) + drvLab(d.w, d.top) + '<p class="note">주도하는 힘은 <b style="color:var(--ink)">' + DLAB[d.top] + "</b>입니다. " + esc(d.why) + "</p></div>";
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
  if (cell) h += '<p class="meta">관계 점수 <span class="mono">' + (cell.s > 0 ? "+" : cell.s < 0 ? "−" : "") + Math.abs(cell.s) + "</span> · " + esc(cell.t) + "</p>";
  if (d) h += '<div class="cols"><div><h5 class="c">협력할 수 있는 것</h5>' + li(d.coop) + '</div><div><h5 class="x">충돌하는 것</h5>' + li(d.conflict) + "</div></div><p><b>전망</b> · " + esc(d.outlook) + "</p>";
  return h + '<div class="chips" style="margin:0">' + chip(a) + chip(b) + "</div></div>";
}
let mxSel = ["USA", "CHN"];
const ABBR = {USA:"미", CHN:"중", RUS:"러", EUR:"EU", JPN:"일", KOR:"한", PRK:"북", IND:"인", IRN:"이란", ISR:"이스", TUR:"튀"};
function scoreBoxHtml(){
  const L = S.layer === "focus" ? "risk" : S.layer;
  const top = Object.values(D.countries).filter(c => !c.offmap && c.scores).sort((a, b) => b.scores[L] - a.scores[L]).slice(0, 10);
  return '<div class="layer-sw" role="radiogroup" aria-label="지구본 보기 방식">' + Object.keys(LAYERS).map(k => '<button type="button" role="radio" class="chip' + (k === S.layer ? " on" : "") + '" aria-checked="' + (k === S.layer) + '" data-layer="' + k + '">' + LAYERS[k].label + "</button>").join("") + "</div>" +
    '<p class="note" style="margin:8px 0">' + LAYERS[L].label + " 상위 10개국 · " + esc(LAYERS[L].desc) + '</p><div class="bars">' + top.map(c =>
      '<button type="button" class="bar" data-iso="' + c.iso + '"><span>' + esc(c.name_ko) + '</span><span class="track"><span class="fill" style="display:block;width:' + c.scores[L] + "%;background:" + ramp(L, c.scores[L]) + '"></span></span><span class="v">' + c.scores[L] + "</span></button>").join("") + "</div>";
}
function renderGrand(){
  const G = D.grand, M = G.matrix_order;
  const score = (a, b) => { const c = G.cells.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)); return c ? c.s : null; };
  const hasDy = (a, b) => G.dyads.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const sign = v => v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0";
  let mx = '<div class="mx-wrap"><table class="mx" aria-label="주요 행위자 협력·충돌 행렬"><thead><tr><th></th>' + M.map(i => "<th scope=\"col\" title=\"" + esc(nm(i)) + "\">" + esc(ABBR[i] || nm(i)) + "</th>").join("") + "</tr></thead><tbody>";
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
  const key = '<div class="mx-key">' + [[-2,"구조적 충돌"],[-1,"경합 우위"],[0,"혼합"],[1,"협력 우위"],[2,"동맹급"]].map(([v,l]) => '<span><i style="background:' + cellColor(v) + '"></i>' + sign(v) + " " + l + "</span>").join("") + "<span>• 상세 분석 있음</span></div>";
  const others = G.dyads.filter(d => !(M.includes(d.a) && M.includes(d.b)));
  const order = ["geo","power","regime","memory"];
  const cs = Object.values(D.countries).filter(c => c.drivers).sort((a, b) => order.indexOf(a.drivers.top) - order.indexOf(b.drivers.top) || b.drivers.w[b.drivers.top] - a.drivers.w[a.drivers.top]);
  const cnt = k => cs.filter(c => c.drivers.top === k).length;
  $("#pane-grand").innerHTML =
    '<div class="sec"><h2>국제 질서</h2><p class="meta" style="margin-top:4px">세계 시나리오 ' + G.scenarios.length + "건 · 구조적 흐름 " + G.trends.length + "건 · 관계 분석 " + G.dyads.length + '건</p><p class="lead" style="margin-top:8px">개별 사안을 넘어 국제 질서 전반을 움직이는 구조를 분석합니다. 2030년까지의 세계 시나리오와 구조적 흐름, 주요 행위자의 대전략과 상호 관계를 다루고, 각 시나리오가 개별 사안의 전개에 미치는 영향을 함께 제시합니다.</p></div>' +
    tocHtml([["g-scn","시나리오"],["g-trend","구조적 흐름"],["g-mx","관계 행렬"],["g-drv","대전략의 동인"],["g-ten","역사와 구조"],["g-score","국가별 점수"]]) +
    '<section class="sec" id="g-scn"><h3>2030년까지의 세계 시나리오 · 확률 합계 100% ' + ttsBtn("scn") + '</h3><ul class="list">' + G.scenarios.map(sc => {
      const th = D.thinkers.find(t => t.id === sc.thinker);
      return '<li class="scn"><div class="scn-h"><b>' + esc(sc.id + ". " + sc.name) + '</b><span class="p">' + sc.p + '<small style="font-size:12px;color:var(--muted)">%</small></span></div><div class="prob"><i style="width:' + sc.p + '%"></i></div><p style="font-size:13px;color:var(--ink-2)">' + esc(sc.d) + '</p><div><h3 style="margin:4px 0 4px">선행 신호</h3><ul>' + sc.signals.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul></div><div class="kr"><b>한국에는</b> · ' + esc(sc.korea) + "</div>" + (sc.case_fut || sc.korea_fut ? '<div class="note" style="margin:0;display:grid;gap:3px"><b style="color:var(--ink-2)">이 시나리오에서 각 사안의 2030년 전개</b>' + Object.entries(Object.assign({korea: sc.korea_fut}, sc.case_fut || {})).filter(([, m]) => m).map(([cid, m]) => { const k = (D.strategies || []).find(x => x.id === cid); return '<span><button type="button" class="chip" data-case="' + cid + '">' + esc(k ? k.title.split(":")[0] : cid) + "</button> " + Object.entries(m).map(([f, v]) => '<span class="mono" style="color:' + fcol(f) + '">' + f + " " + v + "%</span>").join(" · ") + "</span>"; }).join("") + "</div>" : "") + (th ? '<button type="button" class="lens-btn" data-lens="' + th.id + '">관련 사상가 관점 · ' + esc(th.name) + "</button>" : "") + "</li>";
    }).join("") + '</ul><p class="note" style="margin-top:8px">시나리오 확률은 판단값이며, 선행 신호가 나타나면 확률을 조정합니다.</p></section>' +
    '<section class="sec" id="g-trend"><h3>구조적 흐름 ' + ttsBtn("trend") + '</h3><ul class="list">' + G.trends.map(t => '<li class="trend"><b>' + esc(t.t) + "</b><p>" + esc(t.d) + "</p>" + (t.prec_note ? '<p class="pn">선례 대조 · ' + esc(t.prec_note) + "</p>" : "") + (t.review ? '<p class="pn">독립 반론 검토 · ' + esc(t.review) + "</p>" : "") + aiPrecHtml(t.prec, "") + "</li>").join("") + "</ul></section>" +
    '<section class="sec" id="g-mx"><h3>협력·충돌 행렬 · 칸을 선택하면 양국 관계를 볼 수 있다</h3><p class="note" style="margin-bottom:8px">각국이 가장 중시하는 것과 양보할 수 없는 것이 부딪히는 곳에서 분쟁이 생기고, 한쪽의 양보 가능 목록이 다른 쪽의 필수 목록과 겹치는 곳에서 거래가 성립합니다.</p>' + mx + key + '<div id="dyad-box" style="margin-top:12px">' + dyadHtml(mxSel[0], mxSel[1]) + "</div></section>" +
    (others.length ? '<section class="sec"><h3>행렬 밖의 핵심 관계</h3>' + others.map(d => '<details class="dy"><summary>' + esc(nm(d.a)) + " ↔ " + esc(nm(d.b)) + "</summary>" + dyadHtml(d.a, d.b) + "</details>").join("") + "</section>" : "") +
    '<section class="sec" id="g-drv"><h3>무엇이 대전략을 움직이나</h3><p class="note" style="margin-bottom:10px">지리가 주도하는 국가 ' + cnt("geo") + "곳, 체제·국내정치 " + cnt("regime") + "곳, 국력 " + cnt("power") + "곳, 역사적 기억 " + cnt("memory") + "곳입니다. 역사적 기억은 대부분의 국가에서 넘지 않을 선을 긋는 요인이지 전략 전체를 주도하는 요인은 아닙니다. " + esc(G.drivers_note) + "</p>" +
      drvLab({geo:"",power:"",regime:"",memory:""}, null).replace(/ <b><\/b>/g, "") +
      '<div style="display:grid;gap:2px;margin-top:8px">' + cs.map(c => '<button type="button" class="drv-row" data-iso="' + c.iso + '"><span class="n">' + esc(c.name_ko) + "</span>" + drvBar(c.drivers.w) + '<span class="t">' + DLAB[c.drivers.top] + " " + c.drivers.w[c.drivers.top] + "</span></button>").join("") + "</div></section>" +
    '<section class="sec" id="g-ten"><h3>역사와 구조가 어긋나는 관계 ' + ttsBtn("ten") + '</h3><p class="note" style="margin-bottom:8px">역사적 원한은 깊으나 힘의 구조가 협력을 요구하는 관계입니다. 기억과 구조 가운데 어느 쪽이 우세한지를 보면 역사가 대전략을 얼마나 움직이는지 알 수 있습니다.</p><ul class="list">' +
      G.tensions.map(t => '<li class="ten"><div class="hd"><b>' + esc(nm(t.a)) + " ↔ " + esc(nm(t.b)) + '</b><span class="st ' + (t.verdict === "구조 우위" ? "yes" : "open") + '">' + esc(t.verdict) + "</span></div><dl><dt>기억</dt><dd>" + esc(t.memory) + "</dd><dt>구조</dt><dd>" + esc(t.structure) + "</dd></dl><p class=\"note\">" + esc(t.note) + "</p></li>").join("") + "</ul></section>" +
    '<section class="sec" id="g-score"><h3>국가별 판단 점수와 지구본 보기 방식</h3><p class="note" style="margin-bottom:8px">지구본의 기본 화면은 분석 대상 지역입니다. 아래의 4개 점수는 측정값이 아니라 판단값이며, 보조 자료로 제공합니다.</p><div id="scorebox">' + scoreBoxHtml() + "</div></section>" +
    '<section class="sec"><h3>국가별 대전략</h3><div class="chips" style="margin:0">' + Object.values(D.countries).filter(c => c.gs).map(c => chip(c.iso)).join("") + "</div></section>" +
    "";
}
const FP_AN = {"rus-ukr":"rus-ukr", "iran-war":"iran-war", "taiwan-strait":"taiwan", "korea":"korea-deal", "baltic-kaliningrad-suwalki":"east-flank"};
function histBlock(c){
  const h = c.hist; if (!h) return "";
  return '<section class="sec hist"><h3>역사 속 지정학</h3><p class="hist-mean">' + esc(h.meaning) + "</p>" +
    '<ul class="tl">' + h.episodes.map(e => '<li><span class="d">' + esc(e.y) + "</span><span>" + esc(e.t) + "</span></li>").join("") + "</ul>" +
    '<div class="lesson"><b>그들이 역사에서 배운 것</b><p>' + esc(h.learned) + "</p></div>" +
    '<div class="lesson"><b>역사의 경고</b><p>' + esc(h.read) + "</p></div></section>";
}
function analogHtml(a, compact){
  if (!a) return "";
  return '<article class="an">' + (compact ? "" : "<h4>" + esc(a.now) + "</h4>") +
    '<div class="tags">' + a.cases.map(x => '<span class="tag">' + esc(x) + "</span>").join("") + "</div>" +
    "<dl><div><dt>그때 어떻게 흘렀나</dt><dd>" + esc(a.then) + '</dd></div><div><dt>현재에 대한 함의</dt><dd class="imp">' + esc(a.implies) + '</dd></div><div><dt class="brk">선례와 다른 점</dt><dd>' + esc(a.breaks) + "</dd></div></dl>" +
    (compact ? "" : '<div class="chips" style="margin:0">' + a.countries.map(chip).join("") + "</div>") + "</article>";
}

const exitCase = id => (D.exits && D.exits.cases.find(c => c.fp === id)) || null;

function renderDiscuss(){
  const th = (D.discuss && D.discuss.threads) || [];
  const vcls = v => v.startsWith("지지") ? "ok" : v.startsWith("보정") ? "fix" : "no";
  $("#pane-discuss").innerHTML =
    '<div class="sec"><p class="eyebrow"></p><h2 style="margin-top:4px"></h2></div>' +
    th.map((t, i) =>
      '<article class="sec" style="display:grid;gap:22px"><div><p class="eyebrow">논의 ' + String(i + 1).padStart(2, "0") + " · " + esc(t.opened) + " 개설 · " + esc(t.status) + '</p><h2 style="margin-top:4px;font-size:20px">' + esc(t.title) + "</h2></div>" +
      '<section class="sec"><h3>' + esc(t.claim_by) + '의 명제</h3><ol class="claim">' + t.claim.map(c => "<li>" + esc(c) + "</li>").join("") + "</ol></section>" +
      '<section class="sec"><h3>역사가 확인하는 것 · ' + esc(t.history.title) + '</h3><ul class="hpoints">' + t.history.points.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul><div class="lesson-box" style="margin-top:10px"><b>그래서</b>' + esc(t.history.lesson) + "</div></section>" +
      '<section class="sec"><h3>명제 검토</h3><ul class="list">' + t.review.map(r => '<li class="rv"><div class="hd"><span>' + esc(r.step) + '</span><span class="vd ' + vcls(r.verdict) + '">' + esc(r.verdict) + "</span></div><p>" + esc(r.text) + "</p></li>").join("") + "</ul></section>" +
      '<section class="sec"><h3>빠진 항</h3><ul class="list">' + t.missing.map(m => '<li class="rv"><b>' + esc(m.t) + '</b><p>' + esc(m.d) + "</p></li>").join("") + "</ul></section>" +
      '<section class="sec"><h3>통일의 경로 후보</h3><div style="display:grid;gap:10px">' + t.paths.map(p => '<div class="path"><div class="hd"><b>' + esc(p.name) + '</b><span class="aim">' + esc(p.odds) + '</span></div><p class="meta">' + esc(p.who) + "</p><dl><dt>모습</dt><dd>" + esc(p.how) + "</dd><dt>선례</dt><dd>" + esc(p.precedent) + "</dd><dt>조건</dt><dd>" + esc(p.cond) + "</dd></dl></div>").join("") + '</div>' + (PUB() ? "" : '<p class="note" style="margin-top:8px"></p>') + '</section>' +
      (t.closing ? '<section class="sec"><h3>' + esc(t.closing.by) + "의 결론 · " + esc(t.closing.date) + '</h3><ol class="claim">' + t.closing.points.map(c => "<li>" + esc(c) + "</li>").join("") + '</ol><div class="lesson-box" style="margin-top:10px"><b>논의가 옮겨 가는 곳</b>' + esc(t.closing.note) + "</div></section>" : "") +
      '<section class="sec"><h3>열린 질문</h3><ul class="watch">' + t.open.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>" +
      '<section class="sec"><h3>지켜볼 신호</h3><ul class="watch">' + t.signals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>" +
      '<details class="src"><summary>출처 ' + t.sources.length + "건</summary><ul>" + t.sources.map(srcItem).join("") + "</ul></details></article>"
    ).join('<hr style="border:0;border-top:1px solid var(--line);margin:0">');
}
const WDIM = [["safety","생명·안전"],["living","생계"],["freedom","자유"],["bond","관계·공동체"]];
const FCOL = {F1:"var(--d-geo)", F5:"var(--d-deal)", F2:"var(--d-regime)", F3:"var(--d-memory)", F4:"var(--d-power)", U6:"var(--d-deal)", I6:"var(--d-deal)"};
const FSLOT = ["var(--d-geo)","var(--d-memory)","var(--d-power)","var(--conflict)","var(--d-regime)"];
const fcol = k => FCOL[k] || FSLOT[(parseInt(String(k).replace(/\D/g, ""), 10) - 1) % 5] || "var(--muted)";
const LNAME = {"1":"Ⅰ. 정세 판단","2":"Ⅱ. 전략 평가","3":"Ⅲ. 개인에게 미치는 영향","V":"Ⅳ. 검증"};
const wbar = v => v == null ? '<span class="bar na"><b>측정 전</b><i></i></span>' : '<span class="bar"><b>' + (Math.round(v * 10) / 10) + '</b><i style="--w:' + Math.max(0, Math.min(100, v)) + '%"></i></span>';
const wdl = (v, b) => { if (v == null || b == null) return ""; const d = Math.round((v - b) * 10) / 10; return '<span class="dl ' + (d > 0.05 ? "up" : d < -0.05 ? "dn" : "eq") + '">' + (d > 0.05 ? "▲" + d : d < -0.05 ? "▼" + Math.abs(d) : "±0") + "</span>"; };
const fmt = v => v == null ? "—" : String(Math.round(v * 10) / 10);
const stpH = (n, t) => '<div class="stp-h"><i>' + n + "</i><b>" + esc(t) + "</b></div>";
const ltag = L => '<span class="ltag l' + L + '">' + ({"1":"Ⅰ","2":"Ⅱ","3":"Ⅲ","V":"Ⅳ"}[L] || L) + "</span>";
function concHtml(c){
  if (!c.conclusions) return "";
  const cls = t => t === "높음" ? "hi" : t === "중간" ? "mid" : t === "가치 판단" ? "val" : "lo";
  /* v3.81 의회 변수: 이 판단에 영향을 주는 '의회의 쟁점'(congress[].affects). 누르면 그 쟁점을 펼친다 */
  const cgv = id => { const L = (c.congress || []).map((x, i) => [x, i]).filter(([x]) => (x.affects || []).includes(id));
    return L.length ? '<span><b>의회 변수</b>' + L.map(([x, i]) => '<button type="button" class="chip" data-cg="' + esc(c.id) + ":" + i + '">' + esc(nm(x.iso)) + " · " + esc(x.t) + "</button>").join(" ") + "</span>" : ""; };
  return '<section class="concl"><h3>핵심 판단</h3><ol>' + c.conclusions.map(k =>
    '<li><span class="cid">' + k.id + '</span><div><div class="ct">' + (k.L ? ltag(k.L) : "") + esc(k.t) + '<span class="conf ' + cls(k.conf) + '">' + (k.conf === "가치 판단" ? "가치 판단" : "확신 " + esc(k.conf) + (k.confp ? " " + k.confp + "%" : "")) + '</span></div><div class="cm">' +
    "<span><b>근거</b>" + esc(k.why) + " (" + k.steps.map(n => n + "단계").join(", ") + ")</span>" +
    "<span><b>판단이 바뀌는 조건</b>" + esc(k.flip) + "</span>" +
    (k.fc.length ? "<span><b>검증할 전망</b>" + k.fc.map(f => '<span class="mono">' + f + "</span>").join(", ") + "</span>" : "") + cgv(k.id) +
    "</div></div></li>").join("") + '</ol><p class="note">확신도는 해당 판단이 5년 안에 뒤집히지 않을 가능성을 구간으로 나타낸 것입니다. ‘개인에게 미치는 영향’의 가치 판단에는 확률을 부여하지 않습니다.' + (PUB() ? "" : "") + '</p></section>';
}
const fitCls = f => f === "일치" ? "ok" : f === "불일치" ? "no" : "part";
function intentHtml(d, caseId){
  const cv = (D.countries[d.iso] || {}).intent, dv = d.intent || {};
  if (!cv && !dv.read) return "";
  const v = {said: (cv ? cv.signals : []).filter(x => x.w === "said" && (!x.case || x.case === caseId)), did: (cv ? cv.signals : []).filter(x => x.w === "did" && (!x.case || x.case === caseId)),
             fit: dv.fit || (cv || {}).fit, read: dv.read || (cv || {}).read, watch: dv.watch || (cv || {}).watch || []};
  const row = (x, w) => '<tr><td><span class="sw ' + w + '">' + (w === "said" ? "말" : "행동") + '</span></td><td class="mono">' + esc(x.date) + "</td><td>" + esc(x.k) + "</td><td>" + esc(x.t) + (x.url ? ' <a href="' + esc(x.url) + '" target="_blank" rel="noopener">원문</a>' : "") + "</td></tr>";
  return '<div class="intent"><div class="ih"><b>의지 지표</b><span class="fit ' + fitCls(v.fit) + '">말과 행동 · ' + esc(v.fit) + '</span></div><div class="tbl-wrap"><table class="tbl" style="min-width:480px"><tbody>' +
    v.said.map(x => row(x, "said")).join("") + v.did.map(x => row(x, "did")).join("") + '</tbody></table></div><p class="ir">' + esc(v.read) + '</p><p class="note"><b>주시할 신호</b> · ' + v.watch.map(w => esc(w.t) + " (" + esc(w.when) + ")").join(" · ") + '</p><p class="note">전체 신호는 <button type="button" class="chip" data-iso="' + esc(d.iso) + '">' + esc(nm(d.iso)) + ' 국가 프로필</button>에서 볼 수 있습니다.</p></div>';
}
/* v3.40 결정권자 쪽(/leader/<slug>/) 연결 */
function LLK(){ return D.leader_links || {}; }
const lurl = i => "/power/" + i + "/" + (LLK()[i] || {}).slug + "/";  /* v3.60 결정권자 쪽은 권력 구조 아래(시안) */
function leadersRow(){
  const L = LLK(), order = ["USA", "CHN", "PRK", "RUS", "KOR", "UKR"].filter(i => L[i]);
  return order.length ? '<section class="sec"><h3>결정권자</h3><p class="note" style="margin:4px 0 8px">사안마다 최종 결정을 내리는 사람의 세계관, 결정 방식, 말과 결정의 일치를 분석합니다.</p><div style="display:flex;flex-wrap:wrap;gap:6px">' +
    order.map(i => '<a class="chip" href="' + lurl(i) + '">' + esc(L[i].name) + (i === "KOR" || i === "UKR" ? " · 전략 주체" : "") + "</a>").join("") + '<a class="chip" href="/power/">권력 구조 전체 보기 →</a></div></section>' : "";
}
/* v3.53 권력 구조 쪽(/power/<ISO>/) 연결 */
function PLK(){ return D.power_links || {}; }
function powerLink(iso, pre, hash){ const L = PLK()[iso]; return L ? '<a class="chip" style="display:inline-block;margin-top:6px" href="' + (hash ? "/power/" + iso + "/" + hash : "/power/#" + iso) + '">' + esc(pre) + esc(L.name) + ' · 누가 결정하고 누가 막을 수 있나 →</a>' : ""; }
function leaderLink(iso, pre){ const L = LLK()[iso]; return L ? '<a class="chip" style="display:inline-block;margin-top:6px" href="' + lurl(iso) + '">' + esc(pre) + esc(L.name) + ' · 세계관과 결정 방식 →</a>' : ""; }
function decHtml(c, n){
  const X = c.deciders; if (!X) return "";
  const O = c.external ? c.external.order : c.futures.items.map(f => f.id);
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  const lvc = {"선호":"lv-a","수용":"lv-b","불편":"lv-c","거부":"lv-d"};
  const ul = a => "<ul>" + a.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  return '<section class="stp">' + stpH(n, "결정권자 분석") + '<p class="note">결정권을 가진 각국이 문제를 어떻게 정의하는지, 무엇을 이루려 하며 어떤 수단을 쓰는지, 전략 주체의 선택지에 어떻게 대응할지를 해당국의 관점에서 정리하고, 각국이 선호하는 전개를 한 표로 비교합니다. 의지는 말과 비용이 수반된 행동으로 나누어 해석합니다.</p>' +
    '<div class="decs">' + X.items.map((d, i) => '<details class="dec" id="dec-' + esc(c.id) + '-' + d.iso + '"' + (i === 0 ? " open" : "") + '><summary><span class="nm">' + esc(nm(d.iso)) + '</span><span class="pw">결정권 ' + esc(d.power) + '</span><span class="fr">' + esc(d.frame) + "</span></summary><dl>" +
      (LLK()[d.iso] ? "<dt>결정권자</dt><dd>" + leaderLink(d.iso, "") + "</dd>" : "") +
      (PLK()[d.iso] ? "<dt>권력 구조</dt><dd>" + powerLink(d.iso, "") + "</dd>" : "") +
      "<dt>결정권의 수단</dt><dd>" + esc(d.means) + "</dd>" +
      "<dt>목표의 순위</dt><dd><ol>" + d.goals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ol></dd>" +
      "<dt>전략</dt><dd>" + esc(d.strategy) + "</dd>" +
      "<dt>현재 쓰는 전술</dt><dd>" + ul(d.tactics) + "</dd>" +
      '<dt>넘지 않는 선</dt><dd class="red">' + ul(d.red) + "</dd>" +
      "<dt>바깥 변수에 대한 인식</dt><dd>" + esc(d.ext) + "</dd>" +
      "<dt>전략 주체에 원하는 것</dt><dd>" + esc(d.want) + "</dd>" +
      "<dt>전략 주체의 선택지에 대한 대응</dt><dd>" + esc(d.onrec) + "</dd>" +
      '<dt>전략 주체가 쥔 지렛대</dt><dd class="lev">' + esc(d.lever) + "</dd>" +
      "</dl>" + intentHtml(d, c.id) + '<div class="chips" style="margin:0 12px 12px"><button type="button" class="chip" data-iso="' + d.iso + '">' + esc(nm(d.iso)) + " 프로필과 대전략</button></div></details>").join("") + "</div>" +
    (X.intent ? '<h3 style="margin:6px 0 0">말과 행동의 일치</h3><p class="note">' + esc(X.intent.note) + '</p><div class="tbl-wrap"><table class="tbl" style="min-width:520px"><thead><tr><th>국가</th><th>일치도</th><th>해석</th></tr></thead><tbody>' +
      X.items.filter(d => d.intent).map(d => "<tr><td><b>" + esc(nm(d.iso)) + '</b></td><td><span class="fit ' + fitCls(d.intent.fit) + '">' + esc(d.intent.fit) + "</span></td><td>" + esc(d.intent.read) + "</td></tr>").join("") + '</tbody></table></div><div class="lesson-box"><b>말과 행동의 함의</b>' + esc(X.intent.read) + "</div>" : "") +
    '<h3 style="margin:6px 0 0">각국이 선호하는 전개</h3><div class="tbl-wrap"><table class="tbl pref" style="min-width:560px"><thead><tr><th>국가</th>' + O.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span> " + esc(fn[k]) + "</th>").join("") + "</tr></thead><tbody>" +
      X.items.map(d => "<tr><td><b>" + esc(nm(d.iso)) + '</b><br><span class="note">' + esc(d.power) + "</span></td>" + O.map(k => { const v = d.pref[k]; return '<td><span class="lv ' + lvc[v[0]] + '">' + esc(v[0]) + '</span><span class="why">' + esc(v[1]) + "</span></td>"; }).join("") + "</tr>").join("") +
    '</tbody></table></div><p class="note">' + esc(X.syn.note) + '</p><ol class="synth">' + X.syn.reads.map(r => "<li><b>" + esc(r.t) + "</b><span>" + esc(r.d) + "</span></li>").join("") + "</ol>" + congHtml(c) + "</section>";
}
/* v3.54 의회의 쟁점: 결정권자의 결정에 의회가 조건·동의·거부권을 행사하는 쟁점(사안 쪽 3단계 끝) */
let CGF = null;
document.addEventListener("toggle", e => { const d = e.target; if (!d.open || !d.matches || !d.matches("details.cgf[data-fk]") || d.dataset.on) return; d.dataset.on = "1";
  const put = () => { const p = d.querySelector("p"); if (p) p.textContent = (CGF && CGF[d.dataset.fk]) || "불러오지 못했습니다. 회의 이름을 눌러 원문을 보십시오."; };
  if (CGF) put(); else fetch("/data/cg_speakers.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : {}).then(j => { CGF = j; put(); }).catch(() => { CGF = {}; put(); }); }, true);
function congHtml(c){
  const X = c.congress; if (!X || !X.length) return "";
  const row = (k, v) => v ? "<dt>" + k + "</dt><dd>" + esc(v) + "</dd>" : "";
  const qd = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? (+m[1]) + "년 " + (+m[2]) + "월 " + (+m[3]) + "일" : (d || ""); };
  if (D.cgv2) return cgV2(c, X, row, qd);  /* v3.84(2026-10-08 결재): 확정·본회의 표결이 있는 쟁점에만 찬반 발언(각 2건)과 당론과 다른 표. 발언 많은 의원 목록은 내림(교본 4.8) */
  return '<h3 style="margin:14px 0 0">의회의 쟁점</h3><p class="note" style="margin:4px 0 8px">결정권자의 결정에 의회가 조건을 붙이거나 동의·거부권을 행사하는 쟁점입니다. 각국 의회의 구성과 권한, 쟁점별 발언은 권력 구조 쪽에 있습니다.</p><div class="decs">' +
    X.map((x, i) => '<details class="dec" id="cg-' + esc(c.id) + '-' + i + '"><summary><span class="nm">' + esc(nm(x.iso)) + '</span><span class="fr">' + esc(x.t) + "</span></summary><dl>" +
      row("현재 단계", x.stage) + row("의회의 권한", x.power) + row("표 계산", x.votes) + row("입장", x.sides) + row("다음 절차와 시한", x.next) +
      (x.govnote ? '<dt>정부의 입장</dt><dd>정부 관계자의 의회 답변과 증언은 의회의 발언이 아니라 정부의 의지를 보여 주는 말이므로 <a class="chip" href="' + (LLK()[x.iso] ? lurl(x.iso) + "#intent" : "/power/#" + esc(x.iso)) + '">' + esc((LLK()[x.iso] || {}).name || nm(x.iso)) + ' · 정부의 말과 행동</a>에 말과 행동으로 나누어 실었습니다.</dd>' : "") +
      ((x.fc || []).length ? '<dt>관련 전망</dt><dd><div class="chips" style="margin:0">' + x.fc.map(fcBtn).join("") + "</div></dd>" : "") +
      ((x.quotes || []).length || (x.speakers && x.speakers.list.length) || (x.devvotes || []).length ? '<dt>의회 발언</dt><dd>' + [(x.quotes || []).length ? "주요 발언 " + x.quotes.length + "건" : "", x.speakers && x.speakers.list.length ? esc(x.speakers.h || "많이 발언한 의원") + " " + x.speakers.list.length + "명" : "", (x.devvotes || []).length ? "당론과 다른 표 " + x.devvotes.length + "건" : ""].filter(Boolean).join(" · ") + "은 권력 구조 쪽에 원문과 함께 모았습니다.<br>" + powerLink(x.iso, "의회의 쟁점과 발언 · ", "#cg-" + c.id + "-" + i) + "</dd>" : "") +
      "</dl></details>").join("") + "</div>";
}
function cgV2(c, X, row, qd){
  const q1 = q => '<li class="cgq2"><p>“' + esc(q.ex) + '”</p><span>' + esc(q.who) + " · " + esc([q.party, q.role].filter(Boolean).join(" · ")) + " · " + qd(q.date) + (q.devnote ? " · <b>" + esc(q.devnote) + "</b>" : "") + ' · <a href="' + esc(q.url) + '" target="_blank" rel="noopener">원문' + ({en: "(영어)", zh: "(중국어)", uk: "(우크라이나어)", ja: "(일본어)", he: "(히브리어)"}[q.lang] || "") + "</a></span></li>";
  const Q = x => x.quotes || [], side = (x, k) => Q(x).filter(q => q.side === k && !q.dev);
  return '<h3 style="margin:14px 0 0">의회의 쟁점</h3><p class="note" style="margin:4px 0 8px">결정권자의 결정에 의회가 조건을 붙이거나 동의·거부권을 행사하는 쟁점입니다. 의원 발언은 법·예산·동의안이 확정되었거나 본회의 표결이 있었던 쟁점에만, 찬반 양쪽에서 2건씩 싣습니다.</p><div class="decs">' +
    X.map((x, i) => '<details class="dec" id="cg-' + esc(c.id) + '-' + i + '"><summary><span class="nm">' + esc(nm(x.iso)) + '</span><span class="fr">' + esc(x.t) + "</span></summary><dl>" +
      row("현재 단계", x.stage) + row("의회의 권한", x.power) + row("표 계산", x.votes) +
      ((x.devvotes || []).length ? '<dt>당론과 다른 표</dt><dd><ul class="cgdv">' + x.devvotes.map(v => "<li><b>" + esc(v.label) + "</b> · " + qd(v.date) + " · " + esc(v.t) + "</li>").join("") + "</ul></dd>" : "") +
      (Q(x).length ? '<dt>찬반 발언</dt><dd><div class="cgsides">' + [["yes", "찬성"], ["no", "반대"]].map(([k, t]) => '<div><b class="cgk">' + t + "</b>" + (side(x, k).length ? '<ul class="cgql">' + side(x, k).map(q1).join("") + "</ul>" : '<p class="note" style="margin:0">' + esc((x.qnone || {})[k] || "") + "</p>") + "</div>").join("") + "</div></dd>" : x.decided && x.qnote ? '<dt>찬반 발언</dt><dd class="note">' + esc(x.qnote) + "</dd>" : row("입장", x.sides)) +
      (Q(x).some(q => q.dev) ? '<dt>당론과 다른 표를 던진 의원의 발언</dt><dd><ul class="cgql">' + Q(x).filter(q => q.dev).map(q1).join("") + "</ul></dd>" : "") +
      row("다음 절차와 시한", x.next) +
      ((x.fc || []).length ? '<dt>관련 전망</dt><dd><div class="chips" style="margin:0">' + x.fc.map(fcBtn).join("") + "</div></dd>" : "") +
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
  const ftab = f => '<div class="tbl-wrap"><table class="tbl" style="min-width:440px"><thead><tr><th>2030년</th>' + WDIM.map(([k, l]) => "<th>" + l + "</th>").join("") + "</tr></thead><tbody>" +
    Object.keys(base).map(g => "<tr><td>" + esc(gname[g]) + "</td>" + WDIM.map(([k]) => '<td class="mono">' + cell(f, g, k) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  return '<section class="stp">' + stpH(n, "전개 시나리오와 바깥 변수") + '<p class="note">' + esc(F.note) + "</p>" +
    '<div class="pstack"><div class="prow"><span>' + (F.rec_same ? "확률" : "현 추세") + "</span>" + pb("p") + "</div>" + (F.rec_same ? "" : '<div class="prow"><span>권고 이행 시</span>' + pb("p_rec") + "</div>") + "</div>" +
    '<div class="futs">' + F.items.map(f => '<article class="fut" id="fut-' + esc(c.id) + "-" + f.id + '" style="--c:' + fcol(f.id) + '"><div class="hd"><span class="id">' + f.id + "</span><b>" + esc(f.name) + '</b><span class="pp">' + (F.rec_same ? f.p + "%" + rg(f.rng) : "현 추세 " + f.p + "%" + rg(f.rng) + " · 권고 이행 시 " + f.p_rec + "%" + rg(f.rng_rec)) + (f.prev2w ? '<small>' + f.prev2w[0] + (F.rec_same ? "" : " · " + f.prev2w[1]) + "</small>" : f.prev ? '<small>' + f.prev[0] + " · " + f.prev[1] + "</small>" : f.id === "F5" ? "<small></small>" : "") + "</span></div>" +
      "<p>" + esc(f.story) + '</p><p class="tst"><b>성립 조건</b> · ' + esc(f.test) + (f.fc ? ' <span class="mono">(' + f.fc + ")</span>" : "") + "</p>" +
      '<p style="font-size:12px"><b>선행 징후</b> · ' + f.signs.map(esc).join(" · ") + "</p>" + sigHtml(f) +
      (c.hs7 ? '<button type="button" class="chip" data-jump="hs7-' + esc(c.id) + '">이 전개가 삶에 미치는 영향 →</button></article>' : '<details class="src"><summary>이 전개에서 개인의 삶 (행복 지표)</summary>' + ftab(f) + '<p class="note">' + esc(f.why) + (f.score ? " ▲▼는 2026년 대비 변화." : " 값은 나쁜 쪽 ~ 좋은 쪽.") + "</p></details></article>")).join("") + "</div>" +
    extHtml(c) + (!c.external && (F.ext_list || []).length ? '<h3 style="margin:8px 0 0">바깥 변수</h3><p class="note">전략 주체가 좌우하지 못하지만 전개의 확률을 움직이는 변수입니다.</p><ul class="list">' + F.ext_list.map(x => '<li class="rv"><p style="color:var(--ink)">' + esc(x) + "</p></li>").join("") + "</ul>" : "") + worldHtml(c) + aiHtml(c) + "</section>";
}
/* v3.26 사안 outlook: 흐름·창·사건·경로·반증 신호. 본문의 {{fc:fNN}}은 그날 확률을 보이는 전망 칩, {{case:id}}는 사안 칩 */
function olkT(t, fid){
  return esc(t).replace(/\{\{n:([\d,]+)\}\}/g, (m, ns) => '<sup class="fn">' + ns.split(",").map(n => '<button type="button" data-jump="fn-' + esc(fid || "") + "-" + n + '" id="fnr-' + esc(fid || "") + "-" + n + '" aria-label="용어 풀이 ' + n + '">' + n + "</button>").join("·") + "</sup>")  /* v3.29 용어 풀이 번호 */.replace(/\{\{fc:(f\d+)\}\}/g, (m, id) => { const F = D.forecasts.find(f => f.id === id); return F ? ' <button type="button" class="fcchip" data-fc="' + id + '" title="' + esc(F.q) + '">' + fcLab(F, id, F.p) + "</button>" : ""; })
    .replace(/\{\{case:([\w-]+)\}\}/g, (m, id) => { const k = (D.strategies || []).find(x => x.id === id); return k ? ' <button type="button" class="chip" data-case="' + esc(id) + '">' + esc(k.title.split(":")[0]) + "</button>" : ""; })
    .replace(/\{\{life:([\w-]+)\|([^}|]+)\}\}/g, (m, id, lab) => ' <button type="button" class="chip" data-golife="' + id + '">' + lab + "</button>")  /* v4.17 특집 칩: 국민의 삶 탭의 그 사안 줄로 */
    .replace(/\{\{acad:([\w\/-]+)\|([^}|]+)\}\}/g, (m, p, lab) => ' <a class="chip" href="' + (location.pathname.indexOf("/en/") === 0 ? "/en" : "") + "/academy/" + p + '/">' + lab + "</a>");  /* v4.17 특집 칩: 클리사 아카데미 강의로 */
}
/* v3.28 특집: 글마다 제목·날짜·사안. 특집 탭에 최신 글은 펼치고 지난 글은 접어 둔다. 사안 화면·주요 판단 카드에는 제목을 단 단추만 둔다 */
const FEATS = () => D.features || [];
const featBtn = F => '<button type="button" class="chip feat-btn" data-feat="' + esc(F.id) + '">특집 · ' + esc(F.title) + ' <span aria-hidden="true">→</span></button>';
function featBody(O){
  const T = x => olkT(x, O.id);
  if (O.kind === "essay") {  /* v3.44 서술형 특집: 요약 · 절(문단과 표) · 산출 방법 · 출처 */
    const tbl = b => '<div class="ess-tw"><table class="ess-t"><thead><tr>' + b.table.head.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" + b.table.rows.map(r => "<tr>" + r.map((c, i) => (i ? "<td>" : '<th scope="row">') + (!i && String(c).includes("\n") ? esc(String(c).split("\n")[0]) + '<small class="ess-rd">' + esc(String(c).split("\n").slice(1).join(" ")) + "</small>" : esc(c)) + (i ? "</td>" : "</th>")).join("") + "</tr>").join("") + "</tbody></table></div>";
    return '<div class="lesson-box ess-sum"><b>' + esc(O.summary_h || "요약") + "</b><" + (O.summary_ol ? "ol" : "ul") + ">" + (O.summary || []).map(x => "<li>" + T(x) + "</li>").join("") + "</" + (O.summary_ol ? "ol" : "ul") + "></div>" +
      (O.sections || []).map(S => "<h3>" + esc(S.h) + "</h3>" + S.blocks.map(b => b.svg ? '<figure class="ess-fig"><figcaption>' + esc(b.h || "") + "</figcaption>" + b.svg + (b.note ? '<p class="note">' + esc(b.note) + "</p>" : "") + "</figure>"
        : b.table ? (b.fold ? '<details class="src ess-fold"><summary>' + esc(b.fold) + "</summary>" + tbl(b) + "</details>" : tbl(b)) : '<p class="ess-p">' + T(b.p) + "</p>").join("")).join("") +
      ((O.events || []).length ? "<h3>" + esc(O.events_h) + '</h3><ul class="tl">' + O.events.map(x => '<li><span class="d">' + esc(x.when) + "</span><span>" + T(x.t) + "</span></li>").join("") + "</ul>" : "") +
      ((O.paths || []).length ? "<h3>" + esc(O.paths_h) + "</h3>" + (O.paths_lead ? '<p class="note">' + T(O.paths_lead) + "</p>" : "") + '<ul class="list fl">' + O.paths.map(x => "<li><b>" + T(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" : "") +
      ((O.falsify || []).length ? "<h3>" + esc(O.falsify_h) + "</h3>" + (O.falsify_lead ? '<p class="note">' + T(O.falsify_lead) + "</p>" : "") + '<ul class="watch">' + O.falsify.map(x => "<li>" + T(x) + "</li>").join("") + "</ul>" : "") +
      ((O.method || []).length ? "<h3>" + esc(O.method_h || "산출 방법") + '</h3><ul class="list fl">' + O.method.map(x => "<li><b>" + esc(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" : "") +
      ((O.notes || []).length ? '<section class="fnotes"><h3>' + esc(O.notes_h || "용어 풀이") + "</h3><ol>" + O.notes.map((n, i) => '<li id="fn-' + esc(O.id) + "-" + (i + 1) + '"><b>' + esc(n.k) + "</b> · " + esc(n.t) + ' <button type="button" class="fnback" data-jump="fnr-' + esc(O.id) + "-" + (i + 1) + '" aria-label="본문으로 돌아가기">↩</button></li>').join("") + "</ol></section>" : "") +
      ((O.sources || []).length ? '<details class="src"><summary>출처 ' + O.sources.length + "건</summary><ul>" + O.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "");
  }
  return ((O.summary || []).length ? '<div class="lesson-box ess-sum"><b>' + esc(O.summary_h || "요약") + "</b><ul>" + O.summary.map(x => "<li>" + T(x) + "</li>").join("") + "</ul></div>" : "") +
    "<p>" + T(O.lead) + "</p>" +
    "<h3>" + esc(O.flows_h) + '</h3><ul class="list fl">' + O.flows.map(x => "<li><b>" + T(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" +
    '<div class="lesson-box"><b>' + esc(O.window_h) + "</b>" + O.window.map(x => "<p>" + T(x) + "</p>").join("") + "</div>" +
    "<h3>" + esc(O.events_h) + '</h3><ul class="tl">' + O.events.map(x => '<li><span class="d">' + esc(x.when) + "</span><span>" + T(x.t) + "</span></li>").join("") + "</ul>" +
    "<h3>" + esc(O.paths_h) + '</h3><p class="note">' + T(O.paths_lead) + '</p><ul class="list fl">' + O.paths.map(x => "<li><b>" + T(x.k) + "</b> · " + T(x.t) + "</li>").join("") + "</ul>" +
    "<h3>" + esc(O.falsify_h) + '</h3><p class="note">' + T(O.falsify_lead) + '</p><ul class="watch">' + O.falsify.map(x => "<li>" + T(x) + "</li>").join("") + "</ul>" +
    ((O.notes || []).length ? '<section class="fnotes"><h3>' + esc(O.notes_h || "용어 풀이") + "</h3><ol>" + O.notes.map((n, i) => '<li id="fn-' + esc(O.id) + "-" + (i + 1) + '"><b>' + esc(n.k) + "</b> · " + esc(n.t) + ' <button type="button" class="fnback" data-jump="fnr-' + esc(O.id) + "-" + (i + 1) + '" aria-label="본문으로 돌아가기">↩</button></li>').join("") + "</ol></section>" : "") +
    ((O.sources || []).length ? '<details class="src"><summary>출처 ' + O.sources.length + "건</summary><ul>" + O.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "");
}
function featArticle(F){
  const c = (D.strategies || []).find(x => x.id === F.case);
  return '<article class="sec olk" id="feat-' + esc(F.id) + '"><p class="eyebrow">' + (F.kicker ? esc(F.kicker) : '특집') + (c ? " · " + esc(c.title.split(":")[0]) : "") + " · " + fmtKD(F.date) + '</p><h2 class="olk-t">' + esc(F.title).replace(/(\d+%\S+)/g, '<span style="white-space:nowrap">$1</span>') + " " + ttsBtn("feat:" + F.id) + "</h2>" + featBody(F) +
    (c ? '<div class="chips" style="margin:0"><button type="button" class="chip" data-case="' + esc(c.id) + '">사안 분석 보기 · ' + esc(c.title.split(":")[0]) + "</button></div>" : "") + "</article>";
}
function renderFeature(){
  const L0 = FEATS(); if (!$("#pane-feature")) return;
  const cur = L0.find(F => F.id === S.feat) || L0[0];
  $("#pane-feature").innerHTML = '<div class="sec"><h2>특집</h2></div>' + (cur ? featArticle(cur) : "") +
    (L0.length > 1 ? '<section class="sec"><h3>다른 특집</h3><ul class="list blist">' + L0.filter(F => F !== cur).map(F => '<li><a class="row-btn" href="/feature/' + esc(F.id) + '/" data-feat="' + esc(F.id) + '"><span class="mono">' + fmtKD(F.date) + '</span> <span class="nm">' + esc(F.title) + "</span></a></li>").join("") + "</ul></section>" : "");
  $("#pane-feature").scrollTop = 0;
}
function renderFeatureOld(){
  const L = FEATS(); if (!$("#pane-feature")) return;
  $("#pane-feature").innerHTML = '<div class="sec"><h2>특집</h2></div>' + (L.length ? featArticle(L[0]) : "") +
    (L.length > 1 ? '<section class="sec"><h3>지난 특집 ' + (L.length - 1) + "건</h3>" + L.slice(1).map(F => '<details class="fold" id="featd-' + esc(F.id) + '"><summary>' + fmtKD(F.date) + " · " + esc(F.title) + "</summary>" + featArticle(F) + "</details>").join("") + "</section>" : "");
}
function goFeat(id){
  S.feat = id || null; renderFeature(); switchTab("feature");
}
function aiHtml(c){
  const A = c.ai; if (!A) return "";
  return '<div class="aibox"><div class="aih"><span class="aitag">AI 변수</span><b>' + esc(A.t) + '</b></div><dl class="tw"><dt>쟁점</dt><dd>' + esc(A.stake) + "</dd><dt>영향</dt><dd>" + esc(A.moves) + "</dd><dt>전략 주체가 쥔 것</dt><dd>" + esc(A.lever) + '</dd><dt>선행 신호</dt><dd><ul>' + A.signs.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul></dd></dl>' + (A.review ? '<p class="note"><span class="vd ' + (A.review === "통과" ? "ok" : "fix") + '">독립 반론 검토</span> ' + esc(A.review) + '</p>' : '') /* v3.0b */ + aiPrecHtml(A.prec, A.prec_insight) + '<p class="note">AI가 지정학에 미치는 영향 전반은 <button type="button" class="chip" data-go="grand">국제 질서 탭의 구조적 흐름</button>에서 볼 수 있습니다.</p></div>';
}
function theoryHtml(c){
  const X = c.theory; if (!X || !(X.links || []).length) return "";
  const vc = v => v === "지지" || v === "부합" ? "ok" : v === "반박" || v === "상충" ? "no" : "fix";
  const byC = {}; X.links.forEach(l => (byC[l.claim] = byC[l.claim] || []).push(l));
  const ct = id => { const k = (c.conclusions || []).find(x => x.id === id); return k ? k.t : ""; };
  return '<details class="src theo"><summary>이론과 고전으로 본 판단 · 대조 ' + X.links.length + '건</summary>' +
    (X.status && !PUB() ? '<p class="note" style="margin-top:6px"><span class="vd fix">' + esc(X.status) + "</span></p>" : "") +
    '<p class="note" style="margin:6px 0 8px">주요 결론을 같은 구조를 다룬 고전과 연구에 대조했습니다. 고전과 이론도 검증 대상으로 보아, 판단을 지지하는지·조건을 붙이는지·반박하는지와 그 이론이 틀렸던 경우를 함께 밝힙니다.</p><div class="aiprec">' +
    Object.keys(byC).map(id => '<article class="dv"><div class="hd"><span class="id">' + esc(id) + '</span><span class="note">' + esc(ct(id)) + "</span></div><ul class=\"list\" style=\"margin-top:6px\">" +
      byC[id].map(l => '<li><span class="kd">' + esc(l.kind) + '</span><b>' + esc(l.work) + '</b> <span class="vd ' + vc(l.verdict) + '">' + esc(l.verdict) + "</span><p>" + esc(l.idea) + '</p><p class="tl-w">통하는 점 · ' + esc(l.fit) + '</p><p class="tl-w">한계 · ' + esc(l.limit) + "</p>" +
        ((l.sources || []).length ? '<details class="src"><summary>출처</summary><ul>' + l.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") + "</li>").join("") + "</ul></article>").join("") +
    (X.insight ? '<div class="lesson-box"><b>대조가 드러낸 점</b>' + esc(X.insight) + "</div>" : "") +
    ((X.uncertain || []).length ? '<details class="src"><summary>확인하지 못한 사항 ' + X.uncertain.length + "건</summary><ul>" + X.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") +
    "</div></details>";
}
/* v3.19 여론 조사 한 건. 사안과 나라 프로필이 함께 쓴다 */
function pubArticle(p, id, hd){
  return '<article class="dv"' + (id ? ' id="' + esc(id) + '"' : "") + '><div class="hd"><span class="id">' + esc(p.who) + '</span>' + (hd || "") + '</div><p style="margin-top:4px"><b>' + esc(p.q) + '</b></p><p class="mono pub-s">' + esc(p.series) + ' <span class="note">(' + esc(p.unit) + ')</span></p><p class="note">최근 조사 · ' + esc(p.latest) + "</p><p>" + esc(p.read) + '</p><p class="tl-w">주의 · ' + esc(p.caveat) + "</p>" +
      ((p.sources || []).length ? '<details class="src"><summary>출처</summary><ul>' + p.sources.map(u => /^https?:/.test(u) ? srcItem(u) : "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") + "</article>";
}
/* v3.19 나라 프로필: 이 나라 국민을 대상으로 한 여론 조사를 사안에서 모아 보인다 */
function countryPublicsHtml(c){
  const alias = {"한국": "KOR"}, isoOf = n => alias[n] || (Object.values(D.countries).find(x => x.name_ko === n) || {}).iso;
  const L = [];
  (D.strategies || []).forEach(k => ((k.publics || {}).items || []).forEach((p, i) => {
    const who = String(p.who).split(" · ")[0].split("·").map(x => isoOf(x.trim()));
    if (who.includes(c.iso)) L.push({p, k, i});
  }));
  if (!L.length) return "";
  return '<section class="sec" id="c-pub"><h3>국내 여론 · 조사 ' + L.length + "건</h3>" +
    L.map(x => pubArticle(x.p, "", '<button type="button" class="chip" data-case="' + esc(x.k.id) + '" style="margin-left:auto">' + esc(String(x.k.title).split(":")[0]) + "</button>")).join("") + "</section>";
}
function publicsHtml(c){
  const X = c.publics; if (!X || !(X.items || []).length) return "";
  return '<details class="src theo pub" id="pub-' + esc(c.id) + '"><summary>국내 여론과 협상의 폭 · 조사 ' + X.items.length + '건</summary>' +
    '<p class="note" style="margin:6px 0 8px">전략 평가는 정부의 목표를 기준으로 하지만, 정부가 실제로 고를 수 있는 선택지의 폭은 국내 여론이 정합니다. 결정권을 가진 나라의 여론 조사를 조사기관의 원문으로 확인해, 판단과 어긋나는 곳과 판단을 바꿀 신호를 밝힙니다. 기관마다 문항이 달라 서로 다른 조사를 한 시계열로 잇지 않았습니다.</p><div class="aiprec">' +
    X.items.map((p, i) => pubArticle(p, "pub-" + c.id + "-" + i)).join("") +
    '<div class="lesson-box"><b>여론이 정하는 협상의 폭</b>' + esc(X.read) + (X.watch ? '<p class="tl-w" style="margin-top:6px">판단을 바꿀 신호 · ' + esc(X.watch) + "</p>" : "") + "</div></div></details>";
}
function aiPrecHtml(L, ins){
  if (!L || !L.length) return "";
  const vc = v => v === "지지" || v === "부합" ? "ok" : v === "반박" || v === "상충" ? "no" : "fix";
  return '<details class="src"><summary>선례 대조 · 판단 ' + L.length + '건</summary><div class="aiprec" style="margin-top:8px">' +
    L.map(k => '<article class="dv chk-' + vc(k.verdict) + '"><div class="hd"><span class="id">' + esc(k.claim) + '</span><span class="vd ' + vc(k.verdict) + '">' + esc(k.verdict) + "</span></div><dl><dt>근거</dt><dd>" + esc(k.reason) + "</dd><dt>대조한 선례</dt><dd><ul>" +
      k.precedents.map(p => "<li><b>" + esc(p.name) + '</b> <span class="mono note">' + esc(p.period) + "</span><br>" + esc(p.what) + '<br><span class="note">' + esc(p.relevance) + "</span>" + (p.sources && p.sources.length ? '<ul>' + p.sources.map(srcItem).join("") + "</ul>" : "") + "</li>").join("") + "</ul></dd></dl></article>").join("") +
    (ins ? '<div class="lesson-box"><b>선례가 드러낸 점</b>' + esc(ins) + "</div>" : "") + "</div></details>";
}
function worldHtml(c){
  const W = c.world; if (!W) return "";
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  return '<h3 style="margin:8px 0 0">세계 시나리오별 전개</h3><p class="note">' + esc(W.note) + ' 세계 시나리오는 <button type="button" class="chip" data-go="grand">국제 질서 탭</button>에서 볼 수 있습니다.</p><div class="tbl-wrap"><table class="tbl ext" style="min-width:560px"><thead><tr><th>세계 시나리오</th><th>확률</th>' + W.order.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span><br>" + esc(fn[k]) + "</th>").join("") + "</tr></thead><tbody>" +
    W.rows.map(r => "<tr><td><b>" + esc(r.id + ". " + r.name) + '</b><br><span class="note">' + esc(r.why) + '</span></td><td class="mono">' + r.p + "%</td>" + r.cond.map(v => '<td class="mono">' + v + "</td>").join("") + "</tr>").join("") +
    '<tr class="base"><td>가중 합 (검사)</td><td class="mono">100%</td>' + W.mix.map((v, i) => '<td class="mono">' + v + '<span class="dd">기준 ' + W.base[i] + "</span></td>").join("") + "</tr></tbody></table></div>";
}
function extHtml(c){
  const X = c.external; if (!X) return "";
  const fn = {}; c.futures.items.forEach(f => fn[f.id] = f.name);
  const dv = (v, b) => { const d = v - b; return '<span class="dd">' + (d > 0 ? "▲" + d : d < 0 ? "▼" + (-d) : "±0") + "</span>"; };
  return '<h3 style="margin:8px 0 0">바깥 변수와 조건부 전개</h3><p class="note">' + esc(X.note) + "</p>" +
    '<div class="tbl-wrap"><table class="tbl ext" style="min-width:600px"><thead><tr><th>바깥 변수 (2030년까지)</th><th>발생 가능성</th>' + X.order.map(k => '<th><span style="color:' + fcol(k) + '">' + k + "</span><br>" + esc(fn[k]) + "</th>").join("") + "<th>영향받는 판단</th></tr></thead><tbody>" +
    '<tr class="base"><td>기준 · 현 추세</td><td class="mono">—</td>' + X.base.map(v => '<td class="mono">' + v + "</td>").join("") + "<td></td></tr>" +
    X.items.map(x => "<tr><td><b>" + esc(x.t) + '</b><br><span class="note">' + esc(x.def) + '</span></td><td class="mono">' + x.p + "%</td>" + x.cond.map((v, i) => '<td class="mono">' + v + dv(v, X.base[i]) + "</td>").join("") + '<td class="note">' + esc(x.flips) + "</td></tr>").join("") +
    '</tbody></table></div><p class="note">가운데 칸은 해당 변수가 발생했을 때의 전개별 확률(%)이며, ▲▼는 기준 대비 변화입니다. 판단값이므로 ±5 안팎의 차이에는 의미를 두지 않습니다.</p><div class="exts">' + X.items.map(x => '<details class="dec"><summary><span class="nm">' + esc(x.id + " " + x.t) + '</span><span class="pw">' + x.p + '%</span><span class="fr">' + esc(x.why) + '</span></summary><dl><dt>가장 크게 반응하는 국가</dt><dd>' + x.who.map(chip).join(" ") + "</dd>" + (x.crit ? "<dt>성립 기준</dt><dd>" + esc(x.crit) + "</dd>" : "") + "<dt>선행 신호</dt><dd>" + esc(x.sign) + "</dd>" + (x.basis ? "<dt>근거와 선례</dt><dd>" + esc(x.basis) + "</dd>" : "") + "</dl></details>").join("") + "</div>" +
    '<div class="lesson-box"><b>바깥 변수의 함의</b><ul class="facts" style="margin-top:6px">' + X.reads.map(r => "<li>" + esc(r) + "</li>").join("") + "</ul></div>";
}
function counterHtml(c){
  const L = c.counter; if (!L || !L.length) return "";
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return L.map(W => '<section class="stp counter"><div class="stp-h"><i>⇄</i><b>상대편에서 본 최선의 수 · ' + esc(W.name) + '</b></div><p class="note">' + esc(W.note) + ' 목표의 순서 <span class="mono">' + esc(W.order) + "</span></p>" +
    '<details class="src"><summary>' + esc(W.name.split(" ")[0]) + '의 목표 ' + W.goals.length + '개와 출처</summary><ul class="list goals">' + W.goals.map(g => '<li class="rv"><span><b class="mono" style="color:var(--conflict)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + '<br><span class="note">출처 · ' + esc(g.src) + "</span></p></li>").join("") + "</ul></details>" +
    '<div class="tbl-wrap"><table class="tbl evt" style="min-width:720px"><thead><tr><th>수</th>' + W.goals.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + "<th>실현 가능성</th></tr></thead><tbody>" +
    W.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + a.ev.map(e => "<td>" + sc(e[0]) + '<span class="why">' + esc(e[1]) + "</span></td>").join("") + "<td>" + esc(a.feas) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<div class="verdict">' + W.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + "위 " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + '</div><div class="lesson-box"><b>5단계(상대의 대응) 추정과의 대조</b>' + esc(W.read) + "</div></section>").join("");
}
function twowayHtml(c){
  const T = c.twoway; if (!T) return "";
  return '<section class="stp twoway"><div class="stp-h"><i>⇆</i><b>양방향 검토 · 최선의 수가 만나는 지점</b></div><p class="note">전략 주체와 상대국이 각자의 목표에 따라 최선의 수를 둘 때 어디에서 균형이 이뤄지는지 검토합니다.</p>' +
    '<div class="tbl-wrap"><table class="tbl" style="min-width:420px"><thead><tr><th>전략 주체</th><th>최선의 수</th></tr></thead><tbody>' + T.pairs.map(p => "<tr><td><b>" + esc(p[0]) + "</b></td><td>" + esc(p[1]) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<dl class="tw"><dt>균형점</dt><dd>' + esc(T.equilibrium) + "</dd><dt>거래의 공간</dt><dd>" + esc(T.zopa) + '</dd><dt>공동의 함정</dt><dd><ul>' + T.traps.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></dd>" +
    (T.changes && !PUB() ? '<dt></dt><dd><ul>' + T.changes.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></dd>" : "") + "</dl></section>";
}
function swapHtml(c){
  const W = c.swap; if (!W) return "";
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return '<section class="stp swap"><div class="stp-h"><i>↔</i><b>전략 주체를 바꿔 보면 · ' + esc(W.name) + '</b></div><p class="note">' + esc(W.note) + ' 목표의 순서 <span class="mono">' + esc(W.order) + '</span></p><ul class="list goals">' +
    W.goals.map(g => '<li class="rv"><span><b class="mono" style="color:var(--accent)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + '<br><span class="note">출처 · ' + esc(g.src) + "</span></p></li>").join("") + "</ul>" +
    '<div class="tbl-wrap"><table class="tbl evt" style="min-width:720px"><thead><tr><th>안</th>' + W.goals.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + "<th>실현 가능성</th></tr></thead><tbody>" +
    W.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + a.ev.map(e => "<td>" + sc(e[0]) + '<span class="why">' + esc(e[1]) + "</span></td>").join("") + "<td>" + esc(a.feas) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<div class="verdict">' + W.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + "순위 " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + '</div><div class="lesson-box"><b>주체 교체로 드러난 점</b>' + esc(W.lesson) + "</div></section>";
}
function evalHtml(c){
  const G = c.client.goals;
  const HC = c.alts.some(a => a.ev.cost);  /* v3.90 비용 판단이 없는 사안은 비용 칸을 두지 않는다 */
  const sc = s => '<span class="sc s' + (s > 0 ? "p" : s < 0 ? "n" : "z") + (Math.abs(s) === 2 ? "2" : "") + '">' + (s > 0 ? "+" + s : s < 0 ? "−" + (-s) : "0") + "</span>";
  return '<div class="tbl-wrap"><table class="tbl evt" style="min-width:820px"><thead><tr><th>안</th>' + G.map(g => '<th><span class="mono">' + g.id + "</span> " + esc(g.t) + "</th>").join("") + (HC ? "<th>비용</th>" : "") + "<th>가역성</th><th>확전 위험</th><th>실현 가능성</th></tr></thead><tbody>" +
    c.alts.map(a => '<tr><td><b class="mono">' + a.id + '</b><br><span class="note">' + esc(a.name) + "</span></td>" + G.map(g => { const e = a.ev[g.id]; return "<td>" + sc(e.s) + '<span class="why">' + esc(e.t) + "</span></td>"; }).join("") +
      (HC ? "<td>" + esc(a.ev.cost) + "</td>" : "") + "<td>" + esc(a.ev.rev2) + "</td><td>" + esc(a.ev.esc2) + "</td><td>" + esc(a.ev.feas) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<p class="note">−2 크게 잃음 · −1 잃음 · 0 중립 · +1 얻음 · +2 크게 얻음. 목표별 값을 더하지 않습니다. 우선순위가 앞선 목표의 값이 순위를 먼저 가릅니다.</p>';
}
/* v3.90(2026-10-10 결재): Ⅲ 인간 안보 화면 2안. 집단별 카드(첫 문장, '2030년까지 100번의 미래' 점 그림, 범주별 현재·가장 나쁜 경우·가장 좋은 경우 선 그림, 가장 나쁜 경우의 원래 단위 풀이), 숫자 표는 접힘 */
const HS_CAT = [["개인", "개인 안전"], ["공동체", "공동체"], ["정치", "정치"], ["경제", "경제"]];
const HS_COL = {better: "#0EA5A4", same: "#D3D8DE", worse: "#F59E0B", big: "#C8102E"};  /* v3.93 색상 B안(2026-10-11 결재): 진홍·호박색·청록 */
const HS_LAB = {better: "개선됨", same: "현재와 비슷함", worse: "악화됨", big: "크게 악화됨"};
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
  return '<svg viewBox="0 0 110 110" class="hs-dots" role="img" aria-label="' + HS_ORD.filter(k => Math.round(c[k])).map(k => HS_LAB[k] + " " + Math.round(c[k]) + "번").join(", ") + '">' +
    seq.map((k, i) => '<circle cx="' + (5.5 + (i % 10) * 11) + '" cy="' + (5.5 + Math.floor(i / 10) * 11) + '" r="4.2" fill="' + HS_COL[k] + '"></circle>').join("") + "</svg>";
}
function hsLegend(c, c2){
  return '<ul class="hs-lg">' + HS_ORD.filter(k => Math.round(c[k]) || Math.round(c2[k])).map(k => '<li><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + " <b>" + Math.round(c[k]) + "번</b>" + (Math.round(c2[k]) !== Math.round(c[k]) ? '<span class="note hs-rec">→ 권고 이행 시 ' + Math.round(c2[k]) + "번</span>" : "") + "</li>").join("") + "</ul>";
}
function hsLine(H, G){
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const W = 340, L = 74, R = W - 10, sc = v => L + (R - L) * v / 100; let y = 20, rows = "";
  HS_CAT.forEach(([k, lab]) => {
    const v = G.cat[k];
    rows += '<text x="0" y="' + (y + 4) + '" class="hs-l">' + lab + "</text>";
    if (v.na) { rows += '<text x="' + L + '" y="' + (y + 4) + '" class="hs-n">측정 불가</text>'; y += 32; return; }
    rows += '<line x1="' + L + '" x2="' + R + '" y1="' + y + '" y2="' + y + '" class="hs-t"/>';
    if (v.worst_sc) rows += '<line x1="' + sc(v.worst) + '" x2="' + sc(v.now) + '" y1="' + y + '" y2="' + y + '" stroke="#C8102E" stroke-width="2"/><circle cx="' + sc(v.worst) + '" cy="' + y + '" r="5" fill="var(--panel)" stroke="#C8102E" stroke-width="2"><title>가장 나쁜 경우 ' + fmt(v.worst) + '</title></circle><text x="' + sc(v.worst) + '" y="' + (y + 17) + '" class="hs-w" text-anchor="middle">' + Math.round(v.worst) + "</text>";
    if (v.best_sc) rows += '<line x1="' + sc(v.now) + '" x2="' + sc(v.best) + '" y1="' + y + '" y2="' + y + '" stroke="#0EA5A4" stroke-width="2"/><circle cx="' + sc(v.best) + '" cy="' + y + '" r="5" fill="var(--panel)" stroke="#0EA5A4" stroke-width="2"><title>가장 좋은 경우 ' + fmt(v.best) + '</title></circle><text x="' + sc(v.best) + '" y="' + (y + 17) + '" class="hs-b" text-anchor="middle">' + Math.round(v.best) + "</text>";
    rows += '<circle cx="' + sc(v.now) + '" cy="' + y + '" r="5" fill="var(--accent)"><title>현재 ' + fmt(v.now) + '</title></circle><text x="' + Math.min(sc(v.now), R - 6) + '" y="' + (y - 9) + '" class="hs-v" text-anchor="middle">' + Math.round(v.now) + "</text>";
    y += 36;
  });
  return '<svg viewBox="0 0 ' + W + " " + y + '" class="hs-line" role="img" aria-label="범주별 현재와 가장 나쁜 경우">' + rows + "</svg>";
}
function hsWorstSc(G){ const w = HS_CAT.map(([k]) => G.cat[k]).filter(v => !v.na && v.worst_sc); if (!w.length) return null; const cnt = {}; w.forEach(v => cnt[v.worst_sc] = (cnt[v.worst_sc] || 0) + 1); return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; }
function hsBestSc(G){ const b = HS_CAT.map(([k]) => G.cat[k]).filter(v => !v.na && v.best_sc); return b.length ? b[0].best_sc : null; }
/* v3.96i 집단 순서: 2030년까지 100번의 미래에서 삶이 달라지는(점이 칠해지는) 횟수가 많은 집단부터. 같으면 크게 악화됨·악화됨이 많은 쪽, 그다음 자료 순서 */
function hsOrd(H, gs){ const n = G => hsCount(H, G, "p"), sc = gs.map((G, i) => { const c = n(G); return {G, i, k: [100 - c.same, c.big, c.worse]}; });
  return sc.sort((a, b) => b.k[0] - a.k[0] || b.k[1] - a.k[1] || b.k[2] - a.k[2] || a.i - b.i).map(x => x.G); }
function hsCard(H, G, cid){
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const c = hsCount(H, G, "p"), c2 = hsCount(H, G, "p_rec"), ws = hsWorstSc(G), bs = hsBestSc(G);
  const facts = ws ? HS_CAT.map(([k]) => { const v = G.cat[k]; if (k === "정치") return v.na || v.by[ws] > v.now - 1 ? "" : "국가 폭력 늘어남"; return (v.by_raw || {})[ws]; }).filter(Boolean) : [];
  const al = ws ? (G.al[ws] || []) : [];
  return '<article class="hs-card"' + (cid ? ' id="hs7-' + esc(cid) + "-" + esc(G.k) + '"' : "") + '><div class="hs-hd"><b>' + esc(G.name) + "</b><span>" + esc(G.size) + '</span></div><p class="hs-hl">' + esc(G.line) + '</p><div class="hs-grid"><figure><figcaption>2030년까지 100번의 미래</figcaption>' + hsDots(c) + hsLegend(c, c2) + "</figure>" +
    '<figure><figcaption>현재(<span style="color:var(--accent)">●</span>)' + (ws ? '와 가장 나쁜 경우(<span style="color:#C8102E">○</span>, ' + esc(SN[ws].name) + " " + SN[ws].p + "%)" : "") + (bs ? ' · 가장 좋은 경우(<span style="color:#0EA5A4">○</span>, ' + esc(SN[bs].name) + " " + SN[bs].p + "%)" : "") + " · 0~100점, 높을수록 좋음</figcaption>" + hsLine(H, G) +
    (ws ? '<p class="hs-wf">' + esc(SN[ws].name) + "일 때 · " + facts.map(esc).join(" · ") + (al.length ? ' · <span class="hs-al">' + esc(al.join("·")) + " 경보</span>" : "") + "</p>" : "") +
    (G.al_now.length ? '<p class="hs-wf">현재 켜진 경보 · <span class="hs-al">' + esc(G.al_now.join("·")) + "</span></p>" : "") + "</figure></div></article>";
}
function hsTables(H){
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const cur = '<div class="tbl-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th>집단</th>' + HS_CAT.map(([k, l]) => "<th>" + l + "</th>").join("") + "<th>현재 경보</th></tr></thead><tbody>" +
    H.groups.map(G => "<tr><td>" + esc(G.name) + "</td>" + HS_CAT.map(([k]) => { const v = G.cat[k]; return v.na ? '<td class="note">측정 불가</td>' : '<td class="mono">' + fmt(v.now) + '<small class="hs-rw">' + esc(v.raw || "") + "</small></td>"; }).join("") + '<td class="note">' + esc(G.al_now.join("·") || "없음") + "</td></tr>").join("") + "</tbody></table></div>";
  const ex = '<div class="tbl-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th>집단</th><th>범주</th><th>현재</th><th>현 노선 유지</th><th>권고 이행 시</th><th>가장 나쁜 경우</th></tr></thead><tbody>' +
    H.groups.map(G => HS_CAT.map(([k, l]) => { const v = G.cat[k]; return v.na ? "<tr><td>" + esc(G.name) + "</td><td>" + l + '</td><td colspan="4" class="note">측정 불가</td></tr>' : "<tr><td>" + esc(G.name) + "</td><td>" + l + '</td><td class="mono">' + fmt(v.now) + '</td><td class="mono">' + fmt(v.exp) + '</td><td class="mono">' + fmt(v.rec) + '</td><td class="mono">' + (v.worst_sc ? fmt(v.worst) + ' <span class="note">(' + esc(SN[v.worst_sc].name) + " " + SN[v.worst_sc].p + "%)</span>" : '<span class="note">악화되는 전개 없음</span>') + "</td></tr>"; }).join("")).join("") + "</tbody></table></div>";
  const by = H.groups.map(G => '<details class="src"><summary>전개별 값 · ' + esc(G.name) + '</summary><div class="tbl-wrap"><table class="tbl" style="min-width:620px"><thead><tr><th>전개(확률)</th>' + HS_CAT.map(([k, l]) => "<th>" + l + "</th>").join("") + "<th>경보</th></tr></thead><tbody>" +
    H.scen.map(s => "<tr><td><b class=\"mono\">" + esc(s.id) + "</b> " + esc(s.name) + '<br><span class="note">' + s.p + "%" + (s.p_rec !== s.p ? " · 권고 이행 시 " + s.p_rec + "%" : "") + "</span></td>" + HS_CAT.map(([k]) => { const v = G.cat[k], r = (v.by_raw || {})[s.id]; return v.na ? '<td class="note">' + esc(r || "측정 불가") + "</td>" : '<td class="mono">' + fmt(v.by[s.id]) + (r ? '<small class="hs-rw">' + esc(r) + "</small>" : "") + "</td>"; }).join("") + '<td class="note">' + esc((G.al[s.id] || []).join("·") || "없음") + "</td></tr>").join("") + "</tbody></table></div></details>").join("");
  return '<h4 class="hs-h4">현재의 삶 · 2026년</h4>' + cur + '<h4 class="hs-h4">2030년까지의 변화(확률 가중)</h4>' + ex + '<p class="note">현 노선 유지와 권고 이행 시는 각 전개의 2030년 값에 그 확률을 곱해 더한 값입니다. 확률이 높은 전개에서 삶이 거의 변하지 않으면 이 값도 거의 움직이지 않으므로, 위험의 크기는 가장 나쁜 경우와 그 확률로 보십시오.</p>' + by;
}
/* 시안(2026-10-10): 확률 변경 전후의 점 개수와 변경 이력 */
function hsCountP(H, G, pm){ return hsCount({scen: H.scen.map(s => Object.assign({}, s, {q: pm[s.id] != null ? pm[s.id] : s.p}))}, G, "q"); }
const kd = s => { const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(s)); return m ? (+m[1]) + "월 " + (+m[2]) + "일" : String(s); };
function hsDiff(H, G, x){ const a = hsCountP(H, G, x.prev), b = hsCountP(H, G, x.next), d = HS_ORD.filter(k => a[k] !== b[k]).map(k => HS_LAB[k] + " " + a[k] + "→" + b[k] + "번"); return d.length ? d.join(" · ") : "점 개수 변화 없음"; }
function hsChgLine(H, G){
  const x = (H.changes || []).slice(-1)[0];
  return '<p class="lh-chg">' + (x ? "<b>최근 변경 · " + kd(x.d) + " · " + esc(x.kind) + "</b><br>" + esc(hsDiff(H, G, x)) : "10월 10일 공개 이후 확률 변경 없음") + "</p>";
}
function hsHistHtml(H){
  const ch = H.changes || [], SN = {}; H.scen.forEach(s => SN[s.id] = s);
  return '<details class="src"><summary>확률 변경 이력 · ' + (ch.length ? ch.length + "건" : "변경 없음") + "</summary>" + (ch.length ? '<ul class="tl">' + ch.slice().reverse().map(x => '<li><span class="d">' + esc(x.d) + "</span><span><b>" + esc(x.kind) + "</b> · " + esc(x.why) + '<br><span class="note">' + Object.keys(x.next).filter(k => x.prev[k] !== x.next[k]).map(k => esc(k + " " + (SN[k] ? SN[k].name : "")) + " " + x.prev[k] + "% → " + x.next[k] + "%").join(" · ") + "</span><br>" + H.groups.filter(G => !G.fold).map(G => esc(G.name) + ": " + esc(hsDiff(H, G, x))).join("<br>") + "</span></li>").join("") + "</ul>" : '<p class="note">2026년 10월 10일 공개 이후 바뀐 확률이 없습니다.</p>') + "</details>";
}
function lifeMain(c){ const H = c.hs7; return H.groups.find(g => !g.fold) || H.groups[0]; }
function lifeNums(n, sep){ return ["big", "worse", "better"].filter(k => n[k]).map(k => '<span style="white-space:nowrap"><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + " " + n[k] + "번</span>").join(sep || " · ") || "100번 모두 현재와 거의 같음"; }
/* 브리핑 첫머리 '사람들의 삶'(2026-10-10 통합안, 큰 카드). 누구의 삶으로 볼지 고른다: 당사국 국민·한국인·미국인·유럽인·러시아인.
   골라진 집단이 어느 미래에서도 '거의 같음'이면 점 그림 없이 한 줄로 줄인다(영향받는 사람만 크게) */
const LIFE_SEL_ALL = [["main", "당사국 국민"], ["KOR", "한국인"], ["USA", "미국인"], ["EU", "유럽인"], ["RUS", "러시아인"]];
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
  const brf = k.length ? '<button type="button" class="chip lh-brf" data-jump="bi-' + k[0] + '">오늘 브리핑 ' + k.length + "건 ↓</button>" : "";
  if (!G) return '<article class="lh-card lh-none"><p class="lh-case">' + esc(nm) + '</p><p class="lh-line">이 사안에서는 계산하지 않았습니다.</p></article>';
  const n = hsCount(H, G, "p"), hit = H.scen.some(s => G.cls[s.id] !== "same");
  const eu = LIFE === "EU" && hit && H.groups.filter(g => LIFE_EU.includes(g.k)).length > 1 ? '<span class="lh-sub">유럽에서 영향이 가장 큰 집단</span>' : "";
  const hd = '<p class="lh-case">' + esc(nm) + '</p><div class="lh-hd"><b>' + esc(G.name) + "</b><span>" + esc(G.size) + "</span>" + eu + "</div>";
  const go = '<div class="lh-act"><button type="button" class="chip" data-hs="' + esc(c.id) + '">삶에 미치는 영향 자세히 →</button>' + brf + "</div>";
  if (!hit) return '<article class="lh-card lh-none">' + hd + '<p class="lh-flat">100번 모두 현재와 비슷함</p><p class="lh-line">' + esc(G.line) + "</p>" + go + "</article>";
  return '<article class="lh-card">' + hd + '<div class="lh-body">' + hsDots(n) + "<div>" + hsLegend(n, n) + '</div></div><p class="lh-line">' + esc(G.line) + "</p>" + hsChgLine(H, G) + go + "</article>";
}
function lifeBigHtml(x){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  return '<section class="life" id="s-life"><h3 class="lm-h" style="margin:14px 0 2px">사람들의 삶 · 2030년까지 100번의 미래</h3><p class="note" style="margin:0">5개 사안마다 2030년까지 일어날 수 있는 미래 100번 가운데 삶이 개선되거나 악화되는 횟수입니다(판단값). 누구의 삶을 볼지 고를 수 있습니다.</p>' +
    '<div class="lsel" role="group" aria-label="누구의 삶을 볼까">' + (LIFE_SEL.length > 1 ? LIFE_SEL : []).map(([k, l]) => '<button type="button" data-life="' + k + '" aria-pressed="' + (k === LIFE) + '">' + l + "</button>").join("") + "</div>" +
    '<div class="lh-row" id="lifegrid">' + cs.map(c => lifeCard(c, x)).join("") + "</div></section>";
}
/* v3.92 시안(2026-10-10): 첫 화면 = '사람들의 삶' 그래프판 + 그래프를 움직이는 한 줄 정보.
   사안마다 한 줄(점 그림 · 집단과 횟수 · 첫 문장 · 이 사안의 최근 한 줄 정보), 그 아래 오늘의 한 줄 정보 전체와 지난 날짜 */
const firstSent = t => { const m = /^(.+?다\.)(\s|$)/.exec(String(t || "")); return m ? m[1] : String(t || ""); };
function lifeNumsBig(n){ return ["big", "worse", "better", "same"].filter(k => n[k]).map(k => '<span class="lb-k' + (k === "same" ? " lb-same" : "") + '"><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + " <b>" + n[k] + "</b></span>").join(""); }
const LB_SHORT = {korea: "한반도", taiwan: "대만해협", ukraine: "러-우 전쟁", iran: "이란·호르무즈", poland: "러시아-NATO"};
function lbCase(H, G){  /* 그래프 옆 한 줄: 가장 나쁜 경우(와 가장 좋은 경우)를 원래 단위로 */
  const SN = {}; H.scen.forEach(s => SN[s.id] = s);
  const ws = hsWorstSc(G), bs = hsBestSc(G), fx = sid => HS_CAT.map(([k]) => { const v = G.cat[k]; if (k === "정치") return v.na || v.by[sid] > v.now - 1 ? "" : "국가 폭력 늘어남"; return (v.by_raw || {})[sid]; }).filter(Boolean);
  const line = (lab, sid) => { const f = fx(sid), al = G.al[sid] || []; return '<p class="lb-ws"><b>' + lab + "</b> · " + esc(SN[sid].name) + " " + SN[sid].p + "%" + (f.length ? " · " + f.map(esc).join(" · ") : "") + (al.length && lab === "가장 나쁜 경우" ? ' · <span class="hs-al">' + esc(al.join("·")) + " 경보</span>" : "") + "</p>"; };
  const bad = ws && (G.cls[ws] === "worse" || G.cls[ws] === "big");  /* 악화로 분류되는 전개가 없으면 '가장 나쁜 경우'를 보이지 않는다 */
  return (bad ? line("가장 나쁜 경우", ws) : "") + (bs && (!bad || G.cls[bs] === "better") ? line("가장 좋은 경우", bs) : "") || '<p class="lb-line">' + esc(firstSent(G.line)) + "</p>";
}
function lbFx(i, quiet, d){  /* 한 줄 정보가 그래프·전망에 주는 영향. v3.95: 그날 그 사안의 전개 확률이 바뀌었으면 '그래프 변경' */
  const fc = (i.fc || []).map(f => { const F = D.forecasts.find(z => z.id === f.id), e = FCE[f.e] || FCE.none; return '<button type="button" class="fcchip bfc bfc-' + esc(f.e) + '" data-fc="' + esc(f.id) + '" title="' + esc((F ? F.q + " · " : "") + e[1]) + '">' + fcLab(F, f.id, F ? F.p : null) + ' <b aria-hidden="true">' + e[0] + "</b></button>"; }).join("");
  const C = d && i.case ? (D.strategies || []).find(s => s.id === i.case) : null;
  const moved = C && C.hs7 && (C.hs7.changes || []).some(x => x.d === d);
  return fc + (moved ? '<span class="lb-fx lb-fx-on">그래프 변경</span>' : "") || (quiet ? "" : '<span class="lb-fx">그래프 변화 없음</span>');
}
function lbRecentHtml(rec, today){  /* v3.98: 국민의 삶 카드와 산업별 영향 선 그래프 상세가 함께 씀 */
  return rec.length ? '<ul class="lb-rc">' + rec.map(([d, i]) => '<li><span class="lb-d' + (d === today ? " lb-today" : "") + '">' + (d === today ? "오늘" : md(d)) + '</span><span class="lb-t">' + esc(i.h) + "</span>" + lbFx(i, true).replace(/(<button type="button" class="fcchip bfc[^>]*>)/g, '$1<span class="lb-fcl">전망</span> ') + "</li>").join("") + "</ul>" : '<p class="note">최근 정보 없음</p>';
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
  const dots = k => ser.map(v => '<circle cx="' + X(v.d).toFixed(1) + '" cy="' + Y(v[k]).toFixed(1) + '" r="2.2" fill="' + LC[k] + '"><title>' + esc(kd(v.d) + " · " + LAB[k] + " " + v[k] + "번") + "</title></circle>").join("");
  const mine = i => OPT.anyCase ? !!i.case : i.case === c.id;
  const info = (BR.issues || []).filter(x => x.date >= c0 && x.date <= b && x.items.some(mine)).map(x => '<rect x="' + (X(x.date) - 1.5).toFixed(1) + '" y="' + (B + 4) + '" width="3" height="6" rx="1" class="lt-tick' + (x.date === today ? " lt-today" : "") + '"><title>' + esc(kd(x.date) + " 한 줄 정보 " + x.items.filter(mine).length + "건") + "</title></rect>").join("");
  const chg = ch.filter(x => x.d >= c0 && x.d <= b).map(x => { const p = cnt(x.prev), n = cnt(x.next);  /* v3.96g: 바뀐 지점에 동그라미 대신 바뀌기 직전의 점 개수를 작은 숫자로(선의 왼쪽 위, 같은 날 숫자끼리 10px 간격) */
    const ls = KS.filter(k => p[k] !== n[k]).map(k => ({k, y: Y(p[k]) - 4})).sort((u, v) => u.y - v.y); ls.forEach((o, i) => { if (i && o.y - ls[i - 1].y < 10) o.y = ls[i - 1].y + 10; });
    return ls.map(o => '<text x="' + (X(x.d) - 3).toFixed(1) + '" y="' + o.y.toFixed(1) + '" class="lt-pv" text-anchor="end" fill="' + LC[o.k] + '"><title>' + esc(kd(x.d) + " 변경 전 " + LAB[o.k] + " " + p[o.k] + "번 → " + n[o.k] + "번 · " + x.kind) + "</title>" + p[o.k] + "</text>").join(""); }).join("");
  const lab = KS.map(k => ({k, y: Y(last[k]) + 4})).sort((p, q) => p.y - q.y);  /* 오른쪽 끝 숫자: 겹치지 않게 11px 간격으로 밀어 냄 */
  lab.forEach((o, i) => { if (i && o.y - lab[i - 1].y < 11) o.y = lab[i - 1].y + 11; });
  const over = lab.length ? lab[lab.length - 1].y - (B + 4) : 0; if (over > 0) lab.forEach(o => o.y -= over);
  const xt = (span >= 20 ? [a, ymdAdd(a, Math.round(span / 3)), ymdAdd(a, Math.round(span * 2 / 3)), end] : [a, ymdAdd(a, Math.round(span / 2)), end]).map(d => '<text x="' + X(d).toFixed(1) + '" y="' + (Hh - 2) + '" class="lt-x" text-anchor="' + (d === a ? "start" : d === end ? "end" : "middle") + '">' + md(d) + "</text>").join("");
  const pre = c0 < "2026-10-10" ? '<rect x="' + X(c0).toFixed(1) + '" y="' + T + '" width="' + (X("2026-10-10") - X(c0)).toFixed(1) + '" height="' + (B - T) + '" class="lt-pre"><title>10월 9일 값은 그날의 확률에 현재 분류를 적용한 값입니다</title></rect>' : "";
  if (OPT.bare) return '<svg class="lt-bare" viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="' + esc(G.name + " 일자별 주요 점 개수, " + kd(last.d) + " " + KS.map(k => LAB[k] + " " + last[k] + "번").join(", ")) + '">' + pre +
    [0.5, 1].map(f => '<line x1="' + L + '" x2="' + R + '" y1="' + Y(yMax * f).toFixed(1) + '" y2="' + Y(yMax * f).toFixed(1) + '" class="lt-grid"/>').join("") + '<line x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '" class="lt-ax"/>' +
    '<text x="' + (R + 4) + '" y="' + (Y(yMax) + 3).toFixed(1) + '" class="lt-y">' + yMax + "</text>" + KS.map(k => '<path d="' + path(k) + '" class="lt-ln" stroke="' + LC[k] + '"/>' + dots(k)).join("") + chg + info +
    lab.map(o => '<text x="' + (X(last.d) + 7).toFixed(1) + '" y="' + o.y.toFixed(1) + '" class="lt-v" fill="' + LC[o.k] + '">' + last[o.k] + "</text>").join("") + xt + "</svg>";  /* v3.99: 최종 결과 칸 안에 바로 보이는 선 그래프(제목 없이) */
  return '<figure class="lt"' + (OPT.tag ? ' data-lt="' + esc(OPT.tag) + '" data-w="' + W + '"' : "") + '><figcaption class="lt-cap"><span>일자별 주요 점 개수 추이</span><span class="note">' + (have > 29 ? "최근 30일" : kd(LB_START) + "부터") + '</span></figcaption><svg viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="' + esc(G.name + " 일자별 주요 점 개수, " + kd(last.d) + " " + KS.map(k => LAB[k] + " " + last[k] + "번").join(", ")) + '">' + pre +
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
  if (!x) return '<p class="lb-why lb-why0"><b>최근 변경 없음</b>공개(10월 10일) 이후 이 사안의 확률은 바뀌지 않았습니다.</p>';
  const SN = {}; H.scen.forEach(s => SN[s.id] = s.name);
  const ds = Object.keys(x.next).filter(k => x.prev[k] !== x.next[k]).sort((p, q) => Math.abs(x.next[q] - x.prev[q]) - Math.abs(x.next[p] - x.prev[p]));
  const a = hsCountP(H, G, x.prev), b = hsCountP(H, G, x.next);
  return '<p class="lb-why"><b>' + kd(x.d) + ' 변경</b><span class="lb-why-c">' + ds.slice(0, 2).map(k => '<span class="lb-why-k">' + esc(SN[k] || k) + " " + x.prev[k] + "→" + x.next[k] + "%</span>").join("") + (ds.length > 2 ? '<span class="lb-why-k">외 ' + (ds.length - 2) + "개</span>" : "") + "</span>" +
    '<span class="lb-why-n"><span class="lb-why-k">악화 이상 ' + (a.big + a.worse) + "→" + (b.big + b.worse) + '번</span><span class="lb-why-k">개선됨 ' + a.better + "→" + b.better + "번</span></span></p>";
}
function lbStats(n, dl){  /* v3.94g: 3개 색 분류는 0번이어도 늘 보이고(0번은 맨 뒤), 최근 7일 증감도 0까지 모두 보인다 */
  const ks = ["big", "worse", "better"].filter(k => n[k]).concat(n.same ? ["same"] : [], ["big", "worse", "better"].filter(k => !n[k]), n.same ? [] : ["same"]);  /* v3.96e: 현재와 비슷함도 0번이면 맨 뒤에 0으로(4개 분류 늘 표시) */
  return '<ul class="lb-st' + (ks.length > 3 ? " lb-st4" : "") + '">' + ks.map(k => { const d = dl ? (dl[k] || 0) : 0;
    const cls = !d ? "z" : k === "same" ? "n" : ((d > 0) === (k === "better") ? "good" : "bad");
    return '<li class="lb-st-' + k + (n[k] ? "" : " lb-st-zero") + '"><b>' + (n[k] || 0) + '</b><span><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + "</span>" +
      '<em class="lb-dl lb-dl-' + cls + '" title="최근 7일 변화">' + (d ? (d > 0 ? "▲" : "▼") + Math.abs(d) : "0") + "</em></li>"; }).join("") + '<li class="lb-dl-note">▲▼ 최근 7일 변화</li>' + "</ul>";
}
function lbMix(H, G){  /* v3.92c 점 100개의 구성: 분류마다 그 분류에 드는 전개와 확률 */
  return '<div class="lb-mix"><ul>' +  /* v3.94f: 제목 '점 100개의 구성' 삭제(위 '2030년까지 100번의 미래'와 색 이름으로 이어짐) */ ["big", "worse", "better", "same"].map(k => {
    const ss = H.scen.filter(s => G.cls[s.id] === k && s.p > 0).sort((x, y) => y.p - x.p); if (!ss.length) return "";
    const sh = ss.slice(0, 3), more = ss.length - sh.length;
    return '<li><span class="lb-mk"><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + '</span><span class="lb-ms">' + sh.map(s => esc(s.name) + " " + s.p + "%").join(" · ") + (more ? " 외 " + more + "개" : "") + "</span></li>";
  }).join("") + "</ul></div>";
}
function lbDetail(H, G, sid, lab){  /* v3.92c 가장 나쁜(좋은) 경우의 4개 차원: 원래 단위와 점수 변화 */
  const S = H.scen.find(s => s.id === sid); if (!S) return "";
  const rows = HS_CAT.map(([k, nm]) => { const v = G.cat[k]; if (!v || v.na) return ""; const to = v.by[sid], d = to - v.now; if (Math.abs(d) <= 1) return "";
    const raw = k === "정치" ? (d < 0 ? "국가 폭력 늘어남" : "국가 폭력 줄어듦") : ((v.by_raw || {})[sid] || "");
    return '<li><span class="lb-dk">' + nm + '</span><span class="lb-dv">' + esc(raw) + '</span><span class="lb-dp">' + Math.round(v.now) + "→" + Math.round(to) + "점</span></li>"; }).join("");
  /* v3.94c: 예상 경보는 카드에 쓰지 않는다(현재 켜진 경보만 카드 머리에). 제목은 '~가 오면', 점수 칸에 '현재→이 경우' 머리말 */
  return '<div class="lb-det"><p class="lb-lab">' + lab + '가 오면 · <b>' + esc(S.name) + "</b> (확률 " + S.p + '%)<span class="lb-col">점수 현재→이 경우</span></p>' + (rows ? '<ul>' + rows + "</ul>" : "") + "</div>";
}
function lbBrief(H, G, sid, lab){  /* 가장 나쁜 경우를 자세히 보인 카드에서는 가장 좋은 경우를 한 줄로 */
  const S = H.scen.find(s => s.id === sid); if (!S) return "";
  const f = HS_CAT.map(([k, nm]) => { const v = G.cat[k]; if (!v || v.na) return ""; const d = v.by[sid] - v.now; if (Math.abs(d) <= 1) return ""; return nm + " " + Math.round(v.now) + "→" + Math.round(v.by[sid]) + "점"; }).filter(Boolean);
  return '<div class="lb-det lb-det-b"><p class="lb-lab">' + lab + '가 오면 · <b>' + esc(S.name) + "</b> (확률 " + S.p + '%)' + (f.length ? '<span class="lb-col">점수 현재→이 경우</span></p><p class="lb-ws">' + esc(f.join(" · ")) + "</p>" : "</p>") + "</div>";
}
function lbExplain(H, G){
  const ws = hsWorstSc(G), bs = hsBestSc(G), bad = ws && (G.cls[ws] === "worse" || G.cls[ws] === "big"), good = bs && G.cls[bs] === "better";
  if (!bad && !good) return '<p class="lb-flatline">' + esc(firstSent(G.line)) + "</p>";
  return lbMix(H, G) + (bad ? lbDetail(H, G, ws, "가장 나쁜 경우") : "") + (good ? (bad ? lbBrief(H, G, bs, "가장 좋은 경우") : lbDetail(H, G, bs, "가장 좋은 경우")) : "");
}
function lifeRow(c){
  const H = c.hs7, G = lifePick(c), nm = c.title.split(":")[0];
  if (!G) return "";
  const n = hsCount(H, G, "p"), rec = lbRecent(c.id, 3), today = BR.issues[0].date;
  const head = '<header class="lb-hd"><span class="lb-case">' + esc(nm) + '</span><b class="lb-gname">' + esc(G.name) + '</b><span class="lb-size">' + esc(G.size) + '</span>' + (G.al_now && G.al_now.length ? '<span class="lb-alnow">현재 경보 · ' + esc(G.al_now.join("·")) + "</span>" : "") + '<button type="button" class="lb-more" data-hs="' + esc(c.id) + '">삶에 미치는 영향 자세히 <span aria-hidden="true">→</span></button></header>';
  const recent = lbRecentHtml(rec, today);
  /* v3.92c: 왼쪽 칸 = 점 그림·횟수와 그 설명, 오른쪽 칸 = 선 그래프와 최근 정보. 두 칸은 세로선으로 나눈다. 100번 모두 현재와 비슷한 집단도 같은 모양으로 그린다 */
  return '<article class="lb-card" id="lb-' + esc(c.id) + '">' + head + '<div class="lb-cols">' +
    '<div class="lb-left"><p class="lb-lab lb-fut">2030년까지 100번의 미래</p><div class="lb-top"><button type="button" class="lb-dots" data-hs="' + esc(c.id) + '" aria-label="' + esc(nm + " · " + G.name + " · 삶에 미치는 영향 자세히 보기") + '">' + hsDots(n) + "</button>" + lbStats(n, lbDelta(c, G)) + "</div>" + lbExplain(H, G) + "</div>" +
    '<div class="lb-right">' + lbTrend(c, G, null, {tag: "lb|" + c.id}) + lbWhy(c, G) + '<div class="lb-rcw"><p class="lb-lab">최근 정보</p>' + recent + "</div></div></div></article>";
}
/* v3.99 시안(2026-10-12 제안): 국민의 삶도 산업별 미래처럼 국민(집단)마다 한 줄. 왼쪽에 5개 사안 종합, 오른쪽에 사안별 점 그래프와 그 아래 점 개수 추이.
   점 그래프를 누르면 그 사안의 판단 근거(점 100개의 구성, 가장 나쁜·좋은 경우), 추이를 누르면 선 그래프와 최근 변경·최근 정보 */
let LBX = null, LBXM = "d";
const LIFE_EU_ORD = ["WCEU", "SEU", "NEU", "DEU", "NORD", "BALT"];
function lbxGroups(){  /* [[행 키, 이름, 크기, 경보, [[사안, 집단]…]]…] */
  const cs = (D.strategies || []).filter(c => c.hs7);
  if (LIFE === "main") return [["main", "당사국 국민", "", [], cs.flatMap(c => [[c, c.hs7.groups.find(g => g.k === LIFE_MAIN[c.id]) || lifeMain(c)]].concat(LIFE_MAIN2[c.id] && c.hs7.groups.some(g => g.k === LIFE_MAIN2[c.id]) ? [[c, c.hs7.groups.find(g => g.k === LIFE_MAIN2[c.id])]] : []))]];
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
  const all = full ? dotCell('data-lbx="' + esc(rk + "|all") + '"', "5개 사안 종합", cmbCount(ak, BR.issues[0].date), cmbDelta(ak), oa && LBXM !== "t", oa && LBXM === "t", cmbLine(ak, name, HS_LAB), "ind-allc") : "";
  const op = LBX && LBX.split("|")[0] === rk ? LBX.split("|")[1] : null, oc = op && op !== "all" ? pr.find(x => lpid(x[0], x[1]) === op) : null;
  const det = oa ? (LBXM === "t" ? lbxAllTrend(rk, name) : cmbDetail("5개 사안 종합 · " + esc(name), cmbCount(ak, BR.issues[0].date), "life", rk, HS_LAB)) : oc ? (LBXM === "t" ? lbxTrend(oc[0], oc[1]) : lbxDetail(oc[0], oc[1])) : "";
  return '<article class="lb-card ind-card lbx-card' + (full ? "" : " lbx-noall") + (rk === "main" ? " lbx-main" : "") + '" id="lbx-' + esc(rk) + '"><header class="lb-hd"><b class="lb-gname">' + esc(name) + "</b>" + (size ? '<span class="lb-size">' + esc(size) + "</span>" : "") +
    (al.length ? '<span class="lb-alnow">현재 경보 · ' + esc(al.join("·")) + "</span>" : "") + (rk === "main" ? '<span class="ind-mem">사안마다 직접 당사국의 국민(러-우 전쟁은 교전 양쪽)</span>' + oneMain(pr) : full ? oneLife(name, cmbCount(ak, BR.issues[0].date)) : "") + "</header>" +
    (full ? '<div class="ind-all">' + all + "</div>" : "") + '<div class="ind-cw">' + (full ? '<p class="ind-capr">사안별 100번의 미래</p>' : "") + '<div class="ind-cells">' + cells + "</div></div>" + det + "</article>";
}
function lbxDetail(c, G){
  const nm = c.title.split(":")[0];
  return '<div class="ind-det lbx-det"><p class="lb-lab">' + esc(nm) + " · " + esc(G.name) + '<button type="button" class="lb-more" data-hs="' + esc(c.id) + '" data-hsg="' + esc(G.k) + '">삶에 미치는 영향 자세히 <span aria-hidden="true">→</span></button></p>' + lbExplain(c.hs7, G) + "</div>";
}
function lbxTrend(c, G){
  const nm = c.title.split(":")[0];
  return '<div class="ind-det ind-det-t"><p class="lb-lab">' + esc(nm) + " · " + esc(G.name) + "</p>" + lbTrend(c, G, null, {tag: "lbg|" + c.id + "|" + G.k, w: 680, h: 220}) +
    '<div class="ind-tr">' + indWhy(c, G, HS_LAB, esc(G.name) + "의 점 개수") + '<div class="lb-rcw"><p class="lb-lab">최근 정보</p>' + lbRecentHtml(lbRecent(c.id, 3), BR.issues[0].date) + "</div></div></div>";
}
function lbxAllTrend(rk, name){
  return '<div class="ind-det ind-det-t"><p class="lb-lab">5개 사안 종합 · ' + esc(name) + "</p>" + cmbTrend("life|" + rk, name, null, {tag: "cmb|life|" + rk, w: 680, h: 220}) +
    '<div class="ind-tr">' + cmbWhy("life|" + rk, HS_LAB) + '<div class="lb-rcw"><p class="lb-lab">최근 정보</p>' + lbRecentHtml(cmbRecent(3), BR.issues[0].date) + "</div></div></div>";
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
const IND_LAB = {big: "크게 악화됨", worse: "악화됨", better: "개선됨", same: "현 추세와 비슷함"};
const IND_SHORT = {korea: "한반도", taiwan: "대만해협", ukraine: "러-우 전쟁", iran: "이란·호르무즈", poland: "러시아-NATO"};
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
function cmbCh(){ const ds = [...new Set(cmbCases().flatMap(s => (s.hs7.changes || []).map(x => x.d)))].sort(); return ds.map(d => ({d, prev: ymdAdd(d, -1), next: d, kind: "확률 조정"})); }
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
  if (!x) return '<div class="ind-why ind-why0"><p class="iw-h"><b>최근 변경 없음</b></p></div>';
  const a = cmbCount(key, x.prev), b = cmbCount(key, x.next), ks0 = ["big", "worse", "better"].filter(k => a[k] || b[k]), ks = ks0.length ? ks0 : ["same"];
  const row = (l, u, v) => '<li><span class="iw-k">' + l + '</span><span class="iw-v">' + u + '<i>→</i>' + v + "</span></li>";
  const cs = cmbCases().filter(s => (s.hs7.changes || []).some(z => z.d === x.d));
  return '<div class="ind-why"><p class="iw-h"><b>' + kd(x.d) + ' 변경</b></p>' +
    cs.map(s => { const z = (s.hs7.changes || []).filter(q => q.d === x.d).pop(); if (!z) return ""; const SN = {}; s.hs7.scen.forEach(q => SN[q.id] = q.name);
      const ds = Object.keys(z.next).filter(q => z.prev[q] !== z.next[q]).sort((p, q) => Math.abs(z.next[q] - z.prev[q]) - Math.abs(z.next[p] - z.prev[p]));
      return '<div class="iw-s"><p class="iw-t">' + esc(LB_SHORT[s.id] || s.title.split(":")[0]) + " 전개 확률</p><ul>" + ds.map(q => row(esc(SN[q] || q), z.prev[q] + "%", z.next[q] + "%")).join("") + "</ul></div>"; }).join("") +
    '<div class="iw-s"><p class="iw-t">5개 사안 종합의 점 개수</p><ul>' + ks.map(k => row('<i class="iw-c" style="background:' + HS_COL[k] + '"></i>' + LAB[k], a[k] + "번", b[k] + "번")).join("") + "</ul></div></div>";
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
function indDetail(I, c){
  const v = IND.cells[I.k][c.id], T = {base: "기준", shock: "사건이 난 해부터 3년 평균", state: "2030년 수준"};
  return '<div class="ind-det"><p class="lb-lab">' + esc(c.title) + " · " + esc(I.name) + (c.id === "iran" ? ' <span class="note">이 사안은 전쟁이 지속되는 경우를 기준으로 합니다.</span>' : "") + '</p><ul>' +
    c.scen.slice().sort((a, b) => b.p - a.p).map(s => { const z = v[s.id];
      return '<li><span class="ind-sn">' + esc(s.name) + ' <span class="mono">' + s.p + '%</span></span><span class="ind-c" style="--c:' + HS_COL[z.c] + '">' + (s.t === "base" ? "기준 경로" : IND_LAB[z.c] + " " + indPct(z.x)) + '</span>' +
        (s.t === "base" ? '<span class="ind-w note">사안이 현재 상태로 이어질 때. 다른 전개는 이 경우와 비교합니다.</span>' : '<span class="ind-w">' + (z.w ? esc(z.w) + " " : "") + '<span class="note">매출 ' + indPct(z.r / 100) + ", 이익률 " + (z.dm >= 0 ? "+" : "−") + Math.abs(z.dm) + "%p · 구간 " + indPct(z.lo) + "~" + indPct(z.hi) + " · " + T[s.t] + "</span></span>") + "</li>"; }).join("") + "</ul></div>";
}
function indWhy(cs, G, LAB, lab2){ LAB = LAB || IND_LAB;  /* v3.98: 선 그래프 오른쪽 상자. 가장 최근 확률 변경의 까닭, 바뀐 전개 확률, 이 업종의 점 개수 변화 */
  const H = cs.hs7, ch = (H.changes || []).slice().sort((a, b) => a.d.localeCompare(b.d)), x = ch[ch.length - 1];
  if (!x) return '<div class="ind-why ind-why0"><p class="iw-h"><b>최근 변경 없음</b></p><p class="iw-r">공개(10월 10일) 이후 이 사안의 확률은 바뀌지 않았습니다.</p></div>';
  const SN = {}; H.scen.forEach(s => SN[s.id] = s.name);
  const ds = Object.keys(x.next).filter(k => x.prev[k] !== x.next[k]).sort((p, q) => Math.abs(x.next[q] - x.prev[q]) - Math.abs(x.next[p] - x.prev[p]));
  const a = hsCountP(H, G, x.prev), b = hsCountP(H, G, x.next), ks0 = ["big", "worse", "better"].filter(k => a[k] || b[k]), ks = ks0.length ? ks0 : ["same"];
  const row = (l, u, v) => '<li><span class="iw-k">' + l + '</span><span class="iw-v">' + u + '<i>→</i>' + v + "</span></li>";
  return '<div class="ind-why"><p class="iw-h"><b>' + kd(x.d) + ' 변경</b></p>' + (x.why ? '<p class="iw-r">' + esc(x.why) + "</p>" : "") +
    '<div class="iw-s"><p class="iw-t">전개 확률</p><ul>' + ds.map(k => row(esc(SN[k] || k), x.prev[k] + "%", x.next[k] + "%")).join("") + "</ul></div>" +
    '<div class="iw-s"><p class="iw-t">' + (lab2 || "이 산업의 점 개수") + '</p><ul>' + ks.map(k => row('<i class="iw-c" style="background:' + HS_COL[k] + '"></i>' + LAB[k], a[k] + "번", b[k] + "번")).join("") + "</ul></div></div>";
}
const IND_NARROW = typeof matchMedia === "function" ? matchMedia("(max-width:699px)") : null;
function indTrendPanel(I, c){  /* v3.98: 칸 아래쪽(작은 추이선)을 누르면 펼치는 선 그래프 상세. 위 = 선 그래프(전체 폭), 아래 왼쪽 = 최근 변경, 아래 오른쪽 = 최근 정보 */
  const cs = indCase(c), G = indG(I, c); if (!cs) return "";
  const opt = IND_NARROW && IND_NARROW.matches ? {w: 340, h: 196} : {w: 680, h: 220};
  opt.tag = "ind|" + I.k + "|" + c.id;
  return '<div class="ind-det ind-det-t"><p class="lb-lab">' + esc(c.title) + " · " + esc(I.name) + '</p>' + lbTrend(cs, G, IND_LAB, opt) +
    '<div class="ind-tr">' + indWhy(cs, G) + '<div class="lb-rcw"><p class="lb-lab">최근 정보</p>' + lbRecentHtml(lbRecent(cs.id, 3), BR.issues[0].date) + "</div></div></div>";
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
  const dv = k => dl && dl[k] ? '<i class="ind-d ' + ((dl[k] > 0) === (k === "better") ? "good" : "bad") + '" title="최근 7일 변화">' + (dl[k] > 0 ? "▲" : "▼") + Math.abs(dl[k]) + "</i>" : "";
  return '<div class="ind-cell' + (oD || oT ? " on" : "") + (cls ? " " + cls : "") + '"><button type="button" class="ind-cb' + (oD ? " on" : "") + '" ' + at + ' title="누르면 판단의 근거" aria-expanded="' + !!oD + '"><span class="ind-cn">' + name + "</span>" + hsDots(n) +
    '<span class="ind-ct">' + (bad || good ? (n.big ? '<b class="ind-big">크게 악화 ' + n.big + dv("big") + "</b>" : "") + (n.worse ? '<b class="ind-bad">악화 ' + n.worse + dv("worse") + "</b>" : "") + (good ? '<b class="ind-good">개선 ' + good + dv("better") + "</b>" : "") : '<span class="note">변화 없음</span>') + "</span></button>" +
    (spark ? '<button type="button" class="ind-tb' + (oT ? " on" : "") + '" ' + at + ' ' + k0 + 'm="t" title="누르면 선 그래프와 변경 내용" aria-expanded="' + !!oT + '"><span class="ind-tl">점 개수 추이</span>' + spark + "</button>" : "") + "</div>";
}
function cmbDelta(key){ const t = BR.issues[0].date, a = cmbCount(key, ymdAdd(t, -7)), b = cmbCount(key, t), o = {}; HS_ORD.forEach(k => o[k] = b[k] - a[k]); return o; }
const CMB_NOTE = {  /* v3.99: 종합 그래프의 계산 설명(짧게) */
  ind: "종합은 5개 사안이 함께 전개되는 미래 100번에서, 사안별로 판단한 이익 변화를 합쳐 현 추세와 비교한 결과입니다. 한 사안의 손실을 다른 사안의 이득이 메우기도 합니다. 다만 두 사안의 효과가 같은 경로(예: 같은 유럽 방산 조달)를 거치면 영향이 큰 수치 하나만 반영합니다. 공장의 생산 능력 한계는 반영하지 않았습니다. 사안 사이의 연관은 국제 질서 탭의 세계 시나리오로 반영했습니다.",
  life: "종합은 5개 사안이 함께 전개되는 미래 100번에서, 사안별로 판단한 4개 범주 점수의 변화를 합쳐 현재와 비교한 결과입니다. 사안 사이의 연관은 국제 질서 탭의 세계 시나리오로 반영했습니다."};
function cmbDetail(title, n, kind, key, LAB){  /* 종합 점 그래프를 누르면: 국민의 삶 카드와 같은 형식의 근거, 짧은 계산 설명, 국제 질서 흐름별 점 개수 */
  return '<div class="ind-det lbx-det cmb-det"><p class="lb-lab">' + title + "</p>" + cmbExplain(kind, key, LAB) +
    '<p class="cmb-m1">' + CMB_NOTE[kind] + "</p>" +
    '<details class="cmb-wd"><summary>국제 질서의 흐름에 따라 달라지는 100번의 미래</summary><div class="cmb-l">' + n.w.map(w => '<div class="cmb-w"><p class="cmb-c">' + esc(w.name) + ' <span class="mono">' + w.p + '%</span></p><div class="cmb-b">' + hsDots(w) + '<span class="cmb-n">' + lifeNums(w, "<br>") + "</span></div></div>").join("") + "</div></details></div>";
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
    return '<li><span class="lb-mk"><i style="background:' + HS_COL[c] + '"></i>' + LAB[c] + '</span><span class="lb-ms">' + (top.length ? top.map(([key, p]) => esc(nm(key)) + " " + Math.round(p * 100) + "번").join(" · ") : "여러 사안의 작은 변화가 겹친 경우") + "</span></li>"; }).join("");
  const pick = c => L.filter(o => o.c === c).sort((a, b) => b.p - a.p)[0];
  const wc = pick("big") ? "big" : pick("worse") ? "worse" : null, w = wc && pick(wc), b = pick("better");
  const CN = ["개인", "공동체", "정치", "경제"].map(k => (HS_CAT.find(c => c[0] === k) || [k, k])[1]);
  const det = (o, lab) => { if (!o) return ""; const sc = o.sids.map((sid, i) => [cs[i], sid]).filter(([s, sid]) => sign(s, sid));
    const rows = kind === "ind" ? sc.map(([s, sid]) => '<li><span class="lb-dk">' + esc(LB_SHORT[s.id]) + '</span><span class="lb-dv">' + esc(SN[s.id + "|" + sid]) + '</span><span class="lb-dp">' + indPct(val(s, sid)[0]) + "</span></li>").join("") + (Math.abs(o.raw - o.v[0]) > 0.0005 ? '<li><span class="lb-dk">겹침 조정</span><span class="lb-dv">같은 경로는 영향이 큰 수치만 반영</span><span class="lb-dp">' + indPct(o.v[0] - o.raw) + "</span></li>" : "") + '<li class="cmb-sum"><span class="lb-dk">합계</span><span class="lb-dv"></span><span class="lb-dp">' + indPct(o.v[0]) + "</span></li>"
      : CN.map((nm, j) => { const to = Math.max(0, Math.min(100, now[j] + o.v[j])); return Math.abs(o.v[j]) > 1 ? '<li><span class="lb-dk">' + nm + '</span><span class="lb-dv"></span><span class="lb-dp">' + Math.round(now[j]) + "→" + Math.round(to) + "점</span></li>" : ""; }).join("");
    return '<div class="lb-det"><p class="lb-lab">' + lab + " · <b>" + sc.map(([s, sid]) => esc(nm(s.id + "|" + sid))).join(" + ") + "</b> (" + (o.p < 0.005 ? "확률 1% 미만" : "확률 " + Math.round(o.p * 100) + "%") + ")" + '<span class="lb-col">' + (kind === "ind" ? "현 추세 대비 이익" : "점수 현재→이 경우") + "</span></p><ul>" + rows + "</ul></div>"; };
  return '<div class="lb-mix"><ul>' + mix + "</ul></div>" + (w ? det(w, "가장 흔한 나쁜 경우가 오면") : "") + (b ? det(b, "가장 흔한 좋은 경우가 오면") : "");
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
  return '<article class="lb-card ind2" id="ind-' + esc(I.k) + '"><header class="lb-hd"><b class="lb-gname">' + esc(I.name) + '</b><span class="lb-size">정상 영업이익률 ' + (I.m * 100).toFixed(1) + "%" + (I.floor ? "(하한)" : "") + '</span><span class="ind-mem">' + esc(I.mem.join(", ")) + "</span></header>" +
    '<p class="one one-k">' + indKeys(I) + "</p>" + indStrip(I) + "</article>";
}
function indRow(I){
  const ns = IND.cases.map((c, i) => [c, indCount(I.k, c), i]);
  ns.sort((x, y) => ((y[1].big + y[1].worse + y[1].better) - (x[1].big + x[1].worse + x[1].better)) || ((y[1].big + y[1].worse) - (x[1].big + x[1].worse)) || (x[2] - y[2]));  /* v3.94f: 업종마다 색 점이 많은 분쟁부터 */
  const cells = ns.map(([c, n]) => { const bad = n.big + n.worse, good = n.better, open = INDOPEN === I.k + "|" + c.id, oD = open && INDMODE !== "t", oT = open && INDMODE === "t", cs = indCase(c), G = indG(I, c), dl = cs ? indDelta(cs, G) : {};
    const dv = k => dl[k] ? '<i class="ind-d ' + ((dl[k] > 0) === (k === "better") ? "good" : "bad") + '" title="최근 7일 변화">' + (dl[k] > 0 ? "▲" : "▼") + Math.abs(dl[k]) + "</i>" : "";
    return '<div class="ind-cell' + (open ? " on" : "") + '"><button type="button" class="ind-cb' + (oD ? " on" : "") + '" data-ind="' + esc(I.k + "|" + c.id) + '" aria-expanded="' + oD + '"><span class="ind-cn">' + esc(IND_SHORT[c.id] || c.title) + "</span>" + hsDots(n) +
      '<span class="ind-ct">' + (bad || good ? (n.big ? '<b class="ind-big">크게 악화 ' + n.big + dv("big") + "</b>" : "") + (n.worse ? '<b class="ind-bad">악화 ' + n.worse + dv("worse") + "</b>" : "") + (good ? '<b class="ind-good">개선 ' + good + dv("better") + "</b>" : "") : '<span class="note">변화 없음</span>') + "</span></button>" + (cs ? '<button type="button" class="ind-tb' + (oT ? " on" : "") + '" data-ind="' + esc(I.k + "|" + c.id) + '" data-indm="t" aria-expanded="' + oT + '"><span class="ind-tl">점 개수 추이</span>' + indSpark(indSer(cs, G)) + "</button>" : "") + "</div>"; }).join("");  /* v3.94g: 크게 악화를 따로, 한 줄에 하나씩 */
  const op = INDOPEN && INDOPEN.split("|")[0] === I.k ? IND.cases.find(c => c.id === INDOPEN.split("|")[1]) : null, oa = INDOPEN === I.k + "|all", ak = "ind|" + I.k;
  const opd = op ? (INDMODE === "t" ? indTrendPanel(I, op) : indDetail(I, op)) : oa ? (INDMODE === "t" ? indAllTrend(I) : cmbDetail("5개 사안 종합 · " + esc(I.name), cmbCount(ak, BR.issues[0].date), "ind", I.k, IND_LAB)) : "";
  const all = dotCell('data-ind="' + esc(I.k + "|all") + '"', "5개 사안 종합", cmbCount(ak, BR.issues[0].date), cmbDelta(ak), oa && INDMODE !== "t", oa && INDMODE === "t", cmbLine(ak, I.name, IND_LAB), "ind-allc");
  return '<article class="lb-card ind-card" id="ind-' + esc(I.k) + '"><header class="lb-hd"><b class="lb-gname">' + esc(I.name) + '</b><span class="lb-size">정상 영업이익률 ' + (I.m * 100).toFixed(1) + "%" + (I.floor ? "(하한)" : "") + '</span><span class="ind-mem">' + esc(I.mem.join(", ")) + "</span>" + oneInd(I.name, cmbCount(ak, BR.issues[0].date), I) + "</header>" +
    '<div class="ind-all">' + all + '</div><div class="ind-cw"><p class="ind-capr">사안별 100번의 미래</p><div class="ind-cells">' + cells + "</div></div>" + opd + "</article>";
}
function indAllTrend(I){
  const opt = IND_NARROW && IND_NARROW.matches ? {w: 340, h: 196} : {w: 680, h: 230}; opt.tag = "cmb|ind|" + I.k;
  return '<div class="ind-det ind-det-t"><p class="lb-lab">5개 사안 종합 · ' + esc(I.name) + "</p>" + cmbTrend("ind|" + I.k, I.name, IND_LAB, opt) +
    '<div class="ind-tr">' + cmbWhy("ind|" + I.k, IND_LAB) + '<div class="lb-rcw"><p class="lb-lab">최근 정보</p>' + lbRecentHtml(cmbRecent(3), BR.issues[0].date) + "</div></div></div>";
}
/* v3.99c 휴대전화(699px 이하) 전용 구조: 목록 → 펼침 → 상세가 누른 줄 바로 아래.
   1) 산업(국민)마다 한 줄: 이름, 5개 사안 종합의 작은 점 그림과 개수. 누르면 그 자리에서 펼침
   2) 펼치면 종합의 점 그래프와 선 그래프를 크게, 그 아래 사안별 줄(작은 점 그림·개수·추이선)
   3) 사안 줄이나 종합 그래프를 누르면 상세가 바로 그 아래에 열림(화면 아래로 밀려나지 않게) */
let MIOPEN = undefined, MLOPEN = undefined;
const isMob = () => !!(IND_NARROW && IND_NARROW.matches);
const M_LAB = {big: "크게 악화", worse: "악화", better: "개선"};
function mNums(n, dl){
  const dv = k => dl && dl[k] ? ' <i class="ind-d ' + ((dl[k] > 0) === (k === "better") ? "good" : "bad") + '">' + (dl[k] > 0 ? "▲" : "▼") + Math.abs(dl[k]) + "</i>" : "";
  const t = ["big", "worse", "better"].filter(k => n[k]).map(k => '<b class="m-' + k + '">' + M_LAB[k] + " " + n[k] + dv(k) + "</b>").join("");
  return t || '<span class="note">변화 없음</span>';
}
function mCaseRow(at, open, mode, name, sub, n, dl, spark, det){  /* 사안 한 줄: 왼쪽(점·이름·개수)은 판단 근거, 오른쪽(추이선)은 선 그래프 */
  const k0 = at.split("=")[0], oD = open && mode !== "t", oT = open && mode === "t";
  return '<div class="mc' + (open ? " on" : "") + '"><div class="mc-r"><button type="button" class="mc-a' + (oD ? " on" : "") + '" ' + at + ' aria-expanded="' + oD + '">' + hsDots(n) +
    '<span class="mc-t"><span class="mc-n">' + name + (sub ? "<small>" + sub + "</small>" : "") + '</span><span class="mc-c">' + mNums(n, dl) + "</span></span></button>" +
    (spark ? '<button type="button" class="mc-s' + (oT ? " on" : "") + '" ' + at + " " + k0 + 'm="t" aria-expanded="' + oT + '">' + spark + '<span class="mc-sl">추이 ›</span></button>' : "") + "</div>" + (open ? det : "") + "</div>";
}
function mAll(at, open, mode, n, dl, line, det){  /* 펼친 줄의 맨 위: 종합 점 그래프와 선 그래프 */
  const k0 = at.split("=")[0], oD = open && mode !== "t", oT = open && mode === "t";
  return '<div class="ma' + (open ? " on" : "") + '"><p class="ma-h">5개 사안 종합</p><button type="button" class="ma-d' + (oD ? " on" : "") + '" ' + at + ' aria-expanded="' + oD + '">' + hsDots(n) +
    '<span class="ma-c">' + mNums(n, dl) + '<span class="ma-more">판단 근거 ›</span></span></button>' +
    '<button type="button" class="ma-l' + (oT ? " on" : "") + '" ' + at + " " + k0 + 'm="t" aria-expanded="' + oT + '"><span class="ma-lh">점 개수 추이 ›</span>' + line + "</button>" + (open ? det : "") + "</div>";
}
function mLine(key, name, LAB){  /* 휴대전화: 종합 선 그래프를 화면 폭에 맞춰 그려 글자가 사안별 선 그래프와 같은 크기로 보이게 */
  const w = Math.max(240, Math.min(600, (innerWidth || 390) - 84)); return cmbTrend(key, name, LAB, {bare: true, w, h: Math.round(Math.min(200, Math.max(160, w * 0.55)))}); }
function mChips(list, attr, cur){  /* 휴대전화: 펼치기 전에 무엇이 있는지 보이는 칩 목록. 칩 아래 막대는 종합의 크게 악화·악화·개선 점 개수(100개 중) */
  return '<nav class="mchips" id="mchips" aria-label="바로 가기">' + list.map(([k, nm, n]) => '<button type="button" class="mch' + (k === cur ? " on" : "") + '" ' + attr + '="' + esc(k) + '" aria-pressed="' + (k === cur) + '"><span class="mch-n">' + esc(nm) + "</span>" +
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
      body = '<div class="mi-b">' + oneInd(I.name, n, I) + mAll('data-ind="' + esc(I.k + "|all") + '"', oa, INDMODE, n, cmbDelta(ak), mLine(ak, I.name, IND_LAB), oa ? (INDMODE === "t" ? indAllTrend(I) : cmbDetail("5개 사안 종합 · " + esc(I.name), n, "ind", I.k, IND_LAB)) : "") +
        '<p class="ind-capr">사안별 100번의 미래</p>' + ns.map(([c, nc]) => { const id = I.k + "|" + c.id, op = INDOPEN === id, cs = indCase(c), G = indG(I, c);
          return mCaseRow('data-ind="' + esc(id) + '"', op, INDMODE, esc(IND_SHORT[c.id] || c.title), "", nc, cs ? indDelta(cs, G) : null, cs ? indSpark(indSer(cs, G)) : "", op ? (INDMODE === "t" ? indTrendPanel(I, c) : indDetail(I, c)) : ""); }).join("") +
        '<p class="mi-mem">' + esc(I.mem.join(", ")) + " · 정상 영업이익률 " + (I.m * 100).toFixed(1) + "%</p></div>"; }
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
      body = '<div class="mi-b">' + (rk === "main" ? oneMain(pr) : full ? oneLife(name, n) : "") + (full ? mAll('data-lbx="' + esc(rk + "|all") + '"', oa, LBXM, n, cmbDelta(ak), mLine(ak, name, HS_LAB), oa ? (LBXM === "t" ? lbxAllTrend(rk, name) : cmbDetail("5개 사안 종합 · " + esc(name), n, "life", rk, HS_LAB)) : "") + '<p class="ind-capr">사안별 100번의 미래</p>' : "") +
        ord.map(([c, nc, , G]) => { const id = rk + "|" + lpid(c, G), op = LBX === id;
          return mCaseRow('data-lbx="' + esc(id) + '"', op, LBXM, esc(LB_SHORT[c.id] || c.title), rk === "main" ? esc(G.name) : "", nc, lbDelta(c, G), indSpark(indSer(c, G)), op ? (LBXM === "t" ? lbxTrend(c, G) : lbxDetail(c, G)) : ""); }).join("") +
        (size || al.length ? '<p class="mi-mem">' + esc(size) + (al.length ? (size ? " · " : "") + "현재 경보 " + esc(al.join("·")) : "") + "</p>" : "") + "</div>"; }
    const head = (full ? hsDots(n) : "") + '<span class="mi-t"><span class="mi-n">' + esc(name) + '</span><span class="mi-c">' + (full ? mNums(n) : '<span class="note">' + (rk === "main" ? "사안마다 직접 당사국의 국민(러-우 전쟁은 교전 양쪽)" : "") + "</span>") + "</span></span>";
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
  if (!IND) { el.innerHTML = '<div class="sec"><p class="note">산업별 미래를 불러오는 중입니다.</p></div>';
    fetch("/data/industry.json", {cache: "no-cache"}).then(r => r.ok ? r.json() : null).then(d => { if (d) { IND = d; renderIndustry(); } else el.innerHTML = '<div class="sec"><p class="note">산업별 미래를 불러오지 못했습니다.</p></div>'; }).catch(() => {}); return; }
  el.innerHTML = '<section class="lb ind" id="s-ind"><p class="eyebrow">산업별 미래 · ' + kd(IND.asof) + ' 기준</p><h2 class="lb-h">' + IND_TXT.h2 + '</h2>' +
    '<p class="lb-lead">' + IND_TXT.lead + '</p>' +
    '<div class="lb-ctl"><div class="lsel" role="group" aria-label="어느 나라 산업을 볼까">' + [["kr", "한국 산업"], ["us", "미국 산업"]].map(([k, l]) => '<button type="button" data-indc="' + k + '" aria-pressed="' + (k === INDC) + '">' + l + "</button>").join("") + "</div>" +
    '<p class="lb-leg">' + ["big", "worse", "better", "same"].map(k => '<span><i class="ist-' + k + '"></i>' + IND_LAB[k] + "</span>").join("") + "<span>" + IND_TXT.size + "</span><span>" + IND_TXT.band + "</span></p></div>" +
    '<div class="lb-board" id="indboard">' + indRows() + "</div>" +
    '<div class="ind-note"><p>' + IND_GRP.note + '</p><p><b>어떻게 판단했나요.</b> 산업마다 각 분쟁의 전개별로 2030년 산업 영업이익이 현 추세와 비교해 얼마나 달라지는지를 판단했습니다(매출 변화와 영업이익률 변화). 변화의 크기는 그 산업의 정상 영업이익(최근 10년 영업이익률 중앙값, 최소 3%)에 대한 비율로 계산합니다. +10% 넘게 늘면 개선됨, 10% 넘게 줄면 악화됨, 30% 넘게 줄거나 산업 전체가 적자가 되면 크게 악화됨입니다. 봉쇄·전쟁 같은 충격은 사건이 난 해부터 3년 평균, 정전·합의 같은 상태 변화는 2030년 수준으로 봅니다. 정상 영업이익률이 낮은 산업(방산 5.0%, 조선 3.0%)은 이익률이 조금만 변해도 변화율이 크게 나타나는 경향이 있습니다.</p>' +
    '<p><b>출처.</b> 실적은 금융감독원 전자공시(DART)와 미국 증권거래위원회(SEC) 원자료입니다. 영업이익을 공시하지 않는 미국 기업(금융업 전부, 통합 석유회사, 일부 농업·항공우주 기업)은 세전이익을 씁니다. 한국 금융업의 정상 영업이익률은 최근 3년 값입니다.</p>' +
    '<p class="note">이 탭은 분쟁이 산업 전체의 이익에 미칠 영향을 판단한 것이며, 개별 기업에 대한 투자를 권하지 않습니다.</p></div></section>'; fitTrends(el);
}
function lifeBoardHtml(x){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  const csn = id => LB_SHORT[id] || "기타";
  return '<section class="lb" id="s-life"><p class="eyebrow">국민의 삶 · ' + kd(x.date) + ' 기준</p><h2 class="lb-h">2030년까지 100번의 미래</h2>' +
    '<p class="lb-lead"><b>5개 분쟁은 2030년까지 당사국 국민의 삶을 어떻게 바꿀까요? 100번의 미래 가운데 분쟁 때문에 현재보다 나아지는 삶과 나빠지는 삶은 각각 몇 번일까요?</b> 사안마다 미래의 가능성을 점 100개로 보이며, 새로운 사건에 따라 그 가능성은 달라집니다. 분쟁이 주는 영향만 계산하고 경제 성장처럼 분쟁과 관계없는 변화는 넣지 않았습니다. 그래프를 누르면 판단의 상세한 근거가 열립니다. 점의 개수는 클리사 지오폴리틱스의 판단값으로 계산한 결과입니다.</p>' +
    '<div class="lb-ctl"><div class="lsel" role="group" aria-label="누구의 삶을 볼까">' + (LIFE_SEL.length > 1 ? LIFE_SEL : []).map(([k, l]) => '<button type="button" data-life="' + k + '" aria-pressed="' + (k === LIFE) + '">' + l + "</button>").join("") + "</div>" +
    '<p class="lb-leg">' + HS_ORD.map(k => '<span><i style="background:' + HS_COL[k] + '"></i>' + HS_LAB[k] + "</span>").join("") + '<span class="lb-leg-l"><i class="lg-bad"></i>주요 점 개수 추이</span><span class="lb-leg-l"><i class="lg-tick"></i>한 줄 정보</span><span class="lb-leg-l"><b class="lg-pv">22</b>변경 직전 점 개수</span></p></div>' +
    '<div class="lb-board" id="lifeboard">' + lifeRows() + "</div>" +
    '<p class="lb-note">크게 악화됨: 한 범주라도 20점 넘게 떨어지거나 두 범주가 10점 넘게 떨어지는 경우. 일자별 변화의 10월 9일 값은 그날의 확률에 현재 분류를 적용한 값입니다(그래프는 10월 10일 공개).</p></section>' +
    '<p class="lb-tobr"><button type="button" class="chip" data-go="overview" data-bgo="1">이 그래프를 움직인 정보 · 정세 브리핑 보기 →</button></p>';
}
function lifeStripHtml(x){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  return '<div class="lm-row" aria-label="사람들의 삶 · 2030년까지 100번의 미래">' + cs.map(c => { const G = lifeMain(c), n = hsCount(c.hs7, G, "p"), k = x.items.filter(i => i.case === c.id).length;
    return '<button type="button" class="lm" data-hs="' + esc(c.id) + '"><span class="lm-c">' + esc(c.title.split(":")[0]) + '</span><span class="lm-g">' + esc(G.name) + "</span>" + hsDots(n) + '<span class="lm-n">' + lifeNums(n, "<br>") + "</span>" + (k ? '<span class="lm-t">오늘 브리핑 ' + k + "건</span>" : "") + "</button>"; }).join("") + "</div>";
}
function lifeItemHtml(id){
  const c = (D.strategies || []).find(k => k.id === id); if (!c || !c.hs7) return "";
  const G = lifeMain(c), n = hsCount(c.hs7, G, "p");
  return '<button type="button" class="bi-life" data-hs="' + esc(id) + '">' + hsDots(n) + "<span><b>" + esc(G.name) + "의 2030년까지 100번의 미래</b><br>" + lifeNums(n) + " · 삶에 미치는 영향 자세히 →</span></button>";
}
function lifeHeroHtml(){
  const cs = (D.strategies || []).filter(c => c.hs7); if (!cs.length) return "";
  return '<section class="sec" id="s-life"><h3>사람들의 삶 · 2030년까지 100번의 미래</h3><p class="note">5개 사안에서 한 집단씩 골라, 2030년까지 일어날 수 있는 미래 100번 가운데 삶이 나아지거나 나빠지는 횟수를 점으로 보여 줍니다. 확률과 분류는 판단값이며, 계산 방법은 각 사안 분석의 \'이 사안이 사람들의 삶에 미치는 영향\'에 있습니다.</p><div class="lh-grid">' +
    cs.map(c => { const H = c.hs7, G = H.groups.find(g => !g.fold) || H.groups[0], n = hsCount(H, G, "p"), nm = c.title.split(":")[0];
      return '<article class="lh-card"><p class="lh-case">' + esc(nm) + '</p><div class="lh-hd"><b>' + esc(G.name) + "</b><span>" + esc(G.size) + '</span></div><div class="lh-body">' + hsDots(n) + "<div>" + hsLegend(n, n) + '</div></div><p class="lh-line">' + esc(G.line) + "</p>" + hsChgLine(H, G) + '<button type="button" class="chip" data-hs="' + esc(c.id) + '">' + esc(nm) + " · 삶에 미치는 영향 자세히 →</button></article>"; }).join("") + "</div></section>";
}
function hs7Html(c, n9){
  const H0 = c.hs7, main = hsOrd(H0, H0.groups.filter(G => !G.fold)), fold = hsOrd(H0, H0.groups.filter(G => G.fold)), H = Object.assign({}, H0, {groups: main.concat(fold)});
  return '<section class="stp" id="hs7-' + esc(c.id) + '">' + stpH(n9, "이 사안이 사람들의 삶에 미치는 영향") + '<p class="hs-lead">' + esc(H.lead) + "</p>" +
    main.map(G => hsCard(H, G, c.id)).join("") +
    (fold.length ? '<details class="src"><summary>그 밖의 집단 · ' + fold.map(G => esc(G.name)).join(", ") + "</summary>" + fold.map(G => hsCard(H, G, c.id)).join("") + "</details>" : "") +
    '<div class="lesson-box"><b>해석</b>' + esc(H.read) + "</div>" +
    ((c.people || []).length ? '<details class="src"><summary>영향받는 사람 전체 · 점수로 재지 않은 집단 포함</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th>누구</th><th>무엇이 걸려 있나</th></tr></thead><tbody>' + c.people.map(p => "<tr><td>" + esc(p.who) + "</td><td>" + esc(p.how) + "</td></tr>").join("") + "</tbody></table></div></details>" : "") +  /* v3.90 2안: 기존 '영향받는 사람' 표를 접힘으로 남긴다 */
    hsHistHtml(H) +
    '<details class="src"><summary>자세한 표와 측정 방법</summary><p class="note">점수는 유엔이 정한 인간 안보 범주로 계산합니다. 개인 안전은 폭력으로 숨지는 사람의 비율, 공동체는 집을 떠나야 했던 사람의 비율(이산가족은 가족과의 연락), 정치는 국가의 고문·정치적 살해로부터의 안전(V-Dem 신체적 온전성 지수), 경제는 1인당 소득(구매력 기준)입니다. 식량·보건·환경은 기준을 넘는 일이 있을 때 경보로 보입니다. 범주끼리 합치지 않습니다. 현재 점수는 측정값이고, 미래의 확률과 값은 판단값입니다. 점 그림의 색은 전개마다 한 범주라도 20점 넘게 떨어지거나 두 범주가 10점 넘게 떨어지면 크게 악화됨, 1점 넘게 떨어지면 악화됨, 1점 넘게 오르면 개선됨으로 나눈 것입니다(판단값). ' + (H.split ? esc(H.split) + " " : "") + '공식과 출처는 <button type="button" class="chip" data-go="method">분석 방법 탭</button>에 있습니다.</p>' + hsTables(H) + "</details></section>";
}
function humanHtml(c, n9, n10){
  if (c.hs7) return hs7Html(c, n9) + humanDivHtml(c, n10);
  const W = c.wellbeing, I = D.indicator, H = c.human;
  const base = {}; W.groups.forEach(g => base[g.k] = g.score);
  const gname = {}; W.groups.forEach(g => gname[g.k] = g.name);
  const E = c.futures.expect;
  const erows = []; Object.keys(base).forEach(g => WDIM.forEach(([k, l]) => { if (E.now[g][k] != null) erows.push("<tr><td>" + esc(gname[g]) + "</td><td>" + l + '</td><td class="mono">' + fmt(base[g][k]) + '</td><td class="mono">' + fmt(E.now[g][k]) + wdl(E.now[g][k], base[g][k]) + '</td>' + (c.futures.rec_same ? "" : '<td class="mono"><b>' + fmt(E.rec[g][k]) + "</b>" + wdl(E.rec[g][k], E.now[g][k]) + "</td>") + '<td class="mono" style="color:var(--conflict)">' + fmt(E.worst[g][k]) + "</td></tr>"); }));
  return '<section class="stp">' + stpH(n9, "영향받는 사람과 4개 차원의 효과") +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>누구</th><th>무엇이 걸려 있나</th></tr></thead><tbody>' + c.people.map(p => "<tr><td>" + esc(p.who) + "</td><td>" + esc(p.how) + "</td></tr>").join("") + "</tbody></table></div>" +
    '<h3 style="margin:6px 0 0">개인 행복 지표 · 2026년 기준</h3><p class="note">' + esc(I.unit) + " 4개 차원은 합치지 않습니다. " + esc(W.status) + '. 공식과 출처는 <button type="button" class="chip" data-go="method">방법론 탭</button>에 있습니다.</p>' +
    '<div class="wbt"><table><thead><tr><th>집단</th>' + WDIM.map(([k, l]) => "<th>" + l + (k === "safety" ? '<span class="est">판단값 포함</span>' : "") + "</th>").join("") + "</tr></thead><tbody>" +
    W.groups.map(g => '<tr><td class="g"><b>' + esc(g.name) + "</b><span>" + esc(g.size) + "</span></td>" + WDIM.map(([k]) => "<td>" + wbar(g.score[k]) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>" +
    '<details class="src"><summary>판단값의 근거와 원자료</summary><ul>' + W.groups.map(g => Object.values(g.why).map(t => "<li><b>" + esc(g.name) + "</b> · " + esc(t) + "</li>").join("")).join("") + "</ul>" +
    '<div class="tbl-wrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>항목</th><th>' + esc((W.cols || ["한국"])[0]) + "</th>" + ((W.cols || ["", "북한"])[1] ? "<th>" + esc((W.cols || ["", "북한"])[1]) + "</th>" : "") + '<th>출처</th></tr></thead><tbody>' + W.facts.map(f => "<tr><td>" + esc(f.k) + "</td><td>" + esc(f.ROK) + "</td>" + ((W.cols || ["", "북한"])[1] ? "<td>" + esc(f.PRK) + "</td>" : "") + '<td class="note">' + esc(f.src) + "</td></tr>").join("") + "</tbody></table></div></details>" +
    '<h3 style="margin:6px 0 0">선택지가 개인의 삶에 미치는 영향</h3><details class="src"><summary>선택지별 4개 차원 효과 펼치기</summary><div style="display:grid;gap:10px;margin-top:8px">' + c.alts.map(a => '<div class="altc"><div class="hd"><span class="id">' + a.id + "</span><b>" + esc(a.name) + "</b></div><dl>" + WDIM.map(([k, l]) => "<dt>" + l + "</dt><dd>" + esc(a.eff[k]) + "</dd>").join("") + '</dl><p class="lose">가장 크게 잃는 사람 · ' + esc(a.loser) + "</p></div>").join("") + "</div></details>" +
    '<h3 style="margin:6px 0 0">2030년 기대치' + (c.futures.rec_same ? "" : "로 본 권고의 효과") + '</h3><div class="tbl-wrap"><table class="tbl" style="min-width:520px"><thead><tr><th>집단</th><th>차원</th><th>2026년</th><th>' + (c.futures.rec_same ? "기대치" : "현 추세") + "</th>" + (c.futures.rec_same ? "" : "<th>권고 이행 시</th>") + '<th>가장 나쁜 미래</th></tr></thead><tbody>' + erows.join("") + "</tbody></table></div>" +
    '<p class="note">' + esc(E.note) + (c.futures.rec_same ? " ▲▼는 2026년 대비 변화입니다." : " 현 추세 열의 ▲▼는 2026년 대비, 권고 이행 시 열의 ▲▼는 현 추세 대비 변화입니다.") + '</p><div class="lesson-box"><b>해석</b>' + esc(E.read) + "</div></section>" +
    '<section class="stp">' + stpH(n10, "클리사의 판단과 전략 주체 순위의 차이") + '<p class="note">' + esc(H.note) + '</p><div class="divs">' +
    H.items.map(x => '<article class="dv"><div class="hd"><span class="id">' + esc(x.alt) + "</span><b>" + esc((c.alts.find(a => a.id === x.alt) || {}).name || "") + '</b></div><dl><dt>전략 주체 기준</dt><dd>' + esc(x.client) + '</dd><dt>클리사의 판단</dt><dd class="cl">' + esc(x.clisa) + '</dd><dt>전략 주체가 치르는 것</dt><dd>' + esc(x.cost) + '</dd><dt>사람에게 돌아오는 것</dt><dd>' + esc(x.gain) + "</dd></dl></article>").join("") + "</div></section>";
}
function humanDivHtml(c, n10){
  const H = c.human;
  return '<section class="stp">' + stpH(n10, "클리사의 판단과 전략 주체 순위의 차이") + '<p class="note">' + esc(H.note) + '</p><div class="divs">' +
    H.items.map(x => '<article class="dv"><div class="hd"><span class="id">' + esc(x.alt) + "</span><b>" + esc((c.alts.find(a => a.id === x.alt) || {}).name || "") + '</b></div><dl><dt>전략 주체 기준</dt><dd>' + esc(x.client) + '</dd><dt>클리사의 판단</dt><dd class="cl">' + esc(x.clisa) + '</dd><dt>전략 주체가 치르는 것</dt><dd>' + esc(x.cost) + '</dd><dt>사람에게 돌아오는 것</dt><dd>' + esc(x.gain) + "</dd></dl></article>").join("") + "</div></section>";
}
function prevHtml(c){
  const P = c.prev; if (!P || PUB()) return "";
  return '<details class="src"><summary>' + esc(P.label) + '</summary><div style="display:grid;gap:10px;margin-top:8px"><p class="note"></p><ol class="synth">' +
    P.conclusions.map(k => "<li><b>" + esc(k.id + " · " + k.t) + "</b><span>" + esc(k.why) + "</span></li>").join("") + '</ol><div class="verdict">' +
    P.verdict.excluded.map(x => '<div class="misread"><b>제시하지 않음</b>' + esc(x) + "</div>").join("") + P.verdict.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + "순위 " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") + "</div></div></details>";
}
/* v3.96i 사안 요약에 '사람들의 삶'을 꺼내 둔다: 분석 전문을 펼치지 않아도 집단별 100번의 미래와 그 집단의 자세한 내용으로 가는 단추가 보이게 */
function briefLife(c){
  const H = c.hs7; if (!H) return "";
  const gs = hsOrd(H, H.groups.filter(G => !G.fold)).filter(G => hsCount(H, G, "p").same < 100);
  return '<div class="bl-row">' + gs.map(G => { const n = hsCount(H, G, "p"); return '<button type="button" class="bi-life" data-hs="' + esc(c.id) + '" data-hsg="' + esc(G.k) + '">' + hsDots(n) + "<span><b>" + esc(G.name) + "</b><br>" + lifeNums(n) + "</span></button>"; }).join("") + "</div>" +
    '<div class="lh-act"><button type="button" class="chip" data-hs="' + esc(c.id) + '">삶에 미치는 영향 자세히 →</button>' + "</div>";
}
function briefHtml(c){
  const B = c.brief || {};
  const top = c.futures.items.slice().sort((a, b) => b.p - a.p)[0];
  const W = (c.counter || [])[0];
  const fcs = D.forecasts.filter(f => f.fp === c.fp && f.status === "open").sort((a, b) => a.due.localeCompare(b.due));
  const fb = f => 'data-fut="' + esc(c.id) + ":" + esc(f.id) + '"';
  return '<section class="brief"><dl class="tw">' +
    (B.q ? "<dt>핵심 질문</dt><dd>" + esc(B.q) + "</dd>" : "") +
    (B.a ? '<dt>판단</dt><dd class="ba">' + esc(B.a) + "</dd>" : "") +
    '<dt>가장 유력한 전개</dt><dd><button type="button" class="futlink" ' + fb(top) + '><span class="mono" style="color:' + fcol(top.id) + '">' + top.id + "</span> " + esc(top.name) + ' <span class="mono">' + top.p + "%</span>" + (top.rng ? ' <span class="rng">(' + top.rng[0] + "~" + top.rng[1] + ")</span>" : "") + ' <span class="note">→</span></button>' +
      '<div class="pbar pmini" role="group" aria-label="전개별 확률">' + c.futures.items.map(f => '<button type="button" ' + fb(f) + ' style="flex:' + f.p + ' 0 0;background:' + fcol(f.id) + '" title="' + esc(f.id + " " + f.name + " " + f.p + "%") + '"' + (f.p < 15 ? ' class="sm"' : "") + ">" + f.id + "<span>" + f.p + "%</span></button>").join("") + "</div></dd>" +
    (W ? "<dt>상대편에서 본 최선의 수</dt><dd><b>" + esc(W.name.split(" ")[0]) + "</b> · " + esc(W.ranked[0].t) + "</dd>" : "") +
    (B.eq ? "<dt>균형점</dt><dd>" + esc(B.eq) + "</dd>" : "") +
    (B.human ? "<dt>개인에게 미치는 영향</dt><dd>" + esc(B.human) + briefLife(c) + "</dd>" : "") +
    (fcs.length ? '<dt>관련 전망 <span class="note mono">' + fcs.length + '</span></dt><dd><div class="chips" style="margin:0">' + fcs.map(f => fcBtn(f.id)).join("") + '</div><p class="note" style="margin:4px 0 0">검증 시점이 가까운 순서입니다. 누르면 질문과 검증 시점을 볼 수 있습니다.</p></dd>' : "") +
    "</dl></section>";
}
function precHtml(c){
  const X = c.precedents;
  const head = '<section class="stp">' + stpH(1, "선행 이력 조사") + '<p class="note">과거에 시도된 해법, 곧 협상의 형식·의제·순서와 합의의 이행·붕괴 경과, 성패의 원인을 먼저 파악하고, 이후의 판단을 이 선례와 대조합니다.</p>';
  if (!X) return head + '<p class="note">이 사안의 선행 이력 조사는 진행 중입니다.</p></section>';
  const vc = v => v === "지지" || v === "부합" ? "ok" : v === "반박" || v === "상충" ? "no" : "fix";
  return head + (X.status && !PUB() ? '<p class="note"><span class="vd fix">' + esc(X.status) + "</span> 조사일 " + esc(X.asof || "") + "</p>" : "") +
    '<div style="display:grid;gap:6px">' + X.items.map(p => '<details class="src prec"><summary><b>' + esc(p.name) + '</b> <span class="mono note">' + esc(p.period) + "</span></summary>" +
      '<dl class="tw" style="margin-top:8px"><dt>형식</dt><dd>' + esc(p.format) + "</dd><dt>결과</dt><dd>" + esc(p.outcome) + "</dd><dt>원인</dt><dd>" + esc(p.why) + "</dd><dt>현재와 다른 점</dt><dd>" + esc(p.differs) + "</dd><dt>출처</dt><dd><ul>" + (p.sources || []).map(srcItem).join("") + "</ul></dd></dl></details>").join("") + "</div>" +
    '<h3 style="margin:10px 0 0">' + (PUB() ? "선례에 비춘 판단" : "기존 판단과의 대조") + '</h3><div class="divs">' +
      X.checks.map(k => '<article class="dv chk-' + vc(k.verdict) + '"><div class="hd"><span class="id">' + esc(k.claim) + '</span><span class="vd ' + vc(k.verdict) + '">' + esc(k.verdict) + '</span><span class="note mono">' + esc((k.precedents || []).join(", ")) + "</span></div><dl><dt>근거</dt><dd>" + esc(k.reason) + "</dd>" + (k.proposed ? '<dt>수정 제안</dt><dd class="cl">' + esc(k.proposed) + "</dd>" : "") + "</dl></article>").join("") + "</div>" +
    (X.insight ? '<div class="lesson-box"><b>선례가 드러낸 점</b>' + esc(X.insight) + "</div>" : "") +
    ((X.uncertain || []).length ? '<details class="src"><summary>확인하지 못한 사항 ' + X.uncertain.length + "건</summary><ul>" + X.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details>" : "") + "</section>";
}
function exitBlock(c){
  const x = exitCase(c.fp), E = D.exits; if (!x) return "";
  return '<details class="src" id="exc-' + esc(c.fp) + '"><summary>각자의 눈과 출구 · 당사자별 인식과 체면을 지키는 출구</summary><div class="exc-body">' +
    '<ol class="qs">' + E.questions.map(q => "<li>" + esc(q) + "</li>").join("") + "</ol>" +
    '<div style="display:grid;gap:10px">' + x.parties.map(p =>
      '<div class="eye"><div class="hd"><b>' + esc(nm(p.iso)) + '</b><span class="aim" title="목표 판별">' + esc(p.aim) + "</span></div><dl>" +
      "<div><dt>상대에 대한 인식</dt><dd>" + esc(p.reads) + "</dd></div>" +
      "<div><dt>가장 우려하는 것</dt><dd>" + esc(p.fear) + "</dd></div>" +
      '<div><dt>물러서기 위해 국내에 제시해야 할 명분</dt><dd class="say">“' + esc(p.say) + "”</dd></div>" +
      '</dl><p class="note">목표 판별 · ' + esc(p.aim_note) + "</p></div>").join("") + "</div>" +
    '<div class="misread"><b>가장 위험한 오독</b>' + esc(x.misread) + "</div>" +
    '<section class="sec"><h3>체면을 지키는 출구</h3>' + x.exits.map(e =>
      '<div class="exit"><h5>' + esc(e.title) + "</h5><ul>" + Object.entries(e.claims).map(([k, v]) => "<li><b>" + esc(nm(k)) + "</b> “" + esc(v) + "”</li>").join("") + '</ul><p class="pre"><b>선례</b> · ' + esc(e.precedent) + '</p><p class="obs"><b>장애</b> · ' + esc(e.obstacle) + "</p></div>").join("") + "</section>" +
    '<section class="sec"><h3>주시할 신호</h3><ul class="watch">' + x.signals.map(v => "<li>" + esc(v) + "</li>").join("") + "</ul></section>" +
    '<p class="note">당사자의 인식과 출구는 분석 판단이며, 해당국의 공식 입장이 아닙니다.</p></div></details>';
}
/* v3.35 다가오는 검증 시점(2026-10-01): 첫 화면에 검증 시점이 가까운 열린 전망을 남은 날수와 함께 보이고, 30일 안의 것은 맨 위 띠에도 돌린다 */
function daysLeft(due){ const t = new Date(); const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(due || ""); if (!m) return null; return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - a) / 864e5); }
function daysText(n){ return n == null ? "" : n > 0 ? n + "일 남음" : n === 0 ? "오늘 검증" : "검증 대기"; }
function dueSoon(days){ return D.forecasts.filter(f => f.status === "open" && daysLeft(f.due) != null && daysLeft(f.due) <= days).sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p); }
/* v3.36 다가오는 일정(2026-10-01): 전망의 검증 시점과 예정된 사건(D.events)을 날짜순으로 섞는다. 달만 정해진 사건(YYYY-MM)은 '11월 중'으로 적고 남은 날수는 적지 않는다 */
function evKey(e){ return e.date.length === 7 ? e.date + "-32" : e.date; }
function evDays(e){ if (e.date.length === 7) return ""; const n0 = daysLeft(e.date), n1 = daysLeft(e.end || e.date); return n0 > 0 ? n0 + "일 남음" : n1 >= 0 ? (n0 === 0 ? "오늘" : "진행 중") : ""; }
function evDate(e){ if (e.date.length === 7) return (+e.date.slice(5, 7)) + "월 중"; const a = fmtKD(e.date); if (!e.end) return a; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(e.end); return m && e.end.slice(0, 7) === e.date.slice(0, 7) ? a + "~" + (+m[3]) + "일" : a + "~" + fmtKD(e.end); }
function evSoon(days){ return (D.events || []).filter(e => { const k = evKey(e); const n = daysLeft(e.date.length === 7 ? e.date + "-01" : e.date); return n != null && n <= days && (e.date.length === 7 ? daysLeft(e.date + "-28") >= 0 : (e.end ? daysLeft(e.end) : n) >= 0); }); }
function agenda(days){
  const L = dueSoon(days).map(f => ({k: f.due, f})).concat(evSoon(days).map(e => ({k: evKey(e), e})));
  return L.sort((a, b) => a.k.localeCompare(b.k));
}
function dueHtml(){
  /* 나안(2026-10-01 결재): 달별로 묶고 한 줄에 날짜·제목·남은 날수만 둔다. 같은 날의 전망은 한 줄에 모은다 */
  const L = agenda(120); if (!L.length) return "";
  const dayOf = x => x.e ? (x.e.date.length === 7 ? "중" : (+x.e.date.slice(8, 10)) + (x.e.end && x.e.end.slice(0, 7) === x.e.date.slice(0, 7) ? "~" + (+x.e.end.slice(8, 10)) : "") + "일") : (+x.f.due.slice(8, 10)) + "일";
  const months = [];
  for (const x of L) {
    const mk = x.k.slice(0, 7); let M = months.find(m => m.mk === mk); if (!M) { M = {mk, rows: []}; months.push(M); }
    if (x.f) { const key = "f" + x.f.due; let R = M.rows.find(r => r.key === key); if (!R) { R = {key, k: x.k, day: dayOf(x), fs: [], n: daysLeft(x.f.due)}; M.rows.push(R); } R.fs.push(x.f); }
    else M.rows.push({key: x.e.id, k: x.k, day: dayOf(x), e: x.e, n: x.e.date.length === 7 ? null : daysLeft(x.e.date), dt: evDays(x.e)});
  }
  const row = r => '<li id="due-' + esc(r.key) + '"><span class="d">' + esc(r.day) + '</span><span class="t">' + (r.fs ? '<span class="evk">전망</span>' + r.fs.slice(0, 3).map(f => '<button type="button" class="fcl" data-fc="' + esc(f.id) + '" title="' + esc(f.q) + '">' + fcLab(f, f.id, f.p) + PIN + "</button>").join('<span class="sep">·</span>') + (r.fs.length > 3 ? '<span class="sep">·</span><button type="button" class="fcl more" data-go="forecast">외 ' + (r.fs.length - 3) + "건</button>" : "")
    : '<button type="button" class="fcl" data-ev="' + esc(r.e.id) + '">' + esc(r.e.t) + PIN + "</button>") + "</span>" +  /* v3.79 일정을 누르면 설명과 지구본의 장소(사안 화면으로 넘어가지 않음) */
    (r.fs ? '<span class="n' + (r.n <= 7 ? " hot" : "") + '">' + daysText(r.n) + "</span>" : r.dt ? '<span class="n' + (r.n != null && r.n <= 7 ? " hot" : "") + '">' + r.dt + "</span>" : "") + "</li>";
  return '<section class="sec due" id="due"><h3>다가오는 일정</h3><div class="mo">' + months.map(M => '<div class="m">' + (+M.mk.slice(5, 7)) + "월</div><ul>" + M.rows.map(row).join("") + "</ul>").join("") +
    '</div><p class="note" style="margin-top:8px"><button type="button" class="chip" data-go="forecast">전망 전체 보기 →</button></p></section>';
}
function upcomingHtml(){
  const up = D.forecasts.filter(f => f.status === "open").slice().sort((a, b) => a.due.localeCompare(b.due) || b.p - a.p).slice(0, 3);
  return up.length ? '<section class="sec"><h3>다가오는 검증</h3><ul class="list">' + up.map(f => forecastRow(f, true)).join("") + '</ul><p class="note" style="margin-top:8px"><button type="button" class="chip" data-go="forecast">전망 전체 보기</button></p></section>' : "";
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
  const evCard = r => '<li class="s2e"><div class="s2e-h">' + code(r.id) + "<b>" + esc(A(r.id).name) + '</b><span class="s2e-t">가역성 ' + esc(r.rev) + " · 확전 위험 " + esc(r.esc) + " · 실현 가능성 " + esc(r.feas) + '</span></div><div class="s2e-g">' + r.s.map((v, k) => '<span><em>' + esc(G[k].s || G[k].id) + "</em>" + sc(v) + "</span>").join("") + "</div><p>" + esc(r.why) + "</p></li>";
  const evMain = X.eval.rows.filter(r => !AUX.includes(r.id)), evAux = X.eval.rows.filter(r => AUX.includes(r.id));
  const F = (c.futures || {}).items || [], rec = X.rec;
  const dlt = f => { const d = rec.p[f.id] - f.p; return d === 0 ? '<span class="s2d z">변화 없음</span>' : '<span class="s2d ' + (d > 0 ? "up" : "dn") + '">' + (d > 0 ? "+" : "−") + Math.abs(d) + "%p</span>"; };
  const R1 = X.ranked[0];
  return '<section class="s2box"><div class="s2h"><p class="eyebrow">전략 주체 2</p><h3>' + esc(nmS) + "</h3><p>" + "이 사안은 전략 주체가 둘입니다. 위의 2~11단계는 " + esc(c.client.name) + "을, 아래는 같은 정세 판단(1~6단계) 위에서 " + esc(nmS) + '을 기준으로 평가했습니다.</p><div class="s2sum"><span><em>목표</em>' + G.length + "개</span><span><em>선택지</em>" + X.alts.length + "개</span><span><em>1순위</em>" + esc(R1.name) + "</span></div></div>" +
    step(4, "선택지 전수 검토", '<p class="note">' + esc(X.deciders) + '</p><h4 class="s2sub">큰 노선 · 이 가운데 하나를 고릅니다</h4><ul class="s2alts">' + main.map(altCard).join("") + '</ul><h4 class="s2sub">함께 쓰는 수단</h4><ul class="s2alts">' + aux.map(altCard).join("") + "</ul>") +
    step(5, "가장 치밀한 상대(" + (X.foe || "상대") + ")의 대응", '<dl class="s2resp">' + X.responses.map(r => "<dt>" + code(r[0]) + esc(A(r[0]).name) + "</dt><dd>" + esc(r[1]) + "</dd>").join("") + "</dl>") +
    step(7, "전략 주체와 목표", "<p><b>" + esc(nmS) + '</b> · 목표의 순서 <span class="mono">' + esc(X.client.order) + '</span></p><ul class="list goals">' + G.map(g => '<li class="rv"><span><b class="mono" style="color:var(--accent)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + '<br><span class="note">출처 · ' + esc(g.src) + "</span></p></li>").join("") + '</ul><p class="note">' + esc(X.client.note) + "</p>") +
    step(8, "목표별 선택지 평가", '<p class="note">' + esc(X.eval.base) + '</p><ul class="s2ev">' + evMain.map(evCard).join("") + '</ul><h4 class="s2sub">함께 쓰는 수단</h4><ul class="s2ev">' + evAux.map(evCard).join("") + "</ul>") +
    step(9, "전략 주체 기준의 순위", '<p class="note">' + esc(X.rule) + '</p><div class="s2r1"><p class="s2r1-k">1순위</p><h4>' + esc(R1.name) + '</h4><p class="s2path">' + esc(R1.id) + "</p><p>" + esc(R1.t) + '</p></div><ol class="s2rk" start="2">' + X.ranked.slice(1).map(r => "<li><div><b>" + esc(r.name) + "</b>" + code(r.id) + "</div><p>" + esc(r.t) + "</p></li>").join("") + "</ol>" +
      '<div class="s2p"><p class="s2p-h">이 노선을 따를 때의 전개 확률</p><table><thead><tr><th>전개</th><th>현재</th><th>1순위를 따를 때</th><th></th></tr></thead><tbody>' + F.map(f => "<tr><td>" + esc(f.name) + '</td><td class="mono">' + f.p + '%</td><td class="mono">' + rec.p[f.id] + "% <small>(" + rec.rng[f.id][0] + (rec.rng[f.id][1] !== rec.rng[f.id][0] ? "~" + rec.rng[f.id][1] : "") + ")</small></td><td>" + dlt(f) + "</td></tr>").join("") + '</tbody></table><p class="note">' + esc(rec.basis) + "</p></div>" +
      '<details class="src"><summary>선례 대조 ' + X.prec.length + "건</summary><ul>" + X.prec.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></details>") +
    step(10, "영향받는 사람", '<dl class="s2ppl">' + X.people.map(r => "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>").join("") + "</dl>") +
    step(11, "클리사 지오폴리틱스의 판단과의 차이", '<p class="note">' + esc(X.diff.note) + '</p><div class="tbl-wrap"><table class="tbl s2df"><thead><tr><th>안</th><th>' + esc(nmS) + ' 기준</th><th>사람 기준</th><th>이유</th></tr></thead><tbody>' + X.diff.rows.map(r => '<tr' + (r[1] !== r[2] ? ' class="ne"' : "") + "><td><b>" + esc(r[0]) + '</b></td><td class="mono">' + r[1] + '위</td><td class="mono">' + r[2] + "위</td><td>" + esc(r[3]) + "</td></tr>").join("") + '</tbody></table></div><div class="lesson-box"><b>치르는 것과 돌아오는 것</b>' + esc(X.diff.pay) + '</div><div class="lesson-box"><b>두 전략 주체의 판단은 맞물리는가</b>' + esc(X.fit) + "</div>") +
    "</section>";
}
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
      step(2, "사실 확인", '<ul class="facts">' + c.facts.map(f => "<li>" + esc(f) + "</li>").join("") + "</ul>" +
        (c.law ? '<div class="lesson-box"><b>' + esc(c.law.title) + '</b><ul class="facts" style="margin-top:6px">' + c.law.points.map(x => "<li>" + esc(x) + "</li>").join("") + '</ul><p style="margin-top:8px;color:var(--ink)">' + esc(c.law.result) + "</p></div>" : "") +
        (an ? '<details class="src"><summary>유사한 역사적 선례 · ' + esc(an.now) + "</summary>" + analogHtml(an, true) + "</details>" : "")) +
      decHtml(c, 3) + exitBlock(c) +
      step(4, "선택지 전수 검토", '<p class="note">전략 주체가 실제로 검토하는 선택지를 모두 포함합니다. 도덕적 이유로 제외하지 않습니다.' + (PUB() || c.id !== "korea" ? "" : "") + '</p><ul class="list">' + c.alts.map(a => '<li class="rv"><span><b style="font-family:var(--mono);color:var(--accent)">' + a.id + "</b> <b>" + esc(a.name) + "</b></span><p>" + esc(a.desc) + "</p></li>").join("") + "</ul>") +
      step(5, "가장 치밀한 상대의 대응", '<p class="note">' + esc(c.responses.note) + '</p><div class="tbl-wrap"><table class="tbl" style="min-width:640px"><thead><tr><th>안</th>' + (c.responses.cols || ["CHN","PRK","JPN","RUS","USA"]).map(k => "<th>" + esc(nm(k)) + "</th>").join("") + "</tr></thead><tbody>" + c.responses.rows.map(r => '<tr><td class="mono">' + esc(r.alt) + "</td>" + (c.responses.cols || ["CHN","PRK","JPN","RUS","USA"]).map(k => "<td>" + esc(r[k] || "") + "</td>").join("") + "</tr>").join("") + '</tbody></table></div><div class="lesson-box"><b>가장 치밀한 상대를 가정하자 달라진 점</b>' + esc(c.responses.lesson) + "</div>") +
      futHtml(c, 6) +
      layer("2", lq("2")) +
      step(7, "전략 주체와 목표", "<p><b>" + esc(cl.name) + '</b> · 목표의 순서 <span class="mono">' + esc(cl.order) + '</span></p><ul class="list goals">' + cl.goals.map(g => '<li class="rv"><span><b class="mono" style="color:var(--accent)">' + g.id + "</b> <b>" + esc(g.t) + "</b></span><p>" + esc(g.d) + '<br><span class="note">출처 · ' + esc(g.src) + "</span></p></li>").join("") + '</ul><p class="note">' + esc(cl.note) + "</p>") +
      step(8, "목표별 선택지 평가", evalHtml(c)) +
      step(9, "전략 주체 기준의 순위", '<div class="verdict">' + c.rank2.ranked.map((r, j) => '<div class="rk"><b>' + (j + 1) + "순위 " + esc(r.id) + "</b><span>" + esc(r.t) + "</span></div>").join("") +
        '<div class="lesson-box"><b>조합 안의 긴장</b>' + esc(c.rank2.tension) + '</div><div class="lesson-box"><b>전략 주체의 몫으로 남긴 것</b>' + esc(c.rank2.undecided) + "</div></div>") + swapHtml(c) + counterHtml(c) + twowayHtml(c) +
      layer("3", lq("3")) +
      humanHtml(c, 10, 11) +
      s2Html(c) +
      layer("V", lq("V")) +
      step(12, "전망과 반증 신호", '<ul class="list">' + c.predictions.map(p => '<li><div class="fc"><div class="q">' + esc(p.q) + '</div><div class="p">' + p.p + '<small>%</small></div><div class="foot"><span>검증 시점 <span class="mono">' + esc(p.due) + "</span></span><span>" + esc(p.note) + "</span></div></div></li>").join("") + '</ul><p class="note" style="margin-top:6px">이 사안의 관련 전망(' + pf.join(", ") + ')은 전망과 검증 탭에서 모두 확인할 수 있습니다. <button type="button" class="chip" data-go="forecast">전망과 검증 보기</button></p><h3 style="margin:10px 0 6px">판단을 재검토할 조건</h3><ul class="watch">' + c.falsify.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>") +
      (PUB() || !c.changed ? "" : '<section class="sec"><h3></h3><ul class="list">' + c.changed.map(x => '<li class="rv"><p style="color:var(--ink)">' + esc(x) + "</p></li>").join("") + "</ul></section>") +
      prevHtml(c) +
      '<details class="src"><summary>출처 ' + c.sources.length + "건</summary><ul>" + c.sources.map(srcItem).join("") + "</ul></details>";
}
/* v3.52 사안의 결정권자: 전략 주체의 결정권자와 사안에서 분석한 주요국 결정권자를 모두 칩으로(2026-10-05 결재) */
function caseLeaders(c){
  const L = LLK(), me = c.subject || (c.id === "ukraine" ? "UKR" : "KOR");
  const xs = [...new Set([me].concat(((c.deciders || {}).items || []).map(d => d.iso)))].filter(i => L[i]);
  return xs.length ? '<div class="chips cl-ld" style="margin:8px 0 0"><span class="note">결정권자</span>' + xs.map(i => '<a class="chip" href="' + lurl(i) + '">' + esc(L[i].name) + (i === me || (c.s2 && i === c.s2.subject) ? ' <span class="note">전략 주체</span>' : "") + "</a>").join("") + "</div>" + casePower(c) : casePower(c);
}
/* v3.53 사안 머리의 권력 구조 칩: 전략 주체와 결정권을 가진 나라 가운데 권력 구조 쪽이 있는 나라 */
function casePower(c){
  const P = PLK(), me = c.subject || (c.id === "ukraine" ? "UKR" : "KOR");
  const xs = [...new Set([me].concat(((c.deciders || {}).items || []).map(d => d.iso)))].filter(i => P[i]);
  return xs.length ? '<div class="chips cl-ld" style="margin:6px 0 0"><span class="note">권력 구조</span>' + xs.map(i => '<a class="chip" href="/power/#' + i + '">' + esc(P[i].name) + "</a>").join("") + "</div>" : "";
}
function caseArt(c, i){
  const cl = c.client;
  return '<article class="sec case-a" id="case-' + esc(c.id) + '" data-cid="' + esc(c.id) + '" style="display:grid;gap:22px"><div><p class="eyebrow">사안 ' + (i + 1) + " · 전략 주체: " + esc(cl ? cl.name : c.recipient) + (c.s2 ? " · " + esc(c.s2.client.name) : "") + " · 기준일 " + esc(c.asof) + '</p><h2 style="margin-top:4px;font-size:20px">' + esc(c.title) + " " + ttsBtn("case:" + c.id) + "</h2>" + (c.status ? '<p class="meta" style="margin-top:4px">' + esc(c.status) + "</p>" : "") + caseLeaders(c) + (FEATS().some(F => F.case === c.id) ? '<div class="chips" style="margin:8px 0 0">' + FEATS().filter(F => F.case === c.id).map(featBtn).join("") + "</div>" : "") + "</div>" +
    briefHtml(c) + theoryHtml(c) + publicsHtml(c) +
    '<details class="full" data-cid="' + esc(c.id) + '"><summary>분석 전문 · 정세 판단에서 검증까지</summary><div class="full-body"></div></details>' +
    '<div class="chips" style="margin:0"><button type="button" class="chip" data-go="method">분석 방법 보기</button><button type="button" class="chip" data-fp="' + esc(c.fp) + '">지도에서 보기 · ' + esc((D.flashpoints.find(f => f.id === c.fp) || {}).name_ko || "") + "</button></div>" + caseFbHtml(c) + "</article>";
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
    '<div class="sec"><h2>전략 분석</h2><p class="lead" style="margin-top:8px">각 사안을 전략 주체의 관점에서 분석합니다. 분석은 정세 판단(Ⅰ), 전략 평가(Ⅱ), 개인에게 미치는 영향(Ⅲ), 검증(Ⅳ)의 4개 부분으로 구성됩니다.</p></div>' +
    insightsHtml() + upcomingHtml() + leadersRow() +
    '<h3 id="s-case" style="margin:6px 0 0">사안별 분석 <span class="note" style="font-weight:400">· 사안 ' + ss.length + "건</span></h3>" +
    (ss.length > 1 ? '<nav class="case-sw" aria-label="사안 바로 가기">' + ss.map(k => '<button type="button" data-case="' + esc(k.id) + '">' + esc(k.title.split(":")[0]) + "</button>").join("") + "</nav>" : "") +
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
  return '<p style="font-size:12px"><b>신호 전망</b> · ' + (up.length ? "이 전개 쪽으로 " + up.map(g => fcBtn(g.id)).join(" ") : "") + (dn.length ? (up.length ? " · " : "") + "반대쪽으로 " + dn.map(g => fcBtn(g.id)).join(" ") : "") + "</p>";
}
function fcByBranch(c, fs){
  const byId = id => fs.find(f => f.id === id), used = new Set(), sub = (t, ids) => { const xs = ids.map(byId).filter(Boolean); xs.forEach(f => used.add(f.id)); return xs.length ? '<p class="note" style="margin:10px 0 4px">' + t + '</p><ul class="list">' + xs.map(f => forecastRow(f, false)).join("") + "</ul>" : ""; };
  const its = c.futures.items.slice().sort((a, b) => b.p - a.p);
  let h = its.map(it => '<div class="fbr" style="border-top:1px solid var(--line);padding-top:10px;margin-top:14px"><h4 style="margin:0"><span class="mono" style="color:' + fcol(it.id) + '">' + esc(it.id) + "</span> " + esc(it.name) + ' <span class="mono">' + it.p + "%</span>" + (it.rng ? ' <span class="rng">(' + it.rng[0] + "~" + it.rng[1] + ")</span>" : "") + '</h4><p class="note" style="margin:2px 0 0">성립 조건 · ' + esc(it.test) + "</p>" +
    sub("성립 조건과 이어진 전망", it.fc ? [it.fc] : []) + sub("이 전개 쪽으로 기울게 하는 전망", (it.sig || []).filter(g => g.dir === "+").map(g => g.id)) + sub("반대쪽으로 기울게 하는 전망", (it.sig || []).filter(g => g.dir === "-").map(g => g.id)) +
    (!it.fc && !(it.sig || []).length ? '<p class="note" style="margin:6px 0 0">이 전개에 이어진 전망은 아직 없습니다. 2030년 말의 성립 조건으로 확인합니다.</p>' : "") + "</div>").join("");
  const cf = f => f.fp === c.fp, expo = (D.fc_expo || []).map(byId).filter(f => f && cf(f) && !used.has(f.id));
  h += expo.length ? '<div style="border-top:1px solid var(--line);padding-top:10px;margin-top:14px"><h4 style="margin:0">한국의 노출과 권고</h4><p class="note" style="margin:2px 0 0">어느 전개가 오는지가 아니라, 한국이 치르는 대가와 권고의 실행을 묻는 전망입니다.</p><ul class="list">' + expo.map(f => { used.add(f.id); return forecastRow(f, false); }).join("") + "</ul></div>" : "";
  const rest = fs.filter(f => cf(f) && !used.has(f.id));
  h += rest.length ? '<div style="border-top:1px solid var(--line);padding-top:10px;margin-top:14px"><h4 style="margin:0">그 밖의 이 사안 전망</h4><ul class="list">' + rest.map(f => forecastRow(f, false)).join("") + "</ul></div>" : "";
  return h;
}
/* v4.22 전망별 화면(/forecast/f02/)과 판가름 목록(2026-10-20 결재). 일자별 확률은 공개판 fc_hist(그날 공개판에 실렸던 값 그대로).
   화면 문구는 모두 FCT에 둔다(영문판은 en/patch_app.py가 FCT 구역을 en/fct_en.js로 통째로 바꾼다) */
/*FCT{*/
const FCT = {
  yd: ["가능성 희박", "가능성 매우 낮음", "가능성 낮음", "가능성 있음", "가능성 높음", "가능성 매우 높음", "거의 확실"], ydNote: "발생 확률 옆의 가능성 표현은 영국 정부가 정보 판단에 사용하는 표현 방식을 따랐습니다. 다만, 영국 정부는 표현과 표현 사이에 일부러 빈 구간(예: 5~10%)을 두었으나, 클리사는 모든 확률에 단어 표현을 붙였습니다.",
  md: s => (+s.slice(5, 7)) + "월 " + (+s.slice(8, 10)) + "일", ymd: s => (+s.slice(0, 4)) + "년 " + (+s.slice(5, 7)) + "월 " + (+s.slice(8, 10)) + "일", ym: s => s.slice(2, 4) + "년 " + (+s.slice(5, 7)) + "월",
  tk: s => FCT.md(s), left: n => n + "일 남음", late: n => n + "일 지남", dd: n => n + "일", cnt: n => n + "건", more: n => n + "건 더 보기",
  today: "오늘", checking: "결과 확인 중", firstRes: "첫 결과", acc: "정확도(브라이어 점수)", detail: "자세히 보기 →", copied: "복사했습니다", title: s => s + " · 전망",
  late_h: "결과를 확인하고 있는 전망", s30: "30일 내 판가름 날 전망", s30none: "30일 안에 검증 시점이 오는 전망은 없습니다.", s90: "90일 내 판가름 날 전망",
  due: d => "검증 " + d, etc: "그 밖의 분쟁", back: "← 전망 목록", eyebrow: (id, c) => "전망 " + id + " · " + c,
  pNow: "현재 확률", pThen: "당시 확률", caseGo: c => c + " 사안 →", dueAt: "검증 시점", made: "만든 날", madeV: (d, p) => d + " · 처음 확률 " + p + "%", rs: "결과 확인",
  resH: "검증 결과", resD: d => " · " + d + " 확정", voidL: "무효", yes: "실현", no: "불발", resSub: (p, b) => "당시 확률 " + p + "% · 브라이어 점수 " + b,
  chartH: "일자별 확률 변화", span: "기간", w30: "최근 30일", wAll: "전체 기간", aria: s => s + " 일자별 확률 변화", ev: "사건",
  revT: (d, x) => d + " 주간 전망 점검 · " + x, keep: p => p + "% 유지", chg: (a, b) => a + "% → " + b + "%",
  legF: "확률을 바꾼 주간 점검", legO: "그대로 둔 주간 점검", legU: "정세 브리핑 · 확률 상승 요인", legD: "정세 브리핑 · 확률 하락 요인",
  chartNote: "확률은 매주 월요일 주간 전망 점검에서 다시 보며, 그래프의 값은 그날 공개판에 실렸던 확률 그대로입니다.", futNote: " 점선은 검증 시점까지 남은 기간입니다.",
  whyH: "변동·유지 이유", week: "주간 전망 점검", first: p => "처음 확률 " + p + "%", firstD: "전망을 만든 날",
  evH: "관련 사건", evNote: "정세 브리핑에서 이 전망과 연결한 사건입니다. 화살표는 사건이 전망의 실현 가능성을 높이는지 낮추는지를 표시한 것입니다.", evGo: "그날의 정세 브리핑 →",
  E: {up: ["↑", "확률 상승 요인"], down: ["↓", "확률 하락 요인"], none: ["–", "변화 없음"]},
  ocH: "결과가 나오면", ocNote: (d, p) => d + "에 결과를 확인합니다. 현재 확률 " + p + "%가 그날까지 이어진다고 보면, 결과마다 이 전망의 점수(날마다의 확률로 매긴 브라이어 점수의 평균)는 다음과 같습니다. 0에 가까울수록 정확합니다.",
  ocY: "실현되면", ocN: "불발되면",
  yLow: p => p + "%로 낮게 본 일이 일어난 것이므로 「빗나간 전망」에 오릅니다.", yHigh: p => p + "%로 높게 본 대로 일어난 것입니다.",
  nLow: p => p + "%로 낮게 본 대로 일어나지 않은 것입니다.", nHigh: p => p + "%로 높게 본 일이 일어나지 않은 것이므로 「빗나간 전망」에 오릅니다.",
  ocFirst: (p, a, b) => "처음 확률 " + p + "%를 그대로 뒀을 때의 점수 · 실현 " + a + ", 불발 " + b,
  sibH: "같은 사안의 전망", shareH: "공유", shareX: "X에 공유", copy: "주소 복사", sub: "새 글 알림 받기",
  calH: "언제 무엇이 판가름 나는가", calNote: "점 하나가 전망 하나입니다. 진할수록 일어날 확률이 높다고 본 전망이고, 누르면 그 전망으로 갑니다.",
  calM: (y, m, first) => (first ? y + "년<br>" : "") + m + "월", calRest: (y, m0) => y + "년 " + (m0 === 7 ? "하반기" : m0 + "~12월"), calY: y => y + "년",
  legP: "확률", legB: ["20% 이하", "21~40%", "41~60%", "61~80%", "81% 이상"],
  hDays: done => done ? "일 뒤 다음 결과" : "일 뒤 첫 결과", hToday: "오늘 판가름", hK: (d, c) => d + " 판가름 · " + c, hNote: "결과가 나오면 이 자리에 맞았는지 틀렸는지 표시합니다.", hStart: d => d + " 처음",
  stOpen: "진행 중", stChg: "확률을 바꾼 전망", stDone: "결과 확인", stVoid: "무효",
  rel: n => "관련 꼭지 " + n + "건", later: n => "그 뒤의 전망 " + n + "건 · 전체 목록에서 보기 ↓",
  accH: "정확도는 어떻게 계산하나", accP: d => "결과가 나온 전망마다, 전망을 공개한 날부터 검증 시점까지(그 전에 실현이 확정되면 그날까지) 날마다의 확률로 (확률 − 실제 결과)²를 구해 평균합니다(브라이어 점수). 일어난 일은 1, 일어나지 않은 일은 0으로 셉니다. 0에 가까울수록 정확하고, 모든 전망에 50%를 붙이면 0.25가 됩니다." + (d ? " 첫 결과가 나오는 " + d + " 뒤에 이 자리에 점수를 공개합니다." : ""), accGo: "결과 확인 절차는 분석 방법에서 →",
  href: p => p,
  tweet: (q, p, d) => "「" + q + "」 클리사 지오폴리틱스의 전망 " + p + "% · 검증 시점 " + d,
};
/*}FCT*/
const fcToday = () => { const n = new Date(), k = new Date(n.getTime() + (n.getTimezoneOffset() + 540) * 60000); return k.getFullYear() + "-" + String(k.getMonth() + 1).padStart(2, "0") + "-" + String(k.getDate()).padStart(2, "0"); };
const fcUTC = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const fcDays = (a, b) => Math.round((fcUTC(b) - fcUTC(a)) / 864e5);
const fcAdd = (s, n) => new Date(fcUTC(s) + n * 864e5).toISOString().slice(0, 10);
const fcCaseOf = f => (D.strategies || []).find(c => c.fp === f.fp);
const fcCaseName = f => { const c = fcCaseOf(f); return c ? c.title.split(":")[0] : FCT.etc; };
const fcHistOf = f => ((D.fc_hist || {})[f.id] || [[f.made || f.due, f.p]]);
/* v4.24 기간 평균 브라이어 점수(2026-10-20 결재): 공개한 날부터 검증 시점(그 전에 실현이 확정되면 그날)까지 날마다의 확률로 매긴 점수의 평균.
   확률을 고치지 않은 날은 직전 확률이 이어진다. 아직 열린 전망은 현재 확률이 검증 시점까지 이어진다고 본다 */
const fcEnd = f => (f.resolved && f.resolved < f.due ? f.resolved : f.due);
function fcBrierT(f, y){
  const H = fcHistOf(f), end = fcEnd(f); let d = H[0][0], i = 0, cur = H[0][1], s = 0, n = 0;
  for (; d <= end && n < 5000; d = fcAdd(d, 1)) { while (i + 1 < H.length && H[i + 1][0] <= d) { i++; cur = H[i][1]; } s += Math.pow(cur / 100 - y, 2); n++; }
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
  const inner = (i > 0 && (t.indexOf("가능성") === 0 || !/[가-힣]/.test(t))) ? '<span class="y1">' + esc(t.slice(0, i)) + '</span> <span class="y2">' + esc(t.slice(i + 1)) + "</span>" : esc(t);
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
  const t = fcToday(), H = fcHistOf(f), open = f.status === "open", n = fcDays(t, f.due), c = fcCaseOf(f);
  const sib = D.forecasts.filter(x => x.fp && x.fp === f.fp && x.id !== f.id).sort((a, b) => a.due.localeCompare(b.due));
  const rv = []; FCR().forEach(r => r.items.forEach(it => { if (it.id === f.id) rv.push([r.date, it]); }));
  const evs = fcEvents(f), br = (p, y) => Math.pow(p / 100 - (y ? 1 : 0), 2).toFixed(2), low = f.p < 50, res = f.status === "yes" || f.status === "no";
  const url = location.origin + FCT.href("/forecast/" + f.id + "/");
  return '<div class="sec"><p style="margin:0 0 10px"><button type="button" class="chip back" data-fcd="">' + FCT.back + "</button></p>" +
    '<div class="fd-h"><div><p class="eyebrow">' + esc(FCT.eyebrow(f.id, fcCaseName(f))) + '</p><h2 class="fd-q">' + esc(f.q) + "</h2></div>" +
    '<div class="fd-p"><b>' + f.p + "%</b>" + ydWord(f.p, "yw yd") + "<span>" + (open ? FCT.pNow : FCT.pThen) + "</span></div></div>" +
    '<div class="chips" style="margin-top:8px">' + (f.countries || []).map(chip).join("") + (c ? '<button type="button" class="chip" data-case="' + esc(c.id) + '">' + esc(FCT.caseGo(c.title.split(":")[0])) + "</button>" : "") + "</div>" +
    '<dl class="fd-meta"><dt>' + FCT.dueAt + "</dt><dd>" + FCT.ymd(f.due) + (open ? ' <span class="fd-dd">' + (n > 0 ? FCT.left(n) : n === 0 ? FCT.today : FCT.checking) + "</span>" : "") + "</dd>" +
    "<dt>" + FCT.made + "</dt><dd>" + FCT.madeV(FCT.ymd(H[0][0]), H[0][1]) + "</dd>" + (f.rs ? "<dt>" + FCT.rs + "</dt><dd>" + esc(f.rs) + "</dd>" : "") + "</dl></div>" +
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
    (open ? '<section class="sec"><h3>' + FCT.ocH + '</h3><p class="note" style="margin-bottom:8px">' + FCT.ocNote(FCT.ymd(f.due), f.p) + "</p>" +
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
    '<div class="sec"><h2>전망과 검증</h2><p class="lead" style="margin-top:8px">모든 전망에는 발생 확률과 검증 시점을 명시하며, 검증 시점에 실제 발생 여부를 점검하고 그 결과도 공개합니다.</p><p class="ydnote">' + esc(FCT.ydNote) + "</p></div>" +
    fcHeroHtml(op0, done, t0) + fcStatsHtml(fs, op0, done, brier) +  /* v4.23 다음 결과 카드와 숫자 꼬리표(성적표 3칸을 대신함) */
    fcCalHtml(op0, t0) +  /* v4.23 판가름 달력 */
    fcSoonHtml(t0) +  /* v4.22 판가름 목록 */
    '<details class="facc"><summary>' + FCT.accH + "</summary><p>" + FCT.accP(done.length || !nx ? "" : FCT.md(nx.due)) + '</p><p><button type="button" class="chip" data-go="method">' + FCT.accGo + "</button></p></details>" +
    (FCR().length ? '<section class="sec" id="f-week"><h3>주간 전망 점검</h3><p class="note" style="margin-bottom:8px">매주 월요일, 지난 한 주의 사건을 반영해 전망의 확률을 다시 봅니다. 조정한 전망과 그대로 둔 전망을 이유와 함께 밝힙니다.</p>' + FCR().map((r, i) => weekHtml(r, i === 0)).join("") + "</section>" : "") +
    '<section class="sec"><h3>빗나간 전망</h3><p class="note" style="margin-bottom:8px">50% 이상으로 본 전망이 불발되거나 50% 미만으로 본 전망이 실현된 경우입니다.</p>' + (miss.length ? '<ul class="list">' + miss.map(f => forecastRow(f, false)).join("") + "</ul>" : '<p class="note">검증이 끝난 전망이 아직 없습니다.</p>') + "</section>" +
    ((PUB() && (D.notices || []).length) ? '<section class="sec"><h3>판단 변경 공지</h3><ul class="tl">' + D.notices.slice().reverse().map(l => { const m = /^case\/([\w-]+)\/$/.exec(l.link || ""), k = m && (D.strategies || []).find(x => x.id === m[1]), fm = /^feature\/([\w-]+)\/$/.exec(l.link || ""), F = fm && FEATS().find(x => x.id === fm[1]); return '<li><span class="d">' + esc(l.date) + "</span><span>" + esc(l.text) + (F ? " " + featBtn(F) : "") + (k ? ' <button type="button" class="chip" data-case="' + esc(k.id) + '">사안 분석 보기 · ' + esc(k.title.split(":")[0]) + "</button>" : "") + "</span></li>"; }).join("") + "</ul></section>" : "") +
    (() => { const cs = D.strategies || [], cf = f => { const c = cs.find(x => x.fp === f.fp); return c ? c.id : "etc"; };
      const opts = [["all", "전체", fs.length]].concat(cs.map(c => [c.id, c.title.split(":")[0], fs.filter(f => cf(f) === c.id).length]), [["etc", "그 밖의 분쟁", fs.filter(f => cf(f) === "etc").length]]);
      const sel = S.fcf || "all", shown = sel === "all" ? fs : fs.filter(f => cf(f) === sel);
      const cc = cs.find(c => c.id === sel);
      return '<section class="sec" id="f-all"><h3>' + (cc ? esc(cc.title.split(":")[0]) + " · 전개별 전망" : "전체 전망 · 검증 시점 순") + '</h3><div class="chips fcf" role="group" aria-label="사안별 전망 거르기" style="margin:0 0 8px">' + opts.filter(o => o[2]).map(o => '<button type="button" class="chip' + (o[0] === sel ? " on" : "") + '" data-fcf="' + o[0] + '" aria-pressed="' + (o[0] === sel) + '">' + esc(o[1]) + ' <span class="mono">' + o[2] + "</span></button>").join("") + '</div>' + (cc ? '<p class="note" style="margin:0 0 4px">사안의 가능한 전개마다, 성립 조건과 이어진 전망과 그 전개 쪽(또는 반대쪽)으로 기울게 하는 신호 전망을 묶었습니다. 전개의 확률은 사안 분석의 값이며, 같은 전망이 여러 전개에 나올 수 있습니다.</p>' + fcByBranch(cc, fs) : '<ul class="list">' + shown.map(f => forecastRow(f, false)).join("") + "</ul>") + "</section>"; })();
  fcCalTip();  /* v4.23 */
}

function frameworkHtml(){
  const F = D.meta.framework; if (!F) return "";
  return '<section class="sec method"><h3>분석 대상의 영역</h3><p class="note" style="margin-bottom:10px">사실에서 검증까지, 모든 판단은 앞 영역의 근거로 거슬러 올라가고 뒤 영역에서 검증되도록 구성했습니다. 영역마다 현재 갖춘 것과 보강이 필요한 것을 함께 밝힙니다.</p><ol class="fw">' +
    F.layers.map(l => '<li><div class="fw-h"><b>' + esc(l.n) + "</b><span>" + esc(l.q) + '</span></div><p><span class="ok">갖춤</span> ' + esc(l.have) + '</p><p><span class="gap">보강 필요</span> ' + esc(l.gap) + "</p></li>").join("") + "</ol></section>" +
    '<section class="sec method"><h3>보강이 필요한 요소</h3><ul class="list">' + F.missing.map(m => '<li class="rv"><b>' + esc(m.t) + (m.status ? ' <span class="fit ' + (m.status === "일부" ? "part" : "no") + '">' + esc(m.status) + "</span>" : "") + "</b><p>" + esc(m.d) + (m.now ? '<br><span class="note">현재 · ' + esc(m.now) + "</span>" : "") + "</p></li>").join("") + "</ul></section>";
}


function questionsHtml(){
  const F = D.philosophy;
  return '<section class="sec"><h3>목적에 제기되는 질문</h3><p class="note" style="margin-bottom:8px">개별 인간의 행복이라는 목적에 제기되는 철학적 질문과 주요 입장, 가장 강한 반론, 잠정적 답, 남는 문제, 그 답이 분석에 반영되는 방식을 정리했습니다.</p>' + F.questions.map(q =>
      '<details class="pq" id="pq-' + q.id + '"><summary><b>' + esc(q.id + ". " + q.title) + '</b> <span class="aim">' + (q.prev_answer && !PUB() ? "" : "잠정적 답") + '</span></summary><div class="pq-body">' +
      "<div><h5>지정학에서 부딪히는 장면</h5><p>" + esc(q.scene) + "</p></div>" +
      "<div><h5>주요 입장</h5><ul>" + q.positions.map(p => "<li><b>" + esc(p.who) + "</b> · " + esc(p.view) + "</li>").join("") + "</ul></div>" +
      '<div class="obj"><h5>가장 강한 반론</h5><p>' + esc(q.objection) + "</p></div>" +
      '<div class="ans"><h5>잠정적 답</h5><p style="color:var(--ink)">' + esc(q.answer) + "</p></div>" +
      (q.prev_answer && !PUB() ? '<div><h5></h5><p class="note">' + esc(q.prev_answer) + "</p></div>" : "") +
      "<div><h5>남는 문제</h5><p>" + esc(q.remains) + "</p></div>" +
      '<div class="rule"><h5>분석에 반영하는 방식</h5><p>' + (PUB() ? "" : "<b>" + esc(q.rule.id) + "</b> · ") + esc(q.rule.text) + "</p></div>" +
      "</div></details>").join("") + '<p class="note" style="margin-top:8px">' + esc(F.note) + "</p></section>";
}
function tocHtml(L){
  return '<nav class="toc" aria-label="이 탭의 단락">' + L.map(([id, t]) => '<button type="button" data-jump="' + id + '">' + esc(t) + "</button>").join("") + "</nav>";
}
function renderIdeas(){
  const H = D.history;
  $("#pane-ideas").innerHTML =
    '<div class="sec"><h2>역사와 사상</h2><p class="meta" style="margin-top:4px">역사적 선례 ' + H.analogies.length + "건 · 반복 유형 " + H.laws.length + "건 · 참고 사상가 " + D.thinkers.length + '명</p><p class="lead" style="margin-top:8px">분석의 배경이 되는 역사적 선례, 역사에서 되풀이되는 유형, 지정학 사상가의 관점을 모았습니다.</p></div>' +
    tocHtml([["i-an","역사적 선례"],["i-law","반복 유형"],["i-th","참고 사상가"]]) +
    '<section class="sec" id="i-an"><h3>역사적 선례 ' + ttsBtn("an") + '</h3><p class="note" style="margin-bottom:8px">현재 상황과 구조가 유사한 과거 사례와 그 전개, 현재에 대한 함의, 선례와 다른 점을 정리했습니다.</p><ul class="list">' + H.analogies.map(a => "<li>" + analogHtml(a, false) + "</li>").join("") + "</ul></section>" +
    '<section class="sec" id="i-law"><h3>역사적 반복 유형 ' + ttsBtn("law") + '</h3><ul class="list">' + H.laws.map(l => '<li class="law"><b>' + esc(l.t) + "</b><p>" + esc(l.d) + '</p><div class="chips" style="margin-top:4px">' + l.cases.map(chip).join("") + "</div></li>").join("") + "</ul></section>" +
    '<section class="sec" id="i-th"><h3>참고 사상가 ' + ttsBtn("th") + '</h3><p class="note" style="margin-bottom:8px">사상가마다 약력, 핵심 명제, 핵심 주장과 생각의 전개, 대표 구절, 비판과 한계, 현재 정세에 비추어 본 모습, 역사에 들어맞은 것과 어긋난 것을 정리했습니다. 핵심 명제의 \'예측\'은 세계가 어떻게 움직이는지에 관한 명제로 현실에서 맞고 틀림을 가릴 수 있고, \'평가\'는 무엇이 옳은지에 관한 명제입니다.</p>' +
      '<div class="chips th-idx">' + D.thinkers.map(t => '<a class="chip" href="#th-' + esc(t.id) + '">' + esc(t.name) + "</a>").join("") + "</div>" +
      '<ul class="list">' + D.thinkers.map(t => {
      const row = (k, v) => v ? "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>" : "";
      const props = (t.props || []).length ? '<ol class="props">' + t.props.map(p => '<li><span class="pk ' + (p.k === "예측" || p.k === "Predictive" ? "pk-f" : "pk-v") + '">' + esc(p.k) + "</span>" + esc(p.t) + "</li>").join("") + "</ol>" : "";
      const q = t.quote, quote = q ? '<blockquote class="tq">' + esc(q.ko) + "</blockquote>" + (q.orig && q.ko.replace(/["“”'‘’]/g, "").trim() !== q.orig.replace(/["“”'‘’]/g, "").trim() ? '<p class="tq-o">' + esc(q.orig) + "</p>" : "") + '<p class="tq-s">' + esc(q.src) + "</p>" : "";
      const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
      const grp = []; (t.sources || []).forEach(u => { const h = hostOf(u); let g = grp.find(x => x.h === h); if (!g) { g = {h, us: []}; grp.push(g); } g.us.push(u); });
      const srcs = grp.length ? '<p class="tsrc">' + grp.map(g => '<span class="tsg">' + esc(g.h) + " " + g.us.map((u, i) => '<a href="' + esc(u) + '" target="_blank" rel="noopener" title="' + esc(u) + '">' + (i + 1) + "</a>").join(" ") + "</span>").join(" · ") + "</p>" : "";
      return '<li id="th-' + esc(t.id) + '"><article class="thinker"><div class="who"><h4>' + esc(t.name) + '</h4><span class="meta">' + esc(t.life) + " · " + esc(t.role) + "</span>" + (t.sub ? '<span class="tsub">' + esc(t.sub) + "</span>" : "") + '</div><div class="works">' + esc(t.works) + "</div>" +
        "<dl>" + row("약력", esc(t.bio || "")) + row("핵심 명제", props) + row("핵심 주장", esc(t.claim || t.idea || "")) + row("생각의 전개", esc(t.develop || "")) + row("대표 구절", quote) + row("비판과 한계", esc(t.critique || "")) + row("현재 정세에 비추면", esc(t.now || "")) + row("들어맞은 것과 어긋난 것", esc(t.record || "")) + row("출처 N건".replace("N", (t.sources || []).length), srcs) + "</dl></article></li>";  /* v4.03 사상가 기본 정보 14명(2026-10-14 결재) */
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
    '<div class="sec"><h2>분석 방법</h2><p class="lead" style="margin-top:8px">클리사 지오폴리틱스의 목적과 판단의 구성, 검증 방식, 자료와 한계를 밝힙니다. 궁극적 목적은 개별 인간의 행복이며, 모든 분석의 방향을 정하는 기준입니다.</p>' + (pub ? "" : '<p class="note" style="margin-top:6px">' + esc(M.version) + (M.status ? " · " + esc(M.status) : "") + "</p>") + "</div>" +
    '<section class="sec"><h3>헌장' + (F.charter.status && !pub ? " · " + esc(F.charter.status) : "") + '</h3><div class="charter">' + F.charter.items.map(it => "<div><b>" + esc(it.k) + "</b><p>" + esc(it.t) + (it.by ? "<small>" + esc(it.by) + "</small>" : "") + "</p></div>").join("") + "</div></section>" + questionsHtml() + divisionHtml(M) +
    '<section class="sec"><h3>판단의 구성</h3><div class="tree"><div class="root">' + esc(T.root) + '</div><div class="arrow"></div>' +
      '<div class="layers">' + LY.map(l => '<div class="layer l' + l.id + '"><div class="lh"><b>' + esc(LNAME[l.id]) + "</b><span>" + esc(l.q) + '</span></div><p class="note">' + esc(l.d) + "</p>" +
        (inner ? '<ol class="steps" style="counter-reset:st ' + ((stepsOf(l.id)[0] || {n: 1}).n - 1) + '">' + stepsOf(l.id).map(st => "<li><div><b>" + esc(st.t) + "</b><p>" + esc(st.d) + "</p>" + st.rules.map(rc).join("") + "</div></li>").join("") + "</ol>" : "") + "</div>").join("") + "</div>" +
      '<div class="rules2"><div class="lesson-box"><b>편집 원칙 · 권고하지 않는 것의 유일한 기준</b>' + esc(T.editorial) + '</div><div class="lesson-box"><b>품질 기준</b>' + esc(T.quality) + "</div></div></div></section>" +
    (inner ? '<section class="sec method"><h3>단계별 명세</h3><p class="note" style="margin-bottom:8px">단계마다 목적, 입력, 핵심 질문, 산출물, 규칙, 흔한 실패를 명시합니다. 단계를 선택하면 펼쳐집니다.</p><div style="display:grid;gap:6px">' +
      M.steps.map(st => '<details class="mstep"><summary><i class="l' + st.L + '">' + st.n + "</i><b>" + esc(st.t) + "</b><em>" + esc(LNAME[st.L]) + (st.rules.length ? " · " + st.rules.join(" · ") : "") + "</em></summary><dl>" +
        "<dt>목적</dt><dd>" + esc(st.aim) + "</dd><dt>입력</dt><dd>" + esc(st.in) + "</dd><dt>핵심 질문</dt><dd><ul>" + st.ask.map(q => "<li>" + esc(q) + "</li>").join("") + "</ul></dd>" +
        "<dt>산출물</dt><dd>" + esc(st.out) + "</dd>" + (st.rules.length ? "<dt>규칙</dt><dd>" + st.rules.map(rc).join(" ") + "</dd>" : "") +
        '<dt>흔한 실패</dt><dd class="bad">' + esc(st.fail) + "</dd></dl></details>").join("") + "</div></section>" +
    '<section class="sec"><h3>규칙 · 부분별</h3>' + LY.map(l => { const rs = R.filter(r => r.L === l.id); return rs.length ? '<h4 class="rl-h">' + esc(LNAME[l.id]) + '</h4><ul class="list">' + rs.map(r => '<li style="display:grid;grid-template-columns:44px 1fr;gap:8px;font-size:13px;align-items:start">' + rc(r.id) + "<span>" + esc(r.text) + (r.from ? '<br><span class="note">' + esc(r.from) + "</span>" : "") + (r.prev ? '<details class="src" style="margin-top:4px"><summary></summary><p class="note">' + esc(r.prev) + "</p></details>" : "") + "</span></li>").join("") + "</ul>" : ""; }).join("") + "</section>" : "") +
    (M.changes && inner ? '<section class="sec method"><h3></h3><div class="tbl-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th></th><th></th><th></th></tr></thead><tbody>' + M.changes.map(x => "<tr><td><b>" + esc(x.t) + "</b></td><td>" + esc(x.was) + "</td><td>" + esc(x.now) + "</td></tr>").join("") + "</tbody></table></div></section>" : "") +
    (M.intent_types && inner ? '<section class="sec method"><h3>의지 지표 · 신호의 신뢰도</h3><p class="note" style="margin-bottom:8px">의지는 말보다 비용이 수반된 행동에서 먼저 확인합니다. 보내는 데 비용이 들고 되돌리기 어려운 신호일수록 신뢰도가 높습니다. 신뢰도가 높은 순서로 배열했습니다.</p><div class="tbl-wrap"><table class="tbl" style="min-width:600px"><thead><tr><th>신호</th><th>신뢰할 수 있는 이유</th><th>함정</th><th>예</th></tr></thead><tbody>' +
      M.intent_types.map(t => "<tr><td><b>" + esc(t.k) + "</b></td><td>" + esc(t.why) + '</td><td class="note">' + esc(t.trap) + "</td><td>" + esc(t.ex) + "</td></tr>").join("") + "</tbody></table></div></section>" : "") +
    (inner ? '<section class="sec method"><h3>산출 양식</h3><div class="tmpl">' + M.outputs.map(o => '<div class="' + (o.kind === "산출" ? "" : "chk") + '"><span class="kind">' + esc(o.kind) + "</span><b>" + esc(o.k) + "</b><p>" + esc(o.t) + "</p><ol>" + o.fields.map(x => "<li>" + esc(x) + "</li>").join("") + "</ol></div>").join("") + "</div></section>" : "") +
    (inner ? '<section class="sec method"><h3>' + esc(I.title) + ' · 공식과 출처</h3><p>' + esc(I.unit) + '</p><div class="idim" style="margin-top:8px">' + I.dims.map(d => "<div><b>" + esc(d.name) + "</b><code>" + esc(d.formula) + "</code><ul>" + d.parts.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul><small>출처 · " + esc(d.src) + "</small></div>").join("") + "</div>" +
      '<h3 style="margin-top:14px">지표의 규칙</h3><ul>' + (I.rules || []).map(x => "<li>" + esc(x) + "</li>").join("") + '</ul><h3 style="margin-top:14px">지표의 한계</h3><ul>' + I.limits.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>"
     : '<section class="sec method"><h3>' + esc(I.title) + '</h3><p>' + esc(I.unit) + (I.dims.length === 4 ? ' 지표는 ' + I.dims.map(d => esc(d.name)).join(", ") + '의 4개 차원으로 이루어지며, 차원들을 하나의 점수로 합치지 않습니다.' : "") + '</p><ul style="margin-top:6px">' + I.dims.map(d => "<li><b>" + esc(d.name) + "</b>" + (d.formula && I.dims.length !== 4 ? " · " + esc(d.formula) + (d.parts || []).map(x => ". " + esc(x)).join("") : "") + " · 출처 " + esc(d.src) + "</li>").join("") + '</ul><h3 style="margin-top:14px">지표의 한계</h3><ul>' + I.limits.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>") +
    '<section class="sec method"><h3>검증과 갱신</h3><ul>' + M.update.map(x => "<li>" + esc(x) + "</li>").join("") + "<li>국가 프로필, 분쟁지, 전망은 하나의 자료 파일에 담겨 있어, 새로 조사한 자료로 파일을 교체하면 사이트 전체가 갱신됩니다.</li><li>" + (pub ? "이미 공개한 판단을 바꿀 때는 전망과 검증 탭의 판단 변경 공지에 날짜와 변경 내용, 그 이유를 밝힙니다." : "") + "</li><li>전망은 삭제하지 않습니다. 검증 시점이 지나면 실현·불발을 밝히고 정확도에 반영합니다. 질문이 만들어진 시점에 이미 답이 정해져 있었던 전망은 무효로 표시하고 정확도에서 뺍니다.</li></ul></section>" +
    (inner ? frameworkHtml() : "") +
    '<section class="sec method"><h3>분석 범위</h3><p>' + esc(D.meta.scope) + ". 지도에 색이 있는 국가가 분석 대상이며, 회색은 아직 분석 범위 밖의 국가입니다. EU·NATO는 국가가 아니므로 별도 프로필로 다룹니다.</p></section>" +
    '<section class="sec method"><h3>수치와 점수</h3><ul>' + D.meta.method.map(m => "<li>" + esc(m) + "</li>").join("") + "</ul></section>" +
    (P && inner ? '<section class="sec"><details class="src"><summary>' + esc(P.label) + '</summary><div style="display:grid;gap:8px;margin-top:8px"><div class="charter">' + P.charter.items.map(it => "<div><b>" + esc(it.k) + "</b><p>" + esc(it.t) + "<small>" + esc(it.by) + "</small></p></div>").join("") + '</div><ul class="facts">' + P.gates.map(g => "<li><b>" + esc(g.label) + "</b> · " + esc(g.t) + " → " + esc(g.fail) + "</li>").join("") + "</ul></div></details></section>" : "") +
    '<p class="note" style="margin:4px 0 12px">역사적 선례, 반복 유형, 참고 사상가는 <button type="button" class="chip" data-go="ideas">역사와 사상 탭</button>에서 볼 수 있습니다. 국가별로 확인하지 못한 사항은 각 국가 화면에 있습니다.</p>' +
    ((D.meta.uncertain || []).length ? '<section class="sec method"><h3>자료 전반의 미확인 사항</h3><details class="src"><summary>특정 국가에 속하지 않는 항목 ' + D.meta.uncertain.length + "건</summary><ul>" + D.meta.uncertain.map(u => "<li>" + esc(u) + "</li>").join("") + "</ul></details></section>" : "") +
    '<section class="sec method"><h3>용어 해설</h3><div class="tbl-wrap"><table class="tbl"><tbody>' + M.terms.map(t => '<tr><td style="white-space:nowrap"><b>' + esc(t[0]) + "</b></td><td>" + esc(t[1]) + "</td></tr>").join("") + "</tbody></table></div></section>" +
    '<section class="sec method"><h3>자료 출처</h3><p class="note" style="margin-bottom:6px">클리사 지오폴리틱스의 분석은 AI(Anthropic의 Claude)의 도움을 받아 작성하고 편집진이 검토합니다.</p><ul><li>국경선: Natural Earth 1:50m (world-atlas). 국경 표기는 정치적 입장을 나타내지 않습니다.</li><li>국방비: SIPRI Military Expenditure Database · 핵탄두: SIPRI Yearbook 2026 · 병력: IISS Military Balance · 경제: IMF WEO</li></ul></section>';
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
  return '<span class="mailrow"><span class="mail"><a href="' + esc(href) + '">' + MAIL + '</a></span><button type="button" class="copy-btn" data-copy="' + MAIL + '">주소 복사</button></span>';
}
/* v3.78 복사할 때 출처를 덧붙인다(2026-10-07 결재). 본문을 40자 이상 골라 복사하면 붙여 넣은 글 끝에 사이트 이름과 그 화면의 주소가 따라간다. 짧은 낱말과 검색창·입력칸 복사는 그대로 둔다 */
document.addEventListener("copy", e => {
  const sel = window.getSelection && getSelection(); if (!sel || sel.isCollapsed || !e.clipboardData) return;
  const a = document.activeElement; if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable)) return;
  const t = sel.toString(); if (t.replace(/\s+/g, "").length < 40) return;
  const url = location.origin + location.pathname + location.hash, box = document.createElement("div");
  for (let i = 0; i < sel.rangeCount; i++) box.appendChild(sel.getRangeAt(i).cloneContents());
  e.clipboardData.setData("text/plain", t.replace(/\s+$/, "") + "\n\n출처: 클리사 지오폴리틱스(" + url + ")");
  e.clipboardData.setData("text/html", box.innerHTML + '<p>출처: <a href="' + esc(url) + '">클리사 지오폴리틱스</a>(' + esc(url) + ")</p>");
  e.preventDefault();
});
function footHtml(noMail){
  return '<footer class="site-foot">' + (noMail ? "" : '<p class="fb">사실의 오류나 판단에 대한 반대 근거는 아래 주소로 알려 주십시오. 확인된 오류는 바로잡고 그 내역을 밝힙니다.</p>' +
    mailRow("[클리사 지오폴리틱스] 의견")) +
    "<p>클리사 지오폴리틱스의 분석은 AI(Anthropic의 Claude)의 도움을 받아 작성하고 편집진이 검토합니다.</p>" +
    "<p>이 사이트의 내용은 정보 제공을 위한 분석이며 투자·법률·정책 자문이 아닙니다. 확률 전망은 판단 근거와 함께 제시한 추정치입니다.</p>" +
    "<p>이 사이트는 회원 가입이 없습니다. 의견 메일로 받은 주소와 내용은 답신과 오류 정정에만 사용하며, 처리 후 1년 뒤 삭제됩니다.</p>" +
    '<p>© 2026 고재성 · <a href="/about/">운영자 인사말</a> · <a href="/subscribe/">새 글 알림</a></p>' +
    "<p>클리사 지오폴리틱스의 화면·문안과 자료 편집물은 저작권법의 보호를 받습니다. 링크 공유와 부분 인용은 가능하며, 인용할 때는 '클리사 지오폴리틱스'와 해당 페이지 주소를 출처로 밝혀 주십시오(본문을 40자 이상 복사하면 출처가 자동으로 붙습니다). 전부 또는 상당 부분을 복제·재배포하려면 <a href='mailto:clisageo@clisa.ai'>clisageo@clisa.ai</a>로 먼저 허락을 받아 주십시오.</p></footer>";
}
function caseFbHtml(c){
  const name = String(c.title || "").split(":")[0];
  return '<div class="case-fb"><b>이 분석에 대한 의견</b><span>' + esc(name) + " 분석의 사실 오류나 반대 근거, 빠진 선례가 있으면 알려 주십시오. 제목에 사안 이름을 적어 주시면 확인이 빠릅니다.</span>" + mailRow("[클리사 지오폴리틱스] " + name + " 분석 의견") + "</div>";
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
const INFO = [["method", "분석 방법"], ["guide", "이용 안내"], ["about", "운영자 인사말"]];
const infoUrl = k => "/" + k + "/";
renderMethod = (f => function(){ f(); infoWrap(); })(renderMethod);
function infoWrap(){
  const pn = $("#pane-method"); if (pn.querySelector(".info-nav")) return;
  const top = document.createElement("div"); top.className = "sec info-top";
  top.innerHTML = '<h2>사이트 안내</h2><div class="chips info-nav">' + INFO.map(([k, t]) => '<a class="chip" href="' + infoUrl(k) + '" data-info="' + k + '">' + t + "</a>").join("") + "</div>";
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
  if (t === "brief") { if (!BR) return /^\/(brief|life)\//.test(location.pathname) ? location.pathname : "/life/"; const c = briefCur(); return c && BR && S.bdate ? "/brief/" + c.date + "/" : "/life/"; }  /* v3.99: 국민의 삶은 /life/, 날짜별 브리핑 전문은 /brief/날짜/ */
  if (t === "feature") { const L = FEATS(), c = L.find(F => F.id === S.feat); return "/feature/" + (c && c !== L[0] ? c.id + "/" : ""); }
  if (t === "page") return location.pathname;
  if (t === "method") return "/" + (S.info || "method") + "/";
  if (t === "forecast" && S.ffc) return "/forecast/" + S.ffc + "/";  /* v4.22 전망별 화면 */
  if (/^(grand|ideas|forecast|industry)$/.test(t)) return "/" + t + "/";
  if (t === "detail") return S.sel && hasPage(S.sel) ? "/country/" + S.sel + "/" : "/";
  return null;
}
function routeSync(rep){
  if (!ROUTES || !HASH_READY || !D) return;
  const r = routeOf(); if (!r || (r === location.pathname && !location.hash && !location.search)) return;
  try { history[rep ? "replaceState" : "pushState"](null, "", r); } catch(e){}
  document.title = titleOf();
}
function applyRoute(){
  if (!ROUTES) return false;
  const p = location.pathname, ss = D.strategies || []; let m;
  if ((m = p.match(/^\/case\/([a-z0-9-]+)\/?$/)) && ss.some(c => c.id === m[1])) { goCase(m[1]); return true; }
  if (/^\/case\/?$/.test(p)) { S.scase = null; switchTab("strat"); return true; }
  if ((m = p.match(/^\/country\/([A-Z]{3})\/?$/)) && D.countries[m[1]]) { selectCountry(m[1], true); return true; }
  if ((m = p.match(/^\/brief\/(\d{4}-\d{2}-\d{2})\/?$/))) {
    if (BR && !BR.issues.some(x => x.date === m[1])) { pageGo(p); return true; }
    S.bdate = m[1]; renderBrief(); switchTab("brief"); return true; }
  if (/^\/life\/?$/.test(p)) { S.bdate = null; renderBrief(); switchTab("brief"); return true; }
  if (/^\/brief\/?$/.test(p)) { switchTab("overview"); requestAnimationFrame(() => { const b = document.getElementById("brief"); if (b) b.scrollIntoView({block: "start"}); }); return true; }  /* v3.99: 정세 브리핑은 세계 정세 맨 위 */
  if (/^\/industry\/?$/.test(p)) { switchTab("industry"); return true; }
  if ((m = p.match(/^\/feature\/([\w-]+)\/?$/)) && FEATS().some(F => F.id === m[1])) { goFeat(m[1]); return true; }
  if (/^\/feature\/?$/.test(p)) { goFeat(null); return true; }
  if ((m = p.match(/^\/(method|guide|about)\/?$/))) { infoGo(m[1]); return true; }  /* v3.79 사이트 안내 탭 하나에 3개 부분 */
  if (/^\/(leader|power|subscribe)(\/|$)/.test(p)) { pageGo(p); return true; }
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
  if (t === "brief") { const c = BR && S.bdate && briefCur(), m = c && /^(\d{4})-(\d{2})-(\d{2})/.exec(c.date); return (m ? "정세 브리핑 " + (+m[1]) + "년 " + (+m[2]) + "월 " + (+m[3]) + "일" : gl("brief")) + sx; }
  if (t === "feature") { const L = FEATS(), c = L.find(F => F.id === S.feat); return (c && c !== L[0] ? c.title : gl("feature")) + sx; }
  if (t === "detail") return S.sel && hasPage(S.sel) ? D.countries[S.sel].name_ko + " 정세와 대전략" + sx : SITE_T;
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
const SOFT_RE = /^\/(?:$|(?:case|country|brief|life|industry|feature|leader|power|guide|about|subscribe|grand|ideas|method|forecast)(?:\/|$))/;
document.addEventListener("click", ev => {
  if (!ROUTES || !D || ev.defaultPrevented || ev.button || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
  const a = ev.target.closest("a[href]"); if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
  let u; try { u = new URL(a.getAttribute("href"), location.href); } catch(e){ return; }
  if (u.origin !== location.origin || !SOFT_RE.test(u.pathname) || /\.[a-z0-9]+$/i.test(u.pathname)) return;
  if (u.pathname === location.pathname && u.hash) {  /* v3.79 쪽 안의 바로가기(권력 구조의 나라 단추): 이전 화면으로 돌아올 수 있게 기록하고, 나라면 지구본도 옮긴다 */
    const id = decodeURIComponent(u.hash.slice(1)), t = a.closest("#pane-page") && document.getElementById(id);
    if (t) { ev.preventDefault(); navPush(); t.scrollIntoView({block: "start"}); if (/^[A-Z]{3}$/.test(id)) countryView(id); }
    return;
  }
  ev.preventDefault();
  const g = a.closest("details.gmore"); if (g) g.open = false;
  if (!a.closest(".gnav")) navPush();
  if (isPagePath(u.pathname)) { pageGo(u.href, true); return; }
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
  const set = on => { app.classList.toggle("wide", on); b.setAttribute("aria-pressed", on); b.title = on ? "지구본 넓히기" : "읽기 영역 넓히기"; b.setAttribute("aria-label", b.title); store.set("ep.wide", on ? "1" : "0"); };
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
  if (ev.target.closest("[data-case],[data-fcgo],[data-feat],[data-iso],[data-fp],[data-go],[data-exit],[data-q],[data-fcf],[data-fcd],[data-golife],[data-goind],#bstrip,#srchres [data-sri]")) navPush();
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
  const st = {yes: "실현", no: "불발", void: "무효"}[F.status];
  const ef = chip.classList.contains("bfc-up") ? "up" : chip.classList.contains("bfc-down") ? "down" : chip.classList.contains("bfc-none") ? "none" : null;
  const EF = {up: ["↑", "확률 상승 요인"], down: ["↓", "확률 하락 요인"], none: ["–", "변화 없음"]};
  const el = document.createElement("div"); el.id = "fcpop"; el.dataset.for = id; el._chip = chip; el.setAttribute("role", "dialog");
  el.innerHTML = '<div class="fcp-h"><span class="mono">' + esc(id) + "</span> 전망 · " + (st ? esc(st) : "현재 " + F.p + "%") + '<button type="button" class="fcp-x" aria-label="닫기">×</button></div><p>' + esc(F.q) + "</p>" +
    (ef ? '<p class="fcp-e">이 사건 · <b class="fe-' + ef + '">' + EF[ef][0] + "</b> " + EF[ef][1] + "</p>" : "") +
    '<p class="fcp-d">검증 시점 <span class="mono">' + esc(F.due) + '</span></p><button type="button" class="chip" data-fcgo="' + esc(id) + '">전망과 검증에서 보기 →</button>';
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
const CLOCKS = [["서울·도쿄", "Asia/Seoul"], ["베이징·타이베이", "Asia/Shanghai"], ["테헤란", "Asia/Tehran"], ["모스크바", "Europe/Moscow"], ["키이우", "Europe/Kyiv"], ["브뤼셀", "Europe/Brussels"], ["런던", "Europe/London"], ["워싱턴·뉴욕", "America/New_York"]];
(function(){
  const el = document.getElementById("clocks"); if (!el || !window.Intl) return;
  const fm = {}; const F = tz => fm[tz] || (fm[tz] = new Intl.DateTimeFormat("en-GB", {timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false}));
  const D_ = {}; const Fd = tz => D_[tz] || (D_[tz] = new Intl.DateTimeFormat("en-CA", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"}));
  el.innerHTML = CLOCKS.map(([c, tz]) => '<span class="clk" data-tz="' + tz + '"><span class="c">' + c + '</span><span class="t"></span><span class="d"></span></span>').join("");
  const tick = () => { const now = new Date(), seoul = Fd("Asia/Seoul").format(now);
    el.querySelectorAll(".clk").forEach(x => { const tz = x.dataset.tz; const tt = F(tz).format(now); x.querySelector(".t").innerHTML = tt.slice(0, 2) + '<b class="' + (now.getSeconds() % 2 ? "off" : "") + '">:</b>' + tt.slice(3, 5); const d = Fd(tz).format(now); x.querySelector(".d").textContent = d === seoul ? "" : d < seoul ? "−1일" : "+1일"; }); };
  try { tick(); el.hidden = false; setInterval(() => { if (document.visibilityState === "visible") tick(); }, 1000); } catch (e) { el.hidden = true; }
  /* 검색창이 둘째 줄로 밀리면(글꼴·배율 때문에 폭이 모자랄 때) 시각을 숨겨 머리글을 한 줄로 지킨다 */
  const sb = document.getElementById("srchopen"), h1 = document.querySelector(".brand h1");
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
  const lt = mTopList(), tx = lt ? "↑ 목록" : TOP_TX; if (topBtn.textContent !== tx) topBtn.textContent = tx; topBtn.classList.toggle("totop-l", !!lt);
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
  const done = ok => { b.textContent = ok ? "복사했습니다" : "주소를 선택했습니다"; setTimeout(() => b.textContent = old, 1600); };
  const sel = () => { const m = b.parentElement.querySelector(".mail"); if (m) { const r = document.createRange(); r.selectNodeContents(m); const w = getSelection(); w.removeAllRanges(); w.addRange(r); } done(false); };
  try { navigator.clipboard.writeText(v).then(() => done(true), sel); } catch(e){ sel(); }
});
})();

/*langsw-ko*/(function(){ const EN_PENDING = ["/case/poland/", "/power/POL/"]; const upd = () => { const a = document.getElementById("langsw"); if (a) a.setAttribute("href", EN_PENDING.some(x => location.pathname.startsWith(x)) ? "/en/" : "/en" + location.pathname + location.search + location.hash); };
  ["pushState", "replaceState"].forEach(k => { const o = history[k]; history[k] = function(){ const r = o.apply(this, arguments); upd(); return r; }; });
  addEventListener("popstate", upd); addEventListener("hashchange", upd); upd(); })();/*/langsw-ko*/
