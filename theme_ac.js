/* 밤 화면 단추(아카데미·게임 소개 쪽). 지오폴리틱스 머리글의 단추와 같은 저장값(ep.theme)을 쓴다 */
(function(){
  var b = document.querySelector(".ac-th"), EN = document.documentElement.lang === "en";
  function lab(){ if (!b) return; var d = document.documentElement.dataset.theme === "dark", t = EN ? (d ? "Light mode" : "Dark mode") : (d ? "낮 화면으로 보기" : "밤 화면으로 보기");
    b.title = t; b.setAttribute("aria-label", t); b.setAttribute("aria-pressed", d ? "true" : "false"); }
  function set(t){ document.documentElement.dataset.theme = t; try { localStorage.setItem("ep.theme", t); } catch (e) {} lab(); }
  if (b) { lab(); b.addEventListener("click", function(){ set(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); }); }
  addEventListener("storage", function(e){ if (e.key === "ep.theme" && e.newValue) { document.documentElement.dataset.theme = e.newValue; lab(); } });  /* 다른 탭에서 바꾸면 이 탭도 */
})();
