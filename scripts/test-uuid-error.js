import { query } from '../src/db.js';
import { trackArticleView } from '../src/services/viewTracker.js';

async function main() {
  try {
    console.log('Testing various scenarios that might cause UUID errors...');
    
    // Create a mock request object
    const mockReq = {
      ip: '127.0.0.1',
      get: (header) => {
        if (header === 'User-Agent') return 'Test-Agent/1.0';
        if (header === 'Referer' || header === 'Referrer') return 'https://example.com';
        return null;
      }
    };
    
    console.log('\n1. Testing with integer ID "4"...');
    try {
      await trackArticleView(mockReq, {
        id: "4", // This might cause the UUID error
        slug: "test-article",
        language_code: "en",
        category_id: 1
      });
      console.log('✅ Integer ID test passed');
    } catch (error) {
      console.log('❌ Integer ID test failed:', error.message);
    }
    
    console.log('\n2. Testing with integer ID 4 (number)...');
    try {
      await trackArticleView(mockReq, {
        id: 4, // This might cause the UUID error
        slug: "test-article",
        language_code: "en",
        category_id: 1
      });
      console.log('✅ Integer ID (number) test passed');
    } catch (error) {
      console.log('❌ Integer ID (number) test failed:', error.message);
    }
    
    console.log('\n3. Testing with invalid UUID...');
    try {
      await trackArticleView(mockReq, {
        id: "invalid-uuid-format", 
        slug: "test-article",
        language_code: "en",
        category_id: 1
      });
      console.log('✅ Invalid UUID test passed');
    } catch (error) {
      console.log('❌ Invalid UUID test failed:', error.message);
    }
    
    console.log('\n4. Testing with null ID and invalid slug...');
    try {
      await trackArticleView(mockReq, {
        id: null,
        slug: "non-existent-article-slug",
        language_code: "en",
        category_id: 1
      });
      console.log('✅ Null ID test passed');
    } catch (error) {
      console.log('❌ Null ID test failed:', error.message);
    }
    
    console.log('\n5. Testing with empty string ID...');
    try {
      await trackArticleView(mockReq, {
        id: "",
        slug: "test-article",
        language_code: "en",
        category_id: 1
      });
      console.log('✅ Empty string ID test passed');
    } catch (error) {
      console.log('❌ Empty string ID test failed:', error.message);
    }
    
    console.log('\n6. Testing with undefined ID...');
    try {
      await trackArticleView(mockReq, {
        // id: undefined,
        slug: "test-article",
        language_code: "en",
        category_id: 1
      });
      console.log('✅ Undefined ID test passed');
    } catch (error) {
      console.log('❌ Undefined ID test failed:', error.message);
    }
    
    console.log('\nAll tests completed.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
  
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
