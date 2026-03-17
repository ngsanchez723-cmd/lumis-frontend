export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Theme: {slug}</h1>
      <p className="text-neutral-500">AI-generated theme overview will load here.</p>
    </div>
  );
}
