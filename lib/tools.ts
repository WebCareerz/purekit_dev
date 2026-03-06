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
    tools: ["base64-encode-decode", "url-encode-decode", "hash-generator"],
  },
  {
    key: "generators",
    tools: ["uuid-generator"],
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
    relatedSlugs: ["url-encode-decode", "hash-generator", "json-formatter"],
    searchTerms: ["base64", "encode", "decode", "binary", "text", "convert"],
  },
  "url-encode-decode": {
    slug: "url-encode-decode",
    categoryKey: "encodersDecoders",
    icon: "Link",
    relatedSlugs: ["base64-encode-decode", "hash-generator", "json-formatter"],
    searchTerms: ["url", "encode", "decode", "percent", "uri", "query", "parameter"],
  },
  "uuid-generator": {
    slug: "uuid-generator",
    categoryKey: "generators",
    icon: "Fingerprint",
    relatedSlugs: ["hash-generator", "base64-encode-decode", "json-formatter"],
    searchTerms: ["uuid", "guid", "unique", "id", "random", "generate", "v4"],
  },
  "hash-generator": {
    slug: "hash-generator",
    categoryKey: "encodersDecoders",
    icon: "ShieldCheck",
    relatedSlugs: ["base64-encode-decode", "uuid-generator", "url-encode-decode"],
    searchTerms: ["hash", "md5", "sha", "sha256", "sha512", "checksum", "digest", "crypto"],
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
