(function galCodexRtlRuntime() {
  const STYLE_ID = "gal-codex-rtl-style";
  const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  const STRONG_RTL_RE = /[\u0590-\u05FF\u0600-\u06FF]/g;
  const LATIN_RUN_RE = /[A-Za-z][A-Za-z0-9._:/\\+@#-]*(?:\s+[A-Za-z][A-Za-z0-9._:/\\+@#-]*)*/g;
  const processedText = new WeakMap();
  const pending = new Set();
  let scheduled = false;

  const TEXT_SELECTOR = [
    "article",
    "[data-message-author-role]",
    "[data-testid*='message' i]",
    "[class*='message' i]",
    "[class*='markdown' i]",
    "[class*='whitespace-pre-wrap' i]",
    "[class*='break-words' i]",
    "main p",
    "main li",
    "main blockquote",
    "p",
    "li",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
  ].join(",");

  const EDITOR_SELECTOR = [
    "textarea",
    "input[type='text']",
    "input[type='search']",
    "[contenteditable='true']",
    "[role='textbox']"
  ].join(",");

  const COMPOSER_CONTAINER_SELECTOR = [
    "form",
    "[data-testid*='composer' i]",
    "[class*='composer' i]",
    "[class*='prompt' i]"
  ].join(",");

  const CODE_SELECTOR = [
    "pre",
    "code",
    "kbd",
    "samp",
    "var",
    ".cm-editor",
    ".monaco-editor",
    ".hljs",
    "[data-language]",
    "[data-testid*='code' i]",
    "[data-testid*='terminal' i]",
    "[class*='code' i]",
    "[class*='diff' i]",
    "[class*='terminal' i]",
    "[class*='monaco' i]",
    "[class*='shiki' i]",
    "[class~='font-mono']",
    "[class~='font-mono-default']"
  ].join(",");

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }

    style.textContent = window.__GAL_CODEX_RTL_STYLE__ || "";
    document.documentElement.dataset.galCodexRtlRoot = "true";
  }

  function textOf(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value || element.placeholder || "";
    }
    return element.innerText || element.textContent || "";
  }

  function isCodeLike(element) {
    return Boolean(element?.closest?.(CODE_SELECTOR));
  }

  function isEditor(element) {
    return Boolean(element?.matches?.(EDITOR_SELECTOR));
  }

  function isComposerContainer(element) {
    return Boolean(element?.closest?.(COMPOSER_CONTAINER_SELECTOR));
  }

  function classify(text) {
    if (!RTL_RE.test(text)) return "ltr";
    const rtlCount = (text.match(STRONG_RTL_RE) || []).length;
    const latinCount = (text.match(/[A-Za-z]/g) || []).length;
    return rtlCount >= Math.max(1, latinCount * 0.2) ? "rtl" : "mixed";
  }

  function setRtl(element, value) {
    if (value) {
      element.dataset.galCodexRtl = "true";
      element.setAttribute("dir", "rtl");
    } else {
      element.removeAttribute("data-gal-codex-rtl");
      if (isEditor(element)) {
        element.setAttribute("dir", "auto");
      }
    }
  }

  function applyEditorDirection(element) {
    if (!isEditor(element) || isCodeLike(element)) return;
    const text = textOf(element);
    const mode = classify(text);

    if (mode === "rtl" || mode === "mixed") {
      setRtl(element, true);
      const container = element.closest(COMPOSER_CONTAINER_SELECTOR);
      if (container instanceof HTMLElement) {
        container.dataset.galCodexRtlComposer = "true";
      }
      return;
    }

    setRtl(element, false);
  }

  function hasDirectRtlText(element) {
    return Array.from(element.childNodes).some((node) => {
      return node.nodeType === Node.TEXT_NODE && RTL_RE.test(node.textContent || "");
    });
  }

  function applyTextDirection(element) {
    if (!(element instanceof HTMLElement) || isCodeLike(element) || isEditor(element) || isComposerContainer(element)) {
      return;
    }

    const text = textOf(element).trim();
    if (!text || !RTL_RE.test(text)) return;

    if (processedText.get(element) === text) return;
    processedText.set(element, text);

    const mode = classify(text);
    if (mode === "rtl" || hasDirectRtlText(element)) {
      setRtl(element, true);
      isolateLatinRuns(element);
    } else if (mode === "mixed") {
      element.dataset.galCodexBidi = "auto";
      element.setAttribute("dir", "auto");
    }
  }

  function isolateLatinRuns(element) {
    if (!element?.dataset?.galCodexRtl || isCodeLike(element) || isEditor(element)) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest(`${CODE_SELECTOR}, [data-gal-codex-ltr-run], ${EDITOR_SELECTOR}`)) continue;
      if (/[A-Za-z]/.test(node.textContent || "")) textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const matches = Array.from(text.matchAll(LATIN_RUN_RE));
      if (matches.length === 0) continue;

      const fragment = document.createDocumentFragment();
      let offset = 0;

      for (const match of matches) {
        const index = match.index || 0;
        fragment.append(text.slice(offset, index));

        const trailingPunctuation = match[0].match(/[.,;:!?]+$/)?.[0] || "";
        const latinText = trailingPunctuation ? match[0].slice(0, -trailingPunctuation.length) : match[0];
        const bdi = document.createElement("bdi");
        bdi.dir = "ltr";
        bdi.dataset.galCodexLtrRun = "true";
        bdi.textContent = latinText;
        fragment.append(bdi);
        fragment.append(trailingPunctuation);
        offset = index + match[0].length;
      }

      fragment.append(text.slice(offset));
      textNode.replaceWith(fragment);
    }
  }

  function forceCodeLtr(root) {
    if (root.matches?.(CODE_SELECTOR)) {
      root.dataset.galCodexCodeLtr = "true";
      root.setAttribute("dir", "ltr");
    }
    root.querySelectorAll?.(CODE_SELECTOR).forEach((element) => {
      element.dataset.galCodexCodeLtr = "true";
      element.setAttribute("dir", "ltr");
    });
  }

  function scan(root = document.body) {
    if (!(root instanceof HTMLElement)) return;

    forceCodeLtr(root);

    if (root.matches?.(EDITOR_SELECTOR)) applyEditorDirection(root);
    root.querySelectorAll?.(EDITOR_SELECTOR).forEach(applyEditorDirection);

    if (root.matches?.(TEXT_SELECTOR)) applyTextDirection(root);
    root.querySelectorAll?.(TEXT_SELECTOR).forEach(applyTextDirection);
  }

  function scheduleScan(root) {
    if (!(root instanceof HTMLElement)) return;
    pending.add(root);

    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      const batch = Array.from(pending).slice(0, 50);
      pending.clear();
      batch.forEach(scan);
    });
  }

  ensureStyle();
  scan(document.body);

  document.addEventListener(
    "input",
    (event) => {
      if (event.target instanceof HTMLElement) {
        applyEditorDirection(event.target);
      }
    },
    true
  );

  if (window.__GAL_CODEX_RTL_OBSERVER__) {
    window.__GAL_CODEX_RTL_OBSERVER__.disconnect();
  }

  window.__GAL_CODEX_RTL_OBSERVER__ = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent) scheduleScan(parent);
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) scheduleScan(node);
      }
    }
  });

  window.__GAL_CODEX_RTL_OBSERVER__.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true
  });

  window.__GAL_CODEX_RTL_ACTIVE__ = true;
})();

