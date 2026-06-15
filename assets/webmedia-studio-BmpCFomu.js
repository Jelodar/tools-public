import{c as ma,a as pa}from"./media-trimmer-U6E26pVc.js";import{d as ba}from"./index-CoRJqXFF.js";import{r as fa}from"./form-controls-B4kWIsdX.js";import{d as ft,s as wt}from"./ui-utils-CG6aKAAj.js";import{c as wa}from"./media-visualization-D8M9LHeC.js";import"./pool-CFv1-M46.js";const vt=2048,_e=20,ce={color:"#ffdc00",fontFamily:"Arial",fontSize:20,outline:0,position:"bottom"};let Re=null;function va(e="",t="auto"){const a=String(e||"").replace(/^\uFEFF/,"").replace(/\r/g,""),o=(t==="srt"||t==="vtt"?t:/^\s*WEBVTT\b/i.test(a)?"vtt":"srt")==="vtt"?Sa(a):ha(a);return Be(o)}function $t(e=[],t={}){const a=Qe(t),n=[`color=${a.color}`,`font=${a.fontFamily}`,`size=${a.fontSize}`,a.outline?`outline=${a.outline}`:"",a.position!=="bottom"?`position=${a.position}`:"",a.background?"background=true":""].filter(Boolean).join(" "),o=Be(e).map((r,l)=>[String(l+1),`${yt(r.start)} --> ${yt(r.end)}`,r.text].join(`
`)).join(`

`);return`WEBVTT

NOTE style ${n}${o?`

${o}
`:`
`}`}function Qe(e={}){const t=e&&typeof e=="object"?e:{},a=String(t.color||ce.color).trim(),n=String(t.fontFamily||t.font||ce.fontFamily).replace(/,/g," ").trim()||ce.fontFamily;return{color:/^#[0-9a-f]{6}$/i.test(a)?a:ce.color,fontFamily:n,fontSize:gt(t.fontSize??t.size,ce.fontSize,8,160),outline:gt(t.outline,ce.outline,0,24),position:["bottom","top","center"].includes(t.position)?t.position:ce.position,background:!!t.background}}function Be(e=[]){return Array.from(e||[]).map((t,a)=>{const n=Math.max(0,Number(t==null?void 0:t.start)||0),o=Math.max(n+.1,Number(t==null?void 0:t.end)||n+2);return{id:(t==null?void 0:t.id)||`cue-${a+1}`,index:a+1,start:n,end:o,text:String((t==null?void 0:t.text)||"").trim()}}).filter(t=>t.text)}async function Bt(e=[]){const t=new TextEncoder,a=[];let n=0;for(const y of Array.from(e||[])){const w=Aa(y==null?void 0:y.name);if(!w)continue;const O=await zt(y==null?void 0:y.data),A=t.encode(w),D=Ra(O),v=new Uint8Array(30+A.length);W(v,0,67324752),P(v,4,_e),P(v,6,vt),P(v,8,0),P(v,10,0),P(v,12,0),W(v,14,D),W(v,18,O.length),W(v,22,O.length),P(v,26,A.length),P(v,28,0),v.set(A,30),a.push({nameBytes:A,data:O,crc:D,local:v,offset:n}),n+=v.length+O.length}const o=[];for(const y of a){const w=new Uint8Array(46+y.nameBytes.length);W(w,0,33639248),P(w,4,_e),P(w,6,_e),P(w,8,vt),P(w,10,0),P(w,12,0),P(w,14,0),W(w,16,y.crc),W(w,20,y.data.length),W(w,24,y.data.length),P(w,28,y.nameBytes.length),P(w,30,0),P(w,32,0),P(w,34,0),P(w,36,0),W(w,38,0),W(w,42,y.offset),w.set(y.nameBytes,46),o.push(w)}const r=o.reduce((y,w)=>y+w.length,0),l=n,b=new Uint8Array(22);W(b,0,101010256),P(b,4,0),P(b,6,0),P(b,8,a.length),P(b,10,a.length),W(b,12,r),W(b,16,l),P(b,20,0);const f=a.flatMap(y=>[y.local,y.data]);return new Blob([...f,...o,b],{type:"application/zip"})}async function ya(e={}){const t=Dt(e),a=Be(t.cues),n=$t(a,t);return Bt([{name:"captions.vtt",data:n},{name:"manifest.json",data:JSON.stringify(Ea(e,a,t),null,2)}])}async function ga(e,t={}){var w,O;const a=((w=t.conversion)==null?void 0:w.package)||((O=t.settings)==null?void 0:O.hls)||{},n=Dt(t),o=Be(n.cues),r=await zt(e),l=o.length>0&&a.captionRendition!==!1,b=Ta(t,a),y=[{name:"master.m3u8",data:Ma(t,l)},{name:"media.m3u8",data:b},{name:"segment-000.ts",data:r},{name:"manifest.json",data:JSON.stringify(ka(t,a,r.length,l),null,2)}];return l&&y.splice(3,0,{name:"captions.vtt",data:$t(o,n)}),Bt(y)}function ha(e){return e.split(/\n{2,}/).flatMap(t=>{const a=t.split(`
`).map(l=>l.trim()).filter(Boolean),n=a.findIndex(l=>l.includes("-->"));if(n<0)return[];const[o,r]=a[n].split("-->").map(l=>l.trim().split(/\s+/)[0]);return[{start:je(o),end:je(r),text:a.slice(n+1).join(`
`)}]})}function Sa(e){return e.split(/\n{2,}/).flatMap(t=>{const a=t.split(`
`).map(l=>l.trim()).filter(Boolean);if(!a.length||/^WEBVTT\b/i.test(a[0])||/^NOTE\b/i.test(a[0])||/^STYLE\b/i.test(a[0]))return[];const n=a.findIndex(l=>l.includes("-->"));if(n<0)return[];const[o,r]=a[n].split("-->").map(l=>l.trim().split(/\s+/)[0]);return[{start:je(o),end:je(r),text:a.slice(n+1).join(`
`)}]})}function je(e=""){const[t,a="0"]=String(e||"").trim().replace(",",".").split("."),n=t.split(":").map(r=>Number(r));return n.some(r=>!Number.isFinite(r))?0:n.reduce((r,l)=>r*60+l,0)+(+`0.${a.padEnd(3,"0").slice(0,3)}`||0)}function yt(e=0){const t=Math.max(0,Math.round(Number(e||0)*1e3)),a=Math.floor(t/36e5),n=Math.floor(t%36e5/6e4),o=Math.floor(t%6e4/1e3),r=t%1e3;return`${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}:${String(o).padStart(2,"0")}.${String(r).padStart(3,"0")}`}function Dt(e={}){var n,o,r;const t=((o=(n=e.conversion)==null?void 0:n.adjustments)==null?void 0:o.subtitles)||{},a=((r=e.settings)==null?void 0:r.subtitles)||{};return{...a,...t,cues:Array.isArray(t.cues)?t.cues:a.cues}}function Ea(e,t,a){var n;return{type:"webmedia-subtitle-package",source:((n=e.source)==null?void 0:n.fileName)||"media",language:a.language||"und",cues:t.length,style:Qe(a),files:["captions.vtt"]}}function ka(e,t,a,n){var o;return{type:"webmedia-hls-package",source:((o=e.source)==null?void 0:o.fileName)||"media",playlistType:t.playlistType||"vod",segmentDuration:Ft(e,t),segmentBytes:a,files:["master.m3u8","media.m3u8","segment-000.ts",...n?["captions.vtt"]:[]]}}function Ma(e,t){var b,f,y;const a=Math.max(1,Math.round(Number(((f=(b=e.conversion)==null?void 0:b.video)==null?void 0:f.bitrate)||0)||xa(e))),n=Array.isArray((y=e.source)==null?void 0:y.tracks)?e.source.tracks.find(w=>w.kind==="video"):null,o=n!=null&&n.width&&(n!=null&&n.height)?`,RESOLUTION=${Math.round(n.width)}x${Math.round(n.height)}`:"",r=t?`#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Captions",DEFAULT=YES,AUTOSELECT=YES,LANGUAGE="eng",URI="captions.vtt"
`:"",l=t?',SUBTITLES="subs"':"";return["#EXTM3U","#EXT-X-VERSION:3",r.trimEnd(),`#EXT-X-STREAM-INF:BANDWIDTH=${a}${o}${l}`,"media.m3u8",""].filter(w=>w!=="").join(`
`)}function Ta(e,t={}){const a=Ft(e,t),n=["vod","event","live"].includes(t.playlistType)?t.playlistType:"vod",o=["#EXTM3U","#EXT-X-VERSION:3",`#EXT-X-TARGETDURATION:${Math.max(1,Math.ceil(a))}`];return n!=="live"&&o.push(`#EXT-X-PLAYLIST-TYPE:${n.toUpperCase()}`),t.independentSegments!==!1&&o.push("#EXT-X-INDEPENDENT-SEGMENTS"),o.push(`#EXTINF:${a.toFixed(3)},`),o.push("segment-000.ts"),n!=="live"&&o.push("#EXT-X-ENDLIST"),o.push(""),o.join(`
`)}function Ft(e,t={}){var o;const a=Number(((o=e.source)==null?void 0:o.duration)||0),n=Number(t.segmentDuration||0);return Math.max(.1,a||n||6)}function xa(e={}){var n,o;const t=Number(((n=e.source)==null?void 0:n.duration)||0),a=Number(((o=e.source)==null?void 0:o.size)||0);return t>0&&a>0?Math.max(1,Math.round(a*8/t)):25e5}async function zt(e){return e instanceof Uint8Array?e:e instanceof ArrayBuffer?new Uint8Array(e):ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):e&&typeof e.arrayBuffer=="function"?new Uint8Array(await e.arrayBuffer()):new TextEncoder().encode(String(e??""))}function Aa(e=""){return String(e||"").replace(/\\/g,"/").replace(/^\/+/,"").split("/").filter(Boolean).join("/")}function gt(e,t,a,n){const o=Number(e);return Number.isFinite(o)?Math.max(a,Math.min(n,o)):t}function P(e,t,a){e[t]=a&255,e[t+1]=a>>>8&255}function W(e,t,a){e[t]=a&255,e[t+1]=a>>>8&255,e[t+2]=a>>>16&255,e[t+3]=a>>>24&255}function Ca(){if(Re)return Re;Re=new Uint32Array(256);for(let e=0;e<256;e+=1){let t=e;for(let a=0;a<8;a+=1)t=t&1?3988292384^t>>>1:t>>>1;Re[e]=t>>>0}return Re}function Ra(e){const t=Ca();let a=4294967295;for(const n of e)a=t[(a^n)&255]^a>>>8;return(a^4294967295)>>>0}const ht=new Map([["video/mp4","mp4"],["audio/mp4","mp4"],["video/quicktime","mov"],["video/webm","webm"],["audio/webm","webm"],["video/x-matroska","matroska"],["audio/x-matroska","matroska"],["audio/wav","wav"],["audio/wave","wav"],["audio/mpeg","mp3"],["audio/ogg","ogg"],["video/ogg","ogg"],["audio/flac","flac"],["audio/aac","adts"],["application/vnd.apple.mpegurl","hls"],["application/x-mpegurl","hls"],["video/mp2t","mpegts"]]),La=new Map([["mp4","mp4"],["m4v","mp4"],["m4a","mp4"],["mov","mov"],["webm","webm"],["mkv","matroska"],["mka","matroska"],["wav","wav"],["wave","wav"],["mp3","mp3"],["ogg","ogg"],["oga","ogg"],["flac","flac"],["aac","adts"],["adts","adts"],["ts","mpegts"],["m2ts","mpegts"],["m3u8","hls"]]),se={mp4:{label:"MP4",extension:"mp4",mime:"video/mp4",video:["h264","hevc","av1"],audio:["aac","mp3","opus"],subtitles:["vtt","tx3g"]},mov:{label:"QuickTime",extension:"mov",mime:"video/quicktime",video:["h264","hevc","prores"],audio:["aac","pcm","mp3"],subtitles:["tx3g"]},webm:{label:"WebM",extension:"webm",mime:"video/webm",video:["vp8","vp9","av1"],audio:["opus","vorbis"],subtitles:["vtt"]},matroska:{label:"Matroska",extension:"mkv",mime:"video/x-matroska",video:["h264","hevc","av1","vp8","vp9"],audio:["aac","opus","vorbis","flac","mp3","pcm"],subtitles:["vtt","srt","ass"]},wav:{label:"WAVE",extension:"wav",mime:"audio/wav",video:[],audio:["pcm"],subtitles:[]},mp3:{label:"MP3",extension:"mp3",mime:"audio/mpeg",video:[],audio:["mp3"],subtitles:[]},ogg:{label:"Ogg",extension:"ogg",mime:"audio/ogg",video:["theora","vp8"],audio:["opus","vorbis","flac"],subtitles:[]},adts:{label:"ADTS AAC",extension:"aac",mime:"audio/aac",video:[],audio:["aac"],subtitles:[]},flac:{label:"FLAC",extension:"flac",mime:"audio/flac",video:[],audio:["flac"],subtitles:[]},mpegts:{label:"MPEG-TS",extension:"ts",mime:"video/mp2t",video:["h264","hevc"],audio:["aac","mp3"],subtitles:[]},hls:{label:"HLS",extension:"m3u8",mime:"application/vnd.apple.mpegurl",video:["h264","hevc"],audio:["aac","mp3"],subtitles:["vtt"]}},Oa={inspect:"mp4",remux:"mp4",transcode:"mp4",trim:"mp4",transform:"mp4",audio:"mp3",subtitles:"mp4",hls:"hls"},Xe=["VideoDecoder","VideoEncoder","AudioDecoder","AudioEncoder"],Na=new Set(["summary","metadata","packets","compatibility"]),St=new Set(["fill","contain","cover"]),Pa=new Set(["no-preference","prefer-hardware","prefer-software"]),Ia=new Set(["discard","keep"]),Et=new Set(["u8","s16","s32","f32"]),$a=new Set(["all","primary"]),Ba=new Set([0,90,180,270]),Da=new Set(["preserve","rebase","zero"]),Fa=new Set(["preserve","matrix","bake"]),za=new Set(["keep","drop"]),ja=new Set(["drop","keep-compatible"]),Va=new Set(["keep","replace","strip"]),qa=new Set(["bitrate","quality","lossless"]),Ua=new Set(["draft","preview","fast","medium","quality","slow","veryslow"]),Wa=new Set(["auto","quality","realtime"]),_a=new Set(["none","film","animation","screen","grain"]),Ka=new Set(["none","keyframe","frame","sample"]),Ha=new Set(["auto","vtt","srt"]),Xa=new Set(["bottom","top","center"]),Ja=new Set(["vod","event","live"]);function Ga(e={}){const t=String(e.type||e.mime||"").toLowerCase().split(";")[0].trim();if(ht.has(t))return ht.get(t);const a=String(e.name||e.fileName||"").toLowerCase(),n=a.includes(".")?a.split(".").pop():"";return La.get(n)||"unknown"}function oe(e=""){const t=String(e||"").toLowerCase().trim();return t?t.startsWith("avc1")||t.startsWith("avc3")||t==="avc"||t==="h264"||t==="h.264"?"h264":t.startsWith("hev1")||t.startsWith("hvc1")||t==="hevc"||t==="h265"||t==="h.265"?"hevc":t.startsWith("av01")?"av1":t.startsWith("vp09")?"vp9":t.startsWith("vp08")?"vp8":t.startsWith("mp4a")||t.includes("aac")?"aac":t.includes("pcm")?"pcm":t.includes("vorbis")?"vorbis":t.includes("opus")?"opus":t.includes("flac")?"flac":t.includes("mp3")||t.includes("mpeg")?"mp3":t.includes("vtt")?"vtt":t.includes("srt")?"srt":t.includes("ass")?"ass":t.split(/[.,\s/]+/)[0]||"unknown":"unknown"}function jt(e={}){const t=e.fileName||e.name||"media";return{fileName:t,mime:e.mime||e.type||"",size:Number(e.size||0),duration:Number(e.duration||0),container:e.container||Ga({name:t,type:e.mime||e.type}),tracks:Array.isArray(e.tracks)?e.tracks.map((a,n)=>Ya(a,n)):[]}}function Ya(e={},t=0){const a=["video","audio","subtitle"].includes(e.kind)?e.kind:"unknown";return{id:e.id||`${a}-${t+1}`,kind:a,codec:oe(e.codec||e.codecString),codecString:e.codecString||e.codec||"",width:Number(e.width||0),height:Number(e.height||0),sampleRate:Number(e.sampleRate||0),channels:Number(e.channels||0),duration:Number(e.duration||0),language:e.language||"",rotation:Number(e.rotation||0),frameRate:Number(e.frameRate||0),decodable:e.decodable===!0}}function Ve(e,t){const a=se[e];if(!a)return!1;const n=oe(t.codec||t.codecString);return t.kind==="video"?a.video.includes(n):t.kind==="audio"?a.audio.includes(n):t.kind==="subtitle"?a.subtitles.includes(n):!1}function Qa(e={},t={}){const a=t.metadata||{},n=jt({fileName:e.name||e.fileName,mime:e.type||e.mime,size:e.size,duration:a.duration??e.duration,tracks:a.tracks||e.tracks||t.tracks||[]}),o=he(t.capabilities||{}),r=Array.isArray(t.warnings)?[...t.warnings]:[];return n.container==="unknown"&&r.push({code:"UNSUPPORTED_INPUT_FORMAT",message:"Input container could not be identified locally."}),o.ready||r.push({code:"WEB_CODECS_INCOMPLETE",message:"Browser WebCodecs support is incomplete; transcode and accurate trim may be blocked."}),{...n,modifiedAt:e.lastModified||null,metadata:{provider:a.provider||"summary",depth:a.depth||"summary",tags:Kt(a.tags)},capabilities:o,warnings:r}}function he(e={}){const t=e.main||e,a=e.worker||{},n=kt(t),o=kt(a),r=Xe.filter(y=>!n[y]),l=Xe.filter(y=>!o[y]),b=Mt(t),f=Mt(a);return{main:n,worker:o,mainKnown:b,workerKnown:f,missingMain:r,missingWorker:l,ready:b&&f&&r.length===0&&l.length===0}}function Vt(e={}){var L,$;const t=String(e.operation||"inspect").toLowerCase(),a=jt(e.source||{}),n=Za(e,t),o=se[e.targetContainer]?e.targetContainer:Oa[t]||"mp4",r=se[o]||se.mp4,l=[],b=[],f=ei(t,a,n,o),y=!!(e.remuxOnly??n.remux.remuxOnly),w=f.requiresReencode,O=t==="hls"||o==="hls",A=t==="subtitles"&&n.subtitles.importText,D=O||A;a.container==="unknown"&&b.push({code:"UNSUPPORTED_INPUT_FORMAT",message:"Input container is not recognized by the local planner."}),A&&!n.subtitles.cues.length&&l.push({code:"WEBMEDIA_SUBTITLE_TEXT_EMPTY",message:"Subtitle package will export an empty WebVTT sidecar until cues are added."}),n.subtitles.burnIn&&b.push({code:"WEBMEDIA_SUBTITLE_BURNIN_HANDOFF",message:"Subtitle burn-in requires a verified frame render pipeline; use Video Studio for burn-in."}),Wt((L=f.adjustments)==null?void 0:L.transform)&&b.push({code:"WEBMEDIA_FRAME_EFFECTS_PENDING",message:"Frame effects, flips, canvas positioning, and color adjustments need the verified frame render path before browser-native export.",suggestedRoute:"/video-studio"}),_t(($=f.adjustments)==null?void 0:$.audio)&&b.push({code:"WEBMEDIA_AUDIO_EFFECTS_PENDING",message:"Audio gain, fades, normalization, dynamics, pan, and filters need the verified Web Audio render path before browser-native export.",suggestedRoute:"/video-studio"});const v=pi(a,f);t!=="inspect"&&a.tracks.length&&!v.length&&b.push({code:"WEBMEDIA_NO_OUTPUT_TRACKS",message:"Selected settings would remove every media track."});const S=D?[]:v.filter(F=>!Ve(o,F));S.length&&b.push({code:"TARGET_CONTAINER_CODEC_UNSUPPORTED",message:`${r.label} cannot carry ${S.map(F=>`${F.kind}:${F.codec}`).join(", ")} with the selected settings.`}),y&&w&&b.push({code:"REMUX_ONLY_REENCODE_REQUIRED",message:"Requested operation requires decode and encode, but remux-only is selected."}),w&&l.push({code:"REENCODE_REQUIRED",message:"This operation requires reencode; packet-copy remux is not possible."});let E="Remux";t==="inspect"?E="Inspect":b.length?E="Blocked":D?E="Package":t==="audio"?E="Audio":w||t==="transcode"?E="Transcode":t==="trim"&&n.trim.mode==="packet"&&(E="Remux");const x=ci(t,o,r,{hlsPackage:O,subtitlePackage:A});return{operation:t,mode:E,source:a,targetContainer:o,requiresReencode:w,remuxOnly:y,execution:t==="inspect"?"inspect-report":b.length?"blocked":O?"webmedia-hls-package":A?"webmedia-subtitle-package":"mediabunny-conversion",settings:n,conversion:bi(f),output:x,warnings:l,errors:b}}function Me(e="media",t={}){var r,l;const a=String(e||"media").replace(/[\\/]/g,"_"),n=a.includes(".")?a.slice(0,a.lastIndexOf(".")):a,o=((r=t.output)==null?void 0:r.extension)||((l=se[t.targetContainer])==null?void 0:l.extension)||"bin";return`${n||"media"}.webmedia.${o}`}function kt(e={}){return{VideoDecoder:!!e.VideoDecoder,VideoEncoder:!!e.VideoEncoder,AudioDecoder:!!e.AudioDecoder,AudioEncoder:!!e.AudioEncoder,EncodedVideoChunk:!!e.EncodedVideoChunk,EncodedAudioChunk:!!e.EncodedAudioChunk}}function Mt(e={}){return Xe.some(t=>Object.prototype.hasOwnProperty.call(e,t))}function Za(e={},t="inspect"){var w,O,A,D,v,S,E,x,L,$,F;const a=e.settings||{},n=a.inspect||{},o=a.transcode||{},r=a.transform||e.transform||{},l=a.trim||e.trim||{},b=a.audio||{},f=a.subtitles||{},y=a.hls||{};return{inspect:{depth:Na.has(n.depth)?n.depth:"metadata",packetSampleLimit:He(n.packetSampleLimit,0,2e3),includeTags:n.includeTags!==!1,includePackets:!!n.includePackets,includeCompatibility:n.includeCompatibility!==!1},tracks:$a.has(a.tracks)?a.tracks:"all",remux:{remuxOnly:e.remuxOnly!==void 0?!!e.remuxOnly:t==="remux"&&((w=a.remux)==null?void 0:w.remuxOnly)!==!1,trackPolicy:((O=a.remux)==null?void 0:O.trackPolicy)==="drop-incompatible"?"drop-incompatible":"keep-all",timestampPolicy:Da.has((A=a.remux)==null?void 0:A.timestampPolicy)?a.remux.timestampPolicy:"preserve",rotationPolicy:Fa.has((D=a.remux)==null?void 0:D.rotationPolicy)?a.remux.rotationPolicy:"preserve",fastStart:!!((v=a.remux)!=null&&v.fastStart),interleaveMs:He((S=a.remux)==null?void 0:S.interleaveMs,0,1e4),chapterPolicy:za.has((E=a.remux)==null?void 0:E.chapterPolicy)?a.remux.chapterPolicy:"keep",attachmentPolicy:ja.has((x=a.remux)==null?void 0:x.attachmentPolicy)?a.remux.attachmentPolicy:"drop",metadataPolicy:Va.has((L=a.remux)==null?void 0:L.metadataPolicy)?a.remux.metadataPolicy:"keep"},transcode:{preset:String(o.preset||"custom"),speedPreset:Ua.has(o.speedPreset)?o.speedPreset:"medium",videoCodec:Ke(o.videoCodec??e.videoCodec??"copy"),audioCodec:Ke(o.audioCodec??e.audioCodec??"copy"),rateControl:qa.has(o.rateControl)?o.rateControl:"bitrate",quality:U(o.quality,0,100),videoBitrateKbps:Le(o.videoBitrateKbps),maxVideoBitrateKbps:Le(o.maxVideoBitrateKbps),bufferSizeKbps:Le(o.bufferSizeKbps),audioBitrateKbps:Le(o.audioBitrateKbps),width:Q(o.width),height:Q(o.height),fit:St.has(o.fit)?o.fit:"contain",preventUpscale:!!o.preventUpscale,frameRate:z(o.frameRate),keyFrameInterval:z(o.keyFrameInterval),hardwareAcceleration:Pa.has(o.hardwareAcceleration)?o.hardwareAcceleration:"no-preference",alpha:Ia.has(o.alpha)?o.alpha:"discard",latencyMode:Wa.has(o.latencyMode)?o.latencyMode:"auto",tune:_a.has(o.tune)?o.tune:"none",bitDepth:He(o.bitDepth,0,16),colorSpace:String(o.colorSpace||"auto").trim()||"auto",sampleRate:Q(o.sampleRate),channels:Q(o.channels),sampleFormat:Et.has(o.sampleFormat)?o.sampleFormat:"",discardVideo:!!o.discardVideo,discardAudio:!!o.discardAudio,forceVideo:o.forceVideo!==!1&&t==="transcode",forceAudio:o.forceAudio!==!1&&t==="transcode"},trim:{start:z(l.start),end:z(l.end),duration:z(l.duration),mode:l.mode==="accurate"?"accurate":"packet",snapPolicy:Ka.has(l.snapPolicy)?l.snapPolicy:"keyframe",preroll:z(l.preroll),postroll:z(l.postroll),preserveTimestamps:!!l.preserveTimestamps,fadeIn:z(l.fadeIn),fadeOut:z(l.fadeOut)},transform:{width:Q(r.width??(($=r.resize)==null?void 0:$.width)),height:Q(r.height??((F=r.resize)==null?void 0:F.height)),fit:St.has(r.fit)?r.fit:"contain",rotate:ki(r.rotate),allowRotationMetadata:r.allowRotationMetadata!==!1,crop:Ei(r.crop),frameRate:z(r.frameRate),anchor:String(r.anchor||"center").trim()||"center",scale:z(r.scale),x:ge(r.x),y:ge(r.y),flipHorizontal:!!r.flipHorizontal,flipVertical:!!r.flipVertical,background:Mi(r.background),color:wi(r.color),effects:vi(r.effects)},audio:{mode:b.mode==="drop"?"drop":b.mode==="copy"?"copy":"convert",audioCodec:Ke(b.audioCodec??e.audioCodec??"mp3"),audioBitrateKbps:Le(b.audioBitrateKbps),sampleRate:Q(b.sampleRate),channels:Q(b.channels),sampleFormat:Et.has(b.sampleFormat)?b.sampleFormat:"",discardVideo:b.discardVideo!==!1,gainDb:ge(b.gainDb),normalize:!!b.normalize,normalizeTargetDb:ge(b.normalizeTargetDb||-14),limiter:!!b.limiter,fadeIn:z(b.fadeIn),fadeOut:z(b.fadeOut),pan:U(b.pan,-1,1),highpassHz:z(b.highpassHz),lowpassHz:z(b.lowpassHz),compressorThreshold:ge(b.compressorThreshold),compressorRatio:z(b.compressorRatio)},subtitles:{mode:f.mode==="drop"?"drop":"copy",importText:!!f.importText,burnIn:!!f.burnIn,language:String(f.language||"").trim(),sourceFormat:Ha.has(f.sourceFormat)?f.sourceFormat:"auto",fileName:String(f.fileName||"").trim(),offset:ge(f.offset),...Qe(f),position:Xa.has(f.position)?f.position:"bottom",outline:z(f.outline),background:!!f.background,cues:Be(f.cues)},hls:{segmentDuration:U(y.segmentDuration||6,1,30),playlistType:Ja.has(y.playlistType)?y.playlistType:"vod",variantLadder:String(y.variantLadder||"").trim(),independentSegments:y.independentSegments!==!1,iframePlaylist:!!y.iframePlaylist,audioRenditions:!!y.audioRenditions,captionRendition:!!y.captionRendition},metadata:Kt(a.metadata||e.metadata||{})}}function ei(e,t,a,n){const o={tracks:a.tracks,video:{},audio:{},trim:{},mux:ti(a.remux),profile:ai(a.transcode),adjustments:ii(e,a),package:{},tags:a.metadata,requiresReencode:!1};return e==="remux"&&a.remux.trackPolicy==="drop-incompatible"&&di(o,t,n),e==="transcode"&&(Object.assign(o.video,ui(a.transcode)),Object.assign(o.audio,Tt(a.transcode))),e==="trim"&&(a.trim.start>0&&(o.trim.start=a.trim.start),a.trim.end>0&&(o.trim.end=a.trim.end),a.trim.duration>0&&!o.trim.end&&(o.trim.duration=a.trim.duration),a.trim.mode==="accurate"&&(o.video.forceTranscode=xt(t,"video"),o.audio.forceTranscode=xt(t,"audio"),o.requiresReencode=o.video.forceTranscode||o.audio.forceTranscode),(a.trim.fadeIn>0||a.trim.fadeOut>0)&&(o.adjustments.audio.fadeIn=a.trim.fadeIn,o.adjustments.audio.fadeOut=a.trim.fadeOut)),e==="transform"&&(Object.assign(o.video,mi(a.transform)),o.requiresReencode=Object.keys(o.video).length>0),e==="audio"&&(a.audio.discardVideo&&(o.video.discard=!0),a.audio.mode==="drop"?o.audio.discard=!0:Object.assign(o.audio,Tt(a.audio))),e==="subtitles"&&(o.tracks=a.subtitles.mode==="drop"?"primary":a.tracks),e==="hls"&&(o.package=ri(a.hls),li(o,t)),e==="remux"||e==="subtitles"?o.requiresReencode=!1:o.requiresReencode=o.requiresReencode||qt(o.video)||Ut(o.audio),o.requiresReencode=o.requiresReencode||Wt(o.adjustments.transform)||_t(o.adjustments.audio),o}function ti(e={}){const t={};return e.fastStart&&(t.fastStart=!0),e.interleaveMs>0&&(t.interleaveMs=e.interleaveMs),e.timestampPolicy!=="preserve"&&(t.timestampPolicy=e.timestampPolicy),e.rotationPolicy!=="preserve"&&(t.rotationPolicy=e.rotationPolicy),e.chapterPolicy!=="keep"&&(t.chapterPolicy=e.chapterPolicy),e.attachmentPolicy!=="drop"&&(t.attachmentPolicy=e.attachmentPolicy),e.metadataPolicy!=="keep"&&(t.metadataPolicy=e.metadataPolicy),t}function ai(e={}){const t={};return e.rateControl!=="bitrate"&&(t.rateControl=e.rateControl),e.speedPreset!=="medium"&&(t.speedPreset=e.speedPreset),e.quality>0&&(t.quality=e.quality),e.maxVideoBitrateKbps>0&&(t.maxVideoBitrate=e.maxVideoBitrateKbps*1e3),e.bufferSizeKbps>0&&(t.bufferSize=e.bufferSizeKbps*1e3),e.preventUpscale&&(t.preventUpscale=!0),e.latencyMode!=="auto"&&(t.latencyMode=e.latencyMode),e.tune!=="none"&&(t.tune=e.tune),e.bitDepth>0&&(t.bitDepth=e.bitDepth),e.colorSpace!=="auto"&&(t.colorSpace=e.colorSpace),t}function ii(e,t={}){return{transform:["transform"].includes(e)?oi(t.transform):{},audio:["audio","trim"].includes(e)?ni(t.audio,t.trim):{},subtitles:e==="subtitles"?si(t.subtitles):{}}}function oi(e={}){const t={};return e.anchor!=="center"&&(t.anchor=e.anchor),e.scale>0&&e.scale!==1&&(t.scale=e.scale),e.x!==0&&(t.x=e.x),e.y!==0&&(t.y=e.y),e.flipHorizontal&&(t.flipHorizontal=!0),e.flipVertical&&(t.flipVertical=!0),e.background&&(t.background=e.background),yi(e.color)&&(t.color=e.color),gi(e.effects)&&(t.effects=e.effects),t}function ni(e={},t={}){const a={};e.gainDb!==0&&(a.gainDb=e.gainDb),e.normalize&&(a.normalize=!0,a.normalizeTargetDb=e.normalizeTargetDb),e.limiter&&(a.limiter=!0);const n=Math.max(e.fadeIn||0,t.fadeIn||0),o=Math.max(e.fadeOut||0,t.fadeOut||0);return n>0&&(a.fadeIn=n),o>0&&(a.fadeOut=o),e.pan!==0&&(a.pan=e.pan),e.highpassHz>0&&(a.highpassHz=e.highpassHz),e.lowpassHz>0&&(a.lowpassHz=e.lowpassHz),e.compressorThreshold!==0&&(a.compressorThreshold=e.compressorThreshold),e.compressorRatio>0&&(a.compressorRatio=e.compressorRatio),a}function si(e={}){const t={};return e.importText&&(e.sourceFormat!=="auto"&&(t.sourceFormat=e.sourceFormat),e.fileName&&(t.fileName=e.fileName),e.language&&(t.language=e.language),e.offset!==0&&(t.offset=e.offset),e.fontSize>0&&(t.fontSize=e.fontSize),e.color&&(t.color=e.color),e.fontFamily&&(t.fontFamily=e.fontFamily),e.position!=="bottom"&&(t.position=e.position),e.outline>0&&(t.outline=e.outline),e.background&&(t.background=!0),e.cues.length&&(t.cues=e.cues)),t}function ri(e={}){const t={segmentDuration:e.segmentDuration,playlistType:e.playlistType,independentSegments:e.independentSegments};return e.variantLadder&&(t.variantLadder=e.variantLadder),e.iframePlaylist&&(t.iframePlaylist=!0),e.audioRenditions&&(t.audioRenditions=!0),e.captionRendition&&(t.captionRendition=!0),t}function di(e,t,a){const n=t.tracks.filter(r=>r.kind==="video"),o=t.tracks.filter(r=>r.kind==="audio");n.length&&n.every(r=>!Ve(a,r))&&(e.video.discard=!0),o.length&&o.every(r=>!Ve(a,r))&&(e.audio.discard=!0)}function li(e,t){const a=t.tracks.filter(o=>o.kind==="video"),n=t.tracks.filter(o=>o.kind==="audio");a.some(o=>!["h264","hevc"].includes(oe(o.codec)))&&(e.video.codec="avc",e.video.forceTranscode=!0),n.some(o=>!["aac","mp3"].includes(oe(o.codec)))&&(e.audio.codec="aac",e.audio.forceTranscode=!0),e.requiresReencode=qt(e.video)||Ut(e.audio)}function ci(e,t,a,n={}){return e==="inspect"?{container:t,label:a.label,extension:"json",mime:"application/json"}:n.hlsPackage?{container:"hls",label:"HLS package",extension:"zip",mime:"application/zip"}:n.subtitlePackage?{container:t,label:"Subtitle package",extension:"zip",mime:"application/zip"}:{container:t,label:a.label,extension:a.extension,mime:a.mime}}function ui(e={}){const t={},a=hi(e.videoCodec);return e.discardVideo&&(t.discard=!0),a&&(t.codec=a),e.videoBitrateKbps>0&&(t.bitrate=e.videoBitrateKbps*1e3),e.width>0&&(t.width=e.width),e.height>0&&(t.height=e.height),e.width>0&&e.height>0&&(t.fit=e.fit),e.frameRate>0&&(t.frameRate=e.frameRate),e.keyFrameInterval>0&&(t.keyFrameInterval=e.keyFrameInterval),e.hardwareAcceleration&&(t.hardwareAcceleration=e.hardwareAcceleration),e.alpha&&(t.alpha=e.alpha),(e.forceVideo||a||e.videoBitrateKbps>0)&&(t.forceTranscode=!0),t}function mi(e={}){const t={};return e.width>0&&(t.width=e.width),e.height>0&&(t.height=e.height),e.width>0&&e.height>0&&(t.fit=e.fit),e.rotate&&(t.rotate=e.rotate),e.allowRotationMetadata===!1&&(t.allowRotationMetadata=!1),e.crop&&(t.crop=e.crop),e.frameRate>0&&(t.frameRate=e.frameRate),Object.keys(t).length&&(t.forceTranscode=!0),t}function Tt(e={}){const t={},a=Si(e.audioCodec);return e.discardAudio&&(t.discard=!0),a&&(t.codec=a),e.audioBitrateKbps>0&&(t.bitrate=e.audioBitrateKbps*1e3),e.sampleRate>0&&(t.sampleRate=e.sampleRate),e.channels>0&&(t.numberOfChannels=e.channels),e.sampleFormat&&(t.sampleFormat=e.sampleFormat),(e.forceAudio||a||e.audioBitrateKbps>0||e.sampleRate>0||e.channels>0||e.sampleFormat)&&(t.forceTranscode=!0),t}function pi(e,t){return e.tracks.filter(a=>a.kind==="video"?t.video.discard!==!0:a.kind==="audio"?t.audio.discard!==!0:a.kind==="subtitle").map(a=>a.kind==="video"&&t.video.codec?{...a,codec:oe(t.video.codec)}:a.kind==="audio"&&t.audio.codec?{...a,codec:oe(t.audio.codec)}:a)}function bi(e){return{tracks:e.tracks,...Object.keys(e.video).length?{video:e.video}:{},...Object.keys(e.audio).length?{audio:e.audio}:{},...Object.keys(e.trim).length?{trim:e.trim}:{},...Object.keys(e.mux).length?{mux:e.mux}:{},...Object.keys(e.profile).length?{profile:e.profile}:{},...fi(e.adjustments)?{adjustments:e.adjustments}:{},...Object.keys(e.package).length?{package:e.package}:{},...Object.keys(e.tags).length?{tags:e.tags}:{}}}function qt(e={}){return!!(e.codec||e.bitrate||e.width||e.height||e.rotate||e.crop||e.frameRate||e.keyFrameInterval||e.forceTranscode||e.allowRotationMetadata===!1)}function Ut(e={}){return!!(e.codec||e.bitrate||e.sampleRate||e.numberOfChannels||e.sampleFormat||e.forceTranscode)}function fi(e={}){return!!(Object.keys(e.transform||{}).length||Object.keys(e.audio||{}).length||Object.keys(e.subtitles||{}).length)}function Wt(e={}){return Object.keys(e||{}).length>0}function _t(e={}){return Object.keys(e||{}).length>0}function wi(e={}){return{exposure:U(e.exposure,-5,5),contrast:U(e.contrast,-100,100),saturation:U(e.saturation,-100,100),temperature:U(e.temperature,-100,100),tint:U(e.tint,-100,100),gamma:U(e.gamma,0,5)}}function vi(e={}){return{sharpen:U(e.sharpen,0,100),denoise:U(e.denoise,0,100),grain:U(e.grain,0,100),blur:U(e.blur,0,100)}}function yi(e={}){return["exposure","contrast","saturation","temperature","tint","gamma"].some(t=>Number(e[t]||0)!==0)}function gi(e={}){return["sharpen","denoise","grain","blur"].some(t=>Number(e[t]||0)!==0)}function xt(e,t){return e.tracks.some(a=>a.kind===t)}function Ke(e){const t=oe(e);return t==="unknown"?"copy":t}function hi(e){const t=oe(e);return t==="copy"||t==="unknown"?"":t==="h264"?"avc":["hevc","vp8","vp9","av1"].includes(t)?t:""}function Si(e){const t=oe(e);return t==="copy"||t==="unknown"?"":t==="pcm"?"pcm-s16":["aac","opus","mp3","vorbis","flac"].includes(t)?t:""}function Ei(e={}){const t=Math.max(0,Math.round(Number(e.x||0))),a=Math.max(0,Math.round(Number(e.y||0))),n=Q(e.width),o=Q(e.height);return n>0&&o>0?{x:t,y:a,width:n,height:o}:null}function ki(e){const t=Math.round(Number(e||0));return Ba.has(t)?t:0}function Mi(e){const t=String(e||"").trim();return/^#[0-9a-f]{6}$/i.test(t)?t:""}function Q(e){const t=Math.round(Number(e||0));return Number.isFinite(t)&&t>0?t:0}function z(e){const t=Number(e||0);return Number.isFinite(t)&&t>0?t:0}function Le(e){const t=Number(e||0);return Number.isFinite(t)?Math.max(0,t):0}function ge(e){const t=Number(e||0);return Number.isFinite(t)?t:0}function He(e,t,a){return Math.round(U(e,t,a))}function U(e,t,a){const n=Number(e||0);return Number.isFinite(n)?Math.min(a,Math.max(t,n)):0}function Kt(e={}){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([,t])=>["string","number","boolean"].includes(typeof t)).map(([t,a])=>[t,String(a)]))}const Ht="https://esm.sh/mediabunny@1.45.4",Xt=new Map,Ti=new Set(["ready","capabilities","inspect","plan","run","cancel"]);function xi(e={}){const t=String(e.type||"");if(!Ti.has(t))throw new Error(`Unsupported web media message: ${t||"missing"}`);return{requestId:e.requestId||"",type:t,payload:e.payload||{}}}async function Jt(e={},t={}){const a=xi(e),n=typeof t.emit=="function"?t.emit:()=>{},o=t.jobs||Xt;try{if(a.type==="ready"||a.type==="capabilities")return;if(a.type==="inspect"){n({type:"progress",payload:{phase:"inspect",percent:8,processedBytes:0}});const r=await Ai(a.payload.mediaFile||a.payload.file,t),l=Qa(a.payload.file||{},{tracks:a.payload.tracks,capabilities:a.payload.capabilities,metadata:r.metadata,warnings:r.warnings});n({type:"progress",payload:{phase:"inspect",percent:100,processedBytes:l.size||0}}),n({type:"result",payload:{inspection:l}});return}if(a.type==="plan"){const r=Vt(a.payload);n({type:"result",payload:{plan:r}});return}if(a.type==="cancel"){const r=a.payload.jobId,l=o.get(r)||{canceled:!1};l.canceled=!0,typeof l.cancel=="function"&&await l.cancel(),o.set(r,l),n({type:"warning",payload:{code:"JOB_CANCELED",message:"Job canceled."}}),n({type:"result",payload:{canceled:!0,jobId:r}});return}await Pi(a.payload,{emit:n,jobs:o,context:t})}catch(r){n({type:"error",payload:qe(r)})}}function qe(e={}){return e.code&&e.message?{code:e.code,message:e.message,recoverable:e.recoverable!==!1,suggestedRoute:e.suggestedRoute||""}:{code:"WEBMEDIA_WORKER_ERROR",message:(e==null?void 0:e.message)||String(e),recoverable:!0,suggestedRoute:""}}async function Ai(e,t={}){if(!e||!t.loadMediabunny&&!Ni(e))return{metadata:null,warnings:[]};try{const n=await(t.loadMediabunny||Ci)();return{metadata:await Ri(e,n),warnings:[]}}catch(a){return{metadata:null,warnings:[{code:"MEDIA_METADATA_UNAVAILABLE",message:(a==null?void 0:a.message)||"Mediabunny metadata inspection was unavailable."}]}}}async function Ci(){return import(Ht)}async function Ri(e,t={}){const{ALL_FORMATS:a,BlobSource:n,Input:o}=t;if(!a||typeof n!="function"||typeof o!="function")throw new Error("Mediabunny metadata APIs are unavailable.");const r=new o({formats:a,source:new n(e)});try{const l=await H(()=>r.getTracks(),[]),b=await H(()=>r.computeDuration(),0),f=await H(()=>r.getMetadataTags(),{}),y=[];for(let w=0;w<l.length;w+=1)y.push(await Li(l[w],w));return{provider:"mediabunny",depth:"metadata",duration:ne(b),tracks:y,tags:f}}finally{const l=r.dispose||r.close;typeof l=="function"&&await l.call(r)}}async function Li(e={},t=0){const a=Oi(e.type||e.kind),n=await H(()=>{var r;return(r=e.getDecoderConfig)==null?void 0:r.call(e)},null),o=a==="video"?await H(()=>{var r;return(r=e.computePacketStats)==null?void 0:r.call(e,100)},null):null;return{id:String(e.id??`${a}-${t+1}`),kind:a,codec:At((n==null?void 0:n.codec)||e.codec),codecString:At((n==null?void 0:n.codec)||e.codec),width:a==="video"?ne(await H(()=>{var r;return(r=e.getDisplayWidth)==null?void 0:r.call(e)},0)):0,height:a==="video"?ne(await H(()=>{var r;return(r=e.getDisplayHeight)==null?void 0:r.call(e)},0)):0,sampleRate:a==="audio"?ne(await H(()=>{var r;return(r=e.getSampleRate)==null?void 0:r.call(e)},(n==null?void 0:n.sampleRate)||0)):0,channels:a==="audio"?ne(await H(()=>{var r;return(r=e.getNumberOfChannels)==null?void 0:r.call(e)},(n==null?void 0:n.numberOfChannels)||0)):0,duration:ne(await H(()=>{var r;return(r=e.computeDuration)==null?void 0:r.call(e)},0)),language:String(e.language||""),rotation:a==="video"?ne(await H(()=>{var r;return(r=e.getRotation)==null?void 0:r.call(e)},0)):0,frameRate:a==="video"?ne(o==null?void 0:o.averagePacketRate):0,decodable:await H(()=>{var r;return(r=e.canDecode)==null?void 0:r.call(e)},!1)===!0}}async function H(e,t){try{return typeof e!="function"?t:await e()??t}catch{return t}}function Oi(e){const t=String(e||"").toLowerCase();return t==="video"||t==="audio"||t==="subtitle"?t:t==="subtitles"||t==="text"?"subtitle":"unknown"}function At(e){if(!e)return"";if(typeof e=="string")return e;if(typeof e=="object"){const a=e.codec||e.name||e.id||e.label;if(a)return String(a)}const t=String(e);return t==="[object Object]"?"":t}function ne(e){const t=Number(e||0);return Number.isFinite(t)?t:0}function Ni(e){return typeof Blob=="function"&&e instanceof Blob}async function Pi(e={},{emit:t,jobs:a,context:n={}}){var b;const o=e.jobId||`webmedia-${Math.random().toString(36).slice(2,9)}`,r=a.get(o)||{canceled:!1};if(a.set(o,r),t({type:"progress",payload:{phase:"start",percent:0,processedBytes:0}}),r.canceled){t({type:"error",payload:{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0}});return}const l=e.plan||{};if(l.operation==="inspect"||l.mode==="Inspect"){const f=JSON.stringify({plan:l,source:l.source||{}},null,2);t({type:"progress",payload:{phase:"report",percent:100,outputBytes:f.length}}),t({type:"result",payload:{blob:new Blob([f],{type:"application/json"}),filename:Me(((b=l.source)==null?void 0:b.fileName)||"media",{output:{extension:"json"}}),mime:"application/json",summary:{mode:"Inspect",bytes:f.length}}}),a.delete(o);return}if(Ii(l)){if(!e.mediaFile){t({type:"error",payload:{code:"WEBMEDIA_SOURCE_MISSING",message:"Original media file is required for browser-native export.",recoverable:!0}}),a.delete(o);return}try{const f=await Gt(e.mediaFile,l,{emit:t,job:r,loadMediabunny:n.loadMediabunny});t({type:"result",payload:f})}catch(f){t({type:"error",payload:qe(r.canceled?{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0}:f)})}finally{a.delete(o)}return}if(l.execution==="webmedia-subtitle-package"){try{const f=await $i(l,{emit:t});t({type:"result",payload:f})}finally{a.delete(o)}return}if(l.execution==="webmedia-hls-package"){if(!e.mediaFile){t({type:"error",payload:{code:"WEBMEDIA_SOURCE_MISSING",message:"Original media file is required for HLS package export.",recoverable:!0}}),a.delete(o);return}try{const f=await Bi(e.mediaFile,l,{emit:t,job:r,loadMediabunny:n.loadMediabunny});t({type:"result",payload:f})}catch(f){t({type:"error",payload:qe(r.canceled?{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0}:f)})}finally{a.delete(o)}return}t({type:"error",payload:{code:"WEBMEDIA_EXECUTION_PENDING",message:"This browser-native export path is planned but not enabled until fixture verification passes.",recoverable:!0,suggestedRoute:"/video-studio"}}),a.delete(o)}function Ii(e={}){const t=e.operation==="remux"&&e.mode==="Remux"&&e.requiresReencode===!1&&e.remuxOnly===!0;return(e.execution==="mediabunny-conversion"||t)&&["remux","transcode","trim","transform","audio","subtitles"].includes(e.operation)&&(!Array.isArray(e.errors)||e.errors.length===0)}async function $i(e,{emit:t}){var n;t({type:"progress",payload:{phase:"subtitle-package",percent:40}});const a=await ya(e);return t({type:"progress",payload:{phase:"subtitle-package",percent:100,outputBytes:a.size}}),{blob:a,filename:Me(((n=e.source)==null?void 0:n.fileName)||"media",e),mime:"application/zip",summary:{mode:"Package",bytes:a.size}}}async function Bi(e,t,{emit:a,job:n,loadMediabunny:o}){var b;a({type:"progress",payload:{phase:"hls-package",percent:8,processedBytes:0}});const r=Di(t)?e:(await Gt(e,Fi(t),{emit:f=>{if(f.type!=="progress"){a(f);return}a({type:"progress",payload:{...f.payload,phase:"hls-package",percent:Math.max(10,Math.min(88,Number(f.payload.percent||0)))}})},job:n,loadMediabunny:o})).blob;if(n.canceled)throw{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0};const l=await ga(r,t);return a({type:"progress",payload:{phase:"hls-package",percent:100,outputBytes:l.size}}),{blob:l,filename:Me(((b=t.source)==null?void 0:b.fileName)||e.name||"media",t),mime:"application/zip",summary:{mode:"Package",bytes:l.size}}}function Di(e={}){var t,a,n;return((t=e.source)==null?void 0:t.container)==="mpegts"&&!Object.keys(((a=e.conversion)==null?void 0:a.video)||{}).length&&!Object.keys(((n=e.conversion)==null?void 0:n.audio)||{}).length}function Fi(e={}){return{...e,targetContainer:"mpegts",output:{container:"mpegts",label:"MPEG-TS",extension:"ts",mime:"video/mp2t"},execution:"mediabunny-conversion",errors:[]}}async function Gt(e,t,{emit:a,job:n,loadMediabunny:o}){var ee,re,te,de;const l=await(o||_i)(),{ALL_FORMATS:b,BlobSource:f,BufferTarget:y,Conversion:w,Input:O,Output:A}=l;if(!b||typeof f!="function"||typeof y!="function"||typeof(w==null?void 0:w.init)!="function"||typeof O!="function"||typeof A!="function")throw{code:"WEBMEDIA_RUNTIME_UNAVAILABLE",message:"Mediabunny conversion APIs are unavailable.",recoverable:!0};const D=new O({formats:b,source:new f(e)}),v=new y,S=new A({format:Ki(t,l),target:v}),E={input:D,output:S,...zi(t),showWarnings:!1},x=await w.init(E);if(n.cancel=async()=>{var j;return(j=x.cancel)==null?void 0:j.call(x)},!x.isValid)throw{code:"WEBMEDIA_CONVERSION_INVALID",message:Ct(x.discardedTracks)||"Mediabunny rejected this conversion plan.",recoverable:!0,suggestedRoute:"/video-studio"};if(Array.isArray(x.discardedTracks)&&x.discardedTracks.length)throw{code:"WEBMEDIA_CONVERSION_DISCARDED_TRACKS",message:Ct(x.discardedTracks),recoverable:!0,suggestedRoute:"/video-studio"};if(x.onProgress=(j,g)=>{a({type:"progress",payload:{phase:t.operation||"convert",percent:Math.max(1,Math.min(99,Math.round(Number(j||0)*100))),processedTime:Number(g||0)}})},n.canceled)throw{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0};if(await x.execute(),n.canceled)throw{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0};const L=v.buffer||((ee=S.target)==null?void 0:ee.buffer)||new ArrayBuffer(0),$=L instanceof Uint8Array?L:new Uint8Array(L),F=new Blob([$],{type:((re=t.output)==null?void 0:re.mime)||"application/octet-stream"});return a({type:"progress",payload:{phase:t.operation||"convert",percent:100,outputBytes:F.size}}),{blob:F,filename:Me(((te=t.source)==null?void 0:te.fileName)||e.name||"media",t),mime:((de=t.output)==null?void 0:de.mime)||"application/octet-stream",summary:{mode:t.mode||"Export",bytes:F.size}}}function zi(e={}){const t=e.conversion||{},a={};(t.tracks==="all"||t.tracks==="primary")&&(a.tracks=t.tracks);const n=ji(t.video),o=Vi(t.audio),r=qi(t.trim),l=Wi(t.tags);return Object.keys(n).length&&(a.video=n),Object.keys(o).length&&(a.audio=o),Object.keys(r).length&&(a.trim=r),Object.keys(l).length&&(a.tags=l),a}function ji(e={}){const t={};e.discard===!0&&(t.discard=!0),["avc","hevc","vp8","vp9","av1"].includes(e.codec)&&(t.codec=e.codec),Z(e.width)&&(t.width=Z(e.width)),Z(e.height)&&(t.height=Z(e.height)),["fill","contain","cover"].includes(e.fit)&&(t.fit=e.fit),[0,90,180,270].includes(Number(e.rotate))&&Number(e.rotate)!==0&&(t.rotate=Number(e.rotate)),e.allowRotationMetadata===!1&&(t.allowRotationMetadata=!1);const a=Ui(e.crop);return a&&(t.crop=a),X(e.frameRate)&&(t.frameRate=X(e.frameRate)),X(e.bitrate)&&(t.bitrate=X(e.bitrate)),["discard","keep"].includes(e.alpha)&&(t.alpha=e.alpha),X(e.keyFrameInterval)&&(t.keyFrameInterval=X(e.keyFrameInterval)),["no-preference","prefer-hardware","prefer-software"].includes(e.hardwareAcceleration)&&(t.hardwareAcceleration=e.hardwareAcceleration),e.forceTranscode===!0&&(t.forceTranscode=!0),t}function Vi(e={}){const t={};return e.discard===!0&&(t.discard=!0),["aac","opus","mp3","vorbis","flac","pcm-u8","pcm-s16","pcm-s32","pcm-f32"].includes(e.codec)&&(t.codec=e.codec),Z(e.numberOfChannels)&&(t.numberOfChannels=Z(e.numberOfChannels)),Z(e.sampleRate)&&(t.sampleRate=Z(e.sampleRate)),["u8","s16","s32","f32"].includes(e.sampleFormat)&&(t.sampleFormat=e.sampleFormat),X(e.bitrate)&&(t.bitrate=X(e.bitrate)),e.forceTranscode===!0&&(t.forceTranscode=!0),t}function qi(e={}){const t={};return X(e.start)&&(t.start=X(e.start)),X(e.end)&&(t.end=X(e.end)),t}function Ui(e={}){const t=Math.max(0,Math.round(Number(e.x||0))),a=Math.max(0,Math.round(Number(e.y||0))),n=Z(e.width),o=Z(e.height);return n>0&&o>0?{x:t,y:a,width:n,height:o}:null}function Wi(e={}){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([,t])=>["string","number","boolean"].includes(typeof t)).map(([t,a])=>[t,String(a)]))}function Z(e){const t=Math.round(Number(e||0));return Number.isFinite(t)&&t>0?t:0}function X(e){const t=Number(e||0);return Number.isFinite(t)&&t>0?t:0}async function _i(){return import(Ht)}function Ki(e,t={}){var o;const n=t[{adts:"AdtsOutputFormat",flac:"FlacOutputFormat",matroska:"MkvOutputFormat",mov:"MovOutputFormat",mp3:"Mp3OutputFormat",mp4:"Mp4OutputFormat",mpegts:"MpegTsOutputFormat",ogg:"OggOutputFormat",wav:"WavOutputFormat",webm:"WebMOutputFormat"}[e.targetContainer]];if(typeof n!="function")throw{code:"WEBMEDIA_OUTPUT_UNSUPPORTED",message:`${((o=e.output)==null?void 0:o.label)||e.targetContainer||"Selected output"} is not available in this Mediabunny runtime.`,recoverable:!0};return new n}function Ct(e=[]){return Array.from(e||[]).map(t=>{var a;return t.reason||t.message||((a=t.track)==null?void 0:a.id)||""}).filter(Boolean).join("; ")}function Hi(e=globalThis){return typeof WorkerGlobalScope<"u"&&e instanceof WorkerGlobalScope&&typeof e.postMessage=="function"&&typeof e.document>"u"}typeof self<"u"&&Hi(self)&&(self.postMessage({type:"ready"}),self.postMessage({type:"capabilities",payload:{worker:{VideoDecoder:typeof self.VideoDecoder=="function",VideoEncoder:typeof self.VideoEncoder=="function",AudioDecoder:typeof self.AudioDecoder=="function",AudioEncoder:typeof self.AudioEncoder=="function",EncodedVideoChunk:typeof self.EncodedVideoChunk=="function",EncodedAudioChunk:typeof self.EncodedAudioChunk=="function"}}}),self.onmessage=async e=>{var a;const t=((a=e.data)==null?void 0:a.requestId)||"";await Jt(e.data,{jobs:Xt,emit:n=>{self.postMessage({requestId:t,...n})}})});function Xi(){return new Worker(new URL("/assets/webmedia.worker-mLPTm6St.js",import.meta.url),{type:"module"})}function Ji(e=globalThis){return{VideoDecoder:typeof e.VideoDecoder=="function",VideoEncoder:typeof e.VideoEncoder=="function",AudioDecoder:typeof e.AudioDecoder=="function",AudioEncoder:typeof e.AudioEncoder=="function",EncodedVideoChunk:typeof e.EncodedVideoChunk=="function",EncodedAudioChunk:typeof e.EncodedAudioChunk=="function"}}function Gi(e={}){const t=e.createWorker||Xi,a=!!e.forceLocal,n=new Map;let o=null,r=!1,l=0,b=0;const f={main:Ji(globalThis),worker:{}},y=typeof e.createWorker=="function",w=new Map,O=()=>{const v=he(f);for(const{resolve:S,timer:E}of w.values())clearTimeout(E),S(v);w.clear()},A=()=>a||!y&&typeof Worker!="function"?null:o||(o=t(),o.onmessage=v=>{var x,L,$;const S=v.data||{};if(S.type==="capabilities"){f.worker=((x=S.payload)==null?void 0:x.worker)||{},O();return}const E=n.get(S.requestId);if(E){if(S.type==="result"){n.delete(S.requestId),E.resolve(S.payload);return}if(S.type==="error"){n.delete(S.requestId),E.reject(Yt(S.payload)),(L=E.onEvent)==null||L.call(E,S);return}($=E.onEvent)==null||$.call(E,S)}},o.onerror=v=>{const S=typeof ErrorEvent=="function"&&v instanceof ErrorEvent&&v.error?v.error:new Error(v.message||"Web media worker failed.");for(const[E,x]of n.entries())x.reject(S),n.delete(E);O()},o),D=async(v,S={},E={})=>{var ee,re,te,de;if(r)throw new Error("Web media service has been disposed.");const x=A();if(!x)return Yi(v,S,E.onEvent);const L=`webmedia-${++l}`,$=new Promise((j,g)=>{n.set(L,{resolve:j,reject:g,onEvent:E.onEvent})}),F=()=>{x.postMessage({requestId:`${L}:cancel`,type:"cancel",payload:{jobId:S.jobId}})};(re=(ee=E.signal)==null?void 0:ee.addEventListener)==null||re.call(ee,"abort",F,{once:!0}),x.postMessage({requestId:L,type:v,payload:S});try{return await $}finally{(de=(te=E.signal)==null?void 0:te.removeEventListener)==null||de.call(te,"abort",F)}};return{getCapabilities(){return he(f)},probeCapabilities(v={}){const S=A(),E=he(f);if(!S||E.workerKnown)return Promise.resolve(E);const x=Math.max(0,Number(v.timeoutMs??700));return new Promise(L=>{const $=`capability-${++b}`,F=setTimeout(()=>{w.delete($),L(he(f))},x);w.set($,{resolve:L,timer:F})})},inspectFile(v,S={}){const E={file:Qi(v),capabilities:f};return Rt(v)&&(E.mediaFile=v),D("inspect",E,S)},plan(v,S={}){return D("plan",v,S)},run(v,S={}){const x={jobId:S.jobId||`webmedia-${Math.random().toString(36).slice(2,9)}`,plan:v},L=S.mediaFile||S.file||S.sourceFile;return Rt(L)&&(x.mediaFile=L),D("run",x,S)},cancel(v,S={}){return D("cancel",{jobId:v},S)},dispose(){var v;r=!0,n.clear();for(const{resolve:S,timer:E}of w.values())clearTimeout(E),S(he(f));w.clear(),(v=o==null?void 0:o.terminate)==null||v.call(o),o=null}}}async function Yi(e,t,a){const n=[];await Jt({type:e,payload:t},{emit:l=>{n.push(l),a==null||a(l)}});const o=n.find(l=>l.type==="error");if(o)throw Yt(o.payload);const r=n.findLast(l=>l.type==="result");return(r==null?void 0:r.payload)||{}}function Qi(e={}){return{name:e.name||e.fileName||"media",type:e.type||e.mime||"",size:Number(e.size||0),lastModified:e.lastModified||null,duration:e.duration||0,tracks:Array.isArray(e.tracks)?e.tracks:[]}}function Rt(e){return typeof Blob=="function"&&e instanceof Blob}function Yt(e={}){const t=qe(e),a=new Error(t.message);return a.code=t.code,a.recoverable=t.recoverable,a.suggestedRoute=t.suggestedRoute,a}let d=null,_=null,q=null,Se=[],R=null,k=null,ae="inspect",B=null,J=null,be="",ie="",Pe=null,Ie="",pe="",c=null,Ee=0,fe=0,$e="",Y=null,V=[],ke="auto";const Lt={draft:{rateControl:"bitrate",quality:32,videoBitrateKbps:1200,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:96,frameRate:24,keyFrameInterval:4,hardwareAcceleration:"prefer-hardware",latencyMode:"realtime"},preview:{rateControl:"bitrate",quality:28,videoBitrateKbps:2200,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:128,frameRate:30,keyFrameInterval:3,hardwareAcceleration:"prefer-hardware",latencyMode:"realtime"},fast:{rateControl:"bitrate",quality:25,videoBitrateKbps:3500,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:160,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-hardware",latencyMode:"auto"},medium:{rateControl:"bitrate",quality:23,videoBitrateKbps:4500,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:160,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"no-preference",latencyMode:"auto"},quality:{rateControl:"quality",quality:21,videoBitrateKbps:6500,maxVideoBitrateKbps:9e3,bufferSizeKbps:18e3,audioBitrateKbps:192,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"no-preference",latencyMode:"quality"},slow:{rateControl:"quality",quality:20,videoBitrateKbps:8e3,maxVideoBitrateKbps:12e3,bufferSizeKbps:24e3,audioBitrateKbps:192,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-software",latencyMode:"quality"},veryslow:{rateControl:"quality",quality:18,videoBitrateKbps:12e3,maxVideoBitrateKbps:18e3,bufferSizeKbps:36e3,audioBitrateKbps:256,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-software",latencyMode:"quality"}};function M(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Oe(e=0){const t=Number(e||0);return t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:t<1024*1024*1024?`${(t/1024/1024).toFixed(1)} MB`:`${(t/1024/1024/1024).toFixed(2)} GB`}function ue(e=0){const t=Math.max(0,Math.round(Number(e||0))),a=Math.floor(t/3600),n=Math.floor(t%3600/60),o=t%60;return a?`${a}:${String(n).padStart(2,"0")}:${String(o).padStart(2,"0")}`:`${n}:${String(o).padStart(2,"0")}`}function Ot(e={}){return[e.codec,e.width?`${e.width}x${e.height}`:"",e.frameRate?`${Number(e.frameRate).toFixed(2)} fps`:"",e.rotation?`${e.rotation} deg`:"",e.sampleRate?`${e.sampleRate} Hz`:"",e.channels?`${e.channels} ch`:"",e.language].filter(Boolean).join(" - ")}function Zi(e){const t=Number((e==null?void 0:e.value)||0);return Number.isFinite(t)?t:0}function Nt(e){if(!e||typeof URL>"u"||typeof URL.createObjectURL!="function")return"";try{return URL.createObjectURL(e)}catch{return""}}function Je(){if(!be||typeof URL>"u"||typeof URL.revokeObjectURL!="function"){be="";return}URL.revokeObjectURL(be),be=""}function Qt(){if(!ie||typeof URL>"u"||typeof URL.revokeObjectURL!="function"){ie="";return}URL.revokeObjectURL(ie),ie=""}function T(e,t,a){const n=e.querySelector(`#${t}`);n&&(n.value=String(a))}function me(e,t,a){const n=e.querySelector(`#${t}`);n&&(n.checked=!!a)}function Ne(e,t,a){const n=Number(e);return Number.isFinite(n)?Math.max(t,Math.min(a,n)):t}function I(e,t,a=!1){return fa({id:e,label:t,checked:a,className:"webmedia-toggle"})}function Pt(e={}){const t=String(e.name||"").toLowerCase(),a=String(e.type||"").toLowerCase();return t.endsWith(".srt")||t.endsWith(".vtt")||a.includes("text/vtt")||a.includes("subrip")||a.includes("srt")}function eo(e={},t="",a="auto"){if(a==="srt"||a==="vtt")return a;const n=String(e.name||"").toLowerCase();return n.endsWith(".vtt")||/^\s*WEBVTT\b/i.test(String(t||""))?"vtt":n.endsWith(".srt")?"srt":"auto"}function It(e=[]){return Array.from(e||[]).map((t,a)=>{const n=Math.max(0,Number(t==null?void 0:t.start)||0),o=Math.max(n+.1,Number(t==null?void 0:t.end)||n+2);return{id:(t==null?void 0:t.id)||`cue-${Date.now()}-${a+1}`,index:a+1,start:n,end:o,text:String((t==null?void 0:t.text)??"")}})}function Ge(e=""){return String(e||"").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[._-]+/g," ").replace(/\s+/g," ").trim().replace(/^./,t=>t.toUpperCase())}function Zt(e){return e==null||e===""?!0:Array.isArray(e)?e.length===0:typeof e=="object"?Object.keys(e).length===0:!1}function Ye(e,t=""){return Zt(e)?[]:Array.isArray(e)?e.flatMap((a,n)=>Ye(a,`${t}${t?" ":""}${n+1}`)):typeof e=="object"?Object.entries(e).flatMap(([a,n])=>Ye(n,`${t}${t?" ":""}${Ge(a)}`)):[[t||"Value",e]]}async function ro(e){var pt;_=Gi(),d=document.createElement("div"),d.className="tool-webmedia-studio",d.innerHTML=`
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
              ${Object.entries(se).map(([i,s])=>`<option value="${i}">${s.label}</option>`).join("")}
            </select>
          </label>
          <label class="studio-field">
            <span>Tracks</span>
            <select id="webmedia-track-scope" class="studio-select">
              <option value="all">All tracks</option>
              <option value="primary">Primary audio and video</option>
            </select>
          </label>
          ${I("webmedia-remux-only","Remux only",!0)}
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
              ${I("webmedia-inspect-tags","Include tags",!0)}
              ${I("webmedia-inspect-packets","Packet stats")}
              ${I("webmedia-inspect-compatibility","Compatibility",!0)}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="remux">
            <div class="webmedia-panel-title">Remux</div>
            <div class="webmedia-adjustment-section">
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
              ${I("webmedia-remux-faststart","Fast start MP4",!0)}
            </div>
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
                ${I("webmedia-transcode-prevent-upscale","No upscale")}
                ${I("webmedia-transcode-drop-video","Drop video")}
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
              ${I("webmedia-transcode-drop-audio","Drop audio")}
            </div>
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
              ${I("webmedia-trim-preserve-timestamps","Preserve timestamps")}
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
                ${I("webmedia-transform-rotation-metadata","Rotation metadata",!0)}
                ${I("webmedia-transform-flip-horizontal","Flip horizontal")}
                ${I("webmedia-transform-flip-vertical","Flip vertical")}
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
              ${I("webmedia-audio-discard-video","Export audio only",!0)}
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
                ${I("webmedia-audio-normalize","Normalize")}
                ${I("webmedia-audio-limiter","Limiter")}
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
                ${I("webmedia-subtitle-import","Import text")}
                ${I("webmedia-subtitle-burn","Burn in")}
                ${I("webmedia-subtitle-background","Text background")}
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
                ${I("webmedia-hls-independent","Independent segments",!0)}
                ${I("webmedia-hls-iframe","I-frame playlist")}
                ${I("webmedia-hls-audio-renditions","Audio renditions")}
                ${I("webmedia-hls-caption-rendition","Caption rendition")}
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
        <div id="webmedia-plan-summary" class="webmedia-plan-summary"></div>
        <div id="webmedia-progress-host" class="webmedia-progress-host"></div>
        <div id="webmedia-output-preview" class="webmedia-output-preview hidden">
          <div class="webmedia-section-head">
            <strong>Output</strong>
            <button type="button" id="webmedia-output-download" class="mini-btn">Download</button>
          </div>
          <video id="webmedia-output-video" class="webmedia-output-media hidden" controls playsinline></video>
          <audio id="webmedia-output-audio" class="webmedia-output-media hidden" controls></audio>
          <div id="webmedia-output-meta" class="webmedia-output-meta"></div>
        </div>
        <div class="webmedia-export-actions">
          <button id="webmedia-export" class="btn-primary">Export Inspect JSON</button>
        </div>
      </aside>

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
  `,e.appendChild(d);const t={shell:d.querySelector(".webmedia-shell"),fileInput:d.querySelector("#webmedia-file-input"),subtitleFileInput:d.querySelector("#webmedia-subtitle-file-input"),importButton:d.querySelector("#webmedia-import"),dropzone:d.querySelector("#webmedia-dropzone"),fileQueue:d.querySelector("#webmedia-file-queue"),capabilities:d.querySelector("#webmedia-capabilities"),previewCopy:d.querySelector("#webmedia-preview-copy"),previewMedia:d.querySelector("#webmedia-preview-media"),trackStack:d.querySelector("#webmedia-track-stack"),inspectReport:d.querySelector("#webmedia-inspect-report"),metrics:d.querySelector("#webmedia-source-metrics"),targetContainer:d.querySelector("#webmedia-target-container"),trackScope:d.querySelector("#webmedia-track-scope"),videoCodec:d.querySelector("#webmedia-video-codec"),audioCodec:d.querySelector("#webmedia-audio-codec"),remuxOnly:d.querySelector("#webmedia-remux-only"),planSummary:d.querySelector("#webmedia-plan-summary"),mode:d.querySelector("#webmedia-mode"),status:d.querySelector("#webmedia-status"),diagnostics:d.querySelector("#webmedia-diagnostics"),exportButton:d.querySelector("#webmedia-export"),scrub:d.querySelector("#webmedia-scrub"),currentTime:d.querySelector("#webmedia-current-time"),duration:d.querySelector("#webmedia-duration"),trimmerHost:d.querySelector("#webmedia-trimmer-host"),diagnosticModal:d.querySelector("#webmedia-diagnostic-modal"),diagnosticModalTitle:d.querySelector("#webmedia-diagnostic-modal-title"),diagnosticModalBody:d.querySelector("#webmedia-diagnostic-modal-body"),diagnosticModalClose:d.querySelector("#webmedia-diagnostic-modal-close"),outputPreview:d.querySelector("#webmedia-output-preview"),outputDownload:d.querySelector("#webmedia-output-download"),outputVideo:d.querySelector("#webmedia-output-video"),outputAudio:d.querySelector("#webmedia-output-audio"),outputMeta:d.querySelector("#webmedia-output-meta"),subtitleUpload:d.querySelector("#webmedia-subtitle-upload"),subtitleInfo:d.querySelector("#webmedia-subtitle-info"),subtitleEditorList:d.querySelector("#webmedia-subtitle-editor-list"),subtitleAdd:d.querySelector("#webmedia-subtitle-add"),subtitleShift:d.querySelector("#webmedia-subtitle-shift"),subtitleClear:d.querySelector("#webmedia-subtitle-clear")},a=(i,s="neutral")=>{t.status.textContent=i,t.status.dataset.tone=s};q=ba(d.querySelector("#webmedia-progress-host"),{stopLabel:"Cancel",onStop(){if(!J){wt("No active export.","info");return}if(!J.controller){a("Cancel unavailable in this browser.","danger");return}J.controller.abort(),q==null||q.update({title:"Canceling export",detail:J.mode,busy:!0,cancellable:!1}),a("Cancel requested.","info"),wt("Cancel requested.","info")}});let n=[],o=!1;const r=()=>{t.shell.classList.toggle("is-empty",!R)},l=i=>{const s=Ye(i);return s.length?`<dl class="webmedia-diagnostic-kv">${s.map(([u,m])=>`
      <div><dt>${M(Ge(u))}</dt><dd>${M(m)}</dd></div>
    `).join("")}</dl>`:""},b=(i={})=>{const s=l(i.value??i.detailValue),u=i.message||i.detail||"",m=i.suggestedRoute?`<a class="webmedia-diagnostic-route" href="${M(i.suggestedRoute)}">Open Video Studio</a>`:"";return`
      ${u?`<p>${M(u)}</p>`:""}
      ${s}
      ${m}
    `},f=i=>{const s=n[Number(i)];s&&(t.diagnosticModalTitle.textContent=s.code||s.phase||"Diagnostic",t.diagnosticModalBody.innerHTML=b(s),t.diagnosticModal.classList.remove("hidden"))},y=()=>{t.diagnosticModal.classList.add("hidden")},w=(i={})=>i.message||i.detail||"",O=(i={})=>[i.tone||"neutral",i.code||i.phase||"info",w(i),i.suggestedRoute||""].join("|"),A=(i=[])=>{n=(Array.isArray(i)?i:[]).filter(C=>C?!!(l(C.value??C.detailValue)||w(C)||C.suggestedRoute):!1);const u=n.findIndex(C=>["danger"].includes(C.tone));if(t.shell.classList.toggle("has-urgent-diagnostics",u>=0),!n.length){t.diagnostics.innerHTML="",$e="";return}if(t.diagnostics.innerHTML=n.map((C,K)=>{const Ae=l(C.value??C.detailValue),ye=w(C),ze=Ae||ye||C.suggestedRoute;return`
        <div class="webmedia-diagnostic" data-tone="${C.tone||"neutral"}">
          <div>
            <b>${M(C.code||C.phase||"info")}</b>
            ${ye?`<span>${M(ye)}</span>`:""}
            ${Ae}
          </div>
          ${ze?`<button type="button" class="mini-btn webmedia-diagnostic-detail" data-webmedia-diagnostic-index="${K}">Details</button>`:""}
        </div>
      `}).join(""),u<0){$e="";return}const m=n[u],h=O(m);h!==$e&&($e=h,f(u))},D=()=>{const i=_.getCapabilities(),s=[{id:"main-decode",label:"Main decode",state:i.main.VideoDecoder&&i.main.AudioDecoder?"ready":"unavailable"},{id:"main-encode",label:"Main encode",state:i.main.VideoEncoder&&i.main.AudioEncoder?"ready":"unavailable"},{id:"worker",label:"Worker WebCodecs",state:i.workerKnown?i.missingWorker.length===0?"ready":"unavailable":"checking"}];t.capabilities.innerHTML=s.map(u=>`
      <div class="webmedia-capability-row" data-webmedia-capability="${u.id}" data-state="${u.state}" data-ready="${u.state==="ready"?"true":"false"}">
        <span>${u.label}</span>
        <b>${u.state==="ready"?"Ready":u.state==="checking"?"Checking":"Unavailable"}</b>
      </div>
    `).join("")},v=()=>{t.fileQueue.innerHTML=Se.length?Se.map((i,s)=>`
        <button class="webmedia-file-card ${i===R?"active":""}" data-file-index="${s}">
          <strong>${M(i.name||"media")}</strong>
          <span>${M(i.type||"unknown")} - ${Oe(i.size)}</span>
        </button>
      `).join(""):'<div class="webmedia-empty">No media loaded.</div>'},S=()=>{Qt(),Pe=null,Ie="",pe="",t.outputPreview.classList.add("hidden"),t.outputVideo.classList.add("hidden"),t.outputAudio.classList.add("hidden"),t.outputVideo.removeAttribute("src"),t.outputAudio.removeAttribute("src"),t.outputMeta.innerHTML="",t.outputDownload.disabled=!0},E=(i={})=>{var m;if(S(),!i.blob)return;Pe=i.blob,Ie=i.filename||"webmedia-output",pe=i.mime||i.blob.type||"",ie=Nt(i.blob);const s=pe.startsWith("audio/"),u=pe.startsWith("video/");ie&&s&&(t.outputAudio.setAttribute("src",ie),t.outputAudio.classList.remove("hidden")),ie&&u&&(t.outputVideo.setAttribute("src",ie),t.outputVideo.classList.remove("hidden")),t.outputMeta.innerHTML=`
      <div><span>Name</span><strong>${M(Ie)}</strong></div>
      <div><span>Type</span><strong>${M(pe||"application/octet-stream")}</strong></div>
      <div><span>Size</span><strong>${Oe(((m=i.summary)==null?void 0:m.bytes)??i.blob.size)}</strong></div>
    `,t.outputDownload.disabled=!1,t.outputPreview.classList.remove("hidden")},x=()=>{if(!k){t.metrics.innerHTML="";return}const i=k.tracks.filter(m=>m.kind==="video").length,s=k.tracks.filter(m=>m.kind==="audio").length,u=k.tracks.filter(m=>m.kind==="subtitle").length;t.metrics.innerHTML=[["Container",k.container||"unknown"],["Duration",ue(k.duration)],["Size",Oe(k.size)],["Tracks",`${i} V / ${s} A / ${u} S`]].map(([m,h])=>`<div><span>${m}</span><strong>${M(h)}</strong></div>`).join("")},L=i=>`
    <div class="webmedia-inspect-report-rows">
      ${i.filter(([,s])=>!Zt(s)).map(([s,u])=>`
          <div class="webmedia-inspect-report-row">
            <span>${M(s)}</span>
            <strong>${M(u)}</strong>
          </div>
        `).join("")}
    </div>
  `,$=(i,s,u="")=>`
    <section class="webmedia-inspect-report-card">
      <div class="webmedia-inspect-report-title">${M(i)}</div>
      ${s!=null&&s.length?L(s):""}
      ${u}
    </section>
  `,F=(i=[])=>{const s=i.reduce((m,h)=>(m[h.kind]=(m[h.kind]||0)+1,m),{}),u=[s.video?`${s.video} video`:"",s.audio?`${s.audio} audio`:"",s.subtitle?`${s.subtitle} subtitle`:""].filter(Boolean);return u.length?`${i.length} tracks (${u.join(", ")})`:"0 tracks"},ee=()=>{const i=k.metadata||{},s=Object.entries(i.tags||{}),u=s.length?`<div class="webmedia-inspect-tag-list">${s.map(([m,h])=>`
          <div><span>${M(Ge(m))}</span><strong>${M(h)}</strong></div>
        `).join("")}</div>`:'<div class="webmedia-empty">No metadata tags were reported.</div>';return $("Metadata",[["Provider",i.provider||"summary"],["Depth",i.depth||"summary"],["Modified",k.modifiedAt?new Date(k.modifiedAt).toLocaleString():"Unknown"]],u)},re=()=>{const i=k.tracks.filter(s=>s.kind==="video"&&s.frameRate).map(s=>`${s.id}: ${Number(s.frameRate).toFixed(2)} fps`);return $("Packets",[["Depth",g("webmedia-inspect-depth")],["Packet stats",N("webmedia-inspect-packets")?"On":"Off"],["Sample limit",`${p("webmedia-inspect-packet-limit")} samples`],["Video packet rate",i.join(", ")||"Unknown"],["Compatibility check",N("webmedia-inspect-compatibility")?"On":"Off"]])},te=()=>{const i=t.targetContainer.value,s=se[i]||se.mp4,u=k.tracks.length?k.tracks.map(m=>{const h=Ve(i,m);return`
          <div class="webmedia-compat-row" data-state="${h?"ready":"blocked"}">
            <span>${M(m.kind)}:${M(m.codec||"unknown")}</span>
            <strong>${h?"Compatible":"Blocked"}</strong>
            <b>${M(Ot(m)||m.id)}</b>
          </div>
        `}).join(""):'<div class="webmedia-empty">Track compatibility appears after media inspection.</div>';return $("Compatibility",[["Target",s.label],["Container",i],["Track policy",g("webmedia-track-scope")]],`<div class="webmedia-compat-list">${u}</div>`)},de=()=>$("Summary",[["File",k.fileName],["Container",k.container||"unknown"],["Mime",k.mime||"unknown"],["Duration",ue(k.duration)],["Size",Oe(k.size)],["Tracks",F(k.tracks)]]),j=()=>{if(!t.inspectReport)return;if(!k){t.inspectReport.innerHTML=$("Inspect",[["Status","Import media to populate the report"]]);return}const i=g("webmedia-inspect-depth")||"metadata";i==="summary"?t.inspectReport.innerHTML=de():i==="packets"?t.inspectReport.innerHTML=re():i==="compatibility"?t.inspectReport.innerHTML=te():t.inspectReport.innerHTML=ee()},g=i=>{var s;return((s=d.querySelector(`#${i}`))==null?void 0:s.value)||""},N=i=>{var s;return((s=d.querySelector(`#${i}`))==null?void 0:s.checked)===!0},p=i=>Zi(d.querySelector(`#${i}`)),ea=()=>Object.fromEntries(Object.entries({title:g("webmedia-meta-title"),artist:g("webmedia-meta-artist"),album:g("webmedia-meta-album"),genre:g("webmedia-meta-genre"),date:g("webmedia-meta-date"),copyright:g("webmedia-meta-copyright"),comment:g("webmedia-meta-comment"),description:g("webmedia-meta-description")}).filter(([,i])=>i)),ta=()=>({inspect:{depth:g("webmedia-inspect-depth"),packetSampleLimit:p("webmedia-inspect-packet-limit"),includeTags:N("webmedia-inspect-tags"),includePackets:N("webmedia-inspect-packets"),includeCompatibility:N("webmedia-inspect-compatibility")},tracks:t.trackScope.value,remux:{remuxOnly:t.remuxOnly.checked,trackPolicy:g("webmedia-remux-track-policy"),timestampPolicy:g("webmedia-remux-timestamp-policy"),rotationPolicy:g("webmedia-remux-rotation-policy"),fastStart:N("webmedia-remux-faststart"),interleaveMs:p("webmedia-remux-interleave"),chapterPolicy:g("webmedia-remux-chapters"),attachmentPolicy:g("webmedia-remux-attachments"),metadataPolicy:g("webmedia-remux-metadata-policy")},transcode:{preset:g("webmedia-transcode-preset"),speedPreset:g("webmedia-transcode-speed-preset"),videoCodec:t.videoCodec.value,audioCodec:t.audioCodec.value,rateControl:g("webmedia-transcode-rate-control"),quality:p("webmedia-transcode-quality"),videoBitrateKbps:p("webmedia-transcode-video-bitrate"),maxVideoBitrateKbps:p("webmedia-transcode-max-video-bitrate"),bufferSizeKbps:p("webmedia-transcode-buffer-size"),audioBitrateKbps:p("webmedia-transcode-audio-bitrate"),width:p("webmedia-transcode-width"),height:p("webmedia-transcode-height"),fit:g("webmedia-transcode-fit"),preventUpscale:N("webmedia-transcode-prevent-upscale"),frameRate:p("webmedia-transcode-frame-rate"),keyFrameInterval:p("webmedia-transcode-keyframe"),hardwareAcceleration:g("webmedia-transcode-hardware"),alpha:g("webmedia-transcode-alpha"),latencyMode:g("webmedia-transcode-latency"),tune:g("webmedia-transcode-tune"),bitDepth:p("webmedia-transcode-bit-depth"),colorSpace:g("webmedia-transcode-color-space"),sampleRate:p("webmedia-transcode-sample-rate"),channels:p("webmedia-transcode-channels"),sampleFormat:g("webmedia-transcode-sample-format"),discardVideo:N("webmedia-transcode-drop-video"),discardAudio:N("webmedia-transcode-drop-audio")},trim:{start:p("webmedia-trim-start"),end:p("webmedia-trim-end"),duration:p("webmedia-trim-duration"),mode:g("webmedia-trim-mode"),snapPolicy:g("webmedia-trim-snap-policy"),preroll:p("webmedia-trim-preroll"),postroll:p("webmedia-trim-postroll"),preserveTimestamps:N("webmedia-trim-preserve-timestamps"),fadeIn:p("webmedia-trim-fade-in"),fadeOut:p("webmedia-trim-fade-out")},transform:{width:p("webmedia-transform-width"),height:p("webmedia-transform-height"),fit:g("webmedia-transform-fit"),rotate:p("webmedia-transform-rotate"),allowRotationMetadata:N("webmedia-transform-rotation-metadata"),crop:{x:p("webmedia-transform-crop-x"),y:p("webmedia-transform-crop-y"),width:p("webmedia-transform-crop-width"),height:p("webmedia-transform-crop-height")},frameRate:p("webmedia-transform-frame-rate"),anchor:g("webmedia-transform-anchor"),scale:p("webmedia-transform-scale"),x:p("webmedia-transform-x"),y:p("webmedia-transform-y"),flipHorizontal:N("webmedia-transform-flip-horizontal"),flipVertical:N("webmedia-transform-flip-vertical"),background:g("webmedia-transform-background"),color:{exposure:p("webmedia-transform-exposure"),contrast:p("webmedia-transform-contrast"),saturation:p("webmedia-transform-saturation"),temperature:p("webmedia-transform-temperature"),tint:p("webmedia-transform-tint"),gamma:p("webmedia-transform-gamma")},effects:{sharpen:p("webmedia-transform-sharpen"),denoise:p("webmedia-transform-denoise"),grain:p("webmedia-transform-grain"),blur:p("webmedia-transform-blur")}},audio:{mode:g("webmedia-audio-mode"),audioCodec:g("webmedia-audio-output-codec"),audioBitrateKbps:p("webmedia-audio-bitrate"),sampleRate:p("webmedia-audio-sample-rate"),channels:p("webmedia-audio-channels"),sampleFormat:g("webmedia-audio-sample-format"),discardVideo:N("webmedia-audio-discard-video"),gainDb:p("webmedia-audio-gain"),normalize:N("webmedia-audio-normalize"),normalizeTargetDb:p("webmedia-audio-normalize-target"),limiter:N("webmedia-audio-limiter"),fadeIn:p("webmedia-audio-fade-in"),fadeOut:p("webmedia-audio-fade-out"),pan:p("webmedia-audio-pan"),highpassHz:p("webmedia-audio-highpass"),lowpassHz:p("webmedia-audio-lowpass"),compressorThreshold:p("webmedia-audio-compressor-threshold"),compressorRatio:p("webmedia-audio-compressor-ratio")},subtitles:{mode:g("webmedia-subtitle-mode"),importText:N("webmedia-subtitle-import")||V.length>0,burnIn:N("webmedia-subtitle-burn"),language:g("webmedia-subtitle-language"),sourceFormat:g("webmedia-subtitle-source-format"),fileName:(Y==null?void 0:Y.name)||"",offset:p("webmedia-subtitle-offset"),color:g("webmedia-subtitle-color"),fontFamily:g("webmedia-subtitle-font-family"),fontSize:p("webmedia-subtitle-font-size"),position:g("webmedia-subtitle-position"),outline:p("webmedia-subtitle-outline"),background:N("webmedia-subtitle-background"),cues:V},hls:{segmentDuration:p("webmedia-hls-segment-duration"),playlistType:g("webmedia-hls-playlist-type"),variantLadder:g("webmedia-hls-variant-ladder"),independentSegments:N("webmedia-hls-independent"),iframePlaylist:N("webmedia-hls-iframe"),audioRenditions:N("webmedia-hls-audio-renditions"),captionRendition:N("webmedia-hls-caption-rendition")},metadata:ea()}),le=()=>Math.max(0,Number((k==null?void 0:k.duration)||t.previewMedia.duration||0)),Te=(i,s)=>{const u=le(),m=u||Math.max(Number(i)||0,Number(s)||0,0),h=Ne(i,0,m),C=Number(s)||u||h,K=Ne(C,h,m||h);return T(d,"webmedia-trim-start",h.toFixed(2)),T(d,"webmedia-trim-end",K.toFixed(2)),T(d,"webmedia-trim-duration",Math.max(0,K-h).toFixed(2)),{start:h,end:K}},De=i=>{const s=le(),u=Ne(i,0,s||Math.max(0,Number(i)||0));t.currentTime.textContent=ue(u),t.duration.textContent=ue(s),t.scrub.value=s?String(Ne(u/s*100,0,100)):"0"},Ue=()=>{var s,u;const i=(u=(s=t.previewMedia).play)==null?void 0:u.call(s);i&&typeof i.catch=="function"&&i.catch(()=>{})},Ze=()=>{var i,s;(s=(i=t.previewMedia).pause)==null||s.call(i)},we=(i,s={})=>{const u=le(),m=Ne(i,0,u||Math.max(0,Number(i)||0));try{t.previewMedia.currentTime=m}catch{}De(m),s.syncTrimmer!==!1&&(c==null||c.setPlayhead(m,s.reason||"external")),s.play&&Ue()},et=(i={})=>{if(!c)return;const s=Math.max(.1,le()||.1),u=p("webmedia-trim-start"),m=p("webmedia-trim-end"),h=p("webmedia-trim-duration"),C=i.fromDuration?u+h:m||s,K=Te(u,C);c.setDuration(s),c.setRange(K.start,K.end||s,!1),c.setFades(p("webmedia-trim-fade-in"),p("webmedia-trim-fade-out"),!1)},aa=()=>{Ee+=1,Te(0,0),De(0),c==null||c.setLoading({visible:!1}),c==null||c.setWaveform(null),c==null||c.setSamples(null,0),c==null||c.setFrameStrip([]),c==null||c.setDuration(.1),c==null||c.setZoom(1,!1),c==null||c.setRange(0,.1,!1),c==null||c.clearPlayhead(),c==null||c.setPlaying(!1)},tt=()=>{if(!c)return;const i=Math.max(.1,le()||.1),s=p("webmedia-trim-start"),u=p("webmedia-trim-end")||i,m=Te(s,u);c.setDuration(i),c.setZoom(1,!1),c.setRange(m.start,m.end||i,!1),c.setFades(p("webmedia-trim-fade-in"),p("webmedia-trim-fade-out"),!1),c.setPlayhead(Number(t.previewMedia.currentTime)||m.start,"external"),c.setPlaying(t.previewMedia.paused===!1),De(Number(t.previewMedia.currentTime)||0)},ia=()=>typeof HTMLMediaElement=="function"&&typeof Worker=="function"&&typeof Blob=="function",at=async()=>{var u;if(!c||!R||!ia())return;const i=++Ee;c.setWaveform(null),c.setSamples(null,0),c.setFrameStrip([]),c.setLoading({visible:!0,title:"Preparing waveform",detail:"Analyzing local media...",progress:8});try{const m=await pa({file:R,fileName:R.name||"media",cacheKey:`${R.name||"media"}:${R.size}:${R.lastModified||0}`,maxBins:32768,includeSamples:!0,maxSampleFrames:2e6,onEvent(h){!c||i!==Ee||h.type==="waveform-status"&&c.setLoading({visible:h.payload.phase!=="complete",title:"Preparing waveform",detail:h.payload.message,progress:h.payload.phase==="complete"?100:72})}});if(i!==Ee||!c)return;if((u=m==null?void 0:m.levels)!=null&&u.length){c.setWaveform(m),c.setSamples(m.samples,m.samplesSampleRate||m.sampleRate),c.setLoading({visible:!1});return}}catch{}const s=await wa({file:R,count:12,width:104,height:58});i!==Ee||!c||(c.setFrameStrip(s),c.setLoading({visible:!1}))},it=()=>{const i=g("webmedia-transcode-preset");i==="web-mp4"&&(t.targetContainer.value="mp4",t.videoCodec.value="avc",t.audioCodec.value="aac",T(d,"webmedia-transcode-rate-control","bitrate"),T(d,"webmedia-transcode-video-bitrate",4500),T(d,"webmedia-transcode-audio-bitrate",160),T(d,"webmedia-transcode-width",1920),T(d,"webmedia-transcode-height",1080),T(d,"webmedia-transcode-fit","contain"),me(d,"webmedia-transcode-drop-video",!1),me(d,"webmedia-transcode-drop-audio",!1)),i==="webm"&&(t.targetContainer.value="webm",t.videoCodec.value="vp9",t.audioCodec.value="opus",T(d,"webmedia-transcode-video-bitrate",3200),T(d,"webmedia-transcode-audio-bitrate",128)),i==="social"&&(t.targetContainer.value="mp4",t.videoCodec.value="avc",t.audioCodec.value="aac",T(d,"webmedia-transcode-video-bitrate",6e3),T(d,"webmedia-transcode-audio-bitrate",192),T(d,"webmedia-transcode-width",1080),T(d,"webmedia-transcode-height",1080),T(d,"webmedia-transcode-fit","cover")),i==="audio-only"&&(t.targetContainer.value="mp3",me(d,"webmedia-transcode-drop-video",!0),me(d,"webmedia-transcode-drop-audio",!1),t.audioCodec.value="mp3"),i==="lossless-audio"&&(t.targetContainer.value="flac",me(d,"webmedia-transcode-drop-video",!0),t.audioCodec.value="flac",T(d,"webmedia-transcode-rate-control","lossless")),i==="hls-package"&&(t.targetContainer.value="hls",t.videoCodec.value="avc",t.audioCodec.value="aac")},oa=()=>{const i=Lt[g("webmedia-transcode-speed-preset")]||Lt.medium;T(d,"webmedia-transcode-rate-control",i.rateControl),T(d,"webmedia-transcode-quality",i.quality),T(d,"webmedia-transcode-video-bitrate",i.videoBitrateKbps),T(d,"webmedia-transcode-max-video-bitrate",i.maxVideoBitrateKbps),T(d,"webmedia-transcode-buffer-size",i.bufferSizeKbps),T(d,"webmedia-transcode-audio-bitrate",i.audioBitrateKbps),T(d,"webmedia-transcode-frame-rate",i.frameRate),T(d,"webmedia-transcode-keyframe",i.keyFrameInterval),T(d,"webmedia-transcode-hardware",i.hardwareAcceleration),T(d,"webmedia-transcode-latency",i.latencyMode),me(d,"webmedia-transcode-prevent-upscale",!0)},ot=()=>{d.querySelectorAll("[data-webmedia-settings]").forEach(i=>{i.classList.toggle("active",i.dataset.webmediaSettings===ae)})},na=i=>{var h,C,K,Ae,ye,ze,bt;if(!i)return[];const s=_.getCapabilities(),u=Object.entries(((h=i.conversion)==null?void 0:h.adjustments)||{}).flatMap(([Ce,ca])=>Object.keys(ca||{}).map(ua=>`${Ce}.${ua}`)),m=[{code:"Source",message:`${i.source.container} / ${ue(i.source.duration)} / ${i.source.tracks.length} tracks`},{code:"Output",message:`${Me(i.source.fileName,i)} / ${i.output.mime}`},{code:"Execution",message:`${i.execution} / ${i.requiresReencode?"reencode":"packet copy"} / tracks ${((C=i.conversion)==null?void 0:C.tracks)||"all"}`},{code:"Worker",message:s.workerKnown?s.missingWorker.length?`Missing ${s.missingWorker.join(", ")}`:"WebCodecs ready":"Checking WebCodecs"},{code:"Video",value:((K=i.conversion)==null?void 0:K.video)||{}},{code:"Audio",value:((Ae=i.conversion)==null?void 0:Ae.audio)||{}},{code:"Trim",value:((ye=i.conversion)==null?void 0:ye.trim)||{}},{code:"Mux",value:((ze=i.conversion)==null?void 0:ze.mux)||{}},{code:"Profile",value:((bt=i.conversion)==null?void 0:bt.profile)||{}},{code:"Adjustments",message:u.length?u.join(", "):"None"}];return[...i.errors.map(Ce=>({...Ce,tone:"danger"})),...i.warnings.map(Ce=>({...Ce,tone:"warning"})),...m]},Fe=()=>{if(r(),!k){Je(),t.previewCopy.innerHTML=R?`<strong>${M(R.name||"media")}</strong><span>Inspecting local tracks.</span>`:"<strong>No file selected</strong><span>Import a media file to inspect its local track plan.</span>",t.previewCopy.classList.remove("hidden"),t.previewMedia.removeAttribute("src"),t.previewMedia.classList.remove("is-visible"),t.trackStack.innerHTML="",t.metrics.innerHTML="",aa(),j(),A([]);return}Je(),be=Nt(R),be?(t.previewMedia.setAttribute("src",be),t.previewMedia.classList.add("is-visible"),t.previewCopy.classList.add("hidden")):(t.previewMedia.removeAttribute("src"),t.previewMedia.classList.remove("is-visible"),t.previewCopy.classList.remove("hidden")),t.previewCopy.innerHTML=`
      <strong>${M(k.fileName)}</strong>
      <span>${M(k.container)} - ${Oe(k.size)} - ${ue(k.duration)}</span>
    `,t.duration.textContent=ue(k.duration),Te(0,k.duration),tt(),at(),t.trackStack.innerHTML=k.tracks.length?k.tracks.map(i=>`
        <div class="webmedia-track" data-kind="${M(i.kind)}">
          <div>
            <strong>${M(i.kind)}</strong>
            <span>${M(Ot(i))}</span>
          </div>
          <b>${i.decodable?"Decodable":"Unknown"}</b>
        </div>
      `).join(""):'<div class="webmedia-empty">Track-level metadata appears after deeper browser inspection.</div>',x(),j(),A(k.warnings||[])},ve=async()=>{var h;if(!k&&!R)return a("Import a file first.","danger"),null;const i=k||{fileName:R.name,mime:R.type,size:R.size,tracks:[]},s=ta(),u={operation:ae,source:i,targetContainer:t.targetContainer.value,remuxOnly:s.remux.remuxOnly,settings:s};return B=(await _.plan(u)).plan||Vt(u),t.mode.textContent=B.mode,t.exportButton.textContent=B.operation==="inspect"?"Export Inspect JSON":`Export ${B.mode} .${B.output.extension}`,t.planSummary.innerHTML=`
      <div class="webmedia-plan-mode" data-mode="${M(B.mode)}">${M(B.mode)}</div>
      <div>Output: ${M(Me(B.source.fileName,B))}</div>
      <div>Container: ${M(B.output.label)}</div>
      <div>Reencode: ${B.requiresReencode?"Required":"No"}</div>
      <div>Execution: ${M(B.execution)}</div>
      <div>Adjustments: ${M(Object.keys(((h=B.conversion)==null?void 0:h.adjustments)||{}).filter(C=>Object.keys(B.conversion.adjustments[C]||{}).length).join(", ")||"None")}</div>
    `,A(na(B)),j(),a(B.errors.length?"Plan blocked.":"Plan ready.",B.errors.length?"danger":"success"),B},G=(i=0)=>{!k&&!R||(fe&&clearTimeout(fe),fe=setTimeout(()=>{fe=0,ve().catch(s=>{A([{code:s.code||"PLAN_FAILED",message:s.message,tone:"danger"}]),a(s.message,"danger")})},i))},We=i=>{me(d,"webmedia-subtitle-import",i)},sa=()=>{t.subtitleInfo&&(t.subtitleInfo.textContent=(Y==null?void 0:Y.name)||(V.length?"Inline subtitles":"No subtitle file"))},xe=(i,s={})=>{V=It(i),s.importText!==!1&&We(V.length>0||!!Y),nt(),s.plan!==!1&&G(s.delay??0)},nt=()=>{sa(),t.subtitleEditorList&&(t.subtitleEditorList.innerHTML=V.length?V.map((i,s)=>`
        <div class="webmedia-subtitle-editor-row" data-webmedia-subtitle-cue="${M(i.id)}">
          <span>${s+1}</span>
          <input data-webmedia-subtitle-field="start" type="number" min="0" step="0.1" value="${M(i.start)}">
          <input data-webmedia-subtitle-field="end" type="number" min="0.1" step="0.1" value="${M(i.end)}">
          <input data-webmedia-subtitle-field="text" value="${M(i.text)}">
          <button type="button" class="btn-secondary" data-webmedia-subtitle-remove="${M(i.id)}">Remove</button>
        </div>
      `).join(""):'<div class="webmedia-empty">Subtitle cues appear here.</div>',t.subtitleEditorList.querySelectorAll("[data-webmedia-subtitle-field]").forEach(i=>{i.addEventListener("input",()=>{const s=i.closest("[data-webmedia-subtitle-cue]"),u=V.find(h=>h.id===(s==null?void 0:s.dataset.webmediaSubtitleCue));if(!u)return;const m=i.dataset.webmediaSubtitleField;u[m]=m==="text"?i.value:Number(i.value),Number(u.end)<=Number(u.start)&&(u.end=Number(u.start)+.1),V=It(V),We(!0),G(120)})}),t.subtitleEditorList.querySelectorAll("[data-webmedia-subtitle-remove]").forEach(i=>{i.addEventListener("click",()=>{xe(V.filter(s=>s.id!==i.dataset.webmediaSubtitleRemove))})}))},st=async i=>{if(i)try{const s=await i.text();Y=i,ke=eo(i,s,g("webmedia-subtitle-source-format")||"auto"),ke!=="auto"&&T(d,"webmedia-subtitle-source-format",ke),xe(va(s,ke)),a("Subtitle file loaded.","success")}catch(s){A([{code:"WEBMEDIA_SUBTITLE_IMPORT_FAILED",message:s.message||"Subtitle file could not be read.",tone:"danger"}]),a("Subtitle import failed.","danger")}},ra=()=>{const i=Number(t.previewMedia.currentTime||0),s=le(),u=s?Math.min(s,i+2):i+2;xe([...V,{id:`cue-${Date.now()}-${V.length+1}`,start:i,end:Math.max(i+.1,u),text:"Subtitle"}])},da=()=>{const i=p("webmedia-subtitle-shift-amount");xe(V.map(s=>{const u=Math.max(0,Number(s.start||0)+i),m=Math.max(u+.1,Number(s.end||0)+i);return{...s,start:u,end:m}}))},la=()=>{Y=null,ke="auto",t.subtitleFileInput.value="",T(d,"webmedia-subtitle-source-format","auto"),We(!1),xe([],{importText:!1})};c==null||c.destroy(),c=ma({mount:t.trimmerHost,idPrefix:"webmedia",duration:.1,start:0,end:.1,playhead:0,minSpan:.01,showSeekAutoplayToggle:!0,isLooping:o,onChange(i){Te(i.start,i.end),T(d,"webmedia-trim-fade-in",i.fadeIn||0),T(d,"webmedia-trim-fade-out",i.fadeOut||0),G()},onRulerSeek({time:i,isSeekAutoplayEnabled:s}){we(i,{syncTrimmer:!1,play:s})},onPlayheadChange({time:i,reason:s,isSeekAutoplayEnabled:u}){["seek","ruler-click"].includes(s)&&we(i,{syncTrimmer:!1,play:u})},onTogglePlayback({isPlaying:i,time:s}){Number.isFinite(s)&&we(s,{syncTrimmer:!1}),i?Ue():Ze()},onLoopChange({isLooping:i}){o=i}});const rt=async()=>{if(!R)return;a("Inspecting...","info"),q.update({title:"Inspecting media",detail:R.name,busy:!0}),k=(await _.inspectFile(R,{onEvent(s){s.type==="progress"&&q.update({title:"Inspecting media",detail:s.payload.phase,progress:s.payload.percent,busy:s.payload.percent<100})}})).inspection,Fe(),await ve(),q.update({title:"Inspection ready",tone:"success",autoResetMs:1200})},dt=async i=>{Se=Array.from(i||[]),R=Se[0]||null,k=null,B=null,S(),v(),Fe(),R&&await rt()};t.importButton.addEventListener("click",()=>t.fileInput.click()),t.fileInput.addEventListener("change",i=>dt(i.target.files));const lt=i=>{i.preventDefault(),i.stopPropagation(),t.dropzone.classList.add("is-dragging")},ct=i=>{i.preventDefault(),i.stopPropagation(),t.dropzone.classList.remove("is-dragging")},ut=i=>{var h;i.preventDefault(),i.stopPropagation(),t.dropzone.classList.remove("is-dragging");const s=Array.from(((h=i.dataTransfer)==null?void 0:h.files)||[]),u=s.find(Pt),m=s.filter(C=>!Pt(C));m.length&&dt(m),u&&st(u)};t.dropzone.addEventListener("dragover",lt),t.dropzone.addEventListener("dragleave",ct),t.dropzone.addEventListener("drop",ut),d.addEventListener("dragover",lt),d.addEventListener("dragleave",ct),d.addEventListener("drop",ut),t.fileQueue.addEventListener("click",async i=>{const s=i.target.closest("[data-file-index]");s&&(R=Se[Number(s.dataset.fileIndex)]||null,k=null,v(),Fe(),await rt())}),d.querySelectorAll("[data-webmedia-operation]").forEach(i=>{i.addEventListener("click",async()=>{ae=i.dataset.webmediaOperation,d.querySelectorAll("[data-webmedia-operation]").forEach(s=>s.classList.toggle("active",s===i)),ot(),ae==="audio"&&(t.targetContainer.value="mp3"),ae==="hls"&&(t.targetContainer.value="hls"),ae==="subtitles"&&(t.targetContainer.value="mp4"),ae==="transcode"&&it(),t.remuxOnly.checked=ae==="remux",await ve()})}),d.querySelectorAll("[data-webmedia-inspect-depth]").forEach(i=>{i.addEventListener("click",()=>{T(d,"webmedia-inspect-depth",i.dataset.webmediaInspectDepth),d.querySelectorAll("[data-webmedia-inspect-depth]").forEach(s=>{s.classList.toggle("active",s===i)}),j(),G()})}),t.diagnostics.addEventListener("click",i=>{const s=i.target.closest("[data-webmedia-diagnostic-index]");s&&f(s.dataset.webmediaDiagnosticIndex)}),t.diagnosticModalClose.addEventListener("click",y),t.diagnosticModal.addEventListener("click",i=>{i.target===t.diagnosticModal&&y()}),t.outputDownload.addEventListener("click",()=>{Pe&&ft(Pe,Ie,pe)}),t.subtitleUpload.addEventListener("click",()=>t.subtitleFileInput.click()),t.subtitleFileInput.addEventListener("change",i=>{var s;return st((s=i.target.files)==null?void 0:s[0])}),t.subtitleAdd.addEventListener("click",ra),t.subtitleShift.addEventListener("click",da),t.subtitleClear.addEventListener("click",la),t.previewMedia.addEventListener("loadedmetadata",()=>{tt(),at()}),t.previewMedia.addEventListener("timeupdate",()=>{var u,m;const i=Number(t.previewMedia.currentTime)||0,s=(u=c==null?void 0:c.getRange)==null?void 0:u.call(c);if(s&&i>s.end){o?(we(s.start,{reason:"loop"}),Ue()):(Ze(),we(s.start,{reason:"ended"}),(m=c==null?void 0:c.emitEnded)==null||m.call(c));return}De(i),c==null||c.setPlayhead(i,"preview")}),t.previewMedia.addEventListener("play",()=>c==null?void 0:c.setPlaying(!0)),t.previewMedia.addEventListener("pause",()=>c==null?void 0:c.setPlaying(!1)),t.scrub.addEventListener("input",()=>{const i=le();we(i*Number(t.scrub.value||0)/100,{reason:"scrub"})}),[t.targetContainer,t.videoCodec,t.audioCodec,t.trackScope,t.remuxOnly].forEach(i=>{i.addEventListener("change",()=>{j(),G()})});const mt=new Set(["webmedia-trim-start","webmedia-trim-end","webmedia-trim-duration","webmedia-trim-fade-in","webmedia-trim-fade-out"]);mt.forEach(i=>{const s=d.querySelector(`#${i}`);s==null||s.addEventListener("input",()=>{et({fromDuration:i==="webmedia-trim-duration"}),G(120)}),s==null||s.addEventListener("change",()=>{et({fromDuration:i==="webmedia-trim-duration"}),G()})}),d.querySelector("#webmedia-transcode-preset").addEventListener("change",async()=>{it(),await ve()}),d.querySelector("#webmedia-transcode-speed-preset").addEventListener("change",async()=>{oa(),await ve()}),d.querySelectorAll(".webmedia-settings input, .webmedia-settings select").forEach(i=>{i.id!=="webmedia-transcode-preset"&&i.id!=="webmedia-transcode-speed-preset"&&(mt.has(i.id)||(i.addEventListener("input",()=>{j(),G(120)}),i.addEventListener("change",()=>{j(),G()})))}),d.querySelectorAll(".webmedia-common-controls input, .webmedia-common-controls select").forEach(i=>{i.addEventListener("change",()=>{j(),G()})}),t.exportButton.addEventListener("click",async()=>{const i=B||await ve();if(!i||i.errors.length)return;if(J){a("Export already running.","info");return}const s=`webmedia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,u=typeof AbortController=="function"?new AbortController:null;J={jobId:s,controller:u,mode:i.mode};try{q.update({title:"Running web media job",detail:i.mode,busy:!0,cancellable:!0});const m=await _.run(i,{jobId:s,mediaFile:R,signal:u==null?void 0:u.signal,onEvent(h){h.type==="progress"&&q.update({title:"Running web media job",detail:h.payload.phase,progress:h.payload.percent,busy:h.payload.percent<100,cancellable:!0})}});m.blob&&(E(m),ft(m.blob,m.filename,m.mime)),q.update({title:"Export ready",tone:"success",progress:100,autoResetMs:1400}),a("Export ready.","success")}catch(m){const h=m.code==="JOB_CANCELED";q.update({title:h?"Export canceled":"Export blocked",detail:m.message,tone:h?"warning":"danger"}),A([{code:m.code||"EXPORT_BLOCKED",message:m.message,tone:h?"warning":"danger"}]),a(h?"Export canceled.":m.suggestedRoute?"Use Video Studio for this job.":m.message,h?"warning":"danger")}finally{(J==null?void 0:J.jobId)===s&&(J=null)}}),D(),(pt=_.probeCapabilities)==null||pt.call(_).then(()=>{d&&D()}),ot(),v(),Fe(),nt(),A()}function lo(){fe&&clearTimeout(fe),q==null||q.destroy(),c==null||c.destroy(),_==null||_.dispose(),Je(),Qt(),d==null||d.remove(),fe=0,q=null,c=null,Ee+=1,_=null,d=null,Se=[],R=null,k=null,ae="inspect",B=null,J=null,Pe=null,Ie="",pe="",Y=null,V=[],ke="auto",$e=""}export{ro as mount,lo as unmount};
