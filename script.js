let pdfDoc = null;
let pageNum = 1;
let isDouble = false;
let baseScale = 1;
let userZoom = 1;

const singleCanvas = document.getElementById("pdfCanvas");
const singleCtx = singleCanvas.getContext("2d");

const leftCanvas = document.getElementById("leftPage");
const rightCanvas = document.getElementById("rightPage");
const leftCtx = leftCanvas.getContext("2d");
const rightCtx = rightCanvas.getContext("2d");

const zoomCenter = document.getElementById("zoomCenter");
const zoomTop = document.getElementById("zoomTop");

document.getElementById("singleBtn").onclick = () => { isDouble = false; render(); };
document.getElementById("doubleBtn").onclick = () => { isDouble = true; render(); };
document.getElementById("nextBtn").onclick = nextPage;
document.getElementById("prevBtn").onclick = prevPage;

document.getElementById("pdfFile").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    const typedArray = new Uint8Array(this.result);
    pdfjsLib.getDocument(typedArray).promise.then(pdf => {
      pdfDoc = pdf;
      pageNum = 1;
      userZoom = 1;
      render();
    });
  };
  reader.readAsArrayBuffer(file);
});

window.addEventListener("resize", () => {
  if (pdfDoc) render();
});

// ---------- SCALE ----------
function getScale(page, mode) {
  const viewport = page.getViewport({ scale: 1 });
  const w = window.innerWidth;
  const h = window.innerHeight;

  baseScale = mode === "single"
    ? w / viewport.width
    : (w / 2) / viewport.width;

  const heightScale = (h * 0.85) / viewport.height;
  baseScale = Math.min(baseScale, heightScale);

  return baseScale * userZoom;
}

// ---------- RENDER ----------
function render() {
  if (!pdfDoc) return;
  isDouble ? renderDouble() : renderSingle();
  updateZoomUI(false);
}

function renderSingle() {
  document.getElementById("doublePage").style.display = "none";
  singleCanvas.style.display = "block";

  pdfDoc.getPage(pageNum).then(page => {
    const scale = getScale(page, "single");
    drawPage(page, singleCanvas, singleCtx, scale);
  });
}

function renderDouble() {
  document.getElementById("doublePage").style.display = "flex";
  singleCanvas.style.display = "none";

  drawDouble(pageNum, leftCanvas, leftCtx);
  if (pageNum + 1 <= pdfDoc.numPages)
    drawDouble(pageNum + 1, rightCanvas, rightCtx);
}

function drawDouble(num, canvas, ctx) {
  pdfDoc.getPage(num).then(page => {
    const scale = getScale(page, "double");
    drawPage(page, canvas, ctx, scale);
  });
}

function drawPage(page, canvas, ctx, scale) {
  const viewport = page.getViewport({ scale });
  const dpr = window.devicePixelRatio || 1;

  canvas.width = viewport.width * dpr;
  canvas.height = viewport.height * dpr;
  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";

  ctx.setTransform(1,0,0,1,0,0);
  ctx.setTransform(dpr,0,0,dpr,0,0);

  page.render({ canvasContext: ctx, viewport });
}

// ---------- NAV ----------
function nextPage() {
  pageNum += isDouble ? 2 : 1;
  if (pageNum > pdfDoc.numPages) pageNum = pdfDoc.numPages;
  render();
}
function prevPage() {
  pageNum -= isDouble ? 2 : 1;
  if (pageNum < 1) pageNum = 1;
  render();
}

// ---------- ZOOM ----------
function zoomIn() {
  userZoom = Math.min(userZoom + 0.1, 2.2);
  showZoom();
  render();
}
function zoomOut() {
  userZoom = Math.max(userZoom - 0.1, 0.7);
  showZoom();