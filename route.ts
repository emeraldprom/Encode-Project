import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to extract key details from a story section
function extractImageDetails(section: string, keywords: string[]) {
  // Default fallback prompts using keywords
  let defaultPrompt = keywords.length > 0 
    ? `A blockchain superhero scene related to ${keywords.join(", ")}` 
    : "A dynamic blockchain superhero scene";

  // Try to extract specific details
  const mainCharacterMatch = section.match(/(?:hero|protagonist|character)\s*(?:is|was)?\s*([^,.]+)/i);
  const locationMatch = section.match(/in\s+(?:a|the)\s+([^,.]+)/i);
  const actionMatch = section.match(/(?:hero|protagonist)\s+([^,.]+)/i);
  const challengeMatch = section.match(/challenge\s+(?:of|was)\s+([^,.]+)/i);

  // Construct a more specific prompt
  let detailedPrompt = defaultPrompt;
  
  if (mainCharacterMatch) {
    detailedPrompt += `, featuring a blockchain hero like ${mainCharacterMatch[1]}`;
  }
  
  if (locationMatch) {
    detailedPrompt += `, set in ${locationMatch[1]}`;
  }
  
  if (actionMatch) {
    detailedPrompt += `, showing the blockchain hero ${actionMatch[1]}`;
  }
  
  if (challengeMatch) {
    detailedPrompt += `, confronting a challenge of ${challengeMatch[1]}`;
  }

  return `Cartoon blockchain superhero illustration in a vibrant, dynamic style: ${detailedPrompt}. 
  Colorful, engaging, suitable for children, capturing the essence of the story section.`;
}

export async function POST(request: Request) {
  try {
    const { keywords } = await request.json();
    
    // Validate keywords
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "Invalid keywords" }, { status: 400 });
    }

    // Generate the story with explicit beginning, middle, and end sections
    const storyPrompt = `Write a short blockchain/web3/cryptocurrency superhero cartoon story for kids based on these keywords: ${keywords.join(", ")}. 
    Structure the story with three clear parts:
    1. Beginning: Introduce the blockchain hero, their use-case, and the real-world challenge
    2. Middle: The blockchain hero faces development or user-experience obstacles and begins to overcome them
    3. End: The blockchain hero triumphs and delivers a better system

    Format the story with clear section markers: [BEGINNING], [MIDDLE], [END]`;
    
    const storyResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: storyPrompt }],
    });
    
    const fullStory = storyResponse.choices[0]?.message?.content?.trim() || "Story could not be generated.";
    
    // Parse the story into sections
    const [, beginning, middle, end] = fullStory.match(/\[BEGINNING\](.*?)\[MIDDLE\](.*?)\[END\](.*)/s) || [];

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
      
      const imageUrl = imageResponse.data[0]?.url;
      
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
      beginning: beginning?.trim(),
      middle: middle?.trim(),
      end: end?.trim(),
      imagePrompts, // Added for debugging/transparency
      images: imagePaths 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "An internal error occurred." 
    }, { status: 500 });
  }
}