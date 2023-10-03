"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: [true, "Please Provide Your First Name"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Please Provide Your Last Name"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Please Provide Your Email Address"],
        trim: true,
        unique: true,
        validate: {
            validator: function (val) {
                return validator_1.default.isEmail(val);
            },
            message: "Please Provide a Valid Email",
        },
    },
    password: {
        type: String,
        required: [true, "Please Provide a Strong Password"],
        minLength: [8, "Password Should Be Minimum 8 Characters Long"],
        select: false,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
        select: false,
    },
    profilePicture: {
        type: String,
        default: "",
    },
    coverPicture: {
        type: String,
        default: "",
    },
    followers: {
        type: [
            {
                user: {
                    type: mongoose_1.default.Schema.ObjectId,
                    ref: "User",
                },
            },
        ],
        default: [],
    },
    followings: {
        type: [
            {
                user: {
                    type: mongoose_1.default.Schema.ObjectId,
                    ref: "User",
                },
            },
        ],
        default: [],
    },
    passwordChangedAt: {
        type: Date,
        select: false,
    },
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    city: {
        type: String,
        required: [true, "Please Provide Your Current City"],
        maxlength: [20, "City Name Must Be Atmost 20 Characters Long"],
    },
    country: {
        type: String,
        required: [true, "Please Provide Your Current Country"],
        maxlength: [20, "Country Name Must Be Atmost 20 Characters Long"],
    },
    bio: {
        type: String,
        required: [true, "Please provide your bio"],
        minlength: [5, "Bio Must Be Atleast 5 Characters Long"],
        maxlength: [300, "Bio Must Be Atmost 300 Characters Long"],
    },
    occupation: {
        type: String,
        required: [true, "Please Provide Your Occupation"],
        maxlength: [30, "Occupation Name Must Be Atmost 30 Characters Long"],
    },
}, { timestamps: true });
//hashing password
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        this.password = yield bcryptjs_1.default.hash(this.password, 12);
        next();
    });
});
//for creating a field for passwordChangedAt
UserSchema.pre("save", function (next) {
    //checking if password is modified or new data entried for the first time
    if (!this.isModified("password") || this.isNew)
        return next();
    //for real life purpose , saving it 1s earlier
    this.passwordChangedAt = Date.now() - 1000;
    next();
});
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;
