"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

type Size = { width: number; height: number };
type Layout = {
  size: Size;
  callbacks: Set<(size: Size) => void>;
  observer: ResizeObserver;
  frame: number;
  refreshFrame: number;
  refreshTimer: ReturnType<typeof setTimeout> | undefined;
  lastScroll: number;
  onScroll: () => void;
};
const layouts = new WeakMap<HTMLElement, Layout>();

function standaloneTouch() {
  return window.self === window.top && matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function measureLayout(canvas: HTMLElement): Size {
  let height = canvas.clientHeight;
  if (standaloneTouch() && CSS.supports("height", "100svh")) {
    // The small viewport still fits when the browser's controls return.
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;height:100svh;width:0;top:0";
    document.documentElement.append(probe);
    height = Math.min(height, probe.getBoundingClientRect().height);
    probe.remove();
  }
  return { width: canvas.clientWidth, height };
}

function mobileToolbarResize(previous: Size, next: Size) {
  // Embedded preview resizing is intentional; never classify it as browser chrome.
  if (!standaloneTouch()) return false;
  if (Math.abs(next.width - previous.width) > 2) return false;
  const editing = document.activeElement?.matches("input, textarea, select, [contenteditable='true']");
  return editing || Math.abs(next.height - previous.height) <= previous.height * 0.25;
}

export function royalViewport(canvas: HTMLElement): Size {
  return layouts.get(canvas)?.size ?? { width: canvas.clientWidth, height: canvas.clientHeight };
}

export function refreshRoyalScroll(canvas: HTMLElement) {
  const layout = layouts.get(canvas);
  if (!layout) return;
  clearTimeout(layout.refreshTimer);
  cancelAnimationFrame(layout.refreshFrame);
  const refresh = () => {
    // Image/font completion must not refresh a scrubbed scene mid-gesture.
    if (performance.now() - layout.lastScroll < 160) {
      layout.refreshTimer = setTimeout(refresh, 160);
      return;
    }
    layout.refreshFrame = requestAnimationFrame(() => {
      ScrollTrigger.getAll().filter(trigger => trigger.scroller === canvas).forEach(trigger => trigger.refresh());
    });
  };
  refresh();
}

export function observeRoyalViewport(canvas: HTMLElement, callback: (size: Size) => void) {
  let layout = layouts.get(canvas);
  if (!layout) {
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(state.frame);
      state.frame = requestAnimationFrame(() => {
        const next = { width: canvas.clientWidth, height: canvas.clientHeight };
        if (Math.abs(next.width - state.size.width) < 2 && Math.abs(next.height - state.size.height) < 2) return;
        if (mobileToolbarResize(state.size, next)) return;
        state.size = measureLayout(canvas);
        canvas.style.setProperty("--royal-layout-height", `${state.size.height}px`);
        for (const listener of state.callbacks) listener(state.size);
        refreshRoyalScroll(canvas);
      });
    });
    const state: Layout = {
      size: measureLayout(canvas), callbacks: new Set(), observer,
      frame: 0, refreshFrame: 0, refreshTimer: undefined, lastScroll: -Infinity,
      onScroll: () => { state.lastScroll = performance.now(); },
    };
    layout = state;
    layouts.set(canvas, layout);
    canvas.style.setProperty("--royal-layout-height", `${layout.size.height}px`);
    canvas.addEventListener("scroll", state.onScroll, { passive: true });
    observer.observe(canvas);
  }
  layout.callbacks.add(callback);
  callback(layout.size);
  return () => {
    layout.callbacks.delete(callback);
    if (layout.callbacks.size) return;
    layout.observer.disconnect();
    cancelAnimationFrame(layout.frame);
    cancelAnimationFrame(layout.refreshFrame);
    clearTimeout(layout.refreshTimer);
    canvas.removeEventListener("scroll", layout.onScroll);
    layouts.delete(canvas);
  };
}
