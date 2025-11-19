import imagekit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";

export const changeRoleToOwner = async(req,res)=>{
    try{
        const {_id} = req.user;
        await User.findByIdAndUpdate(_id, {role:"owner"})
        res.status(200).json({
            success:true,
            message:"Now you can list cars"
        })
    }
    catch(error){
        console.log(error.message);
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is missing',
      });
    }

    let car = JSON.parse(req.body.carData);
    const imageFile = req.file;

    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: '/cars',
    });

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { width: '1280' },
        { quality: 'auto' },
        { format: 'webp' },
      ],
    });

    const image = optimizedImageUrl;

    await Car.create({ ...car, owner: _id, image });

    res.status(200).json({
      success: true,
      message: 'Car Added',
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOwnerCars = async(req,res) =>{
  try{
    const {_id} = req.user;
    const cars = await Car.find({owner:_id})
    res.status(200).json({
      success:true,
      cars
    })
  }
  catch(error){
    console.log(error.message);
    res.status(500).json({
      success:false,
      message:error.message
    })

  }
}

export const toggleCarAvailability = async(req,res)=>{
  try{
    const {_id} = req.user;
    const {carId} = req.body;
    const car = await Car.findById(carId)

    // Checking is car belongs to the user
    if(car.owner.toString() !== _id.toString()){
        return res.status(403).json({
          success:false,
          message:"Unauthorized"
        });
    }

    car.isAvaliable = !car.isAvaliable;
    await car.save();

    res.status(200).json({
      success:true,
      message:"Availability Toggled"
    })
  }
  catch(error){
    console.log(error.message);
    res.status(500).json({
      success:false,
      message:error.message
    })

  }
}

export const deleteCar = async(req,res)=>{
  try{
    const {_id} = req.user;
    const {carId} = req.body;
    const car = await Car.findById(carId)

    // Checking is car belongs to the user
    if(car.owner.toString() !== _id.toString()){
        return res.status(403).json({
          success:false,
          message:"Unauthorized"
        });
    }

    car.owner = null
    car.isAvaliable = false;
    await car.save();

    res.status(200).json({
      success:true,
      message:"Car Removed"
    })
  }
  catch(error){
    console.log(error.message);
    res.status(500).json({
      success:false,
      message:error.message
    })

  }
}

export const getDashboardData = async(req,res) =>{
  try{
    const {_id, role} = req.user;

    if(role !== 'owner'){
      return res.json({
        success:false,
        message:"Unauthorized"
    })
    };

    const cars = await Car.find({owner:_id})
    const bookings = await Booking.find({owner:_id}).populate('car').sort({createdAt: -1});

    const pendingBookings = await Booking.find({owner:_id,status:"pending"})
    const completedBookings = await Booking.find({owner:_id,status:"confirmed"})

    // Calculate monthlyRevenue from bookins where status is confirmed
    const monthlyRevenue = bookings.slice().filter(booking => booking.status === 'confirmed')
    .reduce((acc,booking) => acc + booking.price, 0)

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBookings.length,
      completedBookings:completedBookings.length,
      recentBookings: bookings.slice(0,3),
      monthlyRevenue
    }

    res.status(200).json({
      success:true,
      dashboardData
    });
  }
  catch(error){
    console.log(error.message);
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

export const updateUserImage = async(req,res)=>{
  try{

    const {_id} = req.user;

    const imageFile = req.file;

        // Upload Image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file:fileBuffer,
            fileName: imageFile.originalname,
            folder: '/users'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path : response.filePath,
            transformation : [
                {width:'400'},      // Width resizing
                {quality:'auto'},    // Auto Compression
                {format:'webp'}      // Convert to modern format
            ]
        });

        const image = optimizedImageUrl;

        await User.findByIdAndUpdate(_id, {image});

        res.status(200).json({
          success:true,
          message:"Image Updated"
        })
  }
  catch(error){
    console.log(error.message);
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}
