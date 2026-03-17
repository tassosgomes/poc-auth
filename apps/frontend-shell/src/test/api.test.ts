import { PERMISSION_SNAPSHOT_FIXTURE } from '@zcorp/shared-contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPermissionSnapshot } from '../api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('BFF client correlation propagation', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('always sends x-correlation-id when calling the BFF', async () => {
    fetchMock.mockResolvedValue(jsonResponse(PERMISSION_SNAPSHOT_FIXTURE));

    await expect(getPermissionSnapshot()).resolves.toEqual(PERMISSION_SNAPSHOT_FIXTURE);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = new Headers(request?.headers);

    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('x-correlation-id')).toBeTruthy();
  });
});