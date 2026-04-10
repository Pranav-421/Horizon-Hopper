import { NextRequest } from "next/server";

import { proxyJson } from "@/lib/proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return proxyJson(request, `/api/users/${userId}/feedback`);
}
