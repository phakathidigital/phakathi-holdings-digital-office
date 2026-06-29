import multer from "multer";
import { uploadDir } from "../config/paths.js";

export const upload = multer({ dest: uploadDir });
