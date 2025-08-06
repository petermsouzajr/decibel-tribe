import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import DatingIntroButtons from "@/components/dating/DatingIntroButtons";

export default async function DatingPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  const isDatingActive = (user as any).isDatingActive ?? false;

  // If dating is not active, show intro page with buttons
  if (!isDatingActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Decibel Tribe Dating
            </h1>
            <p className="text-gray-600">
              Connect with music lovers in your area
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-96 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">💕</span>
                </div>
                <p className="text-gray-700 font-semibold">Ready to Start?</p>
                <p className="text-sm text-gray-500">Set up your dating profile</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Join the community of music lovers looking for meaningful connections.
            </p>
            
            <div className="space-y-2 text-sm text-gray-500 mb-8">
              <p>🎵 Connect through shared music taste</p>
              <p>📍 Find matches in your area</p>
              <p>💬 Chat with compatible music lovers</p>
            </div>

            {/* Buttons directly on the page */}
            <div className="space-y-3">
              <DatingIntroButtons username={user.username} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If dating is active, show the dating deck
  if (isDatingActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Match
            </h1>
            <p className="text-gray-600">
              Discover music lovers in your area
            </p>
          </div>

          {/* Placeholder for dating deck */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-96 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💕</span>
                </div>
                <p className="text-gray-600">Dating Deck</p>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">
              Your dating profile is ready! The matching system will be available soon.
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <p>✅ Profile setup complete</p>
              <p>✅ Preferences configured</p>
              <p>⏳ Matching engine in development</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}