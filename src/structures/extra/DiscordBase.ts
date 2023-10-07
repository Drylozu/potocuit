import { type Identify } from '@biscuitland/common';
import type { BiscuitREST } from '@biscuitland/rest';
// import { snowflakeToTimestamp, type DeepPartial } from '../../index';
import { snowflakeToTimestamp } from './functions';
import type { DeepPartial } from './types';
import { Base } from './Base';
import type { Cache, GuildBased, GuildRelated, NonGuildBased } from '../../cache';

export class DiscordBase<Data extends Record<string, any> = { id: string }> extends Base {
	id: string;
	constructor(
		rest: BiscuitREST,
		cache: Cache,
		/** Unique ID of the object */
		data: Data
	) {
		super(rest, cache);
		this.id = data.id;
		this._patchThis(data);
	}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp(): number {
		return snowflakeToTimestamp(this.id);
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt(): Date | null {
		return new Date(this.createdTimestamp);
	}

	protected _patchCache<T>(data: Identify<DeepPartial<T>>, cacheType: NonGuildBased | GuildRelated): Promise<this>;
	protected _patchCache<T>(data: Identify<DeepPartial<T>>, cacheType: GuildBased, guildId: string): Promise<this>;
	protected async _patchCache<T>(data: Identify<DeepPartial<T>>, cacheType: NonGuildBased | GuildBased | GuildRelated, guildId?: string) {
		const cache = this.cache[cacheType]!;
		const cacheData = await this.cache.adapter.get('hashGuildId' in cache ? cache.hashGuildId(this.id, guildId) : cache.hashId(this.id));

		if (cacheData) {
			await this.cache.adapter
				.set('hashGuildId' in cache ? cache.hashGuildId(this.id, guildId) : cache.hashId(this.id), { ...cacheData, ...data });
		}

		return this._patchThis(data);
	}
}