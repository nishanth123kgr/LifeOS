'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  currency: string;
  riskPreference: string;
  monthlyIncome: number | null;
  createdAt: string;
}

interface UpdateProfileData {
  name?: string;
  currency?: string;
  riskPreference?: string;
  monthlyIncome?: number;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/api/users/profile');
      return res.data.data;
    },
  });

  const profileForm = useForm<UpdateProfileData>({
    defaultValues: {
      name: '',
      currency: 'INR',
      riskPreference: 'MODERATE',
      monthlyIncome: 0,
    },
  });

  const passwordForm = useForm<ChangePasswordData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        currency: profile.currency,
        riskPreference: profile.riskPreference,
        monthlyIncome: profile.monthlyIncome || 0,
      });
    }
  }, [profile, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => api.patch('/api/users/profile', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (res.data.data) {
        setUser(res.data.data);
      }
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/api/users/change-password', data),
    onSuccess: () => {
      passwordForm.reset();
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const onProfileSubmit = (data: UpdateProfileData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePasswordData) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const currencies = [
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
  ];

  const riskPreferences = [
    { value: 'CONSERVATIVE', label: 'Conservative', description: 'Lower risk, stable returns' },
    { value: 'MODERATE', label: 'Moderate', description: 'Balanced risk and reward' },
    { value: 'AGGRESSIVE', label: 'Aggressive', description: 'Higher risk, potentially higher returns' },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'preferences', label: 'Preferences' },
              { id: 'password', label: 'Password' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    {...profileForm.register('name')}
                    placeholder="Enter your name"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Monthly Income"
                    type="number"
                    {...profileForm.register('monthlyIncome', { valueAsNumber: true })}
                    placeholder="Enter your monthly income"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Currency Settings</h3>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Currency
                  </label>
                  <select
                    {...profileForm.register('currency')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will be used for all financial displays and calculations
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Risk Preference</h3>
                <div className="space-y-3">
                  {riskPreferences.map((pref) => (
                    <label
                      key={pref.value}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        profileForm.watch('riskPreference') === pref.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        {...profileForm.register('riskPreference')}
                        value={pref.value}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900 dark:text-white">{pref.label}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{pref.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                <div className="max-w-md space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                    error={passwordForm.formState.errors.currentPassword?.message}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    {...passwordForm.register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                    error={passwordForm.formState.errors.newPassword?.message}
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    {...passwordForm.register('confirmPassword', { required: 'Please confirm your password' })}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Password Requirements</h4>
                <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  <li>At least 8 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>

              {changePasswordMutation.isError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                  Failed to change password. Please check your current password and try again.
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-500/30">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Irreversible and destructive actions
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Delete Account</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="ghost" className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
