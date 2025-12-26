'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.50 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.35 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.88 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.12 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320.50 },
];

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(currencies[0]); // Default to USD
  const [exchangeRates, setExchangeRates] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      const found = currencies.find(c => c.code === savedCurrency);
      if (found) {
        setCurrency(found);
      }
    }
    setIsLoaded(true);
    
    // Fetch real-time exchange rates
    fetchExchangeRates();
    
    // Update rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Save currency to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('preferredCurrency', currency.code);
    }
  }, [currency, isLoaded]);

  // Fetch exchange rates from a free API
  async function fetchExchangeRates() {
    try {
      // Using exchangerate-api.com free tier (1500 requests/month)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (data && data.rates) {
        setExchangeRates(data.rates);
        console.log('✅ Exchange rates updated:', data.rates);
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using fallback rates:', error);
      // Use fallback rates from currencies array
    }
  }

  // Get current exchange rate for selected currency
  const getExchangeRate = () => {
    if (currency.code === 'USD') return 1;
    
    // Use real-time rate if available, otherwise use fallback
    if (exchangeRates && exchangeRates[currency.code]) {
      return exchangeRates[currency.code];
    }
    
    return currency.rate; // Fallback to static rate
  };

  const changeCurrency = (currencyCode) => {
    const found = currencies.find(c => c.code === currencyCode);
    if (found) {
      setCurrency(found);
    }
  };

  // Convert USD price to selected currency
  const convertPrice = (usdPrice) => {
    if (!usdPrice || usdPrice === 0) return 0;
    const rate = getExchangeRate();
    return usdPrice * rate;
  };

  const formatPrice = (usdPrice, options = {}) => {
    const {
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      showSymbol = true,
    } = options;

    // Convert USD to selected currency
    const convertedPrice = convertPrice(usdPrice);

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(convertedPrice);

    return showSymbol ? `${currency.symbol}${formatted}` : formatted;
  };

  const value = {
    currency,
    currencies,
    changeCurrency,
    formatPrice,
    convertPrice,
    exchangeRates,
    getExchangeRate,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

