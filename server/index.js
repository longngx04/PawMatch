const PORT = 5000
const express = require('express');

const app = express()

app.get('/', (req, res) => {
    res.json({ message: 'Hello from PawMatch server!' });
});

app.get('/signup', (req, res) => {
    res.json({ message: 'Signup endpoint' });
});

app.get('/login', (req, res) => {
    res.json({ message: 'Login endpoint' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});