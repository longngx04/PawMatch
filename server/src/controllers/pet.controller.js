import Pet from '../models/petModel.js';
import Swipe from '../models/swipeModel.js';
import Match from '../models/matchModel.js';
import User from '../models/userModel.js';
import { emitNewMatch } from '../lib/socket.js';

// Create a new pet profile
export const createPet = async (req, res) => {
    try {
        const userId = req.user._id;
        const petData = {
            ...req.body,
            owner: userId
        };
        if (!petData.name || !petData.age || !petData.breed || !petData.species || !petData.gender) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        // Check if user already has 5 pets (limit)
        const userPetsCount = await Pet.countDocuments({ owner: userId });
        if (userPetsCount >= 5) {
            return res.status(400).json({ message: 'You can only create up to 5 pet profiles' });
        }

        const pet = await Pet.create(petData);

        res.status(201).json({
            message: 'Pet profile created successfully',
            pet
        });
    } catch (error) {
        console.error('Error in createPet:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all pets of the logged-in user
export const getMyPets = async (req, res) => {
    try {
        const userId = req.user._id;

        const pets = await Pet.find({ owner: userId }).sort({ createdAt: -1 });

        res.status(200).json(pets);
    } catch (error) {
        console.error('Error in getMyPets:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a pet by ID
export const getPetById = async (req, res) => {
    try {
        const { petId } = req.params;

        const pet = await Pet.findById(petId).populate('owner', 'fullname email');

        if (!pet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        // Increment views
        pet.views += 1;
        await pet.save();

        res.status(200).json(pet);
    } catch (error) {
        console.error('Error in getPetById:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a pet profile
export const updatePet = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;

        const pet = await Pet.findById(petId);

        if (!pet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        // Check if user owns this pet
        if (pet.owner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update fields
        if (req.body.name) pet.name = req.body.name;
        if (req.body.species) pet.species = req.body.species;
        if (req.body.breed !== undefined) pet.breed = req.body.breed;
        if (req.body.age) pet.age = parseInt(req.body.age);
        if (req.body.gender) pet.gender = req.body.gender;
        if (req.body.bio !== undefined) pet.bio = req.body.bio;

        // Handle location - if it's a string, parse it to city/state
        if (req.body.location !== undefined) {
            if (typeof req.body.location === 'string' && req.body.location) {
                const [city, state] = req.body.location.split(',').map(s => s.trim());

                if (!pet.location) {
                    pet.location = {};
                }

                pet.location.city = city || '';
                pet.location.state = state || '';

                // Only set coordinates if they don't exist
                if (!pet.location.coordinates || !pet.location.coordinates.lat) {
                    pet.location.coordinates = { lat: 0, lng: 0 };
                }

                pet.markModified('location');
            } else if (typeof req.body.location === 'object' && req.body.location) {
                pet.location = {
                    ...pet.location,
                    ...req.body.location,
                    coordinates: req.body.location.coordinates || pet.location?.coordinates || { lat: 0, lng: 0 }
                };
                pet.markModified('location');
            }
        }

        // Handle image uploads if provided
        if (req.files && req.files.length > 0) {
            pet.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        const updatedPet = await pet.save();

        res.json(updatedPet);
    } catch (error) {
        console.error('Update pet error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a pet profile
export const deletePet = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;

        const pet = await Pet.findOneAndDelete({ _id: petId, owner: userId });

        if (!pet) {
            return res.status(404).json({ message: 'Pet not found or you do not have permission to delete' });
        }

        // Clean up related data
        await Swipe.deleteMany({ $or: [{ swiperPet: petId }, { swipedPet: petId }] });
        await Match.deleteMany({ $or: [{ pet1: petId }, { pet2: petId }] });

        res.status(200).json({ message: 'Pet profile deleted successfully' });
    } catch (error) {
        console.error('Error in deletePet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const getPetsToSwipe = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;


        const myPet = await Pet.findOne({ _id: petId, owner: userId });
        if (!myPet) {
            return res.status(404).json({ message: 'Pet not found or not yours' });
        }

        // Get all pet IDs that this pet has already swiped on
        const alreadySwiped = await Swipe.find({ swiperPet: petId }).select('swipedPet');
        const swipedPetIds = alreadySwiped.map(swipe => swipe.swipedPet);

        // Get all pet IDs owned by the user (to exclude)
        const myPets = await Pet.find({ owner: userId }).select('_id');
        const myPetIds = myPets.map(pet => pet._id);

        // Build query filters
        const filters = {
            _id: {
                $ne: petId, // Not the current pet
                $nin: [...swipedPetIds, ...myPetIds] // Not already swiped and not owned
            },
            isActive: true
        };

        // Apply preferences if they exist
        if (myPet.preferences.species && myPet.preferences.species.length > 0) {
            filters.species = { $in: myPet.preferences.species };
        }

        if (myPet.preferences.ageRange) {
            filters.age = {
                $gte: myPet.preferences.ageRange.min,
                $lte: myPet.preferences.ageRange.max
            };
        }

        // Filter by location (same city/state for now)
        if (myPet.location.city && myPet.location.state) {
            filters['location.city'] = myPet.location.city;
            filters['location.state'] = myPet.location.state;
        }

        // Get pets and randomize
        const petsToSwipe = await Pet.find(filters)
            .populate('owner', 'fullname email')
            .limit(50);


        const shuffled = petsToSwipe.sort(() => 0.5 - Math.random());

        res.status(200).json(shuffled.slice(0, 20)); // Return 20 cards
    } catch (error) {
        console.error('Error in getPetsToSwipe:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Swipe on a pet (left = pass, right = like)
 * POST /pets/swipe
 */
export const swipePet = async (req, res) => {
    try {
        const { swiperPetId, swipedPetId, direction } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!swiperPetId || !swipedPetId || !direction) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['left', 'right'].includes(direction)) {
            return res.status(400).json({ message: 'Invalid swipe direction' });
        }

        // Verify pet ownership
        const swiperPet = await Pet.findOne({ _id: swiperPetId, owner: userId });
        if (!swiperPet) {
            return res.status(404).json({ message: 'Your pet not found' });
        }

        // Get the swiped pet
        const swipedPet = await Pet.findById(swipedPetId);
        if (!swipedPet) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        // Prevent swiping on own pets
        if (swipedPet.owner.toString() === userId.toString()) {
            return res.status(400).json({ message: 'Cannot swipe on your own pet' });
        }

        // Check if already swiped
        const existingSwipe = await Swipe.findOne({
            swiperPet: swiperPetId,
            swipedPet: swipedPetId
        });

        if (existingSwipe) {
            return res.status(400).json({ message: 'Already swiped on this pet' });
        }

        // Create swipe record
        const swipe = await Swipe.create({
            swiper: userId,
            swiperPet: swiperPetId,
            swipedPet: swipedPetId,
            swipedPetOwner: swipedPet.owner,
            direction
        });

        // Update likes count if swiped right
        if (direction === 'right') {
            swipedPet.likes += 1;
            await swipedPet.save();
        }

        // Check for match if swiped right
        let matchData = null;
        if (direction === 'right') {
            const reciprocalSwipe = await Swipe.findOne({
                swiperPet: swipedPetId,
                swipedPet: swiperPetId,
                direction: 'right'
            });

            if (reciprocalSwipe) {
                const existingMatch = await Match.findOne({
                    $or: [
                        { pet1: swiperPetId, pet2: swipedPetId },
                        { pet1: swipedPetId, pet2: swiperPetId }
                    ]
                });

                if (!existingMatch) {
                    matchData = await Match.create({
                        pet1: swiperPetId,
                        pet2: swipedPetId,
                        owner1: userId,
                        owner2: swipedPet.owner
                    });

                    await Swipe.updateMany(
                        {
                            $or: [
                                { swiperPet: swiperPetId, swipedPet: swipedPetId },
                                { swiperPet: swipedPetId, swipedPet: swiperPetId }
                            ]
                        },
                        { isMatch: true }
                    );

                    matchData = await Match.findById(matchData._id)
                        .populate('pet1', 'name images breed species')
                        .populate('pet2', 'name images breed species')
                        .populate('owner1', 'fullname email')
                        .populate('owner2', 'fullname email');

                    // Emit new match via Socket.io to both users
                    emitNewMatch(userId.toString(), matchData);
                    emitNewMatch(swipedPet.owner.toString(), matchData);
                }
            }
        }

        if (matchData) {
            return res.status(200).json({
                message: 'It\'s a match! 🎉',
                match: true,
                matchData
            });
        }

        res.status(200).json({
            message: 'Swipe recorded',
            match: false,
            swipe
        });
    } catch (error) {
        console.error('Error in swipePet:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get all matches for a specific pet
 * GET /pets/matches/:petId
 */
export const getMatches = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;

        // Verify pet ownership
        const pet = await Pet.findOne({ _id: petId, owner: userId });
        if (!pet) {
            return res.status(404).json({ message: 'Pet not found or not yours' });
        }

        // Get all matches for this pet
        const matches = await Match.find({
            $or: [{ pet1: petId }, { pet2: petId }],
            status: 'active'
        })
            .populate('pet1', 'name images breed species age bio')
            .populate('pet2', 'name images breed species age bio')
            .populate('owner1', 'fullname email')
            .populate('owner2', 'fullname email')
            .sort({ lastMessageAt: -1 });

        res.status(200).json(matches);
    } catch (error) {
        console.error('Error in getMatches:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Unmatch with a pet
 * DELETE /pets/match/:matchId
 */
export const unmatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user._id;

        const match = await Match.findById(matchId);

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Verify user is part of this match
        if (match.owner1.toString() !== userId.toString() &&
            match.owner2.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update match status
        match.status = 'unmatched';
        match.unmatchedBy = userId;
        await match.save();

        res.status(200).json({ message: 'Unmatched successfully' });
    } catch (error) {
        console.error('Error in unmatch:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
