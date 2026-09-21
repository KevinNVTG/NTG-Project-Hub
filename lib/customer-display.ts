export type CustomerDisplay = {
  first_name?: string | null
  last_name?: string | null
  co_client_first_name?: string | null
  co_client_last_name?: string | null
  company_name?: string | null
}

export function individualName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(' ').trim()
}

export function customerDisplayName(customer: CustomerDisplay | null | undefined, fallback = 'Client') {
  if (!customer) return fallback
  if (customer.company_name) return customer.company_name
  const primary = individualName(customer.first_name, customer.last_name)
  const coClient = individualName(customer.co_client_first_name, customer.co_client_last_name)
  if (primary && coClient) return `${primary} & ${coClient}`
  return primary || coClient || fallback
}

export function customerIndividualNames(customer: CustomerDisplay | null | undefined) {
  if (!customer) return []
  return [
    individualName(customer.first_name, customer.last_name),
    individualName(customer.co_client_first_name, customer.co_client_last_name),
  ].filter(Boolean)
}
