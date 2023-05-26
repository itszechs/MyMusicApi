import express, {Request, Response, Router,} from "express";
import {collections} from "../services/database";

export const songRouter = Router();
songRouter.use(express.json());

const query: any[] = [
    {$unwind: "$albums"},
    {$unwind: "$albums.tracks"},
    {
        $project: {
            _id: 0,
            album_artist_id: 1,
            artist_name: 1,
            album_art: "$albums.album_art",
            album_name: "$albums.album_name",
            release_group_id: "$albums.release_group_id",
            title: "$albums.tracks.title",
            recording_id: "$albums.tracks.recording_id",
            fileId: "$albums.tracks.fileId",
            fileSize: {$toLong: "$albums.tracks.fileSize"},
        },
    },
];

interface Song {
    album_artist_id: string
    artist_name: string
    album_art: string
    album_name: string
    release_group_id: string
    title: string
    recording_id: string
    fileId: string
    fileSize: string
}

songRouter.get("", async (req: Request, res: Response) => {
    try {
        const titleQuery = req.query.title as string;
        const routeQuery = [...query];
        if (titleQuery && titleQuery.length > 0) {
            const regexPattern = new RegExp(titleQuery, "i");
            routeQuery.push({$match: {title: {$regex: regexPattern}}});
        }

        const songs = await collections.music!.aggregate(routeQuery).toArray() as Song[];
        res.json(songs.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
});

songRouter.get("/:recordingId", async (req: Request, res: Response) => {
    try {
        const recordingId = req.params.recordingId;
        const routeQuery = [...query];
        routeQuery.push({$match: {recording_id: recordingId,},});
        const song = await collections.music!.aggregate(routeQuery).toArray() as Song[];
        if (song.length > 0) {
            res.json(song[0]);
        } else {
            res.status(404).json({error: "Song not found"});
        }
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
});
