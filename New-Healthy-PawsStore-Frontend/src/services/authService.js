export {
  getStoredAuthUser,
  logout,
  saveAuthSession,
  updateStoredAuthUser,
  verifyAuthSession,
} from "../api/authApi";
import { authApi } from "../api/authApi";

export function loginWithEmail({ email, password, remember }) {
  return authApi.login({ email, password, remember });
}

export function requestLoginOtp({ email }) {
  return authApi.requestLoginOtp({ email });
}

export function verifyLoginOtp({ otpToken, code, email, remember }) {
  return authApi.verifyLoginOtp({ otpToken, code, email, remember });
}

export function startSocialLogin(provider) {
  throw new Error(`${provider} login is not enabled for this backend yet.`);
}
