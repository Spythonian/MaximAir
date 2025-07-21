import Link from 'next/link';
import LatestEpisodes from '@/components/LatestEpisodes';
import ScheduleWidget from '@/components/ScheduleWidget';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to <span className="text-red-500">Iconic FM</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Your premier radio experience, bringing you the best music, engaging talk shows,
            and live streaming entertainment 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/live"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              🔴 Listen Live
            </Link>
            <Link
              href="/episodes"
              className="border border-white hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Browse Episodes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Great Music</h3>
              <p className="text-gray-600">
                Discover the latest hits and timeless classics across all genres,
                curated by our expert DJs.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Talk Shows</h3>
              <p className="text-gray-600">
                Engaging conversations, interviews with celebrities, and discussions
                on topics that matter to you.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📻</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Live Streaming</h3>
              <p className="text-gray-600">
                Never miss a moment with our 24/7 live streaming service,
                available on all your devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Content & Schedule */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScheduleWidget limit={5} showLive={true} />
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Join the Community</h3>
              <p className="text-gray-600 mb-4">
                Connect with fellow listeners, participate in live chats during shows,
                and never miss your favorite programs.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    💬
                  </span>
                  <span className="text-gray-700">Live chat during shows</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    📅
                  </span>
                  <span className="text-gray-700">Weekly program schedule</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    🎧
                  </span>
                  <span className="text-gray-700">High-quality audio streaming</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/schedule"
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-block"
                >
                  View Full Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Episodes */}
      <LatestEpisodes />
    </div>
  );
}
