import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Mock prices fallback (in case bot hasn't run yet or file doesn't exist)
const FALLBACK_PRICES = {
  BTC: 50000,
  ETH: 3000,
  WBTC: 50000,
  cbBTC: 50000,
  cbETH: 3000,
  USDC: 1.0,
  DAI: 1.0,
  AERO: 1.5,
  BRETT: 0.15,
  DEGEN: 0.01,
  TOSHI: 0.0001
};

export async function GET(request: NextRequest) {
  try {
    // Try to read prices from the AI Oracle Bot's output file
    const pricesPath = path.join(process.cwd(), 'contracts', 'ai-oracle-bot', 'token-prices.json');
    
    let prices = FALLBACK_PRICES;
    let timestamp = new Date();
    let source = 'fallback';
    
    try {
      if (fs.existsSync(pricesPath)) {
        const fileContent = fs.readFileSync(pricesPath, 'utf-8');
        const data = JSON.parse(fileContent);
        prices = data.prices || FALLBACK_PRICES;
        timestamp = new Date(data.timestamp);
        source = 'ai-oracle-bot';
      }
    } catch (error) {
      console.warn('Could not read token prices from file, using fallback:', error);
    }
    
    // Calculate age of price data
    const ageMinutes = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60));
    
    return NextResponse.json({
      success: true,
      prices,
      timestamp: timestamp.toISOString(),
      ageMinutes,
      source,
      stale: ageMinutes > 10, // Consider stale if older than 10 minutes
    });
  } catch (error) {
    console.error('Prices API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prices',
        prices: FALLBACK_PRICES,
        source: 'fallback'
      },
      { status: 500 }
    );
  }
}

