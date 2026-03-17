export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Note</h1>
      <p className="text-neutral-500">Note {id} — edit and view here.</p>
    </div>
  );
}
