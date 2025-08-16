import { Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { findUser, setCurrentUser, getApplicationsKey } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user = findUser(email, password);
    if (!user) {
      toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
      return;
    }

    setCurrentUser(user);
    toast({ title: "Logged in", description: `Welcome back, ${user.name}!` });

    try {
      const key = getApplicationsKey(user.email);
      const raw = localStorage.getItem(key);
      const apps = raw ? JSON.parse(raw) : [];
      navigate(apps.length === 0 ? "/first-job" : "/dashboard");
    } catch {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <Seo
        title="Login – JobTrackr"
        description="Access your JobTrackr dashboard to manage job applications."
        canonical={window.location.href}
      />
      <section className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Login</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="underline underline-offset-4 hover:text-foreground">Register</Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
};

export default Login;
