"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Bell, Lock, User, Mail, Shield, Moon, Sun, Globe, BookOpen } from "lucide-react"
import { getCurrentUser } from "@/lib/data"
import { getInitials } from "@/lib/utils"
import { TimezoneSelect } from "@/components/ui/timezone-select"
import { CanvasIntegration } from "@/components/dashboard/canvas-integration"
import { toast } from "sonner"

const languages = [
  { value: "en", label: "English" },
]

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  department: string | null
  joinDate: Date
  timezone: string | null
  language: string | null
}

export default function AccountPage() {
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    updates: false,
    reports: true,
  })

  useEffect(() => {
    async function loadUser() {
      const userData = await getCurrentUser()
      setUser(userData)
    }
    loadUser()
  }, [])

  // Set initial tab based on URL parameter
  const initialTab = searchParams.get("tab") || "profile"

  // Handle form submissions
  const saveProfile = async () => {
    // Placeholder for profile save functionality
    toast.success("Profile settings saved")
  }

  if (!user) {
    return null // or loading state
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={user.department || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" value={user.role} disabled />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={saveProfile}>Save Profile</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Select defaultValue={user.language || 'en'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <TimezoneSelect 
                    value={user.timezone || undefined}
                    onValueChange={(value) => console.log(value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <div className="font-medium">Dark Mode</div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on your desktop
                    </p>
                  </div>
                  <Switch
                    checked={notifications.desktop}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, desktop: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features
                    </p>
                  </div>
                  <Switch
                    checked={notifications.updates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, updates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance reports
                    </p>
                  </div>
                  <Switch
                    checked={notifications.reports}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, reports: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security by enabling 2FA
                  </p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <CanvasIntegration />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
} 