/* WORLD OF DECISION · 1914 — game engine (ko and en; 2026-10-23 in-place language switch: the screen, the data and the address change, the music and the game state carry on) */
(function(){
'use strict';
var LANG=(new URLSearchParams(location.search).get('lang')==='en'||/^en/.test(document.documentElement.lang||''))?'en':'ko';
/* data and engine live once under /play/1914/; the English page sets data-base to reuse them */
/* the base is absolute so that data and audio still resolve after the address is switched between /play/1914/ and /en/play/1914/ */
var BASE=document.documentElement.getAttribute('data-base')||(/\/play\/1914\/$/.test(location.pathname)?location.pathname.replace(/^\/en\//,'/'):'');
var EN, SITE, DISP, SWITCHING=false, VIEW=null;
function T(ko,en){return EN?en:ko;}
var LANGLINK=true; /* the off-site preview turns the switch off */
/* Black Han Sans has no accented Latin letters, so English headings use Archivo Black */
function setLang(l){ LANG=l; EN=l==='en'; SITE=EN?'/en':''; DISP=EN?'"Archivo Black",sans-serif':'"Black Han Sans",sans-serif'; document.documentElement.lang=l; document.title='WORLD OF DECISION · 1914 | '+(EN?'Clisa Geopolitics':'클리사 지오폴리틱스'); }
setLang(LANG);
var ROLES=[
 {id:'de',flag:'de'},{id:'at',flag:'at'},{id:'ru',flag:'ru'},{id:'fr',flag:'fr'},{id:'gb',flag:'gb'},{id:'rs',flag:'rs'}
];
var FLAGS={
 de:'<svg viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#fff"/><rect y="2" width="5" height="1" fill="#D00"/></svg>',
 at:'<svg viewBox="0 0 6 4"><rect width="3" height="4" fill="#C8102E"/><rect y="1.33" width="3" height="1.34" fill="#fff"/><rect x="3" width="3" height="4" fill="#fff"/><rect x="3" width="3" height="1.33" fill="#C8102E"/><rect x="3" y="2.67" width="3" height="1.33" fill="#477050"/></svg>',
 ru:'<svg viewBox="0 0 3 2"><rect width="3" height="2" fill="#fff"/><rect y=".67" width="3" height=".67" fill="#0039A6"/><rect y="1.33" width="3" height=".67" fill="#D52B1E"/></svg>',
 fr:'<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>',
 gb:'<svg viewBox="0 0 60 30"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2.4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></svg>',
 rs:'<svg viewBox="0 0 3 2"><rect width="3" height="2" fill="#fff"/><rect width="3" height=".67" fill="#C6363C"/><rect y=".67" width="3" height=".67" fill="#0C4076"/></svg>'
};
/* period colours per role: stripe = flag or dynastic colours, acc = accent used for role name, key boxes and stamps */
var THEME={
 de:{stripe:['#111111','#FFFFFF','#C1121F'],acc:'#111111'},
 at:{stripe:['#111111','#E3B21B'],acc:'#7A5A00'},
 ru:{stripe:['#FFFFFF','#1C3F94','#C1121F'],acc:'#1C3F94'},
 fr:{stripe:['#1F3E8C','#FFFFFF','#C8202E'],acc:'#1F3E8C'},
 gb:{stripe:['#C1121F','#FFFFFF','#0B2A5B'],acc:'#0B2A5B'},
 rs:{stripe:['#C6363C','#0C4076','#FFFFFF'],acc:'#A3262C'}
};
var IMGLABS={en:{wilhelm2:'Wilhelm II',bethmann:'Bethmann Hollweg',moltke:'Moltke',berchtold:'Berchtold',franzjoseph:'Franz Joseph',tisza:'Tisza',conrad:'Conrad',nicholas2:'Nicholas II',sazonov:'Sazonov',poincare:'Poincaré',viviani:'Viviani',grey:'Grey',asquith:'Asquith',churchill:'Churchill',pasic:'Pašić',albert1:'Albert I',lichnowsky:'Lichnowsky',jaures:'Jaurès'},ko:{wilhelm2:'빌헬름 2세',bethmann:'베트만홀베크',moltke:'몰트케',berchtold:'베르히톨트',franzjoseph:'프란츠 요제프',tisza:'티서',conrad:'콘라트',nicholas2:'니콜라이 2세',sazonov:'사조노프',poincare:'푸앵카레',viviani:'비비아니',grey:'그레이',asquith:'아스퀴스',churchill:'처칠',pasic:'파시치',albert1:'알베르 1세',lichnowsky:'리히노프스키',jaures:'조레스'}};
function IMGLAB(){return IMGLABS[LANG];}
var app=document.getElementById('app');
var C=null, R=null, S=null, MAPS=null, TYPES=null, cache={};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
/* inline "(가상)" markers are shown once as a stamp instead of inside sentences */
function clean(s){return String(s==null?'':s).replace(/\s*\((가상|가상 장면|가상 전개|hypothetical|alternate)\)/gi,'');}
function tx(s){return esc(clean(s));}
function get(url){ if(cache[url]) return Promise.resolve(cache[url]);
  return fetch(url,{cache:'no-cache'}).then(function(r){if(!r.ok) throw new Error(url+' '+r.status); return r.json();}).then(function(j){cache[url]=j;return j;});}
function opt(url){ return get(url).catch(function(){return null;}); }
function top(){ if(SWITCHING) return; window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});}
function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }

/* ---------- sound (synthesised, no files) ---------- */
var SND={on:store('wod-sound')!=='off', ctx:null, music:null};
function ac(){ if(!SND.on) return null; try{ if(!SND.ctx){ var A=window.AudioContext||window.webkitAudioContext; if(!A) return null; SND.ctx=new A(); } if(SND.ctx.state==='suspended') SND.ctx.resume(); return SND.ctx; }catch(e){ return null; } }
function noise(ctx,dur){ var b=ctx.createBuffer(1,Math.max(1,Math.floor(ctx.sampleRate*dur)),ctx.sampleRate), d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1; var s=ctx.createBufferSource(); s.buffer=b; return s; }
function env(ctx,g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
function sfx(kind){
  var ctx=ac(); if(!ctx) return; var t=ctx.currentTime, out=ctx.destination;
  if(kind==='click'||kind==='key'){ var n=noise(ctx,.03), f=ctx.createBiquadFilter(), g=ctx.createGain(); f.type='bandpass'; f.frequency.value=kind==='key'?3200:1800; f.Q.value=1.2; n.connect(f).connect(g).connect(out); env(ctx,g,t,.002,kind==='key'?.08:.28,.035); n.start(t); n.stop(t+.04); return; }
  if(kind==='page'){ var n2=noise(ctx,.25), f2=ctx.createBiquadFilter(), g2=ctx.createGain(); f2.type='bandpass'; f2.Q.value=.8; f2.frequency.setValueAtTime(700,t); f2.frequency.exponentialRampToValueAtTime(3500,t+.2); n2.connect(f2).connect(g2).connect(out); env(ctx,g2,t,.02,.26,.22); n2.start(t); n2.stop(t+.26); return; }
  if(kind==='wire'){ [0,.14,.28].forEach(function(o,i){ var os=ctx.createOscillator(), g3=ctx.createGain(); os.type='square'; os.frequency.value=780; os.connect(g3).connect(out); var d=i===1?.11:.05; env(ctx,g3,t+o,.004,.07,d); os.start(t+o); os.stop(t+o+d+.02); }); return; }
  if(kind==='stamp'){ var o=ctx.createOscillator(), g4=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(55,t+.18); o.connect(g4).connect(out); env(ctx,g4,t,.004,.75,.22); o.start(t); o.stop(t+.25);
    var n4=noise(ctx,.08), f4=ctx.createBiquadFilter(), g5=ctx.createGain(); f4.type='lowpass'; f4.frequency.value=900; n4.connect(f4).connect(g5).connect(out); env(ctx,g5,t,.002,.25,.07); n4.start(t); n4.stop(t+.09); return; }
  if(kind==='drum'){ [0,.42].forEach(function(o2,i){ var os2=ctx.createOscillator(), g6=ctx.createGain(); os2.type='sine'; os2.frequency.setValueAtTime(i?62:70,t+o2); os2.frequency.exponentialRampToValueAtTime(38,t+o2+.9); os2.connect(g6).connect(out); env(ctx,g6,t+o2,.01,i?.85:.6,1.1); os2.start(t+o2); os2.stop(t+o2+1.2);
      var n6=noise(ctx,.3), f6=ctx.createBiquadFilter(), g7=ctx.createGain(); f6.type='lowpass'; f6.frequency.value=300; n6.connect(f6).connect(g7).connect(out); env(ctx,g7,t+o2,.005,.18,.25); n6.start(t+o2); n6.stop(t+o2+.3); }); return; }
  if(kind==='rise'||kind==='fall'){ var os4=ctx.createOscillator(), g9=ctx.createGain(); os4.type='triangle'; os4.frequency.setValueAtTime(kind==='rise'?330:520,t); os4.frequency.exponentialRampToValueAtTime(kind==='rise'?520:300,t+.25); os4.connect(g9).connect(out); env(ctx,g9,t,.01,.12,.28); os4.start(t); os4.stop(t+.32); return; }
  if(kind==='end'){ [98,147,196].forEach(function(fq,i){ var os3=ctx.createOscillator(), g8=ctx.createGain(); os3.type='triangle'; os3.frequency.value=fq; os3.connect(g8).connect(out); g8.gain.setValueAtTime(0.0001,t); g8.gain.exponentialRampToValueAtTime(.13,t+.4+i*.15); g8.gain.exponentialRampToValueAtTime(0.0001,t+3); os3.start(t); os3.stop(t+3.1); }); }
}
/* the operator's two score tracks play one after the other, alternating for as long as the game is open */
var BGM=[BASE+'audio/stille.mp3',BASE+'audio/grave.mp3'], BGMVOL=.35, NOBGM=document.documentElement.getAttribute('data-bgm')==='off';
SND.list=[]; SND.idx=0;
function track(k){ if(!SND.list[k]){ var a=new Audio(BGM[k]); a.preload='none'; a.volume=BGMVOL; a.addEventListener('ended',function(){ if(SND.on&&SND.idx===k){ SND.idx=(k+1)%BGM.length; var b=track(SND.idx); b.currentTime=0; b.play().catch(function(){}); } }); SND.list[k]=a; } return SND.list[k]; }
function music(play){
  if(NOBGM) return;
  try{ var a=track(SND.idx); if(play&&SND.on) a.play().catch(function(){}); else a.pause(); }catch(e){}
}
function soundBtn(){ return '<button class="sbtn" id="snd" aria-pressed="'+(SND.on?'true':'false')+'">'+(SND.on?T('소리 켬','Sound on'):T('소리 끔','Sound off'))+'</button>'; }
function langBtn(){ return LANGLINK?'<button class="sbtn lbtn" id="lsw" lang="'+(EN?'ko':'en')+'" aria-label="'+(EN?'한국어로 보기':'View in English')+'">'+(EN?'한국어':'English')+'</button>':''; }
/* switch the language in place: same screen, same role and choices, same music; only the words, the data and the address change */
function switchLang(l){
  if(l===LANG) return;
  setLang(l);
  if(/^\/(en\/)?play\/1914\/$/.test(location.pathname)){ try{ var q=new URLSearchParams(location.search); q.delete('lang'); var qs=q.toString(); history.replaceState(null,'',(EN?'/en':'')+'/play/1914/'+(qs?'?'+qs:'')+location.hash); }catch(e){} }
  var jobs=[get(BASE+'data/common.'+LANG+'.json'),opt(BASE+'data/maps'+(EN?'.en':'')+'.json'),opt(BASE+'data/types.'+LANG+'.json')];
  if(R) jobs.push(get(BASE+'data/'+R.id+'.'+LANG+'.json'));
  Promise.all(jobs).then(function(r){
    C=r[0]; MAPS=r[1]; TYPES=r[2];
    if(R){ R=r[3]; if(S) S.hist=S.hist.map(function(h){ var n=R.nodes[h.id]; var c=n&&n.choices.filter(function(x){return x.key===h.pick;})[0]; return c?histEntry(n,c):h; }); }
    SWITCHING=true; try{ if(VIEW) VIEW(); } finally{ SWITCHING=false; }
  }).catch(function(e){ app.textContent=T('자료를 불러오지 못했습니다. ','Could not load the game data. ')+e.message; });
}
function bindSound(){ var l=document.getElementById('lsw'); if(l) l.onclick=function(){ sfx('click'); switchLang(EN?'ko':'en'); };
  var b=document.getElementById('snd'); if(!b) return; b.onclick=function(){ SND.on=!SND.on; store('wod-sound',SND.on?'on':'off'); b.textContent=SND.on?T('소리 켬','Sound on'):T('소리 끔','Sound off'); b.setAttribute('aria-pressed',SND.on?'true':'false'); if(SND.on){ sfx('click'); music(true);} else music(false); }; }

/* 2026-10-23 (partner suggestion): roles already played light up on the role screen; kept in the browser as role:ending pairs */
function doneMap(){ var m={}; String(store('wod-done')||'').split(',').forEach(function(x){ var a=x.split(':'); if(a[0]) m[a[0]]=a[1]||''; }); return m; }
function markDone(id,k){ var m=doneMap(); m[id]=k; store('wod-done',Object.keys(m).map(function(x){return x+':'+m[x];}).join(',')); }
/* ③ (partner suggestion): a calendar strip from 28 June to 4 August with the current scene and the decisions already made */
function timeline(n){
  var d0=Date.UTC(1914,5,28), d1=Date.UTC(1914,7,4), span=d1-d0;
  var at=function(s){ var m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return null; var v=(Date.UTC(+m[1],+m[2]-1,+m[3])-d0)/span; return Math.max(0,Math.min(1,v)); };
  var cur=at(n.date); if(cur==null) return '';
  var ticks=[['1914-06-28',T('6.28','28 Jun')],['1914-07-05',''],['1914-07-12',''],['1914-07-19',''],['1914-07-23',T('7.23','23 Jul')],['1914-07-28',T('7.28','28 Jul')],['1914-08-04',T('8.4','4 Aug')]];
  var past=(S.hist||[]).map(function(h){return at(h.date);}).filter(function(v){return v!=null;});
  var over=String(n.date||'')>'1914-08-04', before=String(n.date||'')<'1914-06-28';
  return '<div class="tl" aria-label="'+esc(T('달력','Calendar'))+'"><div class="tl-bar">'+
    ticks.map(function(x){ var v=at(x[0]); return '<i class="tk" style="left:'+(v*100)+'%"></i>'+(x[1]?'<span class="tl-l" style="left:'+(v*100)+'%">'+x[1]+'</span>':''); }).join('')+
    past.map(function(v){ return '<i class="pt" style="left:'+(v*100)+'%"></i>'; }).join('')+
    '<i class="now" style="left:'+(cur*100)+'%"></i></div>'+
    '<div class="tl-now" style="left:'+(cur*100)+'%"><span>'+(over?T('8월 4일 이후 · ','after 4 Aug · '):before?T('6월 28일 이전 · ','before 28 Jun · '):'')+dayLabel(n.date)+'</span></div></div>';
}
function brand(){return '<div class="brandbar"><a href="'+SITE+'/" target="_blank" rel="noopener">CLISA</a><span class="bb-r"><span>WORLD OF DECISION · 1914</span>'+langBtn()+soundBtn()+'</span></div>';}
function render(h){ app.innerHTML=h; bindSound(); }
function dayLabel(d){ if(!d) return ''; var m=d.match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return esc(d); return EN?(+m[3])+' '+['January','February','March','April','May','June','July','August','September','October','November','December'][+m[2]-1]:(+m[2])+'월 '+(+m[3])+'일'; }
function yearOf(d){ var m=String(d||'').match(/^(\d{4})/); return m?m[1]:''; }
function setTheme(id){
  var th=THEME[id], root=document.documentElement;
  if(!th){ root.removeAttribute('data-role'); root.style.removeProperty('--acc'); root.style.removeProperty('--stripe'); return; }
  var n=th.stripe.length, stops=th.stripe.map(function(c,i){return c+' '+(i*100/n)+'% '+((i+1)*100/n)+'%';}).join(',');
  root.setAttribute('data-role',id); root.style.setProperty('--acc',th.acc); root.style.setProperty('--stripe','linear-gradient(180deg,'+stops+')');
}

/* ---------- screens ---------- */
function title(){
  VIEW=title; setTheme(null);
  render('<section class="title">'+
   '<div class="kicker"><span>CLISA GAMES</span><span class="bb-r"><span>'+esc(C.ep)+'</span>'+langBtn()+soundBtn()+'</span></div>'+
   '<div class="of">WORLD OF</div><h1>DECISION</h1>'+
   '<div class="row">'+(EN?'<span class="ko">'+esc(C.sub||'')+'</span>':'<span class="ko">'+esc(C.title)+'</span>')+'<span class="stamp-r">'+esc(C.ep)+'</span></div>'+
   '<p class="hook">'+esc(C.hook)+'</p>'+
   '<button class="btn" id="go">'+T('결정하러 가기','Take your seat')+'</button>'+
   '<div class="count"><div><b>37</b>'+T('일간의 위기',' days of crisis')+'</div><div><b>6</b>'+T('개 나라',' powers')+'</div><div><b>'+Object.keys(C.endings).length+'</b>'+T('개 결말',' endings')+'</div></div>'+rights()+'</section>');
  document.getElementById('go').onclick=function(){ sfx('stamp'); music(true); roles(); };
}
function roles(){
  VIEW=roles; setTheme(null);
  Promise.all(ROLES.map(function(r){return opt(BASE+'data/'+r.id+'.'+LANG+'.json');})).then(function(list){
    var dm=doneMap(), nd=ROLES.filter(function(r){return dm[r.id]!==undefined;}).length;
    var h=brand()+'<h2 class="h2">'+T('누구의 자리에 앉으시겠습니까?','Whose chair will you take?')+'</h2><p class="lead">'+T('어느 역할을 골라도 같은 1914년 7월 안에서 움직입니다. 한 역할을 끝내면 다른 나라의 자리에서 다시 해 보세요.','Every role plays out inside the same July 1914. When you finish one, try again from another capital.')+
      (nd?' <span class="prog">'+T('끝낸 자리 ','Chairs completed: ')+nd+' / '+ROLES.length+'</span>':'')+'</p><div class="roles">';
    ROLES.forEach(function(r,i){var d=list[i], dk=dm[r.id];
      h+='<button class="role'+(d?'':' off')+(dk!==undefined?' done':'')+'" data-id="'+r.id+'">'+(dk!==undefined?'<span class="donek">'+T('끝냄','Done')+(dk?' · '+T('결말 ','Ending ')+esc(dk):'')+'</span>':'')+'<span class="flag">'+FLAGS[r.flag]+'</span>'+
        '<span class="cty">'+esc(d?d.country:'')+'</span><span class="who">'+esc(d?d.person:T('준비 중','Coming soon'))+'</span><span class="card">'+esc(d?d.card:'')+'</span>'+(d?'':'<span class="soon">'+T('준비 중','Coming soon')+'</span>')+'</button>';});
    render(h+'</div>');
    app.querySelectorAll('.role').forEach(function(b){b.onclick=function(){ sfx('click'); start(b.dataset.id);};});
    top();
  });
}
function start(id){
  get(BASE+'data/'+id+'.'+LANG+'.json').then(function(r){
    R=r; setTheme(id);
    S={g:Object.assign({risk:30,ally:60,home:50,prestige:50},r.start||{}),flags:{},ax:{},axLast:{},hist:[],node:r.first,qn:0};
    prologue(0);
  });
}
/* prologue in pages: the shared opening, the role, the dossier */
function prologue(p){
  VIEW=function(){ prologue(p); };
  var pages=[
    '<div class="stamp"><div class="day">'+T('6월 28일','28 June')+'</div><div class="meta"><b>1914'+T('년','')+'</b> · '+T('일요일 오전 · 사라예보','Sunday morning · Sarajevo')+'</div></div>'+
    mapBox({key:'europe',marks:['sarajevo','berlin','vienna','rome','paris','london','st_petersburg'],caption:T('1914년 6월의 유럽. 3국동맹(독일·오스트리아-헝가리·이탈리아)과 3국협상(프랑스·러시아·영국), 그리고 사라예보','Europe in June 1914: the Triple Alliance (Germany, Austria-Hungary, Italy), the Triple Entente (France, Russia, Britain), and Sarajevo')})+
    '<div class="paper prose">'+C.prologue.map(function(x){return '<p>'+tx(x)+'</p>';}).join('')+'</div>',
    '<h2 class="scene-title">'+esc(R.person)+'</h2><div class="paper prose"><p>'+tx(R.intro)+'</p></div>'
  ];
  (R.dossier||[]).forEach(function(x,k,a){ pages.push('<h2 class="scene-title">'+T('인물 파일','Dossier')+' <span class="dn">'+(k+1)+' / '+a.length+'</span></h2><div class="dossier one"><div class="dcard"><b>'+esc(x.h)+'</b><p>'+tx(x.t)+'</p></div></div>'); });
  var last=p>=pages.length-1;
  render(brand()+'<div class="pg">'+pages[p]+'</div>'+pager(p,pages.length,last?T('7월로 들어가기','Enter July'):T('다음','Next')));
  bindPager(function(){ prologue(p-1); }, function(){ if(last){ sfx('stamp'); scene(S.node);} else prologue(p+1); });
  top();
}
function pager(p,n,label){
  return '<div class="pager"><span class="dots">'+(n>1?Array.apply(null,Array(n)).map(function(_,i){return '<i'+(i===p?' class="on"':'')+'></i>';}).join(''):'')+'</span>'+
   '<span class="pbtns">'+(p>0?'<button class="btn small ghost" id="pv">'+T('이전','Back')+'</button>':'')+(label?'<button class="btn" id="pn">'+esc(label)+'</button>':'')+'</span></div>';
}
function bindPager(prev,next){
  var a=document.getElementById('pv'), b=document.getElementById('pn');
  if(a) a.onclick=function(){ sfx('click'); sfx('page'); prev(); };
  if(b) b.onclick=function(){ sfx('click'); setTimeout(function(){sfx('page');},60); next(); };
}
function hud(delta,n){
  var keys=['risk','ally','home','prestige'];
  var lab={risk:C.gauges.risk,ally:R.allyLabel||C.gauges.ally,home:C.gauges.home,prestige:C.gauges.prestige};
  return '<div class="hud" id="hud"><div class="stripe" aria-hidden="true"></div><div class="hud-top"><span class="who">'+esc(R.person)+'</span><span class="qn">'+T('결정 ','Decision ')+(S.qn)+'</span></div><div class="gauges">'+
   keys.map(function(k){var v=S.g[k], d=delta&&delta[k]||0;
     return '<div class="g '+k+'"><div class="lab"><span>'+esc(lab[k])+'</span><span>'+v+(d?'<span class="d '+(d>0?'up':'dn')+'">'+(d>0?'+':'')+d+'</span>':'')+'</span></div><div class="bar"><div class="fill" style="width:'+v+'%"></div></div></div>';}).join('')+
   '</div>'+(n?timeline(n):'')+'</div>';
}
function portrait(key){
  if(!key) return '';
  var lab=IMGLAB()[key]||'', src=(R.images&&R.images[key])||(C.images&&C.images[key]);
  if(!src) return '';
  return '<figure class="portrait"><img src="'+esc(src.src)+'" alt="'+esc(lab)+'" loading="lazy"><figcaption>'+esc(lab)+(src.credit?'<br>'+esc(src.credit):'')+'</figcaption></figure>';
}
/* maps: base drawing from data/maps.json, marks and routes drawn per scene */
function mapBox(m){
  if(!m||!MAPS||!MAPS[m.key]) return '';
  var M=MAPS[m.key], P=M.places||{}, out='';
  (m.routes||[]).forEach(function(r){ var a=P[r[0]], b=P[r[1]]; if(!a||!b) return;
    var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2-Math.abs(b[0]-a[0])*.18-10;
    out+='<path class="mr" d="M'+a[0]+','+a[1]+' Q'+mx+','+my+' '+b[0]+','+b[1]+'" marker-end="url(#ah-'+m.key+')"/>'; });
  (m.marks||[]).forEach(function(k){ var p=P[k]; if(!p) return;
    out+='<circle class="mk" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(M.r?Math.max(M.r,9):9)+'"/><text class="ml" x="'+(p[0]+(p[3]==='l'?-14:14))+'" y="'+(p[1]+9)+'"'+(p[3]==='l'?' text-anchor="end"':'')+'>'+esc(p[2])+'</text>'; });
  return '<figure class="map"><svg viewBox="'+M.vb+'" role="img" aria-label="'+esc(clean(m.caption)||T('지도','Map'))+'"><defs><marker id="ah-'+m.key+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>'+M.base+out+'</svg>'+
   '<div class="maplegend"><span><i class="lg" style="border-color:#A3262C"></i>'+T('3국동맹','Triple Alliance')+'</span><span><i class="lg" style="border-color:#1F4E79"></i>'+T('3국협상','Triple Entente')+'</span><span><i class="lg" style="border-color:#6A3D8F"></i>'+T('세르비아·몬테네그로','Serbia and Montenegro')+'</span><span><i class="lg" style="border-color:#2E2E2E;border-width:1px"></i>'+T('그 밖의 나라','Other states')+'</span></div>'+
   (m.caption?'<figcaption>'+tx(m.caption)+'</figcaption>':'')+(M.credit?'<figcaption class="cr">'+esc(M.credit)+'</figcaption>':'')+'</figure>';
}
/* telegrams arrived as printed tape pasted line by line onto the form: one strip per '/' segment */
function typeOut(el,text,instant){
  var lines=String(text).split(/\s*\/\s*/).filter(function(x){return x;});
  el.innerHTML=lines.map(function(){return '<span class="strip"></span>';}).join('');
  var st=el.querySelectorAll('.strip');
  if(reduce||instant){ lines.forEach(function(x,k){st[k].textContent=x;}); el.classList.add('done'); return; }
  sfx('wire');
  var k=0,i=0; (function step(){ if(k>=lines.length){ el.classList.add('done'); return; }
    i+=2; st[k].textContent=lines[k].slice(0,i); st[k].classList.add('on'); if(i%6===0) sfx('key');
    if(i>=lines[k].length){ k++; i=0; setTimeout(step,180); } else setTimeout(step,24); })();
}
function head(n){
  var hypo=n.hypo||/\(가상/.test(n.title||'');
  return '<div class="stamp"><div class="day">'+dayLabel(n.date)+'</div><div class="meta"><b>'+esc(yearOf(n.date)+T('년',''))+'</b>'+esc((n.time?' · '+n.time:'')+(n.place?' · '+n.place:''))+'</div>'+(hypo?'<span class="hypo">'+T('가상 전개','Alternate path')+'</span>':'')+'</div>'+
   '<h2 class="scene-title">'+tx(n.title)+'</h2>'+(n.clock?'<div class="clock">'+esc(n.clock)+'</div>':'');
}
/* a scene is shown in pages: what happened meanwhile → the room and the voices → the decision */
function scene(id){
  var n=R.nodes[id]; if(!n){ app.textContent=T('장면을 찾을 수 없습니다: ','Scene not found: ')+id; return; }
  S.node=id; S.qn++; S.chosen=null; S.delta=null;
  S.order=n.choices.map(function(_,i){return i;}); for(var a=S.order.length-1;a>0;a--){ var b=Math.floor(Math.random()*(a+1)), t=S.order[a]; S.order[a]=S.order[b]; S.order[b]=t; }
  scenePage(n,scenePages(n),0);
}
/* 2026-10-23 (operator decision): a long room page is split so that the voices get a page of their own; short scenes stay on one page */
function splitAt(){ return EN?1000:450; }  /* Latin text runs about twice the characters of Korean for the same scene */
function scenePages(n){
  var pages=[];
  if(n.event||n.telegram||n.map) pages.push('brief');
  var v=n.voices||[], len=clean(n.scene||'').length+v.reduce(function(s,x){return s+clean(x.text||'').length;},0);
  if(v.length&&(len>splitAt()||v.length>=3)){ pages.push('room0'); pages.push('voices'); } else pages.push('room');
  pages.push('decide');
  return pages;
}
function voicesHtml(n){ return '<div class="voices">'+(n.voices||[]).map(function(v){var me=/당신|^You\b/.test(v.who); return '<div class="voice'+(me?' me':'')+'"><div class="w">'+esc(v.who)+(v.kind==='quote'?'<i class="q">'+T('기록','On record')+'</i>':'<i>'+T('요지','In substance')+'</i>')+'</div><div class="t">'+(v.kind==='quote'?'“'+tx(v.text)+'”':tx(v.text))+'</div></div>';}).join('')+'</div>'; }
function scenePage(n,pages,p){
  VIEW=function(){ var m=R.nodes[S.node], pg=scenePages(m); scenePage(m,pg,Math.min(p,pg.length-1)); };  /* the page count can differ by language */
  var kind=pages[p], body='';
  if(kind==='brief'){
    body=(n.event?'<div class="event"><span class="lab">'+T('그사이','Meanwhile')+'</span>'+tx(n.event)+'</div>':'')+
      (n.telegram?'<div class="telegram"><div class="th"><span class="tt">'+T('전 보','TELEGRAM')+'</span><span class="tf"><i>'+T('발신','From')+'</i>'+esc(n.telegram.from||'')+'</span><span class="tf"><i>'+T('일시','Date')+'</i>'+esc(n.telegram.at||'')+'</span></div><div class="tx" id="tx"></div></div>':'')+
      mapBox(n.map);
  } else if(kind==='room'){
    body='<div class="paper">'+portrait(n.img)+'<p class="prose" style="margin:0 0 14px">'+tx(n.scene)+'</p>'+voicesHtml(n)+'</div>';
  } else if(kind==='room0'){
    body='<div class="paper">'+portrait(n.img)+'<p class="prose" style="margin:0">'+tx(n.scene)+'</p></div>';
  } else if(kind==='voices'){
    var lead=clean(n.scene||'').split(/(?<=[.다요!?])\s+/)[0];
    body='<div class="paper"><p class="vlead">'+esc(lead)+'</p><h3 class="vh">'+T('방 안의 목소리','Voices in the room')+'</h3>'+voicesHtml(n)+'</div>';
  } else {
    body=(n.pressure?'<div class="pressure"><span class="lab">'+T('속사정 · ','Behind the scenes · ')+esc(n.pressure.title)+'</span><p>'+tx(n.pressure.text)+'</p>'+(n.pressure.fx?'<p class="pfx">'+T('이 압력은 일부 선택의 결과에 영향을 줍니다.','This pressure changes the outcome of some choices.')+'</p>':'')+'</div>':'')+
      '<p class="ask">'+T('당신의 결정은?','Your decision?')+'</p><div class="choices">'+(S.order||n.choices.map(function(_,i){return i;})).map(function(i,pos){var c=n.choices[i]; return '<button class="choice" data-i="'+i+'" data-k="'+String.fromCharCode(65+pos)+'">'+tx(c.text)+(c.why?'<span class="why">'+tx(c.why)+'</span>':'')+'</button>';}).join('')+'</div><div id="res"></div>';
  }
  var last=p===pages.length-1;
  var done=last&&S.chosen!=null;
  render(brand()+hud(done?S.delta:null,n)+head(n)+'<div class="pg">'+body+'</div>'+(last?pager(p,pages.length,''):pager(p,pages.length,T('다음','Next'))));
  top();
  if(kind==='brief'&&n.telegram) typeOut(document.getElementById('tx'),clean(n.telegram.text||''),SWITCHING);
  bindPager(function(){ scenePage(n,pages,p-1); }, function(){ scenePage(n,pages,p+1); });
  if(last) app.querySelectorAll('.choice').forEach(function(b){b.onclick=function(){choose(n,+b.dataset.i);};});
  if(done){ markPick(S.chosen); showResult(n,n.choices[S.chosen],S.delta,true); }  /* a choice already made on this scene (redrawn after a language switch) */
}
function apply(c,n){
  var d={}, fx=Object.assign({},c.fx||{});
  var pf=n&&n.pressure&&n.pressure.fx&&n.pressure.fx[c.key]; if(pf) Object.keys(pf).forEach(function(k){fx[k]=(fx[k]||0)+pf[k];});
  [].concat(c.fxIf||[]).forEach(function(r){ if(has(r.flag)) Object.keys(r.fx||{}).forEach(function(k){fx[k]=(fx[k]||0)+r.fx[k];}); });
  ['risk','ally','home','prestige'].forEach(function(k){var v=fx[k]||0; var nv=Math.max(0,Math.min(100,S.g[k]+v)); d[k]=nv-S.g[k]; S.g[k]=nv;});
  (c.set||[]).forEach(function(f){S.flags[f]=true;});
  (c.axes||[]).forEach(function(a){S.ax[a]=(S.ax[a]||0)+1; S.axLast[pairOf(a)]=a;});
  return d;
}
function pairOf(a){return {P:0,R:0,H:1,D:1,S:2,A:2,F:3,L:3}[a];}
/* no same-as-history label during play: the July Crisis is not a quiz, and the comparison waits for the ending */
function histEntry(n,c){
  var rc=n.choices.filter(function(x){return x.real===true;})[0]||n.choices.filter(function(x){return x.real==='partial';})[0]||{};
  return {id:n.id||S.node,date:n.date,title:clean(n.title),pick:c.key,text:clean(c.text),real:c.real,realKey:rc.key,realText:clean(rc.text),realNote:c.realNote?clean(c.realNote):''};
}
function markPick(i){ app.querySelectorAll('.choice').forEach(function(b){b.disabled=true; if(+b.dataset.i===i) b.classList.add('picked');}); }
function choose(n,i){
  var c=n.choices[i];
  markPick(i);
  var d=apply(c,n);
  S.hist.push(histEntry(n,c)); S.chosen=i; S.delta=d;
  document.getElementById('hud').outerHTML=hud(d,n);
  var nx0=resolve(c.next), heavy=(d.risk||0)>=15||nx0==='END:E';
  sfx(heavy?'drum':'stamp'); if(d.risk) setTimeout(function(){ sfx(d.risk>0?'rise':'fall'); }, heavy?900:350);
  showResult(n,c,d,false);
}
function showResult(n,c,d,quiet){
  var nx0=resolve(c.next), res=document.getElementById('res');
  res.innerHTML='<div class="result">'+
    '<p class="after">'+tx(c.after||'')+'</p>'+
    (n.note?'<div class="note"><b>'+T('역사 노트','History note')+'</b>'+tx(n.note.text)+'</div>':'')+
    '<div class="next"><button class="btn" id="nx">'+(isEnd(nx0)?T('결말 보기','See the ending'):T('다음 장면','Next scene'))+'</button></div></div>';
  if(!quiet) res.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  document.getElementById('nx').onclick=function(){ sfx('click'); setTimeout(function(){sfx('page');},60); var nx=resolve(c.next); if(isEnd(nx)) ending(nx); else scene(nx); };
}
function has(f){ return Array.isArray(f)? f.some(function(x){return S.flags[x];}) : !!S.flags[f]; }
function resolve(nx){
  if(nx==null) return 'END';
  if(typeof nx==='string') return nx;
  if(Array.isArray(nx)){ for(var i=0;i<nx.length;i++){ var r=nx[i]; if(test(r)) return resolve(r.then); } return 'END'; }
  return test(nx)?resolve(nx.then):resolve(nx['else']);
}
function test(r){
  var ok=true;
  if(r.ifAll) ok=ok&&r.ifAll.every(function(x){return S.flags[x];});
  if(r['if']!==undefined) ok=ok&&has(r['if']);
  if(r.ifNot!==undefined) ok=ok&&!has(r.ifNot);
  if(r.ifNode!==undefined) ok=ok&&([].concat(r.ifNode).indexOf(S.node)>=0);
  if(r.ifRiskBelow!==undefined) ok=ok&&S.g.risk<r.ifRiskBelow;
  if(r.ifRiskAtLeast!==undefined) ok=ok&&S.g.risk>=r.ifRiskAtLeast;
  if(r.ifAllyBelow!==undefined) ok=ok&&S.g.ally<r.ifAllyBelow;
  if(r.any) ok=ok&&r.any.some(test);
  return ok;
}
function isEnd(nx){ return typeof nx==='string' && nx.indexOf('END')===0; }
function endingKey(nx){
  if(nx.indexOf('END:')===0) return nx.slice(4);
  var rules=R.endingLogic||[]; for(var i=0;i<rules.length;i++){ if(test(rules[i])) return rules[i].then; }
  return 'E';
}
function typeCode(){
  var pairs=[['P','R'],['H','D'],['S','A'],['F','L']];
  return pairs.map(function(p,i){var a=S.ax[p[0]]||0,b=S.ax[p[1]]||0; if(a>b) return p[0]; if(b>a) return p[1]; return S.axLast[i]||p[0];}).join('');
}
function flip(code,idx){ var m={P:'R',R:'P',H:'D',D:'H',S:'A',A:'S',F:'L',L:'F'}; return code.split('').map(function(ch,i){return (idx===undefined||idx===i)?m[ch]:ch;}).join(''); }
function typeOf(code){ var list=TYPES||C.types; return list.filter(function(t){return t.code===code;})[0]||C.types.filter(function(t){return t.code===code;})[0]; }
function axisBars(){
  var pairs=[['P','R'],['H','D'],['S','A'],['F','L']];
  return '<div class="axbars">'+pairs.map(function(p){var a=S.ax[p[0]]||0,b=S.ax[p[1]]||0,t=a+b||1,w=Math.round(a*100/t);
    return '<div class="axb"><span>'+esc(C.axes[p[0]])+' '+a+'</span><div class="axt"><div style="width:'+w+'%"></div></div><span>'+b+' '+esc(C.axes[p[1]])+'</span></div>';}).join('')+'</div>';
}
/* the ending is a small dossier of pages */
function ending(nx,p0,quiet){
  if(!quiet) sfx('end');
  var k=endingKey(nx), E=C.endings[k]||{title:k,text:''};
  if(!quiet) markDone(R.id,k);
  var ep=(R.epilogues||{})[k]||''; (R.epilogueAdd||[]).forEach(function(a){ if([].concat(a.ending).indexOf(k)>=0&&test(a)) ep+=(ep?' ':'')+a.text; }); if(S.g.prestige<30&&'ABFG'.indexOf(k)>=0) ep+=(ep?' ':'')+T('국내에서는 굴욕 외교라는 비판이 거셌습니다.','At home, critics attacked the settlement as a humiliating climb-down.');
  var code=typeCode(), t=typeOf(code)||{}, mate=typeOf(flip(code,3))||{}, foe=typeOf(flip(code))||{};
  var asked=S.hist.length, same=S.hist.filter(function(x){return x.real===true;}).length;
  var lec=(C.lectures[k]||[]).concat(C.lectures['*']||[]);
  var F=t.figure||null;
  var pages=[
   {tab:T('결말','Ending'),h:'<div class="end-k"><span>'+T('결말 ','Ending ')+esc(k)+'</span><span>'+esc(C.ep)+'</span></div><h2 class="end-t">'+esc(E.title)+'</h2>'+
     '<div class="end-hypo">'+(E.hypo?T('당신이 만든 1914년 · 가상의 역사','Your 1914 · an alternate history'):T('실제로 일어난 역사','What really happened'))+'</div>'+
     '<div class="paper prose"><p>'+tx(E.text)+'</p>'+(ep?'<p>'+tx(ep)+'</p>':'')+'</div>'},
   {tab:T('전략가 유형','Strategist type'),h:'<div class="typecard"><div class="k">STRATEGIST TYPE</div><div class="n">'+esc(t.name||code)+'</div><div class="l">'+esc(t.line||'')+'</div>'+
     '<div class="ax">'+code.split('').map(function(a){return '<span>'+esc(C.axes[a])+'</span>';}).join('')+'</div>'+axisBars()+
     (t.traits?'<p class="tp">'+esc(t.traits)+'</p>':'')+
     (t.you?'<p class="tp you">'+esc(t.you)+'</p>':'')+
     '<div class="pair">'+T('찰떡 궁합 ','Best match: ')+esc(mate.name||'')+T(' · 상극 ',' · Opposite: ')+esc(foe.name||'')+T(' · 실제 역사와 같은 선택 ',' · Same as history: ')+same+' / '+asked+'</div>'+
     '<div class="share"><button class="btn small" id="card">'+T('결과 카드 만들기','Make result card')+'</button><button class="btn small ghost" id="copy">'+T('게임 주소 복사','Copy game link')+'</button></div><div id="cardbox" class="cardbox" hidden></div></div>'+
     (F?'<div class="sec"><h3>'+esc(F.name)+' ('+esc(F.years)+', '+esc(F.country)+')</h3><p>'+esc(F.life)+'</p><p>'+esc(F.story)+'</p></div>':'<p class="tp">'+esc(t.story||'')+'</p>')+
     (t.kin&&t.kin.length?'<div class="sec"><h3>'+T('당신과 닮은 또 다른 인물','Others who decided like you')+'</h3>'+t.kin.map(function(q){return '<div class="kin"><b>'+esc(q.name)+'</b> <span>'+esc(q.years)+' · '+esc(q.country)+'</span><p>'+esc(q.why)+'</p></div>';}).join('')+'</div>':'')+
     (t.caution?'<div class="note"><b>'+T('이 유형이 놓치기 쉬운 것','What this type tends to miss')+'</b>'+esc(t.caution)+'</div>':'')+
     '<p class="foot">'+esc(C.typeNote)+'</p>'},
   {tab:T('선택 비교','Your choices'),h:'<div class="sec"><h3>'+T('당신의 선택과 실제 역사','Your choices against history')+'</h3><table class="cmp">'+S.hist.map(function(x){
     var sm=x.real===true||(x.real==='partial'&&x.realKey===x.pick);
     return '<tr><td>'+esc(dayLabel(x.date))+'</td><td><b>'+esc(x.title)+'</b><br>'+(sm?'<span class="ok">● '+T('실제 역사와 같은 선택','Same as history')+'</span> '+esc(x.text):T('당신: ','You: ')+esc(x.text)+(x.realText?'<br><span class="rl">'+T('실제: ','History: ')+esc(x.realText)+'</span>':''))+(x.realNote?'<br><span class="rn">'+esc(x.realNote)+'</span>':'')+'</td></tr>';}).join('')+'</table></div>'},
   {tab:T('배경','Background'),h:(R.movers?'<div class="sec"><h3>'+T('이 인물을 움직인 것들','What drove this figure')+'</h3><p>'+tx(R.movers.intro)+'</p><ul class="plain">'+R.movers.views.map(function(v){return '<li>'+tx(v)+'</li>';}).join('')+'</ul>'+(R.movers.note?'<p class="foot">'+tx(R.movers.note)+'</p>':'')+'</div>':'')+
     '<div class="sec"><h3>'+T('배경 읽기','Background reading')+'</h3>'+(C.background||[]).map(function(b){return '<details class="bg"><summary>'+esc(b.q)+'</summary>'+b.a.map(function(q){return '<p>'+esc(q)+'</p>';}).join('')+'</details>';}).join('')+'</div>'},
   {tab:T('실제 역사','History'),h:'<div class="sec"><h3>'+T('실제로 일어난 일','What actually happened')+'</h3><ul class="plain">'+C.history.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
     '<div class="sec"><h3>'+T('한반도와 동아시아','Korea and East Asia')+'</h3><ul class="plain">'+C.eastasia.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
     '<div class="sec"><h3>'+T('함께 읽을 강의','Related lectures')+'</h3><ul class="plain">'+lec.map(function(q){return '<li><a href="'+SITE+'/academy/ir101/'+q+'/" target="_blank" rel="noopener">'+esc(C.lectureTitles[q])+'</a></li>';}).join('')+'</ul></div>'+
     '<div class="share"><button class="btn" id="again">'+T('다른 나라로 다시 하기','Play another power')+'</button></div>'+more()+rights()}
  ];
  function show(p){
    VIEW=function(){ ending(nx,p,true); };
    render(brand()+'<div class="tabs" role="tablist">'+pages.map(function(x,i){return '<button role="tab" class="tab'+(i===p?' on':'')+'" data-p="'+i+'" aria-selected="'+(i===p)+'">'+esc(x.tab)+'</button>';}).join('')+'</div>'+
      '<div class="pg">'+pages[p].h+'</div>'+pager(p,pages.length,p<pages.length-1?T('다음','Next'):''));
    app.querySelectorAll('.tab').forEach(function(b){ b.onclick=function(){ sfx('page'); show(+b.dataset.p); }; });
    bindPager(function(){ show(p-1); }, function(){ show(p+1); });
    var ag=document.getElementById('again'); if(ag) ag.onclick=function(){ sfx('click'); roles(); };
    var cp=document.getElementById('copy'); if(cp) cp.onclick=function(){ var b=this, u=location.href.split('#')[0]; try{navigator.clipboard.writeText(u).then(function(){b.textContent=T('복사했습니다','Copied');},function(){b.textContent=u;});}catch(e){b.textContent=u;} };
    var cd=document.getElementById('card'); if(cd) cd.onclick=function(){ sfx('stamp'); shareCard(t,E,k,same,asked); };
    top();
  }
  show(p0||0);
}
/* shrink a canvas font until the text fits; result left in x._t */
function fit(x,s,font,px,w){ s=String(s||''); while(px>16){ x.font=font.replace('%',px); if(x.measureText(s).width<=w) break; px-=2; } x._t=s; }
/* links back into clisa.ai open in a new tab so the game (and its music) keeps running; from the ending screen (text needs operator approval before going public) */
function more(){
  var L=EN?[['/en/brief/','Briefings','Recent events linked to our assessments and forecasts'],['/en/forecast/','Forecasts','Probability forecasts and how they turned out'],['/en/academy/ir101/','Intro to IR','The ideas behind the July Crisis, lecture by lecture'],['/en/subscribe/','Subscribe','New briefings and features in your feed reader']]
    :[['/brief/','정세 브리핑','최근 사건을 클리사의 판단·전망과 연결해 정리'],['/forecast/','전망과 검증','사안별 확률 전망과 그 결과'],['/academy/ir101/','국제정치 입문','7월 위기를 움직인 생각을 강의로'],['/subscribe/','새 글 알림 받기','새 브리핑과 특집을 구독 앱으로']];
  return '<div class="sec more"><h3>'+T('1914년의 질문은 현재도 이어집니다','The questions of 1914 are still open')+'</h3><div class="morelinks">'+L.map(function(a){return '<a href="'+SITE.replace(/\/en$/,'')+a[0]+'" target="_blank" rel="noopener"><b>'+esc(a[1])+'</b><span>'+esc(a[2])+'</span></a>';}).join('')+'</div></div>';
}
/* copyright and contact, shown on the title screen and at the end of the ending pages */
function rights(){
  return '<footer class="rights"><p>'+T('© 2026 클리사 지오폴리틱스. 이 게임의 글, 그림, 지도, 프로그램의 저작권은 클리사 지오폴리틱스에 있습니다. 지도의 바탕 자료(Natural Earth)와 인용한 사료는 공개 자료입니다.','© 2026 Clisa Geopolitics. The text, artwork, maps and software of this game are the copyright of Clisa Geopolitics. The base map data (Natural Earth) and the quoted historical documents are in the public domain.')+'</p>'+
    '<p>'+T('문의','Contact')+' <a href="mailto:clisageo@clisa.ai">clisageo@clisa.ai</a> · <a href="'+SITE+'/" target="_blank" rel="noopener">clisa.ai'+(EN?'/en':'')+'</a></p></footer>';
}
function shareCard(t,E,k,same,asked){
  var W=1080,H=1350,cv=document.createElement('canvas'); cv.width=W; cv.height=H; var x=cv.getContext('2d');
  var ink='#111111',red='#C1121F',sans='"Pretendard Variable","Noto Sans KR",sans-serif', th=THEME[R.id]||{stripe:[ink]};
  x.fillStyle='#EDEDED'; x.fillRect(0,0,W,H);
  th.stripe.forEach(function(c,i){ x.fillStyle=c; x.fillRect(0,i*18,W,18); });
  x.fillStyle=ink; x.fillRect(70,90,W-140,4); x.fillRect(70,102,W-140,2);
  x.textAlign='left'; x.font='500 28px "IBM Plex Mono",monospace'; x.fillText('CLISA GAMES',70,155); x.textAlign='right'; x.fillText(C.ep,W-70,155);
  x.textAlign='left'; x.font='400 52px "Bebas Neue",sans-serif'; x.fillText('W O R L D   O F',70,250);
  x.font='400 190px "Bebas Neue",sans-serif'; x.fillText('DECISION',66,420);
  x.fillStyle=ink; x.fillRect(70,460,W-140,2);
  x.font='500 30px '+sans; fit(x,R.person+T(' · 당신의 전략가 유형',' · your strategist type'),'500 %px '+sans,30,W-140); x.fillText(x._t,70,540);
  fit(x,t.name||'','400 %px '+DISP,120,W-140); x.fillText(x._t,66,690);
  fit(x,t.line||'','600 %px '+sans,40,W-140); x.fillStyle='#4A4A4A'; x.fillText(x._t,70,760);
  x.fillStyle=ink; x.fillRect(70,820,W-140,2);
  fit(x,T('결말 ','Ending ')+k+' · '+E.title,'400 %px '+DISP,54,W-140); x.fillText(x._t,70,910);
  x.save(); x.translate(70,1000); x.rotate(-0.04); x.strokeStyle=red; x.lineWidth=5; x.font='800 40px '+sans; var st=T('실제 역사와 같은 선택 ','Same as history ')+same+'/'+asked, sw=Math.max(560,x.measureText(st).width+48); x.strokeRect(0,0,sw,86); x.fillStyle=red; x.fillText(st,24,58); x.restore();
  x.fillStyle=ink; x.fillRect(70,H-150,W-140,2); x.font='500 30px "IBM Plex Mono",monospace'; x.fillText('clisa.ai'+(EN?'/en':'')+'/play/1914',70,H-100);
  var url=cv.toDataURL('image/png'), box=document.getElementById('cardbox'), fname='world-of-decision-1914.png';
  /* 2026-10-20: card copy, save and share (copy falls back to save where the browser blocks image copying) */
  var blobP=new Promise(function(res){ if(cv.toBlob) cv.toBlob(function(b){res(b);},'image/png'); else fetch(url).then(function(r){return r.blob();}).then(res); });
  var canShare=false; try{ canShare=!!(navigator.canShare&&navigator.canShare({files:[new File([new Blob([''],{type:'image/png'})],fname,{type:'image/png'})]})); }catch(e){}
  box.innerHTML='<img src="'+url+'" alt="'+T('결과 카드','Result card')+'"><div class="share" style="margin-top:0">'+
    '<button class="btn small" id="cardcopy">'+T('카드 이미지 복사','Copy card image')+'</button>'+
    '<a class="btn small ghost" id="cardsave" style="text-decoration:none" href="'+url+'" download="'+fname+'">'+T('이미지 저장','Save image')+'</a>'+
    (canShare?'<button class="btn small ghost" id="cardshare">'+T('공유','Share')+'</button>':'')+
    '<button class="btn small ghost" id="cardclose">'+T('닫기','Close')+'</button></div>'+
    '<p class="foot">'+T('이미지를 길게 누르거나 오른쪽 버튼을 눌러 저장할 수도 있습니다.','You can also long-press or right-click the image to save it.')+'</p>';
  box.hidden=false; document.getElementById('cardclose').onclick=function(){box.hidden=true;};
  var save=function(){ var a=document.createElement('a'); a.href=url; a.download=fname; document.body.appendChild(a); a.click(); a.remove(); };
  document.getElementById('cardcopy').onclick=function(){ var b=this, fail=function(){ save(); b.textContent=T('복사가 막혀 이미지로 저장했습니다','Copy blocked; image saved instead'); };
    try{ if(!(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem)) return fail();
      navigator.clipboard.write([new ClipboardItem({'image/png':blobP})]).then(function(){ b.textContent=T('복사했습니다','Copied'); }, fail); }catch(e){ fail(); } };
  var sh=document.getElementById('cardshare'); if(sh) sh.onclick=function(){ blobP.then(function(bl){ return navigator.share({files:[new File([bl],fname,{type:'image/png'})], title:'WORLD OF DECISION · 1914', text:T('나의 전략가 유형: ','My strategist type: ')+(t.name||''), url:location.href.split('#')[0]}); }).catch(function(){}); };
}
Promise.all([get(BASE+'data/common.'+LANG+'.json'),opt(BASE+'data/maps'+(EN?'.en':'')+'.json'),opt(BASE+'data/types.'+LANG+'.json')]).then(function(r){
  C=r[0]; MAPS=r[1]; TYPES=r[2];
  var h=location.hash.slice(1); if(h&&ROLES.some(function(x){return x.id===h;})) start(h); else title();
}).catch(function(e){app.textContent=T('자료를 불러오지 못했습니다. ','Could not load the game data. ')+e.message;});
})();
