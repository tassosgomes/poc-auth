namespace ReportsService.Api.Security;

public sealed class PermissionStoreUnavailableException : Exception
{
    public PermissionStoreUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}