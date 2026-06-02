"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LogOut } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() as any;
  const { setConversations, setPendingMessage } = useChatStore();
  const [open, setOpen] = useState(false);
  
  // Profile State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  // AI Settings State
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    if (open && session?.accessToken) {
      fetch("http://localhost:8080/api/users/me", {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      })
        .then(async res => {
          if (!res.ok) return null;
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        })
        .then(data => {
          if (data) {
            setName(data.name || "");
            setEmail(data.email || "");
            setTemperature([data.temperature !== undefined ? data.temperature : 0.7]);
            setMaxTokens(data.maxTokens || 2048);
          }
        })
        .catch(console.error);
    }
  }, [open, session]);

  const handleProfileSave = async () => {
    setProfileMessage("");
    try {
      const res = await fetch("http://localhost:8080/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name, email, password })
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setProfileMessage(data.error || "Update failed");
      } else {
        setProfileMessage("Profile updated successfully!");
        setPassword("");
      }
    } catch (e) {
      setProfileMessage("An error occurred");
    }
  };

  const handleSettingsSave = async () => {
    setSettingsMessage("");
    try {
      const res = await fetch("http://localhost:8080/api/users/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ temperature: temperature[0], maxTokens })
      });
      if (!res.ok) {
        setSettingsMessage("Update failed");
      } else {
        setSettingsMessage("Settings updated successfully!");
      }
    } catch (e) {
      setSettingsMessage("An error occurred");
    }
  };

  const handleLogout = async () => {
    setConversations([]);
    setPendingMessage(null);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="ai-params">AI Parameters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleProfileSave} className="w-full">Save Profile</Button>
            {profileMessage && <p className="text-sm text-center text-green-600 dark:text-green-400">{profileMessage}</p>}
          </TabsContent>
          
          <TabsContent value="ai-params" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature[0]}</span>
              </div>
              <Slider 
                value={temperature} 
                onValueChange={(val) => setTemperature(val as number[])} 
                max={1} 
                step={0.1} 
              />
              <p className="text-xs text-muted-foreground">
                Higher values make output more random, lower values make it more focused.
              </p>
            </div>
            <div className="space-y-2 mt-6">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input 
                id="maxTokens" 
                type="number" 
                value={maxTokens} 
                onChange={(e) => setMaxTokens(Number(e.target.value))} 
                min={1} 
                max={8192} 
              />
            </div>
            <Button onClick={handleSettingsSave} className="w-full mt-4">Save AI Settings</Button>
            {settingsMessage && <p className="text-sm text-center text-green-600 dark:text-green-400">{settingsMessage}</p>}
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
