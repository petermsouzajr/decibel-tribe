import { getAdminUser } from "@/lib/admin";
import { Settings, Shield, Bell, Globe } from "lucide-react";

async function getSettings() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/settings`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return default settings if fetch fails
    return {
      contentModeration: {
        autoFlagSuspicious: true,
        requireAdminApproval: false,
        maxReportsBeforeSuspension: 5
      },
      notifications: {
        emailNotifications: true,
        dailySummary: false,
        reportThreshold: 10
      },
      platform: {
        maintenanceMode: false,
        allowRegistrations: true,
        defaultUserRole: "USER"
      },
      security: {
        twoFactorForAdmins: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5
      }
    };
  }
}

export default async function AdminSettings() {
  const admin = await getAdminUser();
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage platform configuration and preferences</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Moderation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Content Moderation</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-flag suspicious content
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.contentModeration.autoFlagSuspicious}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.contentModeration.autoFlagSuspicious ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Require admin approval for new users
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.contentModeration.requireAdminApproval}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.contentModeration.requireAdminApproval ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum reports before auto-suspension
              </label>
              <input
                type="number"
                defaultValue={settings.contentModeration.maxReportsBeforeSuspension}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email notifications for new reports
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.notifications.emailNotifications}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.notifications.emailNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily summary emails
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.notifications.dailySummary}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.notifications.dailySummary ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report threshold for alerts
              </label>
              <input
                type="number"
                defaultValue={settings.notifications.reportThreshold}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site maintenance mode
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.platform.maintenanceMode}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.platform.maintenanceMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow new user registrations
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.platform.allowRegistrations}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.platform.allowRegistrations ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default user role
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" defaultValue={settings.platform.defaultUserRole}>
                <option value="USER">User</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Two-factor authentication for admins
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  defaultChecked={settings.security.twoFactorForAdmins}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {settings.security.twoFactorForAdmins ? 'Required' : 'Optional'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session timeout (minutes)
              </label>
              <input
                type="number"
                defaultValue={settings.security.sessionTimeout}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Failed login attempts before lockout
              </label>
              <input
                type="number"
                defaultValue={settings.security.maxLoginAttempts}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
