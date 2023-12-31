import os
import sys
import json
import glob

def get_character_info(character_dir, category):
    character_info = {}
    name_file = model_file = index_file = image_file = audio_file = None

    for file in os.listdir(character_dir):
        if file.endswith(".txt"):
            name_file = os.path.join(character_dir, file)
        elif file.endswith(".pth"):
            model_file = os.path.join(character_dir, file)
        elif file.endswith(".index"):
            index_file = os.path.join(character_dir, file)
        elif file.endswith(".jpg") or file.endswith(".png"):
            image_file = os.path.join(character_dir, file)
        elif file.endswith(".mp3"):
            audio_file = os.path.join(character_dir, file)

    if not all([name_file, model_file]):
        return None

    if not image_file:
        models_dir = os.path.abspath(os.path.join(os.getcwd(), '..', 'MODELS'))

        # Ищем изображения с нужными расширениями
        image_candidates = []
        for ext in ('*.png', '*.jpg', '*.jpeg'):
            image_candidates.extend(glob.glob(os.path.join(models_dir, ext)))

        # Если найдено хотя бы одно изображение, используем его
        if image_candidates:
            image_file = image_candidates[0]

    if not audio_file:
        audio_file = ""
    
    if not index_file:
        index_file = ""

    try:
        with open(name_file, "r", encoding="utf-8") as f:
            lines = f.readlines()[:3]
            while len(lines) < 3:
                lines.append('')
            name, description, gender = lines
            if description == '':
                description = 'some desk'
                print(f"Warning: No description found for {character_dir}. Using default.")
            if gender == '':
                gender = 'male'
                print(f"Warning: No gender found for {character_dir}. Using default.")

        character_info["name"] = name
        character_info["gender"] = gender
        character_info["model_path"] = model_file
        character_info["index_path"] = index_file
        character_info["char_photo"] = image_file
        character_info["description"] = description
        character_info["category"] = category
        character_info["audio_sample"] = audio_file

        return character_info
    except Exception as e:
        print(f"Error processing {character_dir}: {e}")
        return None


def main():
    if len(sys.argv) != 2:
        print("Использование: python process_characters.py <путь_к_папке>")
        sys.exit(1)

    models_dir = os.path.abspath(sys.argv[1])
    characters = []

    for entry in os.listdir(models_dir):
        category_dir = os.path.join(models_dir, entry)
        if os.path.isdir(category_dir):
            for character_entry in os.listdir(category_dir):
                character_dir = os.path.join(category_dir, character_entry)
                if os.path.isdir(character_dir):
                    character_info = get_character_info(character_dir, entry)
                    if character_info:
                        characters.append(character_info)
                        print(f"Processed character: {character_info['name']}")

    output_file = os.path.join(models_dir, "characters.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)

    print(f"Finished processing. {len(characters)} characters saved to {output_file}")

if __name__ == "__main__":
    main()
