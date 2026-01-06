import Dexie, { Table } from 'dexie';

// Interfaces for offline storage
export interface OfflineMealRecord {
    id?: number;
    date: string;
    meals: { [key: string]: boolean };
    details?: { [key: string]: string[] };
    timestamp: string;
    createdAt?: string;
    synced: number; // 0 = false, 1 = true
    userId: string;
}

export interface OfflineMealConfig {
    id?: number;
    userId: string;
    meals: any[];
    timestamp: string;
    synced: number;
}

export interface MealTemplate {
    id?: number;
    userId: string;
    templateId: string;
    name: string;
    meals: any[];
    isActive: boolean;
    timestamp: string;
    synced: number;
}

export interface OfflineProfile {
    id?: number;
    userId: string;
    data: any;
    timestamp: string;
    synced: number;
}

// Dexie Database
// Food Items
export interface OfflineFood {
    id?: number;
    userId: string;
    name: string;
    calories?: number;
    timestamp: string;
    synced: number;
}

// Dexie Database
class MealTrackerDB extends Dexie {
    mealRecords!: Table<OfflineMealRecord & { details?: any }>;
    mealConfigs!: Table<OfflineMealConfig>;
    templates!: Table<MealTemplate>;
    profiles!: Table<OfflineProfile>;
    foods!: Table<OfflineFood>;

    constructor() {
        super('MealTrackerDB_v3');

        this.version(1).stores({
            mealRecords: '++id, date, userId, synced, [userId+date], [userId+synced]',
            mealConfigs: '++id, userId, synced, [userId+synced]',
            templates: '++id, userId, templateId, isActive, synced, [userId+synced]',
            profiles: '++id, userId, synced, [userId+synced]'
        });

        this.version(2).stores({
            foods: '++id, userId, name, synced, [userId+synced]'
        });
    }
}

export const db = new MealTrackerDB();

// Helper functions for offline operations
export const offlineDB = {
    // Meal Records
    async saveMealRecord(userId: string, date: string, meals: any, details?: any) {
        const existing = await db.mealRecords
            .where({ userId, date })
            .first();

        const record = {
            userId,
            date,
            meals,
            details,
            timestamp: new Date().toISOString(),
            synced: 0
        };

        if (existing) {
            await db.mealRecords.update(existing.id!, record);
            return existing.id;
        } else {
            return await db.mealRecords.add(record);
        }
    },

    async getMealRecord(userId: string, date: string) {
        return await db.mealRecords
            .where({ userId, date })
            .first();
    },

    async getAllMealRecords(userId: string) {
        return await db.mealRecords
            .where({ userId })
            .toArray();
    },

    async getUnsyncedMealRecords(userId: string) {
        return await db.mealRecords
            .where({ userId, synced: 0 })
            .toArray();
    },

    async markMealRecordSynced(id: number) {
        await db.mealRecords.update(id, { synced: 1 });
    },

    async deleteMealRecord(userId: string, date: string) {
        // Find by compound index [userId+date] ideally, or just queries
        const record = await db.mealRecords.where({ userId, date }).first();
        if (record?.id) {
            await db.mealRecords.delete(record.id);
        }
    },

    // Meal Configs
    async saveMealConfig(userId: string, meals: any[]) {
        const existing = await db.mealConfigs
            .where({ userId })
            .first();

        if (existing) {
            await db.mealConfigs.update(existing.id!, {
                meals,
                timestamp: new Date().toISOString(),
                synced: 0
            });
            return existing.id;
        } else {
            return await db.mealConfigs.add({
                userId,
                meals,
                timestamp: new Date().toISOString(),
                synced: 0
            });
        }
    },

    async getMealConfig(userId: string) {
        return await db.mealConfigs
            .where({ userId })
            .first();
    },

    async getUnsyncedMealConfigs(userId: string) {
        return await db.mealConfigs
            .where({ userId, synced: 0 })
            .toArray();
    },

    async markMealConfigSynced(id: number) {
        await db.mealConfigs.update(id, { synced: 1 });
    },

    // Food Items
    async saveFood(userId: string, name: string) {
        // Check for duplicates
        const existing = await db.foods
            .where({ userId, name })
            .first();

        if (existing) return existing.id;

        return await db.foods.add({
            userId,
            name,
            timestamp: new Date().toISOString(),
            synced: 0
        });
    },

    async getFoods(userId: string) {
        return await db.foods
            .where({ userId })
            .toArray();
    },

    async deleteFood(id: number) {
        await db.foods.delete(id);
    },

    async getUnsyncedFoods(userId: string) {
        return await db.foods
            .where({ userId, synced: 0 })
            .toArray();
    },

    async markFoodSynced(id: number) {
        await db.foods.update(id, { synced: 1 });
    },

    // Templates
    async saveTemplate(userId: string, templateId: string, name: string, meals: any[], isActive: boolean = false) {
        const existing = await db.templates
            .where({ userId, templateId })
            .first();

        if (existing) {
            await db.templates.update(existing.id!, {
                name,
                meals,
                isActive,
                timestamp: new Date().toISOString(),
                synced: 0
            });
            return existing.id;
        } else {
            return await db.templates.add({
                userId,
                templateId,
                name,
                meals,
                isActive,
                timestamp: new Date().toISOString(),
                synced: 0
            });
        }
    },

    async getTemplates(userId: string) {
        return await db.templates
            .where({ userId })
            .toArray();
    },

    async getActiveTemplate(userId: string) {
        return await db.templates
            .where({ userId, isActive: true })
            .first();
    },

    async setActiveTemplate(userId: string, templateId: string) {
        // Deactivate all templates
        const allTemplates = await db.templates.where({ userId }).toArray();
        for (const template of allTemplates) {
            await db.templates.update(template.id!, { isActive: false, synced: 0 });
        }

        // Activate the selected template
        const template = await db.templates.where({ userId, templateId }).first();
        if (template) {
            await db.templates.update(template.id!, { isActive: true, synced: 0 });
        }
    },

    async deleteTemplate(userId: string, templateId: string) {
        const template = await db.templates.where({ userId, templateId }).first();
        if (template?.id) {
            await db.templates.delete(template.id);
        }
    },

    async getUnsyncedTemplates(userId: string) {
        return await db.templates
            .where({ userId, synced: 0 })
            .toArray();
    },

    async markTemplateSynced(id: number) {
        await db.templates.update(id, { synced: 1 });
    },

    // Profile
    async saveProfile(userId: string, data: any) {
        const existing = await db.profiles
            .where({ userId })
            .first();

        if (existing) {
            await db.profiles.update(existing.id!, {
                data,
                timestamp: new Date().toISOString(),
                synced: 0
            });
            return existing.id;
        } else {
            return await db.profiles.add({
                userId,
                data,
                timestamp: new Date().toISOString(),
                synced: 0
            });
        }
    },

    async getProfile(userId: string) {
        return await db.profiles
            .where({ userId })
            .first();
    },

    async getUnsyncedProfiles(userId: string) {
        return await db.profiles
            .where({ userId, synced: 0 })
            .toArray();
    },

    async markProfileSynced(id: number) {
        await db.profiles.update(id, { synced: 1 });
    },

    // Clear all data for a user
    async clearUserData(userId: string) {
        await db.mealRecords.where({ userId }).delete();
        await db.mealConfigs.where({ userId }).delete();
        await db.templates.where({ userId }).delete();
        await db.profiles.where({ userId }).delete();
        await db.foods.where({ userId }).delete();
    }
};
