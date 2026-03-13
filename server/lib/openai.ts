import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";

const envFiles = [".env.local", ".env", ".env.example"];

for (const file of envFiles) {
  dotenv.config({
    path: path.resolve(process.cwd(), file),
    override: false
  });
}

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to .env, .env.local, or your current shell environment."
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}
