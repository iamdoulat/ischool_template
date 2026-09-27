"use client";

import { useEffect, useRef } from "react";

interface CustomCodeInjectorProps {
  headCode?: string;
  bodyCode?: string;
  footerCode?: string;
}

/**
 * Injects custom HTML & scripts cleanly into a dedicated container element.
 * By populating the container via DOM manipulation (instead of React's dangerouslySetInnerHTML),
 * React does NOT track individual child nodes or scripts in its Virtual DOM fiber tree.
 * This completely prevents:
 *  1. React SSR hydration mismatch
 *  2. "Cannot read properties of null (reading 'removeChild')" when React attempts to unmount replaced scripts.
 */
function injectHtmlAndScripts(
  container: HTMLElement,
  codeString?: string,
  sourceAttr: string = "injected-code"
) {
  if (!container || typeof document === "undefined") return;

  // Clear previous content safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (!codeString || !codeString.trim()) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(codeString, "text/html");

  const nodes = Array.from(doc.head.childNodes).concat(Array.from(doc.body.childNodes));
  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName.toLowerCase() === "script") {
        const s = document.createElement("script");
        Array.from(el.attributes).forEach((attr) => {
          s.setAttribute(attr.name, attr.value);
        });
        s.setAttribute("data-injected", "true");
        s.setAttribute("data-source", sourceAttr);
        if (el.textContent) {
          s.textContent = el.textContent;
        }
        container.appendChild(s);
      } else {
        container.appendChild(el.cloneNode(true));
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      container.appendChild(node.cloneNode(true));
    }
  });
}

/**
 * Injects custom head code dynamically into document.head on the client side.
 */
function injectIntoHead(codeString?: string) {
  if (typeof document === "undefined") return;

  // Remove previously injected head nodes safely
  const prevElements = document.head.querySelectorAll('[data-injected-from="custom-head-code"]');
  prevElements.forEach((el) => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  if (!codeString || !codeString.trim()) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(codeString, "text/html");

  const nodesToInject = Array.from(doc.head.childNodes).concat(Array.from(doc.body.childNodes));
  nodesToInject.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName.toLowerCase() === "script") {
        const s = document.createElement("script");
        Array.from(el.attributes).forEach((attr) => {
          s.setAttribute(attr.name, attr.value);
        });
        s.setAttribute("data-injected-from", "custom-head-code");
        s.setAttribute("data-injected", "true");
        if (el.textContent) {
          s.textContent = el.textContent;
        }
        document.head.appendChild(s);
      } else if (el.tagName.toLowerCase() === "style") {
        const st = document.createElement("style");
        Array.from(el.attributes).forEach((attr) => {
          st.setAttribute(attr.name, attr.value);
        });
        st.setAttribute("data-injected-from", "custom-head-code");
        st.textContent = el.textContent || "";
        document.head.appendChild(st);
      } else if (el.tagName.toLowerCase() === "meta" || el.tagName.toLowerCase() === "link") {
        const clone = document.createElement(el.tagName.toLowerCase());
        Array.from(el.attributes).forEach((attr) => {
          clone.setAttribute(attr.name, attr.value);
        });
        clone.setAttribute("data-injected-from", "custom-head-code");
        document.head.appendChild(clone);
      } else {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-injected-from", "custom-head-code");
        document.head.appendChild(clone);
      }
    }
  });
}

export function ClientCodeInjector({
  headCode,
  bodyCode,
  footerCode,
}: CustomCodeInjectorProps) {
  const footerContainerRef = useRef<HTMLDivElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Inject Head Code into document.head
    try {
      injectIntoHead(headCode);
    } catch (err) {
      console.warn("Head custom code execution warning:", err);
    }

    // 2. Inject Body Code into body container
    if (bodyContainerRef.current) {
      try {
        injectHtmlAndScripts(bodyContainerRef.current, bodyCode, "body-code");
      } catch (err) {
        console.warn("Body custom code execution warning:", err);
      }
    }

    // 3. Inject Footer Code into footer container
    if (footerContainerRef.current) {
      try {
        injectHtmlAndScripts(footerContainerRef.current, footerCode, "footer-code");
      } catch (err) {
        console.warn("Footer custom code execution warning:", err);
      }
    }
  }, [headCode, bodyCode, footerCode]);

  // React renders empty static container divs without children.
  // Because React manages zero children inside them, React Virtual DOM never tracks,
  // reconciles, or tries to unmount the dynamically injected scripts.
  return (
    <>
      <div
        ref={bodyContainerRef}
        id="custom-body-code-container"
        className="custom-body-injected-code"
        suppressHydrationWarning
      />
      <div
        ref={footerContainerRef}
        id="custom-footer-code-container"
        className="custom-footer-injected-code"
        suppressHydrationWarning
      />
    </>
  );
}
