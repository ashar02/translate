import express from 'express';
import * as dotenv from 'dotenv';
import {errorMiddleware} from './middlewares/error.middleware';
import {prerenderFunction} from './prerender/controller';
// import {textToTextFunction} from './text-to-text/controller';
import {logConsoleMemory} from './utils/memory';
import {textNormalizationFunction} from './text-normalization/controller';
import {signwritingDescriptionFunction} from './signwriting-description/controller';
import https from 'https';
import fs from 'fs';

dotenv.config();
logConsoleMemory(process.env.NODE_ENV === 'production' ? console : console);
const privateKeyPath = process.env.PRIVATE_KEY_PATH || 'cert/key.pem';
const certificatePath = process.env.CERTIFICATE_PATH || 'cert/cert.pem';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
app.use(errorMiddleware);

app.use('/translate/prerender', prerenderFunction);
// app.use('/api/spoken-to-signed', textToTextFunction);
app.use('/api/text-normalization', textNormalizationFunction);
app.use('/api/signwriting-description', signwritingDescriptionFunction);

const httpsServer = https.createServer({
  key: fs.readFileSync(privateKeyPath),
  cert: fs.readFileSync(certificatePath),
}, app);

httpsServer.listen(PORT, () => {
  console.log(`Server is running on HTTPS port ${PORT}`);
});
