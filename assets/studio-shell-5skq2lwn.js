import{I as p,T as m}from"./index-C4lglzE7.js";function S(n){return m.find(i=>i.id===n)}function a(n){return String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function y(n,{className:i="",eyebrow:r="",title:u="",description:$="",toolIds:c=[],activeToolId:v="",metrics:d=[],showHero:g=!0,showRouteTabs:h=!0}={}){const s=document.createElement("div");s.className=`studio-shell ${i}`.trim();const l=c.map(t=>({toolId:t,tool:S(t)})).filter(t=>{var e;return((e=t.tool)==null?void 0:e.path)&&!t.tool.hidden});return s.innerHTML=`
    ${g?`<section class="studio-hero card">
      <div class="studio-hero-copy">
        ${r?`<div class="studio-eyebrow">${a(r)}</div>`:""}
        <h2>${a(u)}</h2>
        <p>${a($)}</p>
      </div>
      ${d.length?`
        <div class="studio-metric-grid">
          ${d.map(t=>`
            <div class="studio-metric-card">
              <span>${a(t.label)}</span>
              <strong data-metric-key="${a(t.key)}">${a(t.value)}</strong>
            </div>
          `).join("")}
        </div>
      `:""}
    </section>`:""}
    ${h&&c.length>1&&l.length?`
      <nav class="studio-route-tabs" aria-label="${a(u)} views">
        ${l.map(({toolId:t,tool:e})=>`
            <a href="${a(e.path)}" data-route data-route-target="${a(t)}" class="studio-route-tab${t===v?" is-active":""}">
              <span class="studio-route-tab-icon">${p[e.icon]||p.home}</span>
              <span>${a(e.title)}</span>
            </a>
          `).join("")}
      </nav>
    `:""}
    <div class="studio-content"></div>
    <div class="studio-status" data-tone="neutral">Ready.</div>
  `,n.appendChild(s),{root:s,content:s.querySelector(".studio-content"),status:s.querySelector(".studio-status"),setMetric(t,e){const o=s.querySelector(`[data-metric-key="${t}"]`);o&&(o.textContent=e)},setStatus(t,e="neutral"){const o=s.querySelector(".studio-status");o&&(o.textContent=t,o.dataset.tone=e)}}}export{y as c};
