import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-300 mb-2">Welcome To <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            MomentumFI
          </span>
          </h1>
          <p className="text-gray-400">Sign in to access your AI-powered portfolio</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl",
            }
          }}
        />
      </div>
    </div>
  );
}
