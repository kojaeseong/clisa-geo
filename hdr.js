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
    thLabel(); try { if (typeof readColors === "function") { readColors(); if (typeof requestDraw === "function") requestDraw(true); } } catch (e) {} }
  if (th) { thLabel(); th.addEventListener("click", function(){ thSet(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); }); }
  /* 읽기 영역 넓히기 단추를 없앴으므로 늘 넓게 읽는다(전에 좁게 고른 방문자도) */
  try { var ap = document.querySelector(".app"); if (ap && !ap.classList.contains("wide")) { ap.classList.add("wide"); localStorage.setItem("ep.wide", "1"); dispatchEvent(new Event("resize")); } } catch (e) {}
  function all(){ place(); knobs(); CL.forEach(build); }
  all(); addEventListener("resize", all); addEventListener("load", all); if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
})();
