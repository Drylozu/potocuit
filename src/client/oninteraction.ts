import { ApplicationCommandType, InteractionType, type APIInteraction } from '@biscuitland/common';
import type { ChatInputCommandInteraction, ComponentInteraction, ModalSubmitInteraction, __InternalReplyFunction } from '../structures';
import { AutocompleteInteraction, BaseInteraction } from '../structures';
import type { BaseClient } from './base';
import { OptionResolver, CommandContext } from '../commands';

export async function onInteraction(body: APIInteraction, self: BaseClient, __reply?: __InternalReplyFunction) {
	self.debugger.debug(`[${InteractionType[body.type] ?? body.type}] Interaction received.`);
	switch (body.type) {
		case InteractionType.ApplicationCommandAutocomplete: {
			const packetData = body.data;
			const parentCommand = self.commands.commands.find(x => x.name === packetData.name);
			const optionsResolver = new OptionResolver(self.rest, self.cache, packetData.options ?? [], parentCommand, body.data.guild_id, body.data.resolved);
			const interaction = new AutocompleteInteraction(self, body, __reply);
			const command = optionsResolver.getAutocomplete();
			if (command?.autocomplete) {
				try {
					await command.autocomplete(interaction);
				} catch (error) {
					self.logger.error(`${command?.name ?? (parentCommand?.name ? parentCommand.name + ' option' : undefined) ?? 'Unknown'} just errored, ${error ? (typeof error === 'object' && 'message' in error ? error.message : error) : 'Unknown'}`);
					return command.onError?.(interaction, error);
				}
				return /* 418*/;
			}
			// idc, is a YOU problem
			self.debugger.debug(`${command?.name ?? (parentCommand?.name ? parentCommand.name + ' option' : undefined) ?? 'Unknown'} command dont have 'autocomplete' callback`);

		} break;
		case InteractionType.ApplicationCommand: {
			switch (body.data.type) {
				case ApplicationCommandType.ChatInput: {
					const packetData = body.data;
					const parentCommand = self.commands.commands.find(x => x.name === (packetData).name);
					const optionsResolver = new OptionResolver(self.rest, self.cache, packetData.options ?? [], parentCommand, packetData.guild_id, packetData.resolved);
					const interaction = BaseInteraction.from(self, body, __reply) as ChatInputCommandInteraction;
					const command = optionsResolver.getCommand();
					if (command?.run) {
						const context = new CommandContext(self, interaction, {}, {}, optionsResolver);
						const [erroredOptions, result] = await command.runOptions(context, optionsResolver);
						if (erroredOptions) { return command.onOptionsError(context, result); }

						const [_, erroredMiddlewares] = await command.runMiddlewares(context);
						if (erroredMiddlewares) { return command.onMiddlewaresError(context, erroredMiddlewares); }

						try {
							await command.run(context);
						} catch (error) {
							self.logger.error(`${command.name} just errored, ${error ? (typeof error === 'object' && 'message' in error ? error.message : error) : 'Unknown'}`);
							return command.onRunError?.(context, error);
						}
						return /* 418*/;
					}
					// idc, is a YOU problem
					self.debugger.debug(`${command?.name ?? 'Unknown'} command dont have 'run' callback`);

				} break;
			}
		} break;

		case InteractionType.ModalSubmit: {
			const interaction = BaseInteraction.from(self, body, __reply) as ModalSubmitInteraction;
			return self.__components__.onModalSubmit(interaction);
		}
		case InteractionType.MessageComponent: {
			const interaction = BaseInteraction.from(self, body, __reply) as ComponentInteraction;
			console.log(body.message.interaction?.id, body.message.id);
			console.log(self.__components__.components, interaction, interaction.customId);
			return self.__components__.onComponent(body.message.interaction?.id ?? body.message.id, interaction);
		}
	}
}