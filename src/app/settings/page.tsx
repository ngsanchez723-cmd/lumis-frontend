import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch usr_users row for display_name and tier
  const { data: profile } = await supabase
    .from("usr_users")
    .select("display_name, tier, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-neutral-500 text-sm mb-8">
        Manage your account and preferences.
      </p>

      <SettingsClient
        userId={user.id}
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        tier={profile?.tier ?? "free"}
        createdAt={profile?.created_at ?? user.created_at}
        provider={user.app_metadata?.provider ?? "email"}
      />
    </div>
  );
}
