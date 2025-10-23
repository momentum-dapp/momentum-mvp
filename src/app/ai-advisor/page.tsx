import AdvisorClient from './advisor-client';

export default function AIAdvisorPage() {
  // Authentication is handled by middleware
  // User will be redirected to /sign-in if not authenticated
  return <AdvisorClient />;
}