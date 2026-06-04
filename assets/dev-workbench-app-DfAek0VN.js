import{c as V,T as $,_ as b}from"./index-CGiSGYdp.js";import{a as x}from"./ui-monaco-Rf0BXOV8.js";import{c as j,d as A}from"./ui-utils-CG6aKAAj.js";import{c as y}from"./studio-CKR8zP_U.js";import{c as M}from"./studio-shell-4kPB4zak.js";const l={"web-formatters":{title:"Web Formatting",language:"html",sample:'<section class="wrap"><h1>Spacing</h1><p>Clean up this layout.</p></section>',actionLabel:"Format Code",resultFileName:o=>`formatted.${o.querySelector("#workbench-parser").value}`,heroDescription:"Format markup and stylesheet snippets with parser-specific controls."},"sql-formatter":{title:"SQL Formatting",language:"sql",sample:"select id,name,created_at from users where status = 'active' order by created_at desc",actionLabel:"Format SQL",resultFileName:()=>"formatted.sql",heroDescription:"Normalize SQL layout with dialect-aware formatting."},minifier:{title:"JS Minify",language:"javascript",sample:"function renderCard(title, subtitle) {\n  const value = `${title} ${subtitle}`.trim();\n  return value.toUpperCase();\n}",actionLabel:"Minify Script",resultFileName:()=>"script.min.js",heroDescription:"Compress JavaScript for smaller delivery while keeping import/export semantics explicit."},"js-obfuscator":{title:"JS Obfuscation",language:"javascript",sample:'function buildLicenseToken(customerId) {\n  const seed = `${customerId}:stable`;\n  return btoa(seed).replace(/=/g, "");\n}',actionLabel:"Obfuscate Script",resultFileName:()=>"script.protected.js",heroDescription:"Apply identifier and string protection when minification alone is not enough."},"base-calc":{title:"Radix Conversion",actionLabel:"Convert",heroDescription:"Inspect the same value across binary, octal, decimal, hexadecimal, and custom bases."},"radix-converter":{title:"Radix Conversion",actionLabel:"Convert",heroDescription:"Inspect the same value across binary, octal, decimal, hexadecimal, and custom bases."}};let d=null;function N(o){return $.find(e=>e.id===o)}function P(){return`
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <label class="studio-field studio-field-wide">
              <span>Input Value</span>
              <input id="base-input" type="text" value="255" placeholder="255">
            </label>
            <label class="studio-field">
              <span>Input Radix</span>
              <select id="base-input-radix">
                <option value="10">Decimal</option>
                <option value="2">Binary</option>
                <option value="8">Octal</option>
                <option value="16">Hex</option>
              </select>
            </label>
            <label class="studio-field">
              <span>Custom Radix</span>
              <input id="base-custom-radix" type="number" min="2" max="36" value="32">
            </label>
          </div>
        </div>
        <div class="studio-result-grid">
          ${[["Decimal","10"],["Binary","2"],["Octal","8"],["Hexadecimal","16"],["Custom","custom"]].map(([o,e])=>`
            <div class="studio-output-card">
              <span>${o}</span>
              <strong data-base-output="${e}">0</strong>
            </div>
          `).join("")}
        </div>
      </section>
    </div>
  `}function Q(o){return`
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            ${o==="web-formatters"?`
              <label class="studio-field">
                <span>Parser</span>
                <select id="workbench-parser">
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="scss">SCSS</option>
                  <option value="less">LESS</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Indent</span>
                <select id="workbench-indent">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </label>
            `:""}
            ${o==="sql-formatter"?`
              <label class="studio-field">
                <span>Dialect</span>
                <select id="workbench-dialect">
                  <option value="sql">Standard SQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="mariadb">MariaDB</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Indent</span>
                <select id="workbench-indent">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </label>
            `:""}
            ${o==="minifier"?`
              <label class="studio-toggle">
                <input id="workbench-mangle" type="checkbox" checked>
                <span>Mangle</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-compress" type="checkbox" checked>
                <span>Compress</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-module" type="checkbox">
                <span>Module</span>
              </label>
            `:""}
            ${o==="js-obfuscator"?`
              <label class="studio-field">
                <span>Protection Level</span>
                <select id="workbench-obf-preset">
                  <option value="default">Balanced</option>
                  <option value="high">Aggressive</option>
                  <option value="low">Light</option>
                </select>
              </label>
              <label class="studio-toggle">
                <input id="workbench-obf-strings" type="checkbox" checked>
                <span>String Array</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-obf-compact" type="checkbox" checked>
                <span>Compact</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-obf-deadcode" type="checkbox">
                <span>Dead Code</span>
              </label>
            `:""}
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            ${o==="minifier"||o==="js-obfuscator"?'<input id="workbench-file-input" class="hidden" type="file" accept=".js,text/javascript">':""}
            ${o==="minifier"||o==="js-obfuscator"?'<button id="workbench-upload" class="btn-secondary">Import</button>':""}
            <button id="workbench-sample" class="btn-secondary">Sample</button>
            <button id="workbench-run">${l[o].actionLabel}</button>
            <button id="workbench-copy" class="btn-secondary">Copy Result</button>
            <button id="workbench-download" class="btn-secondary">Download</button>
          </div>
        </div>
        <div class="studio-panel-grid studio-panel-grid-dual">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Source</h3>
            </div>
            <div id="workbench-source" class="studio-editor"></div>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Result</h3>
            </div>
            <div id="workbench-result" class="studio-editor"></div>
          </section>
        </div>
      </section>
    </div>
  `}async function z(o,e){const k=N(e),_=V(e),t=M(o,{className:"dev-workbench-shell",eyebrow:_.title,title:k.title,description:l[e].heroDescription,toolIds:_.toolIds,activeToolId:e,metrics:[{key:"views",label:"Views",value:`${_.toolIds.length}`},{key:"focus",label:"Focus",value:l[e].title}]});t.content.innerHTML=e==="base-calc"||e==="radix-converter"?P():Q(e);const n=[],u=(s,a="neutral")=>t.setStatus(s,a);if(e==="base-calc"||e==="radix-converter"){const s=t.content.querySelector("#base-input"),a=t.content.querySelector("#base-input-radix"),i=t.content.querySelector("#base-custom-radix"),r=()=>{try{const v={10:y(s.value,a.value,10),2:y(s.value,a.value,2),8:y(s.value,a.value,8),16:y(s.value,a.value,16),custom:y(s.value,a.value,Number(i.value))};t.content.querySelectorAll("[data-base-output]").forEach(p=>{p.textContent=v[p.dataset.baseOutput]}),u("Converted across radices.","success")}catch(v){t.content.querySelectorAll("[data-base-output]").forEach(p=>{p.textContent="Error"}),u(v.message,"danger")}};n.push(c(s,"input",r)),n.push(c(a,"change",r)),n.push(c(i,"input",r)),r(),d={root:t.root,cleanup:n,editors:[]};return}const L=t.content.querySelector("#workbench-source"),C=t.content.querySelector("#workbench-result"),E=await x(L,{value:l[e].sample,language:l[e].language}),D=await x(C,{value:"",language:l[e].language,readOnly:!0}),S=E.editor,m=D.editor,h=(s,a="success",i="Done.")=>{m.setValue(s),u(i,a)},T=async()=>{const s=S.getValue();if(!s.trim()){u("Enter source input first.","danger");return}try{if(e==="web-formatters"){const f=t.content.querySelector("#workbench-parser").value,g=await b(()=>import("https://esm.sh/prettier@3.0.3/standalone"),[]),w=await b(()=>import("https://esm.sh/prettier@3.0.3/plugins/html"),[]),F=await b(()=>import("https://esm.sh/prettier@3.0.3/plugins/postcss"),[]),R=await g.format(s,{parser:f,plugins:[w.default,F.default],tabWidth:Number(t.content.querySelector("#workbench-indent").value)});h(R,"success","Web code formatted.");return}if(e==="sql-formatter"){const{format:f}=await b(async()=>{const{format:w}=await import("https://esm.sh/sql-formatter@12.2.4");return{format:w}},[]),g=f(s,{language:t.content.querySelector("#workbench-dialect").value,indent:" ".repeat(Number(t.content.querySelector("#workbench-indent").value)),uppercase:!0});h(g,"success","SQL formatted.");return}if(e==="minifier"){const{minify:f}=await b(async()=>{const{minify:w}=await import("https://esm.sh/terser@5.30.0");return{minify:w}},[]),g=await f(s,{mangle:t.content.querySelector("#workbench-mangle").checked,compress:t.content.querySelector("#workbench-compress").checked,module:t.content.querySelector("#workbench-module").checked,ecma:2020});h(g.code||"","success","Script minified.");return}const a=await b(()=>import("https://esm.sh/javascript-obfuscator@4.1.0"),[]),i=a.default||a,r=t.content.querySelector("#workbench-obf-preset").value,v={compact:t.content.querySelector("#workbench-obf-compact").checked,stringArray:t.content.querySelector("#workbench-obf-strings").checked,deadCodeInjection:t.content.querySelector("#workbench-obf-deadcode").checked,deadCodeInjectionThreshold:.4,identifierNamesGenerator:"hexadecimal",renameGlobals:r==="high",controlFlowFlattening:r!=="low",controlFlowFlatteningThreshold:.75,numbersToExpressions:!0,simplify:!0,splitStrings:r==="high",unicodeEscapeSequence:!1},p=i.obfuscate(s,v);h(p.getObfuscatedCode(),"success","Script obfuscated.")}catch(a){h(a.message,"danger",a.message)}};n.push(c(t.content.querySelector("#workbench-run"),"click",T)),n.push(c(t.content.querySelector("#workbench-sample"),"click",()=>{S.setValue(l[e].sample),m.setValue(""),u("Sample restored.","neutral")})),n.push(c(t.content.querySelector("#workbench-copy"),"click",()=>j(m.getValue()))),n.push(c(t.content.querySelector("#workbench-download"),"click",()=>{const s=l[e].resultFileName(t.content);A(m.getValue(),s),u("Result downloaded.","success")}));const O=t.content.querySelector("#workbench-upload"),q=t.content.querySelector("#workbench-file-input");n.push(c(O,"click",()=>q.click())),n.push(c(q,"change",async s=>{var i;const a=(i=s.target.files)==null?void 0:i[0];a&&(S.setValue(await a.text()),u(`${a.name} loaded.`,"success"))})),d={root:t.root,cleanup:n,editors:[S,m]}}function U(){var o;if(d){for(const e of d.cleanup)e();for(const e of d.editors)e.dispose();(o=d.root)==null||o.remove(),d=null}}function c(o,e,k){return o?(o.addEventListener(e,k),()=>o.removeEventListener(e,k)):()=>{}}export{z as m,U as u};
