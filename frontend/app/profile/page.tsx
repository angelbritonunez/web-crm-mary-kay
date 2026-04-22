import { Metadata } from "next"
import ProfileClient from "./ProfileClient"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ProfileClient />
}
