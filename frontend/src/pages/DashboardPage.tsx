import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function DashboardPage() {
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.deals.list(),
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.contacts.list(),
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.properties.list(),
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  const pipelineStages = deals?.reduce(
    (acc: Record<string, number>, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Deals" value={deals?.filter((d) => d.status === 'active').length ?? 0} color="blue" />
        <StatCard title="Contacts" value={contacts?.length ?? 0} color="green" />
        <StatCard title="Properties" value={properties?.length ?? 0} color="purple" />
        <StatCard title="Pending Tasks" value={tasks?.filter((t) => t.status !== 'done').length ?? 0} color="orange" />
      </div>

      {/* Pipeline Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pipeline Summary</h2>
        <div className="grid grid-cols-5 gap-3">
          {['lead', 'showing', 'offer', 'under_contract', 'closed'].map((stage) => (
            <div key={stage} className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-700">
                {pipelineStages?.[stage] || 0}
              </div>
              <div className="text-xs text-slate-500 capitalize mt-1">
                {stage.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions & Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Deals</h2>
          {dealsLoading ? (
            <p className="text-slate-400">Loading...</p>
          ) : deals?.length === 0 ? (
            <p className="text-slate-400">No deals yet</p>
          ) : (
            <div className="space-y-3">
              {deals?.slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {deal.offer_price ? `$${deal.offer_price.toLocaleString()}` : 'No offer yet'}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{deal.stage.replace('_', ' ')}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      deal.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {deal.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Tasks</h2>
          <div className="space-y-3">
            {tasks?.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      task.priority === 'urgent'
                        ? 'bg-red-500'
                        : task.priority === 'high'
                          ? 'bg-orange-500'
                          : task.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                    }`}
                  />
                  <p className="text-sm text-slate-900">{task.title}</p>
                </div>
                <span className="text-xs text-slate-400 capitalize">{task.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
