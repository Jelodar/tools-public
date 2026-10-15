import{_ as s,e as c}from"./index-ATPg-6Fd.js";import{a as m}from"./ui-monaco-BbpBkolT.js";import{d as u}from"./ui-utils-BycjcbQ0.js";let e=null,n=null;function v(r){const t=document.createElement("template");return t.innerHTML=String(r||""),t.content.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach(o=>o.remove()),t.content.querySelectorAll("*").forEach(o=>{Array.from(o.attributes).forEach(a=>{const i=a.name.toLowerCase(),l=String(a.value||"").trim().toLowerCase();(i.startsWith("on")||l.startsWith("javascript:"))&&o.removeAttribute(a.name)})}),t.innerHTML}async function f(r){e=document.createElement("div"),e.className="tool-markdown",e.innerHTML=`
    <div class="card tool-shell-stack tool-shell-tall">
      <div class="tool-grid-two tool-fill-height">
        <div class="tool-column-stack">
          <label class="tool-pane-label">Markdown</label>
          <div id="monaco-md-input" class="tool-frame"></div>
        </div>
        <div class="tool-column-stack">
          <label class="tool-pane-label">Preview</label>
          <div id="md-preview" class="markdown-body tool-preview-surface"></div>
        </div>
      </div>
      
      <div class="tool-action-row">
        <button id="btn-download-md" class="tool-neutral-button tool-grow-1">Download .md</button>
        <button id="btn-copy-html" class="tool-neutral-button tool-grow-1">Copy as HTML</button>
      </div>
    </div>
  `,r.appendChild(e);const t=e.querySelector("#monaco-md-input"),o=e.querySelector("#md-preview");try{const{marked:a}=await s(async()=>{const{marked:d}=await import("https://esm.sh/marked@9.1.2");return{marked:d}},[]);n=(await m(t,{value:`# Markdown Editor

Edit here to see live preview.

* List item
* Another item`,language:"markdown",renderLineHighlight:"all",minimap:{enabled:!1},wordWrap:"on"})).editor;const l=()=>{o.innerHTML=v(a.parse(n.getValue()))};n.onDidChangeModelContent(l),l(),e.querySelector("#btn-download-md").addEventListener("click",()=>{u(n.getValue(),"document.md","text/markdown")}),e.querySelector("#btn-copy-html").addEventListener("click",()=>{navigator.clipboard.writeText(o.innerHTML)})}catch(a){t.innerHTML=`<div class="error-state">Failed to load: ${c(a.message)}</div>`}}function h(){n&&n.dispose(),e&&(e.remove(),e=null)}export{f as mount,h as unmount};
