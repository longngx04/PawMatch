import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">

          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://cdn.vectorstock.com/i/500p/71/08/organic-paw-print-leaf-logo-vector-25117108.jpg"
              alt="Pawmatch Logo"
              className="w-28 h-28 mx-auto rounded-full bg-white p-4 shadow-lg"
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl font-bold mb-4 text-gray-800">
            Pawmatch
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#87e98c] to-[#25c225] rounded-full mb-8"></div>

          {/* Subheading */}
          <p className="text-2xl text-gray-700 mb-3 font-medium">
            Connect with Pet Lovers & Find Your Perfect Match
          </p>

          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Join our community of pet enthusiasts. Swipe, match, and connect with adorable pets and their loving owners in your area.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-10 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-shadow"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-white text-[#25c225] border-2 border-[#25c225] px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-20">

            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-[#87e98c]">
              <div className="text-5xl mb-4">🐾</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Browse Pets
              </h3>
              <p className="text-gray-600">
                Discover adorable pets and their profiles. Swipe through and find your perfect companion.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-[#25c225]">
              <div className="text-5xl mb-4">💚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Match & Connect
              </h3>
              <p className="text-gray-600">
                Like what you see? Match with pet owners and start meaningful connections.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-[#0feb46]">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Chat & Meet
              </h3>
              <p className="text-gray-600">
                Message your matches and arrange meetups in your local area.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-20">
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-[#25c225] mb-2">10K+</div>
              <div className="text-gray-600 text-sm">Active Users</div>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-[#25c225] mb-2">5K+</div>
              <div className="text-gray-600 text-sm">Pets Listed</div>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-[#25c225] mb-2">2K+</div>
              <div className="text-gray-600 text-sm">Successful Matches</div>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-[#25c225] mb-2">50+</div>
              <div className="text-gray-600 text-sm">Cities</div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-gradient-to-r from-[#87e98c] to-[#25c225] p-8 rounded-lg shadow-lg max-w-2xl mb-16">
            <p className="text-white text-lg italic mb-4">
              "Pawmatch helped me find the perfect companion for my furry friend. The community is amazing and the platform is so easy to use!"
            </p>
            <p className="text-white font-semibold">- Sarah M., Pet Owner</p>
          </div>

          {/* Footer CTA */}
          <div>
            <p className="text-gray-700 text-lg mb-4 font-medium">
              Ready to find your perfect pet match?
            </p>
            <Link
              to="/signup"
              className="inline-block bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-12 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-shadow"
            >
              Join Pawmatch Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;