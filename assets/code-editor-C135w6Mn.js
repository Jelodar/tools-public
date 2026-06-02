import{c as J,d as ae}from"./ui-utils-CG6aKAAj.js";import{a as se,c as re}from"./ui-monaco-CRF4nTOZ.js";import{a as K,c as le}from"./ai-session-CWcDNJHJ.js";import{r as ce}from"./shortcuts-Ce4UhY-H.js";import{_ as k,d as de,g as ue}from"./index-C4lglzE7.js";import{c as R}from"./modal-DKefIaRW.js";import{c as pe}from"./tool-state-B_5q_c8d.js";async function me(s,r={}){const{parser:l="html",tabWidth:h=2}=r,p=await k(()=>import("https://esm.sh/prettier@3.0.3/standalone"),[]),c=await k(()=>import("https://esm.sh/prettier@3.0.3/plugins/html"),[]),e=await k(()=>import("https://esm.sh/prettier@3.0.3/plugins/postcss"),[]),v=await k(()=>import("https://esm.sh/prettier@3.0.3/plugins/babel"),[]),d=await k(()=>import("https://esm.sh/prettier@3.0.3/plugins/estree"),[]);return p.format(s,{parser:l,plugins:[c.default,e.default,v.default,d.default],tabWidth:Number(h)})}async function ge(s,r={}){const{dialect:l="sql",indent:h=2,uppercase:p=!0}=r,{format:c}=await k(async()=>{const{format:e}=await import("https://esm.sh/sql-formatter@12.2.4");return{format:e}},[]);return c(s,{language:l,indent:" ".repeat(Number(h)),uppercase:p})}async function ve(s,r={}){const{mangle:l=!0,compress:h=!0,module:p=!1}=r,{minify:c}=await k(async()=>{const{minify:v}=await import("https://esm.sh/terser@5.30.0");return{minify:v}},[]);return(await c(s,{mangle:l,compress:h,module:p,ecma:2020})).code||""}async function fe(s,r={}){const{preset:l="default",strings:h=!0,compact:p=!0,deadCode:c=!1}=r,e=await k(()=>import("https://esm.sh/javascript-obfuscator@4.1.0"),[]),v=e.default||e,d={compact:p,stringArray:h,deadCodeInjection:c,deadCodeInjectionThreshold:.4,identifierNamesGenerator:"hexadecimal",renameGlobals:l==="high",controlFlowFlattening:l!=="low",controlFlowFlatteningThreshold:.75,numbersToExpressions:!0,simplify:!0,splitStrings:l==="high",unicodeEscapeSequence:!1};return v.obfuscate(s,d).getObfuscatedCode()}let n=null,u=null,S=null,f=null,C=!1,E=!1,g=null,x=null,b=null,$=null,T=null,q=null,I=null,A=null,w="editor",z="chat",P=[];const be=["javascript","typescript","python","rust","go","sql","html","css"],H={code:`function hello() {
  return "ready";
}`,language:"javascript",aiModel:"code-fast",aiTemp:.2,aiMaxTokens:1024,systemPrompt:"You are a Senior Staff Engineer. Output only code or technical logic without conversational filler. Use <think> tags if reasoning."};function N(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function he(s){return String(s??"").replace(/\s+/g," ").trim()}function ye(s){return btoa(unescape(encodeURIComponent(String(s??""))))}function Se(s){return decodeURIComponent(escape(atob(String(s??""))))}function Ce({language:s,linePrefix:r,lineSuffix:l}){const h=String(r??"");if(String(l??"").trim())return"";const p=h.trimEnd(),c=String(s||"").toLowerCase();return p?(c==="javascript"||c==="typescript")&&/(?:^|\s)console\.$/.test(p)?"log()":(c==="javascript"||c==="typescript")&&/\bawait\s+$/.test(h)?"Promise.all([])":(c==="javascript"||c==="typescript")&&/\b(if|while)\s*\([^)]*$/.test(p)?`) {
  
}`:(c==="javascript"||c==="typescript")&&/\bfor\s*\([^)]*$/.test(p)?`const item of items) {
  
}`:c==="python"&&/^\s*def\s+\w+\([^)]*$/.test(p)?`):
    pass`:c==="python"&&/^\s*(if|elif|for|while|with|class)\b.*[^:]$/.test(p)?`:
    pass`:c==="rust"&&/\bfn\s+\w+\([^)]*$/.test(p)?`) {
    
}`:c==="go"&&/\bfunc\s+\w+\([^)]*$/.test(p)?`) {
	
}`:c==="sql"&&/^select$/i.test(p)?` *
from `:c==="html"&&/<$/.test(p)?"div></div>":c==="css"&&/display:\s*$/i.test(p)?"flex;":"":""}function L(s,r={}){if(!(s!=null&&s.consoleLog))return;const l=document.createElement("div"),h=Number(r.promptChars||0),p=Number(r.tokenCount||0),c=r.modelId||g||"not loaded",e=[["request",r.requestId],["model",c],["prompt chars",h||""],["tokens",p||""],["detail",r.detail],["params",r.params?he(JSON.stringify(r.params)):""]].filter(([,v])=>v!=null&&v!=="");l.className="console-entry",l.innerHTML=`
    <div class="console-entry-head">
      <span class="time">[${new Date().toLocaleTimeString()}]</span>
      <span class="type">${N(r.type||"event")}</span>
    </div>
    ${e.map(([v,d])=>`<div class="console-entry-row"><span>${N(v)}</span><b>${N(d)}</b></div>`).join("")}
  `,s.consoleLog.appendChild(l),s.consoleLog.scrollTop=s.consoleLog.scrollHeight}async function Me(s,r={}){var W;A=pe(ue,"code-editor",H,{debounceMs:120});const l={...H,...A.getSnapshot()};w=["format","optimize"].includes(r.mode)?r.mode:"editor",n=document.createElement("div"),n.className="tool-code-studio",n.innerHTML=`
    <div class="studio-layout">
      <div class="studio-main">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <select id="studio-lang" class="studio-select">
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="sql">SQL</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            <div class="studio-divider"></div>
            <button class="btn-secondary studio-modal-tool" data-open-studio-modal="format">Format</button>
            <button class="btn-secondary studio-modal-tool" data-open-studio-modal="optimize">Optimize</button>
            <button class="btn-secondary studio-modal-tool" id="btn-studio-settings" data-open-studio-modal="engine">Engine</button>
          </div>
          <div class="studio-toolbar-group">
            <span id="ai-activity-pill" class="ai-activity-pill" data-busy="false" data-tone="neutral">
              <span class="ai-activity-dot"></span>
              <span id="ai-activity-text">Engine idle</span>
            </span>
            <button id="btn-studio-complete" class="btn-secondary">Complete</button>
            <button id="btn-studio-accept" class="btn-primary hidden">Accept Changes</button>
            <button id="btn-studio-discard" class="btn-secondary hidden">Discard</button>
            <button id="btn-studio-copy" class="btn-secondary">Copy</button>
            <button id="btn-studio-export" class="btn-secondary">Export</button>
          </div>
        </div>

        <div class="studio-workspace">
          <div id="ai-progress-host" class="studio-progress"></div>
          <div id="ai-thinking-zone" class="studio-thinking hidden"></div>
          
          <div id="editor-container" class="studio-editor-host"></div>
          <div id="diff-container" class="studio-editor-host hidden"></div>
        </div>

        <div class="studio-footer">
          <div class="studio-footer-left">
            <span id="studio-status">Ready.</span>
          </div>
          <div class="studio-footer-right">
            <span id="ai-engine-status" class="engine-tag">ENGINE: OFFLINE</span>
          </div>
        </div>
      </div>

      <div class="studio-inspector">
        <div class="inspector-tabs">
          <button class="inspector-tab active" data-tab="chat">AI Assistant</button>
          <button class="inspector-tab" data-tab="console">Console</button>
        </div>
        
        <div id="inspector-chat" class="inspector-content">
          <div id="chat-history" class="chat-history">
            <div class="chat-placeholder">
              <strong>Context-Aware Synthesis</strong>
              <p>Ask for refactors, logic fixes, or structural improvements.</p>
            </div>
          </div>
          <div class="chat-input-shell">
            <textarea id="chat-input" placeholder="How can I help with this code?"></textarea>
            <button id="btn-chat-send">Generate</button>
          </div>
        </div>

        <div id="inspector-console" class="inspector-content hidden">
          <div id="ai-console-log" class="console-log"></div>
          <button id="btn-clear-console" class="btn-secondary console-clear">Clear Log</button>
        </div>
      </div>

      <div id="studio-format-overlay" class="studio-overlay hidden">
        <div class="overlay-card code-tool-modal-card">
          <div class="overlay-head">
            <h3>Format</h3>
            <button class="btn-close-overlay">×</button>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label>Parser</label>
              <select id="fmt-parser" class="studio-select">
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="babel">JS/Babel</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <div class="form-group">
              <label>Indent</label>
              <select id="fmt-indent" class="studio-select">
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
              </select>
            </div>
          </div>
          <div class="overlay-actions">
            <button id="btn-format-apply">Format Code</button>
          </div>
        </div>
      </div>

      <div id="studio-optimize-overlay" class="studio-overlay hidden">
        <div class="overlay-card code-tool-modal-card">
          <div class="overlay-head">
            <h3>Optimize</h3>
            <button class="btn-close-overlay">×</button>
          </div>
          <div class="settings-grid">
            <label class="studio-toggle"><input type="checkbox" id="opt-mangle" checked> Mangle</label>
            <label class="studio-toggle"><input type="checkbox" id="opt-compress" checked> Compress</label>
            <label class="studio-toggle"><input type="checkbox" id="opt-obfuscate"> Obfuscate</label>
          </div>
          <div class="overlay-actions">
            <button id="btn-optimize-apply">Apply</button>
          </div>
        </div>
      </div>

      <div id="studio-settings-overlay" class="studio-overlay hidden">
        <div class="overlay-card">
          <div class="overlay-head">
            <h3>Engine Configuration</h3>
            <button class="btn-close-overlay">×</button>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label>Model Tier</label>
              <select id="ai-group-select">
                <option value="code-fast">Fast Autocomplete (FIM)</option>
                <option value="code-heavy">Logic Synthesis (DeepSeek-R1)</option>
                <option value="gemma-compact">Gemma 3 1B</option>
                <option value="gemma-edge">Gemma 4 E2B Q2</option>
              </select>
            </div>
            <div class="form-group">
              <label>Temperature (${l.aiTemp})</label>
              <input type="range" id="ai-temp" min="0" max="1" step="0.1" value="${l.aiTemp}">
            </div>
            <div class="form-group">
              <label>Max Tokens</label>
              <input type="number" id="ai-max-tokens" value="${l.aiMaxTokens}">
            </div>
            <div class="form-group">
              <label>System Role</label>
              <textarea id="ai-system-prompt" class="code-ai-system-prompt">${l.systemPrompt}</textarea>
            </div>
          </div>
          <div class="overlay-actions">
             <button id="btn-ai-activate">Save & Activate</button>
          </div>
        </div>
      </div>
    </div>
  `,s.appendChild(n);const{editor:h,monaco:p}=await se(n.querySelector("#editor-container"),{value:l.code,language:l.language});u=h,S=p,$=(await re(n.querySelector("#diff-container"))).diffEditor;const e={lang:n.querySelector("#studio-lang"),status:n.querySelector("#studio-status"),engineStatus:n.querySelector("#ai-engine-status"),activityPill:n.querySelector("#ai-activity-pill"),activityText:n.querySelector("#ai-activity-text"),progressHost:n.querySelector("#ai-progress-host"),thinkingZone:n.querySelector("#ai-thinking-zone"),chatHistory:n.querySelector("#chat-history"),chatInput:n.querySelector("#chat-input"),consoleLog:n.querySelector("#ai-console-log"),settingsOverlay:n.querySelector("#studio-settings-overlay"),formatOverlay:n.querySelector("#studio-format-overlay"),optimizeOverlay:n.querySelector("#studio-optimize-overlay"),aiGroupSelect:n.querySelector("#ai-group-select"),aiTemp:n.querySelector("#ai-temp"),aiMaxTokens:n.querySelector("#ai-max-tokens"),aiSystemPrompt:n.querySelector("#ai-system-prompt"),editorContainer:n.querySelector("#editor-container"),diffContainer:n.querySelector("#diff-container"),fmtParser:n.querySelector("#fmt-parser"),fmtIndent:n.querySelector("#fmt-indent"),optMangle:n.querySelector("#opt-mangle"),optCompress:n.querySelector("#opt-compress"),optObfuscate:n.querySelector("#opt-obfuscate"),btnAccept:n.querySelector("#btn-studio-accept"),btnDiscard:n.querySelector("#btn-studio-discard"),btnFormatApply:n.querySelector("#btn-format-apply"),btnOptimizeApply:n.querySelector("#btn-optimize-apply"),btnComplete:n.querySelector("#btn-studio-complete"),btnChatSend:n.querySelector("#btn-chat-send"),btnStudioCopy:n.querySelector("#btn-studio-copy"),btnStudioExport:n.querySelector("#btn-studio-export"),btnAiActivate:n.querySelector("#btn-ai-activate")};T=R(e.settingsOverlay,{closeSelectors:[".btn-close-overlay"]}),q=R(e.formatOverlay,{closeSelectors:[".btn-close-overlay"]}),I=R(e.optimizeOverlay,{closeSelectors:[".btn-close-overlay"]}),e.lang.value=l.language,e.aiGroupSelect.value=l.aiModel,e.aiTemp.value=String(l.aiTemp),e.aiMaxTokens.value=String(l.aiMaxTokens),e.aiSystemPrompt.value=l.systemPrompt,r.formatParser&&(e.fmtParser.value=r.formatParser),r.optimizeObfuscate&&(e.optObfuscate.checked=!0),b=de(e.progressHost,{stopLabel:"Abort",onStop(){f==null||f.stop()}});const v=t=>{A.save(t).catch(()=>{})};(W=u.onDidChangeModelContent)==null||W.call(u,()=>{v({code:u.getValue()})});const d=(t,o="neutral")=>{e.status.textContent=t,e.status.dataset.tone=o},y=(t,{busy:o=!1,tone:i="neutral"}={})=>{e.activityText.textContent=t,e.activityPill.dataset.busy=o?"true":"false",e.activityPill.dataset.tone=i,e.btnComplete.classList.toggle("is-busy",o&&C),e.btnChatSend.classList.toggle("is-busy",o&&C),e.btnAiActivate.classList.toggle("is-busy",o&&E),e.btnComplete.disabled=!!(C||E),e.btnChatSend.disabled=!!(C||E),e.btnAiActivate.disabled=!!E},F=t=>{var o;L(e,{type:t.isRaw?"raw request":"request",requestId:t.requestId,modelId:g||e.aiGroupSelect.value,promptChars:((o=t.prompt)==null?void 0:o.length)||0,params:t.params})},Q=()=>{f||(f=le(),f.subscribe(({type:t,payload:o})=>{t==="progress"?(b.update({title:"Loading Engine...",progress:o.progress,busy:!0}),d(`Loading model ${Math.round(Number(o.progress||0))}%`,"info"),y(`Loading ${g||e.aiGroupSelect.value}: ${Math.round(Number(o.progress||0))}%`,{busy:!0,tone:"info"}),L(e,{type:"load progress",requestId:"engine",modelId:g||e.aiGroupSelect.value,detail:`${Math.round(Number(o.progress||0))}%`})):t==="status"&&o.status==="ready"?(e.engineStatus.textContent="ENGINE: READY",E=!1,d("Engine ready.","success"),y(`${g||e.aiGroupSelect.value} ready`,{tone:"success"}),b.update({title:"Engine ready",tone:"success",autoResetMs:1800}),L(e,{type:"engine ready",requestId:"engine",modelId:g||e.aiGroupSelect.value})):t==="status"&&o.status==="aborted"?(C=!1,E=!1,d("Stopped.","neutral"),y("Stopped",{tone:"neutral"}),b.update({title:"Stopped",autoResetMs:900}),L(e,{type:"stopped",requestId:"engine",modelId:g||e.aiGroupSelect.value})):t==="thinking"?o.state==="start"&&(e.thinkingZone.classList.remove("hidden"),e.thinkingZone.textContent="",L(e,{type:"thinking",requestId:"reasoning",modelId:g||e.aiGroupSelect.value,detail:"started"})):t==="thinking-token"?(e.thinkingZone.textContent+=o.text,e.thinkingZone.scrollTop=e.thinkingZone.scrollHeight):t==="stream"?Y(o):t==="complete"?X(o.result,o.requestId):t==="error"&&(C=!1,E=!1,d(o.message||"Engine error.","danger"),y("Engine error",{tone:"danger"}),b.update({title:"Engine error",detail:o.message,tone:"danger"}),L(e,{type:"error",requestId:o.requestId||"engine",modelId:g||e.aiGroupSelect.value,detail:o.message}))}))};let _=null,M="";const Y=({text:t,requestId:o})=>{if(o==="chat"&&_){_.innerHTML=V(t),e.chatHistory.scrollTop=e.chatHistory.scrollHeight,d(`Assistant streaming ${String(t||"").length} chars`,"info"),y(`Chat ${String(t||"").length} chars`,{busy:!0,tone:"info"}),b.update({title:"Generating reply",detail:`${String(t||"").length} chars received`,busy:!0,cancellable:!0});return}if(o==="autocomplete"){const i=t.slice(M.length);if(i){const a=u.getPosition();u.executeEdits("ai",[{range:new S.Range(a.lineNumber,a.column,a.lineNumber,a.column),text:i,forceMoveMarkers:!0}]),M+=i,d(`Autocomplete streaming ${M.length} chars`,"info"),y(`Autocomplete ${M.length} chars`,{busy:!0,tone:"info"}),b.update({title:"Autocomplete running",detail:`${M.length} chars inserted`,busy:!0,cancellable:!0})}}t&&L(e,{type:"stream",requestId:o,modelId:g||e.aiGroupSelect.value,tokenCount:String(t).split(/\s+/).filter(Boolean).length})},X=(t,o)=>{C=!1,e.thinkingZone.classList.add("hidden"),b.update({title:"Complete",tone:"success",autoResetMs:1600}),y(`${g||e.aiGroupSelect.value} complete`,{tone:"success"}),o==="chat"&&_&&(_.innerHTML=V(t),d("Reply complete.","success")),o==="autocomplete"&&(d("Completion inserted.","success"),setTimeout(()=>{var a,m;const i=(a=u.getAction)==null?void 0:a.call(u,"editor.action.formatDocument");(m=i==null?void 0:i.run)==null||m.call(i)},100)),L(e,{type:"complete",requestId:o,modelId:g||e.aiGroupSelect.value,tokenCount:String(t||"").split(/\s+/).filter(Boolean).length,detail:`${String(t||"").length} chars`})},V=t=>N(t).replace(/```([a-z]*)\n([\s\S]*?)```/gi,(i,a,m)=>`
      <div class="chat-code-block">
        <div class="chat-code-head"><span>${a||"code"}</span> <button data-code="${ye(m)}">Copy</button></div>
        <pre><code>${m}</code></pre>
      </div>
    `).replace(/\n/g,"<br>"),G=async t=>{if(g===t&&!E)return!0;E=!0;const i=(K[t]||K[H.aiModel]).primary;d(`Loading ${t}...`,"info"),y(`Loading ${t}`,{busy:!0,tone:"info"}),b.update({title:"Initializing Engine...",detail:i.id,busy:!0}),L(e,{type:"load request",requestId:"engine",modelId:i.id,detail:i.url});try{return await f.loadModel(i.url),g=t,!0}catch(a){return E=!1,d((a==null?void 0:a.message)||"Model load failed.","danger"),y("Load failed",{tone:"danger"}),L(e,{type:"load failed",requestId:"engine",modelId:i.id,detail:(a==null?void 0:a.message)||"Model load failed"}),!1}},j=async()=>{const t=e.chatInput.value.trim();if(!t||C||(d("Preparing assistant...","info"),!await G(e.aiGroupSelect.value||"code-heavy")))return;e.chatInput.value="",C=!0,d("Generating reply...","info"),y(`Chat running on ${e.aiGroupSelect.value}`,{busy:!0,tone:"info"}),b.update({title:"Generating reply",detail:e.aiGroupSelect.value,busy:!0,cancellable:!0});const i=`CONTEXT CODE:
\`\`\`
${u.getValue()}
\`\`\`

USER REQUEST: ${t}`,a=document.createElement("div");a.className="chat-msg user",a.innerHTML=`<strong>You</strong><p>${N(t)}</p>`,e.chatHistory.appendChild(a);const m=document.createElement("div");m.className="chat-msg ai",m.innerHTML='<strong>Assistant</strong><div class="ai-content">...</div>',e.chatHistory.appendChild(m),_=m.querySelector(".ai-content"),e.chatHistory.scrollTop=e.chatHistory.scrollHeight;const O={requestId:"chat",prompt:i,params:{temp:parseFloat(e.aiTemp.value),n_predict:parseInt(e.aiMaxTokens.value),systemPrompt:e.aiSystemPrompt.value}};F(O),f.generate(O)},D=async()=>{if(C||(d("Preparing autocomplete...","info"),!await G("code-fast")))return;C=!0,M="",d("Autocomplete running...","info"),y("Autocomplete running on code-fast",{busy:!0,tone:"info"});const t=u.getModel(),o=u.getPosition(),i=t.getValueInRange({startLineNumber:1,startColumn:1,endLineNumber:o.lineNumber,endColumn:o.column}),a=t.getValueInRange({startLineNumber:o.lineNumber,startColumn:o.column,endLineNumber:t.getLineCount(),endColumn:1e3}),m={requestId:"autocomplete",isRaw:!0,prompt:`<|fim_prefix|>${i}<|fim_suffix|>${a}<|fim_middle|>`,params:{n_predict:64,temp:.1}};F(m),b.update({title:"Autocomplete running",detail:`${i.length} prefix chars, ${a.length} suffix chars`,busy:!0,cancellable:!0}),f.generate(m)},ee=()=>{var t;P.forEach(o=>{var i;return(i=o==null?void 0:o.dispose)==null?void 0:i.call(o)}),P=[],(t=S==null?void 0:S.languages)!=null&&t.registerInlineCompletionsProvider&&(P=be.map(o=>S.languages.registerInlineCompletionsProvider(o,{provideInlineCompletions(i,a){const m=a.lineNumber,O=typeof i.getLineMaxColumn=="function"?i.getLineMaxColumn(m):1e3,ne=i.getValueInRange({startLineNumber:m,startColumn:1,endLineNumber:m,endColumn:a.column}),ie=i.getValueInRange({startLineNumber:m,startColumn:a.column,endLineNumber:m,endColumn:O}),Z=Ce({language:o,linePrefix:ne,lineSuffix:ie});return Z?{items:[{insertText:Z,range:new S.Range(m,a.column,m,a.column)}]}:{items:[]}},freeInlineCompletions(){}})))},te=async()=>{const t=u.getValue();if(t.trim())try{w="format",q.close("apply"),d("Formatting...","info");const o=e.fmtParser.value,i=o==="sql"?await ge(t,{indent:e.fmtIndent.value}):await me(t,{parser:o==="javascript"?"babel":o,tabWidth:e.fmtIndent.value});i&&B(t,i)}catch(o){d(o.message,"danger")}},oe=async()=>{const t=u.getValue();if(t.trim())try{w="optimize",I.close("apply"),d("Optimizing...","info");const o=e.optObfuscate.checked?await fe(t,{compact:!0}):await ve(t,{mangle:e.optMangle.checked,compress:e.optCompress.checked});o&&B(t,o)}catch(o){d(o.message,"danger")}},B=(t,o)=>{const i=S.editor.createModel(t,e.lang.value),a=S.editor.createModel(o,e.lang.value);$.setModel({original:i,modified:a}),e.editorContainer.classList.add("hidden"),e.diffContainer.classList.remove("hidden"),e.btnAccept.classList.remove("hidden"),e.btnDiscard.classList.remove("hidden"),e.btnAccept.onclick=()=>{u.setValue(o),U()},e.btnDiscard.onclick=U},U=()=>{e.editorContainer.classList.remove("hidden"),e.diffContainer.classList.add("hidden"),e.btnAccept.classList.add("hidden"),e.btnDiscard.classList.add("hidden"),e.btnAccept.onclick=null,e.btnDiscard.onclick=null,d("Ready.","success")};n.querySelectorAll(".inspector-tab").forEach(t=>{t.onclick=()=>{z=t.dataset.tab,n.querySelectorAll(".inspector-tab").forEach(o=>o.classList.remove("active")),t.classList.add("active"),n.querySelectorAll(".inspector-content").forEach(o=>o.classList.add("hidden")),n.querySelector(`#inspector-${z}`).classList.remove("hidden")}}),n.querySelector('[data-open-studio-modal="format"]').onclick=()=>q.open("toolbar"),n.querySelector('[data-open-studio-modal="optimize"]').onclick=()=>I.open("toolbar"),n.querySelector('[data-open-studio-modal="engine"]').onclick=()=>T.open("toolbar"),e.btnFormatApply.onclick=te,e.btnOptimizeApply.onclick=oe,e.btnComplete.onclick=D,e.btnChatSend.onclick=j,e.chatInput.onkeydown=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),j())},n.querySelector("#btn-clear-console").onclick=()=>{e.consoleLog.textContent=""},e.chatHistory.addEventListener("click",t=>{var i,a;const o=(a=(i=t.target)==null?void 0:i.closest)==null?void 0:a.call(i,"[data-code]");o&&J(Se(o.dataset.code),"Code copied.")}),e.btnAiActivate.onclick=async()=>{const t=e.aiGroupSelect.value;v({aiModel:t,aiTemp:parseFloat(e.aiTemp.value),aiMaxTokens:parseInt(e.aiMaxTokens.value),systemPrompt:e.aiSystemPrompt.value}),T.close("activate"),await G(t)},e.lang.onchange=()=>{S.editor.setModelLanguage(u.getModel(),e.lang.value),v({language:e.lang.value})},e.btnStudioCopy.onclick=()=>J(u.getValue()),e.btnStudioExport.onclick=()=>ae(u.getValue(),`source.${e.lang.value}`),u.onKeyDown(t=>{if(t.keyCode===S.KeyCode.Tab&&g==="code-fast"){const o=u.getModel().getLineContent(u.getPosition().lineNumber).trim();(o.startsWith("//")||o.startsWith("#"))&&(t.preventDefault(),D())}}),x=ce([{key:"/",altKey:!0,allowInEditable:!0,handler:D},{key:"Escape",allowInEditable:!0,handler:()=>f==null?void 0:f.stop()}]),Q(),ee(),y("Engine idle"),w==="format"&&q.open("route"),w==="optimize"&&I.open("route")}function we(){x==null||x(),P.forEach(s=>{var r;return(r=s==null?void 0:s.dispose)==null?void 0:r.call(s)}),P=[],f&&f.dispose(),u&&u.dispose(),$&&$.dispose(),n&&n.remove(),T==null||T.destroy(),q==null||q.destroy(),I==null||I.destroy(),b==null||b.destroy(),A==null||A.dispose(),n=null,u=null,S=null,f=null,C=!1,E=!1,g=null,x=null,b=null,$=null,T=null,q=null,I=null,A=null,w="editor",z="chat"}export{Me as mount,we as unmount};
