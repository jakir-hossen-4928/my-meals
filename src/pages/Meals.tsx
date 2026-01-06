import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { offlineDB } from "@/lib/db";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Download, Trash2, Edit2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// @ts-ignore
import html2pdf from "html2pdf.js";

interface MealRecord {
    date: string;
    meals: { [key: string]: boolean };
    details?: { [key: string]: string[] };
    timestamp?: string;
}

export default function Meals() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [history, setHistory] = useState<MealRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({ total: 0, cost: 0 });

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;
        try {
            const records = await offlineDB.getAllMealRecords(user.uid);
            const formattedRecords = records.map(r => ({
                date: r.date,
                meals: r.meals,
                details: r.details,
                timestamp: r.timestamp
            }));
            setHistory(formattedRecords);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, date: string) => {
        e.stopPropagation();
        if (!user || !confirm("Are you sure you want to delete this record?")) return;

        try {
            await offlineDB.deleteMealRecord(user.uid, date);
            setHistory(prev => prev.filter(h => h.date !== date));
            toast.success("Record deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const getDayData = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return history.find(h => h.date === dateStr);
    };

    const calculateMonthStats = () => {
        const daysInMonth = history.filter(h => isSameMonth(new Date(h.date), currentMonth));
        const totalMeals = daysInMonth.reduce((acc, curr) => {
            return acc + Object.values(curr.meals).filter(Boolean).length;
        }, 0);
        setStats({ total: totalMeals, cost: 0 });
    };

    useEffect(() => {
        calculateMonthStats();
    }, [currentMonth, history]);

    const handleExportPDF = async () => {
        if (!contentRef.current) return;
        setExporting(true);

        const element = contentRef.current;
        const opt = {
            margin: 10,
            filename: `Meal_History_${format(currentMonth, "MMMM_yyyy")}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setExporting(false);
        }
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
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
                        <h1 className="text-2xl font-bold text-foreground">History</h1>
                        <p className="text-sm text-muted-foreground">Your monthly overview</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={exporting}
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        PDF
                    </Button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between bg-card border rounded-xl p-2 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-semibold min-w-[140px] text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isSameMonth(currentMonth, new Date())}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content to Export */}
                <div ref={contentRef} className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4 text-center">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Meals</p>
                                <p className="text-2xl font-bold text-primary mt-1">{stats.total}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
                            <CardContent className="p-4 text-center">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Days</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {history.filter(h => isSameMonth(new Date(h.date), currentMonth)).length}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar List View */}
                    <div className="space-y-2">
                        {days.reverse().map((day) => {
                            const data = getDayData(day);
                            const isToday = isSameDay(day, new Date());
                            const hasData = !!data;
                            const mealCount = data ? Object.values(data.meals).filter(Boolean).length : 0;
                            const lastUpdated = data?.timestamp ? parseISO(data.timestamp) : null;

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => navigate(`/home?date=${format(day, "yyyy-MM-dd")}`)}
                                    className={cn(
                                        "group relative p-3 rounded-lg border transition-all break-inside-avoid",
                                        isToday ? "bg-primary/5 border-primary/30" : "bg-card hover:shadow-md cursor-pointer",
                                        !hasData && "opacity-60 bg-muted/20"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-12 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors",
                                                isToday ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-muted/80"
                                            )}>
                                                <span>{format(day, "dd")}</span>
                                                <span className="text-[10px] opacity-80 uppercase">{format(day, "EEE")}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm">
                                                        {hasData ? `${mealCount} Meal${mealCount !== 1 ? 's' : ''}` : "No Activity"}
                                                    </p>
                                                    {lastUpdated && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-full">
                                                            <Clock className="w-3 h-3" />
                                                            {format(lastUpdated, "h:mm a")}
                                                        </span>
                                                    )}
                                                </div>

                                                {hasData ? (
                                                    <div className="space-y-1.5 mt-1">
                                                        {Object.entries(data.meals).map(([mealId, taken]) => {
                                                            if (!taken) return null;
                                                            // @ts-ignore
                                                            const mealDetails = data.details?.[mealId] || [];
                                                            return (
                                                                <div key={mealId} className="flex flex-col sm:flex-row sm:items-center text-xs gap-0.5 sm:gap-2">
                                                                    <span className="font-semibold capitalize text-primary/80 shrink-0 w-16">
                                                                        {mealId}
                                                                    </span>
                                                                    {mealDetails.length > 0 ? (
                                                                        <span className="text-muted-foreground truncate">
                                                                            {mealDetails.join(", ")}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground/50 italic text-[10px]">
                                                                            No details
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Tap to add record</p>
                                                )}
                                            </div>
                                        </div>

                                        {hasData && (
                                            <div className="flex flex-col sm:flex-row gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/home?date=${format(day, "yyyy-MM-dd")}`);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => handleDelete(e, data.date)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
