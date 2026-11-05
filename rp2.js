/* 나비효과로 보기 1단계(2026-11-06 대통령님 결재): 다녀오는 길.
   ① 나비효과 그림의 '이 페이지로 가기'로 온 쪽에 '← 나비효과로 돌아가기' 단추(누르면 보던 사안·칸이 다시 열림).
   ② 바로 그 자리로: 산업·정세 브리핑 꼭지·사안 전개·분쟁 지점 칸으로 내려가 잠시 표시한다(국민은 고른 집단을 열고, 전망은 전망마다 있는 쪽으로 간다). */
(function(){
  var EN = /^\/en\//.test(location.pathname), P = EN ? "/en" : "";
  var KEY = "rpfrom", RET = "rpret";
  var T = EN ? {back: "← Back to Chain Reactions"} : {back: "← 나비효과로 돌아가기"};
  var home = /^\/(en\/)?(ripple\/)?$/.test(location.pathname);
  function get(){ try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); return s && Date.now() - s.t < 3 * 3600 * 1000 ? s : null; } catch(e){ return null; } }
  /* ① 돌아가기 단추 */
  if (!home && get()) {
    var add = function(){ if (document.getElementById("rp2back")) return;
      var a = document.createElement("a"); a.id = "rp2back"; a.href = P + "/"; a.textContent = T.back;
      a.style.cssText = "position:fixed;left:16px;bottom:72px;z-index:60;background:#173A9E;color:#fff;text-decoration:none;font:700 13.5px/1 system-ui,sans-serif;padding:11px 16px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.28)";
      a.addEventListener("click", function(ev){ ev.preventDefault(); ev.stopImmediatePropagation(); try { sessionStorage.setItem(RET, String(Date.now())); } catch(e){} location.assign(P + "/"); }, true);  /* 화면 앱의 쪽 안 이동을 거치지 않고 첫 화면을 새로 연다(그래야 그림이 보던 칸을 다시 연다) */
      document.body.appendChild(a); };
    if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
  }
  /* ② 그 자리로 내려가 표시: 화면 앱이 주소의 #·?를 지우므로 나비효과 그림이 떠나기 전에 남긴 표시(sessionStorage rpgo)를 읽는다 */
  var G = null; try { G = JSON.parse(sessionStorage.getItem("rpgo") || "null"); } catch(e){}
  if (!G || Date.now() - G.t > 30000 || location.pathname !== G.p) return;
  try { sessionStorage.removeItem("rpgo"); } catch(e){}
  if (G.k === "g") return;  /* 국민의 삶 쪽은 고른 집단(ep.lifeg)을 열며 시작한다 */
  var q = G.q;
  function mark(el){ el.setAttribute("data-rpmark", "1"); el.scrollIntoView({block: "center", behavior: "smooth"}); var o = el.style.outline, oo = el.style.outlineOffset; el.style.outline = "3px solid #ffb020"; el.style.outlineOffset = "3px"; setTimeout(function(){ el.style.outline = o; el.style.outlineOffset = oo; }, 3500); }
  function find(){
    if (G.k === "ind") return document.getElementById(q);
    if (G.k === "fp") { var sel = document.getElementById("lkm-sel"); if (!sel || !sel.options.length) return null; if (sel.value !== q) { sel.value = q; sel.dispatchEvent(new Event("change")); } return document.getElementById("lkm-vfp") || sel; }
    if (G.k === "h") { var arts = document.querySelectorAll("article.bi"); for (var i = 0; i < arts.length; i++) if (arts[i].textContent.indexOf(q) >= 0) return arts[i]; return null; }
    /* 사안 전개(I2·F3 등): 사안 쪽의 전개 칩(전개 기호와 확률). 바깥 변수(X1 등)는 사안마다 기호가 겹쳐 사안 쪽을 여는 데서 그친다 */
    if (G.k === "sc" && /^X/.test(q)) return "skip";
    var pane = document.querySelector('[id^="pane-"]:not([hidden])') || document.body, hit = null;
    var re = new RegExp("^" + q + "\\s*\\d+(\\.\\d)?%$");
    pane.querySelectorAll("*").forEach(function(e){ if (!e.offsetParent) return; if (re.test((e.textContent || "").replace(/\s+/g, " ").trim())) hit = e; });  /* 가장 안쪽 요소가 마지막에 남는다 */
    return hit;
  }
  var n = 0, iv = setInterval(function(){ var el = find(); n++; if (el === "skip") { clearInterval(iv); return; } if (el) { clearInterval(iv); mark(el); } else if (n > 40) clearInterval(iv); }, 150);
})();
