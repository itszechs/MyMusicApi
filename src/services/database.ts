import {Collection, MongoClient} from "mongodb";
import {MusicEntry} from "../models/music-entry";

export const collections: {
    music?: Collection<MusicEntry>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db("MusicApp");

    collections.music = db.collection<MusicEntry>("music");
}