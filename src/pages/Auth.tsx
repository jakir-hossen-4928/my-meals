import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Account created successfully! Welcome to My Meals!");
      } else {
        await signIn(email, password);
        toast.success("Welcome back to My Meals!");
      }
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred.";
      if (errorMessage.includes("auth/user-not-found") || errorMessage.includes("auth/wrong-password")) {
        toast.error("Invalid email or password.");
      } else if (errorMessage.includes("auth/email-already-in-use")) {
        toast.error("Email already in use. Please sign in instead.");
      } else if (errorMessage.includes("auth/weak-password")) {
        toast.error("Password is too weak.");
      } else {
        toast.error("Failed to authenticate. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-3 sm:space-y-4 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
            <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">My Meals</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1.5 sm:mt-2 px-2">
              Track your hostel meals and manage expenses effortlessly
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6 sm:pb-8">
          <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="signin" className="text-sm sm:text-base">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm sm:text-base">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-sm sm:text-base">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-sm sm:text-base">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAuth}
                size="lg"
                className="w-full h-10 sm:h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm sm:text-base">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm sm:text-base">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={toggleConfirmPasswordVisibility}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAuth}
                size="lg"
                className="w-full h-10 sm:h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-xs sm:text-sm text-center text-muted-foreground px-2">
            By continuing, you agree to track your meals and manage your hostel expenses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}