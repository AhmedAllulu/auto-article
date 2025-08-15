# Getting Started Guide

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url> auto-article
cd auto-article
npm install
```

### 2. Environment Configuration
Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your API keys and database credentials
```

### 3. Database Setup
```bash
npm run migrate    # Create database tables
npm run seed      # Add sample categories
```

### 4. Test AI APIs
```bash
npm run test:ai   # Verify API connections
```

### 5. Generate Sample Content
```bash
npm run generate:article
```

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your site!

## Key Concepts

### Article Types
The system generates 9 different types of articles:
- **Master**: Comprehensive SEO articles
- **How-To**: Step-by-step tutorials  
- **Best-Of**: Top lists and roundups
- **Compare**: Product/service comparisons
- **Trends**: Current trend analysis
- **Review**: Detailed reviews
- **Case Study**: Real-world examples
- **Beginner Guide**: Entry-level content
- **Myth Buster**: Debunking misconceptions

### Template System
Each article type uses templates from `src/prompts/`:
- Multiple variants per type for variety
- Shared structure for SEO consistency
- Automatic category replacement
- Built-in FAQ and external links

### Generation Process
1. **Category Selection**: Choose from available categories
2. **Template Selection**: Random template variant picked
3. **AI Generation**: Content created via 1min.ai or OpenAI
4. **Content Extraction**: Structured data extracted from response
5. **Image Fetching**: Relevant image from Unsplash
6. **Database Storage**: Article saved and published

## Configuration

### Adding New Categories
```bash
# Add to database
INSERT INTO categories (name, slug, icon) 
VALUES ('Technology', 'technology', 'fas fa-laptop');

# Or use the admin interface at /admin
```

### Customizing Templates
Edit files in `src/prompts/` to modify article generation:
```javascript
// Example: Add new template variant
const templates = [
  // ... existing templates
  {
    system: `Your new system prompt...`,
    user: `Your new user prompt for "{{CATEGORY}}"...
    
    ${COMMON_STRUCTURE}`,
  }
];
```

### API Configuration
Update `src/config/config.js` for API settings:
```javascript
export default {
  oneMinAI: {
    apiKey: process.env.ONEMIN_AI_API_KEY,
    defaultModel: 'gpt-4o-mini',
    enableWebSearch: true
  },
  // ... other settings
};
```

## Deployment

### Development
```bash
npm run dev  # Hot reloading development server
```

### Production
```bash
npm run build    # Build assets
npm start        # Production server
```

### PM2 (Recommended)
```bash
npm install -g pm2
pm2 start PM2.config.js
pm2 save
pm2 startup
```

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -U your_user -d your_database -c "SELECT version();"
```

**AI API Errors**
```bash
# Test API connectivity
npm run test:ai

# Check API key validity in .env file
```

**Image Loading Issues**
```bash
# Verify Unsplash API key
curl -H "Authorization: Client-ID YOUR_UNSPLASH_KEY" \
  "https://api.unsplash.com/photos/random?query=technology"
```

**Generation Failures**
- Check rate limits on AI APIs
- Verify template syntax in `src/prompts/`
- Review logs for specific error messages

### Debug Mode
```bash
NODE_ENV=development npm run dev
# Enables detailed logging and error reporting
```

## Next Steps

1. **Customize Design**: Edit CSS in `src/public/css/`
2. **Add Categories**: Use admin interface or database
3. **Schedule Generation**: Set up cron jobs for automatic content
4. **SEO Optimization**: Configure Google Analytics and Search Console
5. **Performance Monitoring**: Set up uptime and performance tracking

## Support

- Review `ARCHITECTURE.md` for detailed technical documentation
- Check the `/admin` dashboard for system status
- Monitor logs for debugging information
- Use the test scripts to verify system health

---

**Need Help?** Check the logs at `pm2 logs auto-article` or enable debug mode for detailed error reporting.
