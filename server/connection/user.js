import mongoose from "mongoose";

function connectToDatabase() {
  mongoose.connect("mongodb://localhost:27017/tims")
 .then(()=> console.log("Connected to MongoDB"))
 .catch((err) => console.error("Error connecting to MongoDB:", err));
};
export default connectToDatabase;