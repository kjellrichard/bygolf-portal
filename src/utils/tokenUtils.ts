/**
 * Decodes a JWT token and extracts its payload
 */
function decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null // Not a valid JWT format
    }
    
    const payload = parts[1]
    // Decode base64url
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token to check
 * @returns true if token is expired or invalid, false if valid and not expired
 */
export function isTokenExpired(token: string): boolean {
  if (!token || !token.trim()) {
    return true
  }

  const decoded = decodeJWT(token)
  
  if (!decoded) {
    // If it's not a JWT, we can't validate expiry
    // Return false to allow non-JWT tokens to work
    return false
  }

  // Check if token has expiry claim
  if (decoded.exp === undefined) {
    // No expiry claim, assume token is valid
    return false
  }

  // exp is in seconds since epoch, Date.now() is in milliseconds
  const expiryTime = decoded.exp * 1000
  const currentTime = Date.now()

  // Add 5 minute buffer to consider token expired slightly before actual expiry
  return currentTime >= expiryTime - 5 * 60 * 1000
}

/**
 * Gets the expiry date of a JWT token
 * @param token - The JWT token
 * @returns Expiry date or null if token doesn't have expiry or is invalid
 */
export function getTokenExpiry(token: string): Date | null {
  if (!token || !token.trim()) {
    return null
  }

  const decoded = decodeJWT(token)
  
  if (!decoded || decoded.exp === undefined) {
    return null
  }

  return new Date(decoded.exp * 1000)
}

