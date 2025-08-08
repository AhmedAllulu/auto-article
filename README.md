# Auto Article Backend - نظام إنشاء المقالات الآلي المحسن

نظام متقدم لإنشاء المقالات آلياً باستخدام الذكاء الاصطناعي مع تحسينات شاملة للاقتصاد والربحية.

## 🚀 الميزات الجديدة

### 💰 إدارة اقتصادية للميزانية
- **مراقبة التوكنز**: مراقبة مستمرة لاستخدام التوكنز مع حدود شهرية محكمة (4 مليون توكن)
- **اختيار الموديل الذكي**: اختيار تلقائي للنماذج الاقتصادية حسب نوع المحتوى والميزانية المتبقية
- **الوضع الطارئ**: إيقاف تلقائي عند اقتراب استنفاد الميزانية
- **تنبيهات الميزانية**: تنبيهات مبكرة عند 80%, 90%, 95%, 98% من الاستخدام

### 📈 استراتيجية الربحية
- **توزيع ذكي**: توزيع المحتوى حسب معدل الربح (RPM) لكل لغة وفئة
- **الأولوية للمحتوى عالي القيمة**: 
  - إنجليزية (35%) - أعلى ربح (15.50 RPM)
  - ألمانية (20%) - ربح عالي (12.80 RPM)
  - فرنسية (15%) - ربح متوسط (9.40 RPM)
- **فئات مربحة أولاً**: تقنية، مالية، أعمال كأولوية قصوى

### 🔄 تكامل Google Trends محسن
- **ترندز حقيقية**: دمج مواضيع رائجة من Google Trends لكل لغة ومنطقة
- **معالجة أخطاء شاملة**: نظام Fallback متطور مع إعادة المحاولة والـ Cache
- **توزيع جغرافي**: استهداف مناطق مختلفة حسب اللغة (US للإنجليزية، DE للألمانية، إلخ)

### 🎯 استراتيجية المحتوى المتقدمة
- **أنواع محتوى متنوعة**:
  - مقالات SEO عالية القيمة (45%) - للمحتوى التقني والمالي
  - أخبار رائجة (25%) - للمواضيع الحديثة
  - أدلة عملية (20%) - للمحتوى التعليمي
  - رؤى سريعة (10%) - للمحتوى الخفيف

### 📊 مراقبة شاملة للصحة
- **فحص الصحة التلقائي**: مراقبة قاعدة البيانات، AI، الترندز، والميزانية
- **تقارير يومية**: تقارير مفصلة عن الأداء والاستخدام
- **إنذار مبكر**: تنبيهات فورية للمشاكل الحرجة

## 📋 المتطلبات

### البيئة المطلوبة
```bash
Node.js >= 18.0.0
PostgreSQL >= 13.0
npm >= 8.0.0
```

### متغيرات البيئة الأساسية
```env
# إعدادات الخادم
PORT=3322
NODE_ENV=production
DATABASE_URL=postgres://user:pass@localhost:5432/auto_article

# مفتاح API الأساسي (مطلوب للإنتاج)
ONE_MIN_AI_API_KEY=your_key_here
ONE_MIN_AI_BASE_URL=https://api.1min.ai

# إعدادات الإنتاج المحسنة للاقتصاد
DAILY_ARTICLE_TARGET=100
MONTHLY_TOKEN_CAP=4000000

# الوضع الاقتصادي (مُفعل افتراضياً)
BUDGET_MODE=true
PREMIUM_CONTENT_PERCENTAGE=20
ENABLE_WEB_SEARCH=false
WEB_SEARCH_HIGH_VALUE_ONLY=true

# إعدادات الموديل الاقتصادية
AI_DEFAULT_TEXT_MODEL=gpt-4o-mini
AI_FALLBACK_MODEL=mistral-nemo
AI_PREMIUM_MODEL=gpt-4o

# تحسين الأداء
MAX_BATCH_PER_RUN=6
CRON_SCHEDULE=*/20 * * * *
```

### إعدادات اللغات والفئات (محسنة للربحية)
```env
# ترتيب اللغات حسب الربحية
SUPPORTED_LANGUAGES=en,de,fr,es,pt,ar,hi

# ترتيب الفئات حسب الربحية  
TOP_CATEGORIES=technology,finance,business,health,travel,sports,entertainment

# إعدادات Google Trends
TRENDS_ENABLED=true
TRENDS_CACHE_TTL_MINUTES=45
TRENDS_GEO_EN=US
TRENDS_GEO_DE=DE
TRENDS_GEO_FR=FR
```

## 🔧 التثبيت والإعداد

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd auto-article-backend
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات والجداول
npm run migrate

# بذر البيانات الأولية (الفئات)
npm run seed
```

### 3. التشغيل
```bash
# التطوير مع إعادة التشغيل التلقائي
npm run dev

# الإنتاج
npm start

# فحص الصحة فقط
npm run health-check
```

## 📊 المراقبة والإدارة

### نقاط نهاية المراقبة

#### فحص الصحة السريع
```http
GET /health
```
```json
{
  "status": "HEALTHY",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": true,
    "budget": true,
    "configuration": true
  },
  "uptime": 3600
}
```

#### تقرير الميزانية الشامل
```http
GET /admin/budget
Authorization: Bearer your-token
```
```json
{
  "summary": {
    "status": "HEALTHY",
    "utilizationRate": "45.2%",
    "remainingBudget": "2,192K tokens",
    "daysRemaining": 16,
    "projectedStatus": "WITHIN BUDGET"
  },
  "currentUsage": {
    "usedTokens": "1,808,000",
    "monthlyLimit": "4,000,000",
    "dailyAverage": "112,500",
    "articlesToday": 45,
    "avgTokensPerArticle": 2250
  },
  "recommendations": [
    {
      "priority": "LOW",
      "action": "Continue monitoring",
      "details": "Budget usage is within acceptable parameters"
    }
  ]
}
```

#### فحص الصحة الشامل
```http
GET /admin/health/full
Authorization: Bearer your-token
```

#### التشغيل اليدوي
```http
POST /admin/generate
Authorization: Bearer your-token
Content-Type: application/json

