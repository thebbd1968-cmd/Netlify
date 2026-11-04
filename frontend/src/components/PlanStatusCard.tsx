import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
 * What the signed-in user is actually paying for.
 *
 * A user with no subscription is a normal, expected state — they still get the
 * whole dashboard. This card states plainly what they have (nothing yet) and
 * what a plan costs, with the two honest next steps: buy, or activate a key.
 * No trial, no invented limits.
 */
export default function PlanStatusCard() {
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.billing.subscription(),
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <p className="text-sm text-slate-400">Checking your plan...</p>
      </div>
    )
  }

  if (error) {
    const expired = error instanceof ApiError && error.status === 401
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Plan status unavailable</h2>
        <p className="text-sm text-slate-600">
          {expired ? 'Your session has expired. ' : 'We could not load your plan status. '}
          <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
            Sign in again
          </Link>
        </p>
      </div>
    )
  }

  const active = Boolean(subscription && subscription.status === 'active')

  if (active && subscription) {
    const name = PLAN_NAMES[subscription.plan_tier] || subscription.plan_tier
    const price = subscription.recurring_amount ?? PLAN_PRICES[subscription.plan_tier]
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {name} plan
              <span className="ml-3 inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 align-middle">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Active
              </span>
            </h2>
            <p className="text-sm text-slate-600">
              {price ? `$${price}/month, billed monthly through Gumroad.` : 'Billed monthly through Gumroad.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/activate"
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Activate another key
            </Link>
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Manage plan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">No active plan</h2>
          <p className="text-sm text-slate-600">
            You are signed in, but no subscription is attached to this account yet. Your plan
            status shows up here once you subscribe or activate a license key.
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Plans are monthly: Starter $29, Professional $79, Enterprise $199 — cancel any time,
            billed through Gumroad.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            to="/pricing"
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white text-center hover:bg-blue-700"
          >
            Choose a plan
          </Link>
          <Link
            to="/activate"
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 text-center hover:border-slate-400"
          >
            Already purchased? Activate
          </Link>
        </div>
      </div>
    </div>
  )
}
