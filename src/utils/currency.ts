export interface Currency {
  code: string
  symbol: string
  name: string
}

export const formatCurrency = (
  amount: number,
  currencyCode: string,
  currencies: Currency[]
): string => {
  const currency = currencies.find((c) => c.code === currencyCode)
  const symbol = currency?.symbol || currencyCode

  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formattedAmount}`
}

export const getCurrencySymbol = (
  currencyCode: string,
  currencies: Currency[]
): string => {
  const currency = currencies.find((c) => c.code === currencyCode)
  return currency?.symbol || currencyCode
}

export const formatHourlyRate = (
  rate: number,
  currencyCode: string,
  currencies: Currency[]
): string => {
  const formattedAmount = formatCurrency(rate, currencyCode, currencies)
  return `${formattedAmount}/hr`
}
