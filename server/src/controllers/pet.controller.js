import Pet from '../models/petModel.js';
import Swipe from '../models/swipeModel.js';
import Match from '../models/matchModel.js';
import User from '../models/userModel.js';
import { emitNewMatch } from '../lib/socket.js';

/**
 * Create a new pet profile
 * POST /api/pets
 */
export const createPet = async (req, res) => {
    try {
        const userId = req.user._id;
        const petData = {
            ...req.body,
            owner: userId
        };

        // Validation
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

/**
 * Get all pets of the logged-in user
 * GET /api/pets/user/pets
 */
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

/**
 * Get a pet by ID
 * GET /api/pets/:petId
 */
export const getPetById = async (req, res) => {
    try {
        const { petId } = req.params;

        const pet = await Pet.findById(petId).populate('owner', 'fullname email profilePicture');

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

/**
 * Update a pet profile
 * PUT /api/pets/:petId
 */
export const updatePet = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;

        console.log('📝 Update pet request:', {
            petId,
            userId,
            body: req.body
        });

        // Find pet and verify ownership
        const pet = await Pet.findOne({ _id: petId, owner: userId });

        if (!pet) {
            return res.status(404).json({ 
                message: 'Pet not found or you do not have permission to edit' 
            });
        }

        // Parse location if it's a string
        let locationData = req.body.location;
        if (typeof locationData === 'string' && locationData.trim()) {
            // Parse "City, State" format
            const parts = locationData.split(',').map(s => s.trim());
            locationData = {
                city: parts[0] || '',
                state: parts[1] || ''
            };
        }

        // Prepare update data
        const updateData = {
            name: req.body.name,
            species: req.body.species,
            breed: req.body.breed || '',
            age: parseInt(req.body.age),
            gender: req.body.gender,
            bio: req.body.bio || '',
            location: locationData
        };

        // Remove undefined/null values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });

        console.log('💾 Updating pet with data:', updateData);

        // Update pet
        Object.assign(pet, updateData);
        await pet.save();

        // Populate owner data for response
        await pet.populate('owner', 'fullname email profilePicture');

        console.log('✅ Pet updated successfully:', pet._id);

        res.status(200).json({
            message: 'Pet profile updated successfully',
            pet
        });
    } catch (error) {
        console.error('❌ Error in updatePet:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete a pet profile
 * DELETE /api/pets/:petId
 */
export const deletePet = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;

        const pet = await Pet.findOneAndDelete({ _id: petId, owner: userId });

        if (!pet) {
            return res.status(404).json({ message: 'Pet not found or you do not have permission to delete' });
        }

        // Clean up related data
        await Swipe.deleteMany({ 
            $or: [
                { swiperPet: petId }, 
                { swipedPet: petId }
            ] 
        });
        
        await Match.updateMany(
            { 
                $or: [
                    { pet1: petId }, 
                    { pet2: petId }
                ] 
            },
            { 
                status: 'deleted' 
            }
        );

        res.status(200).json({ message: 'Pet profile deleted successfully' });
    } catch (error) {
        console.error('Error in deletePet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get pets to swipe on
 * GET /api/pets/swipe/:petId
 */
export const getPetsToSwipe = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user._id;

        // Verify pet ownership
        const myPet = await Pet.findOne({ _id: petId, owner: userId });
        if (!myPet) {
            return res.status(404).json({ message: 'Pet not found or not yours' });
        }

        // Get all pet IDs that this pet has already swiped on
        const alreadySwiped = await Swipe.find({ swiperPet: petId }).select('swipedPet');
        const swipedPetIds = alreadySwiped.map(swipe => swipe.swipedPet.toString());

        // Get all pet IDs owned by the user (to exclude)
        const myPets = await Pet.find({ owner: userId }).select('_id');
        const myPetIds = myPets.map(pet => pet._id.toString());

        // Build query filters
        const filters = {
            _id: {
                $ne: petId, // Not the current pet
                $nin: [...swipedPetIds, ...myPetIds] // Not already swiped and not owned
            },
            isActive: true
        };

        // Apply preferences if they exist
        if (myPet.preferences?.species && myPet.preferences.species.length > 0) {
            filters.species = { $in: myPet.preferences.species };
        }

        if (myPet.preferences?.ageRange) {
            filters.age = {
                $gte: myPet.preferences.ageRange.min || 0,
                $lte: myPet.preferences.ageRange.max || 100
            };
        }

        // Filter by location (same city/state)
        if (myPet.location?.city && myPet.location?.state) {
            filters['location.city'] = myPet.location.city;
            filters['location.state'] = myPet.location.state;
        }

        // Get pets and randomize
        const petsToSwipe = await Pet.find(filters)
            .populate('owner', 'fullname email profilePicture')
            .limit(50);

        // Shuffle and return 20 cards
        const shuffled = petsToSwipe.sort(() => 0.5 - Math.random());

        res.status(200).json(shuffled.slice(0, 20));
    } catch (error) {
        console.error('Error in getPetsToSwipe:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Swipe on a pet (left = pass, right = like)
 * POST /api/pets/swipe
 */
export const swipePet = async (req, res) => {
    try {
        const { swiperPetId, swipedPetId, direction } = req.body;
        const userId = req.user._id;

        // Validation
        if (!swiperPetId || !swipedPetId || !direction) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['left', 'right'].includes(direction)) {
            return res.status(400).json({ message: 'Invalid swipe direction. Use "left" or "right"' });
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
            swipedPet.likes = (swipedPet.likes || 0) + 1;
            await swipedPet.save();
        }

        // Check for match if swiped right
        let matchData = null;
        if (direction === 'right') {
            // Check if the other pet already swiped right on this pet
            const reciprocalSwipe = await Swipe.findOne({
                swiperPet: swipedPetId,
                swipedPet: swiperPetId,
                direction: 'right'
            });

            if (reciprocalSwipe) {
                // Check if match already exists
                const existingMatch = await Match.findOne({
                    $or: [
                        { pet1: swiperPetId, pet2: swipedPetId },
                        { pet1: swipedPetId, pet2: swiperPetId }
                    ]
                });

                if (!existingMatch) {
                    // Create new match
                    matchData = await Match.create({
                        pet1: swiperPetId,
                        pet2: swipedPetId,
                        owner1: userId,
                        owner2: swipedPet.owner
                    });

                    // Update both swipes to indicate match
                    await Swipe.updateMany(
                        {
                            $or: [
                                { swiperPet: swiperPetId, swipedPet: swipedPetId },
                                { swiperPet: swipedPetId, swipedPet: swiperPetId }
                            ]
                        },
                        { isMatch: true }
                    );

                    // Populate match data for response
                    matchData = await Match.findById(matchData._id)
                        .populate('pet1', 'name images breed species age bio')
                        .populate('pet2', 'name images breed species age bio')
                        .populate('owner1', 'fullname email profilePicture')
                        .populate('owner2', 'fullname email profilePicture');

                    // Emit new match via Socket.io to both users
                    emitNewMatch(userId.toString(), matchData);
                    emitNewMatch(swipedPet.owner.toString(), matchData);
                } else {
                    matchData = existingMatch;
                }
            }
        }

        // Return match response if matched
        if (matchData) {
            return res.status(200).json({
                message: 'It\'s a match! 🎉',
                match: true,
                matchData
            });
        }

        // Return regular swipe response
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
 * GET /api/pets/matches/:petId
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
            .populate('owner1', 'fullname email profilePicture')
            .populate('owner2', 'fullname email profilePicture')
            .sort({ lastMessageAt: -1 });

        res.status(200).json(matches);
    } catch (error) {
        console.error('Error in getMatches:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Unmatch with a pet
 * DELETE /api/pets/match/:matchId
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
            return res.status(403).json({ message: 'Not authorized to unmatch' });
        }

        // Update match status
        match.status = 'unmatched';
        match.unmatchedBy = userId;
        match.unmatchedAt = new Date();
        await match.save();

        res.status(200).json({ message: 'Unmatched successfully' });
    } catch (error) {
        console.error('Error in unmatch:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get all pets (for admin or discovery)
 * GET /api/pets
 */
export const getAllPets = async (req, res) => {
    try {
        const { species, breed, city, state, minAge, maxAge, gender } = req.query;

        const filters = { isActive: true };

        // Apply filters
        if (species) filters.species = species;
        if (breed) filters.breed = new RegExp(breed, 'i');
        if (gender) filters.gender = gender;
        if (city) filters['location.city'] = new RegExp(city, 'i');
        if (state) filters['location.state'] = new RegExp(state, 'i');
        
        if (minAge || maxAge) {
            filters.age = {};
            if (minAge) filters.age.$gte = parseInt(minAge);
            if (maxAge) filters.age.$lte = parseInt(maxAge);
        }

        const pets = await Pet.find(filters)
            .populate('owner', 'fullname email profilePicture')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(pets);
    } catch (error) {
        console.error('Error in getAllPets:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
