import axios from "axios";

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

export default class TMDBService {
  static source = "tmdb";
  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.defaultLanguage = "en-US";
  }

  async fetchData(url, queryParams = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}${url}`, {
        params: {
          api_key: this.apiKey,
          language: this.defaultLanguage,
          ...queryParams,
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

  async getTrending({
    range = "day",
    mediaType = "all",
    language = this.defaultLanguage,
  } = {}) {
    validateMediaType(mediaType);
    validateRange(range);

    const path = `trending/${mediaType}/${range}`;
    return await this.fetchData(path, { language });
  }

  getDetailsById(id, mediaType = "movie", language = this.defaultLanguage) {
    if (!id) throw new Error("ID is required");
    validateMediaType(mediaType);

    const path = `${mediaType}/${id}`;
    return this.fetchData(path, { language });
  }
}
