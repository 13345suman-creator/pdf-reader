let pdfDoc=null, pageNum=1, scale=1, isRendering=false;
const canvas=document.getElementById("pdfCanvas");
const ctx=canvas.getContext("2d");
const zoomInfo=document.getElementById("zoomInfo");
const menu=document.getElementById("contextMenu");

const annotations = {}; // { pageNum: [{type, rects, text}] }

document.getElementById("pdfInput").addEventListener("change", e=>{
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=()=>pdfjsLib.getDocument({data:new Uint8Array(r.result)}).promise
    .then(pdf=>{ pdfDoc=pdf; pageNum=1; scale=1; renderPage(); });
  r.readAsArrayBuffer(file);
});

function renderPage(){
  if(!pdfDoc||isRendering) return; isRendering=true;
  pdfDoc.getPage(pageNum).then(page=>{
    const viewport=page.getViewport({scale});
    const dpr=window.devicePixelRatio||1;
    canvas.width=viewport.width*dpr;
    canvas.height=viewport.height*dpr;
    canvas.style.width=viewport.width+"px";
    canvas.style.height=viewport.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    page.render({canvasContext:ctx, viewport}).promise.then(()=>{
      zoomInfo.textContent=Math.round(scale*100)+"%";
      drawAnnotations();
      isRendering=false;
    });
  });
}

function drawAnnotations(){
  const list=annotations[pageNum]||[];
  ctx.save();
  list.forEach(a=>{
    ctx.fillStyle="rgba(255,235,59,.6)";
    a.rects.forEach(r=>ctx.fillRect(r.x,r.y,r.w,r.h));
  });
  ctx.restore();
}

/* Controls */
prevBtn.onclick=()=>{ if(pageNum>1){pageNum--;renderPage();} };
nextBtn.onclick=()=>{ if(pageNum<pdfDoc.numPages){pageNum++;renderPage();} };
zoomIn.onclick=()=>smoothZoom(1.1);
zoomOut.onclick=()=>smoothZoom(0.9);

function smoothZoom(f){
  const target=Math.min(Math.max(scale*f,.6),2.5);
  const start=scale; let t=0;
  (function anim(){
    t+=.08; scale=start+(target-start)*t; renderPage();
    if(t<1) requestAnimationFrame(anim);
  })();
}

/* Swipe */
let sx=0;
document.addEventListener("touchstart",e=>{ if(e.touches.length===1) sx=e.touches[0].clientX;});
document.addEventListener("touchend",e=>{
  const d=e.changedTouches[0].clientX-sx;
  if(Math.abs(d)>60) d<0?nextBtn.click():prevBtn.click();
});

/* Long-press to open context menu */
let pressTimer=null;
canvas.addEventListener("touchstart",e=>{
  pressTimer=setTimeout(()=>openMenu(e.touches[0]),500);
});
canvas.addEventListener("touchend",()=>{ clearTimeout(pressTimer); });

function openMenu(touch){
  const rect=canvas.getBoundingClientRect();
  menu.style.left=(touch.clientX-rect.left)+"px";
  menu.style.top=(touch.clientY-rect.top)+"px";
  menu.hidden=false;
  menu.dataset.x = touch.clientX-rect.left;
  menu.dataset.y = touch.clientY-rect.top;
}

document.addEventListener("click",e=>{
  if(!menu.contains(e.target)) menu.hidden=true;
});

menu.addEventListener("click",e=>{
  const action=e.target.dataset.action;
  if(!action) return;
  if(action==="highlight"||action==="underline"){
    addAnnotation(action);
  }
  if(action==="summary"||action==="mcq"){
    // AI HOOK (safe): only selected snippet/coords will be sent later
    alert(action.toUpperCase()+" requested (AI hook ready)");
  }
  menu.hidden=true;
});

function addAnnotation(type){
  const x=+menu.dataset.x, y=+menu.dataset.y;
  const rect={x:x-40,y:y-10,w:80,h:20};
  annotations[pageNum]=annotations[pageNum]||[];
  annotations[pageNum].push({type, rects:[rect], text:""});
  renderPage();
}