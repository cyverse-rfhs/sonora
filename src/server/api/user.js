import express from "express";

import * as auth from "../auth";
import logger from "../logging";

import { handler as terrainHandler } from "./terrain";

export default function userRouter() {
    const api = express.Router();

    logger.info("adding the GET /api/profile handler");
    api.get("/profile", (req, res) => res.json(auth.getUserProfile(req)));

    logger.info("adding the GET /api/user-info handler");
    api.get(
        "/user-info",
        auth.authnTokenMiddleware,
        terrainHandler({
            method: "GET",
            pathname: "/secured/user-info",
        })
    );

    logger.info("adding the GET /api/dashboard handler");
    api.get(
        "/dashboard",
        auth.authnTokenMiddleware,
        terrainHandler({
            method: "GET",
            pathname: "/dashboard",
            headers: {
                "Content-Type": "application/json",
            },
        })
    );

    return api;
}
