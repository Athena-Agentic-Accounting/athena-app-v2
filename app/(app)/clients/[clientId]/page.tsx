import { ClientDetailView } from "@/components/clients/client-detail-view"

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params
  return <ClientDetailView clientId={clientId} />
}
