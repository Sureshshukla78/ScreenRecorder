const User = require("../models/User");
const UserVideo = require("../models/UserVideo");
const Video = require("../models/Video");
const Folder = require("../models/Folder");
// const Report = require("../models/Report");
const ExpressError = require("../../utils/ExpressError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const fs = require("fs");
const { Op } = require("sequelize");
// var ffmpeg = require('fluent-ffmpeg');
const path = require('path')
// const streamifier = require("streamifier");
const exec = require('child_process').exec;
// ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

// ffmpeg.setFfprobePath("/usr/bin/ffprobe");

// ffmpeg.setFlvtoolPath("C:/flvtool");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});

const { OAuth2Client } = require("google-auth-library");
const { S3 } = require("aws-sdk");
const CLIENT_ID = "198561696099-flasriqkqqlkn2db9ttq6ellso1g6kdn.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// Home Page  
module.exports.home = async (req, res) => {
  if (req.session.userId) {
    req.flash("success", `Welcome Back ${req.session.name}`);
    res.redirect("/home");
  } else {
    res.render("home", { title: "Screen Recorder" });
  }
};

function os_func() {
  this.execCommand = function (cmd, callback) {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      callback(stdout);
    });
  }
}
//upload video
module.exports.uploadVideo = async (req, res) => {
  try {
    console.log("UploadVideo");
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const time = new Date()
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
      .toLowerCase();
    let dateNow = new Date()
      .toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })
      .toLowerCase().split('/')
    let date = `${dateNow[1]} ${months[dateNow[0] - 1]} ${dateNow[2]}`;
    let fName = `${time} - ${date} - ATG RECORDER`;
    let file = req.files.video;
    if (req.files.meetName) {
      if (req.files.meetName.name !== 'null')
        fName = `${req.files.meetName.name} - ${fName}`;
    }
    let fileName = `${Date.now()}.mkv`
    let folderId = null;
    if (req.files.video.name !== 'video.mp4')
      folderId = req.files.video.name.split('.')[0];
    let startTime = Date.now();
    console.log(`Start Time Video Upload : ${startTime / 1000}s`);

    file.mv("tmp/" + fileName, function (err) {
      if (err) return res.sendStatus(500).send(err);
      console.log("File Uploaded successfully");
    });

    console.log(`Video Upload Time : ${(Date.now() - startTime) / 1000}s`);

    var os = new os_func();
    let videoPath = path.join(__dirname + "../../../tmp/");
    let convertedPath = path.join(__dirname + "../../../public/Videos/");
    let fileContent;
    os.execCommand(`ffmpeg -i ${videoPath + fileName} -c copy -strict -2 ${convertedPath + fileName}`, function (returnvalue) {
      fileContent = fs.readFileSync(convertedPath + fileName);
      // console.log(fileContent);
      console.log(`Video conversion Time : ${(Date.now() - startTime) / 1000}s`);
      // console.log(convertedPath + fileName)

      const params = {
        Bucket: `${process.env.AWS_BUCKET_NAME}/recordings`,
        ACL: "public-read",
        Key: fileName,
        Body: fileContent,
      };

      s3.upload(params, async (error, data) => {
        if (error) {
          console.log(error);
          res.status(500).json(error);
        }
        const videoLink = await Video.create({
          title: fName,
          url: `recordings/${fileName}`,
          user_id: req.session.userId,
          folder_id: folderId,
        });
        await videoLink.save();

        const details = {
          watchableLink: `meet.atg.party/${videoLink.id}/watch`,
          downloadableLink: data.Location,
          title: fName,
        };

        console.log(`After Upload : ${(Date.now() - startTime) / 1000}`);
        res.status(200).json(details);
        fs.unlink((videoPath + fileName), function (err) {
          if (err) throw err;
          console.log("File deleted from tmp");
        });
        fs.unlink((convertedPath + fileName), function (err) {
          if (err) throw err;
          console.log("File deleted from converted file");
        });
      });
      console.log(`Video Uploading Time : ${(Date.now() - startTime) / 1000}s`);
    });
  } catch (e) {
    console.log("catch block");
    console.log(e);
    return new ExpressError(e);
  }
};

// rendering Regsiter Page
module.exports.getRegister = async (req, res) => {
  if (!req.session.userId) {
    res.render("user/register", {
      title: "Register",
    });
  } else {
    req.flash("success", `Already LoggedIn As ${req.session.email}`);
    res.redirect("/home");
  }
};

