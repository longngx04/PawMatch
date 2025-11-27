import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    createPet,
    getMyPets,
    getPetById,
    updatePet,
    deletePet,
    getPetsToSwipe,
    swipePet,
    getMatches,
    unmatch,
    getAllPets
} from '../controllers/pet.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Pet CRUD
router.post('/', createPet);
router.get('/', getAllPets); // Get all pets with filters
router.get('/user/pets', getMyPets); // Get my pets
router.get('/:petId', getPetById);
router.put('/:petId', updatePet);
router.delete('/:petId', deletePet);

// Swipe & Match
router.get('/swipe/:petId', getPetsToSwipe);
router.post('/swipe', swipePet);
router.get('/matches/:petId', getMatches);
router.delete('/match/:matchId', unmatch);

export default router;