const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,   //.............doubt


        },
        password:{
            type: String,
            required: true,
            select: false,//....................2

        },

        role:{
            type: String,
            enum: ["student", "staff", "admin"],
            default: "student",
        },
    }, 

        {timestamps: true}

);
module.exports = mongoose.model("User", userSchema);

