export default async function PopularPlaybookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Popular Playbook: {slug}</h1>
      <p className="text-neutral-500">Read-only playbook detail with &quot;Use as template&quot; action.</p>
    </div>
  );
}
