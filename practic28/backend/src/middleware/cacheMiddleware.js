const cacheService = require('../services/CacheService');
const crypto = require('crypto');

/**
 * Middleware для кэширования GET запросов
 * @param {string} keyPrefix - Префикс ключа (например, 'users' или 'products')
 * @param {number} ttl - Время жизни кэша в секундах
 */
function cacheMiddleware(keyPrefix, ttl) {
    return async (req, res, next) => {
        // Кэшируем только GET запросы
        if (req.method !== 'GET') {
            return next();
        }

        // Формируем уникальный ключ: prefix:id или prefix:all?query_hash
        const id = req.params.id;
        let cacheKey;

        if (id) {
            // Для одиночного ресурса: products:6a1443188a890c3afd1fe879
            cacheKey = `${keyPrefix}:${id}`;
        } else {
            // Для списка: учитываем параметры запроса (поиск, фильтры)
            const queryString = req.originalUrl?.split('?')[1] || '';
            
            if (queryString) {
                // 🔧 Создаём MD5-хэш из строки запроса для безопасного ключа
                // Это решает проблемы с кириллицей, спецсимволами и длиной ключа в Redis
                const queryHash = crypto.createHash('md5').update(queryString, 'utf8').digest('hex');
                cacheKey = `${keyPrefix}:all:${queryHash}`;
            } else {
                // Запрос без параметров: products:all
                cacheKey = `${keyPrefix}:all`;
            }
        }

        try {
            // 1. Проверяем кэш
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                console.log(`💾 Cache HIT: ${cacheKey}`);
                // Возвращаем данные из кэша
                return res.json({
                    source: 'cache',
                    data: cachedData
                });
            }

            console.log(`❄️ Cache MISS: ${cacheKey}`);
            
            // 2. Если нет в кэше, сохраняем ключ в request, чтобы сохранить ответ позже
            req.cacheKey = cacheKey;
            req.cacheTTL = ttl;

            // Переопределяем res.json, чтобы перехватить ответ и сохранить его в кэш
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Сохраняем в кэш только если это успешный ответ (200-299)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheService.set(req.cacheKey, body, req.cacheTTL).catch(err => {
                        console.error('Failed to save to cache:', err);
                    });
                }
                return originalJson(body);
            };

            next();
        } catch (err) {
            console.error('Cache middleware error:', err);
            next(); // В случае ошибки кэша, просто пропускаем запрос дальше
        }
    };
}

module.exports = cacheMiddleware;