import mongoose from "mongoose";

const homeSchema = new mongoose.Schema({

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },
   
    location: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },


}, {
    timestamps: true
});

//create model
const Home = mongoose.model("Home", homeSchema);

export default Home; 
