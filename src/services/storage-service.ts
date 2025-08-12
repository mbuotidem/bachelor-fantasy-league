import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { PHOTO_URL_EXPIRATION_SECONDS, DEFAULT_FILE_URL_EXPIRATION_SECONDS, MAX_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES } from '../lib/constants';

export interface UploadResult {
  key: string;
  url: string;
}

export class StorageService {
  
  /**
   * Upload a contestant photo to S3
   */
  async uploadContestantPhoto(file: File, contestantId: string): Promise<UploadResult> {
    try {
      // Generate a unique filename using UUID to avoid collisions
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const uniqueId = crypto.randomUUID();
      const key = `contestant-photos/${contestantId}-${uniqueId}.${fileExtension}`;

      // Upload the file
      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            contestantId,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          }
        }
      }).result;

      // Get the public URL
      const urlResult = await getUrl({
        key: result.key,
        options: {
          expiresIn: PHOTO_URL_EXPIRATION_SECONDS
        }
      });

      return {
        key: result.key,
        url: urlResult.url.toString()
      };
    } catch (error) {
      console.error('Failed to upload contestant photo:', error);
      throw new Error('Failed to upload photo. Please try again.');
    }
  }

  /**
   * Get a public URL for a stored file
   */
  async getFileUrl(key: string, expiresIn: number = DEFAULT_FILE_URL_EXPIRATION_SECONDS): Promise<string> {
    try {
      const result = await getUrl({
        key,
        options: { expiresIn }
      });
      return result.url.toString();
    } catch (error) {
      console.error('Failed to get file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await remove({ key });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Upload a league asset (logos, banners, etc.)
   */
  async uploadLeagueAsset(file: File, leagueId: string, assetType: string): Promise<UploadResult> {
    try {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const uniqueId = crypto.randomUUID();
      const key = `league-assets/${leagueId}/${assetType}-${uniqueId}.${fileExtension}`;

      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            leagueId,
            assetType,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          }
        }
      }).result;

      const urlResult = await getUrl({
        key: result.key,
        options: {
          expiresIn: PHOTO_URL_EXPIRATION_SECONDS
        }
      });

      return {
        key: result.key,
        url: urlResult.url.toString()
      };
    } catch (error) {
      console.error('Failed to upload league asset:', error);
      throw new Error('Failed to upload asset. Please try again.');
    }
  }

  /**
   * Validate file before upload
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select an image file' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { isValid: false, error: 'Image must be less than 5MB' };
    }

    // Check supported formats
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Supported formats: JPEG, PNG, WebP' };
    }

    return { isValid: true };
  }

  /**
   * Generate a preview URL for a file (for immediate display before upload)
   */
  generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Clean up preview URLs to prevent memory leaks
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}