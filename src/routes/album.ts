import express, { Request, Response, Router, } from "express";
import { collections } from "../services/database";
import sharp from "sharp";

export const albumRouter = Router();
albumRouter.use(express.json());

albumRouter.get("", async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const albumsCount = await collections.albums!.countDocuments();
        const totalPages = Math.ceil(albumsCount / limit);

        if (page < 1 || page > totalPages) {
            return res.json({ totalPage: totalPages, page, results: [] });
        }

        const skip = (page - 1) * limit;

        let albums = await collections.albums!
            .aggregate([
                { $project: { albumArt: 0, _id: 0 } },
                { $sort: { albumName: 1 } },
                { $skip: skip },
                { $limit: limit },
            ], { collation: { locale: "en" } })
            .toArray();

        const response = {
            totalPage: totalPages,
            page,
            results: albums,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


albumRouter.get("/:albumId", async (req: Request, res: Response) => {
    try {
        const albumId = req.params.albumId;
        const album = await collections.albums!.aggregate([
            { $match: { albumId: albumId } },
            { $project: { albumArt: 0 } },
            {
                $lookup: {
                    from: "tracks",
                    localField: "albumId",
                    foreignField: "albumId",
                    as: "tracks"
                }
            },
            { $unwind: "$tracks" },
            {
                $sort: {
                    discNumber: 1,
                    trackNumber: 1
                }
            },
            {
                $group: {
                    _id: "$_id",
                    artistId: { $first: "$artistId" },
                    albumId: { $first: "$albumId" },
                    albumName: { $first: "$albumName" },
                    year: { $first: "$year" },
                    tracks: { $push: "$tracks" }
                }
            },
            {
                $project: { "tracks.albumName": 0 }
            }
        ]).toArray();

        if (!album || album.length === 0) {
            res.status(404).json({ error: "Album not found" });
            return;
        }
        res.json(album[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

albumRouter.get("/art/:albumId", async (req: Request, res: Response) => {
    try {
        const albumId = req.params.albumId;
        let size = req.query.size;
        if (!["small", "default", "large", "original"].includes(size as string)) {
            res.redirect(`/api/v1/albums/art/${albumId}?size=default`);
            return;
        }

        const albumArt = await collections.images!.find({ albumId: albumId }).toArray();
        if (!albumArt || albumArt.length === 0) {
            res.status(404).json({ error: "Album art not found" });
            return;
        }
        const image = albumArt[0];
        const imageBuffers: any[] = [];

        const readStream = collections.images!.openDownloadStream(image._id);
        readStream.on("data", (chunk) => imageBuffers.push(chunk));
        readStream.on("end", async () => {
            let imageBuffer = Buffer.concat(imageBuffers);

            if (size === "small") {
                imageBuffer = await sharp(imageBuffer)
                    .resize({ width: 250, height: 250 })
                    .toBuffer();
            } else if (size === "default") {
                imageBuffer = await sharp(imageBuffer)
                    .resize({ width: 500, height: 500 })
                    .toBuffer();
            } else if (size === "large") {
                imageBuffer = await sharp(imageBuffer)
                    .resize({ width: 1000, height: 1000 })
                    .toBuffer();
            }

            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": imageBuffer.length
            });
            res.end(imageBuffer);
            return;
        });

        readStream.on("error", (err) => {
            console.log(err);
            res.status(500).json({ error: "Internal Server Error" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
