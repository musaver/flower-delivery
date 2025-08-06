// app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { verification_tokens } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(req: Request) {
  // Magic link callback
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')!;
  const token = searchParams.get('token')!;
  
  // Look up the OTP entry
  const tokenRow = await db.select().from(verification_tokens).where(eq(verification_tokens.identifier, email)).limit(1);
  if (!tokenRow.length) {
    return NextResponse.json({ error: "OTP not found" }, { status: 400 });
  }
  const { token: hashedOtp, expires } = tokenRow[0];
  //if (new Date() > new Date(expires)) {
  //  return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  //}
  const valid = await bcrypt.compare(token, hashedOtp);
  if (!valid) {
    return NextResponse.json({ error: token }, { status: 400 });
  }
  // OTP valid: clean up and sign in user
  await db.delete(verification_tokens).where(eq(verification_tokens.identifier, email));

  // Check if user already exists
  const [existingUser] = await db.select().from(user).where(eq(user.email, email));
  if (existingUser) {
    return NextResponse.json({ 
      success: true, 
      message: 'User logged in successfully.',
      redirectUrl: '/dashboard'
    });
  } else {
    // Insert new user
    await db.insert(user).values({
      id: uuidv4(),
      email,
    });

    await sendWelcomeEmail(email,  undefined);

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully.',
      redirectUrl: '/dashboard'
    });
  }
}