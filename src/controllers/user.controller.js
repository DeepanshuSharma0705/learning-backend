import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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
    console.log("3 DS does't exist user")
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

export { registerUser }
