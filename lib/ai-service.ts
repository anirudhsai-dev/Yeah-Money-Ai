import { Category } from "./types";
import { getPreference } from "./sqlite-service";

// Production Security: We no longer use the API key directly in the frontend.
// The key is hidden on the server, and the frontend calls a proxy endpoint.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

export interface AISuggestion {
  categoryId: string | null;
  suggestedName: string | null;
}

export async function autoCategorize(notes: string, categories: Category[]): Promise<AISuggestion | null> {
  console.log("[AI] Starting categorization (Secure Proxy) for:", notes);

  if (!notes || notes.length < 2) return null;

  // 1. Check local SQLite memory first (User's preferred categories)
  try {
    const preferredId = await getPreference(notes);
    if (preferredId && categories.find(c => c.id === preferredId)) {
      console.log("[AI] Found match in local SQLite memory:", preferredId);
      return { categoryId: preferredId, suggestedName: null };
    }
  } catch (err) {
    console.warn("[AI] SQLite memory check failed:", err);
  }

  // 2. Use Secure Proxy to call AI
  try {
    const categoryList = categories.map(c => `${c.id}: ${c.name}`).join(", ");

    // Fallback URL for development if EXPO_PUBLIC_API_URL is not set
    const url = API_BASE_URL ? `${API_BASE_URL}/api/ai/categorize` : "http://localhost:5000/api/ai/categorize";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        notes,
        categoryList
      })
    });

    if (!response.ok) {
      // If proxy fails (e.g. server offline), we silently fail so user can still manually pick
      console.error(`[AI Proxy] Server returned error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("[AI Proxy] Response:", data);

    const categoryId = categories.find(c => c.id === data.id) ? data.id : null;

    return {
      categoryId: categoryId,
      suggestedName: (data.name && data.name !== "null" && data.name !== data.id) ? data.name : null
    };
  } catch (error: any) {
    console.error("[AI Proxy] Connection Error:", error.message);
    return null;
  }
}
