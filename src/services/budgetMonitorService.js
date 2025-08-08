import cron from 'node-cron';
import config from '../config/env.js';
import logger from '../lib/logger.js';
import { getMonthlyTokenUsage } from '../models/tokenUsageModel.js';
import { getJobForDay } from '../models/jobModel.js';

// خدمة مراقبة شاملة للميزانية والتوكنز
class BudgetMonitorService {
  constructor() {
    this.alerts = [];
    this.budgetHistory = [];
    this.lastAlert = null;
    this.emergencyMode = false;
  }

  // حساب الإحصائيات الشاملة للميزانية
  async calculateBudgetStats() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    
    // الحصول على استخدام التوكنز الشهري
    const usedTokens = await getMonthlyTokenUsage(year, month);
    const monthlyLimit = config.generation.monthlyTokenCap;
    const remainingTokens = Math.max(0, monthlyLimit - usedTokens);
    
    // حساب الأيام المتبقية في الشهر
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const currentDay = now.getUTCDate();
    const daysRemaining = Math.max(1, lastDayOfMonth - currentDay + 1);
    const daysElapsed = currentDay - 1;
    
    // حساب معدلات الاستخدام
    const utilizationRate = (usedTokens / monthlyLimit) * 100;
    const expectedUsageByDay = (daysElapsed / lastDayOfMonth) * monthlyLimit;
    const usageEfficiency = expectedUsageByDay > 0 ? (usedTokens / expectedUsageByDay) * 100 : 0;
    
    // حساب الميزانيات اليومية
    const plannedDailyBudget = Math.floor(monthlyLimit / lastDayOfMonth);
    const remainingDailyBudget = Math.floor(remainingTokens / daysRemaining);
    const actualDailyUsage = daysElapsed > 0 ? Math.floor(usedTokens / daysElapsed) : 0;
    
    // توقع نهاية الشهر
    const projectedMonthlyUsage = actualDailyUsage * lastDayOfMonth;
    const projectedOverage = Math.max(0, projectedMonthlyUsage - monthlyLimit);
    
    // حساب عدد المقالات اليوم
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayJob = await getJobForDay(today);
    const articlesGeneratedToday = todayJob?.num_articles_generated || 0;
    const dailyTarget = config.generation.dailyTarget;
    
    // متوسط التوكنز لكل مقال
    const avgTokensPerArticle = articlesGeneratedToday > 0 ? 
      Math.floor(usedTokens / (articlesGeneratedToday + (daysElapsed - 1) * dailyTarget)) : 
      config.generation.estimatedTokensPerArticle;

