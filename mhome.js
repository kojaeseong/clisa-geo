/* 2026-11-10 대통령님 지시: 휴대전화 앱 화면에서 윗줄이 없는 쪽(게임 본편)에 첫 화면으로 가는 '‹ 홈'. 쪽 끝의 <script defer src="/mhome.js"></script> 한 줄이 부른다 */
(function(){
  var on = true; try { on = localStorage.getItem("ep.mapp") !== "0"; } catch (e) {}
  if (!on || !matchMedia("(max-width:900px)").matches || document.querySelector(".mab,.mhome")) return;
  var EN = document.documentElement.lang === "en", a = document.createElement("a"); a.className = "mhome"; a.href = (EN ? "/en" : "") + "/home/"; a.textContent = EN ? "\u2039 Home" : "\u2039 홈";
  a.style.cssText = "position:fixed;left:10px;top:calc(6px + env(safe-area-inset-top));z-index:2147483000;height:28px;padding:0 11px;border-radius:14px;background:rgba(16,20,24,.82);color:#fff;font:600 12px/28px -apple-system,'Pretendard Variable',sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)";
  document.body.appendChild(a);
})();
