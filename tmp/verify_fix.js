import mongoose from 'mongoose';
import logger from '../backend/src/util/loger.js';
import httpResponse from '../backend/src/util/httpResponse.js';
import config from '../backend/src/config/config.js';

async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.DATABASE_URL);
        
        // Mock request/response
        const req = { ip: '127.0.0.1', method: 'POST', originalUrl: '/test' };
        const res = { status: (c) => ({ json: (d) => console.log('Response sent with status:', c) }) };

        // Create a dummy Mongoose document with circular refs and internal state
        const Schema = mongoose.Schema;
        const TestModel = mongoose.model('TestLog', new Schema({ name: String }));
        const doc = new TestModel({ name: 'BSON Test' });
        
        console.log('Attempting to log a Mongoose document via httpResponse...');
        // This used to crash with RangeError due to winston-mongodb trying to serialize the raw 'doc'
        httpResponse(req, res, 200, 'Success', { doc });
        
        console.log('Verification finished successfully! No crash occurred.');
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
