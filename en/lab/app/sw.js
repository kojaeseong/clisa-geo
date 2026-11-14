/* 2026-11-14: 앱이 /app/으로 옮겨 갔다. 옛 주소의 서비스 워커는 저장본을 지우고 알림 구독을 풀고 스스로 물러난다 */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('clisa-lab-app-')||k.startsWith('clisa-en-app-')).map(k=>caches.delete(k))))
 .then(()=>self.registration.pushManager.getSubscription())
 .then(s=>s?fetch('https://api.clisa.ai/push/unsub',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:s.endpoint})}).catch(()=>{}).then(()=>s.unsubscribe()):null)
 .catch(()=>{}).then(()=>self.registration.unregister())));
