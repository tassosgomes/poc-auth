using Microsoft.Extensions.Diagnostics.HealthChecks;

using ReportsService.Api.Security;

namespace ReportsService.Api.Health;

public sealed class JwksHealthCheck : IHealthCheck
{
    private readonly IJwksSigningKeyProvider _jwksSigningKeyProvider;

    public JwksHealthCheck(IJwksSigningKeyProvider jwksSigningKeyProvider)
    {
        _jwksSigningKeyProvider = jwksSigningKeyProvider;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var keys = await _jwksSigningKeyProvider.GetSigningKeysAsync(cancellationToken);
            if (keys.Count == 0)
            {
                return HealthCheckResult.Unhealthy("JWKS endpoint did not return any signing keys");
            }

            return HealthCheckResult.Healthy();
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("JWKS lookup failed", exception);
        }
    }
}