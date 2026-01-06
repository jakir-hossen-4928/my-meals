import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { offlineDB, OfflineFood } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface MealLoggerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mealName: string;
    onSave: (selectedFoodIds: string[]) => void;
    initialSelectedFoods?: string[];
}

export default function MealLoggerDialog({ isOpen, onClose, mealName, onSave, initialSelectedFoods = [] }: MealLoggerDialogProps) {
    const { user } = useAuth();
    const [foods, setFoods] = useState<OfflineFood[]>([]);
    const [selectedFoods, setSelectedFoods] = useState<string[]>(initialSelectedFoods);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            loadFoods();
            setSelectedFoods(initialSelectedFoods);
        }
    }, [isOpen, user, initialSelectedFoods]);

    const loadFoods = async () => {
        if (!user) return;
        try {
            const foodList = await offlineDB.getFoods(user.uid);
            setFoods(foodList);
        } catch (error) {
            console.error("Error loading foods:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFood = (foodName: string) => {
        setSelectedFoods(prev =>
            prev.includes(foodName)
                ? prev.filter(f => f !== foodName)
                : [...prev, foodName]
        );
    };

    const handleSave = () => {
        onSave(selectedFoods);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log {mealName}</DialogTitle>
                    <DialogDescription>
                        Select what you ate for {mealName.toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : foods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No foods configured.</p>
                            <p className="text-xs">Go to Profile to add foods.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {foods.map((food) => (
                                    <div key={food.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                                        <Checkbox
                                            id={`food-${food.id}`}
                                            checked={selectedFoods.includes(food.name)}
                                            onCheckedChange={() => toggleFood(food.name)}
                                        />
                                        <Label
                                            htmlFor={`food-${food.id}`}
                                            className="flex-1 cursor-pointer font-medium"
                                        >
                                            {food.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={foods.length === 0 && selectedFoods.length === 0}>
                        Save Log
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
