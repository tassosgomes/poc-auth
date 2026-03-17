using System.Diagnostics;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

using ReportsService.Api.Infrastructure.Observability;

namespace ReportsService.Api.Infrastructure.Http;

public static class ProblemDetailsWriter
{
    public static ProblemDetails Create(
        HttpContext httpContext,
        int statusCode,
        string code,
        string detail,
        string type,
        Action<ProblemDetails>? enrich = null)
    {
        var correlationId = httpContext.Items.TryGetValue(CorrelationIdMiddleware.ItemKey, out var resolvedCorrelationId)
            ? resolvedCorrelationId?.ToString()
            : httpContext.TraceIdentifier;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = ReasonPhrases.GetReasonPhrase(statusCode),
            Detail = detail,
            Type = type,
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["code"] = code;
        problemDetails.Extensions["correlationId"] = correlationId;
        problemDetails.Extensions["traceId"] = Activity.Current?.TraceId.ToString() ?? httpContext.TraceIdentifier;
        problemDetails.Extensions["timestamp"] = DateTimeOffset.UtcNow;

        enrich?.Invoke(problemDetails);
        return problemDetails;
    }

    public static async Task WriteAsync(
        HttpContext httpContext,
        int statusCode,
        string code,
        string detail,
        string type,
        Action<ProblemDetails>? enrich = null,
        CancellationToken cancellationToken = default)
    {
        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";
        if (httpContext.Items.TryGetValue(CorrelationIdMiddleware.ItemKey, out var correlationId) && correlationId is not null)
        {
            httpContext.Response.Headers[CorrelationIdMiddleware.HeaderName] = correlationId.ToString();
        }

        var problemDetails = Create(httpContext, statusCode, code, detail, type, enrich);
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
    }
}