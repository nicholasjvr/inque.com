"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  projectCount: number;
  followerCount: number;
  joinedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with real Firebase data
    const mockUsers: User[] = [
      {
        id: "1",
        displayName: "John Doe",
        email: "john@example.com",
        bio: "Frontend developer passionate about creating beautiful user experiences",
        projectCount: 12,
        followerCount: 156,
        joinedAt: "2023-06-15"
      },
      {
        id: "2",
        displayName: "Jane Smith",
        email: "jane@example.com", 
        bio: "Full-stack developer and UI/UX designer",
        projectCount: 8,
        followerCount: 89,
        joinedAt: "2023-08-22"
      },
      {
        id: "3",
        displayName: "Mike Johnson",
        email: "mike@example.com",
        bio: "Creative coder and digital artist",
        projectCount: 15,
        followerCount: 234,
        joinedAt: "2023-05-10"
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Discover Users</h1>
        <p className="text-gray-600">
          Connect with talented creators and developers
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.displayName.charAt(0)}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{user.displayName}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            {user.bio && (
              <p className="text-gray-600 mb-4 text-sm">{user.bio}</p>
            )}
            
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>{user.projectCount} projects</span>
              <span>{user.followerCount} followers</span>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Follow
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found.</p>
        </div>
      )}
    </div>
  );
}
