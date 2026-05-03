import { prisma } from "@/lib/prisma"

export async function sendOTP(email: string, code: string): Promise<void> {
  // TODO: Implement email sending service
  // For now, this is a placeholder
  // You can integrate with services like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Resend
  
  console.log(`[EMAIL] Sending OTP ${code} to ${email}`)
  
  // Example with Resend (uncomment and add resend dependency):
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: email,
  //   subject: 'Your verification code',
  //   html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 5 minutes.</p>`
  // })
}

export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.otp.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  } catch (error) {
    console.error("OTP cleanup error:", error)
  }
}
