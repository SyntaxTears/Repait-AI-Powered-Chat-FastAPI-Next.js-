// Backend connection for authentication
const BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/auth";
const TOKEN_KEY = "detect_auto_token";
const USER_KEY = "detect_auto_user";

// Function to handle API errors
async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "An error occurred");
  }
  return response.json();
}

// Register a user
export async function registerUser(
  email: string,
  password: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  await handleApiResponse(response);
}

// Login a user
export async function loginUser(
  email: string,
  password: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: email,
      password,
      grant_type: "password",
      scope: "",
      client_id: "",
      client_secret: "",
    }),
  });

  const data = await handleApiResponse(response);

  // Store token and user info
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: data.user_id,
      username: email,
    })
  );
}

// Logout a user
export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Logout failed", error);
  } finally {
    // Always remove token and user info
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

// Get the current user
export async function getCurrentUser(): Promise<any> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) return null;

  try {
    const response = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error("Failed to fetch current user", error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

// Get the JWT token
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log("Retrieved token:", token ? "Token exists" : "No token");
  return token;
}
