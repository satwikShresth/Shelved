import axios from "axios";
import { validateMediaType, validateRange } from "services/tmdbValidator.js";

class TMDBService {
  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.defaultLanguage = "en-US";
  }

  async fetchData(url, queryParams = {}) {
    try {
      const response = await axios.get(url, {
        params: {
          api_key: this.apiKey,
          language: this.defaultLanguage,
          ...queryParams,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data: ${error.message}`);
      throw error;
    }
  }

  getTrending({
    range = "day",
    mediaType = "all",
    language = this.defaultLanguage,
  } = {}) {
    validateMediaType(mediaType);
    validateRange(range);

    const endpoint = `${this.baseUrl}trending/${mediaType}/${range}`;
    console.log(endpoint);
    return this.fetchData(endpoint, { language });
  }
}

export default new TMDBService(Deno.env.get("TMDB_API_KEY"));
