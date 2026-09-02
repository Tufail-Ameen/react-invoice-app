/**
 * Dummy MSW mock DB band.
 * Real API: REACT_APP_ENABLE_MOCK_API=false (default).
 */
export async function startMockApi() {
  if (process.env.REACT_APP_ENABLE_MOCK_API !== "true") {
    // eslint-disable-next-line no-console
    console.info(
      "[api] Real backend →",
      process.env.REACT_APP_API_BASE_URL || "http://localhost:5001"
    );
    return;
  }

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
    process.env.REACT_APP_API_BASE_URL
  );
}
