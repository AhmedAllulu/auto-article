import fs from 'fs';
import path from 'path';
import pino from 'pino';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Enhanced logger with file output and rotation
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  }
}, pino.multistream([
  // Console output (for development)
  {
    level: 'info',
    stream: process.stdout
  },
  // File output for generation logs
  {
    level: 'info',
    stream: pino.destination({
      dest: path.join(logsDir, `generation-${new Date().toISOString().split('T')[0]}.log`),
      sync: false,
      mkdir: true
    })
  },
  // Separate error log
  {
    level: 'error',
    stream: pino.destination({
      dest: path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`),
      sync: false,
      mkdir: true
    })
  }
]));

// Enhanced generation logger with structured data
export function genLog(message, meta = {}, level = 'info') {
  const logData = {
    component: 'generation',
    timestamp: new Date().toISOString(),
    message,
    ...meta
  };
  
  logger[level](logData);
}

// Error logger that stops process on critical errors
export function genError(message, meta = {}, shouldStop = true) {
  const errorData = {
    component: 'generation',
    timestamp: new Date().toISOString(),
    message,
    level: 'error',
    critical: shouldStop,
    ...meta
  };
  
  logger.error(errorData);
  
  if (shouldStop) {
    logger.error({ message: 'Stopping generation process due to critical error', timestamp: new Date().toISOString() });
    throw new Error(`Generation stopped: ${message}`);
  }
}

// Cleanup logs older than specified days
export async function cleanupOldLogs(daysToKeep = 10) {
  try {
    const files = fs.readdirSync(logsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let cleanedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        cleanedCount++;
        logger.info({ file, cleanedAt: new Date().toISOString() }, 'Cleaned up old log file');
      }
    }
    
    if (cleanedCount > 0) {
      logger.info({ cleanedCount, daysToKeep }, 'Log cleanup completed');
    }
    
    return cleanedCount;
  } catch (error) {
    logger.error({ error: error.message }, 'Log cleanup failed');
    return 0;
  }
}

// Translation progress logger
export function logTranslationProgress(category, language, status, meta = {}) {
  genLog(`Translation ${status}`, {
    category: category.slug,
    language,
    status,
    ...meta
  });
}

// Article generation progress logger  
export function logArticleProgress(category, type, status, meta = {}) {
  genLog(`Article ${status}`, {
    category: category.slug,
    type,
    status,
    ...meta
  });
}

export default logger;
