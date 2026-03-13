export function buildInlineMapHTML({ centerLat, centerLng, isDark, markers = [], showRoute = false }) {

  const markersJson = JSON.stringify(markers.map(m => ({
    lat: m.lat, lng: m.lng,
    icon: m.icon || '📍',
    color: m.color || '#FF5722',
    label: (m.label || '').replace(/'/g,"'"),
    id: m.id || 0,
  })));

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{width:100%;height:100%;overflow:hidden;}
#map{width:100%;height:100%;position:relative;overflow:hidden;}
canvas{position:absolute;top:0;left:0;}
.btn{
  position:absolute;
  background:${isDark?'rgba(22,33,62,0.95)':'rgba(255,255,255,0.95)'};
  border:1.5px solid ${isDark?'#2A3A5C':'#ccc'};
  border-radius:10px;width:40px;height:40px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:18px;user-select:none;
  box-shadow:0 2px 8px rgba(0,0,0,0.25);
}
#zoom-in{right:14px;bottom:116px;}
#zoom-out{right:14px;bottom:70px;}
#center-btn{right:14px;bottom:24px;}
</style>
</head>
<body>
<div id="map">
  <canvas id="c"></canvas>
  <div id="zoom-in"   class="btn" onclick="changeZoom(1)">+</div>
  <div id="zoom-out"  class="btn" onclick="changeZoom(-1)">−</div>
  <div id="center-btn"class="btn" onclick="resetCenter()">🎯</div>
</div>
<script>
// ── Constants ──────────────────────────────────────────────────────
const MARKERS    = ${markersJson};
const CTR_LAT    = ${centerLat};
const CTR_LNG    = ${centerLng};
const IS_DARK    = ${isDark ? 'true' : 'false'};
const SHOW_ROUTE = ${showRoute ? 'true' : 'false'};
const TILE_SIZE  = 256;

// ── State ──────────────────────────────────────────────────────────
let zoomLevel = 14;
let cLat = CTR_LAT, cLng = CTR_LNG;
let dragging = false, lastTX = 0, lastTY = 0;
let tileCache = {};
let provLat = CTR_LAT + 0.004, provLng = CTR_LNG + 0.003;

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// ── Tile math ──────────────────────────────────────────────────────
function lng2tileX(lng, z){ return (lng+180)/360 * Math.pow(2,z); }
function lat2tileY(lat, z){
  var s=Math.sin(lat*Math.PI/180);
  return (1-Math.log((1+s)/(1-s))/(2*Math.PI))/2 * Math.pow(2,z);
}

// ── World → screen ─────────────────────────────────────────────────
function toScreen(lat, lng){
  var scale = Math.pow(2, zoomLevel);
  var wx = lng2tileX(lng,  zoomLevel) * TILE_SIZE;
  var wy = lat2tileY(lat,  zoomLevel) * TILE_SIZE;
  var cx = lng2tileX(cLng, zoomLevel) * TILE_SIZE;
  var cy = lat2tileY(cLat, zoomLevel) * TILE_SIZE;
  return { x: canvas.width/2  + (wx-cx),
           y: canvas.height/2 + (wy-cy) };
}

// ── Draw OSM tiles ─────────────────────────────────────────────────
function drawTiles(){
  var scale  = Math.pow(2, zoomLevel);
  var cTileX = lng2tileX(cLng, zoomLevel);
  var cTileY = lat2tileY(cLat, zoomLevel);
  var originX = canvas.width/2  - (cTileX % 1) * TILE_SIZE;
  var originY = canvas.height/2 - (cTileY % 1) * TILE_SIZE;
  var t0x = Math.floor(cTileX);
  var t0y = Math.floor(cTileY);
  var cols = Math.ceil(canvas.width  / TILE_SIZE) + 3;
  var rows = Math.ceil(canvas.height / TILE_SIZE) + 3;

  for(var dy=-2; dy<rows; dy++){
    for(var dx=-2; dx<cols; dx++){
      var tx = ((t0x+dx) % scale + scale) % scale;
      var ty = t0y + dy;
      if(ty<0 || ty>=scale) continue;
      var px = originX + dx*TILE_SIZE;
      var py = originY + dy*TILE_SIZE;
      var key = zoomLevel+'/'+tx+'/'+ty;

      // Placeholder tile
      ctx.fillStyle = IS_DARK ? '#111827' : '#e8edf3';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = IS_DARK ? '#1a2744' : '#d0d8e0';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

      if(tileCache[key] && tileCache[key].complete && tileCache[key].naturalWidth>0){
        if(IS_DARK){ ctx.filter='invert(1) hue-rotate(180deg) brightness(0.8) saturate(0.6)'; }
        ctx.drawImage(tileCache[key], px, py, TILE_SIZE, TILE_SIZE);
        ctx.filter='none';
      } else if(!tileCache[key]){
        var img=new Image();
        img.crossOrigin='anonymous';
        var subs=['a','b','c'];
        var sub=subs[Math.abs(tx+ty)%3];
        img.src='https://'+sub+'.tile.openstreetmap.org/'+key+'.png';
        img.onload=function(){ draw(); };
        img.onerror=function(){};
        tileCache[key]=img;
      }
    }
  }
}

// ── Draw overlay ───────────────────────────────────────────────────
function drawAll(){
  // Route line
  if(SHOW_ROUTE){
    var a=toScreen(provLat,provLng), b=toScreen(CTR_LAT,CTR_LNG);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
    ctx.strokeStyle='rgba(255,87,34,0.75)';
    ctx.setLineDash([10,7]); ctx.lineWidth=3; ctx.stroke(); ctx.setLineDash([]);
  }

  // Radius circle around user
  var p0=toScreen(CTR_LAT,CTR_LNG);
  var p1=toScreen(CTR_LAT, CTR_LNG+0.045);
  var rad=Math.abs(p1.x-p0.x);
  ctx.beginPath(); ctx.arc(p0.x,p0.y,rad,0,2*Math.PI);
  ctx.strokeStyle='rgba(255,87,34,0.35)';
  ctx.setLineDash([8,5]); ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,87,34,0.04)'; ctx.fill();

  // Custom markers
  MARKERS.forEach(function(m){
    var p=toScreen(m.lat,m.lng);
    pin(p.x,p.y,m.color,'#fff',m.icon,m.label,28);
  });

  // Provider marker
  if(SHOW_ROUTE){ var pp=toScreen(provLat,provLng); pin(pp.x,pp.y,'#FF5722','#fff','🚗','Provider',34); }

  // User marker (pulse)
  var u=toScreen(CTR_LAT,CTR_LNG);
  ctx.beginPath(); ctx.arc(u.x,u.y,20,0,2*Math.PI);
  ctx.fillStyle='rgba(66,133,244,0.18)'; ctx.fill();
  ctx.beginPath(); ctx.arc(u.x,u.y,9,0,2*Math.PI);
  ctx.fillStyle='#4285F4'; ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.stroke();
  ctx.fillStyle=IS_DARK?'#fff':'#222'; ctx.font='bold 11px sans-serif';
  ctx.textAlign='center'; ctx.fillText('You',u.x,u.y-18);
}

function pin(x,y,fill,stroke,emoji,label,size){
  var half=size/2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x-half,y-half,size,size,size*0.28) : roundRectFallback(x-half,y-half,size,size,size*0.28);
  ctx.fillStyle=fill; ctx.fill();
  ctx.strokeStyle=stroke; ctx.lineWidth=2; ctx.stroke();
  ctx.font=(size*0.55)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(emoji,x,y+1);
  ctx.textBaseline='alphabetic';
  if(label){
    ctx.fillStyle=IS_DARK?'#eee':'#222';
    ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(label.slice(0,14),x,y-half-5);
  }
}

