import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { CartProvider } from './store/CartContext'
import { startMockApi } from './mocks/browser'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 401/403/404 par retry bekaar hai — wo apne aap theek nahi honge.
      retry: (failureCount, error) =>
        ![401, 403, 404].includes(error?.status) && failureCount < 2,
    },
  },
})

// Mock API pehle start hoti hai, warna app ki pehli request intercept nahi hogi.
startMockApi().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <App />
              <Toaster position="top-center" richColors closeButton />
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  )
})
