import { useState, useEffect } from "react";
import { offlineDB, OfflineFood } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Utensils } from "lucide-react";

export default function FoodManager() {
    const { user } = useAuth();
    const [foods, setFoods] = useState<OfflineFood[]>([]);
    const [newFoodName, setNewFoodName] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadFoods();
    }, [user]);

    const loadFoods = async () => {
        if (!user) return;
        try {
            const foodList = await offlineDB.getFoods(user.uid);
            setFoods(foodList.reverse()); // Show newest first
        } catch (error) {
            console.error("Error loading foods:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFood = async () => {
        if (!user || !newFoodName.trim()) return;

        setAdding(true);
        try {
            const name = newFoodName.trim();
            // Check validation
            if (foods.some(f => f.name.toLowerCase() === name.toLowerCase())) {
                toast.error("Food already exists!");
                return;
            }

            await offlineDB.saveFood(user.uid, name);
            setNewFoodName("");
            toast.success("Food added");
            loadFoods();
        } catch (error) {
            toast.error("Failed to add food");
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteFood = async (id: number) => {
        if (!id) return;
        try {
            await offlineDB.deleteFood(id);
            toast.success("Food deleted");
            setFoods(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            toast.error("Failed to delete food");
        }
    };

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Manage Foods
                </h3>
                <p className="text-sm text-muted-foreground">Define foods to track in your meals</p>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Enter food name (e.g. Rice, Chicken)..."
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFood()}
                />
                <Button onClick={handleAddFood} disabled={adding || !newFoodName.trim()}>
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {foods.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                        <p>No foods added yet.</p>
                        <p className="text-xs">Add foods to start tracking details.</p>
                    </div>
                ) : (
                    foods.map(food => (
                        <div key={food.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <span className="font-medium">{food.name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteFood(food.id!)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
