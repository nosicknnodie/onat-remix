import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import UAParser from "ua-parser-js";

const appUserAgentRegEx =
  /APP_NAME\([inapp]+;[^0-9]*(search);[^0-9]*(\d+);[^0-9]*(\d+.\d+.\d+).*\)/gim;

const getAppInfo = (ua: string) => appUserAgentRegEx.exec(ua);

export const parseDeviceInfo = (ua: string) => {
  const parser = new UAParser(); // ua-parser-js
  parser.setUA(ua);
  const result = parser.getResult();

  const appMatchingData = getAppInfo(result.ua);
  const browser = parser.getBrowser();
  const isApp = appMatchingData ? appMatchingData[1] === "search" : false;
  const appVersion = appMatchingData ? appMatchingData[3] : "0.0.0";

  return {
    ...result.device,
    ...result.os,
    browserName: browser.name,
    isApp,
    appVersion,
  };
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Buffer = require("buffer/").Buffer;
const mimeTypes: { [key: string]: string } = {
  png: "image/png",
  gif: "image/gif",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  jpeg: "image/jpeg",
  pjpeg: "image/jpeg",
  pjp: "image/jpeg",
  jfif: "image/jpeg",
};

export const extTypes: { [key: string]: string } = {
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export function getImageMime(base64Encoded: string) {
  if (base64Encoded.startsWith("data:")) {
    const found = base64Encoded.match(/data:\S*;base64/g);
    return found?.[0].slice("data:".length, ";base64".length * -1);
  }

  const prefix = base64Encoded.slice(0, 60);
  const found = prefix.match(/(webp)|(png)|(gif)|(svg)|(jpg)|(jpeg)|(pjpeg)|(pjp)|(jfif)/gi);
  if (!found) {
    const hex = Buffer.from(base64Encoded, "base64").toString("hex");
    if (hex.startsWith("ffd8ff")) {
      return mimeTypes.jpeg;
    }
    return null;
  }

  const type = found[0].toLocaleLowerCase();
  return mimeTypes[type];
}
