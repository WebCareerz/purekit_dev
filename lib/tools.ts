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
    tools: ["json-formatter"],
  },
  {
    key: "encodersDecoders",
    tools: ["base64-encode-decode", "url-encode-decode", "jwt-decoder", "hash-generator"],
  },
  {
    key: "generators",
    tools: ["uuid-generator", "qr-code-generator"],
  },
  {
    key: "converters",
    tools: ["unix-timestamp-converter", "color-converter"],
  },
  {
    key: "textTools",
    tools: ["diff-checker", "markdown-preview"],
  },
  {
    key: "dataTools",
    tools: ["csv-data-cleaner"],
  },
  {
    key: "imageTools",
    tools: ["image-format-converter", "image-compressor"],
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
