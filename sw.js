/* ============================================
   প্রো ক্যালকুলেটর — Service Worker (sw.js)
   অফলাইনে চালানোর জন্য সব ফাইল ক্যাশ করে রাখে
============================================ */

const CACHE_NAME = 'pro-calculator-v2.0';

// যেসব ফাইল অফলাইনের জন্য ক্যাশ হবে
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-512.png',
    // Font Awesome আইকনগুলো অফলাইনে দেখানোর জন্য
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.ttf',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.ttf',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.ttf'
];

// ১️⃣ Install — প্রথমবার চললে সব ফাইল ক্যাশ করে
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url))))
            .then(() => self.skipWaiting())
    );
});

// ২️⃣ Activate — পুরনো ভার্সনের ক্যাশ মুছে ফেলে
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// ৩️⃣ Fetch — অনলাইনে নেটওয়ার্ক, অফলাইনে ক্যাশ থেকে দেখায়
self.addEventListener('fetch', event => {

    // পেজ খোলার রিকোয়েস্ট হলে
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // অন্য সব ফাইলের জন্য (CSS, ফন্ট, আইকন ইত্যাদি)
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request)
                .then(response => {
                    // নতুন ফাইল হলে ক্যাশে জমা রাখে
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached);
        })
    );
});