{
  "batchSize": 5,
  "language": "en",
  "category": "technology",
  "forceHighValue": true
}
```

## 💡 الاستخدام الأمثل

### 1. إعدادات الإنتاج المُثلى
```env
# للحصول على أقصى ربحية مع أقل تكلفة
DAILY_ARTICLE_TARGET=80
MONTHLY_TOKEN_CAP=3800000
BUDGET_MODE=true
PREMIUM_CONTENT_PERCENTAGE=15

# تركيز على اللغات المربحة
SUPPORTED_LANGUAGES=en,de,fr,es

# تركيز على الفئات المربحة
TOP_CATEGORIES=technology,finance,business,health
```

### 2. مراقبة الميزانية
- فحص تقرير الميزانية يومياً عبر `/admin/budget`
- مراقبة التنبيهات في logs النظام
- تعديل `DAILY_ARTICLE_TARGET` حسب الاستخدام الفعلي

### 3. تحسين الجودة
- تفعيل Google Trends للمحتوى الرائج
- استخدام Web Search للفئات عالية القيمة فقط
- مراقبة متوسط التوكنز لكل مقال

## 🔍 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. تجاوز الميزانية
```
ERROR: Monthly token cap reached
```
**الحل:**
- فحص `/admin/budget` لرؤية الاستخدام التفصيلي
- تقليل `DAILY_ARTICLE_TARGET`
- تفعيل `BUDGET_MODE=true`
- استخدام نماذج اقتصادية أكثر

#### 2. فشل Google Trends
```
WARN: Google Trends fetch failed
```
**الحل:**
- التحقق من اتصال الإنترنت
- فحص حدود Google Trends API
- النظام سيستخدم مواضيع احتياطية تلقائياً

#### 3. أداء بطيء
```
WARN: Slow generation detected
```
**الحل:**
- تقليل `MAX_BATCH_PER_RUN`
- زيادة `CRON_SCHEDULE` (مثل `*/30 * * * *`)
- استخدام نماذج أسرع

### فحص الصحة التشخيصي
```bash
# فحص سريع للمكونات الأساسية
curl -s http://localhost:3322/health | jq

# فحص شامل (يتطلب authentication)
curl -s -H "Authorization: Bearer token" \
  http://localhost:3322/admin/health/full | jq
```

## 📈 إحصائيات الأداء

### معدلات الإنتاج المتوقعة
- **100 مقال/يوم** = ~3.96M توكن/شهر (99% من الحد الأقصى)
- **80 مقال/يوم** = ~3.17M توكن/شهر (79% من الحد الأقصى) ✅ **مُوصى به**
- **60 مقال/يوم** = ~2.38M توكن/شهر (60% من الحد الأقصى)

### توزيع التوكنز حسب المكون
- **المحتوى الأساسي**: 85%
- **البحث على الويب**: 10% (للمحتوى عالي القيمة فقط)
- **المعالجة والتحسين**: 5%

### معدل الربحية المتوقع
- **اللغة الإنجليزية**: 15.50 RPM
- **الألمانية**: 12.80 RPM  
- **الفرنسية**: 9.40 RPM
- **المتوسط العام**: ~11.20 RPM

## 🛡️ الأمان

### التوصيات الأمنية
- استخدام HTTPS في الإنتاج
- تأمين مفاتيح API في متغيرات البيئة
- تفعيل authentication لـ admin endpoints
- مراقبة logs للكشف عن الأنشطة المشبوهة

### حماية الميزانية
- تفعيل الوضع الطارئ التلقائي
- تنبيهات فورية عند 95% استخدام
- حدود يومية صارمة

## 📞 الدعم

### Logs مفيدة للتشخيص
```bash
# مراقبة logs مباشرة
npm run logs

# فلترة حسب مستوى الخطورة
npm run logs | grep "ERROR\|WARN"

# مراقبة الميزانية خصوصاً
npm run logs | grep "Budget"
```

### معلومات مفيدة للدعم
- إصدار Node.js: `node --version`
- حالة قاعدة البيانات: `GET /health`
- تقرير الميزانية: `GET /admin/budget`
- فحص الصحة الشامل: `GET /admin/health/full`

---

## 📝 ملاحظات هامة

1. **الاقتصاد أولاً**: النظام مُحسن للحفاظ على الميزانية ضمن 4 مليون توكن شهرياً
2. **جودة عالية**: رغم التحسين الاقتصادي، الجودة محفوظة من خلال الاختيار الذكي للنماذج
3. **مراقبة مستمرة**: النظام يراقب نفسه ويُرسل تنبيهات عند أي مشاكل
4. **مرونة التوسع**: سهولة تعديل الإعدادات حسب النمو والمتطلبات

**نصيحة**: ابدأ بـ 60-80 مقال يومياً ثم اضبط حسب الاستخدام الفعلي والنتائج المطلوبة.