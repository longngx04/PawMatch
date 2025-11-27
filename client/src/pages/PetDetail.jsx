import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PetDetail = () => {
    const { petId } = useParams();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        species: '',
        breed: '',
        age: '',
        gender: '',
        bio: '',
        location: ''
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    useEffect(() => {
        console.log('PetDetail mounted, petId:', petId); // Debug
        if (petId) {
            fetchPetDetails();
        } else {
            console.error('No petId provided');
            setLoading(false);
            setError('No pet ID provided');
        }
    }, [petId]);

    const fetchPetDetails = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching pet with ID:', petId);

            const response = await axios.get(`http://localhost:3000/api/pets/${petId}`, {
                withCredentials: true
            });

            console.log('Pet data received:', response.data);

            if (!response.data) {
                throw new Error('No pet data received');
            }

            setPet(response.data);

            // Handle location formatting
            const locationStr = typeof response.data.location === 'object'
                ? `${response.data.location.city || ''}, ${response.data.location.state || ''}`.trim().replace(/^,|,$/g, '')
                : response.data.location || '';

            setFormData({
                name: response.data.name || '',
                species: response.data.species || '',
                breed: response.data.breed || '',
                age: response.data.age || '',
                gender: response.data.gender || '',
                bio: response.data.bio || '',
                location: locationStr
            });
            setImagePreviews(response.data.images || []);
        } catch (err) {
            console.error('Error fetching pet:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);

            if (err.response?.status === 404) {
                setError('Pet not found');
            } else if (err.response?.status === 401) {
                setError('Please log in to view this pet');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(err.response?.data?.message || 'Failed to load pet details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(files);

        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Prepare update data
            const updateData = {
                name: formData.name.trim(),
                species: formData.species,
                breed: formData.breed?.trim() || '',
                age: parseInt(formData.age),
                gender: formData.gender,
                bio: formData.bio?.trim() || '',
                location: formData.location?.trim() || ''
            };

            console.log('📤 Sending update data:', updateData);

            const response = await axios.put(
                `http://localhost:3000/api/pets/${petId}`,
                updateData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Update response:', response.data);

            // Update local state with returned data
            if (response.data.pet) {
                setPet(response.data.pet);

                // Update form data
                const locationStr = typeof response.data.pet.location === 'object'
                    ? `${response.data.pet.location.city || ''}, ${response.data.pet.location.state || ''}`.trim().replace(/^,|,$/g, '')
                    : response.data.pet.location || '';

                setFormData({
                    name: response.data.pet.name || '',
                    species: response.data.pet.species || '',
                    breed: response.data.pet.breed || '',
                    age: response.data.pet.age || '',
                    gender: response.data.pet.gender || '',
                    bio: response.data.pet.bio || '',
                    location: locationStr
                });
            }

            setEditMode(false);
            alert('Pet profile updated successfully!');
        } catch (err) {
            console.error('❌ Error updating pet:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);

            const errorMessage = err.response?.data?.message
                || err.response?.data?.error
                || 'Failed to update pet profile. Please try again.';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this pet profile? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`http://localhost:3000/api/pets/${petId}`, {
                withCredentials: true
            });
            navigate('/main');
        } catch (err) {
            console.error('Error deleting pet:', err);
            setError(err.response?.data?.message || 'Failed to delete pet profile');
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Handle location formatting
        const locationStr = typeof pet.location === 'object'
            ? `${pet.location.city || ''}, ${pet.location.state || ''}`.trim().replace(/^,|,$/g, '')
            : pet.location || '';

        setFormData({
            name: pet.name || '',
            species: pet.species || '',
            breed: pet.breed || '',
            age: pet.age || '',
            gender: pet.gender || '',
            bio: pet.bio || '',
            location: locationStr
        });
        setImagePreviews(pet.images || []);
        setImageFiles([]);
        setEditMode(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25c225] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading pet details...</p>
                    <p className="mt-2 text-sm text-gray-500">Pet ID: {petId}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/main')}
                        className="px-6 py-2 bg-[#25c225] text-white rounded-lg hover:bg-[#20a020]"
                    >
                        Go Back to Main
                    </button>
                </div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">Pet not found</p>
                    <button
                        onClick={() => navigate('/main')}
                        className="px-6 py-2 bg-[#25c225] text-white rounded-lg hover:bg-[#20a020]"
                    >
                        Go Back to Main
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/main')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <span>←</span> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Pet Profile</h1>
                    <div className="w-16"></div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Images */}
                    <div className="relative">
                        {imagePreviews.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 p-4">
                                {imagePreviews.slice(0, 4).map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`${pet?.name || 'Pet'} ${idx + 1}`}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-4xl">🐾</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {!editMode ? (
                            <>
                                {/* View Mode */}
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800">{pet?.name}</h2>
                                        <p className="text-gray-600 text-lg">
                                            {pet?.species} • {pet?.breed} • {pet?.age} {pet?.age === 1 ? 'year' : 'years'} old
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {pet?.gender}
                                        </span>
                                        {pet?.location && (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                📍 {typeof pet.location === 'object'
                                                    ? `${pet.location.city || ''}, ${pet.location.state || ''}`.trim().replace(/^,|,$/g, '')
                                                    : pet.location}
                                            </span>
                                        )}
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold text-gray-700 mb-2">About</h3>
                                        <p className="text-gray-600">{pet?.bio || 'No bio available'}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="flex-1 bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                                    >
                                        Delete Pet
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Edit Mode */}
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pet Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Species *
                                            </label>
                                            <select
                                                name="species"
                                                value={formData.species}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                            >
                                                <option value="">Select</option>
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Bird">Bird</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Breed
                                            </label>
                                            <input
                                                type="text"
                                                name="breed"
                                                value={formData.breed}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Age *
                                            </label>
                                            <input
                                                type="number"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Gender *
                                            </label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bio
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows="4"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                            placeholder="Tell us about your pet..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Update Images
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Upload up to 4 images
                                        </p>
                                    </div>

                                    {/* Update error display in the form */}
                                    {error && (
                                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-700">{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Additional Info</h2>
                    <div className="mt-6 space-y-3">
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Location</h3>
                            <p className="text-gray-800">
                                {pet?.location
                                    ? (typeof pet.location === 'object'
                                        ? `${pet.location.city || ''}, ${pet.location.state || ''}`.trim().replace(/^,|,$/g, '') || '-'
                                        : pet.location)
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Bio</h3>
                            <p className="text-gray-800">{pet?.bio || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PetDetail;