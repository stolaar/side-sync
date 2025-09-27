import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ProjectForm } from '../components/ProjectForm'
import { TimeEntryForm } from '../components/TimeEntryForm'
import { Button } from '../components/ui/Button'
import { Project } from '../types'
import { useUsers } from '../hooks/useUsers'
import { useProjects } from '../hooks/useProjects'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useCurrencies } from '../hooks/useCurrencies'
import { formatHourlyRate } from '../utils/currency'

const Dashboard = () => {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const { data: users = [], isLoading: usersLoading } = useUsers()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: timeEntries = [], isLoading: timeEntriesLoading } =
    useTimeEntries()
  const { currencies } = useCurrencies()

  const loading = usersLoading || projectsLoading || timeEntriesLoading

  const handleProjectCreated = () => {
    setShowProjectForm(false)
    setEditingProject(null)
  }

  const handleTimeEntryCreated = () => {
    setShowTimeEntryForm(false)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectForm(false)
  }

  const handleCancelEdit = () => {
    setEditingProject(null)
    setShowProjectForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex space-x-3">
          <Button onClick={() => setShowProjectForm(true)} variant="primary">
            New Project
          </Button>
          <Button onClick={() => setShowTimeEntryForm(true)} variant="primary">
            Add Time Entry
          </Button>
        </div>
      </div>

      {showProjectForm && (
        <div className="mb-8">
          <ProjectForm
            onProjectCreated={handleProjectCreated}
            onCancel={() => setShowProjectForm(false)}
          />
        </div>
      )}

      {editingProject && (
        <div className="mb-8">
          <ProjectForm
            project={editingProject}
            onProjectCreated={handleProjectCreated}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {showTimeEntryForm && (
        <div className="mb-8">
          <TimeEntryForm
            projects={projects}
            onTimeEntryCreated={handleTimeEntryCreated}
            onCancel={() => setShowTimeEntryForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {users?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {projects?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Time Entries
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {timeEntries?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Projects
            </h3>
          </div>
          <div className="p-6">
            {projects && projects.length > 0 ? (
              <div className="space-y-4">
                {projects
                  .slice(0, 5)
                  .filter((project) => project && project.name)
                  .map((project) => (
                    <div
                      key={project.id}
                      className="border-l-4 border-blue-500 pl-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <Link to={`/project/${project.id}`} className="flex-1">
                          <h4 className="font-medium text-gray-900 hover:text-blue-600">
                            {project.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {project.description || 'No description'}
                          </p>
                          {project.hourly_rate && (
                            <p className="text-xs text-green-600 mt-1">
                              Rate:{' '}
                              {formatHourlyRate(
                                project.hourly_rate,
                                'EUR',
                                currencies
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created:{' '}
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleEditProject(project)
                          }}
                          className="ml-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit project"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No projects found
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Time Entries
            </h3>
          </div>
          <div className="p-6">
            {timeEntries && timeEntries.length > 0 ? (
              <div className="space-y-4">
                {timeEntries
                  .slice(0, 5)
                  .filter((entry) => entry && entry.id)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="border-l-4 border-green-500 pl-4"
                    >
                      <h4 className="font-medium text-gray-900">
                        {entry.description || 'No description'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Duration:{' '}
                        {entry.duration ? Math.floor(entry.duration / 3600) : 0}
                        h{' '}
                        {entry.duration
                          ? Math.floor((entry.duration % 3600) / 60)
                          : 0}
                        m
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Started: {new Date(entry.start_time).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No time entries found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Dashboard }
