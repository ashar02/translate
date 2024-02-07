import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import {errorMiddleware} from './middlewares/error.middleware';
import {prerenderFunction} from './prerender/controller';
// import {textToTextFunction} from './text-to-text/controller';
import {logConsoleMemory} from './utils/memory';
import {textNormalizationFunction} from './text-normalization/controller';

dotenv.config();
logConsoleMemory(process.env.NODE_ENV === 'production' ? console : console);

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(errorMiddleware);
app.options('*', (req, res) => res.status(200).end());

app.use('/translate/prerender', prerenderFunction);
// app.use('/api/spoken-to-signed', textToTextFunction);
app.use('/api/text-normalization', textNormalizationFunction);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
