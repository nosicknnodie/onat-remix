export function isMobile(request: Request): boolean {
  const userAgent = request.headers.get("user-agent");
  if (!userAgent) return false;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}
