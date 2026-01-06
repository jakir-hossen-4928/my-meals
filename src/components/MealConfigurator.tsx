import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { offlineDB, MealTemplate } from "@/lib/db";
import { syncService } from "@/lib/sync";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Save, GripVertical, Copy, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface MealConfig {
    id: string;
    name: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
    cost: number;
}

interface MealConfiguratorProps {
    onConfigUpdate?: (configs: MealConfig[]) => void;
}

const DEFAULT_MEALS: MealConfig[] = [
    { id: "breakfast", name: "Breakfast", enabled: true, startTime: "07:00", endTime: "09:00", cost: 0 },
    { id: "lunch", name: "Lunch", enabled: true, startTime: "12:00", endTime: "14:00", cost: 0 },
    { id: "dinner", name: "Dinner", enabled: true, startTime: "19:00", endTime: "21:00", cost: 0 },
];

function SortableMealItem({ meal, onUpdate, onRemove, isCustom }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: meal.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="touch-none">
            <div className={cn(
                "group relative flex flex-col gap-3 rounded-xl border p-3 shadow-sm transition-all hover:shadow-md bg-card",
                !meal.enabled && "opacity-60 bg-muted/50"
            )}>
                {/* Header Row */}
                <div className="flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
                    >
                        <GripVertical className="h-5 w-5" />
                    </div>

                    <Switch
                        checked={meal.enabled}
                        onCheckedChange={(checked) => onUpdate(meal.id, { enabled: checked })}
                    />

                    <div className="flex-1 font-medium text-base">
                        {meal.name}
                    </div>

                    {isCustom && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(meal.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Details Row (Only visible if enabled) */}
                {meal.enabled && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-10 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1">
                            <Label htmlFor={`${meal.id}-start`} className="text-xs text-muted-foreground">Start</Label>
                            <Input
                                id={`${meal.id}-start`}
                                type="time"
                                value={meal.startTime}
                                onChange={(e) => onUpdate(meal.id, { startTime: e.target.value })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`${meal.id}-end`} className="text-xs text-muted-foreground">End</Label>
                            <Input
                                id={`${meal.id}-end`}
                                type="time"
                                value={meal.endTime}
                                onChange={(e) => onUpdate(meal.id, { endTime: e.target.value })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1">
                            <Label htmlFor={`${meal.id}-cost`} className="text-xs text-muted-foreground">Cost (৳)</Label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">৳</span>
                                <Input
                                    id={`${meal.id}-cost`}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={meal.cost || ""}
                                    onChange={(e) => onUpdate(meal.id, { cost: parseFloat(e.target.value) || 0 })}
                                    className="h-8 text-xs pl-6"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MealConfigurator({ onConfigUpdate }: MealConfiguratorProps) {
    const { user } = useAuth();
    const [mealConfigs, setMealConfigs] = useState<MealConfig[]>(DEFAULT_MEALS);
    const [templates, setTemplates] = useState<MealTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [customMealName, setCustomMealName] = useState("");
    const [newTemplateName, setNewTemplateName] = useState("");
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            const [offlineConfig, offlineTemplates] = await Promise.all([
                offlineDB.getMealConfig(user.uid),
                offlineDB.getTemplates(user.uid)
            ]);

            if (offlineConfig) {
                setMealConfigs(offlineConfig.meals || DEFAULT_MEALS);
            } else if (navigator.onLine) {
                const configDoc = await getDoc(doc(db, `users/${user.uid}/mealConfigs/default`));
                if (configDoc.exists()) {
                    const meals = configDoc.data().meals || DEFAULT_MEALS;
                    setMealConfigs(meals);
                    await offlineDB.saveMealConfig(user.uid, meals);
                }
            }
            setTemplates(offlineTemplates);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveMealConfigs = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await offlineDB.saveMealConfig(user.uid, mealConfigs);
            if (isOnline) await syncService.syncAll(user.uid);
            toast.success("Configuration saved!");
            if (onConfigUpdate) onConfigUpdate(mealConfigs);
        } catch (error) {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const updateMealConfig = (id: string, updates: Partial<MealConfig>) => {
        setMealConfigs(prev => prev.map(meal => (meal.id === id ? { ...meal, ...updates } : meal)));
    };

    const addCustomMeal = () => {
        if (!customMealName.trim()) return;
        const newMeal: MealConfig = {
            id: `custom_${Date.now()}`,
            name: customMealName,
            enabled: true,
            startTime: "12:00",
            endTime: "13:00",
            cost: 0,
        };
        setMealConfigs(prev => [...prev, newMeal]);
        setCustomMealName("");
        toast.success("Meal added");
    };

    const removeMeal = (id: string) => {
        setMealConfigs(prev => prev.filter(meal => meal.id !== id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setMealConfigs((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const saveAsTemplate = async () => {
        if (!user || !newTemplateName.trim()) return;
        try {
            await offlineDB.saveTemplate(user.uid, `template_${Date.now()}`, newTemplateName, mealConfigs, false);
            if (isOnline) await syncService.syncAll(user.uid);
            await loadData();
            setNewTemplateName("");
            setShowTemplateDialog(false);
            toast.success("Template saved");
        } catch (error) {
            toast.error("Failed to save template");
        }
    };

    const loadTemplate = (template: MealTemplate) => {
        setMealConfigs(template.meals);
        toast.success(`Loaded ${template.name}`);
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Meal Schedule
                    </h3>
                    <p className="text-sm text-muted-foreground">Customize your daily meals</p>
                </div>
                {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
            </div>

            {templates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {templates.map(t => (
                        <Button key={t.templateId} variant="outline" size="sm" onClick={() => loadTemplate(t)} className="text-xs">
                            {t.name}
                        </Button>
                    ))}
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={mealConfigs.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {mealConfigs.map((meal) => (
                            <SortableMealItem
                                key={meal.id}
                                meal={meal}
                                onUpdate={updateMealConfig}
                                onRemove={removeMeal}
                                isCustom={!["breakfast", "lunch", "dinner"].includes(meal.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="flex gap-2">
                <Input
                    placeholder="Add custom meal (e.g. Snack)"
                    value={customMealName}
                    onChange={(e) => setCustomMealName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomMeal()}
                />
                <Button onClick={addCustomMeal} size="icon">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex gap-3 pt-4">
                <Button onClick={saveMealConfigs} disabled={saving} className="flex-1">
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Save as Template</DialogTitle>
                            <DialogDescription>Save this schedule to use later.</DialogDescription>
                        </DialogHeader>
                        <Input
                            placeholder="Template Name (e.g. Exam Week)"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                        />
                        <DialogFooter>
                            <Button onClick={saveAsTemplate}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
