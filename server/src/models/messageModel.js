import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    match:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content:{
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    image:{
        type: String,
    },
    isRead:{
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;