export interface IKakaoLocalType {
  address_name: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  distance: string;
  id: string;
  phone: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string;
  y: string;
}

type Lat = number;
type Lng = number;
export type Coordinates = [Lat, Lng];

export const INITIAL_CENTER: Coordinates = [37.5262411, 126.99289439];
