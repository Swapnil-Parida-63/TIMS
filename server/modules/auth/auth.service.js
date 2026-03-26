import User from '../user/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (data) => {     // Service function for registering a new user, it takes the usr data, hashes the password, creates a new user in the databasee, and returns the created user.
  const { email, password, role } = data;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
    role
  });

  return user;
};

 // Service function for user login, it takes the email and password, checks if the user exists, compares the provided password with the stored hashed password, and if valid, generates a JWT token and returns it along with user details.

export const login = async (email, password) => {  
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "1d"})
  return {token, user};
}

console.log("JWT_SECRET:", process.env.JWT_SECRET);