import type { GatewayPresenceUpdate } from '@biscuitland/common';
import { GuildRelatedResource } from './default/guild-related';

export class Presences extends GuildRelatedResource<PotoPresence> {
	namespace = 'presence';

	override parse(data: any, key: string, guild_id: string): PotoPresence {
		super.parse(data, key, guild_id);
		data.user_id = data.user?.id ?? key;
		delete data.user;
		return data;
	}
}

export type PotoPresence = Omit<GatewayPresenceUpdate, 'user'> & { id: string };