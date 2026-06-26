export type Client = {
  id: string
  name: string
  initials: string
}

export const MOCK_CLIENTS: Client[] = [
  { id: "jordans-lawn-care", name: "Jordan's Lawn Care", initials: "JL" },
  { id: "acme-corp", name: "Acme Corporation", initials: "AC" },
  { id: "northstar-llc", name: "Northstar LLC", initials: "NL" },
  { id: "bright-dental", name: "Bright Dental Group", initials: "BD" },
]

export const DEFAULT_CLIENT_ID = MOCK_CLIENTS[0].id

export function getClientById(id: string): Client | undefined {
  return MOCK_CLIENTS.find((client) => client.id === id)
}
