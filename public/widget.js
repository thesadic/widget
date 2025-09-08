// public/widget.js
import { Conversation } from '@11labs/client'; 

(function() { 
    let conversation = null;
    let isConversationActive = false;
    let isToggling = false; // Nuevo flag para evitar múltiples clics rápidos
    let originalButtonHTML = '';

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
        // const statusElement = document.getElementById('connectionStatus');
        // if (statusElement) {
        //     statusElement.textContent = isConnected ? 'Conectada' : 'Desconectada';
        //     statusElement.classList.toggle('connected', isConnected);
        //     statusElement.classList.toggle('disconnected', !isConnected);
        // }
    }

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function setButtonToHelp(button) {
        if (!originalButtonHTML) {
            originalButtonHTML = button.innerHTML;
        }
        button.innerHTML = originalButtonHTML; // Restaura ícono + texto AYUDA
    }

    function setButtonToStop(button) {
        button.textContent = 'DETENER'; // Estado activo sin ícono
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
            setButtonToHelp(toggleButton);
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

                // Obtener el valor de pagina, nombre, modalidad y los nuevos parámetros de la URL
                const pagina = getQueryParam('pagina') || '2';
                let nombre = getQueryParam('nombre') || '';
                if (nombre.toLowerCase() === 'alvaro') {
                    nombre = 'Álvaro';
                }
                const textoGanadores = getQueryParam('cantidad_ganadores') || '';
                const regex = /hay (\d+) ganadores.*?finalizará en (\d+) meses/;

                // Variables para almacenar los resultados
                let cantidad_ganadores = '';
                let total_meses = 300;
                let meses_restantes = '';

                // Ejecutar la expresión regular en el texto
                const match = textoGanadores.match(regex);

                // Verificar si se encontraron coincidencias
                if (match) {
                    // Asignar los valores capturados a las variables
                    cantidad_ganadores = parseInt(match[1], 10);
                    meses_restantes = parseInt(match[2], 10);
                }
                const modalidad = getQueryParam('modalidad') || 'diferencial';
                const capital = getQueryParam('capital') || '';
                const capital_minimo = getQueryParam('capital_minimo') || '';
                const capital_promedio = getQueryParam('capital_promedio') || '';
                const capital_maximo = getQueryParam('capital_maximo') || '';
                const valor_cuota = getQueryParam('valor_cuota') || '';
                const cuota_minima = getQueryParam('cuota_minima') || '';
                const cuota_promedio = getQueryParam('cuota_promedio') || '';
                const cuota_maxima = getQueryParam('cuota_maxima') || '';
                const cuota_espera = getQueryParam('cuota_espera') || '';
                const cuota_normal = getQueryParam('cuota_normal') || '';
                const cuota_final = getQueryParam('cuota_final') || '';
                const moneda = getQueryParam('moneda') || '';
                const numero_grupo = getQueryParam('numero_grupo') || '';
                const numero_orden = getQueryParam('numero_orden') || '';
                const cantidad_ganadores_mes = getQueryParam('cantidad_ganadores_mes') || '';
                // const mes_grupo = getQueryParam('mes_grupo') || '';
                // const cantidad_ganadores = getQueryParam('cantidad_ganadores') || '';
                // const total_meses = getQueryParam('total_meses') || '';

                conversation = await Conversation.startSession({
                    signedUrl: signedUrl,
                    dynamicVariables: {
                        pagina,
                        nombre,
                        modalidad,
                        capital,
                        capital_minimo,
                        capital_promedio,
                        capital_maximo,
                        valor_cuota,
                        cuota_minima,
                        cuota_promedio,
                        cuota_maxima,
                        cuota_espera,
                        cuota_normal,
                        cuota_final,
                        numero_grupo,
                        meses_restantes,
                        moneda,
                        numero_orden,
                        cantidad_ganadores,
                        total_meses,
                        cantidad_ganadores_mes
                    },
                    onConnect: () => {
                        console.log('Eleven Labs Conversation Connected');
                        updateStatus(true);
                        setButtonToStop(toggleButton);
                        toggleButton.disabled = false;
                        isConversationActive = true;
                        isToggling = false; // Resetear el flag solo si la conexión es exitosa
                    },
                    onDisconnect: () => {
                        console.log('Eleven Labs Conversation Disconnected');
                        updateStatus(false);
                        setButtonToHelp(toggleButton);
                        toggleButton.disabled = false;
                        isConversationActive = false;
                        conversation = null; // Limpiar la instancia
                        isToggling = false; // Resetear el flag
                    },
                    onError: (error) => {
                        console.error('Eleven Labs Conversation error:', error);
                        alert('Lo siento, ha ocurrido un error en la conversación. Por favor, intenta de nuevo.');
                        updateStatus(false);
                        setButtonToHelp(toggleButton);
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
                setButtonToHelp(toggleButton);
                toggleButton.disabled = false;
                isConversationActive = false;
                isToggling = false; // Resetear el flag si falla el inicio
            }
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        const toggleButton = document.getElementById('toggleButton');
        if (toggleButton) {
            originalButtonHTML = toggleButton.innerHTML; // Guardar estructura original (ícono + texto)
            toggleButton.addEventListener('click', toggleConversation);
            // Iniciar conversación automáticamente si autoStart=true
            if (getQueryParam('autoStart') === 'true' && !isConversationActive) {
                toggleConversation();
            }
        } else {
            console.error("toggleButton no encontrado. El widget podría no funcionar correctamente.");
        }
        updateStatus(false);
    });

})();