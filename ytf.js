/* 2026-11-28 대통령님 지시: 행복 지표 특집 숏츠 국영문 2편씩을 작은 단추로(MAP 값이 목록인 경우).
   2026-11-26 대통령님 결재: 영상은 작은 카드(첫 장면·길이)로 접어 두고, 누르면 그 자리에서 펼쳐 재생한다.
   2026-11-25 대통령님 결재: 사이트 영상을 유튜브 재생으로 바꾼다.
   /video/<이름>.mp4 를 가리키는 <video>를 찾아, 정지 화면(같은 포스터)과 재생 단추로 바꾸고,
   누르면 그 자리에서 유튜브 재생기(youtube-nocookie, 끝난 뒤 추천은 같은 채널)를 불러온다.
   누르기 전에는 유튜브에서 아무것도 받지 않는다. 스크립트가 없으면 링크로 유튜브에서 열린다. */
(function () {
  var MAP = {
    "feature-2026-10-03-population-ko": [["9KstrUCx6sI", "1편 · 인구", "2분 11초"], ["cNYSI1se5lU", "2편 · 안보", "1분 59초"]],
    "feature-2026-10-03-population-en": [["fsLdBHsmsXw", "Part 1 · Population", "2:07"], ["pnn6QpAkLac", "Part 2 · Security", "1:58"]],
    "digest-2026-11-23-ko": "cfnE6FTuO7s",
    "digest-2026-11-23-en": "YfyYO0QBL6U",
    "feature-2026-11-22-g20-ko": "gynrl82Ldik",
    "feature-2026-11-22-g20-en": "HrwEwqFE8A0",
    "feature-2026-11-18-lameduck-ko": "HKVU5c5XlTI",
    "feature-2026-11-18-lameduck-en": "lvGK_Wtxw7A",
    "feature-2026-10-28-icbm-ko": "Tckd4wpaYx4",
    "feature-2026-10-28-icbm-en": "YxUkVmXhhzU",
    "feature-2026-10-18-attrition-ko": "ko19ExnVYEY",
    "feature-2026-10-18-attrition-en": "8VajjYhNuGk"
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
    ".ytc .t2{font-size:13px;line-height:1.35;opacity:.72}" +
    ".ytrow{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}" +
    ".ytb{display:inline-flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border:1px solid rgba(128,128,128,.4);border-radius:999px;background:rgba(128,128,128,.06);color:inherit;text-decoration:none;cursor:pointer;font:inherit;font-size:14px;line-height:1.2;white-space:nowrap}" +
    ".ytb:hover,.ytb.on{border-color:#E8222B}.ytb:focus-visible{outline:3px solid #3D7BFF;outline-offset:3px}" +
    ".ytb .pi{flex:none;width:24px;height:24px;border-radius:50%;background:#E8222B url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 7l9 5-9 5z' fill='white'/%3E%3C/svg%3E\") center/15px no-repeat}" +
    ".ytb .bt{font-weight:700}.ytb .bd{font-size:12.5px;opacity:.68}" +
    ".ytrow+iframe.ytp{margin-top:12px}";
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
    if (Array.isArray(id)) { group(v, id); return; }
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
  /* 2026-11-28 대통령님 지시: 한 특집에 영상이 여럿이면(MAP 값이 [유튜브 id, 이름, 길이]의 목록) 작은 단추를 나란히 두고, 누른 영상을 단추 줄 아래에서 재생한다 */
  function group(v, list) {
    var row = document.createElement("div"); row.className = "ytrow";
    var fig = v.closest ? v.closest("figure") : null, cap = fig && fig.querySelector("figcaption");
    if (cap && /^\s*(영상으로 보기|Watch the video)/.test(cap.textContent || "")) cap.style.display = "none";
    list.forEach(function (x) {
      var id = x[0], t = x[1], d = x[2] || "", said = d;
      if (EN && /^\d+:\d\d$/.test(d)) { var p = d.split(":"); said = (+p[0]) + " minute" + (+p[0] === 1 ? "" : "s") + " " + (+p[1]) + " second" + (+p[1] === 1 ? "" : "s"); }
      var b = document.createElement("a");
      b.className = "ytb"; b.href = "https://www.youtube.com/shorts/" + id; b.setAttribute("role", "button");
      b.setAttribute("aria-label", (EN ? "Play video: " : "영상 재생: ") + t + (said ? ", " + said : ""));
      b.innerHTML = '<span class="pi"></span><span class="bt">' + t + '</span>' + (d ? '<span class="bd">' + d + '</span>' : '');
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var f = row.nextElementSibling;
        if (!f || f.tagName !== "IFRAME") { f = document.createElement("iframe"); f.className = "ytp"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; row.parentNode.insertBefore(f, row.nextSibling); }
        f.title = b.getAttribute("aria-label");
        f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
        var bs = row.querySelectorAll(".ytb"); for (var i = 0; i < bs.length; i++) bs[i].classList.toggle("on", bs[i] === b);
      });
      row.appendChild(b);
    });
    try { row.style.color = getComputedStyle(fig || v.parentNode).color; } catch (e) {}
    v.parentNode.replaceChild(row, v);
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
