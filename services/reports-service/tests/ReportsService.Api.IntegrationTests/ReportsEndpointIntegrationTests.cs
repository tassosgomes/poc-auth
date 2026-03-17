using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ReportsService.Api.IntegrationTests.Support;

using Xunit;

namespace ReportsService.Api.IntegrationTests;

public sealed class ReportsEndpointIntegrationTests : IClassFixture<ReportsServiceApiFactory>
{
    private readonly ReportsServiceApiFactory _factory;

    public ReportsEndpointIntegrationTests(ReportsServiceApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ListReports_WithValidJwtAndPermission_ShouldReturnOk()
    {
        await _factory.ResetStateAsync();
        await _factory.SeedRoleAccessAsync("tecnico", ["relatorios:view"], 1);

        using var client = _factory.CreateClient();
        var token = _factory.TokenIssuer.CreateToken(_factory.TokenIssuer.IssuerUri, "reports-service", new[] { "tecnico" });

        using var request = new HttpRequestMessage(HttpMethod.Get, "/reports/v1/reports");
        request.Headers.Authorization = new("Bearer", token);
        request.Headers.Add("x-correlation-id", "corr-123");

        using var response = await client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("corr-123", response.Headers.GetValues("x-correlation-id").Single());
        Assert.Equal("RP-1001", payload[0].GetProperty("id").GetString());
    }

    [Fact]
    public async Task GetReportById_WithoutEffectivePermission_ShouldReturnForbidden()
    {
        await _factory.ResetStateAsync();
        await _factory.SeedRoleAccessAsync("tecnico", ["dashboard:view"], 1);

        using var client = _factory.CreateClient();
        var token = _factory.TokenIssuer.CreateToken(_factory.TokenIssuer.IssuerUri, "reports-service", new[] { "tecnico" });

        using var request = new HttpRequestMessage(HttpMethod.Get, "/reports/v1/reports/RP-1001");
        request.Headers.Authorization = new("Bearer", token);
        request.Headers.Add("x-correlation-id", "corr-456");

        using var response = await client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("corr-456", response.Headers.GetValues("x-correlation-id").Single());
        Assert.Equal("FORBIDDEN", payload.GetProperty("code").GetString());
        Assert.Equal("relatorios:view", payload.GetProperty("permission").GetString());
    }

    [Fact]
    public async Task GetReportById_WithValidJwtAndPermission_ShouldReturnOk()
    {
        await _factory.ResetStateAsync();
        await _factory.SeedRoleAccessAsync("admin", ["relatorios:view", "role-access:manage"], 2);

        using var client = _factory.CreateClient();
        var token = _factory.TokenIssuer.CreateToken(_factory.TokenIssuer.IssuerUri, "reports-service", new[] { "admin" });

        using var request = new HttpRequestMessage(HttpMethod.Get, "/reports/v1/reports/RP-1002");
        request.Headers.Authorization = new("Bearer", token);

        using var response = await client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("RP-1002", payload.GetProperty("id").GetString());
        Assert.Equal("Role Drift Review", payload.GetProperty("title").GetString());
    }

    [Fact]
    public async Task ListReports_WithInvalidAudience_ShouldReturnUnauthorized()
    {
        await _factory.ResetStateAsync();
        await _factory.SeedRoleAccessAsync("tecnico", ["relatorios:view"], 1);

        using var client = _factory.CreateClient();
        var token = _factory.TokenIssuer.CreateToken(_factory.TokenIssuer.IssuerUri, "another-service", new[] { "tecnico" });

        using var request = new HttpRequestMessage(HttpMethod.Get, "/reports/v1/reports");
        request.Headers.Authorization = new("Bearer", token);

        using var response = await client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("AUTHENTICATION_REQUIRED", payload.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ListReports_WithMalformedRolesClaim_ShouldReturnUnauthorized()
    {
        await _factory.ResetStateAsync();
        await _factory.SeedRoleAccessAsync("admin", ["relatorios:view"], 1);

        using var client = _factory.CreateClient();
        var token = _factory.TokenIssuer.CreateToken(_factory.TokenIssuer.IssuerUri, "reports-service", "admin");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/reports/v1/reports");
        request.Headers.Authorization = new("Bearer", token);

        using var response = await client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("AUTHENTICATION_REQUIRED", payload.GetProperty("code").GetString());
    }
}