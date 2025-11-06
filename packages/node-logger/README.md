# node-logger

Logger for nodejs that uses [pino](https://github.com/pinojs/pino)
as the logger tool. Allows for both a prettified log and a more
machine readable log depending on environment.

## Usage

```typescript
import { logger } from '@altinn/dialogporten-node-logger'

logger.info('Hello world')
logger.info({such: 'context'}, 'Hello world with additional context')
logger.error(new Error('Some error'), 'Oops')

```

You can also create a "context logger", this will add a context object
to all log calls to that logger.

```typescript
import { logger, createContextLogger } from '@digdir/dialgporten-node-logger'

logger.info('Hello world')
// logs: { <standard fields>, mgs: 'Hello world' }
logger.info({such: 'context'}, 'Hello world with additional context')
// logs: { <standard fields>, such: 'context', mgs: 'Hello world' }

const ctxLogger = createContextLogger({ foo: 'bar' })

ctxLogger.info('Hello world')
// logs: { <standard fields>, foo: 'bar', mgs: 'Hello world' }
ctxLogger.info({such: 'context'}, 'Hello world with additional context')
// logs: { <standard fields>, foo: 'bar', such: 'context', mgs: 'Hello world' }
```

You can also import the `pino` logger instance itself.

```typescript
import { logger } from '@digdir/dialgporten-node-logger'

logger.pinoLogger.info('Hello world')
// logs: { <standard fields>, mgs: 'Hello world' }

### Configuration

Log level and format are configured through environment variables:

* `LOG_LEVEL` - Determines the log level. Allowed values:
  `trace, debug, info, warn, error, fatal, silent`
* `TEST_LOGGING` - Verifies the log level set by logging
  a message with every available log level. Allowed values: `true`
* `LOGGER_FORMAT` - If set to `json`, the logs will be output in
  json format for easier consumption by log services. otherwise,
  the logs are prettified