function roundRectFallback(x,y,w,h,r){
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawTiles();
  drawAll();
}

// ── Resize ─────────────────────────────────────────────────────────
function resize(){
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  draw();
}
window.addEventListener('resize',resize);

// ── Touch pan ──────────────────────────────────────────────────────
canvas.addEventListener('touchstart',function(e){
  dragging=true; lastTX=e.touches[0].clientX; lastTY=e.touches[0].clientY;
  e.preventDefault();
},{passive:false});

canvas.addEventListener('touchmove',function(e){
  if(!dragging)return;
  var dx=e.touches[0].clientX-lastTX, dy=e.touches[0].clientY-lastTY;
  var scale=Math.pow(2,zoomLevel)*TILE_SIZE;
  cLng -= dx/scale*360;
  var s=Math.sin(cLat*Math.PI/180);
  var mercY=Math.log((1+s)/(1-s))/2;
  mercY += dy/scale*2*Math.PI;
  cLat=(2*Math.atan(Math.exp(mercY))-Math.PI/2)*180/Math.PI;
  lastTX=e.touches[0].clientX; lastTY=e.touches[0].clientY;
  draw(); e.preventDefault();
},{passive:false});

canvas.addEventListener('touchend',function(){ dragging=false; });

// Tap markers
canvas.addEventListener('click',function(e){
  var rect=canvas.getBoundingClientRect();
  var cx=e.clientX-rect.left, cy=e.clientY-rect.top;
  MARKERS.forEach(function(m){
    var p=toScreen(m.lat,m.lng);
    if(Math.hypot(cx-p.x,cy-p.y)<24){
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:m.id}));
    }
  });
});

// ── Public API ─────────────────────────────────────────────────────
function changeZoom(d){ zoomLevel=Math.max(10,Math.min(18,zoomLevel+d)); tileCache={}; draw(); }
function resetCenter(){ cLat=CTR_LAT; cLng=CTR_LNG; draw(); }
function updateProvider(lat,lng){ provLat=lat; provLng=lng; draw(); }

// ── Start ──────────────────────────────────────────────────────────
resize();
window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('ready');
</script>
</body>
</html>`;
}
