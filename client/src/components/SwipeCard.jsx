import { useState } from 'react';

const SwipeCard = ({ pet, onSwipe, style, ...props }) => {
    const [exitX, setExitX] = useState(0);
    const [exitY, setExitY] = useState(0);

    const calculateAge = (age) => {
        if (age < 1) return `${Math.round(age * 12)} months`;
        return `${age} ${age === 1 ? 'year' : 'years'}`;
    };

    return (
        <div
            className="absolute w-full h-full"
            style={{
                ...style,
                transform: `translate(${exitX}px, ${exitY}px) rotate(${exitX / 20}deg)`,
                transition: exitX !== 0 ? 'all 0.3s ease-out' : 'none'
            }}
            {...props}
        >
            <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Pet Image */}
                <div className="relative h-[70%] bg-gray-200">
                    <img
                        src={pet.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        draggable="false"
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Swipe indicators */}
                    <div
                        className="absolute top-8 right-8 text-6xl font-bold text-red-500 opacity-0 rotate-[-30deg] pointer-events-none"
                        style={{
                            opacity: exitX < -50 ? Math.min(Math.abs(exitX) / 100, 1) : 0,
                            transform: `rotate(-30deg) scale(${1 + Math.abs(exitX) / 200})`
                        }}
                    >
                        NOPE
                    </div>

                    <div
                        className="absolute top-8 left-8 text-6xl font-bold text-green-500 opacity-0 rotate-[30deg] pointer-events-none"
                        style={{
                            opacity: exitX > 50 ? Math.min(exitX / 100, 1) : 0,
                            transform: `rotate(30deg) scale(${1 + exitX / 200})`
                        }}
                    >
                        LIKE
                    </div>

                    {/* Pet basic info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h2 className="text-3xl font-bold mb-1">{pet.name}, {calculateAge(pet.age)}</h2>
                        <p className="text-lg">{pet.breed} • {pet.species}</p>
                    </div>
                </div>

                {/* Pet Details */}
                <div className="h-[30%] p-6 overflow-y-auto">
                    {/* Location */}
                    <div className="flex items-center text-gray-600 mb-3">
                        <span className="text-lg mr-2">📍</span>
                        <span className="text-sm">{pet.location?.city}, {pet.location?.state}</span>
                    </div>

                    {/* Bio */}
                    {pet.bio && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                            {pet.bio}
                        </p>
                    )}

                    {/* Personality tags */}
                    {pet.personality && pet.personality.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {pet.personality.map((trait, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                >
                                    {trait}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Additional info */}
                    <div className="flex gap-4 text-xs text-gray-600">
                        <span>{pet.gender}</span>
                        <span>•</span>
                        <span>{pet.size}</span>
                        {pet.vaccinated && (
                            <>
                                <span>•</span>
                                <span>💉 Vaccinated</span>
                            </>
                        )}
                        {pet.neutered && (
                            <>
                                <span>•</span>
                                <span>✂️ Neutered</span>
                            </>
                        )}
                    </div>

                    {/* Looking for */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500">Looking for: </span>
                        <span className="text-sm font-medium text-gray-700">{pet.lookingFor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwipeCard;