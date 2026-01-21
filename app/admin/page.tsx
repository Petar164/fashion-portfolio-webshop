import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth-helpers'
import AdminDashboard from '@/components/AdminDashboard'

// Force dynamic rendering to skip static generation
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  await requireAdmin()
  
  return <AdminDashboard />
}
