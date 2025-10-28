// app/about/page.tsx
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>
        <p className="text-gray-600 mb-4">
          This is a public page that anyone can access.
        </p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-500">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
