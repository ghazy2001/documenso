import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

import { getOpenIdConfiguration } from './open-id';

describe('OIDC discovery (getOpenIdConfiguration)', () => {
  let server: http.Server;
  let serverUrl: string;
  let currentMetadata: Record<string, unknown> = {};

  before(async () => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentMetadata));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        serverUrl = `http://127.0.0.1:${address.port}/.well-known/openid-configuration`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('accepts discovery metadata with no scopes_supported', async () => {
    currentMetadata = {
      issuer: 'https://idp.example.com',
      authorization_endpoint: 'https://idp.example.com/authorize',
      token_endpoint: 'https://idp.example.com/token',
    };

    const config = await getOpenIdConfiguration(serverUrl, {
      requiredScopes: ['openid', 'email', 'profile'],
    });

    assert.equal(config.authorization_endpoint, 'https://idp.example.com/authorize');
    assert.equal(config.token_endpoint, 'https://idp.example.com/token');
    assert.equal(config.scopes_supported, undefined);
  });

  it('accepts an explicit complete scope list', async () => {
    currentMetadata = {
      issuer: 'https://idp.example.com',
      authorization_endpoint: 'https://idp.example.com/authorize',
      token_endpoint: 'https://idp.example.com/token',
      scopes_supported: ['openid', 'email', 'profile'],
    };

    const config = await getOpenIdConfiguration(serverUrl, {
      requiredScopes: ['openid', 'email', 'profile'],
    });

    assert.deepEqual(config.scopes_supported, ['openid', 'email', 'profile']);
  });

  it('rejects an explicit scope list missing required scope', async () => {
    currentMetadata = {
      issuer: 'https://idp.example.com',
      authorization_endpoint: 'https://idp.example.com/authorize',
      token_endpoint: 'https://idp.example.com/token',
      scopes_supported: ['openid', 'email'],
    };

    await assert.rejects(
      async () => {
        await getOpenIdConfiguration(serverUrl, {
          requiredScopes: ['openid', 'email', 'profile'],
        });
      },
      {
        message: 'Requested scopes not supported by provider: profile',
      },
    );
  });

  it('rejects an explicitly empty scopes_supported list', async () => {
    currentMetadata = {
      issuer: 'https://idp.example.com',
      authorization_endpoint: 'https://idp.example.com/authorize',
      token_endpoint: 'https://idp.example.com/token',
      scopes_supported: [],
    };

    await assert.rejects(
      async () => {
        await getOpenIdConfiguration(serverUrl, {
          requiredScopes: ['openid', 'email', 'profile'],
        });
      },
      {
        message: 'Requested scopes not supported by provider: openid, email, profile',
      },
    );
  });
});
