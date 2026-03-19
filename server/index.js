import express from "express";
import connectToDatabase from "./connection/user.js";


const app = express();

const PORT = process.env.PORT || 3000;

connectToDatabase();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});