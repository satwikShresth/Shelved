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
      console.log(rawData.docs);
      const mapping = {
         id: 'key',
         title: 'title',
         release_date: 'first_publish_year',
         overview: 'author_name',
         vote_average: 'ratings_average',
         poster_path: 'cover_i',
      };

      return this.normalizeDataList(rawData.docs, mapping).map((item) => {
         item.release_date = item.release_date.toString();
         item.overview = item.overview[0];
         item.media_type = 'book';
         return item;
      });
   }

   async getDetailsById({ id }) {
      if (!id) throw new Error('ID is required');
      const path = `${id}.json`;
      const ret = await this.fetchData(path);
      console.log(ret);
      return ret;
   }
}
