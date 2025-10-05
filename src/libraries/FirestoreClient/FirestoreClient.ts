import * as admin from "firebase-admin";

class FirestoreClient {
  private static instance: FirestoreClient;
  public readonly dataBase: admin.firestore.Firestore;

  private constructor() {
    try {
      const serviceAccount = JSON.parse(process.env.DATABASE_LOGIN as string);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.dataBase = admin.firestore();
      console.log("Connected to Firestore");
    } catch (error) {
      console.error(
        "Could not initialize Firestore. Is DATABASE_LOGIN secret set?",
        error
      );
      process.exit(1);
    }
  }

  public static getInstance(): FirestoreClient {
    if (!FirestoreClient.instance) {
      FirestoreClient.instance = new FirestoreClient();
    }
    return FirestoreClient.instance;
  }
}

export default FirestoreClient.getInstance();
