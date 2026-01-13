import { database } from '../db/database';

export interface Subscription {
  userId: string;
  plan: 'free' | 'pro' | 'team';
  storageLimit: number;
  aiLimit: number;
  aiUsedToday: number;
  lastResetDate: string;
}

interface SubscriptionRow {
  userid: string;
  plan: string;
  storagelimit: number;
  ailimit: number;
  aiusedtoday: number;
  lastresetdate: string;
  updatedat?: string;
}

export class SubscriptionModel {
  static async getByUserId(userId: string): Promise<Subscription> {
    let sub = await database.get<SubscriptionRow>('SELECT * FROM subscriptions WHERE "userId" = ?', [userId]);

    if (!sub) {
      // Create default free subscription
      const now = new Date().toISOString();
      const today = now.split('T')[0];
      await database.run(
        `INSERT INTO subscriptions ("userId", plan, "storageLimit", "aiLimit", "aiUsedToday", "lastResetDate", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'free', 50, 5, 0, today, now]
      );
      const newSub = await database.get<SubscriptionRow>('SELECT * FROM subscriptions WHERE "userId" = ?', [userId]);
      if (!newSub) {
        throw new Error('Failed to create subscription');
      }
      sub = newSub;
    }

    // Reset AI limit if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (sub.lastresetdate !== today) {
      await database.run(
        'UPDATE subscriptions SET "aiUsedToday" = 0, "lastResetDate" = ?, "updatedAt" = ? WHERE "userId" = ?',
        [today, new Date().toISOString(), userId]
      );
      sub.aiusedtoday = 0;
      sub.lastresetdate = today;
    }

    return {
      userId: sub.userid,
      plan: sub.plan as 'free' | 'pro' | 'team',
      storageLimit: sub.storagelimit,
      aiLimit: sub.ailimit,
      aiUsedToday: sub.aiusedtoday,
      lastResetDate: sub.lastresetdate
    };
  }

  static async incrementAiUsage(userId: string): Promise<void> {
    await database.run(
      'UPDATE subscriptions SET "aiUsedToday" = "aiUsedToday" + 1, "updatedAt" = ? WHERE "userId" = ?',
      [new Date().toISOString(), userId]
    );
  }

  static async upgradePlan(userId: string, plan: 'pro' | 'team'): Promise<void> {
    const limits = {
      pro: { storage: 1000, ai: 100 },
      team: { storage: 10000, ai: 1000 }
    };

    await database.run(
      'UPDATE subscriptions SET plan = ?, "storageLimit" = ?, "aiLimit" = ?, "updatedAt" = ? WHERE "userId" = ?',
      [plan, limits[plan].storage, limits[plan].ai, new Date().toISOString(), userId]
    );
  }
}
