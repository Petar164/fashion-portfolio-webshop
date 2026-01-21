export interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  sizes?: string[]
  colors?: string[]
  inStock: boolean
  featured?: boolean
  brand?: string
  material?: string
  weight?: number
  measurements?: string
  quantity?: number
}

// Server-side product management
// These functions are only used in API routes (server-side)

export const getProducts = async (): Promise<Product[]> => {
  // Only works server-side (in API routes)
  if (typeof window !== 'undefined') {
    return []
  }
  
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'products.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    // Return empty array if file doesn't exist
    return []
  }
}

export const getProduct = async (id: string): Promise<Product | null> => {
  const products = await getProducts()
  return products.find((p) => p.id === id) || null
}

export const saveProducts = async (products: Product[]): Promise<void> => {
  // Only works server-side
  if (typeof window !== 'undefined') {
    throw new Error('saveProducts can only be called server-side')
  }
  
  const fs = await import('fs/promises')
  const path = await import('path')
  const dataDir = path.join(process.cwd(), 'data')
  const filePath = path.join(dataDir, 'products.json')
  
  try {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(products, null, 2))
  } catch (error) {
    console.error('Error saving products:', error)
    throw error
  }
}

