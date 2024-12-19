import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to read external files for RAG
async function readRAGSource(filename: string): Promise<string> {
  try {
    // Construct the full path to the file in the project's public directory
    const filePath = path.join(process.cwd(), 'public', 'rag-sources', filename);
    
    // Read the file
    const fileContents = await fs.promises.readFile(filePath, 'utf-8');
    
    // Handle different file types
    if (filename.endsWith('.json')) {
      // If it's a JSON file, stringify it nicely
      return JSON.stringify(JSON.parse(fileContents), null, 2);
    }
    
    // For txt or other files, return contents directly
    return fileContents;
  } catch (error) {
    console.error(`Error reading RAG source file ${filename}:`, error);
    return `Could not read source file: ${filename}`;
  }
}

// Function to extract key details from a story section
function extractImageDetails(section: string, keywords: string[]): string {
  // Create a basic prompt combining the section text and keywords
  return `Create a child-friendly cartoon illustration for this story section: ${section}. 
    Include these elements: ${keywords.join(", ")}. Style: colorful, animated, superhero-themed.`.slice(0, 1000);
}

export async function POST(request: Request) {
  try {
    const { keywords, ragSource } = await request.json();
    
    // Validate keywords
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "Invalid keywords" }, { status: 400 });
    }

    // Read RAG source if provided
    let ragContext = '';
    if (ragSource) {
      ragContext = await readRAGSource(ragSource);
    }

    // Generate the story with RAG context
    const storyPrompt = `Context for story generation:
    ${ragContext ? `RAG Source Document: ${ragContext}` : 'No additional context provided.'}

    Write a short blockchain superhero cartoon story for early teens based on these keywords: ${keywords.join(", ")}. 
    Incorporate details from the provided context if relevant.
    
    Structure the story with three clear parts:
    1. Beginning: Introduce the hero, their use-case, and the initial challenge
    2. Middle: The hero faces obstacles and begins to overcome them
    3. End: The hero introduces a better system
    Format the story with clear section markers: [BEGINNING], [MIDDLE], [END]`;
    
    const storyResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: storyPrompt }],
      max_tokens: 500, // Limit response length
    });
    
    const fullStory = storyResponse.choices[0]?.message?.content?.trim() || "Story could not be generated.";
    
    // Parse the story into sections
    const beginningMatch = fullStory.match(/\[BEGINNING\](.*?)(?=\[MIDDLE\])/s);
    const middleMatch = fullStory.match(/\[MIDDLE\](.*?)(?=\[END\])/s);
    const endMatch = fullStory.match(/\[END\](.*)/s);

    const beginning = beginningMatch ? beginningMatch[1].trim() : "";
    const middle = middleMatch ? middleMatch[1].trim() : "";
    const end = endMatch ? endMatch[1].trim() : "";

    // Generate image prompts dynamically based on story sections
    const imagePrompts = [
      extractImageDetails(beginning || '', keywords),
      extractImageDetails(middle || '', keywords),
      extractImageDetails(end || '', keywords)
    ];

    // Generate 3 images
    const imagePromises = imagePrompts.map(async (prompt, index) => {
      const imageResponse = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "512x512",
      });
      const imageUrl = imageResponse.data[0]?.url || '';
      
      if (!imageUrl) {
        throw new Error(`Could not generate image for section ${index + 1}`);
      }
      
      const imageBuffer = await fetch(imageUrl).then((res) => res.arrayBuffer());
      const imagePath = path.join(process.cwd(), `public/picturebook/image${index + 1}.png`);
      
      // Ensure the directory exists
      const imageDir = path.join(process.cwd(), 'public/picturebook');
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }
      
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      return `/picturebook/image${index + 1}.png`;
    });

    const imagePaths = await Promise.all(imagePromises);
    
    return NextResponse.json({ 
      story: fullStory,
      ragContext, // Include RAG context for transparency
      beginning,
      middle,
      end,
      imagePrompts,
      images: imagePaths 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "An internal error occurred." 
    }, { status: 500 });
  }
}
