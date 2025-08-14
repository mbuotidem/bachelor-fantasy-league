import { ContestantService } from '../services/contestant-service';

/**
 * Utility to help migrate contestants with expired pre-signed URLs
 * This extracts the S3 key from expired URLs and updates the database
 */
export async function migrateContestantImageUrls(leagueId: string): Promise<void> {
    const contestantService = new ContestantService();

    try {
        const contestants = await contestantService.getContestantsByLeague(leagueId);

        for (const contestant of contestants) {
            if (contestant.profileImageUrl && contestant.profileImageUrl.startsWith('http')) {
                // Extract the S3 key from the expired URL
                const s3Key = extractS3KeyFromUrl(contestant.profileImageUrl);

                if (s3Key) {
                    console.log(`Migrating ${contestant.name}: ${contestant.profileImageUrl} -> ${s3Key}`);

                    try {
                        await contestantService.updateContestant({
                            contestantId: contestant.id,
                            profileImageUrl: s3Key
                        });
                        console.log(`✅ Successfully migrated ${contestant.name}`);
                    } catch (error) {
                        console.error(`❌ Failed to migrate ${contestant.name}:`, error);
                    }
                } else {
                    console.warn(`⚠️ Could not extract S3 key from URL for ${contestant.name}`);
                }
            }
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

function extractS3KeyFromUrl(url: string): string | null {
    try {
        // Parse the URL to extract the S3 key
        const urlObj = new URL(url);

        // For AWS S3 URLs, the key is typically in the pathname
        // Remove leading slash and decode URI components
        let key = urlObj.pathname.substring(1);
        key = decodeURIComponent(key);

        // Validate that it looks like a contestant photo key
        if (key.includes('contestant-photos/') || key.includes('public/contestant-photos/')) {
            return key;
        }

        return null;
    } catch (error) {
        console.error('Failed to parse URL:', url, error);
        return null;
    }
}

// Helper function to run migration from browser console
declare global {
  interface Window {
    migrateContestantImages: typeof migrateContestantImageUrls;
  }
}

if (typeof window !== 'undefined') {
  window.migrateContestantImages = migrateContestantImageUrls;
}