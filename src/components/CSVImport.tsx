import { useState, useRef } from 'react'
import { Button } from './ui/Button'

interface CSVImportProps {
  projectId: number
  onImportComplete: () => void
}

interface ImportResult {
  success: boolean
  imported_count: number
  total_rows: number
  errors?: string[]
}

const CSVImport = ({ projectId, onImportComplete }: CSVImportProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setIsUploading(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(
        `/api/time-entries/import?project_id=${projectId}&user_id=1`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const result: ImportResult = await response.json()
      setImportResult(result)

      if (result.success && result.imported_count > 0) {
        onImportComplete()
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        imported_count: 0,
        total_rows: 0,
        errors: ['Failed to upload file. Please try again.'],
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadTemplate = () => {
    const csvContent = [
      ['Date', 'Duration (hours)', 'Description', 'Billable'],
      ['2025-01-01', '2.5', 'Example task', 'true'],
      ['2025-01-02', '1.0', 'Another task', 'false'],
      ['2025-01-03', '3.0', '', 'true'],
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'time-entries-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button onClick={() => setShowImportDialog(true)} variant="secondary">
        Import CSV
      </Button>

      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Import Time Entries from CSV
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Upload a CSV file with the following format:
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                Date, Duration (hours), Description, Billable
                <br />
                2025-01-01, 2.5, Task description, true
              </div>
              <p className="text-xs text-gray-500 mt-2">
                • Only Date and Duration are required
                <br />
                • Start time will be set to 5:00 PM
                <br />
                • End time will be calculated based on duration
                <br />
                • Description defaults to "Imported time entry" if empty
                <br />• Billable defaults to true if empty
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              </div>
            )}

            {importResult && (
              <div className="mb-4">
                {importResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">
                      ✅ Successfully imported {importResult.imported_count} of{' '}
                      {importResult.total_rows} entries
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">❌ Import failed</p>
                  </div>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      Errors:
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>
                          • ... and {importResult.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={downloadTemplate}
                variant="secondary"
                className="flex-1"
              >
                Download Template
              </Button>
              <Button
                onClick={() => {
                  setShowImportDialog(false)
                  setImportResult(null)
                }}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { CSVImport }
