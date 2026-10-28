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
    tools: ["html-viewer"],
  },
  {
    key: "encodersDecoders",
    tools: ["jwt-decoder", "gzip-compress-decompress"],
  },
  {
    key: "generators",
    tools: ["uuid-generator"],
  },
  {
    key: "textTools",
    tools: ["json-diff", "php-version-checker", "php2shell-checker"],
  },
  {
    key: "imageTools",
    tools: ["gemini-watermark-remover"],
  },
];

export const tools: Record<string, ToolDefinition> = {
  "uuid-generator": {
    slug: "uuid-generator",
    categoryKey: "generators",
    icon: "Fingerprint",
    relatedSlugs: ["jwt-decoder", "json-diff", "gzip-compress-decompress"],
    searchTerms: ["uuid", "guid", "unique", "id", "random", "generate", "v4"],
  },
  "jwt-decoder": {
    slug: "jwt-decoder",
    categoryKey: "encodersDecoders",
    icon: "Key",
    relatedSlugs: ["json-diff", "uuid-generator", "gzip-compress-decompress"],
    searchTerms: ["jwt", "json web token", "decode", "token", "auth", "bearer", "claims", "header", "payload"],
  },

  "gzip-compress-decompress": {
    slug: "gzip-compress-decompress",
    categoryKey: "encodersDecoders",
    icon: "Archive",
    relatedSlugs: ["jwt-decoder", "json-diff", "uuid-generator"],
    searchTerms: ["gzip", "compress", "decompress", "gz", "compression", "archive", "deflate"],
  },

  "html-viewer": {
    slug: "html-viewer",
    categoryKey: "formatters",
    icon: "Eye",
    relatedSlugs: ["json-diff", "jwt-decoder", "gzip-compress-decompress"],
    searchTerms: ["html", "preview", "live", "render", "viewer", "code", "visual"],
  },
  "json-diff": {
    slug: "json-diff",
    categoryKey: "textTools",
    icon: "GitCompare",
    relatedSlugs: ["jwt-decoder", "html-viewer", "uuid-generator"],
    searchTerms: ["json", "diff", "compare", "difference", "comparison", "merge"],
  },
  "gemini-watermark-remover": {
    slug: "gemini-watermark-remover",
    categoryKey: "imageTools",
    icon: "Eraser",
    relatedSlugs: ["html-viewer", "json-diff", "uuid-generator"],
    searchTerms: ["gemini", "watermark", "remove", "remover", "ai", "google", "image", "clean", "logo", "cleaner", "star", "icon", "mark", "free", "online", "delete"],
  },
  "php-version-checker": {
    slug: "php-version-checker",
    categoryKey: "textTools",
    icon: "FileCode2",
    relatedSlugs: ["php2shell-checker", "jwt-decoder", "json-diff"],
    searchTerms: ["php", "version", "checker", "website", "eol", "end of life", "supported", "compatibility", "minimum", "upgrade", "php 8", "php 7"],
  },
  "php2shell-checker": {
    slug: "php2shell-checker",
    categoryKey: "textTools",
    icon: "ShieldAlert",
    relatedSlugs: ["php-version-checker", "jwt-decoder", "uuid-generator"],
    searchTerms: ["php2shell", "php", "vulnerability", "cve-2026-109618", "cve-2026-109619", "rce", "security", "patch", "exploit", "checker"],
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
