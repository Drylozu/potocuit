import {
	InteractionTypes, MessageComponentTypes,
	INTERACTION_ID_TOKEN,
	ApplicationCommandTypes,
	WEBHOOK_MESSAGE,
	WEBHOOK
} from '@biscuitland/api-types';
import type {
	DiscordInteraction,
	DiscordInteractionData,
	DiscordMessage,
	DiscordUser,
	DiscordMember
} from '@biscuitland/api-types';
import type {
	Potocuit
} from '../potocuit';
import type {
	ApplicationCommandAutocompleteResultCallback, ChannelMessageWithSourceCallback,
	DeferredChannelMessageWithSourceCallback, DeferredUpdateMessageCallback,
	ModalCallback, UpdateMessageCallback
} from './types/interaction';
import type { OptionsContext } from '../utils';
import type { CreateMessageData } from './types/message';

type InteractionCallback = ChannelMessageWithSourceCallback |
	DeferredChannelMessageWithSourceCallback |
	DeferredUpdateMessageCallback |
	UpdateMessageCallback |
	ApplicationCommandAutocompleteResultCallback |
	ModalCallback;

type ResolveDiscordInteractionRaw<
	O extends keyof DiscordInteractionData = never,
	R extends keyof DiscordInteractionData = never,
> = Omit<DiscordInteraction, 'data'> & {
	data: Omit<DiscordInteractionData, O> & Required<Pick<DiscordInteractionData, R>>;
};

type ResolveInteraction<
	RESPOND extends InteractionCallback,
	O extends keyof DiscordInteractionData = never,
	R extends keyof DiscordInteractionData = never,
> = Omit<Interaction<RESPOND>, 'data'> & { data: ResolveDiscordInteractionRaw<O, R> };

export type ApplicationCommandInteraction = ResolveInteraction<
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback,
	// 'id'
	// | 'name'
	// | 'type'
	// | 'resolved'
	// | 'options'
	// | 'guild_id'
	// | 'target_id'
	| 'component_type'
	| 'components'
	| 'custom_id'
	| 'values',
	never
> & { options: OptionsContext };

export type AutocompleteInteraction = ResolveInteraction<
	ApplicationCommandAutocompleteResultCallback,
	// 'id'
	// | 'name'
	// | 'type'
	// | 'resolved'
	// | 'options'
	// | 'guild_id'
	// | 'target_id'
	| 'component_type'
	| 'components'
	| 'custom_id'
	| 'values',
	never
> & { options: OptionsContext };

export type ContextMenuUserInteraction = ResolveInteraction<
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback,
	// 'id'
	// | 'name'
	// | 'type'
	// | 'resolved'
	// | 'options'
	// | 'guild_id'
	// | 'target_id'
	| 'component_type'
	| 'components'
	| 'custom_id'
	| 'values',
	'target_id'
> & { target: { user: DiscordUser; member?: DiscordMember } };

export type ContextMenuMessageInteraction = ResolveInteraction<
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback,
	// 'id'
	// | 'name'
	// | 'type'
	// | 'resolved'
	// | 'options'
	// | 'guild_id'
	// | 'target_id'
	| 'component_type'
	| 'components'
	| 'custom_id'
	| 'values',
	'target_id'
> & { target: { message: DiscordMessage } };

export type SelectMenuInteraction = ResolveInteraction<
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| DeferredUpdateMessageCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
	| UpdateMessageCallback,
	'id'
	| 'name'
	| 'type'
	| 'resolved'
	| 'options'
	| 'guild_id'
	| 'target_id'
	// | 'component_type'
	| 'components'
	// | 'custom_id'
	// | 'values'
	,
	'custom_id'
	| 'component_type'
	| 'values'
>;

export type ComponentInteraction = ResolveInteraction<
	ChannelMessageWithSourceCallback
	| DeferredChannelMessageWithSourceCallback
	| DeferredUpdateMessageCallback
	| ApplicationCommandAutocompleteResultCallback
	| ModalCallback
	| UpdateMessageCallback,
	'id'
	| 'name'
	| 'type'
	| 'resolved'
	| 'options'
	| 'guild_id'
	| 'target_id'
	// | 'component_type'
	| 'components'
	// | 'custom_id'
	| 'values'
	,
	'custom_id'
	| 'component_type'
// | 'values'
>;

