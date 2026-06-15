import{s as te,d as K}from"./ui-utils-CG6aKAAj.js";import{r as re}from"./ffmpeg-service-BWSpdkYk.js";import{c as ae,a as ie}from"./media-trimmer-U6E26pVc.js";import{d as Y}from"./index-CoRJqXFF.js";import{c as Z}from"./media-visualization-D8M9LHeC.js";import{d as oe}from"./media-audio-import-267JXjjg.js";import{b as se,s as V}from"./media-session-BHNa2ppJ.js";import"./pool-CFv1-M46.js";const G={archival:{mp4Crf:"18",webmCrf:"28",videoBitrate:"12M",audioBitrate:"192k"},balanced:{mp4Crf:"21",webmCrf:"32",videoBitrate:"8M",audioBitrate:"160k"},compact:{mp4Crf:"26",webmCrf:"36",videoBitrate:"4M",audioBitrate:"128k"}};function ne(u){const e=Number(u)||1920;return e>=3840?18e6:e>=2560?14e6:e>=1920?1e7:6e6}function ce(u){const e=String(u||"monitor");return["monitor","window","browser"].includes(e)?e:"monitor"}function de(u){const{sourceName:e,sourceBuffer:C,clipStart:q=0,clipEnd:z=0,duration:T=0,format:h="mp4",quality:R="balanced",muteSourceAudio:I=!1,sourceHasAudio:U=!0,replacementAudioName:M="",replacementAudioBuffer:A=null}=u,W=G[R]?R:"balanced",p=G[W],t=h==="webm"?"webm":"mp4",a=Math.max(0,Number(q)||0),n=Math.max(.1,Number(T)||.1),o=Math.max(a+.1,Math.min(Number(z)||n,n)),d=Number((o-a).toFixed(3)),l=[{name:e,buffer:C}],c=["-ss",String(a),"-i",e,"-t",String(d)],w=!!(A&&M),S=!!U&&!I&&!w;w&&(l.push({name:M,buffer:A}),c.push("-i",M)),t==="mp4"?c.push("-c:v","libx264","-preset","slow","-crf",p.mp4Crf,"-pix_fmt","yuv420p","-movflags","+faststart"):c.push("-c:v","libvpx-vp9","-b:v",p.videoBitrate,"-crf",p.webmCrf,"-deadline","good"),w?(t==="mp4"?c.push("-c:a","aac","-b:a",p.audioBitrate):c.push("-c:a","libopus","-b:a",p.audioBitrate),c.push("-map","0:v:0","-map","1:a:0","-shortest")):S?(t==="mp4"?c.push("-c:a","aac","-b:a",p.audioBitrate):c.push("-c:a","libopus","-b:a",p.audioBitrate),c.push("-map","0:v:0","-map","0:a:0?")):c.push("-an","-map","0:v:0");const x=t==="mp4"?"mp4":"webm",v=t==="mp4"?"video/mp4":"video/webm",f=`screen_recording_${Date.now()}.${x}`;return c.push(f),{files:l,command:c,outputName:f,mimeType:v,clipStart:a,clipEnd:o,clipDuration:d,hasReplacementAudio:w,keepOriginalAudio:S}}let r=null,s=null,j=[],_=null,m=null,k="",B=null,H=0,D=null,P=0,L=0,F=0,$=!1,b=null,y=null,i=null,N=0,O=!1,E=[];function Q(){D&&window.clearInterval(D),D=null}function J(u=null){_&&(_.getTracks().forEach(e=>e.stop()),_=null,u&&(u.srcObject=null))}function le(){return new Promise(u=>{var C;const e=globalThis.requestAnimationFrame||((C=globalThis.window)==null?void 0:C.requestAnimationFrame);if(typeof e=="function"){e(()=>u());return}setTimeout(u,0)})}async function ye(u){E=[],r=document.createElement("div"),r.className="tool-recorder",r.innerHTML=`
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
            <button id="btn-download-raw" class="btn-secondary">Download Raw WebM</button>
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
  `,u.appendChild(r),b=Y(r.querySelector("#recording-progress-host"),{variant:"compact"}),y=Y(r.querySelector("#recording-export-progress-host"),{variant:"compact"}),b.update({title:"Recorder ready",detail:"Pick a surface and start capture.",autoResetMs:1600});const e={preview:r.querySelector("#record-preview"),indicator:r.querySelector("#rec-indicator"),indicatorLabel:r.querySelector("#rec-indicator-label"),start:r.querySelector("#btn-rec-start"),pause:r.querySelector("#btn-rec-pause"),resume:r.querySelector("#btn-rec-resume"),stop:r.querySelector("#btn-rec-stop"),status:r.querySelector("#diag-status"),audio:r.querySelector("#diag-audio"),elapsed:r.querySelector("#diag-elapsed"),codec:r.querySelector("#diag-codec"),review:r.querySelector("#recording-review"),reviewPreview:r.querySelector("#review-preview"),reviewSummary:r.querySelector("#review-summary"),reviewFormat:r.querySelector("#review-format"),reviewQuality:r.querySelector("#review-quality"),reviewMute:r.querySelector("#review-mute"),replacementInput:r.querySelector("#replacement-audio-input"),replacementName:r.querySelector("#replacement-audio-name"),reviewTrimmerHost:r.querySelector("#review-trimmer-host"),exportPanel:r.querySelector(".screen-recorder-export-panel"),exportState:r.querySelector("#screen-recorder-export-state")},C=()=>{var t,a;m&&((a=(t=e.reviewPreview).play)==null||a.call(t))},q=()=>{var t,a;(a=(t=e.reviewPreview).pause)==null||a.call(t)},z=()=>{!m||e.reviewPreview.paused?C():q()};E.push(se({target:window,metadata:{title:"Screen Recorder Review",artist:"Jelodar Tools"},playbackState:"paused",handlers:{play:C,pause:q,stop:q,toggle:z}}));const T=t=>{const a=Math.max(0,Math.floor(t||0)),n=String(Math.floor(a/60)).padStart(2,"0"),o=String(a%60).padStart(2,"0");e.elapsed.textContent=`${n}:${o}`},h=t=>{e.start.classList.toggle("hidden",t!=="idle"),e.pause.classList.toggle("hidden",t!=="recording"),e.resume.classList.toggle("hidden",t!=="paused"),e.stop.classList.toggle("hidden",t==="idle"),e.indicator.classList.toggle("hidden",t==="idle"),e.indicatorLabel.textContent=t==="paused"?"PAUSED":"REC",e.status.textContent=t==="idle"?"Idle":t==="paused"?"Paused":"Recording"},R=()=>{var t,a;k&&URL.revokeObjectURL(k),m=null,k="",B=null,P=0,e.review.classList.add("hidden"),e.reviewPreview.removeAttribute("src"),(a=(t=e.reviewPreview).load)==null||a.call(t),V("paused"),e.reviewSummary.textContent="No capture yet.",e.replacementName.textContent="No replacement audio selected.",e.exportState.textContent="Waiting for a capture.",e.reviewMute.checked=!1,y==null||y.hide(),i==null||i.destroy(),i=null},I=()=>["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(a=>{var n;return(n=MediaRecorder.isTypeSupported)==null?void 0:n.call(MediaRecorder,a)})||"",U=()=>{i==null||i.destroy(),i=ae({mount:e.reviewTrimmerHost,idPrefix:"screen",duration:P||.1,start:0,end:P||.1,minSpan:.1,zoom:1,maxZoom:100,isLooping:O,onChange(o){L=o.start,F=o.end,o.reason==="selection"&&(e.reviewPreview.currentTime=o.start)},onRulerSeek({time:o}){e.reviewPreview.currentTime=o},onSeek(o){e.reviewPreview.currentTime=o},onTogglePlayback({isPlaying:o,time:d}){o?(d!==void 0&&(e.reviewPreview.currentTime=d),(e.reviewPreview.currentTime>=F||e.reviewPreview.currentTime<L)&&(e.reviewPreview.currentTime=L),e.reviewPreview.play()):e.reviewPreview.pause()},onLoopChange({isLooping:o}){O=o}});const t=()=>{if(i&&!e.reviewPreview.paused){if(e.reviewPreview.currentTime>=F){O?(e.reviewPreview.currentTime=L,e.reviewPreview.play()):(e.reviewPreview.pause(),i.clearPlayhead(),i.emitEnded());return}i.setPlayhead(e.reviewPreview.currentTime)}},a=()=>{i==null||i.setPlaying(!0),V("playing")},n=()=>{i==null||i.setPlaying(!1),V("paused")};e.reviewPreview.addEventListener("timeupdate",t),e.reviewPreview.addEventListener("play",a),e.reviewPreview.addEventListener("pause",n),E.push(()=>{e.reviewPreview.removeEventListener("timeupdate",t),e.reviewPreview.removeEventListener("play",a),e.reviewPreview.removeEventListener("pause",n)})},M=async()=>{var n;if(!m||!i)return;const t=++N;if(!$){const o=await Z({blob:m,count:12,width:104,height:58});if(t!==N||!i)return;i.setFrameStrip(o),i.setLoading({visible:!1});return}i.setLoading({visible:!0,title:"Preparing waveform",detail:"Analyzing local capture...",progress:8});try{const o=await ie({file:m,fileName:"capture.webm",cacheKey:`capture:${m.size}:${P}`,maxBins:32768,onEvent(d){!i||t!==N||(d.type==="ffmpeg-progress"?i.setLoading({visible:!0,title:"Preparing waveform",detail:"Decoding capture audio...",progress:d.payload.progress}):d.type==="waveform-status"&&i.setLoading({visible:d.payload.phase!=="complete",title:"Preparing waveform",detail:d.payload.message,progress:d.payload.phase==="complete"?100:72}))}});if(t!==N||!i)return;if((n=o==null?void 0:o.levels)!=null&&n.length){i.setWaveform(o),i.setLoading({visible:!1});return}}catch{}const a=await Z({blob:m,count:12,width:104,height:58});t!==N||!i||(i.setFrameStrip(a),i.setLoading({visible:!1}))},A=t=>{m=t,k=URL.createObjectURL(t),e.reviewPreview.src=k,e.review.classList.remove("hidden"),e.reviewSummary.textContent=`${(t.size/1024/1024).toFixed(2)} MB capture ready for trim and export.`,e.exportState.textContent="Ready to export trimmed capture.";const a=()=>{const n=Number(e.reviewPreview.duration),o=Number.isFinite(n)&&n>0?n:P||.1;P=o,L=0,F=o,T(o),U(),M()};e.reviewPreview.addEventListener("loadedmetadata",a,{once:!0}),E.push(()=>e.reviewPreview.removeEventListener("loadedmetadata",a))},W=()=>{if(!(r!=null&&r.isConnected))return;const t=new Blob(j,{type:(s==null?void 0:s.mimeType)||"video/webm"}),a=performance.now();P=Math.max(.1,(a-H)/1e3),A(t),J(e.preview),Q(),s=null,h("idle"),b.update({title:"Capture ready",detail:"Review or export the recording below.",tone:"success",autoResetMs:2200})};e.start.addEventListener("click",async()=>{var t;try{R();const a=Number(r.querySelector("#rec-res").value),n=Number(r.querySelector("#rec-fps").value),o=ce(r.querySelector("#rec-surface").value),d=r.querySelector("#rec-audio-mode").value!=="none",l=await navigator.mediaDevices.getDisplayMedia({video:{width:{ideal:a},frameRate:{ideal:n},displaySurface:o},audio:d});_=l,$=l.getAudioTracks().length>0,e.audio.textContent=$?"Present":"None",e.preview.srcObject=l,j=[];const c=I();s=new MediaRecorder(l,{mimeType:c,videoBitsPerSecond:ne(a)}),e.codec.textContent=c||"Browser default",H=performance.now(),s.ondataavailable=v=>{var f;(f=v.data)!=null&&f.size&&j.push(v.data)};const w=()=>W(),S=()=>h("paused"),x=()=>h("recording");s.addEventListener("stop",w),s.addEventListener("pause",S),s.addEventListener("resume",x),E.push(()=>{s&&(s.removeEventListener("stop",w),s.removeEventListener("pause",S),s.removeEventListener("resume",x))}),(t=l.getVideoTracks()[0])==null||t.addEventListener("ended",()=>{(s==null?void 0:s.state)!=="inactive"&&s.stop()}),s.start(250),h("recording"),b.update({title:"Capture live",detail:`${o} capture at ${a}px / ${n}fps.`,busy:!0}),D=window.setInterval(()=>{T((performance.now()-H)/1e3)},250)}catch(a){te(`Capture failed: ${a.message}`,"danger"),J(e.preview),Q(),h("idle"),b.update({title:"Capture failed",detail:a.message,tone:"danger"})}}),e.pause.addEventListener("click",()=>{(s==null?void 0:s.state)==="recording"&&s.pause()}),e.resume.addEventListener("click",()=>{(s==null?void 0:s.state)==="paused"&&s.resume()}),e.stop.addEventListener("click",()=>{s!=null&&s.state&&s.state!=="inactive"&&s.stop()}),r.querySelector("#btn-download-raw").addEventListener("click",()=>{m&&K(m,"capture_raw.webm")}),r.querySelector("#btn-pick-audio").addEventListener("click",()=>{e.replacementInput.click()}),e.replacementInput.addEventListener("change",t=>{const a=t.target.files[0];a&&(B=a,e.replacementName.textContent=a.name)}),r.querySelector("#btn-reset-review").addEventListener("click",()=>{R(),h("idle")});const p=r.querySelector("#btn-export-edited");p.addEventListener("click",async()=>{var w,S;if(!m||p.disabled)return;const t=r.querySelector("#review-format").value,a=r.querySelector("#review-quality").value,n=L,o=F,d=e.reviewMute.checked,l=y,c=p.textContent;p.disabled=!0,p.textContent="Preparing Export",e.exportState.textContent="Preparing local export...",(S=(w=e.exportPanel)==null?void 0:w.scrollIntoView)==null||S.call(w,{block:"center",behavior:"smooth"}),l.update({title:"Preparing export",detail:"Reading local capture and export settings.",progress:2,busy:!0}),await le();try{const x=await m.arrayBuffer();l.update({title:"Preparing export",detail:"Building local FFmpeg command.",progress:8,busy:!0}),e.exportState.textContent="Building local export plan...";let v=null;B&&(v=await oe(B,{sampleRate:48e3,outputName:"replacement.wav",onConvertStart:()=>{l.update({title:"Preparing audio",detail:`Extracting audio from ${B.name}`,busy:!0})},onEvent:g=>{g.type==="ffmpeg-progress"&&(l.update({progress:g.payload.progress,detail:`Preparing audio... ${g.payload.progress.toFixed(1)}%`,busy:!0}),e.exportState.textContent=`Preparing replacement audio... ${g.payload.progress.toFixed(1)}%`)}}),v.wasConverted&&(e.replacementName.textContent=`${v.name} (audio extracted)`));const f=de({sourceName:"input.webm",sourceBuffer:x,clipStart:n,clipEnd:o,duration:P,format:t,quality:a,muteSourceAudio:d,sourceHasAudio:$,replacementAudioName:(v==null?void 0:v.mediaName)||"",replacementAudioBuffer:(v==null?void 0:v.arrayBuffer)||null}),{name:X,buffer:ee}=await re({files:f.files,command:f.command,outputFileName:f.outputName,onEvent:g=>{g.type==="ffmpeg-progress"&&(l.update({progress:g.payload.progress,detail:`Encoding capture... ${g.payload.progress.toFixed(1)}%`,busy:!0}),e.exportState.textContent=`Encoding capture... ${g.payload.progress.toFixed(1)}%`)}});K(new Blob([ee]),X),e.exportState.textContent="Export complete.",l.update({title:"Export complete",detail:"Capture exported successfully",tone:"success",autoResetMs:5e3})}catch(x){e.exportState.textContent="Export failed.",l.update({title:"Export failed",detail:x.message,tone:"danger"})}finally{p.disabled=!1,p.textContent=c}})}function he(){J(),Q(),i==null||i.destroy(),i=null,b==null||b.destroy(),b=null,y==null||y.destroy(),y=null;for(const u of E)u();E=[],r&&r.remove()}export{ye as mount,he as unmount};
