import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";

//Initialize Express App
const app = express();

//Middleware
app.use(cors());
app.use(express.json());



app.get('/', (req,res) => {
    res.send("Server is running")
})

app.use('/api/user', userRouter);
app.use('/api/owner', ownerRouter);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
    console.log(`server running on port ${PORT}`)
    connectDB();
})