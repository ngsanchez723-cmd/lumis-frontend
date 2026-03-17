export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Lumis</h1>
        <p className="text-lg text-neutral-500 max-w-md mx-auto">
          Qualitative-first investment intelligence.
          Turn your market convictions into informed research.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <a
            href="/auth/signup"
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Get Started Free
          </a>
          <a
            href="/discover/themes"
            className="px-6 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Explore Themes
          </a>
        </div>
      </div>
    </main>
  );
}
