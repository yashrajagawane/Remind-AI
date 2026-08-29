'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'caregiver' | 'family'>('caregiver');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });
      
      if (res.ok) {
        // Automatically redirect to login to sign in
        router.push('/login?registered=true');
      } else {
        const errData = await res.json();
        setError(errData.error?.message || errData.detail || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Join ReMind AI to support your loved ones</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-emergency/10 text-emergency text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Dr. John Doe"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer border border-brand/20 p-3 rounded-md flex-1 hover:bg-brand/5 transition-colors">
                  <input 
                    type="radio" 
                    name="role" 
                    value="caregiver" 
                    checked={role === 'caregiver'} 
                    onChange={() => setRole('caregiver')}
                    className="text-brand"
                  />
                  <span className="text-sm font-medium">Caregiver / Doctor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border border-brand/20 p-3 rounded-md flex-1 hover:bg-brand/5 transition-colors">
                  <input 
                    type="radio" 
                    name="role" 
                    value="family" 
                    checked={role === 'family'} 
                    onChange={() => setRole('family')}
                    className="text-brand"
                  />
                  <span className="text-sm font-medium">Family Member</span>
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-brand/5 mt-4 pt-6">
          <p className="text-sm text-brand/80">
            Already have an account?{' '}
            <Link href="/login" className="text-brand font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
