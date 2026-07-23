/**
 * Shopee Video Downloader — script.js
 *
 * Arquitetura orientada a API externa com modo demonstração integrado.
 * Troque DEMO_MODE para false e configure API_BASE_URL para usar
 * com seu backend real.
 */

/* ============================================================
   CONFIGURAÇÕES — EDITE AQUI
   ============================================================ */

/**
 * URL base da sua API backend.
 */
const API_BASE_URL = "https://shopee-vd-apishopee-vd-api.onrender.com";

/**
 * Modo demonstração.
 * true  → simula todo o fluxo com dados fictícios (sem API real)
 * false → chama a API real em API_BASE_URL
 */
const DEMO_MODE = false;


/* ============================================================
   CONSTANTES INTERNAS
   ============================================================ */

/** Domínios aceitos como válidos para links da Shopee */
const SHOPEE_DOMAINS = [
  // Sites principais
  "shopee.com.br",
  "shopee.com",
  "shopee.vn",
  "shopee.ph",
  "shopee.sg",
  "shopee.co.id",
  "shopee.co.th",
  "shopee.com.my",
  // Encurtadores de link da Shopee
  "shope.ee",
  "br.shp.ee",   // ← link curto Brasil (ex: br.shp.ee/vjf13l0a)
  "shp.ee",
  "s.shopee.com.br",
];


/** Duração simulada do processamento em ms (modo demo) */
const DEMO_DELAY_BASE = 800;

/** Dados fictícios usados no modo demonstração */
const DEMO_VIDEO_DATA = {
  success: true,
  id: "demo_video_001",
  title: "🛍 Produto incrível com desconto especial — Confira agora na Shopee!",
  thumbnail: "https://placehold.co/360x640/FF6B35/FFFFFF?text=Demo+Video",
  duration: 28,
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
};

/* ============================================================
   ESTADO DA APLICAÇÃO
   ============================================================ */

const state = {
  isProcessing: false,  // bloqueia múltiplas ações simultâneas
  currentVideoData: null,
  deferredInstallPrompt: null, // prompt de instalação PWA
};

/* ============================================================
   REFERÊNCIAS DO DOM
   ============================================================ */

const $ = (id) => document.getElementById(id);

const elVideoUrl        = $("video-url");
const elUrlError        = $("url-error");
const elBtnClearUrl     = $("btn-clear-url");
const elBtnFetch        = $("btn-fetch");
const elPreviewCard     = $("preview-card");
const elPreviewThumb    = $("preview-thumbnail");
const elBtnWatch        = $("btn-watch");
const elPreviewTitle    = $("preview-title");
const elPreviewDuration = $("preview-duration");
const elPreviewDurVal   = $("preview-duration-value");
const elRemoveMetadata  = $("remove-metadata");
const elBtnDownload     = $("btn-download");
const elStatusCard      = $("status-card");
const elStatusIcon      = $("status-icon");
const elStatusMessage   = $("status-message");
const elProgressCont    = $("progress-container");
const elProgressFill    = $("progress-fill");
const elProgressLabel   = $("progress-label");
const elBtnRetry        = $("btn-retry");
const elDownloadLink    = $("download-link");
const elOfflineBanner   = $("offline-banner");
const elInstallBanner   = $("install-banner");
const elBtnInstall      = $("btn-install");
const elBtnDismissInst  = $("btn-dismiss-install");
const elDemoBadge       = $("demo-badge");

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  setupOfflineDetection();
  setupPWAInstall();
  setupEventListeners();
  showDemoBadge();
  console.log(
    `%c[Shopee VD] Inicializado — Modo: ${DEMO_MODE ? "DEMO" : "API"} | API: ${API_BASE_URL}`,
    "color:#FF6B35;font-weight:bold;"
  );
});

/* ============================================================
   DETECÇÃO DE CONEXÃO
   ============================================================ */

function setupOfflineDetection() {
  const updateOnlineStatus = () => {
    elOfflineBanner.classList.toggle("hidden", navigator.onLine);
  };
  window.addEventListener("online",  updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();
}

/* ============================================================
   PWA — INSTALAÇÃO
   ============================================================ */

function setupPWAInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    elInstallBanner.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    elInstallBanner.classList.add("hidden");
    state.deferredInstallPrompt = null;
    console.log("[PWA] Aplicativo instalado com sucesso.");
  });
}

