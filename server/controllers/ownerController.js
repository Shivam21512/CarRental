import imagekit from "../configs/imageKit.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";
// API to Change Role of User
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

// API to List Car

// export const addCar  = async (req,res) => {
//     try{
//         const{_id} = req.user;
//         let car = JSON.parse(req.body.carData);
//         const imageFile = req.file;

//         // Upload Image to ImageKit
//         const fileBuffer = fs.readFileSync(imageFile.path)
//         const response = await imagekit.upload({
//             file:fileBuffer,
//             fileName: imageFile.originalname,
//             folder: '/cars'
//         })

//         // optimization through imagekit URL transformation
//         var optimizedImageUrl = imagekit.url({
//             path : response.filePath,
//             transformation : [
//                 {width:'1280'},      // Width resizing
//                 {quality:'auto'},    // Auto Compression
//                 {format:'webp'}      // Convert to modern format
//             ]
//         });

//         const image = optimizedImageUrl;
//         await Car.create({...car, owner:_id, image})

//         res.status(200).json({
//             success:true,
//             message:"Car Added"
//         })



//     }
//     catch(error){
//         console.log(error.message);
//         res.status(500).json({
//             success:false,
//             message:error.message
//         })

//     }
// }


export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    const car = JSON.parse(req.body.carData);
    if (!car.fuel_type || !car.seating_capacity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: fuel_type or seating_capacity"
      });
    }

    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: '/cars'
    });

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [{ width: '1280' }, { quality: 'auto' }, { format: 'webp' }]
    });

    await Car.create({ ...car, owner: _id, image: optimizedImageUrl });
    fs.unlinkSync(imageFile.path); // clean up local file

    res.status(200).json({ success: true, message: "Car Added" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