// Register User
module.exports.postRegister = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const oldUser = await User.findOne({ where: { email: email } });
    console.log(oldUser);
    if (oldUser) {
      req.flash("error", "User Already Exist");
      return res.redirect("/register");
    }
    if (
      password < 8 ||
      password.search(/[0-9]/) == -1 ||
      password.search(/[a-z]/) == -1 ||
      password.search(/[A-Z]/) == -1 ||
      password.search(/[!/@/#/$/%/^/&/(/)/_/+/./,/:/;/*/]/) == -1
    ) {
      req.flash(
        "error",
        "password should contain at least one lowercase character, at least one uppercase character, at least one numeric value,  at least one special character,  minimum 8 characters"
      );
      return res.redirect("/register");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: username,
      email,
      password: encryptedPassword,
      login_type: "login",
    });
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.SESSION_TOKEN_KEY
    );
    user.token = token;
    await user.save();
    sendEmail(user, token);
    req.flash("success", `Email has been sent to ${email}`);
    res.redirect("/login");
  } catch (e) {
    console.log(e);
    req.flash("error", e);
    res.redirect("/register");
  }
};

// verifying Gmail using token
module.exports.getEmailToken = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ where: { token: token } });
  if (user) {
    user.is_verified = true;
    user.token = null;
    await user.save();
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.isAuth = true;
    req.flash("success", "Your email is verified successfully");
    res.redirect("/home");
  } else {
    err = "Invalid URL";
    console.log(err);

    req.flash("error", err);
    res.redirect("/register");
  }
};

// Rendering login page
module.exports.getLogin = async (req, res) => {
  if (!req.session.userId) {
    res.render("user/login", {
      err: false,
      title: "Login",
    });
  } else {
    req.flash("success", `Welcome Back ${req.session.name}`);
    res.redirect("/home");
  }
};

// Login User
module.exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email } });
    if (user && user.is_verified) {
      if (user.login_type === 'googleLogin') {
        err = "user is registered with google try to login using google.";
        req.flash("error", err);
        res.redirect('/login');
      }
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.userId = user.id;
        req.session.name = user.name;
        req.session.email = user.email;
        req.session.isAuth = true;
        req.flash('success', `Welcome Back ${req.session.name}`);
        res.redirect("/home");
      } else {
        req.flash("error", "Invalid Password");
        res.redirect("/login");
      }
    } else {
      if (!user) {
        err = "User Doesn't Exist";
      } else {
        err = `Verification mail sent, Please verify to login.`;
        const token = jwt.sign(
          { user_id: user.id, email: user.email },
          process.env.SESSION_TOKEN_KEY
        );
        user.token = token;
        await user.save()
        sendEmail(user, token);
      }
      req.flash("error", err);
      res.redirect("/login");
    }
  } catch (e) {
    console.log(e);
    req.flash("something went wrong");
    res.redirect('/login');
  }
};

// Google Login
module.exports.googleLogin = async (req, res) => {
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];
    console.log(payload);
    const user = await User.findOne({ where: { email: payload.email } });

    if (!user) {
      const newUser = await User.create({
        name: payload.name,
        email: payload.email,
        login_type: "googleLogin",
        is_verified: true,
      });
      await newUser.save();
    }
    req.session.userId = user.id;
    req.session.name = user.name;
    req.session.email = payload.email;
    req.session.isAuth = true;
  }
  verify().then(() => {
    res.send("success");
  }).catch(console.error);
};

// Rendering Setting Page
module.exports.settings = async (req, res) => {
  const user = await User.findOne({ where: { email: req.session.email } });
  res.render("user/setting", {
    user,
    title: "Settings",
    awsLink: process.env.AWS_STATIC_LINK,
  });
};

