/**
 * An array of routes that are accessible to the public
 * These routed do not reauqire authentication
 * @types {string[]}
 */
export const publicRoutes = ["/", "/profile"];

/* An array of routes that are used for authentication
 * These routed will redirec t logged in users to /settings
 * @types {string[]}
 */
export const authRoutes = ["/auth/login", "/auth/register"];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used
 * for API authentication purposes
 * @types {string}
 */
export const apiAuthPrefix = "/api/auth/login";

/**
 * The default redirect path after logging
 */
export const DEFAULT_LOGIN_REDIRECT = "/";
