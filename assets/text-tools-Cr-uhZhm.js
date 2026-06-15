import{c as C}from"./ui-monaco-Ud2Ogw0a.js";import{M as p,D as q,c as G}from"./ai-session-CFFiJM4b.js";import{d as j}from"./index-CoRJqXFF.js";import{b as U}from"./ai-generation-CBvcWf5u.js";let i=null,v=null,s=null,f=null,d=!1,m=!1,o=null;const n={temp:.1,top_p:.9,n_predict:512,systemPrompt:`RULES:
1. Fix ONLY grammar, spelling, and punctuation.
2. Change ZERO other words.
3. Keep the exact original formatting.
4. Output ONLY the fixed text.`},Y=["<|im_end|>","<|endoftext|>"];async function Q(g){i=document.createElement("div"),i.className="tool-text-ai";const r=Object.entries(p).filter(([e,t])=>t.tasks.includes("text")||t.tasks.includes("text-social")),T=q.text;i.innerHTML=`
    <div class="card rj-layout">
      <div class="text-ai-shell">
        <div class="text-ai-toolbar">
          <div class="tabs-header text-ai-tabs">
            <button class="tab-btn active" data-tab="refiner">Text Refiner</button>
            <button class="tab-btn" data-tab="chat">Chat</button>
            <button class="tab-btn" data-tab="console">Console</button>
          </div>
          <button id="btn-ai-setup" class="btn-secondary text-ai-setup-button">
            AI Engine
          </button>
        </div>

        <div id="ai-config-panel" class="hidden text-ai-config-panel">
          <div class="settings-grid">
            <div class="form-group">
              <label>Model</label>
              <select id="ai-model-select">
                ${r.map(([e,t])=>`<option value="${e}" ${e===T?"selected":""}>${t.id} (${t.size})</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Model Info</label>
              <div id="ai-model-info" class="text-ai-model-info"></div>
            </div>
          </div>

          <div class="text-ai-settings-divider">
            <div class="text-ai-settings-title">Inference Settings</div>
            <div class="settings-grid">
              <div class="form-group">
                <label>Temperature (${n.temp})</label>
                <input type="range" id="ai-temp" min="0" max="1" step="0.1" value="${n.temp}">
              </div>
              <div class="form-group">
                <label>Top-P (${n.top_p})</label>
                <input type="range" id="ai-top-p" min="0" max="1" step="0.05" value="${n.top_p}">
              </div>
              <div class="form-group">
                <label>Max Tokens</label>
                <input type="number" id="ai-max-tokens" value="${n.n_predict}">
              </div>
            </div>
            <div class="form-group text-ai-system-field">
              <label>System Role (Instruction)</label>
              <textarea id="ai-system-prompt" class="text-ai-system-prompt">${n.systemPrompt}</textarea>
            </div>
          </div>

          <div class="text-ai-config-actions">
            <button id="btn-ai-cancel" class="btn-secondary">Close</button>
            <button id="btn-ai-activate" class="text-ai-activate-button">Activate Engine</button>
          </div>
        </div>
      </div>

      <div id="ai-progress-host" class="text-ai-progress-host"></div>

      <div id="ai-thinking-zone" class="hidden text-ai-thinking-zone">
        <div class="text-ai-thinking-title">Thinking</div>
        <div id="ai-thinking-content" class="text-ai-thinking-content"></div>
      </div>

      <div id="refiner-view" class="tab-content rj-layout">
        <div class="settings-grid">
          <div class="form-group text-ai-input-group">
            <label>Input Text</label>
            <textarea id="ai-input" class="text-ai-input" placeholder="Paste text here..."></textarea>
          </div>
          <div class="form-group text-ai-mode-group">
            <label>Refinement Mode</label>
            <select id="ai-tone">
              <optgroup label="Editorial">
                <option value="proofread">Proofread</option>
                <option value="natural">Natural English</option>
                <option value="polish">Polish</option>
              </optgroup>
              <optgroup label="Style Rewrites">
                <option value="casual">Casual & Friendly</option>
                <option value="concise">Concise</option>
                <option value="social">Social Reply</option>
              </optgroup>
            </select>
            <button id="btn-run-refine" class="text-ai-run-button">Run</button>
          </div>
        </div>

        <div id="refine-output-container" class="hidden rj-layout">
          <div class="form-group">
            <label>Changes</label>
            <div id="monaco-refine-diff" class="text-ai-diff"></div>
          </div>
          <div class="text-ai-result-actions">
            <button id="btn-copy-refined" class="btn-secondary">Copy Result</button>
            <button id="btn-apply-refined">Use as Input</button>
          </div>
        </div>
      </div>

      <div id="chat-view" class="tab-content hidden rj-layout">
        <div id="chat-history" class="text-ai-chat-history"></div>
        <div class="text-ai-chat-composer">
          <textarea id="chat-input" class="text-ai-chat-input" placeholder="Message local engine..."></textarea>
          <button id="btn-chat-send" class="text-ai-chat-send">Send</button>
        </div>
      </div>

      <div id="console-view" class="tab-content hidden rj-layout">
        <div id="ai-console-log" class="text-ai-console-log">
          <div class="text-ai-console-empty">Console ready.</div>
        </div>
        <button id="btn-clear-console" class="btn-secondary text-ai-clear-console">Clear Console</button>
      </div>
    </div>
  `,g.appendChild(i);const E=i.querySelector("#ai-config-panel"),b=i.querySelector("#ai-model-select"),I=i.querySelector("#ai-model-info"),k=i.querySelector("#ai-thinking-zone"),h=i.querySelector("#ai-thinking-content"),y=i.querySelector("#ai-console-log");o=j(i.querySelector("#ai-progress-host"),{stopLabel:"Stop AI",onStop(){s==null||s.stop()}});const R=i.querySelector("#ai-temp"),_=i.querySelector("#ai-top-p"),A=i.querySelector("#ai-max-tokens"),N=i.querySelector("#ai-system-prompt");R.oninput=e=>{n.temp=parseFloat(e.target.value),e.target.previousElementSibling.textContent=`Temperature (${n.temp})`},_.oninput=e=>{n.top_p=parseFloat(e.target.value),e.target.previousElementSibling.textContent=`Top-P (${n.top_p})`},A.onchange=e=>n.n_predict=parseInt(e.target.value),N.onchange=e=>n.systemPrompt=e.target.value;function L(e){const t=document.createElement("div");t.className="text-ai-console-entry";const a=new Date().toLocaleTimeString();t.innerHTML=`
      <div class="text-ai-console-title">[${c(a)}] Request: ${c(e.requestId)}</div>
      <div class="text-ai-console-line"><span>System:</span> ${c(e.params.systemPrompt)}</div>
      <div class="text-ai-console-line"><span>Prompt:</span> ${c(e.prompt)}</div>
      <div class="text-ai-console-params">Params: ${c(JSON.stringify(e.params))}</div>
    `,y.appendChild(t),y.scrollTop=y.scrollHeight}function H(){s||(s=G(),s.subscribe(({type:e,payload:t})=>{if(e==="progress")o.update({title:"Loading weights...",detail:"Streaming GGUF via Hub.",busy:!0,progress:t.progress,cancellable:!1});else if(e==="status"&&t.status==="ready")m=!1,o.update({title:"Engine ready",detail:"Hardware acceleration active.",tone:"success",autoResetMs:d?0:1800});else if(e==="status"&&t.status==="aborted")d=!1,o.update({title:"Stopped",detail:"Generation aborted.",tone:"neutral",autoResetMs:900});else if(e==="thinking")t.state==="start"&&(k.classList.remove("hidden"),h.textContent="");else if(e==="thinking-token")h.textContent+=t.text,h.scrollTop=h.scrollHeight;else if(e==="stream"){x&&(x.innerHTML=z(t.text));const a=i.querySelector("#chat-history");a&&(a.scrollTop=a.scrollHeight)}else e==="complete"?O(t.result,t.requestId):e==="error"&&(d=!1,m=!1,o.update({title:"Engine error",detail:t.message,tone:"danger"}))}))}function z(e){return c(e).replace(/\n/g,"<br>")}function D(e){const t=p[e]||{};return/deepseek|reasoning|<think>/i.test(`${e} ${t.id||""} ${t.desc||""}`)}function $(e,t={}){const a=t.systemPrompt??n.systemPrompt,l=Math.max(64,Math.min(1024,Number.parseInt(n.n_predict,10)||512));return{...n,...t,n_predict:l,stop:Y,systemPrompt:U(a,{thinking:D(e),maxChars:900})}}const M=()=>{const e=p[b.value];I.innerHTML=`<strong>ID:</strong> ${c(e.id)}<br><strong>Size:</strong> ${c(e.size)}<br><strong>Use:</strong> ${c(e.desc)}`};b.addEventListener("change",M),M();async function O(e,t){if(d=!1,o.update({title:"Complete",detail:t==="refine"?"Refined text ready.":"Reply ready.",tone:"success",autoResetMs:1600}),k.classList.add("hidden"),t==="refine"){const a=i.querySelector("#ai-input").value;let l;if(v){const{monaco:u}=await C(i.querySelector("#monaco-refine-diff"));l=u}else{const{diffEditor:u,monaco:S}=await C(i.querySelector("#monaco-refine-diff"));v=u,l=S}v.setModel({original:l.editor.createModel(a,"plaintext"),modified:l.editor.createModel(e,"plaintext")}),i.querySelector("#refine-output-container").classList.remove("hidden"),i.querySelector("#stream-preview")&&i.querySelector("#stream-preview").remove(),setTimeout(()=>v.layout(),100)}}let x=null;async function w(){if(f&&!m)return!0;if(m)return!1;const e=q.text;m=!0,o.update({title:"Auto-initializing engine...",detail:`Using default: ${p[e].id}`,busy:!0});try{return await s.loadModel(p[e].url),f=e,!0}catch{return!1}}i.querySelector("#btn-run-refine").addEventListener("click",async()=>{d&&(s.stop(),await new Promise(l=>setTimeout(l,100)));const e=i.querySelector("#ai-input").value.trim();if(!e||!await w())return;d=!0,o.update({title:"Synthesizing...",detail:"Streaming refiner output.",busy:!0,cancellable:!0});const t=document.createElement("div");t.id="stream-preview",t.className="text-ai-stream-preview",i.querySelector("#refiner-view").insertBefore(t,i.querySelector("#refine-output-container")),x=t;const a={requestId:"refine",prompt:K(i.querySelector("#ai-tone").value,e),params:$(f||b.value||q.text)};L(a),s.generate(a)});const P=async()=>{const e=i.querySelector("#chat-input"),t=e.value.trim();if(!t||(d&&(s.stop(),await new Promise(F=>setTimeout(F,100))),!await w()))return;e.value="",d=!0;const a=i.querySelector("#chat-history"),l=document.createElement("div");l.className="text-ai-chat-message text-ai-chat-message-user",l.textContent=t,a.appendChild(l);const u=document.createElement("div");u.className="text-ai-chat-message text-ai-chat-message-assistant",u.innerHTML="...",a.appendChild(u),x=u,o.update({title:"Thinking...",detail:"Streaming chat reply.",busy:!0,cancellable:!0});const S={requestId:"chat",prompt:t,params:$(f||b.value||q.text,{systemPrompt:"You are a helpful local text assistant. Keep replies concise."})};L(S),s.generate(S),a.scrollTop=a.scrollHeight};i.querySelector("#btn-chat-send").addEventListener("click",P),i.querySelector("#chat-input").addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),P())}),i.querySelector("#btn-ai-setup").onclick=()=>E.classList.toggle("hidden"),i.querySelector("#btn-ai-cancel").onclick=()=>E.classList.add("hidden"),i.querySelector("#btn-ai-activate").onclick=async()=>{const e=b.value,t=i.querySelector("#btn-ai-activate");t.disabled=!0,m=!0,o.update({title:"Activating engine...",detail:p[e].id,busy:!0});try{await s.loadModel(p[e].url),f=e}catch{}E.classList.add("hidden"),t.disabled=!1},i.querySelector("#btn-clear-console").onclick=()=>{y.innerHTML='<div class="text-ai-console-empty">Console cleared.</div>'},i.querySelectorAll(".tab-btn").forEach(e=>{e.addEventListener("click",()=>{i.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active")),e.classList.add("active"),i.querySelectorAll(".tab-content").forEach(t=>t.classList.add("hidden")),i.querySelector(`#${e.dataset.tab}-view`).classList.remove("hidden")})}),H()}function c(g){return String(g??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function K(g,r){switch(g){case"proofread":return`Surgical Proofread (Fix grammar/spelling only): ${r}`;case"natural":return`Naturalize (Native flow only): ${r}`;default:return{polish:`Executive Polish: ${r}`,casual:`Casual Rewrite: ${r}`,concise:`Distill / Shorten: ${r}`,social:`Social Reply: ${r}`}[g]||r}}function V(){s&&s.dispose(),s=null,o==null||o.destroy(),o=null,v&&v.dispose(),v=null,i&&i.remove(),i=null,f=null,d=!1,m=!1}export{Q as mount,V as unmount};
