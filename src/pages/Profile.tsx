import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import MealConfigurator from "@/components/MealConfigurator";
import FoodManager from "@/components/FoodManager";
import { useAuth } from "@/contexts/AuthContext";
import { offlineDB } from "@/lib/db";
import { syncService } from "@/lib/sync";
import { db as firestore } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { LogOut, Camera, Edit2, User, Loader2, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const IMGBB_API_KEY = "3fc5f20997677c33850b7f72716d4e4c";

export default function Profile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [coverPhotoURL, setCoverPhotoURL] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        try {
            const offlineProfile = await offlineDB.getProfile(user.uid);
            if (offlineProfile?.data) {
                setDisplayName(offlineProfile.data.displayName || user.displayName || "");
                setPhotoURL(offlineProfile.data.photoURL || user.photoURL || "");
                setCoverPhotoURL(offlineProfile.data.coverPhotoURL || "");
            } else {
                setDisplayName(user.displayName || "");
                setPhotoURL(user.photoURL || "");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const uploadToImgBB = async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        if (data.success) {
            // Use display_url for better performance if available, otherwise fallback to url
            return data.data.display_url || data.data.url;
        } else {
            throw new Error(data.error?.message || "Upload failed");
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadToImgBB(file);

            let newPhotoURL = photoURL;
            let newCoverURL = coverPhotoURL;

            if (type === 'profile') {
                newPhotoURL = url;
                setPhotoURL(url);
            } else {
                newCoverURL = url;
                setCoverPhotoURL(url);
            }

            await saveProfile(displayName, newPhotoURL, newCoverURL);
            toast.success(`${type === 'profile' ? 'Profile picture' : 'Cover photo'} updated!`);
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(`Failed to upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async (name: string, photo: string, cover: string) => {
        if (!user) return;
        try {
            // Update Auth Profile (only supports displayName and photoURL)
            if (name !== user.displayName || photo !== user.photoURL) {
                await updateProfile(user, { displayName: name, photoURL: photo });
            }

            const profileData = {
                displayName: name,
                photoURL: photo,
                coverPhotoURL: cover,
                updatedAt: new Date().toISOString()
            };

            // Save to Offline DB
            await offlineDB.saveProfile(user.uid, profileData);

            // Save to Firestore directly if online
            if (navigator.onLine) {
                await setDoc(doc(firestore, "users", user.uid), profileData, { merge: true });
                // Trigger sync to update local sync status
                await syncService.syncAll(user.uid);
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save profile");
        }
    };

    const handleSaveName = async () => {
        await saveProfile(displayName, photoURL, coverPhotoURL);
        setIsEditing(false);
        toast.success("Name updated");
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/");
        } catch (error) {
            toast.error("Failed to sign out");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header Container */}
            <div className="relative mb-20">
                {/* Cover Photo Area - Increased height */}
                <div className="relative h-72 w-full bg-muted overflow-hidden group">
                    {coverPhotoURL ? (
                        <img
                            src={coverPhotoURL}
                            alt="Cover"
                            className="w-full h-full object-cover transition-opacity duration-300"
                            loading="eager"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-12 w-12" />
                        </div>
                    )}
                </div>

                {/* Profile Picture (Overlapping) */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative group/avatar">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-lg bg-background">
                            <AvatarImage src={photoURL} className="object-cover" loading="eager" />
                            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                {displayName?.[0]?.toUpperCase() || <User />}
                            </AvatarFallback>
                        </Avatar>
                        {/* Profile Edit Button - Always Visible with Edit Icon */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute bottom-1 right-1 rounded-full h-9 w-9 shadow-md border-2 border-background"
                            onClick={() => profileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                        </Button>
                        <input
                            type="file"
                            ref={profileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'profile')}
                        />
                    </div>
                </div>
            </div>

            <div className="container max-w-md mx-auto px-4 mt-4 space-y-8">
                {/* Name & Info Section */}
                <div className="text-center space-y-3">
                    {isEditing ? (
                        <div className="flex items-center gap-2 justify-center max-w-[200px] mx-auto">
                            <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="text-center h-8"
                            />
                            <Button size="sm" onClick={handleSaveName}>Save</Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 group">
                            <h1 className="text-2xl font-bold text-foreground">
                                {displayName || "Welcome, Student!"}
                            </h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">{user?.email}</p>

                        {/* Edit Cover Button - Moved Here */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-2"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploading}
                        >
                            <Camera className="h-3 w-3" />
                            Change Cover Photo
                        </Button>
                        <input
                            type="file"
                            ref={coverInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'cover')}
                        />
                    </div>
                </div>

                {/* Meal Configuration */}
                <Card className="border-none shadow-sm bg-card/50">
                    <CardContent className="p-6">
                        <MealConfigurator />
                    </CardContent>
                </Card>

                {/* Food Manager */}
                <Card className="border-none shadow-sm bg-card/50">
                    <CardContent className="p-6">
                        <FoodManager />
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>

            <BottomNav />
        </div>
    );
}