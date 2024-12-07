import { Service } from 'services/service.js';

export const validMediaTypes = ['all', 'movie', 'tv', 'person'];
export const validRanges = ['day', 'week'];

export function validateMediaType(media_type) {
   if (media_type !== undefined && !validMediaTypes.includes(media_type)) {
      throw new Error('Invalid media_type');
   }
}

export function validateRange(range) {
   if (range !== undefined && !validRanges.includes(range)) {
      throw new Error('Invalid range');
   }
}

export default class TMDBService extends Service {
   constructor(apiKey) {
      super(apiKey);
      this.baseUrl = 'https://api.themoviedb.org/3/';
      this.defaultLanguage = 'en-US';
      this.defaultQueryParms = {
         api_key: this.apiKey,
         language: this.defaultLanguage,
      };
   }

   async getTrending({
      range = 'week',
      media_type = 'all',
      language = this.defaultLanguage,
   } = {}) {
      validateMediaType(media_type);
      validateRange(range);

      const path = `trending/${media_type}/${range}`;

      const rawData = await this.fetchData(path, { language });
      const mapping = {
         id: 'id',
         title: 'title | original_name | name',
         release_date: 'first_air_date | release_date',
         overview: 'overview',
         vote_average: 'vote_average',
         poster_path: 'poster_path',
         media_type: 'media_type',
      };
      console.log(rawData.results);

      return this.normalizeDataList(rawData.results, mapping);
   }

   getDetailsById({ id, media_type, language = this.defaultLanguage }) {
      if (!id) throw new Error('ID is required');
      validateMediaType(media_type);

      const path = `${media_type}/${id}`;
      return this.fetchData(path, { language });
   }
}
