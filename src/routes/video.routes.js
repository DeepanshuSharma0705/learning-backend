import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { publishAVideo , getVideoById} from "../controllers/video.controller.js";


const router = Router()

router.route("/video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    }
  ]),
  publishAVideo
);

router.route("/:videoId").get(getVideoById);

export default router