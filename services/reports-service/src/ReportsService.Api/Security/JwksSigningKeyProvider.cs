using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

using ReportsService.Api.Configuration;

namespace ReportsService.Api.Security;

public sealed class JwksSigningKeyProvider : IJwksSigningKeyProvider
{
    private const string CacheKey = "jwks-signing-keys";

    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _memoryCache;
    private readonly ReportsServiceOptions _options;
    private readonly ILogger<JwksSigningKeyProvider> _logger;

    public JwksSigningKeyProvider(
        HttpClient httpClient,
        IMemoryCache memoryCache,
        ReportsServiceOptions options,
        ILogger<JwksSigningKeyProvider> logger)
    {
        _httpClient = httpClient;
        _memoryCache = memoryCache;
        _options = options;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(5);
    }

    public IReadOnlyCollection<SecurityKey> GetSigningKeys()
    {
        return GetSigningKeysAsync(CancellationToken.None).GetAwaiter().GetResult();
    }

    public async Task<IReadOnlyCollection<SecurityKey>> GetSigningKeysAsync(CancellationToken cancellationToken)
    {
        if (_memoryCache.TryGetValue(CacheKey, out IReadOnlyCollection<SecurityKey>? keys) && keys is not null)
        {
            return keys;
        }

        var response = await _httpClient.GetAsync(_options.Security.JwkSetUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawDocument = await response.Content.ReadAsStringAsync(cancellationToken);
        IReadOnlyCollection<SecurityKey> signingKeys = new JsonWebKeySet(rawDocument).GetSigningKeys().ToArray();

        _memoryCache.Set(CacheKey, signingKeys, _options.Security.JwksCacheTtl);
        _logger.LogDebug("Loaded {SigningKeyCount} JWKS signing keys", signingKeys.Count);
        return signingKeys;
    }
}