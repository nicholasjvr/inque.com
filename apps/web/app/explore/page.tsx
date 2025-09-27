"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  author: string;
  thumbnail?: string;
  createdAt: string;
  tags: string[];
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with real Firebase data
    const mockProjects: Project[] = [
      {
        id: "1",
        title: "Interactive Portfolio",
        description: "A beautiful portfolio with smooth animations",
        author: "John Doe",
        createdAt: "2024-01-15",
        tags: ["portfolio", "animation", "css"]
      },
      {
        id: "2", 
        title: "Weather Widget",
        description: "Real-time weather display with location detection",
        author: "Jane Smith",
        createdAt: "2024-01-14",
        tags: ["weather", "api", "javascript"]
      },
      {
        id: "3",
        title: "Music Player",
        description: "Custom music player with visualizer",
        author: "Mike Johnson",
        createdAt: "2024-01-13",
        tags: ["music", "audio", "visualization"]
      }
    ];

    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading projects...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Explore Projects</h1>
        <p className="text-gray-600">
          Discover amazing widgets and projects created by our community
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-2xl">🎨</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>by {project.author}</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found. Be the first to upload one!</p>
        </div>
      )}
    </div>
  );
}
