import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

// Page guards (use redirects)
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'admin') {
    redirect('/')
  }
  return session
}

// API guards (return structured errors instead of redirecting)
export async function requireAuthApi() {
  const session = await getServerSession(authOptions)
  if (!session) {
    const error: any = new Error('Unauthorized')
    error.status = 401
    throw error
  }
  return session
}

export async function requireAdminApi() {
  const session = await requireAuthApi()
  if (session.user.role !== 'admin') {
    const error: any = new Error('Forbidden')
    error.status = 403
    throw error
  }
  return session
}

