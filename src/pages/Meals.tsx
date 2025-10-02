import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { format, subDays } from "date-fns";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

interface MealRecord {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export default function Meals() {
  const { user } = useAuth();
  const [mealHistory, setMealHistory] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeals: 0,
    breakfasts: 0,
    lunches: 0,
    dinners: 0,
  });

  useEffect(() => {
    loadMealHistory();
  }, [user]);

  const loadMealHistory = async () => {
    if (!user) return;

    try {
      const mealsRef = collection(db, `users/${user.uid}/meals`);
      const q = query(mealsRef, orderBy("date", "desc"), limit(30));
      const snapshot = await getDocs(q);

      const meals: MealRecord[] = [];
      let breakfasts = 0, lunches = 0, dinners = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as MealRecord;
        meals.push(data);
        if (data.breakfast) breakfasts++;
        if (data.lunch) lunches++;
        if (data.dinner) dinners++;
      });

      setMealHistory(meals);
      setStats({
        totalMeals: breakfasts + lunches + dinners,
        breakfasts,
        lunches,
        dinners,
      });
    } catch (error) {
      console.error("Error loading meal history:", error);
    } finally {
      setLoading(false);
    }
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
            Meal History
          </h1>
          <p className="text-muted-foreground mt-1">View your past meal records</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-primary">{stats.totalMeals}</div>
              <div className="text-sm text-muted-foreground">Total Meals</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-secondary">
                {mealHistory.length}
              </div>
              <div className="text-sm text-muted-foreground">Days Tracked</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mealHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No meal records yet. Start tracking today!
              </p>
            ) : (
              mealHistory.map((record) => (
                <div
                  key={record.date}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {format(new Date(record.date), "MMM dd, yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(record.date), "EEEE")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {record.breakfast ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/30" />
                    )}
                    {record.lunch ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/30" />
                    )}
                    {record.dinner ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meal Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Breakfasts</span>
              <span className="font-semibold">{stats.breakfasts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lunches</span>
              <span className="font-semibold">{stats.lunches}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dinners</span>
              <span className="font-semibold">{stats.dinners}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
