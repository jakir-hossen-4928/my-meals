import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { offlineDB } from "@/lib/db";
import { syncService } from "@/lib/sync";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Coffee, Sun, Moon, Sparkles, UtensilsCrossed, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MealLoggerDialog from "@/components/MealLoggerDialog";

interface MealConfig {
    id: string;
    name: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
    cost: number;
}

interface MealStatus {
    [key: string]: boolean;
}

interface MealDetails {
    [key: string]: string[];
}

const DEFAULT_MEALS: MealConfig[] = [
    { id: "breakfast", name: "Breakfast", enabled: true, startTime: "07:00", endTime: "09:00", cost: 0 },
    { id: "lunch", name: "Lunch", enabled: true, startTime: "12:00", endTime: "14:00", cost: 0 },
    { id: "dinner", name: "Dinner", enabled: true, startTime: "19:00", endTime: "21:00", cost: 0 },
];

const MEAL_ICONS: { [key: string]: any } = {
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon,
};

export default function Home() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const dateParam = searchParams.get("date");
        if (dateParam) {
            const date = new Date(dateParam);
            if (!isNaN(date.getTime())) return date;
        }
        return new Date();
    });

    const [mealConfigs, setMealConfigs] = useState<MealConfig[]>(DEFAULT_MEALS);
    const [mealStatus, setMealStatus] = useState<MealStatus>({});
    const [mealDetails, setMealDetails] = useState<MealDetails>({});
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [loggingMeal, setLoggingMeal] = useState<MealConfig | null>(null);

    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        setSearchParams({ date: format(date, "yyyy-MM-dd") });
    };

    useEffect(() => {
        loadData();
        const handleOnline = () => { setIsOnline(true); if (user) syncService.syncAll(user.uid); };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user]);

    useEffect(() => {
        if (mealConfigs.length > 0) loadSelectedMeals();
    }, [selectedDate, mealConfigs]);

    const loadData = async () => {
        if (!user) return;
        try {
            const config = await offlineDB.getMealConfig(user.uid);
            if (config?.meals) {
                setMealConfigs(config.meals);
            }
        } catch (error) {
            console.error("Load error:", error);
        }
    };

    const loadSelectedMeals = async () => {
        if (!user) return;
        try {
            const record = await offlineDB.getMealRecord(user.uid, selectedDateStr);
            const status: MealStatus = {};
            const details: MealDetails = {};

            mealConfigs.forEach(m => {
                if (m.enabled) {
                    status[m.id] = record?.meals?.[m.id] || false;
                    details[m.id] = record?.details?.[m.id] || [];
                }
            });
            setMealStatus(status);
            setMealDetails(details);
        } catch (error) {
            console.error("Load meals error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMealLog = async (selectedFoods: string[]) => {
        if (!user || !loggingMeal) return;

        const isTaken = selectedFoods.length > 0;
        const newStatus = { ...mealStatus, [loggingMeal.id]: isTaken };
        const newDetails = { ...mealDetails, [loggingMeal.id]: selectedFoods };

        setMealStatus(newStatus);
        setMealDetails(newDetails);

        try {
            await offlineDB.saveMealRecord(user.uid, selectedDateStr, newStatus, newDetails);
            if (isOnline) syncService.syncAll(user.uid);

            if (isTaken) {
                toast.success("Meal logged!");
            } else {
                toast.info("Meal cleared");
            }
        } catch (error) {
            toast.error("Failed to save");
            // Revert would be good here but keeping it simple
        }
    };

    const handleQuickToggle = async (e: React.MouseEvent, meal: MealConfig) => {
        e.stopPropagation(); // Prevent opening dialog

        if (!user) return;

        const wasTaken = mealStatus[meal.id];
        const newTaken = !wasTaken;

        const newStatus = { ...mealStatus, [meal.id]: newTaken };
        // Ideally preserve details if re-enabling, or clear if disabling?
        // Let's keep details if re-enabling, but maybe we shouldn't clear details on generic toggle?
        // If untoggling, maybe we should clear details?
        // Let's keep it simple: Quick toggle just changes status. Details remain but maybe hidden?
        // Actually, if I uncheck, I probably mean I didn't eat.

        setMealStatus(newStatus);

        try {
            await offlineDB.saveMealRecord(user.uid, selectedDateStr, newStatus, mealDetails);
            if (isOnline) syncService.syncAll(user.uid);
        } catch (error) {
            toast.error("Failed to update status");
            setMealStatus(mealStatus);
        }
    };

    const enabledMeals = mealConfigs.filter(m => m.enabled);
    const takenCount = enabledMeals.filter(m => mealStatus[m.id]).length;
    const progress = enabledMeals.length > 0 ? (takenCount / enabledMeals.length) * 100 : 0;
    const dailyCost = enabledMeals.reduce((sum, m) => sum + (mealStatus[m.id] ? m.cost : 0), 0);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="container max-w-md mx-auto px-4 pt-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Today's Meals</h1>
                        <p className="text-sm text-muted-foreground">Track your daily nutrition</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <CalendarIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Date Display */}
                <div className="text-center py-2 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-foreground">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </span>
                </div>

                {/* Progress Card */}
                <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Daily Progress</p>
                                <h2 className="text-3xl font-bold text-primary">{Math.round(progress)}%</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground font-medium">Total Cost</p>
                                <p className="text-xl font-bold text-foreground">৳{dailyCost.toFixed(0)}</p>
                            </div>
                        </div>
                        <Progress value={progress} className="h-2 bg-background/50" />
                        <p className="text-xs text-center text-muted-foreground">
                            {takenCount} of {enabledMeals.length} meals completed
                        </p>
                    </CardContent>
                </Card>

                {/* Meal List */}
                <div className="space-y-3">
                    {enabledMeals.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No meals configured.</p>
                            <Button variant="link" onClick={() => window.location.href = '/profile'}>
                                Go to Profile to setup
                            </Button>
                        </div>
                    ) : (
                        enabledMeals.map((meal) => {
                            const Icon = MEAL_ICONS[meal.id] || UtensilsCrossed;
                            const isTaken = mealStatus[meal.id];
                            const details = mealDetails[meal.id] || [];

                            return (
                                <div
                                    key={meal.id}
                                    onClick={() => setLoggingMeal(meal)}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 rounded-xl border bg-card transition-all cursor-pointer active:scale-[0.98]",
                                        isTaken ? "border-primary/50 shadow-sm bg-primary/5" : "hover:border-primary/20"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors shrink-0",
                                        isTaken ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn("font-semibold", isTaken && "text-primary")}>{meal.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {meal.startTime} - {meal.endTime} • ৳{meal.cost}
                                        </p>
                                        {details.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                <span className="font-medium text-foreground/80">Ate:</span> {details.join(", ")}
                                            </p>
                                        )}
                                    </div>

                                    <div onClick={(e) => handleQuickToggle(e, meal)}>
                                        <Checkbox checked={isTaken} className="h-6 w-6 rounded-full" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <BottomNav />

            {/* Logger Dialog */}
            {loggingMeal && (
                <MealLoggerDialog
                    isOpen={!!loggingMeal}
                    onClose={() => setLoggingMeal(null)}
                    mealName={loggingMeal.name}
                    initialSelectedFoods={mealDetails[loggingMeal.id] || []}
                    onSave={handleSaveMealLog}
                />
            )}
        </div>
    );
}
