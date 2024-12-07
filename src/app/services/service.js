import axios from 'axios';

export class Service {
   constructor(apiKey) {
      if (new.target === Service) {
         throw new Error('Cannot instantiate abstract class Service directly');
      }
      if (!apiKey) throw new Error('API key is required');
      this.apiKey = apiKey;
      this.defaultQueryParms = {};
      this.mapped = {};
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
      try {
         const response = await axios
            .get(
               `${this.baseUrl}${url}`,
               {
                  params: { ...this.defaultQueryParms, ...queryParams },
               },
            );

         return response.data;
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
}
