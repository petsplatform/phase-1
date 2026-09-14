export default function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-12 w-12 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
        <p className="text-sm font-semibold text-charcoal-text">
          Verifying your session...
        </p>
      </div>
    </div>
  );
}
