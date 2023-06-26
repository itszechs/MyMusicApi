import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from "express";
import { collections, connectToDatabase } from "./services/database";
import { artistRouter } from "./routes/artist";
import { albumRouter } from "./routes/album";
import { songRouter } from './routes/song';

// Load environment variables from the .env file, where the ATLAS_URI is configured
dotenv.config();

const { ATLAS_URI, CLOUDDB_URI } = process.env;

if (!ATLAS_URI && !CLOUDDB_URI) {
    console.error("Please define the ATLAS_URI and CLOUDDB_URI environment variables inside .env");
    process.exit(1);
}

connectToDatabase(ATLAS_URI!, CLOUDDB_URI!)
    .then(() => {
        const app = express();

        app.listen(5500, () => {
            console.log(`Server running at http://localhost:5500`);
        });

        // Health check route
        app.get("/", (_req: Request, res: Response) => {
            res.send({
                message: "Api is active!",
            });
        });

        // Artists route
        app.use("/api/v1/artists", artistRouter);
        // Albums route
        app.use("/api/v1/albums", albumRouter);
        // Albums route
        app.use("/api/v1/songs", songRouter);

        // Invalid route message
        app.use((_req: Request, res: Response, _next: NextFunction) => {
            res.status(404).send({
                error: "Not Found",
            });
        });
    }).catch(error => console.error(error));