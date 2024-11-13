import { getApiKey } from "crud/db_source.js";

export const initializeService = async (ServiceClass, dbKeyName) => {
  try {
    const response = await getApiKey(dbKeyName);
    if (response.success) {
      const serviceInstance = new ServiceClass(response.api_key);
      console.log(`${dbKeyName} service initialized successfully`);
      return serviceInstance;
    } else {
      throw new Error(
        response.error || `Failed to fetch API key for ${dbKeyName}`,
      );
    }
  } catch (error) {
    console.error(`Error initializing ${dbKeyName} service:`, error);
    return null;
  }
};
