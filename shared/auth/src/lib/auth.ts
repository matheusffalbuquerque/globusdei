import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * Keycloak specific JWKS Client.
 * Automatically fetches the public keys from Keycloak to verify inbound JWT signatures dynamically.
 */
const client = jwksClient({
  jwksUri: process.env['KEYCLOAK_JWKS_URI'] || 'http://localhost:8080/realms/globusdei/protocol/openid-connect/certs',
});

/**
 * Retrieves the signing key from Keycloak using the Key ID (kid) found in the jwt header.
 */
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

/**
 * Verifies a Keycloak JWT Bearer Token strictly against the JWKS endpoint.
 * Ensures the token hasn't been tampered with and is issued by our Keycloak instance.
 * @param token - The raw Bearer token retrieved from the Authorization header.
 * @returns A promise resolving to the decoded full token payload.
 */
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

/**
 * Validates if the decoded Keycloak token possesses a specific realm role necessary for authorization constraints.
 * Mapped specifically to the structured format of Keycloak 24.
 * @param decodedToken - The validated payload of the token.
 * @param role - The required role the user must have (e.g., 'administrador').
 * @returns A boolean representing authorization success.
 */
export const hasRole = (decodedToken: any, role: string): boolean => {
  const roles = decodedToken?.realm_access?.roles || [];
  return roles.includes(role);
};
