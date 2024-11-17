import axios from "axios";
export class Service {
  constructor(apiKey) {
    if (new.target === Service) {
      throw new Error("Cannot instantiate abstract class Service directly");
    }
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
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
}
