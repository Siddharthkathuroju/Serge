import mongoose from 'mongoose';

export async function ConnectToDB() {


    if (mongoose.connection.readyState === 1) {
        return;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI environment variable not set');
    }
    
    try {
        const db = await mongoose.connect(uri);

        if (!db){

            throw new Error("Unable to connect");
        }
    } catch (error) {
        console.log(error);
        throw new Error(`${error} - Unable to connect`);
    }
}