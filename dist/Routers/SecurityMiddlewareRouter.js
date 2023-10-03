"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const router = express_1.default.Router();
router.use((0, helmet_1.default)());
router.use((0, express_mongo_sanitize_1.default)());
router.use((req, _res, next) => {
    // Iterate through the query parameters and sanitize them
    for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
            req.query[key] = (0, sanitize_html_1.default)(String(req.query[key]));
        }
    }
    // Iterate through the body parameters and sanitize them (if using body-parser or express.json)
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = (0, sanitize_html_1.default)(String(req.body[key]));
        }
    }
    next(); // Move to the next middleware or route handler
});
router.use((0, cookie_parser_1.default)());
exports.default = router;
