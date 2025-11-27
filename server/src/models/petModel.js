import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    species: {
        type: String,
        required: true,
        enum: ['Dog', 'Cat', 'Bird', 'Other']
    },
    breed: {
        type: String,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 0
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female']
    },
    bio: {
        type: String,
        maxlength: 500
    },
    location: {
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        }
    },
    images: [{
        type: String // URL strings
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    preferences: {
        species: [String],
        ageRange: {
            min: Number,
            max: Number
        }
    }
}, { 
    timestamps: true 
});

// Indexes
petSchema.index({ owner: 1 });
petSchema.index({ species: 1, isActive: 1 });
petSchema.index({ 'location.city': 1, 'location.state': 1 });

const Pet = mongoose.model('Pet', petSchema);
export default Pet;