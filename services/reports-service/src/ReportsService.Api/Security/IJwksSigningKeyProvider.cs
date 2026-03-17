using Microsoft.IdentityModel.Tokens;

namespace ReportsService.Api.Security;

public interface IJwksSigningKeyProvider
{
    IReadOnlyCollection<SecurityKey> GetSigningKeys();

    Task<IReadOnlyCollection<SecurityKey>> GetSigningKeysAsync(CancellationToken cancellationToken);
}