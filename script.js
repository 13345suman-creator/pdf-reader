// STEP-3: Text selection ONLY (safe)
// Keeps STEP-2 zoom/pinch/pan/swipe behavior intact.

const pdfFile = document.getElementById('pdfFile');
const canvas = document.getElementById('pdfCanvas');
const wrapper = document.getElementById('canvasWrapper');
const textLayerDiv = document.getElementById('textLayer');
const pageInfo = document.getElementById('pageInfo');

const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');

const selPanel = document.getElementById('selectionPanel');
const selTextDiv = document.getElementById('selText');

const ctx = canvas.getContext('2d');

let pdfDoc=null, pageNum=1;
let baseScale=1, zoomScale=1;
let offsetX=0, offsetY=0;

// --- helpers ---
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// --- load pdf ---
pdfFile.addEventListener('change', async (e)=>{
  const f=e.target.files[0]; if(!f) return;
  const arr=await f.arrayBuffer();
  pdfDoc=await pdfjsLib.getDocument({data:new Uint8Array(arr)}).promise;
  pageNum=1; zoomScale=1; offsetX=0; offsetY=0;
  await renderPage(true);
});

// --- render page + text layer ---
async function renderPage(autoFit=false){
  if(!pdfDoc) return;
  const page=await pdfDoc.getPage(pageNum);

  const vp1=page.getViewport({scale:1});
  if(autoFit){
    const vw=document.getElementById('viewer').clientWidth;
    baseScale=(vw*0.95)/vp1.width;
    offsetX=0; offsetY=0;
  }
  const scale=baseScale*zoomScale;
  const vp=page.getViewport({scale});

  const dpr=window.devicePixelRatio||1;
  canvas.width=Math.round(vp.width*dpr);
  canvas.height=Math.round(vp.height*dpr);
  canvas.style.width=Math.round(vp.width)+'px';
  canvas.style.height=Math.round(vp.height)+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport:vp}).promise;

  // render text layer
  const textContent=await page.getTextContent();
  textLayerDiv.innerHTML='';
  textLayerDiv.style.width=canvas.style.width;
  textLayerDiv.style.height=canvas.style.height;
  pdfjsLib.renderTextLayer({
    textContent,
    container:textLayerDiv,
    viewport:vp,
    textDivs:[]
  });

  pageInfo.textContent=`Page ${pageNum} / ${pdfDoc.numPages}`;
  applyTransform();
}

// --- transform for pan ---
function applyTransform(){
  wrapper.style.transform=`translate(${offsetX}px,${offsetY}px)`;
}

// --- buttons ---
nextBtn.onclick=async()=>{ if(pdfDoc && pageNum<pdfDoc.numPages){ pageNum++; zoomScale=1; offsetX=0; offsetY=0; await renderPage(true);} };
prevBtn.onclick=async()=>{ if(pdfDoc && pageNum>1){ pageNum--; zoomScale=1; offsetX=0; offsetY=0; await renderPage(true);} };
zoomInBtn.onclick=async()=>{ zoomScale=clamp(zoomScale*1.25,0.6,4); await renderPage(); };
zoomOutBtn.onclick=async()=>{ zoomScale=clamp(zoomScale/1.25,0.6,4); if(zoomScale<=1.01){zoomScale=1; offsetX=0; offsetY=0;} await renderPage(); };

// --- selection capture (NO highlight yet) ---
document.addEventListener('selectionchange', ()=>{
  const sel=window.getSelection();
  if(!sel || sel.toString().trim().length===0){
    selPanel.hidden=true;
    return;
  }
  const text=sel.toString().trim();
  selTextDiv.textContent=text;
  selPanel.hidden=false;
  console.log('[Selected Text]:', text);
});

// --- minimal swipe (only when fit) ---
let sx=0, st=0;
document.addEventListener('touchstart',(e)=>{
  if(e.touches.length===1 && zoomScale<=1.01){
    sx=e.touches[0].clientX; st=Date.now();
  }
},{passive:true});
document.addEventListener('touchend',(e)=>{
  if(e.changedTouches.length===1 && zoomScale<=1.01){
    const dx=e.changedTouches[0].clientX-sx;
    const dt=Date.now()-st;
    if(Math.abs(dx)>80 && dt<600){
      dx<0?nextBtn.click():prevBtn.click();
    }
  }
},{passive:true});

// --- resize/orientation ---
window.addEventListener('resize',()=>{ if(pdfDoc) renderPage(true); });