    return {
      // معلومات الوقت
      currentDate: now.toISOString().split('T')[0],
      year,
      month,
      daysElapsed,
      daysRemaining,
      totalDaysInMonth: lastDayOfMonth,
      
      // معلومات التوكنز
      usedTokens,
      remainingTokens,
      monthlyLimit,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      
      // تحليل الاستخدام
      expectedUsageByDay: Math.round(expectedUsageByDay),
      usageEfficiency: Math.round(usageEfficiency * 100) / 100,
      isOnTrack: usageEfficiency <= 110, // 10% تسامح
      
      // الميزانيات اليومية
      plannedDailyBudget,
      remainingDailyBudget,
      actualDailyUsage,
      
      // التوقعات
      projectedMonthlyUsage: Math.round(projectedMonthlyUsage),
      projectedOverage: Math.round(projectedOverage),
      projectedUtilization: Math.round((projectedMonthlyUsage / monthlyLimit) * 100 * 100) / 100,
      willExceedBudget: projectedOverage > 0,
      
      // معلومات المقالات
      articlesGeneratedToday,
      dailyTarget,
      avgTokensPerArticle: Math.round(avgTokensPerArticle),
      
      // الحالة العامة
      status: this.determineBudgetStatus(utilizationRate, usageEfficiency, projectedOverage),
      riskLevel: this.calculateRiskLevel(utilizationRate, projectedOverage, daysRemaining),
      emergencyMode: this.emergencyMode
    };
  }

  // تحديد حالة الميزانية
  determineBudgetStatus(utilizationRate, usageEfficiency, projectedOverage) {
    if (this.emergencyMode) return 'EMERGENCY';
    if (projectedOverage > 0) return 'CRITICAL';
    if (utilizationRate > 90) return 'WARNING';
    if (usageEfficiency > 120) return 'ATTENTION';
    if (utilizationRate > 70) return 'MONITORING';
    return 'HEALTHY';
  }

  // حساب مستوى المخاطر
  calculateRiskLevel(utilizationRate, projectedOverage, daysRemaining) {
    let risk = 0;
    
    // مخاطر الاستخدام الحالي
    if (utilizationRate > 95) risk += 4;
    else if (utilizationRate > 90) risk += 3;
    else if (utilizationRate > 80) risk += 2;
    else if (utilizationRate > 70) risk += 1;
    
    // مخاطر التجاوز المتوقع
    if (projectedOverage > 0) {
      const overage = projectedOverage / config.generation.monthlyTokenCap;
      if (overage > 0.2) risk += 4;
      else if (overage > 0.1) risk += 3;
      else if (overage > 0.05) risk += 2;
      else risk += 1;
    }
    
    // مخاطر الوقت المتبقي
    if (daysRemaining < 3) risk += 2;
    else if (daysRemaining < 7) risk += 1;
    
    if (risk >= 7) return 'CRITICAL';
    if (risk >= 5) return 'HIGH';
    if (risk >= 3) return 'MEDIUM';
    if (risk >= 1) return 'LOW';
    return 'MINIMAL';
  }

  // إرسال تنبيه
  async sendAlert(type, message, stats) {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      message,
      stats: {
        utilizationRate: stats.utilizationRate,
        remainingTokens: stats.remainingTokens,
        daysRemaining: stats.daysRemaining,
        projectedOverage: stats.projectedOverage
      }
    };

    this.alerts.push(alert);
    
    // الاحتفاظ بآخر 50 تنبيه فقط
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    logger.warn({
      alertType: type,
      message,
      budgetStats: alert.stats
    }, `Budget Alert: ${type}`);

    // يمكن إضافة إرسال webhook هنا إذا كان مطلوباً
    if (config.monitoring.errorReportingWebhook && ['CRITICAL', 'EMERGENCY'].includes(type)) {
      try {
        // إرسال webhook للتنبيهات الحرجة
        // await sendWebhookAlert(config.monitoring.errorReportingWebhook, alert);
      } catch (err) {
        logger.error({ err }, 'Failed to send webhook alert');
      }
    }

    return alert;
  }

  // تفعيل الوضع الطارئ
  async activateEmergencyMode(reason, stats) {
    if (this.emergencyMode) return;
    
    this.emergencyMode = true;
    
    await this.sendAlert('EMERGENCY', `Emergency mode activated: ${reason}`, stats);
    
    logger.error({
      reason,
      budgetStats: stats,
      emergencyActions: [
        'Article generation suspended',
        'Only critical operations allowed',
        'Manual intervention required'
      ]
    }, 'EMERGENCY MODE ACTIVATED');
  }

  // إلغاء تفعيل الوضع الطارئ
  deactivateEmergencyMode() {
    if (!this.emergencyMode) return;
    
    this.emergencyMode = false;
    
    logger.info('Emergency mode deactivated - normal operations resumed');
  }

  // فحص الميزانية وإرسال التنبيهات
  async checkBudgetAndAlert() {
    try {
      const stats = await this.calculateBudgetStats();
      
      // حفظ في التاريخ
      this.budgetHistory.push({
        date: stats.currentDate,
        utilizationRate: stats.utilizationRate,
        usedTokens: stats.usedTokens,
        articlesGenerated: stats.articlesGeneratedToday
      });
      
      // الاحتفاظ بآخر 30 يوم فقط
      if (this.budgetHistory.length > 30) {
        this.budgetHistory = this.budgetHistory.slice(-30);
      }

      // فحص التنبيهات
      const now = Date.now();
      const timeSinceLastAlert = this.lastAlert ? now - this.lastAlert : Infinity;
      const minAlertInterval = 30 * 60 * 1000; // 30 دقيقة بين التنبيهات

      // الوضع الطارئ - استخدام 98%+ أو تجاوز متوقع كبير
      if ((stats.utilizationRate >= 98 || stats.projectedOverage > config.generation.monthlyTokenCap * 0.1) 
          && !this.emergencyMode) {
        await this.activateEmergencyMode(
          `Budget critically exceeded: ${stats.utilizationRate}% used, projected overage: ${stats.projectedOverage}`,
          stats
        );
      }
      
      // تنبيهات عادية (مع احترام الفترة الزمنية)
      else if (timeSinceLastAlert > minAlertInterval) {
        if (stats.utilizationRate >= 95 && stats.status !== 'EMERGENCY') {
          await this.sendAlert('CRITICAL', 
            `Budget usage critical: ${stats.utilizationRate}% used with ${stats.daysRemaining} days remaining`, 
            stats);
          this.lastAlert = now;
        }
        else if (stats.utilizationRate >= 85 && stats.willExceedBudget) {
          await this.sendAlert('WARNING', 
            `Budget on track to exceed: ${stats.projectedUtilization}% projected usage`, 
            stats);
          this.lastAlert = now;
        }
        else if (stats.utilizationRate >= 75 && stats.usageEfficiency > 130) {
          await this.sendAlert('ATTENTION', 
            `Budget usage ahead of schedule: ${stats.usageEfficiency}% efficiency`, 
            stats);
          this.lastAlert = now;
        }
      }

      // إلغاء الوضع الطارئ إذا تحسنت الحالة
      if (this.emergencyMode && stats.utilizationRate < 95 && stats.projectedOverage <= 0) {
        this.deactivateEmergencyMode();
      }

      return stats;

    } catch (err) {
      logger.error({ err }, 'Budget monitoring check failed');
      throw err;
    }
  }

  // الحصول على تقرير شامل
  generateBudgetReport(stats) {
    const report = {
      summary: {
        status: stats.status,
        riskLevel: stats.riskLevel,
        utilizationRate: `${stats.utilizationRate}%`,
        remainingBudget: `${(stats.remainingTokens / 1000).toFixed(0)}K tokens`,
        daysRemaining: stats.daysRemaining,
        projectedStatus: stats.willExceedBudget ? 'WILL EXCEED' : 'WITHIN BUDGET'
      },
      
      currentUsage: {
        usedTokens: stats.usedTokens.toLocaleString(),
        monthlyLimit: stats.monthlyLimit.toLocaleString(),
        dailyAverage: stats.actualDailyUsage.toLocaleString(),
        articlesToday: stats.articlesGeneratedToday,
        avgTokensPerArticle: stats.avgTokensPerArticle
      },
      
      projections: {
        estimatedMonthlyUsage: stats.projectedMonthlyUsage.toLocaleString(),
        projectedUtilization: `${stats.projectedUtilization}%`,
        potentialOverage: stats.projectedOverage > 0 ? 
          stats.projectedOverage.toLocaleString() : 'None',
        remainingDailyBudget: stats.remainingDailyBudget.toLocaleString()
      },
      
      recommendations: this.generateRecommendations(stats),
      
      recentAlerts: this.alerts.slice(-5).map(alert => ({
        time: alert.timestamp,
        type: alert.type,
        message: alert.message
      })),
      
      trends: this.budgetHistory.length > 1 ? {
        utilizationTrend: this.calculateTrend('utilizationRate'),
        usageTrend: this.calculateTrend('usedTokens'),
        efficiencyTrend: stats.usageEfficiency > 100 ? 'ABOVE_EXPECTED' : 'WITHIN_EXPECTED'
      } : null
    };

    return report;
  }

  // إنشاء توصيات
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.willExceedBudget) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Reduce daily article target',
        details: `Consider reducing from ${stats.dailyTarget} to ${Math.floor(stats.remainingTokens / stats.daysRemaining / stats.avgTokensPerArticle)} articles per day`
      });
    }

    if (stats.avgTokensPerArticle > config.generation.estimatedTokensPerArticle * 1.2) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Optimize article length',
        details: `Average ${stats.avgTokensPerArticle} tokens per article is high. Consider reducing max words or using more efficient models`
      });
    }

    if (stats.usageEfficiency > 120) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Review generation schedule',
        details: 'Usage is ahead of schedule. Consider spacing out generation runs or reducing batch sizes'
      });
    }

    if (stats.riskLevel === 'HIGH' || stats.riskLevel === 'CRITICAL') {
      recommendations.push({
        priority: 'HIGH',
        action: 'Enable budget mode',
        details: 'Switch to budget-optimized models and disable premium features'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        action: 'Continue monitoring',
        details: 'Budget usage is within acceptable parameters'
      });
    }

    return recommendations;
  }

  // حساب الاتجاه
  calculateTrend(field) {
    if (this.budgetHistory.length < 3) return 'INSUFFICIENT_DATA';
    
    const recent = this.budgetHistory.slice(-3);
    const values = recent.map(h => h[field]);
    
    const increasing = values[2] > values[1] && values[1] > values[0];
    const decreasing = values[2] < values[1] && values[1] < values[0];
    
    if (increasing) return 'INCREASING';
    if (decreasing) return 'DECREASING';
    return 'STABLE';
  }

  // الحصول على الإحصائيات
  getStats() {
    return {
      alertsCount: this.alerts.length,
      emergencyMode: this.emergencyMode,
      lastAlert: this.lastAlert,
      historyLength: this.budgetHistory.length
    };
  }
}

