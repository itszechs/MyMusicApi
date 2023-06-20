import express, { Request, Response, Router, } from "express";
import { collections } from "../services/database";

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
