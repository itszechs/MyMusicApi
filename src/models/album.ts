import {Track} from "./track";

export interface Album {
    album_art: string
    album_name: string
    release_group_id: string
    tracks: Track[]
}