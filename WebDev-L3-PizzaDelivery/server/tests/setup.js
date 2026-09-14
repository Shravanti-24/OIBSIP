import mongoose from 'mongoose';

// No live MongoDB is available in this test environment. Disabling command
// buffering makes any test that accidentally hits the database fail fast
// with a clear "not connected" error instead of hanging until a timeout.
mongoose.set('bufferCommands', false);
