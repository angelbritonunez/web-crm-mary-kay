import { Metadata } from "next"
import FollowupsClient from "./FollowupsClient"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Page() {
  return <FollowupsClient />
}
