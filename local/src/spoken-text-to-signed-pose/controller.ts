import * as express from 'express';
import * as httpErrors from 'http-errors';
import {appCheckVerification} from '../middlewares/appcheck.middleware';
import { PythonShell } from 'python-shell';
import * as path from 'path';
import mongoose, {Document} from 'mongoose';

const SignwritingDescriptionSchema = new mongoose.Schema({
  fsw: String,
  description: String,
  counter: Number,
  timestamp: Date
});

interface SignwritingDescriptionDocument extends Document {
  fsw: string;
  description: string;
  counter: number;
  timestamp: Date;
}

const SignwritingDescriptionModel = mongoose.model('SignwritingDescription', SignwritingDescriptionSchema);

export class SignwritingDescriptionEndpoint {
  private parseParameters(req: express.Request) {
    if (!req.body || !req.body.data) {
      throw new httpErrors.BadRequest('Missing data in request body');
    }

    const data = req.body.data as {fsw: string};
    if (!data || !data.fsw) {
      throw new httpErrors.BadRequest('Missing "fsw" data in request body');
    }

    const fsw = data.fsw;
    return {fsw};
  }

  private async getDBRef(fsw: string): Promise<SignwritingDescriptionDocument | null> {
    return SignwritingDescriptionModel.findOne({fsw}) as Promise<SignwritingDescriptionDocument | null>;
  }

  async getCached(fsw: string): Promise<string | null> {
    const cache = await this.getDBRef(fsw);
    if (cache) {
      console.log('Cache hit', cache);
      cache.counter++;
      cache.timestamp = new Date();
      await cache.save();
      return cache.description;
    }
    return null;
  }

  async getDescription(fsw: string): Promise<string | null> {
    const scriptDirectory = path.join(__dirname, '../../../../signwriting-description/');
    const scriptPath = path.join(scriptDirectory, 'signwriting_description/gpt_description.py');
    const options = {
      mode: 'text' as const,
      pythonOptions: ['-u'],
      args: [fsw],
      cwd: scriptDirectory,
    };
  
    try {
      const result = await PythonShell.run(scriptPath, options);
      const description = result && result.length > 0 ? result[0] : 'None';
      return description;
    } catch (err) {
      console.error('Error executing Python script:', err);
      return null;
    }
  }
      
  async request(req: express.Request, res: express.Response) {
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=0');

    const {fsw} = this.parseParameters(req);
    console.log('Requesting', fsw);

    const cache = await this.getCached(fsw);
    let output: string | null;
    if (typeof cache === 'string') {
      output = cache;
    } else {
      output = await this.getDescription(fsw);
      // Set cache for the input-output mapping
      if (output) {
        await SignwritingDescriptionModel.create({
          fsw,
          description: output,
          counter: 1,
          timestamp: new Date(),
        });
      }
    }

    const response = {
      result: {
        description: output,
      },
    };
    res.json(response);
    console.log('Response', response);
  }
}

export const signwritingDescriptionFunction = express.Router();
const endpoint = new SignwritingDescriptionEndpoint();
signwritingDescriptionFunction.use(appCheckVerification);
signwritingDescriptionFunction.post('/', endpoint.request.bind(endpoint));
