import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
    // Reference to the user who owns this pet
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Basic pet information
    name: {
        type: String,
        required: [true, 'Pet name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },

    age: {
        type: Number,
        required: [true, 'Pet age is required'],
        min: [0, 'Age cannot be negative'],
        max: [30, 'Age seems unrealistic']
    },

    breed: {
        type: String,
        required: [true, 'Breed is required'],
        trim: true
    },

    species: {
        type: String,
        enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'],
        required: [true, 'Species is required']
    },

    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: [true, 'Gender is required']
    },

    size: {
        type: String,
        enum: ['Small', 'Medium', 'Large', 'Extra Large'],
        required: function () {
            // Size is required for Dogs and Cats only
            return this.species === 'Dog' || this.species === 'Cat';
        }
    },

    // Description and personality
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        trim: true
    },

    personality: [{
        type: String,
        enum: ['Playful', 'Calm', 'Energetic', 'Shy', 'Friendly', 'Independent', 'Cuddly', 'Protective', 'Social']
    }],

    // Pet images (multiple photos)
    images: [{
        type: String,
        validate: {
            validator: function (v) {
                // Basic URL validation
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Invalid image URL'
        }
    }],

    // Health information
    vaccinated: {
        type: Boolean,
        default: false
    },

    neutered: {
        type: Boolean,
        default: false
    },

    // Location for nearby matching
    location: {
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        zipCode: {
            type: String,
            trim: true
        },
        // For future geolocation features
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0]
            }
        }
    },

    // What the pet is looking for
    lookingFor: {
        type: String,
        enum: ['Playmate', 'Breeding', 'Friendship', 'Walking Buddy', 'Any'],
        required: [true, 'Purpose is required']
    },

    // Preferences for matching
    preferences: {
        species: [{
            type: String,
            enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other']
        }],
        ageRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 30 }
        },
        maxDistance: {
            type: Number, // in miles
            default: 25
        }
    },

    // Profile status
    isActive: {
        type: Boolean,
        default: true
    },

    // Statistics
    views: {
        type: Number,
        default: 0
    },

    likes: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for geospatial queries (nearby pets)
petSchema.index({ 'location.coordinates': '2dsphere' });

// Index for faster queries
petSchema.index({ owner: 1 });
petSchema.index({ species: 1, isActive: 1 });
petSchema.index({ 'location.city': 1, 'location.state': 1 });

const Pet = mongoose.model('Pet', petSchema);
export default Pet;