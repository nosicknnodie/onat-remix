export async function searchKeyword({
  query,
  page,
  analyze_type = "similar",
  size = 5,
}: {
  query: string;
  page?: string | number | null;
  analyze_type?: string;
  size?: number;
}) {
  const params = new URLSearchParams();
  params.set("analyze_type", analyze_type);
  params.set("size", String(size));
  params.set("query", query);
  if (page) params.set("page", String(page));

  const reqUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`;
  const authorization = ["KakaoAK", process.env.PUBLIC_MAP_KAKAO_REST_API_KEY].join(" ");
  const res = await fetch(reqUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      charset: "UTF-8",
      Authorization: authorization,
    },
  });
  return res.json();
}
