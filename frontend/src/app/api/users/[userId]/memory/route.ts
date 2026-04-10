import { proxyGet } from "@/lib/proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return proxyGet(`/api/users/${userId}/memory`);
}
