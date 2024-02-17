import * as express from 'express';
import * as httpErrors from 'http-errors';
import axios from 'axios';
import mongoose, {Document} from 'mongoose';

const SpokenToSignSchema = new mongoose.Schema({
  country_code: String,
  language_code: String,
  text: String,
  translation_type: String,
  output: String,
  counter: Number,
  createdAt: Date,
  updatedAt: Date,
});

interface SpokenToSignDocument extends Document {
  country_code: string;
  language_code: string;
  text: string;
  translation_type: string;
  output: string;
  counter: number,
  createdAt: Date;
  updatedAt: Date;
}

const SpokenToSignModel = mongoose.model('SpokenToSign', SpokenToSignSchema);

export class SpokenToSignEndpoint {
  private parseParameters(req: express.Request) {
    if (!req.body) {
      throw new httpErrors.BadRequest('Missing request body');
    }

    const {country_code, language_code, text, translation_type} = req.body;
    if (!country_code || !language_code || !text || !translation_type) {
      throw new httpErrors.BadRequest('Missing required fields in request body');
    }

    return {country_code, language_code, text, translation_type};
  }

  private async getDBRef(country_code: string, language_code: string, text: string, translation_type: string): Promise<SpokenToSignDocument | null> {
    return SpokenToSignModel.findOne({country_code, language_code, text, translation_type}) as Promise<SpokenToSignDocument | null>;
  }

  async getCached(country_code: string, language_code: string, text: string, translation_type: string): Promise<string | null> {
    const cache = await this.getDBRef(country_code, language_code, text, translation_type);
    if (cache) {
      console.log('Cache hit', cache);
      cache.counter++;
      cache.updatedAt = new Date();
      await cache.save();
      return cache.output;
    }
    return null;
  }

  private async getOutputFromAPI(country_code: string, language_code: string, text: string, translation_type: string): Promise<string | null> {
    try {
      const response = await axios.post('https://pub.cl.uzh.ch/demo/signwriting/spoken2sign', {
        country_code,
        language_code,
        text,
        translation_type
      });
      
      if (response.status === 200) {
        const data = response.data;
        return data;
      } else {
        console.error('Error in API response:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error making API request:', error.message);
      return null;
    }
  }

  async request(req: express.Request, res: express.Response) {
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=0');

    const {country_code, language_code, text, translation_type} = this.parseParameters(req);
    console.log('Requesting', country_code, language_code, text, translation_type);

    const cache = await this.getCached(country_code, language_code, text, translation_type);
    let output: string | null;
    if (typeof cache === 'string') {
      output = JSON.parse(cache);
    } else {
      output = await this.getOutputFromAPI(country_code, language_code, text, translation_type);
      // Set cache for the input-output mapping
      if (output) {
        const outputString = JSON.stringify(output);
        await SpokenToSignModel.create({
          country_code,
          language_code,
          text,
          translation_type,
          output: outputString,
          counter: 1,
          createdAt: new Date(),
        });
      }
    }

    res.json(output);
    console.log('Response', output);
  }
}

export const spokenToSignFunction = express.Router();
const endpoint = new SpokenToSignEndpoint();
spokenToSignFunction.post('/', endpoint.request.bind(endpoint));
