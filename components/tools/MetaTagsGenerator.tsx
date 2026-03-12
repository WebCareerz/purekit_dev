"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tags, Eye } from "lucide-react";
import CopyButton from "./CopyButton";

interface MetaTagsGeneratorProps {
  t: Record<string, unknown>;
}

export default function MetaTagsGenerator({ t }: MetaTagsGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "meta-tags-generator"
  ];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [author, setAuthor] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [ogUrl, setOgUrl] = useState("");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");
  const [output, setOutput] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const generateMetaTags = useCallback(() => {
    let html = "<!-- Basic Meta Tags -->\n";
    
    if (title) {
      html += `<title>${title}</title>\n`;
      html += `<meta name="title" content="${title}">\n`;
    }
    
    if (description) {
      html += `<meta name="description" content="${description}">\n`;
    }
    
    if (keywords) {
      html += `<meta name="keywords" content="${keywords}">\n`;
    }
    
    if (author) {
      html += `<meta name="author" content="${author}">\n`;
    }

    html += `\n<!-- Open Graph / Facebook -->\n`;
    html += `<meta property="og:type" content="website">\n`;
    
    if (ogUrl) {
      html += `<meta property="og:url" content="${ogUrl}">\n`;
    }
    
    if (ogTitle || title) {
      html += `<meta property="og:title" content="${ogTitle || title}">\n`;
    }
    
    if (ogDescription || description) {
      html += `<meta property="og:description" content="${ogDescription || description}">\n`;
    }
    
    if (ogImage) {
      html += `<meta property="og:image" content="${ogImage}">\n`;
    }

    html += `\n<!-- Twitter -->\n`;
    html += `<meta property="twitter:card" content="${twitterCard}">\n`;
    
    if (ogUrl) {
      html += `<meta property="twitter:url" content="${ogUrl}">\n`;
    }
    
    if (ogTitle || title) {
      html += `<meta property="twitter:title" content="${ogTitle || title}">\n`;
    }
    
    if (ogDescription || description) {
      html += `<meta property="twitter:description" content="${ogDescription || description}">\n`;
    }
    
    if (ogImage) {
      html += `<meta property="twitter:image" content="${ogImage}">\n`;
    }

    setOutput(html);
  }, [title, description, keywords, author, ogTitle, ogDescription, ogImage, ogUrl, twitterCard]);

  const handleClear = useCallback(() => {
    setTitle("");
    setDescription("");
    setKeywords("");
    setAuthor("");
    setOgTitle("");
    setOgDescription("");
    setOgImage("");
    setOgUrl("");
    setTwitterCard("summary_large_image");
    setOutput("");
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={generateMetaTags} size="sm">
            <Tags className="h-4 w-4 mr-1.5" />
            {common.generate}
          </Button>
          <Button 
            onClick={() => setShowPreview(!showPreview)} 
            size="sm" 
            variant={showPreview ? "default" : "outline"}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {toolT.preview}
          </Button>
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <Button onClick={handleClear} size="sm" variant="outline">
          {common.clear}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{toolT.basicInfo}</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-sm mb-1.5 block">
                {toolT.pageTitle}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Website"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm mb-1.5 block">
                {toolT.pageDescription}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your page..."
                className="text-sm min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="keywords" className="text-sm mb-1.5 block">
                {toolT.keywords}
              </Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="author" className="text-sm mb-1.5 block">
                {toolT.author}
              </Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="John Doe"
                className="text-sm"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold pt-2">{toolT.socialMedia}</h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="ogTitle" className="text-sm mb-1.5 block">
                {toolT.ogTitle}
              </Label>
              <Input
                id="ogTitle"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder={toolT.optionalFallback}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="ogDescription" className="text-sm mb-1.5 block">
                {toolT.ogDescription}
              </Label>
              <Textarea
                id="ogDescription"
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder={toolT.optionalFallback}
                className="text-sm min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="ogImage" className="text-sm mb-1.5 block">
                {toolT.ogImage}
              </Label>
              <Input
                id="ogImage"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="ogUrl" className="text-sm mb-1.5 block">
                {toolT.pageUrl}
              </Label>
              <Input
                id="ogUrl"
                value={ogUrl}
                onChange={(e) => setOgUrl(e.target.value)}
                placeholder="https://example.com"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="twitterCard" className="text-sm mb-1.5 block">
                {toolT.twitterCard}
              </Label>
              <select
                id="twitterCard"
                value={twitterCard}
                onChange={(e) => setTwitterCard(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>
          </div>
        </div>

        {/* Output / Preview */}
        <div className="space-y-4">
          {showPreview && (ogTitle || title) ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{toolT.socialPreview}</h3>
              
              {/* Facebook/OG Preview */}
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <div className="p-3 border-b border-border bg-muted/50">
                  <div className="text-xs font-medium">{toolT.facebookPreview}</div>
                </div>
                {ogImage && (
                  <div className="aspect-[1.91/1] bg-muted relative">
                    <img 
                      src={ogImage} 
                      alt="OG Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <div className="text-xs text-muted-foreground uppercase">
                    {ogUrl ? new URL(ogUrl).hostname : 'example.com'}
                  </div>
                  <div className="font-semibold text-sm line-clamp-2">
                    {ogTitle || title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {ogDescription || description}
                  </div>
                </div>
              </div>

              {/* Twitter Preview */}
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <div className="p-3 border-b border-border bg-muted/50">
                  <div className="text-xs font-medium">{toolT.twitterPreview}</div>
                </div>
                {ogImage && (
                  <div className={`${twitterCard === 'summary' ? 'aspect-square' : 'aspect-[2/1]'} bg-muted relative`}>
                    <img 
                      src={ogImage} 
                      alt="Twitter Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <div className="font-semibold text-sm line-clamp-2">
                    {ogTitle || title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {ogDescription || description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ogUrl ? new URL(ogUrl).hostname : 'example.com'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{toolT.generatedCode}</h3>
                {output && (
                  <CopyButton
                    text={output}
                    copyLabel={common.copy}
                    copiedLabel={common.copied}
                  />
                )}
              </div>
              <Textarea
                value={output}
                readOnly
                placeholder={common.outputPlaceholder}
                className="font-mono text-sm min-h-[400px] bg-muted/50"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