// Rendering SharedWithMe
module.exports.sharedWithMe = async (req, res) => {
  const userEmail = req.session.email;
  const user = await User.findOne({ where: { id: req.session.userId } });
  const uservideos = await UserVideo.findAll({
    order: [['createdAt', 'DESC']],
    where: { user_email: userEmail },
  });
  var arr = [];
  var sharedvideos = [];
  var videoAndSharedMembers = [];
  for (let i = 0; i < uservideos.length; i++) {
    if (arr.includes(uservideos[i].video_id)) {
      continue;
    }
    arr.push(uservideos[i].video_id);
  }
  for (let i = 0; i < arr.length; i++) {
    let members = await UserVideo.findAll({
      where: {
        video_id: arr[i],
      },
      raw: true
    });
    let member = {
      id: arr[i],
      team_member_details: []
    }
    for (let j = 0; j < members.length; j++) {
      var team = await User.findOne({ where: { email: members[j].user_email }, raw: true })
      if (team) {
        var { name, email, profile_picture } = team;
        member.team_member_details.push({ name, email, profile_picture })
      }
    }
    videoAndSharedMembers.push(member)
  }
  console.log(videoAndSharedMembers);

  for (let i = 0; i < arr.length; i++) {
    const videos = await Video.findOne({
      where: {
        id: arr[i],
      },
    });
    if (videos) {
      sharedvideos.push(videos);
    }
  }
  let videos = [];
  for (i = 0; i < sharedvideos.length; i++) {
    var title = sharedvideos[i].dataValues.title
    var id = sharedvideos[i].dataValues.id
    var url = sharedvideos[i].dataValues.url
    var user_id = sharedvideos[i].dataValues.user_id
    var status = sharedvideos[i].dataValues.status
    var notes = sharedvideos[i].dataValues.notes
    var folder_id = sharedvideos[i].dataValues.folder_id
    var urlname = sharedvideos[i].dataValues.title.replace(/\s/g, "_");
    var team_member_details = videoAndSharedMembers[i]
    videos.push({ title: title, id: id, user_id: user_id, status: status, notes: notes, folder_id: folder_id, url: url, urlname: urlname, team_member_details })
  }
  console.log(videos);
  res.render("user/me", {
    videos,
    title: "Shared Videos",
    awsLink: process.env.AWS_STATIC_LINK,
  });
};

// Rendering SharedWith Others
module.exports.sharedWithOthers = async (req, res) => {
  const user = await User.findOne({ where: { id: req.session.userId } });
  const videosUser = await Video.findAll({
    where: { user_id: req.session.userId }
  });
  let arr = [];
  for (let i = 0; i < videosUser.length; i++) {
    const userVideos = await UserVideo.findOne({
      where: {
        video_id: videosUser[i].id,
      },
    });
    if (!userVideos) {
      continue
    }
    if (arr.includes(userVideos.video_id)) {
      continue;
    }
    if (userVideos) {
      arr.push(userVideos.video_id);
    }
  }
  const videos = await Video.findAll({
    order: [['createdAt', 'DESC']],
    where: { id: { [Op.in]: arr } },
  });
  var videoAndSharedMembers = [];
  for (let i = 0; i < arr.length; i++) {
    let members = await UserVideo.findAll({
      where: {
        video_id: arr[i],
      },
      raw: true
    });
    let member = {
      id: arr[i],
      team_member_details: []
    }
    for (let j = 0; j < members.length; j++) {
      var team = await User.findOne({ where: { email: members[j].user_email }, raw: true })
      if (team) {
        var { name, email, profile_picture } = team;
        member.team_member_details.push({ name, email, profile_picture })
      }
      console.log(team);
    }
    videoAndSharedMembers.push(member)
  }
  let video = [];
  for (i = 0; i < videos.length; i++) {
    var title = videos[i].dataValues.title
    var id = videos[i].dataValues.id
    var url = videos[i].dataValues.url
    var user_id = videos[i].dataValues.user_id
    var status = videos[i].dataValues.status
    var notes = videos[i].dataValues.notes
    var folder_id = videos[i].dataValues.folder_id
    var urlname = videos[i].dataValues.title.replace(/\s/g, "_");
    var team_member_details = videoAndSharedMembers[i];
    video.push({ title: title, id: id, user_id: user_id, status: status, notes: notes, folder_id: folder_id, url: url, urlname: urlname, team_member_details })
  }

  res.render("user/team", {
    video,
    user,
    title: "Shared with Team",
    awsLink: process.env.AWS_STATIC_LINK,
  });
};

module.exports.personal = async (req, res) => {
  const userEmail = req.session.email;
  const user = await User.findOne({ where: { id: req.session.userId } });
  let uservideos = await Video.findAll({
    order: [['createdAt', 'DESC']], where: { user_id: user.id, folder_id: null }
  });
  let videos = [];
  for (i = 0; i < uservideos.length; i++) {
    var title = uservideos[i].dataValues.title
    var id = uservideos[i].dataValues.id
    var url = uservideos[i].dataValues.url
    var user_id = uservideos[i].dataValues.user_id
    var status = uservideos[i].dataValues.status
    var notes = uservideos[i].dataValues.notes
    var folder_id = uservideos[i].dataValues.folder_id
    var urlname = uservideos[i].dataValues.title.replace(/\s/g, "_");
    videos.push({ title: title, id: id, user_id: user_id, status: status, notes: notes, folder_id: folder_id, url: url, urlname: urlname })
  }
  const folder = await Folder.findAll({ where: { user_id: req.session.userId } })
  res.render("user/myVideo", {
    videos,
    user,
    urlname,
    folder,
    user_email: userEmail,
    title: "Screen Recorder",
    awsLink: process.env.AWS_STATIC_LINK,
  });
};

