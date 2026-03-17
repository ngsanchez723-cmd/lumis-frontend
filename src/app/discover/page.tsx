import Link from "next/link";

export default function DiscoverPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Discover</h1>
      <p className="text-neutral-500 mb-8">Explore investment themes, sectors, and companies.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/discover/themes" className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors">
          <h2 className="font-semibold mb-1">Themes</h2>
          <p className="text-sm text-neutral-500">Cross-cutting investment narratives</p>
        </Link>
        <Link href="/discover/sectors" className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors">
          <h2 className="font-semibold mb-1">Market Map</h2>
          <p className="text-sm text-neutral-500">15 sectors, 71 subsectors</p>
        </Link>
        <Link href="/discover/companies" className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors">
          <h2 className="font-semibold mb-1">Company Explorer</h2>
          <p className="text-sm text-neutral-500">Search and browse companies</p>
        </Link>
      </div>
    </div>
  );
}
