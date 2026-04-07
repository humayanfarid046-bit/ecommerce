/**
 * Quick smoke test: storefront + API respond (run after `npm run dev`).
 * Usage: node scripts/stack-health.mjs
 * Env: STACK_WEB_URL, STACK_API_HEALTH_URL (optional overrides)
 */

const WEB = process.env.STACK_WEB_URL ?? "http://127.0.0.1:3000";
const API_HEALTH =
  process.env.STACK_API_HEALTH_URL ?? "http://127.0.0.1:4000/health";

async function check(name, url, okWhen) {
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
    if (okWhen(res)) {
      console.log(`OK   ${name} (${res.status}) ${url}`);
      return true;
    }
    console.error(`FAIL ${name} (${res.status}) ${url}`);
    return false;
  } catch (e) {
    console.error(`FAIL ${name} ${url}`, e?.message ?? e);
    return false;
  }
}

const main = async () => {
  const a = await check(
    "Express API",
    API_HEALTH,
    (r) => r.ok && r.headers.get("content-type")?.includes("json")
  );
  const b = await check(
    "Next.js web",
    WEB,
    (r) => r.ok || r.status === 307 || r.status === 308 || r.status === 404
  );
  process.exit(a && b ? 0 : 1);
};

main();
