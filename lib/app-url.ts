const DEFAULT_PUBLIC_APP_URL = "https://renttruth.io";

export function getAppUrl() {
  const configuredUrl =
    process.env.APP_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_PUBLIC_APP_URL;
  const normalizedUrl = configuredUrl.replace(/\/+$/, "");
  const parsedUrl = new URL(normalizedUrl);
  const isLocalhost =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname === "::1";

  if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:" && !isLocalhost) {
    throw new Error(
      "RentTruth production URL must use HTTPS. Set NEXT_PUBLIC_APP_URL or APP_PUBLIC_URL to an https:// domain.",
    );
  }

  return normalizedUrl;
}

export function getAppUrlObject() {
  return new URL(getAppUrl());
}

export function getAbsoluteAppUrl(path = "/") {
  return new URL(path, `${getAppUrl()}/`).toString();
}
