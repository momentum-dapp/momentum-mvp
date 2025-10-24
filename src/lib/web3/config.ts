import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { createStorage } from 'wagmi'

export const wagmiConfig = createConfig({
  connectors: [injected()],
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
  },
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  ssr: true,
})

export const SUPPORTED_CHAINS = [baseSepolia, base] as const
