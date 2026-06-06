import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useState } from 'react'

export default function PropertiesPage() {
  const queryClient = useQueryClient()
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.properties.list(),
  })

  const analyzeMutation = useMutation({
    mutationFn: (id: string) => api.properties.analyze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      setAnalyzingId(null)
    },
  })

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id)
    analyzeMutation.mutate(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties?.map((prop) => (
          <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {prop.street_address}
                </h3>
                <p className="text-sm text-slate-500">
                  {prop.city}, {prop.state} {prop.zip_code}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  prop.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {prop.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {prop.bedrooms && (
                <div>
                  <span className="text-slate-400">Beds</span>
                  <p className="font-medium">{prop.bedrooms}</p>
                </div>
              )}
              {prop.bathrooms && (
                <div>
                  <span className="text-slate-400">Baths</span>
                  <p className="font-medium">{prop.bathrooms}</p>
                </div>
              )}
              {prop.square_feet && (
                <div>
                  <span className="text-slate-400">Sq Ft</span>
                  <p className="font-medium">{prop.square_feet.toLocaleString()}</p>
                </div>
              )}
              {prop.property_type && (
                <div>
                  <span className="text-slate-400">Type</span>
                  <p className="font-medium capitalize">{prop.property_type.replace('_', ' ')}</p>
                </div>
              )}
            </div>

            {/* Price info */}
            <div className="border-t border-slate-100 pt-3 space-y-1">
              {prop.list_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">List Price</span>
                  <span className="font-medium">${prop.list_price.toLocaleString()}</span>
                </div>
              )}
              {prop.monthly_rent && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Monthly Rent</span>
                  <span className="font-medium">${prop.monthly_rent.toLocaleString()}</span>
                </div>
              )}
              {prop.cap_rate && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cap Rate</span>
                  <span className="font-medium text-green-600">{prop.cap_rate}%</span>
                </div>
              )}
              {prop.cash_on_cash_return && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cash-on-Cash</span>
                  <span className="font-medium text-green-600">{prop.cash_on_cash_return}%</span>
                </div>
              )}
            </div>

            {/* Analyze button */}
            {!prop.cap_rate && prop.monthly_rent && (
              <button
                onClick={() => handleAnalyze(prop.id)}
                disabled={analyzingId === prop.id}
                className="mt-3 w-full text-sm bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {analyzingId === prop.id ? 'Analyzing...' : 'Analyze Property'}
              </button>
            )}
          </div>
        ))}
      </div>

      {isLoading && <p className="text-slate-400">Loading properties...</p>}
      {!isLoading && (!properties || properties.length === 0) && (
        <p className="text-slate-400 text-center py-8">No properties yet</p>
      )}
    </div>
  )
}