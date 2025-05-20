// public/widget.js
import { Conversation } from '@11labs/client'; 

(function() { 
    let conversation = null;
    let isConversationActive = false;
    let isToggling = false; // Nuevo flag para evitar múltiples clics rápidos

    async function requestMicrophonePermission() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            alert('Para usar el asistente, necesitamos acceso a tu micrófono. Por favor, otórgale permiso.');
            return false;
        }
    }

    async function getSignedUrl() {
        try {
            const response = await fetch('/api/signed-url'); 
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to get signed URL: ${response.statusText}`);
            }
            const data = await response.json();
            return data.signedUrl;
        } catch (error) {
            console.error('Error getting signed URL:', error);
            throw error;
        }
    }
    
    function updateStatus(isConnected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = isConnected ? 'Conectada' : 'Desconectada';
            statusElement.classList.toggle('connected', isConnected);
            statusElement.classList.toggle('disconnected', !isConnected);
        }
    }

    async function toggleConversation() {
        const toggleButton = document.getElementById('toggleButton');
        if (!toggleButton || isToggling) { // Bloquear si ya estamos en un proceso de toggle
            return;
        }

        isToggling = true; // Establecer el flag para evitar re-entradas
        toggleButton.disabled = true; // Deshabilitar el botón inmediatamente

        if (isConversationActive) {
            // Lógica para finalizar la conversación
            toggleButton.textContent = 'Finalizando...';
            if (conversation) {
                try {
                    await conversation.endSession();
                    console.log('Conversation session ended.');
                } catch (error) {
                    console.error('Error ending conversation session:', error);
                    // Si hay un error al finalizar, asegurar que el estado se limpia
                    conversation = null; 
                }
            }
            // Resetear el estado después de intentar finalizar
            conversation = null;
            isConversationActive = false;
            updateStatus(false);
            toggleButton.innerHTML = '🎙️ Iniciar conversación';
            toggleButton.disabled = false;
            isToggling = false; // Resetear el flag
        } else {
            // Lógica para iniciar la conversación
            try {
                const hasPermission = await requestMicrophonePermission();
                if (!hasPermission) {
                    toggleButton.disabled = false; // Re-habilitar si no hay permiso
                    isToggling = false; // Resetear el flag
                    return;
                }

                toggleButton.textContent = 'Iniciando...';
                updateStatus(false); // Asegurar que el estado es desconectado mientras inicia

                const signedUrl = await getSignedUrl();
                console.log('Signed URL:', signedUrl);
                if (!signedUrl) {
                    throw new Error('No se pudo obtener la URL firmada.');
                }
                // Iniciar la conversación
                console.log('Iniciando conversación...');

                conversation = await Conversation.startSession({
                    signedUrl: signedUrl,
                    onConnect: () => {
                        console.log('Eleven Labs Conversation Connected');
                        updateStatus(true);
                        toggleButton.innerHTML = '⏹️ Finalizar conversación';
                        toggleButton.disabled = false;
                        isConversationActive = true;
                        isToggling = false; // Resetear el flag solo si la conexión es exitosa
                    },
                    onDisconnect: () => {
                        console.log('Eleven Labs Conversation Disconnected');
                        updateStatus(false);
                        toggleButton.innerHTML = '🎙️ Iniciar conversación';
                        toggleButton.disabled = false;
                        isConversationActive = false;
                        conversation = null; // Limpiar la instancia
                        isToggling = false; // Resetear el flag
                    },
                    onError: (error) => {
                        console.error('Eleven Labs Conversation error:', error);
                        alert('Lo siento, ha ocurrido un error en la conversación. Por favor, intenta de nuevo.');
                        updateStatus(false);
                        toggleButton.innerHTML = '🎙️ Iniciar conversación';
                        toggleButton.disabled = false;
                        isConversationActive = false;
                        conversation = null; // Limpiar la instancia
                        isToggling = false; // Resetear el flag
                    },
                    // Opcional: Manejo de onMessage (si tu widget procesa mensajes de texto/estado)
                    // onMessage: (message) => {
                    //     console.log('Received message:', message);
                    // }
                });
            } catch (error) {
                console.error('Error starting conversation:', error);
                alert('No pude iniciar la conversación. Por favor, verifica tu conexión o intenta de nuevo más tarde.');
                toggleButton.innerHTML = '🎙️ Iniciar conversación';
                toggleButton.disabled = false;
                isConversationActive = false;
                isToggling = false; // Resetear el flag si falla el inicio
            }
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        const toggleButton = document.getElementById('toggleButton');
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleConversation);
        } else {
            console.error("toggleButton no encontrado. El widget podría no funcionar correctamente.");
        }
        updateStatus(false);
    });

})();