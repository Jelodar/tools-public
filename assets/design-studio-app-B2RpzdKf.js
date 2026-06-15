import{c as ye,T as pe}from"./index-CoRJqXFF.js";import{c as ge,d as fe}from"./ui-utils-CG6aKAAj.js";import{c as he}from"./studio-shell-DviRgtfh.js";const A={"--vector-fill":"#0A84FF","--vector-accent":"#4CD964","--vector-stroke":"#F5F5F7","--vector-muted":"#343842"},q={type:"solid",start:"#050608",end:"#1A1D24",angle:0},R=["rect","rounded-rect","circle","ellipse","line","polygon","star","path","text"],K={rect:{x:80,y:70,width:180,height:110,rx:10},"rounded-rect":{x:80,y:70,width:180,height:110,rx:24},circle:{cx:170,cy:125,r:64},ellipse:{cx:170,cy:125,rx:92,ry:54},line:{x1:72,y1:80,x2:270,y2:172},polygon:{points:"170,46 280,186 60,186"},star:{cx:170,cy:125,outerRadius:76,innerRadius:34,pointCount:5},path:{d:"M 80 180 C 130 40 230 40 280 180 Z"},text:{x:90,y:132,text:"Vector",fontSize:34}};function $(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function a(e,n=0){const t=Number(e);return Number.isFinite(t)?t:n}function y(e,n){return n==null||n===""?"":` ${e}="${$(n)}"`}function D(e,n){const t=String(e||"").trim();return/^#[0-9a-f]{6}$/i.test(t)?t:n}function ne(e){return String(e||"shape").replace(/[^\w-]+/g,"-")}function xe(e=0){const n=(a(e,0)-90)*Math.PI/180,t=Math.cos(n),r=Math.sin(n);return{x1:(1-t)/2*100,y1:(1-r)/2*100,x2:(1+t)/2*100,y2:(1+r)/2*100}}function be(e=q){const n=["transparent","solid","linear","radial"].includes(e.type)?e.type:q.type;if(n==="transparent")return{defs:"",fill:"transparent"};const t=D(e.start,q.start);if(n==="solid")return{defs:"",fill:t};const r=D(e.end,q.end);if(n==="radial")return{defs:`<defs><radialGradient id="vector-background-gradient" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${$(t)}"/><stop offset="100%" stop-color="${$(r)}"/></radialGradient></defs>`,fill:"url(#vector-background-gradient)"};const s=(a(e.angle,0)-90)*Math.PI/180,o=Math.cos(s),l=Math.sin(s),c=(1-o)/2*100,d=(1-l)/2*100,u=(1+o)/2*100,M=(1+l)/2*100;return{defs:`<defs><linearGradient id="vector-background-gradient" x1="${c.toFixed(2)}%" y1="${d.toFixed(2)}%" x2="${u.toFixed(2)}%" y2="${M.toFixed(2)}%"><stop offset="0%" stop-color="${$(t)}"/><stop offset="100%" stop-color="${$(r)}"/></linearGradient></defs>`,fill:"url(#vector-background-gradient)"}}function j(e={}){const n=R.includes(e.type)?e.type:"rect";if(n==="rect")return{x:a(e.x,0)+a(e.width,120)/2,y:a(e.y,0)+a(e.height,80)/2};if(n==="rounded-rect")return{x:a(e.x,0)+a(e.width,120)/2,y:a(e.y,0)+a(e.height,80)/2};if(n==="circle"||n==="ellipse")return{x:a(e.cx,120),y:a(e.cy,120)};if(n==="line")return{x:(a(e.x1,0)+a(e.x2,200))/2,y:(a(e.y1,0)+a(e.y2,120))/2};if(n==="polygon"){const t=String(e.points||K.polygon.points).trim().split(/\s+/).map(r=>r.split(",").map(Number)).filter(([r,i])=>Number.isFinite(r)&&Number.isFinite(i));if(t.length)return{x:t.reduce((r,[i])=>r+i,0)/t.length,y:t.reduce((r,[,i])=>r+i,0)/t.length}}return n==="star"?{x:a(e.cx,120),y:a(e.cy,120)}:{x:a(e.x??e.cx??e.x1,0),y:a(e.y??e.cy??e.y1,0)}}function me(e){return e.fillMode==="linear"?`url(#paint-${ne(e.id)})`:e.fill??"var(--vector-fill)"}function Q(e){const n=Math.max(0,Math.min(1,Number(e.opacity??1))),t=a(e.rotate,0),r=j(e);return[y("id",e.id),y("fill",me(e)),y("stroke",e.stroke??"var(--vector-stroke)"),y("stroke-width",a(e.strokeWidth,2)),y("opacity",n),t?y("transform",`rotate(${t} ${r.x} ${r.y})`):""].join("")}function k(e="rect",n={},t=0){const r=R.includes(e)?e:"rect";return{id:n.id||`vector-${r}-${t+1}`,type:r,fill:n.fill||"var(--vector-fill)",stroke:n.stroke||"var(--vector-stroke)",strokeWidth:n.strokeWidth??2,opacity:n.opacity??1,rotate:n.rotate??0,fillMode:n.fillMode||"solid",fillStart:n.fillStart||"#FFFFFF",fillEnd:n.fillEnd||"#0A84FF",fillAngle:n.fillAngle??0,...K[r],...n}}function ve(e){const n=Math.max(3,Math.round(a(e.pointCount,5))),t=a(e.cx,120),r=a(e.cy,120),i=Math.max(1,a(e.outerRadius,64)),s=Math.max(1,a(e.innerRadius,i/2)),o=[];for(let l=0;l<n*2;l+=1){const c=l%2===0?i:s,d=-Math.PI/2+l*Math.PI/n;o.push(`${Number((t+Math.cos(d)*c).toFixed(2))},${Number((r+Math.sin(d)*c).toFixed(2))}`)}return o.join(" ")}function Me(e={}){const n=R.includes(e.type)?e.type:"rect",t=Q(e);return n==="rect"||n==="rounded-rect"?`<rect${t}${y("x",a(e.x,0))}${y("y",a(e.y,0))}${y("width",a(e.width,120))}${y("height",a(e.height,80))}${y("rx",a(e.rx,0))}/>`:n==="circle"?`<circle${t}${y("cx",a(e.cx,120))}${y("cy",a(e.cy,120))}${y("r",a(e.r,48))}/>`:n==="ellipse"?`<ellipse${t}${y("cx",a(e.cx,120))}${y("cy",a(e.cy,120))}${y("rx",a(e.rx,80))}${y("ry",a(e.ry,48))}/>`:n==="line"?`<line${Q({...e,fill:"none"})}${y("x1",a(e.x1,0))}${y("y1",a(e.y1,0))}${y("x2",a(e.x2,200))}${y("y2",a(e.y2,120))}/>`:n==="polygon"?`<polygon${t}${y("points",e.points||K.polygon.points)}/>`:n==="star"?`<polygon${t}${y("points",ve(e))}/>`:n==="path"?`<path${t}${y("d",e.d||K.path.d)}/>`:`<text${t}${y("x",a(e.x,80))}${y("y",a(e.y,120))}${y("font-size",a(e.fontSize,32))} font-family="Inter, Arial, sans-serif">${$(e.text||"Vector")}</text>`}function Ne(e){return e.filter(n=>n.fillMode==="linear").map(n=>{const t=xe(n.fillAngle),r=D(n.fillStart,"#FFFFFF"),i=D(n.fillEnd,"#0A84FF");return`<linearGradient id="paint-${ne(n.id)}" x1="${t.x1.toFixed(2)}%" y1="${t.y1.toFixed(2)}%" x2="${t.x2.toFixed(2)}%" y2="${t.y2.toFixed(2)}%"><stop offset="0%" stop-color="${$(r)}"/><stop offset="100%" stop-color="${$(i)}"/></linearGradient>`}).join("")}function we(e={}){const n=Math.max(1,Math.round(a(e.width,640))),t=Math.max(1,Math.round(a(e.height,420))),r={...A,...e.variables||{}},i=Object.entries(r).map(([d,u])=>`${d}: ${u};`).join(" "),s=Array.isArray(e.shapes)&&e.shapes.length?e.shapes:[k("rect")],o=be(e.background),l=Ne(s),c=[o.defs,l].filter(Boolean).join("");return`<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${t}" viewBox="0 0 ${n} ${t}" style="${$(i)}">${c?`<defs>${c.replace(/^<defs>|<\/defs>$/g,"")}</defs>`:""}<rect width="100%" height="100%" fill="${$(o.fill)}"/>${s.map(Me).join("")}</svg>`}const S={"visual-generators":{title:"SVG Studio",description:"Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing."},"svg-editor":{title:"SVG Studio",description:"Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing."},"color-tools":{title:"SVG Studio",description:"Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing."},"css-generators":{title:"SVG Studio",description:"Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing."}};let C=null;function $e(e){return pe.find(n=>n.id===e)}function Ie(){return`
    <div class="studio-stack">
      <section class="card studio-card svg-ide-card">
        ${ke()}
      </section>
    </div>
  `}function ke(){const e=`
    <label class="studio-field">
      <span>fill</span>
      <input type="color" data-vector-var="--vector-fill" value="${A["--vector-fill"]}">
    </label>
    <label class="studio-field">
      <span>accent</span>
      <input type="color" data-vector-var="--vector-accent" value="${A["--vector-accent"]}">
    </label>
    <label class="studio-field">
      <span>stroke</span>
      <input type="color" data-vector-var="--vector-stroke" value="${A["--vector-stroke"]}">
    </label>
    <label class="studio-field">
      <span>muted</span>
      <input type="color" data-vector-var="--vector-muted" value="${A["--vector-muted"]}">
    </label>
  `,n=Object.keys(A).map(t=>`<option value="var(${t})">${t}</option>`).join("");return`
    <section class="studio-panel design-vector-workspace svg-ide-workspace">
      <div class="studio-panel-head">
        <h3>Canvas</h3>
      </div>
      <div class="design-vector-editor-shell svg-ide-shell">
      <div class="design-vector-grid svg-ide-grid">
        <div class="design-vector-toolbar svg-ide-toolbar" data-svg-ide-toolbar>
          <button id="design-vector-tool-select" class="btn-secondary is-active" type="button" data-vector-tool="select">Select</button>
          <button id="design-vector-tool-draw" class="btn-secondary" type="button" data-vector-tool="draw">Draw</button>
          <button id="design-vector-tool-rect" class="btn-secondary" type="button" data-vector-tool="rect">Rect</button>
          <button id="design-vector-tool-rounded-rect" class="btn-secondary" type="button" data-vector-tool="rounded-rect">Round Rect</button>
          <button id="design-vector-tool-circle" class="btn-secondary" type="button" data-vector-tool="circle">Circle</button>
          <button id="design-vector-tool-ellipse" class="btn-secondary" type="button" data-vector-tool="ellipse">Ellipse</button>
          <button id="design-vector-tool-line" class="btn-secondary" type="button" data-vector-tool="line">Line</button>
          <button id="design-vector-tool-polygon" class="btn-secondary" type="button" data-vector-tool="polygon">Polygon</button>
          <button id="design-vector-tool-star" class="btn-secondary" type="button" data-vector-tool="star">Star</button>
          <button id="design-vector-tool-path" class="btn-secondary" type="button" data-vector-tool="path">Path</button>
          <button id="design-vector-tool-text" class="btn-secondary" type="button" data-vector-tool="text">Text</button>
          <button id="design-vector-tool-rotate" class="btn-secondary" type="button" data-vector-tool="rotate">Rotate</button>
        </div>
        <div class="design-vector-stage-shell svg-ide-stage-shell">
          <div class="design-vector-stage">
            <div class="svg-ide-command-bar">
              <div class="svg-ide-feedback">
                <span id="design-vector-tool-status">Select tool ready.</span>
                <span id="design-vector-selection-status">1 shape selected.</span>
              </div>
              <label class="studio-toggle">
                <input id="design-vector-grid" type="checkbox" checked>
                <span>Grid</span>
              </label>
              <label class="studio-toggle">
                <input id="design-vector-snap" type="checkbox" checked>
                <span>Snap</span>
              </label>
              <label class="studio-field">
                <span>Zoom</span>
                <input id="design-vector-zoom" type="range" min="40" max="180" value="100">
              </label>
            </div>
            <div id="design-vector-canvas" class="design-vector-canvas svg-ide-canvas"></div>
            <pre id="design-vector-svg-code" class="design-code-block design-code-block-vector svg-ide-code"></pre>
          </div>
        </div>
        <div class="design-vector-controls svg-ide-inspector" data-svg-ide-inspector>
          <div class="design-vector-vars">${e}</div>
          <div class="design-vector-background">
            <label class="studio-field">
              <span>Background</span>
              <select id="design-vector-bg-type">
                <option value="transparent">Transparent</option>
                <option value="solid" selected>Solid</option>
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </label>
            <label class="studio-field">
              <span>Start</span>
              <input type="color" id="design-vector-bg-start" value="${q.start}">
            </label>
            <label class="studio-field">
              <span>End</span>
              <input type="color" id="design-vector-bg-end" value="${q.end}">
            </label>
            <label class="studio-field">
              <span>Angle</span>
              <input id="design-vector-bg-angle" type="range" min="0" max="360" value="${q.angle}">
            </label>
          </div>
          <div class="design-vector-form">
            <label class="studio-field" data-vector-prop-types="all">
              <span>Shape</span>
              <select id="design-vector-shape-type">
                ${R.map(t=>`<option value="${t}">${t}</option>`).join("")}
              </select>
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill</span>
              <select id="design-vector-fill">${n}</select>
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill Mode</span>
              <select id="design-vector-fill-mode">
                <option value="solid" selected>Solid</option>
                <option value="linear">Linear</option>
              </select>
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill Start</span>
              <input id="design-vector-fill-start" type="color" value="#ffffff">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill End</span>
              <input id="design-vector-fill-end" type="color" value="#0a84ff">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill Angle</span>
              <input id="design-vector-fill-angle" type="range" min="0" max="360" value="0">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Stroke</span>
              <select id="design-vector-stroke">${n}</select>
            </label>
            <label class="studio-field" data-vector-prop-types="all line polygon path text">
              <span>Stroke Width</span>
              <input id="design-vector-stroke-width" type="number" min="0" value="2">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect text">
              <span>X</span>
              <input id="design-vector-x" type="number" value="80">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect text">
              <span>Y</span>
              <input id="design-vector-y" type="number" value="70">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect">
              <span>W</span>
              <input id="design-vector-width" type="number" min="1" value="180">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect">
              <span>H</span>
              <input id="design-vector-height" type="number" min="1" value="110">
            </label>
            <label class="studio-field" data-vector-prop-types="circle ellipse star">
              <span>CX</span>
              <input id="design-vector-cx" type="number" value="170">
            </label>
            <label class="studio-field" data-vector-prop-types="circle ellipse star">
              <span>CY</span>
              <input id="design-vector-cy" type="number" value="125">
            </label>
            <label class="studio-field" data-vector-prop-types="ellipse">
              <span>RX</span>
              <input id="design-vector-rx" type="number" min="0" value="92">
            </label>
            <label class="studio-field" data-vector-prop-types="ellipse">
              <span>RY</span>
              <input id="design-vector-ry" type="number" min="0" value="54">
            </label>
            <label class="studio-field" data-vector-prop-types="circle">
              <span>R</span>
              <input id="design-vector-r" type="number" min="0" value="64">
            </label>
            <label class="studio-field" data-vector-prop-types="star">
              <span>Outer</span>
              <input id="design-vector-outer-radius" type="number" min="1" value="76">
            </label>
            <label class="studio-field" data-vector-prop-types="star">
              <span>Inner</span>
              <input id="design-vector-inner-radius" type="number" min="1" value="34">
            </label>
            <label class="studio-field" data-vector-prop-types="star polygon">
              <span>Points</span>
              <input id="design-vector-point-count" type="number" min="3" max="12" value="5">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Rotate</span>
              <input id="design-vector-rotate" type="number" value="0">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Opacity</span>
              <input id="design-vector-opacity" type="number" min="0" max="1" step="0.05" value="1">
            </label>
            <label class="studio-field" data-vector-prop-types="text">
              <span>Text</span>
              <input id="design-vector-text" type="text" value="Vector">
            </label>
            <label class="studio-field studio-field-wide" data-vector-prop-types="polygon">
              <span>Points</span>
              <input id="design-vector-points" type="text" value="170,46 280,186 60,186">
            </label>
            <label class="studio-field studio-field-wide" data-vector-prop-types="path">
              <span>Path</span>
              <textarea id="design-vector-path" rows="3">M 80 180 C 130 40 230 40 280 180 Z</textarea>
            </label>
          </div>
          <div class="studio-toolbar-actions design-vector-actions">
            <button id="design-vector-add" class="btn-secondary" type="button">Add Shape</button>
            <button id="design-vector-update" class="btn-secondary" type="button">Update</button>
            <button id="design-vector-duplicate" class="btn-secondary" type="button">Duplicate</button>
            <button id="design-vector-remove" class="btn-secondary" type="button">Remove</button>
            <button id="design-vector-undo" class="btn-secondary" type="button">Undo</button>
            <button id="design-vector-redo" class="btn-secondary" type="button">Redo</button>
            <button id="design-vector-back" class="btn-secondary" type="button">Back</button>
            <button id="design-vector-front" class="btn-secondary" type="button">Front</button>
            <button id="design-vector-copy-svg" class="btn-secondary" type="button">Copy SVG</button>
            <button id="design-vector-download-svg" class="btn-secondary" type="button">Download SVG</button>
          </div>
        </div>
          <div class="svg-ide-layers-panel">
            <div id="design-vector-layer-list" class="design-vector-layer-list"></div>
          </div>
        </div>
      </div>
      </div>
    </section>
  `}function qe(e,n,t){if(typeof e.style.setProperty=="function"){e.style.setProperty(n,t);return}e.style[n]=t}function Ve(e){return Object.fromEntries(Array.from(e.querySelectorAll("[data-vector-var]")).map(n=>[n.dataset.vectorVar,n.value]))}function Fe(e){return{type:e.querySelector("#design-vector-bg-type").value,start:e.querySelector("#design-vector-bg-start").value,end:e.querySelector("#design-vector-bg-end").value,angle:Number(e.querySelector("#design-vector-bg-angle").value)}}function L(e,n){const t=e.querySelector("#design-vector-shape-type").value;return k(t,{id:n,fill:e.querySelector("#design-vector-fill").value,fillMode:e.querySelector("#design-vector-fill-mode").value,fillStart:e.querySelector("#design-vector-fill-start").value,fillEnd:e.querySelector("#design-vector-fill-end").value,fillAngle:Number(e.querySelector("#design-vector-fill-angle").value),stroke:e.querySelector("#design-vector-stroke").value,strokeWidth:Number(e.querySelector("#design-vector-stroke-width").value),x:Number(e.querySelector("#design-vector-x").value),y:Number(e.querySelector("#design-vector-y").value),width:Number(e.querySelector("#design-vector-width").value),height:Number(e.querySelector("#design-vector-height").value),cx:Number(e.querySelector("#design-vector-cx").value),cy:Number(e.querySelector("#design-vector-cy").value),rx:Number(e.querySelector("#design-vector-rx").value),ry:Number(e.querySelector("#design-vector-ry").value),r:Number(e.querySelector("#design-vector-r").value),outerRadius:Number(e.querySelector("#design-vector-outer-radius").value),innerRadius:Number(e.querySelector("#design-vector-inner-radius").value),pointCount:Number(e.querySelector("#design-vector-point-count").value),rotate:Number(e.querySelector("#design-vector-rotate").value),opacity:Number(e.querySelector("#design-vector-opacity").value),text:e.querySelector("#design-vector-text").value,points:e.querySelector("#design-vector-points").value,d:e.querySelector("#design-vector-path").value})}function x(e,n){if(!n)return;const t=(r,i)=>{const s=e.querySelector(r);s&&i!==void 0&&(s.value=i)};t("#design-vector-shape-type",n.type),t("#design-vector-fill",n.fill),t("#design-vector-fill-mode",n.fillMode),t("#design-vector-fill-start",n.fillStart),t("#design-vector-fill-end",n.fillEnd),t("#design-vector-fill-angle",n.fillAngle),t("#design-vector-stroke",n.stroke),t("#design-vector-stroke-width",n.strokeWidth),t("#design-vector-x",n.x),t("#design-vector-y",n.y),t("#design-vector-width",n.width),t("#design-vector-height",n.height),t("#design-vector-cx",n.cx),t("#design-vector-cy",n.cy),t("#design-vector-rx",n.rx),t("#design-vector-ry",n.ry),t("#design-vector-r",n.r),t("#design-vector-outer-radius",n.outerRadius),t("#design-vector-inner-radius",n.innerRadius),t("#design-vector-point-count",n.pointCount),t("#design-vector-rotate",n.rotate),t("#design-vector-opacity",n.opacity),t("#design-vector-text",n.text),t("#design-vector-points",n.points),t("#design-vector-path",n.d)}function B(e){return e.map(n=>({...n}))}function T(e){Array.isArray(e.selectedIds)||(e.selectedIds=e.selectedId?[e.selectedId]:[]),e.selectedIds=e.selectedIds.filter(n=>e.shapes.some(t=>t.id===n)),!e.selectedIds.length&&e.selectedId&&(e.selectedIds=[e.selectedId]),e.selectedId=e.selectedIds.at(-1)||null}function N(e){e.history=Array.isArray(e.history)?e.history:[],e.future=[],e.history.push({shapes:B(e.shapes),selectedId:e.selectedId,selectedIds:[...e.selectedIds||[]]}),e.history.length>80&&e.history.shift()}function ie(e,n){n&&(e.shapes=B(n.shapes),e.selectedId=n.selectedId,e.selectedIds=[...n.selectedIds||[]],T(e))}function Ae(e){var t;const n=(t=e.history)==null?void 0:t.pop();return n?(e.future=Array.isArray(e.future)?e.future:[],e.future.push({shapes:B(e.shapes),selectedId:e.selectedId,selectedIds:[...e.selectedIds||[]]}),ie(e,n),!0):!1}function Re(e){var t;const n=(t=e.future)==null?void 0:t.pop();return n?(e.history=Array.isArray(e.history)?e.history:[],e.history.push({shapes:B(e.shapes),selectedId:e.selectedId,selectedIds:[...e.selectedIds||[]]}),ie(e,n),!0):!1}function v(e,n){e.selectedIds=[...new Set((Array.isArray(n)?n:[n]).filter(Boolean))],e.selectedId=e.selectedIds.at(-1)||null,T(e)}function re(e,n){T(e);const t=new Set(e.selectedIds);t.has(n)?t.delete(n):t.add(n);const r=[...t];v(e,r.length?r:[n])}function ee(e,n){var i,s,o;T(n),n.variables=Ve(e),n.background=Fe(e),n.showGrid=!!((i=e.querySelector("#design-vector-grid"))!=null&&i.checked),n.snap=!!((s=e.querySelector("#design-vector-snap"))!=null&&s.checked),n.zoom=Number(((o=e.querySelector("#design-vector-zoom"))==null?void 0:o.value)||100);const t=we({width:640,height:420,variables:n.variables,background:n.background,shapes:n.shapes}),r=e.querySelector("#design-vector-canvas");r.classList.toggle("show-grid",n.showGrid),qe(r,"--vector-zoom",`${n.zoom/100}`),r.innerHTML=`${t}${Te(n)}${Ee(n)}`,e.querySelector("#design-vector-svg-code").textContent=t,e.querySelector("#design-vector-layer-list").innerHTML=n.shapes.map((l,c)=>`
    <button type="button" class="design-vector-layer${n.selectedIds.includes(l.id)?" is-selected":""}" data-vector-select="${l.id}">
      <span>${c+1}</span>
      <strong>${l.type}</strong>
      <small>${l.id}</small>
    </button>
  `).join(""),oe(e,n)}function E(e={}){const n=R.includes(e.type)?e.type:"rect";if(n==="rect"||n==="rounded-rect")return{x:Number(e.x)||0,y:Number(e.y)||0,width:Math.max(1,Number(e.width)||1),height:Math.max(1,Number(e.height)||1)};if(n==="circle"){const t=Math.max(1,Number(e.r)||1);return{x:(Number(e.cx)||0)-t,y:(Number(e.cy)||0)-t,width:t*2,height:t*2}}if(n==="ellipse"){const t=Math.max(1,Number(e.rx)||1),r=Math.max(1,Number(e.ry)||1);return{x:(Number(e.cx)||0)-t,y:(Number(e.cy)||0)-r,width:t*2,height:r*2}}if(n==="line"){const t=Number(e.x1)||0,r=Number(e.y1)||0,i=Number(e.x2)||0,s=Number(e.y2)||0;return{x:Math.min(t,i),y:Math.min(r,s),width:Math.max(1,Math.abs(i-t)),height:Math.max(1,Math.abs(s-r))}}if(n==="polygon"){const t=String(e.points||"").trim().split(/\s+/).map(r=>r.split(",").map(Number)).filter(([r,i])=>Number.isFinite(r)&&Number.isFinite(i));if(t.length){const r=t.map(([s])=>s),i=t.map(([,s])=>s);return{x:Math.min(...r),y:Math.min(...i),width:Math.max(1,Math.max(...r)-Math.min(...r)),height:Math.max(1,Math.max(...i)-Math.min(...i))}}}if(n==="star"){const t=Math.max(1,Number(e.outerRadius)||1);return{x:(Number(e.cx)||0)-t,y:(Number(e.cy)||0)-t,width:t*2,height:t*2}}return{x:Number(e.x??e.cx??e.x1)||0,y:Number(e.y??e.cy??e.y1)||0,width:120,height:48}}function se(e){return T(e),e.shapes.filter(n=>e.selectedIds.includes(n.id))}function Ce(e){const n=e.map(E);if(!n.length)return null;const t=Math.min(...n.map(o=>o.x)),r=Math.min(...n.map(o=>o.y)),i=Math.max(...n.map(o=>o.x+o.width)),s=Math.max(...n.map(o=>o.y+o.height));return{x:t,y:r,width:Math.max(1,i-t),height:Math.max(1,s-r)}}function te(e,n=!0){if(!e)return"";const t="type"in e?E(e):e,r=Number(t.x.toFixed(2)),i=Number(t.y.toFixed(2)),s=Number(t.width.toFixed(2)),o=Number(t.height.toFixed(2)),l=Number((r+s/2).toFixed(2)),c=Number((i+o/2).toFixed(2)),d=n?`
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-nw" x="${r-4}" y="${i-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-n" x="${l-4}" y="${i-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-ne" x="${r+s-4}" y="${i-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-e" x="${r+s-4}" y="${c-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-se" x="${r+s-4}" y="${i+o-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-s" x="${l-4}" y="${i+o-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-sw" x="${r-4}" y="${i+o-4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-w" x="${r-4}" y="${c-4}" width="8" height="8"></rect>
  `:"";return`
    <g class="design-vector-selection-box">
      <rect x="${r}" y="${i}" width="${s}" height="${o}"></rect>
      <line x1="${l}" y1="${i}" x2="${l}" y2="${i+o}"></line>
      <line x1="${r}" y1="${c}" x2="${r+s}" y2="${c}"></line>
      ${d}
    </g>
  `}function oe(e,n){var l,c;const t=n.shapes.find(d=>d.id===n.selectedId),r=(t==null?void 0:t.type)||((l=e.querySelector("#design-vector-shape-type"))==null?void 0:l.value)||"rect";e.querySelectorAll("[data-vector-prop-types]").forEach(d=>{const u=String(d.dataset.vectorPropTypes||"").split(/\s+/).filter(Boolean);d.classList.toggle("design-vector-field-hidden",!u.includes("all")&&!u.includes(r))});const i=n.tool==="draw"?"Draw with current draft":`${n.tool||"select"} tool`,s=e.querySelector("#design-vector-tool-status");s&&(s.textContent=`${i}. Shift constrains, Alt mirrors, Command duplicates.`);const o=e.querySelector("#design-vector-selection-status");if(o){const d=((c=n.selectedIds)==null?void 0:c.length)||0;o.textContent=d>1?`${d} shapes selected. Drag objects or marquee another set.`:t?`${t.type} selected. Drag object, handles, or rotate pin.`:"No shape selected."}}function Te(e){const n=se(e);if(n.length>1){const o=Ce(n);return`<svg class="design-vector-keypoint-layer" viewBox="0 0 640 420">${te(o,!1)}</svg>`}const t=n[0]||e.shapes.find(o=>o.id===e.selectedId);if(!t)return"";const r=[],i=j(t);t.type==="rect"||t.type==="rounded-rect"?(r.push(["origin",Number(t.x)||0,Number(t.y)||0]),r.push(["size",(Number(t.x)||0)+(Number(t.width)||0),(Number(t.y)||0)+(Number(t.height)||0)])):t.type==="circle"?(r.push(["center",Number(t.cx)||0,Number(t.cy)||0]),r.push(["radius",(Number(t.cx)||0)+(Number(t.r)||0),Number(t.cy)||0])):t.type==="ellipse"?(r.push(["center",Number(t.cx)||0,Number(t.cy)||0]),r.push(["radius-x",(Number(t.cx)||0)+(Number(t.rx)||0),Number(t.cy)||0]),r.push(["radius-y",Number(t.cx)||0,(Number(t.cy)||0)+(Number(t.ry)||0)])):t.type==="line"?(r.push(["start",Number(t.x1)||0,Number(t.y1)||0]),r.push(["end",Number(t.x2)||0,Number(t.y2)||0])):t.type==="polygon"?String(t.points||"").trim().split(/\s+/).forEach((o,l)=>{const[c,d]=o.split(",").map(Number);Number.isFinite(c)&&Number.isFinite(d)&&r.push([`point-${l}`,c,d])}):t.type==="star"?(r.push(["center",Number(t.cx)||0,Number(t.cy)||0]),r.push(["outer-radius",Number(t.cx||0)+Number(t.outerRadius||0),Number(t.cy)||0]),r.push(["inner-radius",Number(t.cx||0)+Number(t.innerRadius||0),Number(t.cy)||0])):t.type==="path"&&z(t.d).forEach((o,l)=>{r.push([`path-point-${l}`,o.x,o.y])});const s=r.map(([o,l,c])=>`<circle class="design-vector-keypoint" data-vector-keypoint="${o}" cx="${l}" cy="${c}" r="6"></circle>`).join("");return`<svg class="design-vector-keypoint-layer" viewBox="0 0 640 420">${te(t)}${s}<circle class="design-vector-keypoint design-vector-keypoint-rotate" data-vector-keypoint="rotate" cx="${i.x}" cy="${Math.max(12,i.y-72)}" r="7"></circle></svg>`}function Ee(e){const n=e.marquee;if(!n)return"";const t=Math.min(n.x1,n.x2),r=Math.min(n.y1,n.y2),i=Math.abs(n.x2-n.x1),s=Math.abs(n.y2-n.y1);return`<svg class="design-vector-marquee-layer" viewBox="0 0 640 420"><rect class="design-vector-marquee" x="${t}" y="${r}" width="${i}" height="${s}"></rect></svg>`}function ze(e=""){const n=[],t=/-?\d*\.?\d+(?:e[-+]?\d+)?/gi;let r=t.exec(String(e||""));for(;r;)n.push({value:Number(r[0]),start:r.index,end:r.index+r[0].length}),r=t.exec(String(e||""));return n}function z(e=""){const n=ze(e),t=[];for(let r=0;r<n.length-1;r+=2)t.push({x:n[r].value,y:n[r+1].value,xToken:n[r],yToken:n[r+1]});return t}function W(e,n,t,r){const s=z(e)[n];if(!s)return e;const o=String(Number(t.toFixed(2))),l=String(Number(r.toFixed(2)));return`${e.slice(0,s.xToken.start)}${o}${e.slice(s.xToken.end,s.yToken.start)}${l}${e.slice(s.yToken.end)}`}function G(e,n){const t=e.shapes.findIndex(s=>s.id===e.selectedId),r=t+n;if(t<0||r<0||r>=e.shapes.length)return;const[i]=e.shapes.splice(t,1);e.shapes.splice(r,0,i)}function H(e,n=18){const t=e.shapes.find(s=>s.id===e.selectedId);if(!t)return null;const r=`vector-${e.nextIndex}`;e.nextIndex+=1;const i={...t,id:r,x:t.x===void 0?t.x:Number(t.x||0)+n,y:t.y===void 0?t.y:Number(t.y||0)+n,cx:t.cx===void 0?t.cx:Number(t.cx||0)+n,cy:t.cy===void 0?t.cy:Number(t.cy||0)+n,x1:t.x1===void 0?t.x1:Number(t.x1||0)+n,y1:t.y1===void 0?t.y1:Number(t.y1||0)+n,x2:t.x2===void 0?t.x2:Number(t.x2||0)+n,y2:t.y2===void 0?t.y2:Number(t.y2||0)+n};return e.shapes.push(i),v(e,[r]),i}function ce(e){var t,r,i;if(e.shapes.length<=1)return null;const n=(t=e.selectedIds)!=null&&t.length?e.selectedIds:[e.selectedId];return e.shapes=e.shapes.filter(s=>!n.includes(s.id)),v(e,[((r=e.shapes.at(-1))==null?void 0:r.id)||((i=e.shapes[0])==null?void 0:i.id)||null]),e.shapes.find(s=>s.id===e.selectedId)||null}function Pe(e,n,t,r=null){var s;((s=e.selectedIds)!=null&&s.length?e.selectedIds:[e.selectedId]).forEach(o=>{const l=e.shapes.find(d=>d.id===o);if(!l)return;const c=(r==null?void 0:r.id)===o?r:(r==null?void 0:r[o])||l;Le(l,c,n,t)})}function Le(e,n,t,r){if("x"in e&&(e.x=Number(n.x||0)+t),"y"in e&&(e.y=Number(n.y||0)+r),"cx"in e&&(e.cx=Number(n.cx||0)+t),"cy"in e&&(e.cy=Number(n.cy||0)+r),"x1"in e&&(e.x1=Number(n.x1||0)+t),"y1"in e&&(e.y1=Number(n.y1||0)+r),"x2"in e&&(e.x2=Number(n.x2||0)+t),"y2"in e&&(e.y2=Number(n.y2||0)+r),e.type==="polygon"&&(e.points=String(n.points||"").trim().split(/\s+/).map(i=>{const[s,o]=i.split(",").map(Number);return Number.isFinite(s)&&Number.isFinite(o)?`${Math.round(s+t)},${Math.round(o+r)}`:i}).join(" ")),e.type==="path"){let i=String(n.d||"");z(n.d).forEach((s,o)=>{i=W(i,o,s.x+t,s.y+r)}),e.d=i}}function le(e,n,t,r=null){const i=e.shapes.find(o=>o.id===e.selectedId);if(!i)return;const s=r||i;"width"in i&&(i.width=Math.max(1,Number(s.width||1)+n)),"height"in i&&(i.height=Math.max(1,Number(s.height||1)+t)),"r"in i&&(i.r=Math.max(1,Number(s.r||1)+(n+t)/2)),"rx"in i&&(i.rx=Math.max(1,Number(s.rx||1)+n/2)),"ry"in i&&(i.ry=Math.max(1,Number(s.ry||1)+t/2)),"outerRadius"in i&&(i.outerRadius=Math.max(1,Number(s.outerRadius||1)+(n+t)/2)),"innerRadius"in i&&(i.innerRadius=Math.max(1,Number(s.innerRadius||1)+(n+t)/4))}function Ke(e,n,t,r=null){const i=e.shapes.find(o=>o.id===e.selectedId);if(!i)return;const s=r||i;le(e,n*2,t*2,s),"x"in i&&(i.x=Number(s.x||0)-n),"y"in i&&(i.y=Number(s.y||0)-t)}function De(e,n,t){const r=E(t||e),i={x:n.x,y:n.y,width:Math.max(1,n.width),height:Math.max(1,n.height)};if(e.type==="rect"||e.type==="rounded-rect")e.x=Math.round(i.x),e.y=Math.round(i.y),e.width=Math.round(i.width),e.height=Math.round(i.height);else if(e.type==="circle"){const s=Math.max(1,Math.min(i.width,i.height));e.cx=Math.round(i.x+i.width/2),e.cy=Math.round(i.y+i.height/2),e.r=Math.round(s/2)}else if(e.type==="ellipse")e.cx=Math.round(i.x+i.width/2),e.cy=Math.round(i.y+i.height/2),e.rx=Math.round(i.width/2),e.ry=Math.round(i.height/2);else if(e.type==="star"){const s=Math.max(i.width/Math.max(1,r.width),i.height/Math.max(1,r.height));e.cx=Math.round(i.x+i.width/2),e.cy=Math.round(i.y+i.height/2),e.outerRadius=Math.max(1,Math.round(Number((t==null?void 0:t.outerRadius)||e.outerRadius||1)*s)),e.innerRadius=Math.max(1,Math.round(Number((t==null?void 0:t.innerRadius)||e.innerRadius||1)*s))}else if(e.type==="line")e.x1=Math.round(i.x),e.y1=Math.round(i.y),e.x2=Math.round(i.x+i.width),e.y2=Math.round(i.y+i.height);else if(e.type==="polygon"){const s=i.width/Math.max(1,r.width),o=i.height/Math.max(1,r.height);e.points=String((t==null?void 0:t.points)||e.points||"").trim().split(/\s+/).map(l=>{const[c,d]=l.split(",").map(Number);return!Number.isFinite(c)||!Number.isFinite(d)?l:`${Math.round(i.x+(c-r.x)*s)},${Math.round(i.y+(d-r.y)*o)}`}).join(" ")}else if(e.type==="path"){const s=i.width/Math.max(1,r.width),o=i.height/Math.max(1,r.height);let l=String((t==null?void 0:t.d)||e.d||"");z((t==null?void 0:t.d)||e.d).forEach((c,d)=>{l=W(l,d,i.x+(c.x-r.x)*s,i.y+(c.y-r.y)*o)}),e.d=l}}function Ge(e,n,t,r,i=null,s={}){const o=e.shapes.find(b=>b.id===e.selectedId);if(!o)return;const l=i||o,c=E(l);let d=c.x,u=c.x+c.width,M=c.y,w=c.y+c.height;if(n.includes("w")&&(d+=t),n.includes("e")&&(u+=t),n.includes("n")&&(M+=r),n.includes("s")&&(w+=r),s.altKey){const b={x:c.x+c.width/2,y:c.y+c.height/2},V=Math.max(Math.abs(u-b.x),Math.abs(d-b.x)),F=Math.max(Math.abs(w-b.y),Math.abs(M-b.y));d=b.x-V,u=b.x+V,M=b.y-F,w=b.y+F}if(s.shiftKey){const b=c.width/Math.max(1,c.height),F=Math.max(1,Math.abs(u-d))/Math.max(.01,b);n.includes("n")?M=w-F:w=M+F}De(o,{x:Math.min(d,u),y:Math.min(M,w),width:Math.abs(u-d),height:Math.abs(w-M)},l)}function je(e,n,t=null,r=null,i=0){const s=e.shapes.find(d=>d.id===e.selectedId);if(!s)return;const o=r||j(s),c=(Math.atan2(n.y-o.y,n.x-o.x)-i)*180/Math.PI;s.rotate=Number(((Number((t==null?void 0:t.rotate)??s.rotate)||0)+c).toFixed(2))}function Be(e,n,t,r,i=null){const s=e.shapes.find(l=>l.id===e.selectedId);if(!s)return;const o=i||s;if(s.type==="rect"||s.type==="rounded-rect")n==="origin"?(s.x=Number(o.x||0)+t,s.y=Number(o.y||0)+r,s.width=Math.max(1,Number(o.width||1)-t),s.height=Math.max(1,Number(o.height||1)-r)):n==="size"&&(s.width=Math.max(1,Number(o.width||1)+t),s.height=Math.max(1,Number(o.height||1)+r));else if(s.type==="circle")n==="center"?(s.cx=Number(o.cx||0)+t,s.cy=Number(o.cy||0)+r):n==="radius"&&(s.r=Math.max(1,Number(o.r||1)+t));else if(s.type==="ellipse")n==="center"?(s.cx=Number(o.cx||0)+t,s.cy=Number(o.cy||0)+r):n==="radius-x"?s.rx=Math.max(1,Number(o.rx||1)+t):n==="radius-y"&&(s.ry=Math.max(1,Number(o.ry||1)+r));else if(s.type==="line")n==="start"?(s.x1=Number(o.x1||0)+t,s.y1=Number(o.y1||0)+r):n==="end"&&(s.x2=Number(o.x2||0)+t,s.y2=Number(o.y2||0)+r);else if(s.type==="polygon"&&n.startsWith("point-")){const l=Number(n.replace("point-","")),c=String(o.points||"").trim().split(/\s+/),[d,u]=String(c[l]||"").split(",").map(Number);Number.isFinite(d)&&Number.isFinite(u)&&(c[l]=`${Math.round(d+t)},${Math.round(u+r)}`,s.points=c.join(" "))}else s.type==="star"?n==="center"?(s.cx=Number(o.cx||0)+t,s.cy=Number(o.cy||0)+r):n==="outer-radius"?s.outerRadius=Math.max(1,Number(o.outerRadius||1)+t):n==="inner-radius"&&(s.innerRadius=Math.max(1,Number(o.innerRadius||1)+t)):s.type==="path"&&n.startsWith("path-point-")&&de(e,n,t,r,o)}function de(e,n,t,r,i=null){const s=e.shapes.find(d=>d.id===e.selectedId);if(!s)return;const o=i||s,l=Number(n.replace("path-point-","")),c=z(o.d).at(l);c&&(s.d=W(o.d,l,c.x+t,c.y+r))}function P(e,n){const t=n==null?void 0:n.querySelector("svg:not(.design-vector-keypoint-layer)"),r=t==null?void 0:t.getBoundingClientRect();return!(r!=null&&r.width)||!(r!=null&&r.height)?{x:e.clientX,y:e.clientY}:{x:(e.clientX-r.left)/r.width*640,y:(e.clientY-r.top)/r.height*420}}function ae(e,n){var r,i,s,o;const t=((r=e.target)==null?void 0:r.id)||((o=(s=(i=e.target)==null?void 0:i.closest)==null?void 0:s.call(i,"[id]"))==null?void 0:o.id)||"";return n.shapes.some(l=>l.id===t)?t:""}function We(e,n){return e.x<=n.x+n.width&&e.x+e.width>=n.x&&e.y<=n.y+n.height&&e.y+e.height>=n.y}function He(e,n,t=!1){const r={x:Math.min(n.x1,n.x2),y:Math.min(n.y1,n.y2),width:Math.abs(n.x2-n.x1),height:Math.abs(n.y2-n.y1)},i=e.shapes.filter(s=>We(E(s),r)).map(s=>s.id);t?v(e,[...e.selectedIds||[],...i]):v(e,i)}function Oe(e,n){const t={...e};if("x"in t&&(t.x=Math.round(n.x-Number(t.width||1)/2)),"y"in t&&(t.y=Math.round(n.y-Number(t.height||1)/2)),"cx"in t&&(t.cx=Math.round(n.x)),"cy"in t&&(t.cy=Math.round(n.y)),"x1"in t&&"x2"in t){const r=Number(t.x2||0)-Number(t.x1||0),i=Number(t.y2||0)-Number(t.y1||0);t.x1=Math.round(n.x-r/2),t.y1=Math.round(n.y-i/2),t.x2=Math.round(n.x+r/2),t.y2=Math.round(n.y+i/2)}return t}function Ye(e,n,t,r){var o;(o=n.querySelector(".design-vector-context-menu"))==null||o.remove();const i=ae(e,t);i&&(v(t,[i]),x(n,t.shapes.find(l=>l.id===t.selectedId)),r());const s=document.createElement("div");s.className="design-vector-context-menu",s.innerHTML=`
    <button type="button" data-vector-context-action="duplicate">Duplicate</button>
    <button type="button" data-vector-context-action="front">Bring Forward</button>
    <button type="button" data-vector-context-action="back">Send Backward</button>
    <button type="button" data-vector-context-action="remove">Remove</button>
  `,s.style.left=`${e.clientX||0}px`,s.style.top=`${e.clientY||0}px`,s.addEventListener("pointerdown",l=>{l.stopPropagation()}),s.addEventListener("click",l=>{var d;const c=(d=l.target.closest("[data-vector-context-action]"))==null?void 0:d.dataset.vectorContextAction;if(c){if(N(t),c==="duplicate"){const u=H(t);u&&x(n,u)}else c==="front"?G(t,1):c==="back"?G(t,-1):c==="remove"&&x(n,ce(t));s.remove(),r()}}),n.appendChild(s),setTimeout(()=>{window.addEventListener("pointerdown",()=>s.remove(),{once:!0})},0)}function _e(e,n,t,r){var X,U,Z,J;const i=n.querySelector("#design-vector-canvas");if(!i)return;const s=t.tool||"select",o=((Z=(U=(X=e.target).closest)==null?void 0:U.call(X,"[data-vector-keypoint]"))==null?void 0:Z.dataset.vectorKeypoint)||"",l=o?"":ae(e,t),c=P(e,i);if(t.snap&&(c.x=Math.round(c.x/10)*10,c.y=Math.round(c.y/10)*10),l){if((e.ctrlKey||e.metaKey)&&e.altKey){N(t),v(t,[l]);const g=H(t,e.altKey?0:18);g&&x(n,g)}else e.ctrlKey||e.metaKey?re(t,l):(J=t.selectedIds)!=null&&J.includes(l)||v(t,[l]);x(n,t.shapes.find(g=>g.id===t.selectedId)),r()}else if((s==="draw"||R.includes(s))&&!o){N(t);const g=`vector-${t.nextIndex}`;t.nextIndex+=1;const I=s==="draw"?L(n,g):k(s,{id:g},t.nextIndex),p=Oe(I,c);t.shapes.push(p),v(t,[g]),x(n,p),r()}else if(s==="select"&&!o){const g=p=>{const f=P(p,i);t.marquee={x1:c.x,y1:c.y,x2:f.x,y2:f.y},r()},I=p=>{const f=P(p,i),m={x1:c.x,y1:c.y,x2:f.x,y2:f.y};t.marquee=null,Math.abs(m.x2-m.x1)>4||Math.abs(m.y2-m.y1)>4?He(t,m,p.ctrlKey||p.metaKey):v(t,[]),x(n,t.shapes.find(ue=>ue.id===t.selectedId)),r(),window.removeEventListener("pointermove",g),window.removeEventListener("pointerup",I)};window.addEventListener("pointermove",g),window.addEventListener("pointerup",I,{once:!0});return}const d=t.shapes.find(g=>g.id===t.selectedId);if(!d)return;const u={...d},M=Object.fromEntries(se(t).map(g=>[g.id,{...g}])),w=e.shiftKey,b=e.altKey,V=j(u),F=Math.atan2(c.y-V.y,c.x-V.x);let O=!1;const Y=g=>{const I=P(g,i);let p=I.x-c.x,f=I.y-c.y;if(t.snap&&(p=Math.round(p/10)*10,f=Math.round(f/10)*10),g.shiftKey||w)if(o||s==="draw"){const m=Math.max(Math.abs(p),Math.abs(f));p=p<0?-m:m,f=f<0?-m:m}else Math.abs(p)>Math.abs(f)?f=0:p=0;!O&&(Math.abs(p)>0||Math.abs(f)>0||o==="rotate"||s==="rotate")&&(N(t),O=!0),o==="rotate"||s==="rotate"?je(t,I,u,V,F):o.startsWith("resize-")?Ge(t,o,p,f,u,{shiftKey:g.shiftKey||w,altKey:g.altKey||b}):o.startsWith("path-point-")?de(t,o,p,f,u):o?Be(t,o,p,f,u):s==="draw"&&(g.altKey||b)?Ke(t,p,f,u):s==="draw"?le(t,p,f,u):Pe(t,p,f,M),x(n,t.shapes.find(m=>m.id===t.selectedId)),r()},_=()=>{window.removeEventListener("pointermove",Y),window.removeEventListener("pointerup",_)};window.addEventListener("pointermove",Y),window.addEventListener("pointerup",_,{once:!0})}async function Je(e,n){const t=$e(n),r=ye(n),i=he(e,{className:"design-studio-shell",eyebrow:r.title,title:t.title,description:S[n].description,toolIds:r.toolIds,activeToolId:n,showHero:n!=="svg-editor",showRouteTabs:n!=="svg-editor",metrics:[{key:"views",label:"Views",value:`${r.toolIds.length}`},{key:"focus",label:"Focus",value:S[n].title}]});i.content.innerHTML=Ie();const s=[];{const o={variables:{...A},background:{...q},shapes:[k("rect",{id:"vector-panel-1",x:70,y:70,width:220,height:130,rx:16,fill:"var(--vector-fill)"},0),k("circle",{id:"vector-orbit-2",cx:390,cy:132,r:72,fill:"var(--vector-accent)",opacity:.82},1),k("path",{id:"vector-mark-3",d:"M 170 318 C 240 222 382 240 470 318",fill:"none",stroke:"var(--vector-stroke)",strokeWidth:10},2)],selectedId:"vector-panel-1",selectedIds:["vector-panel-1"],nextIndex:4,tool:"select",history:[],future:[],marquee:null},l=()=>{ee(i.content,o),i.setStatus("Vector workspace updated.","success")};x(i.content,o.shapes[0]),ee(i.content,o),s.push(...Array.from(i.content.querySelectorAll("[data-vector-var], #design-vector-bg-type, #design-vector-bg-start, #design-vector-bg-end, #design-vector-bg-angle, #design-vector-grid, #design-vector-snap, #design-vector-zoom")).map(c=>h(c,"input",l))),s.push(...Array.from(i.content.querySelectorAll("#design-vector-shape-type, #design-vector-fill, #design-vector-fill-mode, #design-vector-fill-start, #design-vector-fill-end, #design-vector-fill-angle, #design-vector-stroke, #design-vector-stroke-width, #design-vector-x, #design-vector-y, #design-vector-width, #design-vector-height, #design-vector-cx, #design-vector-cy, #design-vector-rx, #design-vector-ry, #design-vector-r, #design-vector-outer-radius, #design-vector-inner-radius, #design-vector-point-count, #design-vector-rotate, #design-vector-opacity, #design-vector-text, #design-vector-points, #design-vector-path")).map(c=>h(c,"input",()=>{const d=o.shapes.findIndex(u=>u.id===o.selectedId);d>=0&&(N(o),o.shapes[d]=L(i.content,o.selectedId),l())}))),s.push(h(i.content.querySelector("#design-vector-shape-type"),"change",c=>{x(i.content,k(c.target.value,{},o.nextIndex))})),s.push(...Array.from(i.content.querySelectorAll("[data-vector-tool]")).map(c=>h(c,"click",d=>{o.tool=d.currentTarget.dataset.vectorTool,R.includes(o.tool)&&x(i.content,k(o.tool,{},o.nextIndex)),i.content.querySelectorAll("[data-vector-tool]").forEach(u=>{u.classList.toggle("is-active",u.dataset.vectorTool===o.tool)}),oe(i.content,o)}))),s.push(h(i.content.querySelector("#design-vector-canvas"),"pointerdown",c=>{_e(c,i.content,o,l)})),s.push(h(i.content.querySelector("#design-vector-canvas"),"contextmenu",c=>{c.preventDefault(),Ye(c,i.content,o,l)})),s.push(h(i.content.querySelector("#design-vector-add"),"click",()=>{N(o);const c=`vector-${o.nextIndex}`;o.nextIndex+=1;const d=L(i.content,c);o.shapes.push(d),v(o,[c]),l()})),s.push(h(i.content.querySelector("#design-vector-update"),"click",()=>{const c=o.shapes.findIndex(d=>d.id===o.selectedId);c<0||(N(o),o.shapes[c]=L(i.content,o.selectedId),l())})),s.push(h(i.content.querySelector("#design-vector-duplicate"),"click",()=>{N(o);const c=H(o);c&&(x(i.content,c),l())})),s.push(h(i.content.querySelector("#design-vector-remove"),"click",()=>{N(o),x(i.content,ce(o)),l()})),s.push(h(i.content.querySelector("#design-vector-undo"),"click",()=>{Ae(o)&&(x(i.content,o.shapes.find(c=>c.id===o.selectedId)),l())})),s.push(h(i.content.querySelector("#design-vector-redo"),"click",()=>{Re(o)&&(x(i.content,o.shapes.find(c=>c.id===o.selectedId)),l())})),s.push(h(i.content.querySelector("#design-vector-back"),"click",()=>{N(o),G(o,-1),l()})),s.push(h(i.content.querySelector("#design-vector-front"),"click",()=>{N(o),G(o,1),l()})),s.push(h(i.content.querySelector("#design-vector-copy-svg"),"click",()=>ge(i.content.querySelector("#design-vector-svg-code").textContent))),s.push(h(i.content.querySelector("#design-vector-download-svg"),"click",()=>fe(i.content.querySelector("#design-vector-svg-code").textContent,"vector-workspace.svg","image/svg+xml"))),s.push(h(i.content.querySelector("#design-vector-layer-list"),"click",c=>{const d=c.target.closest("[data-vector-select]");d&&(c.ctrlKey||c.metaKey?re(o,d.dataset.vectorSelect):v(o,[d.dataset.vectorSelect]),x(i.content,o.shapes.find(u=>u.id===o.selectedId)),l())})),l(),C={root:i.root,cleanup:s};return}}function Qe(){var e;if(C){for(const n of C.cleanup)n();(e=C.root)==null||e.remove(),C=null}}function h(e,n,t){return e?(e.addEventListener(n,t),()=>e.removeEventListener(n,t)):()=>{}}export{Je as m,Qe as u};
