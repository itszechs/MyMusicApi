import { Collection, MongoClient } from "mongodb";
import { Artist } from "../models/artist";
import { Album } from "../models/album";
import { Track } from "../models/track";

export const collections: {
    artists?: Collection<Artist>
    albums?: Collection<Album>;
    tracks?: Collection<Track>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db("Music");

    collections.artists = db.collection<Artist>("artists");
    collections.albums = db.collection<Album>("albums");
    collections.tracks = db.collection<Track>("tracks");
}