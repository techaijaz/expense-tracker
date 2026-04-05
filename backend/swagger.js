import swaggerAutogen from 'swagger-autogen'

const doc = {
    info: {
        title: 'Expense Tracker API',
        description: 'Auto-generated API documentation for the Expense Tracker project.',
        version: '1.0.0',
    },
    host: 'localhost:5000', // Change this to your server's host and port
    basePath: '',
    schemes: ['http', 'https'],
    securityDefinitions: {
        apiKeyAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'accessToken',
            description: 'Authentication token stored in cookies',
        },
    },
}

const outputFile = './swagger-output.json'
const endpointsFiles = ['./src/app.js'] // It will recursively scan all routes imported in app.js

/* NOTE: If you are using the "new" OSS version of swagger-autogen, 
   the syntax might slightly differ, but this is the standard way. */

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger documentation generated successfully!')
})

