import { useState, useEffect } from 'react'
import { Currency } from '../utils/currency'

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('/api/currencies')
        if (response.ok) {
          const data: Currency[] = await response.json()
          setCurrencies(data)
        } else {
          setError('Failed to fetch currencies')
        }
      } catch (err) {
        setError('Error fetching currencies')
        console.error('Error fetching currencies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrencies()
  }, [])

  return { currencies, loading, error }
}
