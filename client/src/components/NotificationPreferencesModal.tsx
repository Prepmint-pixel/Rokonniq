import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Volume2, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  getMilestoneDescription,
  requestDesktopNotificationPermission,
  type NotificationPreferences,
} from "@/lib/notificationPreferences";

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPreferencesModal({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    loadNotificationPreferences()
  );
  const [desktopPermission, setDesktopPermission] = useState<"granted" | "denied" | "default">(
    "default"
  );

  useEffect(() => {
    if ("Notification" in window) {
      setDesktopPermission(Notification.permission as any);
    }
  }, []);

  const handleSave = () => {
    saveNotificationPreferences(preferences);
    onClose();
  };

  const handleRequestDesktopPermission = async () => {
    const granted = await requestDesktopNotificationPermission();
    setDesktopPermission(granted ? "granted" : "denied");
    if (granted) {
      setPreferences({
        ...preferences,
        desktopNotificationsEnabled: true,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-notifications" className="font-medium">
              Enable Notifications
            </Label>
            <Switch
              id="enable-notifications"
              checked={preferences.enableNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, enableNotifications: checked })
              }
            />
          </div>

          {preferences.enableNotifications && (
            <>
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label htmlFor="sound-enabled" className="flex items-center gap-2 font-medium">
                  <Volume2 className="w-4 h-4" />
                  Sound Effects
                </Label>
                <Switch
                  id="sound-enabled"
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, soundEnabled: checked })
                  }
                />
              </div>

              {/* Desktop Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="desktop-enabled" className="flex items-center gap-2 font-medium">
                    <Monitor className="w-4 h-4" />
                    Desktop Notifications
                  </Label>
                  <Switch
                    id="desktop-enabled"
                    checked={preferences.desktopNotificationsEnabled}
                    onCheckedChange={(checked) => {
                      if (checked && desktopPermission !== "granted") {
                        handleRequestDesktopPermission();
                      } else {
                        setPreferences({
                          ...preferences,
                          desktopNotificationsEnabled: checked,
                        });
                      }
                    }}
                    disabled={desktopPermission === "denied"}
                  />
                </div>
                {desktopPermission === "denied" && (
                  <p className="text-xs text-slate-500">
                    Desktop notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Milestone Alerts</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {preferences.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded"
                    >
                      <Label htmlFor={milestone.id} className="text-sm cursor-pointer">
                        {getMilestoneDescription(milestone)}
                      </Label>
                      <Switch
                        id={milestone.id}
                        checked={milestone.enabled}
                        onCheckedChange={(checked) => {
                          setPreferences({
                            ...preferences,
                            milestones: preferences.milestones.map((m) =>
                              m.id === milestone.id ? { ...m, enabled: checked } : m
                            ),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
