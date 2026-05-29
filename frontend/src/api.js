// api.js — with full diagnostic logging
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  || 'http://localhost:3001'

export async function analyzeRepo(repoUrl) {
  console.log("[API] Sending request to backend:", repoUrl);

  let response;
  try {
    response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });
  } catch (networkError) {
    console.error("[API] Network error — is the backend running?", networkError);
    throw new Error("Could not reach the server. Is the backend running on port 3001?");
  }

  console.log("[API] Response status:", response.status);
  console.log("[API] Response ok:", response.ok);

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error("[API] Failed to parse response as JSON:", parseError);
    throw new Error("Server returned a non-JSON response. Check the backend console for errors.");
  }

  console.log("[API] Parsed response data:", data);

  if (!response.ok || data.success === false) {
    const msg = data?.error?.message || data?.message || "Request failed with status " + response.status;
    console.error("[API] Backend returned error:", msg);
    throw new Error(msg);
  }

  return data;
}
