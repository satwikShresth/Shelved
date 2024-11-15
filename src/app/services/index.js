import TMDBService from "services/tmdbService.js";

const services = {
  tmdb: new TMDBService(Deno.env.get("TMDB_API_KEY")),
};

export default services;
