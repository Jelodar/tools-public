import{c as Ae,g as Ie,T as De,_ as Ce}from"./index-7hsJjH-u.js";import{g as ce}from"./pool-CFv1-M46.js";import{a as de}from"./ui-monaco-CfmXKXq9.js";import{s as Be,d as $e,c as pe}from"./ui-utils-CG6aKAAj.js";import{c as Fe}from"./tool-state-B_5q_c8d.js";import{c as _e}from"./studio-shell-CJCNPGLr.js";function Q(n){return globalThis.structuredClone?structuredClone(n):JSON.parse(JSON.stringify(n))}function Qe(n){return n.replace(/~1/g,"/").replace(/~0/g,"~")}function Z(n,r,s=2){const p=JSON.stringify(n,null,s),l=W(p,r);return l?{text:"",available:!1,large:l}:{text:p,available:!0,large:l}}function He(n){return!!n&&typeof n.then=="function"}function _(n=""){return new Blob([n]).size}function W(n="",r=512*1024){return _(n)>=r}function fe(n=""){if(!n)return[];if(!n.startsWith("/"))throw new Error("Path must use JSON Pointer syntax, for example /items/0/name.");return n.split("/").slice(1).map(r=>{const s=Qe(r);return/^\d+$/.test(s)?Number(s):s})}function X(n){let r=0,s=0,p=0;const l=(t,a)=>{if(r+=1,s=Math.max(s,a),Array.isArray(t)){p+=t.length;for(const y of t)l(y,a+1);return}if(t&&typeof t=="object"){const y=Object.keys(t);p+=y.length;for(const f of y)l(t[f],a+1)}};return l(n,1),{kind:Array.isArray(n)?"array":n===null?"null":typeof n,nodes:r,depth:s,entries:p}}function Ke(n,r){let s=n;for(let p=0;p<r.length-1;p+=1){const l=r[p],t=r[p+1],a=s[l];if(a===void 0){s[l]=typeof t=="number"?[]:{},s=s[l];continue}if(!a||typeof a!="object")throw new Error(`Path segment ${String(l)} does not point to an object or array.`);s=a}return s}function ze(n,r,s){const p=fe(r);if(!p.length)return Q(s);const l=Q(n),t=Ke(l,p);return t[p.at(-1)]=s,l}function Ue(n,r){const s=fe(r);if(!s.length)throw new Error("Deleting the root document is not supported.");const p=Q(n);let l=p;for(let a=0;a<s.length-1;a+=1){const y=s[a];if(l=l==null?void 0:l[y],l===void 0)throw new Error(`Path ${r} does not exist.`)}const t=s.at(-1);if(Array.isArray(l)&&typeof t=="number"){if(t<0||t>=l.length)throw new Error(`Path ${r} does not exist.`);return l.splice(t,1),p}if(!l||typeof l!="object"||!(t in l))throw new Error(`Path ${r} does not exist.`);return delete l[t],p}function Ge({thresholdBytes:n=512*1024,runWorkerTask:r=null}={}){var M;let s=null,p=null,l="",t=!1,a=!1,y=0,f=null,T=null,O="",N=!1,b=!1,u=0,x=[];const $=((M=crypto.randomUUID)==null?void 0:M.call(crypto))||Math.random().toString(36).slice(2),V=(o,i,w=2)=>{f=o,T=X(o);const S=Z(o,n,w);return O=S.text,N=S.available,b=S.large,u=_(JSON.stringify(o)),x=[...x,{kind:i,at:new Date().toISOString()}],J()},m=()=>f??s,I=(o,i,w,S,L=4e3)=>w?i.slice(0,L):o===null?"":JSON.stringify(o,null,S).slice(0,L),J=()=>({sourceLarge:a,sourceTextAvailable:t,sourceBytes:y,sourceSummary:p,resultLarge:b,resultTextAvailable:N,resultBytes:u,resultSummary:T,operationLog:x}),j=async(o,i={})=>{if(r&&(a||b||o==="load")){const w=await r("json-op",{op:o,sessionId:$,payload:i});if(!w.success)throw new Error(w.error||`Worker op ${o} failed.`);const S=w.result;if(o==="load")a=!0,t=!1,l="",y=_(i.text),p=S.summary,s=null;else if(o==="set"||o==="delete"||o==="query"||o==="format"||o==="minify"){if(b=!0,N=!1,O="",T=S.summary,o==="query"){f=S.result;const L=JSON.stringify(S.result);W(L,n)?(f=null,b=!0):(f=S.result,b=!1,O=L,N=!0)}else f=null;u=0,x=[...x,{kind:o,at:new Date().toISOString()}]}return J()}return null};return{setThresholdBytes(o){if(n=o,s!==null){const i=Z(s,n,2);l=i.text,t=i.available,a=i.large}if(f!==null){const i=Z(f,n,2);O=i.text,N=i.available,b=i.large}return J()},load(o){return a=W(o,n),a&&r?j("load",{text:o}):(s=JSON.parse(o),p=X(s),t=!a,l=t?o:"",y=_(o),f=null,T=null,O="",N=!1,b=!1,u=0,x=[],J())},restore({sourceText:o="",resultText:i="",indent:w=2}={}){if(!String(o).trim())throw new Error("Load JSON first.");const S=()=>{if(String(i).trim()){const ee=W(i,n);f=JSON.parse(i),T=X(f),b=ee,N=!b,O=N?i:"",u=_(i)}return J()},L=this.load(o);return He(L)?L.then(()=>S()):S()},clearResult(){return f=null,T=null,O="",N=!1,b=!1,u=0,x=[],J()},commitResult(o=2){if(f===null&&!b)throw new Error("No result available to apply.");if(b&&r)return s=null,a=!0,t=!1,p=T,y=u,f=null,T=null,b=!1,O="",u=0,x=[...x,{kind:"commit",at:new Date().toISOString()}],J();s=Q(f),p=X(s);const i=Z(s,n,o);return l=i.text,t=i.available,a=i.large,y=u||_(JSON.stringify(s)),f=null,T=null,O="",N=!1,b=!1,u=0,x=[...x,{kind:"commit",at:new Date().toISOString()}],J()},format(o=2){if(m()===null&&!a)throw new Error("Load JSON first.");return a&&r?j("format"):V(Q(m()),"format",o)},minify(){if(m()===null&&!a)throw new Error("Load JSON first.");return a&&r?j("minify"):V(Q(m()),"minify",0)},validate(){if(m()===null&&!a)throw new Error("Load JSON first.");return J()},async runQuery(o,i,w=2){if(m()===null&&!a)throw new Error("Load JSON first.");if(a&&r)return j("query",{query:o});const S=await i(m(),o);return V(S,"query",w)},setAtPointer(o,i,w=2){if(m()===null&&!a)throw new Error("Load JSON first.");if(a&&r)return j("set",{pointer:o,valueText:i});const S=JSON.parse(i),L=ze(m(),o,S);return V(L,"set",w)},deleteAtPointer(o,i=2){if(m()===null&&!a)throw new Error("Load JSON first.");if(a&&r)return j("delete",{pointer:o});const w=Ue(m(),o);return V(w,"delete",i)},getDownloadText({indent:o=2}={}){if(m()===null&&!a)throw new Error("Load JSON first.");return a&&r?j("export",{indent:o}).then(i=>i.text):JSON.stringify(m(),null,o)},getSourceText({indent:o=2}={}){return s===null&&!a?"":a&&r?r("json-op",{op:"export",sessionId:$,payload:{indent:o}}).then(i=>i.text):t?l:JSON.stringify(s,null,o)},getResultText({indent:o=2}={}){return f===null&&!b?"":b&&r?r("json-op",{op:"export",sessionId:$,payload:{indent:o}}).then(i=>i.text):N?O:JSON.stringify(f,null,o)},getWorkingText({indent:o=2}={}){return f!==null||b?this.getResultText({indent:o}):this.getSourceText({indent:o})},getSourcePreview({indent:o=2,limit:i=4e3}={}){return s===null&&!a?"":I(s,l,t,o,i)},getResultPreview({indent:o=2,limit:i=4e3}={}){return f===null&&!b?"":I(f,O,N,o,i)},getSourceValue(){return s},getResultValue(){return f},getState:J,dispose(){r&&r("json-op",{op:"clear",sessionId:$}).catch(()=>{})}}}const me=`{
  "status": "ok",
  "generatedAt": "2026-04-16T12:00:00.000Z",
  "items": [
    { "id": 1, "name": "North Dock", "enabled": true },
    { "id": 2, "name": "South Dock", "enabled": false }
  ]
}`,Y="json-suite";let A=null;function Ze(n){return De.find(r=>r.id===n)}function re(n){return String(n).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}function Xe(){return`
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group" id="json-mode-tabs">
            <button type="button" class="btn-secondary json-mode-tab" data-mode="format">Format</button>
            <button type="button" class="btn-secondary json-mode-tab" data-mode="query">Query</button>
            <button type="button" class="btn-secondary json-mode-tab" data-mode="patch">Patch</button>
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <input id="json-file-input" type="file" accept=".json,application/json" class="hidden">
            <button id="json-load" class="btn-secondary">Import</button>
            <button id="json-sample" class="btn-secondary">Sample</button>
            <button id="json-reset" class="btn-secondary">Reset</button>
          </div>
        </div>
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <label class="studio-field">
              <span>Indent</span>
              <select id="json-indent">
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </select>
            </label>
            <label class="studio-field">
              <span>Large Threshold KB</span>
              <input id="json-large-threshold" type="number" min="64" step="64">
            </label>
            <div class="studio-field json-memory-mode-field">
              <span>Memory Mode</span>
              <label class="json-checkbox-row">
                <input id="json-auto-large" type="checkbox">
                <span>Auto for large documents</span>
              </label>
            </div>
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <button id="json-copy-source" class="btn-secondary">Copy Source</button>
            <button id="json-copy-result" class="btn-secondary">Copy Result</button>
            <button id="json-commit-result" class="btn-secondary">Use Result As Source</button>
            <button id="json-download" class="btn-secondary">Download</button>
          </div>
        </div>
        <div id="json-query-row" class="studio-toolbar hidden">
          <div class="studio-toolbar-group json-wide-toolbar-group">
            <label class="studio-field studio-field-wide json-flex-1">
              <span>JSONPath</span>
              <input id="json-query" type="text" placeholder="$.items[*].id">
            </label>
            <button id="json-query-run" class="btn-secondary">Run Query</button>
          </div>
        </div>
        <div id="json-patch-row" class="studio-toolbar hidden">
          <div class="studio-toolbar-group json-wide-toolbar-group json-stretch-toolbar-group">
            <label class="studio-field studio-field-wide json-flex-1">
              <span>JSON Pointer</span>
              <input id="json-pointer" type="text" placeholder="/items/0/name">
            </label>
            <label class="studio-field studio-field-wide json-flex-2">
              <span>Set Value</span>
              <textarea id="json-pointer-value" class="json-pointer-value" placeholder="{&quot;next&quot;:true}"></textarea>
            </label>
            <button id="json-pointer-set" class="btn-secondary">Set Path</button>
            <button id="json-pointer-delete" class="btn-secondary">Delete Path</button>
          </div>
        </div>
        <div id="json-memory-banner" class="hidden json-memory-banner">
          <div>
            <div class="json-memory-title">Large document in memory mode</div>
            <div id="json-memory-copy" class="json-memory-copy"></div>
          </div>
          <button id="json-open-editor" class="btn-secondary">Open In Editor</button>
        </div>
        <div id="json-editor-grid" class="studio-panel-grid studio-panel-grid-dual">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Source</h3>
            </div>
            <div id="json-input-editor" class="studio-editor"></div>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Result</h3>
            </div>
            <div id="json-output-editor" class="studio-editor"></div>
          </section>
        </div>
        <div id="json-memory-grid" class="studio-panel-grid studio-panel-grid-dual hidden">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Source Summary</h3>
            </div>
            <div id="json-source-summary" class="json-summary-list"></div>
            <pre id="json-source-preview" class="json-preview-block"></pre>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Working Summary</h3>
            </div>
            <div id="json-result-summary" class="json-summary-list"></div>
            <pre id="json-result-preview" class="json-preview-block"></pre>
            <div id="json-op-log" class="json-op-log"></div>
          </section>
        </div>
        <div class="studio-actions">
          <button id="json-format">Format</button>
          <button id="json-minify" class="btn-secondary">Minify</button>
          <button id="json-validate" class="btn-secondary">Validate</button>
        </div>
      </section>
    </div>
  `}function ye(n,r){return n?[["Kind",n.kind],["Nodes",n.nodes],["Depth",n.depth],["Entries",n.entries],["Bytes",new Intl.NumberFormat().format(r||0)]].map(([p,l])=>`
    <div class="json-summary-row">
      <span class="json-summary-label">${p}</span>
      <strong>${re(l)}</strong>
    </div>
  `).join(""):'<div class="json-empty-note">No document loaded.</div>'}async function rt(n,r){var ue,le;const s=Ze(Y),p=Ae(r),l=r==="json-formatter"||r==="json-quick-format"?"format":"query",t=_e(n,{className:"json-studio-shell",eyebrow:p.title,title:s.title,description:"Format, validate, query, patch, and export JSON from one workspace. Large imports stay in memory mode by default.",toolIds:[Y],activeToolId:Y,metrics:[{key:"views",label:"Views",value:"1"},{key:"query",label:"Mode",value:l==="query"?"Query":"Format"}]});t.content.innerHTML=Xe();const a=Fe(Ie,Y,{input:me,output:"",indent:"2",query:"",mode:l,autoLargeMode:!0,largeThresholdKb:512,pointer:"",pointerValue:"true"}),y=a.getSnapshot(),f=Number(y.largeThresholdKb)*1024,T=y.input||"",O=(ue=y.output)!=null&&ue.trim()?y.output:"",N=!!y.autoLargeMode&&[T,O].some(e=>e&&new Blob([e]).size>=f),b=typeof Worker=="function"?ce.run.bind(ce):null,u=Ge({thresholdBytes:f,runWorkerTask:b}),x=t.content.querySelector("#json-input-editor"),$=t.content.querySelector("#json-output-editor"),V=t.content.querySelector("#json-file-input"),m=t.content.querySelector("#json-indent"),I=t.content.querySelector("#json-query"),J=[...t.content.querySelectorAll(".json-mode-tab")],j=t.content.querySelector("#json-large-threshold"),M=t.content.querySelector("#json-auto-large"),o=t.content.querySelector("#json-pointer"),i=t.content.querySelector("#json-pointer-value"),w=t.content.querySelector("#json-memory-banner"),S=t.content.querySelector("#json-memory-copy"),L=t.content.querySelector("#json-memory-grid"),ee=t.content.querySelector("#json-editor-grid"),ge=t.content.querySelector("#json-source-summary"),he=t.content.querySelector("#json-result-summary"),be=t.content.querySelector("#json-source-preview"),Se=t.content.querySelector("#json-result-preview"),ve=t.content.querySelector("#json-op-log"),je=t.content.querySelector("#json-query-row"),we=t.content.querySelector("#json-patch-row");m.value=y.indent,I.value=y.query,j.value=String(y.largeThresholdKb),M.checked=!!y.autoLargeMode,o.value=y.pointer,i.value=y.pointerValue;const Ne=await de(x,{value:N?"":y.input,language:"json"}),qe=await de($,{value:N?"":y.output,language:"json",readOnly:!0}),k=Ne.editor,F=qe.editor,g=[];let D=y.mode||l,C="editor",H=!1;const q=()=>{a.save({indent:m.value,query:I.value,mode:D,autoLargeMode:M.checked,largeThresholdKb:Number(j.value),pointer:o.value,pointerValue:i.value})},c=(e,d="neutral")=>{t.setStatus(e,d)};function K(e){E(y.input,y.output),c(`Restore failed: ${(e==null?void 0:e.message)||"Could not restore saved JSON."}`,"danger")}const te=()=>{J.forEach(e=>{e.classList.toggle("is-active",e.dataset.mode===D)}),je.classList.toggle("hidden",D!=="query"),we.classList.toggle("hidden",D!=="patch"),t.setMetric("query",D==="patch"?"Patch":D==="query"?"Query":"Format")},oe=()=>{const e=u.getState(),d=e.resultSummary||e.sourceSummary,v=e.resultBytes||e.sourceBytes,B=e.operationLog.length?e.operationLog.map(G=>`
          <div class="json-op-log-row">
            <span class="json-op-kind">${re(G.kind)}</span>
            <span class="json-op-at">${re(G.at)}</span>
          </div>
        `).join(""):'<div class="json-empty-note">No operations yet.</div>';ge.innerHTML=ye(e.sourceSummary,e.sourceBytes),he.innerHTML=ye(d,v),be.textContent=u.getSourcePreview({indent:Number(m.value)})||"Source preview unavailable.",Se.textContent=u.getResultPreview({indent:Number(m.value)})||u.getSourcePreview({indent:Number(m.value)})||"Working preview unavailable.",ve.innerHTML=B,S.textContent=`Threshold ${j.value} KB. The document stays as parsed JSON until you explicitly open it in the editor.`},P=e=>{C=e;const d=e==="memory";w.classList.toggle("hidden",!d),L.classList.toggle("hidden",!d),ee.classList.toggle("hidden",d),d&&oe()},E=(e="",d="")=>{H=!0,k.setValue(e),F.setValue(d),H=!1},Oe=()=>{const e=k.getValue();if(!e.trim())throw new Error("Paste or import JSON first.");return u.setThresholdBytes(Number(j.value)*1024),u.load(e)},ne=()=>{if(C==="memory"){oe();return}return R(u.getResultText({indent:Number(m.value)}),e=>{E(k.getValue(),e)})},z=(e,d)=>M.checked&&(e.sourceLarge||e.resultLarge)?(P("memory"),c(d,"success"),!0):!1,se=(e,d)=>(u.setThresholdBytes(Number(j.value)*1024),R(u.load(e),v=>{if(z(v,d)){E("",""),a.save({input:"",output:""},{immediate:!0});return}P("editor"),E(e,""),a.save({input:e,output:""}),c(d,"success")})),U=()=>(u.setThresholdBytes(Number(j.value)*1024),C==="memory"&&u.getSourceValue()!==null||C==="memory"?u.getState():Oe()),ae=async(e=!1)=>{try{await U();const d=e?await u.minify():await u.format(Number(m.value));if(z(d,e?"JSON minified in memory mode.":"JSON formatted in memory mode.")){q();return}P("editor"),await ne(),c(e?"JSON minified.":"JSON formatted.","success"),q()}catch(d){c(d.message,"danger")}},xe=async()=>{try{await U(),u.validate(),c("JSON is valid.","success"),q()}catch(e){c(e.message,"danger")}},Je=async()=>{const e=I.value.trim();if(!e){c("Enter a JSONPath query.","danger");return}try{await U();const d=await u.runQuery(e,async(v,B)=>{const{JSONPath:G}=await Ce(async()=>{const{JSONPath:Me}=await import("https://esm.sh/jsonpath-plus@7.2.0");return{JSONPath:Me}},[]);return G({path:B,json:v})},Number(m.value));if(z(d,"Query completed in memory mode.")){q();return}P("editor"),await ne(),c("Query completed.","success"),q()}catch(d){c(d.message,"danger")}},ie=e=>{const d=o.value.trim();if(!d){c("Enter a JSON Pointer path.","danger");return}try{return R(U(),()=>R(e==="set"?u.setAtPointer(d,i.value,Number(m.value)):u.deleteAtPointer(d,Number(m.value)),v=>{if(z(v,e==="set"?"Path updated in memory mode.":"Path deleted in memory mode.")){q();return}return P("editor"),R(ne(),()=>{c(e==="set"?"Path updated.":"Path deleted.","success"),q()})},v=>{c(v.message,"danger")}),v=>{c(v.message,"danger")})}catch(v){c(v.message,"danger")}},Le=async()=>{try{const e=C==="memory"?await u.getDownloadText({indent:Number(m.value)}):F.getValue()||k.getValue();if(!e.trim()){c("Nothing to download yet.","danger");return}$e(e,"json-result.json","application/json"),c("JSON downloaded.","success")}catch(e){c(e.message,"danger")}},Pe=()=>{try{return R(u.commitResult(Number(m.value)),e=>{if(M.checked&&e.sourceLarge){P("memory"),E("",""),a.save({input:"",output:""},{immediate:!0}),c("Result promoted to source.","success");return}return P("editor"),R(u.getSourceText({indent:Number(m.value)}),d=>{E(d,""),a.save({input:k.getValue(),output:""},{immediate:!0}),c("Result promoted to source.","success")},d=>{c(d.message,"danger")})},e=>{c(e.message,"danger")})}catch(e){c(e.message,"danger")}},Te=async()=>{try{const e=C==="memory"?await u.getSourceText({indent:Number(m.value)}):k.getValue();if(!e.trim()){c("Nothing to copy yet.","danger");return}await pe(e),c("Source copied.","success")}catch(e){c(e.message,"danger")}},Ee=async()=>{try{const e=C==="memory"?await u.getDownloadText({indent:Number(m.value)}):F.getValue()||k.getValue();if(!e.trim()){c("Nothing to copy yet.","danger");return}await pe(e),c("Result copied.","success")}catch(e){c(e.message,"danger")}},Re=()=>{try{return R(u.getDownloadText({indent:Number(m.value)}),e=>{P("editor"),E(e,""),a.save({input:e,output:""},{immediate:!0}),u.clearResult(),c("Working document opened in the editor.","neutral")},e=>{c(e.message,"danger")})}catch(e){c(e.message,"danger")}};g.push(h(t.content.querySelector("#json-format"),"click",()=>ae(!1))),g.push(h(t.content.querySelector("#json-minify"),"click",()=>ae(!0))),g.push(h(t.content.querySelector("#json-validate"),"click",xe)),g.push(h(t.content.querySelector("#json-query-run"),"click",Je)),g.push(h(t.content.querySelector("#json-pointer-set"),"click",()=>ie("set"))),g.push(h(t.content.querySelector("#json-pointer-delete"),"click",()=>ie("delete"))),g.push(h(t.content.querySelector("#json-load"),"click",()=>V.click())),g.push(h(t.content.querySelector("#json-sample"),"click",async()=>{P("editor"),u.clearResult(),await se(me,"Sample loaded.")})),g.push(h(t.content.querySelector("#json-reset"),"click",()=>{P("editor"),u.clearResult(),E("",""),V&&(V.value=""),a.save({input:"",output:"",query:"",pointer:"",pointerValue:"true",mode:"format"},{immediate:!0}),I.value="",o.value="",i.value="true",D="format",te(),c("Editors cleared.","neutral")})),g.push(h(t.content.querySelector("#json-download"),"click",Le)),g.push(h(t.content.querySelector("#json-copy-source"),"click",Te)),g.push(h(t.content.querySelector("#json-copy-result"),"click",Ee)),g.push(h(t.content.querySelector("#json-commit-result"),"click",Pe)),g.push(h(t.content.querySelector("#json-open-editor"),"click",Re)),g.push(h(V,"change",async e=>{var v;const d=(v=e.target.files)==null?void 0:v[0];if(d)try{const B=await d.text();await se(B,`${d.name} loaded.`)}catch(B){Be(B.message,"danger"),c("Import failed.","danger")}})),g.push(h(m,"change",q)),g.push(h(I,"input",q)),g.push(h(o,"input",q)),g.push(h(i,"input",q)),g.push(h(j,"change",()=>{u.setThresholdBytes(Number(j.value)*1024),oe(),q()})),g.push(h(M,"change",q)),g.push(()=>u.dispose()),J.forEach(e=>{g.push(h(e,"click",()=>{D=e.dataset.mode,te(),q()}))});const Ve=k.onDidChangeModelContent(()=>{H||(u.clearResult(),a.save({input:k.getValue(),output:""}))}),ke=F.onDidChangeModelContent(()=>{H||a.save({output:F.getValue()})});if(g.push(()=>Ve.dispose()),g.push(()=>ke.dispose()),te(),(le=y.input)!=null&&le.trim())try{u.setThresholdBytes(Number(j.value)*1024),R(u.restore({sourceText:y.input,resultText:y.output,indent:Number(m.value)}),e=>{if(M.checked&&(e.sourceLarge||e.resultLarge)){P("memory"),E("",""),c("JSON restored.","success");return}P("editor"),R(u.getSourceText({indent:Number(m.value)}),d=>R(u.getResultText({indent:Number(m.value)}),v=>{E(d,v),c("JSON restored.","success")},K),K)},K)}catch(e){K(e)}else E("",""),c(r==="json-formatter"||r==="json-quick-format"?"JSON format view. Full studio features stay available.":"Ready.","neutral");A={root:t.root,cleanup:g,inputEditor:k,outputEditor:F,persistedState:a}}function st(){var n,r,s,p,l;if(A){(n=A.persistedState)==null||n.flush().catch(()=>{}),(r=A.persistedState)==null||r.dispose();for(const t of A.cleanup)t();(s=A.inputEditor)==null||s.dispose(),(p=A.outputEditor)==null||p.dispose(),(l=A.root)==null||l.remove(),A=null}}function h(n,r,s){return n?(n.addEventListener(r,s),()=>n.removeEventListener(r,s)):()=>{}}function R(n,r,s=p=>{throw p}){try{return n&&typeof n.then=="function"?n.then(r).catch(s):r(n)}catch(p){return s(p)}}export{rt as m,st as u};
