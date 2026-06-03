/**
 * Code Studio Utilities
 * Pure deterministic logic for formatting, minification, and transformations.
 */

export async function formatWebCode(source, options = {}) {
  const { parser = 'html', tabWidth = 2 } = options;
  const prettier = await import('https://esm.sh/prettier@3.0.3/standalone');
  const parserHtml = await import('https://esm.sh/prettier@3.0.3/plugins/html');
  const parserCss = await import('https://esm.sh/prettier@3.0.3/plugins/postcss');
  const parserBabel = await import('https://esm.sh/prettier@3.0.3/plugins/babel');
  const parserEstree = await import('https://esm.sh/prettier@3.0.3/plugins/estree');

  return prettier.format(source, {
    parser,
    plugins: [parserHtml.default, parserCss.default, parserBabel.default, parserEstree.default],
    tabWidth: Number(tabWidth)
  });
}

export async function formatSql(source, options = {}) {
  const { dialect = 'sql', indent = 2, uppercase = true } = options;
  const { format } = await import('https://esm.sh/sql-formatter@12.2.4');
  return format(source, {
    language: dialect,
    indent: ' '.repeat(Number(indent)),
    uppercase
  });
}

export async function minifyJs(source, options = {}) {
  const { mangle = true, compress = true, module = false } = options;
  const { minify } = await import('https://esm.sh/terser@5.30.0');
  const result = await minify(source, {
    mangle,
    compress,
    module,
    ecma: 2020
  });
  return result.code || '';
}

export async function obfuscateJs(source, options = {}) {
  const { preset = 'default', strings = true, compact = true, deadCode = false } = options;
  const mod = await import('https://esm.sh/javascript-obfuscator@4.1.0');
  const Obfuscator = mod.default || mod;
  
  const config = {
    compact,
    stringArray: strings,
    deadCodeInjection: deadCode,
    deadCodeInjectionThreshold: 0.4,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: preset === 'high',
    controlFlowFlattening: preset !== 'low',
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    splitStrings: preset === 'high',
    unicodeEscapeSequence: false
  };

  const result = Obfuscator.obfuscate(source, config);
  return result.getObfuscatedCode();
}
