import { config } from '../config.js';
import { AppError, ErrorTypes } from './errorHandler.js';
import { genLog, genError } from './logger.js';

/**
 * Configuration validation service that ensures all required settings
 * are properly configured and provides helpful error messages for
 * missing or invalid configurations.
 */

/**
 * Validation rules for different configuration sections
 */
const validationRules = {
  database: {
    required: ['databaseUrl'],
    validate: {
      databaseUrl: (value) => {
        if (!value || typeof value !== 'string') {
          throw new Error('DATABASE_URL must be a valid connection string');
        }
        if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
          throw new Error('DATABASE_URL must be a PostgreSQL connection string');
        }
      }
    }
  },
  
  oneMinAI: {
    required: ['apiKeys'],
    validate: {
      apiKeys: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('At least one ONE_MIN_AI_API_KEY must be configured');
        }
        value.forEach((key, index) => {
          if (!key || typeof key !== 'string' || key.trim().length === 0) {
            throw new Error(`ONE_MIN_AI_API_KEY${index > 0 ? `_${index}` : ''} is empty or invalid`);
          }
        });
      },
      baseUrl: (value) => {
        if (!value || typeof value !== 'string') {
          throw new Error('ONE_MIN_AI_BASE_URL must be a valid URL');
        }
        try {
          new URL(value);
        } catch {
          throw new Error('ONE_MIN_AI_BASE_URL must be a valid URL format');
        }
      }
    }
  },
  
  openAI: {
    required: ['apiKeys'],
    validate: {
      apiKeys: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('At least one OPENAI_API_KEY must be configured for translations');
        }
        value.forEach((key, index) => {
          if (!key || typeof key !== 'string' || key.trim().length === 0) {
            throw new Error(`OPENAI_API_KEY${index > 0 ? `_${index}` : ''} is empty or invalid`);
          }
        });
      }
    }
  },
  
  generation: {
    required: ['enabled'],
    validate: {
      enabled: (value) => {
        if (typeof value !== 'boolean') {
          throw new Error('ENABLE_GENERATION must be "true" or "false"');
        }
      },
      maxCategoriesPerRun: (value) => {
        if (typeof value !== 'number' || value < 1 || value > 10) {
          throw new Error('MAX_CATEGORIES_PER_RUN must be a number between 1 and 10');
        }
      },
      articlesPerCategoryPerDay: (value) => {
        if (typeof value !== 'number' || value < 1 || value > 5) {
          throw new Error('ARTICLES_PER_CATEGORY_PER_DAY must be a number between 1 and 5');
        }
      }
    }
  },
  
  languages: {
    required: ['languages'],
    validate: {
      languages: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('SUPPORTED_LANGUAGES must contain at least one language');
        }
        if (!value.includes('en')) {
          throw new Error('SUPPORTED_LANGUAGES must include "en" (English)');
        }
        const validLanguages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
        const invalidLanguages = value.filter(lang => !validLanguages.includes(lang));
        if (invalidLanguages.length > 0) {
          throw new Error(`Unsupported languages: ${invalidLanguages.join(', ')}. Supported: ${validLanguages.join(', ')}`);
        }
      }
    }
  },
  
  categories: {
    required: ['categoriesEnv'],
    validate: {
      categoriesEnv: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('TOP_CATEGORIES must contain at least one category');
        }
        value.forEach(category => {
          if (!category || typeof category !== 'string' || category.trim().length === 0) {
            throw new Error('All categories in TOP_CATEGORIES must be non-empty strings');
          }
        });
      }
    }
  }
};

/**
 * Validate a specific configuration section
 */
