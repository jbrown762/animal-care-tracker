import { spawn, spawnSync } from "node:child_process";

const PORT = Number(process.env.PORT ?? 8081);
const LOCAL_URL = `http://localhost:${PORT}`;
const NGROK_API_PORTS = [4040, 4041, 4042, 4043, 4044, 4045];
const children = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function isExpoReady() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(LOCAL_URL, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function findNgrokTunnel() {
  for (const apiPort of NGROK_API_PORTS) {
    const payload = await fetchJson(`http://127.0.0.1:${apiPort}/api/tunnels`);
    const tunnel = payload?.tunnels?.find((candidate) => {
      const address = candidate.config?.addr ?? "";
      return candidate.proto === "https" && (address.endsWith(`:${PORT}`) || address.endsWith(`:${PORT}/`));
    });
    if (tunnel?.public_url) {
      return { apiPort, publicUrl: tunnel.public_url };
    }
  }
  return null;
}

function spawnCommand(command, args) {
  const child = process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
        env: {
          ...process.env,
          CI: "1",
          EXPO_NO_TELEMETRY: "1"
        },
        shell: false,
        stdio: "inherit"
      })
    : spawn(command, args, {
    env: {
      ...process.env,
      CI: "1",
      EXPO_NO_TELEMETRY: "1"
    },
    shell: false,
    stdio: "inherit"
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function commandName(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

async function waitForExpo() {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (await isExpoReady()) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function waitForNgrok() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const tunnel = await findNgrokTunnel();
    if (tunnel) {
      return tunnel;
    }
    await sleep(1000);
  }
  return null;
}

function printUrls(publicUrl) {
  console.log("");
  console.log("Animal Care Tracker is running:");
  console.log(`Local:  ${LOCAL_URL}`);
  console.log(`Ngrok:  ${publicUrl}`);
  console.log("");
  console.log("Press Ctrl+C to stop processes started by this command.");
}

function shutdown() {
  for (const child of children) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill();
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (await isExpoReady()) {
  console.log(`Expo is already running on ${LOCAL_URL}.`);
} else {
  console.log(`Starting Expo on ${LOCAL_URL}...`);
  spawnCommand(commandName("npx"), ["expo", "start", "--web", "--port", String(PORT), "--clear"]);
}

if (!(await waitForExpo())) {
  console.error(`Expo did not become ready on ${LOCAL_URL}.`);
  shutdown();
}

let tunnel = await findNgrokTunnel();
if (tunnel) {
  console.log(`ngrok is already tunneling ${LOCAL_URL} on API port ${tunnel.apiPort}.`);
} else {
  console.log(`Starting ngrok for ${LOCAL_URL}...`);
  spawnCommand(commandName("ngrok"), ["http", String(PORT), "--log", "stdout"]);
  tunnel = await waitForNgrok();
}

if (!tunnel) {
  console.error("ngrok did not expose a tunnel. Check ngrok auth/config and any existing reserved endpoint sessions.");
  shutdown();
}

printUrls(tunnel.publicUrl);
setInterval(() => {}, 60 * 60 * 1000);
