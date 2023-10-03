"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const deletingAssetFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.unlink(filePath, err => {
            if (err)
                return reject(err);
            return resolve('File removed successfully');
        });
    });
};
exports.default = deletingAssetFile;
