import mongoose from "mongoose";

mongoose.set("strictQuery", true); // This is to suppress the deprecation warning for strictQuery in Mongoose 7.x. It ensures that only fields defined in the schema are allowed in queries.


async function connectToDatabase() {
    try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully to:", conn.connection.host);
  } catch (err) {
    console.error("DB connection failed:", err);
    throw err; // VERY IMPORTANT
  }

 process.exitCode = 1;  //allow the process to exit naturally after all pending async operations complete.
}

export default connectToDatabase;