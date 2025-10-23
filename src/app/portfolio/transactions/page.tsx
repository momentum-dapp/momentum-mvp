import TransactionHistoryClient from './transaction-history-client';

export default function TransactionHistoryPage() {
  // Authentication is handled by middleware
  // User will be redirected to /sign-in if not authenticated
  return <TransactionHistoryClient />;
}
