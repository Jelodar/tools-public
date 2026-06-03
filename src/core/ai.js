export const MODEL_REGISTRY = {
  'deepseek-r1-1.5b': {
    id: 'DeepSeek-R1-Distill-Qwen-1.5B (Q4_K_M)',
    url: 'https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    size: '950 MB',
    tier: 'tiny',
    desc: 'Reasoning model for careful edits and structured refactors. Streams <think> tokens.',
    tasks: ['text', 'code']
  },
  'qwen3-1.7b': {
    id: 'Qwen3-1.7B-Instruct (Q4_K_M)',
    url: 'https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf',
    size: '1.0 GB',
    tier: 'tiny',
    desc: 'General instruction model for text, code, and multilingual tasks.',
    tasks: ['text', 'code']
  },
  'qwen2.5-coder-1.5b': {
    id: 'Qwen2.5-Coder-1.5B-Instruct (Q4_K_M)',
    url: 'https://huggingface.co/bartowski/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-1.5B-Instruct-Q4_K_M.gguf',
    size: '986 MB',
    tier: 'tiny',
    desc: 'Fast code model for regex, snippets, and syntax-aware edits.',
    tasks: ['code-fast', 'code']
  },
  'qwen2.5-1.5b': {
    id: 'Qwen2.5-1.5B-Instruct (Q4_K_M)',
    url: 'https://huggingface.co/jc-builds/Qwen2.5-1.5B-Instruct-Q4_K_M-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    size: '1.12 GB',
    tier: 'tiny',
    desc: 'Balanced instruction model with strong JSON and formatted-output behavior.',
    tasks: ['text', 'code']
  },
  'llama-3.2-1b': {
    id: 'Llama-3.2-1B-Instruct (Q4_K_M)',
    url: 'https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-1b-instruct-q4_k_m.gguf',
    size: '770 MB',
    tier: 'tiny',
    desc: 'Compact text model for formatting and short transformations.',
    tasks: ['text']
  },
  'lfm2-1.2b': {
    id: 'LFM2-1.2B (Q4_K_M)',
    url: 'https://huggingface.co/LiquidAI/LFM2-1.2B-GGUF/resolve/main/LFM2-1.2B-Q4_K_M.gguf',
    size: '697 MB',
    tier: 'tiny',
    desc: 'Light conversational model for tone rewrites and short chat.',
    tasks: ['text-social', 'text']
  },
  'smollm2-1.7b': {
    id: 'SmolLM2-1.7B-Instruct (Q4_K_M)',
    url: 'https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF/resolve/main/SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    size: '1.06 GB',
    tier: 'tiny',
    desc: 'Responsive chat model for concise drafts and explanations.',
    tasks: ['text-social', 'text']
  },
  'stablelm-2-zephyr-1.6b': {
    id: 'StableLM-2-Zephyr-1.6B (Q4_K_M)',
    url: 'https://huggingface.co/brittlewis12/stablelm-2-zephyr-1_6b-GGUF/resolve/main/stablelm-2-zephyr-1_6b.Q4_K_M.gguf',
    size: '1.03 GB',
    tier: 'tiny',
    desc: 'Zephyr-tuned chat model for instruction-following text work.',
    tasks: ['text-social', 'text']
  },
  'gemma-3-1b-it': {
    id: 'Gemma-3-1B-IT (UD-Q4_K_XL)',
    url: 'https://huggingface.co/unsloth/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-UD-Q4_K_XL.gguf',
    size: '807 MB',
    tier: 'tiny',
    desc: 'Compact Gemma instruction model for fast local coding and text transforms.',
    tasks: ['text', 'code', 'gemma']
  },
  'gemma-2-2b-it': {
    id: 'Gemma-2-2B-IT (Q4_K_M)',
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    size: '1.71 GB',
    tier: 'pro',
    desc: 'Instruction model for longer text rewriting and summarization.',
    tasks: ['text']
  },
  'gemma-4-e2b-it-q2': {
    id: 'Gemma 4 E2B IT (Q2_K)',
    url: 'https://huggingface.co/dahus/gemma-4-e2b-it-Q2_K-GGUF/resolve/main/gemma-4-e2b-Q2_K.gguf',
    size: '2.99 GB',
    tier: 'pro',
    desc: 'Aggressively quantized Gemma 4 edge model for constrained-memory experiments.',
    tasks: ['text', 'code', 'gemma']
  },
  'llama-3.2-3b': {
    id: 'Llama-3.2-3B-Instruct (Q4_K_M)',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    size: '2.02 GB',
    tier: 'pro',
    desc: 'Higher-capacity instruction model for longer reasoning and prose.',
    tasks: ['text', 'code']
  },
  'phi-3.5-mini': {
    id: 'Phi-3.5-Mini-Instruct (Q4_K_S)',
    url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_S.gguf',
    size: '2.19 GB',
    tier: 'pro',
    desc: 'Compact pro model for technical writing and code explanations.',
    tasks: ['text', 'code']
  },
  'minicpm3-4b': {
    id: 'MiniCPM3-4B (Q4_K_M)',
    url: 'https://huggingface.co/openbmb/MiniCPM3-4B-GGUF/resolve/main/minicpm3-4b-q4_k_m.gguf',
    size: '2.47 GB',
    tier: 'pro',
    desc: 'Multilingual instruction model for structured text and code tasks.',
    tasks: ['text', 'code']
  }
};

export const MODEL_METADATA = {
  'text-surgical': {
    primary: MODEL_REGISTRY['deepseek-r1-1.5b'],
    fallback: MODEL_REGISTRY['llama-3.2-1b']
  },
  'text-social': {
    primary: MODEL_REGISTRY['lfm2-1.2b'],
    fallback: MODEL_REGISTRY['smollm2-1.7b']
  },
  'code-heavy': {
    primary: MODEL_REGISTRY['deepseek-r1-1.5b'],
    fallback: MODEL_REGISTRY['qwen3-1.7b']
  },
  'code-fast': {
    primary: MODEL_REGISTRY['qwen2.5-coder-1.5b'],
    fallback: MODEL_REGISTRY['qwen3-1.7b']
  },
  'gemma-compact': {
    primary: MODEL_REGISTRY['gemma-3-1b-it'],
    fallback: MODEL_REGISTRY['qwen2.5-coder-1.5b']
  },
  'gemma-edge': {
    primary: MODEL_REGISTRY['gemma-4-e2b-it-q2'],
    fallback: MODEL_REGISTRY['gemma-3-1b-it']
  }
};

export const DEFAULT_MODELS = {
  text: 'qwen2.5-1.5b',
  code: 'deepseek-r1-1.5b',
  'code-fast': 'qwen2.5-coder-1.5b'
};

export async function getWllamaConfig() {
  const hasWebGPU = 'gpu' in navigator && await navigator.gpu.requestAdapter();
  return {
    allowWebGPU: !!hasWebGPU,
    n_threads: hasWebGPU ? 1 : Math.max(1, (navigator.hardwareConcurrency || 4) - 2)
  };
}
