import { db as firestore } from './firebase';
import { offlineDB } from './db';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export class SyncService {
    private static instance: SyncService;
    private syncInProgress = false;
    private syncListeners: ((status: boolean) => void)[] = [];

    private constructor() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.syncAll());
        window.addEventListener('offline', () => this.notifySyncStatus(false));
    }

    static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    onSyncStatusChange(callback: (status: boolean) => void) {
        this.syncListeners.push(callback);
        return () => {
            this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
        };
    }

    private notifySyncStatus(status: boolean) {
        this.syncListeners.forEach(cb => cb(status));
    }

    isOnline(): boolean {
        return navigator.onLine;
    }

    async syncAll(userId?: string) {
        if (!userId || this.syncInProgress || !this.isOnline()) {
            return;
        }

        this.syncInProgress = true;
        this.notifySyncStatus(true);

        try {
            await this.syncMealRecords(userId);
            await this.syncMealConfigs(userId);
            await this.syncTemplates(userId);
            await this.syncProfiles(userId);
            console.log('✅ Sync completed successfully');
        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            this.syncInProgress = false;
            this.notifySyncStatus(false);
        }
    }

    private async syncMealRecords(userId: string) {
        const unsynced = await offlineDB.getUnsyncedMealRecords(userId);

        for (const record of unsynced) {
            try {
                await setDoc(
                    doc(firestore, `users/${userId}/meals/${record.date}`),
                    {
                        ...record.meals,
                        date: record.date,
                        timestamp: record.timestamp
                    }
                );

                if (record.id) {
                    await offlineDB.markMealRecordSynced(record.id);
                }
            } catch (error) {
                console.error('Failed to sync meal record:', error);
            }
        }
    }

    private async syncMealConfigs(userId: string) {
        const unsynced = await offlineDB.getUnsyncedMealConfigs(userId);

        for (const config of unsynced) {
            try {
                await setDoc(
                    doc(firestore, `users/${userId}/mealConfigs/default`),
                    {
                        meals: config.meals,
                        updatedAt: config.timestamp
                    }
                );

                if (config.id) {
                    await offlineDB.markMealConfigSynced(config.id);
                }
            } catch (error) {
                console.error('Failed to sync meal config:', error);
            }
        }
    }

    private async syncTemplates(userId: string) {
        const unsynced = await offlineDB.getUnsyncedTemplates(userId);

        for (const template of unsynced) {
            try {
                await setDoc(
                    doc(firestore, `users/${userId}/templates/${template.templateId}`),
                    {
                        name: template.name,
                        meals: template.meals,
                        isActive: template.isActive,
                        updatedAt: template.timestamp
                    }
                );

                if (template.id) {
                    await offlineDB.markTemplateSynced(template.id);
                }
            } catch (error) {
                console.error('Failed to sync template:', error);
            }
        }
    }

    private async syncProfiles(userId: string) {
        const unsynced = await offlineDB.getUnsyncedProfiles(userId);

        for (const profile of unsynced) {
            try {
                await setDoc(
                    doc(firestore, `users/${userId}`),
                    {
                        ...profile.data,
                        updatedAt: profile.timestamp
                    },
                    { merge: true }
                );

                if (profile.id) {
                    await offlineDB.markProfileSynced(profile.id);
                }
            } catch (error) {
                console.error('Failed to sync profile:', error);
            }
        }
    }

    // Pull data from Firebase to local storage
    async pullFromFirebase(userId: string) {
        if (!this.isOnline()) {
            return;
        }

        try {
            // Pull meal configs
            const configDoc = await getDoc(doc(firestore, `users/${userId}/mealConfigs/default`));
            if (configDoc.exists()) {
                await offlineDB.saveMealConfig(userId, configDoc.data().meals);
            }

            // Pull templates
            const templatesSnapshot = await getDocs(collection(firestore, `users/${userId}/templates`));
            for (const templateDoc of templatesSnapshot.docs) {
                const data = templateDoc.data();
                await offlineDB.saveTemplate(
                    userId,
                    templateDoc.id,
                    data.name,
                    data.meals,
                    data.isActive
                );
            }

            // Pull profile
            const profileDoc = await getDoc(doc(firestore, `users/${userId}`));
            if (profileDoc.exists()) {
                await offlineDB.saveProfile(userId, profileDoc.data());
            }

            console.log('✅ Data pulled from Firebase');
        } catch (error) {
            console.error('❌ Failed to pull from Firebase:', error);
        }
    }
}

export const syncService = SyncService.getInstance();
