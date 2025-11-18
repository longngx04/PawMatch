import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Login from "./pages/Login"
import Signup from "./pages/Signup.jsx"
import UserProfile from "./pages/UserProfile.jsx"
import PetProfile from "./pages/PetProfile.jsx"
import Chat from "./pages/Chat.jsx"
import Navbar from "./components/Navbar.jsx"
import Footer from "./components/Footer.jsx"
const App = () => {
  return (
    <>
    <BrowserRouter>
    <Navbar/>
    <Routes>
      <Route path = "/" element= {<Home />} />
      <Route path = "/login" element= {<Login />} />
      <Route path = "/signup" element= {<Signup />} />
      <Route path = "/user-profile" element= {<UserProfile />} />
      <Route path = "/pet-profile" element= {<PetProfile />} />
      <Route path = "/chat" element= {<Chat />} />
    </Routes>
    <Footer />
    </BrowserRouter>
    </>
  )
}

export default App