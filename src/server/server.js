import cluster from 'cluster';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import mongoose from 'mongoose';
import 'source-map-support/register';
import '@babel/polyfill';
import config from './config';
import express from 'express';
import auth from './auth';
import logger from './logger';
import setRouter from './router';
import judger from '/judger';

mongoose.connect(config.mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('strictQuery', true);

const MongoStore = require('connect-mongo')(expressSession);
const app = express();

app.use('/static', express.static('static'));

app.use(express.static('static', { maxAge: '1h' }));

app.use(cookieParser());

app.use(expressSession({
    secret: config.secret,
    maxAge: 1000 * 3600 * 1000,
    secure: false,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: config.mongo.url,
        touchAfter: 3600,
    }),
}));

app.use(bodyParser.json({ limit: '120mb' }));

app.use(bodyParser.urlencoded({ limit: '120mb', extended: true }));

auth(app);

setRouter(app);

if (cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < config.maxNodeWorkers; i++) {
        cluster.fork();
    }
    // Check if work id is died
    cluster.on('exit', (worker, code, signal) => {
        logger.info(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
    logger.info(`Judger ${process.pid} is running`);
    judger();
} else {
    logger.info(`Worker ${process.pid} started`);
    app.listen(config.port, '127.0.0.1', () => logger.info(`Server start @ ${config.port}`));
}
