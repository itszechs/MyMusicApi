import express, {NextFunction, Request, Response} from "express";

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

// Invalid route message
app.use((_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).send({
        error: "Not Found",
    });
});

