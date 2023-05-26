import express, {Request, Response, Router,} from "express";
import {collections} from "../services/database";

export const artistRouter = Router();
artistRouter.use(express.json());

artistRouter.get("", async (req: Request, res: Response) => {
    try {
        const artistQuery = [
            {
                $project: {
                    _id: 0,
                    artist_name: 1,
                    artist_id: "$album_artist_id"
                }
            }
        ];

        const artists = await collections.music!.aggregate(artistQuery).toArray();
        res.json(artists.sort((a, b) => a.artist_name.localeCompare(b.artist_name)));
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
});


artistRouter.get("/:artistId", async (req: Request, res: Response) => {
    try {
        const albumArtistId = req.params.artistId;
        const routeQuery = [
            {$match: {album_artist_id: albumArtistId}},
            {$unwind: "$albums"},
            {$sort: {"albums.album_name": 1}},
            {
                $group: {
                    _id: "$album_artist_id",
                    artist_name: {$first: "$artist_name"},
                    artist_id: {$first: "$album_artist_id"},
                    albums: {
                        $push: {
                            album_name: "$albums.album_name",
                            release_group_id: "$albums.release_group_id",
                            album_art: "$albums.album_art"
                        }
                    }
                }
            }
        ];

        const artist = await collections.music!.aggregate(routeQuery).toArray();
        if (artist) {
            res.json(artist[0]);
        } else {
            res.status(404).json({error: "Artist not found"});
        }
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
});