import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    // First pet in the match
    pet1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },

    // Second pet in the match
    pet2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },

    // Owner of pet1
    owner1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Owner of pet2
    owner2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Match status
    status: {
        type: String,
        enum: ['active', 'unmatched', 'blocked'],
        default: 'active'
    },

    // Reference to the last message (for sorting matches by recent activity)
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },

    // When the last message was sent
    lastMessageAt: {
        type: Date,
        default: Date.now
    },

    // Who initiated the unmatch (if unmatched)
    unmatchedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true
});

// Compound index to prevent duplicate matches
matchSchema.index({ pet1: 1, pet2: 1 }, { unique: true });

matchSchema.index({ owner1: 1, status: 1 });
matchSchema.index({ owner2: 1, status: 1 });
matchSchema.index({ status: 1, lastMessageAt: -1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;