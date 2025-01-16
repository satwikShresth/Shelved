import axios from 'axios';
import LRUCache from 'lru-cache';

export class Service {
   constructor(apiKey) {
      if (new.target === Service) {
         throw new Error('Cannot instantiate abstract class Service directly');
      }
      if (!apiKey) throw new Error('API key is required');

      this.apiKey = apiKey;
      this.defaultQueryParms = {};
      this.mapped = {};

      this.cache = new LRUCache({
         max: 500,
         ttl: 1000 * 60 * 60 * 24,
         updateAgeOnGet: true,
         allowStale: false,
      });
   }

   generateCacheKey(url, queryParams) {
      const sortedParams = Object.entries(queryParams)
         .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
         .map(([key, value]) => `${key}=${value}`)
         .join('&');
      return `${url}?${sortedParams}`;
   }

   normalizeDataList(dataList, mapping) {
      return dataList.map((item) => this.normalizeData(item, mapping));
   }

   normalizeData(data, mapping) {
      return Object.fromEntries(
         Object.keys(mapping).map((key) => [
            key,
            this.resolveOr(data, mapping[key]),
         ]),
      );
   }

   resolveOr(obj, path) {
      const paths = path.split(' | ');
      for (const p of paths) {
         const value = this.extractNestedValue(obj, p);
         if (value !== undefined) {
            return value;
         }
      }
      return undefined;
   }

   extractNestedValue(obj, path) {
      return path.split('.').reduce(
         (acc, key) => (acc ? acc[key] : undefined),
         obj,
      );
   }

   async fetchData(url, queryParams = {}) {
      const cacheKey = this.generateCacheKey(url, {
         ...this.defaultQueryParms,
         ...queryParams,
      });

      // Try to get from cache first
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
         return cachedData;
      }

      try {
         const response = await axios.get(
            `${this.baseUrl}${url}`,
            {
               params: { ...this.defaultQueryParms, ...queryParams },
            },
         );

         const responseData = response.data;
         // Store in cache
         this.cache.set(cacheKey, responseData);
         return responseData;
      } catch (error) {
         console.error(`Error fetching data from ${url}:`);
         console.error(`    Status: ${error.response?.status || 'N/A'}`);
         console.error(
            `    Details: ${
               error.response?.data.status_message || error.message
            }`,
         );
         throw new Error('Failed to fetch data.');
      }
   }

   clearCache() {
      this.cache.clear();
   }

   removeFromCache(url, queryParams = {}) {
      const cacheKey = this.generateCacheKey(url, queryParams);
      this.cache.delete(cacheKey);
   }
}

