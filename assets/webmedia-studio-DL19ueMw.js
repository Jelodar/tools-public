import{createWebMediaService as wt}from"./webmedia-service-GxHxy0i-.js";import{W as ue,p as vt,b as Ie,a as ft,c as yt}from"./webmedia-plan-D1Y4YVJg.js";import{c as gt,a as ht}from"./media-trimmer-Dp4x8F6m.js";import{c as St,e as m}from"./index-ATPg-6Fd.js";import{r as kt}from"./form-controls-B4kWIsdX.js";import{d as Fe,s as Be}from"./ui-utils-BycjcbQ0.js";import{c as xt}from"./media-visualization-D8M9LHeC.js";import"./pool-zSCgtDDn.js";let i=null,$=null,f=null,V=[],y=null,u=null,E="inspect",g=null,L=null,j="",T="",X=null,Y="",B="",o=null,K=0,N=0,ee="",C=null,k=[],H="auto";const je={draft:{rateControl:"bitrate",quality:32,videoBitrateKbps:1200,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:96,frameRate:24,keyFrameInterval:4,hardwareAcceleration:"prefer-hardware",latencyMode:"realtime"},preview:{rateControl:"bitrate",quality:28,videoBitrateKbps:2200,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:128,frameRate:30,keyFrameInterval:3,hardwareAcceleration:"prefer-hardware",latencyMode:"realtime"},fast:{rateControl:"bitrate",quality:25,videoBitrateKbps:3500,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:160,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-hardware",latencyMode:"auto"},medium:{rateControl:"bitrate",quality:23,videoBitrateKbps:4500,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:160,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"no-preference",latencyMode:"auto"},quality:{rateControl:"quality",quality:21,videoBitrateKbps:6500,maxVideoBitrateKbps:9e3,bufferSizeKbps:18e3,audioBitrateKbps:192,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"no-preference",latencyMode:"quality"},slow:{rateControl:"quality",quality:20,videoBitrateKbps:8e3,maxVideoBitrateKbps:12e3,bufferSizeKbps:24e3,audioBitrateKbps:192,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-software",latencyMode:"quality"},veryslow:{rateControl:"quality",quality:18,videoBitrateKbps:12e3,maxVideoBitrateKbps:18e3,bufferSizeKbps:36e3,audioBitrateKbps:256,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-software",latencyMode:"quality"}};function J(r=0){const t=Number(r||0);return t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:t<1024*1024*1024?`${(t/1024/1024).toFixed(1)} MB`:`${(t/1024/1024/1024).toFixed(2)} GB`}function I(r=0){const t=Math.max(0,Math.round(Number(r||0))),b=Math.floor(t/3600),v=Math.floor(t%3600/60),R=t%60;return b?`${b}:${String(v).padStart(2,"0")}:${String(R).padStart(2,"0")}`:`${v}:${String(R).padStart(2,"0")}`}function Ne(r={}){return[r.codec,r.width?`${r.width}x${r.height}`:"",r.frameRate?`${Number(r.frameRate).toFixed(2)} fps`:"",r.rotation?`${r.rotation} deg`:"",r.sampleRate?`${r.sampleRate} Hz`:"",r.channels?`${r.channels} ch`:"",r.language].filter(Boolean).join(" - ")}function $t(r){const t=Number((r==null?void 0:r.value)||0);return Number.isFinite(t)?t:0}function Oe(r){if(!r||typeof URL>"u"||typeof URL.createObjectURL!="function")return"";try{return URL.createObjectURL(r)}catch{return""}}function pe(){if(!j||typeof URL>"u"||typeof URL.revokeObjectURL!="function"){j="";return}URL.revokeObjectURL(j),j=""}function Ke(){if(!T||typeof URL>"u"||typeof URL.revokeObjectURL!="function"){T="";return}URL.revokeObjectURL(T),T=""}function w(r,t,b){const v=r.querySelector(`#${t}`);v&&(v.value=String(b))}function F(r,t,b){const v=r.querySelector(`#${t}`);v&&(v.checked=!!b)}function Z(r,t,b){const v=Number(r);return Number.isFinite(v)?Math.max(t,Math.min(b,v)):t}function S(r,t,b=!1){return kt({id:r,label:t,checked:b,className:"webmedia-toggle"})}function ze(r={}){const t=String(r.name||"").toLowerCase(),b=String(r.type||"").toLowerCase();return t.endsWith(".srt")||t.endsWith(".vtt")||b.includes("text/vtt")||b.includes("subrip")||b.includes("srt")}function Lt(r={},t="",b="auto"){if(b==="srt"||b==="vtt")return b;const v=String(r.name||"").toLowerCase();return v.endsWith(".vtt")||/^\s*WEBVTT\b/i.test(String(t||""))?"vtt":v.endsWith(".srt")?"srt":"auto"}function Ve(r=[]){return Array.from(r||[]).map((t,b)=>{const v=Math.max(0,Number(t==null?void 0:t.start)||0),R=Math.max(v+.1,Number(t==null?void 0:t.end)||v+2);return{id:(t==null?void 0:t.id)||`cue-${Date.now()}-${b+1}`,index:b+1,start:v,end:R,text:String((t==null?void 0:t.text)??"")}})}function me(r=""){return String(r||"").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[._-]+/g," ").replace(/\s+/g," ").trim().replace(/^./,t=>t.toUpperCase())}function He(r){return r==null||r===""?!0:Array.isArray(r)?r.length===0:typeof r=="object"?Object.keys(r).length===0:!1}function be(r,t=""){return He(r)?[]:Array.isArray(r)?r.flatMap((b,v)=>be(b,`${t}${t?" ":""}${v+1}`)):typeof r=="object"?Object.entries(r).flatMap(([b,v])=>be(v,`${t}${t?" ":""}${me(b)}`)):[[t||"Value",r]]}async function Dt(r){var Pe;$=wt(),i=document.createElement("div"),i.className="tool-webmedia-studio",i.innerHTML=`
    <div class="webmedia-shell is-empty">
      <section id="webmedia-dropzone" class="webmedia-source-bar webmedia-dropzone">
        <div class="webmedia-source-actions">
          <strong>Source</strong>
          <button id="webmedia-import">Import</button>
          <input id="webmedia-file-input" class="hidden" type="file" accept="video/*,audio/*,.mkv,.mov,.m4a,.mka,.wav,.mp3,.ogg,.flac,.aac,.m3u8,.ts" multiple>
          <input id="webmedia-subtitle-file-input" class="hidden" type="file" accept=".srt,.vtt,text/vtt,text/plain">
        </div>
        <div class="webmedia-source-dropcopy">
          <strong>Drop media anywhere</strong>
          <span>Inspect, trim, plan, and run verified browser-native export paths.</span>
        </div>
        <div id="webmedia-file-queue" class="webmedia-file-queue"></div>
        <div id="webmedia-source-metrics" class="webmedia-meter-grid"></div>
        <details id="webmedia-capabilities-panel" class="webmedia-capabilities-panel">
          <summary>Runtime</summary>
          <div id="webmedia-capabilities" class="webmedia-capability-list"></div>
        </details>
      </section>

      <aside class="webmedia-presets-rail" aria-label="Presets">
        <div class="webmedia-presets-title">Presets</div>
        <div id="webmedia-presets-list"></div>
      </aside>
      <main class="webmedia-stage">
        <div class="webmedia-preview">
          <video id="webmedia-preview-media" class="webmedia-preview-media" controls playsinline></video>
          <div id="webmedia-preview-copy" class="webmedia-preview-copy">
            <strong>No file selected</strong>
            <span>Import a media file to inspect its local track plan.</span>
          </div>
        </div>
        <div class="webmedia-scrubber">
          <span id="webmedia-current-time">0:00</span>
          <input id="webmedia-scrub" type="range" min="0" max="100" value="0">
          <span id="webmedia-duration">0:00</span>
        </div>
        <div id="webmedia-trimmer-host" class="webmedia-trimmer-host media-trimmer"></div>
        <div class="webmedia-inspect-grid">
          <div id="webmedia-track-stack" class="webmedia-track-stack"></div>
          <div id="webmedia-inspect-report" class="webmedia-inspect-report"></div>
        </div>
      </main>

      <aside class="webmedia-control-rail">
        <div class="webmedia-section-head">
          <strong>Plan</strong>
          <span id="webmedia-mode">Inspect</span>
        </div>
        <div class="webmedia-operation-tabs">
          <button data-webmedia-operation="inspect" class="active">Inspect</button>
          <button data-webmedia-operation="remux">Remux</button>
          <button data-webmedia-operation="transcode">Transcode</button>
          <button data-webmedia-operation="trim">Trim</button>
          <button data-webmedia-operation="transform">Transform</button>
          <button data-webmedia-operation="audio">Audio</button>
          <button data-webmedia-operation="subtitles">Subtitles</button>
          <button data-webmedia-operation="hls">HLS</button>
        </div>
        <div class="webmedia-adjustment-section webmedia-common-controls">
          <label class="studio-field">
            <span>Container</span>
            <select id="webmedia-target-container" class="studio-select">
              ${Object.entries(ue).map(([e,a])=>`<option value="${e}">${a.label}</option>`).join("")}
            </select>
          </label>
          <label class="studio-field">
            <span>Tracks</span>
            <select id="webmedia-track-scope" class="studio-select">
              <option value="all">All tracks</option>
              <option value="primary">Primary audio and video</option>
            </select>
          </label>
          ${S("webmedia-remux-only","Remux only",!0)}
        </div>
        <div class="webmedia-settings">
          <section class="webmedia-mode-panel active" data-webmedia-settings="inspect">
            <div class="webmedia-panel-title">Inspect</div>
            <div class="webmedia-adjustment-section">
              <input id="webmedia-inspect-depth" type="hidden" value="summary">
              <div class="webmedia-inspect-filter">
                <button type="button" data-webmedia-inspect-depth="summary" class="active">Summary</button>
                <button type="button" data-webmedia-inspect-depth="metadata">Metadata</button>
                <button type="button" data-webmedia-inspect-depth="packets">Packets</button>
                <button type="button" data-webmedia-inspect-depth="compatibility">Compatibility</button>
              </div>
              <label class="studio-field">
                <span>Packet Limit</span>
                <input id="webmedia-inspect-packet-limit" type="number" min="0" max="2000" step="25" value="250">
              </label>
              ${S("webmedia-inspect-tags","Include tags",!0)}
              ${S("webmedia-inspect-packets","Packet stats")}
              ${S("webmedia-inspect-compatibility","Compatibility",!0)}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="remux">
            <div class="webmedia-panel-title">Remux</div>
            <div class="webmedia-adjustment-section">
              <details class="webmedia-advanced"><summary>Advanced remux</summary>
              <label class="studio-field">
                <span>Track Policy</span>
                <select id="webmedia-remux-track-policy" class="studio-select">
                  <option value="keep-all">Keep compatible tracks</option>
                  <option value="drop-incompatible">Drop incompatible</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Timestamps</span>
                <select id="webmedia-remux-timestamp-policy" class="studio-select">
                  <option value="preserve">Preserve</option>
                  <option value="rebase">Rebase start</option>
                  <option value="zero">Zero start</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Rotation</span>
                <select id="webmedia-remux-rotation-policy" class="studio-select">
                  <option value="preserve">Preserve</option>
                  <option value="matrix">Write matrix</option>
                  <option value="bake">Bake if possible</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Interleave ms</span>
                <input id="webmedia-remux-interleave" type="number" min="0" max="10000" step="50" value="0">
              </label>
              <label class="studio-field">
                <span>Chapters</span>
                <select id="webmedia-remux-chapters" class="studio-select">
                  <option value="keep">Keep</option>
                  <option value="drop">Drop</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Attachments</span>
                <select id="webmedia-remux-attachments" class="studio-select">
                  <option value="drop">Drop</option>
                  <option value="keep-compatible">Keep compatible</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Metadata</span>
                <select id="webmedia-remux-metadata-policy" class="studio-select">
                  <option value="keep">Keep</option>
                  <option value="replace">Replace</option>
                  <option value="strip">Strip</option>
                </select>
              </label>
              ${S("webmedia-remux-faststart","Fast start MP4",!0)}
            
              </details></div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="transcode">
            <div class="webmedia-panel-title">Transcode</div>
            <div class="webmedia-adjustment-section">
              <label class="studio-field">
                <span>Preset</span>
                <select id="webmedia-transcode-preset" class="studio-select">
                  <option value="web-mp4">Web MP4</option>
                  <option value="webm">WebM VP9</option>
                  <option value="social">Square 1080</option>
                  <option value="audio-video">Balanced</option>
                  <option value="audio-only">Audio only</option>
                  <option value="lossless-audio">Lossless audio</option>
                  <option value="hls-package">HLS package</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Speed</span>
                <select id="webmedia-transcode-speed-preset" class="studio-select">
                  <option value="draft">Draft</option>
                  <option value="preview">Preview</option>
                  <option value="fast">Fast</option>
                  <option value="medium" selected>Medium</option>
                  <option value="quality">Quality</option>
                  <option value="slow">Slow</option>
                  <option value="veryslow">Very slow</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Rate Control</span>
                <select id="webmedia-transcode-rate-control" class="studio-select">
                  <option value="bitrate">Bitrate</option>
                  <option value="quality">Quality</option>
                  <option value="lossless">Lossless</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Quality</span>
                <input id="webmedia-transcode-quality" type="number" min="0" max="100" step="1" value="23">
              </label>
              <label class="studio-field">
                <span>Tune</span>
                <select id="webmedia-transcode-tune" class="studio-select">
                  <option value="none">None</option>
                  <option value="film">Film</option>
                  <option value="animation">Animation</option>
                  <option value="screen">Screen</option>
                  <option value="grain">Grain</option>
                </select>
              </label>
            </div>
            <div class="webmedia-adjustment-section">
              <details class="webmedia-advanced"><summary>Advanced video &amp; audio</summary>
              <div class="webmedia-subhead">Video</div>
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Video Codec</span>
                  <select id="webmedia-video-codec" class="studio-select">
                    <option value="avc">H.264 AVC</option>
                    <option value="hevc">HEVC</option>
                    <option value="vp9">VP9</option>
                    <option value="av1">AV1</option>
                    <option value="vp8">VP8</option>
                    <option value="copy">Copy</option>
                  </select>
                </label>
                <label class="studio-field"><span>Video kbps</span><input id="webmedia-transcode-video-bitrate" type="number" min="0" step="100" value="4500"></label>
                <label class="studio-field"><span>Max kbps</span><input id="webmedia-transcode-max-video-bitrate" type="number" min="0" step="100" value="0"></label>
                <label class="studio-field"><span>Buffer kbps</span><input id="webmedia-transcode-buffer-size" type="number" min="0" step="100" value="0"></label>
                <label class="studio-field"><span>Width</span><input id="webmedia-transcode-width" type="number" min="0" step="2" value="1920"></label>
                <label class="studio-field"><span>Height</span><input id="webmedia-transcode-height" type="number" min="0" step="2" value="1080"></label>
                <label class="studio-field">
                  <span>Fit</span>
                  <select id="webmedia-transcode-fit" class="studio-select">
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </label>
                <label class="studio-field"><span>Frame Rate</span><input id="webmedia-transcode-frame-rate" type="number" min="0" step="1" value="30"></label>
                <label class="studio-field"><span>Keyframe Sec</span><input id="webmedia-transcode-keyframe" type="number" min="0" step="0.5" value="2"></label>
                <label class="studio-field">
                  <span>Hardware</span>
                  <select id="webmedia-transcode-hardware" class="studio-select">
                    <option value="no-preference">Auto</option>
                    <option value="prefer-hardware">Hardware</option>
                    <option value="prefer-software">Software</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Alpha</span>
                  <select id="webmedia-transcode-alpha" class="studio-select">
                    <option value="discard">Discard</option>
                    <option value="keep">Keep</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Latency</span>
                  <select id="webmedia-transcode-latency" class="studio-select">
                    <option value="auto">Auto</option>
                    <option value="quality">Quality</option>
                    <option value="realtime">Realtime</option>
                  </select>
                </label>
                <label class="studio-field"><span>Bit Depth</span><input id="webmedia-transcode-bit-depth" type="number" min="0" max="16" step="2" value="0"></label>
                <label class="studio-field"><span>Color Space</span><input id="webmedia-transcode-color-space" type="text" value="auto"></label>
              </div>
              <div class="webmedia-inline-row">
                ${S("webmedia-transcode-prevent-upscale","No upscale")}
                ${S("webmedia-transcode-drop-video","Drop video")}
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Audio</div>
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Audio Codec</span>
                  <select id="webmedia-audio-codec" class="studio-select">
                    <option value="aac">AAC</option>
                    <option value="opus">Opus</option>
                    <option value="mp3">MP3</option>
                    <option value="vorbis">Vorbis</option>
                    <option value="flac">FLAC</option>
                    <option value="copy">Copy</option>
                  </select>
                </label>
                <label class="studio-field"><span>Audio kbps</span><input id="webmedia-transcode-audio-bitrate" type="number" min="0" step="16" value="160"></label>
                <label class="studio-field"><span>Sample Rate</span><input id="webmedia-transcode-sample-rate" type="number" min="0" step="1000" value="48000"></label>
                <label class="studio-field"><span>Channels</span><input id="webmedia-transcode-channels" type="number" min="0" max="8" step="1" value="2"></label>
                <label class="studio-field">
                  <span>Sample Format</span>
                  <select id="webmedia-transcode-sample-format" class="studio-select">
                    <option value="">Auto</option>
                    <option value="u8">u8</option>
                    <option value="s16">s16</option>
                    <option value="s32">s32</option>
                    <option value="f32">f32</option>
                  </select>
                </label>
              </div>
              ${S("webmedia-transcode-drop-audio","Drop audio")}
            
              </details></div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="trim">
            <div class="webmedia-panel-title">Trim</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Start sec</span><input id="webmedia-trim-start" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>End sec</span><input id="webmedia-trim-end" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Duration</span><input id="webmedia-trim-duration" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field">
                  <span>Mode</span>
                  <select id="webmedia-trim-mode" class="studio-select">
                    <option value="packet">Packet trim</option>
                    <option value="accurate">Accurate reencode</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Snap</span>
                  <select id="webmedia-trim-snap-policy" class="studio-select">
                    <option value="keyframe">Keyframe</option>
                    <option value="frame">Frame</option>
                    <option value="sample">Sample</option>
                    <option value="none">None</option>
                  </select>
                </label>
                <label class="studio-field"><span>Preroll</span><input id="webmedia-trim-preroll" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Postroll</span><input id="webmedia-trim-postroll" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Fade In</span><input id="webmedia-trim-fade-in" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Fade Out</span><input id="webmedia-trim-fade-out" type="number" min="0" step="0.01" value="0"></label>
              </div>
              ${S("webmedia-trim-preserve-timestamps","Preserve timestamps")}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="transform">
            <div class="webmedia-panel-title">Transform</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Geometry</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Width</span><input id="webmedia-transform-width" type="number" min="0" step="2" value="0"></label>
                <label class="studio-field"><span>Height</span><input id="webmedia-transform-height" type="number" min="0" step="2" value="0"></label>
                <label class="studio-field">
                  <span>Fit</span>
                  <select id="webmedia-transform-fit" class="studio-select">
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Rotate</span>
                  <select id="webmedia-transform-rotate" class="studio-select">
                    <option value="0">0</option>
                    <option value="90">90</option>
                    <option value="180">180</option>
                    <option value="270">270</option>
                  </select>
                </label>
                <label class="studio-field"><span>Frame Rate</span><input id="webmedia-transform-frame-rate" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Scale</span><input id="webmedia-transform-scale" type="number" min="0" step="0.01" value="1"></label>
                <label class="studio-field"><span>X</span><input id="webmedia-transform-x" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Y</span><input id="webmedia-transform-y" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Background</span><input id="webmedia-transform-background" type="text" value="#000000"></label>
                <label class="studio-field"><span>Anchor</span><input id="webmedia-transform-anchor" type="text" value="center"></label>
              </div>
              <div class="webmedia-inline-row">
                ${S("webmedia-transform-rotation-metadata","Rotation metadata",!0)}
                ${S("webmedia-transform-flip-horizontal","Flip horizontal")}
                ${S("webmedia-transform-flip-vertical","Flip vertical")}
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Crop</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Crop X</span><input id="webmedia-transform-crop-x" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Crop Y</span><input id="webmedia-transform-crop-y" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Crop W</span><input id="webmedia-transform-crop-width" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Crop H</span><input id="webmedia-transform-crop-height" type="number" min="0" step="1" value="0"></label>
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Color and Effects</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Exposure</span><input id="webmedia-transform-exposure" type="number" step="0.05" value="0"></label>
                <label class="studio-field"><span>Contrast</span><input id="webmedia-transform-contrast" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Saturation</span><input id="webmedia-transform-saturation" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Temperature</span><input id="webmedia-transform-temperature" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Tint</span><input id="webmedia-transform-tint" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Gamma</span><input id="webmedia-transform-gamma" type="number" step="0.05" value="0"></label>
                <label class="studio-field"><span>Sharpen</span><input id="webmedia-transform-sharpen" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Denoise</span><input id="webmedia-transform-denoise" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Grain</span><input id="webmedia-transform-grain" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Blur</span><input id="webmedia-transform-blur" type="number" min="0" step="1" value="0"></label>
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="audio">
            <div class="webmedia-panel-title">Audio</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Mode</span>
                  <select id="webmedia-audio-mode" class="studio-select">
                    <option value="convert">Convert audio</option>
                    <option value="copy">Copy audio</option>
                    <option value="drop">Drop audio</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Codec</span>
                  <select id="webmedia-audio-output-codec" class="studio-select">
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                    <option value="opus">Opus</option>
                    <option value="vorbis">Vorbis</option>
                    <option value="flac">FLAC</option>
                    <option value="copy">Copy</option>
                  </select>
                </label>
                <label class="studio-field"><span>Bitrate kbps</span><input id="webmedia-audio-bitrate" type="number" min="0" step="16" value="192"></label>
                <label class="studio-field"><span>Sample Rate</span><input id="webmedia-audio-sample-rate" type="number" min="0" step="1000" value="44100"></label>
                <label class="studio-field"><span>Channels</span><input id="webmedia-audio-channels" type="number" min="0" max="8" step="1" value="2"></label>
                <label class="studio-field">
                  <span>Sample Format</span>
                  <select id="webmedia-audio-sample-format" class="studio-select">
                    <option value="">Auto</option>
                    <option value="u8">u8</option>
                    <option value="s16">s16</option>
                    <option value="s32">s32</option>
                    <option value="f32">f32</option>
                  </select>
                </label>
              </div>
              ${S("webmedia-audio-discard-video","Export audio only",!0)}
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Processing</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Gain dB</span><input id="webmedia-audio-gain" type="number" step="0.1" value="0"></label>
                <label class="studio-field"><span>Target LUFS</span><input id="webmedia-audio-normalize-target" type="number" step="0.5" value="-14"></label>
                <label class="studio-field"><span>Fade In</span><input id="webmedia-audio-fade-in" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Fade Out</span><input id="webmedia-audio-fade-out" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Pan</span><input id="webmedia-audio-pan" type="number" min="-1" max="1" step="0.05" value="0"></label>
                <label class="studio-field"><span>Highpass Hz</span><input id="webmedia-audio-highpass" type="number" min="0" step="10" value="0"></label>
                <label class="studio-field"><span>Lowpass Hz</span><input id="webmedia-audio-lowpass" type="number" min="0" step="10" value="0"></label>
                <label class="studio-field"><span>Comp Threshold</span><input id="webmedia-audio-compressor-threshold" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Comp Ratio</span><input id="webmedia-audio-compressor-ratio" type="number" min="0" step="0.1" value="0"></label>
              </div>
              <div class="webmedia-inline-row">
                ${S("webmedia-audio-normalize","Normalize")}
                ${S("webmedia-audio-limiter","Limiter")}
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="subtitles">
            <div class="webmedia-panel-title">Subtitles</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Embedded</span>
                  <select id="webmedia-subtitle-mode" class="studio-select">
                    <option value="copy">Copy compatible</option>
                    <option value="drop">Drop subtitles</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Text Format</span>
                  <select id="webmedia-subtitle-source-format" class="studio-select">
                    <option value="auto">Auto</option>
                    <option value="vtt">WebVTT</option>
                    <option value="srt">SRT</option>
                  </select>
                </label>
                <label class="studio-field"><span>Language</span><input id="webmedia-subtitle-language" type="text" placeholder="eng"></label>
                <label class="studio-field"><span>Offset sec</span><input id="webmedia-subtitle-offset" type="number" step="0.01" value="0"></label>
                <label class="studio-field"><span>Color</span><input id="webmedia-subtitle-color" type="color" value="#ffdc00"></label>
                <label class="studio-field"><span>Font</span><input id="webmedia-subtitle-font-family" type="text" value="Arial"></label>
                <label class="studio-field"><span>Font Size</span><input id="webmedia-subtitle-font-size" type="number" min="0" max="160" step="1" value="0"></label>
                <label class="studio-field">
                  <span>Position</span>
                  <select id="webmedia-subtitle-position" class="studio-select">
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                  </select>
                </label>
                <label class="studio-field"><span>Outline</span><input id="webmedia-subtitle-outline" type="number" min="0" step="0.5" value="0"></label>
              </div>
              <div class="webmedia-inline-row">
                ${S("webmedia-subtitle-import","Import text")}
                ${S("webmedia-subtitle-burn","Burn in")}
                ${S("webmedia-subtitle-background","Text background")}
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subtitle-source">
                <button id="webmedia-subtitle-upload" type="button" class="btn-secondary">Upload SRT/VTT</button>
                <span id="webmedia-subtitle-info">No subtitle file</span>
              </div>
              <div class="webmedia-subtitle-actions">
                <button id="webmedia-subtitle-add" type="button" class="btn-secondary">Add Cue</button>
                <label class="studio-field"><span>Shift sec</span><input id="webmedia-subtitle-shift-amount" type="number" step="0.1" value="0.5"></label>
                <button id="webmedia-subtitle-shift" type="button" class="btn-secondary">Shift All</button>
                <button id="webmedia-subtitle-clear" type="button" class="btn-secondary">Clear</button>
              </div>
              <div id="webmedia-subtitle-editor-list" class="webmedia-subtitle-editor-list"></div>
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="hls">
            <div class="webmedia-panel-title">HLS</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Segment sec</span><input id="webmedia-hls-segment-duration" type="number" min="1" max="30" step="1" value="6"></label>
                <label class="studio-field">
                  <span>Playlist</span>
                  <select id="webmedia-hls-playlist-type" class="studio-select">
                    <option value="vod">VOD</option>
                    <option value="event">Event</option>
                    <option value="live">Live</option>
                  </select>
                </label>
                <label class="studio-field"><span>Variant Ladder</span><input id="webmedia-hls-variant-ladder" type="text" value="1080p,720p,360p"></label>
              </div>
              <div class="webmedia-inline-row">
                ${S("webmedia-hls-independent","Independent segments",!0)}
                ${S("webmedia-hls-iframe","I-frame playlist")}
                ${S("webmedia-hls-audio-renditions","Audio renditions")}
                ${S("webmedia-hls-caption-rendition","Caption rendition")}
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel webmedia-common-panel">
            <div class="webmedia-panel-title">Metadata</div>
            <div class="webmedia-field-grid">
              <label class="studio-field"><span>Title</span><input id="webmedia-meta-title" type="text"></label>
              <label class="studio-field"><span>Artist</span><input id="webmedia-meta-artist" type="text"></label>
              <label class="studio-field"><span>Album</span><input id="webmedia-meta-album" type="text"></label>
              <label class="studio-field"><span>Genre</span><input id="webmedia-meta-genre" type="text"></label>
              <label class="studio-field"><span>Date</span><input id="webmedia-meta-date" type="text"></label>
              <label class="studio-field"><span>Copyright</span><input id="webmedia-meta-copyright" type="text"></label>
              <label class="studio-field"><span>Comment</span><input id="webmedia-meta-comment" type="text"></label>
              <label class="studio-field"><span>Description</span><input id="webmedia-meta-description" type="text"></label>
            </div>
          </section>
        </div>
      </aside>

      <footer class="webmedia-action-bar">
        <div class="webmedia-action-bar-left">
          <button id="webmedia-export" class="btn-primary" disabled>Export Inspect JSON</button>
          <div id="webmedia-plan-summary" class="webmedia-plan-card"></div>
          <div id="webmedia-progress-host" class="webmedia-progress-host"></div>
        </div>
        <div id="webmedia-output-preview" class="webmedia-output-preview hidden">
          <video id="webmedia-output-video" class="webmedia-output-media hidden" controls playsinline></video>
          <audio id="webmedia-output-audio" class="webmedia-output-media hidden" controls></audio>
          <div id="webmedia-output-meta" class="webmedia-output-meta"></div>
          <button type="button" id="webmedia-output-download" class="mini-btn">Download output</button>
        </div>
      </footer>

      <section class="webmedia-bottom-drawer">
        <div class="webmedia-section-head">
          <strong>Diagnostics</strong>
          <span id="webmedia-status">Ready.</span>
        </div>
        <div id="webmedia-diagnostics" class="webmedia-diagnostics"></div>
      </section>
      <div id="webmedia-diagnostic-modal" class="webmedia-diagnostic-modal hidden">
        <div class="webmedia-diagnostic-modal-card">
          <div class="webmedia-section-head">
            <strong id="webmedia-diagnostic-modal-title">Diagnostic</strong>
            <button type="button" id="webmedia-diagnostic-modal-close" class="mini-btn danger">Close</button>
          </div>
          <div id="webmedia-diagnostic-modal-body" class="webmedia-diagnostic-modal-body"></div>
        </div>
      </div>
    </div>
  `,r.appendChild(i);const t={shell:i.querySelector(".webmedia-shell"),fileInput:i.querySelector("#webmedia-file-input"),subtitleFileInput:i.querySelector("#webmedia-subtitle-file-input"),importButton:i.querySelector("#webmedia-import"),dropzone:i.querySelector("#webmedia-dropzone"),fileQueue:i.querySelector("#webmedia-file-queue"),capabilities:i.querySelector("#webmedia-capabilities"),previewCopy:i.querySelector("#webmedia-preview-copy"),previewMedia:i.querySelector("#webmedia-preview-media"),trackStack:i.querySelector("#webmedia-track-stack"),inspectReport:i.querySelector("#webmedia-inspect-report"),metrics:i.querySelector("#webmedia-source-metrics"),targetContainer:i.querySelector("#webmedia-target-container"),trackScope:i.querySelector("#webmedia-track-scope"),videoCodec:i.querySelector("#webmedia-video-codec"),audioCodec:i.querySelector("#webmedia-audio-codec"),remuxOnly:i.querySelector("#webmedia-remux-only"),planSummary:i.querySelector("#webmedia-plan-summary"),mode:i.querySelector("#webmedia-mode"),status:i.querySelector("#webmedia-status"),diagnostics:i.querySelector("#webmedia-diagnostics"),exportButton:i.querySelector("#webmedia-export"),scrub:i.querySelector("#webmedia-scrub"),currentTime:i.querySelector("#webmedia-current-time"),duration:i.querySelector("#webmedia-duration"),trimmerHost:i.querySelector("#webmedia-trimmer-host"),diagnosticModal:i.querySelector("#webmedia-diagnostic-modal"),diagnosticModalTitle:i.querySelector("#webmedia-diagnostic-modal-title"),diagnosticModalBody:i.querySelector("#webmedia-diagnostic-modal-body"),diagnosticModalClose:i.querySelector("#webmedia-diagnostic-modal-close"),outputPreview:i.querySelector("#webmedia-output-preview"),outputDownload:i.querySelector("#webmedia-output-download"),outputVideo:i.querySelector("#webmedia-output-video"),outputAudio:i.querySelector("#webmedia-output-audio"),outputMeta:i.querySelector("#webmedia-output-meta"),subtitleUpload:i.querySelector("#webmedia-subtitle-upload"),subtitleInfo:i.querySelector("#webmedia-subtitle-info"),subtitleEditorList:i.querySelector("#webmedia-subtitle-editor-list"),subtitleAdd:i.querySelector("#webmedia-subtitle-add"),subtitleShift:i.querySelector("#webmedia-subtitle-shift"),subtitleClear:i.querySelector("#webmedia-subtitle-clear")},b=(e,a="neutral")=>{t.status.textContent=e,t.status.dataset.tone=a};f=St(i.querySelector("#webmedia-progress-host"),{stopLabel:"Cancel",onStop(){if(!L){Be("No active export.","info");return}if(!L.controller){b("Cancel unavailable in this browser.","danger");return}L.controller.abort(),f==null||f.update({title:"Canceling export",detail:L.mode,busy:!0,cancellable:!1}),b("Cancel requested.","info"),Be("Cancel requested.","info")}});let v=[],R=!1;const We=()=>{t.shell.classList.toggle("is-empty",!y)},se=e=>{const a=be(e);return a.length?`<dl class="webmedia-diagnostic-kv">${a.map(([s,n])=>`
      <div><dt>${m(me(s))}</dt><dd>${m(n)}</dd></div>
    `).join("")}</dl>`:""},Ue=(e={})=>{const a=se(e.value??e.detailValue),s=e.message||e.detail||"",n=e.suggestedRoute?`<a class="webmedia-diagnostic-route" href="${m(e.suggestedRoute)}">Open Video Studio</a>`:"";return`
      ${s?`<p>${m(s)}</p>`:""}
      ${a}
      ${n}
    `},we=e=>{const a=v[Number(e)];a&&(t.diagnosticModalTitle.textContent=a.code||a.phase||"Diagnostic",t.diagnosticModalBody.innerHTML=Ue(a),t.diagnosticModal.classList.remove("hidden"))},ve=()=>{t.diagnosticModal.classList.add("hidden")},oe=(e={})=>e.message||e.detail||"",_e=(e={})=>[e.tone||"neutral",e.code||e.phase||"info",oe(e),e.suggestedRoute||""].join("|"),q=(e=[])=>{v=(Array.isArray(e)?e:[]).filter(p=>p?!!(se(p.value??p.detailValue)||oe(p)||p.suggestedRoute):!1);const s=v.findIndex(p=>["danger"].includes(p.tone));if(t.shell.classList.toggle("has-urgent-diagnostics",s>=0),!v.length){t.diagnostics.innerHTML="",ee="";return}if(t.diagnostics.innerHTML=v.map((p,x)=>{const Q=se(p.value??p.detailValue),z=oe(p),ie=Q||z||p.suggestedRoute;return`
        <div class="webmedia-diagnostic" data-tone="${p.tone||"neutral"}">
          <div>
            <b>${m(p.code||p.phase||"info")}</b>
            ${z?`<span>${m(z)}</span>`:""}
            ${Q}
          </div>
          ${ie?`<button type="button" class="mini-btn webmedia-diagnostic-detail" data-webmedia-diagnostic-index="${x}">Details</button>`:""}
        </div>
      `}).join(""),s<0){ee="";return}const n=v[s],l=_e(n);l!==ee&&(ee=l,we(s))},fe=()=>{const e=$.getCapabilities(),a=[{id:"main-decode",label:"Main decode",state:e.main.VideoDecoder&&e.main.AudioDecoder?"ready":"unavailable"},{id:"main-encode",label:"Main encode",state:e.main.VideoEncoder&&e.main.AudioEncoder?"ready":"unavailable"},{id:"worker",label:"Worker WebCodecs",state:e.workerKnown?e.missingWorker.length===0?"ready":"unavailable":"checking"}];t.capabilities.innerHTML=a.map(s=>`
      <div class="webmedia-capability-row" data-webmedia-capability="${s.id}" data-state="${s.state}" data-ready="${s.state==="ready"?"true":"false"}">
        <span>${s.label}</span>
        <b>${s.state==="ready"?"Ready":s.state==="checking"?"Checking":"Unavailable"}</b>
      </div>
    `).join("")},ne=()=>{t.fileQueue.innerHTML=V.length?V.map((e,a)=>`
        <button class="webmedia-file-card ${e===y?"active":""}" data-file-index="${a}">
          <strong>${m(e.name||"media")}</strong>
          <span>${m(e.type||"unknown")} - ${J(e.size)}</span>
        </button>
      `).join(""):'<div class="webmedia-empty">No media loaded.</div>'},ye=()=>{Ke(),X=null,Y="",B="",t.outputPreview.classList.add("hidden"),t.outputVideo.classList.add("hidden"),t.outputAudio.classList.add("hidden"),t.outputVideo.removeAttribute("src"),t.outputAudio.removeAttribute("src"),t.outputMeta.innerHTML="",t.outputDownload.disabled=!0},Qe=(e={})=>{var n;if(ye(),!e.blob)return;X=e.blob,Y=e.filename||"webmedia-output",B=e.mime||e.blob.type||"",T=Oe(e.blob);const a=B.startsWith("audio/"),s=B.startsWith("video/");T&&a&&(t.outputAudio.setAttribute("src",T),t.outputAudio.classList.remove("hidden")),T&&s&&(t.outputVideo.setAttribute("src",T),t.outputVideo.classList.remove("hidden")),t.outputMeta.innerHTML=`
      <div><span>Name</span><strong>${m(Y)}</strong></div>
      <div><span>Type</span><strong>${m(B||"application/octet-stream")}</strong></div>
      <div><span>Size</span><strong>${J(((n=e.summary)==null?void 0:n.bytes)??e.blob.size)}</strong></div>
    `,t.outputDownload.disabled=!1,t.outputPreview.classList.remove("hidden")},Ge=()=>{if(!u){t.metrics.innerHTML="";return}const e=u.tracks.filter(n=>n.kind==="video").length,a=u.tracks.filter(n=>n.kind==="audio").length,s=u.tracks.filter(n=>n.kind==="subtitle").length;t.metrics.innerHTML=[["Container",u.container||"unknown"],["Duration",I(u.duration)],["Size",J(u.size)],["Tracks",`${e} V / ${a} A / ${s} S`]].map(([n,l])=>`<div><span>${n}</span><strong>${m(l)}</strong></div>`).join("")},Je=e=>`
    <div class="webmedia-inspect-report-rows">
      ${e.filter(([,a])=>!He(a)).map(([a,s])=>`
          <div class="webmedia-inspect-report-row">
            <span>${m(a)}</span>
            <strong>${m(s)}</strong>
          </div>
        `).join("")}
    </div>
  `,W=(e,a,s="")=>`
    <section class="webmedia-inspect-report-card">
      <div class="webmedia-inspect-report-title">${m(e)}</div>
      ${a!=null&&a.length?Je(a):""}
      ${s}
    </section>
  `,Ze=(e=[])=>{const a=e.reduce((n,l)=>(n[l.kind]=(n[l.kind]||0)+1,n),{}),s=[a.video?`${a.video} video`:"",a.audio?`${a.audio} audio`:"",a.subtitle?`${a.subtitle} subtitle`:""].filter(Boolean);return s.length?`${e.length} tracks (${s.join(", ")})`:"0 tracks"},Xe=()=>{const e=u.metadata||{},a=Object.entries(e.tags||{}),s=a.length?`<div class="webmedia-inspect-tag-list">${a.map(([n,l])=>`
          <div><span>${m(me(n))}</span><strong>${m(l)}</strong></div>
        `).join("")}</div>`:'<div class="webmedia-empty">No metadata tags were reported.</div>';return W("Metadata",[["Provider",e.provider||"summary"],["Depth",e.depth||"summary"],["Modified",u.modifiedAt?new Date(u.modifiedAt).toLocaleString():"Unknown"]],s)},Ye=()=>{const e=u.tracks.filter(a=>a.kind==="video"&&a.frameRate).map(a=>`${a.id}: ${Number(a.frameRate).toFixed(2)} fps`);return W("Packets",[["Depth",c("webmedia-inspect-depth")],["Packet stats",h("webmedia-inspect-packets")?"On":"Off"],["Sample limit",`${d("webmedia-inspect-packet-limit")} samples`],["Video packet rate",e.join(", ")||"Unknown"],["Compatibility check",h("webmedia-inspect-compatibility")?"On":"Off"]])},et=()=>{const e=t.targetContainer.value,a=ue[e]||ue.mp4,s=u.tracks.length?u.tracks.map(n=>{const l=yt(e,n);return`
          <div class="webmedia-compat-row" data-state="${l?"ready":"blocked"}">
            <span>${m(n.kind)}:${m(n.codec||"unknown")}</span>
            <strong>${l?"Compatible":"Blocked"}</strong>
            <b>${m(Ne(n)||n.id)}</b>
          </div>
        `}).join(""):'<div class="webmedia-empty">Track compatibility appears after media inspection.</div>';return W("Compatibility",[["Target",a.label],["Container",e],["Track policy",c("webmedia-track-scope")]],`<div class="webmedia-compat-list">${s}</div>`)},tt=()=>W("Summary",[["File",u.fileName],["Container",u.container||"unknown"],["Mime",u.mime||"unknown"],["Duration",I(u.duration)],["Size",J(u.size)],["Tracks",Ze(u.tracks)]]),A=()=>{if(!t.inspectReport)return;if(!u){t.inspectReport.innerHTML=W("Inspect",[["Status","Import media to populate the report"]]);return}const e=c("webmedia-inspect-depth")||"metadata";e==="summary"?t.inspectReport.innerHTML=tt():e==="packets"?t.inspectReport.innerHTML=Ye():e==="compatibility"?t.inspectReport.innerHTML=et():t.inspectReport.innerHTML=Xe()},c=e=>{var a;return((a=i.querySelector(`#${e}`))==null?void 0:a.value)||""},h=e=>{var a;return((a=i.querySelector(`#${e}`))==null?void 0:a.checked)===!0},d=e=>$t(i.querySelector(`#${e}`)),at=()=>Object.fromEntries(Object.entries({title:c("webmedia-meta-title"),artist:c("webmedia-meta-artist"),album:c("webmedia-meta-album"),genre:c("webmedia-meta-genre"),date:c("webmedia-meta-date"),copyright:c("webmedia-meta-copyright"),comment:c("webmedia-meta-comment"),description:c("webmedia-meta-description")}).filter(([,e])=>e)),it=()=>({inspect:{depth:c("webmedia-inspect-depth"),packetSampleLimit:d("webmedia-inspect-packet-limit"),includeTags:h("webmedia-inspect-tags"),includePackets:h("webmedia-inspect-packets"),includeCompatibility:h("webmedia-inspect-compatibility")},tracks:t.trackScope.value,remux:{remuxOnly:t.remuxOnly.checked,trackPolicy:c("webmedia-remux-track-policy"),timestampPolicy:c("webmedia-remux-timestamp-policy"),rotationPolicy:c("webmedia-remux-rotation-policy"),fastStart:h("webmedia-remux-faststart"),interleaveMs:d("webmedia-remux-interleave"),chapterPolicy:c("webmedia-remux-chapters"),attachmentPolicy:c("webmedia-remux-attachments"),metadataPolicy:c("webmedia-remux-metadata-policy")},transcode:{preset:c("webmedia-transcode-preset"),speedPreset:c("webmedia-transcode-speed-preset"),videoCodec:t.videoCodec.value,audioCodec:t.audioCodec.value,rateControl:c("webmedia-transcode-rate-control"),quality:d("webmedia-transcode-quality"),videoBitrateKbps:d("webmedia-transcode-video-bitrate"),maxVideoBitrateKbps:d("webmedia-transcode-max-video-bitrate"),bufferSizeKbps:d("webmedia-transcode-buffer-size"),audioBitrateKbps:d("webmedia-transcode-audio-bitrate"),width:d("webmedia-transcode-width"),height:d("webmedia-transcode-height"),fit:c("webmedia-transcode-fit"),preventUpscale:h("webmedia-transcode-prevent-upscale"),frameRate:d("webmedia-transcode-frame-rate"),keyFrameInterval:d("webmedia-transcode-keyframe"),hardwareAcceleration:c("webmedia-transcode-hardware"),alpha:c("webmedia-transcode-alpha"),latencyMode:c("webmedia-transcode-latency"),tune:c("webmedia-transcode-tune"),bitDepth:d("webmedia-transcode-bit-depth"),colorSpace:c("webmedia-transcode-color-space"),sampleRate:d("webmedia-transcode-sample-rate"),channels:d("webmedia-transcode-channels"),sampleFormat:c("webmedia-transcode-sample-format"),discardVideo:h("webmedia-transcode-drop-video"),discardAudio:h("webmedia-transcode-drop-audio")},trim:{start:d("webmedia-trim-start"),end:d("webmedia-trim-end"),duration:d("webmedia-trim-duration"),mode:c("webmedia-trim-mode"),snapPolicy:c("webmedia-trim-snap-policy"),preroll:d("webmedia-trim-preroll"),postroll:d("webmedia-trim-postroll"),preserveTimestamps:h("webmedia-trim-preserve-timestamps"),fadeIn:d("webmedia-trim-fade-in"),fadeOut:d("webmedia-trim-fade-out")},transform:{width:d("webmedia-transform-width"),height:d("webmedia-transform-height"),fit:c("webmedia-transform-fit"),rotate:d("webmedia-transform-rotate"),allowRotationMetadata:h("webmedia-transform-rotation-metadata"),crop:{x:d("webmedia-transform-crop-x"),y:d("webmedia-transform-crop-y"),width:d("webmedia-transform-crop-width"),height:d("webmedia-transform-crop-height")},frameRate:d("webmedia-transform-frame-rate"),anchor:c("webmedia-transform-anchor"),scale:d("webmedia-transform-scale"),x:d("webmedia-transform-x"),y:d("webmedia-transform-y"),flipHorizontal:h("webmedia-transform-flip-horizontal"),flipVertical:h("webmedia-transform-flip-vertical"),background:c("webmedia-transform-background"),color:{exposure:d("webmedia-transform-exposure"),contrast:d("webmedia-transform-contrast"),saturation:d("webmedia-transform-saturation"),temperature:d("webmedia-transform-temperature"),tint:d("webmedia-transform-tint"),gamma:d("webmedia-transform-gamma")},effects:{sharpen:d("webmedia-transform-sharpen"),denoise:d("webmedia-transform-denoise"),grain:d("webmedia-transform-grain"),blur:d("webmedia-transform-blur")}},audio:{mode:c("webmedia-audio-mode"),audioCodec:c("webmedia-audio-output-codec"),audioBitrateKbps:d("webmedia-audio-bitrate"),sampleRate:d("webmedia-audio-sample-rate"),channels:d("webmedia-audio-channels"),sampleFormat:c("webmedia-audio-sample-format"),discardVideo:h("webmedia-audio-discard-video"),gainDb:d("webmedia-audio-gain"),normalize:h("webmedia-audio-normalize"),normalizeTargetDb:d("webmedia-audio-normalize-target"),limiter:h("webmedia-audio-limiter"),fadeIn:d("webmedia-audio-fade-in"),fadeOut:d("webmedia-audio-fade-out"),pan:d("webmedia-audio-pan"),highpassHz:d("webmedia-audio-highpass"),lowpassHz:d("webmedia-audio-lowpass"),compressorThreshold:d("webmedia-audio-compressor-threshold"),compressorRatio:d("webmedia-audio-compressor-ratio")},subtitles:{mode:c("webmedia-subtitle-mode"),importText:h("webmedia-subtitle-import")||k.length>0,burnIn:h("webmedia-subtitle-burn"),language:c("webmedia-subtitle-language"),sourceFormat:c("webmedia-subtitle-source-format"),fileName:(C==null?void 0:C.name)||"",offset:d("webmedia-subtitle-offset"),color:c("webmedia-subtitle-color"),fontFamily:c("webmedia-subtitle-font-family"),fontSize:d("webmedia-subtitle-font-size"),position:c("webmedia-subtitle-position"),outline:d("webmedia-subtitle-outline"),background:h("webmedia-subtitle-background"),cues:k},hls:{segmentDuration:d("webmedia-hls-segment-duration"),playlistType:c("webmedia-hls-playlist-type"),variantLadder:c("webmedia-hls-variant-ladder"),independentSegments:h("webmedia-hls-independent"),iframePlaylist:h("webmedia-hls-iframe"),audioRenditions:h("webmedia-hls-audio-renditions"),captionRendition:h("webmedia-hls-caption-rendition")},metadata:at()}),P=()=>Math.max(0,Number((u==null?void 0:u.duration)||t.previewMedia.duration||0)),U=(e,a)=>{const s=P(),n=s||Math.max(Number(e)||0,Number(a)||0,0),l=Z(e,0,n),p=Number(a)||s||l,x=Z(p,l,n||l);return w(i,"webmedia-trim-start",l.toFixed(2)),w(i,"webmedia-trim-end",x.toFixed(2)),w(i,"webmedia-trim-duration",Math.max(0,x-l).toFixed(2)),{start:l,end:x}},te=e=>{const a=P(),s=Z(e,0,a||Math.max(0,Number(e)||0));t.currentTime.textContent=I(s),t.duration.textContent=I(a),t.scrub.value=a?String(Z(s/a*100,0,100)):"0"},de=()=>{var a,s;const e=(s=(a=t.previewMedia).play)==null?void 0:s.call(a);e&&typeof e.catch=="function"&&e.catch(()=>{})},ge=()=>{var e,a;(a=(e=t.previewMedia).pause)==null||a.call(e)},O=(e,a={})=>{const s=P(),n=Z(e,0,s||Math.max(0,Number(e)||0));try{t.previewMedia.currentTime=n}catch{}te(n),a.syncTrimmer!==!1&&(o==null||o.setPlayhead(n,a.reason||"external")),a.play&&de()},he=(e={})=>{if(!o)return;const a=Math.max(.1,P()||.1),s=d("webmedia-trim-start"),n=d("webmedia-trim-end"),l=d("webmedia-trim-duration"),p=e.fromDuration?s+l:n||a,x=U(s,p);o.setDuration(a),o.setRange(x.start,x.end||a,!1),o.setFades(d("webmedia-trim-fade-in"),d("webmedia-trim-fade-out"),!1)},st=()=>{K+=1,U(0,0),te(0),o==null||o.setLoading({visible:!1}),o==null||o.setWaveform(null),o==null||o.setSamples(null,0),o==null||o.setFrameStrip([]),o==null||o.setDuration(.1),o==null||o.setZoom(1,!1),o==null||o.setRange(0,.1,!1),o==null||o.clearPlayhead(),o==null||o.setPlaying(!1)},Se=()=>{if(!o)return;const e=Math.max(.1,P()||.1),a=d("webmedia-trim-start"),s=d("webmedia-trim-end")||e,n=U(a,s);o.setDuration(e),o.setZoom(1,!1),o.setRange(n.start,n.end||e,!1),o.setFades(d("webmedia-trim-fade-in"),d("webmedia-trim-fade-out"),!1),o.setPlayhead(Number(t.previewMedia.currentTime)||n.start,"external"),o.setPlaying(t.previewMedia.paused===!1),te(Number(t.previewMedia.currentTime)||0)},ot=()=>typeof HTMLMediaElement=="function"&&typeof Worker=="function"&&typeof Blob=="function",ke=async()=>{var s,n;if(!o||!y||!ot())return;const e=++K;o.setWaveform(null),o.setSamples(null,0),o.setFrameStrip([]),o.setLoading({visible:!0,title:"Preparing waveform",detail:"Analyzing local media...",progress:8});try{const l=await ht({file:y,fileName:y.name||"media",cacheKey:`${y.name||"media"}:${y.size}:${y.lastModified||0}`,maxBins:32768,includeSamples:!0,maxSampleFrames:2e6,onEvent(p){!o||e!==K||p.type==="waveform-status"&&o.setLoading({visible:p.payload.phase!=="complete",title:"Preparing waveform",detail:p.payload.message,progress:p.payload.phase==="complete"?100:72})}});if(e!==K||!o)return;if((s=l==null?void 0:l.levels)!=null&&s.length){o.setWaveform(l),o.setSamples(l.samples,l.samplesSampleRate||l.sampleRate),o.setLoading({visible:!1});return}}catch{}let a=[];try{const l=await $.frames(y,{count:12,width:208,duration:(u==null?void 0:u.duration)||0});(n=l==null?void 0:l.frames)!=null&&n.length&&(a=l.frames.map(p=>URL.createObjectURL(new Blob([p.png],{type:"image/png"}))))}catch{}a.length||(a=await xt({file:y,count:12,width:104,height:58})),!(e!==K||!o)&&(o.setFrameStrip(a),o.setLoading({visible:!1}))},le=()=>{const e=c("webmedia-transcode-preset");e==="web-mp4"&&(t.targetContainer.value="mp4",t.videoCodec.value="avc",t.audioCodec.value="aac",w(i,"webmedia-transcode-rate-control","bitrate"),w(i,"webmedia-transcode-video-bitrate",4500),w(i,"webmedia-transcode-audio-bitrate",160),w(i,"webmedia-transcode-width",1920),w(i,"webmedia-transcode-height",1080),w(i,"webmedia-transcode-fit","contain"),F(i,"webmedia-transcode-drop-video",!1),F(i,"webmedia-transcode-drop-audio",!1)),e==="webm"&&(t.targetContainer.value="webm",t.videoCodec.value="vp9",t.audioCodec.value="opus",w(i,"webmedia-transcode-video-bitrate",3200),w(i,"webmedia-transcode-audio-bitrate",128)),e==="social"&&(t.targetContainer.value="mp4",t.videoCodec.value="avc",t.audioCodec.value="aac",w(i,"webmedia-transcode-video-bitrate",6e3),w(i,"webmedia-transcode-audio-bitrate",192),w(i,"webmedia-transcode-width",1080),w(i,"webmedia-transcode-height",1080),w(i,"webmedia-transcode-fit","cover")),e==="audio-only"&&(t.targetContainer.value="mp3",F(i,"webmedia-transcode-drop-video",!0),F(i,"webmedia-transcode-drop-audio",!1),t.audioCodec.value="mp3"),e==="lossless-audio"&&(t.targetContainer.value="flac",F(i,"webmedia-transcode-drop-video",!0),t.audioCodec.value="flac",w(i,"webmedia-transcode-rate-control","lossless")),e==="hls-package"&&(t.targetContainer.value="hls",t.videoCodec.value="avc",t.audioCodec.value="aac")},nt=()=>{const e=je[c("webmedia-transcode-speed-preset")]||je.medium;w(i,"webmedia-transcode-rate-control",e.rateControl),w(i,"webmedia-transcode-quality",e.quality),w(i,"webmedia-transcode-video-bitrate",e.videoBitrateKbps),w(i,"webmedia-transcode-max-video-bitrate",e.maxVideoBitrateKbps),w(i,"webmedia-transcode-buffer-size",e.bufferSizeKbps),w(i,"webmedia-transcode-audio-bitrate",e.audioBitrateKbps),w(i,"webmedia-transcode-frame-rate",e.frameRate),w(i,"webmedia-transcode-keyframe",e.keyFrameInterval),w(i,"webmedia-transcode-hardware",e.hardwareAcceleration),w(i,"webmedia-transcode-latency",e.latencyMode),F(i,"webmedia-transcode-prevent-upscale",!0)},xe=()=>{i.querySelectorAll("[data-webmedia-settings]").forEach(e=>{e.classList.toggle("active",e.dataset.webmediaSettings===E)})},dt=e=>{var l,p,x,Q,z,ie,De;if(!e)return[];const a=$.getCapabilities(),s=Object.entries(((l=e.conversion)==null?void 0:l.adjustments)||{}).flatMap(([G,mt])=>Object.keys(mt||{}).map(bt=>`${G}.${bt}`)),n=[{code:"Source",message:`${e.source.container} / ${I(e.source.duration)} / ${e.source.tracks.length} tracks`},{code:"Output",message:`${Ie(e.source.fileName,e)} / ${e.output.mime}`},{code:"Execution",message:`${e.execution} / ${e.requiresReencode?"reencode":"packet copy"} / tracks ${((p=e.conversion)==null?void 0:p.tracks)||"all"}`},{code:"Worker",message:a.workerKnown?a.missingWorker.length?`Missing ${a.missingWorker.join(", ")}`:"WebCodecs ready":"Checking WebCodecs"},{code:"Video",value:((x=e.conversion)==null?void 0:x.video)||{}},{code:"Audio",value:((Q=e.conversion)==null?void 0:Q.audio)||{}},{code:"Trim",value:((z=e.conversion)==null?void 0:z.trim)||{}},{code:"Mux",value:((ie=e.conversion)==null?void 0:ie.mux)||{}},{code:"Profile",value:((De=e.conversion)==null?void 0:De.profile)||{}},{code:"Adjustments",message:s.length?s.join(", "):"None"}];return[...e.errors.map(G=>({...G,tone:"danger"})),...e.warnings.map(G=>({...G,tone:"warning"})),...n]},ae=()=>{if(We(),!u){pe(),t.previewCopy.innerHTML=y?`<strong>${m(y.name||"media")}</strong><span>Inspecting local tracks.</span>`:"<strong>No file selected</strong><span>Import a media file to inspect its local track plan.</span>",t.previewCopy.classList.remove("hidden"),t.previewMedia.removeAttribute("src"),t.previewMedia.classList.remove("is-visible"),t.trackStack.innerHTML="",t.metrics.innerHTML="",st(),A(),q([]);return}pe(),j=Oe(y),j?(t.previewMedia.setAttribute("src",j),t.previewMedia.classList.add("is-visible"),t.previewCopy.classList.add("hidden")):(t.previewMedia.removeAttribute("src"),t.previewMedia.classList.remove("is-visible"),t.previewCopy.classList.remove("hidden")),t.previewCopy.innerHTML=`
      <strong>${m(u.fileName)}</strong>
      <span>${m(u.container)} - ${J(u.size)} - ${I(u.duration)}</span>
    `,t.duration.textContent=I(u.duration),U(0,u.duration),Se(),ke(),t.trackStack.innerHTML=u.tracks.length?u.tracks.map(e=>`
        <div class="webmedia-track" data-kind="${m(e.kind)}">
          <div>
            <strong>${m(e.kind)}</strong>
            <span>${m(Ne(e))}</span>
          </div>
          <b>${e.decodable?"Decodable":"Unknown"}</b>
        </div>
      `).join(""):'<div class="webmedia-empty">Track-level metadata appears after deeper browser inspection.</div>',Ge(),A(),q(u.warnings||[])},D=async()=>{var l;if(!u&&!y)return b("Import a file first.","danger"),null;const e=u||{fileName:y.name,mime:y.type,size:y.size,tracks:[]},a=it(),s={operation:E,source:e,targetContainer:t.targetContainer.value,remuxOnly:a.remux.remuxOnly,settings:a};return g=(await $.plan(s)).plan||vt(s),t.mode.textContent=g.mode,t.exportButton.textContent=g.operation==="inspect"?"Export Inspect JSON":`Export ${g.mode} .${g.output.extension}`,t.exportButton.disabled=!g||g.mode==="Blocked",t.planSummary.innerHTML=`
      <div class="webmedia-plan-head">
        <span class="webmedia-plan-pill" data-mode="${m(g.mode)}">${m(g.mode)}</span>
        <span class="webmedia-plan-facts" title="Execution: ${m(g.execution)} · Adjustments: ${m(Object.keys(((l=g.conversion)==null?void 0:l.adjustments)||{}).filter(p=>Object.keys(g.conversion.adjustments[p]||{}).length).join(", ")||"None")}">
          ${m(Ie(g.source.fileName,g))} · ${m(g.output.label)}${g.requiresReencode?" · reencode":""}
        </span>
      </div>
      ${g.errors.length?`
        <div class="webmedia-plan-blockers">
          ${g.errors.map(p=>`
            <div class="webmedia-plan-blocker" data-tone="danger">
              <span class="webmedia-plan-blocker-code">${m(p.code||"BLOCKED")}</span>
              <span class="webmedia-plan-blocker-message">${m(p.message||"")}</span>
              ${p.suggestedRoute?`<a class="webmedia-diagnostic-route" data-route href="${m(p.suggestedRoute)}">Open Video Studio</a>`:""}
            </div>
          `).join("")}
        </div>
      `:""}
    `,q(dt(g)),A(),b(g.errors.length?"Plan blocked.":"Plan ready.",g.errors.length?"danger":"success"),g},M=(e=0)=>{!u&&!y||(N&&clearTimeout(N),N=setTimeout(()=>{N=0,D().catch(a=>{q([{code:a.code||"PLAN_FAILED",message:a.message,tone:"danger"}]),b(a.message,"danger")})},e))},re=e=>{F(i,"webmedia-subtitle-import",e)},lt=()=>{t.subtitleInfo&&(t.subtitleInfo.textContent=(C==null?void 0:C.name)||(k.length?"Inline subtitles":"No subtitle file"))},_=(e,a={})=>{k=Ve(e),a.importText!==!1&&re(k.length>0||!!C),$e(),a.plan!==!1&&M(a.delay??0)},$e=()=>{lt(),t.subtitleEditorList&&(t.subtitleEditorList.innerHTML=k.length?k.map((e,a)=>`
        <div class="webmedia-subtitle-editor-row" data-webmedia-subtitle-cue="${m(e.id)}">
          <span>${a+1}</span>
          <input data-webmedia-subtitle-field="start" type="number" min="0" step="0.1" value="${m(e.start)}">
          <input data-webmedia-subtitle-field="end" type="number" min="0.1" step="0.1" value="${m(e.end)}">
          <input data-webmedia-subtitle-field="text" value="${m(e.text)}">
          <button type="button" class="btn-secondary" data-webmedia-subtitle-remove="${m(e.id)}">Remove</button>
        </div>
      `).join(""):'<div class="webmedia-empty">Subtitle cues appear here.</div>',t.subtitleEditorList.querySelectorAll("[data-webmedia-subtitle-field]").forEach(e=>{e.addEventListener("input",()=>{const a=e.closest("[data-webmedia-subtitle-cue]"),s=k.find(l=>l.id===(a==null?void 0:a.dataset.webmediaSubtitleCue));if(!s)return;const n=e.dataset.webmediaSubtitleField;s[n]=n==="text"?e.value:Number(e.value),Number(s.end)<=Number(s.start)&&(s.end=Number(s.start)+.1),k=Ve(k),re(!0),M(120)})}),t.subtitleEditorList.querySelectorAll("[data-webmedia-subtitle-remove]").forEach(e=>{e.addEventListener("click",()=>{_(k.filter(a=>a.id!==e.dataset.webmediaSubtitleRemove))})}))},Le=async e=>{if(e)try{const a=await e.text();C=e,H=Lt(e,a,c("webmedia-subtitle-source-format")||"auto"),H!=="auto"&&w(i,"webmedia-subtitle-source-format",H),_(ft(a,H)),b("Subtitle file loaded.","success")}catch(a){q([{code:"WEBMEDIA_SUBTITLE_IMPORT_FAILED",message:a.message||"Subtitle file could not be read.",tone:"danger"}]),b("Subtitle import failed.","danger")}},rt=()=>{const e=Number(t.previewMedia.currentTime||0),a=P(),s=a?Math.min(a,e+2):e+2;_([...k,{id:`cue-${Date.now()}-${k.length+1}`,start:e,end:Math.max(e+.1,s),text:"Subtitle"}])},ct=()=>{const e=d("webmedia-subtitle-shift-amount");_(k.map(a=>{const s=Math.max(0,Number(a.start||0)+e),n=Math.max(s+.1,Number(a.end||0)+e);return{...a,start:s,end:n}}))},ut=()=>{C=null,H="auto",t.subtitleFileInput.value="",w(i,"webmedia-subtitle-source-format","auto"),re(!1),_([],{importText:!1})};o==null||o.destroy(),o=gt({mount:t.trimmerHost,idPrefix:"webmedia",duration:.1,start:0,end:.1,playhead:0,minSpan:.01,showSeekAutoplayToggle:!0,isLooping:R,onChange(e){U(e.start,e.end),w(i,"webmedia-trim-fade-in",e.fadeIn||0),w(i,"webmedia-trim-fade-out",e.fadeOut||0),M()},onRulerSeek({time:e,isSeekAutoplayEnabled:a}){O(e,{syncTrimmer:!1,play:a})},onPlayheadChange({time:e,reason:a,isSeekAutoplayEnabled:s}){["seek","ruler-click"].includes(a)&&O(e,{syncTrimmer:!1,play:s})},onTogglePlayback({isPlaying:e,time:a}){Number.isFinite(a)&&O(a,{syncTrimmer:!1}),e?de():ge()},onLoopChange({isLooping:e}){R=e}});const Me=async()=>{if(!y)return;b("Inspecting...","info"),f==null||f.update({title:"Inspecting media",detail:y.name,busy:!0});const e=await $.inspectFile(y,{onEvent(a){a.type==="progress"&&(f==null||f.update({title:"Inspecting media",detail:a.payload.phase,progress:a.payload.percent,busy:a.payload.percent<100}))}}).catch(a=>({error:a}));if(i){if(e.error){b(`Inspection failed: ${e.error.message}`,"danger");return}u=e.inspection,ae(),await D(),f==null||f.update({title:"Inspection ready",tone:"success",autoResetMs:1200})}},Ce=async e=>{V=Array.from(e||[]),y=V[0]||null,u=null,g=null,ye(),ne(),ae(),y&&await Me()};t.importButton.addEventListener("click",()=>t.fileInput.click()),t.fileInput.addEventListener("change",e=>Ce(e.target.files));const Ee=e=>{e.preventDefault(),e.stopPropagation(),t.dropzone.classList.add("is-dragging")},Te=e=>{e.preventDefault(),e.stopPropagation(),t.dropzone.classList.remove("is-dragging")},Re=e=>{var l;e.preventDefault(),e.stopPropagation(),t.dropzone.classList.remove("is-dragging");const a=Array.from(((l=e.dataTransfer)==null?void 0:l.files)||[]),s=a.find(ze),n=a.filter(p=>!ze(p));n.length&&Ce(n),s&&Le(s)};t.dropzone.addEventListener("dragover",Ee),t.dropzone.addEventListener("dragleave",Te),t.dropzone.addEventListener("drop",Re),i.addEventListener("dragover",Ee),i.addEventListener("dragleave",Te),i.addEventListener("drop",Re),t.fileQueue.addEventListener("click",async e=>{const a=e.target.closest("[data-file-index]");a&&(y=V[Number(a.dataset.fileIndex)]||null,u=null,ne(),ae(),await Me())}),i.querySelectorAll("[data-webmedia-operation]").forEach(e=>{e.addEventListener("click",async()=>{E=e.dataset.webmediaOperation,i.querySelectorAll("[data-webmedia-operation]").forEach(a=>a.classList.toggle("active",a===e)),xe(),E==="audio"&&(t.targetContainer.value="mp3"),E==="hls"&&(t.targetContainer.value="hls"),E==="subtitles"&&(t.targetContainer.value="mp4"),E==="transcode"&&le(),t.remuxOnly.checked=E==="remux",await D()})});const Ae=[{id:"web-mp4",label:"Web · MP4 1080p",mode:"transcode",presetId:"web-mp4"},{id:"webm-vp9",label:"Web · WebM VP9",mode:"transcode",presetId:"webm"},{id:"social",label:"Social · 1080p",mode:"transcode",presetId:"social"},{id:"audio-only",label:"Audio · MP3",mode:"audio"},{id:"fast-remux",label:"Fast Remux",mode:"remux"}],ce=i.querySelector("#webmedia-presets-list");ce.innerHTML=Ae.map(e=>`<button type="button" class="webmedia-preset-item" data-webmedia-preset="${e.id}" title="${e.label}">${e.label}</button>`).join("");const pt=e=>{ce.querySelectorAll(".webmedia-preset-item").forEach(a=>{a.classList.toggle("active",a.dataset.webmediaPreset===e)})};ce.addEventListener("click",async e=>{var l,p;const a=(p=(l=e.target).closest)==null?void 0:p.call(l,"[data-webmedia-preset]");if(!a)return;const s=Ae.find(x=>x.id===a.dataset.webmediaPreset);if(!s)return;pt(s.id);const n=i.querySelector(`[data-webmedia-operation="${s.mode}"]`);await(n==null?void 0:n.click()),s.presetId&&(w(i,"webmedia-transcode-preset",s.presetId),le(),await D())}),i.querySelectorAll("[data-webmedia-inspect-depth]").forEach(e=>{e.addEventListener("click",()=>{w(i,"webmedia-inspect-depth",e.dataset.webmediaInspectDepth),i.querySelectorAll("[data-webmedia-inspect-depth]").forEach(a=>{a.classList.toggle("active",a===e)}),A(),M()})}),t.diagnostics.addEventListener("click",e=>{const a=e.target.closest("[data-webmedia-diagnostic-index]");a&&we(a.dataset.webmediaDiagnosticIndex)}),t.diagnosticModalClose.addEventListener("click",ve),t.diagnosticModal.addEventListener("click",e=>{e.target===t.diagnosticModal&&ve()}),t.outputDownload.addEventListener("click",()=>{X&&Fe(X,Y,B)}),t.subtitleUpload.addEventListener("click",()=>t.subtitleFileInput.click()),t.subtitleFileInput.addEventListener("change",e=>{var a;return Le((a=e.target.files)==null?void 0:a[0])}),t.subtitleAdd.addEventListener("click",rt),t.subtitleShift.addEventListener("click",ct),t.subtitleClear.addEventListener("click",ut),t.previewMedia.addEventListener("loadedmetadata",()=>{Se(),ke()}),t.previewMedia.addEventListener("timeupdate",()=>{var s,n;const e=Number(t.previewMedia.currentTime)||0,a=(s=o==null?void 0:o.getRange)==null?void 0:s.call(o);if(a&&e>a.end){R?(O(a.start,{reason:"loop"}),de()):(ge(),O(a.start,{reason:"ended"}),(n=o==null?void 0:o.emitEnded)==null||n.call(o));return}te(e),o==null||o.setPlayhead(e,"preview")}),t.previewMedia.addEventListener("play",()=>o==null?void 0:o.setPlaying(!0)),t.previewMedia.addEventListener("pause",()=>o==null?void 0:o.setPlaying(!1)),t.scrub.addEventListener("input",()=>{const e=P();O(e*Number(t.scrub.value||0)/100,{reason:"scrub"})}),[t.targetContainer,t.videoCodec,t.audioCodec,t.trackScope,t.remuxOnly].forEach(e=>{e.addEventListener("change",()=>{A(),M()})});const qe=new Set(["webmedia-trim-start","webmedia-trim-end","webmedia-trim-duration","webmedia-trim-fade-in","webmedia-trim-fade-out"]);qe.forEach(e=>{const a=i.querySelector(`#${e}`);a==null||a.addEventListener("input",()=>{he({fromDuration:e==="webmedia-trim-duration"}),M(120)}),a==null||a.addEventListener("change",()=>{he({fromDuration:e==="webmedia-trim-duration"}),M()})}),i.querySelector("#webmedia-transcode-preset").addEventListener("change",async()=>{le(),await D()}),i.querySelector("#webmedia-transcode-speed-preset").addEventListener("change",async()=>{nt(),await D()}),i.querySelectorAll(".webmedia-settings input, .webmedia-settings select").forEach(e=>{e.id!=="webmedia-transcode-preset"&&e.id!=="webmedia-transcode-speed-preset"&&(qe.has(e.id)||(e.addEventListener("input",()=>{A(),M(120)}),e.addEventListener("change",()=>{A(),M()})))}),i.querySelectorAll(".webmedia-common-controls input, .webmedia-common-controls select").forEach(e=>{e.addEventListener("change",()=>{A(),M()})}),t.exportButton.addEventListener("click",async()=>{const e=g||await D();if(!e||e.errors.length)return;if(L){b("Export already running.","info");return}const a=`webmedia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,s=typeof AbortController=="function"?new AbortController:null;L={jobId:a,controller:s,mode:e.mode};try{f==null||f.update({title:"Running web media job",detail:e.mode,busy:!0,cancellable:!0});const n=await $.run(e,{jobId:a,mediaFile:y,signal:s==null?void 0:s.signal,onEvent(l){l.type==="progress"&&(f==null||f.update({title:"Running web media job",detail:l.payload.phase,progress:l.payload.percent,busy:l.payload.percent<100,cancellable:!0}))}});if(!i)return;n.blob&&(Qe(n),Fe(n.blob,n.filename,n.mime)),f==null||f.update({title:"Export ready",tone:"success",progress:100,autoResetMs:1400}),b("Export ready.","success")}catch(n){const l=n.code==="JOB_CANCELED";if(!i)return;f==null||f.update({title:l?"Export canceled":"Export blocked",detail:n.message,tone:l?"warning":"danger"}),q([{code:n.code||"EXPORT_BLOCKED",message:n.message,tone:l?"warning":"danger"}]),b(l?"Export canceled.":n.suggestedRoute?"Use Video Studio for this job.":n.message,l?"warning":"danger")}finally{(L==null?void 0:L.jobId)===a&&(L=null)}}),fe(),(Pe=$.probeCapabilities)==null||Pe.call($).then(()=>{i&&fe()}),xe(),ne(),ae(),$e(),q()}function It(){N&&clearTimeout(N),f==null||f.destroy(),o==null||o.destroy(),$==null||$.dispose(),pe(),Ke(),i==null||i.remove(),N=0,f=null,o=null,K+=1,$=null,i=null,V=[],y=null,u=null,E="inspect",g=null,L=null,X=null,Y="",B="",C=null,k=[],H="auto",ee=""}export{Dt as mount,It as unmount};
