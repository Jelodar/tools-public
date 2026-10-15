import{c as nt,M as X,D as Je}from"./ai-session-CFFiJM4b.js";import{c as Pe,s as Ie}from"./ui-utils-BycjcbQ0.js";import{c as it,t as G,e as f,g as st}from"./index-ATPg-6Fd.js";import{c as he}from"./modal-DKefIaRW.js";import{c as lt}from"./tool-state-B_5q_c8d.js";import{e as ot}from"./ai-generation-CBvcWf5u.js";function ct(e){const r=Number(e);if(!Number.isFinite(r)||r<=0)return 0;const t=r<=1?r*100:r;return Math.max(0,Math.min(100,Math.round(t)))}function dt(e={}){const r=e.modelRegistry||{},t=e.session||nt(),a=it(e.progressHost,{stopLabel:e.stopLabel||"Stop AI",idleMessage:e.idleMessage||"Local engine idle.",onStop(){var x;y.stop(),(x=e.onStop)==null||x.call(e,y)}}),n=`ai-${Math.random().toString(36).slice(2,9)}`,i={activeModelKey:null,loadingModelKey:null,isLoading:!1,isGenerating:!1,thinkingActive:!1,thinkingText:"",visibleText:""},d=e.thinkingPanel||null,u=e.thinkingContent||d||null,m=e.consoleNode||null,h=e.consoleEmptyMessage||"[INFO] Local AI console ready.",$=(x,p)=>{if(!m)return;m.dataset.empty==="true"&&(m.innerHTML=""),m.dataset.empty="false";const E=document.createElement("div");E.className="ai-console-entry",E.innerHTML=e.renderConsoleEntry?e.renderConsoleEntry(x,p):gt(x,p),m.appendChild(E),m.scrollTop=m.scrollHeight},M=()=>{var p;if(!e.modelInfoNode||!e.modelSelect)return;const x=r[e.modelSelect.value];e.modelInfoNode.innerHTML=x?((p=e.renderModelInfo)==null?void 0:p.call(e,x,e.modelSelect.value))||ut(x):""},q=(x,p=!1)=>{d&&(d.classList.toggle("hidden",!x),p&&u&&(u.textContent=""))},v=()=>{i.thinkingActive=!1,i.thinkingText="",i.visibleText="",u&&(u.textContent="")},y={state:i,progress:a,session:t,syncModelInfo:M,toggleConfig(x){if(!e.configPanel)return;const p=typeof x=="boolean"?x:e.configPanel.classList.contains("hidden");e.configPanel.classList.toggle("hidden",!p)},openConfig(){y.toggleConfig(!0)},closeConfig(){y.toggleConfig(!1)},clearConsole(){m&&(m.dataset.empty="true",m.innerHTML=`<div class="ai-console-empty">${f(h)}</div>`)},logInvocation(x,p={}){$("invoke",{...p,payload:x,timestamp:new Date().toLocaleTimeString()})},async ensureModel(x=(p=>(p=e.modelSelect)==null?void 0:p.value)()||i.activeModelKey){var C;const E=x||e.initialModelKey,N=r[E];if(!E||!N)throw new Error("A valid local AI model is required.");if(i.activeModelKey===E&&!i.isLoading)return N;i.isLoading=!0,i.loadingModelKey=E,a.update({title:e.loadingTitle||"Loading weights...",detail:((C=e.loadingDetail)==null?void 0:C.call(e,N,E))||N.id,busy:!0});try{return await t.loadModel(N.url),i.activeModelKey=E,i.isLoading=!1,i.loadingModelKey=null,N}catch(K){throw i.isLoading=!1,i.loadingModelKey=null,K}},run(x,p={}){var N;i.isGenerating=!0,i.isLoading=!1,v(),q(!1),(N=e.onBeforeGenerate)==null||N.call(e,x,p,y),p.log!==!1&&y.logInvocation(x,p);const E={title:p.title||e.generateTitle||"Generating...",detail:p.detail||e.generateDetail||"Streaming local output.",busy:!0,cancellable:p.cancellable??!0};a.update(E),G.register(n,{...E,onStop:()=>y.stop()}),t.generate(x)},stop(){if(t.stop(),i.isGenerating||i.isLoading){i.isGenerating=!1,i.isLoading=!1;const x={title:e.abortedTitle||"Stopped",detail:e.abortedDetail||"Generation aborted.",autoResetMs:900};a.update(x),G.update(n,x),setTimeout(()=>G.unregister(n),1e3)}},destroy(){a.destroy(),t.dispose(),q(!1,!0)}};return y.clearConsole(),e.modelSelect&&e.modelSelect.addEventListener("change",M),M(),t.subscribe(({type:x,payload:p})=>{var E,N,C,K,te,re,J,ae,oe,ce,me;if(x==="progress"){i.isLoading=!0;const R={title:e.loadingTitle||"Loading weights...",detail:e.loadingProgressDetail||"Streaming local model files.",busy:!0,progress:ct(p.progress),cancellable:!1};a.update(R),G.register(n,{...R,onStop:()=>y.stop()}),(E=e.onProgress)==null||E.call(e,p,y);return}if(x==="status"&&p.status==="ready"){i.isLoading=!1,i.activeModelKey=i.loadingModelKey||i.activeModelKey,i.loadingModelKey=null;const R={title:e.readyTitle||"Engine ready",detail:((N=e.readyDetail)==null?void 0:N.call(e,i.activeModelKey))||"Local model active.",tone:"success",autoResetMs:i.isGenerating?0:1800};a.update(R),G.update(n,R),i.isGenerating||setTimeout(()=>G.unregister(n),2e3),(C=e.onReady)==null||C.call(e,p,y);return}if(x==="status"&&p.status==="aborted"){i.isGenerating=!1,v(),q(!1,!0);const R={title:e.abortedTitle||"Stopped",detail:e.abortedDetail||"Generation aborted.",autoResetMs:900};a.update(R),G.update(n,R),setTimeout(()=>G.unregister(n),1e3),(K=e.onAborted)==null||K.call(e,p,y);return}if(x==="thinking"){if(p.state==="start"){if(i.thinkingActive=!0,q(!0),i.isGenerating){const R={title:e.generateTitle||"Generating...",detail:e.thinkingDetail||"Model is reasoning...",busy:!0,cancellable:!0};a.update(R),G.update(n,R)}}else p.state==="end"&&(i.thinkingActive=!1);(te=e.onThinking)==null||te.call(e,p,y);return}if(x==="thinking-token"){i.thinkingText+=p.text||"",u&&(u.textContent=i.thinkingText,u.scrollTop=u.scrollHeight),$("thinking",{text:p.text||"",fullText:i.thinkingText,timestamp:new Date().toLocaleTimeString()}),(re=e.onThinkingToken)==null||re.call(e,{...p,fullText:i.thinkingText},y),(J=e.onThinkingStream)==null||J.call(e,{...p,fullText:i.thinkingText},y);return}if(x==="stream"){i.visibleText=p.text||"",$("stream",{text:p.text||"",fullText:i.visibleText,timestamp:new Date().toLocaleTimeString()}),(ae=e.onStream)==null||ae.call(e,{...p,fullText:i.visibleText},y);return}if(x==="complete"){i.isGenerating=!1;const R=(oe=e.resolveCompleteProgress)==null?void 0:oe.call(e,p,y);R&&(a.update(R),G.update(n,R)),setTimeout(()=>G.unregister(n),2e3);const Y=e.keepThinkingVisible===!0;q(Y,!Y),Y?(i.thinkingActive=!1,i.visibleText=""):v(),$("complete",{result:p.result||i.visibleText,timestamp:new Date().toLocaleTimeString()}),(ce=e.onComplete)==null||ce.call(e,p,y);return}if(x==="error"){i.isLoading=!1,i.isGenerating=!1,i.loadingModelKey=null,v(),q(!1,!0);const R={title:e.errorTitle||"Engine error",detail:p.message,tone:"danger"};a.update(R),G.update(n,R),setTimeout(()=>G.unregister(n),5e3),$("error",{message:p.message,timestamp:new Date().toLocaleTimeString()}),(me=e.onError)==null||me.call(e,p,y)}}),y}function ut(e){return`<strong>ID:</strong> ${e.id}<br><strong>Size:</strong> ${e.size}<br><strong>Mode:</strong> ${e.desc}`}function gt(e,r){if(e==="stream"||e==="thinking"||e==="complete"){const h=e==="complete"?r.result||"":r.text||r.fullText||"";return`
      <div class="ai-console-entry-head">
        <span class="ai-console-entry-tag">${f(e)}</span>
        <span class="ai-console-entry-time">${f(r.timestamp)}</span>
      </div>
      <div class="ai-console-entry-body">${f(h)}</div>
    `}if(e==="error")return`
      <div class="ai-console-entry-head">
        <span class="ai-console-entry-tag ai-console-entry-tag-error">Error</span>
        <span class="ai-console-entry-time">${f(r.timestamp)}</span>
      </div>
      <div class="ai-console-entry-body">${f(r.message||"Unknown local AI error.")}</div>
    `;const t=r.payload||{},a=t.requestId||r.label||"request",n=[];t.prompt&&n.push(String(t.prompt)),Array.isArray(t.messages)&&t.messages.length&&n.push(t.messages.map(h=>`[${h.role||"message"}] ${String(h.content||"")}`).join(`

`)),t.suffix&&n.push(`[suffix] ${String(t.suffix)}`);const i=n.filter(Boolean).join(`

`),d=t.params||{},u={};Object.entries(d).forEach(([h,$])=>{h==="grammar"||h==="responseFormat"||h==="systemPrompt"||(u[h]=$)}),(t.responseFormat||d.responseFormat)&&(u.response=t.responseFormat||d.responseFormat),(t.grammar||d.grammar)&&(u.grammar="custom"),Array.isArray(t.messages)&&t.messages.length&&(u.messages=t.messages.length);const m=JSON.stringify(u);return`
    <div class="ai-console-entry-head">
      <span class="ai-console-entry-tag">${f(a)}</span>
      <span class="ai-console-entry-time">${f(r.timestamp)}</span>
    </div>
    <div class="ai-console-entry-body">${f(i||"[empty request body]")}</div>
    <div class="ai-console-entry-meta">${f(m)}</div>
  `}const V={email:{pattern:"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",flags:"g",sample:"Contact team@example.com or ops@example.org for support."},url:{pattern:"https?:\\/\\/[^\\s/$.?#].[^\\s]*",flags:"g",sample:"Primary docs: https://example.com/docs and https://status.example.com"},uuid:{pattern:"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}",flags:"g",sample:"IDs: 550e8400-e29b-41d4-a716-446655440000 and 018ec353-7be1-7cc6-b4f0-9f6d1e4ad7aa"},date:{pattern:"\\b\\d{4}-\\d{2}-\\d{2}\\b",flags:"g",sample:"Release windows: 2026-04-21, 2026-05-05, 2026-06-30."},hashtag:{pattern:"#[A-Za-z0-9_]+",flags:"g",sample:"Track #frontend, #release_notes, and #qa for updates."}},pt=`Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Release date: 2026-04-21.
Contact: hello@example.com.
Profile slug: world-class-suite.
Reference ID: 550e8400-e29b-41d4-a716-446655440000.`,ft=[{flag:"d",label:"Indices",detail:"Exposes match indices in modern engines.",compatibility:"Modern Chromium / Firefox / Safari only."},{flag:"g",label:"Global",detail:"Finds every match instead of stopping at the first.",compatibility:"Widely supported."},{flag:"i",label:"Ignore Case",detail:"Matches case-insensitively.",compatibility:"Widely supported."},{flag:"m",label:"Multiline",detail:"Makes ^ and $ operate per line.",compatibility:"Widely supported."},{flag:"s",label:"Dot All",detail:"Allows . to match newlines.",compatibility:"Modern browsers and Node."},{flag:"u",label:"Unicode",detail:"Enables Unicode-aware parsing and escapes.",compatibility:"Widely supported in modern engines."},{flag:"v",label:"Unicode Sets",detail:"Adds advanced Unicode set notation.",compatibility:"Only the newest engines currently support this."},{flag:"y",label:"Sticky",detail:"Matches from the current index only.",compatibility:"Widely supported in modern engines."}],fe=[b("newline","control","Newline","\\n","Line break character.","js"),b("tab","control","Tab","\\t","Horizontal tab character.","js"),b("digit","tokens","Digit","\\d","Digit character.","js"),b("word","tokens","Word character","\\w","Letter, digit, or underscore.","js"),b("space","tokens","Whitespace","\\s","Whitespace character.","js"),b("any-char","tokens","Any character",".","Any code unit except a newline unless dotAll is enabled.","js"),b("literal","tokens","Escaped literal","literal","Escape plain text for a literal match.","js",[{id:"value",label:"Text",defaultValue:".",placeholder:"Enter text to escape"}],e=>Jt(e.value||".")),b("alternation","tokens","Alternation","a|b","Match one of two branches.","js",[{id:"left",label:"Left branch",defaultValue:"cat"},{id:"right",label:"Right branch",defaultValue:"dog"}],e=>`${e.left||"cat"}|${e.right||"dog"}`),b("char-class","classes","Character class","[abc]","Match one character from a custom set.","js",[{id:"set",label:"Character set",defaultValue:"abc",placeholder:"abc"}],e=>`[${Ke(e.set||"abc")}]`),b("negated-class","classes","Negated class","[^abc]","Reject characters from a custom set.","js",[{id:"set",label:"Excluded set",defaultValue:"abc",placeholder:"abc"}],e=>`[^${Ke(e.set||"abc")}]`),b("range-class","classes","Character range","[a-z]","Match a custom range or mixed range source.","js",[{id:"range",label:"Range",defaultValue:"a-z",placeholder:"a-zA-Z0-9"}],e=>`[${String(e.range||"a-z").trim()||"a-z"}]`),b("unicode-property","classes","Unicode property","\\p{L}","Unicode property escape.","js-modern",[{id:"property",label:"Property",defaultValue:"L",placeholder:"L or Script=Latin"}],e=>`\\p{${String(e.property||"L").trim()||"L"}}`),b("unicode-property-negated","classes","Negated Unicode property","\\P{L}","Negated Unicode property escape.","js-modern",[{id:"property",label:"Property",defaultValue:"L",placeholder:"L or Script=Latin"}],e=>`\\P{${String(e.property||"L").trim()||"L"}}`),b("capture-group","groups","Capturing group","(...)","Group a subpattern and capture it.","js",[{id:"pattern",label:"Pattern",defaultValue:"\\d+",placeholder:"\\d+"}],e=>`(${e.pattern||"\\d+"})`),b("non-capture-group","groups","Non-capturing group","(?:...)","Group without capturing.","js",[{id:"pattern",label:"Pattern",defaultValue:"cat|dog",placeholder:"cat|dog"}],e=>`(?:${e.pattern||"cat|dog"})`),b("named-group","groups","Named group","(?<name>...)","Named capturing group.","js-modern",[{id:"name",label:"Group name",defaultValue:"value",placeholder:"value"},{id:"pattern",label:"Pattern",defaultValue:"\\d+",placeholder:"\\d+"}],e=>`(?<${We(e.name||"value")}>${e.pattern||"\\d+"})`),b("named-backref","backrefs","Named backreference","\\k<name>","Reference a named group.","js-modern",[{id:"name",label:"Group name",defaultValue:"value",placeholder:"value"}],e=>`\\k<${We(e.name||"value")}>`),b("lookahead","lookaround","Positive lookahead","(?=...)","Require following text without consuming it.","js",[{id:"pattern",label:"Assertion",defaultValue:"USD",placeholder:"USD"}],e=>`(?=${e.pattern||"USD"})`),b("negative-lookahead","lookaround","Negative lookahead","(?!...)","Reject following text without consuming it.","js",[{id:"pattern",label:"Assertion",defaultValue:"draft",placeholder:"draft"}],e=>`(?!${e.pattern||"draft"})`),b("lookbehind","lookaround","Positive lookbehind","(?<=...)","Require preceding text without consuming it.","js-modern",[{id:"pattern",label:"Assertion",defaultValue:"\\$",placeholder:"\\$"}],e=>`(?<=${e.pattern||"\\$"})`),b("negative-lookbehind","lookaround","Negative lookbehind","(?<!...)","Reject preceding text without consuming it.","js-modern",[{id:"pattern",label:"Assertion",defaultValue:"draft-",placeholder:"draft-"}],e=>`(?<!${e.pattern||"draft-"})`),b("optional-quantifier","quantifiers","Optional","?","Zero or one repetition.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"}],e=>`${e.target||"\\d"}?`),b("zero-or-more","quantifiers","Zero or more","*","Greedy repetition.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"}],e=>`${e.target||"\\d"}*`),b("one-or-more","quantifiers","One or more","+","Greedy repetition.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"}],e=>`${e.target||"\\d"}+`),b("exact-quantifier","quantifiers","Exact count","a{3}","Match an exact number of repetitions.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"},{id:"count",label:"Count",defaultValue:"4",inputMode:"numeric"}],e=>`${e.target||"\\d"}{${ye(e.count,4)}}`),b("range-quantifier","quantifiers","Range count","a{2,5}","Match within a repetition range.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"},{id:"min",label:"Min",defaultValue:"2",inputMode:"numeric"},{id:"max",label:"Max",defaultValue:"5",inputMode:"numeric"}],e=>{const r=ye(e.min,2),t=Math.max(r,ye(e.max,5));return`${e.target||"\\d"}{${r},${t}}`}),b("open-quantifier","quantifiers","At least count","a{2,}","Match a minimum number of repetitions.","js",[{id:"target",label:"Target",defaultValue:"\\d",placeholder:"\\d"},{id:"min",label:"Min",defaultValue:"2",inputMode:"numeric"}],e=>`${e.target||"\\d"}{${ye(e.min,2)},}`),b("start-anchor","anchors","Start anchor","^","Match only at the start.","js"),b("end-anchor","anchors","End anchor","$","Match only at the end.","js"),b("word-boundary","anchors","Word boundary","\\b","Boundary between word and non-word characters.","js"),b("non-word-boundary","anchors","Non-word boundary","\\B","Position that is not a word boundary.","js"),b("hex-char","tokens","Hex character","\\x00","Hexadecimal escape.","js",[{id:"code",label:"Hex Code",defaultValue:"20",placeholder:"20"}],e=>`\\x${String(e.code||"20").trim().padStart(2,"0").slice(0,2)}`),b("unicode-char","tokens","Unicode character","\\u0000","Unicode escape.","js",[{id:"code",label:"Unicode Hex",defaultValue:"0020",placeholder:"0020"}],e=>`\\u${String(e.code||"0020").trim().padStart(4,"0").slice(0,4)}`),b("unicode-char-ext","tokens","Unicode (Extended)","\\u{0}","Extended Unicode escape.","js-modern",[{id:"code",label:"Unicode Hex",defaultValue:"1F600",placeholder:"1F600"}],e=>`\\u{${String(e.code||"1F600").trim()}}`)];function je(e,r={}){const t=fe.find(a=>a.id===e);return t?typeof t.build=="function"?String(t.build(r||{})||""):String(t.token||""):""}const mt=[{regex:/\\(?:[1-9]\d*|k<[^>]+>)/,note:"Backreferences use summary tracing only."},{regex:/(?:\*|\+|\?|\{[^}]+\})\+/,note:"Possessive quantifiers use summary tracing only."},{regex:/\[(?:[^\]\\]|\\.)*&&(?:[^\]\\]|\\.)*\]/,note:"Set intersections use summary tracing only."}];function F(e){const r=new Set(["d","g","i","m","s","u","v","y"]),t=[];for(const a of String(e||""))r.has(a)&&!t.includes(a)&&t.push(a);return t.join("")}function xt(e=""){const r=new Set(F(e));return ft.map(t=>({...t,active:r.has(t.flag)}))}function Ze(e){const r=String(e||"");if(!r)return[];const t=[];let a=0,n=!1;for(let i=0;i<r.length;i+=1){const d=r[i];if(d==="\\"){i+=1;continue}if(d==="["&&!n){n=!0;continue}if(d==="]"&&n){n=!1;continue}if(!(n||d!=="(")){if(r[i+1]==="?"){if(r[i+2]==="<"&&r[i+3]!=="="&&r[i+3]!=="!"){const u=r.indexOf(">",i+3);a+=1,t.push({index:a,name:u===-1?"":r.slice(i+3,u),token:`$${a}`})}continue}a+=1,t.push({index:a,name:"",token:`$${a}`})}}return t}function Z(e,r=""){return new RegExp(e,F(r))}function Se(e,r,t){if(!e)return{empty:!0,matches:[],count:0,highlightedText:f(t||"")};try{const a=F(r),n=Z(e,a.includes("g")?a:`${a}g`),i=String(t||""),d=Array.from(i.matchAll(n)).map((u,m)=>({id:m+1,value:u[0],index:u.index,end:u.index+u[0].length,groups:u.slice(1),namedGroups:u.groups||{}}));return{empty:!1,error:null,regex:n,count:d.length,matches:d,highlightedText:Yt(i,d)}}catch(a){return{empty:!1,error:a.message,matches:[],count:0,highlightedText:f(t||"")}}}function ht(e){const r=String(e||"");if(!r)return[];const t=[];return[{regex:/\\d/g,label:"\\d",detail:"digit"},{regex:/\\w/g,label:"\\w",detail:"word character"},{regex:/\\s/g,label:"\\s",detail:"whitespace"},{regex:/\[[^\]]+\]/g,label:"[]",detail:"character class"},{regex:/\(\?:/g,label:"(?:",detail:"non-capturing group"},{regex:/\((?!\?:|\?<)/g,label:"()",detail:"capturing group"},{regex:/\(\?<[^>]+>/g,label:"(?<name>",detail:"named capturing group"},{regex:/\*/g,label:"*",detail:"zero or more"},{regex:/\+/g,label:"+",detail:"one or more"},{regex:/\?/g,label:"?",detail:"optional or lazy modifier"},{regex:/\{[^}]+\}/g,label:"{}",detail:"explicit repetition range"},{regex:/\^/g,label:"^",detail:"start anchor"},{regex:/\$/g,label:"$",detail:"end anchor"},{regex:/\|/g,label:"|",detail:"alternation"},{regex:/\./g,label:".",detail:"any character except newline unless dotall"}].forEach(n=>{n.regex.test(r)&&t.push(n)}),t}function Fe(e){return V[e]||null}function bt(){return Qt().map(([e,r])=>({id:e,name:e.replace(/^[a-z]/,t=>t.toUpperCase()),pattern:r.pattern,flags:r.flags,sample:r.sample,builtIn:!0}))}function vt(e,r,t,a=""){const n=String(e||"").trim();if(!n)throw new Error("Snippet name is required.");return Z(r,F(t)),{id:`${n.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${F(t)||"plain"}`,name:n,pattern:r,flags:F(t),sample:String(a||""),builtIn:!1}}function De(e=[]){const r=[...bt()],t=new Set(r.map(a=>a.id));for(const a of e||[])!(a!=null&&a.id)||t.has(a.id)||(r.push({id:a.id,name:String(a.name||"Snippet"),pattern:String(a.pattern||""),flags:F(a.flags||""),sample:String(a.sample||""),builtIn:!1}),t.add(a.id));return r}function yt(e,r,t,a){const n=String(t||""),i=Ze(e),d=St(a,i);if(!e)return{output:n,count:0,error:null,template:d};try{const u=F(r),m=u.includes("g")?u:`${u}g`,h=Z(e,m),$=Z(e,m),M=Array.from(n.matchAll(h)).length;return{output:n.replace($,d),count:M,error:null,template:d}}catch(u){return{output:n,count:0,error:u.message,template:d}}}function St(e,r=[]){if(e&&typeof e=="object"&&e.mode==="groups"){const t=e.groups&&typeof e.groups=="object"?e.groups:{},a=r.length?r.map(n=>Object.prototype.hasOwnProperty.call(t,n.index)?String(t[n.index]??""):Object.prototype.hasOwnProperty.call(t,String(n.index))?String(t[String(n.index)]??""):n.token):[Object.prototype.hasOwnProperty.call(t,"match")?String(t.match??""):String(e.match??"$MATCH")];return Oe(a.join(""))}return Oe(String(e||""))}function Oe(e){return String(e||"").replace(/\$MATCH/g,"$$&")}function kt(e,r,t=null,a=null){const n=String(e||""),i=String(r||""),d=Number.isInteger(t)?Math.max(0,t):n.length,u=Number.isInteger(a)?Math.max(d,a):d;return`${n.slice(0,d)}${i}${n.slice(u)}`}function Qe(e,r=""){const t=String(e||"").trim(),a=String(r||"").trim();return["Task: Draft a high-performance JavaScript RegExp for modern browser engines (V8/SpiderMonkey).",`Goal:
${t||"Create a regex that matches the requested text."}`,a?`Sample text:
${a}`:"","Requirements:","1. Return exactly one compact JSON object. No prose, markdown, or commentary.",'2. Schema: {"pattern":"...","flags":"g"}',"3. Escape backslashes (\\) correctly for JSON string values.",'4. Use only "pattern" and "flags" keys.',"5. Prefer non-capturing groups (?:...) unless capture is strictly necessary.","6. Use \\b or anchors when the target should stand alone instead of matching inside larger words.","7. Avoid broad .* sections when a bounded token, explicit class, or lazy segment is enough.","8. Avoid catastrophic backtracking; use explicit structure and tight quantifiers.","9. Choose appropriate flags (d, g, i, m, s, u, v, y), keep them unique, and omit unused flags."].join(`

`)}function $t(e,r=""){return[{role:"system",content:["You are an expert Regex Engineer specializing in modern JavaScript (ES2024+).","Your goal is to provide safe, efficient, and correct RegExp patterns.",'Return JSON only with "pattern" and "flags".',"You MUST return ONLY a JSON object. No explanations, no backticks, no markdown.","You prefer named capture groups (?<name>...) for clarity when capture is requested.","You follow JSON string escaping rules strictly (e.g. \\d becomes \\\\d)."].join(`
`)},{role:"user",content:Qe(e,r)}]}function Tt(){const e=["d","g","i","m","s","u","v","y"],r=[`flags-body ::= "" | ${e.map(t=>`"${t}" flags-after-${t}`).join(" | ")}`];return e.forEach((t,a)=>{const n=e.slice(a+1).map(i=>`"${i}" flags-after-${i}`);r.push(`flags-after-${t} ::= ""${n.length?` | ${n.join(" | ")}`:""}`)}),[String.raw`root ::= "{" ws "\"pattern\"" ws ":" ws string ws "," ws "\"flags\"" ws ":" ws flags ws "}" ws`,'flags ::= "\\"" flags-body "\\""'.replace(/\\"/g,'"'),...r,String.raw`string ::= "\"" string-char* "\""`,String.raw`string-char ::= [^"\\\x00-\x1F] | "\\" escape`,String.raw`escape ::= ["\\/bfnrt] | "u" hex hex hex hex`,String.raw`hex ::= [0-9a-fA-F]`,String.raw`ws ::= [ \t\n\r]*`].join(`
`)}function Mt(e,r=""){const t=String(e||"").trim()||"Match the requested text.",a=String(r||"").trim()||"none";return["Complete the missing JavaScript regex pattern.","Return only the missing pattern source.","No slashes. No prose. Short correct answer. DO NOT PROVIDE ANY EXPLANATIONS.","Do not emit the closing quote.","Goal: match invoice IDs like INV-1042","Sample: Open INV-1042 and INV-2201 before noon.","Result: \\bINV-\\d{4}\\b",`Goal: ${t}`,`Sample: ${a}`,'<|fim_prefix|>{"pattern":"<|fim_suffix|>","flags":"g"}<|fim_middle|>'].join(`
`)}function wt(e){return Array.isArray(e==null?void 0:e.tasks)&&e.tasks.includes("code-fast")}function Et({model:e,description:r,sample:t="",temp:a=.1,maxTokens:n=48,requestId:i="regex-builder"}={}){var m;if(wt(e))return{requestId:i,isRaw:!0,prompt:Mt(r,t),params:{temp:a,n_predict:n,stop:['"',`
`]}};const d=$t(r,t),u=Tt();return{requestId:i,prompt:Qe(r,t),messages:d,responseFormat:"json",grammar:u,params:{systemPrompt:((m=d[0])==null?void 0:m.content)||"Write JavaScript regex. Return JSON only with pattern and flags.",responseFormat:"json",grammar:u,temp:a,top_p:.2,n_predict:n}}}function Ge(e,r=null){const t=String(e||"").trim();if(!t)return null;const a=ve(r);try{return pe(ve(JSON.parse(t)),a)}catch{}const n=t.match(/```(?:json)?\s*([\s\S]*?)```/i);if(n)try{return pe(ve(JSON.parse(n[1])),a)}catch{}const i=ot(t);if(i!=null&&i.jsonText)try{return pe(ve(JSON.parse(i.jsonText)),a)}catch{}const d=Kt(t);if(d)return pe({pattern:d.pattern,flags:d.flags||(a==null?void 0:a.flags)||"g",explanation:"",sample:"",rationale:[],confidence:(a==null?void 0:a.confidence)||"medium"},a);const u=Wt(t);return u?pe({pattern:u,flags:(a==null?void 0:a.flags)||"g",explanation:"",sample:"",rationale:[],confidence:(a==null?void 0:a.confidence)||"medium"},a):null}function ee(e,r=""){const t=`${String(e||"")}
${String(r||"")}`.trim(),a=t.toLowerCase(),n=String(r||"");if(!t)return{pattern:"",flags:"g",explanation:"Add a natural-language goal or sample text to draft a regex.",sample:n,rationale:["No description provided yet."],confidence:"low"};const i=Ut(t,a);return Ae({pattern:i.pattern,flags:i.flags||"g",explanation:i.explanation,sample:n,rationale:i.rationale,confidence:i.confidence})}function At(e,r,t,a={}){const n=String(e||""),i=String(t||""),d=F(r).replace(/[dgy]/g,"");if(!n)return{error:null,supported:!0,note:"Add a pattern to generate a trace.",steps:[],frames:[],match:null,summary:"No pattern to trace."};try{Z(n,d)}catch(p){return{error:p.message,supported:!1,note:"The pattern must compile before it can be traced.",steps:[],frames:[],match:null,summary:"Regex compilation failed."}}const u=Lt(n);if(u.error)return{error:null,supported:!1,note:u.error,steps:[],frames:[],match:null,summary:"Trace parser could not expand the pattern."};if(u.unsupportedNote)return{error:null,supported:!1,note:u.unsupportedNote,steps:[],frames:[],match:null,summary:"Trace falls back to summary mode for this pattern."};const h=Se(n,d,i).matches||[],$=Math.max(80,Math.min(480,a.maxSteps||260)),M=h.length?Math.max(0,Math.min(h.length-1,a.matchIndex||0)):0,q=h[M]||null,v=Rt($,i.length);let y=Ot(h,M,v);const x=q?q.index:Math.min(i.length,a.maxScanIndexes||i.length);for(;y<=x&&!v.exhausted;){const p=Pt(u.node,i,y,d,v);if(p.success){const E=i.slice(y,p.cursor);if(!q||y===q.index&&E===q.value){const C=q||{id:M+1,value:E,index:y,end:p.cursor,groups:[],namedGroups:{}};return v.push("complete",`Full match "${C.value}" completed at ${C.index}..${C.end}.`,C.end,Q(C.index,C.end,"full"),{start:0,end:n.length}),{error:null,supported:!0,note:`${v.exhausted?"Trace reached the current step limit.":"Engine-style trace for the current match."}${M?` Focused on match ${M+1}.`:""}`,steps:v.steps,frames:v.steps.map(({cursor:K,ranges:te,kind:re,message:J,patternRange:ae})=>({cursor:K,ranges:te,kind:re,message:J,patternRange:ae})),match:C,summary:`Found match ${M+1} at ${C.index}..${C.end}.`}}y=Xe({index:y,end:p.cursor});continue}y+=1}return v.push("complete","Reached the end of the scanned text without a full match.",i.length,[],{start:0,end:n.length}),{error:null,supported:!0,note:v.exhausted?"Trace reached the current step limit before the pattern could finish searching.":"Engine-style trace scanned the available text without finding a full match.",steps:v.steps,frames:v.steps.map(({cursor:p,ranges:E,kind:N,message:C,patternRange:K})=>({cursor:p,ranges:E,kind:N,message:C,patternRange:K})),match:q,summary:q?`Trace did not reach match ${M+1} before the step budget ended.`:"No full match found in the scanned text."}}function Lt(e){const r=String(e||""),t=mt.find(i=>i.regex.test(r));if(t)return{node:null,error:null,unsupportedNote:t.note};const a={source:r,index:0,error:null,unsupportedNote:null},n=Ye(a);return a.error?{node:null,error:a.error,unsupportedNote:null}:a.unsupportedNote?{node:null,error:null,unsupportedNote:a.unsupportedNote}:a.index!==a.source.length?{node:null,error:"Trace parser stopped before the full pattern was consumed.",unsupportedNote:null}:{node:n,error:null,unsupportedNote:null}}function Ye(e,r=""){const t=e.index,a=[ze(e,r)];for(;!e.error&&e.source[e.index]==="|";)e.index+=1,a.push(ze(e,r));const n=e.index;return a.length===1?a[0]:{type:"alternation",raw:e.source.slice(t,n),start:t,end:n,options:a}}function ze(e,r=""){const t=e.index,a=[];for(;!e.error&&e.index<e.source.length;){const i=e.source[e.index];if(i==="|"||r&&i===r)break;const d=qt(e);if(!d)break;a.push(d)}const n=e.index;return{type:"sequence",raw:e.source.slice(t,n),start:t,end:n,items:a}}function qt(e){const r=e.index,t=Nt(e);if(!t||e.error)return null;const a=_t(e.source,e.index);if(a.endIndex!==e.index){e.index=a.endIndex;const n=e.index;return{type:"quantifier",raw:e.source.slice(r,n),start:r,end:n,atom:t,min:a.value.min,max:a.value.max,mode:a.value.mode}}return t}function Nt(e){const r=e.index,t=e.source[e.index];if(!t)return null;if(t==="(")return Ct(e);if(t==="["){const n=Vt(e.source,e.index);if(n.error)return e.error=n.error,null;e.index=n.endIndex;const i=e.index;return{type:"token",raw:n.raw,start:r,end:i}}if(t==="\\"){const n=Ht(e.source,e.index);e.index+=n.length;const i=e.index;return/^\\(?:[1-9]\d*|k<[^>]+>)$/.test(n)?(e.unsupportedNote="Backreferences use summary tracing only.",null):n==="\\b"?{type:"assertion",raw:n,start:r,end:i,kind:"word-boundary"}:n==="\\B"?{type:"assertion",raw:n,start:r,end:i,kind:"non-word-boundary"}:{type:"token",raw:n,start:r,end:i}}if(t==="^"){e.index+=1;const n=e.index;return{type:"assertion",raw:"^",start:r,end:n,kind:"start"}}if(t==="$"){e.index+=1;const n=e.index;return{type:"assertion",raw:"$",start:r,end:n,kind:"end"}}e.index+=1;const a=e.index;return{type:"token",raw:t,start:r,end:a}}function Ct(e){const r=e.index;e.index+=1;let t="group";if(e.source[e.index]==="?"){const i=e.source[e.index+1];if(i===":")t="group",e.index+=2;else if(i==="="||i==="!"){const d=_e(e.source,r);e.index=r+d.length;const u=e.index;return{type:"assertion",raw:d,start:r,end:u,kind:i==="="?"lookahead":"negative-lookahead"}}else if(i==="<"){const d=e.source[e.index+2];if(d==="="||d==="!"){const m=_e(e.source,r);e.index=r+m.length;const h=e.index;return{type:"assertion",raw:m,start:r,end:h,kind:d==="="?"lookbehind":"negative-lookbehind"}}const u=e.source.indexOf(">",e.index+2);if(u===-1)return e.error="Unterminated named group.",null;t=`group ${e.source.slice(e.index+2,u).trim()||"value"}`,e.index=u+1}else return e.unsupportedNote="Extended group modifiers use summary tracing only.",null}const a=Ye(e,")");if(e.source[e.index]!==")")return e.error="Unterminated group.",null;e.index+=1;const n=e.index;return{type:"group",raw:e.source.slice(r,n),start:r,end:n,label:t,child:a}}function Rt(e,r){const t={steps:[],exhausted:!1,push(a,n,i,d=[],u=null){return t.steps.length>=e?(t.exhausted=!0,!1):(t.steps.push({kind:a,message:n,cursor:Math.max(0,Math.min(r,i)),ranges:Gt(d,r),patternRange:u?{start:u.start,end:u.end}:null}),!0)}};return t}function Pt(e,r,t,a,n){const i=r[t]??"∅",d=t<r.length?[{start:t,end:t+1,state:"attempt"}]:[];n.push("scan",`Scanning from index ${t}. Current character: ${Ee(i)}.`,t,d,e?{start:e.start,end:e.end}:null);const u=n.steps.length-1,m=n.steps.length,h=le(e,t,{text:r,flags:a,start:t,trace:n});return h.success||n.exhausted?h:h.cursor===t&&n.steps.length===m?(n.steps[u].message=`${n.steps[u].message} ${h.message}`,h):(n.push("release",h.message,h.cursor,Q(t,h.failureEnd??Math.max(t+1,h.cursor),"fail"),e?{start:e.start,end:e.end}:null),h)}function le(e,r,t){return e?t.trace.exhausted?W(r,"Trace reached the current step limit.",r):e.type==="sequence"?ke(e.items,0,r,t):e.type==="alternation"?It(e.options,r,t):e.type==="group"?le(e.child,r,t):e.type==="quantifier"?$e(e,[{type:"sequence-placeholder"}],0,r,t,0):e.type==="assertion"?jt(e,r,t):e.type==="token"?Ft(e,r,t):W(r,"Unknown trace node type.",r):W(r,"Trace node is missing.",r)}function ke(e,r,t,a){if(r>=e.length)return{success:!0,cursor:t};const n=e[r];if(n.type==="quantifier")return $e(n,e,r,t,a,0);const i=le(n,t,a);return i.success?ke(e,r+1,i.cursor,a):i}function It(e,r,t){let a=W(r,`No branch matched at index ${r}.`,Math.min(t.text.length,r+1));for(let n=0;n<e.length;n+=1){const i=e[n];t.trace.push("branch",`Trying branch ${n+1} of ${e.length}: ${i.raw||"(empty)"}.`,r,Q(t.start,r,"attempt"),{start:i.start,end:i.end});const d=le(i,r,t);if(d.success)return d;a=d,n<e.length-1&&!t.trace.exhausted&&t.trace.push("release",`Branch ${n+1} failed. ${d.message}`,d.cursor,Q(t.start,d.failureEnd??Math.max(t.start+1,d.cursor),"fail"),{start:i.start,end:i.end})}return a}function $e(e,r,t,a,n,i=0){const d=Math.max(e.min,Number.isFinite(e.max)?e.max:Math.max(0,n.text.length-a));if(e.mode==="lazy"){let u=null;if(i>=e.min){const h=r[t+1]?ke(r,t+1,a,n):{success:!0,cursor:a};if(h.success)return h;u=h}if(i>=d)return u||W(a,Me(e.atom.raw,a,n.text),Math.min(n.text.length,a+1));const m=le(e.atom,a,n);return m.success?m.cursor===a?W(a,`${e.raw} cannot repeat a zero-width token in step tracing.`,a):(i>=e.min&&n.trace.push("branch",`Expanded ${e.raw} to ${i+1} repetition${i+1===1?"":"s"}.`,m.cursor,Q(n.start,m.cursor,"attempt"),{start:e.start,end:e.end}),$e(e,r,t,m.cursor,n,i+1)):u||m}if(i<d){const u=le(e.atom,a,n);if(u.success){if(u.cursor===a)return W(a,`${e.raw} cannot repeat a zero-width token in step tracing.`,a);const m=$e(e,r,t,u.cursor,n,i+1);if(m.success||(i+1>=e.min&&!n.trace.exhausted&&n.trace.push("branch",`Backtracked ${e.raw} to ${i} repetition${i===1?"":"s"}.`,a,Q(n.start,a,"attempt"),{start:e.start,end:e.end}),i<e.min))return m}else if(i<e.min)return u}return i>=e.min?r[t+1]?ke(r,t+1,a,n):{success:!0,cursor:a}:W(a,Me(e.atom.raw,a,n.text),Math.min(n.text.length,a+1))}function jt(e,r,t){return Bt(e,r,t.text,t.flags)?(t.trace.push("assert",zt(e,r,t.text,t.flags),r,Q(t.start,r,"attempt"),{start:e.start,end:e.end}),{success:!0,cursor:r}):W(r,`${e.raw} failed at index ${r}.`,Math.min(t.text.length,r+1))}function Ft(e,r,t){const a=Dt(e.raw,t.text,r,t.flags);if(!a)return W(r,Me(e.raw,r,t.text),Math.min(t.text.length,r+1));const n=r+a.length;return t.trace.push("match",`${et(e)} matched ${Ee(a)} at index ${r}.`,n,Q(t.start,n,"attempt"),{start:e.start,end:e.end}),{success:!0,cursor:n}}function Dt(e,r,t,a){try{const i=new RegExp(`^(?:${e})`,a).exec(r.slice(t));return(i==null?void 0:i[0])||""}catch{return""}}function Ot(e,r,t){if(r<=0)return 0;const a=Xe(e[r-1]);return t.push("skip",`Skipped ${r} earlier match${r===1?"":"es"} to focus on match ${r+1}.`,a,[]),a}function Xe(e){return e?e.end>e.index?e.end:e.index+1:0}function W(e,r,t=e){return{success:!1,cursor:e,message:r,failureEnd:Math.max(e,t)}}function Me(e,r,t){return`Expected ${et({raw:e})} at index ${r} but found ${Ee(t[r]??"∅")}.`}function Q(e,r,t="attempt"){if(!Number.isFinite(e)||!Number.isFinite(r))return[];const a=Math.max(0,Math.min(e,r)),n=Math.max(0,Math.max(e,r));return n>a?[{start:a,end:n,state:t}]:[]}function Gt(e,r){return(e||[]).map(t=>({start:Math.max(0,Math.min(r,t.start)),end:Math.max(0,Math.min(r,t.end)),state:t.state||"attempt"})).filter(t=>t.end>t.start)}function et(e){const r=String((e==null?void 0:e.raw)||"");return r?r==="."?".":r.startsWith("[")||r.startsWith("\\")||r.startsWith("(?")?r:JSON.stringify(r):"token"}function Ee(e){return JSON.stringify(e)}function zt(e,r,t,a){return e.kind==="word-boundary"?`${e.raw} matched a word boundary at index ${r}.`:e.kind==="non-word-boundary"?`${e.raw} matched a non-word boundary at index ${r}.`:e.kind==="start"?`^ matched the start condition at index ${r}${a.includes("m")?" under multiline rules":""}.`:e.kind==="end"?`$ matched the end condition at index ${r}${a.includes("m")?" under multiline rules":""}.`:e.kind==="lookahead"?`${e.raw} passed at index ${r}.`:e.kind==="negative-lookahead"?`${e.raw} passed at index ${r}.`:e.kind==="lookbehind"?`${e.raw} passed at index ${r}.`:e.kind==="negative-lookbehind"?`${e.raw} passed at index ${r}.`:`${e.raw} passed at index ${r}.`}function Bt(e,r,t,a){if(e.kind==="word-boundary"||e.kind==="non-word-boundary"){const n=He(t[r-1]||"",a),i=He(t[r]||"",a),d=n!==i;return e.kind==="word-boundary"?d:!d}return e.kind==="start"?r===0||a.includes("m")&&Ve(t[r-1]||""):e.kind==="end"?r===t.length||a.includes("m")&&Ve(t[r]||""):e.kind==="lookahead"||e.kind==="negative-lookahead"?Be(e.raw,r,t,a,"prefix"):e.kind==="lookbehind"||e.kind==="negative-lookbehind"?Be(e.raw,r,t,a,"suffix"):!1}function Be(e,r,t,a,n){try{const i=n==="prefix"?t.slice(r):t.slice(0,r),d=n==="prefix"?`^(?:${e})`:`(?:${e})$`;return new RegExp(d,a).test(i)}catch{return!1}}function He(e,r){if(!e)return!1;try{return new RegExp("^\\w$",r).test(e)}catch{return/[A-Za-z0-9_]/.test(e)}}function Ve(e){return e===`
`||e==="\r"||e==="\u2028"||e==="\u2029"}function _e(e,r){let t=0,a=!1,n=!1;for(let i=r;i<e.length;i+=1){const d=e[i];if(n){n=!1;continue}if(d==="\\"){n=!0;continue}if(a){d==="]"&&(a=!1);continue}if(d==="["){a=!0;continue}if(d==="("&&(t+=1),d===")"&&(t-=1,t===0))return e.slice(r,i+1)}return e.slice(r)}function Ht(e,r){const t=e[r+1];if(!t)return"\\";if((t==="p"||t==="P"||t==="u")&&e[r+2]==="{"){const a=e.indexOf("}",r+3);return a===-1?e.slice(r,r+2):e.slice(r,a+1)}if(t==="k"&&(e[r+2]==="<"||e[r+2]==="'")){const a=e[r+2]==="<"?">":"'",n=e.indexOf(a,r+3);return n===-1?e.slice(r,r+2):e.slice(r,n+1)}return t==="c"?e.slice(r,Math.min(e.length,r+3)):e.slice(r,Math.min(e.length,r+2))}function Vt(e,r){let t=r+1,a=!1;for(;t<e.length;){const n=e[t];if(a)a=!1;else if(n==="\\")a=!0;else if(n==="]")return{raw:e.slice(r,t+1),endIndex:t+1};t+=1}return{error:"Unterminated character class."}}function _t(e,r){const t=e[r];if(!t)return{value:{min:1,max:1,mode:"greedy"},endIndex:r};if(t==="?")return be(e,r+1,{min:0,max:1,mode:"greedy"});if(t==="*")return be(e,r+1,{min:0,max:Number.MAX_SAFE_INTEGER,mode:"greedy"});if(t==="+")return be(e,r+1,{min:1,max:Number.MAX_SAFE_INTEGER,mode:"greedy"});if(t==="{"){const a=e.indexOf("}",r);if(a===-1)return{value:{min:1,max:1,mode:"greedy"},endIndex:r};const n=e.slice(r+1,a),[i,d]=n.split(","),u=Number.parseInt(i,10),m=d===void 0||d===""?n.includes(",")?Number.MAX_SAFE_INTEGER:u:Number.parseInt(d,10);return Number.isNaN(u)||Number.isNaN(m)?{value:{min:1,max:1,mode:"greedy"},endIndex:r}:be(e,a+1,{min:u,max:m,mode:"greedy"})}return{value:{min:1,max:1,mode:"greedy"},endIndex:r}}function be(e,r,t){const a=e[r];return a==="?"?{value:{...t,mode:"lazy"},endIndex:r+1}:a==="+"?{value:{...t,mode:"possessive"},endIndex:r+1}:{value:t,endIndex:r}}function Ut(e,r){const t=e.match(/\b([A-Z]{2,})-(\d{2,})\b/);if(t){const n=t[1],i=t[2].length;return{pattern:`\\b${n}-\\d{${i}}\\b`,flags:"g",explanation:`Matches identifiers that begin with ${n}- followed by ${i} digits.`,rationale:["Detected a concrete uppercase identifier example in the provided text.","Specialized the draft around the observed prefix and digit width."],confidence:"high"}}const a=[{regex:/\b[A-Z]{2,}-\d{2,}\b/,pattern:"\\b[A-Z]{2,}-\\d{2,}\\b",explanation:"Matches uppercase prefixes followed by a hyphen and digits."},{regex:/\b\d{4}-\d{2}-\d{2}\b/,pattern:"\\b\\d{4}-\\d{2}-\\d{2}\\b",explanation:"Matches ISO-style dates."},{regex:/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b/,pattern:"\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b",explanation:"Matches UUID values."},{regex:/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,pattern:"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",explanation:"Matches email addresses."},{regex:/https?:\/\/\S+/i,pattern:"https?:\\/\\/\\S+",explanation:"Matches URLs that begin with http or https."}];for(const n of a)if(n.regex.test(e))return{pattern:n.pattern,flags:"g",explanation:n.explanation,rationale:["Detected concrete examples in the provided text.","Drafted a pattern around the repeated structure."],confidence:"medium"};return r.includes("email")?{pattern:V.email.pattern,flags:V.email.flags,explanation:"Matches standard email-like identifiers.",rationale:["The request explicitly mentions email addresses."],confidence:"medium"}:r.includes("url")||r.includes("link")?{pattern:V.url.pattern,flags:V.url.flags,explanation:"Matches web links that start with http or https.",rationale:["The request explicitly mentions URLs or links."],confidence:"medium"}:r.includes("uuid")?{pattern:V.uuid.pattern,flags:V.uuid.flags,explanation:"Matches UUID values across common versions.",rationale:["The request explicitly mentions UUIDs."],confidence:"medium"}:r.includes("date")?{pattern:V.date.pattern,flags:V.date.flags,explanation:"Matches ISO-style dates.",rationale:["The request explicitly mentions dates."],confidence:"medium"}:r.includes("hashtag")?{pattern:V.hashtag.pattern,flags:V.hashtag.flags,explanation:"Matches hashtag-like identifiers.",rationale:["The request explicitly mentions hashtags."],confidence:"medium"}:r.includes("invoice")||r.includes("ticket")||r.includes("id")?{pattern:"\\b[A-Z]{2,}-\\d{2,}\\b",flags:"g",explanation:"Matches uppercase codes followed by a hyphen and digits.",rationale:["The request suggests structured identifiers."],confidence:"low"}:r.includes("number")||r.includes("digit")?{pattern:"\\d+",flags:"g",explanation:"Matches one or more digits.",rationale:["The request mentions numbers or digits."],confidence:"low"}:{pattern:".+",flags:"g",explanation:"Fallback draft that matches non-empty spans. Refine it with block controls or a sample.",rationale:["No strong structural cues were found in the request."],confidence:"low"}}function ve(e){return!e||typeof e!="object"?null:Ae({pattern:String(e.pattern||""),flags:F(e.flags||"g")||"g",explanation:String(e.explanation||""),sample:String(e.sample||""),rationale:Array.isArray(e.rationale)?e.rationale.map(r=>String(r)):[],confidence:String(e.confidence||"medium")})}function Ae(e){return e?{pattern:Le(e.pattern||""),flags:F(e.flags||"g")||"g",explanation:Ue(e.explanation||"",8),sample:String(e.sample||""),rationale:(Array.isArray(e.rationale)?e.rationale:[]).map(r=>Ue(r,8)).filter(Boolean).slice(0,2),confidence:String(e.confidence||"medium")}:null}function pe(e,r){var t;return!(e!=null&&e.pattern)&&!(r!=null&&r.pattern)?null:Ae({pattern:(e==null?void 0:e.pattern)||(r==null?void 0:r.pattern)||"",flags:(e==null?void 0:e.flags)||(r==null?void 0:r.flags)||"g",explanation:(e==null?void 0:e.explanation)||(r==null?void 0:r.explanation)||"",sample:(e==null?void 0:e.sample)||(r==null?void 0:r.sample)||"",rationale:(t=e==null?void 0:e.rationale)!=null&&t.length?e.rationale:(r==null?void 0:r.rationale)||[],confidence:(e==null?void 0:e.confidence)||(r==null?void 0:r.confidence)||"medium"})}function Kt(e){const t=String(e||"").trim().match(/^(\\?\/)(.+)(\\?\/)([dgimsuvy]*)$/s);if(!t)return null;const[,,a,,n]=t;try{const i=Le(a);return Z(i,n),{pattern:i,flags:F(n)||"g"}}catch{return null}}function Wt(e){const r=[String(e||"").trim(),String(e||"").trim().replace(/^pattern\s*[:=]\s*/i,"").trim(),String(e||"").trim().replace(/^["'`]|["'`]$/g,"").trim(),String(e||"").trim().split(`
`).map(t=>t.trim()).find(Boolean)||""];for(const t of r)if(!(!t||t.startsWith("{")||t.includes('"flags"')||t.includes('"pattern"')))try{const a=Le(t);return Z(a,"g"),a}catch{}return null}function Le(e){let r=String(e||"").trim();if(r.startsWith("/")&&r.endsWith("/")||r.startsWith("\\/")&&r.endsWith("\\/")){const t=r.startsWith("\\/")?2:1,a=r.endsWith("\\/")?-2:-1,n=r.slice(t,a);try{Z(n,"g"),r=n}catch{}}return Zt(r)}function Ue(e,r){return String(e||"").trim().split(/\s+/).filter(Boolean).slice(0,r).join(" ")}function b(e,r,t,a,n,i,d=[],u=null){return{id:e,category:r,label:t,token:a,detail:n,engine:i,fields:d,configurable:d.length>0,build:u}}function Jt(e){return String(e).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Ke(e){return String(e||"").replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^")}function We(e){return String(e||"value").trim().replace(/[^\p{L}\p{N}_$]+/gu,"_").replace(/^[^A-Za-z_$]+/,"")||"value"}function ye(e,r){const t=Number.parseInt(e,10);return!Number.isFinite(t)||t<0?r:t}function Zt(e){const r=String(e||"");if(!r.includes("\\\\"))return r;try{return JSON.parse(`"${r.replace(/"/g,'\\"')}"`)}catch{return r}}function Qt(){return Object.entries(V)}function Yt(e,r){if(!r.length)return f(e);let t=0,a="";return r.forEach(n=>{a+=f(e.slice(t,n.index)),a+=`<mark>${f(n.value)}</mark>`,t=n.end}),a+=f(e.slice(t)),a.replace(/\n/g,"<br>")}let g=null,U=null,w=null,S=null,we=[],D={trace:null,currentStep:0},_=0;const Xt=[["email","Email"],["url","URL"],["uuid","UUID"],["date","Date"],["hashtag","Hashtag"]],H={pattern:"\\b\\d{4}-\\d{2}-\\d{2}\\b",flags:"g",input:pt,replacement:"[$MATCH]",replacementFields:{},snippets:[],activeTab:"test",blockQuery:"",selectedBlockId:"",aiModel:Je["code-fast"],aiTemp:"0.1",aiMaxTokens:"48",aiDescription:"Match invoice IDs like INV-1042.",aiSample:"Open INV-1042 and INV-2201 before noon.",traceFilters:["branch","release","match","complete","skip"]};async function lr(e){g=document.createElement("div"),g.className="tool-regex",g.innerHTML=`
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
                ${Object.entries(X).filter(([s,l])=>l.tasks.includes("code-fast")||l.tasks.includes("code")||l.tasks.includes("text")).map(([s,l])=>`<option value="${s}" ${s===Je["code-fast"]?"selected":""}>${l.id} (${l.size})</option>`).join("")}
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
              ${[...new Set(fe.map(s=>s.category))].sort().map(s=>`<option value="${s}">${s.replace(/^[a-z]/,l=>l.toUpperCase())}</option>`).join("")}
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
  `,e.appendChild(g),U=lt(st,"regex-suite",H,{debounceMs:120});const r=U.getSnapshot(),t={pattern:g.querySelector("#regex-pattern"),flags:g.querySelector("#regex-flags"),input:g.querySelector("#regex-input"),results:g.querySelector("#regex-results"),highlighted:g.querySelector("#regex-highlighted"),matchMeta:g.querySelector("#regex-match-meta"),status:g.querySelector("#regex-status"),explanation:g.querySelector("#regex-explain"),debugPreview:g.querySelector("#regex-debug-preview"),debugTrace:g.querySelector("#regex-debug-trace"),debugPattern:g.querySelector("#regex-debug-pattern"),debugSlider:g.querySelector("#regex-debug-slider"),flagMatrix:g.querySelector("#regex-flag-matrix"),createGrid:g.querySelector("#regex-create-grid"),savedSnippets:g.querySelector("#regex-saved-snippets"),replacementBuilder:g.querySelector("#regex-replacement-builder"),replacementOutput:g.querySelector("#regex-replacement-output"),replacementMeta:g.querySelector("#regex-replace-meta"),replacementTemplate:g.querySelector("#regex-replace-template"),presetLibrary:g.querySelector("#regex-preset-library"),breakdownModal:g.querySelector("#regex-breakdown-modal"),flagsModal:g.querySelector("#regex-flags-modal"),blockSearch:g.querySelector("#regex-block-search"),blockCategory:g.querySelector("#regex-block-category"),blockMeta:g.querySelector("#regex-block-meta"),blockGrid:g.querySelector("#regex-block-grid"),blockBuilder:g.querySelector("#regex-block-builder"),blockBuilderModal:g.querySelector("#regex-block-builder-modal"),aiModel:g.querySelector("#regex-ai-model"),aiModelInfo:g.querySelector("#regex-ai-model-info"),aiTemp:g.querySelector("#regex-ai-temp"),aiMaxTokens:g.querySelector("#regex-ai-max-tokens"),aiDescription:g.querySelector("#regex-ai-description"),aiSample:g.querySelector("#regex-ai-sample"),aiStatus:g.querySelector("#regex-ai-status"),aiOutput:g.querySelector("#regex-ai-output"),aiConsole:g.querySelector("#regex-ai-console"),aiEngineTag:g.querySelector("#regex-ai-engine-tag"),aiConfigPanel:g.querySelector("#regex-ai-config-panel"),aiProgressHost:g.querySelector("#regex-ai-progress-host"),aiThinkingZone:g.querySelector("#regex-ai-thinking-zone"),aiThinkingContent:g.querySelector("#regex-ai-thinking-content"),stepPrev:g.querySelector("#btn-regex-step-prev"),stepNext:g.querySelector("#btn-regex-step-next"),stepMeta:g.querySelector("#regex-debug-step-meta"),debugStatus:g.querySelector("#regex-debug-status"),traceFilterGroup:g.querySelector("#regex-trace-filter-group")},a=(s,l="muted")=>{t.aiStatus.textContent=s,q(t.aiStatus,l)};t.pattern.value=r.pattern,t.input.value=r.input,t.blockSearch.value=r.blockQuery||"",t.aiModel.value=r.aiModel||H.aiModel,t.aiTemp.value=r.aiTemp||H.aiTemp,t.aiMaxTokens.value=r.aiMaxTokens||H.aiMaxTokens,t.aiDescription.value=r.aiDescription||H.aiDescription,t.aiSample.value=r.aiSample||H.aiSample;const n=new Set(r.traceFilters||H.traceFilters);t.traceFilterGroup.querySelectorAll("input").forEach(s=>{s.checked=n.has(s.value)}),S={streamed:"",suggestion:ee(t.aiDescription.value,t.aiSample.value),activeModelKey:null,isGenerating:!1,activeView:"draft"};let i=r.selectedBlockId||"",d=y(r.replacementFields,r.replacement),u=null,m=null,h=null,$=null;const M=s=>{U.save(s).catch(()=>{})},q=(s,l="muted")=>{s&&(s.dataset.tone=l)},v=(s,l="muted")=>`
    <div class="regex-empty-state" data-tone="${O(l)}">${f(s)}</div>
  `;function y(s,l){const o=s&&typeof s=="object"?{...s}:{};return!Object.keys(o).length&&l&&(o.match=String(l)),o}const x=()=>F(t.flags.dataset.value||""),p=()=>new Set(Array.from(t.traceFilterGroup.querySelectorAll("input")).filter(s=>s.checked).map(s=>s.value)),E=(s=D.trace)=>{const l=p();return((s==null?void 0:s.steps)||[]).filter(o=>l.has(o.kind))},N=s=>{const l=F(s);return t.flags.dataset.value=l,t.flags.textContent=l||"No flags",t.flags.classList.toggle("is-empty",!l),l},C=s=>{const l=Ze(s);return l.length?l.map(o=>({key:String(o.index),label:o.token,hint:o.name?`<${o.name}>`:`Group ${o.index}`,value:Object.prototype.hasOwnProperty.call(d,o.index)?String(d[o.index]??""):Object.prototype.hasOwnProperty.call(d,String(o.index))?String(d[String(o.index)]??""):o.token})):[{key:"match",label:"$MATCH",hint:"Full match",value:Object.prototype.hasOwnProperty.call(d,"match")?String(d.match??""):"$MATCH"}]},K=s=>{const l=C(s);return l.length?{mode:"groups",groups:l.reduce((o,c)=>(o[c.key]=c.value,o),{})}:{mode:"groups",groups:{match:"$MATCH"}}},te=s=>{const l=C(s);t.replacementBuilder.dataset.signature=l.map(o=>o.key).join("|"),t.replacementBuilder.innerHTML=l.map(o=>`
      <label class="regex-replace-field">
        <span class="regex-replace-token">${f(o.label)}</span>
        <span class="regex-replace-hint">${f(o.hint)}</span>
        <input
          type="text"
          data-regex-replacement-group="${O(o.key)}"
          value="${O(o.value)}"
          placeholder="${O(o.label)}"
        >
      </label>
    `).join(""),t.replacementBuilder.querySelectorAll("[data-regex-replacement-group]").forEach(o=>{o.addEventListener("input",()=>{d[o.dataset.regexReplacementGroup]=o.value,I()})})},re=s=>{const l=xt(s);t.flagMatrix.innerHTML=l.map(o=>`
      <button
        type="button"
        class="regex-flag-card${o.active?" active":""}"
        data-regex-flag-toggle="${O(o.flag)}"
      >
        <strong>${f(o.flag)}</strong>
        <span>${f(o.label)}</span>
        <small>${f(o.detail)}</small>
      </button>
    `).join(""),t.flagMatrix.querySelectorAll("[data-regex-flag-toggle]").forEach(o=>{o.addEventListener("click",()=>{const c=new Set(x().split("").filter(Boolean)),k=o.dataset.regexFlagToggle;c.has(k)?c.delete(k):c.add(k),N(Array.from(c).join("")),I()})})},J=()=>{u==null||u.close("tool")},ae=()=>{u==null||u.open("tool")},oe=()=>{$==null||$.close("tool")};N(r.flags||H.flags);const ce=s=>{g.querySelectorAll("[data-regex-tab]").forEach(l=>{l.classList.toggle("active",l.dataset.regexTab===s)}),g.querySelectorAll(".regex-tab-panel").forEach(l=>l.classList.add("hidden")),g.querySelector(`#regex-tab-${s}`).classList.remove("hidden"),s!=="create"&&J(),M({activeTab:s})},me=s=>{const l=Fe(s);l&&(t.pattern.value=l.pattern,N(l.flags),t.input.value=l.sample,M({pattern:l.pattern,flags:l.flags,input:l.sample}),J(),I())},R=()=>{t.createGrid.innerHTML=Xt.map(([s,l])=>{const o=Fe(s);return`
        <button type="button" class="btn-secondary regex-choice-card" data-create-preset="${s}">
          <div class="regex-choice-card-title">${l}</div>
          <div class="regex-choice-card-code">${o.pattern}</div>
        </button>
      `}).join(""),t.createGrid.querySelectorAll("[data-create-preset]").forEach(s=>{s.addEventListener("click",()=>{me(s.dataset.createPreset)})})},Y=()=>{const s=De(U.getSnapshot().snippets);t.savedSnippets.innerHTML=s.map(l=>`
      <button type="button" class="btn-secondary regex-choice-card regex-snippet-card" data-snippet-id="${l.id}">
        <div class="regex-snippet-head">
          <strong>${f(l.name)}</strong>
          <span class="regex-snippet-kind">${l.builtIn?"Built-in":"Saved"}</span>
        </div>
        <div class="regex-choice-card-code">${f(`/${l.pattern}/${l.flags}`)}</div>
      </button>
    `).join(""),t.savedSnippets.querySelectorAll("[data-snippet-id]").forEach(l=>{l.addEventListener("click",()=>{const o=s.find(c=>c.id===l.dataset.snippetId);o&&(t.pattern.value=o.pattern,N(o.flags),t.input.value=o.sample||t.input.value,M({pattern:o.pattern,flags:o.flags,input:t.input.value}),J(),I())})})},de=()=>{const s=String(t.blockSearch.value||"").trim().toLowerCase(),l=t.blockCategory.value,o=fe.filter(c=>l&&c.category!==l?!1:s?`${c.label} ${c.token} ${c.detail} ${c.category}`.toLowerCase().includes(s):!0);i&&!o.some(c=>c.id===i)&&(i="",$==null||$.close("filter")),t.blockMeta.textContent=`${o.length} blocks.`,t.blockGrid.innerHTML=o.map(c=>`
      <div
        class="block-card regex-block-card"
        draggable="true"
        data-active="${c.id===i?"true":"false"}"
        data-regex-block-id="${O(c.id)}"
        data-regex-block-token="${O(c.token)}"
        title="${O(`${c.detail} · ${c.engine}`)}"
      >
        <div class="regex-block-label">${f(c.label)}</div>
        <div class="regex-block-token">${f(c.token)}</div>
        <div class="regex-block-meta">${f(c.category)}</div>
      </div>
    `).join(""),t.blockGrid.querySelectorAll(".regex-block-card").forEach(c=>{const k=c.dataset.regexBlockToken,P=c.dataset.regexBlockId;c.addEventListener("click",()=>{const T=fe.find(A=>A.id===P);if(T){if(T.configurable){i=T.id,M({selectedBlockId:i}),de(),qe(),$==null||$.open("tool");return}Te(k)}}),c.addEventListener("dragstart",T=>{var A,z;(z=(A=T.dataTransfer)==null?void 0:A.setData)==null||z.call(A,"text/plain",k)})}),i&&qe()},Te=s=>{t.pattern.value=kt(t.pattern.value,s,t.pattern.selectionStart,t.pattern.selectionEnd),t.pattern.focus();const l=(t.pattern.selectionStart||t.pattern.value.length)+String(s||"").length;typeof t.pattern.setSelectionRange=="function"&&t.pattern.setSelectionRange(l,l),M({pattern:t.pattern.value}),I()},qe=()=>{const s=fe.find(c=>c.id===i);if(!(s!=null&&s.configurable)){t.blockBuilder.innerHTML="",$==null||$.close("empty");return}t.blockBuilder.innerHTML=`
      <div class="regex-block-builder-head">
        <div class="regex-block-builder-copy">
          <div class="regex-block-builder-kicker">Selected Block</div>
          <strong class="regex-block-builder-title">${f(s.label)}</strong>
          <div class="regex-block-builder-note">${f(s.detail)}</div>
        </div>
        <div class="regex-block-builder-token">${f(s.token)}</div>
      </div>
      <div class="settings-grid">
        ${s.fields.map(c=>`
          <div class="form-group">
            <label>${f(c.label)}</label>
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
    `;const l=()=>s.fields.reduce((c,k)=>{var P;return c[k.id]=((P=t.blockBuilder.querySelector(`[data-regex-block-field="${k.id}"]`))==null?void 0:P.value)||k.defaultValue||"",c},{}),o=()=>{const c=je(s.id,l());t.blockBuilder.querySelector("#regex-block-preview").textContent=c};t.blockBuilder.querySelectorAll("[data-regex-block-field]").forEach(c=>{c.addEventListener("input",o)}),t.blockBuilder.querySelector("#btn-regex-block-clear").addEventListener("click",()=>{oe()}),t.blockBuilder.querySelector("#btn-regex-block-insert").addEventListener("click",()=>{Te(je(s.id,l())),oe()}),o()};u=he(t.presetLibrary,{closeSelectors:["#btn-regex-close-preset-library"]}),m=he(t.breakdownModal,{closeSelectors:["#btn-regex-close-breakdown"]}),h=he(t.flagsModal,{closeSelectors:["#btn-regex-close-flags"]}),$=he(t.blockBuilderModal,{closeSelectors:["#btn-regex-close-block-builder"],onClose(){i&&(i="",M({selectedBlockId:""}),de())}}),we=[u,m,h,$];const ne=(s="")=>{var c,k;const l=s||((c=S.suggestion)==null?void 0:c.pattern)||"",o=((k=S.suggestion)==null?void 0:k.flags)||"g";t.aiOutput.innerHTML=l?`
          <div class="regex-output-stack">
            <div class="regex-output-pattern">/${f(l)}/${f(o)}</div>
            <div class="regex-output-note">${s?"Streaming local pattern draft...":"Ready to apply to pattern and flags."}</div>
          </div>
        `:v("Build a local draft or use a quick draft.")},Ne=s=>{var l;S.activeView=s,g.querySelectorAll("[data-regex-ai-view]").forEach(o=>{o.classList.toggle("active",o.dataset.regexAiView===s)}),g.querySelectorAll(".regex-ai-view").forEach(o=>o.classList.add("hidden")),(l=g.querySelector(`#regex-ai-view-${s}`))==null||l.classList.remove("hidden")},xe=()=>{var s;t.aiEngineTag.textContent=S.activeModelKey?`ENGINE: ${((s=X[S.activeModelKey])==null?void 0:s.id)||S.activeModelKey}`:"ENGINE: OFFLINE"};w=dt({modelRegistry:X,progressHost:t.aiProgressHost,configPanel:t.aiConfigPanel,modelSelect:t.aiModel,modelInfoNode:t.aiModelInfo,consoleNode:t.aiConsole,consoleEmptyMessage:"[INFO] Regex builder console ready.",thinkingPanel:t.aiThinkingZone,thinkingContent:t.aiThinkingContent,initialModelKey:t.aiModel.value,stopLabel:"Stop Build",readyDetail(s){var l;return((l=X[s])==null?void 0:l.id)||"Local model active."},onProgress(){a("Loading local model...","info")},onReady(s,l){var o;S.activeModelKey=l.state.activeModelKey,xe(),a(`Local model ready: ${((o=X[S.activeModelKey])==null?void 0:o.id)||"builder"}.`,"success")},onAborted(){S.isGenerating=!1,a("Local regex build stopped.","warning")},onThinking(s,l){a(s.state==="start"?"Model is reasoning through the draft…":l.state.visibleText?"Streaming pattern draft…":"Finalizing pattern draft...","info")},onThinkingToken(s,l){a(l.state.visibleText?"Streaming pattern draft…":"Model is reasoning through the draft...","info")},onStream(s){S.streamed=s.text||"",a("Streaming pattern draft...","info"),ne(S.streamed)},resolveCompleteProgress(s){const l=ee(t.aiDescription.value,t.aiSample.value),o=Ge(s.result,l)||l;return{title:o!=null&&o.pattern?"Pattern ready":"Draft fallback kept",detail:o!=null&&o.pattern?`/${o.pattern}/${o.flags||"g"}`:"Quick draft remained active.",tone:o!=null&&o.pattern?"success":"neutral",autoResetMs:1800}},onComplete(s,l){S.isGenerating=!1,S.activeModelKey=l.state.activeModelKey,xe();const o=ee(t.aiDescription.value,t.aiSample.value),c=Ge(s.result,o)||o;S.streamed="",S.suggestion=c,a(c!=null&&c.pattern?"Local pattern draft ready.":"No pattern parsed. Quick draft kept.",c!=null&&c.pattern?"success":"warning"),ne()},onError(s){S.isGenerating=!1,a(s.message,"danger")},renderModelInfo(s,l){return`<strong>ID:</strong> ${f(s.id)}<br><strong>Size:</strong> ${f(s.size)}<br><strong>Mode:</strong> ${f(s.tasks.includes("code-fast")?"Fast pattern completion":s.desc)}<br><strong>Key:</strong> ${f(l)}`}});const Ce=async()=>{var l;const s=t.aiModel.value||H.aiModel;a(`Loading local model: ${((l=X[s])==null?void 0:l.id)||s}.`,"info");try{return await w.ensureModel(s),S.activeModelKey=s,xe(),!0}catch(o){return a(o.message,"danger"),!1}},Re=(s,l)=>{if(!l){_=0;return}_=(_+s+l)%l},tt=(s,l=null)=>{var j;const o=l||((j=D.trace)==null?void 0:j.steps)||[],c=t.pattern.value||"";if(!o.length||!c){t.debugPattern.innerHTML=v("Inspect the pattern structure in sync with trace steps.");return}const k=o[s];if(!k)return;const P=k.patternRange;if(!P){t.debugPattern.textContent=c;return}const T=c.slice(0,P.start),A=c.slice(P.start,P.end),z=c.slice(P.end);t.debugPattern.innerHTML=`
      <span class="regex-debug-pattern-edge">/</span>
      <span class="regex-debug-pattern-base">${f(T)}</span>
      <span class="regex-debug-pattern-segment">${f(A)}</span>
      <span class="regex-debug-pattern-base">${f(z)}</span>
      <span class="regex-debug-pattern-edge">/</span>
    `},rt=(s,l=null)=>{var j;const o=l||((j=D.trace)==null?void 0:j.steps)||[],c=t.input.value||"";if(!o.length||!c){t.debugPreview.innerHTML=v("Step through the trace to inspect the sample text.");return}const k=o[s];if(!k)return;const P=Math.max(0,Math.min(c.length,Number.isFinite(k.cursor)?k.cursor:0)),T=new Set([0,c.length,P]);(k.ranges||[]).forEach(B=>{T.add(Math.max(0,Math.min(c.length,B.start))),T.add(Math.max(0,Math.min(c.length,B.end)))});const A=Array.from(T).sort((B,L)=>B-L);let z='<div class="regex-debug-line">';for(let B=0;B<A.length-1;B+=1){const L=A[B],se=A[B+1];if(P===L&&(z+='<span class="regex-debug-caret" aria-hidden="true"></span>'),se<=L)continue;const ue=c.slice(L,se),ge=er(k.ranges||[],L,se);z+=`<span class="regex-debug-segment regex-debug-segment-${O(ge)}">${f(ue).replace(/\n/g,"<br>")}</span>`}P===c.length&&(z+='<span class="regex-debug-caret" aria-hidden="true"></span>'),z+="</div>",t.debugPreview.innerHTML=z},at=s=>{const l=t.debugTrace.querySelector(`[data-filtered-index="${s}"]`);l&&l.scrollIntoView({behavior:"smooth",block:"center"})},ie=()=>{const{trace:s,currentStep:l}=D,o=E(s);if(!s||!s.steps.length){t.debugStatus.textContent=(s==null?void 0:s.error)||"Add a pattern and sample to start tracing.",t.stepMeta.textContent="0 / 0",t.debugTrace.innerHTML=v("Trace steps appear here once the pattern can be expanded."),t.debugPreview.innerHTML=v("Step through the trace to inspect the sample text."),t.debugPattern.innerHTML=v("Inspect the pattern structure in sync with trace steps."),t.debugSlider.max=0,t.debugSlider.value=0,t.debugSlider.disabled=!0;return}if(!o.length){t.debugStatus.textContent="No steps match the active filters.",t.stepMeta.textContent="0 / 0",t.debugTrace.innerHTML=v("Adjust filters to see trace steps."),t.debugPreview.innerHTML=v("No visible steps."),t.debugPattern.innerHTML=v("No visible steps."),t.debugSlider.max=0,t.debugSlider.value=0,t.debugSlider.disabled=!0;return}const c=Math.max(0,Math.min(o.length-1,l));D.currentStep=c;const k=o[c];t.debugStatus.textContent=k.message,t.stepMeta.textContent=`${c+1} / ${o.length}`,t.debugSlider.disabled=!1,t.debugSlider.max=o.length-1,t.debugSlider.value=c,t.debugTrace.innerHTML=o.map((T,A)=>`
      <button type="button" class="regex-trace-step regex-trace-${O(T.kind||"step")}${A===c?" active":""}${A>c?" future":""}" data-filtered-index="${A}">
        <span class="regex-trace-index">${A+1}</span>
        <div class="regex-trace-copy">
          <strong>${f((T.kind||"step").toUpperCase())}</strong>
          <span>${f(T.message)}</span>
        </div>
      </button>
    `).join("");const P=T=>{D.currentStep=parseInt(T.dataset.filteredIndex,10),ie()};t.debugTrace.querySelectorAll(".regex-trace-step").forEach(T=>{T.addEventListener("click",()=>{P(T)}),T.addEventListener("keydown",A=>{A.key!=="Enter"&&A.key!==" "||(A.preventDefault(),P(T))})}),rt(c,o),tt(c,o),at(c),t.stepPrev.disabled=c<=0,t.stepNext.disabled=c>=o.length-1},I=()=>{var B;const s=t.pattern.value,l=N(x()),o=t.input.value,c=Se(s,l,o),k=((B=c.matches)==null?void 0:B.length)||0;k||(_=0),_>=k&&(_=Math.max(0,k-1)),c.error?(t.highlighted.innerHTML=v(c.error,"danger"),t.results.innerHTML=v(c.error,"danger"),t.status.textContent="Regex error",q(t.status,"danger"),t.matchMeta.textContent="0 / 0"):c.empty||!s&&!o?(t.highlighted.innerHTML=v("Define a pattern to inspect matches."),t.results.innerHTML=v("Define a pattern to inspect matches."),t.status.textContent="Ready.",q(t.status,"muted"),t.matchMeta.textContent="0 / 0"):(t.highlighted.innerHTML=c.count?c.highlightedText:v("No matches found."),t.results.innerHTML=c.count?c.matches.map((L,se)=>`
            <div class="regex-match-card${se===_?" active":""}" data-match-card="${se}">
              <div class="regex-match-card-head">
                <strong class="regex-match-chip">Match ${L.id}</strong>
                <span class="regex-match-range">${L.index}..${L.end}</span>
              </div>
              <div class="regex-match-value">${f(L.value)}</div>
              ${L.groups.length||Object.keys(L.namedGroups).length?`
                <div class="regex-match-groups">
                  ${L.groups.map((ue,ge)=>`<span class="regex-group-chip">Group ${ge+1}: ${f(ue??"null")}</span>`).join("")}
                  ${Object.entries(L.namedGroups).map(([ue,ge])=>`<span class="regex-group-chip regex-group-chip-named">${f(ue)}: ${f(ge??"null")}</span>`).join("")}
                </div>
              `:""}
            </div>
          `).join(""):v("No matches found."),t.status.textContent=c.count?`${c.count} matches found.`:"Valid pattern, no matches.",q(t.status,c.count?"success":"muted"),t.matchMeta.textContent=c.count?`${_+1} / ${c.count}`:"0 / 0");const P=ht(s);t.explanation.innerHTML=P.length?P.map(L=>`
          <div class="studio-output-card regex-summary-card">
            <span>${L.label}</span>
            <strong>${L.detail}</strong>
          </div>
        `).join(""):v("Pattern breakdown appears here.");const T=At(s,l,o,{matchIndex:_});D.trace=T,D.currentStep>=T.steps.length&&(D.currentStep=Math.max(0,T.steps.length-1)),ie(),re(l);const A=C(s).map(L=>L.key).join("|");t.replacementBuilder.dataset.signature!==A&&te(s);const z=K(s),j=yt(s,l,o,z);t.replacementTemplate.textContent=`Template: ${j.template||"$MATCH"}`,t.replacementOutput.value=j.output,t.replacementMeta.textContent=j.error?j.error:j.count?`${j.count} replacements previewed.`:"No replacements applied.",q(t.replacementMeta,j.error?"danger":j.count?"success":"muted"),S.suggestion=S.suggestion||ee(t.aiDescription.value,t.aiSample.value),ne(),t.results.querySelectorAll("[data-match-card]").forEach(L=>{L.addEventListener("click",()=>{_=parseInt(L.dataset.matchCard,10),I()})}),M({pattern:s,flags:l,input:o,replacement:j.template,replacementFields:d,blockQuery:t.blockSearch.value,selectedBlockId:i,aiModel:t.aiModel.value,aiTemp:t.aiTemp.value,aiMaxTokens:t.aiMaxTokens.value,aiDescription:t.aiDescription.value,aiSample:t.aiSample.value,traceFilters:Array.from(p())}),Y()};t.traceFilterGroup.querySelectorAll("input").forEach(s=>{s.addEventListener("change",()=>{ie(),I()})}),t.pattern.addEventListener("input",I),t.input.addEventListener("input",I),t.blockSearch.addEventListener("input",()=>{M({blockQuery:t.blockSearch.value}),de()}),t.blockCategory.addEventListener("change",()=>{de()}),t.aiDescription.addEventListener("input",()=>{S.suggestion=ee(t.aiDescription.value,t.aiSample.value),I()}),t.aiSample.addEventListener("input",()=>{S.suggestion=ee(t.aiDescription.value,t.aiSample.value),I()}),t.aiModel.addEventListener("change",()=>{w==null||w.syncModelInfo(),M({aiModel:t.aiModel.value})}),t.aiTemp.addEventListener("input",()=>{M({aiTemp:t.aiTemp.value})}),t.aiMaxTokens.addEventListener("input",()=>{M({aiMaxTokens:t.aiMaxTokens.value})}),t.pattern.addEventListener("dragover",s=>{s.preventDefault()}),t.pattern.addEventListener("drop",s=>{var o,c;s.preventDefault();const l=(c=(o=s.dataTransfer)==null?void 0:o.getData)==null?void 0:c.call(o,"text/plain");l&&Te(l)}),t.flags.addEventListener("click",()=>{h==null||h.open("tool")}),g.querySelector("#btn-regex-open-preset-library").addEventListener("click",ae),g.querySelector("#btn-regex-open-breakdown").addEventListener("click",()=>m==null?void 0:m.open("tool")),g.querySelector("#btn-copy-regex").addEventListener("click",()=>{Pe(`/${t.pattern.value}/${x()}`)}),g.querySelector("#btn-copy-js").addEventListener("click",()=>{Pe(`const regex = /${t.pattern.value}/${x()};
const input = \`${t.input.value.replace(/`/g,"\\`")}\`;
const matches = [...input.matchAll(regex)];`)}),g.querySelector("#btn-save-snippet").addEventListener("click",async()=>{try{const s=`Snippet ${De(U.getSnapshot().snippets).length+1}`,l=vt(s,t.pattern.value,x(),t.input.value),o=U.getSnapshot().snippets||[];await U.save({snippets:[...o,l]},{immediate:!0}),Y(),Ie("Regex snippet saved.","success")}catch(s){Ie(s.message,"danger")}}),g.querySelector("#btn-prev-match").addEventListener("click",()=>{const s=Se(t.pattern.value,x(),t.input.value);Re(-1,s.count||0),I()}),g.querySelector("#btn-next-match").addEventListener("click",()=>{const s=Se(t.pattern.value,x(),t.input.value);Re(1,s.count||0),I()}),t.stepPrev.addEventListener("click",()=>{D.currentStep>0&&(D.currentStep-=1,ie())}),t.stepNext.addEventListener("click",()=>{const s=E();D.currentStep<s.length-1&&(D.currentStep+=1,ie())}),t.debugSlider.addEventListener("input",()=>{D.currentStep=parseInt(t.debugSlider.value,10),ie()}),g.querySelector("#btn-regex-ai-heuristic").addEventListener("click",()=>{S.suggestion=ee(t.aiDescription.value,t.aiSample.value),S.streamed="",a("Quick draft updated.","success"),ne()}),g.querySelector("#btn-regex-ai-apply").addEventListener("click",()=>{const s=S.suggestion;s!=null&&s.pattern&&(t.pattern.value=s.pattern,N(F(s.flags||"g")),!t.input.value.trim()&&s.sample&&(t.input.value=s.sample),a("Draft applied to pattern and flags.","success"),I())}),g.querySelector("#btn-regex-ai-run").addEventListener("click",async()=>{if(S.isGenerating){w==null||w.stop();return}if(!await Ce())return;S.isGenerating=!0,S.streamed="",a("Starting local pattern draft...","info"),ne("");const s=t.aiModel.value||H.aiModel,l=parseFloat(t.aiTemp.value)||.1,o=parseInt(t.aiMaxTokens.value,10)||48,c=Et({model:X[s],description:t.aiDescription.value,sample:t.aiSample.value,temp:l,maxTokens:o});w.run(c,{title:"Building pattern...",detail:c.isRaw?"Streaming short code-style completion.":"Streaming short JSON draft."})}),g.querySelector("#btn-regex-ai-setup").addEventListener("click",()=>{w==null||w.toggleConfig()}),g.querySelector("#btn-regex-ai-cancel").addEventListener("click",()=>{w==null||w.closeConfig()}),g.querySelector("#btn-regex-ai-activate").addEventListener("click",async()=>{await Ce()&&(a("Engine activated for regex drafts.","success"),w==null||w.closeConfig())}),g.querySelector("#btn-regex-ai-clear-console").addEventListener("click",()=>{w==null||w.clearConsole()}),g.querySelectorAll("[data-regex-ai-view]").forEach(s=>{s.addEventListener("click",()=>{Ne(s.dataset.regexAiView)})}),g.querySelectorAll("[data-regex-tab]").forEach(s=>{s.addEventListener("click",()=>ce(s.dataset.regexTab))}),R(),Y(),de(),ne(),Ne(S.activeView),xe(),ce(r.activeTab||"test"),I()}function or(){we.forEach(e=>e.destroy()),we=[],U==null||U.dispose(),U=null,w==null||w.destroy(),w=null,S=null,g&&g.remove(),g=null,_=0}function O(e){return f(e).replace(/"/g,"&quot;")}function er(e,r,t){let a="idle";for(const n of e||[])if(r>=n.start&&t<=n.end){if(n.state==="full")return"full";n.state==="fail"?a="fail":n.state==="attempt"&&a!=="fail"&&(a="attempt")}return a}export{lr as mount,or as unmount};
