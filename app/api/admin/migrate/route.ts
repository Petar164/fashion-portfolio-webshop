import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()

    // Execute migration SQL directly
    try {
      // Check if review columns already exist
      const existingReviewColumns = await prisma.$queryRaw<Array<{Field: string}>>`
        SHOW COLUMNS FROM reviews WHERE Field IN ('orderId', 'paymentMethod', 'imageUrl', 'approved')
      `
      
      const existingReviewColumnNames = existingReviewColumns.map((col: any) => col.Field)
      const requiredReviewColumns = ['orderId', 'paymentMethod', 'imageUrl', 'approved']
      const missingReviewColumns = requiredReviewColumns.filter(col => !existingReviewColumnNames.includes(col))
      
      // Check if user verified column exists
      const existingUserColumns = await prisma.$queryRaw<Array<{Field: string}>>`
        SHOW COLUMNS FROM users WHERE Field = 'verified'
      `
      const userVerifiedExists = existingUserColumns.length > 0
      
      if (missingReviewColumns.length === 0 && userVerifiedExists) {
        return NextResponse.json({
          success: true,
          message: 'Migration already applied - all columns already exist',
        })
      }

      // Build ALTER TABLE statements for reviews
      const reviewAlterStatements: string[] = []
      if (!existingReviewColumnNames.includes('orderId')) {
        reviewAlterStatements.push('ADD COLUMN orderId VARCHAR(191) NULL')
      }
      if (!existingReviewColumnNames.includes('paymentMethod')) {
        reviewAlterStatements.push("ADD COLUMN paymentMethod VARCHAR(191) NOT NULL DEFAULT 'website'")
      }
      if (!existingReviewColumnNames.includes('imageUrl')) {
        reviewAlterStatements.push('ADD COLUMN imageUrl VARCHAR(191) NULL')
      }
      if (!existingReviewColumnNames.includes('approved')) {
        reviewAlterStatements.push('ADD COLUMN approved BOOLEAN NOT NULL DEFAULT false')
      }

      if (reviewAlterStatements.length > 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE reviews 
          ${reviewAlterStatements.join(',\n        ')}
        `)
      }

      // Add foreign key constraint if orderId was added
      if (!existingReviewColumnNames.includes('orderId')) {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE reviews 
            ADD CONSTRAINT reviews_orderId_fkey 
            FOREIGN KEY (orderId) REFERENCES orders(id) 
            ON DELETE SET NULL ON UPDATE CASCADE
          `)
        } catch (fkError: any) {
          // Foreign key might already exist, ignore error
          if (!fkError.message?.includes('Duplicate key name')) {
            console.warn('[MIGRATE] Foreign key constraint warning:', fkError.message)
          }
        }
      }

      // Add verified column to users table if it doesn't exist
      if (!userVerifiedExists) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE users 
          ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false
        `)
      }

      // Add foreign key constraint
      await prisma.$executeRawUnsafe(`
        ALTER TABLE reviews 
        ADD CONSTRAINT reviews_orderId_fkey 
        FOREIGN KEY (orderId) REFERENCES orders(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `)

      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
      })
    } catch (error: any) {
      // Check if columns already exist (different error message)
      if (error.message?.includes('Duplicate column name') || error.message?.includes('already exists')) {
        return NextResponse.json({
          success: true,
          message: 'Migration already applied - columns already exist',
        })
      }

      console.error('[MIGRATE] SQL Error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Migration failed',
          error: error.message || 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status })
    }
    console.error('[MIGRATE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to run migration' },
      { status: 500 }
    )
  }
}
