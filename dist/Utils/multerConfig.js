"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const multer_1 = __importDefault(require("multer"));
const customError_1 = __importDefault(require("./customError"));
const multerFilter = (_req, file, cb) => {
    var _a, _b, _c;
    if (((_a = file.mimetype) === null || _a === void 0 ? void 0 : _a.startsWith("image")) || ((_b = file.mimetype) === null || _b === void 0 ? void 0 : _b.startsWith("video")) || ((_c = file.mimetype) === null || _c === void 0 ? void 0 : _c.startsWith("audio")))
        cb(null, true);
    else {
        if (process.env.NODE_ENV === "development")
            console.log("Not an supported file format");
        cb(new customError_1.default(400, "Not a supported file format"), false);
    }
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: multerFilter,
    limits: { fileSize: 4 * 1024 * 1024 },
});
exports.uploadFile = upload.single("file");
