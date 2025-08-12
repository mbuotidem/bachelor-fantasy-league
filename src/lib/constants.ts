// Storage and file upload constants
export const PHOTO_URL_EXPIRATION_SECONDS = 3600 * 24 * 365; // 1 year
export const DEFAULT_FILE_URL_EXPIRATION_SECONDS = 3600; // 1 hour

// Episode and elimination constants
export const DEFAULT_EPISODE_NUMBER = 1; // Fallback when current episode is not available

// File upload limits
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// UI constants
export const CONTESTANT_CARD_FLIP_DURATION = 700; // milliseconds
export const SEARCH_DEBOUNCE_MS = 300;