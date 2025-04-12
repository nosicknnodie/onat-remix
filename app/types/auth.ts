import { Lucia } from "lucia";

export interface IUserAttributes {
  email: string;
  name: string | null;
}

declare module "lucia" {
  interface DatabaseUserAttributes extends IUserAttributes {}
}
