using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text.Json;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace ReportsService.Api.IntegrationTests.Support;

public sealed class JwksTokenIssuer : IAsyncDisposable
{
    private readonly RSA _rsa = RSA.Create(2048);
    private WebApplication? _application;

    public string IssuerUri { get; private set; } = string.Empty;

    public string JwkSetUri { get; private set; } = string.Empty;

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        var port = GetFreeTcpPort();
        var baseUri = $"http://127.0.0.1:{port}";

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls(baseUri);
        _application = builder.Build();

        _application.MapGet("/.well-known/jwks.json", () => Results.Text(BuildJwksDocument(), "application/json"));

        await _application.StartAsync(cancellationToken);

        IssuerUri = baseUri + "/issuer";
        JwkSetUri = baseUri + "/.well-known/jwks.json";
    }

    public string CreateToken(string issuer, string audience, object rolesClaim)
    {
        var securityKey = new RsaSecurityKey(_rsa.ExportParameters(true))
        {
            KeyId = "test-key"
        };

        var header = new JwtHeader(new SigningCredentials(securityKey, SecurityAlgorithms.RsaSha256));
        var payload = new JwtPayload
        {
            [JwtRegisteredClaimNames.Sub] = "user-123",
            [JwtRegisteredClaimNames.Email] = "user-123@example.com",
            [JwtRegisteredClaimNames.Iss] = issuer,
            [JwtRegisteredClaimNames.Aud] = audience,
            [JwtRegisteredClaimNames.Iat] = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            [JwtRegisteredClaimNames.Nbf] = DateTimeOffset.UtcNow.AddSeconds(-5).ToUnixTimeSeconds(),
            [JwtRegisteredClaimNames.Exp] = DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds(),
            [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString(),
            ["ROLES"] = rolesClaim
        };

        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(header, payload));
    }

    public async ValueTask DisposeAsync()
    {
        if (_application is not null)
        {
            await _application.StopAsync();
            await _application.DisposeAsync();
        }

        _rsa.Dispose();
    }

    private string BuildJwksDocument()
    {
        var parameters = _rsa.ExportParameters(false);
        var document = new
        {
            keys = new[]
            {
                new
                {
                    kty = "RSA",
                    use = "sig",
                    kid = "test-key",
                    alg = "RS256",
                    n = Base64UrlEncoder.Encode(parameters.Modulus),
                    e = Base64UrlEncoder.Encode(parameters.Exponent)
                }
            }
        };

        return JsonSerializer.Serialize(document);
    }

    private static int GetFreeTcpPort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}