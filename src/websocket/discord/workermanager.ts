import type { GatewayPresenceUpdateData } from '@biscuitland/common';
import { Logger } from '@biscuitland/common';
import { WorkerManagerDefaults } from '../constants';
import { SequentialBucket } from '../structures';
import type { ShardOptions, WorkerData, WorkerManagerOptions } from './shared';
import { Worker } from 'worker_threads';
import type { WorkerMessage } from './worker';
import { join } from 'path';
import { setTimeout as delay } from 'node:timers/promises';
import { Options } from '../../utils';

export class WorkersManger extends Map<number, Worker> {
	options: Required<WorkerManagerOptions>;
	logger: Logger;
	connectQueue: SequentialBucket;
	constructor(options: WorkerManagerOptions) {
		super();
		this.options = Options<Required<WorkerManagerOptions>>(WorkerManagerDefaults, options, { info: { shards: options.totalShards } });
		this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);

		this.connectQueue = new SequentialBucket(this.concurrency);

		this.logger = new Logger({
			active: this.options.debug,
			name: '[WorkerManager]'
		});

		if (this.totalShards / this.shardsPerWorker > this.workers) {
			throw new Error('Cannot create enough shards in the specified workers, minimum: ' + Math.ceil(this.totalShards / this.shardsPerWorker));
		}
	}

	get remaining() {
		return this.options.info.session_start_limit.remaining;
	}

	get concurrency() {
		return this.options.info.session_start_limit.max_concurrency;
	}

	get totalWorkers() {
		return this.options.workers;
	}

	get totalShards() {
		return this.options.totalShards;
	}

	get shardsPerWorker() {
		return this.options.shardsPerWorker;
	}

	get workers() {
		return this.options.workers;
	}

	prepareSpaces() {
		this.logger.info('Preparing buckets');

		const chunks = SequentialBucket.chunk<number>(new Array(this.options.totalShards), this.options.shardsPerWorker);

		chunks.forEach((shards, index) => {
			for (let i = 0; i < shards.length; i++) {
				const id = i + (index > 0 ? index * this.options.shardsPerWorker : 0);
				chunks[index][i] = id;
			}
		});

		this.logger.info(`${chunks.length} buckets created`);
		return chunks;
	}

	async prepareWorkers(shards: number[][]) {
		for (let i = 0; i < shards.length; i++) {
			let worker = this.get(i);
			if (!worker) {
				worker = this.createWorker({
					path: this.options.path ?? `${join(__dirname, './worker.js')}`,
					debug: this.options.debug,
					token: this.options.token,
					shards: shards[i],
					intents: this.options.intents,
					workerId: i,
				});
				this.set(i, worker);
			}

			worker.postMessage({
				type: 'SPAWN_SHARDS',
				compress: this.options.compress ?? false,
				info: this.options.info,
				properties: this.options.properties
			} as ManagerSpawnShards);
			await delay(69);
		}
	}


	createWorker(workerData: WorkerData) {
		const worker = new Worker(workerData.path, { workerData });

		worker.on('message', data => this.handleWorkerMessage(data));

		return worker;
	}

	async spawn(workerId: number, shardId: number) {
		await this.connectQueue.push(async () => {
			const worker = this.get(workerId);
			if (!worker) {
				this.logger.fatal('Trying spawn with worker doesn\'t exist');
				return;
			}

			worker.postMessage({
				type: 'ALLOW_CONNECT',
				shardId,
				presence: this.options.presence(shardId, workerId)
			} as ManagerAllowConnect);
		});
	}

	handleWorkerMessage(message: WorkerMessage) {
		switch (message.type) {
			case 'CONNECT_QUEUE':
				this.spawn(message.workerId, message.shardId);
				break;
			case 'SHARD_PAYLOAD':
				this.options.handlePayload(message.shardId, message.payload);
				break;
		}
	}

	async start() {
		const spaces = this.prepareSpaces();
		await this.prepareWorkers(spaces);
	}
}

type CreateManagerMessage<T extends string, D extends object = {}> = { type: T } & D;

export type ManagerAllowConnect = CreateManagerMessage<'ALLOW_CONNECT', { shardId: number; presence: GatewayPresenceUpdateData }>;
export type ManagerSpawnShards = CreateManagerMessage<'SPAWN_SHARDS', Pick<ShardOptions, 'info' | 'properties' | 'compress'>>;

export type ManagerMessages = ManagerAllowConnect | ManagerSpawnShards;
