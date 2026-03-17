export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">{ticker.toUpperCase()}</h1>
      <p className="text-neutral-500">AI-generated qualitative company profile will load here.</p>
    </div>
  );
}
