import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type:       String,
            required:   true,
            trime:      true,
        },
        email: {
            type:       String,
            required:   true,
            unique:     true,
            lowercase:  true
        },
        password: {
            type:       String,
            required:   true,
            minlength:  6
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