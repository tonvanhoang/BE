// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/mangxahoi', { 
//     useNewUrlParser: true, 
//     useUnifiedTopology: true 
// })
// .then(() => console.log('MongoDB connected!'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Reel schema
// const reelSchema = new mongoose.Schema({
//     video: String,
//     title: String,
//     content: String,
//     dateReel: String,
//     idAccount: String
// }, { timestamps: true });

// const Reel = mongoose.model('Reel', reelSchema);

// async function importReelsFromJson() {
//     try {
//         // Read the JSON file
//         const jsonPath = path.join(__dirname, 'reel_data.json');
//         const reelData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

//         console.log(`Found ${reelData.length} reels in JSON file`);

//         for (const reel of reelData) {
//             // Check if the reel already exists in the database
//             const existingReel = await Reel.findOne({ video: reel.video });
            
//             if (existingReel) {
//                 console.log(`Reel with video ${reel.video} already exists in database`);
//                 continue;
//             }

//             // Create a new reel document
//             const newReel = new Reel({
//                 video: reel.video,
//                 title: reel.title,
//                 content: reel.content,
//                 dateReel: reel.dateReel,
//                 idAccount: reel.idAccount
//             });

//             // Save to database
//             await newReel.save();
//             console.log(`Successfully imported: ${reel.title}`);
//         }

//         console.log('Import completed successfully');
//     } catch (error) {
//         console.error('Error during import:', error);
//     } finally {
//         await mongoose.connection.close();
//         console.log('Database connection closed');
//     }
// }

// // Run the import function
// importReelsFromJson();
