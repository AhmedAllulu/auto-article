import { config, validateConfig } from '../config/env.js';
import logger from '../lib/logger.js';
import { pool } from '../db/pool.js';
import { validateAITrendsService, getAITrendsStatistics } from './trendsService.js';
import { getCurrentBudgetStatus } from './budgetMonitorService.js';
import { generateArticleViaAPI } from './aiClient.js';

// خدمة مراقبة شاملة لصحة النظام
class SystemHealthService {
  constructor() {
    this.lastCheck = null;
    this.healthHistory = [];
    this.issues = [];
  }

  // فحص شامل لصحة النظام
  async performHealthCheck() {
    const startTime = Date.now();
    const checks = {};
    const issues = [];
    let overallHealth = 'HEALTHY';

    logger.info('Starting comprehensive system health check');

    try {
      // 1. فحص التكوين
      checks.configuration = await this.checkConfiguration();
      if (!checks.configuration.healthy) {
        issues.push(...checks.configuration.issues);
        overallHealth = 'WARNING';
      }

      // 2. فحص قاعدة البيانات
      checks.database = await this.checkDatabase();
      if (!checks.database.healthy) {
        issues.push('Database connectivity issues');
        overallHealth = 'CRITICAL';
      }

      // 3. فحص خدمة AI
      checks.aiService = await this.checkAIService();
      if (!checks.aiService.healthy) {
        issues.push('AI service issues');
        if (overallHealth !== 'CRITICAL') overallHealth = 'WARNING';
      }

      // 4. فحص خدمة Google Trends
      checks.trendsService = await this.checkTrendsService();
      if (!checks.trendsService.healthy) {
        issues.push('Google Trends service issues');
        if (overallHealth === 'HEALTHY') overallHealth = 'WARNING';
      }

      // 5. فحص الميزانية
      checks.budget = await this.checkBudgetHealth();
      if (!checks.budget.healthy) {
        issues.push('Budget issues detected');
        if (checks.budget.critical) overallHealth = 'CRITICAL';
        else if (overallHealth === 'HEALTHY') overallHealth = 'WARNING';
      }

      // 6. فحص أداء النظام
      checks.performance = await this.checkPerformance();
      if (!checks.performance.healthy) {
        issues.push('Performance issues detected');
        if (overallHealth === 'HEALTHY') overallHealth = 'WARNING';
      }

      // 7. فحص موارد النظام
      checks.resources = await this.checkSystemResources();
      if (!checks.resources.healthy) {
        issues.push('System resource issues');
        if (overallHealth === 'HEALTHY') overallHealth = 'WARNING';
      }

    } catch (err) {
      logger.error({ err }, 'Health check failed with error');
      overallHealth = 'CRITICAL';
      issues.push(`Health check error: ${err.message}`);
    }

    const executionTime = Date.now() - startTime;
    
    const healthResult = {
      timestamp: new Date().toISOString(),
      overallHealth,
      executionTimeMs: executionTime,
      checks,
      issues,
      summary: this.generateHealthSummary(checks, issues),
      recommendations: this.generateRecommendations(checks, issues)
    };

    // حفظ في التاريخ
    this.healthHistory.push({
      timestamp: healthResult.timestamp,
      health: overallHealth,
      issueCount: issues.length,
      executionTime
    });

    // الاحتفاظ بآخر 24 فحص فقط
    if (this.healthHistory.length > 24) {
      this.healthHistory = this.healthHistory.slice(-24);
    }

    this.lastCheck = healthResult;
    this.issues = issues;

    logger.info({
      overallHealth,
      issueCount: issues.length,
      executionTimeMs: executionTime,
      checksCompleted: Object.keys(checks).length
    }, 'System health check completed');

    return healthResult;
  }

