import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { NewPlaybookClient } from "./new-playbook-client";

export default async function NewPlaybookPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Load taxonomy for guided wizard
  const { data: sectors } = await supabase
    .from("ref_sectors")
    .select("id, name, parent_id")
    .order("name");

  const { data: themes } = await supabase
    .from("ref_themes")
    .select("id, name, icon")
    .order("name");

  // Separate top-level sectors from subsectors
  const topSectors = (sectors ?? []).filter((s) => !s.parent_id);
  const subsectors = (sectors ?? []).filter((s) => s.parent_id);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">New Playbook</h1>
      <p className="text-neutral-500 text-sm mb-8">
        Describe your investment thesis and we&apos;ll find companies that match.
      </p>
      <NewPlaybookClient
        userId={user.id}
        sectors={topSectors}
        subsectors={subsectors}
        themes={themes ?? []}
      />
    </div>
  );
}
