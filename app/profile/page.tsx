// app/profile/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Profile() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">
            <strong>Name:</strong> {session.user?.name}
          </p>
          <p className="text-gray-600">
            <strong>Email:</strong> {session.user?.email}
          </p>
          <p className="text-gray-600">
            <strong>User ID:</strong> {session.user?.id}
          </p>
        </div>
      </div>
    </div>
  );
}
