/* 메일 구독 창(1101p·1105, 국영문). 주간 정세 요약 쪽 머리, 특집 끝, 새 글 알림 쪽(/subscribe/) 맨 위. 바닥글 처리방침 문장. */
(function(){
  var EN = /^\/en\//.test(location.pathname), B = EN ? "/en/" : "/";
  var T = EN ? {
    h: "Get updates by email",
    d: "Every week we send the Weekly Situation Summary and the Geopolitical Heat Map. We also send new feature articles and announcements as they come out.",
    ph: "Email address", b: "Subscribe",
    n: "Each email is written in both English and Korean. Your subscription starts when you click the button in the confirmation email. You can unsubscribe at any time. By subscribing, you agree to the ",
    c: "We send the Weekly Situation Summary and the Geopolitical Heat Map every week, each email in both English and Korean. By subscribing, you agree to the ",
    pv: "Privacy Policy", more: /More features/, acct: /no user accounts/,
    foot: " Addresses received through newsletter sign-ups are handled as described in the "
  } : {
    h: "메일로 받아 보기",
    d: "매주 주간 정세 요약과 지정학 시황판을 보내 드립니다. 새 특집이나 새 소식이 있으면 특집과 소식도 보내 드립니다.",
    ph: "이메일 주소", b: "신청",
    n: "이메일은 영문과 국문으로 작성됩니다. 확인 메일의 단추를 누르시면 구독이 시작됩니다. 언제든 해지할 수 있습니다. 신청하시면 ",
    c: "매주 주간 정세 요약과 지정학 시황판을 영문과 국문으로 보내 드립니다. 신청하시면 ",
    pv: "개인정보 처리방침", more: /다른 특집/, acct: /회원 가입이 없습니다/,
    foot: " 메일 구독 신청으로 받은 주소는 "
  };
  var PV = '<a href="' + B + 'privacy/">' + T.pv + '</a>';
  var NOTE = EN ? T.n + PV + "." : T.n + PV + "에 동의하신 것으로 봅니다.";
  var FOOT = EN ? T.foot + PV + "." : T.foot + PV + "에 따라 다룹니다.";
  var CNOTE = EN ? T.c + PV + "." : T.c + PV + "에 동의하신 것으로 봅니다.";
  /* k: "box" 특집 끝(제목·설명·안내), "slot" 새 글 구독 쪽(쪽의 h2가 제목), "c" 주간 정세 요약 쪽 머리(한 줄) */
  function box(k){
    var d = document.createElement("div"); d.className = "sub2" + (k === "c" ? " c" : k === "slot" ? " s" : "");
    var F = '<form action="https://buttondown.com/api/emails/embed-subscribe/clisa" method="post" target="_blank">' +
      '<input type="email" name="email" required autocomplete="email" placeholder="' + T.ph + '" aria-label="' + T.ph + '">' +
      '<input type="hidden" name="embed" value="1"><button type="submit">' + T.b + '</button></form>';
    if (k === "c") d.innerHTML = '<div class="row"><b>' + T.h + '</b>' + F + '</div><p class="sn">' + CNOTE + '</p>';
    else d.innerHTML = (k === "slot" ? "" : '<h3>' + T.h + '</h3>') + '<p class="sd">' + T.d + '</p>' + F + '<p class="sn">' + NOTE + '</p>';
    return d;
  }
  var RX = new RegExp("^" + B.replace(/\//g, "\\/") + "digest\\/");
  function place(){
    var pg = document.querySelector("#pane-page:not([hidden]) .page-pre");
    if (pg && !pg.querySelector(".sub2")) {
      var sl = pg.querySelector(".sub2-slot");
      if (sl) { sl.innerHTML = ""; sl.appendChild(box("slot")); }
      else if (RX.test(location.pathname)) {
        var h1 = pg.querySelector("h1");
        if (h1) { var nx = h1.nextElementSibling; while (nx && /\b(meta|tts-row)\b/.test(nx.className || "")) nx = nx.nextElementSibling; h1.parentNode.insertBefore(box("c"), nx); }
      }
    }
    var ft = document.querySelector("#pane-feature:not([hidden])");
    if (ft && ft.querySelector("details.src, section.fnotes") && !ft.querySelector(".sub2")) {
      var more = null; ft.querySelectorAll("section.sec").forEach(function(s){ var h = s.querySelector("h3"); if (h && T.more.test(h.textContent)) more = s; });
      if (more) more.parentNode.insertBefore(box("box"), more);
    }
    document.querySelectorAll(".site-foot p").forEach(function(q){
      if (T.acct.test(q.textContent) && !q.querySelector(".pvl")) q.insertAdjacentHTML("beforeend", '<span class="pvl">' + FOOT + '</span>');
    });
  }
  var t = 0; function later(){ clearTimeout(t); t = setTimeout(place, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", place); else place();
  new MutationObserver(later).observe(document.body || document.documentElement, {childList: true, subtree: true});
})();
