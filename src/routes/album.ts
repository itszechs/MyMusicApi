import express, {Request, Response, Router,} from "express";
import {collections} from "../services/database";
import {Track} from "../models/track";

export const albumRouter = Router();
albumRouter.use(express.json());

interface SongAlbum {
    album_artist_id: string
    artist_name: string
    album_art: string
    album_name: string
    release_group_id: string
    tracks: Track[]
}

albumRouter.get("", async (req: Request, res: Response) => {
    try {
        const routeQuery = [
            {$unwind: "$albums"},
            {
                $project: {
                    _id: 0,
                    album_artist_id: 1,
                    artist_name: 1,
                    album_art: "$albums.album_art",
                    album_name: "$albums.album_name",
                    release_group_id: "$albums.release_group_id"
                },
            },
        ];
        const albums = await collections.music!.aggregate(routeQuery).toArray() as SongAlbum[];
        res.json(albums.sort((a, b) => a.album_name.localeCompare(b.album_name)));
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal Server Error"});
    }
});


albumRouter.get("/:releaseGroupId", async (req: Request, res: Response) => {
    try {
        const releaseGroupId = req.params.releaseGroupId;
        const query = [
            {$unwind: "$albums"},
            {$match: {"albums.release_group_id": releaseGroupId,},},
            {
                $project: {
                    _id: 0,
                    album_artist_id: 1,
                    artist_name: 1,
                    album_art: "$albums.album_art",
                    album_name: "$albums.album_name",
                    release_group_id: "$albums.release_group_id",
                    tracks: {
                        $map: {
                            input: "$albums.tracks",
                            as: "track",
                            in: {
                                track_number: "$$track.track_number",
                                title: "$$track.title",
                                recording_id: "$$track.recording_id",
                                fileId: "$$track.fileId",
                                fileSize: {$toLong: "$$track.fileSize"},
                            },
                        },
                    },
                },
            }
        ];
        const album = await collections.music!.aggregate(query).toArray() as SongAlbum[];
        if (album.length > 0) {
            res.json(album[0]);
        } else {
            res.status(404).json({error: "Song not found"});
        }
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
});
