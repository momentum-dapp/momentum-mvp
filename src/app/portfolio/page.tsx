import PortfolioClient from './portfolio-client';

export default function PortfolioPage() {
  // Authentication is handled by middleware
  // User will be redirected to /sign-in if not authenticated
  return <PortfolioClient />;
}
