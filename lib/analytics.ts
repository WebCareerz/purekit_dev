// Self-hosted analytics, loaded same-origin through functions/rks6/[[path]].ts.
// ANALYTICS_PREFIX must match that folder name. The site id is the analytics script id
// without its "pa-" prefix.
export const ANALYTICS_PREFIX = "rks6";
export const ANALYTICS_SITE_ID = "0_IgvocUGxXSORD8NySwn";

export const ANALYTICS_SCRIPT_SRC = `/${ANALYTICS_PREFIX}/${ANALYTICS_SITE_ID}.js`;

// The installation snippet's second script, unchanged apart from the endpoint option.
export const ANALYTICS_INIT = `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init({ endpoint: "/${ANALYTICS_PREFIX}/e" })`;

type EventProps = Record<string, string>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void;
  }
}

// Custom event (Plausible v3 tracker: plausible(name, { props })). Calls made before the
// script loads are queued by the init snippet above. Analytics must never break a tool.
export function trackEvent(name: string, props: EventProps) {
  try {
    window.plausible?.(name, { props });
  } catch {
    // ignore
  }
}
