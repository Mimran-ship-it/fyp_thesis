import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  api_key: "844285675449451",
  api_secret: "QN-Z_uYHC-r1dKt1JYgfrzBrBgs",
});

const result = await cloudinary.api.ping();
console.log(result);

