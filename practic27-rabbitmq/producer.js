// producer.js
const express = require('express');
const amqp = require('amqplib');
const app = express();

app.use(express.json());

const QUEUE_NAME = 'task_queue';
const DLQ_NAME = 'dead_letter_queue';
const MAX_RETRIES = 3;

// Подключение к RabbitMQ
let channel;
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        
        // Объявляем Dead Letter Exchange (DLX) для сообщений, которые не смогли обработаться
        await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
        await channel.assertQueue(DLQ_NAME, { durable: true });
        await channel.bindQueue(DLQ_NAME, 'dlx_exchange', 'dead');

        // Объявляем основную очередь с привязкой к DLX
        await channel.assertQueue('task_queue', {
        durable: true,
        arguments: {
            'x-message-ttl': 60000,                 // время жизни сообщения
            'x-dead-letter-exchange': 'dlx_exchange',
            'x-dead-letter-routing-key': 'dead'
        }
        });
        console.log(`✅ RabbitMQ connected. Queue: ${QUEUE_NAME}`);
    } catch (err) {
        console.error('❌ RabbitMQ connection error:', err);
    }
}

// Эндпоинт создания задачи
app.post('/api/tasks', async (req, res) => {
    try {
        const { type, payload } = req.body;
        if (!type || !payload) {
            return res.status(400).json({ error: 'Type and payload are required' });
        }

        const task = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            payload,
            createdAt: new Date()
        };

        // Отправляем сообщение в очередь
        await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
            persistent: true // Сообщение сохранится при перезапуске RabbitMQ
        });

        res.status(201).json({ message: 'Task created', task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('🚀 Producer API running on port 3000');
    connectRabbitMQ();
});