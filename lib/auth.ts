import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: undefined, // Using credentials provider, no adapter needed
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            return null
          }

          // Normalize email (lowercase and trim)
          const normalizedEmail = credentials.email.toLowerCase().trim()

          console.log('[AUTH] Attempting authorization for:', normalizedEmail)
          console.log('[AUTH] Password provided:', credentials.password ? 'Yes' : 'No')

          // Query user directly - Prisma will handle connection automatically
          const user = await Promise.race([
            prisma.user.findUnique({
              where: { email: normalizedEmail }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 5000)
            )
          ]) as any

          if (!user) {
            console.log('[AUTH] User not found:', normalizedEmail)
            return null
          }

          console.log('[AUTH] User found:', { id: user.id, email: user.email, role: user.role })
          console.log('[AUTH] Stored password hash length:', user.password.length)
          console.log('[AUTH] Stored password hash (first 30 chars):', user.password.substring(0, 30))
          console.log('[AUTH] Provided password length:', credentials.password.length)
          console.log('[AUTH] Provided password (first 10 chars):', credentials.password.substring(0, 10))
          console.log('[AUTH] Provided password bytes:', Buffer.from(credentials.password).toString('hex').substring(0, 20))

          // Trim password to handle any whitespace issues
          const trimmedPassword = credentials.password.trim()
          
          const isPasswordValid = await bcrypt.compare(
            trimmedPassword,
            user.password
          )

          console.log('[AUTH] Password comparison result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', normalizedEmail)
            return null
          }

          console.log('[AUTH] Authorization successful for:', normalizedEmail)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: any) {
          console.error('[AUTH] Authorization error:', error)
          console.error('[AUTH] Error stack:', error.stack)
          // Don't return null on database errors - throw to see the actual error
          if (error.message?.includes('Database connection')) {
            throw error
          }
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

