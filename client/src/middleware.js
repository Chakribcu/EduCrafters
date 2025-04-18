/**
 * Clerk middleware for client-side route protection
 */
import { clerkMiddleware } from "@clerk/nextjs/server";

// This middleware will be executed for all client-side routes
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip static files
    '/((?!.*\\.|_next).*)',
    // Always run for API routes
    '/api/(.*)',
  ],
};