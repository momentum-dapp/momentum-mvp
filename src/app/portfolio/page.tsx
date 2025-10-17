import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import PortfolioClient from './portfolio-client';

export default async function PortfolioPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <PortfolioClient />;
}
