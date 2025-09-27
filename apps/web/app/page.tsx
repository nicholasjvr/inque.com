import Link from "next/link";

export default function Page() {
  return (
    <div className="text-center">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="title-3d gradient-text">
            inQ social [creatives] platform
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Showcase, communicate, create your way
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">🎨 Widget Showcase</h3>
          <p className="text-gray-600">
            Upload and display your interactive projects and widgets
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">👥 Social Features</h3>
          <p className="text-gray-600">
            Connect with other creators, follow, like, and collaborate
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">📱 Real-time</h3>
          <p className="text-gray-600">
            Live notifications and real-time updates
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-6">Explore the Platform</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/explore" 
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Explore Projects
          </Link>
          <Link 
            href="/users" 
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Discover Users
          </Link>
          <Link 
            href="/upload" 
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Upload Widget
          </Link>
        </div>
      </div>
    </div>
  );
}
  