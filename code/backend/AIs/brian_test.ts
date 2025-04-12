import { config } from "dotenv";
config({ path: './.env' }); // Load the .env file

import { BrianSDK } from "@brian-ai/sdk";

const brian = new BrianSDK({
  apiKey: process.env.BRIAN_API_KEY!,
});

async function main() {
  try {
    const res = await brian.ask({
      kb: "default",
      prompt: "What is zero-knowledge proof?",
    });

    console.log("Brian says:", res.answer);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