// إنشاء instance واحد
export const budgetMonitor = new BudgetMonitorService();

// جدولة فحص الميزانية كل 15 دقيقة
export function startBudgetMonitoring() {
  logger.info('Starting budget monitoring service');
  
  // فحص فوري عند البداية
  budgetMonitor.checkBudgetAndAlert().catch(err => {
    logger.error({ err }, 'Initial budget check failed');
  });
  
  // فحص دوري كل 15 دقيقة
  cron.schedule('*/15 * * * *', async () => {
    try {
      await budgetMonitor.checkBudgetAndAlert();
    } catch (err) {
      logger.error({ err }, 'Scheduled budget check failed');
    }
  });
  
  // تقرير يومي في الساعة 9 صباحاً
  cron.schedule('0 9 * * *', async () => {
    try {
      const stats = await budgetMonitor.calculateBudgetStats();
      const report = budgetMonitor.generateBudgetReport(stats);
      
      logger.info({ dailyBudgetReport: report }, 'Daily Budget Report');
    } catch (err) {
      logger.error({ err }, 'Daily budget report failed');
    }
  });
}

// دالة للحصول على حالة الميزانية
export async function getCurrentBudgetStatus() {
  try {
    return await budgetMonitor.checkBudgetAndAlert();
  } catch (err) {
    logger.error({ err }, 'Failed to get current budget status');
    throw err;
  }
}

// دالة للحصول على تقرير كامل
export async function getBudgetReport() {
  try {
    const stats = await budgetMonitor.calculateBudgetStats();
    return budgetMonitor.generateBudgetReport(stats);
  } catch (err) {
    logger.error({ err }, 'Failed to generate budget report');
    throw err;
  }
}

// دالة للتحقق من إمكانية تشغيل عملية
export async function canRunOperation(estimatedTokens) {
  try {
    const stats = await budgetMonitor.calculateBudgetStats();
    
    if (budgetMonitor.emergencyMode) {
      return { allowed: false, reason: 'Emergency mode active' };
    }
    
    if (stats.remainingTokens < estimatedTokens) {
      return { allowed: false, reason: 'Insufficient tokens remaining' };
    }
    
    if (stats.remainingDailyBudget < estimatedTokens) {
      return { allowed: false, reason: 'Daily budget exceeded' };
    }
    
    return { allowed: true, remainingTokens: stats.remainingTokens };
  } catch (err) {
    logger.error({ err }, 'Failed to check operation permission');
    return { allowed: false, reason: 'Budget check failed' };
  }
}

export default BudgetMonitorService;