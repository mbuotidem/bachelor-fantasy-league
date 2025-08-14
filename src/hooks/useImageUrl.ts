import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

export function useImageUrl(imagePath: string | undefined): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      return;
    }

    // If it's already a full URL (legacy data), use it as-is
    if (imagePath.startsWith('http')) {
      setImageUrl(imagePath);
      return;
    }

    // Generate a fresh pre-signed URL for the S3 object
    const generateUrl = async () => {
      setLoading(true);
      try {
        console.log('Generating URL for path:', imagePath);
        const result = await getUrl({
          path: imagePath,
          options: {
            expiresIn: 3600 // 1 hour
          }
        });
        console.log('Generated URL:', result.url.toString());
        setImageUrl(result.url.toString());
      } catch (error) {
        console.error('Failed to generate image URL for path:', imagePath, error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateUrl();
  }, [imagePath]);

  return loading ? null : imageUrl;
}