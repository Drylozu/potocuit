import { ApplicationCommandType, MessageFlags, toSnakeCase } from '@biscuitland/common';
import { RawFile } from '@biscuitland/rest';
import type { __LangType } from '../../__generated';
import type { IClients } from '../../client/base';
import { Message, MessageCommandInteraction, User, UserCommandInteraction } from '../../structures';
import { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest, ModalCreateBodyRequest } from '../../types';
import type { CommandMetadata, MiddlewareContext } from './shared';

export type InteractionTarget<T> = T extends MessageCommandInteraction ? Message : User;
export class MenuCommandContext<
	C extends keyof IClients,
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends Readonly<MiddlewareContext[]> = [],
> {
	constructor(
		readonly client: IClients[C],
		readonly interaction: T,
		public metadata: CommandMetadata<M>,
		readonly shardId: number,
	) { }

	get proxy() {
		return this.client.proxy;
	}

	get target(): InteractionTarget<T> {
		switch (this.interaction.data.type) {
			case ApplicationCommandType.Message: {
				const data = this.interaction.data.resolved.messages[this.interaction.data.targetId as Lowercase<string>]
				//@ts-expect-error
				return new Message(this.client, toSnakeCase(data))
			} case ApplicationCommandType.User: {
				const data = this.interaction.data.resolved.users[this.interaction.data.targetId as Lowercase<string>]
				//@ts-expect-error
				return new User(this.client, toSnakeCase(data))
			}
		}
	}

	t<K extends keyof __LangType>(message: K, metadata: __LangType[K]) {
		return this.client.langs.get(this.interaction.locale, message, metadata);
	}

	write(body: InteractionCreateBodyRequest, files: RawFile[] = []) {
		return this.interaction.write(body, files);
	}

	modal(body: ModalCreateBodyRequest) {
		return this.interaction.modal(body);
	}

	deferReply(ephemeral = false) {
		return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest, files?: RawFile[]) {
		return this.interaction.editResponse(body, files);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply(body: InteractionMessageUpdateBodyRequest, files?: RawFile[]) {
		return this.interaction.editOrReply(body, files);
	}

	fetchResponse() {
		return this.interaction.fetchResponse();
	}

	get author() {
		return this.interaction.user;
	}

	get member() {
		return this.interaction.member;
	}
}