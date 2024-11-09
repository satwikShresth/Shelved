import axios from "axios";
import { validateMediaType, validateRange } from "services/tmdbValidator.js";

class TMDBService {
  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.defaultLanguage = "en-US";
  }

  async fetchData(url) {
    try {
      const response = await axios.get(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`);
      console.error(`    Status: ${error.response?.status || "N/A"}`);
      console.error(
        `    Details: ${error.response?.data.status_message || error.message}`,
      );

      throw new Error("Failed to fetch data.");
    }
  }

  getTrending({
    range = "week",
    mediaType = "all",
    language = this.defaultLanguage,
  } = {}) {
    validateMediaType(mediaType);
    validateRange(range);

    const endpoint = `${this.baseUrl}trending/${mediaType}/${range}?language=${language}`;
    console.log(endpoint);
    return this.fetchData(endpoint);
  }
}

export default new TMDBService(Deno.env.get("TMDB_API_KEY"));
