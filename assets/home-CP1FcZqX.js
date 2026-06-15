import{g as h,a as m,b as S,r as f,S as y,T as p,I as l,c as O}from"./index-CoRJqXFF.js";function C({tools:e,entryTools:t,studios:o,categories:a}){const r=e.filter(i=>i.id!=="home").length,d=t.filter(i=>i.id!=="home").length,u=Math.max(0,r-d),v=a.filter(i=>{var s;return(s=i.tools)==null?void 0:s.length}).map(i=>({id:i.id,title:i.title,count:i.tools.length}));return{totalTools:r,entryRouteCount:d,compatibilityRouteCount:u,studioCount:o.length,categoryBreakdown:v}}let n=null,c=null;const w={dev:"Development",crypto:"Security & Crypto",media:"Media & Design",data:"Data & Text",time:"Time & Units",network:"Network & DevOps"};async function L(e){n=document.createElement("div"),n.className="tool-home",e.appendChild(n);const t=()=>{const o=m().filter(i=>i.id!=="home");C({tools:p,entryTools:m(),studios:y,categories:S()});const{recentTools:a=[],favoriteTools:r=[]}=h.getState().navigation||{},d=g(r.map(i=>f(i)).filter(Boolean)),u=g(a.map(i=>f(i)).filter(Boolean)),v=I(o);n.innerHTML=`<div class="dashboard-summary">
        ${k()}
        ${$("Favorites",d,"Pin tools from the dashboard cards to keep them here.")}
        ${$("Recent",u,"Open a tool once and it will appear here for faster return navigation.")}
        ${Object.entries(v).map(([i,s])=>D(i,s,d.map(b=>b.id))).join("")}
      </div>
    `,n.querySelectorAll("[data-favorite-tool]").forEach(i=>{i.addEventListener("click",s=>{s.preventDefault(),s.stopPropagation(),h.dispatch({type:"TOGGLE_FAVORITE_TOOL",toolId:i.dataset.favoriteTool})})})};c=h.subscribe(t),t()}function N(){c==null||c(),c=null,n&&(n.remove(),n=null)}function I(e){return e.reduce((t,o)=>(t[o.category]||(t[o.category]=[]),t[o.category].push(o),t),{})}function g(e){const t=new Set;return e.filter(o=>!o||t.has(o.id)?!1:(t.add(o.id),!0))}function k(){return`
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h2>Studios</h2>
        <p>Shared workspaces that absorb smaller focused views.</p>
      </div>
      <div class="tool-grid studio-grid">
        ${y.map(e=>{const t=p.find(o=>o.id===e.entryToolId);return`
            <a href="${t.path}" data-route class="tool-card studio-card-link">
              <div class="card-inner studio-summary-card">
                <div class="tool-card-topline">
                  <div class="icon-box">
                    ${l[t.icon]||l.home}
                  </div>
                  <span class="studio-route-count">${e.toolIds.length} Tools</span>
                </div>
                <div class="card-content">
                  <h3>${e.title}</h3>
                  <p>${e.description}</p>
                </div>
                <div class="studio-chip-row">
                  ${e.toolIds.map(o=>{var a;return`<span>${((a=p.find(r=>r.id===o))==null?void 0:a.title)||o}</span>`}).join("")}
                </div>
              </div>
            </a>
          `}).join("")}
      </div>
    </section>
  `}function $(e,t,o){return`
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h2>${e}</h2>
        <p>${t.length?`${t.length} tools`:o}</p>
      </div>
      <div class="tool-grid">
        ${t.length?t.map(a=>T(a,!0)).join(""):'<div class="dashboard-empty-state">No tools yet.</div>'}
      </div>
    </section>
  `}function D(e,t,o){return`
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h2>${w[e]||"Other"}</h2>
        <p>${t.length} entry routes</p>
      </div>
      <div class="tool-grid">
        ${t.map(a=>T(a,o.includes(a.id))).join("")}
      </div>
    </section>
  `}function T(e,t){const o=O(e.id);return`
    <a href="${e.path}" data-route class="tool-card">
      <div class="card-inner">
        <div class="tool-card-topline">
          <div class="icon-box">
            ${l[e.icon]||l.home}
          </div>
          <button class="tool-favorite-button${t?" is-active":""}" data-favorite-tool="${e.id}" aria-label="${t?"Remove from favorites":"Add to favorites"}">
            ${t?"Pinned":"Pin"}
          </button>
        </div>
        <div class="card-content">
          <h3>${e.title}</h3>
          <p>${e.description}</p>
          ${o?`<div class="tool-card-meta">${o.title}</div>`:""}
        </div>
      </div>
    </a>
  `}export{L as mount,N as unmount};
