import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function PortfoliosPage() {
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.portfolios.list(),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Portfolios</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {portfolios?.map((portfolio) => (
          <div key={portfolio.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{portfolio.name}</h3>
                {portfolio.description && (
                  <p className="text-sm text-slate-500 mt-1">{portfolio.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Total Invested</p>
                <p className="text-lg font-bold text-slate-900">
                  ${portfolio.total_invested?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Total Equity</p>
                <p className="text-lg font-bold text-green-600">
                  ${portfolio.total_equity?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Monthly Income</p>
                <p className="text-lg font-bold text-green-600">
                  ${portfolio.monthly_income?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Monthly Expenses</p>
                <p className="text-lg font-bold text-red-500">
                  ${portfolio.monthly_expenses?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            {portfolio.monthly_income && portfolio.monthly_expenses && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Net Monthly Cash Flow</span>
                  <span
                    className={`text-lg font-bold ${
                      (portfolio.monthly_income - portfolio.monthly_expenses) >= 0
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    ${(portfolio.monthly_income - portfolio.monthly_expenses).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isLoading && <p className="text-slate-400 mt-4">Loading portfolios...</p>}
      {!isLoading && (!portfolios || portfolios.length === 0) && (
        <p className="text-slate-400 text-center py-8">No portfolios yet</p>
      )}
    </div>
  )
}