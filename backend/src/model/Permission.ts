import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true, unique: true },
        description: { type: String },
    },
    { timestamps: true }
);
export default mongoose.model("Permission", permissionSchema);