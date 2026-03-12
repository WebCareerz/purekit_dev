export interface ToolDefinition {
  slug: string;
  categoryKey: string;
  icon: string;
  relatedSlugs: string[];
  searchTerms: string[];
}

export interface CategoryDefinition {
  key: string;
  tools: string[];
}

export const categories: CategoryDefinition[] = [
  {
    key: "formatters",
    tools: ["json-formatter", "sql-formatter", "html-formatter", "xml-formatter", "javascript-beautifier", "css-beautifier", "css-js-minifier", "html-viewer"],
  },
  {
    key: "encodersDecoders",
    tools: ["base64-encode-decode", "url-encode-decode", "jwt-decoder", "hash-generator", "html-entity-encoder", "gzip-compress-decompress"],
  },
  {
    key: "generators",
    tools: ["uuid-generator", "qr-code-generator", "favicon-generator", "mock-data-generator", "cron-expression-builder", "password-generator", "lorem-ipsum-generator", "placeholder-image-generator", "robots-txt-generator", "meta-tags-generator"],
  },
  {
    key: "converters",
    tools: ["unix-timestamp-converter", "color-converter", "yaml-json-toml-converter", "json-to-csv-converter", "csv-to-json", "number-base-converter", "markdown-to-html", "html-to-markdown", "svg-to-png", "hex-to-text"],
  },
  {
    key: "textTools",
    tools: ["diff-checker", "markdown-preview", "regex-tester", "text-case-converter", "word-counter"],
  },
  {
    key: "dataTools",
    tools: ["csv-data-cleaner"],
  },
  {
    key: "imageTools",
    tools: ["image-format-converter", "image-compressor", "image-to-pdf", "image-to-base64", "svg-optimizer"],
  },
  {
    key: "pdfTools",
    tools: ["pdf-merge", "pdf-compress", "pdf-split", "pdf-to-image"],
  },
];

