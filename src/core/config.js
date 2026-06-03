export const CONFIG = {
  title: 'Jelodar Tools',
  tagline: 'Local browser tools for engineering, media, and text work.',
  domain: 'tools.jelodar.net'
};

export const CATEGORIES = [
  { id: 'dev', title: 'Development', icon: 'code' },
  { id: 'crypto', title: 'Security & Crypto', icon: 'shield' },
  { id: 'media', title: 'Media & Design', icon: 'image' },
  { id: 'data', title: 'Data & Text', icon: 'text' },
  { id: 'time', title: 'Time & Units', icon: 'clock' },
  { id: 'network', title: 'Network & DevOps', icon: 'globe' }
];

export const TOOLS = [
  { id: 'home', path: '/', category: null, title: 'Dashboard', description: 'Overview of the available browser-native tools and studios.', icon: 'home', keywords: ['home', 'overview', 'start', 'tools'] },
  
  // Development
  { id: 'radix-converter', path: '/radix-converter', category: 'dev', title: 'Radix Converter', description: 'Convert binary, octal, decimal, and hexadecimal values inside Code Studio.', icon: 'code', keywords: ['base', 'binary', 'hex', 'octal', 'decimal', 'radix', 'code studio utilities'] },
  { id: 'base-calc', path: '/base-calc', category: 'dev', title: 'Radix Converter', description: 'Compatibility route that opens Radix Converter.', icon: 'code', keywords: ['base calc', 'radix converter', 'binary', 'hex', 'octal', 'decimal'], hidden: true, aliasFor: 'radix-converter' },
  { id: 'json-studio', path: '/json-studio', category: 'dev', title: 'JSON Studio', description: 'Format, validate, query, and export JSON from one workspace.', icon: 'json', keywords: ['json', 'format', 'validate', 'query', 'jsonpath', 'minify'] },
  { id: 'json-suite', path: '/json-suite', category: 'dev', title: 'JSON Studio', description: 'Compatibility route that opens JSON Studio.', icon: 'json', keywords: ['json suite', 'json studio', 'format', 'validate', 'query'], hidden: true, aliasFor: 'json-studio' },
  { id: 'json-quick-format', path: '/json-quick-format', category: 'dev', title: 'JSON Quick Format', description: 'Focused formatting view inside JSON Studio.', icon: 'json', keywords: ['json formatter', 'pretty print', 'beautify', 'json studio format mode'] },
  { id: 'json-formatter', path: '/json-formatter', category: 'dev', title: 'JSON Quick Format', description: 'Compatibility route that opens JSON Quick Format.', icon: 'json', keywords: ['json formatter', 'json quick format', 'pretty print', 'beautify'], hidden: true, aliasFor: 'json-quick-format' },
  { id: 'code-studio', path: '/code-studio', category: 'dev', title: 'Code Studio', description: 'Code workspace with multi-mode formatting, optimization, and AI assist.', icon: 'code', keywords: ['editor', 'monaco', 'autocomplete', 'ai code', 'draft', 'code studio', 'formatter', 'minify', 'obfuscate'] },
  { id: 'code-editor', path: '/code-editor', category: 'dev', title: 'Code Studio', description: 'Compatibility route that opens Code Studio.', icon: 'code', keywords: ['code editor', 'code studio', 'monaco', 'formatter'], hidden: true, aliasFor: 'code-studio' },
  { id: 'diff-checker', path: '/diff-checker', category: 'dev', title: 'Diff Checker', description: 'Compare text and files side by side.', icon: 'diff', keywords: ['diff', 'compare', 'patch', 'changes'] },
  { id: 'sqlite-manager', path: '/sqlite-manager', category: 'dev', title: 'SQLite Manager', description: 'Inspect SQLite files and run queries locally.', icon: 'database', keywords: ['sqlite', 'database', 'sql', 'query', 'db browser'] },
  { id: 'sqlite-explorer', path: '/sqlite-explorer', category: 'dev', title: 'SQLite Manager', description: 'Compatibility route that opens SQLite Manager.', icon: 'database', keywords: ['sqlite explorer', 'sqlite manager', 'database', 'sql'], hidden: true, aliasFor: 'sqlite-manager' },
  { id: 'hex-editor', path: '/hex-editor', category: 'dev', title: 'Hex Editor', description: 'Inspect, search, and patch file bytes with a large-file hex suite.', icon: 'list', keywords: ['hex', 'bytes', 'binary file', 'buffer', 'patch', 'search', 'bookmark'] },
  { id: 'js-obfuscation', path: '/js-obfuscation', category: 'dev', title: 'JS Obfuscation', description: 'Obfuscate JavaScript inside Code Studio optimizer mode.', icon: 'lock', keywords: ['obfuscate', 'obfuscator', 'protect', 'rename', 'javascript', 'code studio optimizer'] },
  { id: 'js-obfuscator', path: '/js-obfuscator', category: 'dev', title: 'JS Obfuscation', description: 'Compatibility route that opens JS Obfuscation.', icon: 'lock', keywords: ['js obfuscator', 'js obfuscation', 'obfuscate', 'javascript'], hidden: true, aliasFor: 'js-obfuscation' },
  { id: 'js-minify', path: '/js-minify', category: 'dev', title: 'JS Minify', description: 'Minify JavaScript inside Code Studio optimizer mode.', icon: 'code', keywords: ['minify', 'minifier', 'compress', 'terser', 'javascript', 'code studio optimizer'] },
  { id: 'minifier', path: '/minifier', category: 'dev', title: 'JS Minify', description: 'Compatibility route that opens JS Minify.', icon: 'code', keywords: ['minifier', 'js minify', 'compress', 'terser'], hidden: true, aliasFor: 'js-minify' },
  { id: 'sql-format', path: '/sql-format', category: 'dev', title: 'SQL Format', description: 'Format SQL queries inside Code Studio formatter mode.', icon: 'database', keywords: ['sql', 'formatter', 'pretty print', 'query format', 'code studio formatter'] },
  { id: 'sql-formatter', path: '/sql-formatter', category: 'dev', title: 'SQL Format', description: 'Compatibility route that opens SQL Format.', icon: 'database', keywords: ['sql formatter', 'sql format', 'pretty print', 'query format'], hidden: true, aliasFor: 'sql-format' },
  { id: 'web-formatter', path: '/web-formatter', category: 'dev', title: 'Web Formatter', description: 'Format HTML, CSS, JavaScript, and related web text inside Code Studio.', icon: 'code', keywords: ['formatter', 'prettier', 'sql formatter', 'code studio formatter'] },
  { id: 'web-formatters', path: '/web-formatters', category: 'dev', title: 'Web Formatter', description: 'Compatibility route that opens Web Formatter.', icon: 'code', keywords: ['web formatters', 'web formatter', 'prettier', 'format'], hidden: true, aliasFor: 'web-formatter' },

  
  // Security & Crypto
  { id: 'uuid-generator', path: '/uuid-generator', category: 'crypto', title: 'UUID Generator', description: 'Generate UUID v4 and v7 identifiers locally.', icon: 'key', keywords: ['uuid', 'guid', 'v4', 'v7'] },
  { id: 'key-pair-generator', path: '/key-pair-generator', category: 'crypto', title: 'Key Pair Generator', description: 'Generate RSA and ECDSA key pairs locally.', icon: 'shield', keywords: ['rsa', 'ecdsa', 'public key', 'private key', 'pem'] },
  { id: 'key-generator', path: '/key-generator', category: 'crypto', title: 'Key Pair Generator', description: 'Compatibility route that opens Key Pair Generator.', icon: 'shield', keywords: ['key generator', 'key pair generator', 'rsa', 'ecdsa'], hidden: true, aliasFor: 'key-pair-generator' },
  { id: 'hash-generator', path: '/hash-generator', category: 'crypto', title: 'Hash Generator', description: 'Hash text and files with common digest algorithms.', icon: 'hash', keywords: ['sha', 'md5', 'blake', 'digest', 'checksum'] },
  { id: 'jwt-decoder', path: '/jwt-decoder', category: 'crypto', title: 'JWT Decoder', description: 'Decode tokens and inspect claims locally.', icon: 'lock', keywords: ['jwt', 'token', 'claims', 'decode'] },
  { id: 'certificate-inspector', path: '/certificate-inspector', category: 'crypto', title: 'Certificate Inspector', description: 'Parse X.509 certificates and CSRs.', icon: 'shield', keywords: ['certificate', 'csr', 'x509', 'pem'] },
  { id: 'cert-tools', path: '/cert-tools', category: 'crypto', title: 'Certificate Inspector', description: 'Compatibility route that opens Certificate Inspector.', icon: 'shield', keywords: ['cert tools', 'certificate inspector', 'csr', 'x509'], hidden: true, aliasFor: 'certificate-inspector' },
  { id: 'text-encryption', path: '/text-encryption', category: 'crypto', title: 'Text Encryption', description: 'Encrypt and decrypt text in the browser.', icon: 'lock', keywords: ['encrypt', 'decrypt', 'aes', 'secret'] },
  { id: 'crypto-encryption', path: '/crypto-encryption', category: 'crypto', title: 'Text Encryption', description: 'Compatibility route that opens Text Encryption.', icon: 'lock', keywords: ['crypto encryption', 'text encryption', 'encrypt', 'decrypt'], hidden: true, aliasFor: 'text-encryption' },
  { id: 'password-generator', path: '/password-generator', category: 'crypto', title: 'Password Generator', description: 'Generate high-entropy passwords locally.', icon: 'key', keywords: ['password', 'passphrase', 'secret', 'entropy'] },
  { id: 'password-gen', path: '/password-gen', category: 'crypto', title: 'Password Generator', description: 'Compatibility route that opens Password Generator.', icon: 'key', keywords: ['password gen', 'password generator', 'passphrase'], hidden: true, aliasFor: 'password-generator' },
  
  // Media & Design
  { id: 'archive-tools', path: '/archive-tools', category: 'media', title: 'Archive Tools', description: 'Bundle files and inspect archive queues locally.', icon: 'layers', keywords: ['zip', 'archive', 'bundle', 'files'] },
  { id: 'audio-tools', path: '/audio-tools', category: 'media', title: 'Audio Tools', description: 'Generate tones and test audio output.', icon: 'audio', keywords: ['tone', 'frequency', 'speaker test', 'audio', 'audio suite'] },
  { id: 'video-studio', path: '/video-studio', category: 'media', title: 'Video Studio', description: 'Edit, subtitle, mix, and render local media with FFmpeg.', icon: 'video', keywords: ['ffmpeg', 'video studio', 'audio convert', 'transcode', 'crop', 'subtitle', 'mixer'] },
  { id: 'media-transcoder', path: '/media-transcoder', category: 'media', title: 'Video Studio', description: 'Compatibility route that opens Video Studio.', icon: 'video', keywords: ['ffmpeg', 'video studio', 'media transcoder', 'transcode', 'crop', 'subtitle', 'mixer'], hidden: true, aliasFor: 'video-studio' },
  { id: 'webmedia-studio', path: '/webmedia-studio', category: 'media', title: 'Web Media Studio', description: 'Inspect, convert, trim, and package media through WebCodecs and Mediabunny.', icon: 'video', keywords: ['webcodecs', 'mediabunny', 'remux', 'transcode', 'trim', 'media inspect', 'browser media'] },
  { id: 'image-optimizer', path: '/image-optimizer', category: 'media', title: 'Image Optimizer', description: 'Compress images to WebP, MozJPEG, and AVIF.', icon: 'image', keywords: ['image compression', 'webp', 'avif', 'jpeg'] },
  { id: 'image-compressor', path: '/image-compressor', category: 'media', title: 'Image Optimizer', description: 'Compatibility route that opens Image Optimizer.', icon: 'image', keywords: ['image compressor', 'image optimizer', 'webp', 'avif'], hidden: true, aliasFor: 'image-optimizer' },
  { id: 'image-grid', path: '/image-grid', category: 'media', title: 'Image Grid', description: 'Tile local images into one exportable canvas.', icon: 'image', keywords: ['image grid', 'collage', 'tile images', 'mosaic', 'contact sheet'] },
  { id: 'image-forensics', path: '/image-forensics', category: 'media', title: 'Image Forensics', description: 'Inspect images with ELA, noise, clone, luminance, metadata, and string views.', icon: 'search', keywords: ['image forensic', 'ela', 'clone detection', 'noise analysis', 'metadata', 'string extraction'] },
  { id: 'ambient-engine', path: '/ambient-engine', category: 'media', title: 'Ambient Engine', description: 'Generate ambient soundscapes with a live visualizer.', icon: 'audio', keywords: ['ambient', 'nature', 'rain', 'soundscape', 'audio suite'] },
  { id: 'audio-lab', path: '/audio-lab', category: 'media', title: 'Ambient Engine', description: 'Compatibility route that opens Ambient Engine.', icon: 'audio', keywords: ['audio lab', 'ambient engine', 'soundscape', 'audio suite'], hidden: true, aliasFor: 'ambient-engine' },
  { id: 'sound-studio', path: '/sound-studio', category: 'media', title: 'Sound Studio', description: 'Record, mix, and export multi-track audio.', icon: 'mic', keywords: ['record', 'mixer', 'multitrack', 'audio editor', 'audio suite'] },
  { id: 'screen-recorder', path: '/screen-recorder', category: 'media', title: 'Screen Recorder', description: 'Capture screen and audio locally.', icon: 'record', keywords: ['screen capture', 'recording', 'display recording'] },
  { id: 'exif-viewer', path: '/exif-viewer', category: 'media', title: 'EXIF Viewer', description: 'Inspect metadata embedded in image files.', icon: 'search', keywords: ['exif', 'metadata', 'photo info'] },
  { id: 'svg-studio', path: '/svg-studio', category: 'media', title: 'SVG Studio', description: 'Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing.', icon: 'image', keywords: ['svg', 'vector', 'editor', 'gradient', 'shape', 'diagram', 'canvas', 'layers', 'figma', 'draw'] },
  { id: 'svg-editor', path: '/svg-editor', category: 'media', title: 'SVG Studio', description: 'Compatibility route that opens SVG Studio.', icon: 'image', keywords: ['svg editor', 'svg studio', 'vector', 'canvas'], hidden: true, aliasFor: 'svg-studio' },
  { id: 'color-tools', path: '/color-tools', category: 'media', title: 'SVG Studio Alias', description: 'Compatibility route that opens SVG Studio.', icon: 'image', keywords: ['hex color', 'rgb', 'hsl', 'palette', 'contrast', 'svg studio'], hidden: true, aliasFor: 'svg-studio' },
  { id: 'css-generators', path: '/css-generators', category: 'media', title: 'SVG Studio Alias', description: 'Compatibility route that opens SVG Studio.', icon: 'image', keywords: ['box shadow', 'css effect', 'shadow', 'generator', 'svg studio'], hidden: true, aliasFor: 'svg-studio' },
  { id: 'display-tester', path: '/display-tester', category: 'media', title: 'Display Tester', description: 'Check monitor rendering and pixel behavior.', icon: 'image', keywords: ['display', 'monitor', 'dead pixel', 'color test'] },
  { id: 'pdf-tools', path: '/pdf-tools', category: 'media', title: 'PDF Tools', description: 'Merge, reorder, rotate, and export PDF pages locally.', icon: 'text', keywords: ['pdf merge', 'pdf', 'documents', 'pages', 'rotate'] },
  { id: 'visual-generators', path: '/visual-generators', category: 'media', title: 'SVG Studio Alias', description: 'Compatibility route that opens SVG Studio.', icon: 'image', keywords: ['tokens', 'interface', 'palette', 'contrast', 'shadow', 'design', 'svg studio'], hidden: true, aliasFor: 'svg-studio' },
  
  // Data & Text
  { id: 'ai-text-assistant', path: '/ai-text-assistant', category: 'data', title: 'AI Text Assistant', description: 'Rewrite, proofread, and compare text with local models.', icon: 'brain', keywords: ['proofread', 'rewrite', 'grammar', 'text ai'] },
  { id: 'text-tools', path: '/text-tools', category: 'data', title: 'AI Text Assistant', description: 'Compatibility route that opens AI Text Assistant.', icon: 'brain', keywords: ['text tools', 'ai text assistant', 'proofread', 'rewrite'], hidden: true, aliasFor: 'ai-text-assistant' },
  { id: 'data-encoders', path: '/data-encoders', category: 'data', title: 'Data Encoders', description: 'Encode and decode Base64, URL, HTML, and Hex values.', icon: 'list', keywords: ['base64', 'url encode', 'html encode', 'hex encode'] },
  { id: 'encoders', path: '/encoders', category: 'data', title: 'Data Encoders', description: 'Compatibility route that opens Data Encoders.', icon: 'list', keywords: ['encoders', 'data encoders', 'base64', 'url encode'], hidden: true, aliasFor: 'data-encoders' },
  { id: 'regex-tools', path: '/regex-tools', category: 'data', title: 'Regex Tools', description: 'Test, explain, build, and replace with regular expressions.', icon: 'search', keywords: ['regex', 'regexp', 'pattern matching', 'replace', 'groups', 'generator'] },
  { id: 'regex-suite', path: '/regex-suite', category: 'data', title: 'Regex Tools', description: 'Compatibility route that opens Regex Tools.', icon: 'search', keywords: ['regex suite', 'regex tools', 'regexp', 'replace'], hidden: true, aliasFor: 'regex-tools' },
  { id: 'lorem-ipsum', path: '/lorem-ipsum', category: 'data', title: 'Lorem Ipsum', description: 'Generate placeholder paragraphs and sentences.', icon: 'text', keywords: ['placeholder', 'dummy text', 'copy filler'] },
  { id: 'list-processor', path: '/list-processor', category: 'data', title: 'List Processor', description: 'Sort, filter, deduplicate, and reshape lists.', icon: 'list', keywords: ['unique', 'sort', 'filter list', 'dedupe'] },
  { id: 'list-ops', path: '/list-ops', category: 'data', title: 'List Processor', description: 'Compatibility route that opens List Processor.', icon: 'list', keywords: ['list ops', 'list processor', 'dedupe', 'sort'], hidden: true, aliasFor: 'list-processor' },
  { id: 'markdown-editor', path: '/markdown-editor', category: 'data', title: 'Markdown Editor', description: 'Edit Markdown with live preview.', icon: 'code', keywords: ['markdown', 'md', 'preview'] },
  { id: 'case-converter', path: '/case-converter', category: 'data', title: 'Case Converter', description: 'Switch between common text casing conventions.', icon: 'text', keywords: ['camelCase', 'snake_case', 'kebab-case', 'uppercase'] },
  { id: 'url-parser', path: '/url-parser', category: 'data', title: 'URL Parser', description: 'Break down URLs, query params, and origins.', icon: 'globe', keywords: ['url', 'query params', 'hostname', 'search params'] },
  
  // Time & Units
  { id: 'time-studio', path: '/time-studio', category: 'time', title: 'Time Studio', description: 'Run timers, alarms, and epoch conversion from one workspace.', icon: 'clock', keywords: ['timer', 'stopwatch', 'alarm', 'epoch', 'timestamp'] },
  { id: 'time-tools', path: '/time-tools', category: 'time', title: 'Time Studio', description: 'Compatibility route that opens Time Studio.', icon: 'clock', keywords: ['time tools', 'time studio', 'timer', 'epoch'], hidden: true, aliasFor: 'time-studio' },
  { id: 'epoch-and-date', path: '/epoch-and-date', category: 'time', title: 'Epoch & Date', description: 'Focused timestamp conversion view inside Time Studio.', icon: 'clock', keywords: ['unix time', 'date converter', 'timestamp'] },
  { id: 'time-converter', path: '/time-converter', category: 'time', title: 'Epoch & Date', description: 'Compatibility route that opens Epoch & Date.', icon: 'clock', keywords: ['time converter', 'epoch and date', 'unix time', 'timestamp'], hidden: true, aliasFor: 'epoch-and-date' },
  { id: 'timezone-converter', path: '/timezone-converter', category: 'time', title: 'Timezone Converter', description: 'Convert time between global timezones.', icon: 'globe', keywords: ['timezone', 'utc', 'local time', 'zone'] },
  { id: 'calendar-converter', path: '/calendar-converter', category: 'time', title: 'Calendar Converter', description: 'Convert Jalali and Gregorian dates.', icon: 'calendar', keywords: ['jalali', 'gregorian', 'persian calendar'] },
  { id: 'calendar-tool', path: '/calendar-tool', category: 'time', title: 'Calendar Converter', description: 'Compatibility route that opens Calendar Converter.', icon: 'calendar', keywords: ['calendar tool', 'calendar converter', 'jalali', 'gregorian'], hidden: true, aliasFor: 'calendar-converter' },
  { id: 'unit-converter', path: '/unit-converter', category: 'time', title: 'Unit Converter', description: 'Convert across common measurement systems.', icon: 'layers', keywords: ['unit', 'length', 'weight', 'temperature'] },
  { id: 'finance-calculator', path: '/finance-calculator', category: 'time', title: 'Finance Calculator', description: 'Calculate loans, interest, and taxes.', icon: 'list', keywords: ['loan', 'interest', 'tax', 'finance'] },
  { id: 'financial-calc', path: '/financial-calc', category: 'time', title: 'Finance Calculator', description: 'Compatibility route that opens Finance Calculator.', icon: 'list', keywords: ['financial calc', 'finance calculator', 'loan', 'interest'], hidden: true, aliasFor: 'finance-calculator' },

  // Network & DevOps
  { id: 'ip-and-subnet', path: '/ip-and-subnet', category: 'network', title: 'IP & Subnet', description: 'Calculate CIDR ranges and subnet details.', icon: 'network', keywords: ['cidr', 'subnet', 'ipv4', 'network mask'] },
  { id: 'ip-subnet', path: '/ip-subnet', category: 'network', title: 'IP & Subnet', description: 'Compatibility route that opens IP & Subnet.', icon: 'network', keywords: ['ip subnet', 'ip and subnet', 'cidr', 'network mask'], hidden: true, aliasFor: 'ip-and-subnet' },
  { id: 'devops-toolkit', path: '/devops-toolkit', category: 'network', title: 'DevOps Toolkit', description: 'Generate chmod modes and crontab schedules.', icon: 'terminal', keywords: ['chmod', 'cron', 'crontab', 'permissions'] },
  { id: 'devops-tools', path: '/devops-tools', category: 'network', title: 'DevOps Toolkit', description: 'Compatibility route that opens DevOps Toolkit.', icon: 'terminal', keywords: ['devops tools', 'devops toolkit', 'chmod', 'cron'], hidden: true, aliasFor: 'devops-toolkit' },
  { id: 'client-inspector', path: '/client-inspector', category: 'network', title: 'Client Inspector', description: 'Inspect browser, device, and capability signals.', icon: 'search', keywords: ['user agent', 'browser info', 'capabilities'] },
  { id: 'client-inspect', path: '/client-inspect', category: 'network', title: 'Client Inspector', description: 'Compatibility route that opens Client Inspector.', icon: 'search', keywords: ['client inspect', 'client inspector', 'browser info', 'capabilities'], hidden: true, aliasFor: 'client-inspector' },
  { id: 'input-tester', path: '/input-tester', category: 'network', title: 'Input Tester', description: 'Inspect keyboard, pointer, and interaction input.', icon: 'terminal', keywords: ['keyboard', 'mouse', 'pointer', 'input latency'] }
];

export const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  json: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="2" y="3" rx="2" ry="2"/><path d="m22 8-6 4 6 4V8z"/></svg>',
  audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M6 7v10"/><path d="M18 7v10"/><path d="M9 9v6"/><path d="M15 9v6"/></svg>',
  record: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg>',
  diff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 12V3"/><path d="M12 12l8 8"/><path d="M12 12l-8 8"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.1.3 2.1.9 3a5.5 5.5 0 0 0 1.1 9.5c1.1.4 2.3.6 3.5.6 1.2 0 2.4-.2 3.5-.6a5.5 5.5 0 0 0 1.1-9.5c.6-.9.9-1.9.9-3A5.5 5.5 0 0 0 14.5 2z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M10 17.5h4"/><path d="M17.5 10v4"/><path d="M17.5 17.5H21"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
};
