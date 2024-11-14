import { getApiKey } from "crud/db_source.js";
import TMDBService from "services/tmdbService.js";

const serviceMap = {
  tmdb: TMDBService,
};

export const getService = async (serviceName) => {
  const ServiceClass = serviceMap[serviceName.toLowerCase()];

  if (!ServiceClass) {
    console.error(`Service "${serviceName}" not found`);
    return null;
  }

  try {
    const { success, api_key, error } = await getApiKey(serviceName);
    if (!success) {
      throw new Error(error || `Failed to fetch API key for ${serviceName}`);
    }

    console.log(`${serviceName} service initialized successfully`);
    const serviceInstance = await new ServiceClass(api_key);
    return serviceInstance;
  } catch (error) {
    console.error(`Error initializing ${serviceName} service:`, error.message);
    return null;
  }
};
