import {ObjectId} from "mongodb";
import {Album} from "./album";

export interface MusicEntry {
    album_artist_id: string
    artist_name: string
    albums: Album[]
    _id?: ObjectId
}