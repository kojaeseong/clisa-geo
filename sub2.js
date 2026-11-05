/* 새 글 구독(1101p·1105, 국영문).
   v4.84(2026-11-05 대통령님 결재): 특집 끝·주간 정세 요약 쪽 머리의 메일 신청 창을 '새 글 구독' 단추 줄로 바꾼다.
   단추는 새 글 구독 쪽(/subscribe/: 메일과 RSS를 고르는 쪽)으로 가고, 그 쪽 맨 위·맨 아래에 '읽던 글로 돌아가기' 단추를 둔다.
   메일 신청 창은 새 글 구독 쪽에만 둔다. 바닥글 처리방침 문장. 바닥글이 빠져 있던 탭(정세 브리핑·특집·산업·권역)에 사이트 바닥글을 붙인다. */
(function(){
  var EN = /^\/en\//.test(location.pathname), B = EN ? "/en/" : "/";
  var T = EN ? {
    d: "The Weekly Situation Summary and the Geopolitical Heat Map arrive every week, along with new feature articles and announcements as they come out.",
    ph: "Email address", b: "Subscribe",
    n: "Each email is written in both English and Korean. Your subscription starts when you click the button in the confirmation email. You can unsubscribe at any time. By subscribing, you agree to the ",
    pv: "Privacy Policy", more: /More features/, acct: /no user accounts/,
    foot: " Addresses received through newsletter sign-ups are handled as described in the ",
    go: "Subscribe to Updates",
    lf: "Get the Weekly Situation Summary and the Geopolitical Heat Map by email every week, or get every new post, including the Geopolitical Briefing, in a feed reader (RSS) as soon as it is published.",
    ld: "Get the Weekly Situation Summary by email or in a feed reader (RSS).",
    back: "← Back to what you were reading"
  } : {
    d: "매주 주간 정세 요약과 지정학 시황판을 보내 드립니다. 새 특집이나 새 소식이 있으면 특집과 소식도 보내 드립니다.",
    ph: "이메일 주소", b: "신청",
    n: "이메일은 영문과 국문으로 작성됩니다. 확인 메일의 단추를 누르시면 구독이 시작됩니다. 언제든 해지할 수 있습니다. 신청하시면 ",
    pv: "개인정보 처리방침", more: /다른 특집/, acct: /회원 가입이 없습니다/,
    foot: " 메일 구독 신청으로 받은 주소는 ",
    go: "새 글 구독",
    lf: "이메일로는 매주 주간 정세 요약과 지정학 시황판을, 구독 앱(RSS)으로는 정세 브리핑을 비롯한 모든 새 글을 나올 때마다 받아 보실 수 있습니다.",
    ld: "주간 정세 요약을 매주 이메일이나 구독 앱(RSS)으로 받아 보실 수 있습니다.",
    back: "← 읽던 글로 돌아가기"
  };
  var PV = '<a href="' + B + 'privacy/">' + T.pv + '</a>';
  var NOTE = EN ? T.n + PV + "." : T.n + PV + "에 동의하신 것으로 봅니다.";
  var FOOT = EN ? T.foot + PV + "." : T.foot + PV + "에 따라 다룹니다.";
  var SUB = new RegExp("^" + B.replace(/\//g, "\\/") + "subscribe\\/?$");
  var KEY = "sub2from";
  function okPath(p){ return typeof p === "string" && /^\/(?!\/)/.test(p) && !SUB.test(p.split(/[?#]/)[0]); }
  function remember(){ try { sessionStorage.setItem(KEY, JSON.stringify({p: location.pathname + location.search + location.hash, t: Date.now()})); } catch(e){} }
  function fromPath(){
    var q = null; try { q = new URLSearchParams(location.search).get("from"); } catch(e){}
    if (okPath(q)) return q;
    try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s && okPath(s.p) && Date.now() - s.t < 3 * 3600 * 1000) return s.p; } catch(e){}
    return null;
  }
  function fresh(){ try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); return !!(s && Date.now() - s.t < 15000); } catch(e){ return false; } }  /* 방금 단추로 넘어왔으면 휴대전화에서 지구본 아래의 쪽 머리(돌아가기 단추)로 내려 준다 */
  /* 새 글 구독 쪽으로 가는 모든 링크(메뉴·바닥글·단추)를 누를 때 읽던 주소를 기억한다 */
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var u; try { u = new URL(a.getAttribute("href"), location.href); } catch(x){ return; }
    if (u.origin === location.origin && SUB.test(u.pathname) && !SUB.test(location.pathname)) remember();
  }, true);
  function form(){
    var d = document.createElement("div"); d.className = "sub2 s";
    d.innerHTML = '<p class="sd">' + T.d + '</p><form action="https://buttondown.com/api/emails/embed-subscribe/clisa" method="post" target="_blank">' +
      '<input type="email" name="email" required autocomplete="email" placeholder="' + T.ph + '" aria-label="' + T.ph + '">' +
      '<input type="hidden" name="embed" value="1"><button type="submit">' + T.b + '</button></form><p class="sn">' + NOTE + '</p>';
    return d;
  }
  function row(line){
    var d = document.createElement("div"); d.className = "sub2b";
    d.innerHTML = '<p>' + line + '</p><a class="sub2go" href="' + B + 'subscribe/">' + T.go + '</a>';
    return d;
  }
  function back(){ var p = fromPath(); if (!p) return null; var a = document.createElement("a"); a.className = "sub2back"; a.href = p; a.textContent = T.back; return a; }
  var RX = new RegExp("^" + B.replace(/\//g, "\\/") + "digest\\/");
  var FOOTLESS = ["pane-brief", "pane-industry", "pane-feature", "pane-region"];
  function place(){
    var pg = document.querySelector("#pane-page:not([hidden]) .page-pre");
    if (pg && !pg.querySelector(".sub2, .sub2b")) {
      var sl = pg.querySelector(".sub2-slot");
      if (sl) {
        sl.innerHTML = ""; sl.appendChild(form());
        var top = back(), h1 = pg.querySelector("h1");
        if (top) { var ey = pg.querySelector(".eyebrow") || h1; ey.parentNode.insertBefore(top, ey); if (fresh()) setTimeout(function(){ var r = top.getBoundingClientRect(); if (r.top > innerHeight * 0.5) top.scrollIntoView({block: "start"}); }, 80); var bt = back(); var pf = pg.querySelector(".pfoot"); if (bt && pf) { bt.classList.add("end"); pf.parentNode.insertBefore(bt, pf); } }
      } else if (RX.test(location.pathname)) {
        var h = pg.querySelector("h1");
        if (h) { var nx = h.nextElementSibling; while (nx && /\b(meta|tts-row)\b/.test(nx.className || "")) nx = nx.nextElementSibling; h.parentNode.insertBefore(row(T.ld), nx); }
      }
    }
    var ft = document.querySelector("#pane-feature:not([hidden])");
    if (ft && ft.querySelector("details.src, section.fnotes") && !ft.querySelector(".sub2b")) {
      var more = null; ft.querySelectorAll("section.sec").forEach(function(s){ var q = s.querySelector("h3"); if (q && T.more.test(q.textContent)) more = s; });
      if (more) more.parentNode.insertBefore(row(T.lf), more);
    }
    if (typeof window.CLISA_FOOT === "function") FOOTLESS.forEach(function(id){
      var el = document.getElementById(id);
      if (el && !el.hidden && el.children.length && !el.querySelector(":scope > .site-foot")) el.insertAdjacentHTML("beforeend", window.CLISA_FOOT(false));
    });
    document.querySelectorAll(".site-foot p").forEach(function(q){
      if (T.acct.test(q.textContent) && !q.querySelector(".pvl")) q.insertAdjacentHTML("beforeend", '<span class="pvl">' + FOOT + '</span>');
    });
  }
  var t = 0; function later(){ clearTimeout(t); t = setTimeout(place, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", place); else place();
  new MutationObserver(later).observe(document.body || document.documentElement, {childList: true, subtree: true});
})();
