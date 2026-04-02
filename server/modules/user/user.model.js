import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // Password is optional — Google OAuth users don't have one
  password: {
    type: String,
    required: false,
    default: null
  },
  picture: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  role: {
    type: String,
    enum: ["super_admin", "admin", "executer", "panelist"],
    required: true
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;