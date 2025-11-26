require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/emerald';

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo connected successfully"))
    .catch((error) => console.log("Mongo connection error", error));

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
