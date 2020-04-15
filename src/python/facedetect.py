import face_recognition
import os, sys

knowkn_faces = None

def compare_faces(paths):
        found = False
        for path in paths:
            print("\n\n Analyzing the path: {}".format(path))
            unkn_face = face_recognition.load_image_file(str(path))
            #try:
            unkn_face_encoding = face_recognition.face_encodings(unkn_face)
            if len(unkn_face_encoding) > 0:
                unkn_face_encoding = unkn_face_encoding[0]
            else:
                continue
            for knowkn_face in knowkn_faces:
                kn_face = face_recognition.load_image_file(str(knowkn_face))
                kn_face_encoding = face_recognition.face_encodings(kn_face)
                if len(kn_face_encoding) > 0:
                    kn_face_encoding = kn_face_encoding[0]
                else:
                    continue
                results = face_recognition.compare_faces([kn_face_encoding], unkn_face_encoding)
                if True in results:
                    found = True
                    break
                else:
                    found = False
            if found == True:
                print("Match found")
                success_finish(paths)
                break
        if found == False:
            print("Intrusion")
            unsuccess_finish(paths)

def success_finish(paths):
    print("AUTHORIZED")
    delete_paths(paths)

def unsuccess_finish(paths):
    print("INTRUSION")
    delete_paths(paths)

def delete_paths(paths):
    for path in paths:
        os.remove(path)

if __name__ == '__main__':
    faceToMatchPath = str(sys.argv[1])
    facesDir = str(sys.argv[2])
    dire = facesDir
    knowkn_faces = [dire+filepath for filepath in os.listdir(dire) if not os.path.isdir(filepath)]
    print(str(knowkn_faces))
    compare_faces([faceToMatchPath])
