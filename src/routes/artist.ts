import express, { Request, Response, Router, } from "express";
import { collections } from "../services/database";

export const artistRouter = Router();
artistRouter.use(express.json());

artistRouter.get("", async (req: Request, res: Response) => {
    try {
        const artists = await collections.artists!.find({}).toArray();
        res.json(artists.sort((a, b) => a.artistName.localeCompare(b.artistName)));
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

artistRouter.get("/:artistId", async (req: Request, res: Response) => {
    try {
        const albumArtistId = req.params.artistId;

        const artist = await collections.artists!.aggregate([
            { $match: { artistId: albumArtistId } },
            {
                $lookup: {
                    from: "albums",
                    localField: "artistId",
                    foreignField: "artistId",
                    as: "albums"
                }
            },
            { $unwind: "$albums" },
            {
                $sort: { "albums.year": -1 }
            },
            {
                $group: {
                    _id: "$_id",
                    artistId: { $first: "$artistId" },
                    artistName: { $first: "$artistName" },
                    albums: { $push: "$albums" }
                }
            },
            {
                $project: {
                    "albums.albumArt": 0,
                    "albums.artistId": 0,
                }
            }
        ]).toArray();

        if (!artist || artist.length === 0) {
            res.status(404).json({ error: "Album not found" });
            return;
        }
        res.json(artist[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});