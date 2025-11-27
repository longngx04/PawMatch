import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SwipeCard from '../components/SwipeCard';

const MainPage = () => {
    const [user, setUser] = useState(null);
    const [myPets, setMyPets] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);
    const [petCards, setPetCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showMatch, setShowMatch] = useState(false);
    const [matchData, setMatchData] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef(null);
    const navigate = useNavigate();

    // Check if user is logged in
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
            fetchMyPets();
        }
    }, [navigate]);

    // Fetch user's pets
    const fetchMyPets = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/pets/user/pets', {
                withCredentials: true
            });
            setMyPets(response.data);
            if (response.data.length > 0) {
                setSelectedPet(response.data[0]);
                fetchPetsToSwipe(response.data[0]._id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching pets:', error);
            setLoading(false);
        }
    };

    // Fetch pets to swipe on
    const fetchPetsToSwipe = async (petId) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:3000/api/pets/swipe/${petId}`, {
                withCredentials: true
            });
            setPetCards(response.data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Error fetching pets to swipe:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle swipe action
    const handleSwipe = async (direction) => {
        if (currentIndex >= petCards.length || !selectedPet) return;

        const currentPet = petCards[currentIndex];

        try {
            const response = await axios.post(
                'http://localhost:3000/api/pets/swipe',
                {
                    swiperPetId: selectedPet._id,
                    swipedPetId: currentPet._id,
                    direction
                },
                { withCredentials: true }
            );

            // Check if it's a match
            if (response.data.match) {
                setMatchData(response.data.matchData);
                setShowMatch(true);
            }

            // Move to next card
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
                if (cardRef.current) {
                    cardRef.current.style.transform = '';
                }
            }, 300);
        } catch (error) {
            console.error('Error swiping:', error);
            // Move to next card even if error
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Mouse/Touch drag handlers
    const handleDragStart = (e) => {
        e.preventDefault();
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        setDragStart({ x: clientX, y: clientY });
        setIsDragging(true);
    };

    const handleDragMove = (e) => {
        if (!isDragging || !dragStart) return;

        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;

        if (cardRef.current) {
            cardRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX / 20}deg)`;
            cardRef.current.style.transition = 'none';
        }
    };

    const handleDragEnd = (e) => {
        if (!isDragging || !dragStart) return;

        const clientX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
        const deltaX = clientX - dragStart.x;

        if (Math.abs(deltaX) > 100) {
            // Swipe threshold reached
            const direction = deltaX > 0 ? 'right' : 'left';

            // Animate card exit
            if (cardRef.current) {
                cardRef.current.style.transition = 'transform 0.3s ease-out';
                cardRef.current.style.transform = `translate(${deltaX > 0 ? 1000 : -1000}px, ${deltaX * 0.5}px) rotate(${deltaX / 10}deg)`;
            }

            handleSwipe(direction);
        } else {
            // Reset card position
            if (cardRef.current) {
                cardRef.current.style.transition = 'transform 0.3s ease-out';
                cardRef.current.style.transform = '';
            }
        }

        setDragStart(null);
        setIsDragging(false);
    };

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // If user has no pets, show create pet prompt
    if (!loading && myPets.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src="https://cdn.vectorstock.com/i/500p/71/08/organic-paw-print-leaf-logo-vector-25117108.jpg"
                                    alt="Pawmatch"
                                    className="w-10 h-10 rounded-full"
                                />
                                <h1 className="text-2xl font-bold text-gray-800">Pawmatch</h1>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* No pets message */}
                <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="text-6xl mb-4">🐾</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Pawmatch!</h2>
                        <p className="text-gray-600 mb-6">
                            Create your first pet profile to start swiping and matching with other adorable pets in your area.
                        </p>
                        <button
                            onClick={() => navigate('/pet-profile')}
                            className="w-full bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                        >
                            Create Pet Profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://cdn.vectorstock.com/i/500p/71/08/organic-paw-print-leaf-logo-vector-25117108.jpg"
                                alt="Pawmatch"
                                className="w-10 h-10 rounded-full"
                            />
                            <h1 className="text-2xl font-bold text-gray-800">Pawmatch</h1>
                        </div>

                        {/* Pet selector and navigation */}
                        <div className="flex items-center gap-4">
                            {myPets.length > 0 && (
                                <select
                                    value={selectedPet?._id || ''}
                                    onChange={(e) => {
                                        const pet = myPets.find(p => p._id === e.target.value);
                                        setSelectedPet(pet);
                                        fetchPetsToSwipe(pet._id);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                                >
                                    {myPets.map((pet) => (
                                        <option key={pet._id} value={pet._id}>
                                            {pet.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <button
                                onClick={() => navigate('/matches')}
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Messages"
                            >
                                <span className="text-2xl">💬</span>
                            </button>

                            <button
                                onClick={() => navigate('/pet-profile')}
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Add Pet"
                            >
                                <span className="text-2xl">➕</span>
                            </button>

                            {selectedPet && (
                                <button
                                    onClick={() => navigate(`/pet/${selectedPet._id}`)}
                                    className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="View Pet Profile"
                                >
                                    <span className="text-2xl">👁️</span>
                                </button>
                            )}

                            <button
                                onClick={() => navigate('/profile')}
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="User Profile"
                            >
                                <span className="text-2xl">👤</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-md mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25c225]"></div>
                    </div>
                ) : petCards.length === 0 || currentIndex >= petCards.length ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="text-6xl mb-4">😊</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">No More Pets</h2>
                        <p className="text-gray-600 mb-6">
                            You've seen all available pets in your area. Check back later for new matches!
                        </p>
                        <button
                            onClick={() => fetchPetsToSwipe(selectedPet._id)}
                            className="bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Card Stack */}
                        <div className="relative h-[600px] mb-8">
                            {/* Show next card in stack (behind) */}
                            {currentIndex + 1 < petCards.length && (
                                <div className="absolute w-full h-full transform scale-95 opacity-50 pointer-events-none">
                                    <SwipeCard pet={petCards[currentIndex + 1]} />
                                </div>
                            )}

                            {/* Current card */}
                            <div
                                ref={cardRef}
                                className="absolute w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={handleDragStart}
                                onMouseMove={handleDragMove}
                                onMouseUp={handleDragEnd}
                                onMouseLeave={handleDragEnd}
                                onTouchStart={handleDragStart}
                                onTouchMove={handleDragMove}
                                onTouchEnd={handleDragEnd}
                            >
                                <SwipeCard pet={petCards[currentIndex]} />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center items-center gap-6">
                            <button
                                onClick={() => {
                                    if (cardRef.current) {
                                        cardRef.current.style.transition = 'transform 0.3s ease-out';
                                        cardRef.current.style.transform = 'translate(-1000px, 0) rotate(-30deg)';
                                    }
                                    handleSwipe('left');
                                }}
                                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                                disabled={loading || currentIndex >= petCards.length}
                            >
                                <span className="text-3xl">✖️</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (cardRef.current) {
                                        cardRef.current.style.transition = 'transform 0.3s ease-out';
                                        cardRef.current.style.transform = 'translate(1000px, 0) rotate(30deg)';
                                    }
                                    handleSwipe('right');
                                }}
                                className="w-20 h-20 bg-gradient-to-r from-[#87e98c] to-[#25c225] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                                disabled={loading || currentIndex >= petCards.length}
                            >
                                <span className="text-4xl">❤️</span>
                            </button>
                        </div>

                        {/* Card counter */}
                        <div className="text-center mt-4 text-gray-500 text-sm">
                            {currentIndex + 1} / {petCards.length}
                        </div>
                    </>
                )}
            </div>

            {/* Match Popup */}
            {showMatch && matchData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-3xl font-bold text-[#25c225] mb-4">It's a Match!</h2>

                        <div className="flex justify-center items-center gap-4 mb-6">
                            <img
                                src={matchData.pet1.images?.[0] || 'https://via.placeholder.com/100'}
                                alt={matchData.pet1.name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-[#25c225]"
                            />
                            <span className="text-3xl">💚</span>
                            <img
                                src={matchData.pet2.images?.[0] || 'https://via.placeholder.com/100'}
                                alt={matchData.pet2.name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-[#25c225]"
                            />
                        </div>

                        <p className="text-gray-600 mb-6">
                            {matchData.pet1.name} and {matchData.pet2.name} liked each other!
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowMatch(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Keep Swiping
                            </button>
                            <button
                                onClick={() => navigate('/matches')}
                                className="flex-1 bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                            >
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainPage;