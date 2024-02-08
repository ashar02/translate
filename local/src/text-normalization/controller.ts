import * as express from 'express';
import * as dotenv from 'dotenv';
import * as httpErrors from 'http-errors';
import * as crypto from 'crypto';
import {FirebaseDatabase, Reference} from '@firebase/database-types';
import {TextNormalizationModel} from './model';
import {appCheckVerification} from '../middlewares/appcheck.middleware';

export class TextNormalizationEndpoint {
  constructor(private database: FirebaseDatabase | null, private OpenAIApiKey: string) {}

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

  getDBRef(lang: string, text: string): Reference | null {
    if (!this.database) {
      return null;
    }
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return this.database.ref('normalizations').child(lang).child(hash);
  }

  async getCached(lang: string, text: string): Promise<string | Reference | null> {
    const ref = this.getDBRef(lang, text);

    return new Promise(async resolve => {
      let result: string | Reference | null = null;
      if (ref) {
        await ref.transaction(cache => {
          if (!cache) {
            return null;
          }

          console.log('Cache hit', cache);
          result = cache.output;
          return {
            ...cache,
            counter: cache.counter + 1,
            timestamp: Date.now(),
          };
        });
      }
      resolve(result || null);
    });
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
      if (cache && output) {
        await cache.set({
          input: text,
          output,
          counter: 1,
          timestamp: Date.now(),
        });
        // Set cache for the output as well, to map to itself
        if (output) {
          const dbRef = this.getDBRef(lang, output);
          if (dbRef) {
            await dbRef.set({
              input: output,
              output,
              counter: 0,
              timestamp: Date.now(),
            });
          }
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
const endpoint = new TextNormalizationEndpoint(null, openAIKey);
textNormalizationFunction.use(appCheckVerification);
textNormalizationFunction.get('/', endpoint.request.bind(endpoint));
