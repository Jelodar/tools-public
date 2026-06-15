import{_ as c}from"./index-7hsJjH-u.js";import{a as s}from"./ui-monaco-CfmXKXq9.js";import{d as m}from"./ui-utils-CG6aKAAj.js";let e=null,n=null;function u(l){const t=document.createElement("template");return t.innerHTML=String(l||""),t.content.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach(o=>o.remove()),t.content.querySelectorAll("*").forEach(o=>{Array.from(o.attributes).forEach(a=>{const i=a.name.toLowerCase(),r=String(a.value||"").trim().toLowerCase();(i.startsWith("on")||r.startsWith("javascript:"))&&o.removeAttribute(a.name)})}),t.innerHTML}function v(l){return String(l??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function g(l){e=document.createElement("div"),e.className="tool-markdown",e.innerHTML=`
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
  `,l.appendChild(e);const t=e.querySelector("#monaco-md-input"),o=e.querySelector("#md-preview");try{const{marked:a}=await c(async()=>{const{marked:d}=await import("https://esm.sh/marked@9.1.2");return{marked:d}},[]);n=(await s(t,{value:`# Markdown Editor

Edit here to see live preview.

* List item
* Another item`,language:"markdown",renderLineHighlight:"all",minimap:{enabled:!1},wordWrap:"on"})).editor;const r=()=>{o.innerHTML=u(a.parse(n.getValue()))};n.onDidChangeModelContent(r),r(),e.querySelector("#btn-download-md").addEventListener("click",()=>{m(n.getValue(),"document.md","text/markdown")}),e.querySelector("#btn-copy-html").addEventListener("click",()=>{navigator.clipboard.writeText(o.innerHTML)})}catch(a){t.innerHTML=`<div class="error-state">Failed to load: ${v(a.message)}</div>`}}function f(){n&&n.dispose(),e&&(e.remove(),e=null)}export{g as mount,f as unmount};
