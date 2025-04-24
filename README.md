# foodrecognition_mobileapp

Steps to follow
1. Open Visual Studio Code
2. Create new terminal
3. Run the following command in terminal to create react native expo project

   # Create a project name FoodApp
   1. npx create-expo-app@latest FoodApp
   2. cd FoodApp

   # Try to run the project
   npx expo start

# Instruction
1. Create all the tsx files or modify the codes from this github respositories to ur expo project.
2. Carefully check for each folder name and file name
   
# Download the yolov5 dataset for training the model
1. https://universe.roboflow.com/suji-nanjundan-hvarn/food-taste
2. Remove the data.yaml from this github folder and Use the data.yaml from this link.
3. Run the following command in terminal

   # Make sure to check of the epoch results, dont overlapping the result
   yolo task=detect mode=train model=yolov8n.pt data=data.yaml epochs=50 imgsz=640
   
