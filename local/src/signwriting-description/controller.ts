import * as express from 'express';
import * as httpErrors from 'http-errors';
import {FirebaseDatabase, Reference} from '@firebase/database-types';
import {appCheckVerification} from '../middlewares/appcheck.middleware';
import { PythonShell } from 'python-shell';
import * as path from 'path';

export class SignwritingDescriptionEndpoint {
  constructor(private database: FirebaseDatabase | null) {}

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


  getDBRef(fsw: string): Reference | null {
    if (!this.database) {
      return null;
    }
    return this.database.ref('normalizations').child(fsw);
  }

  async getCached(fsw: string): Promise<string | Reference | null> {
    const ref = this.getDBRef(fsw);

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
      if (cache && output) {
        await cache.set({
          input: fsw,
          output,
          counter: 1,
          timestamp: Date.now(),
        });
        // Set cache for the output as well, to map to itself
        if (output) {
          const dbRef = this.getDBRef(fsw);
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
      result: {
        description: output,
      },
    };
    res.json(response);
    console.log('Response', response);
  }
}

export const signwritingDescriptionFunction = express.Router();
const endpoint = new SignwritingDescriptionEndpoint(null);
signwritingDescriptionFunction.use(appCheckVerification);
signwritingDescriptionFunction.post('/', endpoint.request.bind(endpoint));
