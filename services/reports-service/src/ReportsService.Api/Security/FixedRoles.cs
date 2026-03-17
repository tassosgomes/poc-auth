namespace ReportsService.Api.Security;

public static class FixedRoles
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.Ordinal)
    {
        "admin",
        "coordenador",
        "tecnico"
    };

    public static bool TryNormalize(string? role, out string normalizedRole)
    {
        normalizedRole = string.Empty;
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        var candidate = role.Trim().ToLowerInvariant();
        if (!AllowedRoles.Contains(candidate))
        {
            return false;
        }

        normalizedRole = candidate;
        return true;
    }
}