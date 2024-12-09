import { Service } from 'services/service.js';

export const validMediaTypes = ['all', 'movie', 'tv', 'person'];
export const validRanges = ['day', 'week'];

export function validateMediaType(mediaType) {
   if (mediaType !== undefined && !validMediaTypes.includes(mediaType)) {
      throw new Error('Invalid mediaType');
   }
}

export function validateRange(range) {
   if (range !== undefined && !validRanges.includes(range)) {
      throw new Error('Invalid range');
   }
}

export default class OLService extends Service {
   media_box_mapping = {
      id: 'key',
      release_date: 'first_publish_year',
      vote_average: 'ratings_average',
      poster_path: 'cover_i',
   };

   async media_box_mapping_func(item) {
      item.release_date = item.release_date.toString();
      item.media_type = 'book';

      const rawData = await this.fetchData(`${item.id}.json`);

      item.title = rawData.title || 'unavailable';

      item.overview = (typeof rawData.description === 'string')
         ? rawData.description
         : (rawData.description && rawData.description.value) || 'unavailable';

      return item;
   }

   constructor(apiKey = 'not-required') {
      super(apiKey);
      this.baseUrl = 'https://openlibrary.org/';
      this.defaultLanguage = 'en';
   }

   async getTrending({
      query = 'fiction',
      language = this.defaultLanguage,
      limit = 5,
   } = {}) {
      const path = 'search.json';
      const queryParams = {
         q: `subject:${query}`,
         limit,
      };

      const rawData = await this.fetchData(path, queryParams);

      // Validate that rawData.docs is present and is an array
      if (!rawData.docs || !Array.isArray(rawData.docs)) {
         throw new Error(
            'Invalid response format: expected rawData.docs to be an array',
         );
      }

      const normalizedData = await this.normalizeDataList(
         rawData.docs,
         this.media_box_mapping,
      );

      return await Promise.all(
         normalizedData.map((item) => this.media_box_mapping_func(item)),
      );
   }

   async search(
      name,
      _language = this.defaultLanguage,
      limit = 5,
   ) {
      const path = 'search.json';
      const queryParams = {
         q: `title:${name}`,
         limit,
      };

      const rawData = await this.fetchData(path, queryParams);

      // Validate that rawData.docs is present and is an array
      if (!rawData.docs || !Array.isArray(rawData.docs)) {
         throw new Error(
            'Invalid response format: expected rawData.docs to be an array',
         );
      }

      const normalizedData = await this.normalizeDataList(
         rawData.docs,
         this.media_box_mapping,
      );

      return await Promise.all(
         normalizedData.map((item) => this.media_box_mapping_func(item)),
      );
   }

   async getDetailsById({ id }) {
      if (!id) throw new Error('ID is required');

      const rawData = await this.fetchData('search.json', {
         q: `key:${id}`,
         limit: 10,
      });

      // Validate that rawData.docs is present and is an array
      if (!rawData.docs || !Array.isArray(rawData.docs)) {
         throw new Error(
            'Invalid response format: expected rawData.docs to be an array',
         );
      }

      // Find the object with the matching key (ID)
      const item = rawData.docs.find((doc) => doc.key === id);

      if (!item) {
         throw new Error(`No item found with key: ${id}`);
      }
      const normalizedItem = await this.normalizeData(
         item,
         this.media_box_mapping,
      );
      return this.media_box_mapping_func(normalizedItem);
   }
}
