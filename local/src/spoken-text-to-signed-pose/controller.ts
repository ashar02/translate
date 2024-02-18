import * as express from 'express';
import * as httpErrors from 'http-errors';
import axios from 'axios';
import mongoose, {Document} from 'mongoose';

const SpokenTextToSignedPoseSchema = new mongoose.Schema({
  text: String,
  spoken: String,
  signed: String,
  output: String,
  counter: Number,
  createdAt: Date,
  updatedAt: Date,
});

interface SpokenTextToSignedPoseDocument extends Document {
  text: string;
  spoken: string;
  signed: string;
  output: string;
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

  async getCached(text: string, spoken: string, signed: string): Promise<string | null> {
    const cache = await this.getDBRef(text, spoken, signed);
    if (cache) {
      console.log('Cache hit');
      cache.counter++;
      cache.updatedAt = new Date();
      await cache.save();
      return cache.output;
    }
    return null;
  }

  private async getOutputFromAPI(text: string, spoken: string, signed: string): Promise<string | null> {
    try {
      const response = await axios.get(`https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=${text}&spoken=${spoken}&signed=${signed}`);
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

    const {text, spoken, signed} = this.parseParameters(req);
    console.log('Requesting', text, spoken, signed);

    const cache = await this.getCached(text, spoken, signed);
    let output: string | null;
    if (typeof cache === 'string') {
      output = cache;
    } else {
      output = await this.getOutputFromAPI(text, spoken, signed);
      // Set cache for the input-output mapping
      if (output) {
        await SpokenTextToSignedPoseModel.create({
          text,
          spoken,
          signed,
          output,
          counter: 1,
          createdAt: new Date(),
        });
      }
    }

    res.json(output);
    //console.log('Response', output);
  }
}

export const spokenTextToSignedPoseFunction = express.Router();
const endpoint = new SpokenTextToSignedPoseEndpoint();
spokenTextToSignedPoseFunction.get('/', endpoint.request.bind(endpoint));
