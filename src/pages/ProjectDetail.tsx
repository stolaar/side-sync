import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TimeEntry, Project } from '../types'
import { TimeEntryFormData } from '../schemas'
import { Button } from '../components/ui/Button'
import { CSVImport } from '../components/CSVImport'
import { TimeEntryEditForm } from '../components/TimeEntryEditForm'
import { ProjectForm } from '../components/ProjectForm'
import { useCurrencies } from '../hooks/useCurrencies'
import { formatHourlyRate } from '../utils/currency'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [billableFilter, setBillableFilter] = useState<
    'all' | 'billable' | 'non-billable'
  >('all')
  const [includePricing, setIncludePricing] = useState(true)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editingProject, setEditingProject] = useState(false)

  const { currencies } = useCurrencies()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch('/api/projects')
        const projects: Project[] = await response.json()
        const foundProject = projects.find((p) => p.id === parseInt(id || '0'))
        setProject(foundProject || null)
      } catch (error) {
        console.error('Error fetching project:', error)
      }
    }

    const fetchTimeEntries = async () => {
      try {
        const params = new URLSearchParams({ project_id: id || '' })
        if (dateFrom) params.append('date_from', dateFrom)
        if (dateTo) params.append('date_to', dateTo)
        if (billableFilter !== 'all') params.append('billable', billableFilter)

        const response = await fetch(
          `/api/time-entries/project?${params.toString()}`
        )
        const entries: TimeEntry[] = await response.json()
        setTimeEntries(entries || [])
      } catch (error) {
        console.error('Error fetching time entries:', error)
        setTimeEntries([])
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
      fetchTimeEntries()
    }
  }, [id, dateFrom, dateTo, billableFilter])

  const refreshTimeEntries = async () => {
    try {
      const params = new URLSearchParams({ project_id: id || '' })
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (billableFilter !== 'all') params.append('billable', billableFilter)

      const response = await fetch(
        `/api/time-entries/project?${params.toString()}`
      )
      const entries: TimeEntry[] = await response.json()
      setTimeEntries(entries || [])
    } catch (error) {
      console.error('Error fetching time entries:', error)
      setTimeEntries([])
    }
  }

  const toggleBillable = async (entryId: number, currentBillable: boolean) => {
    try {
      const response = await fetch(`/api/time-entries/billable?id=${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billable: !currentBillable }),
      })

      if (response.ok) {
        setTimeEntries((entries) =>
          entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, billable: !currentBillable }
              : entry
          )
        )
      }
    } catch (error) {
      console.error('Error updating billable status:', error)
    }
  }

  const totalHours = timeEntries.reduce((total, entry) => {
    return total + (entry.duration ? entry.duration / 3600 : 0)
  }, 0)

  const billableHours = timeEntries
    .filter((entry) => entry.billable)
    .reduce(
      (total, entry) => total + (entry.duration ? entry.duration / 3600 : 0),
      0
    )

  const exportCSVReport = () => {
    const csvContent = [
      ['Date', 'Description', 'Duration (hours)', 'Billable'],
      ...timeEntries.map((entry) => [
        new Date(entry.start_time).toLocaleDateString(),
        entry.description || 'No description',
        (entry.duration ? entry.duration / 3600 : 0).toFixed(2),
        entry.billable ? 'Yes' : 'No',
      ]),
      ['', '', '', ''],
      ['TOTALS', '', '', ''],
      ['Total Hours', '', totalHours.toFixed(2), ''],
      ['Billable Hours', '', billableHours.toFixed(2), ''],
      ['Non-Billable Hours', '', (totalHours - billableHours).toFixed(2), ''],
      ['Total Entries', '', timeEntries.length.toString(), ''],
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${project?.name || 'project'}-time-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPDFReport = () => {
    const params = new URLSearchParams({ project_id: id || '' })
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    if (billableFilter !== 'all') params.append('billable', billableFilter)
    if (!includePricing) params.append('include_pricing', 'false')

    const url = `/api/reports/pdf?${params.toString()}`
    window.open(url, '_blank')
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
  }

  const handleSaveEntry = async (data: TimeEntryFormData) => {
    if (!editingEntry) return

    try {
      const response = await fetch(
        `/api/time-entries/single?id=${editingEntry.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (response.ok) {
        setEditingEntry(null)
        refreshTimeEntries()
      } else {
        console.error('Failed to update time entry')
      }
    } catch (error) {
      console.error('Error updating time entry:', error)
    }
  }

  const handleDeleteEntry = async () => {
    if (!editingEntry) return

    if (confirm('Are you sure you want to delete this time entry?')) {
      try {
        const response = await fetch(
          `/api/time-entries/single?id=${editingEntry.id}`,
          {
            method: 'DELETE',
          }
        )

        if (response.ok) {
          setEditingEntry(null)
          refreshTimeEntries()
        } else {
          console.error('Failed to delete time entry')
        }
      } catch (error) {
        console.error('Error deleting time entry:', error)
      }
    }
  }

  const handleProjectUpdated = () => {
    setEditingProject(false)
    if (id) {
      const fetchProject = async () => {
        try {
          const response = await fetch('/api/projects')
          const projects: Project[] = await response.json()
          const foundProject = projects.find(
            (p) => p.id === parseInt(id || '0')
          )
          setProject(foundProject || null)
        } catch (error) {
          console.error('Error fetching project:', error)
        }
      }
      fetchProject()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">Project not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">{project.description}</p>
          {project.hourly_rate && (
            <p className="text-green-600 mt-2 font-medium">
              Hourly Rate:{' '}
              {formatHourlyRate(project.hourly_rate, 'EUR', currencies)}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setEditingProject(true)} variant="secondary">
            Edit Project
          </Button>
          <CSVImport
            projectId={parseInt(id || '0')}
            onImportComplete={refreshTimeEntries}
          />
          <Button onClick={exportPDFReport} variant="primary">
            Export PDF Report
          </Button>
          <Button onClick={exportCSVReport} variant="secondary">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billable Status
            </label>
            <select
              value={billableFilter}
              onChange={(e) =>
                setBillableFilter(
                  e.target.value as 'all' | 'billable' | 'non-billable'
                )
              }
              className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="billable">Billable Only</option>
              <option value="non-billable">Non-Billable Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Options
            </label>
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                id="includePricing"
                checked={includePricing}
                onChange={(e) => setIncludePricing(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includePricing"
                className="ml-2 text-sm text-gray-700"
              >
                Include pricing in reports
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Hours
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {totalHours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Billable Hours
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {billableHours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Time Entries
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {timeEntries.length}
          </p>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TimeEntryEditForm
              timeEntry={editingEntry}
              projects={[project].filter(Boolean) as Project[]}
              onSave={handleSaveEntry}
              onCancel={() => setEditingEntry(null)}
              onDelete={handleDeleteEntry}
            />
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ProjectForm
              project={project}
              onProjectCreated={handleProjectUpdated}
              onCancel={() => setEditingProject(false)}
            />
          </div>
        </div>
      )}

      {/* Time Entries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.length > 0 ? (
                timeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.start_time).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.duration
                        ? (entry.duration / 3600).toFixed(1)
                        : '0'}
                      h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.billable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entry.billable ? 'Billable' : 'Non-Billable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            toggleBillable(entry.id, entry.billable)
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          Toggle Billable
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No time entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export { ProjectDetail }
