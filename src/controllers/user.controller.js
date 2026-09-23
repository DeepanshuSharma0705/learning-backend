import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { JsonWebTokenError, verify } from "jsonwebtoken"
import { verifyJWT } from "../middlewares/auth.middleware.js"



// method to create refresh and generate tokens 

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  }
  catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token ");

  }
}

const registerUser = asyncHandler(async (req, res) => {
  // get user detail from fronted
  // validation - nothing should be empty
  // check user already exist : by checking username or emial
  // check for images , check or avtar
  // upload them to cloudinary
  // check avtar uploaded successfully on cloudinary
  // create user object 
  // create entry in db
  // remove passward and refersh token field from response
  // check for user creation
  // return response
  console.log(" 1 DS", req)
  const { fullName, email, username, password } = req.body
  /*console.log("email" , email);
  console.log("fullName" , fullName);
  console.log("username" , username);
  console.log("password" , password); */

  if (
    [fullName, email, username, password].some((field) =>
      field?.trim() === "")
  ) {
    throw new ApiError(400, "fullname is requried")
  }

  console.log(" 2 DS checking for existing user")
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    console.log("3 DS existing user")
    throw new ApiError(409, "User with email or username already exist ")
  }


  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  console.log("4 avatar and coverge image path")
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is requried");
  }


  const avatar = await uploadOnCloudinary(avatarLocalPath)

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  console.log("5 is found avatar")
  if (!avatar) {
    throw new ApiError(400, "Avatar file is requried");
  }

  console.log("6 creating a user object by using i/p")
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  console.log("7 creating user by unique user id ")

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  console.log("8 chaecking for is user created")
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registring User")
  }

  console.log("9 returning responce")
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registerd Successfully")
  )
})

// login User
const loginUser = asyncHandler(async (req, res) => {
  // req -> boby
  // validating waya username or email
  // find the user is exist 
  // if exist than check password
  // passwoard is correct than create access and referace token and sent to the user
  // send cookie

  // taking email, username, password form user / body
  const { email, username, password } = req.body

  // checking if anyone is not entered by user than giving error
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // checking that is user already exist 
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  // if not exist than . Msg that create a new user/ user does't exist 
  if (!user) {
    throw new ApiError(404, "User does not exist")
  }

  // if user exist 
  // checking password is valid or not 
  const isPasswordValid = await user.isPasswordCorrect(password)

  // if password is not valid than show error
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  // creating access and refresh token 
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  // sending access or refresh token to cookies
  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
      )
    )
})

// logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// refreshAccessToken 
const refreshAccessToken = asyncHandler(async (req, res) => {
  // taking refresh token 
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  // if refersh token not present 
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request ");
  }

  // verifying our token if present 
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body



  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "User fetched successfully"
    ))
})


const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})




export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
}
