import { query } from '../src/db.js';
import { trackArticleView } from '../src/services/viewTracker.js';

async function main() {
  try {
    console.log('Testing view tracking with slug lookup...');
    
    // Get a sample article from the database
    const articleResult = await query(`
      SELECT id, slug, language_code, category_id, title
      FROM articles_en 
      LIMIT 1;
    `);
    
    if (articleResult.rows.length === 0) {
      console.log('No articles found in database');
      return;
    }
    
    const article = articleResult.rows[0];
    console.log('Sample article:', {
      id: article.id,
      slug: article.slug,
      title: article.title,
      language_code: article.language_code,
      category_id: article.category_id
    });
    
    // Create a mock request object
    const mockReq = {
      ip: '192.168.1.100',
      get: (header) => {
        if (header === 'User-Agent') return 'Test-Slug-Agent/1.0';
        if (header === 'Referer' || header === 'Referrer') return 'https://example.com/test';
        return null;
      }
    };
    
    // Test tracking with slug only (no ID)
    console.log('\nTesting trackArticleView with slug lookup...');
    await trackArticleView(mockReq, {
      // id: undefined, // No ID provided
      slug: article.slug,
      language_code: article.language_code,
      category_id: article.category_id
    });
    
    console.log('✅ Slug-based view tracking test completed successfully!');
    
    // Check if the view was recorded
    const viewResult = await query(`
      SELECT * FROM article_views 
      WHERE article_slug = $1 AND user_ip = $2
      ORDER BY viewed_at DESC 
      LIMIT 1;
    `, [article.slug, '192.168.1.100']);
    
    if (viewResult.rows.length > 0) {
      const view = viewResult.rows[0];
      console.log('✅ View recorded via slug lookup:', {
        id: view.id,
        article_id: view.article_id,
        article_slug: view.article_slug,
        language_code: view.language_code,
        category_id: view.category_id,
        user_ip: view.user_ip,
        viewed_at: view.viewed_at
      });
    } else {
      console.log('❌ No view record found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
