import type { Locator } from "@playwright/test";

// Use the invitation's native scroller; do not bypass entrance animations.
export async function scrollToSection(canvas: Locator, section: string) {
  await canvas.evaluate((node, id) => {
    const target = node.querySelector<HTMLElement>(`[data-section="${id}"]`)!;
    node.scrollTo({ top: node.scrollTop + target.getBoundingClientRect().top - node.getBoundingClientRect().top, behavior: "instant" });
  }, section);
}
