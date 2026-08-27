/**
 * Mock backend sirf tab chalta hai jab VITE_ENABLE_MOCK_API=true ho.
 * Jab aapka asli backend tayyar ho jaye, `.env` mein `false` kar dein —
 * frontend ka ek line code badalne ki zaroorat nahi padegi.
 *
 * MSW aur handlers dynamic import se aate hain, is liye mock band hone par
 * ye production bundle mein shamil hi nahi hote.
 */
export async function startMockApi() {
  if (import.meta.env.VITE_ENABLE_MOCK_API !== 'true') return

  const [{ setupWorker }, { handlers }] = await Promise.all([
    import('msw/browser'),
    import('./handlers'),
  ])

  const worker = setupWorker(...handlers)

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })

  console.info(
    '%c[mock api] MSW chal raha hai. Endpoints:%c ' + import.meta.env.VITE_API_BASE_URL,
    'color:#7c3aed;font-weight:600',
    'color:inherit'
  )
}
