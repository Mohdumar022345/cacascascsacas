import { ChatMessage } from "@/types/types";

interface ResponsePayload {
  content?: string;
  error?: string;
}

export const sendMessage = async (messages: ChatMessage[], timeoutMs = 60000): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";

    // Try to parse JSON response; fall back to text
    let data: ResponsePayload = {};
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => "");
      try {
        data = JSON.parse(text);
      } catch {
        data.content = text;
      }
    }

    if (!res.ok) {
      const errMsg = data?.error ?? data?.content ?? `Request failed with status ${res.status}`;
      throw new Error(errMsg);
    }

    if (data.error) throw new Error(data.error);
    return data.content ?? "No response received";
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    console.error("Failed to send message:", err);
    // Re-throw if it's already an Error
    if (err instanceof Error) throw err;
    throw new Error("Failed to get AI response. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
};