export type ModalSubmitInteraction = ResolveInteraction<
	ModalCallback,
	'id'
	| 'name'
	| 'type'
	| 'resolved'
	| 'options'
	| 'guild_id'
	| 'target_id'
	| 'component_type'
	| 'components'
	// | 'custom_id'
	| 'values'
	,
	'custom_id'
	| 'components'
>;

export class Interaction<
	T extends InteractionCallback
> {
	data: DiscordInteraction;
	client: Potocuit;
	options?: OptionsContext;
	target?: { message?: DiscordMessage; user?: DiscordUser; member?: DiscordMember };

	isApplicationCommand(): this is ApplicationCommandInteraction {
		return this.data.type === InteractionTypes.ApplicationCommand;
	}

	isChatInput(): this is ApplicationCommandInteraction {
		return this.isApplicationCommand() && this.data.data.type === ApplicationCommandTypes.ChatInput;
	}

	isContextMenuUser(): this is ContextMenuUserInteraction {
		return this.isApplicationCommand() && this.data.data.type === ApplicationCommandTypes.User;
	}

	isContextMenuMessage(): this is ContextMenuMessageInteraction {
		return this.isApplicationCommand() && this.data.data.type === ApplicationCommandTypes.Message;
	}

	isAutocomplete(): this is AutocompleteInteraction {
		return this.data.type === InteractionTypes.ApplicationCommandAutocomplete;
	}


	isModalSubmit(): this is ModalSubmitInteraction {
		return this.data.type === InteractionTypes.ModalSubmit;
	}

	isSelectMenu(): this is SelectMenuInteraction {
		return this.data.type === InteractionTypes.MessageComponent
			&&
			[
				MessageComponentTypes.SelectMenu,
				MessageComponentTypes.UserSelect,
				MessageComponentTypes.RoleSelect,
				MessageComponentTypes.MentionableSelect,
				MessageComponentTypes.ChannelSelect,
			].includes(this.data.data!.component_type!);
	}

	isComponent(): this is ComponentInteraction {
		return this.data.type === InteractionTypes.MessageComponent;
	}

	constructor(data: DiscordInteraction, options: OptionsContext | null, client: Potocuit) {
		this.data = data;
		if (options) {
			this.options = options;
		}
		this.client = client;

		if ('target_id' in (data.data ?? {})) {
			if (this.isContextMenuUser()) {
				const user = this.data.data.resolved!.users![data.data!.target_id!];
				const member = this.data.data.resolved!.members![data.data!.target_id!];
				this.target = { user, member };
			} else if (this.isContextMenuMessage()) {
				const message = this.data.data.resolved!.messages![data.data!.target_id!];
				this.target = { message };
			}
		}
	}

	get author() {
		return this.data.member ? this.data.member.user : this.data.user!;
	}

	get member() {
		return this.data.member;
	}

	respond(body: T, file?: { blob: Blob; name: string }[]) {
		return this.client.rest.post(
			INTERACTION_ID_TOKEN(this.data.id, this.data.token),
			{
				file,
				...body
			}
		);
	}

	editReply(body: T['data'], file?: { blob: Blob; name: string }[]) {
		return this.editFollowUp({ ...body, messageId: '@original' }, file);
		// return this.client.rest.patch(
		// 	WEBHOOK_MESSAGE(this.data.application_id, this.data.token, '@original'),
		// 	{
		// 		file,
		// 		...body
		// 	}
		// );
	}

	sendFollowUp(data: CreateMessageData, file?: { blob: Blob; name: string }[]): Promise<DiscordMessage> {
		return this.client.rest.post(
			WEBHOOK(this.data.application_id, this.data.token),
			{
				file,
				...data
			}
		);
	}

	getFollowUp(messageId: string, threadId?: string): Promise<DiscordMessage> {
		return this.client.rest.get(
			WEBHOOK_MESSAGE(this.data.application_id, this.data.token, messageId, { threadId })
		);
	}

	editFollowUp(data: CreateMessageData & { messageId: string }, file?: { blob: Blob; name: string }[]): Promise<DiscordMessage> {
		return this.client.rest.patch(
			WEBHOOK_MESSAGE(this.data.application_id, this.data.token, data.messageId),
			{
				file,
				...data
			}
		);
	}

	deleteFollowUp(messageId: string, threadId?: string) {
		return this.client.rest.delete(
			WEBHOOK_MESSAGE(this.data.application_id, this.data.token, messageId, { threadId })
		);
	}
}
