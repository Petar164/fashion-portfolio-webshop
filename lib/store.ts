import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  cartId: string // Unique ID for cart item (combines product id, size, color)
  id: string // Product ID
  name: string
  price: number
  image: string
  category: string // Product category: 'tops', 'bottoms', 'footwear', 'accessories'
  quantity: number
  size?: string
  color?: string
  maxQuantity?: number // Maximum available stock
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'cartId'>, maxQuantity?: number) => boolean
  removeItem: (cartId: string) => void
  updateQuantity: (cartId: string, quantity: number, maxQuantity?: number) => boolean
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const generateCartId = (id: string, size?: string, color?: string): string => {
  return `${id}-${size || 'no-size'}-${color || 'no-color'}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, maxQuantity) => {
        const cartId = generateCartId(item.id, item.size, item.color)
        const existingItem = get().items.find((i) => i.cartId === cartId)
        const currentQuantity = existingItem ? existingItem.quantity : 0
        
        // Check stock availability
        if (maxQuantity !== undefined && currentQuantity >= maxQuantity) {
          return false // Stock limit reached
        }
        
        let newItems: CartItem[]
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1
          // Double-check stock when incrementing
          if (maxQuantity !== undefined && newQuantity > maxQuantity) {
            return false // Would exceed stock
          }
          newItems = get().items.map((i) =>
            i.cartId === cartId
              ? { ...i, quantity: newQuantity, maxQuantity }
              : i
          )
        } else {
          newItems = [...get().items, { ...item, quantity: 1, cartId, maxQuantity }]
        }
        
        set({ items: newItems })
        return true
      },
      removeItem: (cartId) => {
        const newItems = get().items.filter((i) => i.cartId !== cartId)
        set({ items: newItems })
      },
      updateQuantity: (cartId, quantity, maxQuantity) => {
        // Check stock availability
        if (maxQuantity !== undefined && quantity > maxQuantity) {
          return false // Would exceed stock
        }
        
        let newItems: CartItem[]
        if (quantity <= 0) {
          newItems = get().items.filter((i) => i.cartId !== cartId)
        } else {
          newItems = get().items.map((i) =>
            i.cartId === cartId ? { ...i, quantity, maxQuantity: maxQuantity ?? i.maxQuantity } : i
          )
        }
        set({ items: newItems })
        return true
      },
      clearCart: () => {
        set({ items: [] })
      },
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

