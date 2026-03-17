using System.Security.Claims;

using ReportsService.Api.Configuration;

namespace ReportsService.Api.Security;

public sealed class JwtClaimsAdapter
{
    private readonly ReportsServiceOptions _options;

    public JwtClaimsAdapter(ReportsServiceOptions options)
    {
        _options = options;
    }

    public IReadOnlyCollection<string> ExtractRoles(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var roles = new LinkedHashSet<string>();
        foreach (var claim in principal.Claims)
        {
            if (!IsRoleClaim(claim.Type))
            {
                continue;
            }

            if (FixedRoles.TryNormalize(claim.Value, out var normalizedRole))
            {
                roles.Add(normalizedRole);
            }
        }

        return roles.ToArray();
    }

    private bool IsRoleClaim(string claimType)
    {
        return string.Equals(claimType, _options.Security.RolesClaim, StringComparison.Ordinal)
            || string.Equals(claimType, "roles", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class LinkedHashSet<T>
    {
        private readonly HashSet<T> _items = [];
        private readonly List<T> _ordered = [];

        public void Add(T item)
        {
            if (_items.Add(item))
            {
                _ordered.Add(item);
            }
        }

        public T[] ToArray()
        {
            return _ordered.ToArray();
        }
    }
}