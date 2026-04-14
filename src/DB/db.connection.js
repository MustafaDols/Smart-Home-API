// database connection
import mongoose from "mongoose";

export const dbConnection = async () => {
    try {
        //30s timeout
        await mongoose.connect(process.env.DB_URL_LOCAL);
        console.log("Database connected successfully");

        // Ensure outdated unique index on (firstname, lastname) is removed if it still exists
        try {
            const collections = await mongoose.connection.db.collections();
            const usersCollection = collections.find(
                (col) => col.collectionName === "users"
            );

            if (usersCollection) {
                const indexes = await usersCollection.indexes();
                const hasOldNameIndex = indexes.some(
                    (idx) => idx.name === "idx_first_last_name_unique"
                );

                if (hasOldNameIndex) {
                    await usersCollection.dropIndex("idx_first_last_name_unique");
                    console.log("Dropped index idx_first_last_name_unique from users collection");
                }
            }
        } catch (indexError) {
            // If dropping the index fails, just log it and continue
            console.log("Failed to verify/drop old firstname+lastname index", indexError.message);
        }
    } catch (error) {
        console.log(" Database failing to connect", error);
    }
};

export default dbConnection;