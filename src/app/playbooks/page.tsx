export default function PlaybooksPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">My Playbooks</h1>
          <p className="text-neutral-500">Your investment playbooks and matched companies.</p>
        </div>
        <a
          href="/playbooks/new"
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          New Playbook
        </a>
      </div>
      <div className="border border-dashed border-neutral-300 rounded-lg p-12 text-center text-neutral-400">
        No playbooks yet. Create your first one to get started.
      </div>
    </div>
  );
}
