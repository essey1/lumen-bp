import { prisma } from "@/lib/prisma"

/**
 * Cleanup cron job for expired OTPs
 * Can be called periodically (e.g., every 5 minutes)
 * 
 * Usage with node-cron (optional):
 * Install: npm install node-cron
 * 
 * import cron from 'node-cron'
 * import { cleanupExpiredOTPsCron } from '@/lib/otp-cleanup'
 * 
 * // Run cleanup every 5 minutes
 * cron.schedule('*/5 * * * *', cleanupExpiredOTPsCron)
 */

export async function cleanupExpiredOTPsCron(): Promise<{ deleted: number }> {
  try {
    const result = await prisma.otp.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })

    console.log(`[OTP Cleanup] Deleted ${result.count} expired OTPs`)
    return { deleted: result.count }
  } catch (error) {
    console.error("[OTP Cleanup] Error:", error)
    throw error
  }
}

/**
 * Alternative: Create a cleanup route that can be called by an external cron service
 * GET /api/cron/cleanup-otps (protected with CRON_SECRET)
 */
