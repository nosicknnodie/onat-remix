/* eslint-disable @typescript-eslint/no-explicit-any */
export async function parseRequestData(
  request: Request
): Promise<Record<string, any>> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // 이건 GET일 때만 동작
  if (request.method === "GET") return params;
  const contentType = request.headers.get("content-type") || "";

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value; // string | File
    });
    return data;
  } else {
    try {
      return await request.json(); // any
    } catch {
      return {};
    }
  }
}
