import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingsSchema, SettingsFormData } from '../schemas'
import { Settings } from '../types'
import { FormInput } from '../components/form/FormInput'
import { FormSelect } from '../components/form/FormSelect'
import { Button } from '../components/ui/Button'
import { useCurrencies } from '../hooks/useCurrencies'
import { formatCurrency } from '../utils/currency'

const SettingsPage = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { currencies } = useCurrencies()

  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      default_hourly_rate: undefined,
      currency: 'EUR',
    },
  })

  const { handleSubmit, reset } = methods

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data: Settings = await response.json()
          setSettings(data)
          reset({
            default_hourly_rate: data.default_hourly_rate || undefined,
            currency: data.currency || 'EUR',
          })
        } else {
          reset({
            default_hourly_rate: undefined,
            currency: 'EUR',
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        reset({
          default_hourly_rate: undefined,
          currency: 'EUR',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [reset])

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          default_hourly_rate: data.default_hourly_rate || null,
          currency: data.currency,
        }),
      })

      if (response.ok) {
        const updatedSettings: Settings = await response.json()
        setSettings(updatedSettings)
        alert('Settings saved successfully!')
      } else {
        console.error('Failed to save settings')
        alert('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('An error occurred while saving settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your global application settings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Global Hourly Rate Settings
        </h2>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="default_hourly_rate"
                label="Default Hourly Rate"
                type="number"
                placeholder="Enter default hourly rate"
              />

              <FormSelect
                name="currency"
                label="Currency"
                placeholder="Select currency"
                required
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> The default hourly rate will be used
                    for projects that don't have a specific rate set. You can
                    override this rate for individual projects.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="min-w-32">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Settings Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700">
              Default Hourly Rate
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {settings?.default_hourly_rate && settings?.currency
                ? formatCurrency(
                    settings.default_hourly_rate,
                    settings.currency,
                    currencies
                  ) + '/hr'
                : 'Not set'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700">Currency</h3>
            <p className="text-lg font-semibold text-gray-900">
              {settings?.currency || 'EUR'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SettingsPage }
