import { Conversation } from '@11labs/client';

let conversation = null;
let isConversationActive = false;

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        return false;
    }
}

async function getSignedUrl() {
    try {
        const response = await fetch('/api/signed-url');
        if (!response.ok) throw new Error('Failed to get signed URL');
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}

function updateStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    const statusText = statusElement.querySelector('.status-text');
    statusText.textContent = isConnected ? 'Conectada' : 'Desconectada';
    statusElement.classList.toggle('connected', isConnected);
}

async function toggleConversation() {
    const toggleButton = document.getElementById('toggleButton');

    if (isConversationActive) {
        // End the conversation
        if (conversation) {
            await conversation.endSession();
            conversation = null;
        }
        toggleButton.innerHTML = '<span class="button-icon">🎙️</span> Iniciar conversación';
        isConversationActive = false;
    } else {
        // Start the conversation
        try {
            const hasPermission = await requestMicrophonePermission();
            if (!hasPermission) {
                alert('Necesito acceso al micrófono para poder ayudarte con tus compras.');
                return;
            }

            const signedUrl = await getSignedUrl();

            conversation = await Conversation.startSession({
                signedUrl: signedUrl,
                onConnect: () => {
                    console.log('Connected');
                    updateStatus(true);
                    toggleButton.innerHTML = '<span class="button-icon">⏹️</span> Finalizar conversación';
                    isConversationActive = true;
                },
                onDisconnect: () => {
                    console.log('Disconnected');
                    updateStatus(false);
                    toggleButton.innerHTML = '<span class="button-icon">🎙️</span> Iniciar conversación';
                    isConversationActive = false;
                },
                onError: (error) => {
                    console.error('Conversation error:', error);
                    alert('Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.');
                }
            });
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('No pude iniciar la conversación. Por favor, intenta de nuevo.');
        }
    }
}

document.getElementById('toggleButton').addEventListener('click', toggleConversation);

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});
