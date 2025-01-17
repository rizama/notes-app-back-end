require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const path = require('path');
const Inert = require('@hapi/inert');

// Plugins
const notes = require('./api/notes');
const users = require('./api/users');
const authentications = require('./api/authentications');
const collaborations = require('./api/collaborations');
const _exports = require('./api/exports');
const uploads = require('./api/uploads');

// Services
// const NotesService = require('./services/inMemory/NotesService');
const NotesService = require('./services/postgres/NotesService');
const UsersService = require('./services/postgres/UsersService');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const ProducerService = require('./services/rabbitmq/ProducerService');
const StorageService = require('./services/storage/StorageService'); // storage local
// const StorageService = require('./services/S3/StorageService'); // storage S3
const CacheService = require('./services/redis/CacheService');

// Validators
const NotesValidator = require('./validator/notes');
const UsersValidator = require('./validator/users');
const AuthenticationsValidator = require('./validator/authentications');
const CollaborationsValidator = require('./validator/collaborations');
const ExportsValidator = require('./validator/exports');
const UploadsValidator = require('./validator/uploads');

// Error Handling
const ClientError = require('./exceptions/ClientError');

const init = async () => {
    const cacheService = new CacheService();
    const collaborationsService = new CollaborationsService(cacheService);
    const notesService = new NotesService(collaborationsService, cacheService);
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationsService();

    // storage local
    const storageService = new StorageService(
        path.resolve(__dirname, 'api/uploads/file/images')
    );

    // storage S3
    // const storageService = new StorageService();

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // registrasi plugin eksternal
    await server.register([
        {
            plugin: Jwt,
        },
        {
            plugin: Inert,
        },
    ]);

    // mendefinisikan strategy autentikasi jwt
    server.auth.strategy('notesapp_jwt', 'jwt', {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE,
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            },
        }),
    });

    await server.register([
        {
            plugin: notes,
            options: {
                service: notesService,
                validator: NotesValidator,
            },
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
            },
        },
        {
            plugin: collaborations,
            options: {
                collaborationsService,
                notesService,
                validator: CollaborationsValidator,
            },
        },
        {
            plugin: _exports,
            options: {
                service: ProducerService,
                validator: ExportsValidator,
            },
        },
        {
            plugin: uploads,
            options: {
                service: storageService,
                validator: UploadsValidator,
            },
        },
    ]);

    server.ext('onPreResponse', (request, h) => {
        // mendapatkan konteks response dari request
        const { response } = request;

        if (response instanceof Error) {
            // penanganan client error secara internal.
            if (response instanceof ClientError) {
                const newResponse = h.response({
                    status: 'fail',
                    message: response.message,
                });
                newResponse.code(response.statusCode);
                return newResponse;
            }

            // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
            if (!response.isServer) {
                return h.continue;
            }

            // penanganan server error sesuai kebutuhan
            const newResponse = h.response({
                status: 'error',
                message: 'terjadi kegagalan pada server kami',
            });
            console.error(response);
            newResponse.code(500);
            return newResponse;
        }

        // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
        return h.continue;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
