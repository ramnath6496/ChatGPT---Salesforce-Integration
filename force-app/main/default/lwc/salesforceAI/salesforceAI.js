import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import generateResponse from '@salesforce/apex/AIService.generateResponse';

export default class SalesforceAI extends LightningElement {
    @track conversation = [];
    @track messageInput = '';

    handleChange(event) {
        if (event && event.target) {
            this.messageInput = event.target.value;
        }
    }

    handleKeyUp(event) {
        if (event.keyCode === 13) {
            this.handleSendMessage();
        }
    }

    async handleSendMessage() {
        if (this.messageInput && this.messageInput.trim() !== '') {
            const userMessage = {
                id: 'user-' + this.conversation.length,
                role: 'user',
                text: this.messageInput,
                containerClass: 'slds-chat-message slds-chat-message__text_outbound user-message',
                textClass: 'slds-chat-message__text slds-chat-message__text_outbound',
                isBot: false
            };
            this.conversation = [...this.conversation, userMessage];
            this.messageInput = '';

            try {
                const chatGPTResponse = await generateResponse({ messageText: this.conversation[this.conversation.length - 1]?.text });
                if (chatGPTResponse && chatGPTResponse.trim() !== '') {
                    const assistantMessage = {
                        id: 'assistant-' + this.conversation.length,
                        role: 'assistant',
                        text: chatGPTResponse,
                        containerClass: 'slds-chat-message slds-chat-message__text_inbound',
                        textClass: 'slds-chat-message__text slds-chat-message__text_inbound',
                        isBot: true
                    };
                    this.conversation = [...this.conversation, assistantMessage];
                } else {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'ERROR!!!',
                        message: 'Error generating ChatGPT response: Empty response',
                        variant: 'error'
                    }))
                }
            } catch (error) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'ERROR!!!',
                    message: error.body.message,
                    variant: 'error'
                }))
            }
        }
    }

    @api
    async generateChatGPTResponse(prompt) {
        try {
            const response = await generateResponse({ prompt: prompt });
            return response;
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'ERROR!!!',
                message: error.body.message,
                variant: 'error'
            }))
        }
    }

}