module.exports.userVideoLink = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findOne({ where: { id: id } });
  const user = await User.findOne({ where: { id: video.user_id } });
  const uservideo = await UserVideo.findAll({
    where: { video_id: id },
  });
  let permission = null;
  if (req.session.email) {
    permission = await UserVideo.findOne({
      where: { video_id: id, user_email: req.session.email }
    })
  }
  if (permission == null)
    if (video.user_id == req.session.userId) {
      permission = {
        permission: "owner"
      }
    } else {
      permission = {
        permission: "no permission"
      }
    }
  var team_member = [];
  for (i = 0; i < uservideo.length; i++) {
    team_member.push({ email: uservideo[i].user_email, permission: uservideo[i].permission });
  }
  var userData;
  if (video.status == "public") {
    if (req.session) {
      userData = req.session;
      console.log(userData);
      console.log(video);
      return res.render("user/publicVideoPage", {
        video,
        permission,
        user,
        team_member,
        userData,
        title: video.title,
        awsLink: process.env.AWS_STATIC_LINK,
      });
    } else {
      res.render("user/publicVideoPage", { video, uservideo, title: video.title });
    }
  } else if (video.status == 'private') {
    if (permission.permission != "no permission") {
      const userData = req.session;
      res.render("user/publicVideoPage", {
        video,
        permission,
        user,
        team_member,
        userData,
        title: video.title,
        awsLink: process.env.AWS_STATIC_LINK,
      });
    } else {
      res.redirect("/login");
    }
  }
};

// changing deatils
module.exports.changeDetails = async (req, res) => {
  const { id } = req.params;
  console.log(req.body);
  const { name, addMember, removeMember, meetingNotes, status, permission } = req.body;
  const video = await Video.findOne({ where: { id } });
  video.title = name;
  video.notes = meetingNotes;
  video.status = status;
  await video.save();
  // adding team member;
  if (addMember !== "")
    var members = addMember.split(",");
  else
    var members = [];
  if (members.length != 0) {
    for (let i = 0; i < members.length; i++) {
      // check for existence
      const checkUser = await UserVideo.findOne({ where: { user_email: members[i].trim(), video_id: id } });
      if (checkUser) {
        continue;
      }
      // adding team member
      const uservideo = await UserVideo.create({
        user_email: members[i].trim(),
        video_id: id,
        permission: permission
      });
      await uservideo.save()
    }
  }

  // removing member
  if (removeMember !== "")
    var remMember = removeMember.split(",");
  else
    var remMember = [];
  if (remMember.length != 0) {
    for (let i = 0; i < remMember.length; i++) {
      const checkUser = await UserVideo.findOne({ where: { user_email: remMember[i].trim(), video_id: id } });
      if (!checkUser) {
        continue;
      }
      // remove team member
      const uservideo = await UserVideo.destroy({ where: { user_email: remMember[i], video_id: id } });
    }
  }
  var urlname = video.dataValues.title.replace(/\s/g, "_");
  req.flash("success", "Details Added successfully");
  res.redirect(`/${id}/watch/${urlname}`);
};

// Change Username
module.exports.changeUserName = async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ where: { id: req.session.userId } });
  user.name = username;
  await user.save();
  req.session.name = user.name;
  req.flash("success", `Name changed successfully to ${username}`);
  res.redirect("/settings");
};

