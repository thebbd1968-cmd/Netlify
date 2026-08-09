import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface Plan {
  tier: string
  name: string
  price: number
  interval: string
  features: string[]
  gumroad_url: string
}

export default function PricingPage() {
  const [licenseKey, setLicenseKey] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  const plans: Plan[] = [
    {
      tier: 'starter',
      name: 'Starter',
      price: 29,
      interval: 'mo',
      gumroad_url: 'https://gumroad.com/l/douglas-re-starter',
      features: [
        '1 seat',
        'CRM with unlimited contacts',
        'Deal kanban board',
        'Property analysis engine',
        'Basic reporting dashboard',
      ],
    },
    {
      tier: 'professional',
      name: 'Professional',
      price: 79,
      interval: 'mo',
      gumroad_url: 'https://gumroad.com/l/douglas-re-pro',
      features: [
        '5 seats',
        'Everything in Starter',
        'Advanced analytics & reports',
        'Portfolio tracking',
        'AI-powered nurture sequences',
        'Priority email support',
      ],
    },
    {
      tier: 'enterprise',
      name: 'Enterprise',
      price: 199,
      interval: 'mo',
      gumroad_url: 'https://gumroad.com/l/douglas-re-enterprise',
      features: [
        'Unlimited seats',
        'Everything in Professional',
        'White-label / custom branding',
        'Priority phone & chat support',
        'Custom integrations (MLS, Zapier)',
        'Dedicated account manager',
      ],
    },
  ]

  const handleVerify = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter your license key')
      return
    }
    if (!token) {
      setError('Please log in first to verify your license')
      return
    }
    setVerifying(true)
    setError('')
    setSuccess('')
    try {
      const result = await api.billing.verifyLicense(licenseKey.trim())
      setSuccess(`License verified! Your ${result.plan_tier} plan is now active.`)
      setTimeout(() => navigate('/'), 2000)
    } catch (e: any) {
      setError(e.message || 'License verification failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Douglas Real Estate Systems</h1>
            <p className="text-slate-400 mt-1">Pricing Plans</p>
          </div>
          <div className="flex gap-3">
            {token ? (
              <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Dashboard
              </a>
            ) : (
              <>
                <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Log In
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Pricing cards */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="text-gray-500 mt-3 text-lg">Choose the plan that fits your real estate business</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isPopular = plan.tier === 'professional'
            return (
              <div
                key={plan.tier}
                className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 flex flex-col ${
                  isPopular ? 'border-blue-500 shadow-lg scale-[1.02]' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">per month, billed monthly</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.gumroad_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center py-3 rounded-xl font-semibold transition-colors text-sm ${
                    isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Subscribe
                </a>
              </div>
            )
          })}
        </div>
      </section>

      {/* License verification */}
      <section className="max-w-lg mx-auto px-6 pb-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Already purchased?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter your Gumroad license key to activate your plan.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Paste your license key..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? 'Verifying...' : 'Activate'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>Powered by Gumroad — secure payments and license management.</p>
      </footer>
    </div>
  )
}
