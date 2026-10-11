// One-time setup: connects your Google account and saves a refresh token.
//
//   npm run google:auth
//
// What happens:
//   1. This script starts a tiny web server on your own machine.
//   2. Your browser opens Google's consent page.
//   3. Google redirects back to that local server with a one-time code.
//   4. The script trades the code for a refresh token and writes it into
//      .env.local. The token is never printed.

import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const ENV_FILE = ".env.local";
// Everything the dashboard may do with your Google account. Both are
// read-only, and the Gmail one cannot open message bodies at all.
// After changing this list, run the script again to grant the new access.
const SCOPES = [
  // Calendar: read events.
  "https://www.googleapis.com/auth/calendar.events.readonly",
  // Gmail: read senders, subjects and labels only.
  "https://www.googleapis.com/auth/gmail.metadata",
];

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!existsSync(ENV_FILE)) {
  fail(`No ${ENV_FILE} found. Run this from the project folder, after copying .env.example.`);
}
process.loadEnvFile(ENV_FILE);

const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
if (!clientId || !clientSecret) {
  fail(`Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to ${ENV_FILE} first (see the README).`);
}

// A random value we send to Google and expect back unchanged. It proves the
// redirect we receive belongs to the sign-in that this script started.
const state = randomBytes(16).toString("hex");

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname !== "/callback") {
    response.writeHead(404).end();
    return;
  }

  const finish = (message, ok) => {
    response.writeHead(ok ? 200 : 400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`${message}\n\nYou can close this tab.`);
    server.close();
    if (ok) console.log(`\n${message}\n`);
    else fail(message);
  };

  if (url.searchParams.get("state") !== state) {
    return finish("That response didn't match this sign-in attempt. Please run the script again.", false);
  }
  const code = url.searchParams.get("code");
  if (!code) {
    return finish("Google sign-in was cancelled, so nothing was saved.", false);
  }

  try {
    const refreshToken = await exchangeCodeForRefreshToken(code);
    saveToEnvFile("GOOGLE_REFRESH_TOKEN", refreshToken);
    finish(`Connected. Saved GOOGLE_REFRESH_TOKEN to ${ENV_FILE}. Restart the dev server to use it.`, true);
  } catch (error) {
    finish(error.message, false);
  }
});

// Port 0 asks the operating system for any free port.
server.listen(0, "127.0.0.1", () => {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    // Google expects the list as one string separated by spaces.
    scope: SCOPES.join(" "),
    state,
    // "offline" + "consent" together make Google issue a refresh token.
    access_type: "offline",
    prompt: "consent",
  }).toString();

  console.log("\nOpening Google in your browser. If nothing opens, visit this link:\n");
  console.log(`${authUrl}\n`);
  if (process.platform === "darwin") execFile("open", [authUrl.toString()], () => {});
});

function redirectUri() {
  return `http://127.0.0.1:${server.address().port}/callback`;
}

async function exchangeCodeForRefreshToken(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // `error` is a short code such as "invalid_client". It holds no secrets.
    throw new Error(`Google refused the sign-in (${body.error ?? response.status}). Check the client ID and secret.`);
  }
  if (!body.refresh_token) {
    throw new Error("Google didn't return a refresh token. Please run the script again.");
  }
  return body.refresh_token;
}

/** Sets KEY=value in the env file, replacing the line if it already exists. */
function saveToEnvFile(key, value) {
  const lines = readFileSync(ENV_FILE, "utf8").split("\n");
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));

  if (index >= 0) {
    lines[index] = `${key}=${value}`;
  } else {
    if (lines.at(-1) === "") lines.pop();
    lines.push(`${key}=${value}`, "");
  }
  writeFileSync(ENV_FILE, lines.join("\n"));
}
