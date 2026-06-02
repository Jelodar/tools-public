import{c as b,d as v}from"./ui-utils-CG6aKAAj.js";let e=null;async function y(i){e=document.createElement("div"),e.className="tool-list-ops",e.innerHTML=`
    <div class="card">
      <div class="form-group">
        <label>Input List (One item per line)</label>
        <textarea id="list-input" class="list-input" placeholder="Item 1
Item 2
Item 3..."></textarea>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label>Add Prefix</label>
          <input type="text" id="list-prefix" placeholder="e.g. ID_">
        </div>
        <div class="form-group">
          <label>Add Suffix</label>
          <input type="text" id="list-suffix" placeholder="e.g. _v1">
        </div>
      </div>

      <div class="controls list-controls">
        <button data-op="sort-asc">Sort A-Z</button>
        <button data-op="sort-desc" class="btn-secondary">Sort Z-A</button>
        <button data-op="unique">Unique Only</button>
        <button data-op="reverse" class="btn-secondary">Reverse</button>
        <button data-op="shuffle">Shuffle</button>
        <button data-op="apply-wrap" class="btn-secondary">Apply Wraps</button>
      </div>

      <div class="form-group list-output-group">
        <label>Resulting List</label>
        <textarea id="list-output" class="list-output" readonly></textarea>
      </div>

      <div class="list-actions">
        <button id="btn-copy-list" class="list-action">Copy List</button>
        <button id="btn-dl-list" class="btn-secondary list-action">Download .txt</button>
      </div>
    </div>
  `,i.appendChild(e);const r=e.querySelector("#list-input"),o=e.querySelector("#list-output"),c=e.querySelector("#list-prefix"),u=e.querySelector("#list-suffix"),d=l=>{let t=r.value.split(`
`).filter(a=>a.trim()!=="");if(t.length!==0){switch(l){case"sort-asc":t.sort();break;case"sort-desc":t.sort().reverse();break;case"unique":t=[...new Set(t)];break;case"reverse":t.reverse();break;case"shuffle":for(let s=t.length-1;s>0;s--){const n=Math.floor(Math.random()*(s+1));[t[s],t[n]]=[t[n],t[s]]}break;case"apply-wrap":const a=c.value,p=u.value;t=t.map(s=>`${a}${s}${p}`);break}o.value=t.join(`
`)}};e.querySelectorAll("button[data-op]").forEach(l=>{l.addEventListener("click",()=>d(l.dataset.op))}),e.querySelector("#btn-copy-list").addEventListener("click",()=>b(o.value)),e.querySelector("#btn-dl-list").addEventListener("click",()=>v(o.value,"processed_list.txt"))}function m(){e&&e.remove()}export{y as mount,m as unmount};
