import { Collection, MongoClient, GridFSBucket } from "mongodb";
import { Artist } from "../models/artist";
import { Album } from "../models/album";
import { Track } from "../models/track";
import { Account } from "../models/account";

export const collections: {
    accounts?: Account[];
    artists?: Collection<Artist>
    albums?: Collection<Album>;
    tracks?: Collection<Track>;
    images?: GridFSBucket;
} = {};

export async function connectToDatabase(
    musicDb: string, 
    cloudDb: string
) {
    const musicDbClient = new MongoClient(musicDb);
    await musicDbClient.connect();

    const db = musicDbClient.db("Music");
    const imagesStore = musicDbClient.db("images");

    collections.artists = db.collection<Artist>("artists");
    collections.albums = db.collection<Album>("albums");
    collections.tracks = db.collection<Track>("tracks");
    collections.images = new GridFSBucket(imagesStore!);

    const cloudDbClient = new MongoClient(cloudDb);
    await cloudDbClient.connect();

    const cloud = cloudDbClient.db("cloud");
    const accounts = cloud.collection<Account>("accounts");
    collections.accounts = await accounts.find({}).toArray();
}