elBtnInstall?.addEventListener("click", async () => {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  const { outcome } = await state.deferredInstallPrompt.userChoice;
  console.log("[PWA] Resposta do usuário:", outcome);
  state.deferredInstallPrompt = null;
  elInstallBanner.classList.add("hidden");
});

elBtnDismissInst?.addEventListener("click", () => {
  elInstallBanner.classList.add("hidden");
});

/* ============================================================
   BADGE DE MODO DEMONSTRAÇÃO
   ============================================================ */

function showDemoBadge() {
  if (elDemoBadge) {
    elDemoBadge.style.display = DEMO_MODE ? "block" : "none";
  }
}

/* ============================================================
   LISTENERS DE EVENTOS
   ============================================================ */

function setupEventListeners() {
  // Campo de URL: mostra/oculta botão limpar
  elVideoUrl.addEventListener("input", () => {
    const hasValue = elVideoUrl.value.trim().length > 0;
    elBtnClearUrl.classList.toggle("hidden", !hasValue);
    clearUrlError();
    // Limpa resultados anteriores quando o link muda
    if (state.currentVideoData) resetResults();
  });

  // Enter no campo dispara busca
  elVideoUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") elBtnFetch.click();
  });

  // Botão limpar URL
  elBtnClearUrl.addEventListener("click", () => {
    elVideoUrl.value = "";
    elBtnClearUrl.classList.add("hidden");
    elVideoUrl.focus();
    clearUrlError();
    resetResults();
  });

  // Buscar vídeo
  elBtnFetch.addEventListener("click", handleFetchVideo);

  // Baixar vídeo
  elBtnDownload.addEventListener("click", handleDownloadVideo);

  // Tentar novamente
  elBtnRetry.addEventListener("click", () => {
    resetResults();
    elVideoUrl.focus();
  });

  // Clique no botão final de salvar (força o download via Blob)
  elDownloadLink.addEventListener("click", async (e) => {
    if (elDownloadLink.href.startsWith("blob:")) return;

    e.preventDefault();
    const targetUrl = elDownloadLink.href;
    const filename = elDownloadLink.download || "video-shopee.mp4";

    const originalText = elDownloadLink.textContent;
    elDownloadLink.textContent = "⏳ Salvando arquivo...";

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Erro ao baixar o arquivo.");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const tempA = document.createElement("a");
      tempA.href = blobUrl;
      tempA.download = filename;
      document.body.appendChild(tempA);
      tempA.click();
      document.body.removeChild(tempA);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      elDownloadLink.textContent = "✅ Download concluído com sucesso!";
    } catch (err) {
      console.error("[DownloadLink]", err);
      window.location.href = targetUrl;
      elDownloadLink.textContent = originalText;
    }
  });
}


/* ============================================================
   VALIDAÇÃO DE URL
   ============================================================ */

/**
 * Verifica se o texto parece uma URL válida
 * @param {string} text
 * @returns {boolean}
 */
function isValidUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Verifica se a URL pertence a um domínio da Shopee
 * @param {string} text
 * @returns {boolean}
 */
function isShopeeUrl(text) {
  try {
    const url = new URL(text);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return SHOPEE_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith("." + d)
    );
  } catch {
    return false;
  }
}

/**
 * Exibe mensagem de erro no campo de URL
 * @param {string} msg
 */
function showUrlError(msg) {
  elUrlError.textContent = msg;
  elUrlError.classList.remove("hidden");
  elVideoUrl.classList.add("is-error");
}

function clearUrlError() {
  elUrlError.textContent = "";
  elUrlError.classList.add("hidden");
  elVideoUrl.classList.remove("is-error");
}

/* ============================================================
   FLUXO: BUSCAR VÍDEO
   ============================================================ */

