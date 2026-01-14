'use client';

import React from 'react';
import { ThemeSelector } from '../theme/ThemeProvider';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

interface SettingsFormProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReport: boolean;
    showStreakReminders: boolean;
    currency: string;
    language: string;
    timezone: string;
    dataExportFormat: 'json' | 'csv';
  };
  onSettingsChange: (settings: any) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function SettingsForm({ settings, onSettingsChange, onSave, isSaving }: SettingsFormProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <SettingsSection title="Appearance" description="Customize how LifeOS looks">
        <SettingsRow label="Theme" description="Choose your preferred color scheme">
          <ThemeSelector />
        </SettingsRow>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications" description="Manage how you receive updates">
        <SettingsRow label="Email Notifications" description="Receive updates via email">
          <Toggle
            enabled={settings.emailNotifications}
            onChange={(v) => updateSetting('emailNotifications', v)}
          />
        </SettingsRow>
        <SettingsRow label="Push Notifications" description="Receive browser notifications">
          <Toggle
            enabled={settings.pushNotifications}
            onChange={(v) => updateSetting('pushNotifications', v)}
          />
        </SettingsRow>
        <SettingsRow label="Weekly Report" description="Get a weekly summary of your progress">
          <Toggle
            enabled={settings.weeklyReport}
            onChange={(v) => updateSetting('weeklyReport', v)}
          />
        </SettingsRow>
        <SettingsRow label="Streak Reminders" description="Get reminded about your habit streaks">
          <Toggle
            enabled={settings.showStreakReminders}
            onChange={(v) => updateSetting('showStreakReminders', v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection title="Preferences" description="Set your preferences">
        <SettingsRow label="Currency">
          <select
            value={settings.currency}
            onChange={(e) => updateSetting('currency', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Language">
          <select
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Timezone">
          <select
            value={settings.timezone}
            onChange={(e) => updateSetting('timezone', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      {/* Data & Privacy */}
      <SettingsSection title="Data & Privacy" description="Manage your data">
        <SettingsRow label="Export Format" description="Choose your preferred export format">
          <select
            value={settings.dataExportFormat}
            onChange={(e) => updateSetting('dataExportFormat', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Export Data" description="Download all your data">
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Export
          </button>
        </SettingsRow>
        <SettingsRow label="Delete Account" description="Permanently delete your account and data">
          <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
            Delete
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// Connected account component
export function ConnectedAccounts() {
  return (
    <SettingsSection title="Connected Accounts" description="Manage your linked accounts">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C6.996 2 2.5 6.496 2.5 12.045s4.496 10.045 10.045 10.045c8.452 0 10.545-7.893 9.682-11.851h-9.682z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Google</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Not connected</div>
            </div>
          </div>
          <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
            Connect
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">GitHub</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Not connected</div>
            </div>
          </div>
          <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
            Connect
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}
