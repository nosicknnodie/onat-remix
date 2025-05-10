import { ActionFunctionArgs } from "@remix-run/node";
const convertObjectToString = (obj: Record<string, string | number>) => {
  const keyValuePairs = Object.keys(obj).map(
    (key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`,
  );
  return keyValuePairs.join("&");
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const query = formData.get("query") as string;
  const page = formData.get("page") as string | number;
  const params = {
    analyze_type: "similar",
    page: page ?? "1",
    size: "5",
    query,
  };
  const queryString = convertObjectToString(params);
  const reqUrl = ["https://dapi.kakao.com/v2/local/search/keyword.json", queryString].join("?");
  const authorization = ["KakaoAK", process.env.PUBLIC_MAP_KAKAO_REST_API_KEY].join(" ");
  const res = await fetch(reqUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      charset: "UTF-8",
      Authorization: authorization,
    },
  });
  return Response.json(await res.json());
};
