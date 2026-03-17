using System.ComponentModel.DataAnnotations;

namespace ReportsService.Api.Configuration;

public sealed class ReportsServiceOptions
{
    public const string SectionName = "ReportsService";

    [Required]
    public SecurityOptions Security { get; init; } = new();

    [Required]
    public AuthzOptions Authz { get; init; } = new();

    [Required]
    [MinLength(1)]
    public string RedisUrl { get; init; } = "redis://localhost:6379";

    public sealed class SecurityOptions
    {
        [Required]
        [MinLength(1)]
        public string IssuerUri { get; init; } = "http://localhost:18081/issuer";

        [Required]
        [MinLength(1)]
        public string JwkSetUri { get; init; } = "http://localhost:18081/.well-known/jwks.json";

        [Required]
        [MinLength(1)]
        public string Audience { get; init; } = "reports-service";

        [Required]
        [MinLength(1)]
        public string RolesClaim { get; init; } = "ROLES";

        public TimeSpan JwksCacheTtl { get; init; } = TimeSpan.FromMinutes(5);
    }

    public sealed class AuthzOptions
    {
        [Required]
        [MinLength(1)]
        public string RoleAccessKeyPrefix { get; init; } = "role_access:";

        public TimeSpan LocalCacheTtl { get; init; } = TimeSpan.FromSeconds(5);
    }
}