  // فحص التكوين
  async checkConfiguration() {
    try {
      const validation = validateConfig();
      const issues = [...validation.errors, ...validation.warnings];
      
      // فحوصات إضافية للتكوين الاقتصادي
      const economyChecks = [];
      
      if (config.generation.monthlyTokenCap > 5_000_000) {
        economyChecks.push('Monthly token cap is very high - consider optimization');
      }
      
      if (config.generation.enableWebSearch && !config.generation.webSearchOnlyForHighValue) {
        economyChecks.push('Web search enabled for all content - may increase costs');
      }
      
      if (!config.generation.budgetMode) {
        economyChecks.push('Budget mode disabled - consider enabling for cost optimization');
      }

      const totalLanguagePercentage = Object.values(config.languageSettings)
        .reduce((sum, settings) => sum + settings.targetPercentage, 0);
      
      if (Math.abs(totalLanguagePercentage - 100) > 5) {
        economyChecks.push(`Language percentages sum to ${totalLanguagePercentage}% (should be ~100%)`);
      }

      return {
        healthy: validation.errors.length === 0,
        critical: validation.errors.length > 0,
        issues: [...validation.errors, ...validation.warnings, ...economyChecks],
        details: {
          errors: validation.errors.length,
          warnings: validation.warnings.length,
          economyIssues: economyChecks.length,
          supportedLanguages: config.languages.length,
          supportedCategories: config.topCategories.length
        }
      };
    } catch (err) {
      return {
        healthy: false,
        critical: true,
        issues: [`Configuration check failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // فحص قاعدة البيانات
  async checkDatabase() {
    try {
      const startTime = Date.now();
      
      // فحص الاتصال الأساسي
      const { rows } = await pool.query('SELECT NOW() as current_time, version() as version');
      const connectionTime = Date.now() - startTime;
      
      // فحص الجداول المطلوبة
      const tables = ['articles', 'categories', 'generation_jobs', 'token_usage'];
      const tableChecks = [];
      
      for (const table of tables) {
        try {
          const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          tableChecks.push({
            table,
            exists: true,
            count: parseInt(result.rows[0].count)
          });
        } catch (err) {
          tableChecks.push({
            table,
            exists: false,
            error: err.message
          });
        }
      }

      const missingTables = tableChecks.filter(check => !check.exists);
      const healthy = missingTables.length === 0 && connectionTime < 1000;

      return {
        healthy,
        critical: missingTables.length > 0,
        issues: missingTables.map(t => `Missing table: ${t.table}`),
        details: {
          connectionTimeMs: connectionTime,
          version: rows[0].version.split(' ')[0], // PostgreSQL version
          tables: tableChecks,
          poolStats: {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
          }
        }
      };
    } catch (err) {
      return {
        healthy: false,
        critical: true,
        issues: [`Database connection failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // فحص خدمة AI
  async checkAIService() {
    try {
      if (!config.ai.apiKey) {
        return {
          healthy: true, // OK in development
          critical: false,
          issues: ['AI API key not configured - using mock mode'],
          details: {
            mockMode: true,
            baseUrl: config.ai.baseUrl,
            defaultModel: config.ai.defaultTextModel
          }
        };
      }

      // اختبار بسيط للـ AI API
      const startTime = Date.now();
      
      try {
        const testResult = await generateArticleViaAPI({
          topic: 'System health test',
          languageCode: 'en',
          categoryName: 'technology',
          contentType: 'BLOG_POST',
          maxWords: 500 // مقال قصير للاختبار
        });

        const responseTime = Date.now() - startTime;
        const healthy = testResult.title && testResult.content && responseTime < 60000;

        return {
          healthy,
          critical: false,
          issues: healthy ? [] : ['AI API test failed'],
          details: {
            responseTimeMs: responseTime,
            model: testResult.model,
            tokensUsed: (testResult.tokensIn || 0) + (testResult.tokensOut || 0),
            apiKeyConfigured: true,
            baseUrl: config.ai.baseUrl
          }
        };
      } catch (aiErr) {
        return {
          healthy: false,
          critical: false,
          issues: [`AI API test failed: ${aiErr.message}`],
          details: {
            error: aiErr.message,
            apiKeyConfigured: true,
            baseUrl: config.ai.baseUrl
          }
        };
      }
    } catch (err) {
      return {
        healthy: false,
        critical: false,
        issues: [`AI service check failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // فحص خدمة Google Trends
  async checkTrendsService() {
    try {
      if (!config.trends.enabled || !config.features?.enableGeneration) {
        return {
          healthy: true,
          critical: false,
          issues: ['Google Trends service disabled'],
          details: { enabled: false }
        };
      }

      const validation = await validateAITrendsService();
      const stats = await getAITrendsStatistics();

      return {
        healthy: validation.healthy,
        critical: false,
        issues: validation.healthy ? [] : ['Google Trends validation failed'],
        details: {
          validation: validation.details,
          stats,
          cacheStatus: validation.cacheStatus
        }
      };
    } catch (err) {
      return {
        healthy: false,
        critical: false,
        issues: [`Google Trends check failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // فحص صحة الميزانية
  async checkBudgetHealth() {
    try {
      const budgetStatus = await getCurrentBudgetStatus();
      
      const critical = budgetStatus.status === 'EMERGENCY' || budgetStatus.emergencyMode;
      const warning = ['CRITICAL', 'WARNING'].includes(budgetStatus.status);
      const healthy = budgetStatus.status === 'HEALTHY';

      const issues = [];
      if (critical) {
        issues.push(`Budget in emergency state: ${budgetStatus.utilizationRate}% used`);
      } else if (warning) {
        issues.push(`Budget usage warning: ${budgetStatus.status}`);
      }

      if (budgetStatus.willExceedBudget) {
        issues.push(`Projected to exceed budget: ${budgetStatus.projectedUtilization}%`);
      }

      return {
        healthy,
        critical,
        issues,
        details: {
          status: budgetStatus.status,
          utilizationRate: budgetStatus.utilizationRate,
          remainingTokens: budgetStatus.remainingTokens,
          daysRemaining: budgetStatus.daysRemaining,
          emergencyMode: budgetStatus.emergencyMode,
          projectedOverage: budgetStatus.projectedOverage
        }
      };
    } catch (err) {
      return {
        healthy: false,
        critical: false,
        issues: [`Budget check failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // فحص الأداء
  async checkPerformance() {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // فحص استخدام الذاكرة
      const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
      const memoryLimit = 512; // MB - حد افتراضي
      const memoryHealthy = memoryUsageMB < memoryLimit * 0.8;

      // فحص وقت التشغيل
      const uptimeHours = uptime / 3600;
      const uptimeHealthy = uptimeHours > 0.1; // على الأقل 6 دقائق

      const issues = [];
      if (!memoryHealthy) {
        issues.push(`High memory usage: ${memoryUsageMB.toFixed(2)}MB`);
      }
      if (!uptimeHealthy) {
        issues.push('Low uptime - system may have restarted recently');
      }

      return {
        healthy: memoryHealthy && uptimeHealthy,
        critical: false,
        issues,
        details: {
          memory: {
            heapUsed: `${memoryUsageMB.toFixed(2)}MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`
          },
          uptime: {
            seconds: Math.round(uptime),
            hours: parseFloat(uptimeHours.toFixed(2)),
            formatted: this.formatUptime(uptime)
          },
          nodeVersion: process.version
        }
      };
    } catch (err) {
      return {
        healthy: false,
        critical: false,
        issues: [`Performance check failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // فحص موارد النظام
  async checkSystemResources() {
    try {
      // فحص متغيرات البيئة المطلوبة
      const requiredEnvVars = [
        'DATABASE_URL',
        'PORT'
      ];

      const optionalEnvVars = [
        'ONE_MIN_AI_API_KEY',
        'DAILY_ARTICLE_TARGET',
        'MONTHLY_TOKEN_CAP'
      ];

      const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
      const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);

      const issues = [];
      if (missingRequired.length > 0) {
        issues.push(`Missing required environment variables: ${missingRequired.join(', ')}`);
      }
      if (missingOptional.length > 0) {
        issues.push(`Missing optional environment variables: ${missingOptional.join(', ')}`);
      }

      return {
        healthy: missingRequired.length === 0,
        critical: missingRequired.length > 0,
        issues,
        details: {
          requiredEnvVars: {
            configured: requiredEnvVars.length - missingRequired.length,
            total: requiredEnvVars.length,
            missing: missingRequired
          },
          optionalEnvVars: {
            configured: optionalEnvVars.length - missingOptional.length,
            total: optionalEnvVars.length,
            missing: missingOptional
          },
          nodeEnv: process.env.NODE_ENV || 'undefined',
          platform: process.platform,
          architecture: process.arch
        }
      };
    } catch (err) {
      return {
        healthy: false,
        critical: false,
        issues: [`System resources check failed: ${err.message}`],
        details: { error: err.message }
      };
    }
  }

  // إنشاء ملخص الصحة
  generateHealthSummary(checks, issues) {
    const totalChecks = Object.keys(checks).length;
    const healthyChecks = Object.values(checks).filter(check => check.healthy).length;
    const criticalChecks = Object.values(checks).filter(check => check.critical).length;

    return {
      totalChecks,
      healthyChecks,
      criticalChecks,
      healthPercentage: Math.round((healthyChecks / totalChecks) * 100),
      totalIssues: issues.length,
      status: criticalChecks > 0 ? 'CRITICAL' : 
              issues.length > 0 ? 'WARNING' : 'HEALTHY'
    };
  }

  // إنشاء التوصيات
  generateRecommendations(checks, issues) {
    const recommendations = [];

    // توصيات التكوين
    if (checks.configuration && !checks.configuration.healthy) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Configuration',
        action: 'Fix configuration issues',
        details: 'Review and correct configuration errors before proceeding'
      });
    }

    // توصيات قاعدة البيانات
    if (checks.database && !checks.database.healthy) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Database',
        action: 'Resolve database connectivity',
        details: 'Ensure database is running and accessible'
      });
    }

    // توصيات AI
    if (checks.aiService && !checks.aiService.healthy && config.ai.apiKey) {
      recommendations.push({
        priority: 'HIGH',
        category: 'AI Service',
        action: 'Check AI API configuration',
        details: 'Verify API key and endpoint configuration'
      });
    }

    // توصيات الميزانية
    if (checks.budget && checks.budget.critical) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Budget',
        action: 'Address budget crisis',
        details: 'Implement emergency cost reduction measures'
      });
    } else if (checks.budget && !checks.budget.healthy) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Budget',
        action: 'Optimize budget usage',
        details: 'Review and adjust generation parameters'
      });
    }

