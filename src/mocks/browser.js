/**
 * Mock API tab chalti hai jab REACT_APP_ENABLE_MOCK_API=true.
 * Real backend ready ho to .env mein false karo — UI same rahegi.
 */
export async function startMockApi() {
  if (process.env.REACT_APP_ENABLE_MOCK_API !== "true") return;

  const [{ setupWorker }, { handlers }] = await Promise.all([
    import("msw/browser"),
    import("./handlers"),
  ]);

  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: "/mockServiceWorker.js" },
  });

  // eslint-disable-next-line no-console
  console.info(
    "[mock api] MSW running →",
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1"
  );
}
