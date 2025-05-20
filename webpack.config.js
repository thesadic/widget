const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    // Modo: 'development' para desarrollo, 'production' para optimización.
    // Esto es útil para que Webpack aplique optimizaciones diferentes.
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

    // Puntos de entrada para Webpack
    entry: {
        app: './src/app.js', // Tu aplicación principal, si tienes una
        // AHORA BUSCAMOS widget.js DENTRO DE LA CARPETA 'public/'
        widget: './public/widget.js' 
    },

    // Configuración de salida
    output: {
        // La carpeta de destino para todos los bundles
        path: path.resolve(__dirname, 'dist'),
        // Nombres de los bundles (ej. app.bundle.js, widget.bundle.js)
        filename: '[name].bundle.js',
        // publicPath asegura que las rutas dentro de los bundles se generen correctamente
        // si tus assets se sirven desde una subcarpeta en tu servidor.
        publicPath: '/', 
        // Si el SDK de Eleven Labs expone 'Conversation' como una variable global,
        // esto ayuda a asegurar que el script inline en widget.html pueda accederla.
        // Si el SDK se importa directamente en public/widget.js, quizás no necesites esto.
        library: '[name]', // Expone cada entrypoint como una variable global con su nombre (ej. window.widget)
        libraryTarget: 'window' // Hace que las variables estén disponibles en el objeto 'window'
    },

    // Servidor de desarrollo (solo para 'npm run dev')
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'), // Sirve archivos estáticos desde 'dist'
        },
        compress: true, // Habilita la compresión Gzip
        port: 8080, // Puerto para el servidor de desarrollo
        open: true, // Abre el navegador automáticamente
        hot: true, // Habilita Hot Module Replacement para recargas rápidas
        // Proxy para las llamadas API al servidor backend
        proxy: {
            // Cualquier solicitud a /api será redirigida a http://localhost:3000
            '/api': 'http://localhost:3000' 
        },
        // Esto es útil para aplicaciones de una sola página (SPA)
        historyApiFallback: true, 
    },

    // Plugins para copiar archivos y otras tareas
    plugins: [
        new CopyPlugin({
            patterns: [
                // Copiar tu index.html principal (asumiendo que está en src/)
                { from: 'src/index.html', to: 'index.html' },
                // Copiar los estilos globales (si los tienes en src/)
                { from: 'src/styles.css', to: 'styles.css' },
                
                // AHORA COPIAMOS widget.css DESDE 'public/' A 'dist/'
                { from: 'public/widget.css', to: 'widget.css' },
                // AHORA COPIAMOS widget.html DESDE 'public/' A 'dist/'
                { from: 'public/widget.html', to: 'widget.html' },
                
                // Copiar archivos SVG (asumiendo que están en src/)
                { from: 'src/*.svg', to: '[name][ext]' },
                // Copiar la carpeta de imágenes públicas (si la tienes)
                { from: 'public/images', to: 'images' }
            ],
        }),
    ],

    // Módulos: Reglas para cómo Webpack maneja diferentes tipos de archivos
    module: {
        rules: [
            {
                // Para archivos JavaScript, usa babel-loader para transpilarlos
                test: /\.js$/,
                exclude: /node_modules/, // Ignora la carpeta node_modules
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'] // Transpila a ES5 compatible
                    }
                }
            },
            // Puedes añadir reglas para CSS si importas CSS directamente en JS
            // {
            //     test: /\.css$/,
            //     use: ['style-loader', 'css-loader'] // Para inyectar CSS en el DOM
            // }
        ]
    },

    // Resolver extensiones de archivos para que no tengas que especificarlas en los 'imports'
    resolve: {
        extensions: ['.js', '.json']
    }
};