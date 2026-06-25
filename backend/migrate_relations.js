import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sameer_db_user:Harisarvottama_096@krishnabodhacluster.hsdvyhy.mongodb.net/?appName=KrishnaBodhaCluster';

async function migrateData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  const collections = ['bookmarks', 'histories', 'querylogs'];

  for (const collName of collections) {
    console.log(`\nMigrating collection: ${collName}`);
    const collection = db.collection(collName);
    
    // Find all documents that still have an 'email' field
    const cursor = collection.find({ email: { $exists: true, $ne: null } });
    const docs = await cursor.toArray();
    
    console.log(`Found ${docs.length} documents with an email field in ${collName}.`);

    let migratedCount = 0;
    for (const doc of docs) {
      if (!doc.email) continue;
      
      // Look up the user by email
      const user = await User.findOne({ email: doc.email.toLowerCase() });
      
      if (user) {
        // Update the document: add userId and remove email
        await collection.updateOne(
          { _id: doc._id },
          { 
            $set: { userId: user._id },
            $unset: { email: "" } 
          }
        );
        migratedCount++;
      } else {
        console.log(`WARNING: User not found for email ${doc.email} in ${collName}. Removing orphaned document...`);
        // If the user doesn't exist, the bookmark/history is orphaned and should be removed.
        await collection.deleteOne({ _id: doc._id });
      }
    }
    console.log(`Successfully migrated ${migratedCount} documents in ${collName}.`);
  }

  console.log('\nMigration complete!');
  process.exit(0);
}

migrateData().catch(console.error);
