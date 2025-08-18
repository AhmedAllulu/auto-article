import { trackArticleView, trackCategoryView } from '../services/viewTracker.js';

/**
 * Middleware to automatically track article views
 * Add this middleware after serving an article page
 */
export function trackArticleViewMiddleware(articleData) {
  return async (req, res, next) => {
    // Only track GET requests for actual page views
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip tracking for bots and crawlers
    const userAgent = req.get('User-Agent') || '';
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /facebookexternalhit/i,
      /twitterbot/i, /linkedinbot/i, /whatsapp/i,
      /curl/i, /wget/i, /axios/i, /fetch/i
    ];
    
    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    if (isBot) {
      return next();
    }
    
    // Track the view asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        await trackArticleView(req, articleData);
      } catch (error) {
        console.error('View tracking error:', error);
      }
    });
    
    next();
  };
}

/**
 * Middleware to automatically track category views
 * Add this middleware after serving a category page
 */
export function trackCategoryViewMiddleware(categoryData) {
  return async (req, res, next) => {
    // Only track GET requests for actual page views
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip tracking for bots and crawlers
    const userAgent = req.get('User-Agent') || '';
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /facebookexternalhit/i,
      /twitterbot/i, /linkedinbot/i, /whatsapp/i,
      /curl/i, /wget/i, /axios/i, /fetch/i
    ];
    
    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    if (isBot) {
      return next();
    }
    
    // Track the view asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        await trackCategoryView(req, categoryData);
      } catch (error) {
        console.error('View tracking error:', error);
      }
    });
    
    next();
  };
}

/**
 * Express middleware to track views based on route patterns
 * This can be used as general middleware that detects the route type
 */
export function autoTrackViews(req, res, next) {
  // Store tracking function for later use
  res.trackView = async (contentType, contentData) => {
    const userAgent = req.get('User-Agent') || '';
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /facebookexternalhit/i,
      /twitterbot/i, /linkedinbot/i, /whatsapp/i,
      /curl/i, /wget/i, /axios/i, /fetch/i
    ];
    
    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    if (isBot) return;
    
    setImmediate(async () => {
      try {
        if (contentType === 'article') {
          await trackArticleView(req, contentData);
        } else if (contentType === 'category') {
          await trackCategoryView(req, contentData);
        }
      } catch (error) {
        console.error('View tracking error:', error);
      }
    });
  };
  
  next();
}

/**
 * Utility function to check if request should be tracked
 */
export function shouldTrackView(req) {
  // Only track GET requests
  if (req.method !== 'GET') return false;
  
  // Skip bots and crawlers
  const userAgent = req.get('User-Agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /googlebot/i, /bingbot/i, /facebookexternalhit/i,
    /twitterbot/i, /linkedinbot/i, /whatsapp/i,
    /curl/i, /wget/i, /axios/i, /fetch/i
  ];
  
  return !botPatterns.some(pattern => pattern.test(userAgent));
}

export default {
  trackArticleViewMiddleware,
  trackCategoryViewMiddleware,
  autoTrackViews,
  shouldTrackView
};
