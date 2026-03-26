import "./config/env.js";
// console.log(process.env.JWT_SECRET)
import connectToDatabase from './config/db.js';
import app from './app.js';



const PORT = process.env.PORT || 3000;


const  startServer = async () => {
  try{
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  }
  catch (error) {
    console.error("Server failed to start:", error);
    Process.exit(1);
  }
}
  
startServer(); 