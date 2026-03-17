using System.Collections;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;

using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

using ReportsService.Api.Configuration;

namespace ReportsService.Api.Security;

public sealed class RolesClaimValidator
{
    private readonly ReportsServiceOptions _options;

    public RolesClaimValidator(ReportsServiceOptions options)
    {
        _options = options;
    }

    public bool IsValid(SecurityToken securityToken)
    {
        if (securityToken is JwtSecurityToken jwtSecurityToken)
        {
            if (!TryGetRolesClaim(jwtSecurityToken.Payload, out var jwtClaimValue))
            {
                return true;
            }

            return IsEnumerableOfStrings(jwtClaimValue);
        }

        if (securityToken is JsonWebToken jsonWebToken)
        {
            if (!TryGetRolesClaim(jsonWebToken, out var jsonClaimValue))
            {
                return true;
            }

            return IsEnumerableOfStrings(jsonClaimValue);
        }

        return false;
    }

    private bool TryGetRolesClaim(JwtPayload payload, out object? claimValue)
    {
        if (payload.TryGetValue(_options.Security.RolesClaim, out claimValue))
        {
            return true;
        }

        return payload.TryGetValue("roles", out claimValue);
    }

    private bool TryGetRolesClaim(JsonWebToken token, out object? claimValue)
    {
        if (token.TryGetPayloadValue(_options.Security.RolesClaim, out claimValue))
        {
            return true;
        }

        return token.TryGetPayloadValue("roles", out claimValue);
    }

    private static bool IsEnumerableOfStrings(object? claimValue)
    {
        if (claimValue is null)
        {
            return true;
        }

        if (claimValue is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.Array => jsonElement.EnumerateArray().All(element => element.ValueKind == JsonValueKind.String),
                JsonValueKind.String => false,
                _ => false
            };
        }

        if (claimValue is string)
        {
            return false;
        }

        if (claimValue is not IEnumerable enumerable)
        {
            return false;
        }

        foreach (var value in enumerable)
        {
            if (value is not string)
            {
                return false;
            }
        }

        return true;
    }
}