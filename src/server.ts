import dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/../config.env` });
import app from "./app";
import dbConnection from "./dbConnection";
import RedisServer from "./RedisConnection";
import cloudinaryConfiguration from "./CloudinaryConnection";
const PORT = process.env.PORT || 3000;

const server: () => void = async () => {
	try {
		dbConnection(); //DB connection
		cloudinaryConfiguration();
		app.listen(PORT, () => {
			if (process.env.NODE_ENV === "development") console.log(`App is running at port ${PORT}`);
		});
		await RedisServer(); //Redis connection
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.log(err);
		process.exit(1);
	}
};

//running the server
server();
