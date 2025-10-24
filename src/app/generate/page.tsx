import GenerateClient from './generate-client';

export default function GeneratePage() {
  // Authentication is handled by middleware
  // User will be redirected to /sign-in if not authenticated
  return <GenerateClient />;
}
