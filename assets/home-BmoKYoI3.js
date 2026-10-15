import{g as b,r as l,C as h,I as d,a as p}from"./index-ATPg-6Fd.js";let t=null,c=null;const v={dev:"Development",crypto:"Security & Crypto",media:"Media & Design",data:"Data & Text",time:"Time & Units",network:"Network & DevOps"};async function w(s){t=document.createElement("div"),t.className="tool-home",s.appendChild(t),g()}function y(){c==null||c(),c=null,t&&(t.remove(),t=null)}function g(){const{recentTools:s=[],favoriteTools:a=[]}=b.getState().navigation||{},r=u(s.map(e=>l(e)).filter(Boolean)).slice(0,6);t.innerHTML=`
    <div class="dashboard-hero">
      <h1 class="dashboard-title">${h.title}</h1>
      <p class="dashboard-tagline">${h.tagline}</p>
      <div class="dashboard-search-shell">
        <input type="text" id="dashboard-search" placeholder="Search tools…" autocomplete="off">
        <div id="dashboard-search-results" class="dashboard-search-results hidden"></div>
      </div>
    </div>

    ${r.length?`
      <section class="dashboard-section dashboard-recent">
        <h2>Recent</h2>
        <div class="dashboard-chip-row">
          ${r.map(e=>`
            <a href="${e.path}" data-route class="dashboard-chip">
              ${d[e.icon]||d.home}
              <span>${e.title}</span>
            </a>
          `).join("")}
        </div>
      </section>
    `:""}

    ${a.length?`
      <section class="dashboard-section dashboard-favorites">
        <h2>Favorites</h2>
        <div class="dashboard-chip-row">
          ${u(a.map(e=>l(e)).filter(Boolean)).map(e=>`
            <a href="${e.path}" data-route class="dashboard-chip">
              ${d[e.icon]||d.home}
              <span>${e.title}</span>
            </a>
          `).join("")}
        </div>
      </section>
    `:""}

    <section class="dashboard-section dashboard-browse">
      <button type="button" id="dashboard-browse-toggle">Browse all tools</button>
      <div id="dashboard-category-list" class="hidden">
        ${Object.entries(v).map(([e,n])=>{const o=p().filter(i=>i.category===e&&i.id!=="home");return o.length?`
            <div class="dashboard-category-block">
              <h3>${n}</h3>
              <div class="dashboard-chip-row">
                ${o.map(i=>`
                  <a href="${i.path}" data-route class="dashboard-chip">
                    <span>${i.title}</span>
                  </a>
                `).join("")}
              </div>
            </div>
          `:""}).join("")}
      </div>
    </section>
  `,m(),f()}function u(s){const a=new Set;return s.filter(r=>!r||a.has(r.id)?!1:(a.add(r.id),!0))}function m(){const s=t.querySelector("#dashboard-search"),a=t.querySelector("#dashboard-search-results");if(!s||!a)return;const r=p().filter(e=>e.id!=="home");s.addEventListener("input",()=>{const e=s.value.trim().toLowerCase();if(!e){a.classList.add("hidden"),a.innerHTML="";return}const n=r.filter(o=>o.title.toLowerCase().includes(e)||o.description.toLowerCase().includes(e)||(o.keywords||[]).some(i=>i.toLowerCase().includes(e))).slice(0,8);a.innerHTML=n.length?n.map(o=>`
          <a href="${o.path}" data-route class="dashboard-search-result">
            <strong>${o.title}</strong>
            <span>${o.description}</span>
          </a>
        `).join(""):'<div class="dashboard-search-empty">No matching tools.</div>',a.classList.remove("hidden")}),document.addEventListener("click",e=>{t.contains(e.target)||a.classList.add("hidden")})}function f(){const s=t.querySelector("#dashboard-browse-toggle"),a=t.querySelector("#dashboard-category-list");!s||!a||s.addEventListener("click",()=>{a.classList.toggle("hidden"),s.textContent=a.classList.contains("hidden")?"Browse all tools":"Hide categories"})}export{w as mount,y as unmount};
