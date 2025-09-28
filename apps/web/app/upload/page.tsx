"use client";
import { useRef, useState } from "react";
import { getUploadUrl } from "../actions/getUploadUrl";
import { markUploaded } from "../actions/markUploaded";
import { uploadResumable } from "./client";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function run() {
    const file = inputRef.current?.files?.[0];
    if (!file) { 
      alert("Please select a file"); 
      return; 
    }

    setUploading(true);
    setLog(l => [...l, `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`]);

    try {
      const { id, resumableUrl } = await getUploadUrl({
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream"
      });

      setLog(l => [...l, `Got resumable URL. Uploading…`]);

      await uploadResumable({ file, resumableUrl });

      setLog(l => [...l, `Upload finished. Notifying server…`]);

      await markUploaded(id);

      setLog(l => [...l, `✅ Done! File id=${id}`]);
    } catch (error) {
      setLog(l => [...l, `❌ Error: ${error instanceof Error ? error.message : 'Upload failed'}`]);
    } finally {
      setUploading(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (inputRef.current) {
        inputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Upload Widget</h1>
        <p className="text-gray-600">
          Share your creative projects with the community
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive 
              ? "border-purple-500 bg-purple-50" 
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">Drop files here or click to browse</h3>
          <p className="text-gray-600 mb-4">
            Supports HTML, CSS, JS, and image files up to 100MB
          </p>
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            accept=".html,.css,.js,.png,.jpg,.jpeg,.gif,.svg"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Choose Files
          </button>
        </div>

        {/* Upload Button */}
        <div className="mt-6 text-center">
          <button
            onClick={run}
            disabled={uploading}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {uploading ? "Uploading..." : "Upload Widget"}
          </button>
        </div>

        {/* Upload Logs */}
        {log.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Upload Progress</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className="mb-1">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">💡 Upload Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Include a README.md file to describe your widget</li>
          <li>• Use semantic HTML and clean CSS for better accessibility</li>
          <li>• Add comments to your code to help other developers</li>
          <li>• Test your widget in different browsers before uploading</li>
        </ul>
      </div>
    </div>
  );
}