async function handleFetchVideo() {
  if (state.isProcessing) return;

  const url = elVideoUrl.value.trim();

  // Validações
  if (!url) {
    showUrlError("Cole o link do vídeo antes de continuar.");
    elVideoUrl.focus();
    return;
  }

  if (!isValidUrl(url)) {
    showUrlError("O texto informado não parece ser uma URL válida.");
    elVideoUrl.focus();
    return;
  }

  if (!isShopeeUrl(url)) {
    showUrlError("Apenas links da Shopee são aceitos (shopee.com.br, br.shp.ee, shope.ee etc).");
    elVideoUrl.focus();
    return;
  }

  clearUrlError();
  resetResults();
  setFetchLoading(true);
  showStatus("🔍", "Analisando link…", "");

  try {
    const data = await fetchVideoInfo(url);

    if (!data.success) {
      throw new Error(data.message || "Não foi possível obter informações do vídeo.");
    }

    state.currentVideoData = data;
    renderPreview(data);
    hideStatus();

  } catch (err) {
    showStatus("❌", err.message || "Erro ao processar o link.", "is-error");
    showRetry();
    console.error("[fetchVideo]", err);
  } finally {
    setFetchLoading(false);
  }
}

/**
 * Chama a API ou retorna dados de demonstração
 * Endpoint: POST /api/video/info
 * Body: { url }
 * @param {string} url
 * @returns {Promise<object>}
 */
async function fetchVideoInfo(url) {
  if (DEMO_MODE) {
    return simulateFetchVideoInfo(url);
  }

  const response = await fetch(`${API_BASE_URL}/api/video/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Erro da API: ${response.status}`);
  }

  return response.json();
}

/* ── Simulação modo demo: buscar info ── */
async function simulateFetchVideoInfo(url) {
  await delay(DEMO_DELAY_BASE + randomInt(200, 600));
  // Simula ocasionalmente um erro de demonstração (10% de chance)
  if (Math.random() < 0.1) {
    throw new Error("[DEMO] Simulação de erro — tente novamente.");
  }
  return { ...DEMO_VIDEO_DATA, videoUrl: DEMO_VIDEO_DATA.videoUrl };
}

/* ============================================================
   FLUXO: DOWNLOAD / PROCESSAMENTO
   ============================================================ */

async function handleDownloadVideo() {
  if (state.isProcessing || !state.currentVideoData) return;
  if (!navigator.onLine && !DEMO_MODE) {
    showStatus("📡", "Você está offline. Conecte-se para baixar o vídeo.", "is-error");
    showRetry();
    return;
  }

  const removeMetadata = elRemoveMetadata.checked;
  const url = elVideoUrl.value.trim();

  setDownloadLoading(true);
  showStatus("⚙️", "Preparando vídeo…", "");
  setProgress(10);

  try {
    // Passo 1 — processar vídeo
    showStatus("⚙️", "Preparando vídeo…", "");
    await delay(DEMO_DELAY_BASE);
    setProgress(30);

    if (removeMetadata) {
      showStatus("🧹", "Removendo metadados…", "");
      await delay(DEMO_DELAY_BASE + 400);
      setProgress(65);
    }

    showStatus("📦", "Finalizando arquivo…", "");
    const result = await processVideo(url, removeMetadata);

    if (!result.success) {
      throw new Error(result.message || "Falha ao processar o vídeo.");
    }

    setProgress(100);
    await delay(400);

    // 1. Atualiza mensagens de status primeiro
    showStatus("✅", "Download pronto! Clique no botão abaixo para salvar.", "is-success");
    elProgressCont.classList.add("hidden");

    // 2. Configura e EXIBE o botão de download (APÓS o showStatus)
    elDownloadLink.href = result.downloadUrl;
    elDownloadLink.download = result.filename || "video-shopee.mp4";
    elDownloadLink.classList.remove("hidden");

  } catch (err) {
    showStatus("❌", err.message || "Erro ao processar o vídeo.", "is-error");
    setProgress(0);
    elProgressCont.classList.add("hidden");
    showRetry();
    console.error("[downloadVideo]", err);
  } finally {
    setDownloadLoading(false);
  }
}


/**
 * Chama a API de processamento ou simula no modo demo
 * Endpoint: POST /api/video/process
 * Body: { url, removeMetadata }
 * @param {string} url
 * @param {boolean} removeMetadata
 * @returns {Promise<object>}
 */
async function processVideo(url, removeMetadata) {
  if (DEMO_MODE) {
    return simulateProcessVideo();
  }

  const response = await fetch(`${API_BASE_URL}/api/video/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, removeMetadata }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Erro da API: ${response.status}`);
  }

  const data = await response.json();

  // Monta URL de download
  // Endpoint: GET /api/video/download/:id
  data.downloadUrl = `${API_BASE_URL}/api/video/download/${data.id}`;
  return data;
}

