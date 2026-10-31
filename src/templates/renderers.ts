import FoundationPreview from "./foundation/renderer";
import RoyalWeddingRenderer from "./royal-wedding/renderer";
import type { TemplateRenderer } from "./types";

// Keep executable components separate from serializable catalog metadata.
export const templateRenderers: Readonly<
  Record<string, TemplateRenderer | undefined>
> = {
  "foundation-preview": FoundationPreview,
  "royal-wedding": RoyalWeddingRenderer,
};
