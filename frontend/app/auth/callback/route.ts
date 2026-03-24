import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)

  // 👉 simplemente redirige al login
  return NextResponse.redirect(`${origin}/login?confirmed=1`)
}