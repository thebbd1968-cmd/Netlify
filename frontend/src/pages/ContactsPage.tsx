import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function ContactsPage() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.contacts.list(),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add Contact
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lead Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Budget
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts?.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-600">{contact.email}</p>
                  {contact.phone && (
                    <p className="text-xs text-slate-400">{contact.phone}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full capitalize">
                    {contact.lead_source?.replace('_', ' ') || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      contact.lead_status === 'hot'
                        ? 'bg-red-100 text-red-700'
                        : contact.lead_status === 'new'
                          ? 'bg-blue-100 text-blue-700'
                          : contact.lead_status === 'qualifying'
                            ? 'bg-amber-100 text-amber-700'
                            : contact.lead_status === 'nurture'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {contact.lead_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {contact.budget_min && contact.budget_max
                    ? `$${contact.budget_min.toLocaleString()} - $${contact.budget_max.toLocaleString()}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="p-4 text-slate-400">Loading contacts...</p>}
        {!isLoading && (!contacts || contacts.length === 0) && (
          <p className="p-4 text-slate-400 text-center">No contacts yet</p>
        )}
      </div>
    </div>
  )
}