/* ── Simulação modo demo: processar vídeo ── */
async function simulateProcessVideo() {
  await delay(DEMO_DELAY_BASE + randomInt(300, 700));
  return {
    success: true,
    id: "demo_download_001",
    downloadUrl: DEMO_VIDEO_DATA.videoUrl, // vídeo de exemplo público
    filename: "video-shopee-demo.mp4",
  };
}

/* ============================================================
   RENDERIZAR PREVIEW
   ============================================================ */

/**
 * Preenche o card de pré-visualização com os dados do vídeo
 * @param {object} data
 */
function renderPreview(data) {
  // Thumbnail
  if (data.thumbnail) {
    elPreviewThumb.src = data.thumbnail;
    elPreviewThumb.alt = data.title || "Capa do vídeo";
  } else {
    elPreviewThumb.src = "https://placehold.co/360x640/EEEEEE/AAAAAA?text=Sem+capa";
    elPreviewThumb.alt = "Sem imagem de capa";
  }

  // Botão assistir
  elBtnWatch.href = data.videoUrl || elVideoUrl.value;

  // Título
  elPreviewTitle.textContent = data.title || "Vídeo da Shopee";

  // Duração
  if (data.duration && data.duration > 0) {
    elPreviewDurVal.textContent = formatDuration(data.duration);
    elPreviewDuration.classList.remove("hidden");
  } else {
    elPreviewDuration.classList.add("hidden");
  }

  // Exibe o card
  elPreviewCard.classList.remove("hidden");
}

/* ============================================================
   UI HELPERS
   ============================================================ */

/**
 * Exibe o card de status com ícone e mensagem
 * @param {string} icon
 * @param {string} message
 * @param {string} modifier  — "is-error" | "is-success" | ""
 */
function showStatus(icon, message, modifier) {
  elStatusIcon.textContent = icon;
  elStatusMessage.textContent = message;
  elStatusCard.className = "card status-card";
  if (modifier) elStatusCard.classList.add(modifier);
  elStatusCard.classList.remove("hidden");
  elProgressCont.classList.remove("hidden");
  elBtnRetry.classList.add("hidden");
  elDownloadLink.classList.add("hidden");
}

function hideStatus() {
  elStatusCard.classList.add("hidden");
  elProgressCont.classList.add("hidden");
}

/** Atualiza a barra de progresso (0–100) */
function setProgress(pct) {
  const value = Math.min(100, Math.max(0, pct));
  elProgressFill.style.width = `${value}%`;
  elProgressLabel.textContent = `${value}%`;
  elProgressCont.setAttribute("aria-valuenow", value);
  elProgressCont.classList.remove("hidden");
}

function showRetry() {
  elBtnRetry.classList.remove("hidden");
  elProgressCont.classList.add("hidden");
}

/** Estado de loading do botão Buscar */
function setFetchLoading(loading) {
  state.isProcessing = loading;
  elBtnFetch.disabled = loading;
  elBtnFetch.querySelector(".btn__icon").classList.toggle("hidden", loading);
  elBtnFetch.querySelector(".btn__spinner").classList.toggle("hidden", !loading);
  elBtnFetch.querySelector(".btn__label").textContent = loading ? "Buscando…" : "Buscar vídeo";
}

/** Estado de loading do botão Baixar */
function setDownloadLoading(loading) {
  state.isProcessing = loading;
  elBtnDownload.disabled = loading;
  elBtnDownload.querySelector(".btn__icon").classList.toggle("hidden", loading);
  elBtnDownload.querySelector(".btn__spinner").classList.toggle("hidden", !loading);
  elBtnDownload.querySelector(".btn__label").textContent = loading ? "Processando…" : "Baixar vídeo";
}

/** Reseta todos os resultados anteriores */
function resetResults() {
  state.currentVideoData = null;
  elPreviewCard.classList.add("hidden");
  hideStatus();
  setProgress(0);
  elBtnRetry.classList.add("hidden");
  elDownloadLink.classList.add("hidden");
  elPreviewThumb.src = "";
  elBtnWatch.href = "#";
}

/* ============================================================
   UTILITÁRIOS
   ============================================================ */

/**
 * Formata segundos como mm:ss ou hh:mm:ss
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

const pad = (n) => String(n).padStart(2, "0");

/** Promise que aguarda ms milissegundos */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Inteiro aleatório entre min e max (inclusive) */
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
