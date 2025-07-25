import Booking from "../models/Booking.js"
import Car from "../models/Car.js";


// Function to check Availability of car for a given date
const checkAvailability = async (car, pickupDate, returnDate) =>{
    const bookings = await Booking.find({
        car,
        pickupDate: {$lte: returnDate},
        returnDate: {$gte: pickupDate},
    })
    return bookings.length === 0;
}

// API to check Availability of cars for the given Date and location
export const checkAvailabilityOfCar = async (req,res) => {
    try{
        const {location , pickupDate, returnDate} = req.body;

        // Fetch all available cars for the given location
        const cars = await Car.find({location, isAvaliable:true})


         // check car availability for the given date range using promise
         const availableCarsPromises = cars.map(async(car) => {
            const isAvaliable = await checkAvailability(car._id, pickupDate,returnDate)

            return{...car._doc, isAvaliable:isAvaliable}
         })

         let availableCars = await Promise.all(availableCarsPromises);
         availableCars = availableCars.filter(car => car.isAvaliable === true)

         res.status(200).json({
            success:true,
            availableCars
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

//API to create Booking
export const createBooking = async(req,res) =>{
    try{
        const {_id} = req.user;
        const {car, pickupDate, returnDate} = req.body;

        const isAvaliable = await checkAvailability(car, pickupDate, returnDate)
        if(!isAvaliable){
            return res.json({
                success:false,
                message:'Car is not available'
            })
        }

        const carData = await Car.findById(car);

        // Calculate price based on pickupDate and returnDate
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
        const price = carData.pricePerDay * noOfDays;

        await Booking.create({car, owner:carData.owner, user:_id, pickupDate,
            returnDate, price
        })

        res.status(200).json({
            success:true,
            message:"Booking Created"
        })

    }
    catch(error){
         res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

// API to lIST uSER bOOKINGS
export const getUserBookings = async (req,res) =>{
    try{
        const {_id} = req.user;
        const bookings = await Booking.find({user:_id}).populate("car").sort
        ({createdAt: -1})
        res.status(200).json({
            success:true,
            bookings
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

// API t get Owner Bookings
export const  getOwnerBookings = async(req,res) => { 
    try{
        if(req.user.role !== 'owner'){
            return res.status(4030

            ).json({
                success:false,
                message:'Unauthorized'
            })
        }
        const bookings = await Booking.find({owner:req.user._id}).populate
        ('car user').select("-user.password").sort({createdAt:-1})

        res.status(200).json({
            success:true,
            bookings
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

// API to chnage booking status
export const changeBookingStatus = async(req,res) =>{
    try{
        const {_id} = req.user;
        const {bookingId, status} = req.body

        const booking = await Booking.findById(bookingId)

        if(booking.owner.toString() != _id.toString()){
            return res.status(404).json({
                success:false,
                message:'Booking not found'
            })
        }
        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking status updated"
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