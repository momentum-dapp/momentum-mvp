// Advanced Configuration for AI Oracle Bot Conditional Updates
module.exports = {
    // Basic Settings
    UPDATE_INTERVAL: '*/5 * * * *',  // Every 5 minutes
    PRICE_CHANGE_THRESHOLD: 5,       // 5% price change threshold
    MAX_GAS_PRICE: 0.01,             // 0.01 gwei maximum (Base Sepolia)
    MIN_UPDATE_INTERVAL: 15 * 60,    // 15 minutes minimum between updates

    // Advanced Conditional Logic
    CONDITIONAL_UPDATES: {
        // Gas Price Optimization
        GAS_PRICE: {
            ENABLED: true,
            DYNAMIC_THRESHOLD: true,      // Use dynamic threshold based on history
            PERCENTILE_MULTIPLIER: 2,     // Threshold = 10th percentile * 2
            MAX_STATIC_THRESHOLD: 0.01,   // Maximum static threshold
            HISTORY_SIZE: 100,            // Number of gas prices to track
        },

        // Price Change Optimization
        PRICE_CHANGE: {
            ENABLED: true,
            DYNAMIC_THRESHOLD: true,      // Adjust threshold based on volatility
            VOLATILITY_FACTOR: 10,        // Threshold = max(static, volatility/10)
            MIN_THRESHOLD: 2,             // Minimum threshold percentage
            MAX_THRESHOLD: 20,            // Maximum threshold percentage
        },

        // Market Volatility Consideration
        VOLATILITY: {
            ENABLED: true,
            HIGH_VOLATILITY_THRESHOLD: 50,    // High volatility threshold
            MEDIUM_VOLATILITY_THRESHOLD: 25,  // Medium volatility threshold
            VOLATILITY_MULTIPLIER: 0.1,       // Threshold multiplier for volatility
        },

        // Force Update Logic
        FORCE_UPDATE: {
            ENABLED: true,
            MAX_HOURS_WITHOUT_UPDATE: 2,      // Force update after 2 hours
            EMERGENCY_THRESHOLD: 10,          // Force update on 10%+ price change
        },

        // Error Handling
        ERROR_HANDLING: {
            MAX_CONSECUTIVE_ERRORS: 5,        // Stop after 5 consecutive errors
            RETRY_DELAY: 5 * 60 * 1000,       // 5 minutes between retries
            FALLBACK_UPDATE: true,            // Always update on error
        }
    },

    // Network-Specific Settings
    NETWORKS: {
        'base-sepolia': {
            RPC_URL: 'https://sepolia.base.org',
            GAS_PRICE_MULTIPLIER: 1.0,        // Base gas price multiplier
            EXPECTED_GAS_PRICE: 0.005,        // Expected gas price in gwei
            MAX_GAS_PRICE: 0.01,              // Maximum acceptable gas price
        },
        'sepolia': {
            RPC_URL: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
            GAS_PRICE_MULTIPLIER: 1.0,
            EXPECTED_GAS_PRICE: 2.0,
            MAX_GAS_PRICE: 5.0,
        },
        'mumbai': {
            RPC_URL: 'https://rpc-mumbai.maticvigil.com/',
            GAS_PRICE_MULTIPLIER: 1.0,
            EXPECTED_GAS_PRICE: 0.1,
            MAX_GAS_PRICE: 0.5,
        }
    },

    // Logging Configuration
    LOGGING: {
        LEVEL: 'INFO',                        // DEBUG, INFO, WARN, ERROR
        DETAILED_SKIP_REASONS: true,          // Log detailed skip reasons
        GAS_PRICE_HISTORY: true,              // Track gas price history
        PRICE_CHANGE_HISTORY: true,           // Track price change history
        PERFORMANCE_METRICS: true,            // Track performance metrics
    },

    // Monitoring and Alerts
    MONITORING: {
        STATUS_REPORT_INTERVAL: '0 * * * *',  // Every hour
        ALERT_ON_HIGH_GAS: true,              // Alert when gas prices are high
        ALERT_ON_ERRORS: true,                // Alert on consecutive errors
        ALERT_ON_LONG_SKIPS: true,            // Alert when skipping too many updates
        MAX_SKIPS_BEFORE_ALERT: 10,           // Alert after 10 consecutive skips
    },

    // Performance Optimization
    PERFORMANCE: {
        BATCH_SIZE: 1,                        // Number of updates to batch
        PARALLEL_UPDATES: false,              // Enable parallel updates
        CACHE_DURATION: 5 * 60 * 1000,       // Cache duration in milliseconds
        MAX_RETRIES: 3,                       // Maximum retries for failed updates
    }
};

// Helper functions for configuration
module.exports.getNetworkConfig = (networkName) => {
    return module.exports.NETWORKS[networkName] || module.exports.NETWORKS['base-sepolia'];
};

module.exports.shouldUseDynamicThreshold = (type) => {
    return module.exports.CONDITIONAL_UPDATES[type]?.DYNAMIC_THRESHOLD || false;
};

module.exports.getThreshold = (type, baseValue, volatility = 0) => {
    const config = module.exports.CONDITIONAL_UPDATES[type];
    if (!config || !config.DYNAMIC_THRESHOLD) {
        return baseValue;
    }

    let threshold = baseValue;
    
    if (type === 'PRICE_CHANGE' && volatility > 0) {
        threshold = Math.max(
            config.MIN_THRESHOLD,
            Math.min(config.MAX_THRESHOLD, volatility / config.VOLATILITY_FACTOR)
        );
    }
    
    return threshold;
};

module.exports.isForceUpdateRequired = (hoursSinceLastUpdate, priceChange) => {
    const config = module.exports.CONDITIONAL_UPDATES.FORCE_UPDATE;
    if (!config.ENABLED) return false;
    
    return hoursSinceLastUpdate > config.MAX_HOURS_WITHOUT_UPDATE ||
           priceChange > config.EMERGENCY_THRESHOLD;
};
