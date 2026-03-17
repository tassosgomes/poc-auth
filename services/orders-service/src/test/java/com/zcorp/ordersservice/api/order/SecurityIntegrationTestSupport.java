package com.zcorp.ordersservice.api.order;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

final class SecurityIntegrationTestSupport {

    private static final RSAKey RSA_KEY = generateRsaKey();

    private SecurityIntegrationTestSupport() {
    }

    static String jwksBody() {
        return new JWKSet(RSA_KEY.toPublicJWK()).toString();
    }

    static String createToken(String issuer, String audience, Object rolesClaim) {
        try {
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject("user-123")
                    .issuer(issuer)
                    .audience(audience)
                    .issueTime(java.util.Date.from(Instant.now().minusSeconds(5)))
                    .expirationTime(java.util.Date.from(Instant.now().plusSeconds(300)))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("ROLES", rolesClaim)
                    .claim("email", "user-123@example.com")
                    .build();

            SignedJWT signedJwt = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.RS256)
                            .keyID(RSA_KEY.getKeyID())
                            .type(JOSEObjectType.JWT)
                            .build(),
                    claimsSet);
            signedJwt.sign(new RSASSASigner((RSAPrivateKey) RSA_KEY.toPrivateKey()));
            return signedJwt.serialize();
        } catch (JOSEException exception) {
            throw new IllegalStateException("Unable to create JWT for tests", exception);
        }
    }

    static String createTokenWithClaims(String issuer, String audience, Map<String, Object> claims) {
        Object rolesClaim = claims.getOrDefault("ROLES", List.of("tecnico"));
        return createToken(issuer, audience, rolesClaim);
    }

    private static RSAKey generateRsaKey() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                    .privateKey((RSAPrivateKey) keyPair.getPrivate())
                    .keyID("test-key")
                    .build();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("RSA algorithm is not available", exception);
        }
    }
}