import { Metadata } from "next"
import MetricsClient from "./MetricsClient"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Page() {
  return <MetricsClient />
}
