export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Sector: {slug}</h1>
      <p className="text-neutral-500">AI-generated sector overview will load here.</p>
    </div>
  );
}
