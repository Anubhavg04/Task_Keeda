import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type:       String,
            required:   true,
            trim:       true,
            maxlength:  100,
        },
        email: {
            type:       String,
            required:   true,
            unique:     true,
            lowercase:  true,
            trim:       true,
            maxlength:  254,
        },
        password: {
            type:       String,
            required:   true,
            minlength:  8,
            maxlength:  128,
        },
        role: {
            type:       String,
            enum:       ["user", "admin"],
            default:    "user"
        },
    },
    {timestamps: true}
);

export default mongoose.model("User", userSchema);