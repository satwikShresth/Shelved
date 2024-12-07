import TMDBService from 'services/tmdbService.js';
import OLService from 'services/olService.js';

const services = {
   tmdb: new TMDBService(Deno.env.get('TMDB_API_KEY')),
   openlibrary: new OLService(),
};

export default services;
