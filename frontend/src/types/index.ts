// ─── API Types matching backend schemas ─────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: 'agent' | 'investor' | 'broker' | 'admin'
  firm_id?: string
  phone?: string
  company?: string
  is_active: boolean
  created_at: string
}

export interface Contact {
  id: string
  owner_id: string
  name: string
  email?: string
  phone?: string
  lead_source?: string
  lead_status: string
  property_of_interest?: string
  budget_min?: number
  budget_max?: number
  notes?: string
  last_contacted_at?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  county?: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  lot_size?: number
  year_built?: number
  list_price?: number
  estimated_value?: number
  purchase_price?: number
  monthly_rent?: number
  hoa_dues?: number
  cap_rate?: number
  cash_on_cash_return?: number
  roi_percent?: number
  status: string
  source?: string
  mls_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  user_id: string
  contact_id?: string
  property_id?: string
  stage: string
  offer_price?: number
  closing_price?: number
  commission_rate?: number
  commission_amount?: number
  buyer_side: boolean
  showing_date?: string
  offer_date?: string
  contract_date?: string
  closing_date?: string
  target_close_date?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  deal_id?: string
  contact_id?: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  completed_at?: string
  assigned_to?: string
  is_recurring: boolean
  recurring_interval?: string
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description?: string
  total_invested?: number
  total_equity?: number
  monthly_income?: number
  monthly_expenses?: number
  is_active: boolean
  created_at: string
  updated_at: string
}
