import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Shield, Key, Download, Keyboard, Camera } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeColorPicker } from "@/components/ThemeColorPicker";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { roles, isOwner, isAdmin } = useUserRole();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { tasks } = useTasks();
  const [displayName, setDisplayName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync display name from profile once loaded
  if (profile?.display_name && !nameLoaded) {
    setDisplayName(profile.display_name);
    setNameLoaded(true);
  } else if (user?.display_name && !nameLoaded) {
    setDisplayName(user.display_name);
    setNameLoaded(true);
  }

  const handleSaveProfile = () => {
    updateProfile.mutate({ display_name: displayName });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    await uploadAvatar.mutateAsync(file);
    e.target.value = "";
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) { toast.error("No tasks to export"); return; }
    const headers = ["Title", "Status", "Priority", "Due Date", "Created At", "Description"];
    const rows = tasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.due_date ? new Date(t.due_date).toLocaleDateString() : "",
      new Date(t.created_at).toLocaleDateString(),
      `"${(t.description ?? "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadFile(csv, `taskflow-export-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
    toast.success("Tasks exported to CSV");
  };

  const handleExportJSON = () => {
    if (tasks.length === 0) { toast.error("No tasks to export"); return; }
    const data = tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      created_at: t.created_at,
      description: t.description,
      recurrence: t.recurrence,
    }));
    downloadFile(JSON.stringify(data, null, 2), `taskflow-export-${new Date().toISOString().split("T")[0]}.json`, "application/json");
    toast.success("Tasks exported to JSON");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Card className="animate-fade-up" style={{ animationDelay: "50ms" }}>
        <CardHeader className="flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt="Avatar" />
                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                  {user?.email?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-muted-foreground">Click to upload (max 5MB)</p>
              {uploadAvatar.isPending && (
                <p className="text-xs text-primary">Uploading...</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} size="sm">
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Role */}
      <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        <CardHeader className="flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <CardTitle className="text-base">Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <Badge variant="secondary">Member</Badge>
            ) : (
              roles.map(r => (
                <Badge key={r} variant={r === "owner" ? "default" : "secondary"} className="capitalize">{r}</Badge>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {isOwner ? "You have full access to all features." :
             isAdmin ? "You can manage users and settings." :
             "Standard member access."}
          </p>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="animate-fade-up" style={{ animationDelay: "150ms" }}>
        <CardHeader className="flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <Download className="h-5 w-5 text-success" />
          </div>
          <CardTitle className="text-base">Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Download your tasks for backup or analysis.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON} className="gap-2">
              <Download className="h-4 w-4" /> Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <CardHeader className="flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Keyboard className="h-5 w-5 text-accent-foreground" />
          </div>
          <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyboardShortcutsDialog>
            <Button variant="outline" className="gap-2">
              <Keyboard className="h-4 w-4" /> View All Shortcuts
            </Button>
          </KeyboardShortcutsDialog>
        </CardContent>
      </Card>

      {/* Theme Color */}
      <ThemeColorPicker />

      <Separator />

      <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
        <Button variant="destructive" onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );
};

export default Settings;