    // توصيات الأداء
    if (checks.performance && !checks.performance.healthy) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        action: 'Monitor system performance',
        details: 'Consider scaling or optimization if issues persist'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Maintenance',
        action: 'Continue monitoring',
        details: 'System is healthy, maintain regular monitoring'
      });
    }

    return recommendations;
  }

  // تنسيق وقت التشغيل
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // الحصول على آخر فحص
  getLastHealthCheck() {
    return this.lastCheck;
  }

  // الحصول على تاريخ الصحة
  getHealthHistory() {
    return this.healthHistory;
  }

  // الحصول على الإحصائيات
  getHealthStats() {
    const recentChecks = this.healthHistory.slice(-10);
    const avgExecutionTime = recentChecks.length > 0 ?
      recentChecks.reduce((sum, check) => sum + check.executionTime, 0) / recentChecks.length : 0;

    return {
      lastCheckTime: this.lastCheck?.timestamp || null,
      currentIssues: this.issues.length,
      recentChecks: recentChecks.length,
      avgExecutionTimeMs: Math.round(avgExecutionTime),
      healthTrend: this.calculateHealthTrend()
    };
  }

  // حساب اتجاه الصحة
  calculateHealthTrend() {
    if (this.healthHistory.length < 3) return 'INSUFFICIENT_DATA';
    
    const recent = this.healthHistory.slice(-3);
    const healthScores = recent.map(h => {
      if (h.health === 'HEALTHY') return 3;
      if (h.health === 'WARNING') return 2;
      if (h.health === 'CRITICAL') return 1;
      return 0;
    });
    
    const improving = healthScores[2] > healthScores[1] && healthScores[1] >= healthScores[0];
    const deteriorating = healthScores[2] < healthScores[1] && healthScores[1] <= healthScores[0];
    
    if (improving) return 'IMPROVING';
    if (deteriorating) return 'DETERIORATING';
    return 'STABLE';
  }
}

