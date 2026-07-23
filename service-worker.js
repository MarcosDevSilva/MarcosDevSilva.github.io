/**
 * Shopee Video Downloader — service-worker.js
 *
 * Estratégia: Cache-First para assets estáticos,
 *             Network-First para requisições à API.
 *
 * Atualizar CACHE_VERSION a cada novo deploy para forçar
 * a reinstalação do cache nos clientes.
 */

/* ============================================================
   CONFIGURAÇÃO DO CACHE
   ============================================================ */

const CACHE_VERSION  = "shopee-vd-v3";
const CACHE_STATIC   = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC  = `${CACHE_VERSION}-dynamic`;

/** Lista de arquivos que serão pré-cacheados no install */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
];

/** Domínios da API — usam Network-First (nunca cacheados) */
const API_ORIGINS = ["shopee-vd-apishopee-vd-api.onrender.com"];


/* ============================================================
   EVENTO: INSTALL
   Pré-cacheia todos os assets estáticos listados acima.
   ============================================================ */

self.addEventListener("install", (event) => {
  console.log("[SW] Install — versão:", CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log("[SW] Pré-cacheando assets estáticos…");
      return cache.addAll(PRECACHE_URLS);
    })
  );

  // Força ativação imediata sem esperar fechar abas antigas
  self.skipWaiting();
});

/* ============================================================
   EVENTO: ACTIVATE
   Remove caches de versões antigas.
   ============================================================ */

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate — limpando caches antigos…");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
          .map((key) => {
            console.log("[SW] Removendo cache obsoleto:", key);
            return caches.delete(key);
          })
      )
    )
  );

  // Assume controle imediato de todas as abas abertas
  self.clients.claim();
});

/* ============================================================
   EVENTO: FETCH
   Roteamento de estratégias de cache por tipo de requisição.
   ============================================================ */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora extensões do browser e requisições não-HTTP
  if (!request.url.startsWith("http")) return;

  // Ignora métodos que não sejam GET (POST, PUT etc.)
  if (request.method !== "GET") return;

  // API → Network-First (sem cache)
  if (isApiRequest(url)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Assets estáticos → Cache-First
  event.respondWith(cacheFirst(request));
});

/* ============================================================
   ESTRATÉGIAS DE CACHE
   ============================================================ */

/**
 * Cache-First: busca no cache; se não encontrar, busca na rede
 * e armazena no cache dinâmico.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Se estiver offline e não tiver cache, retorna página offline
    const offlinePage = await caches.match("/index.html");
    return offlinePage || new Response("Offline", { status: 503 });
  }
}

/**
 * Network-Only: sempre busca na rede.
 * Se falhar, retorna um erro JSON legível.
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Sem conexão com a internet. Conecte-se e tente novamente.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/* ============================================================
   UTILITÁRIOS
   ============================================================ */

/**
 * Verifica se a requisição é destinada à API
 * @param {URL} url
 * @returns {boolean}
 */
function isApiRequest(url) {
  return API_ORIGINS.some(
    (origin) => url.hostname === origin || url.hostname.endsWith("." + origin)
  );
}

/* ============================================================
   EVENTO: MESSAGE
   Permite que a página envie comandos ao SW (ex.: forçar update).
   ============================================================ */

self.addEventListener("message", (event) => {
  if (event.data?.action === "skipWaiting") {
    self.skipWaiting();
  }
  if (event.data?.action === "clearCache") {
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});
