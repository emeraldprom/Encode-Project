"use client";
import { useState } from "react";

interface StoryResponse {
  story: string;
  beginning: string;
  middle: string;
  end: string;
  images: string[];
}

export default function HomePage() {
  const [keywords, setKeywords] = useState("");
  const [storyData, setStoryData] = useState<StoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keywords: keywords.split(",").map((kw) => kw.trim()).filter((kw) => kw !== "")
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
      <h1 className="text-2xl font-bold mb-4">AI-Powered Picture Book Generator</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          placeholder="Enter 1-3 blockchain terms (e.g., ZK, bitcoin, decentralisation )"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full mb-4"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Generating..." : "Create Picture Book"}
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
        </div>
      )}
    </div>
  );
}
