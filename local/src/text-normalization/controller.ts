import * as express from 'express';
import * as dotenv from 'dotenv';
import * as httpErrors from 'http-errors';
import * as crypto from 'crypto';
import {TextNormalizationModel} from './model';
import {appCheckVerification} from '../middlewares/appcheck.middleware';
import mongoose, {Document} from 'mongoose';

const NormalizationSchema = new mongoose.Schema({
  lang: String,
  input: String,
  hash: String,
  output: String,
  counter: Number,
  createdAt: Date,
  updatedAt: Date,
});

interface NormalizationDocument extends Document {
  lang: string;
  input: string;
  hash: string;
  output: string;
  counter: number;
  createdAt: Date,
  updatedAt: Date,
}

const NormalizationModel = mongoose.model('Normalization', NormalizationSchema);

export class TextNormalizationEndpoint {
  constructor(private OpenAIApiKey: string) {}

  private parseParameters(req: express.Request) {
    const lang = req.query.lang as string;
    if (!lang) {
      throw new httpErrors.BadRequest('Missing "lang" query parameter');
    }

    const text = req.query.text as string;
    if (!text) {
      throw new httpErrors.BadRequest('Missing "text" query parameter');
    }

    return {lang, text};
  }

  private async getDBRef(lang: string, text: string): Promise<NormalizationDocument | null> {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return NormalizationModel.findOne({lang, input: text, hash}) as Promise<NormalizationDocument | null>;
  }

  async getCached(lang: string, text: string): Promise<string | null> {
    const cache = await this.getDBRef(lang, text);
    if (cache) {
      console.log('Cache hit', cache);
      cache.counter++;
      cache.updatedAt = new Date();
      await cache.save();
      return cache.output;
    }
    return null;
  }

  async normalize(lang: string, text: string): Promise<string | null> {
    const model = new TextNormalizationModel(this.OpenAIApiKey);
    return model.normalize(lang, text);
  }

  async request(req: express.Request, res: express.Response) {
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=0');

    const {lang, text} = this.parseParameters(req);
    console.log('Requesting', {lang, text});

    const cache = await this.getCached(lang, text);
    let output: string | null;
    if (typeof cache === 'string') {
      output = cache;
    } else {
      output = await this.normalize(lang, text);
      // Set cache for the input-output mapping
      if (output) {
        output = await this.normalize(lang, text);
        if (output) {
          const hash = crypto.createHash('md5').update(text).digest('hex');
          await NormalizationModel.create({
            lang,
            input: text,
            hash,
            output,
            counter: 1,
            createdAt: new Date(),
          });
        }
      }
    }

    const response = {
      lang,
      text: output,
    };
    res.json(response);
    console.log('Response', response);
  }
}

dotenv.config();
const openAIKey = process.env.OPENAI_API_KEY || '';
export const textNormalizationFunction = express.Router();
const endpoint = new TextNormalizationEndpoint(openAIKey);
textNormalizationFunction.use(appCheckVerification);
textNormalizationFunction.get('/', endpoint.request.bind(endpoint));