export const tools: Record<string, ToolDefinition> = {
  "json-formatter": {
    slug: "json-formatter",
    categoryKey: "formatters",
    icon: "Braces",
    relatedSlugs: ["base64-encode-decode", "url-encode-decode", "hash-generator"],
    searchTerms: ["json", "format", "validate", "beautify", "minify", "pretty print", "lint"],
  },
  "base64-encode-decode": {
    slug: "base64-encode-decode",
    categoryKey: "encodersDecoders",
    icon: "FileCode",
    relatedSlugs: ["url-encode-decode", "jwt-decoder", "hash-generator"],
    searchTerms: ["base64", "encode", "decode", "binary", "text", "convert"],
  },
  "url-encode-decode": {
    slug: "url-encode-decode",
    categoryKey: "encodersDecoders",
    icon: "Link",
    relatedSlugs: ["base64-encode-decode", "jwt-decoder", "json-formatter"],
    searchTerms: ["url", "encode", "decode", "percent", "uri", "query", "parameter"],
  },
  "uuid-generator": {
    slug: "uuid-generator",
    categoryKey: "generators",
    icon: "Fingerprint",
    relatedSlugs: ["hash-generator", "qr-code-generator", "json-formatter"],
    searchTerms: ["uuid", "guid", "unique", "id", "random", "generate", "v4"],
  },
  "hash-generator": {
    slug: "hash-generator",
    categoryKey: "encodersDecoders",
    icon: "ShieldCheck",
    relatedSlugs: ["base64-encode-decode", "uuid-generator", "jwt-decoder"],
    searchTerms: ["hash", "md5", "sha", "sha256", "sha512", "checksum", "digest", "crypto"],
  },
  "jwt-decoder": {
    slug: "jwt-decoder",
    categoryKey: "encodersDecoders",
    icon: "Key",
    relatedSlugs: ["base64-encode-decode", "json-formatter", "hash-generator"],
    searchTerms: ["jwt", "json web token", "decode", "token", "auth", "bearer", "claims", "header", "payload"],
  },
  "unix-timestamp-converter": {
    slug: "unix-timestamp-converter",
    categoryKey: "converters",
    icon: "Clock",
    relatedSlugs: ["json-formatter", "uuid-generator", "color-converter"],
    searchTerms: ["unix", "timestamp", "epoch", "date", "time", "convert", "utc", "milliseconds"],
  },
  "color-converter": {
    slug: "color-converter",
    categoryKey: "converters",
    icon: "Palette",
    relatedSlugs: ["unix-timestamp-converter", "base64-encode-decode", "qr-code-generator"],
    searchTerms: ["color", "hex", "rgb", "hsl", "convert", "picker", "css", "oklch"],
  },
  "diff-checker": {
    slug: "diff-checker",
    categoryKey: "textTools",
    icon: "FileDiff",
    relatedSlugs: ["json-formatter", "markdown-preview", "csv-data-cleaner"],
    searchTerms: ["diff", "compare", "difference", "text", "merge", "patch", "changes"],
  },
  "markdown-preview": {
    slug: "markdown-preview",
    categoryKey: "textTools",
    icon: "FileText",
    relatedSlugs: ["diff-checker", "json-formatter", "qr-code-generator"],
    searchTerms: ["markdown", "preview", "render", "md", "github", "gfm", "html"],
  },
  "qr-code-generator": {
    slug: "qr-code-generator",
    categoryKey: "generators",
    icon: "QrCode",
    relatedSlugs: ["uuid-generator", "url-encode-decode", "base64-encode-decode"],
    searchTerms: ["qr", "qr code", "barcode", "generate", "scan", "url", "link"],
  },
  "csv-data-cleaner": {
    slug: "csv-data-cleaner",
    categoryKey: "dataTools",
    icon: "Table",
    relatedSlugs: ["json-formatter", "diff-checker", "markdown-preview"],
    searchTerms: ["csv", "data", "clean", "parse", "table", "spreadsheet", "tsv", "deduplicate", "filter"],
  },
  "image-format-converter": {
    slug: "image-format-converter",
    categoryKey: "imageTools",
    icon: "ImageIcon",
    relatedSlugs: ["image-compressor", "base64-encode-decode", "qr-code-generator"],
    searchTerms: ["image", "convert", "png", "jpg", "jpeg", "webp", "format", "photo"],
  },
  "image-compressor": {
    slug: "image-compressor",
    categoryKey: "imageTools",
    icon: "Minimize",
    relatedSlugs: ["image-format-converter", "base64-encode-decode", "qr-code-generator"],
    searchTerms: ["image", "compress", "reduce", "size", "optimize", "photo", "quality"],
  },
  "pdf-merge": {
    slug: "pdf-merge",
    categoryKey: "pdfTools",
    icon: "FilePlus",
    relatedSlugs: ["pdf-split", "pdf-compress", "pdf-to-image"],
    searchTerms: ["pdf", "merge", "combine", "join", "concatenate", "document"],
  },
  "pdf-compress": {
    slug: "pdf-compress",
    categoryKey: "pdfTools",
    icon: "FileDown",
    relatedSlugs: ["pdf-merge", "pdf-split", "image-compressor"],
    searchTerms: ["pdf", "compress", "reduce", "size", "optimize", "shrink", "smaller"],
  },
  "pdf-split": {
    slug: "pdf-split",
    categoryKey: "pdfTools",
    icon: "Scissors",
    relatedSlugs: ["pdf-merge", "pdf-compress", "pdf-to-image"],
    searchTerms: ["pdf", "split", "extract", "page", "separate", "divide"],
  },
  "pdf-to-image": {
    slug: "pdf-to-image",
    categoryKey: "pdfTools",
    icon: "FileImage",
    relatedSlugs: ["pdf-merge", "pdf-split", "image-format-converter"],
    searchTerms: ["pdf", "image", "png", "jpg", "convert", "export", "screenshot", "page"],
  },
  "regex-tester": {
    slug: "regex-tester",
    categoryKey: "textTools",
    icon: "Regex",
    relatedSlugs: ["text-case-converter", "word-counter", "diff-checker"],
    searchTerms: ["regex", "regular expression", "test", "match", "pattern", "replace", "capture", "group"],
  },
  "cron-expression-builder": {
    slug: "cron-expression-builder",
    categoryKey: "generators",
    icon: "Timer",
    relatedSlugs: ["unix-timestamp-converter", "regex-tester", "uuid-generator"],
    searchTerms: ["cron", "crontab", "schedule", "timer", "job", "task", "expression", "builder"],
  },
  "sql-formatter": {
    slug: "sql-formatter",
    categoryKey: "formatters",
    icon: "Database",
    relatedSlugs: ["json-formatter", "csv-data-cleaner", "diff-checker"],
    searchTerms: ["sql", "format", "beautify", "query", "database", "indent", "pretty print"],
  },
  "yaml-json-toml-converter": {
    slug: "yaml-json-toml-converter",
    categoryKey: "converters",
    icon: "ArrowLeftRight",
    relatedSlugs: ["json-formatter", "csv-data-cleaner", "diff-checker"],
    searchTerms: ["yaml", "json", "toml", "convert", "transform", "config", "configuration"],
  },
  "mock-data-generator": {
    slug: "mock-data-generator",
    categoryKey: "generators",
    icon: "Shuffle",
    relatedSlugs: ["uuid-generator", "json-formatter", "csv-data-cleaner"],
    searchTerms: ["mock", "fake", "data", "generate", "random", "name", "email", "address", "test"],
  },
  "html-formatter": {
    slug: "html-formatter",
    categoryKey: "formatters",
    icon: "Code",
    relatedSlugs: ["javascript-beautifier", "css-beautifier", "json-formatter"],
    searchTerms: ["html", "format", "beautify", "minify", "pretty", "indent", "markup", "web"],
  },
  "javascript-beautifier": {
    slug: "javascript-beautifier",
    categoryKey: "formatters",
    icon: "FileCode2",
    relatedSlugs: ["html-formatter", "css-beautifier", "json-formatter"],
    searchTerms: ["javascript", "js", "beautify", "format", "minify", "pretty", "indent", "code"],
  },
  "css-beautifier": {
    slug: "css-beautifier",
    categoryKey: "formatters",
    icon: "Paintbrush",
    relatedSlugs: ["html-formatter", "javascript-beautifier", "color-converter"],
    searchTerms: ["css", "stylesheet", "beautify", "format", "minify", "pretty", "indent", "style"],
  },
  "json-to-csv-converter": {
    slug: "json-to-csv-converter",
    categoryKey: "converters",
    icon: "ArrowRightLeft",
    relatedSlugs: ["json-formatter", "csv-data-cleaner", "yaml-json-toml-converter"],
    searchTerms: ["json", "csv", "convert", "export", "data", "table", "spreadsheet"],
  },
  "text-case-converter": {
    slug: "text-case-converter",
    categoryKey: "textTools",
    icon: "CaseSensitive",
    relatedSlugs: ["word-counter", "diff-checker", "markdown-preview"],
    searchTerms: ["case", "upper", "lower", "title", "camel", "pascal", "snake", "kebab", "convert"],
  },
  "word-counter": {
    slug: "word-counter",
    categoryKey: "textTools",
    icon: "FileText",
    relatedSlugs: ["text-case-converter", "markdown-preview", "diff-checker"],
    searchTerms: ["word", "count", "character", "sentence", "paragraph", "reading", "time", "statistics", "frequency", "letter", "character counter"],
  },
  "password-generator": {
    slug: "password-generator",
    categoryKey: "generators",
    icon: "Lock",
    relatedSlugs: ["uuid-generator", "hash-generator", "mock-data-generator"],
    searchTerms: ["password", "generate", "random", "secure", "strong", "passphrase", "credentials"],
  },
  "lorem-ipsum-generator": {
    slug: "lorem-ipsum-generator",
    categoryKey: "generators",
    icon: "AlignLeft",
    relatedSlugs: ["word-counter", "text-case-converter", "mock-data-generator"],
    searchTerms: ["lorem", "ipsum", "placeholder", "dummy", "text", "filler", "sample"],
  },
  "image-to-pdf": {
    slug: "image-to-pdf",
    categoryKey: "imageTools",
    icon: "FileOutput",
    relatedSlugs: ["pdf-merge", "image-compressor", "image-format-converter"],
    searchTerms: ["image", "pdf", "convert", "jpg", "png", "photo", "document", "export"],
  },
  "placeholder-image-generator": {
    slug: "placeholder-image-generator",
    categoryKey: "generators",
    icon: "Image",
    relatedSlugs: ["image-format-converter", "image-compressor", "qr-code-generator"],
    searchTerms: ["placeholder", "image", "generate", "dummy", "banner", "size", "avatar", "thumbnail", "og"],
  },
  "number-base-converter": {
    slug: "number-base-converter",
    categoryKey: "converters",
    icon: "Binary",
    relatedSlugs: ["color-converter", "base64-encode-decode", "hash-generator"],
    searchTerms: ["binary", "octal", "decimal", "hex", "hexadecimal", "base", "convert", "number", "radix"],
  },
  "markdown-to-html": {
    slug: "markdown-to-html",
    categoryKey: "converters",
    icon: "FileCode",
    relatedSlugs: ["markdown-preview", "html-formatter", "diff-checker"],
    searchTerms: ["markdown", "html", "convert", "gfm", "render", "export", "md"],
  },
  "html-to-markdown": {
    slug: "html-to-markdown",
    categoryKey: "converters",
    icon: "FileCode2",
    relatedSlugs: ["markdown-to-html", "html-formatter", "markdown-preview"],
    searchTerms: ["html", "markdown", "convert", "md", "export", "markup"],
  },
  "xml-formatter": {
    slug: "xml-formatter",
    categoryKey: "formatters",
    icon: "FileX",
    relatedSlugs: ["html-formatter", "json-formatter", "yaml-json-toml-converter"],
    searchTerms: ["xml", "format", "beautify", "minify", "pretty", "validate", "indent"],
  },
  "favicon-generator": {
    slug: "favicon-generator",
    categoryKey: "generators",
    icon: "Sparkles",
    relatedSlugs: ["qr-code-generator", "placeholder-image-generator", "image-format-converter"],
    searchTerms: ["favicon", "icon", "generate", "emoji", "logo", "website", "browser", "ico"],
  },
  "image-to-base64": {
    slug: "image-to-base64",
    categoryKey: "imageTools",
    icon: "FileCode",
    relatedSlugs: ["base64-encode-decode", "image-format-converter", "image-compressor"],
    searchTerms: ["image", "base64", "encode", "data uri", "convert", "image to base64"],
  },
  "html-entity-encoder": {
    slug: "html-entity-encoder",
    categoryKey: "encodersDecoders",
    icon: "Code",
    relatedSlugs: ["url-encode-decode", "base64-encode-decode", "html-formatter"],
    searchTerms: ["html", "entity", "encode", "decode", "escape", "unescape", "html entities"],
  },
  "svg-to-png": {
    slug: "svg-to-png",
    categoryKey: "converters",
    icon: "FileImage",
    relatedSlugs: ["image-format-converter", "image-compressor", "placeholder-image-generator"],
    searchTerms: ["svg", "png", "convert", "vector", "raster", "svg to png", "export"],
  },
  "gzip-compress-decompress": {
    slug: "gzip-compress-decompress",
    categoryKey: "encodersDecoders",
    icon: "Archive",
    relatedSlugs: ["base64-encode-decode", "hash-generator", "url-encode-decode"],
    searchTerms: ["gzip", "compress", "decompress", "gz", "compression", "archive", "deflate"],
  },
  "csv-to-json": {
    slug: "csv-to-json",
    categoryKey: "converters",
    icon: "ArrowRightLeft",
    relatedSlugs: ["json-to-csv-converter", "json-formatter", "csv-data-cleaner"],
    searchTerms: ["csv", "json", "convert", "parse", "spreadsheet", "data", "table"],
  },

  "css-js-minifier": {
    slug: "css-js-minifier",
    categoryKey: "formatters",
    icon: "Minimize2",
    relatedSlugs: ["css-beautifier", "javascript-beautifier", "html-formatter"],
    searchTerms: ["css", "js", "javascript", "minify", "compress", "optimize", "reduce", "file size"],
  },
  "svg-optimizer": {
    slug: "svg-optimizer",
    categoryKey: "imageTools",
    icon: "Sparkles",
    relatedSlugs: ["svg-to-png", "image-compressor", "image-format-converter"],
    searchTerms: ["svg", "optimize", "compress", "reduce", "clean", "vector", "file size"],
  },
  "robots-txt-generator": {
    slug: "robots-txt-generator",
    categoryKey: "generators",
    icon: "Bot",
    relatedSlugs: ["qr-code-generator", "uuid-generator", "cron-expression-builder"],
    searchTerms: ["robots", "txt", "seo", "crawler", "search engine", "sitemap", "disallow", "allow"],
  },
  "meta-tags-generator": {
    slug: "meta-tags-generator",
    categoryKey: "generators",
    icon: "Tags",
    relatedSlugs: ["robots-txt-generator", "favicon-generator", "html-formatter"],
    searchTerms: ["meta", "tags", "open graph", "og", "twitter", "social media", "seo", "preview"],
  },
  "hex-to-text": {
    slug: "hex-to-text",
    categoryKey: "converters",
    icon: "Hash",
    relatedSlugs: ["base64-encode-decode", "number-base-converter", "url-encode-decode"],
    searchTerms: ["hex", "hexadecimal", "binary", "ascii", "text", "convert", "decode"],
  },
  "html-viewer": {
    slug: "html-viewer",
    categoryKey: "formatters",
    icon: "Eye",
    relatedSlugs: ["html-formatter", "markdown-preview", "html-to-markdown"],
    searchTerms: ["html", "preview", "live", "render", "viewer", "code", "visual"],
  },
};

export const allToolSlugs = Object.keys(tools);

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools[slug];
}

export function getRelatedTools(slug: string): ToolDefinition[] {
  const tool = tools[slug];
  if (!tool) return [];
  return tool.relatedSlugs
    .map((s) => tools[s])
    .filter(Boolean);
}

export function getCategoryForTool(slug: string): CategoryDefinition | undefined {
  return categories.find((c) => c.tools.includes(slug));
}
