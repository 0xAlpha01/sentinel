import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

app.listen(env.PORT, () => logger.info(`Sentinel API listening on :${env.PORT}`));
