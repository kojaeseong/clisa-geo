/* 2026-11-25 대통령님 결재: 사이트 영상을 유튜브 재생으로 바꾼다.
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
    "iframe.ytp{display:block;width:100%;max-width:340px;aspect-ratio:9/16;margin:0 auto;border:0;border-radius:10px;background:#0A0A0A}";
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
    a.className = "ytf";
    a.href = "https://www.youtube.com/shorts/" + id;
    a.setAttribute("aria-label", EN ? "Play video" : "영상 재생");
    var poster = v.getAttribute("poster");
    if (poster) a.style.backgroundImage = "url('" + poster.replace(/'/g, "%27") + "')";
    var m = v.getAttribute("style") || "";
    var mm = /margin:([^;]+)/.exec(m); if (mm) a.style.margin = mm[1];
    a.innerHTML = '<span class="p"></span>';
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
