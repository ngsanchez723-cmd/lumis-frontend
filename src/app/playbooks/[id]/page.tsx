export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Playbook Detail</h1>
      <p className="text-neutral-500">Playbook {id} — matched companies and scores will load here.</p>
    </div>
  );
}
