import { randomUUID } from 'node:crypto';

import type { Request, Response } from 'express';

import { buildSuccessResponse } from '../utils/success-response.js';

type SseClient = {
  connectedAt: string;
  heartbeat: NodeJS.Timeout;
  id: string;
  response: Response;
};

const SSE_RETRY_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

class SseService {
  private readonly clients = new Map<string, SseClient>();

  connect(request: Request, response: Response) {
    const clientId = randomUUID();
    const connectedAt = new Date().toISOString();

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();
    response.write(`retry: ${SSE_RETRY_MS}\n\n`);

    const heartbeat = setInterval(() => {
      if (!response.writableEnded) {
        response.write(`: heartbeat ${new Date().toISOString()}\n\n`);
      }
    }, HEARTBEAT_INTERVAL_MS);

    this.clients.set(clientId, {
      connectedAt,
      heartbeat,
      id: clientId,
      response,
    });

    this.send(clientId, 'connected', {
      message: 'SSE stream connected successfully.',
      request,
      data: {
        clientId,
        connectedAt,
        retryInMs: SSE_RETRY_MS,
        transport: 'sse',
      },
    });

    request.on('close', () => {
      this.disconnect(clientId);
    });
  }

  getStats() {
    return {
      activeConnections: this.clients.size,
      transport: 'sse' as const,
      clients: Array.from(this.clients.values()).map((client) => ({
        id: client.id,
        connectedAt: client.connectedAt,
      })),
    };
  }

  broadcast<TData>(event: string, data: TData) {
    for (const client of this.clients.values()) {
      this.writeEvent(client.response, event, data);
    }
  }

  private disconnect(clientId: string) {
    const client = this.clients.get(clientId);

    if (!client) {
      return;
    }

    clearInterval(client.heartbeat);
    this.clients.delete(clientId);

    if (!client.response.writableEnded) {
      client.response.end();
    }
  }

  private send<TData>(
    clientId: string,
    event: string,
    input: {
      data: TData;
      message: string;
      request: Request;
    },
  ) {
    const client = this.clients.get(clientId);

    if (!client) {
      return;
    }

    this.writeEvent(
      client.response,
      event,
      buildSuccessResponse({
        message: input.message,
        data: input.data,
        request: input.request,
      }),
    );
  }

  private writeEvent(response: Response, event: string, data: unknown) {
    const payload = JSON.stringify(data);

    response.write(`event: ${event}\n`);

    for (const line of payload.split('\n')) {
      response.write(`data: ${line}\n`);
    }

    response.write('\n');
  }
}

export const sseService = new SseService();
