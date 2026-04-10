import { NextRequest } from "next/server";

import { proxyJson } from "@/lib/proxy";

export async function POST(request: NextRequest) {
  return proxyJson(request, "/api/trips/refine");
}
