'use client';

import React, { useState, useRef } from 'react';
import { StorageService } from '../services/storage-service';
import type { Contestant, CreateContestantInput, ValidationError } from '../types';

interface ContestantFormProps {
  leagueId: string;
  contestant?: Contestant | null;
  onSubmit: (data: CreateContestantInput | Contestant) => Promise<void>;
  onCancel: () => void;
}

export default function ContestantForm({ leagueId, contestant, onSubmit, onCancel }: ContestantFormProps) {
  const [formData, setFormData] = useState({
    name: contestant?.name || '',
    age: contestant?.age?.toString() || '',
    hometown: contestant?.hometown || '',
    occupation: contestant?.occupation || '',
    bio: contestant?.bio || '',
    profileImageUrl: contestant?.profileImageUrl || '',
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(contestant?.profileImageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageService = new StorageService();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    const validation = storageService.validateImageFile(file);
    if (!validation.isValid) {
      setErrors(prev => [...prev, { field: 'profileImage', message: validation.error!, code: 'invalid_file' }]);
      return;
    }

    setUploadingImage(true);
    setErrors(prev => prev.filter(error => error.field !== 'profileImage'));

    try {
      // Create preview URL for immediate display
      const previewUrl = storageService.generatePreviewUrl(file);
      setImagePreview(previewUrl);

      // Try to upload to S3, but fall back to preview URL if it fails
      try {
        if (contestant?.id) {
          const uploadResult = await storageService.uploadContestantPhoto(file, contestant.id);
          setFormData(prev => ({
            ...prev,
            profileImageUrl: uploadResult.url,
          }));
          
          // Clean up the preview URL since we have the real URL now
          storageService.revokePreviewUrl(previewUrl);
          setImagePreview(uploadResult.url);
        } else {
          // For new contestants, try to upload but fall back to preview
          try {
            const tempId = `temp-${Date.now()}`;
            const uploadResult = await storageService.uploadContestantPhoto(file, tempId);
            setFormData(prev => ({
              ...prev,
              profileImageUrl: uploadResult.url,
            }));
            storageService.revokePreviewUrl(previewUrl);
            setImagePreview(uploadResult.url);
          } catch (uploadError) {
            console.warn('S3 upload failed, using preview URL:', uploadError);
            // Fall back to preview URL for demo purposes
            setFormData(prev => ({
              ...prev,
              profileImageUrl: previewUrl,
            }));
          }
        }
      } catch (uploadError) {
        console.warn('S3 upload failed, using preview URL:', uploadError);
        // Fall back to preview URL for demo purposes
        setFormData(prev => ({
          ...prev,
          profileImageUrl: previewUrl,
        }));
      }
    } catch (error) {
      setErrors(prev => [...prev, { field: 'profileImage', message: 'Failed to upload image', code: 'upload_failed' }]);
      // Clean up preview URL on error
      if (imagePreview && imagePreview.startsWith('blob:')) {
        storageService.revokePreviewUrl(imagePreview);
      }
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required', code: 'required' });
    } else if (formData.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be less than 100 characters', code: 'too_long' });
    }

    if (formData.age && formData.age.trim() !== '') {
      const ageNum = Number(formData.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        errors.push({ field: 'age', message: 'Age must be between 18 and 100', code: 'invalid_range' });
      }
    }

    if (formData.hometown && formData.hometown.length > 100) {
      errors.push({ field: 'hometown', message: 'Hometown must be less than 100 characters', code: 'too_long' });
    }

    if (formData.occupation && formData.occupation.length > 100) {
      errors.push({ field: 'occupation', message: 'Occupation must be less than 100 characters', code: 'too_long' });
    }

    if (formData.bio && formData.bio.length > 1000) {
      errors.push({ field: 'bio', message: 'Bio must be less than 1000 characters', code: 'too_long' });
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Validate form data
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData = contestant ? {
        ...contestant,
        name: formData.name.trim(),
        age: formData.age ? Number(formData.age) : undefined,
        hometown: formData.hometown.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
      } : {
        leagueId,
        name: formData.name.trim(),
        age: formData.age ? Number(formData.age) : undefined,
        hometown: formData.hometown.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save contestant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {contestant ? 'Edit Contestant' : 'Add New Contestant'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div>
              <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Choose Photo'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
              {getFieldError('profileImage') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('profileImage')}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  getFieldError('name') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Sarah Johnson"
                maxLength={100}
              />
              {getFieldError('name') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
              )}
            </div>

            {/* Age and Hometown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                    getFieldError('age') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="25"
                  min="18"
                  max="100"
                />
                {getFieldError('age') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('age')}</p>
                )}
              </div>

              <div>
                <label htmlFor="hometown" className="block text-sm font-medium text-gray-700 mb-2">
                  Hometown
                </label>
                <input
                  type="text"
                  id="hometown"
                  value={formData.hometown}
                  onChange={(e) => handleInputChange('hometown', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                    getFieldError('hometown') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Los Angeles, CA"
                  maxLength={100}
                />
                {getFieldError('hometown') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('hometown')}</p>
                )}
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              <input
                type="text"
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  getFieldError('occupation') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Marketing Manager"
                maxLength={100}
              />
              {getFieldError('occupation') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('occupation')}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                  getFieldError('bio') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tell us about this contestant..."
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                {getFieldError('bio') ? (
                  <p className="text-sm text-red-600">{getFieldError('bio')}</p>
                ) : (
                  <div />
                )}
                <p className="text-xs text-gray-500">
                  {formData.bio.length}/1000 characters
                </p>
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : contestant ? 'Update Contestant' : 'Add Contestant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}