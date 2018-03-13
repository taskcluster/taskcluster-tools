import { fromNow } from 'taskcluster-client-web';
import { WebAuth } from 'auth0-js';
import UserSession from './UserSession';

export const webAuth = new WebAuth({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  audience: process.env.AUTH0_AUDIENCE,
  redirectUri: new URL('/login/auth0', window.location).href,
  responseType: process.env.AUTH0_RESPONSE_TYPE,
  scope: process.env.AUTH0_SCOPE
});

export function userSessionFromAuthResult(authResult) {
  return UserSession.fromOIDC({
    oidcProvider: process.env.OIDC_PROVIDER,
    accessToken: authResult.accessToken,
    fullName: authResult.idTokenPayload.nickname,
    picture: authResult.idTokenPayload.picture,
    oidcSubject: authResult.idTokenPayload.sub,
    // per https://wiki.mozilla.org/Security/Guidelines/OpenID_connect#Session_handling
    renewAfter: fromNow('15 minutes')
  });
}

export async function renew({ userSession, authController }) {
  if (
    !userSession ||
    userSession.type !== 'oidc' ||
    userSession.oidcProvider !== process.env.OIDC_PROVIDER
  ) {
    return;
  }

  return new Promise((accept, reject) =>
    webAuth.renewAuth({}, (err, authResult) => {
      if (err) {
        return reject(err);
      } else if (!authResult) {
        return reject(new Error('no authResult'));
      }

      authController.setUserSession(userSessionFromAuthResult(authResult));
      accept();
    })
  );
}
