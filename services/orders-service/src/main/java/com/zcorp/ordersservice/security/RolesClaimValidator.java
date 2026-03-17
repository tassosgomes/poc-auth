package com.zcorp.ordersservice.security;

import java.util.Objects;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class RolesClaimValidator implements OAuth2TokenValidator<Jwt> {

    private final String rolesClaimName;

    public RolesClaimValidator(String rolesClaimName) {
        this.rolesClaimName = Objects.requireNonNull(rolesClaimName, "rolesClaimName must not be null");
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        Object claim = token.getClaims().get(rolesClaimName);
        if (claim == null) {
            claim = token.getClaims().get("roles");
        }

        if (claim == null) {
            return OAuth2TokenValidatorResult.success();
        }

        if (!(claim instanceof Iterable<?> iterable)) {
            return invalidRolesClaim();
        }

        for (Object role : iterable) {
            if (!(role instanceof String)) {
                return invalidRolesClaim();
            }
        }

        return OAuth2TokenValidatorResult.success();
    }

    private OAuth2TokenValidatorResult invalidRolesClaim() {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error(
                "invalid_token",
                "The ROLES claim must be an array of strings",
                null));
    }
}