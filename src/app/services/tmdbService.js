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
   media_box_mapping = {
      id: 'id',
      title: 'title | original_name | name',
      release_date: 'first_air_date | release_date',
      overview: 'overview',
      vote_average: 'vote_average',
      poster_path: 'poster_path',
      media_type: 'media_type',
      tagline: 'tagline',
      staus: 'staus',
      genres: 'genres',
      created_by: 'created_by',
      networks: 'networks',
      production_companies: 'production_companies',
   };

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
      console.log(rawData);

      return this.normalizeDataList(rawData.results, this.media_box_mapping);
   }

   async search(name, media_type, language = this.defaultLanguage) {
      if (!name) throw new Error('Name is required');

      const path = `search/${media_type}`;
      const rawData = await this.fetchData(path, { query: name, language });

      // Add media_type to all results since it doesn't show up for this endpoint
      rawData.results = rawData.results.map((result) => ({
         ...result,
         media_type: media_type,
      }));

      return this.normalizeDataList(rawData.results, this.media_box_mapping);
   }

   async getGenre(genre = 'Action', language = this.defaultLanguage) {
      if (!genre) throw new Error('Name is required');

      const genresData = await this.fetchData(`genre/movie/list`);

      const genreMatch = genresData.genres.find(
         (g) => g.name.toLowerCase() === genre.toLowerCase(),
      );

      if (!genreMatch) {
         throw new Error(`Genre "${genre}" not found`);
      }

      const path = `discover/movie/${genre}`;
      const rawData = await this.fetchData(path, { query: genre, language });
      return this.normalizeDataList(rawData.results, this.media_box_mapping);
   }

   async getDetailsById({ id, media_type, language = this.defaultLanguage }) {
      if (!id) throw new Error('ID is required');
      validateMediaType(media_type);

      const path = `${media_type}/${id}`;
      const rawData = await this.fetchData(path, { language });
      const returnVal = this.normalizeData(
         rawData,
         this.media_box_mapping,
      );
      returnVal.media_type = media_type;
      return returnVal;
   }
}