// change Password
module.exports.changePassword = async (req, res) => {
  const { password, newPassword, confirmPassword } = req.body;
  const user = await User.findOne({ where: { id: req.session.userId } });
  if (user.login_type == "googleLogin") {
    if (
      newPassword < 8 ||
      newPassword.search(/[0-9]/) == -1 ||
      newPassword.search(/[a-z]/) == -1 ||
      newPassword.search(/[A-Z]/) == -1 ||
      newPassword.search(/[!/@/#/$/%/^/&/(/)/_/+/./,/:/;/*/]/) == -1
    ) {
      req.flash(
        "error",
        "password should contain minimum 8 characters, at least one lowercase,at least one uppercase, at least one numeric value, at least one special character"
      );
    }
    if (newPassword == confirmPassword) {
      newEncryptedPassword = await bcrypt.hash(newPassword, 10);
      console.log(newEncryptedPassword);
      user.password = newEncryptedPassword;
      await user.save();
      req.flash("success", "Password Changed");
      res.redirect("/settings");
    } else req.flash("error", "New password and confirm password must match");
    res.redirect("/settings");
  } else {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      if (
        newPassword < 8 ||
        newPassword.search(/[0-9]/) == -1 ||
        newPassword.search(/[a-z]/) == -1 ||
        newPassword.search(/[A-Z]/) == -1 ||
        newPassword.search(/[!/@/#/$/%/^/&/(/)/_/+/./,/:/;/*/]/) == -1
      ) {
        req.flash(
          "error",
          "password should contain minimum 8 characters, at least one lowercase,at least one uppercase, at least one numeric value, at least one special character"
        );
        res.redirect("/settings");
      }
      if (newPassword == confirmPassword) {
        newEncryptedPassword = await bcrypt.hash(newPassword, 10);
        console.log(newEncryptedPassword);
        user.password = newEncryptedPassword;
        await user.save();
        req.flash("success", "Password Changed");
        res.redirect("/settings");
      } else {
        req.flash("error", "New password and confirm password must match");
        res.redirect("/settings");

      }
    } else {
      req.flash("error", "Current password doesn't match");
      res.redirect("/settings");
    }
  }
};

// Add Profile 
module.exports.uploadPhoto = async (req, res) => {
  try {
    myFile = req.files.mypic.name.split(".");
    fileType = myFile[myFile.length - 1];
    let name = Date.now();
    const profilePicName = `${name}.${fileType}`;
    const params = {
      Bucket: `${process.env.AWS_BUCKET_NAME}/user`,
      ACL: "public-read",
      Key: profilePicName,
      Body: req.files.mypic.data,
    };
    s3.upload(params, async (error, data) => {
      if (error) {
        res.status(500).json(error);
      }
      const user = await User.findOne({ where: { id: req.session.userId } });
      user.profile_picture = `user/${profilePicName}`;
      await user.save();
      req.flash("success", "Uploaded profile picture");
      res.status(200).redirect("/settings");
    });
  } catch (e) {
    return new ExpressError(e);
  }
};

// Remove Profile
module.exports.removeProfilePic = async (req, res) => {
  const user = await User.findOne({ where: { id: req.session.userId } });
  user.profile_picture = null;
  await user.save();
  req.flash("success", "Profile pic removed");
  res.redirect("/settings");
};

// logout
module.exports.logout = (req, res) => {
  req.flash("success", "Logged out successfully");
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
};


module.exports.edit = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findOne({ raw: true, where: { id: id } });
  const user = await User.findOne({ where: { id: video.user_id } });
  const uservideo = await UserVideo.findAll({
    where: { video_id: id },
  });
  const permission = await UserVideo.findOne({
    where: { video_id: id, user_email: req.session.email }
  })
  var team_member = [];
  for (i = 0; i < uservideo.length; i++) {
    team_member.push(uservideo[i].user_email);
  }
  var userData;
  if (video.status == "public") {
    if (req.session) {
      userData = req.session;
      console.log(userData);
      return res.render("user/editVideo", {
        video,
        user,
        permission,
        team_member,
        userData,
        title: video.title,
        awsLink: process.env.AWS_STATIC_LINK,
      });
    } else {
      res.render("user/editVideo", { video, uservideo });
    }
  } else if (video.status == 'private') {
    if (req.session.userId) {
      const userData = req.session;
      res.render("user/editVideo", {
        video,
        user,
        permission,
        team_member,
        userData,
        title: video.title,
        awsLink: process.env.AWS_STATIC_LINK,
      });
    } else {
      res.redirect("/login");
    }
  }
}

// send verification mail function
async function sendEmail(user, token) {

  const url = `${process.env.EMAILHOSTLINK}/verify/${token}`;
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    // secure: true,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_HOST_USER, // generated ethereal user
      pass: process.env.EMAIL_HOST_PASSWORD, // generated ethereal password
    },
  });
  let mailOptions = {
    from: process.env.DEFAULT_FROM_EMAIL, // sender address
    to: user.email, // list of receivers
    subject: "ATG-MEET email verification", // Subject line
    // text: `To verify you email please click the following url: ${url} `, // plain text
    html: `Please click this email to confirm your email: <a href="${url}">${url}</a>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return false;
    } else {
      console.log(info);
      return true;
    }
  });
}


module.exports.userDetails = async (req, res) => {
  res.json(req.session);
};
module.exports.deleteVideo = async (req, res) => {
  try {
    console.log("delete video");
    const { id } = req.params;
    const video = await Video.findOne({ where: { id: id } });
    //video.profile_picture = null;
    let fileName = video.url.split('/')[1]
    console.log(fileName);
    const params = {
      Bucket: `${process.env.AWS_BUCKET_NAME}/recordings`,
      Key: fileName,
    };
    s3.deleteObject(params, async function (err, data) {
      if (err) {
        console.log(err, err.stack);
        req.flash("error", "video is not deleted");
        res.redirect("/home");
      }
      else {
        await Video.destroy({ where: { id: id } });
        await video.save();
        console.log("deleted");
        req.flash("success", "video deleted successfully");
        res.redirect("/home");
      }
    });
  } catch {
    req.flash("error", "video is not deleted");
    res.redirect("/home");
  }
}
module.exports.addFolder = async (req, res) => {
  try {
    console.log(req.body);
    const folder = await Folder.create({
      user_id: req.session.userId,
      folder_name: req.body.name
    })
    await folder.save()
    res.redirect('/home')
  } catch (err) {
    console.log(err);
    res.redirect('/home')
  }
};
module.exports.folder = async (req, res) => {
  const { id } = req.params
  const userEmail = req.session.email
  const user = await User.findOne({ where: { id: req.session.userId } });
  const uservideos = await Video.findAll({
    order: [['createdAt', 'DESC']], where: { folder_id: id }
  });
  const folders = await Folder.findAll({
    where: {
      user_id: req.session.userId,
      id: { [Op.ne]: id }
    }
  });
  const folder = await Folder.findOne({ raw: true, where: { id: id } })
  console.log(folder.folder_name)
  res.render("user/folderPage", {
    uservideos,
    user,
    folder,
    folders,
    user_email: userEmail,
    title: "ATG MEET",
    awsLink: process.env.AWS_STATIC_LINK,
  });
}
module.exports.moveVideo = async (req, res) => {
  let { videoId } = req.params
  let { folderId } = req.params
  console.log("videoID : " + videoId + "folderId  : " + folderId)
  const videos = await Video.findOne({ where: { id: videoId } })
  if (folderId == 0)
    videos.folder_id = null;
  else
    videos.folder_id = folderId;
  await videos.save()
  res.redirect('/home')
}
module.exports.deleteFolder = async (req, res) => {
  let { folderId } = req.params
  const videos = await Video.findOne({ where: { folder_id: folderId } })
  console.log(videos);
  if (videos) {
    console.log("contain video");
    req.flash("error", "The folder can't be deleted.Because it contains videos");
    res.redirect('/home')
  }
  else {
    await Folder.destroy({ where: { id: folderId } })
    req.flash("success", "The folder is deleted.");
    res.redirect('/home')
  }
}
module.exports.renameFolder = async (req, res) => {
  console.log(req.body);
  let { FolderId } = req.body;
  const folder = await Folder.findOne({ where: { id: FolderId } });
  folder.folder_name = req.body.name
  await folder.save()
  res.redirect('/home')

}
module.exports.changePermission = async (req, res) => {
  let { videoId } = req.params;
  let { email } = req.params;
  let { permission } = req.params;
  const uservideos = await UserVideo.findOne({ where: { user_email: email, video_id: videoId } })
  uservideos.permission = permission;
  await uservideos.save()
  res.redirect(`/${videoId}/watch`)

}
module.exports.search = async (req, res) => {
  let userId = req.session.userId
  let name = req.params.name;
  const videos = await Video.findAll({
    raw: true, where: {
      user_id: userId, title: {
        [Op.like]: name + "%"
      }
    }
  })
  console.log(videos);
  res.json(videos)
}
module.exports.getProfilePic = async (req, res) => {
  let userId = req.session.userId;
  const user = await User.findOne({ raw: true, where: { id: userId }, })
  let profile_picture = await user.profile_picture
  res.json({
    profile_picture,
    awsLink: process.env.AWS_STATIC_LINK
  })
}