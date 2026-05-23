import { makeRedirectUri } from "expo-auth-session";
import { getQueryParams } from "expo-auth-session/build/QueryParams";

export type AuthProviderName = "apple" | "google";

const APP_SCHEME = "animalcare";
const CALLBACK_PATH = "auth/callback";

export function makeAuthRedirectUri(next?: string) {
  const safeNext = normalizeReturnPath(next);

  return makeRedirectUri({
    path: CALLBACK_PATH,
    preferLocalhost: true,
    queryParams: safeNext ? { next: safeNext } : undefined,
    scheme: APP_SCHEME
  });
}

export function normalizeReturnPath(path?: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }
  return path;
}

export function getAuthRedirectParams(url: string) {
  const { errorCode, params } = getQueryParams(url);
  const error = params.error_description ?? params.error ?? errorCode;

  return {
    accessToken: params.access_token,
    code: params.code,
    error,
    next: normalizeReturnPath(params.next),
    refreshToken: params.refresh_token
  };
}
