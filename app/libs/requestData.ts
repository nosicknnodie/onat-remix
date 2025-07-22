export async function parseRequestData(
  request: Request
): Promise<Record<string, any>> {
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
    return await request.json(); // any
  }
}
