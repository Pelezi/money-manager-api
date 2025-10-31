import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ApplicationModule } from './modules/app.module';
import { CommonModule, LogInterceptor } from './modules/common';

/**
 * These are API defaults that can be changed using environment variables,
 * it is not required to change them (see the `.env.example` file)
 */
const API_DEFAULT_PORT = 3000;
const API_DEFAULT_PREFIX = '/api/v1/';

/**
 * The defaults below are dedicated to Swagger configuration, change them
 * following your needs (change at least the title & description).
 *
 * @todo Change the constants below following your API requirements
 */
const SWAGGER_TITLE = 'API Gerenciador Financeiro';
const SWAGGER_DESCRIPTION = 'API completa para gerenciar orçamentos, categorias e transações financeiras com sincronização mensal/anual. Permite controlar receitas e despesas, comparar gastos planejados versus reais, e organizar finanças pessoais de forma estruturada.';
const SWAGGER_PREFIX = '/docs';

/**
 * Register a Swagger module in the NestJS application.
 * This method mutates the given `app` to register a new module dedicated to
 * Swagger API documentation. Any request performed on `SWAGGER_PREFIX` will
 * receive a documentation page as response.
 *
 * @todo See the `nestjs/swagger` NPM package documentation to customize the
 *       code below with API keys, security requirements, tags and more.
 */
function createSwagger(app: INestApplication) {

    const options = new DocumentBuilder()
        .setTitle(SWAGGER_TITLE)
        .setDescription(SWAGGER_DESCRIPTION)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);
    
    // Custom CSS to improve text contrast
    const customCss = `
        .swagger-ui .info .title,
        .swagger-ui .info .description,
        .swagger-ui .info p,
        .swagger-ui .opblock .opblock-summary-description,
        .swagger-ui .opblock .opblock-summary-operation-id,
        .swagger-ui .opblock .opblock-summary-path,
        .swagger-ui .opblock-description-wrapper p,
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type,
        .swagger-ui .response-col_status,
        .swagger-ui .response-col_description,
        .swagger-ui table thead tr th,
        .swagger-ui table tbody tr td,
        .swagger-ui .model,
        .swagger-ui .model-title,
        .swagger-ui .prop-type,
        .swagger-ui .prop-format,
        .swagger-ui select,
        .swagger-ui label,
        .swagger-ui input[type="text"],
        .swagger-ui textarea {
            color: #1a1a1a !important;
        }
        
        .swagger-ui .info .title {
            color: #000000 !important;
            font-weight: 600 !important;
        }
        
        .swagger-ui .opblock-tag {
            color: #000000 !important;
            font-weight: 600 !important;
        }
        
        .swagger-ui .opblock .opblock-summary-description {
            font-weight: 500 !important;
        }
        
        .swagger-ui .markdown p,
        .swagger-ui .markdown code {
            color: #2a2a2a !important;
        }
    `;
    
    SwaggerModule.setup(SWAGGER_PREFIX, app, document, {
        customCss
    });
}

/**
 * Build & bootstrap the NestJS API.
 * This method is the starting point of the API; it registers the application
 * module and registers essential components such as the logger and request
 * parsing middleware.
 */
async function bootstrap(): Promise<void> {

    const app = await NestFactory.create<NestFastifyApplication>(
        ApplicationModule,
        new FastifyAdapter()
    );

    // Enable CORS for frontend access
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3005',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // @todo Enable Helmet for better API security headers

    app.setGlobalPrefix(process.env.API_PREFIX || API_DEFAULT_PREFIX);

    if (!process.env.SWAGGER_ENABLE || process.env.SWAGGER_ENABLE === '1') {
        createSwagger(app);
    }

    const logInterceptor = app.select(CommonModule).get(LogInterceptor);
    app.useGlobalInterceptors(logInterceptor);

    await app.listen(process.env.API_PORT || API_DEFAULT_PORT);
}

/**
 * It is now time to turn the lights on!
 * Any major error that can not be handled by NestJS will be caught in the code
 * below. The default behavior is to display the error on stdout and quit.
 *
 * @todo It is often advised to enhance the code below with an exception-catching
 *       service for better error handling in production environments.
 */
bootstrap().catch(err => {

    // eslint-disable-next-line no-console
    console.error(err);

    const defaultExitCode = 1;
    process.exit(defaultExitCode);
});
