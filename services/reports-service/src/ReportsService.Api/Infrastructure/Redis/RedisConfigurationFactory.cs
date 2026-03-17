using StackExchange.Redis;

namespace ReportsService.Api.Infrastructure.Redis;

public static class RedisConfigurationFactory
{
    public static ConfigurationOptions Create(string redisUrl)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(redisUrl);

        if (!Uri.TryCreate(redisUrl, UriKind.Absolute, out var redisUri)
            || (!string.Equals(redisUri.Scheme, "redis", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(redisUri.Scheme, "rediss", StringComparison.OrdinalIgnoreCase)))
        {
            return ConfigurationOptions.Parse(redisUrl);
        }

        var configuration = new ConfigurationOptions
        {
            AbortOnConnectFail = false,
            Ssl = string.Equals(redisUri.Scheme, "rediss", StringComparison.OrdinalIgnoreCase)
        };

        configuration.EndPoints.Add(redisUri.Host, redisUri.IsDefaultPort ? 6379 : redisUri.Port);

        if (!string.IsNullOrWhiteSpace(redisUri.UserInfo))
        {
            var segments = redisUri.UserInfo.Split(':', 2, StringSplitOptions.TrimEntries);
            if (segments.Length == 2)
            {
                if (!string.IsNullOrWhiteSpace(segments[0]))
                {
                    configuration.User = segments[0];
                }

                if (!string.IsNullOrWhiteSpace(segments[1]))
                {
                    configuration.Password = segments[1];
                }
            }
            else if (!string.IsNullOrWhiteSpace(segments[0]))
            {
                configuration.Password = segments[0];
            }
        }

        return configuration;
    }
}