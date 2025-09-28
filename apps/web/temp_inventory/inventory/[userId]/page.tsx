"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { db, auth } from "../../../lib/firebaseClient";
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";

interface User {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  projectCount?: number;
  followerCount?: number;
  joinedAt?: string;
  skills?: string[];
  isOnline?: boolean;
  lastActive?: string;
}

interface Widget {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  tags?: string[];
  createdAt: any;
  likes?: number;
  views?: number;
  userId: string;
}

export default function UserInventoryPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    console.log("🚀 [INVENTORY] Initializing inventory page for user:", userId);
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      console.log("📡 [INVENTORY] Loading user data from Firebase for:", userId);
      setLoading(true);

      // Get user data from Firebase
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData: User = { id: userId, ...userDoc.data() };
      
      // Get user's widgets from Firebase
      console.log("📡 [INVENTORY] Fetching user widgets from Firebase");
      const widgetsQuery = query(
        collection(db, 'widgets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const widgetsSnapshot = await getDocs(widgetsQuery);
      const widgets: Widget[] = [];
      
      widgetsSnapshot.forEach((doc) => {
        widgets.push({ id: doc.id, ...doc.data() } as Widget);
      });

      setUser(userData);
      setWidgets(widgets);
      console.log("✅ [INVENTORY] Successfully loaded user data and widgets for:", userId, "Widgets:", widgets.length);
    } catch (error) {
      console.error("❌ [INVENTORY] Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement follow functionality with Firebase
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h1>
          <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              {(user.displayName || user.name || 'U').charAt(0)}
            </div>
            {user.isOnline && (
              <div className="absolute mt-16 ml-16 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.displayName || user.name || 'Anonymous User'}</h1>
                <p className="text-gray-600 mb-2">{user.bio || 'Creative developer exploring the digital universe!'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>📊 {widgets.length} projects</span>
                  <span>👥 {user.followerCount || 0} followers</span>
                  <span>🕐 Last active: {user.lastActive || 'Recently active'}</span>
                  <span>📅 Joined: {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>

              <div className="mt-4 md:mt-0">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              </div>
            </div>

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widgets Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Projects & Widgets ({widgets.length})
          </h2>
        </div>

        {widgets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No projects yet</h3>
            <p className="text-gray-600">
              This user hasn't uploaded any projects yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <div key={widget.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200">
                  {widget.thumbnail ? (
                    <img
                      src={widget.thumbnail}
                      alt={widget.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      🎨
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{widget.title || 'Untitled Widget'}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{widget.description || 'No description available.'}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {widget.tags && widget.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>❤️ {widget.likes || 0}</span>
                    <span>👁️ {widget.views || 0}</span>
                    <span>📅 {widget.createdAt ? getTimeAgo(widget.createdAt.toDate().toISOString()) : 'Unknown'}</span>
                  </div>

                  <div className="mt-3">
                    <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
