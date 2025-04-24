# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## After the project created,
1.  U should see a lot of folder and file because the react native expo created it for you
2.  Make sure to create or modify all the files added to this github to ur project.

## Download the required dataset for training model
1. https://universe.roboflow.com/search?q=food%2520dataset
2. Delete the current data.yaml file from this github repository and used the new one from this link.
3. Run this command in terminal

   # Adjust the epochs if needed, make sure it dont overlap.
   yolo task=detect mode=train model=yolov8n.pt data=data.yaml epochs=50 imgsz=640

## Create Ur Spoonacular API
1. Sign up and generate the API yourself and add it to food recognition, food search, recommendation and nutrition tracking UI.
2. https://spoonacular.com/food-api/console#Profile

## Create Ur Gemini API
1. https://aistudio.google.com/apikey
2. Create API Key from this link and add it to chatbot, recommendation UI
