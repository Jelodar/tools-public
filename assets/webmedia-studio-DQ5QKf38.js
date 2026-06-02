import{c as Dt,a as $t}from"./media-trimmer-DYMYtp5Q.js";import{d as Nt}from"./index-C4lglzE7.js";import{r as Bt}from"./form-controls-B4kWIsdX.js";import{d as et,s as tt}from"./ui-utils-CG6aKAAj.js";import{c as Ft}from"./media-visualization-D8M9LHeC.js";import"./pool-B8YPuBrh.js";const at=new Map([["video/mp4","mp4"],["audio/mp4","mp4"],["video/quicktime","mov"],["video/webm","webm"],["audio/webm","webm"],["video/x-matroska","matroska"],["audio/x-matroska","matroska"],["audio/wav","wav"],["audio/wave","wav"],["audio/mpeg","mp3"],["audio/ogg","ogg"],["video/ogg","ogg"],["audio/flac","flac"],["audio/aac","adts"],["application/vnd.apple.mpegurl","hls"],["application/x-mpegurl","hls"],["video/mp2t","mpegts"]]),jt=new Map([["mp4","mp4"],["m4v","mp4"],["m4a","mp4"],["mov","mov"],["webm","webm"],["mkv","matroska"],["mka","matroska"],["wav","wav"],["wave","wav"],["mp3","mp3"],["ogg","ogg"],["oga","ogg"],["flac","flac"],["aac","adts"],["adts","adts"],["ts","mpegts"],["m2ts","mpegts"],["m3u8","hls"]]),te={mp4:{label:"MP4",extension:"mp4",mime:"video/mp4",video:["h264","hevc","av1"],audio:["aac","mp3","opus"],subtitles:["vtt","tx3g"]},mov:{label:"QuickTime",extension:"mov",mime:"video/quicktime",video:["h264","hevc","prores"],audio:["aac","pcm","mp3"],subtitles:["tx3g"]},webm:{label:"WebM",extension:"webm",mime:"video/webm",video:["vp8","vp9","av1"],audio:["opus","vorbis"],subtitles:["vtt"]},matroska:{label:"Matroska",extension:"mkv",mime:"video/x-matroska",video:["h264","hevc","av1","vp8","vp9"],audio:["aac","opus","vorbis","flac","mp3","pcm"],subtitles:["vtt","srt","ass"]},wav:{label:"WAVE",extension:"wav",mime:"audio/wav",video:[],audio:["pcm"],subtitles:[]},mp3:{label:"MP3",extension:"mp3",mime:"audio/mpeg",video:[],audio:["mp3"],subtitles:[]},ogg:{label:"Ogg",extension:"ogg",mime:"audio/ogg",video:["theora","vp8"],audio:["opus","vorbis","flac"],subtitles:[]},adts:{label:"ADTS AAC",extension:"aac",mime:"audio/aac",video:[],audio:["aac"],subtitles:[]},flac:{label:"FLAC",extension:"flac",mime:"audio/flac",video:[],audio:["flac"],subtitles:[]},mpegts:{label:"MPEG-TS",extension:"ts",mime:"video/mp2t",video:["h264","hevc"],audio:["aac","mp3"],subtitles:[]},hls:{label:"HLS",extension:"m3u8",mime:"application/vnd.apple.mpegurl",video:["h264","hevc"],audio:["aac","mp3"],subtitles:["vtt"]}},zt={inspect:"mp4",remux:"mp4",transcode:"mp4",trim:"mp4",transform:"mp4",audio:"mp3",subtitles:"mp4",hls:"hls"},$e=["VideoDecoder","VideoEncoder","AudioDecoder","AudioEncoder"],qt=new Set(["summary","metadata","packets","compatibility"]),it=new Set(["fill","contain","cover"]),Vt=new Set(["no-preference","prefer-hardware","prefer-software"]),_t=new Set(["discard","keep"]),ot=new Set(["u8","s16","s32","f32"]),Wt=new Set(["all","primary"]),Ut=new Set([0,90,180,270]),Kt=new Set(["preserve","rebase","zero"]),Ht=new Set(["preserve","matrix","bake"]),Gt=new Set(["keep","drop"]),Jt=new Set(["drop","keep-compatible"]),Qt=new Set(["keep","replace","strip"]),Yt=new Set(["bitrate","quality","lossless"]),Xt=new Set(["draft","preview","fast","medium","quality","slow","veryslow"]),Zt=new Set(["auto","quality","realtime"]),ea=new Set(["none","film","animation","screen","grain"]),ta=new Set(["none","keyframe","frame","sample"]),aa=new Set(["auto","vtt","srt"]),ia=new Set(["bottom","top","center"]),oa=new Set(["vod","event","live"]);function na(e={}){const t=String(e.type||e.mime||"").toLowerCase().split(";")[0].trim();if(at.has(t))return at.get(t);const a=String(e.name||e.fileName||"").toLowerCase(),s=a.includes(".")?a.split(".").pop():"";return jt.get(s)||"unknown"}function de(e=""){const t=String(e||"").toLowerCase().trim();return t?t.startsWith("avc1")||t.startsWith("avc3")||t==="avc"||t==="h264"||t==="h.264"?"h264":t.startsWith("hev1")||t.startsWith("hvc1")||t==="hevc"||t==="h265"||t==="h.265"?"hevc":t.startsWith("av01")?"av1":t.startsWith("vp09")?"vp9":t.startsWith("vp08")?"vp8":t.startsWith("mp4a")||t.includes("aac")?"aac":t.includes("pcm")?"pcm":t.includes("vorbis")?"vorbis":t.includes("opus")?"opus":t.includes("flac")?"flac":t.includes("mp3")||t.includes("mpeg")?"mp3":t.includes("vtt")?"vtt":t.includes("srt")?"srt":t.includes("ass")?"ass":t.split(/[.,\s/]+/)[0]||"unknown":"unknown"}function ft(e={}){const t=e.fileName||e.name||"media";return{fileName:t,mime:e.mime||e.type||"",size:Number(e.size||0),duration:Number(e.duration||0),container:e.container||na({name:t,type:e.mime||e.type}),tracks:Array.isArray(e.tracks)?e.tracks.map((a,s)=>sa(a,s)):[]}}function sa(e={},t=0){const a=["video","audio","subtitle"].includes(e.kind)?e.kind:"unknown";return{id:e.id||`${a}-${t+1}`,kind:a,codec:de(e.codec||e.codecString),codecString:e.codecString||e.codec||"",width:Number(e.width||0),height:Number(e.height||0),sampleRate:Number(e.sampleRate||0),channels:Number(e.channels||0),duration:Number(e.duration||0),language:e.language||"",rotation:Number(e.rotation||0),frameRate:Number(e.frameRate||0),decodable:e.decodable===!0}}function Oe(e,t){const a=te[e];if(!a)return!1;const s=de(t.codec||t.codecString);return t.kind==="video"?a.video.includes(s):t.kind==="audio"?a.audio.includes(s):t.kind==="subtitle"?a.subtitles.includes(s):!1}function ra(e={},t={}){const a=t.metadata||{},s=ft({fileName:e.name||e.fileName,mime:e.type||e.mime,size:e.size,duration:a.duration??e.duration,tracks:a.tracks||e.tracks||t.tracks||[]}),o=fe(t.capabilities||{}),r=Array.isArray(t.warnings)?[...t.warnings]:[];return s.container==="unknown"&&r.push({code:"UNSUPPORTED_INPUT_FORMAT",message:"Input container could not be identified locally."}),o.ready||r.push({code:"WEB_CODECS_INCOMPLETE",message:"Browser WebCodecs support is incomplete; transcode and accurate trim may be blocked."}),{...s,modifiedAt:e.lastModified||null,metadata:{provider:a.provider||"summary",depth:a.depth||"summary",tags:gt(a.tags)},capabilities:o,warnings:r}}function fe(e={}){const t=e.main||e,a=e.worker||{},s=nt(t),o=nt(a),r=$e.filter(C=>!s[C]),p=$e.filter(C=>!o[C]),b=st(t),v=st(a);return{main:s,worker:o,mainKnown:b,workerKnown:v,missingMain:r,missingWorker:p,ready:b&&v&&r.length===0&&p.length===0}}function wt(e={}){var h,w;const t=String(e.operation||"inspect").toLowerCase(),a=ft(e.source||{}),s=da(e,t),o=te[e.targetContainer]?e.targetContainer:zt[t]||"mp4",r=te[o]||te.mp4,p=[],b=[],v=la(t,a,s,o),C=!!(e.remuxOnly??s.remux.remuxOnly),A=v.requiresReencode;a.container==="unknown"&&b.push({code:"UNSUPPORTED_INPUT_FORMAT",message:"Input container is not recognized by the local planner."}),(t==="hls"||o==="hls")&&b.push({code:"WEBMEDIA_HLS_EXPORT_PENDING",message:"HLS packaging requires segmented output handling and is not enabled in Web Media Studio yet."}),s.subtitles.importText&&b.push({code:"WEBMEDIA_EXTERNAL_SUBTITLE_PENDING",message:"External subtitle import is planned but not enabled for browser-native muxing yet."}),s.subtitles.burnIn&&b.push({code:"WEBMEDIA_SUBTITLE_BURNIN_HANDOFF",message:"Subtitle burn-in requires a verified frame render pipeline; use Video Studio for burn-in."}),vt((h=v.adjustments)==null?void 0:h.transform)&&b.push({code:"WEBMEDIA_FRAME_EFFECTS_PENDING",message:"Frame effects, flips, canvas positioning, and color adjustments need the verified frame render path before browser-native export.",suggestedRoute:"/video-studio"}),yt((w=v.adjustments)==null?void 0:w.audio)&&b.push({code:"WEBMEDIA_AUDIO_EFFECTS_PENDING",message:"Audio gain, fades, normalization, dynamics, pan, and filters need the verified Web Audio render path before browser-native export.",suggestedRoute:"/video-studio"});const z=ha(a,v);t!=="inspect"&&a.tracks.length&&!z.length&&b.push({code:"WEBMEDIA_NO_OUTPUT_TRACKS",message:"Selected settings would remove every media track."});const D=z.filter(S=>!Oe(o,S));D.length&&b.push({code:"TARGET_CONTAINER_CODEC_UNSUPPORTED",message:`${r.label} cannot carry ${D.map(S=>`${S.kind}:${S.codec}`).join(", ")} with the selected settings.`}),C&&A&&b.push({code:"REMUX_ONLY_REENCODE_REQUIRED",message:"Requested operation requires decode and encode, but remux-only is selected."}),A&&p.push({code:"REENCODE_REQUIRED",message:"This operation requires reencode; packet-copy remux is not possible."});let I="Remux";return t==="inspect"?I="Inspect":b.length?I="Blocked":t==="audio"?I="Audio":A||t==="transcode"?I="Transcode":t==="trim"&&s.trim.mode==="packet"&&(I="Remux"),{operation:t,mode:I,source:a,targetContainer:o,requiresReencode:A,remuxOnly:C,execution:t==="inspect"?"inspect-report":b.length?"blocked":"mediabunny-conversion",settings:s,conversion:Sa(v),output:{container:o,label:r.label,extension:t==="inspect"?"json":r.extension,mime:t==="inspect"?"application/json":r.mime},warnings:p,errors:b}}function Pe(e="media",t={}){var r,p;const a=String(e||"media").replace(/[\\/]/g,"_"),s=a.includes(".")?a.slice(0,a.lastIndexOf(".")):a,o=((r=t.output)==null?void 0:r.extension)||((p=te[t.targetContainer])==null?void 0:p.extension)||"bin";return`${s||"media"}.webmedia.${o}`}function nt(e={}){return{VideoDecoder:!!e.VideoDecoder,VideoEncoder:!!e.VideoEncoder,AudioDecoder:!!e.AudioDecoder,AudioEncoder:!!e.AudioEncoder,EncodedVideoChunk:!!e.EncodedVideoChunk,EncodedAudioChunk:!!e.EncodedAudioChunk}}function st(e={}){return $e.some(t=>Object.prototype.hasOwnProperty.call(e,t))}function da(e={},t="inspect"){var A,z,D,I,h,w,S,M,O,$,q;const a=e.settings||{},s=a.inspect||{},o=a.transcode||{},r=a.transform||e.transform||{},p=a.trim||e.trim||{},b=a.audio||{},v=a.subtitles||{},C=a.hls||{};return{inspect:{depth:qt.has(s.depth)?s.depth:"metadata",packetSampleLimit:Le(s.packetSampleLimit,0,2e3),includeTags:s.includeTags!==!1,includePackets:!!s.includePackets,includeCompatibility:s.includeCompatibility!==!1},tracks:Wt.has(a.tracks)?a.tracks:"all",remux:{remuxOnly:e.remuxOnly!==void 0?!!e.remuxOnly:t==="remux"&&((A=a.remux)==null?void 0:A.remuxOnly)!==!1,trackPolicy:((z=a.remux)==null?void 0:z.trackPolicy)==="drop-incompatible"?"drop-incompatible":"keep-all",timestampPolicy:Kt.has((D=a.remux)==null?void 0:D.timestampPolicy)?a.remux.timestampPolicy:"preserve",rotationPolicy:Ht.has((I=a.remux)==null?void 0:I.rotationPolicy)?a.remux.rotationPolicy:"preserve",fastStart:!!((h=a.remux)!=null&&h.fastStart),interleaveMs:Le((w=a.remux)==null?void 0:w.interleaveMs,0,1e4),chapterPolicy:Gt.has((S=a.remux)==null?void 0:S.chapterPolicy)?a.remux.chapterPolicy:"keep",attachmentPolicy:Jt.has((M=a.remux)==null?void 0:M.attachmentPolicy)?a.remux.attachmentPolicy:"drop",metadataPolicy:Qt.has((O=a.remux)==null?void 0:O.metadataPolicy)?a.remux.metadataPolicy:"keep"},transcode:{preset:String(o.preset||"custom"),speedPreset:Xt.has(o.speedPreset)?o.speedPreset:"medium",videoCodec:De(o.videoCodec??e.videoCodec??"copy"),audioCodec:De(o.audioCodec??e.audioCodec??"copy"),rateControl:Yt.has(o.rateControl)?o.rateControl:"bitrate",quality:j(o.quality,0,100),videoBitrateKbps:Se(o.videoBitrateKbps),maxVideoBitrateKbps:Se(o.maxVideoBitrateKbps),bufferSizeKbps:Se(o.bufferSizeKbps),audioBitrateKbps:Se(o.audioBitrateKbps),width:H(o.width),height:H(o.height),fit:it.has(o.fit)?o.fit:"contain",preventUpscale:!!o.preventUpscale,frameRate:N(o.frameRate),keyFrameInterval:N(o.keyFrameInterval),hardwareAcceleration:Vt.has(o.hardwareAcceleration)?o.hardwareAcceleration:"no-preference",alpha:_t.has(o.alpha)?o.alpha:"discard",latencyMode:Zt.has(o.latencyMode)?o.latencyMode:"auto",tune:ea.has(o.tune)?o.tune:"none",bitDepth:Le(o.bitDepth,0,16),colorSpace:String(o.colorSpace||"auto").trim()||"auto",sampleRate:H(o.sampleRate),channels:H(o.channels),sampleFormat:ot.has(o.sampleFormat)?o.sampleFormat:"",discardVideo:!!o.discardVideo,discardAudio:!!o.discardAudio,forceVideo:o.forceVideo!==!1&&t==="transcode",forceAudio:o.forceAudio!==!1&&t==="transcode"},trim:{start:N(p.start),end:N(p.end),duration:N(p.duration),mode:p.mode==="accurate"?"accurate":"packet",snapPolicy:ta.has(p.snapPolicy)?p.snapPolicy:"keyframe",preroll:N(p.preroll),postroll:N(p.postroll),preserveTimestamps:!!p.preserveTimestamps,fadeIn:N(p.fadeIn),fadeOut:N(p.fadeOut)},transform:{width:H(r.width??(($=r.resize)==null?void 0:$.width)),height:H(r.height??((q=r.resize)==null?void 0:q.height)),fit:it.has(r.fit)?r.fit:"contain",rotate:Pa(r.rotate),allowRotationMetadata:r.allowRotationMetadata!==!1,crop:Oa(r.crop),frameRate:N(r.frameRate),anchor:String(r.anchor||"center").trim()||"center",scale:N(r.scale),x:pe(r.x),y:pe(r.y),flipHorizontal:!!r.flipHorizontal,flipVertical:!!r.flipVertical,background:Ia(r.background),color:Aa(r.color),effects:Ca(r.effects)},audio:{mode:b.mode==="drop"?"drop":b.mode==="copy"?"copy":"convert",audioCodec:De(b.audioCodec??e.audioCodec??"mp3"),audioBitrateKbps:Se(b.audioBitrateKbps),sampleRate:H(b.sampleRate),channels:H(b.channels),sampleFormat:ot.has(b.sampleFormat)?b.sampleFormat:"",discardVideo:b.discardVideo!==!1,gainDb:pe(b.gainDb),normalize:!!b.normalize,normalizeTargetDb:pe(b.normalizeTargetDb||-14),limiter:!!b.limiter,fadeIn:N(b.fadeIn),fadeOut:N(b.fadeOut),pan:j(b.pan,-1,1),highpassHz:N(b.highpassHz),lowpassHz:N(b.lowpassHz),compressorThreshold:pe(b.compressorThreshold),compressorRatio:N(b.compressorRatio)},subtitles:{mode:v.mode==="drop"?"drop":"copy",importText:!!v.importText,burnIn:!!v.burnIn,language:String(v.language||"").trim(),sourceFormat:aa.has(v.sourceFormat)?v.sourceFormat:"auto",offset:pe(v.offset),fontSize:Le(v.fontSize,0,160),position:ia.has(v.position)?v.position:"bottom",outline:N(v.outline),background:!!v.background},hls:{segmentDuration:j(C.segmentDuration||6,1,30),playlistType:oa.has(C.playlistType)?C.playlistType:"vod",variantLadder:String(C.variantLadder||"").trim(),independentSegments:C.independentSegments!==!1,iframePlaylist:!!C.iframePlaylist,audioRenditions:!!C.audioRenditions,captionRendition:!!C.captionRendition},metadata:gt(a.metadata||e.metadata||{})}}function la(e,t,a,s){const o={tracks:a.tracks,video:{},audio:{},trim:{},mux:ca(a.remux),profile:ua(a.transcode),adjustments:ma(e,a),package:{},tags:a.metadata,requiresReencode:!1};return e==="remux"&&a.remux.trackPolicy==="drop-incompatible"&&va(o,t,s),e==="transcode"&&(Object.assign(o.video,ya(a.transcode)),Object.assign(o.audio,rt(a.transcode))),e==="trim"&&(a.trim.start>0&&(o.trim.start=a.trim.start),a.trim.end>0&&(o.trim.end=a.trim.end),a.trim.duration>0&&!o.trim.end&&(o.trim.duration=a.trim.duration),a.trim.mode==="accurate"&&(o.video.forceTranscode=dt(t,"video"),o.audio.forceTranscode=dt(t,"audio"),o.requiresReencode=o.video.forceTranscode||o.audio.forceTranscode),(a.trim.fadeIn>0||a.trim.fadeOut>0)&&(o.adjustments.audio.fadeIn=a.trim.fadeIn,o.adjustments.audio.fadeOut=a.trim.fadeOut)),e==="transform"&&(Object.assign(o.video,ga(a.transform)),o.requiresReencode=Object.keys(o.video).length>0),e==="audio"&&(a.audio.discardVideo&&(o.video.discard=!0),a.audio.mode==="drop"?o.audio.discard=!0:Object.assign(o.audio,rt(a.audio))),e==="subtitles"&&(o.tracks=a.subtitles.mode==="drop"?"primary":a.tracks),e==="hls"&&(o.package=wa(a.hls),o.requiresReencode=!0),e==="remux"||e==="subtitles"?o.requiresReencode=!1:o.requiresReencode=o.requiresReencode||ka(o.video)||Ea(o.audio),o.requiresReencode=o.requiresReencode||vt(o.adjustments.transform)||yt(o.adjustments.audio),o}function ca(e={}){const t={};return e.fastStart&&(t.fastStart=!0),e.interleaveMs>0&&(t.interleaveMs=e.interleaveMs),e.timestampPolicy!=="preserve"&&(t.timestampPolicy=e.timestampPolicy),e.rotationPolicy!=="preserve"&&(t.rotationPolicy=e.rotationPolicy),e.chapterPolicy!=="keep"&&(t.chapterPolicy=e.chapterPolicy),e.attachmentPolicy!=="drop"&&(t.attachmentPolicy=e.attachmentPolicy),e.metadataPolicy!=="keep"&&(t.metadataPolicy=e.metadataPolicy),t}function ua(e={}){const t={};return e.rateControl!=="bitrate"&&(t.rateControl=e.rateControl),e.speedPreset!=="medium"&&(t.speedPreset=e.speedPreset),e.quality>0&&(t.quality=e.quality),e.maxVideoBitrateKbps>0&&(t.maxVideoBitrate=e.maxVideoBitrateKbps*1e3),e.bufferSizeKbps>0&&(t.bufferSize=e.bufferSizeKbps*1e3),e.preventUpscale&&(t.preventUpscale=!0),e.latencyMode!=="auto"&&(t.latencyMode=e.latencyMode),e.tune!=="none"&&(t.tune=e.tune),e.bitDepth>0&&(t.bitDepth=e.bitDepth),e.colorSpace!=="auto"&&(t.colorSpace=e.colorSpace),t}function ma(e,t={}){return{transform:["transform"].includes(e)?pa(t.transform):{},audio:["audio","trim"].includes(e)?ba(t.audio,t.trim):{},subtitles:e==="subtitles"?fa(t.subtitles):{}}}function pa(e={}){const t={};return e.anchor!=="center"&&(t.anchor=e.anchor),e.scale>0&&e.scale!==1&&(t.scale=e.scale),e.x!==0&&(t.x=e.x),e.y!==0&&(t.y=e.y),e.flipHorizontal&&(t.flipHorizontal=!0),e.flipVertical&&(t.flipVertical=!0),e.background&&(t.background=e.background),Ta(e.color)&&(t.color=e.color),xa(e.effects)&&(t.effects=e.effects),t}function ba(e={},t={}){const a={};e.gainDb!==0&&(a.gainDb=e.gainDb),e.normalize&&(a.normalize=!0,a.normalizeTargetDb=e.normalizeTargetDb),e.limiter&&(a.limiter=!0);const s=Math.max(e.fadeIn||0,t.fadeIn||0),o=Math.max(e.fadeOut||0,t.fadeOut||0);return s>0&&(a.fadeIn=s),o>0&&(a.fadeOut=o),e.pan!==0&&(a.pan=e.pan),e.highpassHz>0&&(a.highpassHz=e.highpassHz),e.lowpassHz>0&&(a.lowpassHz=e.lowpassHz),e.compressorThreshold!==0&&(a.compressorThreshold=e.compressorThreshold),e.compressorRatio>0&&(a.compressorRatio=e.compressorRatio),a}function fa(e={}){const t={};return e.sourceFormat!=="auto"&&(t.sourceFormat=e.sourceFormat),e.offset!==0&&(t.offset=e.offset),e.fontSize>0&&(t.fontSize=e.fontSize),e.position!=="bottom"&&(t.position=e.position),e.outline>0&&(t.outline=e.outline),e.background&&(t.background=!0),t}function wa(e={}){const t={segmentDuration:e.segmentDuration,playlistType:e.playlistType,independentSegments:e.independentSegments};return e.variantLadder&&(t.variantLadder=e.variantLadder),e.iframePlaylist&&(t.iframePlaylist=!0),e.audioRenditions&&(t.audioRenditions=!0),e.captionRendition&&(t.captionRendition=!0),t}function va(e,t,a){const s=t.tracks.filter(r=>r.kind==="video"),o=t.tracks.filter(r=>r.kind==="audio");s.length&&s.every(r=>!Oe(a,r))&&(e.video.discard=!0),o.length&&o.every(r=>!Oe(a,r))&&(e.audio.discard=!0)}function ya(e={}){const t={},a=Ra(e.videoCodec);return e.discardVideo&&(t.discard=!0),a&&(t.codec=a),e.videoBitrateKbps>0&&(t.bitrate=e.videoBitrateKbps*1e3),e.width>0&&(t.width=e.width),e.height>0&&(t.height=e.height),e.width>0&&e.height>0&&(t.fit=e.fit),e.frameRate>0&&(t.frameRate=e.frameRate),e.keyFrameInterval>0&&(t.keyFrameInterval=e.keyFrameInterval),e.hardwareAcceleration&&(t.hardwareAcceleration=e.hardwareAcceleration),e.alpha&&(t.alpha=e.alpha),(e.forceVideo||a||e.videoBitrateKbps>0)&&(t.forceTranscode=!0),t}function ga(e={}){const t={};return e.width>0&&(t.width=e.width),e.height>0&&(t.height=e.height),e.width>0&&e.height>0&&(t.fit=e.fit),e.rotate&&(t.rotate=e.rotate),e.allowRotationMetadata===!1&&(t.allowRotationMetadata=!1),e.crop&&(t.crop=e.crop),e.frameRate>0&&(t.frameRate=e.frameRate),Object.keys(t).length&&(t.forceTranscode=!0),t}function rt(e={}){const t={},a=La(e.audioCodec);return e.discardAudio&&(t.discard=!0),a&&(t.codec=a),e.audioBitrateKbps>0&&(t.bitrate=e.audioBitrateKbps*1e3),e.sampleRate>0&&(t.sampleRate=e.sampleRate),e.channels>0&&(t.numberOfChannels=e.channels),e.sampleFormat&&(t.sampleFormat=e.sampleFormat),(e.forceAudio||a||e.audioBitrateKbps>0||e.sampleRate>0||e.channels>0||e.sampleFormat)&&(t.forceTranscode=!0),t}function ha(e,t){return e.tracks.filter(a=>a.kind==="video"?t.video.discard!==!0:a.kind==="audio"?t.audio.discard!==!0:a.kind==="subtitle").map(a=>a.kind==="video"&&t.video.codec?{...a,codec:de(t.video.codec)}:a.kind==="audio"&&t.audio.codec?{...a,codec:de(t.audio.codec)}:a)}function Sa(e){return{tracks:e.tracks,...Object.keys(e.video).length?{video:e.video}:{},...Object.keys(e.audio).length?{audio:e.audio}:{},...Object.keys(e.trim).length?{trim:e.trim}:{},...Object.keys(e.mux).length?{mux:e.mux}:{},...Object.keys(e.profile).length?{profile:e.profile}:{},...Ma(e.adjustments)?{adjustments:e.adjustments}:{},...Object.keys(e.package).length?{package:e.package}:{},...Object.keys(e.tags).length?{tags:e.tags}:{}}}function ka(e={}){return!!(e.codec||e.bitrate||e.width||e.height||e.rotate||e.crop||e.frameRate||e.keyFrameInterval||e.forceTranscode||e.allowRotationMetadata===!1)}function Ea(e={}){return!!(e.codec||e.bitrate||e.sampleRate||e.numberOfChannels||e.sampleFormat||e.forceTranscode)}function Ma(e={}){return!!(Object.keys(e.transform||{}).length||Object.keys(e.audio||{}).length||Object.keys(e.subtitles||{}).length)}function vt(e={}){return Object.keys(e||{}).length>0}function yt(e={}){return Object.keys(e||{}).length>0}function Aa(e={}){return{exposure:j(e.exposure,-5,5),contrast:j(e.contrast,-100,100),saturation:j(e.saturation,-100,100),temperature:j(e.temperature,-100,100),tint:j(e.tint,-100,100),gamma:j(e.gamma,0,5)}}function Ca(e={}){return{sharpen:j(e.sharpen,0,100),denoise:j(e.denoise,0,100),grain:j(e.grain,0,100),blur:j(e.blur,0,100)}}function Ta(e={}){return["exposure","contrast","saturation","temperature","tint","gamma"].some(t=>Number(e[t]||0)!==0)}function xa(e={}){return["sharpen","denoise","grain","blur"].some(t=>Number(e[t]||0)!==0)}function dt(e,t){return e.tracks.some(a=>a.kind===t)}function De(e){const t=de(e);return t==="unknown"?"copy":t}function Ra(e){const t=de(e);return t==="copy"||t==="unknown"?"":t==="h264"?"avc":["hevc","vp8","vp9","av1"].includes(t)?t:""}function La(e){const t=de(e);return t==="copy"||t==="unknown"?"":t==="pcm"?"pcm-s16":["aac","opus","mp3","vorbis","flac"].includes(t)?t:""}function Oa(e={}){const t=Math.max(0,Math.round(Number(e.x||0))),a=Math.max(0,Math.round(Number(e.y||0))),s=H(e.width),o=H(e.height);return s>0&&o>0?{x:t,y:a,width:s,height:o}:null}function Pa(e){const t=Math.round(Number(e||0));return Ut.has(t)?t:0}function Ia(e){const t=String(e||"").trim();return/^#[0-9a-f]{6}$/i.test(t)?t:""}function H(e){const t=Math.round(Number(e||0));return Number.isFinite(t)&&t>0?t:0}function N(e){const t=Number(e||0);return Number.isFinite(t)&&t>0?t:0}function Se(e){const t=Number(e||0);return Number.isFinite(t)?Math.max(0,t):0}function pe(e){const t=Number(e||0);return Number.isFinite(t)?t:0}function Le(e,t,a){return Math.round(j(e,t,a))}function j(e,t,a){const s=Number(e||0);return Number.isFinite(s)?Math.min(a,Math.max(t,s)):0}function gt(e={}){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([,t])=>["string","number","boolean"].includes(typeof t)).map(([t,a])=>[t,String(a)]))}const ht="https://esm.sh/mediabunny@1.45.4",St=new Map,Da=new Set(["ready","capabilities","inspect","plan","run","cancel"]);function $a(e={}){const t=String(e.type||"");if(!Da.has(t))throw new Error(`Unsupported web media message: ${t||"missing"}`);return{requestId:e.requestId||"",type:t,payload:e.payload||{}}}async function kt(e={},t={}){const a=$a(e),s=typeof t.emit=="function"?t.emit:()=>{},o=t.jobs||St;try{if(a.type==="ready"||a.type==="capabilities")return;if(a.type==="inspect"){s({type:"progress",payload:{phase:"inspect",percent:8,processedBytes:0}});const r=await Na(a.payload.mediaFile||a.payload.file,t),p=ra(a.payload.file||{},{tracks:a.payload.tracks,capabilities:a.payload.capabilities,metadata:r.metadata,warnings:r.warnings});s({type:"progress",payload:{phase:"inspect",percent:100,processedBytes:p.size||0}}),s({type:"result",payload:{inspection:p}});return}if(a.type==="plan"){const r=wt(a.payload);s({type:"result",payload:{plan:r}});return}if(a.type==="cancel"){const r=a.payload.jobId,p=o.get(r)||{canceled:!1};p.canceled=!0,typeof p.cancel=="function"&&await p.cancel(),o.set(r,p),s({type:"warning",payload:{code:"JOB_CANCELED",message:"Job canceled."}}),s({type:"result",payload:{canceled:!0,jobId:r}});return}await Va(a.payload,{emit:s,jobs:o,context:t})}catch(r){s({type:"error",payload:je(r)})}}function je(e={}){return e.code&&e.message?{code:e.code,message:e.message,recoverable:e.recoverable!==!1,suggestedRoute:e.suggestedRoute||""}:{code:"WEBMEDIA_WORKER_ERROR",message:(e==null?void 0:e.message)||String(e),recoverable:!0,suggestedRoute:""}}async function Na(e,t={}){if(!e||!t.loadMediabunny&&!qa(e))return{metadata:null,warnings:[]};try{const s=await(t.loadMediabunny||Ba)();return{metadata:await Fa(e,s),warnings:[]}}catch(a){return{metadata:null,warnings:[{code:"MEDIA_METADATA_UNAVAILABLE",message:(a==null?void 0:a.message)||"Mediabunny metadata inspection was unavailable."}]}}}async function Ba(){return import(ht)}async function Fa(e,t={}){const{ALL_FORMATS:a,BlobSource:s,Input:o}=t;if(!a||typeof s!="function"||typeof o!="function")throw new Error("Mediabunny metadata APIs are unavailable.");const r=new o({formats:a,source:new s(e)});try{const p=await W(()=>r.getTracks(),[]),b=await W(()=>r.computeDuration(),0),v=await W(()=>r.getMetadataTags(),{}),C=[];for(let A=0;A<p.length;A+=1)C.push(await ja(p[A],A));return{provider:"mediabunny",depth:"metadata",duration:ee(b),tracks:C,tags:v}}finally{const p=r.dispose||r.close;typeof p=="function"&&await p.call(r)}}async function ja(e={},t=0){const a=za(e.type||e.kind),s=await W(()=>{var r;return(r=e.getDecoderConfig)==null?void 0:r.call(e)},null),o=a==="video"?await W(()=>{var r;return(r=e.computePacketStats)==null?void 0:r.call(e,100)},null):null;return{id:String(e.id??`${a}-${t+1}`),kind:a,codec:lt((s==null?void 0:s.codec)||e.codec),codecString:lt((s==null?void 0:s.codec)||e.codec),width:a==="video"?ee(await W(()=>{var r;return(r=e.getDisplayWidth)==null?void 0:r.call(e)},0)):0,height:a==="video"?ee(await W(()=>{var r;return(r=e.getDisplayHeight)==null?void 0:r.call(e)},0)):0,sampleRate:a==="audio"?ee(await W(()=>{var r;return(r=e.getSampleRate)==null?void 0:r.call(e)},(s==null?void 0:s.sampleRate)||0)):0,channels:a==="audio"?ee(await W(()=>{var r;return(r=e.getNumberOfChannels)==null?void 0:r.call(e)},(s==null?void 0:s.numberOfChannels)||0)):0,duration:ee(await W(()=>{var r;return(r=e.computeDuration)==null?void 0:r.call(e)},0)),language:String(e.language||""),rotation:a==="video"?ee(await W(()=>{var r;return(r=e.getRotation)==null?void 0:r.call(e)},0)):0,frameRate:a==="video"?ee(o==null?void 0:o.averagePacketRate):0,decodable:await W(()=>{var r;return(r=e.canDecode)==null?void 0:r.call(e)},!1)===!0}}async function W(e,t){try{return typeof e!="function"?t:await e()??t}catch{return t}}function za(e){const t=String(e||"").toLowerCase();return t==="video"||t==="audio"||t==="subtitle"?t:t==="subtitles"||t==="text"?"subtitle":"unknown"}function lt(e){if(!e)return"";if(typeof e=="string")return e;if(typeof e=="object"){const a=e.codec||e.name||e.id||e.label;if(a)return String(a)}const t=String(e);return t==="[object Object]"?"":t}function ee(e){const t=Number(e||0);return Number.isFinite(t)?t:0}function qa(e){return typeof Blob=="function"&&e instanceof Blob}async function Va(e={},{emit:t,jobs:a,context:s={}}){var b;const o=e.jobId||`webmedia-${Math.random().toString(36).slice(2,9)}`,r=a.get(o)||{canceled:!1};if(a.set(o,r),t({type:"progress",payload:{phase:"start",percent:0,processedBytes:0}}),r.canceled){t({type:"error",payload:{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0}});return}const p=e.plan||{};if(p.operation==="inspect"||p.mode==="Inspect"){const v=JSON.stringify({plan:p,source:p.source||{}},null,2);t({type:"progress",payload:{phase:"report",percent:100,outputBytes:v.length}}),t({type:"result",payload:{blob:new Blob([v],{type:"application/json"}),filename:Pe(((b=p.source)==null?void 0:b.fileName)||"media",{output:{extension:"json"}}),mime:"application/json",summary:{mode:"Inspect",bytes:v.length}}}),a.delete(o);return}if(_a(p)){if(!e.mediaFile){t({type:"error",payload:{code:"WEBMEDIA_SOURCE_MISSING",message:"Original media file is required for browser-native export.",recoverable:!0}}),a.delete(o);return}try{const v=await Wa(e.mediaFile,p,{emit:t,job:r,loadMediabunny:s.loadMediabunny});t({type:"result",payload:v})}catch(v){t({type:"error",payload:je(r.canceled?{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0}:v)})}finally{a.delete(o)}return}t({type:"error",payload:{code:"WEBMEDIA_EXECUTION_PENDING",message:"This browser-native export path is planned but not enabled until fixture verification passes.",recoverable:!0,suggestedRoute:"/video-studio"}}),a.delete(o)}function _a(e={}){const t=e.operation==="remux"&&e.mode==="Remux"&&e.requiresReencode===!1&&e.remuxOnly===!0;return(e.execution==="mediabunny-conversion"||t)&&["remux","transcode","trim","transform","audio","subtitles"].includes(e.operation)&&(!Array.isArray(e.errors)||e.errors.length===0)}async function Wa(e,t,{emit:a,job:s,loadMediabunny:o}){var J,ae,Q,ie;const p=await(o||Ya)(),{ALL_FORMATS:b,BlobSource:v,BufferTarget:C,Conversion:A,Input:z,Output:D}=p;if(!b||typeof v!="function"||typeof C!="function"||typeof(A==null?void 0:A.init)!="function"||typeof z!="function"||typeof D!="function")throw{code:"WEBMEDIA_RUNTIME_UNAVAILABLE",message:"Mediabunny conversion APIs are unavailable.",recoverable:!0};const I=new z({formats:b,source:new v(e)}),h=new C,w=new D({format:Xa(t,p),target:h}),S={input:I,output:w,...Ua(t),showWarnings:!1},M=await A.init(S);if(s.cancel=async()=>{var B;return(B=M.cancel)==null?void 0:B.call(M)},!M.isValid)throw{code:"WEBMEDIA_CONVERSION_INVALID",message:ct(M.discardedTracks)||"Mediabunny rejected this conversion plan.",recoverable:!0,suggestedRoute:"/video-studio"};if(Array.isArray(M.discardedTracks)&&M.discardedTracks.length)throw{code:"WEBMEDIA_CONVERSION_DISCARDED_TRACKS",message:ct(M.discardedTracks),recoverable:!0,suggestedRoute:"/video-studio"};if(M.onProgress=(B,f)=>{a({type:"progress",payload:{phase:t.operation||"convert",percent:Math.max(1,Math.min(99,Math.round(Number(B||0)*100))),processedTime:Number(f||0)}})},s.canceled)throw{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0};if(await M.execute(),s.canceled)throw{code:"JOB_CANCELED",message:"Job canceled.",recoverable:!0};const O=h.buffer||((J=w.target)==null?void 0:J.buffer)||new ArrayBuffer(0),$=O instanceof Uint8Array?O:new Uint8Array(O),q=new Blob([$],{type:((ae=t.output)==null?void 0:ae.mime)||"application/octet-stream"});return a({type:"progress",payload:{phase:t.operation||"convert",percent:100,outputBytes:q.size}}),{blob:q,filename:Pe(((Q=t.source)==null?void 0:Q.fileName)||e.name||"media",t),mime:((ie=t.output)==null?void 0:ie.mime)||"application/octet-stream",summary:{mode:t.mode||"Export",bytes:q.size}}}function Ua(e={}){const t=e.conversion||{},a={};(t.tracks==="all"||t.tracks==="primary")&&(a.tracks=t.tracks);const s=Ka(t.video),o=Ha(t.audio),r=Ga(t.trim),p=Qa(t.tags);return Object.keys(s).length&&(a.video=s),Object.keys(o).length&&(a.audio=o),Object.keys(r).length&&(a.trim=r),Object.keys(p).length&&(a.tags=p),a}function Ka(e={}){const t={};e.discard===!0&&(t.discard=!0),["avc","hevc","vp8","vp9","av1"].includes(e.codec)&&(t.codec=e.codec),G(e.width)&&(t.width=G(e.width)),G(e.height)&&(t.height=G(e.height)),["fill","contain","cover"].includes(e.fit)&&(t.fit=e.fit),[0,90,180,270].includes(Number(e.rotate))&&Number(e.rotate)!==0&&(t.rotate=Number(e.rotate)),e.allowRotationMetadata===!1&&(t.allowRotationMetadata=!1);const a=Ja(e.crop);return a&&(t.crop=a),U(e.frameRate)&&(t.frameRate=U(e.frameRate)),U(e.bitrate)&&(t.bitrate=U(e.bitrate)),["discard","keep"].includes(e.alpha)&&(t.alpha=e.alpha),U(e.keyFrameInterval)&&(t.keyFrameInterval=U(e.keyFrameInterval)),["no-preference","prefer-hardware","prefer-software"].includes(e.hardwareAcceleration)&&(t.hardwareAcceleration=e.hardwareAcceleration),e.forceTranscode===!0&&(t.forceTranscode=!0),t}function Ha(e={}){const t={};return e.discard===!0&&(t.discard=!0),["aac","opus","mp3","vorbis","flac","pcm-u8","pcm-s16","pcm-s32","pcm-f32"].includes(e.codec)&&(t.codec=e.codec),G(e.numberOfChannels)&&(t.numberOfChannels=G(e.numberOfChannels)),G(e.sampleRate)&&(t.sampleRate=G(e.sampleRate)),["u8","s16","s32","f32"].includes(e.sampleFormat)&&(t.sampleFormat=e.sampleFormat),U(e.bitrate)&&(t.bitrate=U(e.bitrate)),e.forceTranscode===!0&&(t.forceTranscode=!0),t}function Ga(e={}){const t={};return U(e.start)&&(t.start=U(e.start)),U(e.end)&&(t.end=U(e.end)),t}function Ja(e={}){const t=Math.max(0,Math.round(Number(e.x||0))),a=Math.max(0,Math.round(Number(e.y||0))),s=G(e.width),o=G(e.height);return s>0&&o>0?{x:t,y:a,width:s,height:o}:null}function Qa(e={}){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([,t])=>["string","number","boolean"].includes(typeof t)).map(([t,a])=>[t,String(a)]))}function G(e){const t=Math.round(Number(e||0));return Number.isFinite(t)&&t>0?t:0}function U(e){const t=Number(e||0);return Number.isFinite(t)&&t>0?t:0}async function Ya(){return import(ht)}function Xa(e,t={}){var o;const s=t[{adts:"AdtsOutputFormat",flac:"FlacOutputFormat",matroska:"MkvOutputFormat",mov:"MovOutputFormat",mp3:"Mp3OutputFormat",mp4:"Mp4OutputFormat",mpegts:"MpegTsOutputFormat",ogg:"OggOutputFormat",wav:"WavOutputFormat",webm:"WebMOutputFormat"}[e.targetContainer]];if(typeof s!="function")throw{code:"WEBMEDIA_OUTPUT_UNSUPPORTED",message:`${((o=e.output)==null?void 0:o.label)||e.targetContainer||"Selected output"} is not available in this Mediabunny runtime.`,recoverable:!0};return new s}function ct(e=[]){return Array.from(e||[]).map(t=>{var a;return t.reason||t.message||((a=t.track)==null?void 0:a.id)||""}).filter(Boolean).join("; ")}function Za(e=globalThis){return typeof WorkerGlobalScope<"u"&&e instanceof WorkerGlobalScope&&typeof e.postMessage=="function"&&typeof e.document>"u"}typeof self<"u"&&Za(self)&&(self.postMessage({type:"ready"}),self.postMessage({type:"capabilities",payload:{worker:{VideoDecoder:typeof self.VideoDecoder=="function",VideoEncoder:typeof self.VideoEncoder=="function",AudioDecoder:typeof self.AudioDecoder=="function",AudioEncoder:typeof self.AudioEncoder=="function",EncodedVideoChunk:typeof self.EncodedVideoChunk=="function",EncodedAudioChunk:typeof self.EncodedAudioChunk=="function"}}}),self.onmessage=async e=>{var a;const t=((a=e.data)==null?void 0:a.requestId)||"";await kt(e.data,{jobs:St,emit:s=>{self.postMessage({requestId:t,...s})}})});function ei(){return new Worker(new URL("/assets/webmedia.worker-BMVDNvsS.js",import.meta.url),{type:"module"})}function ti(e=globalThis){return{VideoDecoder:typeof e.VideoDecoder=="function",VideoEncoder:typeof e.VideoEncoder=="function",AudioDecoder:typeof e.AudioDecoder=="function",AudioEncoder:typeof e.AudioEncoder=="function",EncodedVideoChunk:typeof e.EncodedVideoChunk=="function",EncodedAudioChunk:typeof e.EncodedAudioChunk=="function"}}function ai(e={}){const t=e.createWorker||ei,a=!!e.forceLocal,s=new Map;let o=null,r=!1,p=0,b=0;const v={main:ti(globalThis),worker:{}},C=typeof e.createWorker=="function",A=new Map,z=()=>{const h=fe(v);for(const{resolve:w,timer:S}of A.values())clearTimeout(S),w(h);A.clear()},D=()=>a||!C&&typeof Worker!="function"?null:o||(o=t(),o.onmessage=h=>{var M,O,$;const w=h.data||{};if(w.type==="capabilities"){v.worker=((M=w.payload)==null?void 0:M.worker)||{},z();return}const S=s.get(w.requestId);if(S){if(w.type==="result"){s.delete(w.requestId),S.resolve(w.payload);return}if(w.type==="error"){s.delete(w.requestId),S.reject(Et(w.payload)),(O=S.onEvent)==null||O.call(S,w);return}($=S.onEvent)==null||$.call(S,w)}},o.onerror=h=>{const w=typeof ErrorEvent=="function"&&h instanceof ErrorEvent&&h.error?h.error:new Error(h.message||"Web media worker failed.");for(const[S,M]of s.entries())M.reject(w),s.delete(S);z()},o),I=async(h,w={},S={})=>{var J,ae,Q,ie;if(r)throw new Error("Web media service has been disposed.");const M=D();if(!M)return ii(h,w,S.onEvent);const O=`webmedia-${++p}`,$=new Promise((B,f)=>{s.set(O,{resolve:B,reject:f,onEvent:S.onEvent})}),q=()=>{M.postMessage({requestId:`${O}:cancel`,type:"cancel",payload:{jobId:w.jobId}})};(ae=(J=S.signal)==null?void 0:J.addEventListener)==null||ae.call(J,"abort",q,{once:!0}),M.postMessage({requestId:O,type:h,payload:w});try{return await $}finally{(ie=(Q=S.signal)==null?void 0:Q.removeEventListener)==null||ie.call(Q,"abort",q)}};return{getCapabilities(){return fe(v)},probeCapabilities(h={}){const w=D(),S=fe(v);if(!w||S.workerKnown)return Promise.resolve(S);const M=Math.max(0,Number(h.timeoutMs??700));return new Promise(O=>{const $=`capability-${++b}`,q=setTimeout(()=>{A.delete($),O(fe(v))},M);A.set($,{resolve:O,timer:q})})},inspectFile(h,w={}){const S={file:oi(h),capabilities:v};return ut(h)&&(S.mediaFile=h),I("inspect",S,w)},plan(h,w={}){return I("plan",h,w)},run(h,w={}){const M={jobId:w.jobId||`webmedia-${Math.random().toString(36).slice(2,9)}`,plan:h},O=w.mediaFile||w.file||w.sourceFile;return ut(O)&&(M.mediaFile=O),I("run",M,w)},cancel(h,w={}){return I("cancel",{jobId:h},w)},dispose(){var h;r=!0,s.clear();for(const{resolve:w,timer:S}of A.values())clearTimeout(S),w(fe(v));A.clear(),(h=o==null?void 0:o.terminate)==null||h.call(o),o=null}}}async function ii(e,t,a){const s=[];await kt({type:e,payload:t},{emit:p=>{s.push(p),a==null||a(p)}});const o=s.find(p=>p.type==="error");if(o)throw Et(o.payload);const r=s.findLast(p=>p.type==="result");return(r==null?void 0:r.payload)||{}}function oi(e={}){return{name:e.name||e.fileName||"media",type:e.type||e.mime||"",size:Number(e.size||0),lastModified:e.lastModified||null,duration:e.duration||0,tracks:Array.isArray(e.tracks)?e.tracks:[]}}function ut(e){return typeof Blob=="function"&&e instanceof Blob}function Et(e={}){const t=je(e),a=new Error(t.message);return a.code=t.code,a.recoverable=t.recoverable,a.suggestedRoute=t.suggestedRoute,a}let d=null,V=null,F=null,we=[],T=null,g=null,Y="inspect",P=null,K=null,se="",X="",Me=null,Ae="",ne="",l=null,ve=0,re=0,Ce="";const mt={draft:{rateControl:"bitrate",quality:32,videoBitrateKbps:1200,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:96,frameRate:24,keyFrameInterval:4,hardwareAcceleration:"prefer-hardware",latencyMode:"realtime"},preview:{rateControl:"bitrate",quality:28,videoBitrateKbps:2200,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:128,frameRate:30,keyFrameInterval:3,hardwareAcceleration:"prefer-hardware",latencyMode:"realtime"},fast:{rateControl:"bitrate",quality:25,videoBitrateKbps:3500,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:160,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-hardware",latencyMode:"auto"},medium:{rateControl:"bitrate",quality:23,videoBitrateKbps:4500,maxVideoBitrateKbps:0,bufferSizeKbps:0,audioBitrateKbps:160,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"no-preference",latencyMode:"auto"},quality:{rateControl:"quality",quality:21,videoBitrateKbps:6500,maxVideoBitrateKbps:9e3,bufferSizeKbps:18e3,audioBitrateKbps:192,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"no-preference",latencyMode:"quality"},slow:{rateControl:"quality",quality:20,videoBitrateKbps:8e3,maxVideoBitrateKbps:12e3,bufferSizeKbps:24e3,audioBitrateKbps:192,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-software",latencyMode:"quality"},veryslow:{rateControl:"quality",quality:18,videoBitrateKbps:12e3,maxVideoBitrateKbps:18e3,bufferSizeKbps:36e3,audioBitrateKbps:256,frameRate:30,keyFrameInterval:2,hardwareAcceleration:"prefer-software",latencyMode:"quality"}};function k(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ke(e=0){const t=Number(e||0);return t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:t<1024*1024*1024?`${(t/1024/1024).toFixed(1)} MB`:`${(t/1024/1024/1024).toFixed(2)} GB`}function oe(e=0){const t=Math.max(0,Math.round(Number(e||0))),a=Math.floor(t/3600),s=Math.floor(t%3600/60),o=t%60;return a?`${a}:${String(s).padStart(2,"0")}:${String(o).padStart(2,"0")}`:`${s}:${String(o).padStart(2,"0")}`}function pt(e={}){return[e.codec,e.width?`${e.width}x${e.height}`:"",e.frameRate?`${Number(e.frameRate).toFixed(2)} fps`:"",e.rotation?`${e.rotation} deg`:"",e.sampleRate?`${e.sampleRate} Hz`:"",e.channels?`${e.channels} ch`:"",e.language].filter(Boolean).join(" - ")}function ni(e){const t=Number((e==null?void 0:e.value)||0);return Number.isFinite(t)?t:0}function bt(e){if(!e||typeof URL>"u"||typeof URL.createObjectURL!="function")return"";try{return URL.createObjectURL(e)}catch{return""}}function Ne(){if(!se||typeof URL>"u"||typeof URL.revokeObjectURL!="function"){se="";return}URL.revokeObjectURL(se),se=""}function Mt(){if(!X||typeof URL>"u"||typeof URL.revokeObjectURL!="function"){X="";return}URL.revokeObjectURL(X),X=""}function E(e,t,a){const s=e.querySelector(`#${t}`);s&&(s.value=String(a))}function be(e,t,a){const s=e.querySelector(`#${t}`);s&&(s.checked=!!a)}function Ee(e,t,a){const s=Number(e);return Number.isFinite(s)?Math.max(t,Math.min(a,s)):t}function L(e,t,a=!1){return Bt({id:e,label:t,checked:a,className:"webmedia-toggle"})}function Be(e=""){return String(e||"").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[._-]+/g," ").replace(/\s+/g," ").trim().replace(/^./,t=>t.toUpperCase())}function At(e){return e==null||e===""?!0:Array.isArray(e)?e.length===0:typeof e=="object"?Object.keys(e).length===0:!1}function Fe(e,t=""){return At(e)?[]:Array.isArray(e)?e.flatMap((a,s)=>Fe(a,`${t}${t?" ":""}${s+1}`)):typeof e=="object"?Object.entries(e).flatMap(([a,s])=>Fe(s,`${t}${t?" ":""}${Be(a)}`)):[[t||"Value",e]]}async function mi(e){var Xe;V=ai(),d=document.createElement("div"),d.className="tool-webmedia-studio",d.innerHTML=`
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
              ${Object.entries(te).map(([i,n])=>`<option value="${i}">${n.label}</option>`).join("")}
            </select>
          </label>
          <label class="studio-field">
            <span>Tracks</span>
            <select id="webmedia-track-scope" class="studio-select">
              <option value="all">All tracks</option>
              <option value="primary">Primary audio and video</option>
            </select>
          </label>
          ${L("webmedia-remux-only","Remux only",!0)}
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
              ${L("webmedia-inspect-tags","Include tags",!0)}
              ${L("webmedia-inspect-packets","Packet stats")}
              ${L("webmedia-inspect-compatibility","Compatibility",!0)}
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
              ${L("webmedia-remux-faststart","Fast start MP4",!0)}
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
                ${L("webmedia-transcode-prevent-upscale","No upscale")}
                ${L("webmedia-transcode-drop-video","Drop video")}
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
              ${L("webmedia-transcode-drop-audio","Drop audio")}
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
              ${L("webmedia-trim-preserve-timestamps","Preserve timestamps")}
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
                ${L("webmedia-transform-rotation-metadata","Rotation metadata",!0)}
                ${L("webmedia-transform-flip-horizontal","Flip horizontal")}
                ${L("webmedia-transform-flip-vertical","Flip vertical")}
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
              ${L("webmedia-audio-discard-video","Export audio only",!0)}
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
                ${L("webmedia-audio-normalize","Normalize")}
                ${L("webmedia-audio-limiter","Limiter")}
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
                ${L("webmedia-subtitle-import","Import text")}
                ${L("webmedia-subtitle-burn","Burn in")}
                ${L("webmedia-subtitle-background","Text background")}
              </div>
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
                ${L("webmedia-hls-independent","Independent segments",!0)}
                ${L("webmedia-hls-iframe","I-frame playlist")}
                ${L("webmedia-hls-audio-renditions","Audio renditions")}
                ${L("webmedia-hls-caption-rendition","Caption rendition")}
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
  `,e.appendChild(d);const t={shell:d.querySelector(".webmedia-shell"),fileInput:d.querySelector("#webmedia-file-input"),importButton:d.querySelector("#webmedia-import"),dropzone:d.querySelector("#webmedia-dropzone"),fileQueue:d.querySelector("#webmedia-file-queue"),capabilities:d.querySelector("#webmedia-capabilities"),previewCopy:d.querySelector("#webmedia-preview-copy"),previewMedia:d.querySelector("#webmedia-preview-media"),trackStack:d.querySelector("#webmedia-track-stack"),inspectReport:d.querySelector("#webmedia-inspect-report"),metrics:d.querySelector("#webmedia-source-metrics"),targetContainer:d.querySelector("#webmedia-target-container"),trackScope:d.querySelector("#webmedia-track-scope"),videoCodec:d.querySelector("#webmedia-video-codec"),audioCodec:d.querySelector("#webmedia-audio-codec"),remuxOnly:d.querySelector("#webmedia-remux-only"),planSummary:d.querySelector("#webmedia-plan-summary"),mode:d.querySelector("#webmedia-mode"),status:d.querySelector("#webmedia-status"),diagnostics:d.querySelector("#webmedia-diagnostics"),exportButton:d.querySelector("#webmedia-export"),scrub:d.querySelector("#webmedia-scrub"),currentTime:d.querySelector("#webmedia-current-time"),duration:d.querySelector("#webmedia-duration"),trimmerHost:d.querySelector("#webmedia-trimmer-host"),diagnosticModal:d.querySelector("#webmedia-diagnostic-modal"),diagnosticModalTitle:d.querySelector("#webmedia-diagnostic-modal-title"),diagnosticModalBody:d.querySelector("#webmedia-diagnostic-modal-body"),diagnosticModalClose:d.querySelector("#webmedia-diagnostic-modal-close"),outputPreview:d.querySelector("#webmedia-output-preview"),outputDownload:d.querySelector("#webmedia-output-download"),outputVideo:d.querySelector("#webmedia-output-video"),outputAudio:d.querySelector("#webmedia-output-audio"),outputMeta:d.querySelector("#webmedia-output-meta")},a=(i,n="neutral")=>{t.status.textContent=i,t.status.dataset.tone=n};F=Nt(d.querySelector("#webmedia-progress-host"),{stopLabel:"Cancel",onStop(){if(!K){tt("No active export.","info");return}if(!K.controller){a("Cancel unavailable in this browser.","danger");return}K.controller.abort(),F==null||F.update({title:"Canceling export",detail:K.mode,busy:!0,cancellable:!1}),a("Cancel requested.","info"),tt("Cancel requested.","info")}});let s=[],o=!1;const r=()=>{t.shell.classList.toggle("is-empty",!T)},p=i=>{const n=Fe(i);return n.length?`<dl class="webmedia-diagnostic-kv">${n.map(([m,u])=>`
      <div><dt>${k(Be(m))}</dt><dd>${k(u)}</dd></div>
    `).join("")}</dl>`:""},b=(i={})=>{const n=p(i.value??i.detailValue),m=i.message||i.detail||"",u=i.suggestedRoute?`<a class="webmedia-diagnostic-route" href="${k(i.suggestedRoute)}">Open Video Studio</a>`:"";return`
      ${m?`<p>${k(m)}</p>`:""}
      ${n}
      ${u}
    `},v=i=>{const n=s[Number(i)];n&&(t.diagnosticModalTitle.textContent=n.code||n.phase||"Diagnostic",t.diagnosticModalBody.innerHTML=b(n),t.diagnosticModal.classList.remove("hidden"))},C=()=>{t.diagnosticModal.classList.add("hidden")},A=(i={})=>i.message||i.detail||"",z=(i={})=>[i.tone||"neutral",i.code||i.phase||"info",A(i),i.suggestedRoute||""].join("|"),D=(i=[])=>{s=(Array.isArray(i)?i:[]).filter(x=>x?!!(p(x.value??x.detailValue)||A(x)||x.suggestedRoute):!1);const m=s.findIndex(x=>["danger"].includes(x.tone));if(t.shell.classList.toggle("has-urgent-diagnostics",m>=0),!s.length){t.diagnostics.innerHTML="",Ce="";return}if(t.diagnostics.innerHTML=s.map((x,_)=>{const ge=p(x.value??x.detailValue),me=A(x),Re=ge||me||x.suggestedRoute;return`
        <div class="webmedia-diagnostic" data-tone="${x.tone||"neutral"}">
          <div>
            <b>${k(x.code||x.phase||"info")}</b>
            ${me?`<span>${k(me)}</span>`:""}
            ${ge}
          </div>
          ${Re?`<button type="button" class="mini-btn webmedia-diagnostic-detail" data-webmedia-diagnostic-index="${_}">Details</button>`:""}
        </div>
      `}).join(""),m<0){Ce="";return}const u=s[m],y=z(u);y!==Ce&&(Ce=y,v(m))},I=()=>{const i=V.getCapabilities(),n=[{id:"main-decode",label:"Main decode",state:i.main.VideoDecoder&&i.main.AudioDecoder?"ready":"unavailable"},{id:"main-encode",label:"Main encode",state:i.main.VideoEncoder&&i.main.AudioEncoder?"ready":"unavailable"},{id:"worker",label:"Worker WebCodecs",state:i.workerKnown?i.missingWorker.length===0?"ready":"unavailable":"checking"}];t.capabilities.innerHTML=n.map(m=>`
      <div class="webmedia-capability-row" data-webmedia-capability="${m.id}" data-state="${m.state}" data-ready="${m.state==="ready"?"true":"false"}">
        <span>${m.label}</span>
        <b>${m.state==="ready"?"Ready":m.state==="checking"?"Checking":"Unavailable"}</b>
      </div>
    `).join("")},h=()=>{t.fileQueue.innerHTML=we.length?we.map((i,n)=>`
        <button class="webmedia-file-card ${i===T?"active":""}" data-file-index="${n}">
          <strong>${k(i.name||"media")}</strong>
          <span>${k(i.type||"unknown")} - ${ke(i.size)}</span>
        </button>
      `).join(""):'<div class="webmedia-empty">No media loaded.</div>'},w=()=>{Mt(),Me=null,Ae="",ne="",t.outputPreview.classList.add("hidden"),t.outputVideo.classList.add("hidden"),t.outputAudio.classList.add("hidden"),t.outputVideo.removeAttribute("src"),t.outputAudio.removeAttribute("src"),t.outputMeta.innerHTML="",t.outputDownload.disabled=!0},S=(i={})=>{var u;if(w(),!i.blob)return;Me=i.blob,Ae=i.filename||"webmedia-output",ne=i.mime||i.blob.type||"",X=bt(i.blob);const n=ne.startsWith("audio/"),m=ne.startsWith("video/");X&&n&&(t.outputAudio.setAttribute("src",X),t.outputAudio.classList.remove("hidden")),X&&m&&(t.outputVideo.setAttribute("src",X),t.outputVideo.classList.remove("hidden")),t.outputMeta.innerHTML=`
      <div><span>Name</span><strong>${k(Ae)}</strong></div>
      <div><span>Type</span><strong>${k(ne||"application/octet-stream")}</strong></div>
      <div><span>Size</span><strong>${ke(((u=i.summary)==null?void 0:u.bytes)??i.blob.size)}</strong></div>
    `,t.outputDownload.disabled=!1,t.outputPreview.classList.remove("hidden")},M=()=>{if(!g){t.metrics.innerHTML="";return}const i=g.tracks.filter(u=>u.kind==="video").length,n=g.tracks.filter(u=>u.kind==="audio").length,m=g.tracks.filter(u=>u.kind==="subtitle").length;t.metrics.innerHTML=[["Container",g.container||"unknown"],["Duration",oe(g.duration)],["Size",ke(g.size)],["Tracks",`${i} V / ${n} A / ${m} S`]].map(([u,y])=>`<div><span>${u}</span><strong>${k(y)}</strong></div>`).join("")},O=i=>`
    <div class="webmedia-inspect-report-rows">
      ${i.filter(([,n])=>!At(n)).map(([n,m])=>`
          <div class="webmedia-inspect-report-row">
            <span>${k(n)}</span>
            <strong>${k(m)}</strong>
          </div>
        `).join("")}
    </div>
  `,$=(i,n,m="")=>`
    <section class="webmedia-inspect-report-card">
      <div class="webmedia-inspect-report-title">${k(i)}</div>
      ${n!=null&&n.length?O(n):""}
      ${m}
    </section>
  `,q=(i=[])=>{const n=i.reduce((u,y)=>(u[y.kind]=(u[y.kind]||0)+1,u),{}),m=[n.video?`${n.video} video`:"",n.audio?`${n.audio} audio`:"",n.subtitle?`${n.subtitle} subtitle`:""].filter(Boolean);return m.length?`${i.length} tracks (${m.join(", ")})`:"0 tracks"},J=()=>{const i=g.metadata||{},n=Object.entries(i.tags||{}),m=n.length?`<div class="webmedia-inspect-tag-list">${n.map(([u,y])=>`
          <div><span>${k(Be(u))}</span><strong>${k(y)}</strong></div>
        `).join("")}</div>`:'<div class="webmedia-empty">No metadata tags were reported.</div>';return $("Metadata",[["Provider",i.provider||"summary"],["Depth",i.depth||"summary"],["Modified",g.modifiedAt?new Date(g.modifiedAt).toLocaleString():"Unknown"]],m)},ae=()=>{const i=g.tracks.filter(n=>n.kind==="video"&&n.frameRate).map(n=>`${n.id}: ${Number(n.frameRate).toFixed(2)} fps`);return $("Packets",[["Depth",f("webmedia-inspect-depth")],["Packet stats",R("webmedia-inspect-packets")?"On":"Off"],["Sample limit",`${c("webmedia-inspect-packet-limit")} samples`],["Video packet rate",i.join(", ")||"Unknown"],["Compatibility check",R("webmedia-inspect-compatibility")?"On":"Off"]])},Q=()=>{const i=t.targetContainer.value,n=te[i]||te.mp4,m=g.tracks.length?g.tracks.map(u=>{const y=Oe(i,u);return`
          <div class="webmedia-compat-row" data-state="${y?"ready":"blocked"}">
            <span>${k(u.kind)}:${k(u.codec||"unknown")}</span>
            <strong>${y?"Compatible":"Blocked"}</strong>
            <b>${k(pt(u)||u.id)}</b>
          </div>
        `}).join(""):'<div class="webmedia-empty">Track compatibility appears after media inspection.</div>';return $("Compatibility",[["Target",n.label],["Container",i],["Track policy",f("webmedia-track-scope")]],`<div class="webmedia-compat-list">${m}</div>`)},ie=()=>$("Summary",[["File",g.fileName],["Container",g.container||"unknown"],["Mime",g.mime||"unknown"],["Duration",oe(g.duration)],["Size",ke(g.size)],["Tracks",q(g.tracks)]]),B=()=>{if(!t.inspectReport)return;if(!g){t.inspectReport.innerHTML=$("Inspect",[["Status","Import media to populate the report"]]);return}const i=f("webmedia-inspect-depth")||"metadata";i==="summary"?t.inspectReport.innerHTML=ie():i==="packets"?t.inspectReport.innerHTML=ae():i==="compatibility"?t.inspectReport.innerHTML=Q():t.inspectReport.innerHTML=J()},f=i=>{var n;return((n=d.querySelector(`#${i}`))==null?void 0:n.value)||""},R=i=>{var n;return((n=d.querySelector(`#${i}`))==null?void 0:n.checked)===!0},c=i=>ni(d.querySelector(`#${i}`)),Ct=()=>Object.fromEntries(Object.entries({title:f("webmedia-meta-title"),artist:f("webmedia-meta-artist"),album:f("webmedia-meta-album"),genre:f("webmedia-meta-genre"),date:f("webmedia-meta-date"),copyright:f("webmedia-meta-copyright"),comment:f("webmedia-meta-comment"),description:f("webmedia-meta-description")}).filter(([,i])=>i)),Tt=()=>({inspect:{depth:f("webmedia-inspect-depth"),packetSampleLimit:c("webmedia-inspect-packet-limit"),includeTags:R("webmedia-inspect-tags"),includePackets:R("webmedia-inspect-packets"),includeCompatibility:R("webmedia-inspect-compatibility")},tracks:t.trackScope.value,remux:{remuxOnly:t.remuxOnly.checked,trackPolicy:f("webmedia-remux-track-policy"),timestampPolicy:f("webmedia-remux-timestamp-policy"),rotationPolicy:f("webmedia-remux-rotation-policy"),fastStart:R("webmedia-remux-faststart"),interleaveMs:c("webmedia-remux-interleave"),chapterPolicy:f("webmedia-remux-chapters"),attachmentPolicy:f("webmedia-remux-attachments"),metadataPolicy:f("webmedia-remux-metadata-policy")},transcode:{preset:f("webmedia-transcode-preset"),speedPreset:f("webmedia-transcode-speed-preset"),videoCodec:t.videoCodec.value,audioCodec:t.audioCodec.value,rateControl:f("webmedia-transcode-rate-control"),quality:c("webmedia-transcode-quality"),videoBitrateKbps:c("webmedia-transcode-video-bitrate"),maxVideoBitrateKbps:c("webmedia-transcode-max-video-bitrate"),bufferSizeKbps:c("webmedia-transcode-buffer-size"),audioBitrateKbps:c("webmedia-transcode-audio-bitrate"),width:c("webmedia-transcode-width"),height:c("webmedia-transcode-height"),fit:f("webmedia-transcode-fit"),preventUpscale:R("webmedia-transcode-prevent-upscale"),frameRate:c("webmedia-transcode-frame-rate"),keyFrameInterval:c("webmedia-transcode-keyframe"),hardwareAcceleration:f("webmedia-transcode-hardware"),alpha:f("webmedia-transcode-alpha"),latencyMode:f("webmedia-transcode-latency"),tune:f("webmedia-transcode-tune"),bitDepth:c("webmedia-transcode-bit-depth"),colorSpace:f("webmedia-transcode-color-space"),sampleRate:c("webmedia-transcode-sample-rate"),channels:c("webmedia-transcode-channels"),sampleFormat:f("webmedia-transcode-sample-format"),discardVideo:R("webmedia-transcode-drop-video"),discardAudio:R("webmedia-transcode-drop-audio")},trim:{start:c("webmedia-trim-start"),end:c("webmedia-trim-end"),duration:c("webmedia-trim-duration"),mode:f("webmedia-trim-mode"),snapPolicy:f("webmedia-trim-snap-policy"),preroll:c("webmedia-trim-preroll"),postroll:c("webmedia-trim-postroll"),preserveTimestamps:R("webmedia-trim-preserve-timestamps"),fadeIn:c("webmedia-trim-fade-in"),fadeOut:c("webmedia-trim-fade-out")},transform:{width:c("webmedia-transform-width"),height:c("webmedia-transform-height"),fit:f("webmedia-transform-fit"),rotate:c("webmedia-transform-rotate"),allowRotationMetadata:R("webmedia-transform-rotation-metadata"),crop:{x:c("webmedia-transform-crop-x"),y:c("webmedia-transform-crop-y"),width:c("webmedia-transform-crop-width"),height:c("webmedia-transform-crop-height")},frameRate:c("webmedia-transform-frame-rate"),anchor:f("webmedia-transform-anchor"),scale:c("webmedia-transform-scale"),x:c("webmedia-transform-x"),y:c("webmedia-transform-y"),flipHorizontal:R("webmedia-transform-flip-horizontal"),flipVertical:R("webmedia-transform-flip-vertical"),background:f("webmedia-transform-background"),color:{exposure:c("webmedia-transform-exposure"),contrast:c("webmedia-transform-contrast"),saturation:c("webmedia-transform-saturation"),temperature:c("webmedia-transform-temperature"),tint:c("webmedia-transform-tint"),gamma:c("webmedia-transform-gamma")},effects:{sharpen:c("webmedia-transform-sharpen"),denoise:c("webmedia-transform-denoise"),grain:c("webmedia-transform-grain"),blur:c("webmedia-transform-blur")}},audio:{mode:f("webmedia-audio-mode"),audioCodec:f("webmedia-audio-output-codec"),audioBitrateKbps:c("webmedia-audio-bitrate"),sampleRate:c("webmedia-audio-sample-rate"),channels:c("webmedia-audio-channels"),sampleFormat:f("webmedia-audio-sample-format"),discardVideo:R("webmedia-audio-discard-video"),gainDb:c("webmedia-audio-gain"),normalize:R("webmedia-audio-normalize"),normalizeTargetDb:c("webmedia-audio-normalize-target"),limiter:R("webmedia-audio-limiter"),fadeIn:c("webmedia-audio-fade-in"),fadeOut:c("webmedia-audio-fade-out"),pan:c("webmedia-audio-pan"),highpassHz:c("webmedia-audio-highpass"),lowpassHz:c("webmedia-audio-lowpass"),compressorThreshold:c("webmedia-audio-compressor-threshold"),compressorRatio:c("webmedia-audio-compressor-ratio")},subtitles:{mode:f("webmedia-subtitle-mode"),importText:R("webmedia-subtitle-import"),burnIn:R("webmedia-subtitle-burn"),language:f("webmedia-subtitle-language"),sourceFormat:f("webmedia-subtitle-source-format"),offset:c("webmedia-subtitle-offset"),fontSize:c("webmedia-subtitle-font-size"),position:f("webmedia-subtitle-position"),outline:c("webmedia-subtitle-outline"),background:R("webmedia-subtitle-background")},hls:{segmentDuration:c("webmedia-hls-segment-duration"),playlistType:f("webmedia-hls-playlist-type"),variantLadder:f("webmedia-hls-variant-ladder"),independentSegments:R("webmedia-hls-independent"),iframePlaylist:R("webmedia-hls-iframe"),audioRenditions:R("webmedia-hls-audio-renditions"),captionRendition:R("webmedia-hls-caption-rendition")},metadata:Ct()}),le=()=>Math.max(0,Number((g==null?void 0:g.duration)||t.previewMedia.duration||0)),ye=(i,n)=>{const m=le(),u=m||Math.max(Number(i)||0,Number(n)||0,0),y=Ee(i,0,u),x=Number(n)||m||y,_=Ee(x,y,u||y);return E(d,"webmedia-trim-start",y.toFixed(2)),E(d,"webmedia-trim-end",_.toFixed(2)),E(d,"webmedia-trim-duration",Math.max(0,_-y).toFixed(2)),{start:y,end:_}},Te=i=>{const n=le(),m=Ee(i,0,n||Math.max(0,Number(i)||0));t.currentTime.textContent=oe(m),t.duration.textContent=oe(n),t.scrub.value=n?String(Ee(m/n*100,0,100)):"0"},Ie=()=>{var n,m;const i=(m=(n=t.previewMedia).play)==null?void 0:m.call(n);i&&typeof i.catch=="function"&&i.catch(()=>{})},ze=()=>{var i,n;(n=(i=t.previewMedia).pause)==null||n.call(i)},ce=(i,n={})=>{const m=le(),u=Ee(i,0,m||Math.max(0,Number(i)||0));try{t.previewMedia.currentTime=u}catch{}Te(u),n.syncTrimmer!==!1&&(l==null||l.setPlayhead(u,n.reason||"external")),n.play&&Ie()},qe=(i={})=>{if(!l)return;const n=Math.max(.1,le()||.1),m=c("webmedia-trim-start"),u=c("webmedia-trim-end"),y=c("webmedia-trim-duration"),x=i.fromDuration?m+y:u||n,_=ye(m,x);l.setDuration(n),l.setRange(_.start,_.end||n,!1),l.setFades(c("webmedia-trim-fade-in"),c("webmedia-trim-fade-out"),!1)},xt=()=>{ve+=1,ye(0,0),Te(0),l==null||l.setLoading({visible:!1}),l==null||l.setWaveform(null),l==null||l.setSamples(null,0),l==null||l.setFrameStrip([]),l==null||l.setDuration(.1),l==null||l.setZoom(1,!1),l==null||l.setRange(0,.1,!1),l==null||l.clearPlayhead(),l==null||l.setPlaying(!1)},Ve=()=>{if(!l)return;const i=Math.max(.1,le()||.1),n=c("webmedia-trim-start"),m=c("webmedia-trim-end")||i,u=ye(n,m);l.setDuration(i),l.setZoom(1,!1),l.setRange(u.start,u.end||i,!1),l.setFades(c("webmedia-trim-fade-in"),c("webmedia-trim-fade-out"),!1),l.setPlayhead(Number(t.previewMedia.currentTime)||u.start,"external"),l.setPlaying(t.previewMedia.paused===!1),Te(Number(t.previewMedia.currentTime)||0)},Rt=()=>typeof HTMLMediaElement=="function"&&typeof Worker=="function"&&typeof Blob=="function",_e=async()=>{var m;if(!l||!T||!Rt())return;const i=++ve;l.setWaveform(null),l.setSamples(null,0),l.setFrameStrip([]),l.setLoading({visible:!0,title:"Preparing waveform",detail:"Analyzing local media...",progress:8});try{const u=await $t({file:T,fileName:T.name||"media",cacheKey:`${T.name||"media"}:${T.size}:${T.lastModified||0}`,maxBins:32768,includeSamples:!0,maxSampleFrames:2e6,onEvent(y){!l||i!==ve||y.type==="waveform-status"&&l.setLoading({visible:y.payload.phase!=="complete",title:"Preparing waveform",detail:y.payload.message,progress:y.payload.phase==="complete"?100:72})}});if(i!==ve||!l)return;if((m=u==null?void 0:u.levels)!=null&&m.length){l.setWaveform(u),l.setSamples(u.samples,u.samplesSampleRate||u.sampleRate),l.setLoading({visible:!1});return}}catch{}const n=await Ft({file:T,count:12,width:104,height:58});i!==ve||!l||(l.setFrameStrip(n),l.setLoading({visible:!1}))},We=()=>{const i=f("webmedia-transcode-preset");i==="web-mp4"&&(t.targetContainer.value="mp4",t.videoCodec.value="avc",t.audioCodec.value="aac",E(d,"webmedia-transcode-rate-control","bitrate"),E(d,"webmedia-transcode-video-bitrate",4500),E(d,"webmedia-transcode-audio-bitrate",160),E(d,"webmedia-transcode-width",1920),E(d,"webmedia-transcode-height",1080),E(d,"webmedia-transcode-fit","contain"),be(d,"webmedia-transcode-drop-video",!1),be(d,"webmedia-transcode-drop-audio",!1)),i==="webm"&&(t.targetContainer.value="webm",t.videoCodec.value="vp9",t.audioCodec.value="opus",E(d,"webmedia-transcode-video-bitrate",3200),E(d,"webmedia-transcode-audio-bitrate",128)),i==="social"&&(t.targetContainer.value="mp4",t.videoCodec.value="avc",t.audioCodec.value="aac",E(d,"webmedia-transcode-video-bitrate",6e3),E(d,"webmedia-transcode-audio-bitrate",192),E(d,"webmedia-transcode-width",1080),E(d,"webmedia-transcode-height",1080),E(d,"webmedia-transcode-fit","cover")),i==="audio-only"&&(t.targetContainer.value="mp3",be(d,"webmedia-transcode-drop-video",!0),be(d,"webmedia-transcode-drop-audio",!1),t.audioCodec.value="mp3"),i==="lossless-audio"&&(t.targetContainer.value="flac",be(d,"webmedia-transcode-drop-video",!0),t.audioCodec.value="flac",E(d,"webmedia-transcode-rate-control","lossless")),i==="hls-package"&&(t.targetContainer.value="hls",t.videoCodec.value="avc",t.audioCodec.value="aac")},Lt=()=>{const i=mt[f("webmedia-transcode-speed-preset")]||mt.medium;E(d,"webmedia-transcode-rate-control",i.rateControl),E(d,"webmedia-transcode-quality",i.quality),E(d,"webmedia-transcode-video-bitrate",i.videoBitrateKbps),E(d,"webmedia-transcode-max-video-bitrate",i.maxVideoBitrateKbps),E(d,"webmedia-transcode-buffer-size",i.bufferSizeKbps),E(d,"webmedia-transcode-audio-bitrate",i.audioBitrateKbps),E(d,"webmedia-transcode-frame-rate",i.frameRate),E(d,"webmedia-transcode-keyframe",i.keyFrameInterval),E(d,"webmedia-transcode-hardware",i.hardwareAcceleration),E(d,"webmedia-transcode-latency",i.latencyMode),be(d,"webmedia-transcode-prevent-upscale",!0)},Ue=()=>{d.querySelectorAll("[data-webmedia-settings]").forEach(i=>{i.classList.toggle("active",i.dataset.webmediaSettings===Y)})},Ot=i=>{var y,x,_,ge,me,Re,Ze;if(!i)return[];const n=V.getCapabilities(),m=Object.entries(((y=i.conversion)==null?void 0:y.adjustments)||{}).flatMap(([he,Pt])=>Object.keys(Pt||{}).map(It=>`${he}.${It}`)),u=[{code:"Source",message:`${i.source.container} / ${oe(i.source.duration)} / ${i.source.tracks.length} tracks`},{code:"Output",message:`${Pe(i.source.fileName,i)} / ${i.output.mime}`},{code:"Execution",message:`${i.execution} / ${i.requiresReencode?"reencode":"packet copy"} / tracks ${((x=i.conversion)==null?void 0:x.tracks)||"all"}`},{code:"Worker",message:n.workerKnown?n.missingWorker.length?`Missing ${n.missingWorker.join(", ")}`:"WebCodecs ready":"Checking WebCodecs"},{code:"Video",value:((_=i.conversion)==null?void 0:_.video)||{}},{code:"Audio",value:((ge=i.conversion)==null?void 0:ge.audio)||{}},{code:"Trim",value:((me=i.conversion)==null?void 0:me.trim)||{}},{code:"Mux",value:((Re=i.conversion)==null?void 0:Re.mux)||{}},{code:"Profile",value:((Ze=i.conversion)==null?void 0:Ze.profile)||{}},{code:"Adjustments",message:m.length?m.join(", "):"None"}];return[...i.errors.map(he=>({...he,tone:"danger"})),...i.warnings.map(he=>({...he,tone:"warning"})),...u]},xe=()=>{if(r(),!g){Ne(),t.previewCopy.innerHTML=T?`<strong>${k(T.name||"media")}</strong><span>Inspecting local tracks.</span>`:"<strong>No file selected</strong><span>Import a media file to inspect its local track plan.</span>",t.previewCopy.classList.remove("hidden"),t.previewMedia.removeAttribute("src"),t.previewMedia.classList.remove("is-visible"),t.trackStack.innerHTML="",t.metrics.innerHTML="",xt(),B(),D([]);return}Ne(),se=bt(T),se?(t.previewMedia.setAttribute("src",se),t.previewMedia.classList.add("is-visible"),t.previewCopy.classList.add("hidden")):(t.previewMedia.removeAttribute("src"),t.previewMedia.classList.remove("is-visible"),t.previewCopy.classList.remove("hidden")),t.previewCopy.innerHTML=`
      <strong>${k(g.fileName)}</strong>
      <span>${k(g.container)} - ${ke(g.size)} - ${oe(g.duration)}</span>
    `,t.duration.textContent=oe(g.duration),ye(0,g.duration),Ve(),_e(),t.trackStack.innerHTML=g.tracks.length?g.tracks.map(i=>`
        <div class="webmedia-track" data-kind="${k(i.kind)}">
          <div>
            <strong>${k(i.kind)}</strong>
            <span>${k(pt(i))}</span>
          </div>
          <b>${i.decodable?"Decodable":"Unknown"}</b>
        </div>
      `).join(""):'<div class="webmedia-empty">Track-level metadata appears after deeper browser inspection.</div>',M(),B(),D(g.warnings||[])},ue=async()=>{var y;if(!g&&!T)return a("Import a file first.","danger"),null;const i=g||{fileName:T.name,mime:T.type,size:T.size,tracks:[]},n=Tt(),m={operation:Y,source:i,targetContainer:t.targetContainer.value,remuxOnly:n.remux.remuxOnly,settings:n};return P=(await V.plan(m)).plan||wt(m),t.mode.textContent=P.mode,t.exportButton.textContent=P.operation==="inspect"?"Export Inspect JSON":`Export ${P.mode} .${P.output.extension}`,t.planSummary.innerHTML=`
      <div class="webmedia-plan-mode" data-mode="${k(P.mode)}">${k(P.mode)}</div>
      <div>Output: ${k(Pe(P.source.fileName,P))}</div>
      <div>Container: ${k(P.output.label)}</div>
      <div>Reencode: ${P.requiresReencode?"Required":"No"}</div>
      <div>Execution: ${k(P.execution)}</div>
      <div>Adjustments: ${k(Object.keys(((y=P.conversion)==null?void 0:y.adjustments)||{}).filter(x=>Object.keys(P.conversion.adjustments[x]||{}).length).join(", ")||"None")}</div>
    `,D(Ot(P)),B(),a(P.errors.length?"Plan blocked.":"Plan ready.",P.errors.length?"danger":"success"),P},Z=(i=0)=>{!g&&!T||(re&&clearTimeout(re),re=setTimeout(()=>{re=0,ue().catch(n=>{D([{code:n.code||"PLAN_FAILED",message:n.message,tone:"danger"}]),a(n.message,"danger")})},i))};l==null||l.destroy(),l=Dt({mount:t.trimmerHost,idPrefix:"webmedia",duration:.1,start:0,end:.1,playhead:0,minSpan:.01,showSeekAutoplayToggle:!0,isLooping:o,onChange(i){ye(i.start,i.end),E(d,"webmedia-trim-fade-in",i.fadeIn||0),E(d,"webmedia-trim-fade-out",i.fadeOut||0),Z()},onRulerSeek({time:i,isSeekAutoplayEnabled:n}){ce(i,{syncTrimmer:!1,play:n})},onPlayheadChange({time:i,reason:n,isSeekAutoplayEnabled:m}){["seek","ruler-click"].includes(n)&&ce(i,{syncTrimmer:!1,play:m})},onTogglePlayback({isPlaying:i,time:n}){Number.isFinite(n)&&ce(n,{syncTrimmer:!1}),i?Ie():ze()},onLoopChange({isLooping:i}){o=i}});const Ke=async()=>{if(!T)return;a("Inspecting...","info"),F.update({title:"Inspecting media",detail:T.name,busy:!0}),g=(await V.inspectFile(T,{onEvent(n){n.type==="progress"&&F.update({title:"Inspecting media",detail:n.payload.phase,progress:n.payload.percent,busy:n.payload.percent<100})}})).inspection,xe(),await ue(),F.update({title:"Inspection ready",tone:"success",autoResetMs:1200})},He=async i=>{we=Array.from(i||[]),T=we[0]||null,g=null,P=null,w(),h(),xe(),T&&await Ke()};t.importButton.addEventListener("click",()=>t.fileInput.click()),t.fileInput.addEventListener("change",i=>He(i.target.files));const Ge=i=>{i.preventDefault(),i.stopPropagation(),t.dropzone.classList.add("is-dragging")},Je=i=>{i.preventDefault(),i.stopPropagation(),t.dropzone.classList.remove("is-dragging")},Qe=i=>{var n;i.preventDefault(),i.stopPropagation(),t.dropzone.classList.remove("is-dragging"),He(((n=i.dataTransfer)==null?void 0:n.files)||[])};t.dropzone.addEventListener("dragover",Ge),t.dropzone.addEventListener("dragleave",Je),t.dropzone.addEventListener("drop",Qe),d.addEventListener("dragover",Ge),d.addEventListener("dragleave",Je),d.addEventListener("drop",Qe),t.fileQueue.addEventListener("click",async i=>{const n=i.target.closest("[data-file-index]");n&&(T=we[Number(n.dataset.fileIndex)]||null,g=null,h(),xe(),await Ke())}),d.querySelectorAll("[data-webmedia-operation]").forEach(i=>{i.addEventListener("click",async()=>{Y=i.dataset.webmediaOperation,d.querySelectorAll("[data-webmedia-operation]").forEach(n=>n.classList.toggle("active",n===i)),Ue(),Y==="audio"&&(t.targetContainer.value="mp3"),Y==="hls"&&(t.targetContainer.value="hls"),Y==="subtitles"&&(t.targetContainer.value="mp4"),Y==="transcode"&&We(),t.remuxOnly.checked=Y==="remux",await ue()})}),d.querySelectorAll("[data-webmedia-inspect-depth]").forEach(i=>{i.addEventListener("click",()=>{E(d,"webmedia-inspect-depth",i.dataset.webmediaInspectDepth),d.querySelectorAll("[data-webmedia-inspect-depth]").forEach(n=>{n.classList.toggle("active",n===i)}),B(),Z()})}),t.diagnostics.addEventListener("click",i=>{const n=i.target.closest("[data-webmedia-diagnostic-index]");n&&v(n.dataset.webmediaDiagnosticIndex)}),t.diagnosticModalClose.addEventListener("click",C),t.diagnosticModal.addEventListener("click",i=>{i.target===t.diagnosticModal&&C()}),t.outputDownload.addEventListener("click",()=>{Me&&et(Me,Ae,ne)}),t.previewMedia.addEventListener("loadedmetadata",()=>{Ve(),_e()}),t.previewMedia.addEventListener("timeupdate",()=>{var m,u;const i=Number(t.previewMedia.currentTime)||0,n=(m=l==null?void 0:l.getRange)==null?void 0:m.call(l);if(n&&i>n.end){o?(ce(n.start,{reason:"loop"}),Ie()):(ze(),ce(n.start,{reason:"ended"}),(u=l==null?void 0:l.emitEnded)==null||u.call(l));return}Te(i),l==null||l.setPlayhead(i,"preview")}),t.previewMedia.addEventListener("play",()=>l==null?void 0:l.setPlaying(!0)),t.previewMedia.addEventListener("pause",()=>l==null?void 0:l.setPlaying(!1)),t.scrub.addEventListener("input",()=>{const i=le();ce(i*Number(t.scrub.value||0)/100,{reason:"scrub"})}),[t.targetContainer,t.videoCodec,t.audioCodec,t.trackScope,t.remuxOnly].forEach(i=>{i.addEventListener("change",()=>{B(),Z()})});const Ye=new Set(["webmedia-trim-start","webmedia-trim-end","webmedia-trim-duration","webmedia-trim-fade-in","webmedia-trim-fade-out"]);Ye.forEach(i=>{const n=d.querySelector(`#${i}`);n==null||n.addEventListener("input",()=>{qe({fromDuration:i==="webmedia-trim-duration"}),Z(120)}),n==null||n.addEventListener("change",()=>{qe({fromDuration:i==="webmedia-trim-duration"}),Z()})}),d.querySelector("#webmedia-transcode-preset").addEventListener("change",async()=>{We(),await ue()}),d.querySelector("#webmedia-transcode-speed-preset").addEventListener("change",async()=>{Lt(),await ue()}),d.querySelectorAll(".webmedia-settings input, .webmedia-settings select").forEach(i=>{i.id!=="webmedia-transcode-preset"&&i.id!=="webmedia-transcode-speed-preset"&&(Ye.has(i.id)||(i.addEventListener("input",()=>{B(),Z(120)}),i.addEventListener("change",()=>{B(),Z()})))}),d.querySelectorAll(".webmedia-common-controls input, .webmedia-common-controls select").forEach(i=>{i.addEventListener("change",()=>{B(),Z()})}),t.exportButton.addEventListener("click",async()=>{const i=P||await ue();if(!i||i.errors.length)return;if(K){a("Export already running.","info");return}const n=`webmedia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,m=typeof AbortController=="function"?new AbortController:null;K={jobId:n,controller:m,mode:i.mode};try{F.update({title:"Running web media job",detail:i.mode,busy:!0,cancellable:!0});const u=await V.run(i,{jobId:n,mediaFile:T,signal:m==null?void 0:m.signal,onEvent(y){y.type==="progress"&&F.update({title:"Running web media job",detail:y.payload.phase,progress:y.payload.percent,busy:y.payload.percent<100,cancellable:!0})}});u.blob&&(S(u),et(u.blob,u.filename,u.mime)),F.update({title:"Export ready",tone:"success",progress:100,autoResetMs:1400}),a("Export ready.","success")}catch(u){const y=u.code==="JOB_CANCELED";F.update({title:y?"Export canceled":"Export blocked",detail:u.message,tone:y?"warning":"danger"}),D([{code:u.code||"EXPORT_BLOCKED",message:u.message,tone:y?"warning":"danger"}]),a(y?"Export canceled.":u.suggestedRoute?"Use Video Studio for this job.":u.message,y?"warning":"danger")}finally{(K==null?void 0:K.jobId)===n&&(K=null)}}),I(),(Xe=V.probeCapabilities)==null||Xe.call(V).then(()=>{d&&I()}),Ue(),h(),xe(),D()}function pi(){re&&clearTimeout(re),F==null||F.destroy(),l==null||l.destroy(),V==null||V.dispose(),Ne(),Mt(),d==null||d.remove(),re=0,F=null,l=null,ve+=1,V=null,d=null,we=[],T=null,g=null,Y="inspect",P=null,K=null,Me=null,Ae="",ne="",Ce=""}export{mi as mount,pi as unmount};
