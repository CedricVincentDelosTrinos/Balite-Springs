import { Link, useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();

  console.error(error);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-[var(--color-text)]">
          Something went wrong
        </h1>

        <p className="mt-4 text-[var(--color-text-muted)]">
          We ran into an unexpected error while loading this page.
          Please try again.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="
              rounded-[var(--radius-pill)]
              bg-[var(--color-primary)]
              px-5
              py-2.5
              text-sm
              font-medium
              text-[var(--color-text-light)]
              transition
              hover:-translate-y-0.5
              hover:shadow-[var(--shadow-md)]
            "
          >
            Try Again
          </button>

          <Link
            to="/"
            className="
              rounded-[var(--radius-pill)]
              border
              border-[var(--color-border)]
              px-5
              py-2.5
              text-sm
              font-medium
              text-[var(--color-text)]
              transition
              hover:border-[var(--color-primary)]
              hover:text-[var(--color-primary)]
            "
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}