# Encode-Project
Web3 superhero picturebook story using next.js
(Work in progress)

   create-next-app@latest picturebook

use a .env in the root folder with an openai API key

GPT-3.5 turbo and Dall-e 2 for the images (GPT-4o will cut the story short if token length exceeded)

RAG accepts json or txt files

Simple Use Case

Overview:

Web3 is difficult to grasp for many, so there is a need for educational tools that appeal to varying audiences

   The prompt box encourages blockchain related keywords. There is an option to use RAG

After experimenting with assistant prompts, around positive/negative sentiment towards the themes of decentralisation and centralisation, we left it fairly flexible
   
When a keyword is a story is provided with a blockchain hero theme
    
If the term is found within the loaded RAG document then content will be provided to the model in order to give the user an answer
    
If the term cannot be used from the RAG document then the answer will be provided by the model
    
Any other unrelated will be answered by the model.

⚙ Usage and setup

Setup and configuration

Provide your own .env.local file with an OpenAI API key (OPENAI_API_KEY=)
Install openai using the command: 
    
    npm install openai

Locate the App folder with the page.tsx file

Replace the code with the new page.tsx file

Locate the App/Api folder, add a "story" folder and add the route.ts file into this

To run the web application locally

 Run the application using the command: 
    
      npm run dev
    
Open a web browser at the following address:

http://localhost:3000


ISSUES

trying to align the images with the story output, but hallucinates. Maybe separate route.ts files for image and story

would like to put the images inside the story instead of at the end


