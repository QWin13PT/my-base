'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import { useWallet } from '@/lib/hooks/useWallet';
import { supabase } from '@/lib/supabase';
import Header from '@/components/shared/Header';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, refreshUser, isLoading: userLoading } = useUser();
  const { address, isConnected, formatAddress } = useWallet();
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected && !userLoading) {
      router.push('/');
    }
  }, [isConnected, userLoading, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  // File input ref
  const fileInputRef = useRef(null);

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

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;

    try {
      // Delete old avatar if exists
      if (user.avatar_url) {
        const oldPath = user.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([`avatars/${oldPath}`]);
      }

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      throw new Error('Failed to upload avatar');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {};

      // Add text fields if changed
      if (username.trim() !== user.username) {
        updates.username = username.trim();
      }
      if (bio.trim() !== (user.bio || '')) {
        updates.bio = bio.trim();
      }
      if (email.trim() !== (user.email || '')) {
        updates.email = email.trim();
      }

      // Upload new avatar if selected
      if (avatarFile) {
        setIsUploading(true);
        const avatarUrl = await uploadAvatar();
        if (avatarUrl) {
          updates.avatar_url = avatarUrl;
        }
        setIsUploading(false);
      }

      // Save updates if any
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        setSuccess('Profile updated successfully!');
        
        // Clear avatar file selection
        setAvatarFile(null);
        
        // Refresh user data
        setTimeout(() => {
          refreshUser();
        }, 500);
      } else {
        setError('No changes to save');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isConnected || userLoading) {
    return (
      <div className="min-h-screen bg-dark">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-white/50">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-white/60">Manage your account information and preferences</p>
        </div>

        {/* Profile Form Card */}
        <div className="bg-gray-900 border border-white/10 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="pb-6 border-b border-white/10">
              <label className="block text-sm font-semibold text-white mb-4">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                {/* Avatar Preview */}
                <div className="relative">
                  <Avatar
                    avatarUrl={avatarPreview}
                    size={100}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  
                  {/* Upload button */}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    {avatarFile ? 'Change Image' : 'Upload Image'}
                  </Button>
                  
                  <p className="text-xs text-white/50 mt-2">
                    Max 2MB • JPG, PNG, GIF
                  </p>
                  {avatarFile && (
                    <p className="text-xs text-primary mt-1">
                      ✓ New image selected: {avatarFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-white mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={30}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-white/10 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <p className="text-xs text-white/50 mt-1">
                {username.length}/30 characters
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-white mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={160}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-white/10 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
              <p className="text-xs text-white/50 mt-1">
                {bio.length}/160 characters
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-800 text-white border border-white/10 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <p className="text-xs text-white/50 mt-1">
                We'll never share your email with anyone else
              </p>
            </div>

            {/* Wallet Address (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Wallet Address
              </label>
              <div className="w-full px-4 py-3 bg-gray-800/50 text-white/70 border border-white/10 rounded-lg font-mono text-sm">
                {formatAddress(address)}
              </div>
              <p className="text-xs text-white/50 mt-1">
                Connected wallet address (read-only)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">❌ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                <p className="text-green-400 text-sm">✓ {success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="mt-6 bg-gray-900/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Member Since</span>
              <span className="text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">User ID</span>
              <span className="text-white/70 font-mono text-xs">
                {user?.id?.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

