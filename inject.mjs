import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const once = args.has("--once");
const watch = args.has("--watch") || !once;
const dryRun = args.has("--dry-run");
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const port = Number(portArg?.split("=")[1] || process.env.CODEX_RTL_PORT || 9223);
const pollMs = Number(process.env.CODEX_RTL_POLL_MS || 2000);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("CODEX_RTL_PORT must be an integer between 1024 and 65535.");
}

if (!Number.isInteger(pollMs) || pollMs < 500 || pollMs > 60000) {
  throw new Error("CODEX_RTL_POLL_MS must be an integer between 500 and 60000.");
}

if (typeof WebSocket !== "function") {
  throw new Error("This Node.js runtime does not provide WebSocket. Use Node.js 22+.");
}

const css = readFileSync(resolve(here, "src", "rtl-style.css"), "utf8");
const runtime = readFileSync(resolve(here, "src", "rtl-runtime.js"), "utf8");

if (dryRun) {
  if (!css.includes("unicode-bidi") || !runtime.includes("MutationObserver")) {
    throw new Error("RTL assets look incomplete.");
  }
  console.log("OK: RTL assets are present.");
  process.exit(0);
}

const endpoint = `http://127.0.0.1:${port}/json`;
const injectedTargets = new Map();

async function getTargets() {
  let response;
  try {
    response = await fetch(endpoint);
  } catch {
    throw new Error(`Cannot reach ${endpoint}. Start Codex with the macOS or Windows launcher first.`);
  }

  if (!response.ok) {
    throw new Error(`DevTools endpoint returned HTTP ${response.status}.`);
  }

  return response.json();
}

function isLikelyCodexTarget(target) {
  const haystack = `${target.title || ""} ${target.url || ""}`.toLowerCase();
  return Boolean(
    target.webSocketDebuggerUrl &&
      target.type !== "browser" &&
      (haystack.includes("codex") ||
        haystack.includes("chatgpt.com") ||
        haystack.includes("app://") ||
        haystack.includes("localhost"))
  );
}

function assertLocalDevToolsUrl(wsUrl) {
  const url = new URL(wsUrl);
  if (!["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname)) {
    throw new Error(`Refusing non-local DevTools target: ${url.hostname}`);
  }
}

function evaluate(wsUrl, expression) {
  assertLocalDevToolsUrl(wsUrl);

  return new Promise((resolvePromise, rejectPromise) => {
    const ws = new WebSocket(wsUrl);
    const id = 1;
    const timeout = setTimeout(() => {
      ws.close();
      rejectPromise(new Error("Timed out while injecting RTL patch."));
    }, 8000);

    function cleanup() {
      clearTimeout(timeout);
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("error", handleError);
    }

    function handleOpen() {
      ws.send(
        JSON.stringify({
          id,
          method: "Runtime.evaluate",
          params: {
            expression,
            awaitPromise: false,
            returnByValue: true
          }
        })
      );
    }

    function handleMessage(event) {
      const message = JSON.parse(String(event.data));
      if (message.id !== id) return;

      cleanup();
      ws.close();

      if (message.error || message.result?.exceptionDetails) {
        rejectPromise(new Error(JSON.stringify(message.error || message.result.exceptionDetails)));
        return;
      }

      resolvePromise(message.result);
    }

    function handleError(error) {
      cleanup();
      rejectPromise(error);
    }

    ws.addEventListener("open", handleOpen);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("error", handleError);
  });
}

async function injectOnce({ allowEmpty = false } = {}) {
  const targets = await getTargets();
  const candidates = targets.filter(isLikelyCodexTarget);

  if (candidates.length === 0) {
    if (allowEmpty) return false;
    throw new Error("No Codex-like renderer target found. Open a Codex conversation and try again.");
  }

  const expression = `
(() => {
  window.__GAL_CODEX_RTL_STYLE__ = ${JSON.stringify(css)};
  const source = ${JSON.stringify(runtime)};
  (0, eval)(source);
  return Boolean(window.__GAL_CODEX_RTL_ACTIVE__);
})()
`;

  for (const target of candidates) {
    const key = target.id || target.webSocketDebuggerUrl;
    if (injectedTargets.get(key) === target.webSocketDebuggerUrl) continue;

    await evaluate(target.webSocketDebuggerUrl, expression);
    injectedTargets.set(key, target.webSocketDebuggerUrl);
    console.log(`Injected RTL into: ${target.title || target.url}`);
  }

  return true;
}

if (watch) {
  console.log(`Watching Codex renderer targets on ${endpoint}...`);
  console.log("Press Ctrl+C to stop the injector.");

  let ready = false;
  while (!ready) {
    try {
      ready = await injectOnce({ allowEmpty: true });
    } catch (error) {
      console.error(error.message);
    }

    if (!ready) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, pollMs));
    }
  }

  setInterval(() => {
    injectOnce({ allowEmpty: true }).catch((error) => {
      console.error(error.message);
    });
  }, pollMs);
} else {
  await injectOnce();
}
