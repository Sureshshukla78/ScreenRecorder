const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const router = express();
const dotenv = require("dotenv");
const multer = require("multer");
const user = require("../controllers/user");
const isAuth = require("../middleware/auth");
dotenv.config();

const videoStorage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
const profilePicStorage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const videoUpload = multer({
  storage: videoStorage,
});
const profilePicUpload = multer({
  storage: profilePicStorage,
});

router
  .route("/uploadVideo")
  .post(isAuth, videoUpload.single("video"), catchAsync(user.uploadVideo));

router
  .route("/register")
  .get(catchAsync(user.getRegister))
  .post(catchAsync(user.postRegister));

// router.route("/validate").post(catchAsync(user.emailVerification));
router.route("/verify/:token").get(user.getEmailToken);
// .post(user.postEmailToken);

router
  .route("/login")
  .get(catchAsync(user.getLogin))
  .post(catchAsync(user.postLogin));

router.route("/googleLogin").post(catchAsync(user.googleLogin));

router.route("/home").get(isAuth, catchAsync(user.personal));
router.route("/search/:name").get(isAuth, catchAsync(user.search));
router.route("/settings").get(isAuth, catchAsync(user.settings));
router.route("/userDetails").get(isAuth, catchAsync(user.userDetails));

router.route("/:id/watch").get(catchAsync(user.userVideoLink));
router.route("/:id/watch/:name").get(catchAsync(user.userVideoLink));
router.route("/:videoId/moveVideo/:folderId").get(catchAsync(user.moveVideo));

router.route("/:folderId/deleteFolder").get(catchAsync(user.deleteFolder));
router.route("/:videoId/changePermission/:email/:permission").get(catchAsync(user.changePermission));
router.route("/renameFolder").post(catchAsync(user.renameFolder));

router
  .route("/:id/watch/changeDetails")
  .post(isAuth, catchAsync(user.changeDetails));


router.route("/me").get(isAuth, user.sharedWithMe);
router.route("/team").get(isAuth, user.sharedWithOthers);

// router.route("/changeUsername").post(isAuth, user.changeUserName);
// router.route("/changePassword").post(isAuth, user.changePassword);
router
  .route("/uploadPhoto")
  .post(isAuth, profilePicUpload.single("mypic"), user.uploadPhoto);

router
  .route("/addFolder")
  .post(isAuth, user.addFolder);

router.route("/:id/deleteVideo").get(isAuth, user.deleteVideo);

router.route("/:id/folder").get(isAuth, user.folder);

router.route("/getProfilePic").get(isAuth, user.getProfilePic);
router.route("/removeProfilePic").get(isAuth, user.removeProfilePic);

router.route("/logout").get(user.logout);

router
  .route("/:id/edit")
  .get(catchAsync(user.edit))

module.exports = router;
