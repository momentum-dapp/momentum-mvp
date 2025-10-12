import { formatCurrency, formatPercentage, truncateAddress, cn } from '@/lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatPercentage', () => {
    it('formats percentage correctly', () => {
      expect(formatPercentage(25.5)).toBe('25.50%')
      expect(formatPercentage(0)).toBe('0.00%')
      expect(formatPercentage(100)).toBe('100.00%')
    })
  })

  describe('truncateAddress', () => {
    it('truncates address correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      expect(truncateAddress(address)).toBe('0x1234...5678')
      expect(truncateAddress(address, 6)).toBe('0x123456...345678')
    })
  })

  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })
  })
})
