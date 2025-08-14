'use client';

import React, { useState } from 'react';
import { StorageService } from '../services/storage-service';
import { useImageUrl } from '../hooks/useImageUrl';

export default function StorageTest() {
  const [uploadedPath, setUploadedPath] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const imageUrl = useImageUrl(uploadedPath);
  const storageService = new StorageService();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      console.log('Starting upload test...');
      const result = await storageService.uploadContestantPhoto(file, 'test-contestant');
      console.log('Upload successful:', result);
      setUploadedPath(result.key);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
      <h3 className="text-lg font-semibold mb-4">Storage Test</h3>
      
      <div className="space-y-4">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
        </div>

        {uploadedPath && (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Uploaded Path:</strong> {uploadedPath}
            </div>
            <div className="text-sm">
              <strong>Generated URL:</strong> {imageUrl ? 'Success' : 'Failed'}
            </div>
            {imageUrl && (
              <div className="space-y-2">
                <div className="text-xs break-all">URL: {imageUrl}</div>
                <img 
                  src={imageUrl} 
                  alt="Test upload"
                  className="w-32 h-32 object-cover rounded border"
                  onLoad={() => console.log('Test image loaded successfully')}
                  onError={(e) => console.error('Test image failed to load:', e)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}