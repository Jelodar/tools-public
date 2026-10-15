const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/webmedia-service-GxHxy0i-.js","assets/webmedia-plan-D1Y4YVJg.js"])))=>i.map(i=>d[i]);
import{c as Z,_ as G}from"./index-ATPg-6Fd.js";import{s as ae,d as J}from"./ui-utils-BycjcbQ0.js";import{r as ie}from"./ffmpeg-service-1yXYe4k5.js";import{c as oe,a as se}from"./media-trimmer-Dp4x8F6m.js";import{c as X}from"./media-visualization-D8M9LHeC.js";import{d as ne}from"./media-audio-import-BMS9Ox55.js";import{b as ce,s as U}from"./media-session-BHNa2ppJ.js";import"./pool-zSCgtDDn.js";const ee={archival:{mp4Crf:"18",webmCrf:"28",videoBitrate:"12M",audioBitrate:"192k"},balanced:{mp4Crf:"21",webmCrf:"32",videoBitrate:"8M",audioBitrate:"160k"},compact:{mp4Crf:"26",webmCrf:"36",videoBitrate:"4M",audioBitrate:"128k"}};function de(c){const e=Number(c)||1920;return e>=3840?18e6:e>=2560?14e6:e>=1920?1e7:6e6}function le(c){const e=String(c||"monitor");return["monitor","window","browser"].includes(e)?e:"monitor"}function ue(c){const{sourceName:e,sourceBuffer:y,clipStart:w=0,clipEnd:g=0,duration:f=0,format:h="mp4",quality:x="balanced",muteSourceAudio:A=!1,sourceHasAudio:B=!0,replacementAudioName:M="",replacementAudioBuffer:R=null}=c,T=ee[x]?x:"balanced",d=ee[T],t=h==="webm"?"webm":"mp4",r=Math.max(0,Number(w)||0),n=Math.max(.1,Number(f)||.1),o=Math.max(r+.1,Math.min(Number(g)||n,n)),p=Number((o-r).toFixed(3)),u=[{name:e,buffer:y}],l=["-ss",String(r),"-i",e,"-t",String(p)],b=!!(R&&M),q=!!B&&!A&&!b;b&&(u.push({name:M,buffer:R}),l.push("-i",M)),t==="mp4"?l.push("-c:v","libx264","-preset","slow","-crf",d.mp4Crf,"-pix_fmt","yuv420p","-movflags","+faststart"):l.push("-c:v","libvpx-vp9","-b:v",d.videoBitrate,"-crf",d.webmCrf,"-deadline","good"),b?(t==="mp4"?l.push("-c:a","aac","-b:a",d.audioBitrate):l.push("-c:a","libopus","-b:a",d.audioBitrate),l.push("-map","0:v:0","-map","1:a:0","-shortest")):q?(t==="mp4"?l.push("-c:a","aac","-b:a",d.audioBitrate):l.push("-c:a","libopus","-b:a",d.audioBitrate),l.push("-map","0:v:0","-map","0:a:0?")):l.push("-an","-map","0:v:0");const N=t==="mp4"?"mp4":"webm",m=t==="mp4"?"video/mp4":"video/webm",P=`screen_recording_${Date.now()}.${N}`;return l.push(P),{files:u,command:l,outputName:P,mimeType:m,clipStart:r,clipEnd:o,clipDuration:p,hasReplacementAudio:b,keepOriginalAudio:q}}let a=null,s=null,j=[],V=null,v=null,S=null,$="",D=null,H=0,O=null,k=0,_=0,I=0,W=!1,E=null,L=null,i=null,z=0,Q=!1,F=[];function K(){O&&window.clearInterval(O),O=null}function Y(c=null){V&&(V.getTracks().forEach(e=>e.stop()),V=null,c&&(c.srcObject=null))}function pe(c,{start:e=0,end:y=0}={}){let w=Math.max(0,Number(e)||0),g=Math.max(0,Number(y)||0);return g<w&&([w,g]=[g,w]),{operation:"trim",source:c,targetContainer:"webm",settings:{trim:{mode:"packet",start:w,end:g}}}}async function ve({blob:c,start:e,end:y,progress:w,exportState:g}){var h;let f=null;try{const[{createWebMediaService:x},{planWebMediaOperation:A}]=await Promise.all([G(()=>import("./webmedia-service-GxHxy0i-.js"),__vite__mapDeps([0,1])),G(()=>import("./webmedia-plan-D1Y4YVJg.js").then(t=>t.w),[])]);f=x(),w.update({title:"Browser-native trim",detail:"Inspecting capture codecs…",progress:6,busy:!0});const B=await f.inspectFile(c),M=B==null?void 0:B.inspection;if(!M)throw new Error("Capture could not be inspected for native trim.");const R=A(pe(M,{start:e,end:y}));if(R.errors.length)return g.textContent=`Browser-native trim unavailable: ${R.errors[0].message}`,!1;const T=`screen_capture_trim_${Date.now()}.webm`,d=await f.run(R,{mediaFile:c,jobId:`native-trim-${Date.now().toString(36)}`,onEvent(t){t.type==="progress"&&w.update({title:"Browser-native trim",detail:"Copying packets without re-encoding…",progress:Math.max(8,Math.min(98,Number(t.payload.percent)||0)),busy:Number(t.payload.percent)<100})}});return J(d.blob,T,d.mime||"video/webm"),g.textContent=`Native trim saved as ${T}.`,!0}catch(x){return g.textContent=`Browser-native trim failed: ${(x==null?void 0:x.message)||"unknown error"}`,!1}finally{(h=f==null?void 0:f.dispose)==null||h.call(f)}}function me(){return new Promise(c=>{var y;const e=globalThis.requestAnimationFrame||((y=globalThis.window)==null?void 0:y.requestAnimationFrame);if(typeof e=="function"){e(()=>c());return}setTimeout(c,0)})}async function Pe(c){F=[],a=document.createElement("div"),a.className="tool-recorder",a.innerHTML=`
    <div class="card rj-layout screen-recorder-shell">
      <div class="screen-recorder-capture-grid">
        <div class="screen-recorder-preview-panel">
          <div id="recorder-viewport" class="screen-recorder-viewport">
            <video id="record-preview" class="screen-recorder-preview" autoplay muted playsinline></video>
            <div id="rec-indicator" class="hidden screen-recorder-indicator">
              <div class="screen-recorder-indicator-dot"></div>
              <span id="rec-indicator-label" class="screen-recorder-indicator-label">REC</span>
            </div>
          </div>
        </div>

        <div class="screen-recorder-settings-panel">
          <div class="settings-grid screen-recorder-settings-grid">
            <div class="form-group">
              <label>Capture Surface</label>
              <select id="rec-surface">
                <option value="monitor">Screen</option>
                <option value="window">Window</option>
                <option value="browser">Browser Tab</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target Resolution</label>
              <select id="rec-res">
                <option value="3840">4K</option>
                <option value="2560">1440p</option>
                <option value="1920" selected>1080p</option>
                <option value="1280">720p</option>
              </select>
            </div>
            <div class="form-group">
              <label>Frame Rate</label>
              <select id="rec-fps">
                <option value="60">60 FPS</option>
                <option value="30" selected>30 FPS</option>
                <option value="24">24 FPS</option>
              </select>
            </div>
            <div class="form-group">
              <label>Audio Capture</label>
              <select id="rec-audio-mode">
                <option value="system" selected>System if available</option>
                <option value="none">No audio</option>
              </select>
            </div>
          </div>

          <div class="screen-recorder-controls">
            <button id="btn-rec-start" class="screen-recorder-primary-action">Start Capture</button>
            <button id="btn-rec-pause" class="hidden btn-secondary screen-recorder-secondary-action">Pause</button>
            <button id="btn-rec-resume" class="hidden btn-secondary screen-recorder-secondary-action">Resume</button>
            <button id="btn-rec-stop" class="hidden btn-secondary screen-recorder-primary-action">Stop Capture</button>
          </div>

          <div id="recording-diagnostics" class="screen-recorder-diagnostics">
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Status</span>
              <strong id="diag-status">Idle</strong>
            </div>
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Source Audio</span>
              <strong id="diag-audio">Waiting</strong>
            </div>
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Elapsed</span>
              <strong id="diag-elapsed">00:00</strong>
            </div>
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Recorder Codec</span>
              <strong id="diag-codec">Auto</strong>
            </div>
          </div>

          <div id="recording-progress-host" class="screen-recorder-progress-host"></div>
        </div>
      </div>

      <section id="recording-review" class="hidden screen-recorder-review">
        <div class="screen-recorder-review-header">
          <div>
            <h3 class="screen-recorder-review-title">Review</h3>
            <div id="review-summary" class="screen-recorder-review-summary">No capture yet.</div>
          </div>
          <div class="screen-recorder-review-actions">
            <button id="btn-download-raw" class="btn-secondary">Download Raw Capture</button>
          </div>
        </div>

        <div class="screen-recorder-review-grid">
          <div class="screen-recorder-review-media-panel">
            <video id="review-preview" class="screen-recorder-review-preview" playsinline></video>

            <div id="review-trimmer-host"></div>
          </div>

          <div class="screen-recorder-export-panel">
            <div class="settings-grid screen-recorder-export-settings">
              <div class="form-group">
                <label>Export Format</label>
                <select id="review-format">
                  <option value="mp4" selected>MP4 (H.264 + AAC)</option>
                  <option value="webm">WebM (VP9 + Opus)</option>
                  <option value="webm-native">WebM (browser-native trim, no re-encode)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Quality</label>
                <select id="review-quality">
                  <option value="archival">Archival</option>
                  <option value="balanced" selected>Balanced</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>

            <div class="settings-grid screen-recorder-audio-settings">
              <div class="form-group screen-recorder-switch-row">
                <label class="rj-switch">
                  <input type="checkbox" id="review-mute">
                  <span class="slider-switch"></span>
                </label>
                <label for="review-mute" class="screen-recorder-switch-label">Mute source audio</label>
              </div>
              <div class="form-group">
                <label>Replace Audio Track</label>
                <div id="replacement-audio-shell" class="screen-recorder-replacement-shell">
                  <button id="btn-pick-audio" class="btn-secondary" type="button">Choose Audio File</button>
                  <span id="replacement-audio-name" class="screen-recorder-replacement-name">No replacement audio selected.</span>
                  <input type="file" id="replacement-audio-input" class="hidden" accept="audio/*,video/*">
                </div>
              </div>
            </div>

            <div class="screen-recorder-export-actions">
              <button id="btn-export-edited" class="screen-recorder-export-button">Export Capture</button>
              <button id="btn-reset-review" class="btn-secondary screen-recorder-reset-button">Discard Review</button>
            </div>
            <div id="screen-recorder-export-state" class="screen-recorder-export-state">Waiting for a capture.</div>
            <div id="recording-export-progress-host" class="screen-recorder-progress-host screen-recorder-export-progress-host"></div>
          </div>
        </div>
      </section>

      <p class="screen-recorder-note">
        Capture stays local. Review exports can trim, mute, swap audio, and transcode before download.
      </p>
    </div>
  `,c.appendChild(a),E=Z(a.querySelector("#recording-progress-host"),{variant:"compact"}),L=Z(a.querySelector("#recording-export-progress-host"),{variant:"compact"}),E.update({title:"Recorder ready",detail:"Pick a surface and start capture.",autoResetMs:1600});const e={preview:a.querySelector("#record-preview"),indicator:a.querySelector("#rec-indicator"),indicatorLabel:a.querySelector("#rec-indicator-label"),start:a.querySelector("#btn-rec-start"),pause:a.querySelector("#btn-rec-pause"),resume:a.querySelector("#btn-rec-resume"),stop:a.querySelector("#btn-rec-stop"),status:a.querySelector("#diag-status"),audio:a.querySelector("#diag-audio"),elapsed:a.querySelector("#diag-elapsed"),codec:a.querySelector("#diag-codec"),review:a.querySelector("#recording-review"),reviewPreview:a.querySelector("#review-preview"),reviewSummary:a.querySelector("#review-summary"),reviewFormat:a.querySelector("#review-format"),reviewQuality:a.querySelector("#review-quality"),reviewMute:a.querySelector("#review-mute"),replacementInput:a.querySelector("#replacement-audio-input"),replacementName:a.querySelector("#replacement-audio-name"),reviewTrimmerHost:a.querySelector("#review-trimmer-host"),exportPanel:a.querySelector(".screen-recorder-export-panel"),exportState:a.querySelector("#screen-recorder-export-state")},y=()=>{var t,r;v&&((r=(t=e.reviewPreview).play)==null||r.call(t))},w=()=>{var t,r;(r=(t=e.reviewPreview).pause)==null||r.call(t)},g=()=>{!v||e.reviewPreview.paused?y():w()};F.push(ce({target:window,metadata:{title:"Screen Recorder Review",artist:"Jelodar Tools"},playbackState:"paused",handlers:{play:y,pause:w,stop:w,toggle:g}}));const f=t=>{const r=Math.max(0,Math.floor(t||0)),n=String(Math.floor(r/60)).padStart(2,"0"),o=String(r%60).padStart(2,"0");e.elapsed.textContent=`${n}:${o}`},h=t=>{e.start.classList.toggle("hidden",t!=="idle"),e.pause.classList.toggle("hidden",t!=="recording"),e.resume.classList.toggle("hidden",t!=="paused"),e.stop.classList.toggle("hidden",t==="idle"),e.indicator.classList.toggle("hidden",t==="idle"),e.indicatorLabel.textContent=t==="paused"?"PAUSED":"REC",e.status.textContent=t==="idle"?"Idle":t==="paused"?"Paused":"Recording"},x=()=>{var t,r;$&&URL.revokeObjectURL($),v=null,$="",D=null,k=0,e.review.classList.add("hidden"),e.reviewPreview.removeAttribute("src"),(r=(t=e.reviewPreview).load)==null||r.call(t),S&&(S.disabled=!0),U("paused"),e.reviewSummary.textContent="No capture yet.",e.replacementName.textContent="No replacement audio selected.",e.exportState.textContent="Waiting for a capture.",e.reviewMute.checked=!1,L==null||L.hide(),i==null||i.destroy(),i=null},A=()=>["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(r=>{var n;return(n=MediaRecorder.isTypeSupported)==null?void 0:n.call(MediaRecorder,r)})||"",B=()=>{i==null||i.destroy(),i=oe({mount:e.reviewTrimmerHost,idPrefix:"screen",duration:k||.1,start:0,end:k||.1,minSpan:.1,zoom:1,maxZoom:100,isLooping:Q,onChange(o){_=o.start,I=o.end,o.reason==="selection"&&(e.reviewPreview.currentTime=o.start)},onRulerSeek({time:o}){e.reviewPreview.currentTime=o},onSeek(o){e.reviewPreview.currentTime=o},onTogglePlayback({isPlaying:o,time:p}){o?(p!==void 0&&(e.reviewPreview.currentTime=p),(e.reviewPreview.currentTime>=I||e.reviewPreview.currentTime<_)&&(e.reviewPreview.currentTime=_),e.reviewPreview.play()):e.reviewPreview.pause()},onLoopChange({isLooping:o}){Q=o}});const t=()=>{if(i&&!e.reviewPreview.paused){if(e.reviewPreview.currentTime>=I){Q?(e.reviewPreview.currentTime=_,e.reviewPreview.play()):(e.reviewPreview.pause(),i.clearPlayhead(),i.emitEnded());return}i.setPlayhead(e.reviewPreview.currentTime)}},r=()=>{i==null||i.setPlaying(!0),U("playing")},n=()=>{i==null||i.setPlaying(!1),U("paused")};e.reviewPreview.addEventListener("timeupdate",t),e.reviewPreview.addEventListener("play",r),e.reviewPreview.addEventListener("pause",n),F.push(()=>{e.reviewPreview.removeEventListener("timeupdate",t),e.reviewPreview.removeEventListener("play",r),e.reviewPreview.removeEventListener("pause",n)})},M=async()=>{var n;if(!v||!i)return;const t=++z;if(!W){const o=await X({blob:v,count:12,width:104,height:58});if(t!==z||!i)return;i.setFrameStrip(o),i.setLoading({visible:!1});return}i.setLoading({visible:!0,title:"Preparing waveform",detail:"Analyzing local capture...",progress:8});try{const o=await se({file:v,fileName:"capture.webm",cacheKey:`capture:${v.size}:${k}`,maxBins:32768,onEvent(p){!i||t!==z||(p.type==="ffmpeg-progress"?i.setLoading({visible:!0,title:"Preparing waveform",detail:"Decoding capture audio...",progress:p.payload.progress}):p.type==="waveform-status"&&i.setLoading({visible:p.payload.phase!=="complete",title:"Preparing waveform",detail:p.payload.message,progress:p.payload.phase==="complete"?100:72}))}});if(t!==z||!i)return;if((n=o==null?void 0:o.levels)!=null&&n.length){i.setWaveform(o),i.setLoading({visible:!1});return}}catch{}const r=await X({blob:v,count:12,width:104,height:58});t!==z||!i||(i.setFrameStrip(r),i.setLoading({visible:!1}))},R=t=>{v=t,$=URL.createObjectURL(t),e.reviewPreview.src=$,e.review.classList.remove("hidden"),S&&(S.disabled=!1),e.reviewSummary.textContent=`${(t.size/1024/1024).toFixed(2)} MB capture ready for trim and export.`,e.exportState.textContent="Ready to export trimmed capture.";const r=()=>{const n=Number(e.reviewPreview.duration),o=Number.isFinite(n)&&n>0?n:k||.1;k=o,_=0,I=o,f(o),B(),M()};e.reviewPreview.addEventListener("loadedmetadata",r,{once:!0}),F.push(()=>e.reviewPreview.removeEventListener("loadedmetadata",r))},T=()=>{if(!(a!=null&&a.isConnected))return;const t=new Blob(j,{type:(s==null?void 0:s.mimeType)||"video/webm"}),r=performance.now();k=Math.max(.1,(r-H)/1e3),R(t),Y(e.preview),K(),s=null,h("idle"),E.update({title:"Capture ready",detail:"Review or export the recording below.",tone:"success",autoResetMs:2200})};e.start.addEventListener("click",async()=>{var t;try{x();const r=Number(a.querySelector("#rec-res").value),n=Number(a.querySelector("#rec-fps").value),o=le(a.querySelector("#rec-surface").value),p=a.querySelector("#rec-audio-mode").value!=="none",u=await navigator.mediaDevices.getDisplayMedia({video:{width:{ideal:r},frameRate:{ideal:n},displaySurface:o},audio:p});V=u,W=u.getAudioTracks().length>0,e.audio.textContent=W?"Present":"None",e.preview.srcObject=u,j=[];const l=A();s=new MediaRecorder(u,{mimeType:l,videoBitsPerSecond:de(r)}),e.codec.textContent=l||"Browser default",H=performance.now(),s.ondataavailable=m=>{var P;(P=m.data)!=null&&P.size&&j.push(m.data)};const b=()=>T(),q=()=>h("paused"),N=()=>h("recording");s.addEventListener("stop",b),s.addEventListener("pause",q),s.addEventListener("resume",N),F.push(()=>{s&&(s.removeEventListener("stop",b),s.removeEventListener("pause",q),s.removeEventListener("resume",N))}),(t=u.getVideoTracks()[0])==null||t.addEventListener("ended",()=>{(s==null?void 0:s.state)!=="inactive"&&s.stop()}),s.start(250),h("recording"),E.update({title:"Capture live",detail:`${o} capture at ${r}px / ${n}fps.`,busy:!0}),O=window.setInterval(()=>{f((performance.now()-H)/1e3)},250)}catch(r){ae(`Capture failed: ${r.message}`,"danger"),Y(e.preview),K(),h("idle"),E.update({title:"Capture failed",detail:r.message,tone:"danger"})}}),e.pause.addEventListener("click",()=>{(s==null?void 0:s.state)==="recording"&&s.pause()}),e.resume.addEventListener("click",()=>{(s==null?void 0:s.state)==="paused"&&s.resume()}),e.stop.addEventListener("click",()=>{s!=null&&s.state&&s.state!=="inactive"&&s.stop()}),a.querySelector("#btn-pick-audio").addEventListener("click",()=>{e.replacementInput.click()}),e.replacementInput.addEventListener("change",t=>{const r=t.target.files[0];r&&(D=r,e.replacementName.textContent=r.name)}),S=a.querySelector("#btn-download-raw"),S==null||S.addEventListener("click",()=>{if(!v){e.exportState.textContent="Nothing captured yet.";return}const t=(v.type.split(";")[0].split("/")[1]||"webm").replace(/[^a-z0-9]/gi,""),r=`screen_capture_${Date.now()}.${t||"webm"}`;J(v,r,v.type),e.exportState.textContent=`Raw capture saved as ${r}.`}),S&&(S.disabled=!0),a.querySelector("#btn-reset-review").addEventListener("click",()=>{x(),h("idle")});const d=a.querySelector("#btn-export-edited");d.addEventListener("click",async()=>{var b,q;if(!v||d.disabled)return;const t=a.querySelector("#review-format").value,r=a.querySelector("#review-quality").value,n=_,o=I,p=e.reviewMute.checked,u=L,l=d.textContent;if(d.disabled=!0,d.textContent="Preparing Export",e.exportState.textContent="Preparing local export...",(q=(b=e.exportPanel)==null?void 0:b.scrollIntoView)==null||q.call(b,{block:"center",behavior:"smooth"}),u.update({title:"Preparing export",detail:"Reading local capture and export settings.",progress:2,busy:!0}),t==="webm-native"){await ve({blob:v,start:n,end:o,progress:u,exportState:e.exportState}),d.disabled=!1,d.textContent=l;return}await me();try{const N=await v.arrayBuffer();u.update({title:"Preparing export",detail:"Building local FFmpeg command.",progress:8,busy:!0}),e.exportState.textContent="Building local export plan...";let m=null;D&&(m=await ne(D,{sampleRate:48e3,outputName:"replacement.wav",onConvertStart:()=>{u.update({title:"Preparing audio",detail:`Extracting audio from ${D.name}`,busy:!0})},onEvent:C=>{C.type==="ffmpeg-progress"&&(u.update({progress:C.payload.progress,detail:`Preparing audio... ${C.payload.progress.toFixed(1)}%`,busy:!0}),e.exportState.textContent=`Preparing replacement audio... ${C.payload.progress.toFixed(1)}%`)}}),m.wasConverted&&(e.replacementName.textContent=`${m.name} (audio extracted)`));const P=ue({sourceName:"input.webm",sourceBuffer:N,clipStart:n,clipEnd:o,duration:k,format:t,quality:r,muteSourceAudio:p,sourceHasAudio:W,replacementAudioName:(m==null?void 0:m.mediaName)||"",replacementAudioBuffer:(m==null?void 0:m.arrayBuffer)||null}),{name:te,buffer:re}=await ie({files:P.files,command:P.command,outputFileName:P.outputName,onEvent:C=>{C.type==="ffmpeg-progress"&&(u.update({progress:C.payload.progress,detail:`Encoding capture... ${C.payload.progress.toFixed(1)}%`,busy:!0}),e.exportState.textContent=`Encoding capture... ${C.payload.progress.toFixed(1)}%`)}});J(new Blob([re]),te),e.exportState.textContent="Export complete.",u.update({title:"Export complete",detail:"Capture exported successfully",tone:"success",autoResetMs:5e3})}catch(N){e.exportState.textContent="Export failed.",u.update({title:"Export failed",detail:N.message,tone:"danger"})}finally{d.disabled=!1,d.textContent=l}})}function Ce(){Y(),K(),i==null||i.destroy(),i=null,E==null||E.destroy(),E=null,L==null||L.destroy(),L=null;for(const c of F)c();F=[],a&&a.remove()}export{pe as buildNativeTrimPlanInput,Pe as mount,Ce as unmount};
