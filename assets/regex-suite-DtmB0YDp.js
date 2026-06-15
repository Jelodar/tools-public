import{c as st,M as ee,D as Qe}from"./ai-session-CFFiJM4b.js";import{c as je,s as Fe}from"./ui-utils-CG6aKAAj.js";import{d as lt,t as G,g as ot}from"./index-B6SKL95y.js";import{c as ve}from"./modal-DKefIaRW.js";import{c as ct}from"./tool-state-B_5q_c8d.js";import{e as dt}from"./ai-generation-CBvcWf5u.js";function ut(e){const r=Number(e);if(!Number.isFinite(r)||r<=0)return 0;const t=r<=1?r*100:r;return Math.max(0,Math.min(100,Math.round(t)))}function gt(e={}){const r=e.modelRegistry||{},t=e.session||st(),a=lt(e.progressHost,{stopLabel:e.stopLabel||"Stop AI",idleMessage:e.idleMessage||"Local engine idle.",onStop(){var m;y.stop(),(m=e.onStop)==null||m.call(e,y)}}),n=`ai-${Math.random().toString(36).slice(2,9)}`,i={activeModelKey:null,loadingModelKey:null,isLoading:!1,isGenerating:!1,thinkingActive:!1,thinkingText:"",visibleText:""},d=e.thinkingPanel||null,u=e.thinkingContent||d||null,f=e.consoleNode||null,x=e.consoleEmptyMessage||"[INFO] Local AI console ready.",$=(m,p)=>{if(!f)return;f.dataset.empty==="true"&&(f.innerHTML=""),f.dataset.empty="false";const E=document.createElement("div");E.className="ai-console-entry",E.innerHTML=e.renderConsoleEntry?e.renderConsoleEntry(m,p):ft(m,p),f.appendChild(E),f.scrollTop=f.scrollHeight},M=()=>{var p;if(!e.modelInfoNode||!e.modelSelect)return;const m=r[e.modelSelect.value];e.modelInfoNode.innerHTML=m?((p=e.renderModelInfo)==null?void 0:p.call(e,m,e.modelSelect.value))||pt(m):""},q=(m,p=!1)=>{d&&(d.classList.toggle("hidden",!m),p&&u&&(u.textContent=""))},b=()=>{i.thinkingActive=!1,i.thinkingText="",i.visibleText="",u&&(u.textContent="")},y={state:i,progress:a,session:t,syncModelInfo:M,toggleConfig(m){if(!e.configPanel)return;const p=typeof m=="boolean"?m:e.configPanel.classList.contains("hidden");e.configPanel.classList.toggle("hidden",!p)},openConfig(){y.toggleConfig(!0)},closeConfig(){y.toggleConfig(!1)},clearConsole(){f&&(f.dataset.empty="true",f.innerHTML=`<div class="ai-console-empty">${W(x)}</div>`)},logInvocation(m,p={}){$("invoke",{...p,payload:m,timestamp:new Date().toLocaleTimeString()})},async ensureModel(m=(p=>(p=e.modelSelect)==null?void 0:p.value)()||i.activeModelKey){var C;const E=m||e.initialModelKey,N=r[E];if(!E||!N)throw new Error("A valid local AI model is required.");if(i.activeModelKey===E&&!i.isLoading)return N;i.isLoading=!0,i.loadingModelKey=E,a.update({title:e.loadingTitle||"Loading weights...",detail:((C=e.loadingDetail)==null?void 0:C.call(e,N,E))||N.id,busy:!0});try{return await t.loadModel(N.url),i.activeModelKey=E,i.isLoading=!1,i.loadingModelKey=null,N}catch(K){throw i.isLoading=!1,i.loadingModelKey=null,K}},run(m,p={}){var N;i.isGenerating=!0,i.isLoading=!1,b(),q(!1),(N=e.onBeforeGenerate)==null||N.call(e,m,p,y),p.log!==!1&&y.logInvocation(m,p);const E={title:p.title||e.generateTitle||"Generating...",detail:p.detail||e.generateDetail||"Streaming local output.",busy:!0,cancellable:p.cancellable??!0};a.update(E),G.register(n,{...E,onStop:()=>y.stop()}),t.generate(m)},stop(){if(t.stop(),i.isGenerating||i.isLoading){i.isGenerating=!1,i.isLoading=!1;const m={title:e.abortedTitle||"Stopped",detail:e.abortedDetail||"Generation aborted.",autoResetMs:900};a.update(m),G.update(n,m),setTimeout(()=>G.unregister(n),1e3)}},destroy(){a.destroy(),t.dispose(),q(!1,!0)}};return y.clearConsole(),e.modelSelect&&e.modelSelect.addEventListener("change",M),M(),t.subscribe(({type:m,payload:p})=>{var E,N,C,K,re,ae,Z,ne,de,ue,he;if(m==="progress"){i.isLoading=!0;const R={title:e.loadingTitle||"Loading weights...",detail:e.loadingProgressDetail||"Streaming local model files.",busy:!0,progress:ut(p.progress),cancellable:!1};a.update(R),G.register(n,{...R,onStop:()=>y.stop()}),(E=e.onProgress)==null||E.call(e,p,y);return}if(m==="status"&&p.status==="ready"){i.isLoading=!1,i.activeModelKey=i.loadingModelKey||i.activeModelKey,i.loadingModelKey=null;const R={title:e.readyTitle||"Engine ready",detail:((N=e.readyDetail)==null?void 0:N.call(e,i.activeModelKey))||"Local model active.",tone:"success",autoResetMs:i.isGenerating?0:1800};a.update(R),G.update(n,R),i.isGenerating||setTimeout(()=>G.unregister(n),2e3),(C=e.onReady)==null||C.call(e,p,y);return}if(m==="status"&&p.status==="aborted"){i.isGenerating=!1,b(),q(!1,!0);const R={title:e.abortedTitle||"Stopped",detail:e.abortedDetail||"Generation aborted.",autoResetMs:900};a.update(R),G.update(n,R),setTimeout(()=>G.unregister(n),1e3),(K=e.onAborted)==null||K.call(e,p,y);return}if(m==="thinking"){if(p.state==="start"){if(i.thinkingActive=!0,q(!0),i.isGenerating){const R={title:e.generateTitle||"Generating...",detail:e.thinkingDetail||"Model is reasoning...",busy:!0,cancellable:!0};a.update(R),G.update(n,R)}}else p.state==="end"&&(i.thinkingActive=!1);(re=e.onThinking)==null||re.call(e,p,y);return}if(m==="thinking-token"){i.thinkingText+=p.text||"",u&&(u.textContent=i.thinkingText,u.scrollTop=u.scrollHeight),$("thinking",{text:p.text||"",fullText:i.thinkingText,timestamp:new Date().toLocaleTimeString()}),(ae=e.onThinkingToken)==null||ae.call(e,{...p,fullText:i.thinkingText},y),(Z=e.onThinkingStream)==null||Z.call(e,{...p,fullText:i.thinkingText},y);return}if(m==="stream"){i.visibleText=p.text||"",$("stream",{text:p.text||"",fullText:i.visibleText,timestamp:new Date().toLocaleTimeString()}),(ne=e.onStream)==null||ne.call(e,{...p,fullText:i.visibleText},y);return}if(m==="complete"){i.isGenerating=!1;const R=(de=e.resolveCompleteProgress)==null?void 0:de.call(e,p,y);R&&(a.update(R),G.update(n,R)),setTimeout(()=>G.unregister(n),2e3);const X=e.keepThinkingVisible===!0;q(X,!X),X?(i.thinkingActive=!1,i.visibleText=""):b(),$("complete",{result:p.result||i.visibleText,timestamp:new Date().toLocaleTimeString()}),(ue=e.onComplete)==null||ue.call(e,p,y);return}if(m==="error"){i.isLoading=!1,i.isGenerating=!1,i.loadingModelKey=null,b(),q(!1,!0);const R={title:e.errorTitle||"Engine error",detail:p.message,tone:"danger"};a.update(R),G.update(n,R),setTimeout(()=>G.unregister(n),5e3),$("error",{message:p.message,timestamp:new Date().toLocaleTimeString()}),(he=e.onError)==null||he.call(e,p,y)}}),y}function pt(e){return`<strong>ID:</strong> ${e.id}<br><strong>Size:</strong> ${e.size}<br><strong>Mode:</strong> ${e.desc}`}function ft(e,r){if(e==="stream"||e==="thinking"||e==="complete"){const x=e==="complete"?r.result||"":r.text||r.fullText||"";return`
      <div class="ai-console-entry-head">
        <span class="ai-console-entry-tag">${W(e)}</span>
        <span class="ai-console-entry-time">${W(r.timestamp)}</span>
      </div>
      <div class="ai-console-entry-body">${W(x)}</div>
    `}if(e==="error")return`
      <div class="ai-console-entry-head">
        <span class="ai-console-entry-tag ai-console-entry-tag-error">Error</span>
        <span class="ai-console-entry-time">${W(r.timestamp)}</span>
      </div>
      <div class="ai-console-entry-body">${W(r.message||"Unknown local AI error.")}</div>
    `;const t=r.payload||{},a=t.requestId||r.label||"request",n=[];t.prompt&&n.push(String(t.prompt)),Array.isArray(t.messages)&&t.messages.length&&n.push(t.messages.map(x=>`[${x.role||"message"}] ${String(x.content||"")}`).join(`

`)),t.suffix&&n.push(`[suffix] ${String(t.suffix)}`);const i=n.filter(Boolean).join(`

`),d=t.params||{},u={};Object.entries(d).forEach(([x,$])=>{x==="grammar"||x==="responseFormat"||x==="systemPrompt"||(u[x]=$)}),(t.responseFormat||d.responseFormat)&&(u.response=t.responseFormat||d.responseFormat),(t.grammar||d.grammar)&&(u.grammar="custom"),Array.isArray(t.messages)&&t.messages.length&&(u.messages=t.messages.length);const f=JSON.stringify(u);return`
    <div class="ai-console-entry-head">
      <span class="ai-console-entry-tag">${W(a)}</span>
      <span class="ai-console-entry-time">${W(r.timestamp)}</span>
    </div>
    <div class="ai-console-entry-body">${W(i||"[empty request body]")}</div>
    <div class="ai-console-entry-meta">${W(f)}</div>
  `}function W(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const V={email:{pattern:"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",flags:"g",sample:"Contact team@example.com or ops@example.org for support."},url:{pattern:"https?:\\/\\/[^\\s/$.?#].[^\\s]*",flags:"g",sample:"Primary docs: https://example.com/docs and https://status.example.com"},uuid:{pattern:"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}",flags:"g",sample:"IDs: 550e8400-e29b-41d4-a716-446655440000 and 018ec353-7be1-7cc6-b4f0-9f6d1e4ad7aa"},date:{pattern:"\\b\\d{4}-\\d{2}-\\d{2}\\b",flags:"g",sample:"Release windows: 2026-04-21, 2026-05-05, 2026-06-30."},hashtag:{pattern:"#[A-Za-z0-9_]+",flags:"g",sample:"Track #frontend, #release_notes, and #qa for updates."}},mt=`Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Release date: 2026-04-21.
Contact: hello@example.com.
Profile slug: world-class-suite.
Reference ID: 550e8400-e29b-41d4-a716-446655440000.`,xt=[{flag:"d",label:"Indices",detail:"Exposes match indices in modern engines.",compatibility:"Modern Chromium / Firefox / Safari only."},{flag:"g",label:"Global",detail:"Finds every match instead of stopping at the first.",compatibility:"Widely supported."},{flag:"i",label:"Ignore Case",detail:"Matches case-insensitively.",compatibility:"Widely supported."},{flag:"m",label:"Multiline",detail:"Makes ^ and $ operate per line.",compatibility:"Widely supported."},{flag:"s",label:"Dot All",detail:"Allows . to match newlines.",compatibility:"Modern browsers and Node."},{flag:"u",label:"Unicode",detail:"Enables Unicode-aware parsing and escapes.",compatibility:"Widely supported in modern engines."},{flag:"v",label:"Unicode Sets",detail:"Adds advanced Unicode set notation.",compatibility:"Only the newest engines currently support this."},{flag:"y",label:"Sticky",detail:"Matches from the current index only.",compatibility:"Widely supported in modern engines."}],xe=[h("newline","control","Newline","\\n","Line break character.","js"),h("tab","control","Tab","\\t","Horizontal tab character.","js"),h("digit","tokens","Digit","\\d","Digit character.","js"),h("word","tokens","Word character","\\w","Letter, digit, or underscore.","js"),h("space","tokens","Whitespace","\\s","Whitespace character.","js"),h("any-char","tokens","Any character",".","Any code unit except a newline unless dotAll is enabled.","js"),h("literal","tokens","Escaped literal","literal","Escape plain text for a literal match.","js",[{id:"value",label:"Text",defaultValue:".",placeholder:"Enter text to escape"}],e=>Qt(e.value||".")),h("alternation","tokens","Alternation","a|b","Match one of two branches.","js",[{id:"left",label:"Left branch",defaultValue:"cat"},{id:"right",label:"Right branch",defaultValue:"dog"}],e=>`${e.left||"cat"}|${e.right||"dog"}`),h("char-class","classes","Character class","[abc]","Match one character from a custom set.","js",[{id:"set",label:"Character set",defaultValue:"abc",placeholder:"abc"}],e=>`[${Je(e.set||"abc")}]`),h("negated-class","classes","Negated class","[^abc]","Reject characters from a custom set.","js",[{id:"set",label:"Excluded set",defaultValue:"abc",placeholder:"abc"}],e=>`[^${Je(e.set||"abc")}]`),h("range-class","classes","Character range","[a-z]","Match a custom range or mixed range source.","js",[{id:"range",label:"Range",defaultValue:"a-z",placeholder:"a-zA-Z0-9"}],e=>`[${String(e.range||"a-z").trim()||"a-z"}]`),h("unicode-property","classes","Unicode property","\\p{L}","Unicode property escape.","js-modern",[{id:"property",label:"Property",defaultValue:"L",placeholder:"L or Script=Latin"}],e=>`\\p{${String(e.property||"L").trim()||"L"}}`),h("unicode-property-negated","classes","Negated Unicode property","\\P{L}","Negated Unicode property escape.","js-modern",[{id:"property",label:"Property",defaultValue:"L",placeholder:"L or Script=Latin"}],e=>`\\P{${String(e.property||"L").trim()||"L"}}`),h("capture-group","groups","Capturing group","(...)","Group a subpattern and capture it.","js",[{id:"pattern",label:"Pattern",defaultValue:"\\d+",placeholder:"\\d+"}],e=>`(${e.pattern||"\\d+"})`),h("non-capture-group","groups","Non-capturing group","(?:...)","Group without capturing.","js",[{id:"pattern",label:"Pattern",defaultValue:"cat|dog",placeholder:"cat|dog"}],e=>`(?:${e.pattern||"cat|dog"})`),h("named-group","groups","Named group","(?<name>...)","Named capturing group.","js-modern",[{id:"name",label:"Group name",defaultValue:"value",placeholder:"value"},{id:"pattern",label:"Pattern",defaultValue:"\\d+",placeholder:"\\d+"}],e=>`(?<${Ze(e.name||"value")}>${e.pattern||"\\d+"})`),h("named-backref","backrefs","Named backreference","\\k<name>","Reference a named group.","js-modern",[{id:"name",label:"Group name",defaultValue:"value",placeholder:"value"}],e=>`\\k<${Ze(e.name||"value")}>`),h("lookahead","lookaround","Positive lookahead","(?=...)","Require following text without consuming it.","js",[{id:"pattern",label:"Assertion",defaultValue:"USD",placeholder:"USD"}],e=>`(?=${e.pattern||"USD"})`),h("negative-lookahead","lookaround","Negative lookahead","(?!...)","Reject following text without consuming it.","js",[{id:"pattern",label:"Assertion",defaultValue:"draft",placeholder:"draft"}],e=>`(?!${e.pattern||"draft"})`),h("lookbehind","lookaround","Positive lookbehind","(?<=...)","Require preceding text without consuming it.","js-modern",[{id:"pattern",label:"Assertion",defaultValue:"\\$",placeholder:"\\$"}],e=>`(?<=${e.pattern||"\\$"})`),h("negative-lookbehind","lookaround","Negative lookbehind","(?<!...)","Reject preceding text without consuming it.","js-modern",[{id:"pattern",label:"Assertion",defaultValue:"draft-",placeholder:"draft-"}],e=>`(?<!${e.pattern||"draft-"})`),h("optional-quantifier","quantifiers","Optional","?","Zero or one repetition.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"}],e=>`${e.target||"\\d"}?`),h("zero-or-more","quantifiers","Zero or more","*","Greedy repetition.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"}],e=>`${e.target||"\\d"}*`),h("one-or-more","quantifiers","One or more","+","Greedy repetition.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"}],e=>`${e.target||"\\d"}+`),h("exact-quantifier","quantifiers","Exact count","a{3}","Match an exact number of repetitions.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"},{id:"count",label:"Count",defaultValue:"4",inputMode:"numeric"}],e=>`${e.target||"\\d"}{${ke(e.count,4)}}`),h("range-quantifier","quantifiers","Range count","a{2,5}","Match within a repetition range.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"},{id:"min",label:"Min",defaultValue:"2",inputMode:"numeric"},{id:"max",label:"Max",defaultValue:"5",inputMode:"numeric"}],e=>{const r=ke(e.min,2),t=Math.max(r,ke(e.max,5));return`${e.target||"\\d"}{${r},${t}}`}),h("open-quantifier","quantifiers","At least count","a{2,}","Match a minimum number of repetitions.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"},{id:"min",label:"Min",defaultValue:"2",inputMode:"numeric"}],e=>`${e.target||"\\d"}{${ke(e.min,2)},}`),h("start-anchor","anchors","Start anchor","^","Match only at the start.","js"),h("end-anchor","anchors","End anchor","$","Match only at the end.","js"),h("word-boundary","anchors","Word boundary","\\b","Boundary between word and non-word characters.","js"),h("non-word-boundary","anchors","Non-word boundary","\\B","Position that is not a word boundary.","js"),h("hex-char","tokens","Hex character","\\x00","Hexadecimal escape.","js",[{id:"code",label:"Hex Code",defaultValue:"20",placeholder:"20"}],e=>`\\x${String(e.code||"20").trim().padStart(2,"0").slice(0,2)}`),h("unicode-char","tokens","Unicode character","\\u0000","Unicode escape.","js",[{id:"code",label:"Unicode Hex",defaultValue:"0020",placeholder:"0020"}],e=>`\\u${String(e.code||"0020").trim().padStart(4,"0").slice(0,4)}`),h("unicode-char-ext","tokens","Unicode (Extended)","\\u{0}","Extended Unicode escape.","js-modern",[{id:"code",label:"Unicode Hex",defaultValue:"1F600",placeholder:"1F600"}],e=>`\\u{${String(e.code||"1F600").trim()}}`)];function De(e,r={}){const t=xe.find(a=>a.id===e);return t?typeof t.build=="function"?String(t.build(r||{})||""):String(t.token||""):""}const ht=[{regex:/\\(?:[1-9]\d*|k<[^>]+>)/,note:"Backreferences use summary tracing only."},{regex:/(?:\*|\+|\?|\{[^}]+\})\+/,note:"Possessive quantifiers use summary tracing only."},{regex:/\[(?:[^\]\\]|\\.)*&&(?:[^\]\\]|\\.)*\]/,note:"Set intersections use summary tracing only."}];function F(e){const r=new Set(["d","g","i","m","s","u","v","y"]),t=[];for(const a of String(e||""))r.has(a)&&!t.includes(a)&&t.push(a);return t.join("")}function bt(e=""){const r=new Set(F(e));return xt.map(t=>({...t,active:r.has(t.flag)}))}function Ye(e){const r=String(e||"");if(!r)return[];const t=[];let a=0,n=!1;for(let i=0;i<r.length;i+=1){const d=r[i];if(d==="\\"){i+=1;continue}if(d==="["&&!n){n=!0;continue}if(d==="]"&&n){n=!1;continue}if(!(n||d!=="(")){if(r[i+1]==="?"){if(r[i+2]==="<"&&r[i+3]!=="="&&r[i+3]!=="!"){const u=r.indexOf(">",i+3);a+=1,t.push({index:a,name:u===-1?"":r.slice(i+3,u),token:`$${a}`})}continue}a+=1,t.push({index:a,name:"",token:`$${a}`})}}return t}function Q(e,r=""){return new RegExp(e,F(r))}function $e(e,r,t){if(!e)return{empty:!0,matches:[],count:0,highlightedText:oe(t||"")};try{const a=F(r),n=Q(e,a.includes("g")?a:`${a}g`),i=String(t||""),d=Array.from(i.matchAll(n)).map((u,f)=>({id:f+1,value:u[0],index:u.index,end:u.index+u[0].length,groups:u.slice(1),namedGroups:u.groups||{}}));return{empty:!1,error:null,regex:n,count:d.length,matches:d,highlightedText:er(i,d)}}catch(a){return{empty:!1,error:a.message,matches:[],count:0,highlightedText:oe(t||"")}}}function vt(e){const r=String(e||"");if(!r)return[];const t=[];return[{regex:/\\d/g,label:"\\d",detail:"digit"},{regex:/\\w/g,label:"\\w",detail:"word character"},{regex:/\\s/g,label:"\\s",detail:"whitespace"},{regex:/\[[^\]]+\]/g,label:"[]",detail:"character class"},{regex:/\(\?:/g,label:"(?:",detail:"non-capturing group"},{regex:/\((?!\?:|\?<)/g,label:"()",detail:"capturing group"},{regex:/\(\?<[^>]+>/g,label:"(?<name>",detail:"named capturing group"},{regex:/\*/g,label:"*",detail:"zero or more"},{regex:/\+/g,label:"+",detail:"one or more"},{regex:/\?/g,label:"?",detail:"optional or lazy modifier"},{regex:/\{[^}]+\}/g,label:"{}",detail:"explicit repetition range"},{regex:/\^/g,label:"^",detail:"start anchor"},{regex:/\$/g,label:"$",detail:"end anchor"},{regex:/\|/g,label:"|",detail:"alternation"},{regex:/\./g,label:".",detail:"any character except newline unless dotall"}].forEach(n=>{n.regex.test(r)&&t.push(n)}),t}function Oe(e){return V[e]||null}function yt(){return Xt().map(([e,r])=>({id:e,name:e.replace(/^[a-z]/,t=>t.toUpperCase()),pattern:r.pattern,flags:r.flags,sample:r.sample,builtIn:!0}))}function St(e,r,t,a=""){const n=String(e||"").trim();if(!n)throw new Error("Snippet name is required.");return Q(r,F(t)),{id:`${n.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${F(t)||"plain"}`,name:n,pattern:r,flags:F(t),sample:String(a||""),builtIn:!1}}function Ge(e=[]){const r=[...yt()],t=new Set(r.map(a=>a.id));for(const a of e||[])!(a!=null&&a.id)||t.has(a.id)||(r.push({id:a.id,name:String(a.name||"Snippet"),pattern:String(a.pattern||""),flags:F(a.flags||""),sample:String(a.sample||""),builtIn:!1}),t.add(a.id));return r}function kt(e,r,t,a){const n=String(t||""),i=Ye(e),d=$t(a,i);if(!e)return{output:n,count:0,error:null,template:d};try{const u=F(r),f=u.includes("g")?u:`${u}g`,x=Q(e,f),$=Q(e,f),M=Array.from(n.matchAll(x)).length;return{output:n.replace($,d),count:M,error:null,template:d}}catch(u){return{output:n,count:0,error:u.message,template:d}}}function $t(e,r=[]){if(e&&typeof e=="object"&&e.mode==="groups"){const t=e.groups&&typeof e.groups=="object"?e.groups:{},a=r.length?r.map(n=>Object.prototype.hasOwnProperty.call(t,n.index)?String(t[n.index]??""):Object.prototype.hasOwnProperty.call(t,String(n.index))?String(t[String(n.index)]??""):n.token):[Object.prototype.hasOwnProperty.call(t,"match")?String(t.match??""):String(e.match??"$MATCH")];return ze(a.join(""))}return ze(String(e||""))}function ze(e){return String(e||"").replace(/\$MATCH/g,"$$&")}function Tt(e,r,t=null,a=null){const n=String(e||""),i=String(r||""),d=Number.isInteger(t)?Math.max(0,t):n.length,u=Number.isInteger(a)?Math.max(d,a):d;return`${n.slice(0,d)}${i}${n.slice(u)}`}function Xe(e,r=""){const t=String(e||"").trim(),a=String(r||"").trim();return["Task: Draft a high-performance JavaScript RegExp for modern browser engines (V8/SpiderMonkey).",`Goal:
${t||"Create a regex that matches the requested text."}`,a?`Sample text:
${a}`:"","Requirements:","1. Return exactly one compact JSON object. No prose, markdown, or commentary.",'2. Schema: {"pattern":"...","flags":"g"}',"3. Escape backslashes (\\) correctly for JSON string values.",'4. Use only "pattern" and "flags" keys.',"5. Prefer non-capturing groups (?:...) unless capture is strictly necessary.","6. Use \\b or anchors when the target should stand alone instead of matching inside larger words.","7. Avoid broad .* sections when a bounded token, explicit class, or lazy segment is enough.","8. Avoid catastrophic backtracking; use explicit structure and tight quantifiers.","9. Choose appropriate flags (d, g, i, m, s, u, v, y), keep them unique, and omit unused flags."].join(`

`)}function Mt(e,r=""){return[{role:"system",content:["You are an expert Regex Engineer specializing in modern JavaScript (ES2024+).","Your goal is to provide safe, efficient, and correct RegExp patterns.",'Return JSON only with "pattern" and "flags".',"You MUST return ONLY a JSON object. No explanations, no backticks, no markdown.","You prefer named capture groups (?<name>...) for clarity when capture is requested.","You follow JSON string escaping rules strictly (e.g. \\d becomes \\\\d)."].join(`
`)},{role:"user",content:Xe(e,r)}]}function wt(){const e=["d","g","i","m","s","u","v","y"],r=[`flags-body ::= "" | ${e.map(t=>`"${t}" flags-after-${t}`).join(" | ")}`];return e.forEach((t,a)=>{const n=e.slice(a+1).map(i=>`"${i}" flags-after-${i}`);r.push(`flags-after-${t} ::= ""${n.length?` | ${n.join(" | ")}`:""}`)}),[String.raw`root ::= "{" ws "\"pattern\"" ws ":" ws string ws "," ws "\"flags\"" ws ":" ws flags ws "}" ws`,'flags ::= "\\"" flags-body "\\""'.replace(/\\"/g,'"'),...r,String.raw`string ::= "\"" string-char* "\""`,String.raw`string-char ::= [^"\\\x00-\x1F] | "\\" escape`,String.raw`escape ::= ["\\/bfnrt] | "u" hex hex hex hex`,String.raw`hex ::= [0-9a-fA-F]`,String.raw`ws ::= [ \t\n\r]*`].join(`
`)}function Et(e,r=""){const t=String(e||"").trim()||"Match the requested text.",a=String(r||"").trim()||"none";return["Complete the missing JavaScript regex pattern.","Return only the missing pattern source.","No slashes. No prose. Short correct answer. DO NOT PROVIDE ANY EXPLANATIONS.","Do not emit the closing quote.","Goal: match invoice IDs like INV-1042","Sample: Open INV-1042 and INV-2201 before noon.","Result: \\bINV-\\d{4}\\b",`Goal: ${t}`,`Sample: ${a}`,'<|fim_prefix|>{"pattern":"<|fim_suffix|>","flags":"g"}<|fim_middle|>'].join(`
`)}function At(e){return Array.isArray(e==null?void 0:e.tasks)&&e.tasks.includes("code-fast")}function Lt({model:e,description:r,sample:t="",temp:a=.1,maxTokens:n=48,requestId:i="regex-builder"}={}){var f;if(At(e))return{requestId:i,isRaw:!0,prompt:Et(r,t),params:{temp:a,n_predict:n,stop:['"',`
`]}};const d=Mt(r,t),u=wt();return{requestId:i,prompt:Xe(r,t),messages:d,responseFormat:"json",grammar:u,params:{systemPrompt:((f=d[0])==null?void 0:f.content)||"Write JavaScript regex. Return JSON only with pattern and flags.",responseFormat:"json",grammar:u,temp:a,top_p:.2,n_predict:n}}}function Be(e,r=null){const t=String(e||"").trim();if(!t)return null;const a=Se(r);try{return me(Se(JSON.parse(t)),a)}catch{}const n=t.match(/```(?:json)?\s*([\s\S]*?)```/i);if(n)try{return me(Se(JSON.parse(n[1])),a)}catch{}const i=dt(t);if(i!=null&&i.jsonText)try{return me(Se(JSON.parse(i.jsonText)),a)}catch{}const d=Jt(t);if(d)return me({pattern:d.pattern,flags:d.flags||(a==null?void 0:a.flags)||"g",explanation:"",sample:"",rationale:[],confidence:(a==null?void 0:a.confidence)||"medium"},a);const u=Zt(t);return u?me({pattern:u,flags:(a==null?void 0:a.flags)||"g",explanation:"",sample:"",rationale:[],confidence:(a==null?void 0:a.confidence)||"medium"},a):null}function te(e,r=""){const t=`${String(e||"")}
${String(r||"")}`.trim(),a=t.toLowerCase(),n=String(r||"");if(!t)return{pattern:"",flags:"g",explanation:"Add a natural-language goal or sample text to draft a regex.",sample:n,rationale:["No description provided yet."],confidence:"low"};const i=Wt(t,a);return qe({pattern:i.pattern,flags:i.flags||"g",explanation:i.explanation,sample:n,rationale:i.rationale,confidence:i.confidence})}function qt(e,r,t,a={}){const n=String(e||""),i=String(t||""),d=F(r).replace(/[dgy]/g,"");if(!n)return{error:null,supported:!0,note:"Add a pattern to generate a trace.",steps:[],frames:[],match:null,summary:"No pattern to trace."};try{Q(n,d)}catch(p){return{error:p.message,supported:!1,note:"The pattern must compile before it can be traced.",steps:[],frames:[],match:null,summary:"Regex compilation failed."}}const u=Nt(n);if(u.error)return{error:null,supported:!1,note:u.error,steps:[],frames:[],match:null,summary:"Trace parser could not expand the pattern."};if(u.unsupportedNote)return{error:null,supported:!1,note:u.unsupportedNote,steps:[],frames:[],match:null,summary:"Trace falls back to summary mode for this pattern."};const x=$e(n,d,i).matches||[],$=Math.max(80,Math.min(480,a.maxSteps||260)),M=x.length?Math.max(0,Math.min(x.length-1,a.matchIndex||0)):0,q=x[M]||null,b=It($,i.length);let y=zt(x,M,b);const m=q?q.index:Math.min(i.length,a.maxScanIndexes||i.length);for(;y<=m&&!b.exhausted;){const p=jt(u.node,i,y,d,b);if(p.success){const E=i.slice(y,p.cursor);if(!q||y===q.index&&E===q.value){const C=q||{id:M+1,value:E,index:y,end:p.cursor,groups:[],namedGroups:{}};return b.push("complete",`Full match "${C.value}" completed at ${C.index}..${C.end}.`,C.end,Y(C.index,C.end,"full"),{start:0,end:n.length}),{error:null,supported:!0,note:`${b.exhausted?"Trace reached the current step limit.":"Engine-style trace for the current match."}${M?` Focused on match ${M+1}.`:""}`,steps:b.steps,frames:b.steps.map(({cursor:K,ranges:re,kind:ae,message:Z,patternRange:ne})=>({cursor:K,ranges:re,kind:ae,message:Z,patternRange:ne})),match:C,summary:`Found match ${M+1} at ${C.index}..${C.end}.`}}y=tt({index:y,end:p.cursor});continue}y+=1}return b.push("complete","Reached the end of the scanned text without a full match.",i.length,[],{start:0,end:n.length}),{error:null,supported:!0,note:b.exhausted?"Trace reached the current step limit before the pattern could finish searching.":"Engine-style trace scanned the available text without finding a full match.",steps:b.steps,frames:b.steps.map(({cursor:p,ranges:E,kind:N,message:C,patternRange:K})=>({cursor:p,ranges:E,kind:N,message:C,patternRange:K})),match:q,summary:q?`Trace did not reach match ${M+1} before the step budget ended.`:"No full match found in the scanned text."}}function Nt(e){const r=String(e||""),t=ht.find(i=>i.regex.test(r));if(t)return{node:null,error:null,unsupportedNote:t.note};const a={source:r,index:0,error:null,unsupportedNote:null},n=et(a);return a.error?{node:null,error:a.error,unsupportedNote:null}:a.unsupportedNote?{node:null,error:null,unsupportedNote:a.unsupportedNote}:a.index!==a.source.length?{node:null,error:"Trace parser stopped before the full pattern was consumed.",unsupportedNote:null}:{node:n,error:null,unsupportedNote:null}}function et(e,r=""){const t=e.index,a=[He(e,r)];for(;!e.error&&e.source[e.index]==="|";)e.index+=1,a.push(He(e,r));const n=e.index;return a.length===1?a[0]:{type:"alternation",raw:e.source.slice(t,n),start:t,end:n,options:a}}function He(e,r=""){const t=e.index,a=[];for(;!e.error&&e.index<e.source.length;){const i=e.source[e.index];if(i==="|"||r&&i===r)break;const d=Ct(e);if(!d)break;a.push(d)}const n=e.index;return{type:"sequence",raw:e.source.slice(t,n),start:t,end:n,items:a}}function Ct(e){const r=e.index,t=Rt(e);if(!t||e.error)return null;const a=Kt(e.source,e.index);if(a.endIndex!==e.index){e.index=a.endIndex;const n=e.index;return{type:"quantifier",raw:e.source.slice(r,n),start:r,end:n,atom:t,min:a.value.min,max:a.value.max,mode:a.value.mode}}return t}function Rt(e){const r=e.index,t=e.source[e.index];if(!t)return null;if(t==="(")return Pt(e);if(t==="["){const n=Ut(e.source,e.index);if(n.error)return e.error=n.error,null;e.index=n.endIndex;const i=e.index;return{type:"token",raw:n.raw,start:r,end:i}}if(t==="\\"){const n=_t(e.source,e.index);e.index+=n.length;const i=e.index;return/^\\(?:[1-9]\d*|k<[^>]+>)$/.test(n)?(e.unsupportedNote="Backreferences use summary tracing only.",null):n==="\\b"?{type:"assertion",raw:n,start:r,end:i,kind:"word-boundary"}:n==="\\B"?{type:"assertion",raw:n,start:r,end:i,kind:"non-word-boundary"}:{type:"token",raw:n,start:r,end:i}}if(t==="^"){e.index+=1;const n=e.index;return{type:"assertion",raw:"^",start:r,end:n,kind:"start"}}if(t==="$"){e.index+=1;const n=e.index;return{type:"assertion",raw:"$",start:r,end:n,kind:"end"}}e.index+=1;const a=e.index;return{type:"token",raw:t,start:r,end:a}}function Pt(e){const r=e.index;e.index+=1;let t="group";if(e.source[e.index]==="?"){const i=e.source[e.index+1];if(i===":")t="group",e.index+=2;else if(i==="="||i==="!"){const d=Ke(e.source,r);e.index=r+d.length;const u=e.index;return{type:"assertion",raw:d,start:r,end:u,kind:i==="="?"lookahead":"negative-lookahead"}}else if(i==="<"){const d=e.source[e.index+2];if(d==="="||d==="!"){const f=Ke(e.source,r);e.index=r+f.length;const x=e.index;return{type:"assertion",raw:f,start:r,end:x,kind:d==="="?"lookbehind":"negative-lookbehind"}}const u=e.source.indexOf(">",e.index+2);if(u===-1)return e.error="Unterminated named group.",null;t=`group ${e.source.slice(e.index+2,u).trim()||"value"}`,e.index=u+1}else return e.unsupportedNote="Extended group modifiers use summary tracing only.",null}const a=et(e,")");if(e.source[e.index]!==")")return e.error="Unterminated group.",null;e.index+=1;const n=e.index;return{type:"group",raw:e.source.slice(r,n),start:r,end:n,label:t,child:a}}function It(e,r){const t={steps:[],exhausted:!1,push(a,n,i,d=[],u=null){return t.steps.length>=e?(t.exhausted=!0,!1):(t.steps.push({kind:a,message:n,cursor:Math.max(0,Math.min(r,i)),ranges:Bt(d,r),patternRange:u?{start:u.start,end:u.end}:null}),!0)}};return t}function jt(e,r,t,a,n){const i=r[t]??"∅",d=t<r.length?[{start:t,end:t+1,state:"attempt"}]:[];n.push("scan",`Scanning from index ${t}. Current character: ${Le(i)}.`,t,d,e?{start:e.start,end:e.end}:null);const u=n.steps.length-1,f=n.steps.length,x=ce(e,t,{text:r,flags:a,start:t,trace:n});return x.success||n.exhausted?x:x.cursor===t&&n.steps.length===f?(n.steps[u].message=`${n.steps[u].message} ${x.message}`,x):(n.push("release",x.message,x.cursor,Y(t,x.failureEnd??Math.max(t+1,x.cursor),"fail"),e?{start:e.start,end:e.end}:null),x)}function ce(e,r,t){return e?t.trace.exhausted?J(r,"Trace reached the current step limit.",r):e.type==="sequence"?Te(e.items,0,r,t):e.type==="alternation"?Ft(e.options,r,t):e.type==="group"?ce(e.child,r,t):e.type==="quantifier"?Me(e,[{type:"sequence-placeholder"}],0,r,t,0):e.type==="assertion"?Dt(e,r,t):e.type==="token"?Ot(e,r,t):J(r,"Unknown trace node type.",r):J(r,"Trace node is missing.",r)}function Te(e,r,t,a){if(r>=e.length)return{success:!0,cursor:t};const n=e[r];if(n.type==="quantifier")return Me(n,e,r,t,a,0);const i=ce(n,t,a);return i.success?Te(e,r+1,i.cursor,a):i}function Ft(e,r,t){let a=J(r,`No branch matched at index ${r}.`,Math.min(t.text.length,r+1));for(let n=0;n<e.length;n+=1){const i=e[n];t.trace.push("branch",`Trying branch ${n+1} of ${e.length}: ${i.raw||"(empty)"}.`,r,Y(t.start,r,"attempt"),{start:i.start,end:i.end});const d=ce(i,r,t);if(d.success)return d;a=d,n<e.length-1&&!t.trace.exhausted&&t.trace.push("release",`Branch ${n+1} failed. ${d.message}`,d.cursor,Y(t.start,d.failureEnd??Math.max(t.start+1,d.cursor),"fail"),{start:i.start,end:i.end})}return a}function Me(e,r,t,a,n,i=0){const d=Math.max(e.min,Number.isFinite(e.max)?e.max:Math.max(0,n.text.length-a));if(e.mode==="lazy"){let u=null;if(i>=e.min){const x=r[t+1]?Te(r,t+1,a,n):{success:!0,cursor:a};if(x.success)return x;u=x}if(i>=d)return u||J(a,Ee(e.atom.raw,a,n.text),Math.min(n.text.length,a+1));const f=ce(e.atom,a,n);return f.success?f.cursor===a?J(a,`${e.raw} cannot repeat a zero-width token in step tracing.`,a):(i>=e.min&&n.trace.push("branch",`Expanded ${e.raw} to ${i+1} repetition${i+1===1?"":"s"}.`,f.cursor,Y(n.start,f.cursor,"attempt"),{start:e.start,end:e.end}),Me(e,r,t,f.cursor,n,i+1)):u||f}if(i<d){const u=ce(e.atom,a,n);if(u.success){if(u.cursor===a)return J(a,`${e.raw} cannot repeat a zero-width token in step tracing.`,a);const f=Me(e,r,t,u.cursor,n,i+1);if(f.success||(i+1>=e.min&&!n.trace.exhausted&&n.trace.push("branch",`Backtracked ${e.raw} to ${i} repetition${i===1?"":"s"}.`,a,Y(n.start,a,"attempt"),{start:e.start,end:e.end}),i<e.min))return f}else if(i<e.min)return u}return i>=e.min?r[t+1]?Te(r,t+1,a,n):{success:!0,cursor:a}:J(a,Ee(e.atom.raw,a,n.text),Math.min(n.text.length,a+1))}function Dt(e,r,t){return Vt(e,r,t.text,t.flags)?(t.trace.push("assert",Ht(e,r,t.text,t.flags),r,Y(t.start,r,"attempt"),{start:e.start,end:e.end}),{success:!0,cursor:r}):J(r,`${e.raw} failed at index ${r}.`,Math.min(t.text.length,r+1))}function Ot(e,r,t){const a=Gt(e.raw,t.text,r,t.flags);if(!a)return J(r,Ee(e.raw,r,t.text),Math.min(t.text.length,r+1));const n=r+a.length;return t.trace.push("match",`${rt(e)} matched ${Le(a)} at index ${r}.`,n,Y(t.start,n,"attempt"),{start:e.start,end:e.end}),{success:!0,cursor:n}}function Gt(e,r,t,a){try{const i=new RegExp(`^(?:${e})`,a).exec(r.slice(t));return(i==null?void 0:i[0])||""}catch{return""}}function zt(e,r,t){if(r<=0)return 0;const a=tt(e[r-1]);return t.push("skip",`Skipped ${r} earlier match${r===1?"":"es"} to focus on match ${r+1}.`,a,[]),a}function tt(e){return e?e.end>e.index?e.end:e.index+1:0}function J(e,r,t=e){return{success:!1,cursor:e,message:r,failureEnd:Math.max(e,t)}}function Ee(e,r,t){return`Expected ${rt({raw:e})} at index ${r} but found ${Le(t[r]??"∅")}.`}function Y(e,r,t="attempt"){if(!Number.isFinite(e)||!Number.isFinite(r))return[];const a=Math.max(0,Math.min(e,r)),n=Math.max(0,Math.max(e,r));return n>a?[{start:a,end:n,state:t}]:[]}function Bt(e,r){return(e||[]).map(t=>({start:Math.max(0,Math.min(r,t.start)),end:Math.max(0,Math.min(r,t.end)),state:t.state||"attempt"})).filter(t=>t.end>t.start)}function rt(e){const r=String((e==null?void 0:e.raw)||"");return r?r==="."?".":r.startsWith("[")||r.startsWith("\\")||r.startsWith("(?")?r:JSON.stringify(r):"token"}function Le(e){return JSON.stringify(e)}function Ht(e,r,t,a){return e.kind==="word-boundary"?`${e.raw} matched a word boundary at index ${r}.`:e.kind==="non-word-boundary"?`${e.raw} matched a non-word boundary at index ${r}.`:e.kind==="start"?`^ matched the start condition at index ${r}${a.includes("m")?" under multiline rules":""}.`:e.kind==="end"?`$ matched the end condition at index ${r}${a.includes("m")?" under multiline rules":""}.`:e.kind==="lookahead"?`${e.raw} passed at index ${r}.`:e.kind==="negative-lookahead"?`${e.raw} passed at index ${r}.`:e.kind==="lookbehind"?`${e.raw} passed at index ${r}.`:e.kind==="negative-lookbehind"?`${e.raw} passed at index ${r}.`:`${e.raw} passed at index ${r}.`}function Vt(e,r,t,a){if(e.kind==="word-boundary"||e.kind==="non-word-boundary"){const n=_e(t[r-1]||"",a),i=_e(t[r]||"",a),d=n!==i;return e.kind==="word-boundary"?d:!d}return e.kind==="start"?r===0||a.includes("m")&&Ue(t[r-1]||""):e.kind==="end"?r===t.length||a.includes("m")&&Ue(t[r]||""):e.kind==="lookahead"||e.kind==="negative-lookahead"?Ve(e.raw,r,t,a,"prefix"):e.kind==="lookbehind"||e.kind==="negative-lookbehind"?Ve(e.raw,r,t,a,"suffix"):!1}function Ve(e,r,t,a,n){try{const i=n==="prefix"?t.slice(r):t.slice(0,r),d=n==="prefix"?`^(?:${e})`:`(?:${e})$`;return new RegExp(d,a).test(i)}catch{return!1}}function _e(e,r){if(!e)return!1;try{return new RegExp("^\\w$",r).test(e)}catch{return/[A-Za-z0-9_]/.test(e)}}function Ue(e){return e===`
`||e==="\r"||e==="\u2028"||e==="\u2029"}function Ke(e,r){let t=0,a=!1,n=!1;for(let i=r;i<e.length;i+=1){const d=e[i];if(n){n=!1;continue}if(d==="\\"){n=!0;continue}if(a){d==="]"&&(a=!1);continue}if(d==="["){a=!0;continue}if(d==="("&&(t+=1),d===")"&&(t-=1,t===0))return e.slice(r,i+1)}return e.slice(r)}function _t(e,r){const t=e[r+1];if(!t)return"\\";if((t==="p"||t==="P"||t==="u")&&e[r+2]==="{"){const a=e.indexOf("}",r+3);return a===-1?e.slice(r,r+2):e.slice(r,a+1)}if(t==="k"&&(e[r+2]==="<"||e[r+2]==="'")){const a=e[r+2]==="<"?">":"'",n=e.indexOf(a,r+3);return n===-1?e.slice(r,r+2):e.slice(r,n+1)}return t==="c"?e.slice(r,Math.min(e.length,r+3)):e.slice(r,Math.min(e.length,r+2))}function Ut(e,r){let t=r+1,a=!1;for(;t<e.length;){const n=e[t];if(a)a=!1;else if(n==="\\")a=!0;else if(n==="]")return{raw:e.slice(r,t+1),endIndex:t+1};t+=1}return{error:"Unterminated character class."}}function Kt(e,r){const t=e[r];if(!t)return{value:{min:1,max:1,mode:"greedy"},endIndex:r};if(t==="?")return ye(e,r+1,{min:0,max:1,mode:"greedy"});if(t==="*")return ye(e,r+1,{min:0,max:Number.MAX_SAFE_INTEGER,mode:"greedy"});if(t==="+")return ye(e,r+1,{min:1,max:Number.MAX_SAFE_INTEGER,mode:"greedy"});if(t==="{"){const a=e.indexOf("}",r);if(a===-1)return{value:{min:1,max:1,mode:"greedy"},endIndex:r};const n=e.slice(r+1,a),[i,d]=n.split(","),u=Number.parseInt(i,10),f=d===void 0||d===""?n.includes(",")?Number.MAX_SAFE_INTEGER:u:Number.parseInt(d,10);return Number.isNaN(u)||Number.isNaN(f)?{value:{min:1,max:1,mode:"greedy"},endIndex:r}:ye(e,a+1,{min:u,max:f,mode:"greedy"})}return{value:{min:1,max:1,mode:"greedy"},endIndex:r}}function ye(e,r,t){const a=e[r];return a==="?"?{value:{...t,mode:"lazy"},endIndex:r+1}:a==="+"?{value:{...t,mode:"possessive"},endIndex:r+1}:{value:t,endIndex:r}}function Wt(e,r){const t=e.match(/\b([A-Z]{2,})-(\d{2,})\b/);if(t){const n=t[1],i=t[2].length;return{pattern:`\\b${n}-\\d{${i}}\\b`,flags:"g",explanation:`Matches identifiers that begin with ${n}- followed by ${i} digits.`,rationale:["Detected a concrete uppercase identifier example in the provided text.","Specialized the draft around the observed prefix and digit width."],confidence:"high"}}const a=[{regex:/\b[A-Z]{2,}-\d{2,}\b/,pattern:"\\b[A-Z]{2,}-\\d{2,}\\b",explanation:"Matches uppercase prefixes followed by a hyphen and digits."},{regex:/\b\d{4}-\d{2}-\d{2}\b/,pattern:"\\b\\d{4}-\\d{2}-\\d{2}\\b",explanation:"Matches ISO-style dates."},{regex:/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b/,pattern:"\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b",explanation:"Matches UUID values."},{regex:/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,pattern:"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",explanation:"Matches email addresses."},{regex:/https?:\/\/\S+/i,pattern:"https?:\\/\\/\\S+",explanation:"Matches URLs that begin with http or https."}];for(const n of a)if(n.regex.test(e))return{pattern:n.pattern,flags:"g",explanation:n.explanation,rationale:["Detected concrete examples in the provided text.","Drafted a pattern around the repeated structure."],confidence:"medium"};return r.includes("email")?{pattern:V.email.pattern,flags:V.email.flags,explanation:"Matches standard email-like identifiers.",rationale:["The request explicitly mentions email addresses."],confidence:"medium"}:r.includes("url")||r.includes("link")?{pattern:V.url.pattern,flags:V.url.flags,explanation:"Matches web links that start with http or https.",rationale:["The request explicitly mentions URLs or links."],confidence:"medium"}:r.includes("uuid")?{pattern:V.uuid.pattern,flags:V.uuid.flags,explanation:"Matches UUID values across common versions.",rationale:["The request explicitly mentions UUIDs."],confidence:"medium"}:r.includes("date")?{pattern:V.date.pattern,flags:V.date.flags,explanation:"Matches ISO-style dates.",rationale:["The request explicitly mentions dates."],confidence:"medium"}:r.includes("hashtag")?{pattern:V.hashtag.pattern,flags:V.hashtag.flags,explanation:"Matches hashtag-like identifiers.",rationale:["The request explicitly mentions hashtags."],confidence:"medium"}:r.includes("invoice")||r.includes("ticket")||r.includes("id")?{pattern:"\\b[A-Z]{2,}-\\d{2,}\\b",flags:"g",explanation:"Matches uppercase codes followed by a hyphen and digits.",rationale:["The request suggests structured identifiers."],confidence:"low"}:r.includes("number")||r.includes("digit")?{pattern:"\\d+",flags:"g",explanation:"Matches one or more digits.",rationale:["The request mentions numbers or digits."],confidence:"low"}:{pattern:".+",flags:"g",explanation:"Fallback draft that matches non-empty spans. Refine it with block controls or a sample.",rationale:["No strong structural cues were found in the request."],confidence:"low"}}function Se(e){return!e||typeof e!="object"?null:qe({pattern:String(e.pattern||""),flags:F(e.flags||"g")||"g",explanation:String(e.explanation||""),sample:String(e.sample||""),rationale:Array.isArray(e.rationale)?e.rationale.map(r=>String(r)):[],confidence:String(e.confidence||"medium")})}function qe(e){return e?{pattern:Ne(e.pattern||""),flags:F(e.flags||"g")||"g",explanation:We(e.explanation||"",8),sample:String(e.sample||""),rationale:(Array.isArray(e.rationale)?e.rationale:[]).map(r=>We(r,8)).filter(Boolean).slice(0,2),confidence:String(e.confidence||"medium")}:null}function me(e,r){var t;return!(e!=null&&e.pattern)&&!(r!=null&&r.pattern)?null:qe({pattern:(e==null?void 0:e.pattern)||(r==null?void 0:r.pattern)||"",flags:(e==null?void 0:e.flags)||(r==null?void 0:r.flags)||"g",explanation:(e==null?void 0:e.explanation)||(r==null?void 0:r.explanation)||"",sample:(e==null?void 0:e.sample)||(r==null?void 0:r.sample)||"",rationale:(t=e==null?void 0:e.rationale)!=null&&t.length?e.rationale:(r==null?void 0:r.rationale)||[],confidence:(e==null?void 0:e.confidence)||(r==null?void 0:r.confidence)||"medium"})}function Jt(e){const t=String(e||"").trim().match(/^(\\?\/)(.+)(\\?\/)([dgimsuvy]*)$/s);if(!t)return null;const[,,a,,n]=t;try{const i=Ne(a);return Q(i,n),{pattern:i,flags:F(n)||"g"}}catch{return null}}function Zt(e){const r=[String(e||"").trim(),String(e||"").trim().replace(/^pattern\s*[:=]\s*/i,"").trim(),String(e||"").trim().replace(/^["'`]|["'`]$/g,"").trim(),String(e||"").trim().split(`
`).map(t=>t.trim()).find(Boolean)||""];for(const t of r)if(!(!t||t.startsWith("{")||t.includes('"flags"')||t.includes('"pattern"')))try{const a=Ne(t);return Q(a,"g"),a}catch{}return null}function Ne(e){let r=String(e||"").trim();if(r.startsWith("/")&&r.endsWith("/")||r.startsWith("\\/")&&r.endsWith("\\/")){const t=r.startsWith("\\/")?2:1,a=r.endsWith("\\/")?-2:-1,n=r.slice(t,a);try{Q(n,"g"),r=n}catch{}}return Yt(r)}function We(e,r){return String(e||"").trim().split(/\s+/).filter(Boolean).slice(0,r).join(" ")}function h(e,r,t,a,n,i,d=[],u=null){return{id:e,category:r,label:t,token:a,detail:n,engine:i,fields:d,configurable:d.length>0,build:u}}function Qt(e){return String(e).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Je(e){return String(e||"").replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^")}function Ze(e){return String(e||"value").trim().replace(/[^\p{L}\p{N}_$]+/gu,"_").replace(/^[^A-Za-z_$]+/,"")||"value"}function ke(e,r){const t=Number.parseInt(e,10);return!Number.isFinite(t)||t<0?r:t}function Yt(e){const r=String(e||"");if(!r.includes("\\\\"))return r;try{return JSON.parse(`"${r.replace(/"/g,'\\"')}"`)}catch{return r}}function Xt(){return Object.entries(V)}function oe(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function er(e,r){if(!r.length)return oe(e);let t=0,a="";return r.forEach(n=>{a+=oe(e.slice(t,n.index)),a+=`<mark>${oe(n.value)}</mark>`,t=n.end}),a+=oe(e.slice(t)),a.replace(/\n/g,"<br>")}let g=null,U=null,w=null,S=null,Ae=[],D={trace:null,currentStep:0},_=0;const tr=[["email","Email"],["url","URL"],["uuid","UUID"],["date","Date"],["hashtag","Hashtag"]],H={pattern:"\\b\\d{4}-\\d{2}-\\d{2}\\b",flags:"g",input:mt,replacement:"[$MATCH]",replacementFields:{},snippets:[],activeTab:"test",blockQuery:"",selectedBlockId:"",aiModel:Qe["code-fast"],aiTemp:"0.1",aiMaxTokens:"48",aiDescription:"Match invoice IDs like INV-1042.",aiSample:"Open INV-1042 and INV-2201 before noon.",traceFilters:["branch","release","match","complete","skip"]};async function cr(e){g=document.createElement("div"),g.className="tool-regex",g.innerHTML=`
    <div class="card rj-layout regex-studio-shell">
      <div class="regex-studio-top">
        <div class="tabs-header regex-tab-strip">
          <button class="tab-btn active" data-regex-tab="test">Test</button>
          <button class="tab-btn" data-regex-tab="debug">Debug</button>
          <button class="tab-btn" data-regex-tab="create">Create</button>
          <button class="tab-btn" data-regex-tab="replace">Replace</button>
        </div>
        <div class="regex-studio-actions">
          <button id="btn-regex-open-preset-library" class="btn-secondary">Preset Library</button>
          <button id="btn-save-snippet">Save Snippet</button>
          <button id="btn-copy-js" class="btn-secondary">Copy JS</button>
          <button id="btn-copy-regex" class="btn-secondary">Copy Regex</button>
        </div>
      </div>

      <div class="form-group regex-pattern-group">
        <div class="regex-section-head">
          <label>Pattern</label>
          <div class="regex-section-tools">
            <button id="btn-regex-open-breakdown" class="btn-secondary regex-inline-button">Breakdown</button>
            <div id="regex-status" class="regex-status-text regex-status-inline" data-tone="muted">Ready.</div>
          </div>
        </div>
        <div class="regex-pattern-shell">
          <span class="regex-pattern-edge">/</span>
          <input type="text" id="regex-pattern" placeholder="[a-z]+" class="regex-pattern-input">
          <span class="regex-pattern-edge">/</span>
          <button type="button" id="regex-flags" class="regex-flag-button" data-value="">No flags</button>
        </div>
      </div>

      <div class="settings-grid regex-hero-grid">
        <div class="form-group regex-grow-pane">
          <label>Test String</label>
          <textarea id="regex-input" class="regex-textarea-large"></textarea>
        </div>
      </div>

      <div id="regex-tab-test" class="regex-tab-panel">
        <div class="regex-toolbar">
          <label class="regex-toolbar-label">Highlighted Matches</label>
          <div class="regex-toolbar-actions regex-toolbar-actions-tight">
            <button id="btn-prev-match" class="btn-secondary">Prev</button>
            <div id="regex-match-meta" class="regex-toolbar-meta">0 / 0</div>
            <button id="btn-next-match" class="btn-secondary">Next</button>
          </div>
        </div>
        <div id="regex-highlighted" class="regex-surface regex-highlight-surface regex-surface-code regex-surface-short"></div>
        <div class="form-group">
          <label>Matches</label>
          <div id="regex-results" class="regex-surface regex-results-surface regex-surface-code regex-surface-tall"></div>
        </div>
      </div>

      <div id="regex-tab-debug" class="regex-tab-panel hidden">
        <div class="regex-debug-main">
          <div class="regex-debug-sticky-bar">
            <div class="regex-step-toolbar">
              <div class="regex-step-controls">
                <button id="btn-regex-step-prev" class="btn-secondary">Back</button>
                <div id="regex-debug-step-meta" class="regex-step-meta">0 / 0</div>
                <button id="btn-regex-step-next" class="btn-secondary">Next</button>
              </div>
              <div id="regex-debug-status" class="regex-toolbar-status">Ready.</div>
            </div>
            <div class="regex-debug-filter-bar">
              <div class="regex-filter-group" id="regex-trace-filter-group">
                <label class="regex-filter-pill"><input type="checkbox" value="scan"> <span>Scan</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="branch"> <span>Branch</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="release"> <span>Release</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="assert"> <span>Assert</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="match"> <span>Match</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="complete"> <span>Complete</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="skip"> <span>Skip</span></label>
              </div>
            </div>
            <div class="regex-slider-container">
              <input type="range" id="regex-debug-slider" min="0" max="0" step="1" value="0" class="regex-step-slider">
            </div>
          </div>

          <div class="regex-debug-content">
            <div class="form-group">
              <label>Live Pattern</label>
              <div id="regex-debug-pattern" class="regex-surface regex-debug-pattern-view"></div>
            </div>

            <div class="form-group">
              <label>Sample Walkthrough</label>
              <div id="regex-debug-preview" class="regex-debug-preview"></div>
            </div>

            <div class="form-group regex-debug-trace-group">
              <label>Step By Step Trace</label>
              <div id="regex-debug-trace" class="regex-trace-list"></div>
            </div>
          </div>
        </div>
      </div>


      <div id="regex-tab-create" class="regex-tab-panel hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>AI Builder Goal</label>
            <textarea id="regex-ai-description" class="regex-textarea-medium"></textarea>
          </div>
          <div class="form-group">
            <label>Sample Text</label>
            <textarea id="regex-ai-sample" class="regex-textarea-medium"></textarea>
          </div>
        </div>
        <div class="regex-ai-toolbar">
          <div class="regex-ai-toolbar-actions">
            <button id="btn-regex-ai-setup" class="btn-secondary">AI Engine</button>
            <button id="btn-regex-ai-run">Build Pattern</button>
            <button id="btn-regex-ai-heuristic" class="btn-secondary">Quick Draft</button>
            <button id="btn-regex-ai-apply" class="btn-secondary">Apply Pattern</button>
          </div>
          <div id="regex-ai-engine-tag" class="ai-widget-chip regex-ai-engine-tag">ENGINE: OFFLINE</div>
        </div>
        <div id="regex-ai-config-panel" class="hidden ai-widget-panel ai-widget-config-panel">
          <div class="settings-grid">
            <div class="form-group">
              <label>Model</label>
              <select id="regex-ai-model">
                ${Object.entries(ee).filter(([s,l])=>l.tasks.includes("code-fast")||l.tasks.includes("code")||l.tasks.includes("text")).map(([s,l])=>`<option value="${s}" ${s===Qe["code-fast"]?"selected":""}>${l.id} (${l.size})</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Model Info</label>
              <div id="regex-ai-model-info" class="regex-pane"></div>
            </div>
          </div>
          <div class="regex-ai-config-divider">
            <div class="settings-grid">
              <div class="form-group">
                <label>Temperature</label>
                <input type="number" id="regex-ai-temp" value="${H.aiTemp}" step="0.05" min="0" max="1">
              </div>
              <div class="form-group">
                <label>Max Tokens</label>
                <input type="number" id="regex-ai-max-tokens" value="${H.aiMaxTokens}" min="16" max="256" step="8">
              </div>
            </div>
          </div>
          <div class="regex-ai-config-actions">
            <button id="btn-regex-ai-cancel" class="btn-secondary">Close</button>
            <button id="btn-regex-ai-activate">Activate Engine</button>
          </div>
        </div>
        <div id="regex-ai-progress-host" class="ai-widget-progress-host regex-ai-progress-host"></div>
        <div id="regex-ai-thinking-zone" class="hidden ai-widget-panel ai-widget-thinking-panel">
          <div class="ai-widget-panel-kicker">Thinking Stream</div>
          <div id="regex-ai-thinking-content" class="ai-widget-thinking-content"></div>
        </div>
        <div class="regex-ai-subnav">
          <div class="tabs-header regex-ai-view-tabs">
            <button class="tab-btn active" data-regex-ai-view="draft">Draft</button>
            <button class="tab-btn" data-regex-ai-view="console">Console</button>
          </div>
          <div id="regex-ai-status" class="regex-status-text" data-tone="muted">Local builder idle.</div>
        </div>
        <div id="regex-ai-view-draft" class="regex-ai-view">
          <div class="form-group">
            <label>Pattern Draft</label>
            <div id="regex-ai-output" class="regex-pane ai-widget-panel ai-widget-output-panel"></div>
          </div>
        </div>
        <div id="regex-ai-view-console" class="regex-ai-view hidden">
          <div id="regex-ai-console" class="regex-pane ai-widget-console regex-console-pane"></div>
          <button id="btn-regex-ai-clear-console" class="btn-secondary regex-console-clear">Clear Console</button>
        </div>
        <div class="form-group">
          <label>Block Library</label>
          <div class="regex-toolbar regex-block-toolbar">
            <select id="regex-block-category" class="regex-block-filter">
              <option value="">All Categories</option>
              ${[...new Set(xe.map(s=>s.category))].sort().map(s=>`<option value="${s}">${s.replace(/^[a-z]/,l=>l.toUpperCase())}</option>`).join("")}
            </select>
            <input type="text" id="regex-block-search" class="regex-block-search" placeholder="Filter blocks by label, token, or engine">
            <div id="regex-block-meta" class="regex-toolbar-status">Drag into the pattern field or click to append.</div>
          </div>
          <div id="regex-block-grid" class="regex-block-grid"></div>
        </div>
      </div>

      <div id="regex-tab-replace" class="regex-tab-panel hidden">
        <div class="settings-grid regex-replace-layout">
          <div class="form-group regex-grow-pane">
            <div class="regex-section-head">
              <label>Replacement Inputs</label>
              <div id="regex-replace-template" class="regex-toolbar-status">Template: $MATCH</div>
            </div>
            <div id="regex-replacement-builder" class="regex-replace-grid"></div>
          </div>
          <div class="form-group regex-side-card">
            <label>Replacement Summary</label>
            <div id="regex-replace-meta" class="regex-status-text regex-replace-meta" data-tone="muted">No replacement yet.</div>
          </div>
        </div>
        <div class="form-group">
          <label>Replacement Preview</label>
          <textarea id="regex-replacement-output" class="regex-replace-output regex-textarea-large" readonly></textarea>
        </div>
      </div>

      <div id="regex-preset-library" class="regex-preset-library hidden">
        <div class="regex-preset-dialog">
          <div class="regex-preset-dialog-head">
            <div class="regex-preset-dialog-copy">
              <strong>Preset Library</strong>
              <div class="regex-preset-dialog-note">Common starters and saved snippets in one place.</div>
            </div>
            <button id="btn-regex-close-preset-library" class="btn-secondary">Close</button>
          </div>
          <div class="regex-modal-stack">
            <div class="regex-modal-section">
              <div class="regex-modal-section-head">
                <strong>Starter Patterns</strong>
              </div>
              <div id="regex-create-grid" class="regex-card-grid regex-preset-grid"></div>
            </div>
            <div class="regex-modal-section">
              <div class="regex-modal-section-head">
                <strong>Saved Snippets</strong>
              </div>
              <div id="regex-saved-snippets" class="regex-card-grid"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="regex-breakdown-modal" class="regex-modal hidden">
        <div class="regex-modal-card">
          <div class="regex-modal-head">
            <div>
              <strong>Pattern Breakdown</strong>
            </div>
            <button id="btn-regex-close-breakdown" class="btn-secondary">Close</button>
          </div>
          <div id="regex-explain" class="regex-auto-grid regex-explain-compact"></div>
        </div>
      </div>

      <div id="regex-flags-modal" class="regex-modal hidden">
        <div class="regex-modal-card">
          <div class="regex-modal-head">
            <div>
              <strong>Flags</strong>
            </div>
            <button id="btn-regex-close-flags" class="btn-secondary">Close</button>
          </div>
          <div id="regex-flag-matrix" class="regex-flag-grid"></div>
        </div>
      </div>

      <div id="regex-block-builder-modal" class="regex-modal hidden">
        <div class="regex-modal-card regex-block-builder-card">
          <div class="regex-modal-head">
            <div>
              <strong>Block Builder</strong>
            </div>
            <button id="btn-regex-close-block-builder" class="btn-secondary">Close</button>
          </div>
          <div id="regex-block-builder" class="regex-pane regex-builder-pane"></div>
        </div>
      </div>
    </div>
  `,e.appendChild(g),U=ct(ot,"regex-suite",H,{debounceMs:120});const r=U.getSnapshot(),t={pattern:g.querySelector("#regex-pattern"),flags:g.querySelector("#regex-flags"),input:g.querySelector("#regex-input"),results:g.querySelector("#regex-results"),highlighted:g.querySelector("#regex-highlighted"),matchMeta:g.querySelector("#regex-match-meta"),status:g.querySelector("#regex-status"),explanation:g.querySelector("#regex-explain"),debugPreview:g.querySelector("#regex-debug-preview"),debugTrace:g.querySelector("#regex-debug-trace"),debugPattern:g.querySelector("#regex-debug-pattern"),debugSlider:g.querySelector("#regex-debug-slider"),flagMatrix:g.querySelector("#regex-flag-matrix"),createGrid:g.querySelector("#regex-create-grid"),savedSnippets:g.querySelector("#regex-saved-snippets"),replacementBuilder:g.querySelector("#regex-replacement-builder"),replacementOutput:g.querySelector("#regex-replacement-output"),replacementMeta:g.querySelector("#regex-replace-meta"),replacementTemplate:g.querySelector("#regex-replace-template"),presetLibrary:g.querySelector("#regex-preset-library"),breakdownModal:g.querySelector("#regex-breakdown-modal"),flagsModal:g.querySelector("#regex-flags-modal"),blockSearch:g.querySelector("#regex-block-search"),blockCategory:g.querySelector("#regex-block-category"),blockMeta:g.querySelector("#regex-block-meta"),blockGrid:g.querySelector("#regex-block-grid"),blockBuilder:g.querySelector("#regex-block-builder"),blockBuilderModal:g.querySelector("#regex-block-builder-modal"),aiModel:g.querySelector("#regex-ai-model"),aiModelInfo:g.querySelector("#regex-ai-model-info"),aiTemp:g.querySelector("#regex-ai-temp"),aiMaxTokens:g.querySelector("#regex-ai-max-tokens"),aiDescription:g.querySelector("#regex-ai-description"),aiSample:g.querySelector("#regex-ai-sample"),aiStatus:g.querySelector("#regex-ai-status"),aiOutput:g.querySelector("#regex-ai-output"),aiConsole:g.querySelector("#regex-ai-console"),aiEngineTag:g.querySelector("#regex-ai-engine-tag"),aiConfigPanel:g.querySelector("#regex-ai-config-panel"),aiProgressHost:g.querySelector("#regex-ai-progress-host"),aiThinkingZone:g.querySelector("#regex-ai-thinking-zone"),aiThinkingContent:g.querySelector("#regex-ai-thinking-content"),stepPrev:g.querySelector("#btn-regex-step-prev"),stepNext:g.querySelector("#btn-regex-step-next"),stepMeta:g.querySelector("#regex-debug-step-meta"),debugStatus:g.querySelector("#regex-debug-status"),traceFilterGroup:g.querySelector("#regex-trace-filter-group")},a=(s,l="muted")=>{t.aiStatus.textContent=s,q(t.aiStatus,l)};t.pattern.value=r.pattern,t.input.value=r.input,t.blockSearch.value=r.blockQuery||"",t.aiModel.value=r.aiModel||H.aiModel,t.aiTemp.value=r.aiTemp||H.aiTemp,t.aiMaxTokens.value=r.aiMaxTokens||H.aiMaxTokens,t.aiDescription.value=r.aiDescription||H.aiDescription,t.aiSample.value=r.aiSample||H.aiSample;const n=new Set(r.traceFilters||H.traceFilters);t.traceFilterGroup.querySelectorAll("input").forEach(s=>{s.checked=n.has(s.value)}),S={streamed:"",suggestion:te(t.aiDescription.value,t.aiSample.value),activeModelKey:null,isGenerating:!1,activeView:"draft"};let i=r.selectedBlockId||"",d=y(r.replacementFields,r.replacement),u=null,f=null,x=null,$=null;const M=s=>{U.save(s).catch(()=>{})},q=(s,l="muted")=>{s&&(s.dataset.tone=l)},b=(s,l="muted")=>`
    <div class="regex-empty-state" data-tone="${O(l)}">${v(s)}</div>
  `;function y(s,l){const o=s&&typeof s=="object"?{...s}:{};return!Object.keys(o).length&&l&&(o.match=String(l)),o}const m=()=>F(t.flags.dataset.value||""),p=()=>new Set(Array.from(t.traceFilterGroup.querySelectorAll("input")).filter(s=>s.checked).map(s=>s.value)),E=(s=D.trace)=>{const l=p();return((s==null?void 0:s.steps)||[]).filter(o=>l.has(o.kind))},N=s=>{const l=F(s);return t.flags.dataset.value=l,t.flags.textContent=l||"No flags",t.flags.classList.toggle("is-empty",!l),l},C=s=>{const l=Ye(s);return l.length?l.map(o=>({key:String(o.index),label:o.token,hint:o.name?`<${o.name}>`:`Group ${o.index}`,value:Object.prototype.hasOwnProperty.call(d,o.index)?String(d[o.index]??""):Object.prototype.hasOwnProperty.call(d,String(o.index))?String(d[String(o.index)]??""):o.token})):[{key:"match",label:"$MATCH",hint:"Full match",value:Object.prototype.hasOwnProperty.call(d,"match")?String(d.match??""):"$MATCH"}]},K=s=>{const l=C(s);return l.length?{mode:"groups",groups:l.reduce((o,c)=>(o[c.key]=c.value,o),{})}:{mode:"groups",groups:{match:"$MATCH"}}},re=s=>{const l=C(s);t.replacementBuilder.dataset.signature=l.map(o=>o.key).join("|"),t.replacementBuilder.innerHTML=l.map(o=>`
      <label class="regex-replace-field">
        <span class="regex-replace-token">${v(o.label)}</span>
        <span class="regex-replace-hint">${v(o.hint)}</span>
        <input
          type="text"
          data-regex-replacement-group="${O(o.key)}"
          value="${O(o.value)}"
          placeholder="${O(o.label)}"
        >
      </label>
    `).join(""),t.replacementBuilder.querySelectorAll("[data-regex-replacement-group]").forEach(o=>{o.addEventListener("input",()=>{d[o.dataset.regexReplacementGroup]=o.value,I()})})},ae=s=>{const l=bt(s);t.flagMatrix.innerHTML=l.map(o=>`
      <button
        type="button"
        class="regex-flag-card${o.active?" active":""}"
        data-regex-flag-toggle="${O(o.flag)}"
      >
        <strong>${v(o.flag)}</strong>
        <span>${v(o.label)}</span>
        <small>${v(o.detail)}</small>
      </button>
    `).join(""),t.flagMatrix.querySelectorAll("[data-regex-flag-toggle]").forEach(o=>{o.addEventListener("click",()=>{const c=new Set(m().split("").filter(Boolean)),k=o.dataset.regexFlagToggle;c.has(k)?c.delete(k):c.add(k),N(Array.from(c).join("")),I()})})},Z=()=>{u==null||u.close("tool")},ne=()=>{u==null||u.open("tool")},de=()=>{$==null||$.close("tool")};N(r.flags||H.flags);const ue=s=>{g.querySelectorAll("[data-regex-tab]").forEach(l=>{l.classList.toggle("active",l.dataset.regexTab===s)}),g.querySelectorAll(".regex-tab-panel").forEach(l=>l.classList.add("hidden")),g.querySelector(`#regex-tab-${s}`).classList.remove("hidden"),s!=="create"&&Z(),M({activeTab:s})},he=s=>{const l=Oe(s);l&&(t.pattern.value=l.pattern,N(l.flags),t.input.value=l.sample,M({pattern:l.pattern,flags:l.flags,input:l.sample}),Z(),I())},R=()=>{t.createGrid.innerHTML=tr.map(([s,l])=>{const o=Oe(s);return`
        <button type="button" class="btn-secondary regex-choice-card" data-create-preset="${s}">
          <div class="regex-choice-card-title">${l}</div>
          <div class="regex-choice-card-code">${o.pattern}</div>
        </button>
      `}).join(""),t.createGrid.querySelectorAll("[data-create-preset]").forEach(s=>{s.addEventListener("click",()=>{he(s.dataset.createPreset)})})},X=()=>{const s=Ge(U.getSnapshot().snippets);t.savedSnippets.innerHTML=s.map(l=>`
      <button type="button" class="btn-secondary regex-choice-card regex-snippet-card" data-snippet-id="${l.id}">
        <div class="regex-snippet-head">
          <strong>${v(l.name)}</strong>
          <span class="regex-snippet-kind">${l.builtIn?"Built-in":"Saved"}</span>
        </div>
        <div class="regex-choice-card-code">${v(`/${l.pattern}/${l.flags}`)}</div>
      </button>
    `).join(""),t.savedSnippets.querySelectorAll("[data-snippet-id]").forEach(l=>{l.addEventListener("click",()=>{const o=s.find(c=>c.id===l.dataset.snippetId);o&&(t.pattern.value=o.pattern,N(o.flags),t.input.value=o.sample||t.input.value,M({pattern:o.pattern,flags:o.flags,input:t.input.value}),Z(),I())})})},ge=()=>{const s=String(t.blockSearch.value||"").trim().toLowerCase(),l=t.blockCategory.value,o=xe.filter(c=>l&&c.category!==l?!1:s?`${c.label} ${c.token} ${c.detail} ${c.category}`.toLowerCase().includes(s):!0);i&&!o.some(c=>c.id===i)&&(i="",$==null||$.close("filter")),t.blockMeta.textContent=`${o.length} blocks.`,t.blockGrid.innerHTML=o.map(c=>`
      <div
        class="block-card regex-block-card"
        draggable="true"
        data-active="${c.id===i?"true":"false"}"
        data-regex-block-id="${O(c.id)}"
        data-regex-block-token="${O(c.token)}"
        title="${O(`${c.detail} · ${c.engine}`)}"
      >
        <div class="regex-block-label">${v(c.label)}</div>
        <div class="regex-block-token">${v(c.token)}</div>
        <div class="regex-block-meta">${v(c.category)}</div>
      </div>
    `).join(""),t.blockGrid.querySelectorAll(".regex-block-card").forEach(c=>{const k=c.dataset.regexBlockToken,P=c.dataset.regexBlockId;c.addEventListener("click",()=>{const T=xe.find(A=>A.id===P);if(T){if(T.configurable){i=T.id,M({selectedBlockId:i}),ge(),Ce(),$==null||$.open("tool");return}we(k)}}),c.addEventListener("dragstart",T=>{var A,z;(z=(A=T.dataTransfer)==null?void 0:A.setData)==null||z.call(A,"text/plain",k)})}),i&&Ce()},we=s=>{t.pattern.value=Tt(t.pattern.value,s,t.pattern.selectionStart,t.pattern.selectionEnd),t.pattern.focus();const l=(t.pattern.selectionStart||t.pattern.value.length)+String(s||"").length;typeof t.pattern.setSelectionRange=="function"&&t.pattern.setSelectionRange(l,l),M({pattern:t.pattern.value}),I()},Ce=()=>{const s=xe.find(c=>c.id===i);if(!(s!=null&&s.configurable)){t.blockBuilder.innerHTML="",$==null||$.close("empty");return}t.blockBuilder.innerHTML=`
      <div class="regex-block-builder-head">
        <div class="regex-block-builder-copy">
          <div class="regex-block-builder-kicker">Selected Block</div>
          <strong class="regex-block-builder-title">${v(s.label)}</strong>
          <div class="regex-block-builder-note">${v(s.detail)}</div>
        </div>
        <div class="regex-block-builder-token">${v(s.token)}</div>
      </div>
      <div class="settings-grid">
        ${s.fields.map(c=>`
          <div class="form-group">
            <label>${v(c.label)}</label>
            <input
              type="text"
              data-regex-block-field="${O(c.id)}"
              inputmode="${O(c.inputMode||"text")}"
              placeholder="${O(c.placeholder||"")}"
              value="${O(c.defaultValue||"")}"
            >
          </div>
        `).join("")}
      </div>
      <div class="regex-block-preview-row">
        <div id="regex-block-preview" class="regex-block-preview"></div>
        <div class="regex-block-preview-actions">
          <button type="button" id="btn-regex-block-clear" class="btn-secondary">Close</button>
          <button type="button" id="btn-regex-block-insert">Insert Block</button>
        </div>
      </div>
    `;const l=()=>s.fields.reduce((c,k)=>{var P;return c[k.id]=((P=t.blockBuilder.querySelector(`[data-regex-block-field="${k.id}"]`))==null?void 0:P.value)||k.defaultValue||"",c},{}),o=()=>{const c=De(s.id,l());t.blockBuilder.querySelector("#regex-block-preview").textContent=c};t.blockBuilder.querySelectorAll("[data-regex-block-field]").forEach(c=>{c.addEventListener("input",o)}),t.blockBuilder.querySelector("#btn-regex-block-clear").addEventListener("click",()=>{de()}),t.blockBuilder.querySelector("#btn-regex-block-insert").addEventListener("click",()=>{we(De(s.id,l())),de()}),o()};u=ve(t.presetLibrary,{closeSelectors:["#btn-regex-close-preset-library"]}),f=ve(t.breakdownModal,{closeSelectors:["#btn-regex-close-breakdown"]}),x=ve(t.flagsModal,{closeSelectors:["#btn-regex-close-flags"]}),$=ve(t.blockBuilderModal,{closeSelectors:["#btn-regex-close-block-builder"],onClose(){i&&(i="",M({selectedBlockId:""}),ge())}}),Ae=[u,f,x,$];const ie=(s="")=>{var c,k;const l=s||((c=S.suggestion)==null?void 0:c.pattern)||"",o=((k=S.suggestion)==null?void 0:k.flags)||"g";t.aiOutput.innerHTML=l?`
          <div class="regex-output-stack">
            <div class="regex-output-pattern">/${v(l)}/${v(o)}</div>
            <div class="regex-output-note">${s?"Streaming local pattern draft...":"Ready to apply to pattern and flags."}</div>
          </div>
        `:b("Build a local draft or use a quick draft.")},Re=s=>{var l;S.activeView=s,g.querySelectorAll("[data-regex-ai-view]").forEach(o=>{o.classList.toggle("active",o.dataset.regexAiView===s)}),g.querySelectorAll(".regex-ai-view").forEach(o=>o.classList.add("hidden")),(l=g.querySelector(`#regex-ai-view-${s}`))==null||l.classList.remove("hidden")},be=()=>{var s;t.aiEngineTag.textContent=S.activeModelKey?`ENGINE: ${((s=ee[S.activeModelKey])==null?void 0:s.id)||S.activeModelKey}`:"ENGINE: OFFLINE"};w=gt({modelRegistry:ee,progressHost:t.aiProgressHost,configPanel:t.aiConfigPanel,modelSelect:t.aiModel,modelInfoNode:t.aiModelInfo,consoleNode:t.aiConsole,consoleEmptyMessage:"[INFO] Regex builder console ready.",thinkingPanel:t.aiThinkingZone,thinkingContent:t.aiThinkingContent,initialModelKey:t.aiModel.value,stopLabel:"Stop Build",readyDetail(s){var l;return((l=ee[s])==null?void 0:l.id)||"Local model active."},onProgress(){a("Loading local model...","info")},onReady(s,l){var o;S.activeModelKey=l.state.activeModelKey,be(),a(`Local model ready: ${((o=ee[S.activeModelKey])==null?void 0:o.id)||"builder"}.`,"success")},onAborted(){S.isGenerating=!1,a("Local regex build stopped.","warning")},onThinking(s,l){a(s.state==="start"?"Model is reasoning through the draft…":l.state.visibleText?"Streaming pattern draft…":"Finalizing pattern draft...","info")},onThinkingToken(s,l){a(l.state.visibleText?"Streaming pattern draft…":"Model is reasoning through the draft...","info")},onStream(s){S.streamed=s.text||"",a("Streaming pattern draft...","info"),ie(S.streamed)},resolveCompleteProgress(s){const l=te(t.aiDescription.value,t.aiSample.value),o=Be(s.result,l)||l;return{title:o!=null&&o.pattern?"Pattern ready":"Draft fallback kept",detail:o!=null&&o.pattern?`/${o.pattern}/${o.flags||"g"}`:"Quick draft remained active.",tone:o!=null&&o.pattern?"success":"neutral",autoResetMs:1800}},onComplete(s,l){S.isGenerating=!1,S.activeModelKey=l.state.activeModelKey,be();const o=te(t.aiDescription.value,t.aiSample.value),c=Be(s.result,o)||o;S.streamed="",S.suggestion=c,a(c!=null&&c.pattern?"Local pattern draft ready.":"No pattern parsed. Quick draft kept.",c!=null&&c.pattern?"success":"warning"),ie()},onError(s){S.isGenerating=!1,a(s.message,"danger")},renderModelInfo(s,l){return`<strong>ID:</strong> ${v(s.id)}<br><strong>Size:</strong> ${v(s.size)}<br><strong>Mode:</strong> ${v(s.tasks.includes("code-fast")?"Fast pattern completion":s.desc)}<br><strong>Key:</strong> ${v(l)}`}});const Pe=async()=>{var l;const s=t.aiModel.value||H.aiModel;a(`Loading local model: ${((l=ee[s])==null?void 0:l.id)||s}.`,"info");try{return await w.ensureModel(s),S.activeModelKey=s,be(),!0}catch(o){return a(o.message,"danger"),!1}},Ie=(s,l)=>{if(!l){_=0;return}_=(_+s+l)%l},at=(s,l=null)=>{var j;const o=l||((j=D.trace)==null?void 0:j.steps)||[],c=t.pattern.value||"";if(!o.length||!c){t.debugPattern.innerHTML=b("Inspect the pattern structure in sync with trace steps.");return}const k=o[s];if(!k)return;const P=k.patternRange;if(!P){t.debugPattern.textContent=c;return}const T=c.slice(0,P.start),A=c.slice(P.start,P.end),z=c.slice(P.end);t.debugPattern.innerHTML=`
      <span class="regex-debug-pattern-edge">/</span>
      <span class="regex-debug-pattern-base">${v(T)}</span>
      <span class="regex-debug-pattern-segment">${v(A)}</span>
      <span class="regex-debug-pattern-base">${v(z)}</span>
      <span class="regex-debug-pattern-edge">/</span>
    `},nt=(s,l=null)=>{var j;const o=l||((j=D.trace)==null?void 0:j.steps)||[],c=t.input.value||"";if(!o.length||!c){t.debugPreview.innerHTML=b("Step through the trace to inspect the sample text.");return}const k=o[s];if(!k)return;const P=Math.max(0,Math.min(c.length,Number.isFinite(k.cursor)?k.cursor:0)),T=new Set([0,c.length,P]);(k.ranges||[]).forEach(B=>{T.add(Math.max(0,Math.min(c.length,B.start))),T.add(Math.max(0,Math.min(c.length,B.end)))});const A=Array.from(T).sort((B,L)=>B-L);let z='<div class="regex-debug-line">';for(let B=0;B<A.length-1;B+=1){const L=A[B],le=A[B+1];if(P===L&&(z+='<span class="regex-debug-caret" aria-hidden="true"></span>'),le<=L)continue;const pe=c.slice(L,le),fe=rr(k.ranges||[],L,le);z+=`<span class="regex-debug-segment regex-debug-segment-${O(fe)}">${v(pe).replace(/\n/g,"<br>")}</span>`}P===c.length&&(z+='<span class="regex-debug-caret" aria-hidden="true"></span>'),z+="</div>",t.debugPreview.innerHTML=z},it=s=>{const l=t.debugTrace.querySelector(`[data-filtered-index="${s}"]`);l&&l.scrollIntoView({behavior:"smooth",block:"center"})},se=()=>{const{trace:s,currentStep:l}=D,o=E(s);if(!s||!s.steps.length){t.debugStatus.textContent=(s==null?void 0:s.error)||"Add a pattern and sample to start tracing.",t.stepMeta.textContent="0 / 0",t.debugTrace.innerHTML=b("Trace steps appear here once the pattern can be expanded."),t.debugPreview.innerHTML=b("Step through the trace to inspect the sample text."),t.debugPattern.innerHTML=b("Inspect the pattern structure in sync with trace steps."),t.debugSlider.max=0,t.debugSlider.value=0,t.debugSlider.disabled=!0;return}if(!o.length){t.debugStatus.textContent="No steps match the active filters.",t.stepMeta.textContent="0 / 0",t.debugTrace.innerHTML=b("Adjust filters to see trace steps."),t.debugPreview.innerHTML=b("No visible steps."),t.debugPattern.innerHTML=b("No visible steps."),t.debugSlider.max=0,t.debugSlider.value=0,t.debugSlider.disabled=!0;return}const c=Math.max(0,Math.min(o.length-1,l));D.currentStep=c;const k=o[c];t.debugStatus.textContent=k.message,t.stepMeta.textContent=`${c+1} / ${o.length}`,t.debugSlider.disabled=!1,t.debugSlider.max=o.length-1,t.debugSlider.value=c,t.debugTrace.innerHTML=o.map((T,A)=>`
      <button type="button" class="regex-trace-step regex-trace-${O(T.kind||"step")}${A===c?" active":""}${A>c?" future":""}" data-filtered-index="${A}">
        <span class="regex-trace-index">${A+1}</span>
        <div class="regex-trace-copy">
          <strong>${v((T.kind||"step").toUpperCase())}</strong>
          <span>${v(T.message)}</span>
        </div>
      </button>
    `).join("");const P=T=>{D.currentStep=parseInt(T.dataset.filteredIndex,10),se()};t.debugTrace.querySelectorAll(".regex-trace-step").forEach(T=>{T.addEventListener("click",()=>{P(T)}),T.addEventListener("keydown",A=>{A.key!=="Enter"&&A.key!==" "||(A.preventDefault(),P(T))})}),nt(c,o),at(c,o),it(c),t.stepPrev.disabled=c<=0,t.stepNext.disabled=c>=o.length-1},I=()=>{var B;const s=t.pattern.value,l=N(m()),o=t.input.value,c=$e(s,l,o),k=((B=c.matches)==null?void 0:B.length)||0;k||(_=0),_>=k&&(_=Math.max(0,k-1)),c.error?(t.highlighted.innerHTML=b(c.error,"danger"),t.results.innerHTML=b(c.error,"danger"),t.status.textContent="Regex error",q(t.status,"danger"),t.matchMeta.textContent="0 / 0"):c.empty||!s&&!o?(t.highlighted.innerHTML=b("Define a pattern to inspect matches."),t.results.innerHTML=b("Define a pattern to inspect matches."),t.status.textContent="Ready.",q(t.status,"muted"),t.matchMeta.textContent="0 / 0"):(t.highlighted.innerHTML=c.count?c.highlightedText:b("No matches found."),t.results.innerHTML=c.count?c.matches.map((L,le)=>`
            <div class="regex-match-card${le===_?" active":""}" data-match-card="${le}">
              <div class="regex-match-card-head">
                <strong class="regex-match-chip">Match ${L.id}</strong>
                <span class="regex-match-range">${L.index}..${L.end}</span>
              </div>
              <div class="regex-match-value">${v(L.value)}</div>
              ${L.groups.length||Object.keys(L.namedGroups).length?`
                <div class="regex-match-groups">
                  ${L.groups.map((pe,fe)=>`<span class="regex-group-chip">Group ${fe+1}: ${v(pe??"null")}</span>`).join("")}
                  ${Object.entries(L.namedGroups).map(([pe,fe])=>`<span class="regex-group-chip regex-group-chip-named">${v(pe)}: ${v(fe??"null")}</span>`).join("")}
                </div>
              `:""}
            </div>
          `).join(""):b("No matches found."),t.status.textContent=c.count?`${c.count} matches found.`:"Valid pattern, no matches.",q(t.status,c.count?"success":"muted"),t.matchMeta.textContent=c.count?`${_+1} / ${c.count}`:"0 / 0");const P=vt(s);t.explanation.innerHTML=P.length?P.map(L=>`
          <div class="studio-output-card regex-summary-card">
            <span>${L.label}</span>
            <strong>${L.detail}</strong>
          </div>
        `).join(""):b("Pattern breakdown appears here.");const T=qt(s,l,o,{matchIndex:_});D.trace=T,D.currentStep>=T.steps.length&&(D.currentStep=Math.max(0,T.steps.length-1)),se(),ae(l);const A=C(s).map(L=>L.key).join("|");t.replacementBuilder.dataset.signature!==A&&re(s);const z=K(s),j=kt(s,l,o,z);t.replacementTemplate.textContent=`Template: ${j.template||"$MATCH"}`,t.replacementOutput.value=j.output,t.replacementMeta.textContent=j.error?j.error:j.count?`${j.count} replacements previewed.`:"No replacements applied.",q(t.replacementMeta,j.error?"danger":j.count?"success":"muted"),S.suggestion=S.suggestion||te(t.aiDescription.value,t.aiSample.value),ie(),t.results.querySelectorAll("[data-match-card]").forEach(L=>{L.addEventListener("click",()=>{_=parseInt(L.dataset.matchCard,10),I()})}),M({pattern:s,flags:l,input:o,replacement:j.template,replacementFields:d,blockQuery:t.blockSearch.value,selectedBlockId:i,aiModel:t.aiModel.value,aiTemp:t.aiTemp.value,aiMaxTokens:t.aiMaxTokens.value,aiDescription:t.aiDescription.value,aiSample:t.aiSample.value,traceFilters:Array.from(p())}),X()};t.traceFilterGroup.querySelectorAll("input").forEach(s=>{s.addEventListener("change",()=>{se(),I()})}),t.pattern.addEventListener("input",I),t.input.addEventListener("input",I),t.blockSearch.addEventListener("input",()=>{M({blockQuery:t.blockSearch.value}),ge()}),t.blockCategory.addEventListener("change",()=>{ge()}),t.aiDescription.addEventListener("input",()=>{S.suggestion=te(t.aiDescription.value,t.aiSample.value),I()}),t.aiSample.addEventListener("input",()=>{S.suggestion=te(t.aiDescription.value,t.aiSample.value),I()}),t.aiModel.addEventListener("change",()=>{w==null||w.syncModelInfo(),M({aiModel:t.aiModel.value})}),t.aiTemp.addEventListener("input",()=>{M({aiTemp:t.aiTemp.value})}),t.aiMaxTokens.addEventListener("input",()=>{M({aiMaxTokens:t.aiMaxTokens.value})}),t.pattern.addEventListener("dragover",s=>{s.preventDefault()}),t.pattern.addEventListener("drop",s=>{var o,c;s.preventDefault();const l=(c=(o=s.dataTransfer)==null?void 0:o.getData)==null?void 0:c.call(o,"text/plain");l&&we(l)}),t.flags.addEventListener("click",()=>{x==null||x.open("tool")}),g.querySelector("#btn-regex-open-preset-library").addEventListener("click",ne),g.querySelector("#btn-regex-open-breakdown").addEventListener("click",()=>f==null?void 0:f.open("tool")),g.querySelector("#btn-copy-regex").addEventListener("click",()=>{je(`/${t.pattern.value}/${m()}`)}),g.querySelector("#btn-copy-js").addEventListener("click",()=>{je(`const regex = /${t.pattern.value}/${m()};
const input = \`${t.input.value.replace(/`/g,"\\`")}\`;
const matches = [...input.matchAll(regex)];`)}),g.querySelector("#btn-save-snippet").addEventListener("click",async()=>{try{const s=`Snippet ${Ge(U.getSnapshot().snippets).length+1}`,l=St(s,t.pattern.value,m(),t.input.value),o=U.getSnapshot().snippets||[];await U.save({snippets:[...o,l]},{immediate:!0}),X(),Fe("Regex snippet saved.","success")}catch(s){Fe(s.message,"danger")}}),g.querySelector("#btn-prev-match").addEventListener("click",()=>{const s=$e(t.pattern.value,m(),t.input.value);Ie(-1,s.count||0),I()}),g.querySelector("#btn-next-match").addEventListener("click",()=>{const s=$e(t.pattern.value,m(),t.input.value);Ie(1,s.count||0),I()}),t.stepPrev.addEventListener("click",()=>{D.currentStep>0&&(D.currentStep-=1,se())}),t.stepNext.addEventListener("click",()=>{const s=E();D.currentStep<s.length-1&&(D.currentStep+=1,se())}),t.debugSlider.addEventListener("input",()=>{D.currentStep=parseInt(t.debugSlider.value,10),se()}),g.querySelector("#btn-regex-ai-heuristic").addEventListener("click",()=>{S.suggestion=te(t.aiDescription.value,t.aiSample.value),S.streamed="",a("Quick draft updated.","success"),ie()}),g.querySelector("#btn-regex-ai-apply").addEventListener("click",()=>{const s=S.suggestion;s!=null&&s.pattern&&(t.pattern.value=s.pattern,N(F(s.flags||"g")),!t.input.value.trim()&&s.sample&&(t.input.value=s.sample),a("Draft applied to pattern and flags.","success"),I())}),g.querySelector("#btn-regex-ai-run").addEventListener("click",async()=>{if(S.isGenerating){w==null||w.stop();return}if(!await Pe())return;S.isGenerating=!0,S.streamed="",a("Starting local pattern draft...","info"),ie("");const s=t.aiModel.value||H.aiModel,l=parseFloat(t.aiTemp.value)||.1,o=parseInt(t.aiMaxTokens.value,10)||48,c=Lt({model:ee[s],description:t.aiDescription.value,sample:t.aiSample.value,temp:l,maxTokens:o});w.run(c,{title:"Building pattern...",detail:c.isRaw?"Streaming short code-style completion.":"Streaming short JSON draft."})}),g.querySelector("#btn-regex-ai-setup").addEventListener("click",()=>{w==null||w.toggleConfig()}),g.querySelector("#btn-regex-ai-cancel").addEventListener("click",()=>{w==null||w.closeConfig()}),g.querySelector("#btn-regex-ai-activate").addEventListener("click",async()=>{await Pe()&&(a("Engine activated for regex drafts.","success"),w==null||w.closeConfig())}),g.querySelector("#btn-regex-ai-clear-console").addEventListener("click",()=>{w==null||w.clearConsole()}),g.querySelectorAll("[data-regex-ai-view]").forEach(s=>{s.addEventListener("click",()=>{Re(s.dataset.regexAiView)})}),g.querySelectorAll("[data-regex-tab]").forEach(s=>{s.addEventListener("click",()=>ue(s.dataset.regexTab))}),R(),X(),ge(),ie(),Re(S.activeView),be(),ue(r.activeTab||"test"),I()}function dr(){Ae.forEach(e=>e.destroy()),Ae=[],U==null||U.dispose(),U=null,w==null||w.destroy(),w=null,S=null,g&&g.remove(),g=null,_=0}function v(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function O(e){return v(e).replace(/"/g,"&quot;")}function rr(e,r,t){let a="idle";for(const n of e||[])if(r>=n.start&&t<=n.end){if(n.state==="full")return"full";n.state==="fail"?a="fail":n.state==="attempt"&&a!=="fail"&&(a="attempt")}return a}export{cr as mount,dr as unmount};
