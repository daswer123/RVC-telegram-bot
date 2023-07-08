# Структура папки

Вот как организована структура папки:

```
.
├── MODELS
│   ├── Category 1
│   │   ├── Char1
│   │   │   ├── *.pth
│   │   │   ├── *.index (optional)
│   │   │   ├── *.jpg or *.png (optional)
│   │   │   ├── *.txt (name, description, (male || female || child))
│   │   │   └── *.mp3 (Audio sample) (optional)
│   │   └── Char2
│   │       ├── *.pth
│   │       ├── *.index (optional)
│   │       ├── *.jpg or *.png (optional)
│   │       ├── *.txt (name, description, (male || female || child))
│   │       └── *.mp3 (Audio sample) (optional)
│   └── Category 2
│       └── Char1
│           └── ...
└── default.jpg
    └── ...
```

## Формат файла *.txt

В файле `*.txt` используйте следующий формат:

1. Имя
2. Описание
3. Пол (female, male, child)

### Пример

alica.txt:

```
Alica
Вредная лисичка
female
```
https://user-images.githubusercontent.com/22278673/252055549-713ed830-cf18-4e3f-a4bf-6812b7d3dcdd.png
