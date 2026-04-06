import { NextResponse } from "next/server"
import { getTenant } from "@/lib/tenant"

export async function GET() {
  const tenant = await getTenant()
  return NextResponse.json({
    appName: tenant?.appName ?? "DUPRUN"
  })
}