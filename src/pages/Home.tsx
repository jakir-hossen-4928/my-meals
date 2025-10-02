import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Coffee, Sun, Moon } from "lucide-react";

interface MealStatus {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export default function Home() {
  const { user } = useAuth();
  const [mealStatus, setMealStatus] = useState<MealStatus>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadTodayMeals();
  }, [user]);

  const loadTodayMeals = async () => {
    if (!user) return;
    
    try {
      const mealDoc = await getDoc(
        doc(db, `users/${user.uid}/meals/${today}`)
      );
      
      if (mealDoc.exists()) {
        setMealStatus(mealDoc.data() as MealStatus);
      }
    } catch (error) {
      console.error("Error loading meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = async (mealType: keyof MealStatus) => {
    if (!user) return;

    const newStatus = {
      ...mealStatus,
      [mealType]: !mealStatus[mealType],
    };

    setMealStatus(newStatus);

    try {
      await setDoc(
        doc(db, `users/${user.uid}/meals/${today}`),
        {
          ...newStatus,
          date: today,
          timestamp: new Date().toISOString(),
        }
      );
      toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${newStatus[mealType] ? 'marked' : 'unmarked'}`);
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error("Failed to save meal status");
      setMealStatus(mealStatus);
    }
  };

  const meals = [
    { id: "breakfast", label: "Breakfast", icon: Coffee, time: "7:00 - 9:00 AM" },
    { id: "lunch", label: "Lunch", icon: Sun, time: "12:00 - 2:00 PM" },
    { id: "dinner", label: "Dinner", icon: Moon, time: "7:00 - 9:00 PM" },
  ];

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
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Today's Meals
          </h1>
          <p className="text-muted-foreground mt-1">Mark the meals you've taken today</p>
        </div>

        <div className="space-y-3">
          {meals.map((meal) => {
            const MealIcon = meal.icon;
            const isChecked = mealStatus[meal.id as keyof MealStatus];
            
            return (
              <Card
                key={meal.id}
                className={`transition-all duration-300 cursor-pointer hover:shadow-elevated ${
                  isChecked ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30" : ""
                }`}
                onClick={() => toggleMeal(meal.id as keyof MealStatus)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isChecked 
                      ? "bg-gradient-to-br from-primary to-secondary" 
                      : "bg-muted"
                  }`}>
                    <MealIcon className={`h-6 w-6 ${isChecked ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{meal.label}</h3>
                    <p className="text-sm text-muted-foreground">{meal.time}</p>
                  </div>
                  
                  <Checkbox
                    checked={isChecked}
                    className="h-6 w-6 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-card to-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Meals taken</span>
              <span className="text-2xl font-bold text-primary">
                {Object.values(mealStatus).filter(Boolean).length} / 3
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
