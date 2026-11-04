import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api/client'

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const PLAN_PRICES: Record<string, number> = {
  starter: 29,
  professional: 79,
  enterprise: 199,
}

/**
 * License activation for a signed-in customer.
 *
 * Gumroad delivers the purchase, the webhook attaches the subscription, and this
 * page is where the buyer pastes the license key from their receipt. All three
 * outcomes are shown plainly: activated, invalid key, or already active.
 */
export default function ActivatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    data: subscription,
    isLoading,
    error: subscriptionError,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.billing.subscription(),
  })

  const alreadyActive = Boolean(subscription && subscription.status === 'active')
  const planName = subscription
    ? PLAN_NAMES[subscription.plan_tier] || subscription.plan_tier
    : ''
  const planPrice = subscription
    ? subscription.recurring_amount ?? PLAN_PRICES[subscription.plan_tier]
    : undefined

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = licenseKey.trim()
    if (!key) {
      setError('Paste the license key from your Gumroad receipt first.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const result = await api.billing.verifyLicense(key)
      const activated = PLAN_NAMES[result.plan_tier] || result.plan_tier
      setSuccess(`License verified — your ${activated} plan is active. Taking you to the dashboard...`)
      await queryClient.invalidateQueries({ queryKey: ['subscription'] })
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(
          'That license key was not accepted. Check the key on your Gumroad receipt — it looks like a long string of letters and numbers — and paste it exactly as shown.'
        )
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Your session has expired. Sign in again and retry.')
      } else {
        setError('We could not verify that key right now. Please try again in a moment.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Activate your license</h1>
      <p className="text-slate-600 mb-6">
        Paste the license key from your Gumroad receipt to activate the plan you bought.
      </p>

      {/* Current plan status */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Current plan
        </h2>
        {isLoading ? (
          <p className="text-slate-400 text-sm">Checking your plan...</p>
        ) : subscriptionError ? (
          <p className="text-sm text-slate-600">
            We could not read your plan status.{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Sign in again
            </Link>
          </p>
        ) : alreadyActive ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Active
            </span>
            <p className="text-slate-900 font-semibold">
              {planName}
              {planPrice ? ` — $${planPrice}/month` : ''}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-slate-900 font-semibold">No active plan</p>
            <p className="text-sm text-slate-600 mt-1">
              Nothing is attached to this account yet. Paste a license key below, or{' '}
              <Link to="/pricing" className="text-blue-600 font-medium hover:text-blue-700">
                choose a plan
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {alreadyActive && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-4 mb-6">
          Your {planName} plan is already active on this account — you do not need to activate
          anything else.{' '}
          <Link to="/dashboard" className="font-semibold underline">
            Go to the dashboard
          </Link>
        </div>
      )}

      <form
        onSubmit={handleActivate}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <label className="block text-sm font-medium text-slate-700 mb-1">License key</label>
        <p className="text-xs text-slate-500 mb-3">
          {alreadyActive
            ? 'Activating a different key will replace the plan on this account.'
            : 'You will find it on the Gumroad receipt emailed to you after purchase.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Paste your license key..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Verifying...' : 'Activate'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}
        {success && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg p-3">{success}</p>
        )}
      </form>

      <p className="text-sm text-slate-500 mt-6">
        Do not have a key yet?{' '}
        <Link to="/pricing" className="text-blue-600 font-medium hover:text-blue-700">
          Choose a plan
        </Link>{' '}
        — plans start at $29/month.
      </p>
    </div>
  )
}
