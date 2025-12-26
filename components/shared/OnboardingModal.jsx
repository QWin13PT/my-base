/**
 * OnboardingModal Component
 * First-time user onboarding - username and avatar setup
 */

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export function OnboardingModal({ user, onComplete }) {
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Avatar must be an image');
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload avatar to Supabase Storage or convert to base64
  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;

    try {
      // Check if Supabase storage is available
      if (!supabase) {
        console.warn('Supabase not available, using base64 encoding');
        return convertToBase64(avatarFile);
      }

      // Try to upload to Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Store directly in bucket root

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Fallback to base64 if storage fails
        if (uploadError.message?.includes('not found') || 
            uploadError.message?.includes('does not exist') ||
            uploadError.statusCode === '404') {
          console.warn('Storage bucket not found, using base64 encoding');
          return convertToBase64(avatarFile);
        }
        
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      
      // Fallback to base64 as last resort
      try {
        console.warn('Falling back to base64 encoding');
        return await convertToBase64(avatarFile);
      } catch (base64Err) {
        throw new Error('Failed to process avatar image');
      }
    }
  };

  // Convert file to base64 data URL
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);

    try {
      let avatarUrl = null;

      // Upload avatar if provided
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update user profile
      if (!supabase) {
        throw new Error('Database not available');
      }

      const updates = {};
      if (username.trim()) updates.username = username.trim();
      if (avatarUrl) updates.avatar_url = avatarUrl;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      // Complete onboarding
      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsUploading(false);
    }
  };

  // Skip onboarding
  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal
      showModal={true}
      closeModal={handleSkip}
      title="Welcome! 👋"
      description="Set up your profile to get started"
      className="max-w-md"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Avatar (optional)
          </label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-gray-600">📷</span>
              )}
            </div>

            {/* File input */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <span className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors inline-block text-sm">
                Choose Image
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max 2MB • JPG, PNG, GIF
          </p>
        </div>

        {/* Username Input */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username (optional)
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            maxLength={30}
            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

