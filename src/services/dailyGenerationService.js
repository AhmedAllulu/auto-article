import { runManualGeneration } from './manualGenerationService.js';
import { genLog, genError } from './logger.js';

/**
 * Enhanced daily auto-generation service that uses the same robust logic
 * as manual generation but includes timing and scheduling constraints.
 * 
 * This service is designed to be called by the cron scheduler and provides
 * the same comprehensive generation and translation workflow as the manual
 * trigger, but with additional safeguards for automated execution.
 */

// Constants for optimal scheduling (from original optimizedGeneration.js)
const OPTIMAL_GENERATION_HOURS = [6, 7, 8, 9, 10, 11]; // 6 AM - 12 PM
const OPTIMAL_DAYS = [2, 3, 4]; // Tuesday, Wednesday, Thursday

/**
 * Check if current time is optimal for generation
 */
function isOptimalTime() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const isOptimalHour = OPTIMAL_GENERATION_HOURS.includes(hour);
  const isOptimalDay = OPTIMAL_DAYS.includes(day);
  
  return isOptimalHour && isOptimalDay;
}

/**
 * Check if we should skip generation due to timing constraints
 * This can be overridden by setting FORCE_GENERATION=true in environment
 */
function shouldSkipDueToTiming() {
  // Allow forcing generation regardless of timing
  if (process.env.FORCE_GENERATION === 'true') {
    genLog('Forcing generation despite timing constraints', {
      forceGeneration: true,
      currentTime: new Date().toISOString()
    });
    return false;
  }
  
  // Check if it's optimal time
  if (!isOptimalTime()) {
    const now = new Date();
    genLog('Skipping generation - not optimal time', {
      currentTime: now.toISOString(),
      currentHour: now.getHours(),
      currentDay: now.getDay(),
      optimalHours: OPTIMAL_GENERATION_HOURS,
      optimalDays: OPTIMAL_DAYS.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
    });
    return true;
  }
  
  return false;
}

/**
 * Enhanced daily generation function that RESPECTS TIMING CONSTRAINTS
 *
 * IMPORTANT: This function ENFORCES TIME-BASED RESTRICTIONS
 * - Used by automated cron jobs and scheduled generation
 * - Only runs during optimal timing windows (defined by OPTIMAL_GENERATION_HOURS and OPTIMAL_DAYS)
 * - Can be forced with FORCE_GENERATION=true environment variable
 * - Uses the same robust generation logic as manual generation but with timing checks
 */
export async function runDailyGeneration() {
  const startTime = Date.now();

  genLog('📅 Daily auto-generation started - RESPECTING TIME RESTRICTIONS', {
    trigger: 'automated',
    respectTiming: true,
    currentTime: new Date().toISOString(),
    currentHour: new Date().getHours(),
    currentDay: new Date().getDay(),
    optimalHours: OPTIMAL_GENERATION_HOURS,
    optimalDays: OPTIMAL_DAYS
  });

  try {
    // Check timing constraints (unless forced)
    if (shouldSkipDueToTiming()) {
      genLog('⏰ Daily generation SKIPPED due to timing constraints', {
        currentTime: new Date().toISOString(),
        currentHour: new Date().getHours(),
        currentDay: new Date().getDay(),
        reason: 'outside_optimal_window'
      });

      return {
        status: 'skipped',
        reason: 'not_optimal_time',
        message: 'Generation skipped - not optimal time',
        details: {
          categoriesProcessed: [],
          totalArticlesGenerated: 0,
          totalTranslationsCompleted: 0,
          executionTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          skippedReason: 'Timing constraints - not in optimal generation window'
        }
      };
    }

    genLog('✅ Daily generation proceeding - optimal time confirmed', {
      currentTime: new Date().toISOString(),
      currentHour: new Date().getHours(),
      currentDay: new Date().getDay()
    });
    
    // Use the same robust manual generation logic
    const result = await runManualGeneration();
    
    // Add daily generation specific metadata
    result.details.generationType = 'daily_auto';
    result.details.optimalTime = true;
    
    genLog('Daily auto-generation completed', {
      status: result.status,
      totalArticlesGenerated: result.details.totalArticlesGenerated,
      totalTranslationsCompleted: result.details.totalTranslationsCompleted,
      categoriesProcessed: result.details.categoriesProcessed.length,
      executionTimeMs: result.details.executionTimeMs
    });
    
    return result;
    
  } catch (error) {
    genError('Daily auto-generation failed', {
      error: error.message,
      stack: error.stack,
      executionTimeMs: Date.now() - startTime
    });
    
    return {
      status: 'error',
      message: 'Daily auto-generation failed',
      details: {
        categoriesProcessed: [],
        totalArticlesGenerated: 0,
        totalTranslationsCompleted: 0,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        generationType: 'daily_auto',
        error: error.message
      }
    };
  }
}

