import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import settingsSchema from '@/schema/settingsSchema';

function Settings() {
  // ✅ Settings Form
  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    setValue: setSettingsValue,
    watch: watchSettings,
    formState: { errors: settingsErrors },
  } = useForm({
    resolver: zodResolver(settingsSchema.settingSchema()),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: 'in',
      currency: '',
      appearance: 'light',
      language: 'en',
    },
  });

  const selectedCountry = watchSettings('country');
  const selectedAppearance = watchSettings('appearance');
  const selectedLanguage = watchSettings('language');

  const handleSaveSettings = (data) => {
    console.log('Settings Form Data:', data);
  };

  // ✅ Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(settingsSchema.passwordSchema()),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSavePassword = (data) => {
    console.log('Password Form Data:', data);
  };

  return (
    <div className="w-full">
      {/* ✅ Settings Form */}
      <div className="w-1/2 mx-auto mt-10 shadow-lg border rounded-sm p-6">
        <form
          className="w-full space-y-6"
          onSubmit={handleSettingsSubmit(handleSaveSettings)}
        >
          <h2 className="text-lg font-bold">General Settings</h2>
          <Separator />

          {/* 📌 Profile Section */}
          <h4 className="text-sm font-bold">Profile Information</h4>
          <div className="flex items-center space-x-4 mt-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <p className="text-sm">Update your profile information</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="firstName">First Name</label>
              <Input
                {...registerSettings('firstName')}
                placeholder="Enter your first name"
              />
              {settingsErrors.firstName && (
                <p className="text-sm text-red-500">
                  {settingsErrors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="lastName">Last Name</label>
              <Input
                {...registerSettings('lastName')}
                placeholder="Enter your last name"
              />
              {settingsErrors.lastName && (
                <p className="text-sm text-red-500">
                  {settingsErrors.lastName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <Input
                {...registerSettings('email')}
                placeholder="Enter your email"
                type="email"
              />
              {settingsErrors.email && (
                <p className="text-sm text-red-500">
                  {settingsErrors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="phone">Phone</label>
              <Input
                {...registerSettings('phone')}
                placeholder="Enter your phone number"
                type="tel"
              />
              {settingsErrors.phone && (
                <p className="text-sm text-red-500">
                  {settingsErrors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* 📌 Preferences Section */}
          <h4 className="text-sm font-bold mt-6">Preferences</h4>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label>Country</label>
              <Select
                onValueChange={(value) => setSettingsValue('country', value)}
                value={selectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="us">USA</SelectItem>
                  <SelectItem value="gb">UK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Currency</label>
              <Input
                {...registerSettings('currency')}
                placeholder="Enter your currency"
              />
              {settingsErrors.currency && (
                <p className="text-sm text-red-500">
                  {settingsErrors.currency.message}
                </p>
              )}
            </div>
            <div>
              <label>Appearance</label>
              <Select
                onValueChange={(value) => setSettingsValue('appearance', value)}
                value={selectedAppearance}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Language</label>
              <Select
                onValueChange={(value) => setSettingsValue('language', value)}
                value={selectedLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" variant="primary">
              Save Settings
            </Button>
          </div>
        </form>
      </div>

      <Separator className="my-6" />

      {/* ✅ Password Form */}
      <div className="w-1/2 mx-auto mt-10 shadow-lg border rounded-sm p-6">
        <form
          className="w-full space-y-6"
          onSubmit={handlePasswordSubmit(handleSavePassword)}
        >
          <h2 className="text-lg font-bold">Change Password</h2>
          <Separator />
          <p className="text-sm text-gray-500">
            Update your password for enhanced security.
          </p>

          <div className="space-y-4 mt-4">
            <div>
              <label>Current Password</label>
              <Input {...registerPassword('currentPassword')} type="password" />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-red-500">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>
            <div>
              <label>New Password</label>
              <Input {...registerPassword('newPassword')} type="password" />
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label>Confirm Password</label>
              <Input {...registerPassword('confirmPassword')} type="password" />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" variant="primary">
              Save Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
