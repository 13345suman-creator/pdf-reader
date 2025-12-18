let pdfDoc, pageNum = 1;
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const textLayerDiv = document.getElementById("textLayer");
const menu = document.getElementById("contextMenu");

let currentSelection = null;

document.getElementById("pdfInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    pdfjsLib.getDocument({ data: new Uint8Array(reader.result) }).promise
      .then(pdf => {
        pdfDoc = pdf;
        renderPage();
      });
  };
  reader.readAsArrayBuffer(file);
});

function renderPage() {
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale: 1.4 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({ canvasContext: ctx, viewport });

    // TEXT LAYER
    page.getTextContent().then(textContent => {
      textLayerDiv.innerHTML = "";
      pdfjsLib.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport,
        textDivs: []
      });
    });
  });
}

/* SELECTION DETECT */
document.addEventListener("selectionchange", () => {
  const sel = window.getSelection();
  if (sel && sel.toString().trim().length > 0) {
    currentSelection = sel;
  }
});

/* LONG PRESS MENU */
document.addEventListener("touchend", e => {
  if (!currentSelection) return;
  menu.style.left = e.changedTouches[0].clientX + "px";
  menu.style.top = e.changedTouches[0].clientY + "px";
  menu.hidden = false;
});

/* MENU ACTION */
menu.addEventListener("click", e => {
  const action = e.target.dataset.action;
  if (!action || !currentSelection) return;

  const range = currentSelection.getRangeAt(0);
  const span = document.createElement("span");
  span.className = action === "highlight" ? "highlight" : "underline";
  range.surroundContents(span);

  if (action === "summary" || action === "mcq") {
    const text = currentSelection.toString();
    alert(action.toUpperCase() + " READY FOR AI:\n\n" + text);
  }

  currentSelection.removeAllRanges();
  currentSelection = null;
  menu.hidden = true;
});