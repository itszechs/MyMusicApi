import express, { Request, Response, Router, } from "express";
import { collections } from "../services/database";
import { findAndDelete } from "../services/drive";
import { getAlbumQueryPipeline } from "./album";

export const songRouter = Router();
songRouter.use(express.json());

songRouter.get("", async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;;

        const totalTracks = await collections.tracks!.countDocuments();
        const totalPages = Math.ceil(totalTracks / limit);

        if (page < 1 || page > totalPages) {
            return res.json({ totalPage: totalPages, page, results: [] });
        }

        const skip = (page - 1) * limit;

        const tracks = await collections.tracks!
            .find()
            .collation({ locale: "en" })
            .sort({ trackName: 1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const response = {
            totalPage: totalPages,
            page,
            results: tracks
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});


songRouter.delete("/:recordingId", async (req: Request, res: Response) => {
    try {
        const recordingId = req.params.recordingId;
        const foundSong = await collections.tracks!.findOne({
            recordingId: recordingId
        });
        if (!foundSong) {
            res.status(404).json({ error: "Song not found" });
        } else {
            const fileId = foundSong.fileId;
            await findAndDelete(fileId)
            await collections.tracks!.deleteOne({
                recordingId: recordingId
            });
            // check if the album this track was in is empty if it is delete the album from database
            const albumId = foundSong.albumId;
            const album = await collections.albums!.aggregate(
                getAlbumQueryPipeline(albumId)
            ).toArray();

            if (!album || album.length === 0) {
                console.error("Album not found");
            } else {
                const tracks = album[0].tracks;
                if (tracks.length === 0) {
                    console.log("Album is empty");
                    await collections.albums!.deleteOne({ albumId: albumId });
                }
            }
            res.status(200).json({ message: "Song deleted successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});