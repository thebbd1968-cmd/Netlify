import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function NurturePage() {
  const { data: sequences, isLoading } = useQuery({
    queryKey: ['nurture-sequences'],
    queryFn: () => api.nurture.list(),
  })

  const { data: logs } = useQuery({
    queryKey: ['nurture-logs'],
    queryFn: () => api.nurture.logs(),
  })

  const { data: templates } = useQuery({
    queryKey: ['nurture-templates'],
    queryFn: () => api.nurture.templates(),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Auto-Nurture</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sequences */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Sequences</h2>

          {isLoading && <p className="text-slate-400">Loading...</p>}

          <div className="space-y-4">
            {sequences?.map((seq: any) => (
              <div key={seq.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{seq.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          seq.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {seq.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    {seq.description && (
                      <p className="text-sm text-slate-500 mt-1">{seq.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">Trigger:</span>
                    <span className="capitalize">{seq.trigger_event.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">Channel:</span>
                    <span className="uppercase">{seq.channel}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">Steps:</span>
                    <span>{Array.isArray(seq.steps) ? seq.steps.length : 0}</span>
                  </span>
                </div>

                {/* Steps preview */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-400 uppercase mb-2">Sequence Steps</p>
                  <div className="space-y-2">
                    {(typeof seq.steps === 'string' ? JSON.parse(seq.steps) : seq.steps)?.map((step: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {step.step}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {step.subject || 'No subject'}
                          </p>
                          <p className="text-xs text-slate-400">
                            Delay: {step.delay_days}d · Template: {step.template?.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {!isLoading && (!sequences || sequences.length === 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-400 mb-3">No nurture sequences yet</p>
                <p className="text-sm text-slate-400">
                  Create your first sequence to start automating follow-ups with Viktor AI.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {logs?.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{log.subject || 'Follow-up sent'}</p>
                    <p className="text-xs text-slate-400">
                      Step {log.step_number} · {log.channel}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      log.status === 'sent'
                        ? 'bg-blue-100 text-blue-700'
                        : log.status === 'opened'
                          ? 'bg-green-100 text-green-700'
                          : log.status === 'replied'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
              {(!logs || logs.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">No activity yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                🔄 Check triggers now
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                📋 View all logs
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                📝 Edit templates
              </button>
            </div>
          </div>

          {/* Default Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Default Templates</h2>
            <div className="space-y-2">
              {templates?.map((tpl: any, i: number) => (
                <div key={i} className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">{tpl.name}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {tpl.trigger.replace(/_/g, ' ')} · {tpl.channel} · {tpl.steps?.length || 0} steps
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}