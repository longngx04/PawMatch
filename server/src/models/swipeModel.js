import mongoose from 'mongoose';

const swipeSchema = new mongoose.Schema({
    
    swiper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    swiperPet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },

    swipedPet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },

    swipedPetOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Direction of swipe
    direction: {
        type: String,
        enum: ['left', 'right'], 
        required: true
    },

    // Whether this swipe resulted in a match
    isMatch: {
        type: Boolean,
        default: false
    },


}, {
    timestamps: true
});

// Compound index to prevent duplicate swipes on the same pet
swipeSchema.index({ swiperPet: 1, swipedPet: 1 }, { unique: true });

swipeSchema.index({ swiper: 1, direction: 1 });
swipeSchema.index({ swipedPet: 1, direction: 1 });
swipeSchema.index({ isMatch: 1 });

const Swipe = mongoose.model('Swipe', swipeSchema);
export default Swipe;