"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Settings, Smartphone, ScanFace, ScanLine } from "lucide-react";

interface SmartSettings {
  is_face_enabled: boolean;
  is_qr_enabled: boolean;
  is_nfc_enabled: boolean;
}

export default function SmartAttendanceSettingsPage() {
  const [settings, setSettings] = useState<SmartSettings>({
    is_face_enabled: true,
    is_qr_enabled: true,
    is_nfc_enabled: true,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/smart-attendance/settings');
        const data = response.data?.data?.data || response.data?.data;
        if (data) {
          setSettings({
            is_face_enabled: data.is_face_enabled,
            is_qr_enabled: data.is_qr_enabled,
            is_nfc_enabled: data.is_nfc_enabled,
          });
        }
      } catch (error) {
        console.error("Failed to load settings", error);
        toast.error("Failed to load attendance settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/smart-attendance/settings', settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Smart Attendance Settings</h2>
        <p className="text-muted-foreground">
          Configure which smart attendance methods are available on the terminal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Allowed Attendance Methods
          </CardTitle>
          <CardDescription>
            Toggle the systems you want to enable on the Smart Attendance Terminal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <ScanFace className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-semibold">Face Recognition</Label>
                <p className="text-sm text-muted-foreground">Allow students/staff to mark attendance using AI face scan.</p>
              </div>
            </div>
            <Switch 
              checked={settings.is_face_enabled}
              onCheckedChange={(c) => setSettings({ ...settings, is_face_enabled: c })}
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <ScanLine className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-semibold">QR Code Scan</Label>
                <p className="text-sm text-muted-foreground">Allow users to scan their personal QR code ID cards.</p>
              </div>
            </div>
            <Switch 
              checked={settings.is_qr_enabled}
              onCheckedChange={(c) => setSettings({ ...settings, is_qr_enabled: c })}
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-semibold">NFC System</Label>
                <p className="text-sm text-muted-foreground">Allow tapping NFC tags or NFC-enabled smartphones.</p>
              </div>
            </div>
            <Switch 
              checked={settings.is_nfc_enabled}
              onCheckedChange={(c) => setSettings({ ...settings, is_nfc_enabled: c })}
            />
          </div>

        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
