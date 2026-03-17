using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

using ReportsService.Api.Configuration;
using ReportsService.Api.Infrastructure.Http;

namespace ReportsService.Api.Security;

public sealed class ConfigureJwtBearerOptions : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly ReportsServiceOptions _options;
    private readonly IJwksSigningKeyProvider _jwksSigningKeyProvider;
    private readonly RolesClaimValidator _rolesClaimValidator;

    public ConfigureJwtBearerOptions(
        ReportsServiceOptions options,
        IJwksSigningKeyProvider jwksSigningKeyProvider,
        RolesClaimValidator rolesClaimValidator)
    {
        _options = options;
        _jwksSigningKeyProvider = jwksSigningKeyProvider;
        _rolesClaimValidator = rolesClaimValidator;
    }

    public void Configure(JwtBearerOptions options)
    {
        Configure(Options.DefaultName, options);
    }

    public void Configure(string? name, JwtBearerOptions options)
    {
        if (!string.Equals(name, JwtBearerDefaults.AuthenticationScheme, StringComparison.Ordinal))
        {
            return;
        }

        options.MapInboundClaims = false;
        options.RequireHttpsMetadata = false;
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _options.Security.IssuerUri,
            ValidateAudience = true,
            ValidAudience = _options.Security.Audience,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKeyResolver = (_, _, _, _) => _jwksSigningKeyProvider.GetSigningKeys()
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (!_rolesClaimValidator.IsValid(context.SecurityToken))
                {
                    context.Fail("The ROLES claim must be an array of strings");
                }

                return Task.CompletedTask;
            },
            OnChallenge = async context =>
            {
                context.HandleResponse();
                await ProblemDetailsWriter.WriteAsync(
                    context.HttpContext,
                    StatusCodes.Status401Unauthorized,
                    "AUTHENTICATION_REQUIRED",
                    "Authentication is required",
                    "https://errors.zcorp.internal/iam/authentication-required",
                    cancellationToken: context.HttpContext.RequestAborted);
            },
            OnForbidden = async context =>
            {
                await ProblemDetailsWriter.WriteAsync(
                    context.HttpContext,
                    StatusCodes.Status403Forbidden,
                    "FORBIDDEN",
                    "Access denied",
                    "https://errors.zcorp.internal/iam/forbidden",
                    cancellationToken: context.HttpContext.RequestAborted);
            }
        };
    }
}