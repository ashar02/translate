import * as express from 'express';
import * as httpErrors from 'http-errors';
import axios, {AxiosResponse} from 'axios';
import mongoose, {Document} from 'mongoose';

const SpokenTextToSignedPoseSchema = new mongoose.Schema({
  text: String,
  spoken: String,
  signed: String,
  output: Buffer,
  content_disposition: String,
  content_type: String,
  glosses: String,
  counter: Number,
  createdAt: Date,
  updatedAt: Date,
});

interface SpokenTextToSignedPoseDocument extends Document {
  text: string;
  spoken: string;
  signed: string;
  output: Buffer;
  content_disposition: string;
  content_type: string;
  glosses: string;
  counter: number,
  createdAt: Date;
  updatedAt: Date;
}

const SpokenTextToSignedPoseModel = mongoose.model('SpokenTextToSignedPose', SpokenTextToSignedPoseSchema);

export class SpokenTextToSignedPoseEndpoint {
  private parseParameters(req: express.Request) {
    const {text, spoken, signed} = req.query;
    if (!text || !spoken || !signed) {
      throw new httpErrors.BadRequest('Missing required query parameters');
    }
    return {text: text as string, spoken: spoken as string, signed: signed as string};
  }

  private async getDBRef(text: string, spoken: string, signed: string): Promise<SpokenTextToSignedPoseDocument | null> {
    return SpokenTextToSignedPoseModel.findOne({text, spoken, signed}) as Promise<SpokenTextToSignedPoseDocument | null>;
  }

  async getCached(text: string, spoken: string, signed: string): Promise<{ data: Buffer | null, content_disposition: string | null, content_type: string | null, glosses: string | null }> {
    const cache = await this.getDBRef(text, spoken, signed);
    if (cache) {
      console.log('Cache hit');
      cache.counter++;
      cache.updatedAt = new Date();
      await cache.save();
      return {
        data: cache.output,
        content_disposition: cache.content_disposition,
        content_type: cache.content_type,
        glosses: cache.glosses
      };
    }
    return {data: null, content_disposition: null, content_type: null, glosses: null};
  }

  private async getOutputFromAPI(text: string, spoken: string, signed: string): Promise<{data: Buffer | null, content_disposition: string | null, content_type: string | null, glosses: string | null}> {
    try {
      //const response = await axios.get(`https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=${text}&spoken=${spoken}&signed=${signed}`);
      const response: AxiosResponse<ArrayBuffer> = await axios.get(`https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=${text}&spoken=${spoken}&signed=${signed}`, {
        responseType: 'arraybuffer'
      });
      if (response.status === 200) {
        return {
          data: Buffer.from(response.data),
          content_disposition: response.headers['content-disposition'] || null,
          content_type: response.headers['content-type'] || null,
          glosses: response.headers['glosses'] || null
        };
      } else {
        console.error('Error in API response:', response.statusText);
        return {data: null, content_disposition: null, content_type: null, glosses: null};
      }
    } catch (error) {
      console.error('Error making API request:', error.message);
      return {data: null, content_disposition: null, content_type: null, glosses: null};
    }
  }

  async request(req: express.Request, res: express.Response) {
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=0');

    const {text, spoken, signed} = this.parseParameters(req);
    console.log('Requesting', text, spoken, signed);

    const cache = await this.getCached(text, spoken, signed);
    let output: Buffer | null;
    const headers = {content_disposition: '', content_type: '', glosses: ''};
    if (cache && cache.data !== null) {
      output = cache.data;
      headers.content_disposition = cache.content_disposition || '';
      headers.content_type = cache.content_type || '';
      headers.glosses = cache.glosses || '';
    } else {
      const apiResponse = await this.getOutputFromAPI(text, spoken, signed);
      if (apiResponse && apiResponse.data) {
        output = apiResponse.data;
        headers.content_disposition = apiResponse.content_disposition || '';
        headers.content_type = apiResponse.content_type || '';
        headers.glosses = apiResponse.glosses || '';
        // Set cache for the input-output mapping
        await SpokenTextToSignedPoseModel.create({
          text,
          spoken,
          signed,
          output,
          content_disposition: headers.content_disposition,
          content_type: headers.content_type,
          glosses: headers.glosses,
          counter: 1,
          createdAt: new Date(),
        });
      } else {
        output = null;
      }
    }

    if (output !== null) {
      res.set('Content-Disposition', headers.content_disposition);
      res.set('Content-Type', headers.content_type + ';application/octet-stream');
      res.set('Glosses', headers.glosses);
      res.end(output);
    } else {
      res.status(500).json({ error: 'Failed to retrieve output from API' });
    }
  }
}

export const spokenTextToSignedPoseFunction = express.Router();
const endpoint = new SpokenTextToSignedPoseEndpoint();
spokenTextToSignedPoseFunction.get('/', endpoint.request.bind(endpoint));
