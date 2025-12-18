let pdfDoc = null;
let pageNum = 1;
let zoom = 1;

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const zoomText = document.getElementById("zoomText");

document.getElementById("pdfFile").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    const typedArray = new Uint8Array(this.result);
    pdfjsLib.getDocument({ data: typedArray }).promise.then(pdf => {
      pdfDoc = pdf;
      pageNum = 1;
      zoom = 1;
      renderPage();
    });
  };
  reader.readAsArrayBuffer(file);
});

function renderPage() {
  if (!pdfDoc) return;

  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale: zoom });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    page.render({ canvasContext: ctx, viewport });
    zoomText.innerText = Math.round(zoom * 100) + "%";
  });
}

function nextPage() {
  if (pageNum < pdfDoc.numPages) {
    pageNum++;
    renderPage();
  }
}

function prevPage() {
  if (pageNum > 1) {
    pageNum--;
    renderPage();
  }
}

function zoomIn() {
  zoom = Math.min(zoom + 0.1, 2.5);
  renderPage();
}

function zoomOut() {
  zoom = Math.max(zoom - 0.1, 0.7);
  renderPage();
}

/* Pinch to Zoom */
let startDist = 0;
document.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    startDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

document.addEventListener("touchmove", e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const newDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );

    zoom += (newDist - startDist) * 0.0005;
    zoom = Math.max(0.7, Math.min(zoom, 2.5));
    startDist = newDist;
    renderPage();
  }
}, { passive: false });