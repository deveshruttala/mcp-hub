// Redis-ready queue abstraction. Currently uses an in-memory fallback so the
// MVP runs out of the box. Swap implementation behind this interface to use
// BullMQ/Redis in production.

type JobHandler<T = unknown> = (payload: T) => Promise<void>;

interface QueueJob<T = unknown> {
  id: string;
  name: string;
  payload: T;
  enqueuedAt: number;
}

class InMemoryQueue {
  private handlers = new Map<string, JobHandler>();
  private jobs: QueueJob[] = [];

  on<T>(name: string, handler: JobHandler<T>) {
    this.handlers.set(name, handler as JobHandler);
  }

  async enqueue<T>(name: string, payload: T) {
    const job: QueueJob<T> = {
      id: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      payload,
      enqueuedAt: Date.now(),
    };
    this.jobs.push(job as QueueJob);
    const handler = this.handlers.get(name);
    if (handler) {
      try {
        await handler(payload);
      } catch (err) {
        console.error("[queue]", name, err);
      }
    }
    return job.id;
  }
}

const globalForQueue = globalThis as unknown as { agentHubQueue?: InMemoryQueue };
export const queue = globalForQueue.agentHubQueue ?? new InMemoryQueue();
if (!globalForQueue.agentHubQueue) globalForQueue.agentHubQueue = queue;
