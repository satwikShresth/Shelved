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
