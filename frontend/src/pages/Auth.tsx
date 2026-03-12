import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckSquare, Columns3, BarChart3, CalendarDays, ArrowRight, Sparkles, Timer, Shield } from "lucide-react";

const features = [
  { icon: Columns3, title: "Kanban Boards", desc: "Drag & drop workflow" },
  { icon: BarChart3, title: "Analytics", desc: "Track productivity" },
  { icon: CalendarDays, title: "Calendar", desc: "Schedule deadlines" },
  { icon: Timer, title: "Pomodoro", desc: "Focus timer" },
  { icon: Sparkles, title: "Smart Search", desc: "⌘K to find anything" },
  { icon: Shield, title: "Role-Based", desc: "Team collaboration" },
];

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, signupName);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally { setLoading(false); }
  };

  const handleGoogleSignIn = () => {
    toast.info("Google sign-in is not available in local mode.");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Hero */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/30">
              <CheckSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">TaskFlow</h1>
              <p className="text-sm text-muted-foreground">Premium Task Manager</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-snug">
              Organize work.<br />
              <span className="text-primary">Ship faster.</span>
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              The all-in-one task manager with Kanban boards, Pomodoro timer, analytics, calendar views, and role-based team access.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.title} className="flex items-center gap-3 rounded-xl border bg-card/50 backdrop-blur-sm p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{f.title}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CheckSquare className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">TaskFlow</h1>
            </div>
          </div>

          <Card className="border-0 shadow-xl shadow-primary/5">
            <Tabs defaultValue="login">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google OAuth */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><Separator /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      {loading ? "Signing in..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name</Label>
                      <Input id="signup-name" value={signupName} onChange={e => setSignupName(e.target.value)} required placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      {loading ? "Creating..." : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
          <p className="text-center text-[10px] text-muted-foreground">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
