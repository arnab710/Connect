import express, { NextFunction, Request, Response, Router } from "express";
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import MongoSanitize from'express-mongo-sanitize';
import sanitizeHtml from 'sanitize-html';

const router:Router = express.Router();

router.use(helmet());
router.use(MongoSanitize());

router.use((req: Request, _res: Response, next: NextFunction) => {
       // Iterate through the query parameters and sanitize them
       
       for (const key in req.query) {
         if (typeof req.query[key] === 'string') {
           req.query[key] = sanitizeHtml(String(req.query[key]));
         }
       }
     
       // Iterate through the body parameters and sanitize them (if using body-parser or express.json)
       for (const key in req.body) {
         if (typeof req.body[key] === 'string') {
           req.body[key] = sanitizeHtml(String(req.body[key]));
         }
       }
     
       next(); // Move to the next middleware or route handler
});

router.use(cookieParser());

export default router;