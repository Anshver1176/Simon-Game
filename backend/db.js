const mongoose = require("mongoose");

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("MongoDB Connected Successfully");
        })
        .catch((error) => {
            console.log("MongoDB Connection Failed:", error.message);
        });
};

module.exports = connectDB;