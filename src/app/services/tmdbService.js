import { Service } from "services/service.js";

export const validMediaTypes = ["all", "movie", "tv", "person"];
export const validRanges = ["day", "week"];

export function validateMediaType(mediaType) {
  if (mediaType !== undefined && !validMediaTypes.includes(mediaType)) {
    throw new Error("Invalid mediaType");
  }
}

export function validateRange(range) {
  if (range !== undefined && !validRanges.includes(range)) {
    throw new Error("Invalid range");
  }
}

class TMDBService extends Service {
  constructor(apiKey) {
    super(apiKey);
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.defaultLanguage = "en-US";
  }

  async getTrending({
    range = "week",
    mediaType = "all",
    language = this.defaultLanguage,
  } = {}) {
    validateMediaType(mediaType);
    validateRange(range);

    const path = `trending/${mediaType}/${range}`;
    return await this.fetchData(path, { language });
  }
}

export default new TMDBService(Deno.env.get("TMDB_API_KEY"));
