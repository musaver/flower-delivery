// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { verification_tokens } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  // Look up the OTP entry  
  const tokenRow = await db.select().from(verification_tokens).where(eq(email, verification_tokens.identifier)).limit(1);
  if (!tokenRow.length) {
    return NextResponse.json({ error: "OTP not found" }, { status: 400 });
  }
  const { otp: hashedOtp, expires } = tokenRow[0];
  //if (new Date() > new Date(expiresAt)) {
  //  return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  //}
  const valid = await bcrypt.compare(password, hashedOtp);
  if (!valid) {
    return NextResponse.json({ error: hashedOtp }, { status: 400 });
  }
  // OTP valid: clean up and sign in user
  await db.delete(verification_tokens).where(eq(email, verification_tokens.identifier));

  // Check if user already exists
  const [existingUser] = await db.select().from(user).where(eq(user.email, email));
  if (existingUser) {
    //return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
    return NextResponse.json({ success: true, message: 'User logged in successfully.' });
  } else {

  // Insert new user
  await db.insert(user).values({
    id: uuidv4(),
    email,
    name: name || null,
  });

  await sendWelcomeEmail(email, name || undefined);
  return NextResponse.json({ success: true, message: 'User registered successfully.' });
  }
}
