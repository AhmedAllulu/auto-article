import { query } from '../src/db.js';
import { trackArticleView } from '../src/services/viewTracker.js';

async function main() {
  try {
    console.log('Testing view tracking with UUID article ID...');
    
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
      ip: '127.0.0.1',
      get: (header) => {
        if (header === 'User-Agent') return 'Test-Agent/1.0';
        if (header === 'Referer' || header === 'Referrer') return 'https://example.com';
        return null;
      }
    };
    
    // Test tracking with UUID
    console.log('\nTesting trackArticleView with UUID...');
    await trackArticleView(mockReq, {
      id: article.id, // This is a UUID
      slug: article.slug,
      language_code: article.language_code,
      category_id: article.category_id
    });
    
    console.log('✅ View tracking test completed successfully!');
    
    // Check if the view was recorded
    const viewResult = await query(`
      SELECT * FROM article_views 
      WHERE article_slug = $1 
      ORDER BY viewed_at DESC 
      LIMIT 1;
    `, [article.slug]);
    
    if (viewResult.rows.length > 0) {
      const view = viewResult.rows[0];
      console.log('✅ View recorded:', {
        id: view.id,
        article_id: view.article_id,
        article_slug: view.article_slug,
        language_code: view.language_code,
        category_id: view.category_id,
        viewed_at: view.viewed_at
      });
    } else {
      console.log('❌ No view record found');
    }
    
    // Check if article counters were updated
    const updatedArticle = await query(`
      SELECT id, slug, total_views, unique_views, last_viewed
      FROM articles_en 
      WHERE id = $1;
    `, [article.id]);
    
    if (updatedArticle.rows.length > 0) {
      const updated = updatedArticle.rows[0];
      console.log('✅ Article counters updated:', {
        id: updated.id,
        slug: updated.slug,
        total_views: updated.total_views,
        unique_views: updated.unique_views,
        last_viewed: updated.last_viewed
      });
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
