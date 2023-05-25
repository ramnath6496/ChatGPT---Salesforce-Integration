import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ChatGPT extends LightningElement {
    @track conversation = [];
    @track messageInput = '';
    @track isLoading = false;

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
        this.isLoading = true;
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
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer YOUR_API_KEY' // Replace with your actual API key
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: 'user',
                            content: this.conversation[this.conversation.length - 1]?.text
                        }],
                        model: 'gpt-3.5-turbo'
                    })
                });

                if (response.ok) {
                    const responseBody = await response.json();
                    this.isLoading = false;

                    if (responseBody && responseBody.choices && responseBody.choices.length > 0) {
                        const assistantMessage = {
                            id: 'assistant-' + this.conversation.length,
                            role: 'assistant',
                            text: responseBody.choices[0].message.content,
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
                } else {
                    const errorBody = await response.json();
                    throw new Error('Error: ' + response.status + ' ' + response.statusText + ' - ' + errorBody.error.message);
                }
            } catch (error) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'ERROR!!!',
                    message: error.message,
                    variant: 'error'
                }))
                this.isLoading = false;
            }
        }
    }
}