// إنشاء instance واحد
export const systemHealth = new SystemHealthService();

// دالة للحصول على فحص سريع
export async function quickHealthCheck() {
  try {
    const checks = {
      database: false,
      budget: false,
      configuration: false
    };

    // فحص سريع لقاعدة البيانات
    try {
      await pool.query('SELECT 1');
      checks.database = true;
    } catch (err) {
      logger.warn({ err }, 'Quick database check failed');
    }

    // فحص سريع للميزانية
    try {
      const budgetStatus = await getCurrentBudgetStatus();
      checks.budget = !budgetStatus.emergencyMode && budgetStatus.status !== 'CRITICAL';
    } catch (err) {
      logger.warn({ err }, 'Quick budget check failed');
    }

    // فحص سريع للتكوين
    try {
      const validation = validateConfig();
      checks.configuration = validation.errors.length === 0;
    } catch (err) {
      logger.warn({ err }, 'Quick configuration check failed');
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const overallHealth = healthyChecks === totalChecks ? 'HEALTHY' :
                         healthyChecks >= totalChecks * 0.7 ? 'WARNING' : 'CRITICAL';

    return {
      timestamp: new Date().toISOString(),
      overallHealth,
      checks,
      healthPercentage: Math.round((healthyChecks / totalChecks) * 100)
    };
  } catch (err) {
    logger.error({ err }, 'Quick health check failed');
    return {
      timestamp: new Date().toISOString(),
      overallHealth: 'CRITICAL',
      error: err.message
    };
  }
}

export default SystemHealthService;