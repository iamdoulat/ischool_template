"use client";

import { useEffect, useRef } from "react";

interface CustomCodeInjectorProps {
  headCode?: string;
  bodyCode?: string;
  footerCode?: string;
}

/**
 * Executes <script> tags inserted via HTML strings that browsers do not
 * run by default when set through innerHTML or React hydration.
 */
function executeScripts(container: HTMLElement, sourceAttr: string) {
  const scripts = container.querySelectorAll("script");
  scripts.forEach((oldScript) => {
    // Prevent double execution if already processed
    if (oldScript.getAttribute("data-injected") === "true") return;

    const newScript = document.createElement("script");
    // Copy all attributes (src, async, defer, type, crossorigin, etc.)
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.setAttribute("data-injected", "true");
    newScript.setAttribute("data-source", sourceAttr);

    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent;
    }

    // Replace old script with new executable script
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  });
}

/**
 * Injects custom head code dynamically into document.head on the client side.
 */
function injectIntoHead(codeString: string) {
  if (!codeString || typeof document === "undefined") return;

  // Remove previously injected head nodes
  const prevElements = document.head.querySelectorAll('[data-injected-from="custom-head-code"]');
  prevElements.forEach((el) => el.remove());

  // Parse codeString
  const parser = new DOMParser();
  const doc = parser.parseFromString(codeString, "text/html");

  // Move head/body child nodes into document.head
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
        // Any other element (e.g. noscript or comments)
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
    if (headCode && headCode.trim()) {
      try {
        injectIntoHead(headCode);
      } catch (err) {
        console.warn("Head custom code execution warning:", err);
      }
    }

    // 2. Execute any <script> tags inside body code container
    if (bodyContainerRef.current && bodyCode) {
      try {
        executeScripts(bodyContainerRef.current, "body-code");
      } catch (err) {
        console.warn("Body custom code execution warning:", err);
      }
    }

    // 3. Execute any <script> tags inside footer code container
    if (footerContainerRef.current && footerCode) {
      try {
        executeScripts(footerContainerRef.current, "footer-code");
      } catch (err) {
        console.warn("Footer custom code execution warning:", err);
      }
    }
  }, [headCode, bodyCode, footerCode]);

  return (
    <>
      {bodyCode ? (
        <div
          ref={bodyContainerRef}
          id="custom-body-code-container"
          className="custom-body-injected-code"
          dangerouslySetInnerHTML={{ __html: bodyCode }}
        />
      ) : null}

      {footerCode ? (
        <div
          ref={footerContainerRef}
          id="custom-footer-code-container"
          className="custom-footer-injected-code"
          dangerouslySetInnerHTML={{ __html: footerCode }}
        />
      ) : null}
    </>
  );
}