function validateSection(sectionName, sectionConfig, rules) {
  const errors = [];
  
  // Check required fields
  for (const requiredField of rules.required || []) {
    if (!(requiredField in sectionConfig) || sectionConfig[requiredField] === undefined) {
      errors.push(`Missing required field: ${requiredField}`);
    }
  }
  
  // Run custom validations
  if (rules.validate) {
    for (const [field, validator] of Object.entries(rules.validate)) {
      if (field in sectionConfig && sectionConfig[field] !== undefined) {
        try {
          validator(sectionConfig[field]);
        } catch (error) {
          errors.push(`${field}: ${error.message}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate all configuration sections
 */
export function validateConfiguration() {
  const allErrors = {};
  let hasErrors = false;
  
  genLog('Starting configuration validation');
  
  // Map config sections to validation rules
  const configSections = {
    database: { databaseUrl: config.databaseUrl },
    oneMinAI: {
      apiKeys: config.oneMinAI.apiKeys,
      baseUrl: config.oneMinAI.baseUrl
    },
    openAI: {
      apiKeys: config.openAI.apiKeys
    },
    generation: {
      enabled: config.generation.enabled,
      maxCategoriesPerRun: config.generation.maxCategoriesPerRun,
      articlesPerCategoryPerDay: config.generation.articlesPerCategoryPerDay
    },
    languages: {
      languages: config.languages
    },
    categories: {
      categoriesEnv: config.categoriesEnv
    }
  };
  
  // Validate each section
  for (const [sectionName, sectionConfig] of Object.entries(configSections)) {
    const rules = validationRules[sectionName];
    if (rules) {
      const errors = validateSection(sectionName, sectionConfig, rules);
      if (errors.length > 0) {
        allErrors[sectionName] = errors;
        hasErrors = true;
      }
    }
  }
  
  if (hasErrors) {
    const errorMessage = 'Configuration validation failed';
    genError(errorMessage, { errors: allErrors });
    
    throw new AppError(errorMessage, ErrorTypes.CONFIGURATION_ERROR, {
      sections: allErrors,
      help: 'Check your environment variables and configuration settings'
    });
  }
  
  genLog('Configuration validation passed', {
    sections: Object.keys(configSections),
    languages: config.languages,
    categories: config.categoriesEnv.length,
    generationEnabled: config.generation.enabled
  });
  
  return true;
}

/**
 * Validate configuration on startup and provide helpful error messages
 */
export function validateConfigurationOnStartup() {
  try {
    validateConfiguration();
    genLog('✅ Configuration validation successful');
    return true;
  } catch (error) {
    if (error instanceof AppError && error.type === ErrorTypes.CONFIGURATION_ERROR) {
      genError('❌ Configuration validation failed', error.context);
      
      console.error('\n🔧 Configuration Issues Found:');
      console.error('=====================================');
      
      for (const [section, errors] of Object.entries(error.context.sections)) {
        console.error(`\n[${section.toUpperCase()}]`);
        errors.forEach(err => console.error(`  ❌ ${err}`));
      }
      
      console.error('\n💡 Quick Fix Guide:');
      console.error('===================');
      console.error('1. Check your .env file exists and contains all required variables');
      console.error('2. Verify API keys are valid and not empty');
      console.error('3. Ensure DATABASE_URL points to a valid PostgreSQL database');
      console.error('4. Set ENABLE_GENERATION=true to enable article generation');
      console.error('5. Configure SUPPORTED_LANGUAGES (must include "en")');
      console.error('6. Set TOP_CATEGORIES with at least one category');
      
      return false;
    }
    
    genError('Unexpected error during configuration validation', { error: error.message });
    return false;
  }
}

/**
 * Get configuration summary for debugging
 */
export function getConfigurationSummary() {
  return {
    database: {
      configured: !!config.databaseUrl,
      url: config.databaseUrl ? '[CONFIGURED]' : '[MISSING]'
    },
    oneMinAI: {
      apiKeys: config.oneMinAI.apiKeys.length,
      baseUrl: config.oneMinAI.baseUrl,
      defaultModel: config.oneMinAI.defaultModel
    },
    openAI: {
      apiKeys: config.openAI.apiKeys.length,
      defaultModel: config.openAI.defaultModel
    },
    generation: {
      enabled: config.generation.enabled,
      maxCategoriesPerRun: config.generation.maxCategoriesPerRun,
      articlesPerCategoryPerDay: config.generation.articlesPerCategoryPerDay
    },
    languages: config.languages,
    categories: config.categoriesEnv,
    environment: config.env,
    port: config.port
  };
}

/**
 * Check if all required services are properly configured
 */
export function checkServiceHealth() {
  const health = {
    database: !!config.databaseUrl,
    oneMinAI: config.oneMinAI.apiKeys.length > 0,
    openAI: config.openAI.apiKeys.length > 0,
    generation: config.generation.enabled,
    languages: config.languages.length > 0 && config.languages.includes('en'),
    categories: config.categoriesEnv.length > 0
  };
  
  const allHealthy = Object.values(health).every(status => status === true);
  
  return {
    healthy: allHealthy,
    services: health,
    summary: allHealthy ? 'All services properly configured' : 'Some services need configuration'
  };
}

export default {
  validateConfiguration,
  validateConfigurationOnStartup,
  getConfigurationSummary,
  checkServiceHealth
};
