'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useParams } from 'next/navigation'

interface PublicUser {
  id: string
  displayName: string | null
  name: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  verified: boolean
  joinedAt: string
  reviewsCount: number
}

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (!res.ok) {
          setUser(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        setUser(data)
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchUser()
  }, [userId])

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-gray-400">Loading profile...</div>
          ) : !user ? (
            <div className="text-gray-400">Profile not found.</div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-lg">
                      {(user.displayName || user.name || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-white text-xl font-light">
                      {user.displayName || user.name || 'User'}
                    </div>
                    {user.verified && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium" title="Verified">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">
                    Joined {new Date(user.joinedAt).toLocaleDateString()}
                  </div>
                  <div className="text-gray-400 text-sm">{user.reviewsCount} review(s)</div>
                </div>
              </div>
              {user.bio && <p className="text-gray-300 text-sm leading-relaxed">{user.bio}</p>}
              <div className="flex flex-col gap-2 text-sm text-gray-300">
                {user.location && <div>Location: {user.location}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

