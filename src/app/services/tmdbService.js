import axios from "axios";
import { initializeService } from "services/common.js";
import { getDbId } from "crud/db_source.js";

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

const DbSource = "tmdb";

class TMDBService {
  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.defaultLanguage = "en-US";

    getDbId(DbSource)
      .then((dbVal) => {
        this.dbId = dbVal.success ? dbVal.id : null;
      })
      .catch((error) => {
        console.error("Failed to retrieve dbId:", error);
        this.dbId = null;
      });
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
      console.error(`Error fetching data from ${url}:`);
      console.error(`    Status: ${error.response?.status || "N/A"}`);
      console.error(
        `    Details: ${error.response?.data.status_message || error.message}`,
      );

      throw new Error("Failed to fetch data.");
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

export default await initializeService(TMDBService, DbSource);
