import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const res = NextResponse.next()

  // attach hostname to header so any server component can read it
  res.headers.set("x-tenant-domain", host)

  return res
}

export const config = {
  matcher: [
    // run on all routes except static files and next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}