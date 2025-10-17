import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome To <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            MomentumFI
          </span>
          </h1>
          <p className="text-gray-300">Sign in to access your AI-powered portfolio</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl bg-white/90 backdrop-blur-sm",
            }
          }}
          redirectUrl="/portfolio"
        />
      </div>
    </div>
  );
}
