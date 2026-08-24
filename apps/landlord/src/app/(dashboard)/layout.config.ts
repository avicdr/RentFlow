// This config file applies to all pages in the (dashboard) route group.
// Since all pages require authentication (enforced by middleware) and rely
// on client-side data fetching, we force dynamic rendering for all of them.
export const dynamic = 'force-dynamic';
