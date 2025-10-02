import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { LogOut, Calculator, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  groceryCost: number;
  totalMembers: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    groceryCost: 0,
    totalMembers: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profileDoc = await getDoc(doc(db, "users", user.uid));
      if (profileDoc.exists()) {
        setProfileData(profileDoc.data() as ProfileData);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...profileData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const calculateMealRate = () => {
    if (profileData.totalMembers === 0) return 0;
    // Assuming average 90 meals per month per person (3 meals x 30 days)
    const totalMeals = profileData.totalMembers * 90;
    return (profileData.groceryCost / totalMeals).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="pt-6 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account and meal calculations</p>
        </div>

        <Card className="bg-gradient-to-br from-card to-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user?.displayName || "User"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Meal Cost Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groceryCost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Grocery Cost
              </Label>
              <Input
                id="groceryCost"
                type="number"
                placeholder="Enter total grocery cost"
                value={profileData.groceryCost || ""}
                onChange={(e) =>
                  setProfileData({ ...profileData, groceryCost: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMembers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Hostel Members
              </Label>
              <Input
                id="totalMembers"
                type="number"
                placeholder="Enter number of members"
                value={profileData.totalMembers || ""}
                onChange={(e) =>
                  setProfileData({ ...profileData, totalMembers: Number(e.target.value) })
                }
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {profileData.groceryCost > 0 && profileData.totalMembers > 0 && (
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Estimated Cost Per Meal</div>
                <div className="text-4xl font-bold text-secondary">₹{calculateMealRate()}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Based on {profileData.totalMembers} members and ₹{profileData.groceryCost} monthly cost
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
