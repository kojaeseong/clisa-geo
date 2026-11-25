/* 2026-11-26 대통령님 결재: 영상은 작은 카드(첫 장면·길이)로 접어 두고, 누르면 그 자리에서 펼쳐 재생한다.
   2026-11-25 대통령님 결재: 사이트 영상을 유튜브 재생으로 바꾼다.
   /video/<이름>.mp4 를 가리키는 <video>를 찾아, 정지 화면(같은 포스터)과 재생 단추로 바꾸고,
   누르면 그 자리에서 유튜브 재생기(youtube-nocookie, 끝난 뒤 추천은 같은 채널)를 불러온다.
   누르기 전에는 유튜브에서 아무것도 받지 않는다. 스크립트가 없으면 링크로 유튜브에서 열린다. */
(function () {
  var MAP = {
    "digest-2026-11-23-ko": "cfnE6FTuO7s",
    "digest-2026-11-23-en": "YfyYO0QBL6U",
    "feature-2026-11-22-g20-ko": "gynrl82Ldik",
    "feature-2026-11-22-g20-en": "HrwEwqFE8A0",
    "feature-2026-11-18-lameduck-ko": "HKVU5c5XlTI",
    "feature-2026-11-18-lameduck-en": "lvGK_Wtxw7A",
    "feature-2026-10-28-icbm-ko": "Tckd4wpaYx4",
    "feature-2026-10-28-icbm-en": "YxUkVmXhhzU"
  };
  var EN = /^\/en(\/|$)/.test(location.pathname);
  var CSS = ".ytf{position:relative;display:block;width:100%;max-width:340px;aspect-ratio:9/16;margin:0 auto;border-radius:10px;overflow:hidden;background:#0A0A0A center/cover no-repeat;cursor:pointer;border:0;padding:0;color:#fff;text-decoration:none}" +
    ".ytf:focus-visible{outline:3px solid #3D7BFF;outline-offset:3px}" +
    ".ytf .p{position:absolute;left:50%;top:50%;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;background:rgba(10,10,10,.62);border:2px solid rgba(255,255,255,.9);box-shadow:0 4px 18px rgba(0,0,0,.45)}" +
    ".ytf .p:after{content:'';position:absolute;left:30px;top:22px;border-style:solid;border-width:16px 0 16px 26px;border-color:transparent transparent transparent #fff}" +
    ".ytf:hover .p{background:rgba(232,34,43,.9);border-color:#fff}" +
    "iframe.ytp{display:block;width:100%;max-width:340px;aspect-ratio:9/16;margin:0 auto;border:0;border-radius:10px;background:#0A0A0A}" +
    ".ytc{display:flex;align-items:center;gap:14px;width:100%;max-width:440px;margin:0 auto;padding:8px 14px 8px 8px;box-sizing:border-box;border:1px solid rgba(128,128,128,.35);border-radius:12px;background:rgba(128,128,128,.06);color:inherit;text-decoration:none;cursor:pointer;text-align:left;font:inherit}" +
    ".ytc:hover{border-color:#E8222B}.ytc:focus-visible{outline:3px solid #3D7BFF;outline-offset:3px}" +
    ".ytc .th{position:relative;flex:none;width:72px;aspect-ratio:9/16;border-radius:7px;background:#0A0A0A center/cover no-repeat}" +
    ".ytc .th:after{content:'';position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(232,34,43,.92) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 7l9 5-9 5z' fill='white'/%3E%3C/svg%3E\") center/18px no-repeat;box-shadow:0 2px 8px rgba(0,0,0,.4)}" +
    ".ytc .tx{display:flex;flex-direction:column;gap:3px;min-width:0}" +
    ".ytc .t1{font-weight:700;font-size:16px;line-height:1.3}" +
    ".ytc .t2{font-size:13px;line-height:1.35;opacity:.72}";
  function key(src) { var m = /\/video\/([^\/?#]+)\.mp4/.exec(src || ""); return m ? m[1] : null; }
  function play(a, id) {
    var f = document.createElement("iframe");
    f.className = "ytp";
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
    f.title = a.getAttribute("aria-label") || "YouTube";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    a.parentNode.replaceChild(f, a);
  }
  function swap(v) {
    var k = key(v.getAttribute("src")), id = k && MAP[k];
    if (!id) return;
    var a = document.createElement("a");
    a.className = "ytc";
    a.href = "https://www.youtube.com/shorts/" + id;
    var fig = v.closest ? v.closest("figure") : null, cap = fig && fig.querySelector("figcaption");
    var m = cap && /(\d+분 \d+초|\d+:\d\d)\s*$/.exec(cap.textContent || ""), dur = m ? m[1] : "";
    var said = dur; if (EN && /^\d+:\d\d$/.test(dur)) { var p = dur.split(":"); said = (+p[0]) + " minute" + (+p[0] === 1 ? "" : "s") + " " + (+p[1]) + " second" + (+p[1] === 1 ? "" : "s"); }
    a.setAttribute("aria-label", (EN ? "Play video" : "영상 재생") + (said ? ", " + said : ""));
    a.setAttribute("role", "button");
    var poster = v.getAttribute("poster");
    var th = '<span class="th"' + (poster ? ' style="background-image:url(\'' + poster.replace(/'/g, "%27") + '\')"' : "") + '></span>';
    a.innerHTML = th + '<span class="tx"><span class="t1">' + (EN ? "Watch the video" : "영상으로 보기") + (dur ? " · " + dur : "") + '</span><span class="t2">' + (EN ? "Plays right here" : "누르면 이 자리에서 펼쳐 재생합니다") + '</span></span>';
    try { a.style.color = getComputedStyle(fig || v.parentNode).color; } catch (e) {}
    if (cap && /^\s*(영상으로 보기|Watch the video)/.test(cap.textContent || "")) cap.style.display = "none";
    a.addEventListener("click", function (e) { e.preventDefault(); play(a, id); });
    v.parentNode.replaceChild(a, v);
  }
  function scan(root) {
    var vs = (root || document).querySelectorAll ? (root || document).querySelectorAll("video[src*='/video/']") : [];
    for (var i = 0; i < vs.length; i++) swap(vs[i]);
  }
  function init() {
    var s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
    scan(document);
    if (window.MutationObserver) new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
        var n = ms[i].addedNodes[j];
        if (n.nodeType !== 1) continue;
        if (n.tagName === "VIDEO") swap(n); else scan(n);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
