"use client";
import { useState } from "react";

interface StoryResponse {
  story: string;
  ragContext?: string;
  beginning: string;
  middle: string;
  end: string;
  imagePrompts: string[];
  images: string[];
}

// Available RAG sources ( match files in public/rag-sources/)
const RAG_SOURCES = [
  { value: '', label: 'No Additional Context' },
  { value: 'Glossary.json', label: 'Glossary' },
  { value: 'DeAi.txt', label: 'DeAi' },
  { value: 'DeAi edit.txt', label: 'DeAi edit' },
  { value: 'Dollar.txt', label: 'Dollar' },
];

export default function HomePage() {
  const [keywords, setKeywords] = useState("");
  const [ragSource, setRagSource] = useState("");
  const [storyData, setStoryData] = useState<StoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContext, setShowContext] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keywords: keywords.split(",").map((kw) => kw.trim()).filter((kw) => kw !== ""),
          ragSource: ragSource || undefined
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "An unexpected error occurred.");
      } else {
        setStoryData(data);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI-Powered StoryBook Generator</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Enter 1-3 keywords (e.g., ZK, permissionless, validator)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <select
            value={ragSource}
            onChange={(e) => setRagSource(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full"
          >
            {RAG_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          disabled={loading}
        >
          {loading ? "Generating..." : "Create Story"}
        </button>
      </form>
      
      {loading && <p>Loading story and images...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {storyData && (
        <div>
          <h2 className="text-xl font-bold mb-4">Generated Story</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold">Beginning</h3>
              <p className="bg-gray-100 p-4 rounded">{storyData.beginning}</p>
            </div>
            <div>
              <h3 className="font-semibold">Middle</h3>
              <p className="bg-gray-100 p-4 rounded">{storyData.middle}</p>
            </div>
            <div>
              <h3 className="font-semibold">End</h3>
              <p className="bg-gray-100 p-4 rounded">{storyData.end}</p>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Story Illustrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {storyData.images.map((src, index) => (
              <div key={index} className="text-center">
                <h3 className="mb-2 font-semibold">
                  {index === 0 ? "Beginning" : index === 1 ? "Middle" : "End"}
                </h3>
                <img 
                  src={src} 
                  alt={`Story section ${index + 1}`} 
                  className="rounded mx-auto" 
                />
              </div>
            ))}
          </div>

          {/* Context Display */}
          {storyData.ragContext && (
            <div className="mt-4">
              <button 
                onClick={() => setShowContext(!showContext)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                {showContext ? "Hide" : "Show"} RAG Context
              </button>
              {showContext && (
                <div className="mt-2 bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold mb-2">RAG Context:</h3>
                  <pre className="text-sm overflow-x-auto">{storyData.ragContext}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
