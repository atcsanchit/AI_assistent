import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

var corsOption = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
}

app.use(cors(corsOption));
app.use(helmet());
app.use(express.json());

export default app;