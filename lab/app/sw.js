/* 클리사 앱 시험판 서비스 워커: 언제나 네트워크 먼저(브라우저 저장본도 거치지 않고 서버에 확인), 끊겼을 때만 저장본 · 새 소식 알림(2026-11-13) */
const C='clisa-lab-app-3',API='https://api.clisa.ai';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('clisa-lab-app-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith('/lab/app/'))return;
e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r)));});
/* 서버는 내용 없이 깨우기만 보낸다. 문구는 /push/last에서 받아 띄운다 */
self.addEventListener('push',e=>{e.waitUntil(self.registration.pushManager.getSubscription()
 .then(s=>fetch(API+'/push/last',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:s?s.endpoint:''})}).then(r=>r.json()))
 .catch(()=>null)
 .then(d=>{const it=(d&&d.items&&d.items.length)?d.items:[{tag:'news',title:'클리사',body:'새 소식이 있습니다.',url:'/lab/app/'}];
  return Promise.all(it.map(x=>self.registration.showNotification(x.title,{body:x.body,tag:x.tag,renotify:true,icon:'/lab/app/app-192.png',badge:'/lab/app/badge-96.png',data:{url:x.url||'/lab/app/'}})))
   .then(()=>self.registration.getNotifications()).then(ns=>{if(self.navigator.setAppBadge)return self.navigator.setAppBadge(ns.length)}).catch(()=>{})}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'/lab/app/',location.origin).href;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.indexOf(location.origin+'/lab/app/')===0&&'focus'in c){return c.navigate(url).then(w=>(w||c).focus()).catch(()=>c.focus())}}return self.clients.openWindow(url)}))});
