import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

const stageColors: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700',
  showing: 'bg-blue-100 text-blue-700',
  offer: 'bg-amber-100 text-amber-700',
  under_contract: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
}

export default function DealsPage() {
  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.deals.list(),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deal Pipeline</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Deal
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {['lead', 'showing', 'offer', 'under_contract', 'closed'].map((stage) => (
          <div key={stage} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 capitalize">{stage.replace('_', ' ')}</h3>
              <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-full">
                {deals?.filter((d) => d.stage === stage && d.status === 'active').length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {deals
                ?.filter((d) => d.stage === stage && d.status === 'active')
                .map((deal) => (
                  <div key={deal.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <p className="font-medium text-sm text-slate-900">
                      {deal.offer_price
                        ? `$${deal.offer_price.toLocaleString()}`
                        : 'No offer'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          stageColors[deal.stage] || 'bg-slate-100'
                        }`}
                      >
                        {deal.stage.replace('_', ' ')}
                      </span>
                      {deal.buyer_side ? (
                        <span className="text-xs text-blue-500">Buyer</span>
                      ) : (
                        <span className="text-xs text-purple-500">Seller</span>
                      )}
                    </div>
                    {deal.commission_rate && (
                      <p className="text-xs text-slate-400 mt-1">
                        {deal.commission_rate}% commission
                      </p>
                    )}
                  </div>
                ))}
              {(!deals || deals.filter((d) => d.stage === stage && d.status === 'active').length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No deals</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isLoading && <p className="text-slate-400 mt-4">Loading deals...</p>}
    </div>
  )
}