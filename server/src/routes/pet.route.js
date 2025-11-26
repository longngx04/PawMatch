import express from 'express';
import {
    createPet,
    getMyPets,
    getPetById,
    updatePet,
    deletePet,
    getPetsToSwipe,
    swipePet,
    getMatches,
    unmatch
} from '../controllers/pet.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Pet CRUD operations
router.post('/', createPet);                    // Create a new pet
router.get('/my-pets', getMyPets);              // Get all my pets
router.get('/:petId', getPetById);              // Get single pet by ID
router.put('/:petId', updatePet);               // Update pet
router.delete('/:petId', deletePet);            // Delete pet
// Swipe functionality
router.get('/swipe-cards/:petId', getPetsToSwipe);  // Get pets to swipe on
router.post('/swipe', swipePet);                     // Perform a swipe
// Match functionality
router.get('/matches/:petId', getMatches);      // Get all matches for a pet
router.delete('/match/:matchId', unmatch);      // Unmatch

export default router;