/**
 * Startup generation function for when server starts
 * This is more conservative and only runs if we're significantly behind quota
 */
export async function runStartupGeneration() {
  const startTime = Date.now();
  
  genLog('Startup generation check initiated');
  
  try {
    // Import here to avoid circular dependencies
    const { getCategoriesNeedingArticles } = await import('../services/optimizedGeneration.js');
    
    // Get categories that need articles
    const categoriesNeeding = await getCategoriesNeedingArticles();
    const totalArticlesNeeded = categoriesNeeding.reduce((sum, cat) => sum + cat.needed, 0);
    
    // Only run startup generation if we're significantly behind (more than 4 articles needed)
    if (totalArticlesNeeded < 4) {
      genLog('Startup generation skipped - quota nearly met', {
        totalArticlesNeeded,
        categoriesNeedingArticles: categoriesNeeding.length
      });
      
      return {
        status: 'skipped',
        reason: 'quota_nearly_met',
        message: 'Startup generation skipped - daily quota nearly met',
        details: {
          categoriesProcessed: [],
          totalArticlesGenerated: 0,
          totalTranslationsCompleted: 0,
          executionTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          totalArticlesNeeded,
          skippedReason: 'Daily quota nearly met - startup generation not needed'
        }
      };
    }
    
    genLog('Startup generation proceeding - significant quota gap detected', {
      totalArticlesNeeded,
      categoriesNeedingArticles: categoriesNeeding.length
    });
    
    // Use manual generation logic (bypasses timing constraints)
    const result = await runManualGeneration();
    
    // Add startup generation specific metadata
    result.details.generationType = 'startup';
    result.details.articlesNeededAtStart = totalArticlesNeeded;
    
    genLog('Startup generation completed', {
      status: result.status,
      totalArticlesGenerated: result.details.totalArticlesGenerated,
      totalTranslationsCompleted: result.details.totalTranslationsCompleted,
      categoriesProcessed: result.details.categoriesProcessed.length,
      executionTimeMs: result.details.executionTimeMs
    });
    
    return result;
    
  } catch (error) {
    genError('Startup generation failed', {
      error: error.message,
      stack: error.stack,
      executionTimeMs: Date.now() - startTime
    });
    
    return {
      status: 'error',
      message: 'Startup generation failed',
      details: {
        categoriesProcessed: [],
        totalArticlesGenerated: 0,
        totalTranslationsCompleted: 0,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        generationType: 'startup',
        error: error.message
      }
    };
  }
}

/**
 * Health check function that provides detailed status
 */
export async function checkDailyGenerationHealth() {
  try {
    // Import here to avoid circular dependencies
    const { checkGenerationHealth } = await import('../services/optimizedGeneration.js');
    
    const baseHealth = await checkGenerationHealth();
    
    // Add daily generation specific health info
    const enhancedHealth = {
      ...baseHealth,
      dailyGeneration: {
        isOptimalTime: isOptimalTime(),
        currentHour: new Date().getHours(),
        currentDay: new Date().getDay(),
        optimalHours: OPTIMAL_GENERATION_HOURS,
        optimalDays: OPTIMAL_DAYS,
        forceGeneration: process.env.FORCE_GENERATION === 'true'
      }
    };
    
    return enhancedHealth;
    
  } catch (error) {
    genError('Daily generation health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default { 
  runDailyGeneration, 
  runStartupGeneration, 
  checkDailyGenerationHealth,
  isOptimalTime 
};
