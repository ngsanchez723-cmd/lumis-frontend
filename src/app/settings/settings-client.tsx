"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  userId: string;
  email: string;
  displayName: string;
  tier: string;
  createdAt: string;
  provider: string;
}

export function SettingsClient({
  userId,
  email,
  displayName,
  tier,
  createdAt,
  provider,
}: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameChanged = name.trim() !== displayName;

  const handleSaveName = async () => {
    if (!nameChanged) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase
      .from("usr_users")
      .update({ display_name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      setError("Failed to update display name.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Profile section */}
      <section>
        <h2 className="text-sm font-medium text-neutral-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm text-neutral-500 mb-1"
            >
              Display name
            </label>
            <div className="flex gap-2">
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="Your name"
              />
              {nameChanged && (
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
            {saved && (
              <p className="text-sm text-green-600 mt-1">Saved.</p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Email
            </label>
            <p className="text-sm text-neutral-900">{email}</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Sign-in method
            </label>
            <p className="text-sm text-neutral-900 capitalize">{provider}</p>
          </div>
        </div>
      </section>

      {/* Plan section */}
      <section className="border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-medium text-neutral-900 mb-4">Plan</h2>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              tier === "premium"
                ? "bg-amber-100 text-amber-800"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {tier === "premium" ? "Premium" : "Free"}
          </span>
          <span className="text-sm text-neutral-500">
            Member since {memberSince}
          </span>
        </div>
        {tier !== "premium" && (
          <p className="text-sm text-neutral-500 mt-3">
            Premium unlocks unlimited playbooks, extended scoring dimensions,
            and manual score overlays.{" "}
            <span className="text-neutral-400">Coming soon.</span>
          </p>
        )}
      </section>

      {/* Account section */}
      <section className="border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-medium text-neutral-900 mb-4">Account</h2>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </section>
    </div>
  );
}
