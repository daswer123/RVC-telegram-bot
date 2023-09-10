import e from 'express';
import bodyParser from 'body-parser';
import { transformAudio, handleAICover, handleSeparateAudio, createVoice } from '../functions.js';
import PQueue from 'p-queue';

import db, { addOperationToDatabase, deleteOperationFromDatabase, getUserOperationsCountFromDatabase } from './db.js';
import { handleAICoverMaxQueue, separateAudioMaxQueue, transfromAudioMaxQueue } from '../variables.js';

// Настроим переменные для ограничения количества одновременных запросов
const transformAudioConcurrency = 2;
const handleAICoverConcurrency = 1;
const separateAudioConcurrency = 1;

// Создаем отдельные очереди для каждого типа операции
const transformAudioQueue = new PQueue({ concurrency: transformAudioConcurrency });
const handleAICoverQueue = new PQueue({ concurrency: handleAICoverConcurrency });
const separateAudioQueue = new PQueue({ concurrency: separateAudioConcurrency });

function getAllQueue() {
    return transformAudioQueue.size + handleAICoverQueue.size + separateAudioQueue.size
}

function checkForMax(userId, operationType, maxOperations) {
    const userOperationsCount = getUserOperationsCountFromDatabase(userId, operationType);
    if (userOperationsCount >= maxOperations) {
        // Если у пользователя уже есть 3 или больше операций transformAudio в очереди, отправить ему сообщение и прекратить выполнение функции
        console.log('User has too many transformAudio operations in queue. Please wait until your previous operations are complete.');
        return true;
    }
    return false

}
const app = e();

// Подключаем middleware для обработки JSON-данных
app.use(bodyParser.json());

app.post('/transformAudio', async (req, res) => {
    // Добавить операцию в базу данных
    const { message, session, sessionPath, audioPath, setMp3, ctxx, userId } = req.body;

    // if (checkForMax(userId, `transformAudio`, transfromAudioMaxQueue)) return
    const operationId = addOperationToDatabase(req.body.userId, 'transformAudio');

    transformAudioQueue.add(async () => {
        try {
            const ctx = {}
            console.log("hi")
            const { message, session, sessionPath, audioPath, setMp3, ctxx, userId } = req.body;
            ctx.session = session

            console.log("popa", ctx, sessionPath, audioPath, setMp3, ctxx)
            await transformAudio(ctx, sessionPath, audioPath, setMp3, ctxx);
            res.status(200).json({ message: 'Transformation completed successfully' });

            // Удалить операцию из базы данных
            deleteOperationFromDatabase(operationId);

            console.log(`Осталось запросов в трасформации ${transformAudioQueue.size}`)
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Error transforming audio', error });
            deleteOperationFromDatabase(operationId);
        }
    });

    console.log(`Был добавлен запрос в очередь для трансофрмации, всего запросов: ${transformAudioQueue.size + 1}`);
    console.log(`Всего запросов ${getAllQueue()}`)
});


app.post('/handleAICover', async (req, res) => {

    const { sessionPath, filename = "audio.wav", userId } = req.body;

    // if (checkForMax(userId, `handleAICover`, handleAICoverMaxQueue)) return
    const operationId = addOperationToDatabase(req.body.userId, 'handleAICover');

    try {
        const { sessionPath, filename = "audio.wav", userId } = req.body;
        const ctx = {
            session: req.body.session,
            reply: (msg) => console.log(msg),
            sendAudio: (audio) => console.log(`Audio sent: ${audio.source}`)
        };
        const result = await handleAICoverQueue.add(() => handleAICover(ctx, sessionPath, filename));
        console.log('AI cover processing completed successfully');
        console.log(result);
        res.status(200).json(result);

        // Удалить операцию из базы данных
        deleteOperationFromDatabase(operationId);

    } catch (error) {
        console.error(`Error during AI cover processing: ${error}`);
        res.status(500).json({ message: 'An error occurred while processing the AI cover', error: error.toString() });
        deleteOperationFromDatabase(operationId);
    } finally {
        console.log(`Осталось запросов в создании ИИ кавера ${handleAICoverQueue.size}`);
    }

    console.log(`Был добавлен запрос в очередь для AI кавера, всего запросов: ${handleAICoverQueue.size + 1}`);
    console.log(`Всего запросов ${getAllQueue()}`)
});

app.post('/separateAudio', async (req, res) => {

    const { sessionPath, filename = "audio.wav", isAudio, userId } = req.body;
    // if (checkForMax(userId, `separateAudio`, separateAudioMaxQueue)) return

    const operationId = addOperationToDatabase(req.body.userId, 'separateAudio');

    try {
        const { sessionPath, filename = "audio.wav", isAudio, userId } = req.body;
        const ctx = {
            session: req.body.session,
            reply: (msg) => console.log(msg),
            sendAudio: (audio) => console.log(`Audio sent: ${audio.source}`)
        };
        const result = await separateAudioQueue.add(() => handleSeparateAudio(ctx, sessionPath, isAudio));
        console.log('Audio separation completed successfully');
        console.log(result);
        res.status(200).json(result);
        deleteOperationFromDatabase(operationId);

    } catch (error) {
        console.error(`Error during audio separation: ${error}`);
        res.status(500).json({ message: 'An error occurred while separating the audio', error: error.toString() });
        deleteOperationFromDatabase(operationId);
    } finally {
        console.log(`Осталось запросов в разделении аудио ${separateAudioQueue.size}`);
    }

    console.log(`Был добавлен запрос в очередь для разделения аудио, всего запросов: ${separateAudioQueue.size + 1}`);
    console.log(`Всего запросов ${getAllQueue()}`)
});

const server = app.listen(8081, () => {
    console.log(`Server is running on port ${server.address().port}`);
});

// Export the database connection
export default db;