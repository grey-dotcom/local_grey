import Anthropic from "@anthropic-ai/sdk";
import { context } from "./context/app_screenshot.js";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function chat(message) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [
        {
          role: "user",
          content: context + "\n\nUser: " + message
        }
      ],
      max_tokens: 1024
    });

    // Claude SDK 최신 버전은 response.content[0].text 구조가 아니라, content 자체를 문자열로 반환할 수 있음
    // 안전하게 출력
    if (response?.content && Array.isArray(response.content)) {
      return response.content.map(c => c.text).join("\n");
    } else if (response?.content?.text) {
      return response.content.text;
    } else {
      return "[No response from Claude]";
    }

  } catch (error) {
    console.error("Error calling Claude API:", error.message);
    return "[Error occurred]";
  }
}