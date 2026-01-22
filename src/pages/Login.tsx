// Login page with enhanced visuals and mock authentication
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 data-grid opacity-20" />
      <div className="absolute top-1/4 -left-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 h-64 w-64 rounded-full bg-success/10 blur-3xl" />

      <div className="relative w-full max-w-md fade-in">
        {/* Logo and branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-success shadow-2xl shadow-primary/30 mb-5 group">
            <img
              src="/favicon.png"
              alt="AgroView Pro"
              className="h-10 w-10 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110"
            />
            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-warning animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">AgroView Pro</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            IoT Soil Multi-Parameter Monitoring
          </p>
        </div>

        <Card className="border-border/30 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2 border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@agroview.pro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-secondary/50 border-border/50 pr-10 focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 rounded-xl border border-border/30 bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Demo Credentials
              </p>
              <div className="space-y-1.5 text-xs font-mono">
                <p className="text-foreground/80">
                  Admin: admin@agroview.pro / admin123
                </p>
                <p className="text-foreground/80">
                  Viewer: viewer@agroview.pro / viewer123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2024 AgroView Pro. Enterprise IoT Monitoring Platform.
        </p>
      </div>
    </div>
  );
}
