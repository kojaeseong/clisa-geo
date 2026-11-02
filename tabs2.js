/* v4.67 탭 개편(2026-11-02 결재): 합친 탭의 현재 표시와 두 갈래 전환 띠. 화면 앱이 탭을 바꾸면(주소가 바뀌면) 따라간다. */
(function () {
  var EN = document.documentElement.lang === "en", P = EN ? "/en" : "";
  var G = [
    ["links", ["/links/"]],
    ["industry", ["/industry/", "/life/"], EN ? [["Industry Outlook", "/industry/"], ["People\u2019s Lives", "/life/"]] : [["산업별 미래", "/industry/"], ["국민의 삶", "/life/"]]],
    ["strat", ["/case/"]], ["forecast", ["/forecast/"]],
    ["brieftab", ["/brief/", "/feature/", "/digest/"], EN ? [["Briefings", "/brief/"], ["Features", "/feature/"]] : [["정세 브리핑", "/brief/"], ["특집", "/feature/"]]],
    ["grand", ["/grand/", "/power/", "/leader/"], EN ? [["World Order", "/grand/"], ["Power Structures", "/power/"]] : [["세계 질서", "/grand/"], ["권력 구조", "/power/"]]],
    ["ideas", ["/ideas/"]]
  ];
  function key(a) { return a.getAttribute("data-tab") || a.getAttribute("data-nav"); }
  function run() {
    var nl = document.querySelector("header.hd .hd-nl"); if (!nl) return;
    var path = location.pathname.replace(/^\/en(?=\/)/, ""), g = null;
    G.forEach(function (x) { if (x[1].some(function (p) { return path.indexOf(p) === 0; })) g = x; });
    if (!g && (path === "/" || path === "")) g = ["overview", ["/"]];
    if (!g) {   /* 그 밖의 쪽(나라·권역 등): 화면 앱이 숨긴 메뉴에 현재 표시를 하면 그것을 품은 탭에 표시한다 */
      var al = nl.querySelector('a.hd-alias[aria-current="page"]'), M = { brief: "industry", feature: "brieftab", power: "grand" };
      if (al && M[key(al)]) g = [M[key(al)], []];
    }
    var vis = nl.querySelectorAll("a:not(.hd-alias)");
    if (g) vis.forEach(function (a) { var on = key(a) === g[0]; if (on && a.getAttribute("aria-current") !== "page") a.setAttribute("aria-current", "page"); if (!on && a.hasAttribute("aria-current")) a.removeAttribute("aria-current"); });
    var sub = document.getElementById("hd-sub"), nav = document.querySelector("header.hd nav.gnav");
    if (!g || !g[2]) { if (sub) sub.remove(); return; }
    var html = g[2].map(function (it) { var on = path.indexOf(it[1]) === 0; return '<a href="' + P + it[1] + '"' + (on ? ' aria-current="page"' : "") + ">" + it[0] + "</a>"; }).join("");
    if (!sub) { sub = document.createElement("nav"); sub.id = "hd-sub"; sub.className = "hd-sub"; sub.setAttribute("aria-label", EN ? "Section" : "갈래"); nav.insertAdjacentElement("afterend", sub); }
    if (sub.innerHTML !== html) sub.innerHTML = html;
  }
  run();
  var last = location.pathname;
  new MutationObserver(function () { if (location.pathname !== last) { last = location.pathname; } run(); }).observe(document.querySelector("header.hd") || document.body, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
  window.addEventListener("popstate", run); setInterval(function () { if (location.pathname !== last) { last = location.pathname; run(); } }, 400);
})();
