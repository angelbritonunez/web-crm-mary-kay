import { Metadata } from "next"
import ClientsClient from "./ClientsClient"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ClientsClient />
}
