import dotenv from 'dotenv'
import express, {NextFunction, Request, Response} from "express";
import {connectToDatabase} from "./services/database";
import {artistRouter} from "./routes/artist";
import {albumRouter} from "./routes/album";

// Load environment variables from the .env file, where the ATLAS_URI is configured
dotenv.config();

const {ATLAS_URI} = process.env;

if (!ATLAS_URI) {
    console.error("No ATLAS_URI environment variable has been defined in config.env");
    process.exit(1);
}

connectToDatabase(ATLAS_URI)
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

        // Invalid route message
        app.use((_req: Request, res: Response, _next: NextFunction) => {
            res.status(404).send({
                error: "Not Found",
            });
        });

    }).catch(error => console.error(error));