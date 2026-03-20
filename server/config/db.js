import mongoose from "mongoose";

mongoose.set("strictQuery", true); // This is to suppress the deprecation warning for strictQuery in Mongoose 7.x. It ensures that only fields defined in the schema are allowed in queries.


function connectToDatabase() {
  
 return mongoose.connect("mongodb://localhost:27017/tims")
 .then(()=> console.log("Connected to MongoDB"))
 .catch((err) => console.error("Error connecting to MongoDB:", err));
 process.exitCode = 1;  //allow the process to exit naturally after all pending async operations complete.
}

export default connectToDatabase;