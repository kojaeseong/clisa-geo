/* 밤 화면 단추(아카데미·게임 소개 쪽). 지오폴리틱스 머리글의 단추와 같은 저장값(ep.theme)을 쓴다 */
(function(){
  var b = document.querySelector(".ac-th"), EN = document.documentElement.lang === "en";
  function lab(){ if (!b) return; var d = document.documentElement.dataset.theme === "dark", t = EN ? (d ? "Light mode" : "Dark mode") : (d ? "낮 화면으로 보기" : "밤 화면으로 보기");
    b.title = t; b.setAttribute("aria-label", t); b.setAttribute("aria-pressed", d ? "true" : "false"); }
  function set(t){ document.documentElement.dataset.theme = t; try { localStorage.setItem("ep.theme", t); } catch (e) {} lab(); }
  if (b) { lab(); b.addEventListener("click", function(){ set(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); }); }
  addEventListener("storage", function(e){ if (e.key === "ep.theme" && e.newValue) { document.documentElement.dataset.theme = e.newValue; lab(); } });  /* 다른 탭에서 바꾸면 이 탭도 */
})();
/* 2026-11-10 휴대전화 앱 화면(시험을 켠 기기만): 아카데미·게임 소개 쪽 왼쪽 아래에 첫 화면으로 가는 '‹ 홈' */
(function(){
  var on = true; try { on = localStorage.getItem("ep.mapp") !== "0"; } catch (e) {}
  if (!on || !matchMedia("(max-width:900px)").matches) return;
  var EN = document.documentElement.lang === "en", a = document.createElement("a"); a.href = (EN ? "/en" : "") + "/app/"; a.textContent = EN ? "‹ Home" : "‹ 홈";
  a.style.cssText = "position:fixed;left:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:90;height:38px;padding:0 14px;border-radius:19px;background:rgba(16,20,24,.82);color:#fff;font:600 13px/38px -apple-system,'Pretendard Variable',sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.25)";
  document.body.appendChild(a);
})();
