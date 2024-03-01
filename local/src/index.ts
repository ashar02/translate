import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import {errorMiddleware} from './middlewares/error.middleware';
import {prerenderFunction} from './prerender/controller';
// import {textToTextFunction} from './text-to-text/controller';
import {logConsoleMemory} from './utils/memory';
import {textNormalizationFunction} from './text-normalization/controller';
import {signwritingDescriptionFunction} from './signwriting-description/controller';
import {spokenToSignFunction} from './spoken-to-sign/controller';
import {spokenTextToSignedPoseFunction} from './spoken-text-to-signed-pose/controller';

import https from 'https';
import fs from 'fs';
import mongooseConnection from './utils/mongo';

dotenv.config();
logConsoleMemory(process.env.NODE_ENV === 'production' ? console : console);
const privateKeyPath = process.env.PRIVATE_KEY_PATH || 'cert/key.pem';
const certificatePath = process.env.CERTIFICATE_PATH || 'cert/cert.pem';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(compression({level: 9}));
app.use(errorMiddleware);

app.use('/translate/prerender', prerenderFunction);
// app.use('/api/spoken-to-signed', textToTextFunction);
app.use('/api/text-normalization', textNormalizationFunction);
app.use('/api/signwriting-description', signwritingDescriptionFunction);
app.use('/demo/signwriting/spoken2sign', spokenToSignFunction);
app.use('/spoken_text_to_signed_pose', spokenTextToSignedPoseFunction);

const httpsServer = https.createServer({
  key: fs.readFileSync(privateKeyPath),
  cert: fs.readFileSync(certificatePath),
}, app);

httpsServer.listen(PORT, () => {
  console.log(`Server is running on HTTPS port ${PORT}`);
});

console.log('Initial connection state:', mongooseConnection.readyState);
