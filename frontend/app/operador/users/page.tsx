import { Metadata } from "next"
import OperadorUsersClient from "./OperadorUsersClient"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Page() {
  return <OperadorUsersClient />
}
