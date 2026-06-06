import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

const statusColors: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-500',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
}

export default function TasksPage() {
  const queryClient = useQueryClient()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.tasks.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Task
        </button>
      </div>

      {/* Kanban board for tasks */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {['backlog', 'todo', 'in_progress', 'review', 'done'].map((status) => (
          <div key={status} className="bg-slate-50 rounded-xl p-4 min-h-[200px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 capitalize">
                {status.replace('_', ' ')}
              </h3>
              <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-full">
                {tasks?.filter((t) => t.status === status).length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {tasks
                ?.filter((t) => t.status === status)
                .map((task) => (
                  <div key={task.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          priorityColors[task.priority] || 'bg-slate-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 break-words">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              statusColors[task.status] || 'bg-slate-100'
                            }`}
                          >
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-slate-400">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {status !== 'done' && (
                      <button
                        onClick={() => completeMutation.mutate(task.id)}
                        className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        ✓ Mark complete
                      </button>
                    )}
                  </div>
                ))}
              {(!tasks || tasks.filter((t) => t.status === status).length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isLoading && <p className="text-slate-400 mt-4">Loading tasks...</p>}
    </div>
  )
}