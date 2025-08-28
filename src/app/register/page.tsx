'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mail, ArrowLeft, User, FileText } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');

  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState('');
  const [accountPending, setAccountPending] = useState(false);
  const router = useRouter();

  const verifyOtp = async () => {
    setVerifying(true);
    setOtpError('');
    
    if (!password) {
      setOtpError('Verification code is required');
      setVerifying(false);
      return;
    }

    try {
      // Both login and register use the same endpoint since they both verify OTP
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ email, name, note, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases for pending/suspended accounts
        if (data.requiresApproval) {
          setOtpError(data.message || 'Your account is pending approval. Please wait for admin approval.');
          return;
        }
        if (data.suspended) {
          setOtpError(data.message || 'Your account has been suspended. Please contact support.');
          return;
        }
        setOtpError(data.error || 'Invalid verification code');
      } else {
        // Check if account requires approval
        if (data.requiresApproval) {
          setSuccess(data.message || 'Account created successfully! Your account is pending approval.');
          setAccountPending(true);
          // Don't attempt to login, just show success message
          return;
        }
        
        // Auto-login after verification for approved accounts
        const login = await signIn('credentials', {
          email,
          redirect: false,
        });

        if (login?.ok) {
          router.push('/dashboard');
        } else {
          setOtpError('Verified but login failed.');
        }
      }
    } catch (error) {
      setOtpError('An error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccess('');
    setEmailError('');

    if (!email) {
      setEmailError('Email is required');
      setSending(false);
      return;
    }

    const res = await fetch('/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: email,
        subject: 'Your Verification Code',
        message: 'Your verification code has been sent.',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setSuccess('Email sent successfully!');
      setStep('otp');
    } else {
      setEmailError(data.error || 'Failed to send email.');
    }
  };

  const resendOtp = async () => {
    setSending(true);
    setSuccess('');
    setOtpError('');

    const res = await fetch('/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to: email,
        subject: 'Your Verification Code',
        message: 'Your verification code has been sent.',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setSuccess('Verification code resent successfully!');
    } else {
      setOtpError(data.error || 'Failed to resend code.');
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Store name" showSearch notifications={2} />
      


    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <CardTitle className="text-2xl">
            {accountPending 
              ? 'Account Created!' 
              : step === 'email' 
                ? (activeTab === 'login' ? 'Welcome Back' : 'Create Account') 
                : 'Verify Your Email'
            }
          </CardTitle>
          <CardDescription>
            {accountPending 
              ? 'Your account has been created successfully and is pending approval.'
              : step === 'email' 
                ? (activeTab === 'login' 
                    ? 'Enter your email to sign in to your account'
                    : 'Fill in your details to create a new account'
                  )
                : `We've sent a verification code to ${email}`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {accountPending ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-green-600 font-medium">{success}</p>
                <p className="text-sm text-muted-foreground">
                  You will receive an email notification once your account is approved by an admin.
                </p>
              </div>
            </div>
          ) : step === 'email' && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <form className="space-y-4" onSubmit={sendEmail}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        id="email"
                        type="email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Code'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-4">
                <form className="space-y-4" onSubmit={sendEmail}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Your full name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        id="name"
                        type="text"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        id="email"
                        type="email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea 
                        placeholder="Add any additional notes..." 
                        value={note} 
                        onChange={(e) => setNote(e.target.value)}
                        id="note"
                        className="pl-10 min-h-[80px] resize-none"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Code'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {success && !accountPending && <p style={{ color: 'green' }}>{success}</p>}
              {emailError && <p style={{ color: 'red' }}>{emailError}</p>}
            </Tabs>
          )}

          {!accountPending && step === 'otp' && (
            <div className="space-y-6">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to email
              </Button>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); verifyOtp(); }}>
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <div className="flex justify-center">
                  <Input type="text" placeholder="Enter OTP" value={password} onChange={(e) => setPassword(e.target.value)} disabled={verifying} />
                  </div>
                </div>
                
                
                <Button type="submit" className="w-full" disabled={verifying}>
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Signing In...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </form>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{' '}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto font-normal"
                    onClick={resendOtp}
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Resending...
                      </>
                    ) : (
                      'Resend'
                    )}
                  </Button>
                </p>
              </div>

              {success && <p style={{ color: 'green' }}>{success}</p>}
              {otpError && <p style={{ color: 'red' }}>{otpError}</p>}
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>

    <Footer />
      <MobileNav />
      <Toaster />
    </div>
    </>
  );
}
