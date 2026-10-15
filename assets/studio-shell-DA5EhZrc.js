import{e as s,I as $,T as S}from"./index-ATPg-6Fd.js";function f(i){return S.find(n=>n.id===i)}function y(i,{className:n="",eyebrow:r="",title:d="",description:p="",toolIds:u=[],activeToolId:v="",metrics:c=[],showHero:h=!0,showRouteTabs:m=!0}={}){const a=document.createElement("div");a.className=`studio-shell ${n}`.trim();const l=u.map(t=>({toolId:t,tool:f(t)})).filter(t=>{var e;return((e=t.tool)==null?void 0:e.path)&&!t.tool.hidden});return a.innerHTML=`
    ${h?`<section class="studio-hero card">
      <div class="studio-hero-copy">
        ${r?`<div class="studio-eyebrow">${s(r)}</div>`:""}
        <h2>${s(d)}</h2>
        <p>${s(p)}</p>
      </div>
      ${c.length?`
        <div class="studio-metric-grid">
          ${c.map(t=>`
            <div class="studio-metric-card">
              <span>${s(t.label)}</span>
              <strong data-metric-key="${s(t.key)}">${s(t.value)}</strong>
            </div>
          `).join("")}
        </div>
      `:""}
    </section>`:""}
    ${m&&u.length>1&&l.length?`
      <nav class="studio-route-tabs" aria-label="${s(d)} views">
        ${l.map(({toolId:t,tool:e})=>`
            <a href="${s(e.path)}" data-route data-route-target="${s(t)}" class="studio-route-tab${t===v?" is-active":""}">
              <span class="studio-route-tab-icon">${$[e.icon]||$.home}</span>
              <span>${s(e.title)}</span>
            </a>
          `).join("")}
      </nav>
    `:""}
    <div class="studio-content"></div>
    <div class="studio-status" data-tone="neutral">Ready.</div>
  `,i.appendChild(a),{root:a,content:a.querySelector(".studio-content"),status:a.querySelector(".studio-status"),setMetric(t,e){const o=a.querySelector(`[data-metric-key="${t}"]`);o&&(o.textContent=e)},setStatus(t,e="neutral"){const o=a.querySelector(".studio-status");o&&(o.textContent=t,o.dataset.tone=e)}}}export{y as c};
