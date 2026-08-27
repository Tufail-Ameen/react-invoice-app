import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const CART_KEY = 'nexa.cart'
const CartContext = createContext(null)

/**
 * Cart client-side hai — is par bharosa mat karein.
 * Checkout ke waqt server sirf `productId` + `quantity` leta hai aur qeemat
 * apne database se nikalta hai. Client ka bheja hua price kabhi trust na karein.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product, quantity = 1) => {
    setItems((previous) => {
      const existing = previous.find((item) => item.productId === product.id)
      if (existing) {
        return previous.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        )
      }
      return [
        ...previous,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          imageUrl: product.imageUrl,
          maxStock: product.stock,
          quantity: Math.min(quantity, product.stock),
        },
      ]
    })
    toast.success(`${product.name} cart mein add ho gaya.`)
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setItems((previous) =>
      previous
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, Math.min(quantity, item.maxStock ?? 99)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const remove = useCallback((productId) => {
    setItems((previous) => previous.filter((item) => item.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      isEmpty: items.length === 0,
      add,
      setQuantity,
      remove,
      clear,
    }
  }, [items, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>.')
  return context
}
