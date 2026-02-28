//user schema
import mongoose from "mongoose";
import { GenderEnum, RoleEnum, providerEnum } from "../../Common/enums/user.enum.js";


const userSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: true,
            minLength: [3, "First name must be at least 3 characters long"],
            maxLength: [20, "First name must be at most 20 characters long"],
            lowercase: true,
            trim: true
        },
        lastname: {
            type: String,
            required: true,
            lowercase: true
        },
        age: {
            type: Number,
            minLength: [18, "Age must be at least 18 years old"],
            maxLength: [100, "Age must be at most 100 years old"],
            index: {
                name: "idx_age"
            }//path level
        },
        gender: {
            type: String,
            enum: Object.values(GenderEnum),
            default: GenderEnum.MALE
        },
        email: {
            type: String,
            required: true,
            index: {
                unique: true,
                name: "idx_email_unique"
            }
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String
        },
        otps: {
            confirmation: { type: String },
            resetPassword: {
                code: { type: String },
                expiresAt: { type: Date },
                verified: { type: Boolean, default: false }
            }
        },
        isConfirmed: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: Object.values(RoleEnum),
            default: RoleEnum.USER
        },
        provider: {
            type: String,
            enum: Object.values(providerEnum),
            default: providerEnum.LOCAL
        }, profilePicture: {
            secure_url: String,
            public_id: String
        }
    }, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
    googleSub: {
        type: String,
        unique: true
    },
    virtuals: {
        fullname: {
            get() {
                return `${this.firstname} ${this.lastname}`
            }
        }

    },
    methods: {
        sayHi() {
            console.log(`Hi ${this.fullname}`);
        }
    },
    // capped: {
    //     size: 1024,
    //     max: 100
    // },
    collection: "users"
});

//Compound index Schema level
userSchema.index({ firstname: 1, lastname: 1 }, { name: "idx_first_last_name_unique", unique: true });

//create virtuals
userSchema.virtual("Messages", {
    ref: "Messages",
    localField: "_id",
    foreignField: "receiverId"
})





//create model
const User = mongoose.model("User", userSchema);

export default User; 