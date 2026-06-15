// My Day — service worker. Receives push, fetches the message text, shows it.
const WORKER = 'https://myday-push.oevmcc.workers.dev';

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) { e.waitUntil(showNext()); });

async function showNext() {
  var title = 'My Day', body = 'Time for your next item.';
  try {
    var id = await idbGet('id');
    if (id) {
      var r = await fetch(WORKER + '/pending?id=' + encodeURIComponent(id));
      if (r.ok) { var m = await r.json(); if (m && m.title) { title = m.title; body = m.body || ''; } }
    }
  } catch (e) {}
  return self.registration.showNotification(title, { body: body, tag: 'myday', renotify: true });
}

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ('focus' in cs[i]) return cs[i].focus(); }
    return self.clients.openWindow('./');
  }));
});

function idbGet(key) {
  return new Promise(function (res) {
    var o = indexedDB.open('myday', 1);
    o.onupgradeneeded = function () { o.result.createObjectStore('kv'); };
    o.onsuccess = function () {
      try {
        var tx = o.result.transaction('kv', 'readonly');
        var rq = tx.objectStore('kv').get(key);
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { res(null); };
      } catch (e) { res(null); }
    };
    o.onerror = function () { res(null); };
  });
}
