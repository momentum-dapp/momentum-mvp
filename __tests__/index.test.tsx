import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByText('AI-Powered Portfolio Management')
    expect(heading).toBeInTheDocument()
  })

  it('renders the get started button', () => {
    render(<Home />)
    
    const button = screen.getByText('Get Started')
    expect(button).toBeInTheDocument()
  })

  it('displays feature cards', () => {
    render(<Home />)
    
    expect(screen.getByText('Secure Vaults')).toBeInTheDocument()
    expect(screen.getByText('AI-Driven')).toBeInTheDocument()
    expect(screen.getByText('Auto-Rebalancing')).toBeInTheDocument()
  })
})
