import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  // Authentication is handled by middleware
  // User will be redirected to /sign-in if not authenticated
  return <DashboardClient />;
}
