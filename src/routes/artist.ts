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