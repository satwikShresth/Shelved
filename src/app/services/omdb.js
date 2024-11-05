import { axios } from "axios";

class TMDBService {
  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.defaultLanguage = "en-US";
  }

  buildTrendingUrl(mediaType, range, language) {
    return `${this.baseUrl}trending/${mediaType}/${range}`;
  }

  async fetchData(url, additionalParams = {}) {
    try {
      const response = await axios.get(url, {
        params: {
          api_key: this.apiKey,
          language: this.defaultLanguage,
          ...additionalParams,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data: ${error.message}`);
      throw error;
    }
  }

  // Method to get trending data with options for range and language
  getTrending({ range = "day", language = this.defaultLanguage } = {}) {
    // Return an object with specific methods for each trending type
    return {
      all: () =>
        this.fetchData(this.buildTrendingUrl("all", range), { language }),
      movies: () =>
        this.fetchData(this.buildTrendingUrl("movie", range), { language }),
      tv: () =>
        this.fetchData(this.buildTrendingUrl("tv", range), { language }),
      people: () =>
        this.fetchData(this.buildTrendingUrl("person", range), { language }),
    };
  }
}

module.exports = TMDBService;
