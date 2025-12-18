let pdfDoc = null;
let pageNum = 1;
let scale = 1;
let isRendering = false;

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const zoomInfo = document.getElementById("zoomInfo");

document.getElementById("pdfInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    pdfjsLib.getDocument({ data: new Uint8Array(reader.result) }).promise
      .then(pdf => {
        pdfDoc = pdf;
        pageNum = 1;
        scale = 1;
        renderPage();
      });
  };
  reader.readAsArrayBuffer(file);
});

function renderPage() {
  if (!pdfDoc || isRendering) return;
  isRendering = true;

  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      zoomInfo.textContent = Math.round(scale * 100) + "%";
      isRendering = false;
    });
  });
}

/* BUTTON CONTROLS */
document.getElementById("nextBtn").onclick = () => {
  if (pageNum < pdfDoc.numPages) {
    pageNum++;
    renderPage();
  }
};

document.getElementById("prevBtn").onclick = () => {
  if (pageNum > 1) {
    pageNum--;
    renderPage();
  }
};

document.getElementById("zoomIn").onclick = () => smoothZoom(1.1);
document.getElementById("zoomOut").onclick = () => smoothZoom(0.9);

/* SMOOTH ZOOM (PRO FEEL) */
function smoothZoom(factor) {
  let target = Math.min(Math.max(scale * factor, 0.6), 2.5);
  let start = scale;
  let step = 0;

  function animate() {
    step += 0.08;
    scale = start + (target - start) * step;
    renderPage();
    if (step < 1) requestAnimationFrame(animate);
  }
  animate();
}

/* GESTURE PAGE SWIPE */
let touchStartX = 0;
document.addEventListener("touchstart", e => {
  if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  let diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 60) {
    diff < 0 ? nextBtn.click() : prevBtn.click();
  }
});