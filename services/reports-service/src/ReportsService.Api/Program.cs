using System.IdentityModel.Tokens.Jwt;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using ReportsService.Api.Configuration;
using ReportsService.Api.Domain.Reports;
using ReportsService.Api.Endpoints;
using ReportsService.Api.Health;
using ReportsService.Api.Infrastructure.Http;
using ReportsService.Api.Infrastructure.Observability;
using ReportsService.Api.Infrastructure.Redis;
using ReportsService.Api.Infrastructure.Reports;
using ReportsService.Api.Security;

using StackExchange.Redis;

JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<ReportsServiceOptions>()
    .Bind(builder.Configuration.GetSection(ReportsServiceOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton(static sp => sp.GetRequiredService<IOptions<ReportsServiceOptions>>().Value);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

builder.Services.AddSingleton<IReportRepository, InMemoryReportRepository>();
builder.Services.AddSingleton<JwtClaimsAdapter>();
builder.Services.AddSingleton<RolesClaimValidator>();
builder.Services.AddSingleton<IPermissionResolver, RedisPermissionResolver>();
builder.Services.AddSingleton<PermissionEnforcementService>();
builder.Services.AddSingleton<IRoleAccessGateway, RedisRoleAccessGateway>();
builder.Services.AddSingleton<IConnectionMultiplexer>(static sp =>
{
    var options = sp.GetRequiredService<ReportsServiceOptions>();
    return ConnectionMultiplexer.Connect(RedisConfigurationFactory.Create(options.RedisUrl));
});
builder.Services.AddSingleton<IRedisValueReader, RedisValueReader>();
builder.Services.AddHttpClient<IJwksSigningKeyProvider, JwksSigningKeyProvider>();

builder.Services.AddSingleton<Microsoft.Extensions.Options.IConfigureOptions<JwtBearerOptions>, ConfigureJwtBearerOptions>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.AddAuthorization();

builder.Services
    .AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddCheck<RedisHealthCheck>("redis", failureStatus: HealthStatus.Unhealthy, tags: ["ready"])
    .AddCheck<JwksHealthCheck>("jwks", failureStatus: HealthStatus.Unhealthy, tags: ["ready"]);

var app = builder.Build();

app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live")
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready")
});

app.MapReportsEndpoints();

app.Run();

public partial class Program;
