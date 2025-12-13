import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  User,
  Bell,
  Shield,
  CreditCard,
  Link,
  Save,
  Globe,
} from "lucide-react";
import { useTimeZoneSettings } from "@/hooks/useTimeZoneSettings";
import { useBusinessHours } from "@/hooks/useBusinessHours";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

// Common timezones list
const COMMON_TIMEZONES = [
  { value: "America/Toronto", label: "America/Toronto (EST/EDT)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (AEST/AEDT)" },
  { value: "UTC", label: "UTC" },
];

export default function Settings() {
  const {
    settings,
    detectedTimeZone,
    effectiveTimeZone,
    setTimeZoneMode,
    setManualTimeZone,
  } = useTimeZoneSettings();
  
  const { businessHours, updateDay } = useBusinessHours();
  
  // Local state for business hours inputs
  const [localBusinessHours, setLocalBusinessHours] = useState(businessHours);
  
  // Update local state when business hours change externally
  useEffect(() => {
    setLocalBusinessHours(businessHours);
  }, [businessHours]);
  
  const handleBusinessHoursChange = (day: keyof typeof businessHours, field: "enabled" | "startTime" | "endTime", value: boolean | string) => {
    const updated = {
      ...localBusinessHours[day],
      [field]: value,
    };
    const newHours = { ...localBusinessHours, [day]: updated };
    setLocalBusinessHours(newHours);
    updateDay(day, updated);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Settings"
        description="Manage your clinic and account preferences."
      />

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Clinic</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Integrate</span>
          </TabsTrigger>
        </TabsList>

        {/* Clinic Settings */}
        <TabsContent value="clinic" className="space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>
                Basic information about your physiotherapy clinic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <Input id="clinicName" defaultValue="PhysioClinic Toronto" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="416-555-0123" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  defaultValue="123 Healthcare Blvd, Toronto, ON M5V 1A1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input id="email" defaultValue="info@physioclinic.ca" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="www.physioclinic.ca" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your clinic's operating hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "monday", label: "Monday" },
                { key: "tuesday", label: "Tuesday" },
                { key: "wednesday", label: "Wednesday" },
                { key: "thursday", label: "Thursday" },
                { key: "friday", label: "Friday" },
              ] as const).map(({ key, label }) => {
                const dayHours = localBusinessHours[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="w-24 font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayHours.startTime}
                        onChange={(e) => handleBusinessHoursChange(key, "startTime", e.target.value)}
                        className="w-28"
                        disabled={!dayHours.enabled}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={dayHours.endTime}
                        onChange={(e) => handleBusinessHoursChange(key, "endTime", e.target.value)}
                        className="w-28"
                        disabled={!dayHours.enabled}
                      />
                    </div>
                    <Switch 
                      checked={dayHours.enabled}
                      onCheckedChange={(checked) => handleBusinessHoursChange(key, "enabled", checked)}
                    />
                  </div>
                );
              })}
              {([
                { key: "saturday", label: "Saturday" },
                { key: "sunday", label: "Sunday" },
              ] as const).map(({ key, label }) => {
                const dayHours = localBusinessHours[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="w-24 font-medium text-muted-foreground">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayHours.startTime}
                        onChange={(e) => handleBusinessHoursChange(key, "startTime", e.target.value)}
                        className="w-28"
                        disabled={!dayHours.enabled}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={dayHours.endTime}
                        onChange={(e) => handleBusinessHoursChange(key, "endTime", e.target.value)}
                        className="w-28"
                        disabled={!dayHours.enabled}
                      />
                    </div>
                    <Switch 
                      checked={dayHours.enabled}
                      onCheckedChange={(checked) => handleBusinessHoursChange(key, "enabled", checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal account information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
                  DS
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Dr. Sarah" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Smith" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input id="userEmail" defaultValue="dr.smith@physioclinic.ca" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Lead Physiotherapist" disabled />
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Timezone
              </CardTitle>
              <CardDescription>
                Configure timezone settings for calendar and time displays.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="timezone-mode">Timezone Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose between automatic (device) or manual timezone selection
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={settings.timeZoneMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeZoneMode("auto")}
                    >
                      Auto
                    </Button>
                    <Button
                      variant={settings.timeZoneMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeZoneMode("manual")}
                    >
                      Manual
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm font-medium mb-1">Detected Timezone</p>
                  <p className="text-sm text-muted-foreground">{detectedTimeZone}</p>
                </div>

                {settings.timeZoneMode === "manual" && (
                  <div className="space-y-2">
                    <Label htmlFor="manual-timezone">Select Timezone</Label>
                    <Select
                      value={settings.manualTimeZone || detectedTimeZone}
                      onValueChange={setManualTimeZone}
                    >
                      <SelectTrigger id="manual-timezone">
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current effective timezone: <span className="font-medium">{effectiveTimeZone}</span>
                    </p>
                  </div>
                )}

                {settings.timeZoneMode === "auto" && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium mb-1">Using Device Timezone</p>
                    <p className="text-sm text-muted-foreground">
                      The calendar will use your device's detected timezone: <span className="font-medium">{effectiveTimeZone}</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Change Password</Button>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Appointments</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">New Bookings</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a patient books an appointment
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Cancellations</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when appointments are cancelled
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Daily summary of upcoming appointments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Forms</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Form Completed</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a patient completes a form
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Overdue Forms</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about overdue patient forms
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Billing</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Payment Received</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when insurance claims are paid
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Claim Denied</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when claims are denied
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>
                Manage your external service integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CreditCard className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">EDT Insurance Portal</p>
                    <p className="text-sm text-muted-foreground">
                      Connected • Synced 5 min ago
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">hep2go Exercise Library</p>
                    <p className="text-sm text-muted-foreground">
                      Connected • 30,000+ exercises available
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Email Service (SendGrid)</p>
                    <p className="text-sm text-muted-foreground">
                      Not connected
                    </p>
                  </div>
                </div>
                <Button size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Shield className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">AI Transcription (Whisper)</p>
                    <p className="text-sm text-muted-foreground">
                      Not connected
                    </p>
                  </div>
                </div>
                <Button size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
