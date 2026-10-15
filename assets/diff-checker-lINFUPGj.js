import{g as u,c as v}from"./ui-monaco-BbpBkolT.js";import{e as g}from"./index-ATPg-6Fd.js";let e=null,o=null,m=null;async function y(f){e=document.createElement("div"),e.className="tool-diff-checker",e.innerHTML=`
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>Compare Mode</label>
          <select id="diff-mode">
            <option value="side-by-side">Side by Side</option>
            <option value="inline">Inline</option>
          </select>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="diff-lang">
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="json">JSON</option>
            <option value="css">CSS</option>
            <option value="html">HTML</option>
          </select>
        </div>
        <div class="form-group tool-inline-control-group">
          <div class="tool-inline-control">
            <label class="rj-switch">
              <input type="checkbox" id="diff-whitespace" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="diff-whitespace" class="tool-inline-label">Trim Whitespace</label>
          </div>
        </div>
      </div>

      <div class="form-group tool-section-gap">
        <label>Comparison View</label>
        <div id="monaco-diff-editor" class="tool-editor-host-large"></div>
      </div>

      <div class="tool-action-row">
        <button id="btn-clear-left" class="btn-secondary tool-grow-1">Clear Original</button>
        <button id="btn-clear-right" class="btn-secondary tool-grow-1">Clear Modified</button>
      </div>
    </div>
  `,f.appendChild(e);const s=e.querySelector("#monaco-diff-editor"),t=e.querySelector("#diff-lang"),l=e.querySelector("#diff-mode"),r=e.querySelector("#diff-whitespace"),c=u();l.value=c.renderSideBySide?"side-by-side":"inline";try{const{diffEditor:n,monaco:i}=await v(s,{...c,originalEditable:!0,readOnly:!1,ignoreTrimWhitespace:!0});o=n,m=i;const a=i.editor.createModel("","plaintext"),d=i.editor.createModel("","plaintext");o.setModel({original:a,modified:d});const p=()=>{o.updateOptions({renderSideBySide:l.value==="side-by-side",ignoreTrimWhitespace:r.checked})};t.addEventListener("change",()=>{i.editor.setModelLanguage(a,t.value),i.editor.setModelLanguage(d,t.value)}),l.addEventListener("change",p),r.addEventListener("change",p),e.querySelector("#btn-clear-left").addEventListener("click",()=>a.setValue("")),e.querySelector("#btn-clear-right").addEventListener("click",()=>d.setValue(""))}catch(n){s.innerHTML=`<div class="error-state">Failed to load: ${g(n.message)}</div>`}}function S(){o&&o.dispose(),e&&e.remove()}export{y as mount,S as unmount};
