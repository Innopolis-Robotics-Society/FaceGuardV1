import cv2
import os
import json
import time
import numpy as np


# ==========================
# SETTINGS
# ==========================

KNOWN_FACES_DIR = "faces"
MODEL_FILE = "face_model.yml"
LABELS_FILE = "labels.json"

RECOGNITION_THRESHOLD = 65
ACTION_COOLDOWN_SECONDS = 5


# ==========================
# ACTION ON RECOGNITION
# ==========================

def action_on_recognized(name: str):
    print(f"[ACTION] Recognized person: {name}")

    try:
        import winsound
        winsound.Beep(1000, 300)
    except Exception:
        pass

    script_dir = os.path.dirname(os.path.abspath(__file__))
    logs_dir = os.path.join(script_dir, "logs")
    log_path = os.path.join(logs_dir, "access_log.txt")

    try:
        os.makedirs(logs_dir, exist_ok=True)

        with open(log_path, "a", encoding="utf-8") as file:
            file.write(f"{time.ctime()} - recognized: {name}\n")

        print(f"[LOG] Saved to: {log_path}")

    except OSError as error:
        print(f"[WARNING] Could not save access log: {error}")
        print("[WARNING] Face recognition will continue.")


# ==========================
# FACE DETECTOR LOADING
# ==========================

def get_face_detector():
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    detector = cv2.CascadeClassifier(cascade_path)

    if detector.empty():
        raise RuntimeError("Failed to load Haar Cascade face detector.")

    return detector


# ==========================
# MODEL TRAINING
# ==========================

def train_model():
    print("[INFO] Training model...")

    face_detector = get_face_detector()

    faces = []
    labels = []
    label_map = {}
    current_label = 0

    if not os.path.exists(KNOWN_FACES_DIR):
        raise RuntimeError(f"Folder {KNOWN_FACES_DIR} was not found.")

    for person_name in os.listdir(KNOWN_FACES_DIR):
        person_dir = os.path.join(KNOWN_FACES_DIR, person_name)

        if not os.path.isdir(person_dir):
            continue

        label_map[current_label] = person_name

        for image_name in os.listdir(person_dir):
            image_path = os.path.join(person_dir, image_name)

            image = cv2.imread(image_path)

            if image is None:
                print(f"[WARNING] Failed to read file: {image_path}")
                continue

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            detected_faces = face_detector.detectMultiScale(
                gray,
                scaleFactor=1.2,
                minNeighbors=5,
                minSize=(80, 80)
            )

            if len(detected_faces) == 0:
                print(f"[WARNING] No face found in image: {image_path}")
                continue

            x, y, w, h = detected_faces[0]
            face_roi = gray[y:y + h, x:x + w]
            face_roi = cv2.resize(face_roi, (200, 200))

            faces.append(face_roi)
            labels.append(current_label)

        current_label += 1

    if len(faces) == 0:
        raise RuntimeError("No faces found for training.")

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(faces, np.array(labels))

    recognizer.save(MODEL_FILE)

    with open(LABELS_FILE, "w", encoding="utf-8") as file:
        json.dump(label_map, file, ensure_ascii=False, indent=4)

    print("[INFO] Model trained and saved.")


# ==========================
# MODEL LOADING
# ==========================

# def load_model():
#     if not os.path.exists(MODEL_FILE) or not os.path.exists(LABELS_FILE):
#         train_model()

#     recognizer = cv2.face.LBPHFaceRecognizer_create()
#     recognizer.read(MODEL_FILE)

#     with open(LABELS_FILE, "r", encoding="utf-8") as file:
#         label_map = json.load(file)

#     label_map = {int(key): value for key, value in label_map.items()}

#     return recognizer, label_map

# testing on windows
def load_model():
    if not os.path.exists(MODEL_FILE) or not os.path.exists(LABELS_FILE):
        train_model()

    if not os.path.exists(MODEL_FILE):
        raise RuntimeError("Model file was not created. Check known_faces folder.")

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_FILE)

    with open(LABELS_FILE, "r", encoding="utf-8") as file:
        label_map = json.load(file)

    label_map = {int(key): value for key, value in label_map.items()}

    return recognizer, label_map


# ==========================
# CAMERA START
# ==========================

def run_camera():
    recognizer, label_map = load_model()
    face_detector = get_face_detector()

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        raise RuntimeError("Failed to open camera.")

    last_action_time = {}

    print("[INFO] Camera started.")
    print("[INFO] Press Q to exit.")

    while True:
        ret, frame = camera.read()

        if not ret:
            print("[ERROR] Failed to read frame from camera.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        detected_faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(80, 80)
        )

        for (x, y, w, h) in detected_faces:
            face_roi = gray[y:y + h, x:x + w]
            face_roi = cv2.resize(face_roi, (200, 200))

            label, confidence = recognizer.predict(face_roi)

            if confidence < RECOGNITION_THRESHOLD:
                name = label_map.get(label, "Unknown")
                text = f"{name} ({confidence:.1f})"
                color = (0, 255, 0)

                current_time = time.time()
                previous_time = last_action_time.get(name, 0)

                if current_time - previous_time > ACTION_COOLDOWN_SECONDS:
                    action_on_recognized(name)
                    last_action_time[name] = current_time

            else:
                name = "Unknown"
                text = f"Unknown ({confidence:.1f})"
                color = (0, 0, 255)

            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

            cv2.putText(
                frame,
                text,
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                color,
                2
            )

        cv2.imshow("Face Recognition", frame)

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


# ==========================
# MAIN
# ==========================

if __name__ == "__main__":

    print(f"[DEBUG] Looking for faces in: {os.path.abspath(KNOWN_FACES_DIR)}")
    print(f"[DEBUG] Model file exists: {os.path.exists(MODEL_FILE)}")
    print(f"[DEBUG] Labels file exists: {os.path.exists(LABELS_FILE)}")
    
    run_camera()