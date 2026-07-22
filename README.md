# 🛍 Shopee Video Downloader

**PWA para download de vídeos públicos da Shopee — sem metadados desnecessários.**

> ⚠️ **Aviso:** Use este sistema apenas para baixar vídeos que você tem autorização de uso. Respeite os direitos autorais e os [Termos de Uso da Shopee](https://shopee.com.br/legalpages/terms).

---

## 📋 Objetivo

O Shopee Video Downloader é uma aplicação web progressiva (PWA) que permite colar o link de um vídeo público da Shopee e baixá-lo de forma limpa, com a opção de remover metadados desnecessários do arquivo.

A interface roda 100% no navegador. O processamento real (download do vídeo e remoção de metadados) é realizado por um **backend externo** que você deve configurar.

---

## 📁 Estrutura do projeto

```
shopee-video-downloader/
├── index.html          ← Página principal
├── style.css           ← Estilos (design system completo)
├── script.js           ← Lógica da aplicação + integração com API
├── manifest.json       ← Configuração da PWA
├── service-worker.js   ← Cache offline e estratégias de rede
├── README.md           ← Esta documentação
├── icons/              ← Ícones em vários tamanhos (gerados via script)
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── assets/             ← Recursos adicionais (imagens, fontes locais etc.)
```

---

## 🚀 Como executar localmente

Você precisa de um servidor HTTP local (abrir o `index.html` direto no navegador não registra o Service Worker).

### Opção 1 — VS Code Live Server

1. Instale a extensão **Live Server** no VS Code.
2. Clique com o botão direito em `index.html` → **Open with Live Server**.
3. Acesse `http://127.0.0.1:5500`.

### Opção 2 — Python (sem instalação extra)

```bash
python -m http.server 8080
```

Acesse: `http://localhost:8080`

### Opção 3 — Node.js (npx)

```bash
npx serve .
```

Acesse o endereço exibido no terminal.

---

## 🎮 Modo demonstração

O modo demonstração simula todo o fluxo (busca, pré-visualização, processamento, download) **sem precisar de uma API real**.

Para ativar ou desativar, edite a constante no início de `script.js`:

```javascript
// true  → modo demo ativo (dados fictícios)
// false → usa a API real em API_BASE_URL
const DEMO_MODE = true;
```

Quando ativo, a interface exibe um badge **DEMO** no cabeçalho.

---

## 🔧 Como configurar a URL da API

Quando estiver pronto para conectar ao seu backend, edite em `script.js`:

```javascript
const API_BASE_URL = "https://minha-api.onrender.com";
const DEMO_MODE    = false;
```

Lembre de atualizar também a constante `API_ORIGINS` no `service-worker.js` com o domínio do seu backend, para que o Service Worker use a estratégia correta (Network-First):

```javascript
const API_ORIGINS = ["minha-api.onrender.com"];
```

---

## 🌐 Como publicar no GitHub Pages

1. Faça commit e push de todos os arquivos para o repositório.
2. No GitHub, acesse **Settings → Pages**.
3. Em **Source**, selecione o branch `main` (ou `master`) e a pasta `/` (root).
4. Clique em **Save**.
5. Após alguns minutos, seu site estará disponível em:
   `https://<seu-usuario>.github.io/<repositorio>/`

> **Atenção:** O GitHub Pages serve arquivos estáticos apenas. O download real dos vídeos precisa de um backend externo (veja a seção de API abaixo).

---

## 📱 Como configurar a PWA

A PWA é configurada automaticamente via `manifest.json` e `service-worker.js`.

Para personalizar:

| Campo | Arquivo | O que muda |
|-------|---------|-----------|
| Nome do app | `manifest.json` → `name` | Nome exibido na instalação |
| Nome curto | `manifest.json` → `short_name` | Nome no ícone da tela inicial |
| Cor do tema | `manifest.json` → `theme_color` | Cor da barra do navegador |
| Cor de fundo | `manifest.json` → `background_color` | Splash screen |
| Versão do cache | `service-worker.js` → `CACHE_VERSION` | Forçar atualização nos clientes |

**Para atualizar os ícones:** Substitua os arquivos na pasta `icons/` por versões personalizadas nos tamanhos indicados.

---

## 🔌 Endpoints que o backend deve disponibilizar

### `POST /api/video/info`
Retorna informações sobre o vídeo.

**Request:**
```json
{ "url": "https://shopee.com.br/..." }
```

**Response:**
```json
{
  "success": true,
  "id": "video_abc123",
  "title": "Nome do produto/vídeo",
  "thumbnail": "https://cdn.shopee.com/imagem.jpg",
  "duration": 30,
  "videoUrl": "https://..."
}
```

---

### `POST /api/video/process`
Processa o vídeo (download + remoção de metadados).

**Request:**
```json
{
  "url": "https://shopee.com.br/...",
  "removeMetadata": true
}
```

**Response:**
```json
{
  "success": true,
  "id": "download_abc123",
  "filename": "video-shopee.mp4"
}
```

---

### `GET /api/video/download/:id`
Retorna o arquivo de vídeo final para download.

---

## 🧹 Remoção de metadados

A remoção de metadados é executada **pelo backend**, não pelo navegador.

O frontend envia apenas a opção `removeMetadata: true` na requisição.

No backend, você pode usar o **FFmpeg** para gerar um arquivo limpo:

```bash
ffmpeg -i entrada.mp4 -map_metadata -1 -c copy saida.mp4
```

| Parâmetro | Função |
|-----------|--------|
| `-map_metadata -1` | Remove todos os metadados do arquivo de saída |
| `-c copy` | Copia os streams sem recodificar (mais rápido) |

> Não é possível executar FFmpeg diretamente no GitHub Pages. Isso requer um servidor Node.js, Python, Go etc.

---

## ⚠️ Limitações do GitHub Pages

| Recurso | Disponível no Pages? |
|---------|----------------------|
| Interface web (HTML/CSS/JS) | ✅ Sim |
| Service Worker / PWA | ✅ Sim (HTTPS obrigatório) |
| Download de vídeos | ❌ Não (requer backend) |
| Processamento FFmpeg | ❌ Não (requer backend) |
| Variáveis de ambiente | ❌ Não (expo ao frontend) |
| CORS para APIs externas | ⚠️ Depende do servidor da API |

---

## 📜 Aviso sobre direitos autorais

Este projeto é **open-source para fins educacionais**.

- Utilize apenas para baixar vídeos que você criou ou que o criador autorizou explicitamente.
- Não utilize para scraping em massa, redistribuição de conteúdo de terceiros ou qualquer atividade que viole os [Termos de Serviço da Shopee](https://shopee.com.br/legalpages/terms).
- O download de conteúdo protegido por direitos autorais sem permissão pode ser ilegal em sua jurisdição.
- Os autores deste projeto não se responsabilizam pelo uso indevido da ferramenta.

---

## 🛠 Stack e compatibilidade

- **HTML5** / **CSS3** / **JavaScript ES2020+**
- Sem frameworks ou bibliotecas externas
- Compatível com Chrome, Firefox, Safari, Edge (versões modernas)
- PWA instalável no Android, iOS (Safari) e Desktop (Chrome/Edge)

---

## 📄 Licença

MIT License — veja o arquivo `LICENSE` para detalhes.